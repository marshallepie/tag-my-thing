import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
  console.log('=== AUTH CALLBACK START ===');
  console.log('Full URL:', window.location.href);
  console.log('Search params:', location.search);
  
  try {
    // Handle the auth callback
    const { data, error } = await supabase.auth.getSession();
    console.log('Session data:', data?.session?.user?.id);
    
    if (error) {
      console.error('Auth callback error:', error);
      setMessage('Email verification failed. Please try again.');
      setTimeout(() => navigate('/auth'), 3000);
      return;
    }

    const user = data.session?.user;
    if (!user) {
      console.log('No user found in session');
      setMessage('No user session found. Redirecting...');
      setTimeout(() => navigate('/auth'), 2000);
      return;
    }

    console.log('User found:', user.id);

    // Extract referral code from URL
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');
    const fromParam = urlParams.get('from');
    
    console.log('Extracted refCode:', refCode);
    console.log('Extracted fromParam:', fromParam);

    // Apply referral if present
    if (refCode) {
      console.log('About to apply referral:', refCode);
      setMessage('Email verified! Processing your referral...');
      
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('apply_referral_on_signup', {
          p_new_user_id: user.id,
          p_referral_code: refCode,
          p_source: fromParam || 'email_verification',
        });
        
        console.log('RPC response data:', JSON.stringify(rpcData, null, 2));
        console.log('RPC response error:', rpcErr);
        
        if (rpcErr) {
          console.warn('Referral application failed:', rpcErr.message);
          setMessage('Email verified! Redirecting to your dashboard...');
        } else {
          console.log('✅ Referral applied successfully from email verification');
          setMessage('Email verified and referral applied! Redirecting...');
        }
      } catch (ex) {
        console.error('Referral RPC exception:', ex);
        setMessage('Email verified! Redirecting to your dashboard...');
      }
    } else {
      console.log('No refCode found - skipping referral');
      setMessage('Email verified! Redirecting to your dashboard...');
    }

    // Redirect to appropriate page after brief delay
    setTimeout(() => {
      if (fromParam && fromParam.includes('tagging')) {
        navigate('/tag', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }, 2000);

  } catch (error) {
    console.error('Callback processing error:', error);
    setMessage('Something went wrong. Redirecting...');
    setTimeout(() => navigate('/auth'), 3000);
  } finally {
    setProcessing(false);
  }
};


    handleAuthCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          <div className="mt-4">
            {processing && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            )}
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};