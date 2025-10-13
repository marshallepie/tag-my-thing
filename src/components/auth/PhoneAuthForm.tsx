import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';


interface PhoneAuthFormProps {
  onSubmit: (phoneNumber: string) => Promise<void>;
  onBackToEmail: () => void;
  loading?: boolean;
}

export const PhoneAuthForm: React.FC<PhoneAuthFormProps> = ({
  onSubmit,
  onBackToEmail,
  loading = false
}) => {
  const [countryCode, setCountryCode] = useState('+44'); // Default to UK
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

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
    
    // Format based on length (simple UK format)
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError('');
  };

  const validatePhone = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    
    if (digits.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone()) return;
    
    const fullNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
    
    try {
      await onSubmit(fullNumber);
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Phone Sign In</h2>
        <p className="text-gray-600 mt-1">
          Enter your phone number to receive a verification code
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={loading}
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
              placeholder="7XX XXX XXXX"
              className={`
                flex-1 px-3 py-2 border rounded-lg shadow-sm
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                ${error ? 'border-error-500' : 'border-gray-300'}
              `}
              disabled={loading}
              required
            />
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-error-600 flex items-center"
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </motion.p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={!phoneNumber || loading}
        >
          Send Verification Code
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onBackToEmail}
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to email login
        </button>
      </div>

      <div className="mt-6 p-4 bg-primary-50 rounded-lg">
        <p className="text-xs text-primary-700 text-center">
          By continuing, you agree to receive SMS verification codes. Standard message rates may apply.
        </p>
      </div>
    </Card>
  );
};