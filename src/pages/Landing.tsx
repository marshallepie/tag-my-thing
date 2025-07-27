import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Shield, Smartphone, Globe, ArrowRight, CheckCircle, Megaphone, Package, Palette, Heart, Building } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  
  // Navigation handler using React Router
  const handleNavigation = (path: string) => {
    try {
      if (path.startsWith('http')) {
        // External links
        window.open(path, '_blank');
      } else {
        // Internal navigation using React Router
        navigate(path);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback only for external or problematic routes
      window.location.href = path;
    }
  };

  const features = [
    {
      icon: <Camera className="h-8 w-8 text-primary-600" />,
      title: 'Camera-First Tagging',
      description: 'Capture and tag your assets instantly with our intuitive camera interface.',
    },
    {
      icon: <Shield className="h-8 w-8 text-primary-600" />,
      title: 'Blockchain Security',
      description: 'Secure your asset records with blockchain technology for immutable proof.',
    },
    {
      icon: <Smartphone className="h-8 w-8 text-primary-600" />,
      title: 'Mobile Optimized',
      description: 'Fully responsive design that works perfectly on all your devices.',
    },
    {
      icon: <Globe className="h-8 w-8 text-primary-600" />,
      title: 'Global Access',
      description: 'Access your assets from anywhere with secure cloud storage.',
    },
  ];

  const benefits = [
    'Tag unlimited physical and digital assets',
    'Secure blockchain publishing available',
    'Next of Kin assignment for legacy planning',
    'Token-based economy with rewards',
    'Multi-currency payment support',
    '24/7 customer support',
  ];

  const useCases = [
    {
      icon: <Package className="h-8 w-8 text-primary-600" />,
      title: 'General Ownership',
      description: 'Document and verify ownership of any valuable possession',
      link: '/general-tagging'
    },
    {
      icon: <Palette className="h-8 w-8 text-purple-600" />,
      title: 'Digital Assets & NFTs',
      description: 'Protect your creative works and digital collectibles',
      link: '/nft-tagging'
    },
    {
      icon: <Heart className="h-8 w-8 text-amber-600" />,
      title: 'MyWill & Legacy',
      description: 'Preserve your intentions and secure your digital legacy',
      link: '/mywill-tagging'
    },
    {
      icon: <Building className="h-8 w-8 text-blue-600" />,
      title: 'Business & Inventory',
      description: 'Two-factor product authentication for businesses',
      link: '/business-tagging'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button 
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-1 sm:space-x-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src="/tagmaithing.png" 
                alt="TagMyThing" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold text-gray-900">TagMyThing</span>
            </button>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center text-xs sm:text-sm px-2 sm:px-3"
                onClick={() => handleNavigation('/launch')}
              >
                  <Megaphone className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Launch Campaign</span>
                  <span className="xs:hidden">Launch</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
                onClick={() => handleNavigation('/auth')}
              >
                  Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Launch Announcement Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium">
              🚀 TagMyThing is now LIVE! Get 50 TMT tokens free when you sign up.{' '}
              <button 
                onClick={() => handleNavigation('/launch')}
                className="underline hover:no-underline"
              >
                Learn more →
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Tag, Manage & Secure
                <span className="block text-primary-600">Your Assets</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                The evolution of asset management. Tag your physical and digital assets, 
                secure them with blockchain technology, and manage your digital legacy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleNavigation('/tag')}
              >
                  <Camera className="h-5 w-5 mr-2" />
                  Tag an Asset Now
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleNavigation('/auth')}
              >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">50+</div>
                <div className="text-gray-600">Free TMT Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">∞</div>
                <div className="text-gray-600">Asset Tagging</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">24/7</div>
                <div className="text-gray-600">Secure Access</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-200 rounded-full opacity-20 blur-3xl" />
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage and secure your assets in one platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Use Case
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover how TagMyThing can be tailored to your specific needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full cursor-pointer" onClick={() => handleNavigation(useCase.link)}>
                  <div className="flex justify-center mb-4">
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {useCase.description}
                  </p>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    console.log('Learn More button clicked for:', useCase.title, 'Link:', useCase.link);
                    handleNavigation(useCase.link);
                  }}>
                    Learn More
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Why Choose TagMyThing?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built for the modern world, TagMyThing combines cutting-edge technology 
                with intuitive design to give you complete control over your assets.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
                <p className="text-primary-100 mb-6">
                  Join thousands of users who trust TagMyThing to secure their assets.
                </p>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full"
                onClick={() => handleNavigation('/tag')}
                >
                    Start Free Today
                    <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Start Tagging Today
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Get 50 TMT tokens free when you sign up. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleNavigation('/tag')}
              >
                  <Camera className="h-5 w-5 mr-2" />
                  Tag Your First Asset
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600"
                onClick={() => handleNavigation('/auth')}
              >
                  Create Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};