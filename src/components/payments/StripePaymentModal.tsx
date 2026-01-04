import React, { useState, useEffect, useMemo } from 'react';
import { X, CreditCard, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useStripePayment, getStripePromise, TokenPackage } from '@/hooks/useStripePayment';
import { useTranslation } from 'react-i18next';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: TokenPackage | null;
  onSuccess?: () => void;
}

type Step = 'input' | 'processing' | 'success' | 'error';

// Inner form component that uses Stripe hooks
function StripePaymentForm({
  selectedPackage,
  clientSecret,
  onSuccess,
  onError,
  onProcessing,
}: {
  selectedPackage: TokenPackage;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onProcessing: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!isPaymentElementReady) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit the form to validate all fields
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Elements submit error:', submitError);
        onError(submitError.message || 'Validation failed');
        setIsSubmitting(false);
        return;
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/wallet',
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment error:', error);
        onError(error.message || 'Payment failed');
        setIsSubmitting(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onProcessing(); // Now set processing step AFTER payment confirmed
        onSuccess();
      } else {
        onError('Payment could not be completed');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Unexpected payment error:', err);
      onError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Package Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">{t('wallet.package')}</p>
            <p className="text-lg font-bold text-gray-900">
              {selectedPackage.token_amount} TMT Tokens
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{t('wallet.amount')}</p>
            <p className="text-2xl font-bold text-purple-600">
              £{selectedPackage.price_gbp.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div className="border border-gray-200 rounded-lg p-4">
        <PaymentElement
          onReady={() => setIsPaymentElementReady(true)}
          onLoadError={(error) => {
            console.error('PaymentElement load error:', error);
            setIsPaymentElementReady(false);
          }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || !isPaymentElementReady || isSubmitting}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            {t('common.processing')}
          </>
        ) : (!stripe || !elements || !isPaymentElementReady) ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            {t('common.loading')}
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            {t('wallet.payNow')} £{selectedPackage.price_gbp.toFixed(2)}
          </>
        )}
      </button>

      {/* Security Notice */}
      <p className="text-xs text-center text-gray-500">
        {t('wallet.securePayment')} 🔒 Powered by Stripe
      </p>
    </form>
  );
}

export function StripePaymentModal({
  isOpen,
  onClose,
  selectedPackage,
  onSuccess,
}: StripePaymentModalProps) {
  const { t } = useTranslation();
  const { initiatePayment, verifyAndCredit, loading } = useStripePayment();
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Memoize stripePromise to prevent re-creating Stripe instance on every render
  const stripePromise = useMemo(() => getStripePromise(), []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && selectedPackage) {
      setCurrentStep('input');
      setErrorMessage('');
      setClientSecret(null);
      setPaymentIntentId(null);

      // Create Payment Intent
      initiatePayment(selectedPackage).then((result) => {
        if (result) {
          setClientSecret(result.clientSecret);
          setPaymentIntentId(result.paymentIntentId);
        } else {
          console.error('Failed to create Payment Intent');
          setCurrentStep('error');
          setErrorMessage('Failed to initialize payment. Please try again.');
        }
      });
    }
  }, [isOpen, selectedPackage]);

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    setCurrentStep('processing');

    if (paymentIntentId) {
      const verified = await verifyAndCredit(paymentIntentId);

      if (verified) {
        setCurrentStep('success');

        // Auto-close after 2 seconds
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setCurrentStep('error');
        setErrorMessage('Payment verification failed. Please contact support.');
      }
    } else {
      setCurrentStep('error');
      setErrorMessage('Payment Intent ID missing');
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setCurrentStep('error');
    setErrorMessage(error);
  };

  // Handle processing step
  const handleProcessing = () => {
    setCurrentStep('processing');
  };

  // Retry after error
  const handleRetry = () => {
    setCurrentStep('input');
    setErrorMessage('');

    if (selectedPackage) {
      initiatePayment(selectedPackage).then((result) => {
        if (result) {
          setClientSecret(result.clientSecret);
          setPaymentIntentId(result.paymentIntentId);
        }
      });
    }
  };

  if (!isOpen || !selectedPackage) {
    return null;
  }

  // Stripe Elements options
  const elementsOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#9333ea', // Purple-600
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '8px',
      },
    },
  } : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('wallet.stripeCheckout')}
              </h2>
              <p className="text-sm text-gray-500">
                {t('wallet.securePayment')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={currentStep === 'processing'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Input Step */}
          {currentStep === 'input' && clientSecret && stripePromise && (
            <Elements key={clientSecret} stripe={stripePromise} options={elementsOptions}>
              <StripePaymentForm
                selectedPackage={selectedPackage}
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onProcessing={handleProcessing}
              />
            </Elements>
          )}

          {/* Loading Payment Intent */}
          {currentStep === 'input' && !clientSecret && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-12 w-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">{t('common.loading')}</p>
            </div>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-16 w-16 text-purple-600 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('wallet.processingPayment')}
              </h3>
              <p className="text-gray-600 text-center">
                {t('wallet.pleaseWait')}
              </p>
            </div>
          )}

          {/* Success Step */}
          {currentStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t('wallet.paymentSuccessful')}
              </h3>
              <p className="text-gray-600 text-center">
                {selectedPackage.token_amount} TMT {t('wallet.tokensAdded')}
              </p>
            </div>
          )}

          {/* Error Step */}
          {currentStep === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t('wallet.paymentFailed')}
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {errorMessage || t('wallet.paymentError')}
              </p>
              <button
                onClick={handleRetry}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {t('common.tryAgain')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
