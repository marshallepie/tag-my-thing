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
                    TagMyThing lets you instantly tag and prove ownership of your assets—using
  )
}