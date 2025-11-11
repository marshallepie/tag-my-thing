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
    const targetDate = new Date('August 28, 2025 08:00:00 GMT');

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
    twitter: "🚀 TagMyThing is LIVE! \n\nInstantly tag & prove ownership of your assets with:\n📸 Camera-first tagging\n🔐 Blockchain security\n🪙 Token-based access\n\nGet 50 TMT tokens FREE when you sign up!\n\n#TagMyThing #DigitalOwnership #Blockchain\n\nhttps://tagmything.com",
    
    instagram: "Own it. Prove it. Share it. 📸✨\n\nTagMyThing is revolutionizing how we manage our valuables! Tag your physical and digital assets with photos/videos and secure them on the blockchain.\n\n🎁 Get 50 TMT tokens FREE with signup\n🔐 Blockchain-secured ownership\n📱 Mobile-first design\n🌍 Access from anywhere\n\nReady to secure your assets? Link in bio!\n\n#TagMyThing #AssetManagement #Blockchain #DigitalOwnership #TechInnovation #Security",
    
    linkedin: "Excited to announce the launch of TagMyThing - a revolutionary platform for digital asset management! 🚀\n\nKey features:\n• Camera-first asset tagging\n• Blockchain-secured ownership proof\n• Token-based economy (50 TMT free on signup)\n• Mobile-optimized experience\n• Next-of-kin legacy planning\n\nThis represents a significant step forward in how we think about digital ownership and asset security. The combination of intuitive UX with cutting-edge blockchain technology makes asset management accessible to everyone.\n\nTry it today: https://tagmything.com\n\n#Innovation #Blockchain #AssetManagement #DigitalTransformation #TechLaunch"
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
                  <span className="block">Tag<span className="text-primary-600">My</span>Thing</span>
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
                    TagMyThing lets you instantly tag and prove ownership of your assets—using your camera, 
                    blockchain tech, and token-based access.
                  </p>
                </div>
              </motion.div>

              {/* Countdown Timer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-12"
              >
                <Card className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white max-w-2xl mx-auto">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 flex items-center justify-center">
                      <Clock className="h-6 w-6 mr-2" />
                      Official Launch Countdown
                    </h3>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{timeLeft.days}</div>
                        <div className="text-primary-100 text-sm">Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{timeLeft.hours}</div>
                        <div className="text-primary-100 text-sm">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{timeLeft.minutes}</div>
                        <div className="text-primary-100 text-sm">Minutes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{timeLeft.seconds}</div>
                        <div className="text-primary-100 text-sm">Seconds</div>
                      </div>
                    </div>
                    <Link to="/tag">
                      <Button variant="secondary" size="lg">
                        <Users className="h-5 w-5 mr-2" />
                        Test the Beta Version Now
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              >
                <Link to="/tag">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Camera className="h-5 w-5 mr-2" />
                    Tag an Asset Now
                  </Button>
                </Link>
                <Link to="/influencer-signup">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Get Started Free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Explainer Video Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Watch how TagMyThing works in 30 seconds
              </h2>
              
              <div className="relative bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
                <div className="aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/Rh0qyyyL25A?rel=0&modestbranding=1&showinfo=0"
                    title="TagMyThing Explainer Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Token Launch Promotion */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Coins className="h-16 w-16 text-white mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">
                TMT Tokens Are Live!
              </h2>
              <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                Start using TMT tokens to tag assets today. First 50 tokens are free with signup. 
                Power your asset management with our token-based economy.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white bg-opacity-10 rounded-lg p-6">
                  <div className="text-2xl font-bold text-white mb-2">50 TMT</div>
                  <div className="text-primary-100">Free signup bonus</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-6">
                  <div className="text-2xl font-bold text-white mb-2">25 TMT</div>
                  <div className="text-primary-100">Per photo tag</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-6">
                  <div className="text-2xl font-bold text-white mb-2">60 TMT</div>
                  <div className="text-primary-100">Per video tag</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    <Camera className="h-5 w-5 mr-2" />
                    Get Free Tokens
                  </Button>
                </Link>
                <Link to="/tag">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600">
                    Start Tagging
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social Media Templates */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Spread the Word
              </h2>
              <p className="text-xl text-gray-600">
                Help us launch by sharing TagMyThing with your network
              </p>
            </motion.div>

            <div className="space-y-6">
              {/* Twitter Post */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded mr-2"></div>
                    Twitter/X Post
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(socialPosts.twitter, 'twitter')}
                  >
                    {copiedPost === 'twitter' ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedPost === 'twitter' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {socialPosts.twitter}
                  </pre>
                </div>
              </Card>

              {/* Instagram Post */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded mr-2"></div>
                    Instagram Post
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(socialPosts.instagram, 'instagram')}
                  >
                    {copiedPost === 'instagram' ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedPost === 'instagram' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {socialPosts.instagram}
                  </pre>
                </div>
              </Card>

              {/* LinkedIn Post */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-6 h-6 bg-blue-700 rounded mr-2"></div>
                    LinkedIn Post
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(socialPosts.linkedin, 'linkedin')}
                  >
                    {copiedPost === 'linkedin' ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedPost === 'linkedin' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {socialPosts.linkedin}
                  </pre>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Blog Post Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card>
                <div className="prose max-w-none">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    TagMyThing is Live: A New Era of Digital Ownership
                  </h1>
                  
                  <p className="text-lg text-gray-700 mb-6">
                    Today marks a significant milestone in digital asset management. TagMyThing is officially live, 
                    bringing a revolutionary approach to how we tag, manage, and secure our valuable assets.
                  </p>

                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Features</h2>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-success-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Camera-First Tagging:</strong> Instantly capture and tag assets with your device's camera</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-success-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Blockchain Security:</strong> Immutable proof of ownership secured on the blockchain</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-success-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Token Economy:</strong> TMT tokens power all platform interactions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-success-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Next-of-Kin Planning:</strong> Secure legacy planning for your digital assets</span>
                    </li>
                  </ul>

                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tech Stack & Innovation</h2>
                  <p className="text-gray-700 mb-6">
                    Built with cutting-edge technology including React, TypeScript, Supabase, and blockchain integration, 
                    TagMyThing represents the perfect marriage of user experience and technical sophistication. Our 
                    mobile-first design ensures seamless asset management across all devices.
                  </p>

                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Seamless Onboarding Experience</h2>
                  <p className="text-gray-700 mb-6">
                    We've designed TagMyThing with simplicity in mind. New users can start tagging assets immediately, 
                    with optional account creation to unlock advanced features. The onboarding process is intuitive, 
                    guiding users through their first asset tag in seconds.
                  </p>

                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started Today</h2>
                  <p className="text-gray-700 mb-6">
                    Ready to revolutionize how you manage your assets? TagMyThing is live and ready for you to explore. 
                    Sign up today and receive 50 TMT tokens absolutely free to get you started on your digital ownership journey.
                  </p>

                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-semibold text-primary-900 mb-4">
                      Join the Digital Ownership Revolution
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link to="/tag">
                        <Button size="lg" className="w-full sm:w-auto">
                          <Camera className="h-5 w-5 mr-2" />
                          Start Tagging Now
                        </Button>
                      </Link>
                      <Link to="/influencer-signup">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                          Get Started Free
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Secure Your Assets?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of users who trust TagMyThing to manage their digital legacy.
              </p>
              <Link to="/tag">
                <Button variant="secondary" size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Start Tagging Now
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};