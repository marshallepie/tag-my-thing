import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Calendar, 
  Tag, 
  MapPin, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2, 
  Archive, 
  Users,
  Mail,
  Phone,
  User,
  Timer,
  AlertCircle,
  CheckCircle,
  Send,
  RefreshCw,
  Image,
  Film,
  FileText,
  Globe,
  Lock
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
  ipfs_cid: string | null;
  arweave_tx_id: string | null;
  archive_status: 'pending' | 'archived' | 'instant_requested' | 'failed';
  archive_requested_at: string | null;
  archive_method: string | null;
  created_at: string;
  updated_at: string;
  media_items: Array<{
    url: string;
    type: 'photo' | 'video' | 'pdf';
    size?: number;
    duration?: number;
    token_cost: number;
  }> | null;
}

interface NOKFormData {
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'private' | 'public'>('all');
  const [filterMediaType, setFilterMediaType] = useState<'all' | 'photo' | 'video'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'estimated_value'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showAddNOKAndAssignModal, setShowAddNOKAndAssignModal] = useState(false);
  const [selectedAssetForNOK, setSelectedAssetForNOK] = useState<Asset | null>(null);
  const [nokFormData, setNokFormData] = useState<NOKFormData>({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });
  const [dmsYearsForAssignment, setDmsYearsForAssignment] = useState(1);
  const [addNOKAndAssignLoading, setAddNOKAndAssignLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const { user } = useAuth();
  const { balance, spendTokens } = useTokens();
  const { assignNOKToAsset, refreshAssignments } = useNOKAssignments();

  useEffect(() => {
    if (user) {
      fetchAssets();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortAssets();
  }, [assets, searchTerm, filterPrivacy, filterMediaType, sortBy, sortOrder]);

  const fetchAssets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
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

  const filterAndSortAssets = () => {
    let filtered = assets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        asset.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Privacy filter
    if (filterPrivacy !== 'all') {
      filtered = filtered.filter(asset => asset.privacy === filterPrivacy);
    }

    // Media type filter
    if (filterMediaType !== 'all') {
      filtered = filtered.filter(asset => asset.media_type === filterMediaType);
    }

    // Sort
    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortBy === 'created_at') {
        valA = new Date(a.created_at).getTime();
        valB = new Date(b.created_at).getTime();
      } else if (sortBy === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (sortBy === 'estimated_value') {
        valA = a.estimated_value || 0;
        valB = b.estimated_value || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredAssets(filtered);
  };

  const handleAssignNOKClick = (asset: Asset) => {
    setSelectedAssetForNOK(asset);
    setShowAddNOKAndAssignModal(true);
  };

  const resetNOKForm = () => {
    setNokFormData({
      name: '',
      email: '',
      phone: '',
      relationship: ''
    });
    setDmsYearsForAssignment(1);
  };

  const handleAddNOKAndAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAssetForNOK) return;

    setAddNOKAndAssignLoading(true);
    try {
      // Step 1: Create the new Next-of-Kin
      const { data: newNOK, error: nokError } = await supabase
        .from('next_of_kin')
        .insert({
          user_id: user.id,
          name: nokFormData.name,
          email: nokFormData.email,
          phone: nokFormData.phone || null,
          relationship: nokFormData.relationship,
          status: 'pending'
        })
        .select()
        .single();

      if (nokError) throw nokError;

      // Step 2: Assign the asset to the newly created NOK
      const dmsDate = new Date();
      dmsDate.setFullYear(dmsDate.getFullYear() + dmsYearsForAssignment);

      const assignmentSuccess = await assignNOKToAsset(selectedAssetForNOK.id, newNOK.id, dmsDate);

      if (assignmentSuccess) {
        toast.success(`Successfully created ${nokFormData.name} as Next-of-Kin and assigned "${selectedAssetForNOK.title}" to them!`);
        setShowAddNOKAndAssignModal(false);
        setSelectedAssetForNOK(null);
        resetNOKForm();
        await refreshAssignments(); // Update NOK counts
      } else {
        // If assignment failed, we should clean up the NOK we just created
        await supabase
          .from('next_of_kin')
          .delete()
          .eq('id', newNOK.id);
        toast.error('Failed to assign asset to Next-of-Kin. Please try again.');
      }
    } catch (error: any) {
      console.error('Error adding NOK and assigning asset:', error);
      toast.error('Failed to create Next-of-Kin and assign asset');
    } finally {
      setAddNOKAndAssignLoading(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', selectedAsset.id);

      if (error) throw error;

      toast.success('Asset deleted successfully');
      setShowDeleteModal(false);
      setSelectedAsset(null);
      fetchAssets();
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleArchiveAsset = async () => {
    if (!selectedAsset) return;

    const ARCHIVE_COST = 300; // TMT tokens required for archiving

    if (balance < ARCHIVE_COST) {
      toast.error(`Insufficient tokens. You need ${ARCHIVE_COST} TMT to archive this asset.`);
      return;
    }

    setArchiveLoading(true);
    try {
      // Spend tokens first
      const success = await spendTokens(ARCHIVE_COST, 'blockchain_publish', `Archived asset: ${selectedAsset.title}`);
      if (!success) {
        toast.error('Failed to spend tokens for archiving');
        return;
      }

      // Call the archive function
      const { data, error } = await supabase.rpc('archive_tag_now', {
        asset_id: selectedAsset.id
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Asset archived successfully to Arweave!');
        setShowArchiveModal(false);
        setSelectedAsset(null);
        fetchAssets();
      } else {
        toast.error(data?.error || 'Failed to archive asset');
      }
    } catch (error: any) {
      console.error('Error archiving asset:', error);
      toast.error('Failed to archive asset');
    } finally {
      setArchiveLoading(false);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4" />;
      case 'video': return <Film className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    return privacy === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />;
  };

  const getArchiveStatusColor = (status: string) => {
    switch (status) {
      case 'archived':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'instant_requested':
        return 'bg-primary-100 text-primary-800';
      case 'failed':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const relationshipOptions = [
    'Spouse',
    'Child',
    'Parent',
    'Sibling',
    'Partner',
    'Friend',
    'Relative',
    'Legal Guardian',
    'Executor',
    'Other'
  ];

  const AssetCard: React.FC<{ asset: Asset; index: number }> = ({ asset, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      data-testid="asset-card"
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
          
          <div className="absolute top-2 right-2">
            <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
              asset.privacy === 'public' ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {getPrivacyIcon(asset.privacy)}
              <span className="ml-1 capitalize">{asset.privacy}</span>
            </div>
          </div>

          {asset.archive_status && asset.archive_status !== 'pending' && (
            <div className="absolute bottom-2 left-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getArchiveStatusColor(asset.archive_status)}`}>
                <Archive className="h-3 w-3 mr-1" />
                <span className="capitalize">{asset.archive_status.replace('_', ' ')}</span>
              </span>
            </div>
          )}
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
          
          <div className="space-y-2 text-sm text-gray-600 mb-4">
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

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAssignNOKClick(asset)}
              className="text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
            >
              <Users className="h-4 w-4 mr-1" />
              Assign NOK
            </Button>
            
            {asset.archive_status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAsset(asset);
                  setShowArchiveModal(true);
                }}
                disabled={balance < 300}
                className="text-accent-600 hover:text-accent-700 hover:bg-accent-50"
                title={balance < 300 ? 'Insufficient tokens (300 TMT required)' : 'Archive to Arweave'}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            )}
            
            {asset.arweave_tx_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://arweave.net/${asset.arweave_tx_id}`, '_blank')}
                className="text-success-600 hover:text-success-700 hover:bg-success-50"
              >
                <Archive className="h-4 w-4 mr-1" />
                View on Arweave
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAsset(asset);
                setShowDeleteModal(true);
              }}
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
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
      data-testid="asset-card"
    >
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {asset.media_type === 'video' ? (
              <video
                src={asset.media_url}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={asset.media_url}
                alt={asset.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{asset.title}</h3>
                {asset.description && (
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{asset.description}</p>
                )}
                
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    {getMediaIcon(asset.media_type)}
                    <span className="ml-1 capitalize">{asset.media_type}</span>
                  </div>
                  <div className="flex items-center">
                    {getPrivacyIcon(asset.privacy)}
                    <span className="ml-1 capitalize">{asset.privacy}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{format(new Date(asset.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignNOKClick(asset)}
                  className="text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Assign NOK
                </Button>
                
                {asset.archive_status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAsset(asset);
                      setShowArchiveModal(true);
                    }}
                    disabled={balance < 300}
                    className="text-accent-600 hover:text-accent-700 hover:bg-accent-50"
                    title={balance < 300 ? 'Insufficient tokens (300 TMT required)' : 'Archive to Arweave'}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                )}
                
                {asset.arweave_tx_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://arweave.net/${asset.arweave_tx_id}`, '_blank')}
                    className="text-success-600 hover:text-success-700 hover:bg-success-50"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    View on Arweave
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowDeleteModal(true);
                  }}
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assets</h1>
            <p className="text-gray-600">
              Manage and organize your tagged assets
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={fetchAssets}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/tag">
              <Button>
                <Plus className="h-5 w-5 mr-2" />
                Tag New Asset
              </Button>
            </Link>
          </div>
        </div>

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

            {/* Filters and View Toggle */}
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
                value={filterMediaType}
                onChange={(e) => setFilterMediaType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
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
                <option value="estimated_value">Sort by Value</option>
              </select>

              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
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

        {/* Assets Display */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-16">
            {searchTerm || filterPrivacy !== 'all' || filterMediaType !== 'all' ? (
              <>
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
                <p className="text-gray-600 mb-6">Start by tagging your first asset</p>
                <Link to="/tag">
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Tag Your First Asset
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
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

        {/* Add NOK and Assign Asset Modal */}
        <Modal
          isOpen={showAddNOKAndAssignModal}
          onClose={() => {
            setShowAddNOKAndAssignModal(false);
            setSelectedAssetForNOK(null);
            resetNOKForm();
          }}
          title="Add Next-of-Kin and Assign Asset"
          size="lg"
        >
          {selectedAssetForNOK && (
            <div className="space-y-6">
              {/* Asset Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Asset to Assign</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {selectedAssetForNOK.media_type === 'video' ? (
                      <video
                        src={selectedAssetForNOK.media_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={selectedAssetForNOK.media_url}
                        alt={selectedAssetForNOK.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedAssetForNOK.title}</h4>
                    <p className="text-sm text-gray-600">
                      Created {format(new Date(selectedAssetForNOK.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* NOK Form */}
              <form onSubmit={handleAddNOKAndAssign} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Next-of-Kin Details</h3>
                
                <Input
                  label="Full Name *"
                  value={nokFormData.name}
                  onChange={(e) => setNokFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  required
                />

                <Input
                  label="Email Address *"
                  type="email"
                  value={nokFormData.email}
                  onChange={(e) => setNokFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  icon={<Mail className="h-5 w-5 text-gray-400" />}
                  required
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={nokFormData.phone}
                  onChange={(e) => setNokFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  icon={<Phone className="h-5 w-5 text-gray-400" />}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship *
                  </label>
                  <select
                    value={nokFormData.relationship}
                    onChange={(e) => setNokFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select relationship</option>
                    {relationshipOptions.map(option => (
                      <option key={option} value={option.toLowerCase()}>{option}</option>
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
                    If you don't log in for this period, {nokFormData.name || 'this person'} will gain access to this asset.
                  </p>
                </div>

                {/* Privacy Protection Notice */}
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Timer className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-warning-700">
                      <p className="font-medium mb-1">Privacy Protection</p>
                      <p>
                        {nokFormData.name || 'This person'} will only know they've been assigned as your Next-of-Kin 
                        without seeing asset details until the Dead Man's Switch is triggered.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assignment Summary */}
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-primary-700">
                      <p className="font-medium mb-1">What will happen:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Create {nokFormData.name || 'this person'} as your Next-of-Kin</li>
                        <li>Assign "{selectedAssetForNOK.title}" to them</li>
                        <li>Set Dead Man's Switch for {dmsYearsForAssignment} year{dmsYearsForAssignment > 1 ? 's' : ''}</li>
                        <li>They'll be notified of the assignment (without asset details)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddNOKAndAssignModal(false);
                      setSelectedAssetForNOK(null);
                      resetNOKForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={addNOKAndAssignLoading}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Create NOK & Assign Asset
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>

        {/* Delete Asset Modal */}
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
              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-error-700">
                    <p className="font-medium mb-1">Confirm Deletion</p>
                    <p>This action cannot be undone. The asset and its media will be permanently deleted.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Asset to Delete</h4>
                <p className="text-sm text-gray-700 mb-2">{selectedAsset.title}</p>
                <p className="text-xs text-gray-500">
                  Created {format(new Date(selectedAsset.created_at), 'PPP')}
                </p>
              </div>

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
                <Button
                  variant="danger"
                  onClick={handleDeleteAsset}
                  loading={deleteLoading}
                  className="flex-1"
                >
                  Delete Asset
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Archive Asset Modal */}
        <Modal
          isOpen={showArchiveModal}
          onClose={() => {
            setShowArchiveModal(false);
            setSelectedAsset(null);
          }}
          title="Archive Asset to Arweave"
        >
          {selectedAsset && (
            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Archive className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-primary-700">
                    <p className="font-medium mb-1">Permanent Archiving</p>
                    <p>This will permanently store your asset on the Arweave blockchain for immutable proof of existence.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Asset to Archive</h4>
                <p className="text-sm text-gray-700 mb-2">{selectedAsset.title}</p>
                <p className="text-xs text-gray-500">
                  Created {format(new Date(selectedAsset.created_at), 'PPP')}
                </p>
              </div>

              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-warning-700">
                    <p className="font-medium mb-1">Cost: 300 TMT Tokens</p>
                    <p>Your current balance: {balance} TMT</p>
                    {balance < 300 && (
                      <p className="text-error-700 font-medium mt-1">
                        Insufficient tokens. You need {300 - balance} more TMT.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowArchiveModal(false);
                    setSelectedAsset(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleArchiveAsset}
                  loading={archiveLoading}
                  disabled={balance < 300}
                  className="flex-1"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive to Arweave
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};