// MTN MOMO Payment Verification Handler
// This Edge Function checks the status of a payment request and credits tokens if successful

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationRequest {
  referenceId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { referenceId }: VerificationRequest = await req.json()

    if (!referenceId) {
      return new Response(
        JSON.stringify({ error: 'Missing referenceId' }),
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

    // Initialize Supabase client with user auth
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

    // Initialize service role client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get transaction from database
    const { data: transaction, error: txError } = await supabaseClient
      .from('mtn_momo_transactions')
      .select('*')
      .eq('reference_id', referenceId)
      .eq('user_id', user.id)
      .single()

    if (txError || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If already processed, return current status
    if (transaction.status === 'successful') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'successful',
          message: 'Payment already confirmed',
          transaction: transaction,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (transaction.status === 'failed' || transaction.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          success: false,
          status: transaction.status,
          message: 'Payment was not successful',
          transaction: transaction,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get MTN MOMO API credentials
    const MTN_MOMO_SUBSCRIPTION_KEY = Deno.env.get('MTN_MOMO_SUBSCRIPTION_KEY')
    const MTN_MOMO_API_USER = Deno.env.get('MTN_MOMO_API_USER')
    const MTN_MOMO_API_KEY = Deno.env.get('MTN_MOMO_API_KEY')
    const MTN_MOMO_BASE_URL = Deno.env.get('MTN_MOMO_BASE_URL') || 'https://sandbox.momodeveloper.mtn.com'

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

    // Step 2: Check payment status
    const statusResponse = await fetch(
      `${MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'X-Target-Environment': Deno.env.get('MTN_MOMO_ENVIRONMENT') || 'sandbox',
          'Ocp-Apim-Subscription-Key': MTN_MOMO_SUBSCRIPTION_KEY,
        },
      }
    )

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      console.error('MTN MOMO status check error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to verify payment status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentStatus = await statusResponse.json()
    console.log('MTN MOMO payment status:', paymentStatus)

    // Update transaction based on status
    let newStatus = 'pending'
    let errorMessage = null

    if (paymentStatus.status === 'SUCCESSFUL') {
      newStatus = 'successful'

      // Credit TMT tokens to user wallet
      const { error: tokenError } = await supabaseAdmin
        .from('token_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'purchase',
          amount: transaction.tmt_tokens_amount,
          description: `MTN MOMO purchase - ${referenceId}`,
          metadata: {
            payment_method: 'mtn_momo',
            reference_id: referenceId,
            amount_xaf: transaction.amount,
          },
        })

      if (tokenError) {
        console.error('Failed to credit tokens:', tokenError)
        // Don't fail the verification, but log it for manual processing
      }
    } else if (paymentStatus.status === 'FAILED') {
      newStatus = 'failed'
      errorMessage = paymentStatus.reason || 'Payment failed'
    } else if (paymentStatus.status === 'PENDING') {
      newStatus = 'pending'
    }

    // Update transaction in database
    const { data: updatedTransaction, error: updateError } = await supabaseAdmin
      .from('mtn_momo_transactions')
      .update({
        status: newStatus,
        mtn_transaction_id: paymentStatus.financialTransactionId || null,
        error_message: errorMessage,
        callback_data: paymentStatus,
        completed_at: newStatus === 'successful' ? new Date().toISOString() : null,
      })
      .eq('reference_id', referenceId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: newStatus === 'successful',
        status: newStatus,
        message:
          newStatus === 'successful'
            ? 'Payment confirmed! Tokens credited to your account.'
            : newStatus === 'pending'
            ? 'Payment is still pending. Please check again in a moment.'
            : 'Payment failed. Please try again.',
        transaction: updatedTransaction,
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
