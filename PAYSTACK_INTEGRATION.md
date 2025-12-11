# Paystack Payment Integration Guide

## Overview
This document provides complete setup instructions for integrating Paystack payments into TagMyThing to enable token purchases via African payment methods.

Paystack is a leading payment gateway for African businesses, supporting Nigeria, Ghana, Kenya, and South Africa.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Paystack Dashboard Setup](#paystack-dashboard-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Migration](#database-migration)
5. [Deploying Edge Functions](#deploying-edge-functions)
6. [Testing](#testing)
7. [Going Live](#going-live)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Active Paystack account ([Sign up here](https://paystack.com/))
- Supabase project with CLI installed
- Node.js and npm installed
- TagMyThing application already set up with Supabase
- `payment_transactions` table already exists in database

---

## Paystack Dashboard Setup

### 1. Create Paystack Account

1. Visit [Paystack](https://paystack.com/) and sign up
2. Complete business verification (required for live mode)
3. Navigate to Settings → API Keys & Webhooks

### 2. Get API Keys

#### Test Mode (Development)
1. Switch to "Test Mode" in dashboard (toggle at top)
2. Go to Settings → API Keys & Webhooks
3. Copy the following keys:
   - **Public Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

#### Live Mode (Production)
1. Complete business verification
2. Switch to "Live Mode" in dashboard
3. Go to Settings → API Keys & Webhooks
4. Copy the following keys:
   - **Public Key** (starts with `pk_live_`)
   - **Secret Key** (starts with `sk_live_`)

### 3. Setup Webhook

1. Go to Settings → API Keys & Webhooks
2. Scroll to "Webhook URL" section
3. Enter your webhook URL:
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
   ```
4. Click "Save Changes"
5. The webhook will automatically verify using signature verification (no secret needed)

---

## Environment Configuration

### 1. Update .env File

The `.env` file has already been updated with placeholder values. Replace them with your actual keys:

```bash
# Paystack Configuration - TEST MODE (use live keys in production)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_key_here
```

### 2. Configure Supabase Secrets

Add the secret key to your Supabase project for the Edge Functions:

```bash
# Using Supabase CLI
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_key_here
```

Or via Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add `PAYSTACK_SECRET_KEY` with your secret key value

---

## Database Migration

### 1. Run the Migration

The Paystack support migration has already been created. Apply it:

```bash
# From your project root
supabase db push
```

This will:
- Add 'paystack' to the `payment_provider` enum
- Add Paystack-specific columns: `paystack_reference`, `paystack_access_code`, `paystack_authorization_code`
- Create indexes for performance

### 2. Verify Migration

Check that the changes were applied:

```sql
-- Verify paystack is a valid provider
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payment_transactions'
AND column_name LIKE 'paystack%';
```

You should see three new columns:
- `paystack_reference`
- `paystack_access_code`
- `paystack_authorization_code`

---

## Deploying Edge Functions

### 1. Deploy Webhook Handler

```bash
supabase functions deploy paystack-webhook --no-verify-jwt
```

The `--no-verify-jwt` flag is important because webhooks come from Paystack, not authenticated users.

### 2. Deploy Payment Verification Function

```bash
supabase functions deploy verify-paystack-payment
```

This function requires authentication as it's called from the client.

### 3. Verify Deployment

Test that the functions are accessible:

```bash
# Test webhook (should return 401 without signature)
curl https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/paystack-webhook

# Test verification (should return 400 without parameters)
curl https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/verify-paystack-payment
```

---

## Testing

### 1. Test Cards (Paystack Test Mode)

Use these test cards for different scenarios:

#### Successful Payment
- **Card Number:** 4084084084084081 (Visa)
- **CVV:** 408
- **Expiry:** Any future date (e.g., 12/25)
- **PIN:** 0000
- **OTP:** 123456

#### Insufficient Funds
- **Card Number:** 5060666666666666 (Mastercard)
- **CVV:** 606
- **Expiry:** Any future date
- **PIN:** 1234

#### Declined Payment
- **Card Number:** 4084084084084090
- **CVV:** Any 3 digits
- **Expiry:** Any future date

### 2. Test Payment Flow

1. Log into TagMyThing application
2. Navigate to Wallet page
3. Click "Buy Tokens" button
4. Select a token package
5. Choose currency (NGN, GHS, KES, ZAR, XOF, or USD)
6. Click "Proceed to Payment"
7. Complete payment with test card
8. Verify tokens are credited to wallet

### 3. Verify Webhook

Check Supabase Edge Function logs:

```bash
supabase functions logs paystack-webhook
```

Expected log entries:
- "Received Paystack webhook: charge.success"
- "Successfully credited X tokens to user..."

### 4. Check Database Records

```sql
-- Check payment transactions
SELECT * FROM payment_transactions
WHERE payment_provider = 'paystack'
ORDER BY created_at DESC
LIMIT 5;

-- Check token transactions
SELECT * FROM token_transactions
WHERE source = 'purchase'
ORDER BY created_at DESC
LIMIT 5;

-- Check wallet balances
SELECT user_id, balance FROM user_wallets;
```

---

## Going Live

### 1. Switch to Live Keys

Update your `.env` file with live keys:

```bash
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
```

Update Supabase secrets:

```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
```

### 2. Update Webhook URL

In Paystack dashboard, ensure webhook URL points to production:
```
https://YOUR_PRODUCTION_DOMAIN.supabase.co/functions/v1/paystack-webhook
```

### 3. Business Verification

Complete Paystack's business verification process:
1. Submit required documents
2. Wait for approval (usually 24-48 hours)
3. Once approved, live mode will be enabled

### 4. Production Checklist

- [ ] Live API keys configured in .env
- [ ] Live API keys set in Supabase secrets
- [ ] Webhook URL updated to production
- [ ] Edge functions deployed
- [ ] Database migration applied
- [ ] Paystack business verification completed
- [ ] Test transaction in live mode successful
- [ ] Monitoring and logging enabled
- [ ] Customer support prepared

---

## Troubleshooting

### Common Issues

#### 1. Payment Fails with "Configuration Error"

**Problem:** Paystack public key not found

**Solution:**
- Verify `VITE_PAYSTACK_PUBLIC_KEY` is set in `.env`
- Restart development server: `npm run dev`
- Check key starts with `pk_test_` or `pk_live_`

#### 2. Webhook Not Receiving Events

**Problem:** Webhook URL not accessible

**Solution:**
- Verify Edge Function is deployed: `supabase functions list`
- Check webhook URL in Paystack dashboard matches deployed function
- Ensure function deployed with `--no-verify-jwt` flag
- Check Edge Function logs for errors: `supabase functions logs paystack-webhook`

#### 3. Tokens Not Credited After Payment

**Problem:** Webhook processing fails

**Solution:**
- Check Edge Function logs: `supabase functions logs paystack-webhook`
- Verify `PAYSTACK_SECRET_KEY` is set in Supabase secrets
- Ensure `user_wallets` table exists
- Check RLS policies allow service role to update tables

#### 4. "Invalid Signature" Error in Webhook

**Problem:** Webhook signature verification fails

**Solution:**
- Verify `PAYSTACK_SECRET_KEY` in Supabase secrets matches dashboard
- Check webhook is being called from Paystack's servers
- Ensure you're using the secret key (not public key) for verification

#### 5. Amount Mismatch Error

**Problem:** Payment amount doesn't match expected amount

**Solution:**
- Remember Paystack uses kobo (NGN) or lowest currency unit
- Check conversion: amount in kobo = amount in Naira × 100
- Verify currency code matches in both frontend and backend

### Debug Mode

Enable detailed logging by checking Edge Function logs:

```bash
# Watch logs in real-time
supabase functions logs paystack-webhook --follow

# Watch verification logs
supabase functions logs verify-paystack-payment --follow
```

### Support

For additional help:
- **Paystack Documentation:** https://paystack.com/docs
- **Paystack Support:** support@paystack.com
- **TagMyThing Issues:** tagmything@marshallepie.com

---

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables for all sensitive data**
3. **Always verify webhook signatures**
4. **Implement idempotency checks** to prevent duplicate credits
5. **Use HTTPS for all webhook URLs**
6. **Monitor for suspicious transaction patterns**
7. **Set up alerts for failed payments**
8. **Regularly audit payment transactions**
9. **Keep Paystack SDK updated**
10. **Test thoroughly in test mode before going live**

---

## Supported Countries & Currencies

### Primary Markets
- **Nigeria (NGN)** - Cards, Bank Transfer, USSD, Mobile Money
- **Ghana (GHS)** - Cards, Mobile Money (MTN, Vodafone, AirtelTigo)
- **Kenya (KES)** - Cards, M-Pesa
- **South Africa (ZAR)** - Cards, Bank Transfer

### Additional Currencies
- **USD** - International cards
- **XOF** - West African CFA Franc

### Payment Methods
- **Cards:** Visa, Mastercard, Verve
- **Bank Transfer:** Direct bank transfers
- **Mobile Money:** M-Pesa, MTN Mobile Money, Vodafone Cash, etc.
- **USSD:** USSD codes for feature phones

---

## Pricing

Paystack charges transaction fees based on country:

- **Nigeria:** 1.5% + ₦100 (capped at ₦2,000)
- **Ghana:** 1.95%
- **Kenya:** 3.5%
- **South Africa:** 2.9%
- **International:** 3.9%

*These fees are automatically deducted from transactions.*

---

## Additional Resources

- [Paystack API Documentation](https://paystack.com/docs/api/)
- [Paystack React Library](https://github.com/iamraphson/react-paystack)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [TagMyThing Architecture](./DATABASE_SCHEMA.md)

---

## Usage Example

### Adding Payment Button to Your Page

```tsx
import React, { useState } from 'react';
import { PaystackPayment } from '@/components/payments/PaystackPayment';
import { Button } from '@/components/ui/Button';
import { Wallet } from 'lucide-react';

export const WalletPage: React.FC = () => {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowPayment(true)}>
        <Wallet className="mr-2 h-5 w-5" />
        Buy Tokens
      </Button>

      <PaystackPayment
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          // Refresh wallet or show success message
          console.log('Payment successful!');
        }}
      />
    </div>
  );
};
```

---

## Contact

For questions about this integration:
- **Email:** tagmything@marshallepie.com
- **GitHub:** [TagMyThing Repository](https://github.com/tagmything)

---

**Last Updated:** December 2, 2024
**Version:** 1.0.0
