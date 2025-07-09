import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CameraCapture } from '../components/tagging/CameraCapture';
import { TagAssetForm, AssetFormData } from '../components/tagging/TagAssetForm';
import { useAuth } from '../hooks/useAuth';
import { useTokens } from '../hooks/useTokens';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const TagAsset: React.FC = () => {
  const [step, setStep] = useState<'capture' | 'form' | 'auth-prompt'>('capture');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { spendTokens } = useTokens();
  const navigate = useNavigate();

  const handleCapture = (file: File, type: 'photo' | 'video') => {
    setCapturedFile(file);
    setMediaType(type);
    
    if (!isAuthenticated) {
      setStep('auth-prompt');
    } else {
      setStep('form');
    }
  };

  const handleFormSubmit = async (formData: AssetFormData) => {
    if (!capturedFile || !user) return;

    setLoading(true);

    try {
      // Calculate token cost
      const mediaCost = mediaType === 'photo' ? 3 : 5;
      const tagCost = 2;
      const totalCost = mediaCost + tagCost;

      // Check and spend tokens
      const success = await spendTokens(totalCost, 'tag_asset', `Tagged asset: ${formData.title}`);
      if (!success) {
        setLoading(false);
        return;
      }

      // Upload media file
      const fileExt = capturedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, capturedFile);

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
          media_type: mediaType,
          privacy: formData.privacy,
          estimated_value: formData.estimatedValue,
          location: formData.location,
        });

      if (assetError) throw assetError;

      toast.success('Asset tagged successfully!');
      navigate('/assets');
    } catch (error: any) {
      console.error('Error tagging asset:', error);
      toast.error(error.message || 'Failed to tag asset');
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

  if (step === 'auth-prompt' && capturedFile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Almost There!
          </h2>
          <p className="text-gray-600 mb-6">
            Create an account to save your asset and get 50 TMT tokens free!
          </p>
          
          {/* Preview */}
          <div className="mb-6">
            {mediaType === 'photo' ? (
              <img
                src={URL.createObjectURL(capturedFile)}
                alt="Captured asset"
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <video
                src={URL.createObjectURL(capturedFile)}
                className="w-full h-48 object-cover rounded-lg"
                controls
              />
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Create Account & Save Asset
            </button>
            <button
              onClick={() => setStep('capture')}
              className="w-full text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'form' && capturedFile && isAuthenticated) {
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