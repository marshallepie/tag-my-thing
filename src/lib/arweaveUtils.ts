/**
 * Arweave Utility Functions (Browser-Safe)
 * These utilities don't require Node.js or Turbo SDK dependencies
 */

/**
 * Generate Arweave gateway URL for a transaction
 */
export function getArweaveUrl(txId: string): string {
  return `https://arweave.net/${txId}`;
}

/**
 * Generate ViewBlock explorer URL for better UX
 */
export function getViewBlockUrl(txId: string): string {
  return `https://viewblock.io/arweave/tx/${txId}`;
}

/**
 * Validate Arweave transaction ID format
 */
export function isValidArweaveTxId(txId: string): boolean {
  // Arweave TX IDs are base64url encoded and 43 characters long
  return /^[a-zA-Z0-9_-]{43}$/.test(txId);
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate if file size qualifies for free tier (<100 KiB)
 */
export function isFreeTierEligible(sizeBytes: number): boolean {
  return sizeBytes < 102400; // 100 KiB = 102400 bytes
}
