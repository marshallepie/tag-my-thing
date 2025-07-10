import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
serve(async (req)=>{
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'No authorization header'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Initialize Supabase client
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Parse request body
    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) {
      return new Response(JSON.stringify({
        error: 'Missing paymentIntentId'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Initialize Stripe
    const stripe = new (await import('npm:stripe@14')).default(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16'
    });
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return new Response(JSON.stringify({
        error: 'Payment not completed'
      }), {
        status: 409,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get payment record from database
    const { data: payment, error: paymentError } = await supabaseClient.from('payments').select('*').eq('stripe_payment_intent_id', paymentIntentId).eq('user_id', user.id).single();
    if (paymentError || !payment) {
      return new Response(JSON.stringify({
        error: 'Payment record not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (payment.status === 'completed') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Payment already processed'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Calculate total tokens safely
    const tokenAmount = Number(payment.metadata?.tokenAmount || 0);
    const bonusTokens = Number(payment.metadata?.bonusTokens || 0);
    const totalTokens = tokenAmount + bonusTokens;
    // Update payment status
    const { error: updatePaymentError } = await supabaseClient.from('payments').update({
      status: 'completed'
    }).eq('id', payment.id);
    if (updatePaymentError) {
      return new Response(JSON.stringify({
        error: 'Failed to update payment status'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get wallet
    const { data: wallet, error: walletError } = await supabaseClient.from('user_wallets').select('balance').eq('user_id', user.id).single();
    if (walletError || !wallet) {
      return new Response(JSON.stringify({
        error: 'User wallet not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Update wallet balance
    const { error: updateWalletError } = await supabaseClient.from('user_wallets').update({
      balance: wallet.balance + totalTokens
    }).eq('user_id', user.id);
    if (updateWalletError) {
      return new Response(JSON.stringify({
        error: 'Failed to update wallet balance'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create transaction record
    const { error: transactionError } = await supabaseClient.from('token_transactions').insert({
      user_id: user.id,
      amount: totalTokens,
      type: 'earned',
      source: 'purchase',
      description: `Purchased ${tokenAmount} TMT tokens${bonusTokens > 0 ? ` + ${bonusTokens} bonus` : ''}`
    });
    if (transactionError) {
      return new Response(JSON.stringify({
        error: 'Failed to create transaction record'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      tokensAdded: totalTokens,
      newBalance: wallet.balance + totalTokens
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
