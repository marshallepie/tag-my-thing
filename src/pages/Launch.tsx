import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Shield, 
  Smartphone, 
  Globe, 
  ArrowRight, 
  CheckCircle, 
  Copy, 
  Check,
  Clock,
  Coins,
  Play,
  Calendar,
  Users,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Layout } from '../components/layout/Layout';

export const Launch: React.FC = () => {
  const navigate = useNavigate();
  const [copiedPost, setCopiedPost] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 14,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Countdown timer logic
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Navigation handler using React Router
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

  const socialPosts = {
    twitter: "🚀 TagMyThing is LIVE! \n\nInstantly tag & prove ownership of your assets with:\n📸 Camera-first tagging\n🔐 Blockchain security\n🪙 Token-based access\n\nGet 50 TMT tokens FREE when you sign up!\n\n#TagMyThing #DigitalOwnership #Blockchain\n\nhttps://tag-my-thing.netlify.app",
    
    instagram: "Own it. Prove it. Share it. 📸✨\n\nTagMyThing is revolutionizing how we manage our valuables! Tag your physical and digital assets with photos/videos and secure them on the blockchain.\n\n🎁 Get 50 TMT tokens FREE with signup\n🔐 Blockchain-secured ownership\n📱 Mobile-first design\n🌍 Access from anywhere\n\nReady to secure your assets? Link in bio!\n\n#TagMyThing #AssetManagement #Blockchain #DigitalOwnership #TechInnovation #Security",
    
    linkedin: "Excited to announce the launch of TagMyThing - a revolutionary platform for digital asset management! 🚀\n\nKey features:\n• Camera-first asset tagging\n• Blockchain-secured ownership proof\n• Token-based economy (50 TMT free on signup)\n• Mobile-optimized experience\n• Next-of-kin legacy planning\n\nThis represents a significant step forward in how we think about digital ownership and asset security. The combination of intuitive UX with cutting-edge blockchain technology makes asset management accessible to everyone.\n\nTry it today: https://tag-my-thing.netlify.app\n\n#Innovation #Blockchain #AssetManagement #DigitalTransformation #TechLaunch"
  };

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPost(platform);
    setTimeout(() => setCopiedPost(null), 2000);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        {/* Hero Section with Countdown */}
        <section className="relative overflow-hidden py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium mb-6">
                  <Zap className="h-4 w-4 mr-2" />
                  Now Live in Beta!
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                  Welcome to
                  <span className="block text-primary-600">TagMyThing</span>
                </h1>
                
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                  <strong>Own it. Prove it. Share it.</strong><br />
                  TagMyThing is the secure way to digitally tag your valuables with photos or videos 
                  and lock them to your identity on the blockchain. Get started free. No registration needed.
                </p>

                {/* Elevator Pitch */}
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">The Elevator Pitch</h2>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    TagMyThing lets you instantly tag and prove ownership of your assets using
                    just your camera and blockchain technology. Whether it's your car, jewelry, 
                    electronics, or digital files, create an immutable record of ownership that 
                    travels with you anywhere in the world.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button
                    onClick={() => handleNavigation('/tag-asset')}
                    size="lg"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Start Tagging Now
                  </Button>
                  <Button
                    onClick={() => handleNavigation('/dashboard')}
                    variant="outline"
                    size="lg"
                    className="px-8 py-4 text-lg"
                  >
                    View Dashboard
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose TagMyThing?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Secure, simple, and powerful asset management for the digital age
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="p-6 text-center">
                <Camera className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Camera First</h3>
                <p className="text-gray-600">
                  Tag assets instantly with photos or videos
                </p>
              </Card>

              <Card className="p-6 text-center">
                <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Blockchain Secure</h3>
                <p className="text-gray-600">
                  Immutable proof of ownership on the blockchain
                </p>
              </Card>

              <Card className="p-6 text-center">
                <Coins className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Token Economy</h3>
                <p className="text-gray-600">
                  Earn and spend TMT tokens for platform features
                </p>
              </Card>

              <Card className="p-6 text-center">
                <Globe className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Global Access</h3>
                <p className="text-gray-600">
                  Access your assets from anywhere in the world
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Media Promotion Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Help Us Spread the Word!
              </h2>
              <p className="text-xl text-gray-600">
                Share TagMyThing with your network and help others secure their assets
              </p>
            </div>

            <div className="space-y-6">
              {/* Twitter Post */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Twitter/X Post</h3>
                  <Button
                    onClick={() => copyToClipboard(socialPosts.twitter, 'twitter')}
                    variant="outline"
                    size="sm"
                  >
                    {copiedPost === 'twitter' ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedPost === 'twitter' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
                  {socialPosts.twitter}
                </div>
              </Card>

              {/* Instagram Post */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Instagram Post</h3>
                  <Button
                    onClick={() => copyToClipboard(socialPosts.instagram, 'instagram')}
                    variant="outline"
                    size="sm"
                  >
                    {copiedPost === 'instagram' ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedPost === 'instagram' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
                  {socialPosts.instagram}
                </div>
              </Card>

              {/* LinkedIn Post */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">LinkedIn Post</h3>
                  <Button
                    onClick={() => copyToClipboard(socialPosts.linkedin, 'linkedin')}
                    variant="outline"
                    size="sm"
                  >
                    {copiedPost === 'linkedin' ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedPost === 'linkedin' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
                  {socialPosts.linkedin}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Secure Your Assets?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of users who trust TagMyThing to protect their valuables
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => handleNavigation('/tag-asset')}
                size="lg"
                className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 text-lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Tagging Now
              </Button>
              <Button
                onClick={() => handleNavigation('/dashboard')}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg"
              >
                View Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};