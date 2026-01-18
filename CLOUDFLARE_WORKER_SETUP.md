# Cloudflare Worker Setup Guide

This guide explains how to deploy the language-detection Cloudflare Worker that injects dynamic Open Graph tags based on URL parameters and geo-IP detection.

## What This Worker Does

The worker intercepts HTML requests and dynamically injects language-specific meta tags (OG tags) **before** the HTML reaches social media crawlers like Facebook, Twitter, LinkedIn, and WhatsApp.

### Detection Priority:
1. **URL Parameter** (highest): `?lang=fr` or `?lang=en`
2. **Geo-IP Detection**: Cloudflare's `CF-IPCountry` header
3. **Fallback**: English

### Supported Routes:
- Landing page (`/`)
- Auth pages (`/signup`, `/auth`)
- Feature pages (`/launch`, `/general-tagging`, `/nft-tagging`, etc.)

## Prerequisites

1. **Cloudflare Account** with your domain (tagmything.com) added
2. **Wrangler CLI** installed globally:
   ```bash
   npm install -g wrangler
   ```

3. **Cloudflare API Token** or login via:
   ```bash
   wrangler login
   ```

## Deployment Steps

### Step 1: Install Wrangler (if not already installed)

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate.

### Step 3: Deploy the Worker

```bash
# From the project root directory
wrangler deploy
```

This will:
- Upload `cloudflare-worker.js` to Cloudflare
- Create a worker named `tagmything-language-worker`
- Provide a `workers.dev` URL for testing

### Step 4: Configure Routes (Production)

After testing, you need to attach the worker to your domain:

#### Option A: Via Cloudflare Dashboard (Recommended)
1. Go to Cloudflare Dashboard → Workers & Pages
2. Click on `tagmything-language-worker`
3. Go to **Triggers** tab
4. Click **Add Route**
5. Add routes:
   - Route: `tagmything.com/*`
   - Zone: `tagmything.com`
   - Click **Save**

6. Repeat for www:
   - Route: `www.tagmything.com/*`
   - Zone: `tagmything.com`

#### Option B: Via wrangler.toml
1. Edit `wrangler.toml` and uncomment the routes section:
   ```toml
   routes = [
     { pattern = "tagmything.com/*", zone_name = "tagmything.com" },
     { pattern = "www.tagmything.com/*", zone_name = "tagmything.com" }
   ]
   ```

2. Deploy again:
   ```bash
   wrangler deploy
   ```

## Testing

### Test 1: Workers.dev URL (Development)

After initial deployment, you'll get a URL like:
```
https://tagmything-language-worker.<your-subdomain>.workers.dev
```

Test different scenarios:
```bash
# English (default)
curl -I https://tagmything-language-worker.<your-subdomain>.workers.dev

# French via URL param
curl -I https://tagmything-language-worker.<your-subdomain>.workers.dev?lang=fr

# Simulate French country
curl -I -H "CF-IPCountry: FR" https://tagmything-language-worker.<your-subdomain>.workers.dev
```

### Test 2: Facebook Debugger (Production)

After deploying to production routes:

1. Go to https://developers.facebook.com/tools/debug/
2. Test URLs:
   ```
   https://tagmything.com?lang=fr
   https://tagmything.com?lang=en
   https://tagmything.com/signup?lang=fr
   ```

3. Click **Scrape Again** to see updated OG tags

**Expected Results:**
- `?lang=fr` → French title, description, and OG tags
- `?lang=en` → English title, description, and OG tags
- No param from France → French tags (geo-detection)
- No param from UK → English tags (geo-detection)

### Test 3: Twitter Card Validator

1. Go to https://cards-dev.twitter.com/validator
2. Enter: `https://tagmything.com?lang=fr`
3. Verify French meta tags appear

### Test 4: LinkedIn Post Inspector

1. Go to https://www.linkedin.com/post-inspector/
2. Enter: `https://tagmything.com?lang=fr`
3. Verify French OG tags

### Test 5: WhatsApp Link Preview

1. Send yourself: `https://tagmything.com?lang=fr`
2. Verify French preview appears

## Monitoring

### View Logs

```bash
wrangler tail tagmything-language-worker
```

Then visit your site to see real-time logs showing:
```
Language from URL param: fr
Language from geo-IP (CM): fr
Language fallback: en
```

### View Analytics

1. Cloudflare Dashboard → Workers & Pages
2. Click on `tagmything-language-worker`
3. Go to **Metrics** tab
4. View requests, errors, CPU time

## Troubleshooting

### Issue: OG tags still showing English

**Solution:**
1. Check if routes are properly configured
2. Clear Facebook cache: https://developers.facebook.com/tools/debug/ → "Scrape Again"
3. Check worker logs: `wrangler tail tagmything-language-worker`

### Issue: Worker not deployed

**Solution:**
```bash
# Check worker status
wrangler whoami

# Redeploy
wrangler deploy --force
```

### Issue: Routes not working

**Solution:**
1. Verify domain is on Cloudflare (proxy enabled - orange cloud)
2. Check DNS settings in Cloudflare Dashboard
3. Verify routes in Workers & Pages → Triggers

### Issue: Geo-detection not working

**Solution:**
- Geo-detection only works in production (not localhost)
- Test with VPN to a French-speaking country
- Check `CF-IPCountry` header is present:
  ```bash
  curl -I https://tagmything.com | grep CF-IPCountry
  ```

## Updating the Worker

After making changes to `cloudflare-worker.js`:

```bash
wrangler deploy
```

Changes are deployed instantly (no build step needed).

## Performance Impact

- **Latency**: +2-5ms per request (negligible)
- **Cost**: Free tier covers 100,000 requests/day
- **Caching**: Cloudflare caches HTML, worker runs on cache misses
- **CPU Time**: ~1-2ms per request

## Rollback

If you need to disable the worker:

1. **Quick disable**: Go to Cloudflare Dashboard → Workers → Toggle off
2. **Remove routes**:
   ```bash
   # Comment out routes in wrangler.toml
   # wrangler deploy
   ```

## Support

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Community**: https://community.cloudflare.com/

## Summary

Once deployed and routes configured:
- ✅ Facebook Debugger shows French tags for `?lang=fr` URLs
- ✅ Twitter, LinkedIn, WhatsApp show correct language previews
- ✅ Geo-IP auto-detects French-speaking countries
- ✅ URL parameters always override geo-detection
- ✅ Works for all social media crawlers (no JavaScript required)
