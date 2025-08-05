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
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Timer,
  Zap,
  RefreshCw,
  Package,
  Target,
  Share2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNOKAssignments } from '../hooks/useNOKAssignments';
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

interface NOKFormData {
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

interface Asset {
  id: string;
  title: string;
  media_type: 'photo' | 'video';
  media_url: string;
  privacy: 'private' | 'public';
  created_at: string;
}

export const NextOfKin: React.FC = () => {
  const [nokList, setNokList] = useState<NextOfKin[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredNOK, setFilteredNOK] = useState<NextOfKin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMassAssignModal, setShowMassAssignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showOutgoingModal, setShowOutgoingModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const [selectedNOK, setSelectedNOK] = useState<NextOfKin | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [formData, setFormData] = useState<NOKFormData>({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'declined'>('all');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [massAssignLoading, setMassAssignLoading] = useState(false);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [selectedDMSYears, setSelectedDMSYears] = useState(1);
  const [activeTab, setActiveTab] = useState<'nok-list' | 'incoming' | 'outgoing'>('nok-list');
  
  const { user } = useAuth();
  const {
    incomingAssignments,
    outgoingAssignments,
    stats,
    loading: assignmentsLoading,
    assignNOKToAsset,
    massAssignAssetsToNOK,
    reassignIncomingAssignment,
    refreshAssignments
  } = useNOKAssignments();

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

  const handleMassAssign = async () => {
    if (!selectedNOK) return;

    setMassAssignLoading(true);
    try {
      const dmsDate = new Date();
      dmsDate.setFullYear(dmsDate.getFullYear() + selectedDMSYears);

      const success = await massAssignAssetsToNOK(selectedNOK.id, dmsDate);
      if (success) {
        setShowMassAssignModal(false);
        setSelectedNOK(null);
        await refreshAssignments();
      }
    } catch (error: any) {
      console.error('Error mass assigning:', error);
      toast.error('Failed to mass assign assets');
    } finally {
      setMassAssignLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedAssignment || !selectedNOK) return;

    setReassignLoading(true);
    try {
      const success = await reassignIncomingAssignment(selectedAssignment.assignment_id, selectedNOK.id);
      if (success) {
        setShowReassignModal(false);
        setSelectedAssignment(null);
        setSelectedNOK(null);
        await refreshAssignments();
      }
    } catch (error: any) {
      console.error('Error reassigning:', error);
      toast.error('Failed to reassign assignment');
    } finally {
      setReassignLoading(false);
    }
  };

  const handleSendInvite = async (nok: NextOfKin) => {
    if (!user) return;

    setInviteLoading(nok.id);
    try {
      // First, update NOK status to 'invited' via RPC
      const { data: inviteData, error: inviteError } = await supabase.rpc('send_nok_invite', {
        p_nok_id: nok.id
      });

      if (inviteError) throw inviteError;

      if (!inviteData?.success) {
        throw new Error(inviteData?.error || 'Failed to update NOK status');
      }

      // Then, call the Edge Function to send the actual email
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-nok-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nokId: nok.id,
          nokEmail: nok.email,
          nokName: nok.name,
          nominatorName: profile?.full_name || user.email,
          relationship: nok.relationship
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation email');
      }

      if (result.success) {
        toast.success(`Invitation sent to ${nok.name}!`);
        await fetchData(); // Refresh NOK list to show updated status
      } else {
        throw new Error(result.error || 'Failed to send invitation');
      }
    } catch (error: any) {
      console.error('Error sending NOK invite:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(null);
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

  const openMassAssignModal = (nok: NextOfKin) => {
    setSelectedNOK(nok);
    setSelectedDMSYears(1);
    setShowMassAssignModal(true);
  };

  const openReassignModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowReassignModal(true);
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
      case 'invited':
        return 'bg-secondary-100 text-secondary-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'declined':
        return 'bg-error-100 text-error-800';
      case 'reverted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDMSStatusIcon = (status: string) => {
    switch (status) {
      case 'triggered':
        return <Zap className="h-4 w-4 text-warning-600" />;
      case 'active':
        return <Timer className="h-4 w-4 text-primary-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-error-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDMSStatusColor = (status: string) => {
    switch (status) {
      case 'triggered':
        return 'bg-warning-100 text-warning-800';
      case 'active':
        return 'bg-primary-100 text-primary-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDaysUntilDMS = (days: number) => {
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  const statsData = [
    {
      title: 'Total NOK',
      value: nokList.length.toString(),
      icon: <Users className="h-8 w-8 text-primary-600" />,
      color: 'text-primary-600'
    },
    {
      title: 'Incoming NOK',
      value: stats.incoming_count.toString(),
      icon: <ArrowLeft className="h-8 w-8 text-secondary-600" />,
      color: 'text-secondary-600'
    },
    {
      title: 'Outgoing NOK',
      value: stats.outgoing_count.toString(),
      icon: <ArrowRight className="h-8 w-8 text-accent-600" />,
      color: 'text-accent-600'
    },
    {
      title: 'Upcoming DMS',
      value: stats.upcoming_dms_count.toString(),
      icon: <Timer className="h-8 w-8 text-warning-600" />,
      color: 'text-warning-600'
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

  if (loading || assignmentsLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Next of Kin data...</p>
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
              Manage who can access your assets with Dead Man's Switch protection
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={refreshAssignments}
              disabled={assignmentsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${assignmentsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Next of Kin
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
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

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'nok-list', name: 'Next of Kin List', icon: <Users className="h-5 w-5" /> },
                { id: 'incoming', name: `Incoming (${stats.incoming_count})`, icon: <ArrowLeft className="h-5 w-5" /> },
                { id: 'outgoing', name: `Outgoing (${stats.outgoing_count})`, icon: <ArrowRight className="h-5 w-5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'nok-list' && (
          <>
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
              Secure your digital legacy by adding trusted people who can access your assets with Dead Man's Switch protection.
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
                    id="status-filter"
                    name="status-filter"
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

                      <div className="space-y-2">
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
                          
                          {/* Send Invite / Resend Invite Button */}
                          {(nok.status === 'pending' || nok.status === 'invited') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendInvite(nok)}
                              loading={inviteLoading === nok.id}
                              className="flex-1 text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              {nok.status === 'invited' ? 'Resend' : 'Invite'}
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(nok)}
                            className="text-error-600 hover:text-error-700 hover:bg-error-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Mass Assign Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMassAssignModal(nok)}
                          className="w-full text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Assign All Assets
                        </Button>
                      </div>

                      {nok.status === 'pending' && (
                        <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-xs text-warning-700">
                              <p className="font-medium mb-1">Verification Pending</p>
                              <p>Send an invitation to this person so they can accept the nomination.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {nok.status === 'invited' && (
                        <div className="mt-4 p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                          <div className="flex items-start">
                            <Send className="h-4 w-4 text-secondary-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-xs text-secondary-700">
                              <p className="font-medium mb-1">Invitation Sent</p>
                              <p>This person has been invited and needs to sign up or log in to accept.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {nok.status === 'reverted' && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-start">
                            <XCircle className="h-4 w-4 text-gray-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-xs text-gray-700">
                              <p className="font-medium mb-1">Account Deleted</p>
                              <p>This person's account was deleted. You may need to re-invite them.</p>
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
          </>
        )}

        {/* Incoming Assignments Tab */}
        {activeTab === 'incoming' && (
          <div className="space-y-6">
            {incomingAssignments.length === 0 ? (
              <div className="text-center py-16">
                <ArrowLeft className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Incoming Assignments</h3>
                <p className="text-gray-600">No one has assigned you as their Next of Kin yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {incomingAssignments.map((assignment, index) => (
                  <motion.div
                    key={assignment.assignment_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {assignment.can_view_details ? assignment.asset_title : 'Asset Assignment'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            From: {assignment.can_view_details ? assignment.assigner_full_name || assignment.assigner_email : 'Someone'}
                          </p>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDMSStatusColor(assignment.status)}`}>
                          {getDMSStatusIcon(assignment.status)}
                          <span className="ml-1 capitalize">{assignment.status}</span>
                        </div>
                      </div>

                      {assignment.can_view_details && assignment.asset_media_url && (
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                          {assignment.asset_media_type === 'video' ? (
                            <video
                              src={assignment.asset_media_url}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img
                              src={assignment.asset_media_url}
                              alt={assignment.asset_title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Timer className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>DMS Date: {format(new Date(assignment.dms_date), 'MMM d, yyyy')}</span>
                        </div>
                        {assignment.access_granted_at && (
                          <div className="flex items-center text-sm text-success-600">
                            <Zap className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>Access granted: {format(new Date(assignment.access_granted_at), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>

                      {assignment.status !== 'triggered' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReassignModal(assignment)}
                          className="w-full"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Reassign to Someone Else
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Outgoing Assignments Tab */}
        {activeTab === 'outgoing' && (
          <div className="space-y-6">
            {outgoingAssignments.length === 0 ? (
              <div className="text-center py-16">
                <ArrowRight className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Outgoing Assignments</h3>
                <p className="text-gray-600">You haven't assigned any Next of Kin to your assets yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outgoingAssignments.map((assignment, index) => (
                  <motion.div
                    key={assignment.assignment_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{assignment.asset_title}</h3>
                          <p className="text-sm text-gray-600">
                            Assigned to: {assignment.nok_name} ({assignment.nok_relationship})
                          </p>
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDMSStatusColor(assignment.status)}`}>
                          {getDMSStatusIcon(assignment.status)}
                          <span className="ml-1 capitalize">{assignment.status}</span>
                        </div>
                      </div>

                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                        {assignment.asset_media_type === 'video' ? (
                          <video
                            src={assignment.asset_media_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={assignment.asset_media_url}
                            alt={assignment.asset_title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Timer className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>DMS: {formatDaysUntilDMS(assignment.days_until_dms)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{assignment.nok_email}</span>
                        </div>
                        {assignment.access_granted_at && (
                          <div className="flex items-center text-sm text-success-600">
                            <Zap className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>Access granted: {format(new Date(assignment.access_granted_at), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
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
                id="relationship-select"
                name="relationship"
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

            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-start">
                <Timer className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-warning-700">
                  <p className="font-medium mb-1">Dead Man's Switch Protection</p>
                  <p>This person will only gain access to assigned assets if you don't log in for the specified time period. They won't see asset details until then.</p>
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

        {/* Mass Assign Modal */}
        <Modal
          isOpen={showMassAssignModal}
          onClose={() => {
            setShowMassAssignModal(false);
            setSelectedNOK(null);
            setSelectedDMSYears(1);
          }}
          title="Mass Assign All Assets"
        >
          {selectedNOK && (
            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {selectedNOK.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedNOK.name}</h3>
                    <p className="text-sm text-gray-600">{selectedNOK.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dead Man's Switch Period
                </label>
                <select
                  value={selectedDMSYears}
                  onChange={(e) => setSelectedDMSYears(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>1 Year</option>
                  <option value={2}>2 Years</option>
                  <option value={3}>3 Years</option>
                  <option value={4}>4 Years</option>
                  <option value={5}>5 Years</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  If you don't log in for this period, {selectedNOK.name} will gain access to all your assets.
                </p>
              </div>

              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Package className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-warning-700">
                    <p className="font-medium mb-1">Mass Assignment</p>
                    <p>This will assign ALL your current assets ({assets.length} assets) to {selectedNOK.name}. They will only gain access if the Dead Man's Switch is triggered.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMassAssignModal(false);
                    setSelectedNOK(null);
                    setSelectedDMSYears(1);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMassAssign}
                  loading={massAssignLoading}
                  className="flex-1"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Assign All Assets
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Reassign Modal */}
        <Modal
          isOpen={showReassignModal}
          onClose={() => {
            setShowReassignModal(false);
            setSelectedAssignment(null);
            setSelectedNOK(null);
          }}
          title="Reassign Assignment"
        >
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Current Assignment</h3>
                <p className="text-sm text-gray-600">
                  You are assigned as Next of Kin for an asset from{' '}
                  {selectedAssignment.can_view_details ? selectedAssignment.assigner_full_name || selectedAssignment.assigner_email : 'someone'}.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reassign to Next of Kin
                </label>
                <select
                  value={selectedNOK?.id || ''}
                  onChange={(e) => {
                    const nok = nokList.find(n => n.id === e.target.value);
                    setSelectedNOK(nok || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Next of Kin</option>
                  {nokList.filter(nok => nok.status === 'verified').map(nok => (
                    <option key={nok.id} value={nok.id}>
                      {nok.name} ({nok.relationship})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Share2 className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-warning-700">
                    <p className="font-medium mb-1">Reassignment</p>
                    <p>This will transfer the Next of Kin responsibility to the selected person. The original Dead Man's Switch date will remain the same.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedAssignment(null);
                    setSelectedNOK(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReassign}
                  loading={reassignLoading}
                  disabled={!selectedNOK}
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Reassign
                </Button>
              </div>
            </div>
          )}
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
                id="edit-relationship-select"
                name="edit-relationship"
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