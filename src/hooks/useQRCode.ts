// src/hooks/useQRCode.ts
import { useState, useEffect, useCallback } from 'react';
import { generateQRCode, generateBrandedQRCode, type QRCodeOptions } from '../utils/qrCode';

interface UseQRCodeOptions {
  /**
   * Automatically generate QR code when URL changes
   */
  autoGenerate?: boolean;
  /**
   * Use branded QR code with TagMyThing styling
   */
  useBranding?: boolean;
  /**
   * Custom QR code options
   */
  options?: QRCodeOptions;
  /**
   * Callback when QR code is generated successfully
   */
  onSuccess?: (dataUrl: string) => void;
  /**
   * Callback when QR code generation fails
   */
  onError?: (error: Error) => void;
}

interface UseQRCodeReturn {
  /**
   * Generated QR code data URL
   */
  qrCodeDataUrl: string | null;
  /**
   * Loading state
   */
  loading: boolean;
  /**
   * Error message if generation failed
   */
  error: string | null;
  /**
   * Generate QR code for the given URL
   */
  generateQRCodeForUrl: (url: string) => Promise<void>;
  /**
   * Clear the current QR code and reset state
   */
  clearQRCode: () => void;
  /**
   * Retry the last failed generation
   */
  retry: () => Promise<void>;
}

/**
 * Custom hook for managing QR code generation state
 * @param url - The URL to generate QR code for
 * @param options - Configuration options
 * @returns QR code state and control functions
 */
export const useQRCode = (
  url?: string,
  options: UseQRCodeOptions = {}
): UseQRCodeReturn => {
  const {
    autoGenerate = true,
    useBranding = false,
    options: qrOptions,
    onSuccess,
    onError
  } = options;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const generateQRCodeForUrl = useCallback(async (urlToGenerate: string) => {
    if (!urlToGenerate) {
      setError('No URL provided');
      return;
    }

    setLoading(true);
    setError(null);
    setLastUrl(urlToGenerate);

    try {
      console.log(`Generating ${useBranding ? 'branded' : 'standard'} QR code for:`, urlToGenerate);
      
      const dataUrl = useBranding 
        ? await generateBrandedQRCode(urlToGenerate)
        : await generateQRCode(urlToGenerate, qrOptions);
      
      setQrCodeDataUrl(dataUrl);
      console.log('QR code generated successfully');
      
      // Call success callback if provided
      onSuccess?.(dataUrl);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate QR code');
      console.error('QR code generation failed:', error);
      setError(error.message);
      setQrCodeDataUrl(null);
      
      // Call error callback if provided
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [useBranding, qrOptions, onSuccess, onError]);

  const clearQRCode = useCallback(() => {
    setQrCodeDataUrl(null);
    setError(null);
    setLastUrl(null);
    console.log('QR code state cleared');
  }, []);

  const retry = useCallback(async () => {
    if (lastUrl) {
      console.log('Retrying QR code generation for:', lastUrl);
      await generateQRCodeForUrl(lastUrl);
    } else {
      console.warn('No URL to retry QR code generation');
    }
  }, [lastUrl, generateQRCodeForUrl]);

  // Auto-generate QR code when URL changes (if enabled)
  useEffect(() => {
    if (autoGenerate && url && url !== lastUrl) {
      generateQRCodeForUrl(url);
    }
  }, [url, autoGenerate, lastUrl, generateQRCodeForUrl]);

  return {
    qrCodeDataUrl,
    loading,
    error,
    generateQRCodeForUrl,
    clearQRCode,
    retry
  };
};

/**
 * Specialized hook for referral QR codes with branded styling
 * @param referralUrl - The referral URL to generate QR code for
 * @returns QR code state optimized for referral links
 */
export const useReferralQRCode = (referralUrl?: string): UseQRCodeReturn => {
  return useQRCode(referralUrl, {
    autoGenerate: true,
    useBranding: true,
    onSuccess: (dataUrl) => {
      console.log('Referral QR code generated successfully');
    },
    onError: (error) => {
      console.error('Referral QR code generation failed:', error);
    }
  });
};

/**
 * Hook for batch QR code generation (multiple URLs)
 * @param urls - Array of URLs to generate QR codes for
 * @param options - Configuration options
 * @returns Batch QR code generation state
 */
export const useBatchQRCode = (
  urls: string[] = [],
  options: UseQRCodeOptions = {}
) => {
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });

  const generateBatch = useCallback(async () => {
    if (urls.length === 0) return;

    setLoading(true);
    setQrCodes({});
    setErrors({});
    setProgress({ completed: 0, total: urls.length });

    console.log(`Starting batch QR code generation for ${urls.length} URLs`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const dataUrl = options.useBranding 
          ? await generateBrandedQRCode(url)
          : await generateQRCode(url, options.options);
        
        setQrCodes(prev => ({ ...prev, [url]: dataUrl }));
        console.log(`Generated QR code ${i + 1}/${urls.length}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Generation failed';
        setErrors(prev => ({ ...prev, [url]: errorMessage }));
        console.error(`Failed to generate QR code for ${url}:`, error);
      }
      
      setProgress({ completed: i + 1, total: urls.length });
    }

    setLoading(false);
    console.log('Batch QR code generation completed');
  }, [urls, options.useBranding, options.options]);

  return {
    qrCodes,
    loading,
    errors,
    progress,
    generateBatch
  };
};