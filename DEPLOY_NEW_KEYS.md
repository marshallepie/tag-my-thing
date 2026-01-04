# Deploying New Supabase Keys to Netlify

## Why You Need to Redeploy

**Environment variables in Vite apps are embedded at BUILD TIME**, not runtime.

When Vite builds your app, it:
1. Reads `import.meta.env.VITE_SUPABASE_ANON_KEY` from environment variables
2. **Replaces it with the actual string value** in your JavaScript code
3. Bundles this hardcoded value into your `dist/assets/main-*.js` file

**Current Situation:**
- ❌ Your deployed site was built with the OLD JWT key
- ✅ Your Netlify environment variable is updated to the NEW publishable key
- ❌ But the OLD key is still in the deployed JavaScript bundle

**Solution:** Trigger a new build/deploy to rebuild with the new key.

---

## Step-by-Step: Deploy New Keys to Netlify

### Option 1: Trigger Deploy via Netlify Dashboard (Recommended)

1. **Log into Netlify Dashboard**
   - Go to https://app.netlify.com
   - Select your `tagmything` site

2. **Verify Environment Variable is Updated**
   - Go to **Site Settings** → **Environment Variables**
   - Find `VITE_SUPABASE_ANON_KEY`
   - Confirm it shows: `sb_publishable_WqtOOAvtF9nekf1uBP4Rog_sjIc6UD1`
   - If not, update it now

3. **Trigger a New Deploy**
   - Go to **Deploys** tab
   - Click **"Trigger deploy"** dropdown button
   - Select **"Deploy site"**
   - Wait for the build to complete (~2-3 minutes)

4. **Verify Deploy Succeeded**
   - Check the deploy log for "Build succeeded"
   - Note the new deploy URL (e.g., `deploy-preview-XXX`)

### Option 2: Push a Commit to Git

If your Netlify is connected to GitHub:

```bash
# Make a small change to trigger rebuild
git commit --allow-empty -m "chore: redeploy with new Supabase keys"
git push origin main
```

This will automatically trigger a Netlify deploy.

### Option 3: Use Netlify CLI

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site (first time only)
netlify link

# Trigger a new build
netlify deploy --prod --build
```

---

## After Deploy: Verify New Keys Are Active

### Method 1: Check Browser Console

1. Open your deployed site: https://your-site.netlify.app
2. Open browser DevTools (F12)
3. Go to **Network** tab
4. Try to login
5. Look for requests to `https://uylayywjytfztihrvogb.supabase.co/auth/v1/...`
6. Check the request headers for `apikey: sb_publishable_...`

### Method 2: Check JavaScript Bundle

Run this in your terminal:

```bash
# Check what key format is in your deployed site
curl -s https://your-site.netlify.app | grep -o 'assets/main-[^"]*\.js' | head -1 | xargs -I {} curl -s https://your-site.netlify.app/{} | grep -o "sb_publishable_[a-zA-Z0-9_]*"
```

If this outputs `sb_publishable_...`, you're good! ✅

If it outputs nothing or shows `eyJ...`, the old key is still there. ❌

### Method 3: Test Login

Simply try logging in:
- ✅ Success = New keys working
- ❌ "Legacy keys disabled" = Still using old keys (deploy didn't pick up the change)

---

## Common Issues & Troubleshooting

### Issue 1: "Legacy keys disabled" persists after deploy

**Causes:**
- Build cache is using old environment variables
- Environment variable not set at correct scope

**Fix:**
1. In Netlify Dashboard → **Site Settings** → **Environment Variables**
2. Make sure `VITE_SUPABASE_ANON_KEY` is set for **"All scopes"** or **"Production"**
3. Click **"Clear cache and deploy site"** from Deploys tab

### Issue 2: Build fails with environment variable errors

**Fix:**
1. Verify all required environment variables are set:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_PAYSTACK_PUBLIC_KEY
   VITE_GOOGLE_MAPS_API_KEY
   VITE_RESEND_API_KEY
   VITE_ARWEAVE_WALLET_KEY
   ```

2. Check build logs for specific missing variables

### Issue 3: Deploy succeeds but auth still fails

**Causes:**
- Supabase project has additional security settings
- New key not properly enabled in Supabase dashboard

**Fix:**
1. Go to Supabase Dashboard → **Settings** → **API**
2. Verify the new publishable key is listed and active
3. Check **Auth** → **URL Configuration** → ensure your Netlify URL is in redirect URLs

---

## Verification Checklist

After deploying, verify:

- [ ] Netlify deploy completed successfully (green checkmark)
- [ ] Build logs show no environment variable errors
- [ ] Can access the deployed site (no 404 errors)
- [ ] Login page loads without console errors
- [ ] Can successfully login/signup
- [ ] No "legacy keys disabled" error
- [ ] Browser console shows `apikey: sb_publishable_...` in network requests

---

## Environment Variables to Set in Netlify

**Required for Production:**

```bash
# Supabase
VITE_SUPABASE_URL=https://uylayywjytfztihrvogb.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_WqtOOAvtF9nekf1uBP4Rog_sjIc6UD1

# Payment (Production - use live keys!)
VITE_PAYSTACK_PUBLIC_KEY=pk_live_YOUR_LIVE_KEY
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_LIVE_KEY

# Services
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC994IYtLSC7X35hCuVIhpQ-iJCWKjz-_k
VITE_RESEND_API_KEY=re_39JqdYqg_f52Y6jAqnBWtijbdcVaUihxv
VITE_FROM_EMAIL=noreply@tagmything.com
VITE_ARWEAVE_WALLET_KEY={"d":"..."}

# Environment
VITE_ENVIRONMENT=production
```

**⚠️ Important:**
- Only `VITE_*` prefixed variables are accessible in frontend code
- Server-side keys (like `PAYSTACK_SECRET_KEY`) should be set in Supabase Edge Functions, NOT in Netlify frontend build

---

## Quick Command Reference

```bash
# Trigger deploy via empty commit
git commit --allow-empty -m "redeploy with new keys" && git push

# Clear Netlify cache and rebuild (via CLI)
netlify build --clear-cache && netlify deploy --prod

# Check deployed key format
curl -s https://your-site.netlify.app | grep "sb_publishable_"
```

---

**Next Steps:**
1. ✅ Update Netlify environment variables (you already did this)
2. ⏳ Trigger a new deploy (do this now!)
3. 🧪 Test login after deploy completes
4. ✅ Verify no "legacy keys disabled" error

Let me know once you've triggered the deploy!
