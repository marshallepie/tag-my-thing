import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Mail, Scale, Shield, Users, AlertTriangle, Calendar, Gavel } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';

export const TermsOfService: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance',
      icon: <Scale className="h-6 w-6 text-primary-600" />,
      content: `By using Tag My Thing, you agree to these Terms of Service and our Privacy Policy.`
      content: `By using Tag <span className="text-primary-600">My</span> Thing, you agree to these Terms of Service and our Privacy Policy.`
    },
    {
      id: 'service-description',
      title: '2. Service Description',
      icon: <FileText className="h-6 w-6 text-primary-600" />,
      content: `Tag My Thing enables you to create, store, and share digital tags and related content.`
      content: `Tag <span className="text-primary-600">My</span> Thing enables you to create, store, and share digital tags and related content.`
    },
    {
      id: 'user-accounts',
      title: '3. User Accounts',
      icon: <Users className="h-6 w-6 text-primary-600" />,
      list: [
        'You must be at least 18 or have parental consent.',
        'You are responsible for keeping your login credentials secure.',
        'You agree to provide accurate information.'
      ]
    },
    {
      id: 'acceptable-use',
      title: '4. Acceptable Use',
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      content: `You agree not to:`,
      list: [
        'Use the service for unlawful purposes',
        'Upload content that infringes others\' rights',
        'Attempt to hack, disrupt, or misuse the platform'
      ]
    },
    {
      id: 'intellectual-property',
      title: '5. Intellectual Property',
      icon: <FileText className="h-6 w-6 text-primary-600" />,
      content: `All content and software are owned by Tag My Thing or licensed to us. You retain ownership of content you upload but grant us a license to use it as necessary to operate the service.`
      content: `All content and software are owned by Tag <span className="text-primary-600">My</span> Thing or licensed to us. You retain ownership of content you upload but grant us a license to use it as necessary to operate the service.`
    },
    {
      id: 'termination',
      title: '6. Termination',
      icon: <AlertTriangle className="h-6 w-6 text-primary-600" />,
      content: `We reserve the right to suspend or terminate your account if you violate these terms.`
    },
    {
      id: 'disclaimers',
      title: '7. Disclaimers',
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      content: `The service is provided "as is." We do not warrant uninterrupted availability or error-free operation.`
    },
    {
      id: 'liability',
      title: '8. Liability',
      icon: <Gavel className="h-6 w-6 text-primary-600" />,
      content: `To the fullest extent permitted by law, Tag My Thing shall not be liable for indirect or consequential damages.`
      content: `To the fullest extent permitted by law, Tag <span className="text-primary-600">My</span> Thing shall not be liable for indirect or consequential damages.`
    },
    {
      id: 'governing-law',
      title: '9. Governing Law',
      icon: <Scale className="h-6 w-6 text-primary-600" />,
      content: `These terms are governed by the laws of the United Kingdom.`
    },
    {
      id: 'contact',
      title: '10. Contact',
      icon: <Mail className="h-6 w-6 text-primary-600" />,
      content: `Questions? Contact us at:`,
      contact: true
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
              <Scale className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-xl text-primary-100">
                Legal terms and conditions for using TagMyThing
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
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="border-l-4 border-l-primary-600">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {section.title}
                      </h2>
                      
                      {section.content && (
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {section.content}
                        </p>
                      )}
                      
                      {section.list && (
                        <ul className="space-y-2 mb-4">
                          {section.list.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start">
                              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {section.contact && (
                        <div className="bg-gray-50 rounded-lg p-6 mt-4">
                          <div className="flex items-center space-x-4">
                            <Mail className="h-8 w-8 text-primary-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                              <a 
                                href="mailto:tagmything@marshallepie.com"
                                className="text-primary-600 hover:text-primary-700 transition-colors"
                              >
                                tagmything@marshallepie.com
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12"
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Scale className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Questions About These Terms?
                </h3>
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms of Service 
                  or need clarification on any point, please don't hesitate to contact us.
                </p>
                <a
                  href="mailto:tagmything@marshallepie.com"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Us
                </a>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};