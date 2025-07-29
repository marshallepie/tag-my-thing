import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Heart, Users, FileText, Shield, Clock, ArrowRight, Watch, Image, Coins } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';

export const MyWillTaggingLanding: React.FC = () => {
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
      icon: <Heart className="h-8 w-8 text-primary-600" />,
      title: 'Clear Intentions',
      description: 'Document the sentimental value, history, and specific instructions for each item, preventing disputes and ensuring your wishes are honored.',
    },
    {
      icon: <Coins className="h-8 w-8 text-secondary-600" />,
      title: 'Digital Asset Management',
      description: 'Securely record access details for digital accounts, cryptocurrencies, online subscriptions, and other intangible assets, making them discoverable and manageable for your next-of-kin.',
    },
    {
      icon: <Users className="h-8 w-8 text-accent-600" />,
      title: 'Next-of-Kin Access',
      description: 'Designate trusted individuals (Next-of-Kin) who can access specific tagged information when the time comes, ensuring a smooth transition.',
    },
    {
      icon: <Clock className="h-8 w-8 text-success-600" />,
      title: 'Living Document',
      description: 'Easily update your wishes and add new items as your life evolves, keeping your legacy plan current and comprehensive.',
    },
  ];

  const examples = [
    {
      icon: <Watch className="h-12 w-12 text-primary-600" />,
      title: 'Family Heirlooms',
      description: 'Tag a cherished antique watch with a video explaining its history, its sentimental value, and your wish for it to go to a specific grandchild, along with a personal message. This ensures the story and intention are passed down with the item.',
    },
    {
      icon: <Image className="h-12 w-12 text-secondary-600" />,
      title: 'Digital Photo Archives',
      description: 'Document the location and access credentials for your extensive cloud-based photo albums, along with instructions on how to share them with family members, ensuring precious memories are not lost.',
    },
    {
      icon: <Coins className="h-12 w-12 text-accent-600" />,
      title: 'Cryptocurrency Wallets',
      description: 'Securely record details for your cryptocurrency wallets, including recovery phrases and specific instructions for transfer or management, ensuring your digital wealth is accessible to your designated beneficiaries.',
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
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                MyWill & Legacy
                <span className="block text-primary-600">Tagging</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Secure Your Legacy: Beyond the Last Will and Testament
              </p>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-8 leading-relaxed">
                Your possessions tell a story, and your intentions for them are deeply personal. MyWill/Legacy Tagging with TagMyThing 
                allows you to create a living, verifiable record of your wishes for physical and digital assets, ensuring your legacy 
                is preserved and your intentions are clearly understood by those you leave behind.
              </p>
              <p className="text-lg font-medium text-primary-700 max-w-3xl mx-auto mb-12">
                This is not just a place to leave your <em>last</em> will—it's a place to record your <em>first</em> will, 
                and every intention in between.
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
                Start Your Legacy
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
              Key Benefits
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Preserve your legacy with comprehensive digital documentation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full">
                  <div className="flex justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples Section */}
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
              Legacy Examples
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how TagMyThing can preserve your intentions and memories
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {examples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center h-full">
                  <div className="flex justify-center mb-6">
                    {example.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {example.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {example.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Start Building Your Digital Legacy
            </h2>
            <p className="text-xl text-amber-100 mb-8">
              Ensure your wishes are preserved and your loved ones understand your intentions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleNavigation('/tag')}
              >
                <Heart className="h-5 w-5 mr-2" />
                Create Your Legacy
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-amber-600"
                onClick={() => handleNavigation('/influencer-signup')}
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};