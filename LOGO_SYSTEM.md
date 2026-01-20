# TagMyThing Logo System

## Source of Truth

All logo assets are generated from the **single source of truth**:

```
assets/brand/tagmything-logo-master.svg
```

This SVG file is the master design. All PNG, favicon, and OG images are automatically generated from this file.

## Generated Assets

When you run `npm run generate:logos` or `npm run build`, the following assets are automatically generated in the `public/` directory:

### Favicons
- `favicon-16x16.png` - Browser tab favicon (small)
- `favicon-32x32.png` - Browser tab favicon (medium)
- `favicon-48x48.png` - Browser tab favicon (large)

### Apple Touch Icon
- `apple-touch-icon.png` (180x180) - iOS home screen icon

### Regular Logos
- `tagmything-logo-256.png` (256x256) - Small logo
- `tagmything-logo-512.png` (512x512) - Medium logo
- `tagmaithing.png` (512x512) - Legacy name for backward compatibility

### Social Media / OG Images
- `og-image.png` (1200x1200) - Optimized for Facebook, Twitter, LinkedIn
- `og-image-1920.png` (1920x1920) - High-resolution version

## Usage

### In HTML
Favicons and OG images are automatically referenced in `index.html`:

```html
<!-- Favicons -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- OG Image -->
<meta property="og:image" content="https://tagmything.com/og-image.png" />
```

### In React Components
All components use the legacy name for compatibility:

```tsx
<img src="/tagmaithing.png" alt="TagMyThing" />
```

This file is automatically regenerated from the SVG master on every build.

### In Cloudflare Worker
The worker injects the OG image dynamically:

```javascript
ogImage: "https://tagmything.com/og-image.png"
```

## Updating the Logo

To update the logo across the entire site:

1. **Edit the master SVG:**
   ```bash
   # Edit with your preferred vector editor
   open assets/brand/tagmything-logo-master.svg
   ```

2. **Regenerate all assets:**
   ```bash
   npm run generate:logos
   ```

3. **Test locally:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

The `build` command automatically runs `generate:logos` before building, so all assets are always up-to-date.

## Build Process

The logo generation is integrated into the build pipeline:

```json
{
  "scripts": {
    "generate:logos": "node scripts/generate-logos.js",
    "build": "npm run generate:logos && vite build"
  }
}
```

**Benefits:**
- ✅ Single source of truth (SVG)
- ✅ Automatic generation on build
- ✅ Consistent across all formats
- ✅ Optimized sizes for each use case
- ✅ No manual file copying

## Technical Details

### Script Location
`scripts/generate-logos.js`

### Dependencies
- `sharp` - High-performance image processing library

### Output Sizes
| Asset | Size | Use Case |
|-------|------|----------|
| favicon-16x16.png | 16×16 | Browser tab (small screens) |
| favicon-32x32.png | 32×32 | Browser tab (standard) |
| favicon-48x48.png | 48×48 | Browser tab (high DPI) |
| apple-touch-icon.png | 180×180 | iOS home screen |
| tagmything-logo-256.png | 256×256 | Small UI elements |
| tagmything-logo-512.png | 512×512 | Medium UI elements |
| tagmaithing.png | 512×512 | Legacy compatibility |
| og-image.png | 1200×1200 | Social media sharing |
| og-image-1920.png | 1920×1920 | High-res social media |

### File Sizes
All images are optimized PNG with transparent backgrounds:
- Favicon 16x16: ~0.6 KB
- Favicon 32x32: ~1.6 KB
- Apple Touch Icon: ~9.3 KB
- Logo 512x512: ~30 KB
- OG Image 1200x1200: ~88 KB

## Troubleshooting

### Assets not updating?
Run the generation script manually:
```bash
npm run generate:logos
```

### Need a different size?
Edit `scripts/generate-logos.js` and add a new configuration:
```javascript
{ name: 'custom-logo-500.png', size: 500, description: 'Custom 500x500' }
```

### Want to use a different format?
Modify the script to use `.jpeg()` or `.webp()` instead of `.png()`.

## Best Practices

1. **Always edit the SVG master** - Never manually edit generated PNG files
2. **Run generate:logos after SVG changes** - Ensure all assets are regenerated
3. **Commit generated files** - Include generated PNGs in version control for deployment
4. **Test social media** - Use Facebook Debugger and Twitter Card Validator to verify OG images

## Social Media Testing

After updating the logo:

1. **Facebook Debugger:** https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator:** https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/

Enter `https://tagmything.com` and click "Scrape Again" to see updated images.
