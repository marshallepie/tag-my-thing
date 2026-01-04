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

      // Check transaction status - webhook handles token crediting
      const { data: existingTransaction } = await supabaseClient
        .from('payment_transactions')
        .select('status, tokens_purchased, created_at')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (!existingTransaction) {
        return new Response(JSON.stringify({
          error: 'Payment transaction not found',
          message: 'Transaction record not found. Please contact support.'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (existingTransaction.status === 'successful') {
        // Tokens already credited by webhook
        return new Response(JSON.stringify({
          success: true,
          tokens_credited: existingTransaction.tokens_purchased,
          message: 'Payment processed successfully'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (existingTransaction.status === 'pending') {
        // Webhook hasn't processed yet
        // FALLBACK: Always credit tokens directly since webhooks aren't configured yet
        console.log(`Payment Intent ${paymentIntentId} is pending, using fallback crediting`);

        try {
          const tokenAmount = existingTransaction.tokens_purchased || 0;

          if (!tokenAmount || tokenAmount <= 0) {
            throw new Error('Invalid token amount in transaction');
          }

          // Update transaction status to successful (with pending check to prevent double-processing)
          const { error: updateError } = await supabaseClient
            .from('payment_transactions')
            .update({
              status: 'successful',
              completed_at: new Date().toISOString()
            })
            .eq('stripe_payment_intent_id', paymentIntentId)
            .eq('status', 'pending'); // Only update if still pending

          if (updateError) {
            console.error('Error updating transaction status:', updateError);
            throw updateError;
          }

          // Get current wallet balance
          const { data: wallet, error: walletFetchError } = await supabaseClient
            .from('user_wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

          if (walletFetchError || !wallet) {
            console.error('Error fetching wallet:', walletFetchError);
            throw new Error('User wallet not found');
          }

          // Update wallet balance
          const { error: walletUpdateError } = await supabaseClient
            .from('user_wallets')
            .update({ balance: wallet.balance + tokenAmount })
            .eq('user_id', user.id);

          if (walletUpdateError) {
            console.error('Error updating wallet:', walletUpdateError);
            throw walletUpdateError;
          }

          // Log token transaction
          const { error: txLogError } = await supabaseClient
            .from('token_transactions')
            .insert({
              user_id: user.id,
              amount: tokenAmount,
              type: 'earned',
              source: 'purchase',
              description: `Purchased ${tokenAmount} TMT tokens via Stripe (fallback crediting)`
            });

          if (txLogError) {
            console.error('Error logging transaction:', txLogError);
            // Don't fail here, tokens are already credited
          }

          console.log(`Successfully credited ${tokenAmount} tokens via fallback`);

          return new Response(JSON.stringify({
            success: true,
            tokens_credited: tokenAmount,
            message: 'Payment processed successfully'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (fallbackError) {
          console.error('Fallback crediting failed:', fallbackError);
          return new Response(JSON.stringify({
            error: 'Failed to credit tokens',
            message: fallbackError.message || 'Internal error during token crediting'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        // Failed or other status
        return new Response(JSON.stringify({
          error: 'Payment processing failed',
          status: existingTransaction.status
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

    // NOTE: This code path should not be reached for new Payment Intent flow
    // Payment Intent flow returns early above (line 121-150)
    // Checkout Session (Payment Links) should also be handled by webhooks
    return new Response(JSON.stringify({
      error: 'Invalid request - this endpoint only checks payment status',
      message: 'Token crediting is handled automatically by webhooks'
    }), {
      status: 400,
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
