import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Lock, Globe, Users, Tag, DollarSign, Image, Film, FileText, Coins, AlertCircle, CheckCircle, Trash2, Eye, Timer, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useNOKAssignments } from '../../hooks/useNOKAssignments';
import { calculateTokens, formatFileSize, formatDuration, type TokenCalculationResult } from '../../lib/tokenCalculator';
import toast from 'react-hot-toast';

interface MediaFile {
  file: File;
  type: 'photo' | 'video' | 'pdf';
  duration?: number;
  preview?: string;
}

interface TagAssetFormProps {
  mediaFiles: MediaFile[];
  onSubmit: (formData: AssetFormData, calculationResult: TokenCalculationResult) => void;
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
  selectedNOKId: string;
  dmsYears: number;
}

interface NextOfKin {
  id: string;
  name: string;
  email: string;
  relationship: string;
  status: 'pending' | 'verified' | 'declined';
}

export const TagAssetForm: React.FC<TagAssetFormProps> = ({
  mediaFiles,
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
    selectedNOKId: '',
    dmsYears: 1,
  });
  const [tagInput, setTagInput] = useState('');
  const [tokenCalculation, setTokenCalculation] = useState<TokenCalculationResult | null>(null);
  const [calculationLoading, setCalculationLoading] = useState(true);
  const [selectedMediaForPreview, setSelectedMediaForPreview] = useState<MediaFile | null>(null);
  const [nokList, setNokList] = useState<NextOfKin[]>([]);
  const [nokLoading, setNokLoading] = useState(false);

  const { user } = useAuth();
  const { assignNOKToAsset } = useNOKAssignments();

  // Calculate tokens when component mounts or media files change
  useEffect(() => {
    const calculateTokenCost = async () => {
      setCalculationLoading(true);
      try {
        const mediaItems = mediaFiles.map(file => ({
          file: file.file,
          type: file.type,
          duration: file.duration,
        }));
        
        const result = await calculateTokens(mediaItems);
        setTokenCalculation(result);
      } catch (error) {
        console.error('Error calculating tokens:', error);
      } finally {
        setCalculationLoading(false);
      }
    };

    if (mediaFiles.length > 0) {
      calculateTokenCost();
    }
  }, [mediaFiles]);

  // Fetch NOK list when component mounts
  useEffect(() => {
    const fetchNOKList = async () => {
      if (!user) return;

      setNokLoading(true);
      try {
        const { data, error } = await supabase
          .from('next_of_kin')
          .select('id, name, email, relationship, status')
          .eq('user_id', user.id)
          .eq('status', 'verified') // Only show verified NOKs for assignment
          .order('name');

        if (error) throw error;
        setNokList(data || []);
      } catch (error: any) {
        console.error('Error fetching NOK list:', error);
      } finally {
        setNokLoading(false);
      }
    };

    fetchNOKList();
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenCalculation) return;

    // If NOK assignment is enabled, validate selection
    if (formData.assignNOK && !formData.selectedNOKId) {
      toast.error('Please select a Next of Kin to assign this asset to');
      return;
    }

    onSubmit(formData, tokenCalculation);
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

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4" />;
      case 'video': return <Film className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const hasErrors = tokenCalculation?.errors.length > 0;
  const hasWarnings = tokenCalculation?.warnings.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Media Preview Grid */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaFiles.map((mediaFile, index) => (
            <div key={index} className="relative">
              <div 
                className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedMediaForPreview(mediaFile)}
              >
                {mediaFile.type === 'photo' ? (
                  <img
                    src={mediaFile.preview}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : mediaFile.type === 'video' ? (
                  <video
                    src={mediaFile.preview}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <FileText className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Media Type Badge */}
              <div className="absolute top-2 left-2">
                <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-xs flex items-center">
                  {getMediaIcon(mediaFile.type)}
                  <span className="ml-1 capitalize">{mediaFile.type}</span>
                </div>
              </div>

              {/* File Info */}
              <div className="mt-2 text-sm text-gray-600">
                <div className="font-medium truncate">{mediaFile.file.name}</div>
                <div className="flex items-center justify-between">
                  <span>{formatFileSize(mediaFile.file.size)}</span>
                  {mediaFile.duration && (
                    <span>{formatDuration(mediaFile.duration)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Token Calculation */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Coins className="h-5 w-5 mr-2 text-warning-600" />
            Token Cost Calculation
          </h3>
          {calculationLoading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          )}
        </div>

        {tokenCalculation && (
          <div className="space-y-4">
            {/* Errors */}
            {hasErrors && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-error-900 mb-2">Upload Errors</h4>
                    <ul className="space-y-1">
                      {tokenCalculation.errors.map((error, index) => (
                        <li key={index} className="text-sm text-error-700">• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {hasWarnings && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-warning-900 mb-2">Warnings</h4>
                    <ul className="space-y-1">
                      {tokenCalculation.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-warning-700">• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Token Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Photos */}
              {tokenCalculation.breakdown.photos.count > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Image className="h-5 w-5 text-primary-600" />
                    <span className="font-medium text-primary-900">Photos</span>
                  </div>
                  <div className="text-sm text-primary-700">
                    <div>{tokenCalculation.breakdown.photos.count} files</div>
                    <div className="font-semibold">{tokenCalculation.breakdown.photos.cost} TMT</div>
                  </div>
                </div>
              )}

              {/* Videos */}
              {tokenCalculation.breakdown.videos.count > 0 && (
                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Film className="h-5 w-5 text-secondary-600" />
                    <span className="font-medium text-secondary-900">Videos</span>
                  </div>
                  <div className="text-sm text-secondary-700">
                    <div>{tokenCalculation.breakdown.videos.count} files</div>
                    <div className="font-semibold">{tokenCalculation.breakdown.videos.cost} TMT</div>
                  </div>
                </div>
              )}

              {/* PDFs */}
              {tokenCalculation.breakdown.pdfs.count > 0 && (
                <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-5 w-5 text-accent-600" />
                    <span className="font-medium text-accent-900">Documents</span>
                  </div>
                  <div className="text-sm text-accent-700">
                    <div>{tokenCalculation.breakdown.pdfs.count} files</div>
                    <div className="font-semibold">{tokenCalculation.breakdown.pdfs.cost} TMT</div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Cost */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold mb-1">Total Token Cost</h4>
                  <p className="text-primary-100 text-sm">
                    {tokenCalculation.calculatedMediaItems.length} media files
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{tokenCalculation.totalTokens} TMT</div>
                  <div className="text-primary-100 text-sm">Required to save</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Asset Details Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Asset Details
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
              id="asset-description"
              name="description"
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
                name="tag-input"
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
            name="estimated-value"
            value={formData.estimatedValue || ''}
            onChange={(e) => handleChange('estimatedValue', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            icon={<DollarSign className="h-5 w-5 text-gray-400" />}
          />

          <Input
            label="Location"
            name="location"
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
                  Allow someone to access this asset with Dead Man's Switch protection
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleChange('assignNOK', !formData.assignNOK)}
              disabled={nokList.length === 0}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${formData.assignNOK ? 'bg-primary-600' : 'bg-gray-300'}
                ${nokList.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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

          {/* NOK Assignment Details */}
          {formData.assignNOK && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 bg-primary-50 border border-primary-200 rounded-lg"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Next of Kin *
                </label>
                {nokLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                ) : nokList.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-2">No verified Next of Kin available</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/nok', '_blank')}
                    >
                      Add Next of Kin
                    </Button>
                  </div>
                ) : (
                  <select
                    value={formData.selectedNOKId}
                    onChange={(e) => handleChange('selectedNOKId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required={formData.assignNOK}
                  >
                    <option value="">Choose Next of Kin</option>
                    {nokList.map(nok => (
                      <option key={nok.id} value={nok.id}>
                        {nok.name} ({nok.relationship})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dead Man's Switch Period
                </label>
                <select
                  value={formData.dmsYears}
                  onChange={(e) => handleChange('dmsYears', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>1 Year</option>
                  <option value={2}>2 Years</option>
                  <option value={3}>3 Years</option>
                  <option value={4}>4 Years</option>
                  <option value={5}>5 Years</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  If you don't log in for this period, your selected Next of Kin will gain access to this asset.
                </p>
              </div>

              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <div className="flex items-start">
                  <Timer className="h-4 w-4 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-xs text-warning-700">
                    <p className="font-medium mb-1">Privacy Protection</p>
                    <p>Your Next of Kin will only know they've been assigned without seeing asset details until the Dead Man's Switch is triggered.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
              disabled={hasErrors || calculationLoading || !tokenCalculation}
              className="flex-1"
            >
              {hasErrors ? 'Fix Errors to Continue' : 'Save Asset'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Media Preview Modal */}
      <Modal
        isOpen={!!selectedMediaForPreview}
        onClose={() => setSelectedMediaForPreview(null)}
        title={selectedMediaForPreview?.file.name || 'Media Preview'}
        size="xl"
      >
        {selectedMediaForPreview && (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {selectedMediaForPreview.type === 'photo' ? (
                <img
                  src={selectedMediaForPreview.preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : selectedMediaForPreview.type === 'video' ? (
                <video
                  src={selectedMediaForPreview.preview}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={selectedMediaForPreview.preview}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              )}
            </div>
            
            {/* File Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Type:</span>
                  <span className="ml-2 text-gray-600 capitalize">{selectedMediaForPreview.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Size:</span>
                  <span className="ml-2 text-gray-600">{formatFileSize(selectedMediaForPreview.file.size)}</span>
                </div>
                {selectedMediaForPreview.duration && (
                  <div>
                    <span className="font-medium text-gray-900">Duration:</span>
                    <span className="ml-2 text-gray-600">{formatDuration(selectedMediaForPreview.duration)}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="font-medium text-gray-900">Name:</span>
                  <span className="ml-2 text-gray-600">{selectedMediaForPreview.file.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};