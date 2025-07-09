import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Lock, Globe, Users, Tag, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface TagAssetFormProps {
  mediaFile: File;
  mediaType: 'photo' | 'video';
  onSubmit: (formData: AssetFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface AssetFormData {
  title: string;
  description: string;
  tags: string[];
  privacy: 'private' | 'public';
  estimatedValue: number;
  location: string;
  assignNOK: boolean;
}

export const TagAssetForm: React.FC<TagAssetFormProps> = ({
  mediaFile,
  mediaType,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<AssetFormData>({
    title: '',
    description: '',
    tags: [],
    privacy: 'private',
    estimatedValue: 0,
    location: '',
    assignNOK: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string>('');

  React.useEffect(() => {
    // Create preview URL
    const url = URL.createObjectURL(mediaFile);
    setMediaPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof AssetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Media Preview */}
      <Card>
        <div className="text-center">
          {mediaType === 'photo' ? (
            <img
              src={mediaPreview}
              alt="Asset preview"
              className="w-full max-h-64 object-cover rounded-lg"
            />
          ) : (
            <video
              src={mediaPreview}
              controls
              className="w-full max-h-64 object-cover rounded-lg"
            />
          )}
        </div>
      </Card>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tag Your Asset
          </h2>

          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Give your asset a descriptive title"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add any additional details about this asset"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </motion.span>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add tags (press Enter)"
                icon={<Tag className="h-5 w-5 text-gray-400" />}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
          </div>

          <Input
            label="Estimated Value (£)"
            type="number"
            value={formData.estimatedValue || ''}
            onChange={(e) => handleChange('estimatedValue', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            icon={<DollarSign className="h-5 w-5 text-gray-400" />}
          />

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Where is this asset located?"
            icon={<MapPin className="h-5 w-5 text-gray-400" />}
          />

          {/* Privacy Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleChange('privacy', 'private')}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors
                  ${formData.privacy === 'private'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                <Lock className="h-4 w-4" />
                <span>Private</span>
              </button>
              <button
                type="button"
                onClick={() => handleChange('privacy', 'public')}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors
                  ${formData.privacy === 'public'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                <Globe className="h-4 w-4" />
                <span>Public</span>
              </button>
            </div>
          </div>

          {/* NOK Assignment */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Assign Next of Kin</h4>
                <p className="text-sm text-gray-600">
                  Allow someone to access this asset in the future
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleChange('assignNOK', !formData.assignNOK)}
              disabled={true} // Grayed out initially as per requirements
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${formData.assignNOK ? 'bg-primary-600' : 'bg-gray-300'}
                ${true ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${formData.assignNOK ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Token Cost */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-primary-50 border border-primary-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-primary-700 font-medium">Token Cost:</span>
              <span className="text-primary-800 font-bold">
                {mediaType === 'photo' ? '5 TMT' : '7 TMT'}
              </span>
            </div>
            <p className="text-sm text-primary-600 mt-1">
              2 TMT for tagging + {mediaType === 'photo' ? '3 TMT' : '5 TMT'} for media upload
            </p>
          </motion.div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Save Asset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};