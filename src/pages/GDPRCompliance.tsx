import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, CheckCircle, Mail, Database, CreditCard, Lock, Users, FileText, Calendar, Globe } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';

export const GDPRCompliance: React.FC = () => {
  const { t, ready } = useTranslation();
  const lastUpdated = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const compliancePoints = [
    {
      icon: <Database className="h-6 w-6 text-primary-600" />,
      title: ready ? t('gdpr.commitments.dataMinimization.title') : 'Data Minimization',
      description: ready ? t('gdpr.commitments.dataMinimization.description') : 'We collect only the data necessary to provide and improve our services.',
      details: ready ? t('gdpr.commitments.dataMinimization.details') : 'Our data collection is limited to essential information required for account creation, service delivery, and platform improvement.'
    },
    {
      icon: <FileText className="h-6 w-6 text-primary-600" />,
      title: ready ? t('gdpr.commitments.transparentUse.title') : 'Transparent Use',
      description: ready ? t('gdpr.commitments.transparentUse.description') : 'We inform users clearly about how their data is used.',
      details: ready ? t('gdpr.commitments.transparentUse.details') : 'Our Privacy Policy provides comprehensive details about data collection, processing, and usage in plain language.'
    },
    {
      icon: <Users className="h-6 w-6 text-primary-600" />,
      title: ready ? t('gdpr.commitments.userRights.title') : 'User Rights',
      description: ready ? t('gdpr.commitments.userRights.description') : 'You can request access to, correction of, deletion of, or export of your data at any time.',
      details: ready ? t('gdpr.commitments.userRights.details') : 'We provide easy mechanisms for users to exercise all GDPR rights including data portability and the right to be forgotten.'
    },
    {
      icon: <Lock className="h-6 w-6 text-primary-600" />,
      title: ready ? t('gdpr.commitments.dataSecurity.title') : 'Data Security',
      description: ready ? t('gdpr.commitments.dataSecurity.description') : 'We store personal data securely using trusted third-party providers.',
      details: ready ? t('gdpr.commitments.dataSecurity.details') : 'All data is encrypted in transit and at rest using industry-standard security measures.'
    }
  ];

  const dataProcessors = [
    {
      name: ready ? t('gdpr.processors.supabase.name') : 'Supabase',
      role: ready ? t('gdpr.processors.supabase.role') : 'Cloud Database Platform',
      compliance: ready ? t('gdpr.processors.supabase.compliance') : 'Fully GDPR compliant with enterprise-grade encryption and security',
      icon: <Database className="h-8 w-8 text-primary-600" />,
      features: ready ? t('gdpr.processors.supabase.features', { returnObjects: true }) as string[] : ['End-to-end encryption', 'EU data residency options', 'SOC 2 Type II certified', 'Regular security audits']
    },
    {
      name: ready ? t('gdpr.processors.stripe.name') : 'Stripe',
      role: ready ? t('gdpr.processors.stripe.role') : 'Payment Processing Partner',
      compliance: ready ? t('gdpr.processors.stripe.compliance') : 'PCI DSS certified and adheres to GDPR requirements',
      icon: <CreditCard className="h-8 w-8 text-secondary-600" />,
      features: ready ? t('gdpr.processors.stripe.features', { returnObjects: true }) as string[] : ['PCI DSS Level 1 certified', 'GDPR compliant', 'Strong customer authentication', 'Fraud protection']
    }
  ];

  const additionalMeasures = [
    {
      title: ready ? t('gdpr.additionalMeasures.dataProcessingAgreements.title') : 'Data Processing Agreements',
      description: ready ? t('gdpr.additionalMeasures.dataProcessingAgreements.description') : 'We have Data Processing Agreements in place with all our sub-processors, including Supabase and Stripe, to ensure lawful processing and cross-border data transfers where applicable.',
      icon: <FileText className="h-5 w-5 text-success-600" />
    },
    {
      title: ready ? t('gdpr.additionalMeasures.accountability.title') : 'Accountability',
      description: ready ? t('gdpr.additionalMeasures.accountability.description') : 'We regularly review and update our practices to remain compliant with applicable data protection laws.',
      icon: <Shield className="h-5 w-5 text-primary-600" />
    },
    {
      title: ready ? t('gdpr.additionalMeasures.regularAudits.title') : 'Regular Audits',
      description: ready ? t('gdpr.additionalMeasures.regularAudits.description') : 'We conduct regular compliance audits and security assessments to ensure ongoing GDPR compliance.',
      icon: <CheckCircle className="h-5 w-5 text-success-600" />
    },
    {
      title: ready ? t('gdpr.additionalMeasures.staffTraining.title') : 'Staff Training',
      description: ready ? t('gdpr.additionalMeasures.staffTraining.description') : 'Our team receives regular training on data protection principles and GDPR requirements.',
      icon: <Users className="h-5 w-5 text-secondary-600" />
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
              <Shield className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">{ready ? t('gdpr.title') : 'GDPR Compliance Statement'}</h1>
              <p className="text-xl text-primary-100">
                {ready ? t('gdpr.subtitle') : 'Our commitment to European Union General Data Protection Regulation compliance'}
              </p>
              <div className="mt-4 flex items-center justify-center text-primary-100">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{ready ? t('gdpr.lastUpdated') : 'Last updated'}: {lastUpdated}</span>
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
                <Globe className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {ready ? t('gdpr.introduction.title') : 'Full GDPR Compliance Commitment'}
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {ready ? t('gdpr.introduction.description') : 'TagMyThing is committed to full compliance with the European Union General Data Protection Regulation (GDPR). We ensure that your personal data is processed lawfully, fairly, and transparently at all times.'}
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Compliance Points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {ready ? t('gdpr.commitments.title') : 'Our GDPR Commitments'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {compliancePoints.map((point, index) => (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="h-full border-l-4 border-l-success-500">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-2 bg-success-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-success-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {point.icon}
                          <h3 className="text-xl font-semibold text-gray-900">
                            {point.title}
                          </h3>
                        </div>
                        <p className="text-gray-700 mb-3 font-medium">
                          {point.description}
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {point.details}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Data Processors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {ready ? t('gdpr.processors.title') : 'Trusted Data Processors'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {dataProcessors.map((processor, index) => (
                <motion.div
                  key={processor.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                >
                  <Card className="h-full">
                    <div className="text-center mb-6">
                      <div className="flex justify-center mb-4">
                        {processor.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {processor.name}
                      </h3>
                      <p className="text-lg text-gray-600 mb-3">
                        {processor.role}
                      </p>
                      <p className="text-gray-700 font-medium">
                        {processor.compliance}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 mb-3">{ready ? (t('gdpr.processors.securityFeatures') || 'Security Features:') : 'Security Features:'}</h4>
                      {processor.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Additional Measures */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {ready ? t('gdpr.additionalMeasures.title') : 'Additional Compliance Measures'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {additionalMeasures.map((measure, index) => (
                <motion.div
                  key={measure.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                >
                  <Card className="h-full">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {measure.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {measure.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {measure.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {ready ? t('gdpr.contact.title') : 'Contact Our Data Protection Officer'}
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {ready ? t('gdpr.contact.description') : 'If you have questions about GDPR compliance or wish to exercise your data protection rights, please contact us.'}
                </p>
                
                <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <Mail className="h-6 w-6 text-primary-600" />
                    <span className="text-lg font-semibold text-gray-900">{ready ? t('gdpr.contact.email') : 'Contact us via email'}</span>
                  </div>
                  <a
                    href="mailto:tagmything@marshallepie.com"
                    className="text-primary-600 hover:text-primary-700 transition-colors font-medium"
                  >
                    {ready ? t('gdpr.contact.emailAddress') : 'tagmything@marshallepie.com'}
                  </a>
                </div>
                
                <div className="mt-6 text-sm text-gray-600">
                  <p>{ready ? (t('gdpr.contact.responseTime') || 'We will respond to all GDPR requests within 30 days as required by law.') : 'We will respond to all GDPR requests within 30 days as required by law.'}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};