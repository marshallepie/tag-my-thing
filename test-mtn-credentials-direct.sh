#!/bin/bash

# Test MTN MOMO API authentication directly

SUBSCRIPTION_KEY="79f94857e55d4e39a6ad327df309c0d1"
API_USER="686bed0f-9a72-4583-a1e4-a45efae86606"
API_KEY="f8e81a0641c8466bacb1f5ceab6ed699"
BASE_URL="https://sandbox.momodeveloper.mtn.com"

echo "🧪 Testing MTN MOMO API Authentication..."
echo ""
echo "Step 1: Getting OAuth token..."
echo ""

# Create Basic Auth header (base64 encode API_USER:API_KEY)
AUTH_STRING=$(echo -n "${API_USER}:${API_KEY}" | base64)

# Test authentication
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${BASE_URL}/collection/token/" \
  -H "Ocp-Apim-Subscription-Key: ${SUBSCRIPTION_KEY}" \
  -H "Authorization: Basic ${AUTH_STRING}" \
  -H "Content-Length: 0")

HTTP_CODE=$(echo "$RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:[0-9]*//')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS! Credentials are valid."
  echo "Access token received - MTN MOMO authentication works!"
  echo ""
  echo "The issue might be elsewhere. Let's check the edge function logs:"
  echo "https://supabase.com/dashboard/project/uylayywjytfztihrvogb/functions/mtn-momo-request-payment/logs"
elif [ "$HTTP_CODE" = "401" ]; then
  echo "❌ AUTHENTICATION FAILED (401 Unauthorized)"
  echo ""
  echo "This means either:"
  echo "  1. API_USER or API_KEY is invalid"
  echo "  2. The credentials expired"
  echo ""
  echo "Solution: Re-run the setup script to generate new credentials:"
  echo "  node scripts/setup-mtn-momo.js 79f94857e55d4e39a6ad327df309c0d1 sandbox"
elif [ "$HTTP_CODE" = "403" ]; then
  echo "❌ FORBIDDEN (403)"
  echo "Your subscription key might be invalid or not subscribed to Collection API"
else
  echo "❌ Unexpected error (HTTP $HTTP_CODE)"
  echo "Check the response above for details"
fi
