import React from 'react';
import { motion } from 'framer-motion';
import { Cookie, Settings, Shield, Mail, Calendar, FileText, Eye, ToggleLeft, Globe, Lock } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';

export const CookiePolicy: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const cookieTypes = [
    {
      id: 'essential',
      title: 'Essential Cookies',
      icon: <Lock className="h-6 w-6 text-error-600" />,
      description: 'Necessary for the platform to function (e.g., authentication, security).',
      required: true,
      examples: ['Session management', 'Authentication tokens', 'Security features', 'Basic functionality']
    },
    {
      id: 'functional',
      title: 'Functional Cookies',
      icon: <Settings className="h-6 w-6 text-primary-600" />,
      description: 'Remember your settings and preferences.',
      required: false,
      examples: ['Language preferences', 'Theme settings', 'User interface customizations', 'Saved preferences']
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      icon: <FileText className="h-6 w-6 text-secondary-600" />,
      description: 'Help us understand usage patterns and improve the service (e.g., Google Analytics).',
      required: false,
      examples: ['Page views', 'User interactions', 'Performance metrics', 'Usage statistics']
    },
    {
      id: 'third-party',
      title: 'Third-Party Cookies',
      icon: <Globe className="h-6 w-6 text-accent-600" />,
      description: 'Stripe and Supabase may set cookies for secure payments and session management.',
      required: false,
      examples: ['Payment processing', 'Database sessions', 'External service integration', 'Security verification']
    }
  ];

  const managementOptions = [
    {
      title: 'Accept All Cookies',
      description: 'Allow all cookies for the best experience',
      icon: <Shield className="h-5 w-5 text-success-600" />
    },
    {
      title: 'Customize Preferences',
      description: 'Choose which types of cookies to allow',
      icon: <Settings className="h-5 w-5 text-primary-600" />
    },
    {
      title: 'Decline Non-Essential',
      description: 'Only allow essential cookies for basic functionality',
      icon: <Eye className="h-5 w-5 text-warning-600" />
    },
    {
      title: 'Browser Settings',
      description: 'Manage or delete cookies in your browser',
      icon: <ToggleLeft className="h-5 w-5 text-secondary-600" />
    }
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
              <Cookie className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
              <p className="text-xl text-primary-100">
                How we use cookies and similar technologies to enhance your experience
              </p>
              <div className="mt-4 flex items-center justify-center text-primary-100">
                <Calendar className="h-5 w-5 mr-2" />
                <span>Last updated: {lastUpdated}</span>
              </div>
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
                <Cookie className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  What are Cookies?
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Cookies are small text files stored on your device when you visit a website. 
                  They help us recognize your browser, remember your preferences, and improve your experience 
                  with TagMyThing.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Cookie Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Types of Cookies We Use
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cookieTypes.map((cookie, index) => (
                <motion.div
                  key={cookie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <Card className={`h-full border-l-4 ${
                    cookie.required 
                      ? 'border-l-error-500 bg-error-50' 
                      : 'border-l-primary-500'
                  }`}>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
                        {cookie.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {cookie.title}
                          </h3>
                          {cookie.required && (
                            <span className="px-2 py-1 bg-error-100 text-error-800 text-xs font-medium rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {cookie.description}
                        </p>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
                          <ul className="space-y-1">
                            {cookie.examples.map((example, exampleIndex) => (
                              <li key={exampleIndex} className="flex items-center text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2 flex-shrink-0" />
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Managing Cookies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Managing Your Cookie Preferences
            </h2>
            
            <div className="mb-8">
              <Card className="bg-primary-50 border-primary-200">
                <div className="text-center">
                  <Settings className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Cookie Consent Banner
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    When you first visit our site, you will be presented with a cookie consent banner 
                    where you can make your preferences known. You have full control over which cookies 
                    you allow.
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {managementOptions.map((option, index) => (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                >
                  <Card className="h-full">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {option.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {option.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Browser Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mb-12"
          >
            <Card className="bg-secondary-50 border-secondary-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Browser Cookie Management
              </h3>
              <p className="text-gray-700 mb-6 text-center leading-relaxed">
                You can also manage or delete cookies directly in your browser settings. 
                Here are quick links to cookie settings for popular browsers:
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {['Chrome', 'Firefox', 'Safari', 'Edge'].map((browser) => (
                  <div key={browser} className="p-3 bg-white rounded-lg shadow-sm">
                    <Globe className="h-6 w-6 text-secondary-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-900">{browser}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Eye className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-warning-800">
                    <p className="font-medium mb-1">Important Note</p>
                    <p>
                      Disabling certain cookies may affect the functionality of TagMyThing. 
                      Essential cookies are required for the platform to work properly.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Policy Updates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mb-12"
          >
            <Card className="border-l-4 border-l-primary-600">
              <div className="flex items-start space-x-4">
                <Calendar className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Changes to This Policy
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    We may update this Cookie Policy from time to time to reflect changes in our practices 
                    or for other operational, legal, or regulatory reasons. Any changes will be posted on 
                    this page with an updated "Last updated" date.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Questions About Cookies?
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  If you have any questions about our use of cookies or this Cookie Policy, 
                  please don't hesitate to contact us.
                </p>
                
                <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <Cookie className="h-6 w-6 text-primary-600" />
                    <span className="text-lg font-semibold text-gray-900">Cookie Support</span>
                  </div>
                  <a
                    href="mailto:tmt-cookies@marshallepie.com"
                    className="text-primary-600 hover:text-primary-700 transition-colors font-medium"
                  >
                    tmt-cookies@marshallepie.com
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