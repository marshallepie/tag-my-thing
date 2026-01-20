#!/usr/bin/env node

/**
 * Generate Logo Assets from SVG Source of Truth
 *
 * This script converts assets/brand/tagmything-logo-master.svg into multiple formats:
 * - Favicon sizes (16x16, 32x32, 48x48)
 * - Apple touch icon (180x180)
 * - Regular logo (256x256, 512x512)
 * - OG image for social media (1200x1200)
 *
 * Run: node scripts/generate-logos.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_SVG = path.join(__dirname, '../assets/brand/tagmything-logo-master.svg');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Logo configurations
const LOGO_CONFIGS = [
  // Favicons
  { name: 'favicon-16x16.png', size: 16, description: 'Favicon 16x16' },
  { name: 'favicon-32x32.png', size: 32, description: 'Favicon 32x32' },
  { name: 'favicon-48x48.png', size: 48, description: 'Favicon 48x48' },

  // Apple touch icon
  { name: 'apple-touch-icon.png', size: 180, description: 'Apple Touch Icon' },

  // Regular logos
  { name: 'tagmything-logo-256.png', size: 256, description: 'Logo 256x256' },
  { name: 'tagmything-logo-512.png', size: 512, description: 'Logo 512x512' },

  // Backward compatibility (replaces old tagmaithing.png)
  { name: 'tagmaithing.png', size: 512, description: 'Legacy logo name (512x512)' },

  // OG/Social media image (1200x1200 is recommended for Facebook, Twitter, LinkedIn)
  { name: 'og-image.png', size: 1200, description: 'Open Graph image (1200x1200)' },
  { name: 'og-image-1920.png', size: 1920, description: 'Open Graph image HD (1920x1920)' },
];

async function generateLogos() {
  console.log('🎨 Generating logo assets from SVG source of truth...\n');
  console.log(`Source: ${SOURCE_SVG}\n`);

  // Check if source SVG exists
  if (!fs.existsSync(SOURCE_SVG)) {
    console.error(`❌ Error: Source SVG not found at ${SOURCE_SVG}`);
    process.exit(1);
  }

  const results = [];

  for (const config of LOGO_CONFIGS) {
    try {
      const outputPath = path.join(PUBLIC_DIR, config.name);

      await sharp(SOURCE_SVG)
        .resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);

      console.log(`✅ ${config.description}`);
      console.log(`   Generated: ${config.name} (${sizeKB} KB)`);

      results.push({
        name: config.name,
        size: config.size,
        sizeKB,
        path: outputPath
      });
    } catch (error) {
      console.error(`❌ Error generating ${config.name}:`, error.message);
    }
  }

  console.log(`\n🎉 Successfully generated ${results.length}/${LOGO_CONFIGS.length} logo assets!`);
  console.log(`\nOutput directory: ${PUBLIC_DIR}`);

  // Show OG image info
  const ogImage = results.find(r => r.name === 'og-image.png');
  if (ogImage) {
    console.log(`\n📱 OG Image for social media:`);
    console.log(`   File: ${ogImage.name}`);
    console.log(`   Size: ${ogImage.size}x${ogImage.size}px`);
    console.log(`   Weight: ${ogImage.sizeKB} KB`);
    console.log(`   Ready to upload to Cloudflare Images!`);
  }

  return results;
}

// Run the script
generateLogos()
  .then(() => {
    console.log('\n✨ Logo generation complete!');
  })
  .catch(error => {
    console.error('\n❌ Logo generation failed:', error);
    process.exit(1);
  });
