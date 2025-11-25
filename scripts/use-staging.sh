#!/bin/bash
# Switch to staging environment
echo "Switching to STAGING environment..."
cp .env.staging .env
echo "✅ Environment set to STAGING"
echo "📍 Supabase: https://secngjvtbvcbxtmgsshd.supabase.co"
echo "🚀 Run 'npm run dev' to start with staging config"