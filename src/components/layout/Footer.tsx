import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, MapPin, ExternalLink } from 'lucide-react';

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
              <span className="text-xl font-bold">TagMyThing</span>
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