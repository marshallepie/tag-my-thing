import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Star, Users, TrendingUp, Gift, CheckCircle } from 'lucide-react';
import { AuthForm } from '../components/auth/AuthForm';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export const InfluencerAuth: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const { isAuthenticated, loading, initialized, user } = useAuth();

  // Navigation handler
  const handleNavigation = (path: string) => {
    try {
      if (path.startsWith('http')) {
        window.open(path, '_blank');
      } else {
        navigate(path);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = path;
    }
  };

  // Show loading while auth is initializing - but with timeout
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    console.log('InfluencerAuth - User already authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  const handleSuccess = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    const from = urlParams.get('from');
    
    console.log('InfluencerAuth - Signup/signin successful');
    
    if (from === 'tagging' && redirect) {
      // Redirect back to complete asset saving
      navigate(`${redirect}?from=tagging`, { replace: true });
    } else {
      // Default redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
    if (from === 'tagging' && redirect) {
      // Redirect back to complete asset saving
      navigate(`${redirect}?from=tagging`, { replace: true });
    } else {
      // Default redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  };

  const influencerBenefits = [
    {
      icon: <Crown className="h-6 w-6 text-yellow-600" />,
      title: 'Exclusive Influencer Status',
      description: 'Get special recognition and access to influencer-only features'
    },
    {
      icon: <Users className="h-6 w-6 text-primary-600" />,
      title: 'Multi-Level Referrals',
      description: 'Earn tokens from referrals up to 5 levels deep'
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-success-600" />,
      title: 'Higher Rewards',
      description: 'Earn more tokens per referral than regular users'
    },
    {
      icon: <Gift className="h-6 w-6 text-accent-600" />,
      title: 'Bonus Tokens',
      description: 'Get 100 TMT tokens instead of the standard 50 on signup'
    }
  ];

  const rewardStructure = [
    { referral_level: 1, tokens: 50, description: 'Direct referrals' },
    { referral_level: 2, tokens: 30, description: 'Second level' },
    { referral_level: 3, tokens: 20, description: 'Third level' },
    { referral_level: 4, tokens: 10, description: 'Fourth level' },
    { referral_level: 5, tokens: 5, description: 'Fifth level' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-primary-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button 
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src="/tagmaithing.png" 
                alt="TagMyThing" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-gray-900">TagMyThing</span>
              <div className="flex items-center space-x-1 ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                <Crown className="h-3 w-3" />
                <span>Influencer</span>
              </div>
            </button>

            {/* Navigation Links */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => handleNavigation('/auth')}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Regular Signup
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Crown className="h-12 w-12 text-yellow-600" />
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Join as an
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-primary-600">
                  Influencer
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Unlock exclusive benefits, earn more tokens, and build your referral empire 
                with TagMyThing's Influencer Program.
              </p>

              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-8">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  <span>100 TMT Welcome Bonus</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  <span>5-Level Referral System</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  <span>Exclusive Features</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Auth Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-2 lg:order-1"
            >
              <AuthForm mode={mode} onSuccess={handleSuccess} initialRole="influencer" />
              
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="mt-2"
                >
                  {mode === 'signin' ? 'Create Account' : 'Sign In'}
                </Button>
              </div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="order-1 lg:order-2 space-y-8"
            >
              {/* Influencer Benefits */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Influencer Benefits</h2>
                <div className="space-y-6">
                  {influencerBenefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                        <p className="text-gray-600 text-sm">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Reward Structure */}
              <div className="bg-gradient-to-br from-primary-50 to-yellow-50 rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Referral Rewards</h2>
                <div className="space-y-4">
                  {rewardStructure.map((reward, index) => (
                    <motion.div
                      key={reward.referral_level}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          reward.referral_level === 1 ? 'bg-primary-100 text-primary-700' :
                          reward.referral_level === 2 ? 'bg-secondary-100 text-secondary-700' :
                          reward.referral_level === 3 ? 'bg-accent-100 text-accent-700' :
                          reward.referral_level === 4 ? 'bg-warning-100 text-warning-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {reward.referral_level}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Level {reward.referral_level}</div>
                          <div className="text-sm text-gray-600">{reward.description}</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary-600">
                        {reward.tokens} TMT
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-success-600" />
                    <span className="font-semibold text-success-800">
                      Total potential: {rewardStructure.reduce((sum, r) => sum + r.tokens, 0)} TMT per referral chain
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-200 rounded-full opacity-20 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Influencer Status?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get access to exclusive features designed specifically for content creators and influencers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl"
            >
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Referral Dashboard</h3>
              <p className="text-gray-600">
                Advanced analytics and tracking for all your referrals with detailed performance metrics
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl"
            >
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Priority Support</h3>
              <p className="text-gray-600">
                Get dedicated support and early access to new features as a verified influencer
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-gradient-to-br from-success-50 to-success-100 rounded-2xl"
            >
              <div className="w-16 h-16 bg-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Higher Earnings</h3>
              <p className="text-gray-600">
                Earn significantly more tokens through our multi-level referral system
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-yellow-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Crown className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Become an Influencer?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of influencers earning tokens through TagMyThing's referral program
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    // Fallback: scroll to top of page
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <Crown className="h-5 w-5 mr-2" />
                Start Your Influencer Journey
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};