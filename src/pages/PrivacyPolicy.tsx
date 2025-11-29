import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Mail, MapPin, Calendar, FileText, Lock, Users, Globe } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';

export const PrivacyPolicy: React.FC = () => {
  const { t, ready } = useTranslation();
  const lastUpdated = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sections = [
    {
      id: 'introduction',
      title: ready ? '1. ' + t('legal.privacyPolicy.dataCollection') : '1. Introduction',
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      content: ready ? t('legal.privacyPolicy.introduction') : `Welcome to TagMyThing ("we," "us," "our"). We are committed to protecting your privacy and handling your personal data transparently. This Privacy Policy describes how we collect, use, and protect your personal data when you use our website and services.`
    },
    {
      id: 'data-collection',
      title: ready ? '2. ' + t('legal.privacyPolicy.dataCollection') : '2. Data We Collect',
      icon: <FileText className="h-6 w-6 text-primary-600" />,
      content: ready ? t('legal.privacyPolicy.dataCollectionDesc') : `We may collect:`,
      list: ready ? [
        t('legal.privacyPolicy.personalIdentifiers'),
        t('legal.privacyPolicy.accountInfo'),
        t('legal.privacyPolicy.contentUploaded'),
        t('legal.privacyPolicy.usageData'),
        t('legal.privacyPolicy.paymentInfo')
      ] : [
        'Personal identifiers (e.g., name, email address, phone number)',
        'Account information (e.g., login credentials)',
        'Content you upload or tag',
        'Usage data (e.g., IP address, device information, browsing behavior)',
        'Payment information (if applicable)'
      ]
    },
    {
      id: 'legal-basis',
      title: ready ? '3. ' + t('legal.privacyPolicy.legalBasis') : '3. Legal Basis for Processing (GDPR)',
      icon: <Lock className="h-6 w-6 text-primary-600" />,
      content: ready ? t('legal.privacyPolicy.legalBasisDesc') : `We process your personal data under the following bases:`,
      list: ready ? [
        t('legal.privacyPolicy.contractPerformance'),
        t('legal.privacyPolicy.consent'),
        t('legal.privacyPolicy.legalObligations'),
        t('legal.privacyPolicy.legitimateInterests')
      ] : [
        'Contract performance: to provide our services',
        'Consent: where you explicitly agree',
        'Legal obligations: e.g., record-keeping',
        'Legitimate interests: improving our services and security'
      ]
    },
    {
      id: 'data-usage',
      title: ready ? '4. ' + t('legal.privacyPolicy.dataUsage') : '4. How We Use Your Data',
      icon: <Users className="h-6 w-6 text-primary-600" />,
      list: ready ? [
        t('legal.privacyPolicy.operatePlatform'),
        t('legal.privacyPolicy.communicate'),
        t('legal.privacyPolicy.processPayments'),
        t('legal.privacyPolicy.improveServices'),
        t('legal.privacyPolicy.complyLegal')
      ] : [
        'To operate and maintain the platform',
        'To communicate with you (service emails, updates)',
        'To process payments',
        'To improve our services',
        'To comply with legal obligations'
      ]
    },
    {
      id: 'data-sharing',
      title: ready ? '5. ' + t('legal.privacyPolicy.dataSharing') : '5. Data Sharing',
      icon: <Globe className="h-6 w-6 text-primary-600" />,
      content: ready ? t('legal.privacyPolicy.dataSharingDesc') : `We may share your data with:`,
      list: ready ? [
        t('legal.privacyPolicy.serviceProviders'),
        t('legal.privacyPolicy.legalAuthorities'),
        t('legal.privacyPolicy.otherUsers')
      ] : [
        'Service providers (e.g., hosting, payment processors)',
        'Legal authorities when required',
        'Other users as necessary to perform the service (e.g., sharing tagged content with recipients)'
      ],
      note: ready ? t('legal.privacyPolicy.neverSellData') : 'We never sell your data.'
    },
    {
      id: 'international-transfers',
      title: ready ? '6. ' + t('legal.privacyPolicy.internationalTransfers') : '6. International Transfers',
      icon: <Globe className="h-6 w-6 text-primary-600" />,
      content: ready ? t('legal.privacyPolicy.internationalTransfersDesc') : `If your data is transferred outside the EEA, we ensure appropriate safeguards (such as Standard Contractual Clauses).`
    },
    {
      id: 'data-retention',
      title: ready ? '7. ' + t('legal.privacyPolicy.dataRetention') : '7. Data Retention',
      icon: <Calendar className="h-6 w-6 text-primary-600" />,
      content: ready ? t('legal.privacyPolicy.dataRetentionDesc') : `We retain your data as long as necessary to fulfill the purposes described and comply with laws.`
    },
    {
      id: 'your-rights',
      title: ready ? '8. ' + t('legal.privacyPolicy.yourRights') : '8. Your Rights',
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      content: ready ? t('legal.privacyPolicy.yourRightsDesc') : `Under GDPR, you have the right to:`,
      list: ready ? [
        t('legal.privacyPolicy.accessData'),
        t('legal.privacyPolicy.correctData'),
        t('legal.privacyPolicy.deleteData'),
        t('legal.privacyPolicy.objectProcessing'),
        t('legal.privacyPolicy.dataPortability'),
        t('legal.privacyPolicy.lodgeComplaint')
      ] : [
        'Access your data',
        'Correct inaccuracies',
        'Request deletion ("right to be forgotten")',
        'Object to or restrict processing',
        'Data portability',
        'Lodge a complaint with your Data Protection Authority'
      ]
    },
    {
      id: 'security',
      title: ready ? '9. ' + t('legal.privacyPolicy.security') : '9. Security',
      icon: <Lock className="h-6 w-6 text-primary-600" />,
      content: ready ? t('legal.privacyPolicy.securityDesc') : `We implement technical and organizational measures to protect your data.`
    },
    {
      id: 'contact',
      title: ready ? '10. ' + t('legal.privacyPolicy.contact') : '10. Contact',
      icon: <Mail className="h-6 w-6 text-primary-600" />,
      content: ready ? t('legal.privacyPolicy.contactDesc') : `For privacy-related questions or to exercise your rights:`,
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
              <Shield className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">{ready ? t('legal.privacyPolicy.title') : 'Privacy Policy'}</h1>
              <p className="text-xl text-primary-100">
                {ready ? t('legal.privacyPolicy.subtitle') : 'Your privacy and data protection are our top priorities'}
              </p>
              <div className="mt-4 flex items-center justify-center text-primary-100">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{ready ? t('legal.lastUpdated') : 'Last updated'}: {lastUpdated}</span>
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
                        <p className="text-gray-700 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: section.content }}>
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
                      
                      {section.note && (
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-4">
                          <p className="text-primary-800 font-medium">
                            <strong>Important:</strong> {section.note}
                          </p>
                        </div>
                      )}
                      
                      {section.contact && (
                        <div className="bg-gray-50 rounded-lg p-6 mt-4">
                          <div className="flex items-center space-x-4">
                            <Mail className="h-8 w-8 text-primary-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">{ready ? t('legal.email') : 'Email'}</h3>
                              <a 
                                href="mailto:tagmything@marshallepie.com"
                                className="text-primary-600 hover:text-primary-700 transition-colors"
                              >
                                {ready ? t('legal.contactEmail') : 'tagmything@marshallepie.com'}
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
                <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Questions About Your Privacy?
                </h3>
                <p className="text-gray-700 mb-4">
                  We're here to help. If you have any questions about this Privacy Policy 
                  or how we handle your data, please don't hesitate to contact us.
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