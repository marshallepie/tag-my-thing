import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Check if there's a referral code in the URL to determine initial mode
  const urlParams = new URLSearchParams(location.search);
  const hasReferralCode = urlParams.has('ref');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Only redirect to influencer signup if there's a referral code
  if (hasReferralCode) {
    const redirectUrl = `/influencer-signup?ref=${urlParams.get('ref')}`;
    return <Navigate to={redirectUrl} replace />;
  }

  const handleSuccess = () => {
    // Navigate to dashboard with longer delay to ensure auth state is ready
    console.log('Auth - Signup/signin successful, navigating to dashboard');
    setTimeout(() => {
      console.log('Auth - Executing navigation to dashboard');
      navigate('/dashboard', { replace: true });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AuthForm mode={mode} onSuccess={handleSuccess} />
          
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