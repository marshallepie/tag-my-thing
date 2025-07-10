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
    const urlParams = new URLSearchParams(location.search);
    const fromTagging = urlParams.get('from') === 'tagging';
    
    if (fromTagging && isAuthenticated && user) {
      handlePostSignupSave();
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
    if (!user) return false;

    try {
      // Calculate token cost
      const mediaCost = type === 'photo' ? 3 : 5;
      const tagCost = 2;
      const totalCost = mediaCost + tagCost;

      // Check and spend tokens
      const success = await spendTokens(totalCost, 'tag_asset', `Tagged asset: ${formData.title}`);
      if (!success) {
        return false;
      }

      // Upload media file
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName);

      // Create asset record
      const { error: assetError } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          tags: formData.tags,
          media_url: publicUrl,
          media_type: type,
          privacy: formData.privacy,
          estimated_value: formData.estimatedValue,
          location: formData.location,
        });

      if (assetError) throw assetError;

      return true;
    } catch (error: any) {
      console.error('Error saving asset:', error);
      toast.error(error.message || 'Failed to save asset');
      return false;
    }
  };

  const handlePostSignupSave = async () => {
    try {
      const savedMediaBase64 = sessionStorage.getItem('tagmything_pending_media');
      const savedMediaType = sessionStorage.getItem('tagmything_pending_media_type') as 'photo' | 'video';
      const savedFormData = sessionStorage.getItem('tagmything_pending_form_data');

      if (savedMediaBase64 && savedMediaType && savedFormData) {
        setLoading(true);
        
        const formData: AssetFormData = JSON.parse(savedFormData);
        const file = convertBase64ToFile(
          savedMediaBase64, 
          `asset.${savedMediaType === 'photo' ? 'jpg' : 'webm'}`,
          savedMediaType === 'photo' ? 'image/jpeg' : 'video/webm'
        );

        const success = await saveAsset(file, savedMediaType, formData);
        
        if (success) {
          // Clear stored data
          sessionStorage.removeItem('tagmything_pending_media');
          sessionStorage.removeItem('tagmything_pending_media_type');
          sessionStorage.removeItem('tagmything_pending_form_data');
          
          toast.success('Asset saved successfully!');
          navigate('/assets');
        }
      }
    } catch (error) {
      console.error('Error in post-signup save:', error);
      toast.error('Failed to save your asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData: AssetFormData) => {
    if (!capturedFile) return;

    setLoading(true);

    try {
      if (!isAuthenticated || !user) {
        // User not authenticated - store data and redirect to signup
        const base64Media = await convertFileToBase64(capturedFile);
        
        // Store in sessionStorage
        sessionStorage.setItem('tagmything_pending_media', base64Media);
        sessionStorage.setItem('tagmything_pending_media_type', mediaType);
        sessionStorage.setItem('tagmything_pending_form_data', JSON.stringify(formData));
        
        toast.success('Asset captured! Please sign up to save it to your account.');
        
        // Redirect to signup with tracking parameters
        navigate('/influencer-signup?redirect=/assets&from=tagging');
        return;
      }

      // User is authenticated - save directly
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