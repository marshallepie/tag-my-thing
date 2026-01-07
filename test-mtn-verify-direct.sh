#!/bin/bash

# Test MTN MOMO payment verification directly with the API
# This bypasses our Edge Function and tests MTN MOMO directly

if [ -z "$1" ]; then
  echo "Usage: ./test-mtn-verify-direct.sh <reference_id>"
  echo ""
  echo "Get the reference_id from the database:"
  echo "Run check-mtn-transaction.sql in Supabase SQL Editor"
  exit 1
fi

REFERENCE_ID="$1"
SUBSCRIPTION_KEY="79f94857e55d4e39a6ad327df309c0d1"
API_USER="686bed0f-9a72-4583-a1e4-a45efae86606"
API_KEY="f8e81a0641c8466bacb1f5ceab6ed699"
BASE_URL="https://sandbox.momodeveloper.mtn.com"

echo "🧪 Testing MTN MOMO Payment Verification..."
echo ""
echo "Reference ID: $REFERENCE_ID"
echo ""

# Step 1: Get access token
echo "📝 Getting OAuth token..."
AUTH_STRING=$(echo -n "${API_USER}:${API_KEY}" | base64)
TOKEN_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/collection/token/" \
  -H "Ocp-Apim-Subscription-Key: ${SUBSCRIPTION_KEY}" \
  -H "Authorization: Basic ${AUTH_STRING}" \
  -H "Content-Length: 0")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Got access token"
echo ""

# Step 2: Check payment status
echo "🔍 Checking payment status..."
STATUS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET \
  "${BASE_URL}/collection/v1_0/requesttopay/${REFERENCE_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-Target-Environment: sandbox" \
  -H "Ocp-Apim-Subscription-Key: ${SUBSCRIPTION_KEY}")

HTTP_CODE=$(echo "$STATUS_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
BODY=$(echo "$STATUS_RESPONSE" | sed 's/HTTP_CODE:[0-9]*//')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "Payment Status:"
  echo "$BODY" | jq '.'

  PAYMENT_STATUS=$(echo "$BODY" | jq -r '.status')
  echo ""

  if [ "$PAYMENT_STATUS" = "SUCCESSFUL" ]; then
    echo "✅ Payment is SUCCESSFUL!"
    echo "The verify function should credit tokens for this transaction."
  elif [ "$PAYMENT_STATUS" = "PENDING" ]; then
    echo "⏳ Payment is PENDING"
    echo "In sandbox, this usually means it will auto-approve soon."
  elif [ "$PAYMENT_STATUS" = "FAILED" ]; then
    echo "❌ Payment FAILED"
    REASON=$(echo "$BODY" | jq -r '.reason // "Unknown reason"')
    echo "Reason: $REASON"
  else
    echo "⚠️  Unknown status: $PAYMENT_STATUS"
  fi
else
  echo "❌ Failed to check status"
  echo "Response: $BODY"
fi
