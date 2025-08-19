import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CameraCapture } from '../components/tagging/CameraCapture';
import { TagAssetForm, AssetFormData } from '../components/tagging/TagAssetForm';
import { useAuth } from '../hooks/useAuth';
import { useTokens } from '../hooks/useTokens';
import { supabase } from '../lib/supabase';
import { type TokenCalculationResult } from '../lib/tokenCalculator';
import toast from 'react-hot-toast';

interface MediaFile {
  file: File;
  type: 'photo' | 'video' | 'pdf';
  duration?: number;
  preview?: string;
}

export const TagAsset: React.FC = () => {
  const [step, setStep] = useState<'capture' | 'form'>('capture');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [waitingForTokens, setWaitingForTokens] = useState(false);
  const [hasProcessedPendingAsset, setHasProcessedPendingAsset] = useState(false);
  const [isProcessingPendingAsset, setIsProcessingPendingAsset] = useState(false);
  const { isAuthenticated, user, hasProfile } = useAuth();
  const { spendTokens, balance, loading: tokensLoading } = useTokens();
  const navigate = useNavigate();
  const location = useLocation();

  const saveAsset = React.useCallback(async (
    files: MediaFile[], 
    formData: AssetFormData, 
    tokenCalculation: TokenCalculationResult
  ) => {
    console.log('TagAsset - saveAsset called with:', {
      fileCount: files.length,
      formData,
      totalTokens: tokenCalculation.totalTokens,
      userId: user?.id,
      currentBalance: balance
    });
    
    if (!user) return false;

    try {
      // Check and spend tokens
      console.log('TagAsset - Attempting to spend tokens:', tokenCalculation.totalTokens);
      const success = await spendTokens(
        tokenCalculation.totalTokens, 
        'tag_asset', 
        `Tagged asset: ${formData.title} (${files.length} media files)`
      );
      console.log('TagAsset - spendTokens result:', success);
      if (!success) {
        console.log('TagAsset - Token spending failed');
        return false;
      }

      // Upload all media files and build media_items array
      const mediaItems = [];
      
      for (let i = 0; i < files.length; i++) {
        const mediaFile = files[i];
        const calculatedItem = tokenCalculation.calculatedMediaItems[i];
        
        // Upload media file
        const fileExt = mediaFile.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;
        console.log('TagAsset - Uploading file:', fileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(fileName, mediaFile.file);

        console.log('TagAsset - Upload result:', { uploadData, uploadError });
        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(fileName);
        console.log('TagAsset - Public URL:', publicUrl);

        // Add to media_items array
        mediaItems.push({
          url: publicUrl,
          type: mediaFile.type,
          size: mediaFile.file.size,
          duration: mediaFile.duration,
          token_cost: calculatedItem.token_cost,
        });
      }

      // Create asset record with media_items
      const assetData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        media_items: mediaItems, // New field with all media
        privacy: formData.privacy,
        estimated_value: formData.estimatedValue,
        location: formData.location,
      };
      console.log('TagAsset - Creating asset record:', assetData);
      
      const { error: assetError } = await supabase
        .from('assets')
        .insert(assetData);

      console.log('TagAsset - Asset creation result:', { assetError });
      if (assetError) throw assetError;

      console.log('TagAsset - Asset saved successfully');
      return true;
    } catch (error: any) {
      console.error('TagAsset - Error saving asset:', error);
      toast.error(error.message || 'Failed to save asset');
      return false;
    }
  }, [user, balance, spendTokens]);

  const handlePostSignupSave = React.useCallback(async () => {
    console.log('TagAsset - handlePostSignupSave called', {
      hasProcessedPendingAsset,
      isProcessingPendingAsset,
      user: !!user,
      balance
    });
    
    // STRICT GATEKEEPER: Prevent any duplicate processing
    if (hasProcessedPendingAsset || isProcessingPendingAsset) {
      console.log('TagAsset - Already processed or currently processing pending asset, skipping');
      return;
    }
    
    // Set processing flag IMMEDIATELY to prevent re-entry
    setIsProcessingPendingAsset(true);
    
    try {
      const savedMediaData = sessionStorage.getItem('tagmything_pending_media_data');
      const savedFormData = sessionStorage.getItem('tagmything_pending_form_data');
      const savedTokenCalculation = sessionStorage.getItem('tagmything_pending_token_calculation');

      console.log('TagAsset - Retrieved from sessionStorage:', {
        hasMediaData: !!savedMediaData,
        hasFormData: !!savedFormData,
        hasTokenCalculation: !!savedTokenCalculation,
      });

      if (!savedMediaData || !savedFormData || !savedTokenCalculation) {
        console.log('TagAsset - Missing required data in sessionStorage');
        setHasProcessedPendingAsset(true);
        setIsProcessingPendingAsset(false);
        return;
      }

      // Mark as processed BEFORE starting the save operation
      setHasProcessedPendingAsset(true);
      
      console.log('TagAsset - All required data found, proceeding with save');
      setLoading(true);
      
      const mediaData: Array<{
        base64: string;
        type: 'photo' | 'video' | 'pdf';
        filename: string;
        mimeType: string;
        duration?: number;
      }> = JSON.parse(savedMediaData);
      
      const formData: AssetFormData = JSON.parse(savedFormData);
      const tokenCalculation: TokenCalculationResult = JSON.parse(savedTokenCalculation);
      
      console.log('TagAsset - Parsed data:', { 
        mediaCount: mediaData.length, 
        formData, 
        totalTokens: tokenCalculation.totalTokens,
        currentBalance: balance
      });
      
      // Convert base64 back to files
      const files: MediaFile[] = [];
      for (const media of mediaData) {
        const file = convertBase64ToFile(media.base64, media.filename, media.mimeType);
        files.push({
          file,
          type: media.type,
          duration: media.duration,
        });
      }

      console.log('TagAsset - Calling saveAsset with:', { files, formData, tokenCalculation });
      const success = await saveAsset(files, formData, tokenCalculation);
      console.log('TagAsset - saveAsset result:', success);
      
      if (success) {
        // Clear stored data immediately after successful save
        console.log('TagAsset - Save successful, clearing sessionStorage');
        sessionStorage.removeItem('tagmything_pending_media_data');
        sessionStorage.removeItem('tagmything_pending_form_data');
        sessionStorage.removeItem('tagmything_pending_token_calculation');
        
        toast.success('Asset saved successfully!');
        navigate('/assets');
      } else {
        console.log('TagAsset - Save failed, keeping data for potential retry');
        // Reset flags on failure to allow retry
        setHasProcessedPendingAsset(false);
      }
    } catch (error) {
      console.error('TagAsset - Error in post-signup save:', error);
      toast.error('Failed to save your asset. Please try again.');
      // Reset flags on error to allow retry
      setHasProcessedPendingAsset(false);
    } finally {
      setLoading(false);
      setIsProcessingPendingAsset(false);
    }
  }, [user, balance, saveAsset, hasProcessedPendingAsset, isProcessingPendingAsset, navigate]);

  // Check for post-signup asset saving
  useEffect(() => {
    console.log('TagAsset - useEffect triggered with:', {
      isAuthenticated,
      hasUser: !!user,
      locationSearch: location.search,
      tokensLoading,
      balance,
      waitingForTokens,
      hasProcessedPendingAsset,
      isProcessingPendingAsset
    });
    
    const urlParams = new URLSearchParams(location.search);
    const fromTagging = urlParams.get('from') === 'tagging';
    console.log('TagAsset - URL params check:', { fromTagging });
    
    // STRICT CONDITIONS: Only proceed if all conditions are met and not already processed/processing
    if (fromTagging && isAuthenticated && user && hasProfile && !hasProcessedPendingAsset && !isProcessingPendingAsset) {
      console.log('TagAsset - Conditions met for post-signup save, checking token status');
      
      // Check if we have pending data before proceeding
      const hasPendingData = !!(
        sessionStorage.getItem('tagmything_pending_media_data') &&
        sessionStorage.getItem('tagmything_pending_form_data') &&
        sessionStorage.getItem('tagmything_pending_token_calculation')
      );
      
      if (!hasPendingData) {
        console.log('TagAsset - No pending data found, marking as processed');
        setHasProcessedPendingAsset(true);
        return;
      }
      
      if (tokensLoading) {
        console.log('TagAsset - Tokens still loading, waiting...');
        setWaitingForTokens(true);
        return;
      }
      
      if (balance > 0) {
        console.log('TagAsset - Tokens available, proceeding with save');
        setWaitingForTokens(false);
        handlePostSignupSave();
      } else {
        console.log('TagAsset - No tokens available after signup, this is unexpected');
        toast.error('Token allocation failed. Please contact support.');
        // Clear pending data and redirect
        sessionStorage.removeItem('tagmything_pending_media_data');
        sessionStorage.removeItem('tagmything_pending_form_data');
        sessionStorage.removeItem('tagmything_pending_token_calculation');
        setHasProcessedPendingAsset(true);
        navigate('/dashboard');
      }
    } else {
      console.log('TagAsset - Conditions not met for post-signup save:', {
        fromTagging,
        isAuthenticated,
        hasUser: !!user,
        hasProfile,
        hasProcessedPendingAsset,
        isProcessingPendingAsset
      });
      setWaitingForTokens(false);
    }
  }, [isAuthenticated, user, location, tokensLoading, balance, hasProcessedPendingAsset, isProcessingPendingAsset, handlePostSignupSave, navigate]);

  const handleCapture = (files: MediaFile[]) => {
    setMediaFiles(files);
    setStep('form');
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const convertBase64ToFile = (base64: string, filename: string, mimeType: string): File => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  };

  const handleFormSubmit = async (formData: AssetFormData, tokenCalculation: TokenCalculationResult) => {
    console.log('TagAsset - handleFormSubmit called with:', { 
      formData, 
      tokenCalculation, 
      mediaFileCount: mediaFiles.length,
      isAuthenticated, 
      user: !!user 
    });

    setLoading(true);

    try {
      if (!isAuthenticated || !user) {
        // User not authenticated - store data and redirect to signup
        console.log('TagAsset - User not authenticated, storing data for later');
        
        // Convert files to base64 for storage
        const mediaData = [];
        for (const mediaFile of mediaFiles) {
          const base64 = await convertFileToBase64(mediaFile.file);
          mediaData.push({
            base64,
            type: mediaFile.type,
            filename: mediaFile.file.name,
            mimeType: mediaFile.file.type,
            duration: mediaFile.duration,
          });
        }
        
        console.log('TagAsset - Converted files to base64, storing in sessionStorage');
        
        // Store in sessionStorage
        sessionStorage.setItem('tagmything_pending_media_data', JSON.stringify(mediaData));
        sessionStorage.setItem('tagmything_pending_form_data', JSON.stringify(formData));
        sessionStorage.setItem('tagmything_pending_token_calculation', JSON.stringify(tokenCalculation));
        
        // Verify storage
        console.log('TagAsset - Verification - stored items:', {
          hasMediaData: !!sessionStorage.getItem('tagmything_pending_media_data'),
          hasFormData: !!sessionStorage.getItem('tagmything_pending_form_data'),
          hasTokenCalculation: !!sessionStorage.getItem('tagmything_pending_token_calculation'),
        });
        
        toast.success('Asset captured! Please sign up to save it to your account.');
        
        // Redirect to signup with tracking parameters
        console.log('TagAsset - Redirecting to signup with params');
        navigate('/influencer-signup?redirect=/tag&from=tagging');
        return;
      }

      // User is authenticated - save directly
      console.log('TagAsset - User authenticated, saving directly');
      const success = await saveAsset(mediaFiles, formData, tokenCalculation);
      
      if (success) {
        toast.success('Asset tagged successfully!');
        navigate('/assets');
      }
    } catch (error: any) {
      console.error('Error in form submit:', error);
      toast.error('Failed to process asset');
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while waiting for tokens after signup
  if (waitingForTokens) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your account...</h2>
          <p className="text-gray-600">Please wait while we prepare your free tokens</p>
        </div>
      </div>
    );
  }

  if (step === 'capture') {
    return (
      <CameraCapture
        onCapture={handleCapture}
        onCancel={() => {
          console.log('TagAsset: Camera capture cancelled');
          // If user is authenticated, go to dashboard; otherwise go to home
          if (isAuthenticated) {
            console.log('TagAsset: User authenticated, navigating to dashboard');
            navigate('/dashboard');
          } else {
            console.log('TagAsset: User not authenticated, navigating to home');
            navigate('/');
          }
        }}
      />
    );
  }

  if (step === 'form' && mediaFiles.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <TagAssetForm
          mediaFiles={mediaFiles}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            console.log('TagAsset: Form cancelled');
            // Clean up preview URLs to prevent memory leaks
            mediaFiles.forEach(file => {
              if (file.preview) {
                URL.revokeObjectURL(file.preview);
              }
            });
            setMediaFiles([]);
            
            // Navigate based on auth status
            if (isAuthenticated) {
              console.log('TagAsset: User authenticated, navigating to dashboard');
              navigate('/dashboard');
            } else {
              console.log('TagAsset: User not authenticated, navigating to home');
              navigate('/');
            }
          }}
          loading={loading || waitingForTokens}
        />
      </div>
    );
  }

  return <Navigate to="/" replace />;
};