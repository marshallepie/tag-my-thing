import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess: () => void;
  initialEmail?: string;
  emailReadOnly?: boolean;
  nokInviteEmail?: string;
  isBusinessSignup?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  mode, 
  onSuccess, 
  initialEmail = '',
  emailReadOnly = false,
  nokInviteEmail = null,
  isBusinessSignup = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
    fullName: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Set initial email if provided
    if (initialEmail && !formData.email) {
      setFormData(prev => ({ ...prev, email: initialEmail }));
    }

    // Get referral code from URL
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      console.log('AuthForm: Referral code detected:', refCode);
      setReferralCode(refCode);
    }
  }, [initialEmail, location.search]);

  const handleNokInvite = async (userId: string) => {
    if (!nokInviteEmail) return;
    
    console.log('Processing NOK invite for:', nokInviteEmail);
    try {
      const { data: acceptResult, error: acceptError } = await supabase.rpc('accept_nok_nomination', {
        p_nok_email: nokInviteEmail,
        p_linked_user_id: userId
      });

      if (acceptError) {
        console.error('NOK acceptance error:', acceptError);
        toast.error('Account created but failed to accept NOK nomination');
      } else if (acceptResult?.success) {
        toast.success('Account created and NOK nomination accepted!');
      } else {
        console.log('NOK acceptance result:', acceptResult);
        toast.success('Account created successfully!');
      }
    } catch (nokError) {
      console.error('NOK acceptance failed:', nokError);
      toast.success('Account created successfully!');
    }
  };

  const handleSignup = async () => {
    console.log('Starting signup process');
    console.log('Signup context:', {
      email: formData.email,
      hasReferralCode: !!referralCode,
      referralCode,
      isBusinessSignup
    });

    // Build metadata
    const metadata: Record<string, any> = { 
      full_name: formData.fullName 
    };
    if (referralCode) metadata.referral_code = referralCode;
    if (isBusinessSignup) metadata.account_type = 'business';

    // Build redirect URL with referral preserved
    const baseRedirectUrl = `${window.location.origin}/auth/callback`;
    const redirectUrl = referralCode
      ? `${baseRedirectUrl}?ref=${encodeURIComponent(referralCode)}&from=auth_form`
      : baseRedirectUrl;

    // Create auth user with email confirmation
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });

    if (authError) {
      console.error('Signup auth error:', authError);
      throw authError;
    }

    if (!auth.user) {
      throw new Error('No user returned from signup');
    }

    console.log('User created successfully:', {
      userId: auth.user.id,
      email: auth.user.email,
      needsEmailConfirmation: !auth.user.email_confirmed_at
    });

    // Handle NOK invite if present
    if (nokInviteEmail) {
      await handleNokInvite(auth.user.id);
    }

    toast.success('Account created! Please check your email to confirm your signup.');
    navigate('/check-email', { state: { email: formData.email } });
  };

  const handleSignin = async () => {
    console.log('Starting signin process');

    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      console.log('Sign-in error:', error);
      if (
        error.message.includes('Email not confirmed') || 
        error.message.includes('Email link is invalid or has expired') ||
        error.message.includes('signup_disabled')
      ) {
        throw new Error('Please confirm your email before signing in. Check your inbox for the confirmation link.');
      }
      throw error;
    }

    console.log('Sign-in successful, user:', auth.user?.id);

    // Handle NOK invite on signin if present
    if (nokInviteEmail && auth.user?.id) {
      await handleNokInvite(auth.user.id);
    }

    // Call the onSuccess callback to handle redirect
    onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        await handleSignup();
      } else {
        await handleSignin();
      }
    } catch (error: any) {
      let errorMessage = 'Authentication failed';
      
      if (error?.message) {
        if (error.message.includes('Please confirm your email before signing in.')) {
          errorMessage = error.message;
        } else if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email before signing in. Check your inbox for the confirmation link.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('duplicate key value') || error.code === '23505') {
          errorMessage = 'Account setup failed. Please try again or contact support.';
        } else if (error.message.includes('Email address') && error.message.includes('invalid')) {
          errorMessage = 'Please enter a valid email address.';
        } else {
          errorMessage = error.message;
        }
      } else if (error?.code) {
        if (error.code === 'invalid_credentials') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.code === 'email_address_invalid') {
          errorMessage = 'Please enter a valid email address.';
        } else {
          errorMessage = `Authentication error: ${error.code}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-gray-600 mt-1">
          {mode === 'signin' 
            ? 'Sign in to continue tagging your assets' 
            : 'Start tagging and securing your assets today'
          }
        </p>
        
        {/* Referral Notice */}
        {referralCode && mode === 'signup' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg"
          >
            <p className="text-sm text-primary-700">
              You're signing up via a referral! You and your referrer will earn bonus tokens.
            </p>
          </motion.div>
        )}
        
        {/* NOK Invite Notice */}
        {nokInviteEmail && mode === 'signup' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-secondary-50 border border-secondary-200 rounded-lg"
          >
            <p className="text-sm text-secondary-700">
              You're accepting a Next-of-Kin nomination! You'll be able to manage someone's digital legacy.
            </p>
          </motion.div>
        )}
        
        {/* Business Signup Notice */}
        {isBusinessSignup && mode === 'signup' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p className="text-sm text-blue-700">
              Business Account - You'll have access to business features after signup.
            </p>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <Input
            label="Full Name"
            name="fullName"
            id="auth-full-name"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            icon={<User className="h-5 w-5 text-gray-400" />}
            required
          />
        )}

        <Input
          label="Email"
          name="email"
          id="auth-email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          disabled={emailReadOnly}
          icon={<Mail className="h-5 w-5 text-gray-400" />}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            name="password"
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            icon={<Lock className="h-5 w-5 text-gray-400" />}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
        >
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      {mode === 'signup' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-primary-50 rounded-lg"
        >
          <p className="text-sm text-primary-700 text-center">
            Get 50 TMT tokens as a welcome bonus{referralCode ? ' + referral rewards' : ''}!
            {isBusinessSignup ? ' Plus business features access!' : ''}
            {nokInviteEmail ? ' Plus Next-of-Kin access!' : ''}
            <br />
            <span className="text-xs opacity-75">Everyone gets full referral privileges to earn from friend referrals!</span>
          </p>
        </motion.div>
      )}
    </Card>
  );
};