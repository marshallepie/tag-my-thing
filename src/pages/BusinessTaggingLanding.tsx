import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Shield, QrCode, Building, CheckCircle, ArrowRight, Key, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';

export const BusinessTaggingLanding: React.FC = () => {
  const navigate = useNavigate();
  
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

  const steps = [
    {
      number: '1',
      title: 'Assign Unique Serial & QR Code',
      description: 'Each product gets a unique serial number and an automatically generated QR code that links to its TagMyThing record.',
      icon: <QrCode className="h-8 w-8 text-primary-600" />
    },
    {
      number: '2',
      title: 'Attach QR Code to Product',
      description: 'Apply the QR code to your product via sticker, engraving, or integration into packaging for easy customer access.',
      icon: <Key className="h-8 w-8 text-secondary-600" />
    },
    {
      number: '3',
      title: 'Customer Scans QR Code',
      description: 'Customers use any QR code scanner to instantly access the product\'s TagMyThing verification page.',
      icon: <Shield className="h-8 w-8 text-success-600" />
    },
    {
      number: '4',
      title: 'View Authenticity & Scan History',
      description: 'Customers see product details and scan history. Unusual patterns or locations help identify potential counterfeits.',
      icon: <Lock className="h-8 w-8 text-accent-600" />
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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
            </button>

            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigation('/auth')}
              >
                Sign In
              </Button>
              <Button 
                size="sm"
                onClick={() => handleNavigation('/influencer-signup')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Business & Inventory
                <span className="block text-primary-600">Tagging</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                TagMyThing for Businesses: Simple, Secure Product Authentication with QR Codes
              </p>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed">
                TagMyThing offers a lightweight product verification system built for businesses. Each product is assigned a unique serial number and an automatically generated QR code. When customers scan the code, they can instantly verify the product's authenticity and view its scan history. This helps identify counterfeits through unusual scan patterns or locations, giving customers confidence and protecting your brand—all without complex cryptographic systems.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleNavigation('/business-auth')}
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Protecting Products
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleNavigation('/business-auth')}
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
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
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A simple four-step process to secure your products against counterfeiting
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {step.number}
                    </div>
                  </div>
                  <div className="pt-6">
                    <div className="flex justify-center mb-4">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
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
                Our simple yet effective system assigns each product a unique serial number and QR code. When customers scan the code, 
                they instantly see the product's verification page with its complete scan history. Unusual scan patterns—like multiple 
                scans from different countries or suspicious frequency—help identify potential counterfeits. This transparency builds 
                customer confidence while protecting your brand reputation.
              </p>
              
              <div className="space-y-4">
                {[
                  'Simple QR code system requires no complex setup',
                  'Instant verification with complete scan history',
                  'Unusual patterns help identify potential counterfeits',
                  'Scalable for any production volume',
                  'Builds customer trust through transparency'
                ].map((benefit, index) => (
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
                <Building className="h-16 w-16 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Simple & Transparent</h3>
                <p className="text-primary-100 mb-6">
                  Our lightweight QR code system provides effective protection through transparency and scan history tracking, scaling effortlessly with your business growth.
                </p>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full"
                  onClick={() => handleNavigation('/tag')}
                >
                  Start Simple Product Authentication
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
              Protect Your Products Today
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join forward-thinking businesses that trust TagMyThing's simple QR code authentication to protect their products and build customer confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleNavigation('/business-auth')}
              >
                <Shield className="h-5 w-5 mr-2" />
                Start Product Authentication
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600"
                onClick={() => handleNavigation('/business-auth')}
              >
                Create Business Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};