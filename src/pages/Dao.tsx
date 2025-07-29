import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Users, Vote, Shield, Target, TrendingUp, Calendar, Award, Building, Globe } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export const Dao: React.FC = () => {
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
              <Coins className="h-16 w-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl font-bold mb-4">TagMyThing DAO</h1>
              <p className="text-xl text-primary-100">
                Community-driven governance for the future of digital asset management
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
              <div className="text-center">
                <Target className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Vision</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  TagMyThing is evolving into a community-driven ecosystem where users not only tag and secure their assets 
                  but also help guide the growth and governance of the platform. The DAO ensures transparency, fairness, 
                  and shared ownership in the project's future.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Core Principles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Core Principles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Shield className="h-6 w-6 text-primary-600" />,
                  title: 'Transparency',
                  description: 'All decisions, token flows, and governance actions are public and verifiable.'
                },
                {
                  icon: <Users className="h-6 w-6 text-secondary-600" />,
                  title: 'Community Empowerment',
                  description: 'Token holders shape the future by voting on proposals and priorities.'
                },
                {
                  icon: <Award className="h-6 w-6 text-accent-600" />,
                  title: 'Fair Distribution',
                  description: 'Tokens reflect both participation and contribution, ensuring everyone has a stake.'
                },
                {
                  icon: <TrendingUp className="h-6 w-6 text-success-600" />,
                  title: 'Sustainability',
                  description: 'Resources are allocated with long-term project health in mind.'
                }
              ].map((principle, index) => (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="h-full">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                        {principle.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {principle.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {principle.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Token Utility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-12"
          >
            <Card>
              <div className="flex items-start space-x-4">
                <Coins className="h-6 w-6 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Token Utility</h2>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    The TMT token is at the heart of the DAO. It powers:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        icon: <Vote className="h-5 w-5 text-primary-600" />,
                        title: 'Voting Rights',
                        description: 'Each token represents a vote in governance decisions.'
                      },
                      {
                        icon: <Shield className="h-5 w-5 text-secondary-600" />,
                        title: 'Access to Features',
                        description: 'Unlocking premium tools, tagging capacity, and integrations.'
                      },
                      {
                        icon: <Award className="h-5 w-5 text-accent-600" />,
                        title: 'Incentives',
                        description: 'Rewards for referrals, contributions, and community involvement.'
                      }
                    ].map((utility, index) => (
                      <div key={utility.title} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          {utility.icon}
                          <h3 className="font-semibold text-gray-900">{utility.title}</h3>
                        </div>
                        <p className="text-gray-700 text-sm">{utility.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Governance Structure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-12"
          >
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Governance Structure</h2>
              
              <div className="space-y-4">
                {[
                  {
                    title: 'Token Holders',
                    description: 'The community members who vote on proposals.'
                  },
                  {
                    title: 'Delegates',
                    description: 'Trusted individuals who can represent groups of token holders.'
                  },
                  {
                    title: 'Core Contributors',
                    description: 'Developers and maintainers actively building TagMyThing.'
                  },
                  {
                    title: 'Governance Council',
                    description: 'A rotating group of elected members overseeing proposal quality and execution.'
                  },
                  {
                    title: 'Facilitators/Admins',
                    description: 'Operational roles that ensure proposals, votes, and funds are processed correctly.'
                  }
                ].map((role, index) => (
                  <div key={role.title} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.title}</h3>
                      <p className="text-gray-700">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Proposal Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mb-12"
          >
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Proposal Process</h2>
              
              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: 'Idea Submission',
                    description: 'Any token holder can submit a proposal.'
                  },
                  {
                    step: 2,
                    title: 'Discussion',
                    description: 'Community feedback is gathered in an open forum.'
                  },
                  {
                    step: 3,
                    title: 'Voting',
                    description: 'Token-weighted voting determines whether the proposal passes.'
                  },
                  {
                    step: 4,
                    title: 'Execution',
                    description: 'If approved, smart contracts or contributors implement the decision.'
                  }
                ].map((step, index) => (
                  <div key={step.step} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-gray-700">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Treasury Management & Business Alignment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Treasury Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Card className="h-full">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Treasury Management</h2>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Funds generated from token sales, subscriptions, or partnerships are pooled into a DAO treasury. 
                  These funds can be allocated for:
                </p>
                
                <div className="space-y-2">
                  {[
                    'Development grants',
                    'Marketing campaigns',
                    'Community rewards',
                    'Security and audits'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-warning-600 rounded-full flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Business & Community Alignment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <Card className="h-full">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Business & Community Alignment</h2>
                
                <div className="space-y-4">
                  {[
                    {
                      title: 'Business Users',
                      description: 'Gain verification, bulk tagging, and API access through subscriptions.',
                      icon: <Building className="h-4 w-4 text-primary-600" />
                    },
                    {
                      title: 'Influencers',
                      description: 'Earn rewards via multi-level referral programs.',
                      icon: <Users className="h-4 w-4 text-secondary-600" />
                    },
                    {
                      title: 'Everyday Users',
                      description: 'Tag personal or legacy items, ensuring permanence and trust.',
                      icon: <Globe className="h-4 w-4 text-accent-600" />
                    }
                  ].map((userType, index) => (
                    <div key={userType.title} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {userType.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{userType.title}:</h3>
                        <p className="text-gray-700 text-sm">{userType.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};