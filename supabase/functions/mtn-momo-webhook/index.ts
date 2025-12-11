// MTN MOMO Webhook Handler
// This Edge Function receives payment notifications from MTN MOMO API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse webhook payload
    const webhookData = await req.json()
    console.log('MTN MOMO webhook received:', JSON.stringify(webhookData, null, 2))

    // Extract reference ID from webhook
    // MTN MOMO sends the X-Reference-Id that was used when creating the payment request
    const referenceId = webhookData.externalId || webhookData.referenceId

    if (!referenceId) {
      console.error('No reference ID in webhook payload')
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find transaction in database
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('mtn_momo_transactions')
      .select('*')
      .eq('reference_id', referenceId)
      .single()

    if (txError || !transaction) {
      console.error('Transaction not found for reference:', referenceId)
      // Return 200 to acknowledge receipt, but log the error
      return new Response(
        JSON.stringify({ message: 'Transaction not found', referenceId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If already processed, return success
    if (transaction.status === 'successful') {
      console.log('Transaction already processed:', referenceId)
      return new Response(
        JSON.stringify({ message: 'Already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine transaction status from webhook
    let newStatus = 'pending'
    let errorMessage = null

    if (webhookData.status === 'SUCCESSFUL' || webhookData.status === 'successful') {
      newStatus = 'successful'

      // Credit TMT tokens to user wallet
      const { error: tokenError } = await supabaseAdmin
        .from('token_transactions')
        .insert({
          user_id: transaction.user_id,
          transaction_type: 'purchase',
          amount: transaction.tmt_tokens_amount,
          description: `MTN MOMO purchase - ${referenceId}`,
          metadata: {
            payment_method: 'mtn_momo',
            reference_id: referenceId,
            amount_xaf: transaction.amount,
            webhook_received_at: new Date().toISOString(),
          },
        })

      if (tokenError) {
        console.error('Failed to credit tokens:', tokenError)
        // Log error but don't fail webhook processing
        // This allows manual intervention if needed
        errorMessage = 'Token credit failed - requires manual processing'
      } else {
        console.log(`Successfully credited ${transaction.tmt_tokens_amount} TMT tokens to user ${transaction.user_id}`)
      }
    } else if (webhookData.status === 'FAILED' || webhookData.status === 'failed') {
      newStatus = 'failed'
      errorMessage = webhookData.reason || 'Payment failed'
    } else if (webhookData.status === 'PENDING' || webhookData.status === 'pending') {
      newStatus = 'pending'
    }

    // Update transaction status in database
    const { error: updateError } = await supabaseAdmin
      .from('mtn_momo_transactions')
      .update({
        status: newStatus,
        mtn_transaction_id: webhookData.financialTransactionId || webhookData.transactionId || null,
        error_message: errorMessage,
        callback_data: webhookData,
        completed_at: newStatus === 'successful' ? new Date().toISOString() : null,
      })
      .eq('reference_id', referenceId)

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Database update failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Transaction ${referenceId} updated to status: ${newStatus}`)

    // Return success response to MTN MOMO
    return new Response(
      JSON.stringify({ message: 'Webhook processed successfully', referenceId, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Return 200 to prevent MTN MOMO from retrying
    // Log the error for manual investigation
    return new Response(
      JSON.stringify({ error: 'Internal error', message: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
