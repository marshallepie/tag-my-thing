#!/bin/bash
# Verify that your deployed Netlify site is using the new Supabase keys

echo "🔍 Verifying Deployed Supabase Keys"
echo "========================================"
echo ""

# Prompt for Netlify URL if not provided
if [ -z "$1" ]; then
    echo "Usage: ./verify-deployed-keys.sh <your-netlify-url>"
    echo "Example: ./verify-deployed-keys.sh https://tagmything.netlify.app"
    echo ""
    read -p "Enter your Netlify URL: " SITE_URL
else
    SITE_URL="$1"
fi

# Remove trailing slash
SITE_URL="${SITE_URL%/}"

echo "Checking: $SITE_URL"
echo ""

# Step 1: Fetch the main HTML
echo "📥 Step 1: Fetching site HTML..."
HTML_CONTENT=$(curl -s "$SITE_URL" 2>&1)

if [ -z "$HTML_CONTENT" ]; then
    echo "❌ Failed to fetch site. Check the URL and try again."
    exit 1
fi

echo "✅ Site is accessible"
echo ""

# Step 2: Extract main JS bundle filename
echo "📦 Step 2: Finding main JavaScript bundle..."
MAIN_JS=$(echo "$HTML_CONTENT" | grep -o 'assets/main-[a-zA-Z0-9_-]*\.js' | head -1)

if [ -z "$MAIN_JS" ]; then
    echo "❌ Could not find main JavaScript bundle"
    echo "The site structure might be different than expected."
    exit 1
fi

echo "✅ Found: $MAIN_JS"
echo ""

# Step 3: Download and check the bundle for keys
echo "🔑 Step 3: Checking for Supabase key format..."
JS_CONTENT=$(curl -s "$SITE_URL/$MAIN_JS" 2>&1)

# Check for new publishable key format
if echo "$JS_CONTENT" | grep -q "sb_publishable_"; then
    KEY_PREVIEW=$(echo "$JS_CONTENT" | grep -o "sb_publishable_[a-zA-Z0-9_]*" | head -1)
    echo "✅✅✅ SUCCESS! New publishable key detected!"
    echo ""
    echo "Key found: ${KEY_PREVIEW:0:30}..."
    echo ""
    echo "🎉 Your site is using the NEW Supabase key format!"
    echo "🎉 Login should now work without 'legacy keys disabled' error"
    echo ""

# Check for old JWT format
elif echo "$JS_CONTENT" | grep -q "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; then
    echo "❌❌❌ OLD JWT KEY DETECTED!"
    echo ""
    echo "Your deployed site is still using the legacy JWT key format."
    echo ""
    echo "This means either:"
    echo "  1. You haven't triggered a new deploy yet"
    echo "  2. The deploy didn't pick up the new environment variable"
    echo "  3. There's a caching issue"
    echo ""
    echo "🔧 To fix:"
    echo "  1. Go to Netlify Dashboard → Deploys"
    echo "  2. Click 'Clear cache and deploy site'"
    echo "  3. Wait for build to complete"
    echo "  4. Run this script again"
    echo ""

else
    echo "⚠️  Could not detect Supabase key format"
    echo ""
    echo "This could mean:"
    echo "  1. The key is in a different format"
    echo "  2. The key is in a different bundle"
    echo "  3. The build process uses a different structure"
    echo ""
    echo "🔍 Manual check:"
    echo "  1. Open $SITE_URL in your browser"
    echo "  2. Open DevTools (F12) → Network tab"
    echo "  3. Try to login"
    echo "  4. Look for requests to supabase.co"
    echo "  5. Check the 'apikey' header"
    echo ""
fi

# Step 4: Check for service role key (should NOT be present)
echo "🔒 Step 4: Checking for exposed secrets..."
if echo "$JS_CONTENT" | grep -q "service_role"; then
    echo "⚠️  WARNING: Possible service role key detected!"
    echo "This is a security risk. Check your build process."
else
    echo "✅ No service role keys found (good!)"
fi

echo ""
echo "========================================"
echo "Verification Complete"
echo ""
