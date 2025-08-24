import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, Crown, Shield } from 'lucide-react';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, hasProfile } = useAuth();
  
  // Determine initial mode based on current path
  const getInitialMode = (): 'signin' | 'signup' => {
    if (location.pathname === '/signup') return 'signup';
    if (location.pathname === '/login') return 'signin';
    if (location.pathname === '/business-auth') return 'signup';
    if (location.pathname === '/influencer-auth') return 'signup';
    return 'signin'; // default
  };

  const [mode, setMode] = useState<'signin' | 'signup'>(getInitialMode());

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const nokInviteEmail = urlParams.get('nok_invite_email');
  const redirectParam = urlParams.get('redirect');
  const fromParam = urlParams.get('from');
  
  // Determine signup type from path
  const isBusinessSignup = location.pathname === '/business-auth';
  const isInfluencerPath = location.pathname === '/influencer-auth' || location.pathname === '/influencer-signup';

  // Redirect authenticated users
  if (isAuthenticated && hasProfile) {
    if (nokInviteEmail) {
      return <Navigate to="/nok" replace />;
    }
    if (isBusinessSignup) {
      return <Navigate to="/business-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSuccess = () => {
    if (fromParam === 'tagging' && redirectParam) {
      navigate(`${redirectParam}?from=tagging`, { replace: true });
    } else if (nokInviteEmail) {
      navigate('/nok', { replace: true });
    } else if (isBusinessSignup) {
      navigate('/business-dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const getPageTitle = () => {
    if (nokInviteEmail) return 'Next-of-Kin Invitation';
    if (isBusinessSignup) return 'Business Account';
    if (isInfluencerPath) return 'Join as Creator'; // Simplified from "Influencer"
    return 'TagMyThing';
  };

  const getPageDescription = () => {
    if (nokInviteEmail) return 'Accept your Next-of-Kin nomination and help manage digital legacy';
    if (isBusinessSignup) return 'Protect your products with business verification features';
    if (isInfluencerPath) return 'Earn tokens by sharing TagMyThing with friends';
    return 'Secure and tag your valuable assets';
  };

  const getPageIcon = () => {
    if (nokInviteEmail) return <Shield className="h-12 w-12 text-secondary-600" />;
    if (isBusinessSignup) return <Building className="h-12 w-12 text-blue-600" />;
    if (isInfluencerPath) return <Crown className="h-12 w-12 text-yellow-600" />;
    return null;
  };

  const getGradientClasses = () => {
    if (nokInviteEmail) return 'from-secondary-50 via-white to-gray-50';
    if (isBusinessSignup) return 'from-blue-50 via-white to-indigo-50';
    if (isInfluencerPath) return 'from-yellow-50 via-white to-primary-50';
    return 'from-primary-50 via-white to-secondary-50';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getGradientClasses()} flex flex-col items-center justify-center p-4`}>
      {/* Header */}
      {(isBusinessSignup || isInfluencerPath || nokInviteEmail) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {getPageIcon()}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-4 mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-lg text-gray-600 max-w-md">
            {getPageDescription()}
          </p>
        </motion.div>
      )}

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: nokInviteEmail || isBusinessSignup || isInfluencerPath ? 0.2 : 0 }}
        >
          <AuthForm 
            mode={mode} 
            onSuccess={handleSuccess}
            initialEmail={nokInviteEmail || ''}
            emailReadOnly={!!nokInviteEmail}
            nokInviteEmail={nokInviteEmail || undefined}
            isBusinessSignup={isBusinessSignup}
          />
          
          <div className="text-center mt-6">
            {mode === 'signin' ? (
              <>
                <p className="text-gray-600">
                  Don't have an account?
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setMode('signup')}
                  className="mt-2"
                >
                  Create Account
                </Button>
                
                {/* Additional signup options for regular auth page */}
                {!isBusinessSignup && !isInfluencerPath && !nokInviteEmail && (
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                    <p className="text-sm text-gray-500">
                      Special signup options:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/business-auth')}
                        className="flex items-center justify-center"
                      >
                        <Building className="h-4 w-4 mr-1" />
                        Business
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/influencer-signup')}
                        className="flex items-center justify-center"
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        Creator
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-gray-600">
                  Already have an account?
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setMode('signin')}
                  className="mt-2"
                >
                  Sign In
                </Button>
                
                {/* Switch between signup types */}
                {!nokInviteEmail && (
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                    {isBusinessSignup ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">
                          Looking for something else?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/auth?mode=signup')}
                          >
                            Regular Account
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/influencer-signup')}
                            className="flex items-center justify-center"
                          >
                            <Crown className="h-4 w-4 mr-1" />
                            Creator Account
                          </Button>
                        </div>
                      </div>
                    ) : isInfluencerPath ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">
                          Looking for something else?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/auth?mode=signup')}
                          >
                            Regular Account
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/business-auth')}
                            className="flex items-center justify-center"
                          >
                            <Building className="h-4 w-4 mr-1" />
                            Business Account
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">
                          Special account types:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/business-auth')}
                            className="flex items-center justify-center"
                          >
                            <Building className="h-4 w-4 mr-1" />
                            Business
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/influencer-signup')}
                            className="flex items-center justify-center"
                          >
                            <Crown className="h-4 w-4 mr-1" />
                            Creator
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer note for unified system */}
      {mode === 'signup' && !nokInviteEmail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 text-center max-w-lg"
        >
          <p className="text-xs text-gray-500 leading-relaxed">
            💡 <strong>New:</strong> All accounts now include full referral privileges! 
            Share your referral link with friends and earn tokens when they join. 
            {isBusinessSignup && ' Business features are additional add-ons.'}
            {isInfluencerPath && ' Creator accounts get the same benefits with enhanced tracking.'}
          </p>
        </motion.div>
      )}
    </div>
  );
};