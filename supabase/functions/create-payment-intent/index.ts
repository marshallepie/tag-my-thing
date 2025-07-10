import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PaymentRequest {
  packageId: string
  currency: 'gbp' | 'xaf'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== CREATE PAYMENT INTENT START ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      throw new Error('No authorization header')
    }
    console.log('Auth header present:', authHeader.substring(0, 20) + '...')

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
      console.error('User authentication failed:', userError)
      throw new Error('Unauthorized')
    }
    console.log('User authenticated:', user.id)

    // Parse request body
    const { packageId, currency }: PaymentRequest = await req.json()
    console.log('Request data:', { packageId, currency })

    // Get token package details
    const { data: tokenPackage, error: packageError } = await supabaseClient
      .from('token_packages')
      .select('*')
      .eq('id', packageId)
      .eq('active', true)
      .single()

    if (packageError || !tokenPackage) {
      console.error('Token package error:', packageError)
      console.log('Package ID requested:', packageId)
      throw new Error('Invalid token package')
    }
    console.log('Token package found:', tokenPackage)

    // Calculate amount in smallest currency unit
    const amount = currency === 'gbp' 
      ? Math.round(tokenPackage.price_gbp * 100) // pence
      : Math.round(tokenPackage.price_xaf) // XAF doesn't use decimal places
    
    console.log('Payment amount calculated:', { 
      currency, 
      originalPrice: currency === 'gbp' ? tokenPackage.price_gbp : tokenPackage.price_xaf,
      amount 
    })

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY environment variable not set')
      throw new Error('Stripe configuration error')
    }
    console.log('Stripe key present:', stripeSecretKey.substring(0, 10) + '...')
    
    const stripe = new (await import('npm:stripe@14')).default(
      stripeSecretKey,
      {
        apiVersion: '2023-10-16',
      }
    )

    // Validate currency
    const stripeCurrency = currency === 'gbp' ? 'gbp' : 'xaf'
    console.log('Creating payment intent with:', {
      amount,
      currency: stripeCurrency,
      userId: user.id,
      packageId: tokenPackage.id
    })

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: stripeCurrency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        packageId: tokenPackage.id,
        tokenAmount: tokenPackage.token_amount.toString(),
        bonusTokens: tokenPackage.bonus_tokens.toString(),
      },
    })
    
    console.log('Payment intent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      client_secret: paymentIntent.client_secret ? 'present' : 'missing'
    })

    // Create payment record in database
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        amount: currency === 'gbp' ? tokenPackage.price_gbp : tokenPackage.price_xaf,
        currency: currency.toUpperCase(),
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        type: 'tokens',
        metadata: {
          packageId: tokenPackage.id,
          tokenAmount: tokenPackage.token_amount,
          bonusTokens: tokenPackage.bonus_tokens,
        },
      })

    if (paymentError) {
      console.error('Database payment record error:', paymentError)
      throw new Error('Failed to create payment record')
    }
    console.log('Payment record created in database')

    console.log('=== CREATE PAYMENT INTENT SUCCESS ===')
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('=== CREATE PAYMENT INTENT ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})