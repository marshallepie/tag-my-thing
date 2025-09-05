// src/utils/qrCode.ts
/**
 * QR Code generation utilities for TagMyThing
 * Supports both client-side generation and API fallbacks
 */

/**
 * QR Code generation options
 */
export interface QRCodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
  type?: 'image/png' | 'image/jpeg';
  quality?: number;
}

/**
 * QR Code generation result for batch operations
 */
export interface QRCodeBatchResult {
  url: string;
  qrCode: string | null;
  error: string | null;
}

/**
 * Default QR code options
 */
export const defaultQROptions: Required<QRCodeOptions> = {
  width: 256,
  height: 256,
  margin: 4,
  errorCorrectionLevel: 'M',
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  type: 'image/png',
  quality: 0.92
};

/**
 * TagMyThing branded QR code options
 */
export const brandedQROptions: Required<QRCodeOptions> = {
  width: 300,
  height: 300,
  margin: 6,
  errorCorrectionLevel: 'H', // Higher error correction for branded codes
  color: {
    dark: '#1e40af', // Primary blue
    light: '#f8fafc'  // Light background
  },
  type: 'image/png',
  quality: 0.95
};

/**
 * Validate if a URL is suitable for QR code generation
 */
export const isValidQRUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check if it's a valid URL format
  try {
    new URL(url);
  } catch {
    return false;
  }

  // Check length - QR codes become less readable with very long URLs
  if (url.length > 2048) {
    console.warn('URL is very long and may create a complex QR code');
    return false;
  }

  // Check for invalid characters that might cause issues
  const invalidChars = ['<', '>', '"', '{', '}', '|', '\\', '^', '`'];
  if (invalidChars.some(char => url.includes(char))) {
    return false;
  }

  return true;
};

/**
 * Get recommended QR code size based on URL length
 */
export const getRecommendedSize = (url: string): number => {
  const length = url.length;
  
  if (length < 50) return 200;
  if (length < 100) return 256;
  if (length < 200) return 300;
  if (length < 500) return 350;
  return 400; // For very long URLs
};

/**
 * Load QR code library from CDN
 */
const loadQRCodeLibrary = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && (window as any).QRCode) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    script.async = true;
    script.onload = () => {
      console.log('QR Code library loaded successfully');
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load QR code library from CDN');
      reject(new Error('Failed to load QR code library'));
    };
    document.head.appendChild(script);
  });
};

/**
 * Generate QR code using client-side library
 */
