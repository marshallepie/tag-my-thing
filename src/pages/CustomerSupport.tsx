import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, Phone, MessageCircle, Clock, FileText, User, Trash2, Download, ExternalLink } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const CustomerSupport: React.FC = () => {
  const contactMethods = [
    {
      icon: <Mail className="h-8 w-8 text-primary-600" />,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'tagmythingsupport@marshallepie.com',
      action: 'mailto:tagmythingsupport@marshallepie.com',
      responseTime: '1-2 business days'
    },
    {
      icon: <Phone className="h-8 w-8 text-secondary-600" />,
      title: 'Phone Support',
      description: 'Call us directly',
      contact: '+44 7939 482530',
      action: 'tel:+447939482530',
      responseTime: 'Business hours GMT'
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-success-600" />,
      title: 'WhatsApp Chat',
      description: 'Chat with us on WhatsApp',
      contact: '+44 7939 482530',
      action: 'https://wa.me/447939482530',
      responseTime: 'Business hours GMT'
    }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Visit the login page, click "Forgot Password", and follow the instructions sent to your email.',
      icon: <User className="h-5 w-5 text-primary-600" />
    },
    {
      question: 'How do I delete my account?',
      answer: 'Contact us via email or use the "Delete Account" option in your profile settings under the Danger Zone section.',
      icon: <Trash2 className="h-5 w-5 text-error-600" />
    },
    {
      question: 'How do I request my data?',
      answer: 'Email tagmything@marshallepie.com with the subject "Data Request" and we\'ll provide your data within 30 days.',
      icon: <Download className="h-5 w-5 text-secondary-600" />
    },
    {
      question: 'How do TMT tokens work?',
      answer: 'TMT tokens are used to tag assets. You get 50 free tokens on signup, and can purchase more. Photos cost 5 TMT, videos cost 7 TMT.',
      icon: <FileText className="h-5 w-5 text-accent-600" />
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use industry-standard encryption and security measures. Your data is stored securely and we never sell your information.',
      icon: <HelpCircle className="h-5 w-5 text-success-600" />
    },
    {
      question: 'Can I export my assets?',
      answer: 'Yes, you can export your data anytime from the Settings page. We provide all your data in a downloadable format.',
      icon: <Download className="h-5 w-5 text-primary-600" />
    }
  ];

  const responseTimeInfo = [
    {
      method: 'Email Support',
      time: '1-2 business days',
      icon: <Mail className="h-5 w-5 text-primary-600" />
    },
    {
      method: 'Phone & WhatsApp',
      time: 'Business hours GMT',
      icon: <Clock className="h-5 w-5 text-secondary-600" />
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
              <HelpCircle className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">Customer Support</h1>
              <p className="text-xl text-primary-100">
                We're here to help! Get the support you need, when you need it.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Support</h2>
            <p className="text-xl text-gray-600">
              Choose the method that works best for you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <Card hover className="text-center h-full">
                  <div className="flex justify-center mb-4">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{method.description}</p>
                  <div className="mb-4">
                    <p className="font-medium text-gray-900">{method.contact}</p>
                    <p className="text-sm text-gray-500">Response: {method.responseTime}</p>
                  </div>
                  <Button
                    onClick={() => {
                      if (method.action.startsWith('http')) {
                        window.open(method.action, '_blank');
                      } else {
                        window.location.href = method.action;
                      }
                    }}
                    className="w-full"
                  >
                    {method.title === 'WhatsApp Chat' && <ExternalLink className="h-4 w-4 mr-2" />}
                    Contact Now
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                >
                  <Card className="h-full">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {faq.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {faq.question}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Response Times */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Response Times
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {responseTimeInfo.map((info, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm">
                    {info.icon}
                    <div>
                      <h4 className="font-semibold text-gray-900">{info.method}</h4>
                      <p className="text-gray-600">{info.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-primary-100 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-primary-800">
                    <p className="font-medium mb-1">Business Hours</p>
                    <p>Monday - Friday: 9:00 AM - 6:00 PM GMT</p>
                    <p>Weekend: Limited support via email</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Additional Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-12"
          >
            <Card className="text-center">
              <HelpCircle className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Still Need Help?
              </h3>
              <p className="text-gray-700 mb-6">
                Can't find what you're looking for? Our support team is ready to assist you 
                with any questions or issues you may have.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => window.location.href = 'mailto:tagmythingsupport@marshallepie.com'}
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Email Support
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://wa.me/447939482530', '_blank')}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  WhatsApp Chat
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};