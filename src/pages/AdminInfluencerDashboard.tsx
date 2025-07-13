import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Coins, 
  TrendingUp, 
  Search, 
  Edit, 
  Plus, 
  Minus,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  UserCheck,
  Wallet,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Crown,
  Shield,
  AlertCircle,
  CheckCircle,
  DollarSign
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

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  subscription_plan: string;
  created_at: string;
  referral_code: string | null;
  balance?: number;
}

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  totalTokensDistributed: number;
  totalTransactions: number;
  totalAssets: number;
}

interface TokenAdjustment {
  userId: string;
  amount: number;
  reason: string;
}

export const AdminInfluencerDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsersToday: 0,
    newUsersWeek: 0,
    newUsersMonth: 0,
    totalTokensDistributed: 0,
    totalTransactions: 0,
    totalAssets: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [tokenAdjustment, setTokenAdjustment] = useState<TokenAdjustment>({
    userId: '',
    amount: 0,
    reason: ''
  });
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);

  const { isAdminInfluencer } = useAuth();

  useEffect(() => {
    if (isAdminInfluencer) {
      fetchDashboardData();
    }
  }, [isAdminInfluencer]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users with their wallet balances
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          subscription_plan,
          created_at,
          referral_code,
          user_wallets(balance)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Transform the data to include balance
      const transformedUsers = usersData?.map(user => ({
        ...user,
        balance: user.user_wallets?.[0]?.balance || 0
      })) || [];

      setUsers(transformedUsers);

      // Fetch analytics using the RPC function
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_user_analytics');

      if (analyticsError) {
        console.error('Analytics error:', analyticsError);
        // Calculate basic stats manually if RPC fails
        calculateBasicStats(transformedUsers);
      } else if (analyticsData?.success) {
        setStats({
          totalUsers: analyticsData.user_stats.total_users,
          newUsersToday: analyticsData.user_stats.new_users_today,
          newUsersWeek: analyticsData.user_stats.new_users_week,
          newUsersMonth: analyticsData.user_stats.new_users_month,
          totalTokensDistributed: analyticsData.token_stats.total_tokens_distributed,
          totalTransactions: analyticsData.token_stats.total_transactions,
          totalAssets: analyticsData.asset_stats.total_assets
        });
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateBasicStats = (usersData: UserProfile[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newUsersToday = usersData.filter(user => 
      new Date(user.created_at) >= today
    ).length;

    const newUsersWeek = usersData.filter(user => 
      new Date(user.created_at) >= weekAgo
    ).length;

    const newUsersMonth = usersData.filter(user => 
      new Date(user.created_at) >= monthAgo
    ).length;

    const totalTokensDistributed = usersData.reduce((sum, user) => 
      sum + (user.balance || 0), 0
    );

    setStats({
      totalUsers: usersData.length,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      totalTokensDistributed,
      totalTransactions: 0, // Would need separate query
      totalAssets: 0 // Would need separate query
    });
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleTokenAdjustment = async () => {
    if (!selectedUser || !tokenAdjustment.reason.trim()) {
      toast.error('Please provide a reason for the token adjustment');
      return;
    }

    setAdjustmentLoading(true);
    try {
      const { data, error } = await supabase.rpc('adjust_user_tokens', {
        target_user_id: selectedUser.id,
        adjustment_amount: tokenAdjustment.amount,
        adjustment_reason: tokenAdjustment.reason
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Successfully adjusted tokens for ${selectedUser.email}`);
        setShowTokenModal(false);
        setTokenAdjustment({ userId: '', amount: 0, reason: '' });
        setSelectedUser(null);
        fetchDashboardData(); // Refresh data
      } else {
        toast.error(data?.error || 'Failed to adjust tokens');
      }
    } catch (error: any) {
      console.error('Token adjustment error:', error);
      toast.error('Failed to adjust tokens');
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const openTokenModal = (user: UserProfile) => {
    setSelectedUser(user);
    setTokenAdjustment({
      userId: user.id,
      amount: 0,
      reason: ''
    });
    setShowTokenModal(true);
  };

  const openEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
      case 'admin_influencer':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'influencer':
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <UserCheck className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'admin_influencer':
        return 'bg-yellow-100 text-yellow-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'influencer':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="h-8 w-8 text-primary-600" />,
      color: 'text-primary-600',
      change: `+${stats.newUsersToday} today`
    },
    {
      title: 'New Users (Week)',
      value: stats.newUsersWeek.toLocaleString(),
      icon: <TrendingUp className="h-8 w-8 text-success-600" />,
      color: 'text-success-600',
      change: `+${stats.newUsersMonth} this month`
    },
    {
      title: 'Total Tokens',
      value: `${stats.totalTokensDistributed.toLocaleString()} TMT`,
      icon: <Coins className="h-8 w-8 text-warning-600" />,
      color: 'text-warning-600',
      change: `${stats.totalTransactions} transactions`
    },
    {
      title: 'Total Assets',
      value: stats.totalAssets.toLocaleString(),
      icon: <BarChart3 className="h-8 w-8 text-secondary-600" />,
      color: 'text-secondary-600',
      change: 'Tagged by users'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
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
            <div className="flex items-center space-x-3 mb-2">
              <Crown className="h-8 w-8 text-yellow-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">
              Manage users, monitor activity, and oversee platform operations
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
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
                    <p className="text-sm text-gray-600">{stat.change}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* User Management Section */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Announcements
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search users by email, name, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-5 w-5 text-gray-400" />}
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="influencer">Influencers</option>
              <option value="moderator">Moderators</option>
              <option value="admin">Admins</option>
              <option value="admin_influencer">Admin Influencers</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.referral_code && (
                          <div className="text-xs text-primary-600">
                            Code: {user.referral_code}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Coins className="h-4 w-4 text-warning-600 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          {user.balance?.toLocaleString() || 0} TMT
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTokenModal(user)}
                        >
                          <Wallet className="h-4 w-4 mr-1" />
                          Tokens
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found matching your criteria</p>
            </div>
          )}
        </Card>

        {/* Token Adjustment Modal */}
        <Modal
          isOpen={showTokenModal}
          onClose={() => {
            setShowTokenModal(false);
            setSelectedUser(null);
            setTokenAdjustment({ userId: '', amount: 0, reason: '' });
          }}
          title="Adjust Token Balance"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">User Information</h3>
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {selectedUser.full_name || 'No name'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Current Balance:</strong> {selectedUser.balance?.toLocaleString() || 0} TMT
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Amount
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTokenAdjustment(prev => ({ ...prev, amount: prev.amount - 10 }))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={tokenAdjustment.amount}
                    onChange={(e) => setTokenAdjustment(prev => ({ 
                      ...prev, 
                      amount: parseInt(e.target.value) || 0 
                    }))}
                    className="text-center"
                    placeholder="0"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTokenAdjustment(prev => ({ ...prev, amount: prev.amount + 10 }))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to add tokens, negative to remove
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  value={tokenAdjustment.reason}
                  onChange={(e) => setTokenAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why you're adjusting this user's token balance..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {tokenAdjustment.amount !== 0 && (
                <div className={`p-3 rounded-lg ${
                  tokenAdjustment.amount > 0 ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'
                }`}>
                  <div className="flex items-center">
                    {tokenAdjustment.amount > 0 ? (
                      <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-error-600 mr-2" />
                    )}
                    <span className={`text-sm font-medium ${
                      tokenAdjustment.amount > 0 ? 'text-success-800' : 'text-error-800'
                    }`}>
                      {tokenAdjustment.amount > 0 ? 'Adding' : 'Removing'} {Math.abs(tokenAdjustment.amount)} tokens
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${
                    tokenAdjustment.amount > 0 ? 'text-success-700' : 'text-error-700'
                  }`}>
                    New balance will be: {((selectedUser.balance || 0) + tokenAdjustment.amount).toLocaleString()} TMT
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTokenModal(false);
                    setSelectedUser(null);
                    setTokenAdjustment({ userId: '', amount: 0, reason: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTokenAdjustment}
                  loading={adjustmentLoading}
                  disabled={!tokenAdjustment.reason.trim() || tokenAdjustment.amount === 0}
                  className="flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Apply Adjustment
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          title="Edit User Profile"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm text-primary-700 font-medium">
                    User profile editing coming soon
                  </span>
                </div>
                <p className="text-xs text-primary-600 mt-1">
                  This feature will allow you to edit user roles, subscription plans, and other profile details.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Current User Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedUser.full_name || 'No name'}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <p><strong>Plan:</strong> {selectedUser.subscription_plan}</p>
                  <p><strong>Referral Code:</strong> {selectedUser.referral_code || 'None'}</p>
                  <p><strong>Joined:</strong> {format(new Date(selectedUser.created_at), 'PPP')}</p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};