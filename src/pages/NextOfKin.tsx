import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Trash2, 
  Eye, 
  UserPlus,
  Heart,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Send,
  AlertCircle
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

interface NextOfKin {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: string;
  photo_url: string | null;
  status: 'pending' | 'verified' | 'declined';
  created_at: string;
  updated_at: string;
}

interface Asset {
  id: string;
  title: string;
  media_type: 'photo' | 'video';
  media_url: string;
  privacy: 'private' | 'public';
  created_at: string;
}

interface NOKFormData {
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

export const NextOfKin: React.FC = () => {
  const [nokList, setNokList] = useState<NextOfKin[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredNOK, setFilteredNOK] = useState<NextOfKin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedNOK, setSelectedNOK] = useState<NextOfKin | null>(null);
  const [formData, setFormData] = useState<NOKFormData>({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'declined'>('all');
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    filterNOK();
  }, [nokList, searchTerm, filterStatus]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch NOK list
      const { data: nokData, error: nokError } = await supabase
        .from('next_of_kin')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (nokError) throw nokError;
      setNokList(nokData || []);

      // Fetch user's assets for assignment
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('id, title, media_type, media_url, privacy, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (assetError) throw assetError;
      setAssets(assetData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterNOK = () => {
    let filtered = nokList;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(nok =>
        nok.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nok.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nok.relationship.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(nok => nok.status === filterStatus);
    }

    setFilteredNOK(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      relationship: ''
    });
  };

  const handleAddNOK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('next_of_kin')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          relationship: formData.relationship,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Next of Kin added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error adding NOK:', error);
      toast.error('Failed to add Next of Kin');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditNOK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNOK) return;

    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('next_of_kin')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          relationship: formData.relationship
        })
        .eq('id', selectedNOK.id);

      if (error) throw error;

      toast.success('Next of Kin updated successfully!');
      setShowEditModal(false);
      setSelectedNOK(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error updating NOK:', error);
      toast.error('Failed to update Next of Kin');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteNOK = async () => {
    if (!selectedNOK) return;

    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('next_of_kin')
        .delete()
        .eq('id', selectedNOK.id);

      if (error) throw error;

      toast.success('Next of Kin removed successfully!');
      setShowDeleteModal(false);
      setSelectedNOK(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting NOK:', error);
      toast.error('Failed to remove Next of Kin');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (nok: NextOfKin) => {
    setSelectedNOK(nok);
    setFormData({
      name: nok.name,
      email: nok.email,
      phone: nok.phone || '',
      relationship: nok.relationship
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (nok: NextOfKin) => {
    setSelectedNOK(nok);
    setShowDeleteModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-600" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-error-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'declined':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    {
      title: 'Total NOK',
      value: nokList.length.toString(),
      icon: <Users className="h-8 w-8 text-primary-600" />,
      color: 'text-primary-600'
    },
    {
      title: 'Verified',
      value: nokList.filter(nok => nok.status === 'verified').length.toString(),
      icon: <CheckCircle className="h-8 w-8 text-success-600" />,
      color: 'text-success-600'
    },
    {
      title: 'Pending',
      value: nokList.filter(nok => nok.status === 'pending').length.toString(),
      icon: <Clock className="h-8 w-8 text-warning-600" />,
      color: 'text-warning-600'
    },
    {
      title: 'Assets',
      value: assets.length.toString(),
      icon: <Shield className="h-8 w-8 text-secondary-600" />,
      color: 'text-secondary-600'
    }
  ];

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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Next of Kin...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Next of Kin</h1>
            <p className="text-gray-600">
              Manage who can access your assets in the future
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="mt-4 sm:mt-0">
            <Plus className="h-5 w-5 mr-2" />
            Add Next of Kin
          </Button>
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

        {nokList.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-16 w-16 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Next of Kin Added</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Secure your digital legacy by adding trusted people who can access your assets when needed.
            </p>
            <Button size="lg" onClick={() => setShowAddModal(true)}>
              <UserPlus className="h-5 w-5 mr-2" />
              Add Your First Next of Kin
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search Next of Kin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-5 w-5 text-gray-400" />}
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>
            </div>

            {/* NOK Grid */}
            {filteredNOK.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Next of Kin found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNOK.map((nok, index) => (
                  <motion.div
                    key={nok.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hover className="h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {nok.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{nok.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">{nok.relationship}</p>
                          </div>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(nok.status)}`}>
                          {getStatusIcon(nok.status)}
                          <span className="ml-1 capitalize">{nok.status}</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{nok.email}</span>
                        </div>
                        {nok.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{nok.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Added {format(new Date(nok.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(nok)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(nok)}
                          className="text-error-600 hover:text-error-700 hover:bg-error-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {nok.status === 'pending' && (
                        <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-xs text-warning-700">
                              <p className="font-medium mb-1">Verification Pending</p>
                              <p>This person needs to verify their email to access your assets.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add NOK Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          title="Add Next of Kin"
        >
          <form onSubmit={handleAddNOK} className="space-y-4">
            <Input
              label="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              required
            />

            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
              icon={<Phone className="h-5 w-5 text-gray-400" />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship *
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select relationship</option>
                {relationshipOptions.map(option => (
                  <option key={option} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-primary-700">
                  <p className="font-medium mb-1">Privacy & Security</p>
                  <p>This person will receive an email to verify their identity before gaining access to any assigned assets.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitLoading}
                className="flex-1"
              >
                Add Next of Kin
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit NOK Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedNOK(null);
            resetForm();
          }}
          title="Edit Next of Kin"
        >
          <form onSubmit={handleEditNOK} className="space-y-4">
            <Input
              label="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              required
            />

            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
              icon={<Phone className="h-5 w-5 text-gray-400" />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship *
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select relationship</option>
                {relationshipOptions.map(option => (
                  <option key={option} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedNOK(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitLoading}
                className="flex-1"
              >
                Update Next of Kin
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedNOK(null);
          }}
          title="Remove Next of Kin"
        >
          {selectedNOK && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {selectedNOK.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedNOK.name}</h3>
                  <p className="text-sm text-gray-600">{selectedNOK.email}</p>
                </div>
              </div>
              
              <p className="text-gray-600">
                Are you sure you want to remove this Next of Kin? They will lose access to any assigned assets.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedNOK(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteNOK}
                  loading={submitLoading}
                  className="flex-1"
                >
                  Remove Next of Kin
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};