import React, { useState, useEffect } from 'react';
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
    console.log('AuthForm - Starting signup process');

    // Sign up user with Supabase Auth
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: undefined // Disable email confirmation
      }
    });

    if (authError) {
      console.error('AuthForm - Signup auth error:', authError);
      throw authError;
    }

    if (!auth.user) {
      throw new Error('No user returned from signup');
    }

    console.log('AuthForm - User created in auth, setting up profile');

    // Determine signup bonus based on role
    const signupBonus = initialRole === 'influencer' ? 100 : 50;

    // Create user profile, wallet, and transaction
    await createUserProfile(auth.user.id, formData.email, formData.fullName);
    await createUserWallet(auth.user.id, signupBonus);
    await createSignupTransaction(auth.user.id, signupBonus);

    // Process referral if present
    if (referralCode) {
      console.log('AuthForm - Processing referral:', referralCode);
      try {
        // Add a delay to ensure all database operations complete
        setTimeout(async () => {
          try {
            await processReferralSignup(referralCode, auth.user.id);
          } catch (referralError) {
            console.error('AuthForm - Referral processing failed:', referralError);
            // Don't fail the signup if referral processing fails
          }
        }, 1000);
      } catch (referralError) {
        console.error('AuthForm - Referral processing setup failed:', referralError);
        // Don't fail the signup if referral processing fails
      }
    }

    const successMessage = initialRole === 'influencer' 
      ? 'Influencer account created successfully! You received 100 TMT tokens!'
      : 'Account created successfully! You received 50 TMT tokens!';
    
    console.log('AuthForm - Signup completed successfully');
    toast.success(successMessage);
    
    // The onAuthStateChange listener in useAuth will handle state updates
    // Add a small delay to ensure the auth state is updated
    setTimeout(() => {
      onSuccess();
    }, 500);
    console.log('AuthForm - Finished handleSignup');
  };

  const handleSignin = async () => {
    console.log('AuthForm - Starting handleSignin');
    console.log('AuthForm - Starting signin process');

    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      console.error('AuthForm - Signin error:', error);
      throw error;
    }
    
    console.log('AuthForm - Signin completed successfully');
    toast.success('Welcome back!');
    
    // The onAuthStateChange listener in useAuth will handle state updates
    // Add a small delay to ensure the auth state is updated
    setTimeout(() => {
      onSuccess();
    }, 500);
    console.log('AuthForm - Finished handleSignin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AuthForm - Starting handleSubmit, mode:', mode);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await handleSignup();
      } else {
        await handleSignin();
      }
    } catch (error: any) {
      console.error('AuthForm - Submit error:', error);
      
      // Better error handling
      let errorMessage = 'Authentication failed';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('duplicate key value') || error.code === '23505') {
          errorMessage = 'Account setup failed. Please try again or contact support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('AuthForm - Finished handleSubmit');
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