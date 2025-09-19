import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Tag, Image as ImageIcon } from 'lucide-react';
import { useNews } from '../hooks/useNews';
import { NewsArticle, getArticlesByCategory, getNewsCategories } from '../lib/newsApi';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';

export const News: React.FC = () => {
  const { articles, loading, error } = useNews();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);

  // Load categories and set up filtering
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await getNewsCategories();
        setCategories(['All', ...cats]);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadData();
  }, []);

  // Filter articles by category
  React.useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article => article.news_category === selectedCategory);
      setFilteredArticles(filtered);
    }
  }, [articles, selectedCategory]);

  const handleReadMore = (article: NewsArticle) => {
    setSelectedArticle(article);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
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
            <p className="text-error-600">Failed to load news articles</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Latest News</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stay updated with the latest developments, features, and insights from TagMyThing
            </p>
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Articles Grid */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600">
                {selectedCategory === 'All' 
                  ? 'Check back soon for the latest news and updates!'
                  : `No articles found in "${selectedCategory}" category.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" hover>
                    <div className="p-0">
                      {/* Article Image */}
                      {article.image_url ? (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-gradient-to-br from-primary-500 to-secondary-500 rounded-t-lg flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-white opacity-50" />
                        </div>
                      )}

                      {/* Article Content */}
                      <div className="p-6">
                        {/* Category Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            <Tag className="h-3 w-3 mr-1" />
                            {article.news_category}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                          {article.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {article.content.substring(0, 150)}...
                        </p>

                        {/* Article Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {article.author?.full_name || 'TagMyThing Team'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(article.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>

                        {/* Read More Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReadMore(article)}
                          className="w-full"
                        >
                          Read More
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Article Reader Modal */}
          <Modal
            isOpen={!!selectedArticle}
            onClose={() => setSelectedArticle(null)}
            title={selectedArticle?.title || ''}
            size="xl"
          >
            {selectedArticle && (
              <div className="space-y-6">
                {/* Article Header */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      <Tag className="h-3 w-3 mr-1" />
                      {selectedArticle.news_category}
                    </span>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {selectedArticle.title}
                  </h1>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {selectedArticle.author?.full_name || 'TagMyThing Team'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(selectedArticle.created_at), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>

                {/* Article Image */}
                {selectedArticle.image_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg">
                    <img
                      src={selectedArticle.image_url}
                      alt={selectedArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Article Content */}
                <div className="prose prose-gray max-w-none">
                  {selectedArticle.content.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    )
                  ))}
                </div>
              </div>
            )}
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};