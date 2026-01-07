#!/bin/bash

# Test the MTN MOMO verify-payment function
# This simulates what happens when the frontend polls for payment status

# You'll need to replace REFERENCE_ID with an actual pending transaction reference_id from the database
# Get this by running the SQL query in check-mtn-transaction.sql

if [ -z "$1" ]; then
  echo "Usage: ./test-verify-function.sh <reference_id>"
  echo ""
  echo "First, check the database for pending transactions:"
  echo "Run check-mtn-transaction.sql in Supabase SQL Editor"
  echo ""
  echo "Then pass the reference_id as an argument to this script"
  exit 1
fi

REFERENCE_ID="$1"
SUPABASE_URL="https://uylayywjytfztihrvogb.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5bGF5eXdqeXRmenRpaHJ2b2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2MzA3MjgsImV4cCI6MjA0NjIwNjcyOH0.RJJwKEqzV9xIlmFqxOqjJCh3_3FUJaO-nBDJz-y8Esk"

# You'll also need a valid user JWT token
# For testing, you can get this from the browser's localStorage after logging in
# Look for 'sb-uylayywjytfztihrvogb-auth-token' in localStorage

if [ -z "$2" ]; then
  echo "ERROR: Missing JWT token"
  echo ""
  echo "To get your JWT token:"
  echo "1. Open the app in browser and log in"
  echo "2. Open DevTools > Application > Local Storage"
  echo "3. Find 'sb-uylayywjytfztihrvogb-auth-token'"
  echo "4. Copy the 'access_token' value"
  echo ""
  echo "Usage: ./test-verify-function.sh <reference_id> <jwt_token>"
  exit 1
fi

JWT_TOKEN="$2"

echo "🧪 Testing MTN MOMO verify-payment function..."
echo ""
echo "Reference ID: $REFERENCE_ID"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/mtn-momo-verify-payment" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -d "{\"referenceId\": \"${REFERENCE_ID}\"}")

HTTP_CODE=$(echo "$RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:[0-9]*//')

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Success!"
else
  echo "❌ Failed with status $HTTP_CODE"
fi
