#!/bin/bash
# Check what key is currently deployed on your site

echo "🔍 Checking currently deployed Supabase key..."
echo "================================================"

# Replace with your actual Netlify URL
NETLIFY_URL="https://tagmything.netlify.app"  # Update this!

echo "Fetching main JavaScript bundle from: $NETLIFY_URL"
echo ""

# Download the main JS file and search for Supabase keys
curl -s "$NETLIFY_URL" | grep -o 'assets/main-[a-zA-Z0-9_-]*.js' | head -1 > /tmp/main-js-file.txt

if [ -s /tmp/main-js-file.txt ]; then
    JS_FILE=$(cat /tmp/main-js-file.txt)
    echo "Found main bundle: $JS_FILE"
    echo ""
    
    # Check for key format in the bundle
    echo "Checking for Supabase key format..."
    
    if curl -s "$NETLIFY_URL/$JS_FILE" | grep -q "sb_publishable_"; then
        echo "✅ NEW KEY FORMAT DETECTED (sb_publishable_)"
        echo "Your site is using the new publishable key!"
    elif curl -s "$NETLIFY_URL/$JS_FILE" | grep -q "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; then
        echo "❌ OLD JWT KEY FORMAT DETECTED (eyJ...)"
        echo "Your site is still using the legacy JWT key!"
        echo ""
        echo "👉 You need to trigger a new deploy in Netlify"
    else
        echo "⚠️  Could not detect Supabase key format"
        echo "The key might be in a different bundle or format"
    fi
else
    echo "❌ Could not find main JavaScript bundle"
    echo "Please check the URL and try again"
fi

echo ""
echo "================================================"
