# View MTN MOMO Edge Function Logs

The function is now authenticating successfully (no more 401!), but getting a 500 error.

## Check the Logs to See the Exact Error:

### Option 1: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/uylayywjytfztihrvogb/functions/mtn-momo-request-payment/logs
2. Look for the most recent entry (should be from just now)
3. Look for an error message or stack trace
4. Common errors to look for:
   - "MTN MOMO token error"
   - "Database error"
   - "Failed to..."
   - Any JavaScript errors

### Option 2: Test Direct from Terminal

Copy this command and run it (replace YOUR_JWT_TOKEN):

```bash
# Get your JWT token from browser:
# DevTools → Application → Local Storage → sb-uylayywjytfztihrvogb-auth-token → access_token

curl -X POST \
  https://uylayywjytfztihrvogb.supabase.co/functions/v1/mtn-momo-request-payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 750,
    "phoneNumber": "237671234567",
    "tmtTokensAmount": 100
  }' | jq .
```

This will show you the exact error message returned by the function.

## Most Likely Causes of 500 Error:

1. **MTN MOMO API authentication failing** (token endpoint error)
2. **Database insert failing** (mtn_momo_transactions table issue)
3. **MTN MOMO API request failing** (payment request error)

Check the logs and share what you see!
