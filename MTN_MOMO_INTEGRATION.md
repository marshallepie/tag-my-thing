# MTN Mobile Money Integration Guide

## Overview

This document describes the integration of MTN Mobile Money (MTN MOMO) payment system for the Cameroon market. The integration allows users to purchase TMT tokens using their MTN Mobile Money accounts.

## Architecture

### Components

1. **Database Layer** (`supabase/migrations/20251210100000_add_mtn_momo_support.sql`)
   - `mtn_momo_transactions` table for transaction tracking
   - Row Level Security (RLS) policies for data isolation
   - Cleanup functions for expired transactions

2. **Backend Services** (Supabase Edge Functions)
   - `mtn-momo-request-payment/` - Initiates payment requests
   - `mtn-momo-verify-payment/` - Checks payment status
   - `mtn-momo-webhook/` - Handles payment notifications

3. **Frontend Components**
   - `useMTNMomo` hook - Payment flow management
   - `MTNMomoPaymentModal` - Payment UI
   - `TokenPurchasePage` - Token package selection

## Setup Instructions

### 1. Environment Variables

Add the following variables to your `.env` file and Supabase Edge Function secrets:

```bash
# MTN MOMO API Credentials
MTN_MOMO_SUBSCRIPTION_KEY=your_subscription_key
MTN_MOMO_API_USER=your_api_user_id
MTN_MOMO_API_KEY=your_api_key

# MTN MOMO Environment (sandbox or production)
MTN_MOMO_ENVIRONMENT=sandbox  # Change to 'production' for live
MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com  # Change for production

# Webhook callback URL (optional but recommended)
MTN_MOMO_CALLBACK_URL=https://your-project.supabase.co/functions/v1/mtn-momo-webhook
```

### 2. Obtaining MTN MOMO API Credentials

#### Understanding MTN MOMO Credentials

MTN MOMO requires **3 credentials**:

1. **Subscription Key** (Primary Key or Secondary Key)
   - You get this when you subscribe to Collection API
   - Found in MTN Developer Portal dashboard
   - This is `MTN_MOMO_SUBSCRIPTION_KEY`

2. **API User ID**
   - Must be created programmatically (UUID format)
   - Created via API call
   - This is `MTN_MOMO_API_USER`

3. **API Key**
   - Generated for your API User
   - Created via API call
   - This is `MTN_MOMO_API_KEY`

#### Step 1: Register and Get Subscription Key

