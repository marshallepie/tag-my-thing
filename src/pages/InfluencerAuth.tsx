import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { AuthForm } from '../components/auth/AuthForm';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export const InfluencerAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const { isAuthenticated, loading, initialized, user } = useAuth();

  // Extract URL parameters for redirect after auth
  const urlParams = new URLSearchParams(location.search);
  const redirectParam = urlParams.get('redirect');
  const fromParam = urlParams.get('from');

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
    // Check if we need to redirect to a specific page (e.g., after tagging an asset)
    if (fromParam === 'tagging' && redirectParam) {
      console.log('InfluencerAuth - Authenticated, redirecting to original destination:', `${redirectParam}?from=${fromParam}`);
      return <Navigate to={`${redirectParam}?from=${fromParam}`} replace />;
    }
    console.log('InfluencerAuth - User already authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  const handleSuccess = () => {
    console.log('InfluencerAuth - Signup/signin successful');
    
    if (fromParam === 'tagging' && redirectParam) {
      // Redirect back to complete asset saving
      setTimeout(() => {
        navigate(`${redirectParam}?from=tagging`, { replace: true });
      }, 100);
    } else {
      // Default redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    }
  };

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
                <Crown className="h-12 w-12 text-yellow-600" />              </div>
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

          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-200 rounded-full opacity-20 blur-3xl" />
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