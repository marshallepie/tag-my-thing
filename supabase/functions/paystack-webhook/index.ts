import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

interface PaystackWebhookPayload {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paid_at: string;
    created_at: string;
    channel: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    authorization?: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
    };
    metadata?: any;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!;

    if (!paystackSecretKey) {
      console.error('Missing PAYSTACK_SECRET_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const body = await req.text();

    // Verify webhook signature
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expected signature
    const hash = createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse webhook payload
    const payload: PaystackWebhookPayload = JSON.parse(body);
    console.log('Received Paystack webhook:', payload.event);

    // Only process successful charge events
    if (payload.event !== 'charge.success') {
      console.log('Ignoring non-charge event:', payload.event);
      return new Response(
        JSON.stringify({ message: 'Event ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data } = payload;

    // Only process successful transactions
    if (data.status !== 'success') {
      console.log('Transaction not successful:', data.status);
      return new Response(
        JSON.stringify({ message: 'Transaction not successful' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the payment transaction by reference
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('paystack_reference', data.reference)
      .single();

    if (fetchError || !transaction) {
      console.error('Payment transaction not found:', data.reference);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if transaction already processed (idempotency)
    if (transaction.status === 'successful') {
      console.log('Transaction already processed:', data.reference);
      return new Response(
        JSON.stringify({ message: 'Transaction already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert amount from kobo to currency
    const amountInCurrency = data.amount / 100;

    // Update payment transaction to successful
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'successful',
        completed_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          paystack_id: data.id,
          channel: data.channel,
          paid_at: data.paid_at,
          customer: data.customer,
          authorization: data.authorization,
        },
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating payment transaction:', updateError);
      throw updateError;
    }

    // Credit tokens to user wallet
    const tokensToCredit = transaction.tokens_purchased;

    // Create token transaction record
    const { error: tokenTxError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: transaction.user_id,
        amount: tokensToCredit,
        type: 'earned',
        source: 'purchase',
        description: `Token purchase via Paystack - ${tokensToCredit} TMT`,
      });

    if (tokenTxError) {
      console.error('Error creating token transaction:', tokenTxError);
      throw tokenTxError;
    }

    // Update user wallet balance
    const { data: wallet, error: walletFetchError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', transaction.user_id)
      .single();

    if (walletFetchError) {
      console.error('Error fetching wallet:', walletFetchError);
      throw walletFetchError;
    }

    const newBalance = (wallet?.balance || 0) + tokensToCredit;

    const { error: walletUpdateError } = await supabase
      .from('user_wallets')
      .update({ balance: newBalance })
      .eq('user_id', transaction.user_id);

    if (walletUpdateError) {
      console.error('Error updating wallet balance:', walletUpdateError);
      throw walletUpdateError;
    }

    console.log(
      `Successfully credited ${tokensToCredit} tokens to user ${transaction.user_id}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment processed successfully',
        tokens_credited: tokensToCredit,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