1. Visit [MTN MOMO Developer Portal](https://momodeveloper.mtn.com/)
2. Create an account or sign in
3. Subscribe to the **Collection API** product
4. Copy your **Primary Key** (or Secondary Key) from the portal
   - This is your `MTN_MOMO_SUBSCRIPTION_KEY`

#### Step 2: Generate API User and API Key

**Option A: Use the Setup Script (Recommended)**

We've created a helper script to automate this process:

```bash
# Run the setup script with your Primary Key
node scripts/setup-mtn-momo.js YOUR_PRIMARY_KEY sandbox

# The script will:
# 1. Create an API User
# 2. Generate an API Key
# 3. Verify the setup
# 4. Display all credentials ready to copy
```

**Option B: Manual Setup via API Calls**

If you prefer to do it manually:

1. **Generate a UUID** for your API User:
```bash
# On macOS/Linux
uuidgen

# On Windows (PowerShell)
[guid]::NewGuid()

# Or use online UUID generator
```

2. **Create API User**:
```bash
curl -X POST \
  https://sandbox.momodeveloper.mtn.com/v1_0/apiuser \
  -H 'X-Reference-Id: YOUR_GENERATED_UUID' \
  -H 'Ocp-Apim-Subscription-Key: YOUR_PRIMARY_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "providerCallbackHost": "webhook.site"
  }'
```

3. **Create API Key**:
```bash
curl -X POST \
  https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/YOUR_GENERATED_UUID/apikey \
  -H 'Ocp-Apim-Subscription-Key: YOUR_PRIMARY_KEY'
```

The response will contain your `apiKey`.

4. **Verify API User** (optional):
```bash
curl -X GET \
  https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/YOUR_GENERATED_UUID \
  -H 'Ocp-Apim-Subscription-Key: YOUR_PRIMARY_KEY'
```

#### Step 3: Save Your Credentials

You should now have all three credentials:

```bash
# From MTN Portal
MTN_MOMO_SUBSCRIPTION_KEY=your_primary_key_from_portal

# Generated via API (the UUID you created)
MTN_MOMO_API_USER=your_generated_uuid

# Received from API Key creation
MTN_MOMO_API_KEY=the_api_key_from_response
```

#### Step 4: Production Credentials

For production:
1. Contact MTN Cameroon Business Team (businesssupport@mtn.com)
2. Complete KYC and business verification
3. Subscribe to Collection API in production environment
4. Repeat the setup process with production credentials
5. Update environment variables to production values

### 3. Database Migration

Run the migration to create the necessary tables:

```bash
# Using Supabase CLI
supabase db reset  # For local development
supabase db push   # For remote deployment
```

### 4. Deploy Edge Functions

Deploy the three Edge Functions to Supabase:

```bash
# Deploy all functions
supabase functions deploy mtn-momo-request-payment
supabase functions deploy mtn-momo-verify-payment
supabase functions deploy mtn-momo-webhook

# Set environment secrets
supabase secrets set MTN_MOMO_SUBSCRIPTION_KEY=your_key
supabase secrets set MTN_MOMO_API_USER=your_user_id
supabase secrets set MTN_MOMO_API_KEY=your_api_key
supabase secrets set MTN_MOMO_ENVIRONMENT=sandbox
supabase secrets set MTN_MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
```

## Payment Flow

### User Journey

1. **Token Package Selection**
   - User navigates to token purchase page
   - Selects desired token package (100, 500, 1000, 2500, or 5000 TMT)
   - Chooses MTN MOMO as payment method

2. **Payment Initiation**
   - User enters MTN MOMO phone number (format: 237XXXXXXXXX)
   - System validates phone number format
   - Edge Function `mtn-momo-request-payment` creates payment request
   - Transaction record created in database with `pending` status

3. **Payment Approval**
   - User receives MTN MOMO prompt on their phone
   - User approves payment via *126# or mobile app
   - Frontend polls `mtn-momo-verify-payment` every 3 seconds

4. **Payment Confirmation**
   - MTN MOMO processes payment
   - Webhook receives notification (if configured)
   - Edge Function verifies payment status
   - TMT tokens credited to user wallet
   - Transaction status updated to `successful`

### Technical Flow

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       │ 1. requestPayment()
       │
       v
┌─────────────────────────────────┐
│  mtn-momo-request-payment       │
│  Edge Function                  │
└──────┬──────────────────────────┘
       │
       │ 2. POST /collection/v1_0/requesttopay
       │
       v
┌─────────────────────────────────┐
│  MTN MOMO API                   │
└──────┬──────────────────────────┘
       │
       │ 3. 202 Accepted
       │
       v
┌─────────────────────────────────┐
│  Database                       │
│  (mtn_momo_transactions)        │
└─────────────────────────────────┘
       │
       │ 4. User approves on phone
       │
       v
┌─────────────────────────────────┐
│  MTN MOMO                       │
│  (processes payment)            │
└──────┬──────────────────────────┘
       │
       ├─────────────────┬────────────────────┐
       │                 │                    │
       v                 v                    v
┌──────────────┐  ┌──────────────┐   ┌──────────────┐
│  Webhook     │  │  Frontend    │   │  Verify      │
│  (optional)  │  │  Polling     │   │  Payment     │
└──────────────┘  └──────────────┘   └──────────────┘
       │                 │                    │
       └─────────────────┴────────────────────┘
                         │
                         v
               ┌────────────────────┐
               │  Credit Tokens     │
               │  Update Status     │
               └────────────────────┘
```

## Token Packages

Default token packages with XAF (Central African Franc) pricing:

| Package    | TMT Tokens | Price (XAF) | Savings | USD Equivalent |
|------------|------------|-------------|---------|----------------|
| Starter    | 100        | 1,000       | 0%      | ~$1.60         |
| Basic      | 500        | 4,500       | 10%     | ~$7.20         |
| Popular    | 1,000      | 8,000       | 20%     | ~$12.80        |
| Premium    | 2,500      | 18,750      | 25%     | ~$30.00        |
| Enterprise | 5,000      | 35,000      | 30%     | ~$56.00        |

*Note: USD equivalents are approximate based on current exchange rates (1 USD ≈ 625 XAF)*

## Phone Number Format

MTN Cameroon phone numbers must follow this format:

- **Format**: 237XXXXXXXXX
- **Country Code**: 237 (Cameroon)
- **Operator Prefix**: 6 or 7 (MTN Cameroon)
- **Total Digits**: 12 (including country code)

**Examples**:
- Valid: 237671234567, 237651234567
- Invalid: 671234567, +237671234567, 237-67-123-4567

The `useMTNMomo` hook automatically formats phone numbers.

## Database Schema

### `mtn_momo_transactions` Table

```sql
CREATE TABLE mtn_momo_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- MTN MOMO specific fields
    reference_id VARCHAR(255) UNIQUE NOT NULL,
    mtn_transaction_id VARCHAR(255),
    phone_number VARCHAR(20) NOT NULL,

    -- Transaction details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XAF' NOT NULL,
    tmt_tokens_amount INTEGER NOT NULL,

    -- Status: pending, processing, successful, failed, cancelled, timeout
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,

    -- Metadata
    payment_url TEXT,
    error_message TEXT,
    callback_data JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);
