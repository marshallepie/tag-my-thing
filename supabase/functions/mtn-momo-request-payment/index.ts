// MTN MOMO Payment Request Handler for Cameroon
// This Edge Function initiates a payment request via MTN Mobile Money Collection API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  amount: number // Amount in XAF (Central African Franc)
  phoneNumber: string // MTN MOMO phone number (237XXXXXXXXX format)
  tmtTokensAmount: number // Number of TMT tokens to credit
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { amount, phoneNumber, tmtTokensAmount }: PaymentRequest = await req.json()

    // Validate input
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!phoneNumber || !/^237\d{9}$/.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number. Must be in format 237XXXXXXXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tmtTokensAmount || tmtTokensAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid token amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract user from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      console.error('User authentication failed:', {
        hasUser: !!user,
        error: userError?.message || 'Unknown error',
        authHeaderPresent: !!authHeader,
      })
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: userError?.message || 'Invalid or expired session'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated successfully:', { userId: user.id })

    // Generate unique reference ID (must be a valid UUID for MTN MOMO)
    const referenceId = crypto.randomUUID()

    // Get MTN MOMO API credentials from environment
    const MTN_MOMO_SUBSCRIPTION_KEY = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY')
    const MTN_MOMO_API_USER = Deno.env.get('MTN_MOMO_API_USER')
    const MTN_MOMO_API_KEY = Deno.env.get('MTN_MOMO_API_KEY')
    const MTN_MOMO_BASE_URL = Deno.env.get('MTN_MOMO_BASE_URL') || 'https://sandbox.momodeveloper.mtn.com'
    const MTN_MOMO_CALLBACK_URL = Deno.env.get('MTN_MOMO_CALLBACK_URL')

    if (!MTN_MOMO_SUBSCRIPTION_KEY || !MTN_MOMO_API_USER || !MTN_MOMO_API_KEY) {
      console.error('Missing MTN MOMO credentials:', {
        hasSubscriptionKey: !!MTN_MOMO_SUBSCRIPTION_KEY,
        hasApiUser: !!MTN_MOMO_API_USER,
        hasApiKey: !!MTN_MOMO_API_KEY,
      })
      return new Response(
        JSON.stringify({ error: 'Payment gateway configuration error - missing credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('MTN MOMO Request:', {
      baseUrl: MTN_MOMO_BASE_URL,
      environment: Deno.env.get('MTN_MOMO_ENVIRONMENT'),
      hasCallbackUrl: !!MTN_MOMO_CALLBACK_URL,
    })

    // Step 1: Get OAuth access token
    const tokenResponse = await fetch(`${MTN_MOMO_BASE_URL}/collection/token/`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': MTN_MOMO_SUBSCRIPTION_KEY,
        'Authorization': `Basic ${btoa(`${MTN_MOMO_API_USER}:${MTN_MOMO_API_KEY}`)}`,
      },
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('MTN MOMO token error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        url: `${MTN_MOMO_BASE_URL}/collection/token/`,
      })
      return new Response(
        JSON.stringify({
          error: 'Failed to authenticate with payment gateway',
          details: `Status ${tokenResponse.status}: ${tokenResponse.statusText}`,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { access_token } = await tokenResponse.json()

    // Step 2: Request payment (requestToPay)
    // Note: Sandbox only supports EUR, production supports XAF for Cameroon
    const environment = Deno.env.get('MTN_MOMO_ENVIRONMENT') || 'sandbox'
    const currency = environment === 'sandbox' ? 'EUR' : 'XAF'

    const paymentPayload = {
      amount: amount.toString(),
      currency: currency,
      externalId: referenceId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber,
      },
      payerMessage: `Purchase ${tmtTokensAmount} TMT tokens`,
      payeeNote: `TagMyThing token purchase - ${referenceId}`,
    }

    console.log('Sending payment request to MTN MOMO:', {
      payload: paymentPayload,
      phoneNumber: phoneNumber,
      amount: amount,
      referenceId: referenceId,
    })

    const paymentBody = JSON.stringify(paymentPayload)
    const paymentResponse = await fetch(
      `${MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': Deno.env.get('MTN_MOMO_ENVIRONMENT') || 'sandbox',
          'Ocp-Apim-Subscription-Key': MTN_MOMO_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
          'Content-Length': paymentBody.length.toString(),
          ...(MTN_MOMO_CALLBACK_URL && { 'X-Callback-Url': MTN_MOMO_CALLBACK_URL }),
        },
        body: paymentBody,
      }
    )

    // MTN MOMO returns 202 Accepted for successful payment requests
    if (paymentResponse.status !== 202) {
      const errorText = await paymentResponse.text()
      console.error('MTN MOMO payment request error:', {
        status: paymentResponse.status,
        statusText: paymentResponse.statusText,
        errorBody: errorText,
        url: `${MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`,
        referenceId: referenceId,
        environment: Deno.env.get('MTN_MOMO_ENVIRONMENT'),
      })
      return new Response(
        JSON.stringify({
          error: 'Failed to initiate payment request',
          details: `HTTP ${paymentResponse.status}: ${paymentResponse.statusText}`,
          mtnError: errorText || 'No error details provided',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Store transaction in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiration

    const { data: transaction, error: dbError } = await supabaseClient
      .from('mtn_momo_transactions')
      .insert({
        user_id: user.id,
        reference_id: referenceId,
        phone_number: phoneNumber,
        amount: amount,
        currency: currency,
        tmt_tokens_amount: tmtTokensAmount,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        referenceId: referenceId,
        transaction: transaction,
        message: 'Payment request sent. Please check your phone to approve the transaction.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
