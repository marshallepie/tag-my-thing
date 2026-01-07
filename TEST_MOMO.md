Testing MTN MOMO in Sandbox Mode

  1. Verify Sandbox Configuration

  Check that your Supabase secrets are set to sandbox mode:

  # Verify current secrets
  supabase secrets list

  # Should show:
  # MTN_MOMO_ENVIRONMENT=sandbox
  # MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com

  2. Use Test Phone Numbers

  MTN MOMO sandbox provides specific test numbers for different scenarios:

  ✅ 237671234567 → Successful payment
  ⏳ 237671234568 → Pending/timeout scenario
  ❌ 237671234569 → Failed payment

  3. Test Payment Flow (Frontend)

  1. Start your dev server: npm run dev
  2. Navigate to token purchase page
  3. Select any token package (100, 500, 1000, 2500, or 5000 TMT)
  4. Choose "MTN Mobile Money" payment method
  5. Enter test phone number: 237671234567
  6. Click confirm
  7. Watch the payment flow:
    - Payment request sent
    - Polling starts (every 3 seconds)
    - Transaction automatically succeeds in sandbox
    - Tokens credited to your wallet

  4. Test Payment Flow (API/CLI)

  Test the edge functions directly:

  # Get your user JWT token first
  # (Login to your app and grab it from browser DevTools → Application → Local Storage)

  # Test 1: Request Payment
  curl -X POST https://your-project.supabase.co/functions/v1/mtn-momo-request-payment \
    -H "Authorization: Bearer YOUR_USER_JWT" \
    -H "Content-Type: application/json" \
    -d '{
      "amount": 1000,
      "phoneNumber": "237671234567",
      "tmtTokensAmount": 100
    }'

  # Response will include referenceId

  # Test 2: Verify Payment (use referenceId from above)
  curl -X POST https://your-project.supabase.co/functions/v1/mtn-momo-verify-payment \
    -H "Authorization: Bearer YOUR_USER_JWT" \
    -H "Content-Type: application/json" \
    -d '{
      "referenceId": "TMT-1702398000000-12345678"
    }'

  5. Test All Scenarios

  Create a test checklist:

  - ✅ Successful payment (237671234567)
    - Tokens credited correctly
    - Transaction status: successful
    - Wallet balance updated
  - ⏳ Timeout/pending (237671234568)
    - Payment stays pending
    - Frontend handles gracefully
    - User can retry
  - ❌ Failed payment (237671234569)
    - Transaction status: failed
    - No tokens credited
    - Error message shown
    - User can retry with different number
  - 🔒 Edge cases:
    - Invalid phone format (should reject)
    - Non-Cameroon number (should reject)
    - Negative amounts (should reject)
    - Zero tokens (should reject)

  6. Monitor Database Transactions

  Query sandbox transactions:

  -- View all test transactions
  SELECT
    reference_id,
    phone_number,
    amount,
    tmt_tokens_amount,
    status,
    created_at,
    completed_at
  FROM mtn_momo_transactions
  WHERE created_at > NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC;

  7. Check Edge Function Logs

  Monitor in Supabase Dashboard:
  1. Go to Edge Functions section
  2. Select each function (request-payment, verify-payment, webhook)
  3. View Logs tab for errors or issues

  8. Test Error Handling

  # Invalid phone number
  curl -X POST .../mtn-momo-request-payment \
    -H "Authorization: Bearer YOUR_JWT" \
    -d '{"amount": 1000, "phoneNumber": "invalid", "tmtTokensAmount": 100}'
  # Should return 400 error

  # Missing authentication
  curl -X POST .../mtn-momo-request-payment \
    -d '{"amount": 1000, "phoneNumber": "237671234567", "tmtTokensAmount": 100}'
  # Should return 401 error

  ---
  When You're Ready for Production

  Follow the checklist in MTN_MOMO_INTEGRATION.md (lines 498-511):

  1. Get production credentials:
    - Contact: businesssupport@mtn.com (MTN Cameroon)
    - Complete KYC & business verification
    - Subscribe to Collection API (production environment)
  2. Update Supabase secrets:
  supabase secrets set MTN_MOMO_ENVIRONMENT=production
  supabase secrets set MTN_MOMO_BASE_URL=https://momodeveloper.mtn.com
  supabase secrets set MTN_MOMO_SUBSCRIPTION_KEY=<prod_key>
  supabase secrets set MTN_MOMO_API_USER=<prod_user>
  supabase secrets set MTN_MOMO_API_KEY=<prod_key>

  3. Test with real Cameroon MTN numbers before launching to all users

  ---
  The sandbox environment closely mimics production behavior, so thorough sandbox testing gives you high confidence before going live!
