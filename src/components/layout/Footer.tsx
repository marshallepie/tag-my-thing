import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Mail, MapPin, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  const { t, ready } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: ready ? t('footer.useCases') : 'Use Cases',
      links: [
        { name: ready ? t('footer.generalOwnership') : 'General Ownership', href: '/general-tagging', internal: true },
        { name: ready ? t('footer.digitalAssetsNFTs') : 'Digital Assets & NFTs', href: '/nft-tagging', internal: true },
        { name: ready ? t('footer.myWillLegacy') : 'MyWill & Legacy', href: '/mywill-tagging', internal: true },
        { name: ready ? t('footer.businessInventory') : 'Business & Inventory', href: '/business-tagging', internal: true },
      ]
    },
    {
      title: ready ? t('footer.legal') : 'Legal',
      links: [
        { name: ready ? t('footer.privacyPolicy') : 'Privacy Policy', href: '/privacy-policy', internal: true },
        { name: ready ? t('footer.termsOfService') : 'Terms of Service', href: '/terms-of-service', internal: true },
        { name: ready ? t('footer.gdprCompliance') : 'GDPR Compliance', href: '/gdpr-compliance', internal: true },
        { name: ready ? t('footer.cookiePolicy') : 'Cookie Policy', href: '/cookie-policy', internal: true },
        { name: ready ? t('footer.dataProcessingAgreement') : 'Data Processing Agreement', href: '/data-processing-agreement', internal: true },
      ]
    },
    {
      title: ready ? t('footer.support') : 'Support',
      links: [
        { name: ready ? t('footer.contactUs') : 'Contact Us', href: 'mailto:tagmything@marshallepie.com', internal: false },
        { name: ready ? t('footer.documentation') : 'Documentation', href: '/documentation', internal: true },
        { name: ready ? t('footer.faq') : 'FAQ', href: '/faq', internal: true },
      ]
    },
    {
      title: ready ? t('footer.theOrganisation') : 'The Organisation',
      links: [
        { name: ready ? t('footer.aboutUs') : 'About Us', href: '/about-us', internal: true },
        { name: ready ? t('footer.tagMyThingDAO') : 'TagMyThing DAO', href: '/dao', internal: true },
        { name: ready ? t('footer.careers') : 'Careers', href: '/careers', internal: true },
      ]
    },
    {
      title: ready ? t('footer.explore') : 'Explore',
      links: [
        { name: ready ? t('footer.publicAssets') : 'Public Assets', href: '/public-assets', internal: true },
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
              {ready ? t('footer.brandDescription') : 'Secure, tag, and manage your digital and physical assets with blockchain technology. Your digital legacy, protected forever.'}
            </p>
            <div className="flex items-center space-x-2 text-gray-400">
              <Shield className="h-4 w-4" />
              <span className="text-sm">{ready ? t('footer.privacySecurityFirst') : 'Privacy & Security First'}</span>
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


        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>© {currentYear} TagMyThing. {ready ? t('footer.allRightsReserved') : 'All rights reserved'}.</span>
              <Link 
                to="/privacy-policy" 
                className="hover:text-white transition-colors duration-200"
              >
                {ready ? t('footer.privacyPolicy') : 'Privacy Policy'}
              </Link>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{ready ? t('footer.madeWithLove') : 'Made with ❤️ for digital security'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* GDPR Compliance Notice */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <p className="font-medium mb-1">{ready ? t('footer.gdprCompliant') : 'GDPR Compliant'}</p>
              <p>
                {ready ? (
                  <>
                    {t('footer.gdprDescription').split('Privacy Policy')[0]}
                    <Link 
                      to="/privacy-policy" 
                      className="text-primary-400 hover:text-primary-300 underline"
                    >
                      {t('footer.privacyPolicy')}
                    </Link>
                    {t('footer.gdprDescription').split('Privacy Policy')[1] || ''}
                  </>
                ) : (
                  <>
                    We are committed to protecting your privacy and complying with GDPR regulations. 
                    Read our{' '}
                    <Link 
                      to="/privacy-policy" 
                      className="text-primary-400 hover:text-primary-300 underline"
                    >
                      Privacy Policy
                    </Link>
                    {' '}to learn how we handle your data.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};