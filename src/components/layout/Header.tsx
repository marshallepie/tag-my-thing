import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Camera, Wallet, Settings, LogOut, User, Shield, Megaphone } from 'lucide-react';
import { Building, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTokens } from '../../hooks/useTokens';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut, isAuthenticated, isAdmin, isModerator, isAdminInfluencer } = useAuth();
  const { isBusinessUser } = useAuth();
  const { balance } = useTokens();
  const navigate = useNavigate();
  const location = useLocation();

  // Safe navigation handler using React Router
  const handleNavigation = (path: string) => {
    try {
      setIsMenuOpen(false);
      
      if (path.startsWith('http')) {
        // External links
        window.open(path, '_blank');
      } else {
        // Internal navigation using React Router
        navigate(path);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to window.location for problematic routes
      window.location.href = path;
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Tag Asset', href: '/tag' },
    { name: 'My Assets', href: '/assets' },
    { name: 'NOK', href: '/nok' },
  ];

  // All users can access referrals now
  if (profile) {
    navigation.push({ name: 'Referrals', href: '/referrals' });
  }

  // Add Business Dashboard link for business users
  if (isBusinessUser) {
    navigation.push({ name: 'Business', href: '/business-dashboard' });
  }

  if (isAdminInfluencer) {
    navigation.push({ name: 'Admin Dashboard', href: '/admin-influencer-dashboard' });
  } else if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin' });
  } else if (isModerator) {
    navigation.push({ name: 'Moderator', href: '/moderator' });
  }


  // Add Public Assets link for everyone
  navigation.push({ name: 'Public Assets', href: '/public-assets' });
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button 
            onClick={() => handleNavigation('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/tagmaithing.png" 
              alt="TagMyThing" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold text-gray-900">Tag<span className="text-primary-600">My</span>Thing</span>
          </button>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Token Balance */}
                <button 
                  onClick={() => handleNavigation('/wallet')}
                  className="hidden sm:flex items-center space-x-2 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Wallet className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-600">
                    {balance} TMT
                  </span>
                </button>

                {/* Profile Menu */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => handleNavigation('/profile')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </button>
                        <button
                          onClick={() => handleNavigation('/settings')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </button>
                        {(isAdmin || isModerator) && (
                          <button
                            onClick={() => handleNavigation(isAdmin ? "/admin" : "/moderator")}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {isAdmin ? 'Admin Panel' : 'Moderator Panel'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            signOut();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-gray-100"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center"
                  onClick={() => handleNavigation('/tag')}
                >
                    <Camera className="h-4 w-4 mr-1" />
                    Tag Asset
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNavigation('/auth')}
                >
                    Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isAuthenticated && isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-gray-200"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`
                  block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors
                  ${isActive(item.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }
                `}
              >
                {item.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
};