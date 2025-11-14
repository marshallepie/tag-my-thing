import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PhoneSignupOptions {
  referralCode?: string | null;
  fullName?: string;
  fromSource?: string;
  isBusinessSignup?: boolean;
  nokInviteEmail?: string;
}

interface PhoneSignupState {
  step: 'phone' | 'otp' | 'profile';
  loading: boolean;
  error: string | null;
  phoneNumber: string;
  userId: string | null;
}

export const usePhoneSignup = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<PhoneSignupState>({
    step: 'phone',
    loading: false,
    error: null,
    phoneNumber: '',
    userId: null,
  });

  const formatPhoneNumber = (phone: string): string => {
    // Ensure phone starts with + and is properly formatted
    const cleaned = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) {
      return phone;
    }
    // Default to +44 if no country code provided
    return `+44${cleaned}`;
  };

  const startPhoneSignup = async (phone: string, options: PhoneSignupOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const formattedPhone = formatPhoneNumber(phone);
      console.log('Starting phone signup for:', formattedPhone, 'with options:', options);

      // Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          // Store signup metadata in the OTP options
          data: {
            full_name: options.fullName || '',
            referral_code: options.referralCode || '',
            account_type: options.isBusinessSignup ? 'business' : 'user',
            from_source: options.fromSource || 'phone_signup',
            nok_invite_email: options.nokInviteEmail || '',
          }
        }
      });

      if (otpError) {
        throw otpError;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        phoneNumber: formattedPhone,
        step: 'otp'
      }));

      toast.success('Verification code sent to your phone!');
    } catch (error: any) {
      console.error('Phone signup error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to send verification code'
      }));
      toast.error(error.message || 'Failed to send verification code');
    }
  };

  const verifyOTPAndSignup = async (otp: string, options: PhoneSignupOptions = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('Verifying OTP for phone signup:', state.phoneNumber);

      // Verify OTP - this will create the user if successful
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: state.phoneNumber,
        token: otp,
        type: 'sms'
      });

      if (verifyError) {
        throw verifyError;
      }

      if (!data.user) {
        throw new Error('No user created after OTP verification');
      }

      console.log('Phone signup successful, user created:', data.user?.id);

      setState(prev => ({
        ...prev,
        loading: false,
        userId: data.user?.id || null,
        step: 'profile'
      }));

      if (!data.user?.id) {
        throw new Error('User ID not available after verification');
      }

      // Apply referral if provided
      if (options.referralCode && data.user) {
        try {
          console.log('Applying referral code:', options.referralCode);
          const { error: referralError } = await supabase.rpc('apply_referral_on_signup', {
            p_new_user_id: data.user.id,
            p_referral_code: options.referralCode,
            p_source: options.fromSource || 'phone_signup',
          });

          if (referralError) {
            console.warn('Referral application failed:', referralError.message);
          } else {
            console.log('Referral applied successfully');
            toast.success('Account created with referral bonus!');
          }
        } catch (referralErr) {
          console.warn('Referral processing error:', referralErr);
        }
      }

      // Handle NOK invite if present
      if (options.nokInviteEmail && data.user) {
        try {
          console.log('Processing NOK invite for:', options.nokInviteEmail);
          const { error: nokError } = await supabase.rpc('accept_nok_nomination', {
            p_nok_email: options.nokInviteEmail,
            p_linked_user_id: data.user.id
          });

          if (nokError) {
            console.warn('NOK invite acceptance failed:', nokError.message);
          } else {
            toast.success('NOK nomination accepted!');
          }
        } catch (nokErr) {
          console.warn('NOK processing error:', nokErr);
        }
      }

      // Update user profile with additional information if provided
      if (options.fullName && data.user) {
        try {
          await supabase.from('user_profiles').upsert({
            id: data.user.id,
            email: data.user.email || '',
            full_name: options.fullName,
            phone_number: state.phoneNumber,
            role: 'user',
            account_type: options.isBusinessSignup ? 'business' : 'user'
          }, {
            onConflict: 'id'
          });

          console.log('User profile updated with name and phone');
        } catch (profileError) {
          console.warn('Profile update failed:', profileError);
        }
      }

      return data.user;
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to verify code'
      }));
      toast.error(error.message || 'Failed to verify code');
      throw error;
    }
  };

  const resendOTP = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: state.phoneNumber
      });

      if (error) {
        throw error;
      }

      setState(prev => ({ ...prev, loading: false }));
      toast.success('New verification code sent!');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to resend code'
      }));
      toast.error(error.message || 'Failed to resend code');
    }
  };

  const resetSignup = () => {
    setState({
      step: 'phone',
      loading: false,
      error: null,
      phoneNumber: '',
      userId: null,
    });
  };

  const completeSignup = (redirectTo?: string) => {
    if (redirectTo) {
      navigate(redirectTo, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return {
    state,
    startPhoneSignup,
    verifyOTPAndSignup,
    resendOTP,
    resetSignup,
    completeSignup,
  };
};