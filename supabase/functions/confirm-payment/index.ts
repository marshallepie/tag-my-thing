import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ConfirmPaymentRequest {
  paymentIntentId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { paymentIntentId }: ConfirmPaymentRequest = await req.json()

    // Initialize Stripe
    const stripe = new (await import('npm:stripe@14')).default(
      Deno.env.get('STRIPE_SECRET_KEY') ?? '',
      {
        apiVersion: '2023-10-16',
      }
    )

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed')
    }

    // Get payment record from database
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('user_id', user.id)
      .single()

    if (paymentError || !payment) {
      throw new Error('Payment record not found')
    }

    if (payment.status === 'completed') {
      // Payment already processed
      return new Response(
        JSON.stringify({ success: true, message: 'Payment already processed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Calculate total tokens
    const tokenAmount = payment.metadata.tokenAmount || 0
    const bonusTokens = payment.metadata.bonusTokens || 0
    const totalTokens = tokenAmount + bonusTokens

    // Update payment status
    const { error: updatePaymentError } = await supabaseClient
      .from('payments')
      .update({ status: 'completed' })
      .eq('id', payment.id)

    if (updatePaymentError) {
      throw new Error('Failed to update payment status')
    }

    // Add tokens to user wallet
    const { data: wallet, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      throw new Error('User wallet not found')
    }

    const { error: updateWalletError } = await supabaseClient
      .from('user_wallets')
      .update({ balance: wallet.balance + totalTokens })
      .eq('user_id', user.id)

    if (updateWalletError) {
      throw new Error('Failed to update wallet balance')
    }

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from('token_transactions')
      .insert({
        user_id: user.id,
        amount: totalTokens,
        type: 'earned',
        source: 'purchase',
        description: `Purchased ${tokenAmount} TMT tokens${bonusTokens > 0 ? ` + ${bonusTokens} bonus` : ''}`,
      })

    if (transactionError) {
      throw new Error('Failed to create transaction record')
    }

    return new Response(
      JSON.stringify({
        success: true,
        tokensAdded: totalTokens,
        newBalance: wallet.balance + totalTokens,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error confirming payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})