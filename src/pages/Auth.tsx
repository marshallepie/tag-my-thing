import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { cookieUtils } from '../lib/utils';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, hasProfile } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const urlParams = new URLSearchParams(location.search);
  const nokInviteEmail = urlParams.get('nok_invite_email');
  
  // Determine initial mode based on current path
  const getInitialMode = (): 'signin' | 'signup' => {
    if (location.pathname === '/signup') return 'signup';
    if (location.pathname === '/login') return 'signin';
    return 'signin'; // default
  };
  
  const [mode, setMode] = useState<'signin' | 'signup'>(getInitialMode);

  // Get referral code from URL or cookie
  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlRefCode = urlParams.get('ref');
    
    if (urlRefCode) {
      // URL parameter takes precedence
      console.log('Auth: Using referral code from URL:', urlRefCode);
      setReferralCode(urlRefCode);
      // Update cookie with fresh referral code
      cookieUtils.set('tmt_referral_code', urlRefCode, 30);
    } else {
      // Check for stored referral code in cookie
      const cookieRefCode = cookieUtils.get('tmt_referral_code');
      if (cookieRefCode) {
        console.log('Auth: Using referral code from cookie:', cookieRefCode);
        setReferralCode(cookieRefCode);
      }
    }
  }, [location.search]);

  const handleSuccess = () => {
    if (nokInviteEmail) {
      // If this was a NOK invite, redirect to NOK dashboard
      navigate('/nok', { replace: true });
      return;
    }
    console.log('Auth page: handleSuccess called, navigating to dashboard');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AuthForm 
            mode={mode} 
            onSuccess={handleSuccess}
            referralCode={referralCode}
            initialEmail={nokInviteEmail || ''}
            emailReadOnly={!!nokInviteEmail}
            nokInviteEmail={nokInviteEmail || undefined}
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
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">
                    Want to earn tokens by referring friends?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/influencer-signup')}
                  >
                    Join as Influencer
                  </Button>
                </div>
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
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">
                    Want to earn tokens by referring friends?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/influencer-signup')}
                  >
                    Join as Influencer
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};