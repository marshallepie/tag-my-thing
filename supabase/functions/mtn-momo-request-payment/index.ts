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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique reference ID
    const referenceId = `TMT-${Date.now()}-${user.id.substring(0, 8)}`

    // Get MTN MOMO API credentials from environment
    const MTN_MOMO_SUBSCRIPTION_KEY = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY')
    const MTN_MOMO_API_USER = Deno.env.get('MTN_MOMO_API_USER')
    const MTN_MOMO_API_KEY = Deno.env.get('MTN_MOMO_API_KEY')
    const MTN_MOMO_BASE_URL = Deno.env.get('MTN_MOMO_BASE_URL') || 'https://sandbox.momodeveloper.mtn.com'
    const MTN_MOMO_CALLBACK_URL = Deno.env.get('MTN_MOMO_CALLBACK_URL')

    if (!MTN_MOMO_SUBSCRIPTION_KEY || !MTN_MOMO_API_USER || !MTN_MOMO_API_KEY) {
      console.error('Missing MTN MOMO credentials')
      return new Response(
        JSON.stringify({ error: 'Payment gateway configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      console.error('MTN MOMO token error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with payment gateway' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { access_token } = await tokenResponse.json()

    // Step 2: Request payment (requestToPay)
    const paymentPayload = {
      amount: amount.toString(),
      currency: 'XAF',
      externalId: referenceId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber,
      },
      payerMessage: `Purchase ${tmtTokensAmount} TMT tokens`,
      payeeNote: `TagMyThing token purchase - ${referenceId}`,
    }

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
          ...(MTN_MOMO_CALLBACK_URL && { 'X-Callback-Url': MTN_MOMO_CALLBACK_URL }),
        },
        body: JSON.stringify(paymentPayload),
      }
    )

    // MTN MOMO returns 202 Accepted for successful payment requests
    if (paymentResponse.status !== 202) {
      const errorText = await paymentResponse.text()
      console.error('MTN MOMO payment request error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to initiate payment request' }),
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
        currency: 'XAF',
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
