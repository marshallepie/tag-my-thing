import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, MapPin, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Use Cases',
      links: [
        { name: 'General Ownership', href: '/general-tagging', internal: true },
        { name: 'Digital Assets & NFTs', href: '/nft-tagging', internal: true },
        { name: 'MyWill & Legacy', href: '/mywill-tagging', internal: true },
        { name: 'Business & Inventory', href: '/business-tagging', internal: true },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy-policy', internal: true },
        { name: 'Terms of Service', href: '/terms-of-service', internal: true },
        { name: 'GDPR Compliance', href: '/gdpr-compliance', internal: true },
        { name: 'Cookie Policy', href: '/cookie-policy', internal: true },
        { name: 'Data Processing Agreement', href: '/data-processing-agreement', internal: true },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '/support', internal: true },
        { name: 'Contact Us', href: 'mailto:tagmything@marshallepie.com', internal: false },
        { name: 'Documentation', href: '#', internal: true },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#', internal: true },
        { name: 'Blog', href: '#', internal: true },
        { name: 'Careers', href: '#', internal: true },
      ]
    },
    {
      title: 'Explore',
      links: [
        { name: 'Public Assets', href: '/public-assets', internal: true },
      ]
    }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/tagmaithing.png" 
                alt="TagMyThing" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold">Tag<span className="text-primary-600">My</span>Thing</span>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Secure, tag, and manage your digital and physical assets with blockchain technology. 
              Your digital legacy, protected forever.
            </p>
            <div className="flex items-center space-x-2 text-gray-400">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Privacy & Security First</span>
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.internal ? (
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center"
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {link.name}
                        {link.href.startsWith('http') && (
                          <ExternalLink className="h-3 w-3 ml-1" />
                        )}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* TagMyThing DAO Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 text-center">TagMyThing DAO</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Vision */}
                <div>
                  <h3 className="text-lg font-semibold text-primary-400 mb-3">Vision</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    TagMyThing is evolving into a community-driven ecosystem where users not only tag and secure their assets but also help guide the growth and governance of the platform. The DAO ensures transparency, fairness, and shared ownership in the project's future.
                  </p>
                </div>

                {/* Core Principles */}
                <div>
                  <h3 className="text-lg font-semibold text-primary-400 mb-3">Core Principles</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Transparency:</strong> All decisions, token flows, and governance actions are public and verifiable.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Community Empowerment:</strong> Token holders shape the future by voting on proposals and priorities.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Fair Distribution:</strong> Tokens reflect both participation and contribution, ensuring everyone has a stake.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Sustainability:</strong> Resources are allocated with long-term project health in mind.
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Token Utility */}
                <div>
                  <h3 className="text-lg font-semibold text-primary-400 mb-3">Token Utility</h3>
                  <p className="text-gray-300 text-sm mb-3">The TMT token is at the heart of the DAO. It powers:</p>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Voting Rights:</strong> Each token represents a vote in governance decisions.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Access to Features:</strong> Unlocking premium tools, tagging capacity, and integrations.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Incentives:</strong> Rewards for referrals, contributions, and community involvement.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Governance Structure */}
                <div>
                  <h3 className="text-lg font-semibold text-accent-400 mb-3">Governance Structure</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-accent-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Token Holders:</strong> The community members who vote on proposals.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-accent-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Delegates:</strong> Trusted individuals who can represent groups of token holders.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-accent-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Core Contributors:</strong> Developers and maintainers actively building TagMyThing.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-accent-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Governance Council:</strong> A rotating group of elected members overseeing proposal quality and execution.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-accent-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Facilitators/Admins:</strong> Operational roles that ensure proposals, votes, and funds are processed correctly.
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Proposal Process */}
                <div>
                  <h3 className="text-lg font-semibold text-success-400 mb-3">Proposal Process</h3>
                  <div className="space-y-3 text-gray-300 text-sm">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</div>
                      <div>
                        <strong className="text-white">Idea Submission:</strong> Any token holder can submit a proposal.
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</div>
                      <div>
                        <strong className="text-white">Discussion:</strong> Community feedback is gathered in an open forum.
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</div>
                      <div>
                        <strong className="text-white">Voting:</strong> Token-weighted voting determines whether the proposal passes.
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-success-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">4</div>
                      <div>
                        <strong className="text-white">Execution:</strong> If approved, smart contracts or contributors implement the decision.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Treasury Management */}
                <div>
                  <h3 className="text-lg font-semibold text-warning-400 mb-3">Treasury Management</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Funds generated from token sales, subscriptions, or partnerships are pooled into a DAO treasury. These funds can be allocated for:
                  </p>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-warning-400 rounded-full mr-3 flex-shrink-0" />
                      Development grants
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-warning-400 rounded-full mr-3 flex-shrink-0" />
                      Marketing campaigns
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-warning-400 rounded-full mr-3 flex-shrink-0" />
                      Community rewards
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-warning-400 rounded-full mr-3 flex-shrink-0" />
                      Security and audits
                    </li>
                  </ul>
                </div>

                {/* Business & Community Alignment */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-400 mb-3">Business & Community Alignment</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Business Users:</strong> Gain verification, bulk tagging, and API access through subscriptions.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Influencers:</strong> Earn rewards via multi-level referral programs.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <div>
                        <strong className="text-white">Everyday Users:</strong> Tag personal or legacy items, ensuring permanence and trust.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-8 text-center">
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-2">Join the TagMyThing DAO</h3>
                  <p className="text-primary-100 mb-4">
                    Be part of the future of digital asset management and governance
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      to="/auth"
                      className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/support"
                      className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white hover:text-primary-600 transition-colors"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>© {currentYear} TagMyThing. All rights reserved.</span>
              <Link 
                to="/privacy-policy" 
                className="hover:text-white transition-colors duration-200"
              >
                Privacy Policy
              </Link>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Made with ❤️ for digital security</span>
              </div>
            </div>
          </div>
        </div>

        {/* GDPR Compliance Notice */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <p className="font-medium mb-1">GDPR Compliant</p>
              <p>
                We are committed to protecting your privacy and complying with GDPR regulations. 
                Read our{' '}
                <Link 
                  to="/privacy-policy" 
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  Privacy Policy
                </Link>
                {' '}to learn how we handle your data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};