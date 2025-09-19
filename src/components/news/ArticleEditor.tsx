import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Image as ImageIcon } from 'lucide-react';
import { NewsArticle, createArticle, updateArticle, getNewsCategories } from '../../lib/newsApi';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface ArticleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  article?: NewsArticle | null;
  authorId: string;
}

interface ArticleFormData {
  title: string;
  content: string;
  news_category: string;
  image_url: string;
  is_published: boolean;
}

const predefinedCategories = [
  'Company News',
  'Product Updates', 
  'Industry News',
  'Announcements',
  'Technical Updates',
  'General'
];

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  isOpen,
  onClose,
  article,
  authorId
}) => {
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    news_category: 'General',
    image_url: '',
    is_published: false
  });
  const [loading, setLoading] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Load existing categories and populate form
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      
      if (article) {
        setFormData({
          title: article.title,
          content: article.content,
          news_category: article.news_category,
          image_url: article.image_url || '',
          is_published: article.is_published
        });
      } else {
        setFormData({
          title: '',
          content: '',
          news_category: 'General',
          image_url: '',
          is_published: false
        });
      }
    }
  }, [isOpen, article]);

  const loadCategories = async () => {
    try {
      const categories = await getNewsCategories();
      setExistingCategories(categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    
    try {
      if (article) {
        // Update existing article
        await updateArticle(article.id, formData);
        toast.success('Article updated successfully');
      } else {
        // Create new article
        await createArticle({
          ...formData,
          author_id: authorId
        });
        toast.success('Article created successfully');
      }
      
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save article');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ArticleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get all available categories (predefined + existing)
  const allCategories = Array.from(new Set([...predefinedCategories, ...existingCategories])).sort();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={article ? 'Edit Article' : 'Create New Article'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Input
          label="Article Title *"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter article title..."
          required
        />

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.news_category}
            onChange={(e) => handleChange('news_category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            {allCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Image URL */}
        <div>
          <Input
            label="Image URL (Optional)"
            value={formData.image_url}
            onChange={(e) => handleChange('image_url', e.target.value)}
            placeholder="https://example.com/image.jpg"
            icon={<ImageIcon className="h-5 w-5 text-gray-400" />}
          />
          {formData.image_url && (
            <div className="mt-2">
              <img
                src={formData.image_url}
                alt="Preview"
                className="w-32 h-20 object-cover rounded border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Content *
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
          
          {showPreview ? (
            <Card className="p-4 min-h-[200px] bg-gray-50">
              <div className="prose prose-sm max-w-none">
                {formData.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Card>
          ) : (
            <textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Write your article content here..."
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          )}
        </div>

        {/* Publish Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Publication Status</h4>
            <p className="text-sm text-gray-600">
              {formData.is_published 
                ? 'This article will be visible to all users'
                : 'This article will be saved as a draft'
              }
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('is_published', !formData.is_published)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.is_published ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.is_published ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {article ? 'Update Article' : 'Create Article'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};