const generateQRCodeClient = async (text: string, options: Required<QRCodeOptions>): Promise<string> => {
  await loadQRCodeLibrary();
  
  const QRCode = (window as any).QRCode;
  if (!QRCode) {
    throw new Error('QR Code library not available');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Create QR code model
  const qr = QRCode(0, options.errorCorrectionLevel);
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cellSize = Math.floor((options.width - options.margin * 2) / moduleCount);
  const qrSize = cellSize * moduleCount;
  
  canvas.width = qrSize + options.margin * 2;
  canvas.height = qrSize + options.margin * 2;

  // Fill background
  ctx.fillStyle = options.color.light ?? '#ffffff'; // Default to white if undefined
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = options.color.dark ?? '#000000'; // Default to black if undefined
  
  // Draw QR code modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        const x = options.margin + col * cellSize;
        const y = options.margin + row * cellSize;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  return canvas.toDataURL(options.type, options.quality);
};

/**
 * Generate QR code using API fallback
 */
const generateQRCodeAPI = async (text: string, options: Required<QRCodeOptions>): Promise<string> => {
  const size = options.width;
  const margin = options.margin;
  const errorLevel = options.errorCorrectionLevel.toLowerCase();
  
  // Build API URL
  const apiUrl = new URL('https://api.qrserver.com/v1/create-qr-code/');
  apiUrl.searchParams.set('data', text);
  apiUrl.searchParams.set('size', `${size}x${size}`);
  apiUrl.searchParams.set('margin', margin.toString());
  apiUrl.searchParams.set('ecc', errorLevel);
  apiUrl.searchParams.set('format', 'png');
  
  // Add colors if not default
  if ((options.color.dark ?? '#000000') !== '#000000') {
    const darkColor = (options.color.dark ?? '#000000').replace('#', '');
    apiUrl.searchParams.set('color', darkColor);
  }

  if ((options.color.light ?? '#FFFFFF') !== '#FFFFFF') {
    const lightColor = (options.color.light ?? '#FFFFFF').replace('#', '');
    apiUrl.searchParams.set('bgcolor', lightColor);
  }

  try {
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`QR API request failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read QR code blob'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('QR API generation failed:', error);
    throw error;
  }
};

/**
 * Create a placeholder QR code when all generation methods fail
 */
const createPlaceholderQR = (text: string, size: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, 0, size, size);

  // Draw text in the center
  ctx.fillStyle = '#1e293b'; // dark color for text
  ctx.font = `${Math.floor(size / 8)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);

  return canvas.toDataURL();
};

/**
 * Main QR code generation function
 */
export const generateQRCode = async (
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> => {
  // Validate input
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text provided for QR code generation');
  }

  if (!isValidQRUrl(text)) {
    throw new Error('Invalid URL provided for QR code generation');
  }

  const finalOptions = { ...defaultQROptions, ...options };
  
  console.log('Generating QR code for:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

  try {
    // Try client-side generation first
    return await generateQRCodeClient(text, finalOptions);
  } catch (clientError) {
    console.warn('Client-side QR generation failed, trying API fallback:', clientError);
    
    try {
      // Fallback to API generation
      return await generateQRCodeAPI(text, finalOptions);
    } catch (apiError) {
      console.error('API QR generation failed, using placeholder:', apiError);
      
      // Ultimate fallback to placeholder
      return createPlaceholderQR(text, finalOptions.width);
    }
  }
};

/**
 * Generate branded QR code with TagMyThing styling
 */
export const generateBrandedQRCode = async (text: string): Promise<string> => {
  console.log('Generating branded QR code for TagMyThing');
  
  try {
    // Use branded options
    const brandedCode = await generateQRCode(text, brandedQROptions);
    
    // TODO: Add logo overlay in future enhancement
    // For now, return the styled QR code
    return brandedCode;
  } catch (error) {
    console.error('Branded QR generation failed:', error);
    throw error;
  }
};

/**
 * Download QR code as PNG file
 */
export const downloadQRCode = (dataUrl: string, filename: string = 'qr-code.png'): void => {
  try {
    // Ensure filename has .png extension
    if (!filename.toLowerCase().endsWith('.png')) {
      filename += '.png';
    }

    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`QR code downloaded as: ${filename}`);
  } catch (error) {
    console.error('Failed to download QR code:', error);
    throw new Error('Download failed');
  }
};

/**
 * Convert QR code data URL to blob for sharing
 */
export const qrCodeToBlob = async (dataUrl: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

/**
 * Share QR code using Web Share API or clipboard
 */
export const shareQRCode = async (
  dataUrl: string, 
  title: string = 'QR Code',
  text: string = 'Check out this QR code!'
): Promise<void> => {
  try {
    if (navigator.share && navigator.canShare) {
      const blob = await qrCodeToBlob(dataUrl);
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });
      
      const shareData = {
        title,
        text,
        files: [file]
      };
      
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    }
    
    // Fallback: copy image to clipboard
    const blob = await qrCodeToBlob(dataUrl);
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    
    console.log('QR code copied to clipboard');
  } catch (error) {
    console.error('Failed to share QR code:', error);
    throw new Error('Sharing failed');
  }
};

/**
 * Batch generate QR codes for multiple URLs
 */
export const generateBatchQRCodes = async (
  urls: string[],
  options: QRCodeOptions = {}
): Promise<QRCodeBatchResult[]> => {
  console.log(`Generating ${urls.length} QR codes in batch`);
  
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const qrCode = await generateQRCode(url, options);
        return { url, qrCode, error: null };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Generation failed';
        return { url, qrCode: null, error: errorMessage };
      }
    })
  );
  
  return results.map((result) => 
    result.status === 'fulfilled' 
      ? result.value 
      : { url: '', qrCode: null, error: 'Promise rejected' }
  );
};

/**
 * Preload QR code library for better performance
 */
export const preloadQRCodeLibrary = async (): Promise<void> => {
  try {
    await loadQRCodeLibrary();
    console.log('QR Code library preloaded successfully');
  } catch (error) {
    console.warn('QR Code library preload failed:', error);
  }
};