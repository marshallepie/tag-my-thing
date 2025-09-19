import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, User } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { useAuth } from '../hooks/useAuth';
import { NewsArticle, deleteArticle, updateArticle } from '../lib/newsApi';
import { ArticleEditor } from '../components/news/ArticleEditor';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const NewsManagement: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { articles, loading, error, refreshArticles } = useNews();
  const { user } = useAuth();

  const handleCreateNew = () => {
    setEditingArticle(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingArticle(null);
    refreshArticles();
  };

  const handleTogglePublish = async (article: NewsArticle) => {
    try {
      await updateArticle(article.id, {
        is_published: !article.is_published
      });
      toast.success(`Article ${article.is_published ? 'unpublished' : 'published'} successfully`);
      refreshArticles();
    } catch (error: any) {
      toast.error('Failed to update article status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id);
      toast.success('Article deleted successfully');
      refreshArticles();
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error('Failed to delete article');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-error-600">Error: {error}</p>
            <Button onClick={refreshArticles} className="mt-4">Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute requiresAdmin>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">News Management</h1>
              <p className="text-gray-600 mt-1">
                Create and manage news articles for your users
              </p>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Article
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Eye className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {articles.filter(a => a.is_published).length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <EyeOff className="h-6 w-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {articles.filter(a => !a.is_published).length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-secondary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Articles</p>
                  <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Articles List */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Articles</h2>
            </div>
            
            {articles.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
                <p className="text-gray-600 mb-4">Create your first news article to get started.</p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Article
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {article.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            article.is_published
                              ? 'bg-success-100 text-success-800'
                              : 'bg-warning-100 text-warning-800'
                          }`}>
                            {article.is_published ? 'Published' : 'Draft'}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {article.news_category}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.content.substring(0, 200)}...
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {article.author?.full_name || 'Unknown Author'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(article.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(article)}
                          className="text-gray-600 hover:text-primary-600"
                        >
                          {article.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(article)}
                          className="text-gray-600 hover:text-secondary-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(article.id)}
                          className="text-gray-600 hover:text-error-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Article Editor Modal */}
          <ArticleEditor
            isOpen={isEditorOpen}
            onClose={handleCloseEditor}
            article={editingArticle}
            authorId={user?.id || ''}
          />

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            title="Delete Article"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete this article? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                  className="flex-1"
                >
                  Delete Article
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};