```

## API Reference

### Frontend Hook: `useMTNMomo`

```typescript
import { useMTNMomo } from '@/hooks/useMTNMomo';

const {
  isLoading,
  currentTransaction,
  requestPayment,
  verifyPayment,
  getTransactionHistory,
  getTransaction,
  validatePhoneNumber,
  formatPhoneNumber,
  tokenPackages,
} = useMTNMomo();

// Request payment
const transaction = await requestPayment('237671234567', 'popular');

// Verify payment
const updatedTransaction = await verifyPayment(referenceId);

// Get transaction history
const history = await getTransactionHistory();
```

### Edge Function: Request Payment

**Endpoint**: `/functions/v1/mtn-momo-request-payment`

**Request**:
```json
{
  "amount": 8000,
  "phoneNumber": "237671234567",
  "tmtTokensAmount": 1000
}
```

**Response**:
```json
{
  "success": true,
  "referenceId": "TMT-1702398000000-12345678",
  "transaction": { /* transaction object */ },
  "message": "Payment request sent. Please check your phone to approve the transaction."
}
```

### Edge Function: Verify Payment

**Endpoint**: `/functions/v1/mtn-momo-verify-payment`

**Request**:
```json
{
  "referenceId": "TMT-1702398000000-12345678"
}
```

**Response**:
```json
{
  "success": true,
  "status": "successful",
  "message": "Payment confirmed! Tokens credited to your account.",
  "transaction": { /* transaction object */ }
}
```

## Testing

### Sandbox Testing

MTN MOMO provides sandbox phone numbers for testing:

1. **Test Numbers**:
   - 237671234567 (Success scenario)
   - 237671234568 (Pending scenario)
   - 237671234569 (Failed scenario)

2. **Test Flow**:
```bash
# 1. Request payment
curl -X POST https://your-project.supabase.co/functions/v1/mtn-momo-request-payment \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "phoneNumber": "237671234567",
    "tmtTokensAmount": 100
  }'

# 2. Verify payment
curl -X POST https://your-project.supabase.co/functions/v1/mtn-momo-verify-payment \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "referenceId": "TMT-1702398000000-12345678"
  }'
```

## Error Handling

### Common Errors

1. **Invalid Phone Number**
   - **Error**: "Invalid phone number. Must be a valid Cameroon MTN number."
   - **Solution**: Ensure phone number is in format 237XXXXXXXXX

2. **Insufficient Funds**
   - **Error**: Payment fails with status "FAILED"
   - **Solution**: User should check MTN MOMO account balance

3. **Timeout**
   - **Error**: Transaction remains in "pending" status
   - **Solution**: Automatic cleanup after 24 hours, user can retry

4. **API Authentication Error**
   - **Error**: "Failed to authenticate with payment gateway"
   - **Solution**: Check MTN MOMO API credentials in environment variables

## Security Considerations

1. **RLS Policies**: Users can only view their own transactions
2. **Service Role**: Only Edge Functions with service role can update transaction status
3. **Phone Number Validation**: Strict format validation prevents invalid requests
4. **Amount Validation**: Backend validates all payment amounts
5. **Webhook Security**: Consider adding webhook signature verification in production

## Monitoring & Maintenance

### Transaction Monitoring

Query pending transactions:
```sql
SELECT * FROM mtn_momo_transactions
WHERE status = 'pending'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Cleanup Expired Transactions

The database includes an automatic cleanup function:
```sql
SELECT cleanup_expired_mtn_momo_transactions();
```

Consider running this as a scheduled job (pg_cron or Supabase scheduled functions).

### Transaction States

- `pending`: Payment request sent, awaiting user approval
- `processing`: Payment being processed by MTN
- `successful`: Payment completed, tokens credited
- `failed`: Payment failed
- `cancelled`: User cancelled payment
- `timeout`: Payment expired (24 hours)

## Production Checklist

Before going live:

- [ ] Obtain production MTN MOMO API credentials
- [ ] Update environment variables to production values
- [ ] Change `MTN_MOMO_ENVIRONMENT` to `production`
- [ ] Update `MTN_MOMO_BASE_URL` to production endpoint
- [ ] Configure webhook URL and verify it's accessible
- [ ] Test with real Cameroon MTN numbers
- [ ] Set up transaction monitoring
- [ ] Configure automatic cleanup job
- [ ] Review and adjust token package pricing
- [ ] Test error scenarios and user experience
- [ ] Document customer support procedures

## Support

For issues related to:
- **MTN MOMO API**: Contact MTN Developer Support
- **Integration**: Check logs in Supabase Edge Functions dashboard
- **Transactions**: Query `mtn_momo_transactions` table

## References

- [MTN MOMO Developer Portal](https://momodeveloper.mtn.com/)
- [MTN MOMO Collection API Documentation](https://momodeveloper.mtn.com/api-documentation/collection/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
