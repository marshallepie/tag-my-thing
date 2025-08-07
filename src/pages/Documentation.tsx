import React from 'react';
import { motion } from 'framer-motion';
import { Book, Tag, Users, Vote, HelpCircle, Mail, Clock, Camera, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Documentation: React.FC = () => {
  const sections = [
    {
      id: 'tagging-before-signup',
      title: '🏷️ 1. Tagging an Asset Before Signing Up',
      icon: <Tag className="h-6 w-6 text-primary-600" />,
      content: 'You can start tagging without having an account. Here\'s how:',
      steps: [
        'On the homepage, click the "Tag an Asset" button to begin.',
        'Enter your asset\'s name, description, and upload any relevant photos or videos.',
        'Once you\'re done, you\'ll be prompted to sign up or log in to save the tag.',
        'After signing up or logging in, your tag will be securely saved and linked to your account.'
      ]
    },
    {
      id: 'tagging-after-signup',
      title: '🧾 2. Tagging an Asset (After Signing Up)',
      icon: <Camera className="h-6 w-6 text-secondary-600" />,
      content: 'Once you\'re logged in, tagging is quick and easy:',
      steps: [
        'Navigate to your dashboard.',
        'Click the "Tag an Asset" button.',
        'Fill in the asset details (title, description, media), then confirm to save.'
      ]
    },
    {
      id: 'nok-onboarding',
      title: '🧬 3. Onboarding as a Next of Kin (NOK)',
      icon: <Shield className="h-6 w-6 text-accent-600" />,
      content: 'If you\'ve been nominated as a Next of Kin, here\'s what to expect:',
      steps: [
        'Click the invitation link sent to your email.',
        'Complete the onboarding process by creating an account or logging in.',
        'You\'ll see which tags you\'ve been assigned to—but not the full details yet.',
        'Access to tag details is delayed via our Delayed Message System (DMS). By default, this is set for one year but can be adjusted by the tag creator.',
        'Before the DMS activates, the tag creator receives reminder emails. If no action is taken, the system releases full access to you automatically once the time elapses.'
      ]
    },
    {
      id: 'referral-program',
      title: '🧑‍🤝‍🧑 4. Referral Program',
      icon: <Users className="h-6 w-6 text-success-600" />,
      content: 'Our referral program rewards you for spreading the word:',
      steps: [
        'Head to the "Referrals" section in your dashboard.',
        'Choose how to refer friends—via referral link, email, or social media.',
        'Track all referrals and token rewards in real-time from your dashboard.'
      ]
    },
    {
      id: 'dao-participation',
      title: '🗳️ 5. Participating in the DAO (Coming Soon)',
      icon: <Vote className="h-6 w-6 text-warning-600" />,
      content: 'Help shape the future of TagMyThing through decentralized governance:',
      steps: [
        'Go to the "Governance" section to see active proposals.',
        'Read the proposals, then vote using your tokens (1 token = 1 vote).',
        'Once launched, your votes will directly influence platform decisions and funding.'
      ],
      comingSoon: true
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
              <Book className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">📚 TagMyThing Documentation Hub</h1>
              <p className="text-xl text-primary-100">
                Your one-stop resource for learning how to use our platform
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
                <Book className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to the Documentation Hub!
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  This is your one-stop resource for learning how to use our platform. Below, you'll find step-by-step guides for key user flows.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Documentation Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <Card className={`border-l-4 ${section.comingSoon ? 'border-l-warning-500 bg-warning-50' : 'border-l-primary-600'}`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {section.title}
                        </h2>
                        {section.comingSoon && (
                          <span className="px-2 py-1 bg-warning-100 text-warning-800 text-xs font-medium rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {section.content}
                      </p>
                      
                      <div className="space-y-3">
                        {section.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                              {stepIndex + 1}
                            </div>
                            <p className="text-gray-700 leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12"
          >
            <Card>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Start Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => window.location.href = '/tag'}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center space-x-3">
                    <Tag className="h-6 w-6 text-primary-600" />
                    <div className="text-left">
                      <div className="font-medium">Start Tagging</div>
                      <div className="text-sm text-gray-600">Tag your first asset now</div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/referrals'}
                  variant="outline"
                  className="justify-start h-auto p-4"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-success-600" />
                    <div className="text-left">
                      <div className="font-medium">Refer Friends</div>
                      <div className="text-sm text-gray-600">Earn tokens through referrals</div>
                    </div>
                  </div>
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Additional Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12"
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <HelpCircle className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Need More Help?
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  If you can't find the answer to your question here, please don't hesitate to reach out to our support team or check out the FAQ section for quick answers.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => window.location.href = 'mailto:tagmythingsupport@marshallepie.com'}
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Support
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/faq'}
                  >
                    <HelpCircle className="h-5 w-5 mr-2" />
                    View FAQ
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};