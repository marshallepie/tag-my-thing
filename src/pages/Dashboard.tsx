import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Wallet, Package, Users, TrendingUp, Plus, ArrowLeft, ArrowRight, Timer, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTokens } from '../hooks/useTokens';
import { useNOKAssignments } from '../hooks/useNOKAssignments';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Layout } from '../components/layout/Layout';

export const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const { balance, transactions } = useTokens();
  const { stats: nokStats, loading: nokLoading } = useNOKAssignments();

  const [totalAssets, setTotalAssets] = useState(0);
  const [assetsLoading, setAssetsLoading] = useState(true);

  // Fetch total assets when component mounts or user changes
  useEffect(() => {
    const fetchTotalAssets = async () => {
      if (!user) {
        console.log('Dashboard - fetchTotalAssets - No user found, skipping asset fetch');
        setAssetsLoading(false);
        return;
      }
      try {
        setAssetsLoading(true);
        console.log('Dashboard - fetchTotalAssets - Starting for user:', user.id);
        console.log('Dashboard - fetchTotalAssets - About to call get_user_asset_count RPC...');
        
        const { data, error } = await supabase.rpc('get_user_asset_count');
        
        console.log('Dashboard - fetchTotalAssets - get_user_asset_count RPC response:', { 
          data, 
          error, 
          dataType: typeof data,
          hasError: !!error,
          errorMessage: error?.message,
          errorCode: error?.code,
          errorDetails: error?.details
        });

        if (error) {
          console.error('Dashboard - fetchTotalAssets - RPC call failed with error:', error);
          throw error;
        }
        
        console.log('Dashboard - fetchTotalAssets - Setting totalAssets to:', data || 0);
        setTotalAssets(data || 0);
      } catch (error) {
        console.error('Dashboard - fetchTotalAssets - Unexpected error:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setTotalAssets(0); // Default to 0 on error
      } finally {
        console.log('Dashboard - fetchTotalAssets - Completed, setting assetsLoading to false');
        setAssetsLoading(false);
      }
    };

    fetchTotalAssets();
  }, [user]);

  // Log nokStats for debugging
  useEffect(() => {
    console.log('NOK Stats:', nokStats);
  }, [nokStats]);

  const quickActions = [
    {
      title: 'Tag New Asset',
      description: 'Capture and tag a new asset',
      icon: <Camera className="h-8 w-8" />,
      link: '/tag',
      color: 'bg-primary-600',
    },
    {
      title: 'View Assets',
      description: 'Browse your tagged assets',
      icon: <Package className="h-8 w-8" />,
      link: '/assets',
      color: 'bg-secondary-600',
    },
    {
      title: 'Next of Kin',
      description: 'Manage your digital legacy',
      icon: <Shield className="h-8 w-8" />,
      link: '/nok',
      color: 'bg-accent-600',
    },
  ];

  const recentTransactions = transactions.slice(0, 5);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || user?.email || 'User'}!
          </h1>
          <p className="text-gray-600">
            Manage your assets and track your digital legacy.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Wallet className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">TMT Balance</h3>
                  <p className="text-2xl font-bold text-primary-600">{balance}</p>
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
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-secondary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Total Assets</h3>
                  <p className="text-2xl font-bold text-secondary-600">
                    {assetsLoading ? '...' : totalAssets}
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
                <div className="flex-shrink-0">
                  <ArrowLeft className="h-8 w-8 text-accent-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Incoming NOK</h3>
                  <p className="text-2xl font-bold text-accent-600">
                    {nokLoading ? '...' : nokStats.incoming_count}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowRight className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Outgoing NOK</h3>
                  <p className="text-2xl font-bold text-success-600">
                    {nokLoading ? '...' : nokStats.outgoing_count}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* NOK Overview Section */}
        {!nokLoading && (nokStats.incoming_count > 0 || nokStats.outgoing_count > 0 || nokStats.upcoming_dms_count > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-primary-600" />
                    Next of Kin Overview
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <ArrowLeft className="h-4 w-4 text-secondary-600" />
                      <span className="text-gray-600">Incoming:</span>
                      <span className="font-semibold text-gray-900">{nokStats.incoming_count}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ArrowRight className="h-4 w-4 text-accent-600" />
                      <span className="text-gray-600">Outgoing:</span>
                      <span className="font-semibold text-gray-900">{nokStats.outgoing_count}</span>
                    </div>
                    {nokStats.upcoming_dms_count > 0 && (
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-warning-600" />
                        <span className="text-gray-600">Upcoming DMS:</span>
                        <span className="font-semibold text-warning-700">{nokStats.upcoming_dms_count}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Link to="/nok">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Manage NOK
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Link to={action.link}>
                    <Card hover className="text-center p-6 h-full">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${action.color} text-white mb-4`}>
                        {action.icon}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Get Started Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
                <h3 className="text-xl font-semibold mb-2">Ready to start tagging?</h3>
                <p className="text-primary-100 mb-4">
                  Capture your first asset and experience the power of TagMyThing.
                </p>
                <Link to="/tag">
                  <Button variant="secondary" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Tag Your First Asset
                  </Button>
                </Link>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <Card>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.source.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`font-semibold ${
                        transaction.type === 'earned' ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {transaction.type === 'earned' ? '+' : '-'}{Math.abs(transaction.amount)} TMT
                      </span>
                    </div>
                  ))}
                  <Link to="/wallet" className="block text-center">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Transactions
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start tagging assets to see your activity
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};