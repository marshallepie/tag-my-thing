// REWRITTEN LANDING PAGE BASED ON THE NEW NARRATIVE
// Focus: "Take a picture. Attach a message. Store it forever."
// Removed emphasis on asset management, security, and legacy — those are optional consequences, not the pitch

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, ArrowRight, Megaphone, CheckCircle, Package, Palette, Heart, Building } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';

export const Landing: React.FC = () => {
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

  const features = [
    {
      icon: <Camera className="h-8 w-8 text-primary-600" />,
      title: 'Snap & Tag Instantly',
      description: 'Capture any object or moment. Attach your message. Save it permanently.',
    },
    {
      icon: <Palette className="h-8 w-8 text-purple-600" />,
      title: 'Your Message, Your Way',
      description: 'Write anything — a note, a memory, a warning, or a whisper to the future.',
    },
    {
      icon: <Heart className="h-8 w-8 text-amber-600" />,
      title: 'Pass It On',
      description: 'Optionally transfer your tag to someone else, now or later — even after death.',
    },
    {
      icon: <Building className="h-8 w-8 text-blue-600" />,
      title: 'Built on the Permaweb',
      description: 'Stored forever on Arweave — no subscriptions, no deletion, no expiration.',
    },
  ];

  return (
    <div className="min-h-screen">
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
              <span className="text-xl font-bold text-gray-900">
                Tag<span className="text-primary-400">My</span>Thing
              </span>
            </button>

            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleNavigation('/launch')}
              >
                <Megaphone className="h-4 w-4 mr-1" /> Launch
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigation('/auth')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm font-medium">
          ✨ Take a picture. Attach a message. Store it forever.{' '}
          <button onClick={() => handleNavigation('/launch')} className="underline ml-2">Start tagging →</button>
        </div>
      </div>

      <header className="py-16 lg:py-24 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            A Digital Message in a Bottle
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            With TagMyThing, you can snap a photo, write a message, and preserve it forever — public or private. Later, you can even pass it on to someone else.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button size="lg" onClick={() => handleNavigation('/tag')}>
            <Camera className="h-5 w-5 mr-2" /> Tag Something Now
          </Button>
          <Button variant="outline" size="lg" onClick={() => handleNavigation('/auth')}>
            Create Account <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </motion.div>
      </header>

      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              You don’t need to overthink it. Just snap, write, and tag — and it’s there forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Start Tagging for Free
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Create your first tag today. Store your message in a bottle — digitally and permanently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" onClick={() => handleNavigation('/tag')}>
              <Camera className="h-5 w-5 mr-2" /> Tag Something Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary-600"
              onClick={() => handleNavigation('/auth')}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
