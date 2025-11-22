// src/lib/arweaveUploader.ts
import { TurboFactory } from '@ardrive/turbo-sdk';

// Encryption utilities for client-side encryption
export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey('raw', key);
  const exportedKeyBuffer = new Uint8Array(exported);
  return btoa(String.fromCharCode(...exportedKeyBuffer));
};

export const importKey = async (keyString: string): Promise<CryptoKey> => {
  const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptData = async (data: Blob, key: CryptoKey): Promise<{ encrypted: Blob; iv: string }> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const arrayBuffer = await data.arrayBuffer();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );

  return {
    encrypted: new Blob([encrypted]),
    iv: btoa(String.fromCharCode(...iv))
  };
};

export const decryptData = async (encryptedBlob: Blob, key: CryptoKey, ivString: string): Promise<Blob> => {
  const iv = Uint8Array.from(atob(ivString), c => c.charCodeAt(0));
  const encryptedBuffer = await encryptedBlob.arrayBuffer();
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBuffer
  );

  return new Blob([decrypted]);
};

// Image compression utility
export const compressImage = async (
  file: Blob,
  maxSizeKB: number = 95 // Target under 100 KiB for free tier
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;
      let quality = 0.9;

      // Scale down if needed
      const maxDimension = 1920;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      // Try different quality levels to get under target size
      const tryCompress = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            const sizeKB = blob.size / 1024;
            
            if (sizeKB <= maxSizeKB || q <= 0.1) {
              resolve(blob);
            } else {
              // Reduce quality and try again
              tryCompress(q - 0.1);
            }
          },
          'image/jpeg',
          q
        );
      };

      tryCompress(quality);
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
};

// Calculate file size and estimate cost
export const calculateArweaveCost = async (fileSizeBytes: number): Promise<{
  sizeKB: number;
  isFree: boolean;
  estimatedCostAR: number;
  estimatedCostUSD: number;
}> => {
  const sizeKB = fileSizeBytes / 1024;
  const isFree = sizeKB < 100;

  // Approximate cost calculation (will be refined with actual Turbo API)
  // Current Arweave pricing is roughly $2-5 per GB, let's use $3/GB as baseline
  const costPerGB = 3; // USD
  const sizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  const estimatedCostUSD = isFree ? 0 : sizeGB * costPerGB;
  
  // Rough AR conversion (actual rate should be fetched from API)
  const arPriceUSD = 10; // Placeholder, should fetch current price
  const estimatedCostAR = estimatedCostUSD / arPriceUSD;

  return {
    sizeKB: Math.round(sizeKB * 100) / 100,
    isFree,
    estimatedCostAR: Math.round(estimatedCostAR * 1000000) / 1000000,
    estimatedCostUSD: Math.round(estimatedCostUSD * 100) / 100
  };
};

// Upload asset to Arweave using Turbo
export interface ArweaveUploadOptions {
  assetId: string;
  userId: string;
  title: string;
  description?: string;
  tags?: string[];
  mediaType: string;
  encrypted?: boolean;
  encryptionIV?: string;
}

export interface ArweaveUploadResult {
  success: boolean;
  transactionId?: string;
  dataItemId?: string;
  size: number;
  cost: {
    isFree: boolean;
    estimatedCostUSD: number;
  };
  error?: string;
}

