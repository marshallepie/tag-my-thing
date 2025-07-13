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
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess, initialRole = 'user' }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const { processReferralSignup, refreshData } = useReferrals();

  useEffect(() => {
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        console.log('AuthForm - Starting signup process for role:', initialRole);

        // Sign up user
        const { data: auth, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: undefined // Disable email confirmation
          }
        });

        console.log('AuthForm - Signup result:', { auth: !!auth.user, error: authError });

        if (authError) throw authError;

        if (auth.user) {
          console.log('AuthForm - User created, setting up profile for:', auth.user.id);
          
          // Determine signup bonus based on role
          const signupBonus = initialRole === 'influencer' ? 100 : 50;

          // Create user profile with retry logic
          let profileError;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            const { error } = await supabase
              .from('user_profiles')
              .insert({
                id: auth.user.id,
                email: formData.email,
                full_name: formData.fullName,
                role: initialRole,
                subscription_plan: 'freemium', // Only freemium plan available
              });
            
            profileError = error;
            
            if (!error) {
              console.log('AuthForm - Profile created successfully');
              break;
            }
            
            console.log(`AuthForm - Profile creation attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          console.log('AuthForm - Profile creation result:', { error: profileError });
          if (profileError) throw profileError;

          // Create wallet with signup bonus (with retry)
          let walletError;
          retryCount = 0;
          
          while (retryCount < maxRetries) {
            const { error } = await supabase
              .from('user_wallets')
              .insert({
                user_id: auth.user.id,
                balance: signupBonus,
              });
            
            walletError = error;
            
            if (!error) {
              console.log('AuthForm - Wallet created successfully');
              break;
            }
            
            console.log(`AuthForm - Wallet creation attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          console.log('AuthForm - Wallet creation result:', { error: walletError });
          if (walletError) throw walletError;

          // Record signup transaction (with retry)
          let transactionError;
          retryCount = 0;
          
          while (retryCount < maxRetries) {
            const { error } = await supabase
              .from('token_transactions')
              .insert({
                user_id: auth.user.id,
                amount: signupBonus,
                type: 'earned',
                source: 'signup',
                description: `Welcome bonus${initialRole === 'influencer' ? ' (Influencer)' : ''}`,
              });
            
            transactionError = error;
            
            if (!error) {
              console.log('AuthForm - Transaction created successfully');
              break;
            }
            
            console.log(`AuthForm - Transaction creation attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          console.log('AuthForm - Transaction creation result:', { error: transactionError });
          if (transactionError) throw transactionError;

          // Process referral if present
          if (referralCode) {
            try {
              console.log('AuthForm - Processing referral:', referralCode);
              // Add a delay to ensure all database operations complete
              setTimeout(async () => {
                try {
                  await processReferralSignup(referralCode, auth.user.id);
                  // Force refresh of auth data after referral processing
                  setTimeout(() => {
                    refreshData?.();
                  }, 1000);
                } catch (referralError) {
                  console.error('Delayed referral processing failed:', referralError);
                }
              }, 1000);
            } catch (referralError) {
              console.error('Referral processing failed:', referralError);
              // Don't fail the signup if referral processing fails
            }
          }

          const successMessage = initialRole === 'influencer' 
            ? 'Influencer account created successfully! You received 100 TMT tokens!'
            : 'Account created successfully! You received 50 TMT tokens!';
          
          console.log('AuthForm - Signup completed successfully, calling onSuccess');
          toast.success(successMessage);
          
          // Add longer delay to ensure auth state is fully established
          setTimeout(() => {
            onSuccess();
          }, 1000);
        }
      } else {
        console.log('AuthForm - Starting signin process');

        // Sign in user
        const { data: auth, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        
        console.log('AuthForm - Signin completed successfully');
        toast.success('Welcome back!');
        
        // Longer delay for auth state to fully update
        setTimeout(() => {
          onSuccess();
        }, 800);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Better error handling
      let errorMessage = 'Authentication failed';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid email or password')) {
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
        {initialRole === 'influencer' && (
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Crown className="h-6 w-6 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
              Influencer Signup
            </span>
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'signin' ? 'Welcome back' : `Create your ${initialRole === 'influencer' ? 'influencer ' : ''}account`}
        </h2>
        <p className="text-gray-600 mt-1">
          {mode === 'signin' 
            ? 'Sign in to continue tagging your assets' 
            : initialRole === 'influencer'
              ? 'Join as an influencer and start earning more tokens'
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
          {mode === 'signin' ? 'Sign In' : `Create ${initialRole === 'influencer' ? 'Influencer ' : ''}Account`}
        </Button>
      </form>

      {mode === 'signup' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-primary-50 rounded-lg"
        >
          <p className="text-sm text-primary-700 text-center">
            🎉 Get {initialRole === 'influencer' ? '100' : '50'} TMT tokens as a welcome bonus{referralCode ? ' + referral rewards' : ''}!
          </p>
        </motion.div>
      )}
    </Card>
  );
};