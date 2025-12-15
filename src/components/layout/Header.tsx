import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Menu, X, Camera, Wallet, Settings, LogOut, User, Shield, Megaphone, ChevronDown, Package, Heart } from 'lucide-react';
import { Building, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTokens } from '../../hooks/useTokens';
import { Button } from '../ui/Button';
import { LanguageToggle } from '../ui/LanguageToggle';

export const Header: React.FC = () => {
  const { t, ready } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isAssetsMenuOpen, setIsAssetsMenuOpen] = useState(false);
  const { user, profile, signOut, isAuthenticated, hasProfile, isAdmin, isModerator, isAdminInfluencer } = useAuth();
  const { isBusinessUser } = useAuth();
  const { balance } = useTokens();
  const navigate = useNavigate();
  const location = useLocation();

  // Safe navigation handler using React Router
  const handleNavigation = (path: string) => {
    try {
      setIsMobileMenuOpen(false);
      setIsProfileMenuOpen(false);
      
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

  // Base navigation for all users
  const navigation = [
    { name: ready ? t('navigation.dashboard') : 'Dashboard', href: '/dashboard' },
    { name: ready ? t('navigation.news') : 'News', href: '/news' },
    { name: ready ? t('navigation.wallet') : 'Wallet', href: '/wallet' },
    { name: ready ? t('navigation.buyTokens') : 'Buy Tokens', href: '/buy-tokens' },
  ];

  // All users can access referrals now
  if (profile) {
    navigation.push({ name: ready ? t('navigation.referrals') : 'Referrals', href: '/referrals' });
  }

  // Assets-related navigation (for dropdown)
  const assetsNavigation = [
    { name: ready ? t('navigation.tagAsset') : 'Tag Asset', href: '/tag', icon: Camera },
    { name: ready ? t('navigation.myAssets') : 'My Assets', href: '/assets', icon: Package },
    { name: ready ? t('navigation.publicAssets') : 'Public Assets', href: '/public-assets', icon: Globe },
    { name: ready ? t('navigation.nextOfKin') : 'Next of Kin', href: '/nok', icon: Heart },
  ];

  // Admin/role-specific navigation (for dropdown)
  const adminNavigation: Array<{ name: string; href: string; icon: any }> = [];
  
  if (isBusinessUser) {
    adminNavigation.push({ name: ready ? t('navigation.businessDashboard') : 'Business Dashboard', href: '/business-dashboard', icon: Building });
  }
  
  if (isAdminInfluencer || isAdmin) {
    adminNavigation.push({ name: ready ? t('navigation.adminDashboard') : 'Admin Dashboard', href: '/admin-influencer-dashboard', icon: Shield });
    adminNavigation.push({ name: ready ? t('navigation.bugReports') : 'Bug Reports', href: '/bug-reports', icon: Megaphone });
    adminNavigation.push({ name: ready ? t('navigation.newsManagement') : 'News Management', href: '/news-management', icon: Globe });
    if (isAdmin && !isAdminInfluencer) {
      adminNavigation.push({ name: ready ? t('navigation.adminPanel') : 'Admin Panel', href: '/admin', icon: Shield });
    }
  } else if (isModerator) {
    adminNavigation.push({ name: ready ? t('navigation.moderatorPanel') : 'Moderator Panel', href: '/moderator', icon: Shield });
  }

  const isActive = (path: string) => location.pathname === path;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.admin-dropdown')) {
        setIsAdminMenuOpen(false);
      }
      if (!target.closest('.assets-dropdown')) {
        setIsAssetsMenuOpen(false);
      }
    };
    
    if (isAdminMenuOpen || isAssetsMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isAdminMenuOpen, isAssetsMenuOpen]);

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
            <nav className="hidden md:flex space-x-4 items-center">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                    ${isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {item.name}
                </button>
              ))}
              
              {/* Assets Dropdown */}
              <div className="relative assets-dropdown">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAssetsMenuOpen(!isAssetsMenuOpen);
                  }}
                  className={`
                    flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                    ${isAssetsMenuOpen || assetsNavigation.some(item => isActive(item.href))
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Package className="h-4 w-4" />
                  <span>{ready ? t('navigation.assetManagement') : 'Asset Management'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAssetsMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAssetsMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                  >
                    <div className="py-1">
                      {assetsNavigation.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              handleNavigation(item.href);
                              setIsAssetsMenuOpen(false);
                            }}
                            className={`
                              flex items-center w-full px-4 py-2 text-sm transition-colors text-left
                              ${isActive(item.href)
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-700 hover:bg-gray-100'
                              }
                            `}
                          >
                            <Icon className="h-4 w-4 mr-3" />
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Admin Dropdown */}
              {adminNavigation.length > 0 && (
                <div className="relative admin-dropdown">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAdminMenuOpen(!isAdminMenuOpen);
                    }}
                    className={`
                      flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                      ${isAdminMenuOpen || adminNavigation.some(item => isActive(item.href))
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Shield className="h-4 w-4" />
                    <span>{ready ? t('navigation.admin') : 'Admin'}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isAdminMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                    >
                      <div className="py-1">
                        {adminNavigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                handleNavigation(item.href);
                                setIsAdminMenuOpen(false);
                              }}
                              className={`
                                flex items-center w-full px-4 py-2 text-sm transition-colors text-left
                                ${isActive(item.href)
                                  ? 'bg-primary-50 text-primary-600'
                                  : 'text-gray-700 hover:bg-gray-100'
                                }
                              `}
                            >
                              <Icon className="h-4 w-4 mr-3" />
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle - always visible */}
            <LanguageToggle />
            
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
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
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
                  {isProfileMenuOpen && (
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
                          {ready ? t('navigation.profile') : 'Profile'}
                        </button>
                        <button
                          onClick={() => handleNavigation('/settings')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {ready ? t('navigation.settings') : 'Settings'}
                        </button>
                        <button
                          onClick={() => {
                            console.log('Header: Logout button clicked');
                            signOut().then(() => {
                              console.log('Header: Sign out completed, navigating to home');
                              handleNavigation('/');
                            }).catch((error) => {
                              console.error('Header: Sign out error:', error);
                              // Force navigation even if sign out fails
                              handleNavigation('/');
                            });
                            setIsProfileMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {ready ? t('navigation.signOut') : 'Sign Out'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-gray-100"
                >
                  {isMobileMenuOpen ? (
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
                    {ready ? t('buttons.tagAsset') : 'Tag Asset'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNavigation('/auth')}
                >
                    {ready ? t('buttons.signIn') : 'Sign In'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isAuthenticated && isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-gray-200"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Language Toggle for mobile */}
            <div className="px-3 py-2 border-b border-gray-200 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{ready ? t('buttons.language') : 'Language'}</span>
                <LanguageToggle />
              </div>
            </div>
            
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
            
            {/* Assets Section */}
            <div className="pt-2 border-t border-gray-200">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {ready ? t('navigation.assetManagement') : 'Asset Management'}
              </div>
              {assetsNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors
                      ${isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                );
              })}
            </div>
            
            {/* Admin Section */}
            {adminNavigation.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {ready ? t('navigation.admin') : 'Admin'}
                </div>
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`
                        flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors
                        ${isActive(item.href)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
};