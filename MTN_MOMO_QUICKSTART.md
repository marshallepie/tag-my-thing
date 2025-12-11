# MTN MOMO Quick Start Guide

Get your MTN Mobile Money integration up and running in 5 minutes!

## Prerequisites

✅ Node.js installed
✅ MTN MOMO Developer account created
✅ Subscribed to Collection API
✅ Primary Key copied from MTN portal

## Step-by-Step Setup

### 1. Get Your Primary Key

1. Go to [MTN MOMO Developer Portal](https://momodeveloper.mtn.com/)
2. Sign in to your account
3. Navigate to **Products** → **Collection API**
4. Click **Subscribe** (if not already subscribed)
5. Go to **Profile** → **Subscriptions** → **Collection API**
6. Copy your **Primary Key** (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 2. Run the Setup Script

Open your terminal in the project directory and run:

```bash
node scripts/setup-mtn-momo.js YOUR_PRIMARY_KEY sandbox
```

Replace `YOUR_PRIMARY_KEY` with the key you copied.

**Example:**
```bash
node scripts/setup-mtn-momo.js a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 sandbox
```

The script will:
- ✅ Create an API User
- ✅ Generate an API Key
- ✅ Verify the setup
- ✅ Display all your credentials

### 3. Copy Credentials to .env

The script will output something like this:

```bash
MTN_MOMO_SUBSCRIPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
MTN_MOMO_API_USER=12345678-1234-1234-1234-123456789abc
MTN_MOMO_API_KEY=def456ghi789jkl012mno345pqr678st
MTN_MOMO_ENVIRONMENT=sandbox
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
```

Copy these lines and paste them into your `.env` file.

### 4. Run Database Migration

```bash
# For local development
supabase db reset

# For production
supabase db push
```

### 5. Deploy Edge Functions

```bash
# Deploy the three functions
supabase functions deploy mtn-momo-request-payment
supabase functions deploy mtn-momo-verify-payment
supabase functions deploy mtn-momo-webhook
```

### 6. Set Supabase Secrets

Use the commands displayed by the setup script:

```bash
supabase secrets set MTN_MOMO_SUBSCRIPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
supabase secrets set MTN_MOMO_API_USER=12345678-1234-1234-1234-123456789abc
supabase secrets set MTN_MOMO_API_KEY=def456ghi789jkl012mno345pqr678st
supabase secrets set MTN_MOMO_ENVIRONMENT=sandbox
supabase secrets set MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
```

### 7. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the token purchase page
3. Select a token package
4. Choose "MTN Mobile Money" as payment method
5. Enter a test phone number: `237671234567`
6. The payment flow will simulate in sandbox mode

## That's It! 🎉

Your MTN MOMO integration is now live and ready to accept payments!

## Test Phone Numbers (Sandbox)

Use these phone numbers for testing different scenarios:

- ✅ **237671234567** - Success scenario
- ⏳ **237671234568** - Pending scenario
- ❌ **237671234569** - Failed scenario

## Need Help?

- 📖 **Full Documentation**: See `MTN_MOMO_INTEGRATION.md`
- 🐛 **Issues**: Check Supabase Edge Function logs
- 💬 **Support**: MTN Developer Portal support

## Going to Production

When you're ready for production:

1. Contact MTN Cameroon Business Team: businesssupport@mtn.com
2. Complete KYC and business verification
3. Get production API credentials
4. Run setup script with production key
5. Update environment to `production`
6. Deploy!

---

**Pro Tip**: Keep your `.env` file backed up securely and never commit it to version control!
