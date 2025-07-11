import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CameraCapture } from '../components/tagging/CameraCapture';
import { TagAssetForm, AssetFormData } from '../components/tagging/TagAssetForm';
import { useAuth } from '../hooks/useAuth';
import { useTokens } from '../hooks/useTokens';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const TagAsset: React.FC = () => {
  const [step, setStep] = useState<'capture' | 'form'>('capture');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { spendTokens } = useTokens();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for post-signup asset saving
  useEffect(() => {
    console.log('TagAsset - useEffect triggered with:', {
      isAuthenticated,
      hasUser: !!user,
      locationSearch: location.search
    });
    
    const urlParams = new URLSearchParams(location.search);
    const fromTagging = urlParams.get('from') === 'tagging';
    console.log('TagAsset - URL params check:', { fromTagging });
    
    if (fromTagging && isAuthenticated && user) {
      console.log('TagAsset - Conditions met for post-signup save, calling handlePostSignupSave');
      handlePostSignupSave();
    } else {
      console.log('TagAsset - Conditions not met for post-signup save:', {
        fromTagging,
        isAuthenticated,
        hasUser: !!user
      });
    }
  }, [isAuthenticated, user, location]);

  const handleCapture = (file: File, type: 'photo' | 'video') => {
    setCapturedFile(file);
    setMediaType(type);
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

  const saveAsset = async (file: File, type: 'photo' | 'video', formData: AssetFormData) => {
    console.log('TagAsset - saveAsset called with:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      mediaType: type,
      formData,
      userId: user?.id
    });
    
    if (!user) return false;

    try {
      // Calculate token cost
      const mediaCost = type === 'photo' ? 3 : 5;
      const tagCost = 2;
      const totalCost = mediaCost + tagCost;
      console.log('TagAsset - Token cost calculated:', { mediaCost, tagCost, totalCost });

      // Check and spend tokens
      console.log('TagAsset - Attempting to spend tokens:', totalCost);
      const success = await spendTokens(totalCost, 'tag_asset', `Tagged asset: ${formData.title}`);
      console.log('TagAsset - spendTokens result:', success);
      if (!success) {
        console.log('TagAsset - Token spending failed');
        return false;
      }

      // Upload media file
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      console.log('TagAsset - Uploading file:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file);

      console.log('TagAsset - Upload result:', { uploadData, uploadError });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);
      console.log('TagAsset - Public URL:', publicUrl);

      // Create asset record
      const assetData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        media_url: publicUrl,
        media_type: type,
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
  };

  const handlePostSignupSave = async () => {
    console.log('TagAsset - handlePostSignupSave called');
    try {
      const savedMediaBase64 = sessionStorage.getItem('tagmything_pending_media');
      const savedMediaType = sessionStorage.getItem('tagmything_pending_media_type') as 'photo' | 'video';
      const savedFormData = sessionStorage.getItem('tagmything_pending_form_data');

      console.log('TagAsset - Retrieved from sessionStorage:', {
        hasMedia: !!savedMediaBase64,
        mediaType: savedMediaType,
        hasFormData: !!savedFormData,
        mediaLength: savedMediaBase64?.length || 0
      });

      if (savedMediaBase64 && savedMediaType && savedFormData) {
        console.log('TagAsset - All required data found, proceeding with save');
        setLoading(true);
        
        const formData: AssetFormData = JSON.parse(savedFormData);
        console.log('TagAsset - Parsed form data:', formData);
        
        const file = convertBase64ToFile(
          savedMediaBase64, 
          `asset.${savedMediaType === 'photo' ? 'jpg' : 'webm'}`,
          savedMediaType === 'photo' ? 'image/jpeg' : 'video/webm'
        );
        console.log('TagAsset - Converted base64 to file:', {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });

        console.log('TagAsset - Calling saveAsset with:', { file, savedMediaType, formData });
        const success = await saveAsset(file, savedMediaType, formData);
        console.log('TagAsset - saveAsset result:', success);
        
        if (success) {
          // Clear stored data
          console.log('TagAsset - Save successful, clearing sessionStorage');
          sessionStorage.removeItem('tagmything_pending_media');
          sessionStorage.removeItem('tagmything_pending_media_type');
          sessionStorage.removeItem('tagmything_pending_form_data');
          
          toast.success('Asset saved successfully!');
          navigate('/assets');
        } else {
          console.log('TagAsset - Save failed');
        }
      } else {
        console.log('TagAsset - Missing required data in sessionStorage');
      }
    } catch (error) {
      console.error('TagAsset - Error in post-signup save:', error);
      toast.error('Failed to save your asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData: AssetFormData) => {
    if (!capturedFile) return;

    console.log('TagAsset - handleFormSubmit called with:', { formData, capturedFile, mediaType, isAuthenticated, user: !!user });

    setLoading(true);

    try {
      if (!isAuthenticated || !user) {
        // User not authenticated - store data and redirect to signup
        console.log('TagAsset - User not authenticated, storing data for later');
        const base64Media = await convertFileToBase64(capturedFile);
        console.log('TagAsset - Converted file to base64, length:', base64Media.length);
        
        // Store in sessionStorage
        console.log('TagAsset - Storing in sessionStorage:', {
          mediaType,
          formDataKeys: Object.keys(formData),
          base64Length: base64Media.length
        });
        sessionStorage.setItem('tagmything_pending_media', base64Media);
        sessionStorage.setItem('tagmything_pending_media_type', mediaType);
        sessionStorage.setItem('tagmything_pending_form_data', JSON.stringify(formData));
        
        // Verify storage
        console.log('TagAsset - Verification - stored items:', {
          hasMedia: !!sessionStorage.getItem('tagmything_pending_media'),
          hasMediaType: !!sessionStorage.getItem('tagmything_pending_media_type'),
          hasFormData: !!sessionStorage.getItem('tagmything_pending_form_data')
        });
        
        toast.success('Asset captured! Please sign up to save it to your account.');
        
        // Redirect to signup with tracking parameters
        console.log('TagAsset - Redirecting to signup with params');
        navigate('/influencer-signup?redirect=/assets&from=tagging');
        return;
      }

      // User is authenticated - save directly
      console.log('TagAsset - User authenticated, saving directly');
      const success = await saveAsset(capturedFile, mediaType, formData);
      
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

  if (step === 'capture') {
    return (
      <CameraCapture
        onCapture={handleCapture}
        onCancel={() => navigate('/')}
      />
    );
  }

  if (step === 'form' && capturedFile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <TagAssetForm
          mediaFile={capturedFile}
          mediaType={mediaType}
          onSubmit={handleFormSubmit}
          onCancel={() => navigate('/dashboard')}
          loading={loading}
        />
      </div>
    );
  }

  return <Navigate to="/" replace />;
};