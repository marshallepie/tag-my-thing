import React from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Award, Lightbulb, Code, LayoutDashboard, Shield, Palette, MessageCircle, Briefcase, Target, Heart } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Careers: React.FC = () => {
  const positions = [
    {
      title: 'Governance Lead',
      description: 'Guide the community in decision-making and help shape the DAO\'s direction.',
      icon: <Award className="h-6 w-6 text-primary-600" />,
    },
    {
      title: 'Operations Lead',
      description: 'Oversee daily operations and ensure everything runs smoothly.',
      icon: <LayoutDashboard className="h-6 w-6 text-secondary-600" />,
    },
    {
      title: 'Development Lead',
      description: 'Take charge of the codebase, coordinate with other developers, and bring new features to life.',
      icon: <Code className="h-6 w-6 text-accent-600" />,
    },
    {
      title: 'Community Lead',
      description: 'Foster a welcoming and engaging environment for all participants.',
      icon: <Users className="h-6 w-6 text-success-600" />,
    },
    {
      title: 'Marketing Lead',
      description: 'Spread the word and grow our reach through creative campaigns and content.',
      icon: <Lightbulb className="h-6 w-6 text-warning-600" />,
    },
    {
      title: 'Design Lead',
      description: 'Ensure our platform is beautiful, intuitive, and user-friendly.',
      icon: <Palette className="h-6 w-6 text-purple-600" />,
    },
    {
      title: 'Security & Compliance Lead',
      description: 'Help us maintain a secure and compliant environment.',
      icon: <Shield className="h-6 w-6 text-error-600" />,
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Briefcase className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">Join the TagMyThing Inner Circle</h1>
              <p className="text-xl text-primary-100">
                Shape the future of decentralized digital asset management
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Target className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">We\'re Building a Decentralized Future</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  At TagMyThing, we\'re building a community-driven, decentralized future. We\'re not just looking for team members—we\'re looking for <strong>leaders</strong> who want to help shape the project.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Available Positions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Available Positions</h2>
            <p className="text-xl text-gray-600 text-center mb-8">
              We have several key roles open for enthusiastic contributors:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {positions.map((position, index) => (
                <motion.div
                  key={position.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <Card hover className="h-full">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                        {position.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {position.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {position.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* How to Apply */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Apply</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  We believe in flexibility and open collaboration. If you\'re interested in leading any of these areas, email us at{' '}
                  <a 
                    href="mailto:tagmythingrecruitment@marshallepie.com"
                    className="text-primary-600 hover:text-primary-700 font-semibold underline"
                  >
                    tagmythingrecruitment@marshallepie.com
                  </a>
                  . Let us know which role you\'re applying for, share a bit about your background, and tell us what kind of compensation or arrangement would work best for you.
                </p>
                <div className="bg-white rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Heart className="h-6 w-6 text-error-600" />
                    <span className="text-lg font-semibold text-gray-900">Our Philosophy</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    We want to create a fair and collaborative space, so this is your chance to help define how you contribute and how you\'re rewarded. Join us, and let\'s build something amazing together!
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = 'mailto:tagmythingrecruitment@marshallepie.com'}
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Apply Now
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};