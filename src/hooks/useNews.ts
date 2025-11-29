import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, getPublishedArticles, getAllArticles, getLocalizedArticles } from '../lib/newsApi';
import { useAuth } from './useAuth';

export const useNews = (userLanguage?: 'en' | 'fr') => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, isAuthenticated } = useAuth();

  const fetchArticles = useCallback(async () => {
    if (!isAuthenticated) {
      setArticles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let data: NewsArticle[];
      if (isAdmin) {
        // Admins see all articles without localization
        data = await getAllArticles();
      } else if (userLanguage) {
        // Regular users get localized articles
        data = await getLocalizedArticles(userLanguage);
      } else {
        // Fallback to standard published articles
        data = await getPublishedArticles();
      }
      
      setArticles(data);
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      setError(err.message || 'Failed to fetch articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isAuthenticated, userLanguage]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    articles,
    loading,
    error,
    refreshArticles: fetchArticles
  };
};