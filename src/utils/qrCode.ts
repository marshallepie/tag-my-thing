
/**
 * Generate QR code as data URL for referral links
 * Uses qrcode.js library loaded from CDN
 * @param text - The referral URL to encode
 * @param options - QR code generation options
 * @returns Promise<string> - Data URL of the QR code image
 */
export const generateQRCode = async (
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> => {
  const finalOptions = { ...defaultQROptions, ...options };
  
  try {
    // Load qrcode library dynamically from CDN if not already loaded
    if (typeof window !== 'undefined' && !(window as any).QRCode) {
      await loadQRCodeLibrary();
    }

    // Use the loaded QRCode library
    const QRCode = (window as any).QRCode;
    if (!QRCode) {
      throw new Error('QR Code library not available');
    }

    // Generate QR code with the library
    const canvas = document.createElement('canvas');
    const qr = new QRCode.QRCodeModel(0, finalOptions.errorCorrectionLevel || 'M');
    qr.addData(text);
    qr.make();

    // Draw QR code on canvas
    const cellSize = Math.floor((finalOptions.width || 256) / qr.getModuleCount());
    const size = cellSize * qr.getModuleCount();
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Fill background
    ctx.fillStyle = finalOptions.color?.light || '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Draw QR code modules
    ctx.fillStyle = finalOptions.color?.dark || '#000000';
    for (let row = 0; row < qr.getModuleCount(); row++) {
      for (let col = 0; col < qr.getModuleCount(); col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    return canvas.toDataURL();
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Fallback to API-based QR code generation
    return generateQRCodeFallback(text, finalOptions);
  }
};

/**
 * Load QR code library from CDN
 */
const loadQRCodeLibrary = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).QRCode) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load QR code library'));
    document.head.appendChild(script);
  });
};

/**
 * Fallback QR code generation using API
 * @param text - Text to encode
 * @param options - QR code options
 * @returns Promise<string> - Data URL of QR code
 */
const generateQRCodeFallback = async (
  text: string, 
  options: QRCodeOptions
): Promise<string> => {
  const size = options.width || 256;
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('QR API request failed');
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('QR code fallback failed:', error);
    // Ultimate fallback - create a simple placeholder
    return createPlaceholderQR(text, size);
  }
};

/**
 * Create a placeholder QR code when all else fails
 * @param text - Text to display
 * @param size - Canvas size
 * @returns string - Data URL of placeholder
 */
const createPlaceholderQR = (text: string, size: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw border
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, size, size);
  
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  // Draw QR-like pattern
  ctx.fillStyle = '#374151';
  const cellSize = size / 20;
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }

  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(size * 0.2, size * 0.4, size * 0.6, size * 0.2);
  ctx.fillStyle = '#374151';
  ctx.font = `${Math.floor(size * 0.04)}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('QR CODE', size / 2, size / 2);
  
  return canvas.toDataURL();
};