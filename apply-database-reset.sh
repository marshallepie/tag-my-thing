#!/bin/bash

echo "🚀 TagMyThing Database Reset Migration"
echo "======================================"
echo ""
echo "⚠️  WARNING: This will delete ALL user data from your database!"
echo "✅ This will preserve all schema, functions, and configuration."
echo ""

# Check if user wants to proceed
read -p "Are you sure you want to proceed? (type 'YES' to confirm): " confirmation

if [ "$confirmation" != "YES" ]; then
    echo "❌ Migration cancelled."
    exit 1
fi

echo ""
echo "🔍 Checking Supabase CLI..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo ""
    echo "📋 Manual Instructions:"
    echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
    echo "2. Select your TagMyThing project"
    echo "3. Navigate to SQL Editor"
    echo "4. Create a new query"
    echo "5. Copy and paste the SQL from: supabase/migrations/20250103000000_reset_database_data.sql"
    echo "6. Click 'Run' to execute the migration"
    echo ""
    echo "📁 The migration file has been created for you."
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory."
    echo "Please run this from your project root where supabase/config.toml exists."
    exit 1
fi

echo "✅ Supabase CLI found!"
echo ""
echo "📋 Found migration file: supabase/migrations/20250103000000_reset_database_data.sql"
echo ""
echo "🔄 Applying database reset migration..."

# Apply the migration
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database reset migration applied successfully!"
    echo ""
    echo "🎉 Your database is now clean and ready for fresh data!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Clear storage buckets manually in Supabase Dashboard:"
    echo "      - assets (user media)"
    echo "      - avatars (profile pictures)"
    echo "      - business-documents (business docs)"
    echo "      - bug-screenshots (bug reports)"
    echo "   2. Test user signup to verify everything works"
    echo "   3. Start fresh with new user data"
    echo ""
    echo "🚀 TagMyThing is ready for a fresh start!"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "🔍 Common issues:"
    echo "   - Make sure you're connected to the right Supabase project"
    echo "   - Check if your database is accessible"
    echo "   - Verify your Supabase credentials"
    echo ""
    echo "📋 Manual fallback:"
    echo "   Apply the migration manually via Supabase Dashboard SQL Editor"
    exit 1
fi