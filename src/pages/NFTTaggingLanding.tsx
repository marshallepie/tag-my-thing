import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Shield, Palette, Music, Lightbulb, QrCode, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';

export const NFTTaggingLanding: React.FC = () => {
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

  const benefits = [
    {
      icon: <Music className="h-8 w-8 text-primary-600" />,
      title: 'For Songwriters and Musicians',
      description: 'Imagine tagging your lyrics, melodies, and even your final recordings. Each tag creates a digital fingerprint for your work, ensuring that your creative property is uniquely yours and can be easily verified by others.',
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-secondary-600" />,
      title: 'For Inventors',
      description: 'Protect your innovations by tagging the details of your inventions. Whether it\'s a groundbreaking gadget or a unique process, you can secure a digital record that confirms your ownership and originality.',
    },
    {
      icon: <Palette className="h-8 w-8 text-accent-600" />,
      title: 'For Artists and NFT Creators',
      description: 'Whether it\'s a traditional painting or a digital NFT, tagging your art ensures that each piece has a verified digital identity. This not only protects your work but also enhances its value and trustworthiness in the marketplace.',
    },
    {
      icon: <QrCode className="h-8 w-8 text-success-600" />,
      title: 'Future Possibilities with QR Codes',
      description: 'Soon, you could generate a TagMyThing QR code for your physical items. Anyone scanning the QR code would be instantly directed to the tag, allowing for quick and easy verification.',
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
              <span className="text-xl font-bold text-gray-900">TagMyThing</span>
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
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Digital Asset & NFT
                <span className="block text-primary-600">Tagging</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Unlock the Power of TagMyThing for Your Creative and Inventive Works
              </p>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed">
                Welcome to a new era of authenticity and protection for your creative masterpieces and innovative inventions. 
                With TagMyThing, you can ensure that your work is securely tagged and easily verifiable.
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
                onClick={() => handleNavigation('/tag')}
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Tagging Now
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleNavigation('/influencer-signup')}
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
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
              Protect Your Creative Work
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Secure digital fingerprints for all your creative and inventive works
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Join the Creative Community
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Join the community of creators and innovators who trust TagMyThing to protect and authenticate their most valuable work. 
              Sign up now and start tagging your creations today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleNavigation('/tag')}
              >
                <Camera className="h-5 w-5 mr-2" />
                Tag Your Creation
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-purple-600"
                onClick={() => handleNavigation('/influencer-signup')}
              >
                Create Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};