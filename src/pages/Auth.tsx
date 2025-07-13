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

  // Check if there's a referral code in the URL to determine initial mode
  const urlParams = new URLSearchParams(location.search);
  const hasReferralCode = urlParams.has('ref');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin'); // Always default to signin

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect new users to influencer signup
  if (mode === 'signup' || hasReferralCode) {
    const redirectUrl = hasReferralCode 
      ? `/influencer-signup?ref=${urlParams.get('ref')}`
      : '/influencer-signup';
    return <Navigate to={redirectUrl} replace />;
  }

  const handleSuccess = () => {
    // Navigate to dashboard with delay to ensure auth state is ready
    console.log('Auth - Signup/signin successful, navigating to dashboard');
    setTimeout(() => {
      navigate('/dashboard');
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AuthForm mode={mode} onSuccess={handleSuccess} />
          
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Don't have an account?
            </p>
            <Button
              variant="ghost"
              onClick={() => navigate('/influencer-signup')}
              className="mt-2"
            >
              Join TagMyThing
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};