#!/bin/bash

# Direct test of MTN MOMO edge function to see the actual error

echo "🧪 Testing MTN MOMO Edge Function Directly..."
echo ""
echo "This will show us the exact error message."
echo ""

# You need to replace YOUR_JWT_TOKEN with your actual session token
# Get it from: Browser DevTools → Application → Local Storage → sb-uylayywjytfztihrvogb-auth-token

read -p "Paste your JWT token (from browser local storage): " JWT_TOKEN

echo ""
echo "📤 Sending test payment request..."
echo ""

curl -X POST \
  https://uylayywjytfztihrvogb.supabase.co/functions/v1/mtn-momo-request-payment \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 750,
    "phoneNumber": "237671234567",
    "tmtTokensAmount": 100
  }' \
  2>&1 | jq . || cat

echo ""
echo ""
echo "☝️ The response above shows the exact error from the edge function"
