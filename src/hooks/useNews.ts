import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, getPublishedArticles, getAllArticles } from '../lib/newsApi';
import { useAuth } from './useAuth';

export const useNews = () => {
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
      const data = isAdmin ? await getAllArticles() : await getPublishedArticles();
      setArticles(data);
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      setError(err.message || 'Failed to fetch articles');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isAuthenticated]);

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