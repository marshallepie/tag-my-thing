#!/bin/bash
# Switch to production environment
echo "⚠️  Switching to PRODUCTION environment..."
read -p "Are you sure? This will use LIVE data (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Copy production env from current .env (which has production keys)
    cp .env .env.production 2>/dev/null || echo "No .env.production found, using current .env"
    cp .env.production .env 2>/dev/null || echo "Using current production .env"
    echo "✅ Environment set to PRODUCTION"
    echo "📍 Supabase: https://uylayywjytfztihrvogb.supabase.co"
    echo "⚠️  You are now using LIVE production data!"
else
    echo "❌ Cancelled - staying in current environment"
fi