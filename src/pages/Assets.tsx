import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  Image,
  Film,
  FileText,
  Globe,
  Lock,
  ExternalLink,
  Archive,
  Clock,
  AlertTriangle,
  CheckCircle,
  Coins,
  Shield,
  Download,
  Share2,
  Users,
  Timer,
  UserPlus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTokens } from '../hooks/useTokens';
import { useNOKAssignments } from '../hooks/useNOKAssignments';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Asset {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  tags: string[];
  media_url: string;
  media_type: 'photo' | 'video';
  privacy: 'private' | 'public';
  estimated_value: number | null;
  location: string | null;
  blockchain_hash: string | null;
  blockchain_network: string | null;
  blockchain_status: 'pending' | 'published' | 'failed' | null;
  created_at: string;
  updated_at: string;
  media_items: Array<{
    url: string;
    type: 'photo' | 'video' | 'pdf';
    size?: number;
    duration?: number;
    token_cost: number;
  }> | null;
  // New Arweave fields
  ipfs_cid: string | null;
  arweave_tx_id: string | null;
  archive_status: 'pending' | 'archived' | 'instant_requested' | 'failed';
  archive_requested_at: string | null;
  archive_method: string | null;
}

interface NextOfKin {
  id: string;
  name: string;
  email: string;
  relationship: string;
  status: 'pending' | 'invited' | 'verified' | 'declined' | 'reverted';
}

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'private' | 'public'>('all');
  const [filterArchiveStatus, setFilterArchiveStatus] = useState<'all' | 'pending' | 'archived' | 'failed'>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState<string | null>(null);
  
  // NOK Assignment states
  const [showAssignNOKModal, setShowAssignNOKModal] = useState(false);
  const [selectedAssetForNOK, setSelectedAssetForNOK] = useState<Asset | null>(null);
  const [nokListForAssignment, setNokListForAssignment] = useState<NextOfKin[]>([]);
  const [selectedNOKIdForAssignment, setSelectedNOKIdForAssignment] = useState('');
  const [dmsYearsForAssignment, setDmsYearsForAssignment] = useState(1);
  const [assignNOKLoading, setAssignNOKLoading] = useState(false);
  const [nokListLoading, setNokListLoading] = useState(false);

  const { user } = useAuth();
  const { balance, spendTokens, refreshWallet } = useTokens();
  const { assignNOKToAsset, refreshAssignments } = useNOKAssignments();

  useEffect(() => {
    if (user) {
      fetchAssets();
    }
  }, [user]);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, filterPrivacy, filterArchiveStatus]);

  const fetchAssets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select(`
          id,
          user_id,
          title,
          description,
          tags,
          media_url,
          media_type,
          privacy,
          estimated_value,
          location,
          blockchain_hash,
          blockchain_network,
          blockchain_status,
          created_at,
          updated_at,
          media_items,
          ipfs_cid,
          arweave_tx_id,
          archive_status,
          archive_requested_at,
          archive_method
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error: any) {
      console.error('Error fetching assets:', error);
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

    // Privacy filter
    if (filterPrivacy !== 'all') {
      filtered = filtered.filter(asset => asset.privacy === filterPrivacy);
    }

    // Archive status filter
    if (filterArchiveStatus !== 'all') {
      filtered = filtered.filter(asset => asset.archive_status === filterArchiveStatus);
    }

    setFilteredAssets(filtered);
  };

  const handleArchiveNow = async (asset: Asset) => {
    if (balance < 300) {
      toast.error('Insufficient tokens. You need 300 TMT to archive an asset.');
      return;
    }

    if (asset.archive_status === 'archived') {
      toast.info('Asset is already archived');
      return;
    }

    setArchiveLoading(asset.id);
    try {
      const { data, error } = await supabase.rpc('archive_tag_now', {
        asset_id: asset.id
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(
          <div>
            <p>Asset archived successfully!</p>
            <a 
              href={`https://arweave.net/${data.arweave_tx_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              View on Arweave →
            </a>
          </div>
        );
        await refreshWallet();
        await fetchAssets();
      } else {
        toast.error(data?.error || 'Failed to archive asset');
      }
    } catch (error: any) {
      console.error('Archive error:', error);
      toast.error('Failed to archive asset');
    } finally {
      setArchiveLoading(null);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;

    if (selectedAsset.archive_status === 'archived') {
      toast.error('Cannot delete archived asset. Archived assets are permanent.');
      return;
    }

    setDeleteLoading(true);
    try {
      // Call refund function for non-archived assets
      const { data: refundData, error: refundError } = await supabase.rpc('refund_tokens_on_delete', {
        asset_id: selectedAsset.id
      });

      if (refundError) throw refundError;

      if (refundData?.success) {
        toast.success(`Asset deleted and ${refundData.refund_amount} TMT tokens refunded`);
        await refreshWallet();
        await fetchAssets();
        setShowDeleteModal(false);
        setSelectedAsset(null);
      } else {
        toast.error(refundData?.error || 'Failed to delete asset');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete asset');
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchNOKListForAssignment = async () => {
    if (!user) return;

    setNokListLoading(true);
    try {
      const { data, error } = await supabase
        .from('next_of_kin')
        .select('id, name, email, relationship, status')
        .eq('user_id', user.id)
        .eq('status', 'verified') // Only show verified NOKs for assignment
        .order('name');

      if (error) throw error;
      setNokListForAssignment(data || []);
    } catch (error: any) {
      console.error('Error fetching NOK list:', error);
      toast.error('Failed to load Next of Kin list');
      setNokListForAssignment([]);
    } finally {
      setNokListLoading(false);
    }
  };

  const handleAssignNOKClick = (asset: Asset) => {
    setSelectedAssetForNOK(asset);
    setSelectedNOKIdForAssignment('');
    setDmsYearsForAssignment(1);
    setShowAssignNOKModal(true);
    fetchNOKListForAssignment();
  };

  const handleConfirmAssignNOK = async () => {
    if (!selectedAssetForNOK || !selectedNOKIdForAssignment) {
      toast.error('Please select a Next of Kin');
      return;
    }

    setAssignNOKLoading(true);
    try {
      // Calculate DMS date
      const dmsDate = new Date();
      dmsDate.setFullYear(dmsDate.getFullYear() + dmsYearsForAssignment);

      const success = await assignNOKToAsset(
        selectedAssetForNOK.id,
        selectedNOKIdForAssignment,
        dmsDate
      );

      if (success) {
        const selectedNOK = nokListForAssignment.find(nok => nok.id === selectedNOKIdForAssignment);
        toast.success(`Asset "${selectedAssetForNOK.title}" assigned to ${selectedNOK?.name}!`);
        setShowAssignNOKModal(false);
        setSelectedAssetForNOK(null);
        setSelectedNOKIdForAssignment('');
        await refreshAssignments(); // This will update the incoming/outgoing counts
      }
    } catch (error: any) {
      console.error('Error assigning NOK:', error);
      toast.error('Failed to assign Next of Kin');
    } finally {
      setAssignNOKLoading(false);
    }
  };
  const getArchiveStatusIcon = (status: string) => {
    switch (status) {
      case 'archived':
        return <Archive className="h-4 w-4 text-success-600" />;
      case 'instant_requested':
        return <Clock className="h-4 w-4 text-warning-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-error-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
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

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Film className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const AssetCard: React.FC<{ asset: Asset; index: number }> = ({ asset, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card hover className="overflow-hidden">
        <div className="aspect-video bg-gray-100 overflow-hidden relative">
          <img
            src={asset.media_url}
            alt={asset.title}
            className="w-full h-full object-cover"
          />
          
          {/* Media Type Badge */}
          <div className="absolute top-2 left-2">
            <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-xs flex items-center">
              {getMediaIcon(asset.media_type)}
              <span className="ml-1 capitalize">{asset.media_type}</span>
            </div>
          </div>

          {/* Privacy Badge */}
          <div className="absolute top-2 right-2">
            <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
              asset.privacy === 'private' 
                ? 'bg-gray-800 bg-opacity-75 text-white' 
                : 'bg-primary-600 bg-opacity-90 text-white'
            }`}>
              {asset.privacy === 'private' ? <Lock className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
              <span className="capitalize">{asset.privacy}</span>
            </div>
          </div>

          {/* Archive Status Badge */}
          <div className="absolute bottom-2 left-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getArchiveStatusColor(asset.archive_status)}`}>
              {getArchiveStatusIcon(asset.archive_status)}
              <span className="ml-1 capitalize">{asset.archive_status.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Arweave Link for Archived Assets */}
          {asset.archive_status === 'archived' && asset.arweave_tx_id && (
            <div className="absolute bottom-2 right-2">
              <a
                href={`https://arweave.net/${asset.arweave_tx_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-success-600 bg-opacity-90 text-white p-1.5 rounded-full hover:bg-success-700 transition-colors"
                title="View on Arweave"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 truncate">{asset.title}</h3>
          
          {asset.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{asset.description}</p>
          )}

          {/* Tags */}
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {asset.tags.slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
                >
                  {tag}
                </span>
              ))}
              {asset.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{asset.tags.length - 3} more</span>
              )}
            </div>
          )}

          {/* Asset Info */}
          <div className="space-y-1 mb-4 text-sm text-gray-600">
            {asset.location && (
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate">{asset.location}</span>
              </div>
            )}
            {asset.estimated_value && (
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                <span>£{asset.estimated_value.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{format(new Date(asset.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAsset(asset);
                setShowDetailModal(true);
              }}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>

            {/* Archive Now Button */}
            {(asset.archive_status === 'pending' || asset.archive_status === 'failed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArchiveNow(asset)}
                disabled={balance < 300 || archiveLoading === asset.id}
                className="flex-1 text-warning-600 hover:text-warning-700 hover:bg-warning-50"
                title={balance < 300 ? 'Insufficient tokens (300 TMT required)' : 'Archive to Arweave (300 TMT)'}
              >
                {archiveLoading === asset.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning-600" />
                ) : (
                  <Archive className="h-4 w-4 mr-1" />
                )}
                Archive
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAssignNOKClick(asset)}
              className="flex-1 text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
              title="Assign this asset to a Next of Kin"
            >
              <Users className="h-4 w-4 mr-1" />
              Assign NOK
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAsset(asset);
                setShowDetailModal(true);
              }}
              disabled={asset.archive_status === 'archived'}
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={asset.archive_status === 'archived' ? 'Cannot edit archived assets' : 'Edit asset'}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedAsset(asset);
                setShowDeleteModal(true);
              }}
              disabled={asset.archive_status === 'archived'}
              className="text-error-600 hover:text-error-700 hover:bg-error-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={asset.archive_status === 'archived' ? 'Cannot delete archived assets' : 'Delete asset'}
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
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          {/* Thumbnail */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
            <img
              src={asset.media_url}
              alt={asset.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {getMediaIcon(asset.media_type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{asset.title}</h3>
                {asset.description && (
                  <p className="text-gray-600 text-sm mt-1 line-clamp-1">{asset.description}</p>
                )}
                
                {/* Badges */}
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    asset.privacy === 'private' ? 'bg-gray-100 text-gray-800' : 'bg-primary-100 text-primary-800'
                  }`}>
                    {asset.privacy === 'private' ? <Lock className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                    {asset.privacy}
                  </span>

                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getArchiveStatusColor(asset.archive_status)}`}>
                    {getArchiveStatusIcon(asset.archive_status)}
                    <span className="ml-1 capitalize">{asset.archive_status.replace('_', ' ')}</span>
                  </span>

                  {asset.archive_status === 'archived' && asset.arweave_tx_id && (
                    <a
                      href={`https://arweave.net/${asset.arweave_tx_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800 hover:bg-success-200 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Arweave
                    </a>
                  )}
                </div>

                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{format(new Date(asset.created_at), 'MMM d, yyyy')}</span>
                  {asset.location && (
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {asset.location}
                    </span>
                  )}
                  {asset.estimated_value && (
                    <span className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      £{asset.estimated_value.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {/* Archive Now Button */}
                {(asset.archive_status === 'pending' || asset.archive_status === 'failed') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveNow(asset)}
                    disabled={balance < 300 || archiveLoading === asset.id}
                    className="text-warning-600 hover:text-warning-700 hover:bg-warning-50"
                    title={balance < 300 ? 'Insufficient tokens (300 TMT required)' : 'Archive to Arweave (300 TMT)'}
                  >
                    {archiveLoading === asset.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning-600" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowDetailModal(true);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignNOKClick(asset)}
                  className="text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
                  title="Assign this asset to a Next of Kin"
                >
                  <Users className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowDetailModal(true);
                  }}
                  disabled={asset.archive_status === 'archived'}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                  title={asset.archive_status === 'archived' ? 'Cannot edit archived assets' : 'Edit asset'}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowDeleteModal(true);
                  }}
                  disabled={asset.archive_status === 'archived'}
                  className="text-error-600 hover:text-error-700 hover:bg-error-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={asset.archive_status === 'archived' ? 'Cannot delete archived assets' : 'Delete asset'}
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

  const stats = [
    {
      title: 'Total Assets',
      value: assets.length.toString(),
      icon: <Package className="h-8 w-8 text-primary-600" />,
      color: 'text-primary-600'
    },
    {
      title: 'Archived',
      value: assets.filter(a => a.archive_status === 'archived').length.toString(),
      icon: <Archive className="h-8 w-8 text-success-600" />,
      color: 'text-success-600'
    },
    {
      title: 'Pending Archive',
      value: assets.filter(a => a.archive_status === 'pending').length.toString(),
      icon: <Clock className="h-8 w-8 text-warning-600" />,
      color: 'text-warning-600'
    },
    {
      title: 'Private Assets',
      value: assets.filter(a => a.privacy === 'private').length.toString(),
      icon: <Lock className="h-8 w-8 text-secondary-600" />,
      color: 'text-secondary-600'
    }
  ];

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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assets</h1>
            <p className="text-gray-600">
              Manage your tagged assets and their permanent archiving status
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <div className="flex items-center space-x-2 bg-primary-50 px-3 py-1.5 rounded-lg">
              <Coins className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-600">
                {balance} TMT
              </span>
            </div>
            <Button onClick={() => window.location.href = '/tag'}>
              <Plus className="h-5 w-5 mr-2" />
              Tag New Asset
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {stat.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{stat.title}</h3>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {assets.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <Package className="h-16 w-16 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Assets Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start building your digital legacy by tagging your first asset. 
              Capture photos, videos, or upload documents to secure them forever.
            </p>
            <Button size="lg" onClick={() => window.location.href = '/tag'}>
              <Plus className="h-5 w-5 mr-2" />
              Tag Your First Asset
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Filters and Controls */}
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
                <div className="flex items-center space-x-4">
                  <select
                    value={filterPrivacy}
                    onChange={(e) => setFilterPrivacy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Privacy</option>
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>

                  <select
                    value={filterArchiveStatus}
                    onChange={(e) => setFilterArchiveStatus(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending Archive</option>
                    <option value="archived">Archived</option>
                    <option value="failed">Failed Archive</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="p-2"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="p-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Assets Grid/List */}
            {filteredAssets.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset, index) => (
                  <AssetCard key={asset.id} asset={asset} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssets.map((asset, index) => (
                  <AssetListItem key={asset.id} asset={asset} index={index} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Asset Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAsset(null);
          }}
          title={selectedAsset?.title || 'Asset Details'}
          size="xl"
        >
          {selectedAsset && (
            <div className="space-y-6">
              {/* Media Display */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {selectedAsset.media_type === 'video' ? (
                  <video
                    src={selectedAsset.media_url}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedAsset.media_url}
                    alt={selectedAsset.title}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Asset Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Title</label>
                      <p className="text-gray-900">{selectedAsset.title}</p>
                    </div>
                    {selectedAsset.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="text-gray-900">{selectedAsset.description}</p>
                      </div>
                    )}
                    {selectedAsset.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <p className="text-gray-900">{selectedAsset.location}</p>
                      </div>
                    )}
                    {selectedAsset.estimated_value && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Estimated Value</label>
                        <p className="text-gray-900">£{selectedAsset.estimated_value.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Archive Status</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getArchiveStatusColor(selectedAsset.archive_status)}`}>
                          {getArchiveStatusIcon(selectedAsset.archive_status)}
                          <span className="ml-1 capitalize">{selectedAsset.archive_status.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>

                    {selectedAsset.archive_status === 'archived' && selectedAsset.arweave_tx_id && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Arweave Transaction</label>
                        <div className="mt-1">
                          <a
                            href={`https://arweave.net/${selectedAsset.arweave_tx_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-success-600 hover:text-success-700 text-sm"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View on Arweave
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedAsset.archive_requested_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Last Archive Request</label>
                        <p className="text-gray-900">{format(new Date(selectedAsset.archive_requested_at), 'PPP')}</p>
                      </div>
                    )}

                    {selectedAsset.archive_method && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Archive Method</label>
                        <p className="text-gray-900 capitalize">{selectedAsset.archive_method}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedAsset.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAsset.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                {/* Archive Now Button */}
                {(selectedAsset.archive_status === 'pending' || selectedAsset.archive_status === 'failed') && (
                  <Button
                    onClick={() => handleArchiveNow(selectedAsset)}
                    disabled={balance < 300 || archiveLoading === selectedAsset.id}
                    className="flex-1"
                    loading={archiveLoading === selectedAsset.id}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Now (300 TMT)
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAsset(null);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>

              {/* Archive Warning */}
              {selectedAsset.archive_status === 'archived' && (
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-success-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-success-700">
                      <p className="font-medium mb-1">Permanently Archived</p>
                      <p>This asset has been permanently stored on Arweave and cannot be edited or deleted. It will remain accessible forever.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Assign to Next-of-Kin Modal */}
        <Modal
          isOpen={showAssignNOKModal}
          onClose={() => {
            setShowAssignNOKModal(false);
            setSelectedAssetForNOK(null);
            setSelectedNOKIdForAssignment('');
            setDmsYearsForAssignment(1);
            setNokListForAssignment([]);
          }}
          title="Assign to Next-of-Kin"
        >
          {selectedAssetForNOK && (
            <div className="space-y-6">
              {/* Asset Preview */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <img
                  src={selectedAssetForNOK.media_url}
                  alt={selectedAssetForNOK.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedAssetForNOK.title}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedAssetForNOK.media_type} • {format(new Date(selectedAssetForNOK.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {nokListLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600">Loading Next of Kin...</span>
                </div>
              ) : nokListForAssignment.length === 0 ? (
                /* No NOK Available */
                <div className="text-center py-8">
                  <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Next of Kin Available</h3>
                  <p className="text-gray-600 mb-6">
                    You need to add and verify a Next of Kin before you can assign assets to them.
                  </p>
                  <Button
                    onClick={() => {
                      setShowAssignNOKModal(false);
                      window.open('/nok', '_blank');
                    }}
                    variant="outline"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Next of Kin
                  </Button>
                </div>
              ) : (
                /* NOK Selection Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Next of Kin *
                    </label>
                    <select
                      value={selectedNOKIdForAssignment}
                      onChange={(e) => setSelectedNOKIdForAssignment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Choose Next of Kin</option>
                      {nokListForAssignment.map(nok => (
                        <option key={nok.id} value={nok.id}>
                          {nok.name} ({nok.relationship}) - {nok.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dead Man's Switch Period
                    </label>
                    <select
                      value={dmsYearsForAssignment}
                      onChange={(e) => setDmsYearsForAssignment(parseInt(e.target.value))}
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

                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Timer className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-warning-700">
                        <p className="font-medium mb-1">Privacy Protection</p>
                        <p>Your Next of Kin will only know they've been assigned without seeing asset details until the Dead Man's Switch is triggered.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-primary-700">
                        <p className="font-medium mb-1">Assignment Details</p>
                        <p>
                          Asset "{selectedAssetForNOK.title}" will be assigned to{' '}
                          {selectedNOKIdForAssignment ? 
                            nokListForAssignment.find(nok => nok.id === selectedNOKIdForAssignment)?.name || 'Selected NOK' : 
                            'your chosen Next of Kin'
                          } with a {dmsYearsForAssignment}-year Dead Man's Switch period.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignNOKModal(false);
                    setSelectedAssetForNOK(null);
                    setSelectedNOKIdForAssignment('');
                    setDmsYearsForAssignment(1);
                    setNokListForAssignment([]);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                {nokListForAssignment.length > 0 && (
                  <Button
                    onClick={handleConfirmAssignNOK}
                    loading={assignNOKLoading}
                    disabled={!selectedNOKIdForAssignment}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Assign to NOK
                  </Button>
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
                      <p>This asset has been permanently archived on Arweave and cannot be deleted. Archived assets are immutable and will remain accessible forever.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={selectedAsset.media_url}
                      alt={selectedAsset.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedAsset.title}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedAsset.media_type} • {format(new Date(selectedAsset.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Coins className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-warning-700">
                        <p className="font-medium mb-1">Token Refund</p>
                        <p>You will receive a refund of the tokens spent to create this asset.</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600">
                    Are you sure you want to delete this asset? This action cannot be undone.
                  </p>
                </>
              )}
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedAsset(null);
                  }}
                  className="flex-1"
                >
                  Cancel
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