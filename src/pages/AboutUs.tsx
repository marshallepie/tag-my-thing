import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, ExternalLink, Globe, Award, Heart, Code, Tv, Calendar } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';

export const AboutUs: React.FC = () => {
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
              <User className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">About TagMyThing</h1>
              <p className="text-xl text-primary-100">
                Our story, vision, and commitment to digital asset management
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Founder Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Award className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Visionary Founder</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  TagMyThing was envisioned and created by <strong>Marshall Epie</strong>, a passionate developer and visionary.
                  The concept for TagMyThing dates back to 2018 when Marshall recognized the need for a secure and immutable way
                  to safeguard important digital information, especially for those involved in the early days of cryptocurrency.
                  Many people lost access to their digital assets simply because they misplaced their private keys. This sparked
                  the idea for what was originally called "Immortal AI,\" a tool designed to help people keep their valuable
                  information safe forever.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Evolution Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Card>
              <div className="flex items-start space-x-4">
                <Code className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">From Idea to Reality</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Although the idea was ahead of its time, the technology and tools available back then weren't quite user-friendly
                    enough to bring the vision to life. So, Marshall kept the project on the back burner until recently, when he gained
                    new skills in prompt engineering and appeared on television in Cameroon. This inspired him to fully realize the
                    TagMyThing platform, now backed by modern tools and a refined development process.
                  </p>
                  
                  <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Tv className="h-5 w-5 text-secondary-600" />
                      <span className="font-medium text-secondary-900">Media Appearance</span>
                    </div>
                    <p className="text-sm text-secondary-700">
                      Marshall's television appearance in Cameroon marked a turning point, providing the inspiration and confidence
                      to transform the long-held vision into the comprehensive platform you see today.
                    </p>
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    Today, TagMyThing stands as a testament to Marshall's dedication to creating a fair and community-driven platform.
                    The project is designed to be open-source and will be governed by a Decentralized Autonomous Organization (DAO),
                    ensuring transparency and community involvement in its growth.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Timeline Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Journey</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">2018 - The Original Vision</h3>
                    <p className="text-gray-700">
                      Marshall Epie conceived "Immortal AI" after witnessing cryptocurrency users lose access to their digital assets
                      due to misplaced private keys. The need for secure, permanent digital safekeeping became clear.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Code className="h-6 w-6 text-secondary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">2018-2024 - Development & Learning</h3>
                    <p className="text-gray-700">
                      The project remained in development as Marshall honed his skills in modern web development,
                      prompt engineering, and gained valuable experience in creating user-friendly applications.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                    <Tv className="h-6 w-6 text-accent-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">2024 - Television Appearance & Inspiration</h3>
                    <p className="text-gray-700">
                      Marshall's appearance on television in Cameroon provided the final inspiration needed to bring
                      TagMyThing to life with modern technology and refined user experience.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-success-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">2025 - TagMyThing Launch</h3>
                    <p className="text-gray-700">
                      The platform officially launches with comprehensive features including asset tagging, Next-of-Kin planning,
                      business verification, and a token-based economy, all governed by community-driven DAO principles.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Connect Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect with Marshall Epie</h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  For more information about Marshall Epie and his work, or to get in touch with the TagMyThing team,
                  use any of the following contact methods:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href="https://marshallepie.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-primary-600 hover:text-primary-700"
                  >
                    <Globe className="h-6 w-6" />
                    <span className="font-medium">marshallepie.com</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  
                  <a
                    href="https://www.linkedin.com/in/marshallepie"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-primary-600 hover:text-primary-700"
                  >
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">in</span>
                    </div>
                    <span className="font-medium">LinkedIn</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  
                  <a
                    href="mailto:tagmything@marshallepie.com"
                    className="flex items-center justify-center space-x-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-primary-600 hover:text-primary-700"
                  >
                    <Mail className="h-6 w-6" />
                    <span className="font-medium">Email Us</span>
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};