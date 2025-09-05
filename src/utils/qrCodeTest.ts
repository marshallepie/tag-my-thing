// src/utils/qrCodeTest.ts
/**
 * Test utilities for QR code generation
 * Used to verify QR code functionality works correctly
 */

import { 
  generateQRCode, 
  generateBrandedQRCode, 
  isValidQRUrl, 
  getRecommendedSize,
  type QRCodeOptions 
} from './qrCode';

/**
 * Test QR code generation with sample referral URLs
 */
export const testQRCodeGeneration = async (): Promise<void> => {
  console.log('🧪 Testing QR Code Generation...');
  
  const testUrls = [
    'https://tagmything.com/influencer-signup?ref=testcode123',
    'https://tagmything.com/general-tagging?ref=marshallepie',
    'https://tagmything.com/business-tagging?ref=longertestcode456'
  ];

  for (const url of testUrls) {
    try {
      console.log(`Testing URL: ${url}`);
      
      // Test URL validation
      const isValid = isValidQRUrl(url);
      console.log(`✅ URL validation: ${isValid}`);
      
      // Test size recommendation
      const recommendedSize = getRecommendedSize(url);
      console.log(`📏 Recommended size: ${recommendedSize}px`);
      
      // Test basic QR code generation
      const basicQR = await generateQRCode(url);
      console.log(`✅ Basic QR generated: ${basicQR.length} chars`);
      
      // Test branded QR code generation
      const brandedQR = await generateBrandedQRCode(url);
      console.log(`✅ Branded QR generated: ${brandedQR.length} chars`);
      
      console.log('---');
    } catch (error) {
      console.error(`❌ Error testing ${url}:`, error);
    }
  }
};

/**
 * Test QR code generation with different options
 */
export const testQRCodeOptions = async (): Promise<void> => {
  console.log('🎨 Testing QR Code Options...');
  
  const testUrl = 'https://tagmything.com/influencer-signup?ref=testcode';
  
  const optionTests: Array<{ name: string; options: QRCodeOptions }> = [
    {
      name: 'Small Size',
      options: { width: 150 }
    },
    {
      name: 'Large Size',
      options: { width: 400 }
    },
    {
      name: 'Custom Colors',
      options: { 
        color: { dark: '#1e40af', light: '#f0f9ff' },
        width: 256 
      }
    },
    {
      name: 'High Error Correction',
      options: { 
        errorCorrectionLevel: 'H',
        width: 256 
      }
    }
  ];

  for (const test of optionTests) {
    try {
      console.log(`Testing: ${test.name}`);
      const qrCode = await generateQRCode(testUrl, test.options);
      console.log(`✅ Generated ${test.name}: ${qrCode.length} chars`);
    } catch (error) {
      console.error(`❌ Error with ${test.name}:`, error);
    }
  }
};

/**
 * Create a visual test in the browser
 * This function creates a temporary div to display generated QR codes
 */
export const visualQRTest = async (referralUrl: string): Promise<void> => {
  console.log('👁️ Creating visual QR test...');
  
  try {
    // Create test container
    const testDiv = document.createElement('div');
    testDiv.id = 'qr-test-container';
    testDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      z-index: 10000;
      text-align: center;
      font-family: Arial, sans-serif;
    `;

    // Create title
    const title = document.createElement('h3');
    title.textContent = 'QR Code Test Results';
    title.style.margin = '0 0 20px 0';
    testDiv.appendChild(title);

    // Generate and display QR codes
    const qrCode = await generateQRCode(referralUrl);
    const brandedQR = await generateBrandedQRCode(referralUrl);

    // Basic QR Code
    const basicSection = document.createElement('div');
    basicSection.style.marginBottom = '20px';
    
    const basicTitle = document.createElement('h4');
    basicTitle.textContent = 'Basic QR Code';
    basicTitle.style.margin = '0 0 10px 0';
    basicSection.appendChild(basicTitle);
    
    const basicImg = document.createElement('img');
    basicImg.src = qrCode;
    basicImg.style.border = '1px solid #ddd';
    basicImg.style.borderRadius = '8px';
    basicSection.appendChild(basicImg);
    
    testDiv.appendChild(basicSection);

    // Branded QR Code
    const brandedSection = document.createElement('div');
    brandedSection.style.marginBottom = '20px';
    
    const brandedTitle = document.createElement('h4');
    brandedTitle.textContent = 'Branded QR Code';
    brandedTitle.style.margin = '0 0 10px 0';
    brandedSection.appendChild(brandedTitle);
    
    const brandedImg = document.createElement('img');
    brandedImg.src = brandedQR;
    brandedImg.style.border = '1px solid #ddd';
    brandedImg.style.borderRadius = '8px';
    brandedSection.appendChild(brandedImg);
    
    testDiv.appendChild(brandedSection);

    // URL display
    const urlDiv = document.createElement('div');
    urlDiv.style.cssText = `
      margin: 20px 0;
      padding: 10px;
      background: #f3f4f6;
      border-radius: 6px;
      word-break: break-all;
      font-size: 12px;
      color: #374151;
    `;
    urlDiv.textContent = referralUrl;
    testDiv.appendChild(urlDiv);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close Test';
    closeBtn.style.cssText = `
      background: #dc2626;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    `;
    closeBtn.onclick = () => document.body.removeChild(testDiv);
    testDiv.appendChild(closeBtn);

    // Add to page
    document.body.appendChild(testDiv);
    
    console.log('✅ Visual QR test created successfully');
  } catch (error) {
    console.error('❌ Visual QR test failed:', error);
  }
};

/**
 * Performance test for QR code generation
 */
export const performanceTest = async (url: string, iterations: number = 5): Promise<void> => {
  console.log(`⏱️ Performance testing ${iterations} QR code generations...`);
  
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    try {
      await generateQRCode(url);
      const endTime = performance.now();
      const duration = endTime - startTime;
      times.push(duration);
      console.log(`Generation ${i + 1}: ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error(`Generation ${i + 1} failed:`, error);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`📊 Performance Results:`);
    console.log(`   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime.toFixed(2)}ms`);
    console.log(`   Max: ${maxTime.toFixed(2)}ms`);
  }
};