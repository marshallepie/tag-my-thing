import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  TrendingUp, 
  Award, 
  Calendar,
  Mail,
  ExternalLink,
  RefreshCw,
  Gift,
  Crown,
  Target,
  BarChart3,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useReferrals } from '../hooks/useReferrals';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const InfluencerReferrals: React.FC = () => {
  const [referralUrl, setReferralUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlLoaded, setUrlLoaded] = useState(false);
  const { 
    stats, 
    referredUsers, 
    referralSettings, 
    loading: dataLoading,
    error: dataError,
    getReferralUrl,
    refreshData,
    forceRefresh
  } = useReferrals();
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();

  // Set up real-time subscription for referral updates
  useEffect(() => {
    if (!user?.id || profile?.role !== 'influencer') return;

    console.log('InfluencerReferrals - Setting up real-time subscription for user:', user.id);

    // Subscribe to referrals table changes
    const referralsSubscription = supabase
      .channel('referrals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('InfluencerReferrals - Referrals change detected:', payload);
          // Refresh data when referrals change
          forceRefresh();
        }
      )
      .subscribe();

    // Subscribe to referral_rewards table changes
    const rewardsSubscription = supabase
      .channel('rewards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_rewards',
          filter: `referrer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('InfluencerReferrals - Rewards change detected:', payload);
          // Refresh data when rewards change
          forceRefresh();
        }
      )
      .subscribe();

    return () => {
      console.log('InfluencerReferrals - Cleaning up subscriptions');
      referralsSubscription.unsubscribe();
      rewardsSubscription.unsubscribe();
    };
  }, [user?.id, profile?.role, forceRefresh]);

  const loadReferralUrl = async () => {
    setUrlLoading(true);
    try {
      console.log('loadReferralUrl - Starting');
      const url = await getReferralUrl();
      console.log('loadReferralUrl - Got URL:', url);
      if (url) {
        setReferralUrl(url);
        setUrlLoaded(true);
        console.log('loadReferralUrl - Set URL state:', url);
      } else {
        console.log('loadReferralUrl - No URL returned');
      }
    } catch (error) {
      console.error('Error loading referral URL:', error);
      toast.error('Failed to load referral URL');
    } finally {
      setUrlLoading(false);
    }
  };

  useEffect(() => {
    // Only load referral URL once when profile is available and URL hasn't been loaded yet
    if (profile?.role === 'influencer' && !urlLoaded && !urlLoading) {
      console.log('InfluencerReferrals - Loading referral URL for first time');
      loadReferralUrl();
    }
  }, [profile?.role, urlLoaded, urlLoading]);

  // Separate effect for when referral code is updated in profile
  useEffect(() => {
    if (profile?.referral_code && !referralUrl && !urlLoading) {
      console.log('InfluencerReferrals - Profile has referral code, generating URL');
      const url = `${window.location.origin}/auth?ref=${profile.referral_code}`;
      setReferralUrl(url);
      setUrlLoaded(true);
    }
  }, [profile?.referral_code, referralUrl, urlLoading]);

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect if not authenticated or not an influencer
  if (!isAuthenticated || profile?.role !== 'influencer') {
    console.log('InfluencerReferrals - Redirecting, auth:', isAuthenticated, 'role:', profile?.role);
    return <Navigate to="/dashboard" replace />;
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Referral URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareReferralUrl = async () => {
    if (navigator.share && referralUrl) {
      try {
        await navigator.share({
          title: 'Join TagMyThing',
          text: 'Join me on TagMyThing - the secure way to tag and manage your assets!',
          url: referralUrl,
        });
      } catch (error) {
        // Fallback to copy
        copyToClipboard(referralUrl);
      }
    } else {
      copyToClipboard(referralUrl);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statsCards = [
    {
      title: 'Total Referred',
      value: stats.totalReferred.toString(),
      icon: <Users className="h-8 w-8 text-primary-600" />,
      color: 'text-primary-600',
      description: 'Users you\'ve referred'
    },
    {
      title: 'Total Earned',
      value: `${stats.totalEarned} TMT`,
      icon: <Award className="h-8 w-8 text-success-600" />,
      color: 'text-success-600',
      description: 'Tokens earned from referrals'
    },
    {
      title: 'Pending Rewards',
      value: `${stats.pendingRewards} TMT`,
      icon: <Clock className="h-8 w-8 text-warning-600" />,
      color: 'text-warning-600',
      description: 'Rewards being processed'
    },
    {
      title: 'Conversion Rate',
      value: stats.totalReferred > 0 ? `${Math.round((stats.totalReferred / 100) * 100)}%` : '0%',
      icon: <TrendingUp className="h-8 w-8 text-secondary-600" />,
      color: 'text-secondary-600',
      description: 'Signup to completion rate'
    }
  ];

  // Show error state
  if (dataError) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-error-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{dataError}</p>
            <Button onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state
  if (dataLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading referral data...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Influencer Referrals</h1>
            </div>
            <p className="text-gray-600">
              Earn tokens by referring new users to TagMyThing
            </p>
          </div>
          <Button
            onClick={refreshData}
            variant="outline"
            className="mt-4 sm:mt-0"
            disabled={dataLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
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
                    <p className="text-sm text-gray-600">{stat.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral URL Section */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referral Link</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral URL
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={referralUrl}
                      readOnly
                      className="flex-1 font-mono text-sm"
                      placeholder={urlLoading ? "Loading..." : "Generating URL..."}
                    />
                    <Button
                      onClick={() => copyToClipboard(referralUrl)}
                      variant="outline"
                      size="sm"
                      disabled={!referralUrl || urlLoading}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={shareReferralUrl}
                    className="flex-1"
                    disabled={!referralUrl || urlLoading}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Link
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(referralUrl)}
                    variant="outline"
                    disabled={!referralUrl || urlLoading}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Gift className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-primary-700">
                      <p className="font-medium mb-1">How it works:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Share your unique referral link</li>
                        <li>New users sign up using your link</li>
                        <li>Earn tokens for each successful referral</li>
                        <li>Get rewards up to 5 levels deep!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reward Structure */}
            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reward Structure</h3>
              
              <div className="space-y-3">
                {referralSettings.map((setting) => (
                  <div key={setting.referral_level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        setting.referral_level === 1 ? 'bg-primary-100 text-primary-700' :
                        setting.referral_level === 2 ? 'bg-secondary-100 text-secondary-700' :
                        setting.referral_level === 3 ? 'bg-accent-100 text-accent-700' :
                        setting.referral_level === 4 ? 'bg-warning-100 text-warning-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {setting.referral_level}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        Level {setting.referral_level}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {setting.token_reward} TMT
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-sm text-success-700">
                  <strong>Total possible per referral:</strong> {' '}
                  {referralSettings.reduce((sum, s) => sum + s.token_reward, 0)} TMT
                </p>
              </div>
            </Card>
          </div>

          {/* Referral Analytics */}
          <div className="lg:col-span-2">
            {/* Level Breakdown */}
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Level</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {stats.levelBreakdown.map((levelData) => (
                  <div key={levelData.referral_level} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2 ${
                      levelData.referral_level === 1 ? 'bg-primary-100 text-primary-700' :
                      levelData.referral_level === 2 ? 'bg-secondary-100 text-secondary-700' :
                      levelData.referral_level === 3 ? 'bg-accent-100 text-accent-700' :
                      levelData.referral_level === 4 ? 'bg-warning-100 text-warning-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {levelData.referral_level}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Level {levelData.referral_level}</div>
                    <div className="text-lg font-semibold text-gray-900">{levelData.count}</div>
                    <div className="text-xs text-gray-500">{levelData.earned} TMT earned</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Referred Users */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Referred Users</h3>
                <span className="text-sm text-gray-600">
                  {referredUsers.length} total referrals
                </span>
              </div>

              {referredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h4>
                  <p className="text-gray-600 mb-4">
                    Start sharing your referral link to earn tokens!
                  </p>
                  <Button onClick={shareReferralUrl} disabled={!referralUrl}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Referral Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {referredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.full_name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {getStatusIcon(user.status)}
                            <span className="ml-1 capitalize">{user.status}</span>
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Level {user.referral_level} • {user.reward_amount} TMT
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};