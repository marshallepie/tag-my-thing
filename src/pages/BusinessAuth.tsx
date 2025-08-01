import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, Shield, QrCode, CheckCircle } from 'lucide-react';
import { AuthForm } from '../components/auth/AuthForm';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { TOKEN_PACKAGES } from '../lib/constants';

export const BusinessAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const { isAuthenticated, loading, initialized } = useAuth();

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

  if (!initialized) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (isAuthenticated) {
    if (fromParam === 'tagging' && redirectParam) {
      return <Navigate to={`${redirectParam}?from=${fromParam}`} replace />;
    }
    return <Navigate to="/business-dashboard" replace />;
  }

  const handleSuccess = () => {
    if (fromParam === 'tagging' && redirectParam) {
      navigate(`${redirectParam}?from=tagging`, { replace: true });
    } else {
      navigate('/business-dashboard', { replace: true });
    }
  };

  const businessFeatures = [
    {
      icon: <QrCode className="h-6 w-6 text-primary-600" />,
      title: 'QR Code Generation',
      description: 'Automatically generate unique QR codes for each product'
    },
    {
      icon: <Shield className="h-6 w-6 text-secondary-600" />,
      title: 'Product Verification',
      description: 'Enable customers to verify product authenticity instantly'
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-success-600" />,
      title: 'Scan History Tracking',
      description: 'Monitor scan patterns to identify potential counterfeits'
    }
  ];

  const businessPlans = TOKEN_PACKAGES.filter(pkg => 
    pkg.id === 'pro_business' || pkg.id === 'enterprise'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
              <span className="text-xl font-bold text-gray-900">Tag<span className="text-primary-600">My</span>Thing</span>
              <div className="flex items-center space-x-1 ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                <Building className="h-3 w-3" />
                <span>Business</span>
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
                <Building className="h-12 w-12 text-blue-600" />
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Business Account Setup
                </h1>
              </div>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Protect your products with TagMyThing's business verification system
              </p>
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
              <AuthForm 
                mode={mode} 
                onSuccess={handleSuccess} 
                initialRole="user"
                defaultIsBusinessUser={true}
              />
              
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  {mode === 'signin' ? "Don't have a business account?" : 'Already have a business account?'}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="mt-2"
                >
                  {mode === 'signin' ? 'Create Business Account' : 'Sign In'}
                </Button>
              </div>
            </motion.div>

            {/* Business Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="order-1 lg:order-2"
            >
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Business Features
                </h2>
                
                <div className="space-y-6 mb-8">
                  {businessFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Business Plans */}
                {businessPlans.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Business Subscription Plans
                    </h3>
                    <div className="space-y-3">
                      {businessPlans.map((plan) => (
                        <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{plan.name}</h4>
                            <span className="text-lg font-bold text-primary-600">
                              £{plan.price_gbp.toFixed(2)}/month
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {plan.token_amount} TMT tokens per month
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200 rounded-full opacity-20 blur-3xl" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Building className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Protect Your Products?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join businesses that trust TagMyThing's verification system to protect their products and build customer confidence.
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <Building className="h-5 w-5 mr-2" />
                Start Your Business Journey
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};