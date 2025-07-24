export interface MediaItem {
  file: File;
  type: 'photo' | 'video' | 'pdf';
  duration?: number; // in seconds, for videos
}

export interface CalculatedMediaItem {
  file: File;
  type: 'photo' | 'video' | 'pdf';
  duration?: number;
  token_cost: number;
  size?: number; // in bytes
  url?: string; // Preview URL for display
}

export interface TokenCalculationResult {
  totalTokens: number;
  breakdown: {
    photos: { count: number; cost: number };
    videos: { count: number; cost: number };
    pdfs: { count: number; cost: number };
  };
  calculatedMediaItems: CalculatedMediaItem[];
  errors: string[];
  warnings: string[];
}

// Constants for token pricing and limits
export const TOKEN_PRICING = {
  PHOTO_FIRST: 25,
  PHOTO_SUBSEQUENT: 12.5,
  VIDEO_60S: 60,
  VIDEO_120S: 110,
  PDF_FIRST: 25,
  PDF_SUBSEQUENT: 12.5,
} as const;

export const LIMITS = {
  MAX_VIDEOS: 2,
  MAX_VIDEO_DURATION_SECONDS: 120,
  MAX_VIDEO_FILE_SIZE_MB: 60,
  MAX_PDF_FILE_SIZE_MB: 2,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
  SUPPORTED_PDF_TYPES: ['application/pdf'],
} as const;

