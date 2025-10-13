import React, { useState, useEffect, useRef } from 'react';
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface OTPVerificationFormProps {
  phoneNumber: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export const OTPVerificationForm: React.FC<OTPVerificationFormProps> = ({
  phoneNumber,
  onVerify,
  onResend,
  onBack,
  loading = false
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every(digit => digit !== '') && !loading) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);

    // Focus last filled input or first empty
    const lastIndex = pastedData.length - 1;
    inputRefs.current[Math.min(lastIndex + 1, 5)]?.focus();

    // Auto-submit if complete
    if (pastedData.length === 6 && !loading) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code: string) => {
    try {
      await onVerify(code);
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || loading) return;

    try {
      await onResend();
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      toast.success('Verification code resent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend code');
    }
  };

  const maskPhoneNumber = (phone: string) => {
    const last4 = phone.slice(-4);
    return `***${last4}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-success-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Enter Verification Code</h2>
        <p className="text-gray-600 mt-1">
          We sent a 6-digit code to
        </p>
        <p className="text-gray-900 font-medium mt-1">
          {maskPhoneNumber(phoneNumber)}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-center space-x-2 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`
                w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                ${digit ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={loading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={loading}
              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Resend code
            </button>
          ) : (
            <p className="text-sm text-gray-600">
              Resend code in <span className="font-semibold">{countdown}s</span>
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={() => handleVerify(otp.join(''))}
        className="w-full"
        loading={loading}
        disabled={otp.some(digit => !digit) || loading}
      >
        Verify & Sign In
      </Button>

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Change phone number
        </button>
      </div>
    </Card>
  );
};