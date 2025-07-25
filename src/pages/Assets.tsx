import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Camera, 
  Video, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Grid, 
  List,
  MapPin,
  Calendar,
  Tag,
  Lock,
  Globe,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Asset {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  media_url: string;
  media_type: 'photo' | 'video';
  privacy: 'private' | 'public';
  estimated_value: number | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'private' | 'public'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAssets();
    }
  }, [user]);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, filterType, filterPrivacy]);

  const fetchAssets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      setError(err.message);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.media_type === filterType);
    }

    // Privacy filter
    if (filterPrivacy !== 'all') {
      filtered = filtered.filter(asset => asset.privacy === filterPrivacy);
    }

    setFilteredAssets(filtered);
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;

    // Check if asset is archived
    if (selectedAsset.archive_status === 'archived') {
      toast.error('Cannot delete archived asset. It has been permanently stored on Arweave.');
      return;
    }

    setDeleteLoading(true);
    try {
      // Calculate refund amount if asset is not archived
      let refundAmount = 0;
      if (selectedAsset.media_items && Array.isArray(selectedAsset.media_items)) {
        refundAmount = selectedAsset.media_items.reduce((sum, item) => sum + (item.token_cost || 0), 0);
      } else {
        // Fallback for legacy assets without media_items
        refundAmount = selectedAsset.media_type === 'video' ? 7 : 5;
      }

      // Call refund function if there are tokens to refund
      if (refundAmount > 0) {
        const { data: refundResult, error: refundError } = await supabase
          .rpc('refund_tokens_on_delete', {
            asset_id: selectedAsset.id
          });

        if (refundError) {
          console.error('Error refunding tokens:', refundError);
          toast.error('Failed to process token refund');
          return;
        }

        if (refundResult?.success) {
          toast.success(`Asset deleted and ${refundAmount} TMT tokens refunded!`);
        }
      } else {
        // If no refund needed, proceed with normal deletion
        // Delete from storage
        const fileName = selectedAsset.media_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('assets')
            .remove([`${user?.id}/${fileName}`]);
        }

        // Delete from database
        const { error } = await supabase
          .from('assets')
          .delete()
          .eq('id', selectedAsset.id);

        if (error) throw error;
        toast.success('Asset deleted successfully');
      }

      // Update UI
      setAssets(prev => prev.filter(asset => asset.id !== selectedAsset.id));
      setShowDeleteModal(false);
      setSelectedAsset(null);
    } catch (err: any) {
      console.error('Error deleting asset:', err);
      toast.error('Failed to delete asset');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleArchiveNow = async (asset: Asset) => {
    if (balance < 300) {
      toast.error('Insufficient tokens. You need 300 TMT to archive an asset.');
      return;
    }

    if (asset.archive_status === 'archived') {
      toast.info('Asset is already archived on Arweave.');
      return;
    }

    setArchiveLoading(asset.id);
    try {
      const { data: result, error } = await supabase
        .rpc('archive_tag_now', {
          asset_id: asset.id
        });

      if (error) throw error;

      if (result?.success) {
        toast.success(
          <div>
            <p>Asset archived successfully!</p>
            <a 
              href={`https://arweave.net/${result.arweave_tx_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 underline"
            >
              View on Arweave
            </a>
          </div>
        );
        
        // Refresh assets to show updated status
        fetchAssets();
      } else {
        toast.error(result?.error || 'Failed to archive asset');
      }
    } catch (err: any) {
      console.error('Error archiving asset:', err);
      toast.error('Failed to archive asset');
    } finally {
      setArchiveLoading(null);
    }
  };

  const getArchiveStatusIcon = (status: string) => {
    switch (status) {
      case 'archived':
        return <CheckCircle2 className="h-3 w-3 text-success-600" />;
      case 'instant_requested':
        return <Clock className="h-3 w-3 text-warning-600" />;
      case 'failed':
        return <AlertTriangle className="h-3 w-3 text-error-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getArchiveStatusColor = (status: string) => {
    switch (status) {
      case 'archived':
        return 'bg-success-100 text-success-800';
      case 'instant_requested':
        return 'bg-warning-100 text-warning-800';
      case 'failed':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatArchiveStatus = (status: string) => {
    switch (status) {
      case 'archived':
        return 'Archived';
      case 'instant_requested':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const handleDeleteAssetOld = async () => {
    if (!selectedAsset) return;

      // Delete from storage
      const fileName = selectedAsset.media_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('assets')
          .remove([`${user?.id}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', selectedAsset.id);

      if (error) throw error;

      toast.success('Asset deleted successfully');
      setAssets(prev => prev.filter(asset => asset.id !== selectedAsset.id));
      setShowDeleteModal(false);
      setSelectedAsset(null);
    } catch (err: any) {
      console.error('Error deleting asset:', err);
      toast.error('Failed to delete asset');
    } finally {
      setDeleteLoading(false);
    }
  };

  const AssetCard: React.FC<{ asset: Asset; index: number }> = ({ asset, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card hover className="overflow-hidden h-full">
        <div className="relative">
          {/* Media Preview */}
          <div className="aspect-video bg-gray-100 overflow-hidden">
            {asset.media_type === 'photo' ? (
              <img
                src={asset.media_url}
                alt={asset.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={asset.media_url}
                className="w-full h-full object-cover"
                muted
              />
            )}
          </div>

          {/* Media Type Badge */}
          <div className="absolute top-2 left-2">
            <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-xs flex items-center">
              {asset.media_type === 'photo' ? (
                <Camera className="h-3 w-3 mr-1" />
              ) : (
                <Video className="h-3 w-3 mr-1" />
              )}
              {asset.media_type}
            </div>
          </div>

          {/* Privacy Badge */}
          <div className="absolute top-2 right-2">
            <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
              asset.privacy === 'private' 
                ? 'bg-gray-800 text-white' 
                : 'bg-green-600 text-white'
            }`}>
              {asset.privacy === 'private' ? (
                <Lock className="h-3 w-3 mr-1" />
              ) : (
                <Globe className="h-3 w-3 mr-1" />
              )}
              {asset.privacy}
            </div>
          </div>

          {/* Archive Status Badge */}
          <div className="absolute bottom-2 right-2">
            <div className={`px-2 py-1 rounded-full text-xs flex items-center ${getArchiveStatusColor(asset.archive_status)}`}>
              {getArchiveStatusIcon(asset.archive_status)}
              <span className="ml-1">{formatArchiveStatus(asset.archive_status)}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Title and Description */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
            {asset.title}
          </h3>
          {asset.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {asset.description}
            </p>
          )}

          {/* Tags */}
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {asset.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
              {asset.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{asset.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-1 mb-4">
            {asset.location && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                {asset.location}
              </div>
            )}
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(asset.created_at), 'MMM d, yyyy')}
            </div>
            {asset.estimated_value && (
              <div className="text-xs text-gray-500">
                Value: £{asset.estimated_value.toFixed(2)}
              </div>
            )}
          </div>

          {/* Arweave Link */}
          {asset.arweave_tx_id && (
            <div className="mb-3">
              <a
                href={`https://arweave.net/${asset.arweave_tx_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-primary-600 hover:text-primary-700"
              >
                <Archive className="h-3 w-3 mr-1" />
                View on Arweave
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            {/* Archive Now Button */}
            {(asset.archive_status === 'pending' || asset.archive_status === 'failed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArchiveNow(asset)}
                disabled={balance < 300 || archiveLoading === asset.id}
                className="flex-1 text-warning-600 hover:text-warning-700 hover:bg-warning-50"
                loading={archiveLoading === asset.id}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive (300 TMT)
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAsset(asset)}
              className={asset.archive_status === 'pending' || asset.archive_status === 'failed' ? 'flex-1' : 'flex-1'}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedAsset(asset);
                setShowDeleteModal(true);
              }}
              disabled={asset.archive_status === 'archived'}
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  const AssetListItem: React.FC<{ asset: Asset; index: number }> = ({ asset, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="mb-4">
        <div className="flex items-center space-x-4">
          {/* Thumbnail */}
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {asset.media_type === 'photo' ? (
              <img
                src={asset.media_url}
                alt={asset.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={asset.media_url}
                className="w-full h-full object-cover"
                muted
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{asset.title}</h3>
                {asset.description && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                    {asset.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    {asset.media_type === 'photo' ? (
                      <Camera className="h-3 w-3 mr-1" />
                    ) : (
                      <Video className="h-3 w-3 mr-1" />
                    )}
                    {asset.media_type}
                  </span>
                  <span className="flex items-center">
                    {asset.privacy === 'private' ? (
                      <Lock className="h-3 w-3 mr-1" />
                    ) : (
                      <Globe className="h-3 w-3 mr-1" />
                    )}
                    {asset.privacy}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(asset.created_at), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center">
                    {getArchiveStatusIcon(asset.archive_status)}
                    <span className="ml-1">{formatArchiveStatus(asset.archive_status)}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 ml-4">
                {/* Archive Now Button */}
                {(asset.archive_status === 'pending' || asset.archive_status === 'failed') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveNow(asset)}
                    disabled={balance < 300 || archiveLoading === asset.id}
                    loading={archiveLoading === asset.id}
                    className="text-warning-600 hover:text-warning-700 hover:bg-warning-50"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowDeleteModal(true);
                  }}
                  disabled={asset.archive_status === 'archived'}
                  className="text-error-600 hover:text-error-700 hover:bg-error-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your assets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Assets</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAssets}>
              Try Again
            </Button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assets</h1>
            <p className="text-gray-600">
              {assets.length} {assets.length === 1 ? 'asset' : 'assets'} tagged
            </p>
          </div>
          <Link to="/tag">
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-5 w-5 mr-2" />
              Tag New Asset
            </Button>
          </Link>
        </div>

        {assets.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Package className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Assets Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start building your digital asset collection by tagging your first item.
              Use your camera to capture and secure your valuables.
            </p>
            <Link to="/tag">
              <Button size="lg">
                <Camera className="h-5 w-5 mr-2" />
                Tag Your First Asset
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-5 w-5 text-gray-400" />}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Types</option>
                    <option value="photo">Photos</option>
                    <option value="video">Videos</option>
                  </select>

                  <select
                    value={filterPrivacy}
                    onChange={(e) => setFilterPrivacy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Privacy</option>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            {filteredAssets.length !== assets.length && (
              <div className="mb-4">
                <p className="text-gray-600">
                  Showing {filteredAssets.length} of {assets.length} assets
                </p>
              </div>
            )}

            {/* Assets Grid/List */}
            {filteredAssets.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAssets.map((asset, index) => (
                  <AssetCard key={asset.id} asset={asset} index={index} />
                ))}
              </div>
            ) : (
              <div>
                {filteredAssets.map((asset, index) => (
                  <AssetListItem key={asset.id} asset={asset} index={index} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Asset Detail Modal */}
        <Modal
          isOpen={!!selectedAsset && !showDeleteModal}
          onClose={() => setSelectedAsset(null)}
          title="Asset Details"
          size="lg"
        >
          {selectedAsset && (
            <div className="space-y-6">
              {/* Media */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {selectedAsset.media_type === 'photo' ? (
                  <img
                    src={selectedAsset.media_url}
                    alt={selectedAsset.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={selectedAsset.media_url}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Details */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedAsset.title}
                </h3>
                {selectedAsset.description && (
                  <p className="text-gray-600 mb-4">{selectedAsset.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Type:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedAsset.media_type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Privacy:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedAsset.privacy}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Created:</span>
                    <span className="ml-2 text-gray-600">
                      {format(new Date(selectedAsset.created_at), 'PPP')}
                    </span>
                  </div>
                  {selectedAsset.estimated_value && (
                    <div>
                      <span className="font-medium text-gray-900">Value:</span>
                      <span className="ml-2 text-gray-600">£{selectedAsset.estimated_value.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedAsset.location && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-900">Location:</span>
                      <span className="ml-2 text-gray-600">{selectedAsset.location}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedAsset.tags.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-900 block mb-2">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedAsset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedAsset(null);
          }}
          title="Delete Asset"
        >
          {selectedAsset && (
            <div className="space-y-4">
              {selectedAsset.archive_status === 'archived' ? (
                <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-error-700">
                      <p className="font-medium mb-1">Cannot Delete Archived Asset</p>
                      <p>This asset has been permanently archived on Arweave and cannot be deleted.</p>
                      {selectedAsset.arweave_tx_id && (
                        <a
                          href={`https://arweave.net/${selectedAsset.arweave_tx_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 underline inline-flex items-center mt-2"
                        >
                          View on Arweave
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-600">
                    Are you sure you want to delete "{selectedAsset.title}"? 
                    {selectedAsset.archive_status === 'pending' || selectedAsset.archive_status === 'failed' ? (
                      <span className="text-success-600 font-medium"> Your tokens will be refunded.</span>
                    ) : null}
                  </p>
                  
                  {(selectedAsset.archive_status === 'pending' || selectedAsset.archive_status === 'failed') && (
                    <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-success-600 mr-2" />
                        <span className="text-sm text-success-700">
                          Token refund will be processed automatically
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <p className="text-gray-600">
                {selectedAsset.archive_status === 'archived' ? null : 'This action cannot be undone.'}
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedAsset(null);
                  }}
                  className="flex-1"
                >
                  {selectedAsset.archive_status === 'archived' ? 'Close' : 'Cancel'}
                </Button>
                {selectedAsset.archive_status !== 'archived' && (
                  <Button
                    variant="danger"
                    onClick={handleDeleteAsset}
                    loading={deleteLoading}
                    className="flex-1"
                  >
                    Delete Asset
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};