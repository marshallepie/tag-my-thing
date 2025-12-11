import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  reference: string;
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    fees: number;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
    };
    authorization: {
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
      reusable: boolean;
      signature: string;
    };
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

    // Parse request body
    const { reference }: VerifyPaymentRequest = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: reference' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment with Paystack API
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!verifyResponse.ok) {
      console.error('Paystack API error:', verifyResponse.status);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment verification failed with Paystack',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verifyData: PaystackVerifyResponse = await verifyResponse.json();

    console.log('Paystack verification response:', verifyData);

    // Check if payment was successful
    if (
      !verifyData.status ||
      verifyData.data.status !== 'success' ||
      verifyData.data.reference !== reference
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment verification failed',
          data: verifyData,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the payment transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    if (fetchError || !transaction) {
      console.error('Payment transaction not found:', reference);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if transaction already processed (idempotency)
    if (transaction.status === 'successful') {
      console.log('Transaction already processed:', reference);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transaction already processed',
          tokens_credited: transaction.tokens_purchased,
          already_processed: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert amount from kobo to currency
    const amountInCurrency = verifyData.data.amount / 100;

    // Verify amounts match (allow small difference for currency conversion)
    if (Math.abs(transaction.amount - amountInCurrency) > 1) {
      console.error('Amount mismatch:', {
        expected: transaction.amount,
        received: amountInCurrency,
      });
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment amount mismatch',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment transaction to successful
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'successful',
        completed_at: new Date().toISOString(),
        paystack_authorization_code: verifyData.data.authorization?.authorization_code || null,
        metadata: {
          ...transaction.metadata,
          paystack_id: verifyData.data.id,
          channel: verifyData.data.channel,
          paid_at: verifyData.data.paid_at,
          customer: verifyData.data.customer,
          authorization: verifyData.data.authorization,
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
        message: 'Payment verified and tokens credited',
        tokens_credited: tokensToCredit,
        transaction_id: verifyData.data.id,
        reference: verifyData.data.reference,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
