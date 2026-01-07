#!/bin/bash

echo "📊 Fetching recent MTN MOMO edge function logs..."
echo ""
echo "This will show the last few logs from the function."
echo ""

# Get recent logs
supabase functions logs mtn-momo-request-payment --limit 10

echo ""
echo "☝️ Look for logs with 'MTN MOMO token error' or '401'"
echo ""
echo "Or check the dashboard at:"
echo "https://supabase.com/dashboard/project/uylayywjytfztihrvogb/functions/mtn-momo-request-payment/logs"
