#!/bin/bash

# Test MTN MOMO Credentials
# This script attempts to get an OAuth token to verify credentials are working

echo "🔍 Testing MTN MOMO API Credentials..."
echo ""

# Get the secrets (only showing we can access them, not the actual values)
echo "✅ Checking if secrets are set..."
supabase secrets list | grep MTN_MOMO

echo ""
echo "📊 To see the actual error from the edge function:"
echo "1. Go to: https://supabase.com/dashboard/project/uylayywjytfztihrvogb/functions"
echo "2. Click on 'mtn-momo-request-payment'"
echo "3. Click on 'Logs' tab"
echo "4. Try the payment again and watch for error messages"
echo ""
echo "Common issues:"
echo "  ❌ MTN_MOMO_API_USER or MTN_MOMO_API_KEY are invalid"
echo "  ❌ MTN_MOMO_SUBSCRIPTION_KEY has expired or is incorrect"
echo "  ❌ MTN MOMO sandbox is down"
echo ""
