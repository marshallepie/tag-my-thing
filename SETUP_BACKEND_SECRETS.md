# Backend Secrets Setup Guide

This guide shows how to securely configure backend secrets for your Supabase Edge Functions.

## Important Security Note

⚠️ **NEVER** add backend secrets to your `.env` file with the `VITE_` prefix. These will be exposed in your frontend bundle and visible to anyone.

## Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to: **Project Settings** → **Edge Functions** → **Secrets**
3. Add each secret below using the "Add new secret" button

## Method 2: Using Supabase CLI

```bash
# Navigate to your project directory
cd /path/to/tag-my-thing

# Set each secret (one at a time)
supabase secrets set SECRET_NAME=secret_value
```

## Required Secrets

### Stripe Payment Secrets

```bash
# Get your secret key from: https://dashboard.stripe.com/apikeys
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE

# Get webhook secret after creating webhook endpoint:
# https://dashboard.stripe.com/webhooks
# Webhook URL: https://uylayywjytfztihrvogb.supabase.co/functions/v1/stripe-webhook
# Events: payment_intent.succeeded, checkout.session.completed
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

**⚠️ Important:** Your current Stripe key starts with `mk_` which is not standard. You need to:
1. Go to https://dashboard.stripe.com/apikeys
2. Get your **Secret key** (starts with `sk_live_` for production or `sk_test_` for testing)
3. Use that key, NOT the `mk_` key

### Paystack Payment Secrets

```bash
# Get from: https://dashboard.paystack.com/#/settings/developers
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_7acf6405eeb77aecbe87b65d10cbcd81634a84ec

# For production, switch to live key:
# supabase secrets set PAYSTACK_SECRET_KEY=sk_live_YOUR_LIVE_KEY
```

### MTN Mobile Money Secrets

```bash
supabase secrets set MTN_MOMO_PRIMARY_KEY=79f94857e55d4e39a6ad327df309c0d1
supabase secrets set MTN_MOMO_SECONDARY_KEY=a574e7737fcc49cdaa65856f91f1e669
supabase secrets set MTN_MOMO_SUBSCRIPTION_KEY=79f94857e55d4e39a6ad327df309c0d1
supabase secrets set MTN_MOMO_API_USER=75a7e796-da71-4965-aed6-67aab5720641
supabase secrets set MTN_MOMO_API_KEY=5d6c5a9aedd3474084bef162cfc416ec
supabase secrets set MTN_MOMO_ENVIRONMENT=sandbox
supabase secrets set MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
supabase secrets set MTN_MOMO_CALLBACK_URL=https://uylayywjytfztihrvogb.supabase.co/functions/v1/mtn-momo-webhook
```

### Arweave Wallet Secret

```bash
# CRITICAL: This is your blockchain wallet private key!
# Keep this extremely secure - anyone with this can drain your wallet

# For CLI, use single quotes to preserve JSON formatting:
supabase secrets set ARWEAVE_WALLET_KEY='{"d":"YOUR_PRIVATE_KEY_HERE","dp":"...","dq":"...","e":"AQAB","ext":true,"kty":"RSA","n":"...","p":"...","q":"...","qi":"..."}'

# For Dashboard: Paste the full JSON object (copy from your backup)
```

### Email Service Secret (Resend)

```bash
# Get from: https://resend.com/api-keys
supabase secrets set RESEND_API_KEY=re_39JqdYqg_f52Y6jAqnBWtijbdcVaUihxv
```

## Verify Secrets Are Set

```bash
# List all secrets (shows names only, not values)
supabase secrets list
```

Expected output:
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
PAYSTACK_SECRET_KEY
MTN_MOMO_PRIMARY_KEY
MTN_MOMO_SECONDARY_KEY
MTN_MOMO_SUBSCRIPTION_KEY
MTN_MOMO_API_USER
MTN_MOMO_API_KEY
MTN_MOMO_ENVIRONMENT
MTN_MOMO_BASE_URL
MTN_MOMO_CALLBACK_URL
ARWEAVE_WALLET_KEY
RESEND_API_KEY
```

## Deploy Edge Functions

After setting secrets, deploy your edge functions:

```bash
# Deploy all functions at once
supabase functions deploy create-stripe-payment-intent
supabase functions deploy verify-stripe-payment
supabase functions deploy stripe-webhook
supabase functions deploy verify-paystack-payment
supabase functions deploy mtn-momo-webhook
```

## Testing Locally

For local development, create a `.env.local` file (never commit this):

```bash
# .env.local (for Supabase Functions local development)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LOCAL_WEBHOOK_SECRET
PAYSTACK_SECRET_KEY=sk_test_YOUR_TEST_KEY
# ... other backend secrets
```

Start local Supabase with:
```bash
supabase start
supabase functions serve --env-file .env.local
```

## Security Checklist

- ✅ All secrets set in Supabase Dashboard (not in `.env` file)
- ✅ `.env` file only contains `VITE_` prefixed variables
- ✅ `.env.local` added to `.gitignore`
- ✅ Stripe secret key starts with `sk_live_` or `sk_test_` (NOT `mk_`)
- ✅ Webhook secrets generated from respective dashboards
- ✅ Arweave wallet private key backed up securely offline

## Troubleshooting

**Error: "Missing environment variable"**
- Check secrets are set: `supabase secrets list`
- Redeploy function: `supabase functions deploy <function-name>`

**Error: "Invalid API key"**
- Verify key format (sk_live_, pk_test_, etc.)
- Check for extra spaces or line breaks
- Regenerate key from provider dashboard

**Local functions not working:**
- Ensure `.env.local` exists with all required secrets
- Use `--env-file .env.local` flag when serving functions
- Check function logs: `supabase functions logs <function-name>`
