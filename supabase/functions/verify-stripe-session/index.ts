import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@12.18.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: 'Stripe secret key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the session belongs to the current user
    if (session.client_reference_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Session does not belong to user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ 
        error: 'Payment not completed',
        payment_status: session.payment_status 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if this session has already been processed
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (existingPayment) {
      return new Response(JSON.stringify({
        error: 'Session already processed',
        already_processed: true
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine token amount based on payment amount
    const amountInPounds = session.amount_total ? session.amount_total / 100 : 0; // Convert from pence to pounds
    let tokenAmount = 0;

    // Attempt to get token amount from session metadata first
    const tokenAmountFromMetadata = session.metadata?.token_amount;

    if (tokenAmountFromMetadata) {
      tokenAmount = parseInt(tokenAmountFromMetadata);
      if (isNaN(tokenAmount)) {
        return new Response(JSON.stringify({
          error: 'Invalid token_amount in metadata',
          metadata: session.metadata
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Fallback to amount mapping if metadata is missing or invalid
      if (amountInPounds === 1.00) {
        tokenAmount = 100;
      } else if (amountInPounds === 4.50) {
        tokenAmount = 500;
      } else if (amountInPounds === 39.99) { // Mega package
        tokenAmount = 5000;
      } else if (amountInPounds === 8.00) { // Pro Business Subscription
        tokenAmount = 1000;
      } else if (amountInPounds === 40.00) { // Enterprise Subscription
        tokenAmount = 10000;
      } else {
        return new Response(JSON.stringify({
          error: 'Invalid payment amount or missing metadata',
          amount: amountInPounds
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Record the payment in the database
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        stripe_payment_intent_id: sessionId,
        status: 'completed',
        amount: amountInPounds,
        currency: session.currency || 'gbp',
        payment_method: 'stripe',
        type: 'tokens',
        metadata: {
          tokenAmount,
          sessionId,
          stripeCustomerId: session.customer
        }
      });

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to record payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get current wallet balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: 'User wallet not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update wallet balance
    const { error: updateWalletError } = await supabaseClient
      .from('user_wallets')
      .update({ balance: wallet.balance + tokenAmount })
      .eq('user_id', user.id);

    if (updateWalletError) {
      return new Response(JSON.stringify({ error: 'Failed to update wallet balance' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from('token_transactions')
      .insert({
        user_id: user.id,
        amount: tokenAmount,
        type: 'earned',
        source: 'purchase',
        description: `Purchased ${tokenAmount} TMT tokens via Stripe Payment Link`
      });

    if (transactionError) {
      return new Response(JSON.stringify({ error: 'Failed to create transaction record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      tokensAdded: tokenAmount,
      newBalance: wallet.balance + tokenAmount,
      amountPaid: amountInPounds,
      currency: session.currency
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error verifying Stripe session:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});