import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useReferrals } from '../../hooks/useReferrals';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess: () => void;
  initialRole?: 'user' | 'influencer';
  defaultIsBusinessUser?: boolean;
  initialEmail?: string;
  emailReadOnly?: boolean;
  nokInviteEmail?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  mode, 
  onSuccess, 
  initialRole = 'user', 
  defaultIsBusinessUser = false,
  initialEmail = '',
  emailReadOnly = false,
  nokInviteEmail = null
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isBusinessUserSignup, setIsBusinessUserSignup] = useState(defaultIsBusinessUser);
  const { processReferralSignup } = useReferrals();

  useEffect(() => {
    // Set initial email if provided
    if (initialEmail && !formData.email) {
      setFormData(prev => ({ ...prev, email: initialEmail }));
    }

    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, [initialEmail]);

  const createUserProfile = async (userId: string, email: string, fullName: string) => {
    console.log('AuthForm - Creating user profile for:', userId);
    
    const profileData = {
      id: userId,
      email: email,
      full_name: fullName,
      role: isBusinessUserSignup ? 'user' : initialRole,
      subscription_plan: 'freemium',
      is_business_user: isBusinessUserSignup,
    };

    const { error } = await supabase
      .from('user_profiles')
      .insert(profileData);

    if (error) {
      console.error('AuthForm - Profile creation error:', error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    console.log('AuthForm - Profile created successfully');
    return profileData;
  };

  const createUserWallet = async (userId: string, signupBonus: number) => {
    console.log('AuthForm - Creating user wallet with bonus:', signupBonus);
    
    const { error } = await supabase
      .from('user_wallets')
      .insert({
        user_id: userId,
        balance: signupBonus,
      });

    if (error) {
      console.error('AuthForm - Wallet creation error:', error);
      throw new Error(`Failed to create user wallet: ${error.message}`);
    }

    console.log('AuthForm - Wallet created successfully');
  };

  const createSignupTransaction = async (userId: string, signupBonus: number) => {
    console.log('AuthForm - Creating signup transaction');
    
    const { error } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: signupBonus,
        type: 'earned',
        source: 'signup',
        description: `Welcome bonus${initialRole === 'influencer' ? ' (Influencer)' : ''}`,
      });

    if (error) {
      console.error('AuthForm - Transaction creation error:', error);
      throw new Error(`Failed to create signup transaction: ${error.message}`);
    }

    console.log('AuthForm - Transaction created successfully');
  };

  const handleSignup = async () => {
    console.log('AuthForm - Starting handleSignup');

    // Sign up user with Supabase Auth with email confirmation
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`, // Redirect to auth page after email confirmation
        data: {
          full_name: formData.fullName,
          role: isBusinessUserSignup ? 'user' : initialRole,
          is_business_user: isBusinessUserSignup
        }
      }
    });

    if (authError) {
      console.error('AuthForm - Signup auth error:', authError);
      throw authError;
    }

    if (!auth.user) {
      throw new Error('No user returned from signup');
    }

    // Handle NOK invite acceptance for new signups
    await handleSignupSuccess(auth.user.id);

    console.log('AuthForm - User created in auth, email confirmation required');

    // Store referral code for processing after email confirmation
    if (referralCode) {
      console.log('🔍 REFERRAL DEBUG - Storing referral code for post-confirmation processing');
      console.log('🔍 Storing:', { referralCode, userId: auth.user.id });
      // Store referral code in localStorage to process after confirmation
      localStorage.setItem('pending_referral_code', referralCode);
      localStorage.setItem('pending_referral_user_id', auth.user.id);
      console.log('✅ REFERRAL DEBUG - Referral code stored in localStorage');
    }

    toast.success('Account created! Please check your email to confirm your signup.');
    
    // Redirect to check email page
    navigate('/check-email', { state: { email: formData.email } });
    console.log('AuthForm - Finished handleSignup');
  };

const handleSignin = async () => {
  console.log('AuthForm: handleSignin called');

  const { data: auth, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    console.log('AuthForm: Sign-in error:', error);
    if (
      error.message.includes('Email not confirmed') || 
      error.message.includes('Email link is invalid or has expired') ||
      error.message.includes('signup_disabled')
    ) {
      throw new Error('Please confirm your email before signing in. Check your inbox for the confirmation link.');
    }
    throw error;
  }

  console.log('AuthForm: Sign-in successful, user:', auth.user?.id);

  // If you're on prod, send them to prod. Otherwise, use current origin.
  const redirectBase =
    window.location.hostname.endsWith('tagmything.com')
      ? 'https://www.tagmything.com'
      : window.location.origin;

  // Optional: handle NOK + referral exactly as before (unchanged)
  if (nokInviteEmail && auth.user?.id) {
    try {
      const { error: acceptError } = await supabase.rpc('accept_nok_nomination', {
        p_nok_email: nokInviteEmail,
        p_linked_user_id: auth.user.id
      });
      if (acceptError) console.error('NOK acceptance error:', acceptError);
    } catch (nokError) {
      console.error('NOK acceptance failed:', nokError);
    }
  }

  const pendingReferralCode = localStorage.getItem('pending_referral_code');
  const pendingUserId = localStorage.getItem('pending_referral_user_id');
  
  console.log('🔍 REFERRAL DEBUG - Checking for pending referral after signin');
  console.log('🔍 Retrieved from localStorage:', { 
    pendingReferralCode, 
    pendingUserId, 
    currentUserId: auth.user?.id 
  });
  
  if (pendingReferralCode && pendingUserId === auth.user?.id) {
    console.log('✅ REFERRAL DEBUG - Found matching pending referral, processing...');
    try {
      await processReferralSignup(pendingReferralCode, auth.user.id);
      console.log('✅ REFERRAL DEBUG - processReferralSignup completed, cleaning localStorage');
      localStorage.removeItem('pending_referral_code');
      localStorage.removeItem('pending_referral_user_id');
      console.log('✅ REFERRAL DEBUG - localStorage cleaned');
    } catch (referralError) {
      console.error('❌ REFERRAL DEBUG - Referral processing failed in handleSignin:', referralError);
    }
  } else {
    console.log('ℹ️ REFERRAL DEBUG - No matching pending referral found');
    if (pendingReferralCode && pendingUserId !== auth.user?.id) {
      console.log('⚠️ REFERRAL DEBUG - User ID mismatch, clearing stale data');
      localStorage.removeItem('pending_referral_code');
      localStorage.removeItem('pending_referral_user_id');
    }
  }

  // Hard redirect so session/cookies align with the target domain
  window.location.href = `${redirectBase}/dashboard`;
};

  const handleSignupSuccess = async (userId: string) => {
    // Handle NOK invite acceptance on sign-up
    if (nokInviteEmail && userId) {
      console.log('AuthForm: Processing NOK invite acceptance after signup for:', nokInviteEmail);
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
    }
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
          errorMessage = 'Invalid email or password. Please check your credentials and try again. If you don\'t have an account, please sign up first.';
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
        // Handle Supabase error codes directly
        if (error.code === 'invalid_credentials') {
          errorMessage = 'Invalid email or password. Please check your credentials and try again. If you don\'t have an account, please sign up first.';
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
              🎉 You're signing up via a referral! You and your referrer will earn bonus tokens.
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
              🛡️ You're accepting a Next-of-Kin nomination! You'll be able to manage someone's digital legacy.
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
            🎉 Get {initialRole === 'influencer' ? '100' : '50'} TMT tokens as a welcome bonus{referralCode ? ' + referral rewards' : ''}!{isBusinessUserSignup ? ' Plus access to business features!' : ''}{nokInviteEmail ? ' Plus Next-of-Kin access!' : ''}
          </p>
        </motion.div>
      )}
    </Card>
  );
};