export const uploadToArweave = async (
  file: Blob,
  options: ArweaveUploadOptions,
  onProgress?: (progress: number) => void
): Promise<ArweaveUploadResult> => {
  try {
    // Calculate cost first
    const costInfo = await calculateArweaveCost(file.size);

    // For now, use unauthenticated uploads (free for <100 KiB)
    // In production, you'd use authenticated uploads with your wallet
    const turbo = TurboFactory.unauthenticated();

    onProgress?.(10);

    // Create readable stream from blob
    const fileBuffer = await file.arrayBuffer();
    const fileUint8Array = new Uint8Array(fileBuffer);

    onProgress?.(30);

    // Prepare tags for Arweave
    const arweaveTags = [
      { name: 'Content-Type', value: options.mediaType },
      { name: 'App-Name', value: 'TagMyThing' },
      { name: 'App-Version', value: '1.0.0' },
      { name: 'Asset-ID', value: options.assetId },
      { name: 'User-ID', value: options.userId },
      { name: 'Title', value: options.title },
      ...(options.description ? [{ name: 'Description', value: options.description }] : []),
      ...(options.tags ? options.tags.map(tag => ({ name: 'Tag', value: tag })) : []),
      ...(options.encrypted ? [
        { name: 'Encrypted', value: 'true' },
        { name: 'Encryption-IV', value: options.encryptionIV || '' }
      ] : [])
    ];

    onProgress?.(50);

    // Upload to Arweave via Turbo
    // Note: Using uploadFile method from authenticated client
    // For production, replace with authenticated upload
    const uploadResult = await (turbo as any).uploadFile({
      fileStreamFactory: () => fileUint8Array,
      fileSizeFactory: () => file.size,
      dataItemOpts: {
        tags: arweaveTags
      }
    });

    onProgress?.(90);

    // Turbo returns the data item ID
    const dataItemId = uploadResult.id;

    onProgress?.(100);

    return {
      success: true,
      transactionId: dataItemId, // For compatibility with existing code
      dataItemId: dataItemId,
      size: file.size,
      cost: {
        isFree: costInfo.isFree,
        estimatedCostUSD: costInfo.estimatedCostUSD
      }
    };

  } catch (error: any) {
    console.error('Arweave upload error:', error);
    return {
      success: false,
      size: file.size,
      cost: {
        isFree: false,
        estimatedCostUSD: 0
      },
      error: error.message || 'Upload failed'
    };
  }
};

// Create manifest for bundling multiple assets
export interface ManifestAsset {
  id: string;
  path: string;
  dataItemId: string;
}

export const createArweaveManifest = async (
  assets: ManifestAsset[],
  manifestName: string = 'assets'
): Promise<{ success: boolean; manifestId?: string; error?: string }> => {
  try {
    const turbo = TurboFactory.unauthenticated();

    // Create manifest structure
    const manifest = {
      manifest: 'arweave/paths',
      version: '0.1.0',
      index: {
        path: 'index.html'
      },
      paths: assets.reduce((acc, asset) => {
        acc[asset.path] = {
          id: asset.dataItemId
        };
        return acc;
      }, {} as Record<string, { id: string }>)
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/x.arweave-manifest+json' });
    const manifestBuffer = await manifestBlob.arrayBuffer();

    const uploadResult = await (turbo as any).uploadFile({
      fileStreamFactory: () => new Uint8Array(manifestBuffer),
      fileSizeFactory: () => manifestBlob.size,
      dataItemOpts: {
        tags: [
          { name: 'Content-Type', value: 'application/x.arweave-manifest+json' },
          { name: 'App-Name', value: 'TagMyThing' },
          { name: 'Type', value: 'manifest' },
          { name: 'Manifest-Name', value: manifestName }
        ]
      }
    });

    return {
      success: true,
      manifestId: uploadResult.id
    };

  } catch (error: any) {
    console.error('Manifest creation error:', error);
    return {
      success: false,
      error: error.message || 'Manifest creation failed'
    };
  }
};

// Helper to get Arweave URL
export const getArweaveUrl = (transactionId: string): string => {
  return `https://arweave.net/${transactionId}`;
};

export const getViewBlockUrl = (transactionId: string): string => {
  return `https://viewblock.io/arweave/tx/${transactionId}`;
};

// Check Turbo balance (requires authenticated client)
export const getTurboBalance = async (walletAddress: string): Promise<{
  winc: string;
  usd: string;
} | null> => {
  try {
    const turbo = TurboFactory.unauthenticated();
    const balance = await turbo.getBalance(walletAddress);
    
    return {
      winc: balance.winc,
      usd: (parseFloat(balance.winc) / 1e12).toFixed(2) // Rough conversion
    };
  } catch (error) {
    console.error('Error fetching Turbo balance:', error);
    return null;
  }
};
