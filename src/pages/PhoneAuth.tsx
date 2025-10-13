import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneAuthForm } from '../components/auth/PhoneAuthForm';
import { OTPVerificationForm } from '../components/auth/OTPVerificationForm';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import toast from 'react-hot-toast';

type AuthStep = 'phone' | 'otp';

export const PhoneAuth: React.FC = () => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithPhone, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handlePhoneSubmit = async (phone: string) => {
    setLoading(true);
    try {
      await signInWithPhone(phone);
      setPhoneNumber(phone);
      setStep('otp');
      toast.success('Verification code sent!');
    } catch (error: any) {
      console.error('Phone auth error:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otp: string) => {
    setLoading(true);
    try {
      await verifyOTP(phoneNumber, otp);
      toast.success('Phone verified successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'Invalid verification code');
      throw error; // Re-throw to trigger OTP form error handling
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await signInWithPhone(phoneNumber);
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setPhoneNumber('');
  };

  const handleBackToEmail = () => {
    navigate('/auth');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {step === 'phone' ? (
            <PhoneAuthForm
              onSubmit={handlePhoneSubmit}
              onBackToEmail={handleBackToEmail}
              loading={loading}
            />
          ) : (
            <OTPVerificationForm
              phoneNumber={phoneNumber}
              onVerify={handleOTPVerify}
              onResend={handleResendOTP}
              onBack={handleBackToPhone}
              loading={loading}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};