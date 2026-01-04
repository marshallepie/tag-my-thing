import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@12.18.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    const { sessionId, paymentIntentId } = await req.json();

    if (!sessionId && !paymentIntentId) {
      return new Response(JSON.stringify({ error: 'Missing sessionId or paymentIntentId' }), {
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

    let tokenAmount = 0;
    let amountInPounds = 0;
    let currency = 'gbp';
    let paymentReference = '';

    // Handle Payment Intent (new flow)
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent) {
        return new Response(JSON.stringify({ error: 'Payment Intent not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify payment succeeded
      if (paymentIntent.status !== 'succeeded') {
        return new Response(JSON.stringify({
          error: 'Payment not completed',
          status: paymentIntent.status
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify user_id matches (from metadata)
      if (paymentIntent.metadata.user_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Payment Intent does not belong to user' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if already processed (idempotency)
      const { data: existingTransaction } = await supabaseClient
        .from('payment_transactions')
        .select('status, tokens_purchased')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (existingTransaction?.status === 'successful') {
        return new Response(JSON.stringify({
          success: true,
          already_processed: true,
          tokens_credited: existingTransaction.tokens_purchased
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Extract data from Payment Intent
      tokenAmount = parseInt(paymentIntent.metadata.token_amount || '0');
      amountInPounds = paymentIntent.amount / 100; // Convert pence to pounds
      currency = paymentIntent.currency;
      paymentReference = paymentIntentId;

      if (!tokenAmount || tokenAmount <= 0) {
        return new Response(JSON.stringify({
          error: 'Invalid token amount in Payment Intent metadata',
          metadata: paymentIntent.metadata
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    // Handle Checkout Session (legacy Payment Links flow)
    else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify session belongs to user
      if (session.client_reference_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Session does not belong to user' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check payment status
      if (session.payment_status !== 'paid') {
        return new Response(JSON.stringify({
          error: 'Payment not completed',
          payment_status: session.payment_status
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check if already processed
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

      // Extract data from session
      amountInPounds = session.amount_total ? session.amount_total / 100 : 0;
      currency = session.currency || 'gbp';
      paymentReference = sessionId;

      // Get token amount from metadata or fallback to amount mapping
      const tokenAmountFromMetadata = session.metadata?.token_amount;

      if (tokenAmountFromMetadata) {
        tokenAmount = parseInt(tokenAmountFromMetadata);
      } else {
        // Fallback mapping
        if (amountInPounds === 1.00) tokenAmount = 100;
        else if (amountInPounds === 4.50) tokenAmount = 500;
        else if (amountInPounds === 39.99) tokenAmount = 5000;
        else if (amountInPounds === 8.00) tokenAmount = 1000;
        else if (amountInPounds === 40.00) tokenAmount = 10000;
        else {
          return new Response(JSON.stringify({
            error: 'Invalid payment amount or missing metadata',
            amount: amountInPounds
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Credit tokens to wallet (atomic operation)
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

    // Update payment_transactions status (if Payment Intent flow)
    if (paymentIntentId) {
      const { error: updateTxError } = await supabaseClient
        .from('payment_transactions')
        .update({
          status: 'successful',
          completed_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateTxError) {
        console.error('Error updating payment transaction:', updateTxError);
      }
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

    // Create token transaction record
    const { error: tokenTxError } = await supabaseClient
      .from('token_transactions')
      .insert({
        user_id: user.id,
        amount: tokenAmount,
        type: 'earned',
        source: 'purchase',
        description: `Purchased ${tokenAmount} TMT tokens via Stripe - ${paymentIntentId ? 'Payment Intent' : 'Payment Link'}`
      });

    if (tokenTxError) {
      console.error('Error creating token transaction:', tokenTxError);
    }

    // Record payment (if Checkout Session flow)
    if (sessionId) {
      await supabaseClient
        .from('payments')
        .insert({
          user_id: user.id,
          stripe_payment_intent_id: sessionId,
          status: 'completed',
          amount: amountInPounds,
          currency,
          payment_method: 'stripe',
          type: 'tokens',
          metadata: {
            tokenAmount,
            sessionId,
          }
        });
    }

    console.log(`Successfully credited ${tokenAmount} tokens to user ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      tokens_credited: tokenAmount,
      new_balance: wallet.balance + tokenAmount,
      amount_paid: amountInPounds,
      currency
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error verifying Stripe payment:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
