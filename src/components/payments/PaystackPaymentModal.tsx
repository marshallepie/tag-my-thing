import React from 'react';
import { X, CreditCard, CheckCircle, XCircle, Loader } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { useAuth } from '@/hooks/useAuth';
import { useTokens } from '@/hooks/useTokens';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface PaystackPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: {
    id: string;
    tokens: number;
    price: number;
    currency: string;
  } | null;
  onSuccess?: () => void;
}

type Step = 'ready' | 'processing' | 'success' | 'error';

export function PaystackPaymentModal({
  isOpen,
  onClose,
  selectedPackage,
  onSuccess,
}: PaystackPaymentModalProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { refreshWallet } = useTokens();
  const [currentStep, setCurrentStep] = React.useState<Step>('ready');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [reference, setReference] = React.useState<string>('');

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

  // Generate reference
  const generateReference = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TMT-${timestamp}-${random}`;
  };

  // Convert to kobo (lowest unit)
  const convertToKobo = (amount: number) => Math.round(amount * 100);

  // Initialize Paystack config
  const config = selectedPackage && user ? {
    reference: reference || generateReference(),
    email: user.email || '',
    amount: convertToKobo(selectedPackage.price),
    publicKey,
    currency: selectedPackage.currency,
    metadata: {
      custom_fields: [
        {
          display_name: 'Package',
          variable_name: 'package_id',
          value: selectedPackage.id,
        },
        {
          display_name: 'Tokens',
          variable_name: 'tokens',
          value: selectedPackage.tokens,
        },
      ],
    },
  } : null;

  const initializePayment = usePaystackPayment(config || {
    reference: '',
    email: '',
    amount: 0,
    publicKey: publicKey || 'dummy',
  });

  // Handle payment success
  const handleSuccess = async (response: any) => {
    setCurrentStep('processing');

    try {
      // Verify payment on server
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: {
          reference: response.reference,
        },
      });

      if (error || !data?.success) {
        setCurrentStep('error');
        setErrorMessage(data?.message || 'Payment verification failed');
        return;
      }

      setCurrentStep('success');
      toast.success(`Payment successful! ${data.tokens_credited} TMT tokens added!`);

      // Refresh wallet
      await refreshWallet();

      // Auto-close after 2 seconds
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Payment verification error:', err);
      setCurrentStep('error');
      setErrorMessage('Payment verification failed');
    }
  };

  // Handle payment close
  const handleClose = () => {
    if (currentStep !== 'success') {
      toast.info('Payment was cancelled');
    }
  };

  // Start payment
  const startPayment = async () => {
    if (!selectedPackage || !user || !profile) {
      toast.error('Please log in to purchase tokens');
      return;
    }

    if (!publicKey) {
      toast.error('Payment system not configured');
      return;
    }

    // Generate new reference
    const newRef = generateReference();
    setReference(newRef);

    // Create payment transaction record
    try {
      const { error } = await supabase.from('payment_transactions').insert({
        user_id: user.id,
        transaction_reference: newRef,
        payment_provider: 'paystack',
        amount: selectedPackage.price,
        currency: selectedPackage.currency,
        tokens_purchased: selectedPackage.tokens,
        status: 'pending',
        paystack_reference: newRef,
        metadata: {
          package_id: selectedPackage.id,
          customer_email: user.email,
          customer_name: profile?.full_name || user.email,
        },
      });

      if (error) {
        console.error('Error creating payment transaction:', error);
        toast.error('Failed to initialize payment');
        return;
      }

      // Initialize Paystack payment
      initializePayment(handleSuccess, handleClose);
    } catch (err) {
      console.error('Error starting payment:', err);
      toast.error('Failed to start payment');
    }
  };

  if (!isOpen || !selectedPackage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Paystack Payment</h2>
              <p className="text-sm text-gray-500">Secure Payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={currentStep === 'processing'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Ready Step */}
          {currentStep === 'ready' && (
            <>
              {/* Package Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Package</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedPackage.tokens} TMT Tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedPackage.currency} {selectedPackage.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={startPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="h-5 w-5" />
                Pay with Paystack
              </button>

              <p className="text-xs text-center text-gray-500 mt-4">
                Secure Payment 🔒 Powered by Paystack
              </p>
            </>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-16 w-16 text-blue-600 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600 text-center">Please wait...</p>
            </div>
          )}

          {/* Success Step */}
          {currentStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 text-center">
                {selectedPackage.tokens} TMT tokens added to your wallet
              </p>
            </div>
          )}

          {/* Error Step */}
          {currentStep === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-600 text-center mb-6">{errorMessage || 'An error occurred'}</p>
              <button
                onClick={() => setCurrentStep('ready')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
