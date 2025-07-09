#!/bin/bash

echo "🚀 Applying Supabase migrations..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

echo "📋 Found the following migration files:"
ls -la supabase/migrations/

echo ""
echo "🔄 Applying migrations to your Supabase database..."

# Apply all pending migrations
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migrations applied successfully!"
    echo ""
    echo "🎉 Your database should now have:"
    echo "   - Complete TagMyThing schema"
    echo "   - Influencer referral system"
    echo "   - Test influencer user (Marshall Epie)"
    echo "   - All necessary functions and policies"
    echo ""
    echo "📝 You can now:"
    echo "   1. Test the influencer signup at /influencer-signup"
    echo "   2. Use referral code 'marshallepie' for testing"
    echo "   3. Check the Supabase dashboard for the new tables"
else
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "🔍 Common issues:"
    echo "   - Make sure you're connected to the right Supabase project"
    echo "   - Check if your database is accessible"
    echo "   - Verify your Supabase credentials"
    exit 1
fi