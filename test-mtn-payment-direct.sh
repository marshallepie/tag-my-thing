#!/bin/bash

# Test MTN MOMO requesttopay endpoint directly

SUBSCRIPTION_KEY="79f94857e55d4e39a6ad327df309c0d1"
API_USER="686bed0f-9a72-4583-a1e4-a45efae86606"
API_KEY="f8e81a0641c8466bacb1f5ceab6ed699"
BASE_URL="https://sandbox.momodeveloper.mtn.com"

echo "🧪 Testing MTN MOMO requesttopay API..."
echo ""

# Get access token
AUTH_STRING=$(echo -n "${API_USER}:${API_KEY}" | base64)
TOKEN_RESPONSE=$(curl -s -X POST \
  "${BASE_URL}/collection/token/" \
  -H "Ocp-Apim-Subscription-Key: ${SUBSCRIPTION_KEY}" \
  -H "Authorization: Basic ${AUTH_STRING}" \
  -H "Content-Length: 0")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

echo "✅ Got access token: ${ACCESS_TOKEN:0:50}..."
echo ""

# Generate a unique reference ID
REFERENCE_ID="TEST-$(date +%s)-12345678"

echo "📤 Sending requesttopay with reference: $REFERENCE_ID"
echo ""

# Test payment request
PAYMENT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${BASE_URL}/collection/v1_0/requesttopay" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-Reference-Id: ${REFERENCE_ID}" \
  -H "X-Target-Environment: sandbox" \
  -H "Ocp-Apim-Subscription-Key: ${SUBSCRIPTION_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "750",
    "currency": "XAF",
    "externalId": "'"${REFERENCE_ID}"'",
    "payer": {
      "partyIdType": "MSISDN",
      "partyId": "237671234567"
    },
    "payerMessage": "Test payment",
    "payeeNote": "Test transaction"
  }')

HTTP_CODE=$(echo "$PAYMENT_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
BODY=$(echo "$PAYMENT_RESPONSE" | sed 's/HTTP_CODE:[0-9]*//')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body: $BODY"
echo ""

if [ "$HTTP_CODE" = "202" ]; then
  echo "✅ SUCCESS! Payment request accepted."
  echo "MTN MOMO will process the payment."
elif [ "$HTTP_CODE" = "400" ]; then
  echo "❌ 400 Bad Request"
  echo "The payload format is invalid."
  echo "Response: $BODY"
elif [ "$HTTP_CODE" = "409" ]; then
  echo "⚠️  409 Conflict"
  echo "Reference ID already exists. This is OK for testing."
else
  echo "❌ Unexpected error (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