export const calculateTokens = async (mediaItems: MediaItem[]): Promise<TokenCalculationResult> => {
  let totalTokens = 0;
  const breakdown = {
    photos: { count: 0, cost: 0 },
    videos: { count: 0, cost: 0 },
    pdfs: { count: 0, cost: 0 },
  };
  const calculatedMediaItems: CalculatedMediaItem[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  let photoCount = 0;
  let videoCount = 0;
  let pdfCount = 0;

  // Validate file types first
  for (const item of mediaItems) {
    const isValidType = 
      (item.type === 'photo' && LIMITS.SUPPORTED_IMAGE_TYPES.includes(item.file.type)) ||
      (item.type === 'video' && LIMITS.SUPPORTED_VIDEO_TYPES.includes(item.file.type)) ||
      (item.type === 'pdf' && LIMITS.SUPPORTED_PDF_TYPES.includes(item.file.type));

    if (!isValidType) {
      errors.push(`File "${item.file.name}" has unsupported type: ${item.file.type}`);
    }
  }

  // Process media items in order to apply "first" vs "subsequent" pricing
  for (const item of mediaItems) {
    let itemTokenCost = 0;
    const fileSizeMB = item.file.size / (1024 * 1024);

    // Skip invalid file types
    const isValidType = 
      (item.type === 'photo' && LIMITS.SUPPORTED_IMAGE_TYPES.includes(item.file.type)) ||
      (item.type === 'video' && LIMITS.SUPPORTED_VIDEO_TYPES.includes(item.file.type)) ||
      (item.type === 'pdf' && LIMITS.SUPPORTED_PDF_TYPES.includes(item.file.type));

    if (!isValidType) {
      continue;
    }

    switch (item.type) {
      case 'photo':
        photoCount++;
        itemTokenCost = photoCount === 1 ? TOKEN_PRICING.PHOTO_FIRST : TOKEN_PRICING.PHOTO_SUBSEQUENT;
        
        // Add warning for large image files
        if (fileSizeMB > 10) {
          warnings.push(`Image "${item.file.name}" is ${fileSizeMB.toFixed(1)}MB. Consider compressing for faster upload.`);
        }
        break;

      case 'video':
        videoCount++;
        if (videoCount > LIMITS.MAX_VIDEOS) {
          errors.push(`Cannot upload more than ${LIMITS.MAX_VIDEOS} videos per asset.`);
          continue; // Skip this video
        }
        if (fileSizeMB > LIMITS.MAX_VIDEO_FILE_SIZE_MB) {
          errors.push(`Video "${item.file.name}" (${fileSizeMB.toFixed(1)}MB) exceeds maximum file size of ${LIMITS.MAX_VIDEO_FILE_SIZE_MB}MB.`);
          continue;
        }
        if (item.duration === undefined) {
          errors.push(`Video "${item.file.name}" duration could not be determined.`);
          continue;
        }
        if (item.duration > LIMITS.MAX_VIDEO_DURATION_SECONDS) {
          errors.push(`Video "${item.file.name}" (${Math.round(item.duration)}s) exceeds maximum duration of ${LIMITS.MAX_VIDEO_DURATION_SECONDS} seconds.`);
          continue;
        }
        
        itemTokenCost = item.duration <= 60 ? TOKEN_PRICING.VIDEO_60S : TOKEN_PRICING.VIDEO_120S;
        break;

      case 'pdf':
        pdfCount++;
        if (fileSizeMB > LIMITS.MAX_PDF_FILE_SIZE_MB) {
          errors.push(`PDF "${item.file.name}" (${fileSizeMB.toFixed(1)}MB) exceeds maximum file size of ${LIMITS.MAX_PDF_FILE_SIZE_MB}MB.`);
          continue;
        }
        itemTokenCost = pdfCount === 1 ? TOKEN_PRICING.PDF_FIRST : TOKEN_PRICING.PDF_SUBSEQUENT;
        break;
    }

    totalTokens += itemTokenCost;
    
    // Use explicit type checking to avoid TypeError
    if (item.type === 'photo') {
      breakdown.photos.count++;
      breakdown.photos.cost += itemTokenCost;
    } else if (item.type === 'video') {
      breakdown.videos.count++;
      breakdown.videos.cost += itemTokenCost;
    } else if (item.type === 'pdf') {
      breakdown.pdfs.count++;
      breakdown.pdfs.cost += itemTokenCost;
    }

    calculatedMediaItems.push({
      ...item,
      token_cost: itemTokenCost,
      size: item.file.size,
    });
  }

  return {
    totalTokens: Math.ceil(totalTokens), // Round up total tokens
    breakdown,
    calculatedMediaItems,
    errors,
    warnings,
  };
};

// Helper to get video duration (client-side only)
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const cleanup = () => {
      if (video.src) {
        URL.revokeObjectURL(video.src);
      }
    };

    video.onloadedmetadata = () => {
      cleanup();
      resolve(video.duration);
    };
    
    video.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load video metadata for ${file.name}`));
    };

    // Set timeout to prevent hanging
    setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout loading video metadata for ${file.name}`));
    }, 10000); // 10 second timeout

    video.src = URL.createObjectURL(file);
  });
};

// Helper to determine media type from file
export const getMediaTypeFromFile = (file: File): 'photo' | 'video' | 'pdf' | null => {
  if (LIMITS.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return 'photo';
  }
  if (LIMITS.SUPPORTED_VIDEO_TYPES.includes(file.type)) {
    return 'video';
  }
  if (LIMITS.SUPPORTED_PDF_TYPES.includes(file.type)) {
    return 'pdf';
  }
  return null;
};

// Helper to format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to format duration for display
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Validation helper for all media items
export const validateMediaItems = async (files: File[]): Promise<{
  validItems: MediaItem[];
  errors: string[];
}> => {
  const validItems: MediaItem[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const mediaType = getMediaTypeFromFile(file);
    
    if (!mediaType) {
      errors.push(`File "${file.name}" has unsupported type: ${file.type}`);
      continue;
    }

    const mediaItem: MediaItem = {
      file,
      type: mediaType,
    };

    // Get duration for videos
    if (mediaType === 'video') {
      try {
        mediaItem.duration = await getVideoDuration(file);
      } catch (error) {
        errors.push(`Could not determine duration for video "${file.name}"`);
        continue;
      }
    }

    validItems.push(mediaItem);
  }

  return { validItems, errors };
};