import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, initialized } = useAuth();

  const urlParams = new URLSearchParams(location.search);
  const hasReferralCode = urlParams.has('ref');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  if (!initialized) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (hasReferralCode) {
    const redirectUrl = `/influencer-signup?ref=${urlParams.get('ref')}`;
    return <Navigate to={redirectUrl} replace />;
  }

  const handleSuccess = () => {
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