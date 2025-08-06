import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Search, Filter, Image, Film, FileText, Calendar, User, Tag, MapPin, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Asset {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[];
  privacy: 'private' | 'public';
  estimated_value: number | null;
  location: string | null;
  created_at: string;
  media_items: Array<{
    url: string;
    type: 'photo' | 'video' | 'pdf';
    size?: number;
    duration?: number;
    token_cost: number;
  }> | null;
  user_profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

export const PublicAssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'user_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterMediaType, setFilterMediaType] = useState<'all' | 'photo' | 'video'>('all');

  const getAssetMediaUrl = (asset: Asset): string => {
    return asset.media_items?.[0]?.url || '';
  };

  const getAssetMediaType = (asset: Asset): string => {
    return asset.media_items?.[0]?.type || 'photo';
  };

  useEffect(() => {
    fetchPublicAssets();
  }, []);

  useEffect(() => {
    filterAndSortAssets();
  }, [assets, searchTerm, sortBy, sortOrder, filterMediaType]);

  const fetchPublicAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          id,
          user_id,
          title,
          description,
          tags,
          media_items,
          privacy,
          estimated_value,
          location,
          created_at,
          user_profiles(full_name, email)
        `)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error: any) {
      console.error('Error fetching public assets:', error);
      toast.error('Failed to load public assets');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAssets = () => {
    let currentAssets = [...assets];

    // Filter by search term
    if (searchTerm) {
      currentAssets = currentAssets.filter(asset =>
        asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        asset.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.user_profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by media type
    if (filterMediaType !== 'all') {
      currentAssets = currentAssets.filter(asset => getAssetMediaType(asset) === filterMediaType);
    }

    // Sort
    currentAssets.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortBy === 'created_at') {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      } else if (sortBy === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (sortBy === 'user_name') {
        valA = (a.user_profiles?.full_name || a.user_profiles?.email || '').toLowerCase();
        valB = (b.user_profiles?.full_name || b.user_profiles?.email || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredAssets(currentAssets);
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4" />;
      case 'video': return <Film className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getUserDisplayName = (userProfile: Asset['user_profiles']) => {
    if (!userProfile) return 'Anonymous';
    return userProfile.full_name || userProfile.email || 'Anonymous';
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading public assets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Globe className="h-8 w-8 mr-3 text-primary-600" />
              Public Assets
            </h1>
            <p className="text-gray-600">
              Explore assets publicly shared by TagMyThing users
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="bg-primary-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-primary-700">
                <strong>{filteredAssets.length}</strong> public assets found
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by title, description, tags, user, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-5 w-5 text-gray-400" />}
              />
            </div>

            {/* Filters and Sort */}
            <div className="flex items-center space-x-4">
              <select
                value={filterMediaType}
                onChange={(e) => setFilterMediaType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Media Types</option>
                <option value="photo">Photos</option>
                <option value="video">Videos</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="created_at">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="user_name">Sort by User</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Total Public</h3>
                  <p className="text-2xl font-bold text-primary-600">{assets.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center">
                <Image className="h-8 w-8 text-secondary-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Photos</h3>
                  <p className="text-2xl font-bold text-secondary-600">
                    {assets.filter(a => a.media_type === 'photo').length}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center">
                <Film className="h-8 w-8 text-accent-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Videos</h3>
                  <p className="text-2xl font-bold text-accent-600">
                    {assets.filter(a => a.media_type === 'video').length}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-center">
                <User className="h-8 w-8 text-success-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Contributors</h3>
                  <p className="text-2xl font-bold text-success-600">
                    {new Set(assets.map(a => a.user_id)).size}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="text-center py-16">
            {searchTerm || filterMediaType !== 'all' ? (
              <>
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No public assets yet</h3>
                <p className="text-gray-600">Be the first to share an asset publicly!</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="overflow-hidden h-full">
                  <div className="aspect-video bg-gray-100 overflow-hidden relative">
                    {asset.media_type === 'video' ? (
                      <video
                        src={asset.media_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                    ) : (
                      <img
                        src={asset.media_url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        {getMediaIcon(asset.media_type)}
                        <span className="ml-1 capitalize">{asset.media_type}</span>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-2 left-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{asset.title}</h3>
                    
                    {asset.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">{asset.description}</p>
                    )}
                    
                    {asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {asset.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {asset.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{asset.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-600 mt-auto">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{getUserDisplayName(asset.user_profiles)}</span>
                      </div>
                      
                      {asset.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{asset.location}</span>
                        </div>
                      )}
                      
                      {asset.estimated_value && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>£{asset.estimated_value.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{format(new Date(asset.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};