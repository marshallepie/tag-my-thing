import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users, Mail, Award, Lightbulb, Code, LayoutDashboard, Shield, Palette, MessageCircle, Briefcase, Target, Heart } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Careers: React.FC = () => {
  const { t, ready } = useTranslation();

  if (!ready) {
    return <div>Loading...</div>;
  }

  const positions = [
    {
      title: t('careers.positions.governanceLead.title'),
      description: t('careers.positions.governanceLead.description'),
      icon: <Award className="h-6 w-6 text-primary-600" />,
    },
    {
      title: t('careers.positions.operationsLead.title'),
      description: t('careers.positions.operationsLead.description'),
      icon: <LayoutDashboard className="h-6 w-6 text-secondary-600" />,
    },
    {
      title: t('careers.positions.developmentLead.title'),
      description: t('careers.positions.developmentLead.description'),
      icon: <Code className="h-6 w-6 text-accent-600" />,
    },
    {
      title: t('careers.positions.communityLead.title'),
      description: t('careers.positions.communityLead.description'),
      icon: <Users className="h-6 w-6 text-success-600" />,
    },
    {
      title: t('careers.positions.marketingLead.title'),
      description: t('careers.positions.marketingLead.description'),
      icon: <Lightbulb className="h-6 w-6 text-warning-600" />,
    },
    {
      title: t('careers.positions.designLead.title'),
      description: t('careers.positions.designLead.description'),
      icon: <Palette className="h-6 w-6 text-purple-600" />,
    },
    {
      title: t('careers.positions.securityLead.title'),
      description: t('careers.positions.securityLead.description'),
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
              <h1 className="text-4xl font-bold mb-4">{t('careers.title')}</h1>
              <p className="text-xl text-primary-100">
                {t('careers.subtitle')}
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('careers.introduction.title')}</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {t('careers.introduction.description')}
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('careers.availablePositions.title')}</h2>
            <p className="text-xl text-gray-600 text-center mb-8">
              {t('careers.availablePositions.subtitle')}
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('careers.howToApply.title')}</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {t('careers.howToApply.description')}
                </p>
                <div className="bg-white rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Heart className="h-6 w-6 text-error-600" />
                    <span className="text-lg font-semibold text-gray-900">{t('careers.howToApply.philosophy.title')}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {t('careers.howToApply.philosophy.description')}
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = 'mailto:tagmythingrecruitment@marshallepie.com'}
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {t('careers.howToApply.applyButton')}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};