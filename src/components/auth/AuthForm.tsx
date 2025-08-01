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
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  mode, 
  onSuccess, 
  initialRole = 'user', 
  defaultIsBusinessUser = false 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isBusinessUserSignup, setIsBusinessUserSignup] = useState(defaultIsBusinessUser);
  const { processReferralSignup } = useReferrals();

  useEffect(() => {
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

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

    console.log('AuthForm - User created in auth, email confirmation required');

    // Store referral code for processing after email confirmation
    if (referralCode) {
      console.log('AuthForm - Referral code will be processed after email confirmation');
      // Store referral code in localStorage to process after confirmation
      localStorage.setItem('pending_referral_code', referralCode);
      localStorage.setItem('pending_referral_user_id', auth.user.id);
    }

    toast.success('Account created! Please check your email to confirm your signup.');
    
    // Redirect to check email page
    navigate('/check-email', { state: { email: formData.email } });
    console.log('AuthForm - Finished handleSignup');
  };

  const handleSignin = async () => {

    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed') || 
          error.message.includes('Email link is invalid or has expired') ||
          error.message.includes('signup_disabled')) {
        throw new Error('Please confirm your email before signing in. Check your inbox for the confirmation link.');
      }
      throw error;
    }
    
    const pendingReferralCode = localStorage.getItem('pending_referral_code');
    const pendingUserId = localStorage.getItem('pending_referral_user_id');
    
    if (pendingReferralCode && pendingUserId === auth.user?.id) {
      try {
        await processReferralSignup(pendingReferralCode, auth.user.id);
        localStorage.removeItem('pending_referral_code');
        localStorage.removeItem('pending_referral_user_id');
      } catch (referralError) {
        console.error('Referral processing failed:', referralError);
      }
    }
    
    console.log('AuthForm - Signin completed successfully');
    toast.success('Welcome back!');
    // The onAuthStateChange listener in useAuth will handle state updates and profile fetching.
    // Navigation will be handled by the AuthRedirect component in App.tsx.
    // No direct onSuccess call needed here for navigation.
    console.log('AuthForm - Finished handleSignin');
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
            🎉 Get {initialRole === 'influencer' ? '100' : '50'} TMT tokens as a welcome bonus{referralCode ? ' + referral rewards' : ''}!{isBusinessUserSignup ? ' Plus access to business features!' : ''}
          </p>
        </motion.div>
      )}
    </Card>
  );
};