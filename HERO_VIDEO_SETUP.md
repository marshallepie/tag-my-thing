# Hero Explainer Video Setup Guide

## Overview

The hero section now displays a language-specific explainer video that automatically selects based on user language detection (English or French).

## Features Implemented

✅ **Automatic language detection** - Uses existing i18n system
✅ **Side-by-side layout** - Text left, video right (non-negotiable)
✅ **Desktop behavior** - Autoplay, muted, loop, no controls
✅ **Mobile behavior** - Poster only, NO autoplay
✅ **Lazy loading** - Video loads only when in viewport
✅ **Responsive** - Vertical stack on mobile, side-by-side on desktop

## Setup Steps

### 1. Upload Videos to Cloudflare Stream

1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Stream** section
3. Upload your explainer videos:
   - English version
   - French version
4. Copy the **Video ID** for each (format: `abc123def456...`)

### 2. Create Poster Images

1. Extract or create poster/thumbnail images for each video
2. Place them in `/public/posters/`:
   ```
   /public/posters/explainer-en.jpg
   /public/posters/explainer-fr.jpg
   ```
3. Recommended dimensions: 1920x1080px or 16:9 aspect ratio
4. Optimize images for web (< 200KB recommended)

### 3. Configure Video IDs

Edit `/src/components/video/HeroExplainerVideo.tsx`:

```typescript
const VIDEO_CONFIG: Record<string, VideoConfig> = {
  en: {
    videoId: 'abc123def456...', // Your English video ID from Cloudflare
    posterUrl: '/posters/explainer-en.jpg'
  },
  fr: {
    videoId: 'xyz789ghi012...', // Your French video ID from Cloudflare
    posterUrl: '/posters/explainer-fr.jpg'
  }
};
```

### 4. Add Environment Variable

Add to your `.env` file:

```bash
VITE_CLOUDFLARE_CUSTOMER_CODE=your-customer-code-here
```

**To find your customer code:**
1. Go to Cloudflare Stream dashboard
2. Click on any video
3. Look at the embed URL: `https://customer-XXXXXXXX.cloudflarestream.com/...`
4. `XXXXXXXX` is your customer code

Alternatively, the video iframe URL will use your account subdomain automatically.

### 5. Test the Implementation

**Desktop/Tablet Testing:**
- [ ] Video autoplays on page load
- [ ] Video is muted
- [ ] Video loops continuously
- [ ] No player controls visible
- [ ] English video shows for English users
- [ ] French video shows for French users
- [ ] Video doesn't block LCP (lazy loaded)

**Mobile Testing:**
- [ ] Poster image shows instead of video
- [ ] No autoplay occurs
- [ ] Page loads quickly
- [ ] CTAs remain fully visible

**Responsive Testing:**
- [ ] Desktop: Side-by-side layout (text left, video right)
- [ ] Tablet: Side-by-side layout maintained
- [ ] Mobile: Vertical stack (text first, video second)

## Video Requirements

### Video Specifications
- **Format:** MP4 (H.264)
- **Duration:** 30-90 seconds recommended
- **Aspect Ratio:** 16:9 (1920x1080 or 1280x720)
- **File Size:** Cloudflare handles compression
- **Audio:** Must have audio track (even if not used on desktop)

### Content Guidelines
- Keep it focused on core value proposition
- Show, don't tell (visual demonstrations)
- No text overlays needed (description is in hero copy)
- Professional quality but not overly produced
- Respect Cloudflare Stream's terms of service

## Technical Details

### How It Works

1. **Language Detection:**
   - Uses existing `i18n.language` from react-i18next
   - Defaults to English if language not French

2. **Mobile Detection:**
   - Checks `window.innerWidth < 768`
   - Updates on window resize
   - Shows poster-only on mobile

3. **Lazy Loading:**
   - Uses Intersection Observer API
   - Loads video when hero is in viewport
   - 50px margin for pre-loading

4. **Desktop Playback:**
   - Cloudflare Stream iframe embed
   - URL params: `autoplay=true&muted=true&loop=true&controls=false`
   - Inline playback (no fullscreen)

### Performance Optimizations

- ✅ Lazy loading with Intersection Observer
- ✅ Poster image shown while video loads
- ✅ Mobile skips video entirely
- ✅ No impact on LCP (Largest Contentful Paint)
- ✅ Responsive images with proper aspect ratios

### Security & Privacy

- ✅ Cloudflare Stream handles all video delivery
- ✅ Videos can be restricted to specific domains
- ✅ No third-party tracking scripts
- ✅ GDPR compliant (no cookies for video playback)

## Troubleshooting

### Video Not Showing

**Check:**
1. Video IDs are correct in `HeroExplainerVideo.tsx`
2. Customer code in `.env` is correct
3. Videos are uploaded and processing is complete in Cloudflare
4. Browser console for any errors

### Video Not Autoplaying

**Common causes:**
- Browser autoplay policy (muted fixes this)
- Video not in viewport (lazy loading working correctly)
- Mobile device (expected behavior - poster only)

**Solution:** Videos must be muted for autoplay to work. Our implementation handles this correctly.

### Wrong Language Video

**Check:**
1. Language detection is working: `console.log(i18n.language)`
2. Video IDs are correctly mapped in `VIDEO_CONFIG`
3. Browser language settings

### Performance Issues

**If video affects page load:**
- Ensure lazy loading is working (check Intersection Observer)
- Verify poster images are optimized
- Consider preload optimization in Cloudflare Stream settings

## Customization

### Change Mobile Behavior

To enable tap-to-play on mobile, uncomment the overlay in `HeroExplainerVideo.tsx` and implement the play handler.

### Add More Languages

Add entries to `VIDEO_CONFIG`:

```typescript
const VIDEO_CONFIG: Record<string, VideoConfig> = {
  en: { ... },
  fr: { ... },
  es: {
    videoId: 'your-spanish-video-id',
    posterUrl: '/posters/explainer-es.jpg'
  }
};
```

### Adjust Layout Breakpoint

Change `lg:grid-cols-2` to `md:grid-cols-2` or `xl:grid-cols-2` in `Landing.tsx` to adjust when side-by-side layout kicks in.

## Maintenance

### Updating Videos

1. Upload new video to Cloudflare Stream
2. Update video ID in `HeroExplainerVideo.tsx`
3. Update poster image if changed
4. Test on all devices

### Analytics

Consider adding Cloudflare Stream Analytics to track:
- Video views
- Play rate
- Completion rate
- Device breakdown

## Support

If you encounter issues:
1. Check Cloudflare Stream dashboard for video status
2. Verify all configuration values
3. Test in multiple browsers
4. Check browser console for errors
5. Verify poster images are accessible

## Files Modified

- ✅ `/src/components/video/HeroExplainerVideo.tsx` (new)
- ✅ `/src/pages/Landing.tsx` (modified)
- ✅ `.env` (add `VITE_CLOUDFLARE_CUSTOMER_CODE`)
- ✅ `/public/posters/` (add poster images)
