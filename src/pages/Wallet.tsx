import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  Filter,
  Download,
  CreditCard,
  Smartphone,
  Gift,
  Award,
  Camera,
  Edit,
  Users,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Crown,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTokens } from '../hooks/useTokens';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { StripeCheckout } from '../components/ui/StripeCheckout';
import { createPaymentIntent, confirmPayment } from '../lib/stripe';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface TokenPackage {
  id: string;
  name: string;
  token_amount: number;
  bonus_tokens: number;
  price_gbp: number;
  price_xaf: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  source: string;
  description: string | null;
  created_at: string;
}

export const Wallet: React.FC = () => {
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'earned' | 'spent'>('all');
  const [filterSource, setFilterSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currency, setCurrency] = useState<'gbp' | 'xaf'>('gbp');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    paymentIntentId: string;
  } | null>(null);
  
  const { profile } = useAuth();
  const { balance, transactions, loading: tokensLoading, refreshWallet } = useTokens();

  useEffect(() => {
    fetchTokenPackages();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filterType, filterSource, searchTerm]);

  const fetchTokenPackages = async () => {
    try {
      // Fetch token packages from Supabase
      const { data: packages, error } = await supabase
        .from('token_packages')
        .select('*')
        .eq('active', true)
        .order('price_gbp', { ascending: true });

      if (error) {
        console.error('Error fetching token packages:', error);
        toast.error('Failed to load token packages');
        return;
      }

      setTokenPackages(packages || []);
    } catch (error) {
      console.error('Error fetching token packages:', error);
      toast.error('Failed to load token packages');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((tx: any) => tx.type === filterType);
    }

    // Source filter
    if (filterSource !== 'all') {
      filtered = filtered.filter((tx: any) => tx.source === filterSource);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((tx: any) =>
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (source: string, type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      signup: <Gift className="h-4 w-4" />,
      referral: <Users className="h-4 w-4" />,
      daily_login: <Calendar className="h-4 w-4" />,
      admin_reward: <Award className="h-4 w-4" />,
      purchase: <CreditCard className="h-4 w-4" />,
      tag_asset: <Camera className="h-4 w-4" />,
      edit_asset: <Edit className="h-4 w-4" />,
      upload_media: <ArrowUpRight className="h-4 w-4" />,
      assign_nok: <Users className="h-4 w-4" />,
      blockchain_publish: <Zap className="h-4 w-4" />
    };

    return iconMap[source] || (type === 'earned' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />);
  };

  const getTransactionColor = (type: string) => {
    return type === 'earned' ? 'text-success-600' : 'text-error-600';
  };

  const formatSource = (source: string) => {
    return source.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handlePurchase = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setShowPurchaseModal(true);
  };

  const processPurchase = async () => {
    if (!selectedPackage) return;

    setPaymentLoading(true);
    try {
      console.log('Processing purchase for package:', selectedPackage);
      const result = await createPaymentIntent(selectedPackage.id, currency);
      console.log('Payment intent result:', result);
      
      setPaymentData({
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      });
      
      setShowPurchaseModal(false);
      setShowStripeCheckout(true);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async (result: any) => {
    if (!selectedPackage || !user) return;

    try {
      console.log('Payment success result:', result);
      
      // Get payment record from database using the paymentIntent ID
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', result.id)
        .eq('user_id', user.id)
        .single();

      if (paymentError || !payment) {
        console.error('Payment record not found:', paymentError);
        throw new Error('Payment record not found');
      }

      if (payment.status === 'completed') {
        console.log('Payment already completed');
        toast.success('Payment already processed!');
        setShowStripeCheckout(false);
        setSelectedPackage(null);
        setPaymentData(null);
        return;
      }

      // Calculate total tokens (selectedPackage.token_amount already includes any bonuses)
      const totalTokens = selectedPackage.token_amount;

      // Update payment status
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', payment.id);

      if (updatePaymentError) {
        throw new Error('Failed to update payment status');
      }

      // Get current wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        throw new Error('User wallet not found');
      }

      // Update wallet balance
      const { error: updateWalletError } = await supabase
        .from('user_wallets')
        .update({ balance: wallet.balance + totalTokens })
        .eq('user_id', user.id);

      if (updateWalletError) {
        throw new Error('Failed to update wallet balance');
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          amount: totalTokens,
          type: 'earned',
          source: 'purchase',
          description: `Purchased ${totalTokens} TMT tokens`,
        });

      if (transactionError) {
        throw new Error('Failed to create transaction record');
      }
      
      toast.success(`Payment successful! ${totalTokens} TMT tokens added to your wallet.`);
      
      // Refresh wallet data
      await refreshWallet();
      
      // Close modals and reset state
      setShowStripeCheckout(false);
      setSelectedPackage(null);
      setPaymentData(null);
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Failed to confirm payment');
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  const handlePaymentCancel = () => {
    setShowStripeCheckout(false);
    setSelectedPackage(null);
    setPaymentData(null);
    setShowPurchaseModal(true);
  };

  const stats = [
    {
      title: 'Current Balance',
      value: `${balance} TMT`,
      icon: <WalletIcon className="h-8 w-8 text-primary-600" />,
      color: 'text-primary-600'
    },
    {
      title: 'Total Earned',
      value: `${transactions.filter((tx: any) => tx.type === 'earned').reduce((sum: number, tx: any) => sum + tx.amount, 0)} TMT`,
      icon: <TrendingUp className="h-8 w-8 text-success-600" />,
      color: 'text-success-600'
    },
    {
      title: 'Total Spent',
      value: `${Math.abs(transactions.filter((tx: any) => tx.type === 'spent').reduce((sum: number, tx: any) => sum + tx.amount, 0))} TMT`,
      icon: <TrendingDown className="h-8 w-8 text-error-600" />,
      color: 'text-error-600'
    },
    {
      title: 'Transactions',
      value: transactions.length.toString(),
      icon: <ArrowUpRight className="h-8 w-8 text-secondary-600" />,
      color: 'text-secondary-600'
    }
  ];

  const uniqueSources = [...new Set(transactions.map((tx: any) => tx.source))];

  // Quick actions - now includes influencer referrals for influencers
  const quickActions = [
    {
      title: 'Refer a Friend',
      description: 'Earn tokens by referring new users',
      icon: <Gift className="h-4 w-4" />,
      action: () => toast.info('Referral system coming soon!')
    },
    {
      title: 'Daily Check-in',
      description: 'Get daily bonus tokens',
      icon: <Calendar className="h-4 w-4" />,
      action: () => toast.info('Daily check-in coming soon!')
    },
    {
      title: 'View Rewards',
      description: 'See all available rewards',
      icon: <Award className="h-4 w-4" />,
      action: () => toast.info('Rewards page coming soon!')
    }
  ];

  // Add influencer referrals for influencers
  // All users can now access referrals
  if (profile) {
    quickActions.unshift({
      title: 'Referral Program',
      description: 'Earn tokens by referring friends',
      icon: <Crown className="h-4 w-4" />,
      action: () => {
        // Navigate to referrals page for all users
        window.location.href = '/referrals';
      }
    });
  }

  if (loading || tokensLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your wallet...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TMT Wallet</h1>
            <p className="text-gray-600">
              Manage your TagMyThing tokens and view transaction history
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={refreshWallet}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowPurchaseModal(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Buy Tokens
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  name="transaction-search"
                  className="flex-1"
                />
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  id="transaction-type-filter"
                  name="transaction-type-filter"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  <option value="earned">Earned</option>
                  <option value="spent">Spent</option>
                </select>

                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  id="transaction-source-filter"
                  name="transaction-source-filter"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Sources</option>
                  {uniqueSources.map(source => (
                    <option key={source} value={source}>
                      {formatSource(source)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction List */}
              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions found</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction: any, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'earned' ? 'bg-success-100' : 'bg-error-100'
                        }`}>
                          <div className={getTransactionColor(transaction.type)}>
                            {getTransactionIcon(transaction.source, transaction.type)}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {formatSource(transaction.source)}
                          </h4>
                          {transaction.description && (
                            <p className="text-sm text-gray-600">{transaction.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'earned' ? '+' : '-'}{Math.abs(transaction.amount)} TMT
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Token Packages */}
          <div>
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Buy Tokens</h2>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCurrency('gbp')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      currency === 'gbp'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    GBP
                  </button>
                  <button
                    onClick={() => setCurrency('xaf')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      currency === 'xaf'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    XAF
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {tokenPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                      <span className="text-lg font-bold text-primary-600">
                        {currency === 'gbp' ? `£${pkg.price_gbp.toFixed(2)}` : `${pkg.price_xaf} XAF`}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tokens:</span>
                        <span className="font-medium">{pkg.token_amount} TMT</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handlePurchase(pkg)}
                      className="w-full"
                      size="sm"
                    >
                      Purchase
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Payment Methods */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Methods</h3>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Stripe
                  </div>
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-1" />
                    Mobile Money
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={action.action}
                  >
                    {action.icon}
                    <div className="ml-2 text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-gray-600">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Purchase Modal */}
        <Modal
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedPackage(null);
          }}
          title="Purchase Tokens"
        >
          {selectedPackage ? (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedPackage.name}
                </h3>
                <div className="text-3xl font-bold text-primary-600 mb-4">
                  {currency === 'gbp' ? `£${selectedPackage.price_gbp.toFixed(2)}` : `${selectedPackage.price_xaf} XAF`}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between font-semibold">
                      <span>Tokens:</span>
                      <span>{selectedPackage.token_amount} TMT</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Select Payment Method</h4>
                
                <div className="space-y-3">
                  <button 
                    onClick={processPurchase}
                    disabled={paymentLoading}
                    className="w-full p-4 border border-gray-300 rounded-lg hover:border-primary-300 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-gray-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Credit/Debit Card</div>
                        <div className="text-sm text-gray-600">Powered by Stripe</div>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    disabled
                    className="w-full p-4 border border-gray-300 rounded-lg opacity-50 cursor-not-allowed text-left"
                  >
                    <div className="flex items-center">
                      <Smartphone className="h-5 w-5 text-gray-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Mobile Money</div>
                        <div className="text-sm text-gray-600">Coming Soon</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedPackage(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Choose a Token Package</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tokenPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className="p-4 border border-gray-300 rounded-lg hover:border-primary-300 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900 mb-1">{pkg.name}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {pkg.token_amount} TMT
                    </div>
                    <div className="font-semibold text-primary-600">
                      {currency === 'gbp' ? `£${pkg.price_gbp.toFixed(2)}` : `${pkg.price_xaf} XAF`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Modal>

        {/* Stripe Checkout Modal */}
        <Modal
          isOpen={showStripeCheckout}
          onClose={handlePaymentCancel}
          title=""
          size="lg"
        >
          {paymentData && selectedPackage && (
            <StripeCheckout
              clientSecret={paymentData.clientSecret}
              paymentIntentId={paymentData.paymentIntentId}
              packageName={selectedPackage.name}
              amount={currency === 'gbp' ? `£${selectedPackage.price_gbp.toFixed(2)}` : `${selectedPackage.price_xaf} XAF`}
              currency={currency}
              totalTokens={selectedPackage.token_amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
};