import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { TOKEN_PACKAGES } from '../lib/constants';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  source: string;
  description: string | null;
  created_at: string;
}

export const Wallet: React.FC = () => {
  const { t, ready } = useTranslation();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'earned' | 'spent'>('all');
  const [filterSource, setFilterSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const { profile, user } = useAuth();
  const { balance, transactions, loading: tokensLoading, refreshWallet } = useTokens();

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filterType, filterSource, searchTerm]);

  // Handle Stripe Payment Link redirect
  useEffect(() => {
    const handleStripeRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId && !processingPayment) {
        setProcessingPayment(true);
        
        try {
          // Get the current user's session to extract the access token
          const { data } = await supabase.auth.getSession();
          const access_token = data.session?.access_token;
          
          if (!access_token) {
            throw new Error('User is not authenticated.');
          }

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-stripe-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${access_token}`,
            },
            body: JSON.stringify({ sessionId }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            toast.success(`Payment successful! Your wallet has been credited with ${result.tokensAdded} TMT tokens.`);
            await refreshWallet();
          } else if (result.already_processed) {
            toast.info('This payment has already been processed.');
            // Still refresh wallet in case the balance wasn't updated in the UI
            await refreshWallet();
          } else {
            toast.error(result.error || 'Payment verification failed. Please contact support.');
          }
        } catch (error: any) {
          console.error('Error verifying payment:', error);
          toast.error('Payment verification failed. Please contact support if your payment was successful.');
        } finally {
          setProcessingPayment(false);
          
          // Clean up URL parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    };

    handleStripeRedirect();
  }, [processingPayment, refreshWallet]);

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

  const handlePurchase = (packageId?: string) => {
    if (!user) {
      toast.error('Please sign in to purchase tokens');
      return;
    }

    // Find the selected package or use the first one as default
    const selectedPackage = packageId 
      ? TOKEN_PACKAGES.find(pkg => pkg.id === packageId) 
      : TOKEN_PACKAGES[0];
    
    if (!selectedPackage) {
      toast.error('Invalid token package');
      return;
    }

    // Construct the Stripe Payment Link URL with success and cancel URLs
    const baseUrl = window.location.origin;
    const successUrl = `${baseUrl}/wallet?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/wallet?canceled=true`;
    
    const paymentUrl = `${selectedPackage.stripe_payment_link}?client_reference_id=${user.id}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
    
    // Redirect to Stripe Payment Link
    window.location.href = paymentUrl;
  };

  const stats = [
    {
      title: ready ? t('wallet.currentBalance') : 'Current Balance',
      value: `${balance} TMT`,
      icon: <WalletIcon className="h-8 w-8 text-primary-600" />,
      color: 'text-primary-600'
    },
    {
      title: ready ? t('wallet.totalEarned') : 'Total Earned',
      value: `${transactions.filter((tx: any) => tx.type === 'earned').reduce((sum: number, tx: any) => sum + tx.amount, 0)} TMT`,
      icon: <TrendingUp className="h-8 w-8 text-success-600" />,
      color: 'text-success-600'
    },
    {
      title: ready ? t('wallet.totalSpent') : 'Total Spent',
      value: `${Math.abs(transactions.filter((tx: any) => tx.type === 'spent').reduce((sum: number, tx: any) => sum + tx.amount, 0))} TMT`,
      icon: <TrendingDown className="h-8 w-8 text-error-600" />,
      color: 'text-error-600'
    },
    {
      title: ready ? t('wallet.transactions') : 'Transactions',
      value: transactions.length.toString(),
      icon: <ArrowUpRight className="h-8 w-8 text-secondary-600" />,
      color: 'text-secondary-600'
    }
  ];

  const uniqueSources = [...new Set(transactions.map((tx: any) => tx.source))];

  // Debug log to check processing payment state
  console.log('Processing Payment State:', processingPayment);

// ✅ FIXED: Remove role-based referral quick action - everyone gets referrals
const quickActions = [
  // ✅ NEW: Referral program available to ALL users
  {
    title: ready ? t('wallet.referralProgram') : 'Referral Program',
    description: ready ? t('wallet.earnTokensByReferring') : 'Earn tokens by referring friends',
    icon: <Share2 className="h-4 w-4" />,
    action: () => {
      window.location.href = '/referrals';
    }
  },
  {
    title: ready ? t('wallet.dailyCheckIn') : 'Daily Check-in',
    description: ready ? t('wallet.getDailyBonus') : 'Get daily bonus tokens',
    icon: <Calendar className="h-4 w-4" />,
    action: () => toast.info('Daily check-in coming soon!')
  },
  {
    title: ready ? t('wallet.viewRewards') : 'View Rewards',
    description: ready ? t('wallet.seeAllRewards') : 'See all available rewards',
    icon: <Award className="h-4 w-4" />,
    action: () => toast.info('Rewards page coming soon!')
  }
];
// ✅ FIXED: Remove the role-based conditional logic entirely
// OLD CODE TO REMOVE:
// if (profile && (profile.role === 'influencer' || profile.role === 'admin_influencer')) {
//   quickActions.unshift({
//     title: 'Referral Program',
//     description: 'Earn tokens by referring friends',
//     icon: <Crown className="h-4 w-4" />,
//     action: () => {
//       window.location.href = '/referrals';
//     }
//   });
// }

  if (loading || tokensLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{ready ? t('wallet.loadingWallet') : 'Loading your wallet...'}</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{ready ? t('wallet.title') : 'TMT Wallet'}</h1>
            <p className="text-gray-600">
              {ready ? t('wallet.subtitle') : 'Manage your TagMyThing tokens and view transaction history'}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={refreshWallet}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {ready ? t('wallet.refresh') : 'Refresh'}
            </Button>
            <Button
              onClick={() => {
                window.location.href = '/buy-tokens';
              }}
              disabled={processingPayment}
              className="lg:hidden"
            >
              <Plus className="h-5 w-5 mr-2" />
              {processingPayment ? (ready ? t('wallet.processing') : 'Processing...') : (ready ? t('wallet.buyTokens') : 'Buy Tokens')}
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
                <h2 className="text-xl font-semibold text-gray-900">{ready ? t('wallet.transactionHistory') : 'Transaction History'}</h2>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {ready ? t('wallet.export') : 'Export'}
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
                <Input
                  placeholder={ready ? t('wallet.searchTransactions') : 'Search transactions...'}
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
                  <option value="all">{ready ? t('wallet.allTypes') : 'All Types'}</option>
                  <option value="earned">{ready ? t('wallet.earned') : 'Earned'}</option>
                  <option value="spent">{ready ? t('wallet.spent') : 'Spent'}</option>
                </select>

                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  id="transaction-source-filter"
                  name="transaction-source-filter"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">{ready ? t('wallet.allSources') : 'All Sources'}</option>
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
                    <p className="text-gray-600">{ready ? t('wallet.noTransactionsFound') : 'No transactions found'}</p>
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

          {/* Buy Tokens CTA */}
          <div>
            <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {ready ? t('wallet.buyTokens') : 'Buy TMT Tokens'}
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {ready
                    ? t('wallet.buyTokensDescription', 'Choose from multiple payment methods and token packages')
                    : 'Choose from multiple payment methods and token packages'
                  }
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <span>Stripe</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Smartphone className="h-5 w-5 text-yellow-600" />
                    <span>MTN MOMO</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span>Paystack</span>
                  </div>
                </div>
                <Link to="/buy-tokens">
                  <Button size="lg" className="font-semibold">
                    <Plus className="h-5 w-5 mr-2" />
                    {ready ? t('wallet.buyTokens') : 'Buy Tokens'}
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Quick Actions - Available to ALL users now */}
<Card className="mt-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">{ready ? t('wallet.quickActions') : 'Quick Actions'}</h3>
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
      </div>
    </Layout>
  );
};