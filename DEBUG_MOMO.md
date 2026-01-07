# MTN MOMO Debugging Guide

## Finding the Real Error Logs

The shutdown log you saw is **normal** - it just means the function finished executing.

We need to find the logs that show **what happened during your payment attempt**.

### Method 1: Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/uylayywjytfztihrvogb/functions/mtn-momo-request-payment/logs

2. Look for logs with these patterns:
   - `"level": "error"` or `"level": "uncaught-exception"`
   - Messages containing "MTN MOMO token error"
   - Messages containing "Missing MTN MOMO credentials"
   - Status codes like 401, 403, 404, 500

3. The logs are in reverse chronological order (newest first)

### Method 2: CLI Real-Time (Alternative)

```bash
# Open a terminal and run:
supabase functions logs mtn-momo-request-payment --follow

# Then try the payment again in your browser
# Watch for error messages as they appear
```

### What to Look For

**Good Sign (credentials work):**
```json
{
  "MTN MOMO Request": {
    "baseUrl": "https://sandbox.momodeveloper.mtn.com",
    "environment": "sandbox"
  }
}
```

**Bad Sign (credentials missing):**
```json
{
  "Missing MTN MOMO credentials": {
    "hasSubscriptionKey": false,
    "hasApiUser": false,
    "hasApiKey": false
  }
}
```

**Bad Sign (authentication failed):**
```json
{
  "MTN MOMO token error": {
    "status": 401,
    "statusText": "Unauthorized"
  }
}
```

## If You Don't Have Valid Credentials Yet

You need to run the setup script with your MTN MOMO Primary Key:

### Step 1: Get Your Primary Key
1. Go to: https://momodeveloper.mtn.com/
2. Sign in
3. Go to **Products** → **Collection API**
4. Click **Subscribe** (if not already)
5. Go to **Profile** → **Subscriptions**
6. Copy your **Primary Key**

### Step 2: Run Setup Script
```bash
node scripts/setup-mtn-momo.js YOUR_PRIMARY_KEY sandbox
```

### Step 3: Set the Secrets
The script will output commands like:
```bash
supabase secrets set MTN_MOMO_SUBSCRIPTION_KEY=...
supabase secrets set MTN_MOMO_API_USER=...
supabase secrets set MTN_MOMO_API_KEY=...
supabase secrets set MTN_MOMO_ENVIRONMENT=sandbox
supabase secrets set MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
```

Run all of those commands.

### Step 4: Re-deploy the Function
```bash
supabase functions deploy mtn-momo-request-payment
```

### Step 5: Test Again
Try the payment flow again with **237671234567**

---

## Quick Test Without MTN Credentials

If you don't have MTN MOMO credentials yet and want to test the rest of your app:

### Option 1: Use Stripe or Paystack
Both are already working in your app! Just select them instead of MTN MOMO.

### Option 2: Manually Credit Tokens (Testing Only)
```sql
-- Run this in Supabase SQL Editor for testing
INSERT INTO token_transactions (
  user_id,
  transaction_type,
  amount,
  description
) VALUES (
  'YOUR_USER_ID',
  'purchase',
  1000,
  'Test tokens for MTN MOMO development'
);
```

This will add 1000 TMT tokens to your account for testing.
