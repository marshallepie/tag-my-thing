import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { usePhoneSignup } from '../../hooks/usePhoneSignup';

interface PhoneSignupFormProps {
  referralCode?: string | null;
  fullName?: string;
  fromSource?: string;
  isBusinessSignup?: boolean;
  nokInviteEmail?: string;
  onBackToEmail: () => void;
  onSuccess?: () => void;
}

export const PhoneSignupForm: React.FC<PhoneSignupFormProps> = ({
  referralCode,
  fullName,
  fromSource,
  isBusinessSignup = false,
  nokInviteEmail,
  onBackToEmail,
  onSuccess,
}) => {
  const { state, startPhoneSignup, verifyOTPAndSignup, resendOTP } = usePhoneSignup();
  const [countryCode, setCountryCode] = useState('+44');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  // Common country codes
  const countryCodes = [
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+237', country: 'CM', flag: '🇨🇲' },
    { code: '+234', country: 'NG', flag: '🇳🇬' },
    { code: '+33', country: 'FR', flag: '🇫🇷' },
    { code: '+49', country: 'DE', flag: '🇩🇪' },
  ];

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on length (simple format)
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const validatePhone = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone()) {
      return;
    }
    
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
    
    await startPhoneSignup(fullPhoneNumber, {
      referralCode,
      fullName,
      fromSource,
      isBusinessSignup,
      nokInviteEmail,
    });
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length < 6) {
      return;
    }

    try {
      await verifyOTPAndSignup(otp, {
        referralCode,
        fullName,
        fromSource,
        isBusinessSignup,
        nokInviteEmail,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleResendOTP = async () => {
    await resendOTP();
  };

  if (state.step === 'phone') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sign up with Phone</h2>
          <p className="text-gray-600 mt-1">
            Enter your phone number to get started
          </p>
          {referralCode && (
            <p className="text-sm text-primary-600 mt-2">
              🎉 Signing up with referral code: <strong>{referralCode}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="flex space-x-2">
              {/* Country Code Selector */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={state.loading}
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              
              {/* Phone Number Input */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="7123 456 789"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={state.loading}
                maxLength={15}
              />
            </div>
          </div>

          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-700">{state.error}</p>
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={state.loading}
            disabled={!validatePhone()}
          >
            Send Verification Code
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onBackToEmail}
            className="w-full"
            disabled={state.loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Email Signup
          </Button>
        </form>
      </Card>
    );
  }

  // OTP Verification Step
  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verify Your Phone</h2>
        <p className="text-gray-600 mt-1">
          Enter the 6-digit code sent to
        </p>
        <p className="font-medium text-gray-900">{state.phoneNumber}</p>
      </div>

      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="w-full px-3 py-2 text-center text-lg font-mono border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={state.loading}
            maxLength={6}
            autoComplete="one-time-code"
          />
        </div>

        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-700">{state.error}</p>
          </motion.div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={state.loading}
          disabled={otp.length < 6}
        >
          Verify & Create Account
        </Button>

        <div className="flex space-x-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleResendOTP}
            className="flex-1"
            disabled={state.loading}
          >
            Resend Code
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={onBackToEmail}
            className="flex-1"
            disabled={state.loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </form>
    </Card>
  );
};