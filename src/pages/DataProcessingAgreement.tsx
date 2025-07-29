import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, Users, Database, Globe, Lock, CheckCircle, Mail, Calendar, Building, Scale } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';

export const DataProcessingAgreement: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sections = [
    {
      id: 'subject-duration',
      title: '1. Subject Matter & Duration',
      icon: <Calendar className="h-6 w-6 text-primary-600" />,
      content: `This Agreement governs the processing of personal data for the duration of the Customer's use of Tag My Thing services.`
    },
    {
      id: 'nature-purpose',
      title: '2. Nature & Purpose of Processing',
      icon: <FileText className="h-6 w-6 text-primary-600" />,
      content: `Processing includes collection, storage, transmission, and deletion of personal data for the purpose of delivering Tag My Thing's tagging, storage, and sharing services.`
    },
    {
      id: 'data-subjects',
      title: '3. Categories of Data Subjects',
      icon: <Users className="h-6 w-6 text-primary-600" />,
      list: [
        'Users of Tag My Thing',
        'Individuals whose data may appear in uploaded content'
      ]
    },
    {
      id: 'personal-data',
      title: '4. Categories of Personal Data',
      icon: <Database className="h-6 w-6 text-primary-600" />,
      list: [
        'Contact details',
        'Login credentials',
        'Uploaded files and metadata',
        'Payment-related information'
      ]
    },
    {
      id: 'sub-processors',
      title: '5. Sub-Processors',
      icon: <Building className="h-6 w-6 text-primary-600" />,
      content: `The Customer authorizes Tag My Thing to use the following sub-processors:`,
      content: `The Customer authorizes Tag <span className="text-primary-600">My</span> Thing to use the following sub-processors:`,
      subProcessors: [
        {
          name: 'Supabase',
          purpose: 'Cloud data hosting and storage',
          compliance: 'GDPR compliant'
        },
        {
          name: 'Stripe',
          purpose: 'Payment processing',
          compliance: 'GDPR compliant'
        }
      ],
      note: 'Other sub-processors as necessary, provided that Tag My Thing maintains equivalent data protection obligations.'
    },
    {
      id: 'controller-obligations',
      title: '6. Controller Obligations',
      icon: <Scale className="h-6 w-6 text-primary-600" />,
      content: `The Customer ensures that they have all necessary consents and legal bases to process personal data using Tag My Thing.`
      content: `The Customer ensures that they have all necessary consents and legal bases to process personal data using Tag <span className="text-primary-600">My</span> Thing.`
    },
    {
      id: 'processor-obligations',
      title: '7. Processor Obligations',
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      content: `Tag My Thing shall:`,
      content: `Tag <span className="text-primary-600">My</span> Thing shall:`,
      list: [
        'Process data only on documented instructions',
        'Ensure confidentiality and security measures',
        'Assist the Customer in fulfilling data subject rights',
        'Notify the Customer of any data breaches without undue delay',
        'Allow audits or provide documentation to demonstrate compliance'
      ]
    },
    {
      id: 'security-measures',
      title: '8. Security Measures',
      icon: <Lock className="h-6 w-6 text-primary-600" />,
      content: `Tag My Thing implements appropriate technical and organizational measures, including encryption, access controls, and data backup procedures.`
      content: `Tag <span className="text-primary-600">My</span> Thing implements appropriate technical and organizational measures, including encryption, access controls, and data backup procedures.`
    },
    {
      id: 'data-transfers',
      title: '9. Data Transfers',
      icon: <Globe className="h-6 w-6 text-primary-600" />,
      content: `If personal data is transferred outside the EEA, Tag My Thing ensures compliance through Standard Contractual Clauses or equivalent mechanisms.`
      content: `If personal data is transferred outside the EEA, Tag <span className="text-primary-600">My</span> Thing ensures compliance through Standard Contractual Clauses or equivalent mechanisms.`
    },
    {
      id: 'termination',
      title: '10. Termination',
      icon: <FileText className="h-6 w-6 text-primary-600" />,
      content: `Upon termination, Tag My Thing will delete or return personal data unless otherwise required by law.`
      content: `Upon termination, Tag <span className="text-primary-600">My</span> Thing will delete or return personal data unless otherwise required by law.`
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
              <FileText className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">Data Processing Agreement</h1>
              <p className="text-xl text-primary-100">
                Legal framework for personal data processing between Tag My Thing and our customers
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
                <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Data Processing Agreement (DPA)
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  This Data Processing Agreement is entered into between Tag <span className="text-primary-600">My</span> Thing (Processor)
                  and You (the Customer/Controller) and governs the processing of personal data 
                  in connection with the services provided by Tag <span className="text-primary-600">My</span> Thing.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <Building className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Controller</h3>
                    <p className="text-gray-700 text-sm">You (the Customer)</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <Shield className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Processor</h3>
                    <p className="text-gray-700 text-sm">Tag <span className="text-primary-600">My</span> Thing</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* DPA Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
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
                              <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 mr-3 flex-shrink-0" />
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {section.subProcessors && (
                        <div className="mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {section.subProcessors.map((processor, processorIndex) => (
                              <div key={processorIndex} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Database className="h-5 w-5 text-primary-600" />
                                  <h4 className="font-semibold text-gray-900">{processor.name}</h4>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">{processor.purpose}</p>
                                <span className="inline-flex items-center px-2 py-1 bg-success-100 text-success-800 text-xs font-medium rounded-full">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {processor.compliance}
                                </span>
                              </div>
                            ))}
                          </div>
                          {section.note && (
                            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                              <p className="text-primary-800 text-sm">
                                <strong>Note:</strong> {section.note}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="mt-12"
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Questions About This Agreement?
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  If you have any questions about this Data Processing Agreement 
                  or need clarification on any data processing matters, please contact us.
                </p>
                
                <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <FileText className="h-6 w-6 text-primary-600" />
                    <span className="text-lg font-semibold text-gray-900">DPA Contact</span>
                  </div>
                  <a
                    href="mailto:tmt_dpa@marshallepie.com"
                    className="text-primary-600 hover:text-primary-700 transition-colors font-medium"
                  >
                    tmt_dpa@marshallepie.com
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