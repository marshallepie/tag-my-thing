import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, Users, DollarSign, Shield, QrCode, Package, Clock, Award, Crown, Camera } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';

export const FAQ: React.FC = () => {
  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is TagMyThing and how does it work?',
          a: 'TagMyThing lets you record ownership of any item—physical or digital—using secure, timestamped, and verifiable metadata. You can upload media, describe the item, and store it permanently.',
          icon: <HelpCircle className="h-5 w-5 text-primary-600" />,
        },
        {
          q: 'How do I tag an item I own?',
          a: 'Just tap "Tag an Asset" from your dashboard, add a photo or video, write a title and description, and confirm. Tokens will be used to process and store the tag.',
          icon: <Camera className="h-5 w-5 text-primary-600" />,
        },
        {
          q: 'Can I upload a photo or video for my tag?',
          a: 'Yes. You can upload photos or videos directly, or record them within the app.',
          icon: <Camera className="h-5 w-5 text-primary-600" />,
        },
        {
          q: 'What happens if I delete a tag? Do I get my tokens back?',
          a: 'Yes. If you delete a tag before it\'s permanently archived, your tokens are refunded automatically.',
          icon: <DollarSign className="h-5 w-5 text-primary-600" />,
        },
        {
          q: 'Where is my data stored? Is it permanent?',
          a: 'Your data is stored using decentralized storage (Arweave). Once archived, it becomes immutable and can be retrieved anytime.',
          icon: <Shield className="h-5 w-5 text-primary-600" />,
        },
        {
          q: 'How do I edit or update a tag?',
          a: 'If the tag hasn\'t been archived yet, you can still edit it. Once it\'s archived, it becomes permanent and cannot be changed.',
          icon: <Package className="h-5 w-5 text-primary-600" />,
        },
        {
          q: 'Can I transfer a tag to someone else?',
          a: 'Yes. You can assign a tag to another user (such as a NOK or business partner) directly from your asset dashboard.',
          icon: <Users className="h-5 w-5 text-primary-600" />,
        },
      ],
    },
    {
      category: 'Next of Kin (NOK)',
      questions: [
        {
          q: 'What does it mean to be a Next of Kin on this platform?',
          a: 'Being a NOK means you\'ve been nominated to access or inherit tagged assets in case of death or incapacity of the original owner.',
          icon: <Users className="h-5 w-5 text-secondary-600" />,
        },
        {
          q: 'How do I access someone\'s assets if I've been named as their NOK?',
          a: 'If you\'ve been assigned as NOK, you'll receive access to those assets under specific conditions defined by the owner.',
          icon: <Clock className="h-5 w-5 text-secondary-600" />,
        },
        {
          q: 'Can I tag items myself as a NOK?',
          a: 'Yes, NOKs are full users and can tag their own items independently.',
          icon: <Camera className="h-5 w-5 text-secondary-600" />,
        },
      ],
    },
    {
      category: 'Influencer Users',
      questions: [
        {
          q: 'How do I join the referral program?',
          a: 'Enable "Influencer Mode" in your profile settings. You\'ll get five unique referral codes to share.',
          icon: <Crown className="h-5 w-5 text-accent-600" />,
        },
        {
          q: 'How do I earn tokens from referrals?',
          a: 'You earn tokens every time someone signs up using your referral code—and you continue earning if they refer others (up to five levels deep).',
          icon: <Award className="h-5 w-5 text-accent-600" />,
        },
        {
          q: 'Where can I see who I\'ve referred?',
          a: 'Your wallet dashboard shows referral stats, including token earnings and referral chains.',
          icon: <DollarSign className="h-5 w-5 text-accent-600" />,
        },
        {
          q: 'What rewards do I get as an influencer?',
          a: 'Influencers get bonus tokens, ranking badges, and priority access to new features.',
          icon: <Award className="h-5 w-5 text-accent-600" />,
        },
      ],
    },
    {
      category: 'Business Users',
      questions: [
        {
          q: 'How do I verify a product with a QR code?',
          a: 'Scan the code with your phone. The system checks the serial number against our database and displays the verification status.',
          icon: <QrCode className="h-5 w-5 text-success-600" />,
        },
        {
          q: 'Can I track scan history for my products?',
          a: 'Yes. Business users can view detailed scan logs for each product, including time, location, and device type.',
          icon: <Clock className="h-5 w-5 text-success-600" />,
        },
        {
          q: 'What\'s the difference between Freemium, Professional, and Enterprise plans?',
          a: 'Freemium is for testing. Professional includes 1,000 tokens/month. Enterprise offers 10,000 tokens/month and advanced features.',
          icon: <DollarSign className="h-5 w-5 text-success-600" />,
        },
        {
          q: 'How do I subscribe or upgrade my business plan?',
          a: 'Go to your business dashboard, tap "Manage Plan," and choose your preferred subscription tier.',
          icon: <Award className="h-5 w-5 text-success-600" />,
        },
      ],
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
              <HelpCircle className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">FAQ – TagMyThing</h1>
              <p className="text-xl text-primary-100">
                Welcome to the FAQ Help Center! Below are some of the most common questions from our users.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            {faqs.map((category, catIndex) => (
              <div key={catIndex} className="mb-10">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-primary-200 pb-2">
                  {category.category}
                </h3>
                <div className="space-y-6">
                  {category.questions.map((faq, faqIndex) => (
                    <motion.div
                      key={faqIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 + catIndex * 0.05 + faqIndex * 0.03 }}
                    >
                      <Card className="h-full">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                            {faq.icon}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {faq.q}
                            </h4>
                            <p className="text-gray-700 leading-relaxed">
                              {faq.a}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Additional Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Need More Help?
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  If you can't find the answer to your question here, please don't hesitate to reach out to our support team.
                </p>
                <a
                  href="mailto:tagmythingsupport@marshallepie.com"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Support
                </a>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};