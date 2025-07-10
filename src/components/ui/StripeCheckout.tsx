import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { stripePromise } from '../../lib/stripe';
import { Button } from './Button';
import { Card } from './Card';

interface CheckoutFormProps {
  clientSecret: string;
  paymentIntentId: string;
  packageName: string;
  amount: string;
  currency: string;
  totalTokens: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  clientSecret,
  paymentIntentId,
  packageName,
  amount,
  currency,
  totalTokens,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isElementsReady, setIsElementsReady] = useState(false);

  // Check if elements are ready
  useEffect(() => {
    if (elements) {
      const paymentElement = elements.getElement('payment');
      if (paymentElement) {
        // Listen for the ready event
        paymentElement.on('ready', () => {
          setIsElementsReady(true);
        });
      }
    }
  }, [elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!stripe || !elements) {
      console.log('Stripe or Elements not ready');
      return;
    }

    // Double-check that elements are ready before proceeding
    if (!isElementsReady) {
      console.log('Elements not ready yet');
      setMessage('Payment form is still loading. Please wait...');
      return;
    }
    setLoading(true);
    setMessage(null);

    console.log('Starting payment confirmation...');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/wallet?payment_success=true`,
      },
      redirect: 'if_required',
    });

    if (error) {
      console.error('Payment error:', error);
      setMessage(error.message || 'An unexpected error occurred.');
      onError(error.message || 'Payment failed');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      console.log('Payment succeeded:', paymentIntent);
      // Pass the entire paymentIntent object to onSuccess
      onSuccess(paymentIntent);
    }

    setLoading(false);
  };

  // Calculate if the form should be disabled
  const isFormDisabled = !stripe || !elements || loading || !isElementsReady;
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Package Summary */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-primary-900">{packageName}</h3>
          <span className="text-xl font-bold text-primary-600">{amount}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-primary-700">
          <span>Total Tokens:</span>
          <span className="font-medium">{totalTokens} TMT</span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
        
        {/* Loading indicator while elements are initializing */}
        {!isElementsReady && (
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
            <span className="text-gray-600">Loading payment form...</span>
          </div>
        )}
        
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
          onReady={() => {
            console.log('PaymentElement is ready');
            setIsElementsReady(true);
          }}
          onLoadError={(error) => {
            console.error('PaymentElement load error:', error);
            setMessage('Failed to load payment form. Please refresh and try again.');
          }}
        />
      </div>

      {/* Error Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 p-3 bg-error-50 border border-error-200 rounded-lg"
        >
          <AlertCircle className="h-4 w-4 text-error-600 flex-shrink-0" />
          <span className="text-sm text-error-700">{message}</span>
        </motion.div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isFormDisabled}
        loading={loading}
        className="w-full"
        size="lg"
      >
        <CreditCard className="h-5 w-5 mr-2" />
        {loading 
          ? 'Processing...' 
          : !isElementsReady 
            ? 'Loading...' 
            : `Pay ${amount}`
        }
      </Button>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Stripe ready: {stripe ? '✅' : '❌'}</div>
          <div>Elements ready: {elements ? '✅' : '❌'}</div>
          <div>Payment form ready: {isElementsReady ? '✅' : '❌'}</div>
          <div>Loading: {loading ? '✅' : '❌'}</div>
        </div>
      )}
      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        <p>Powered by Stripe. Your payment information is secure and never stored on our servers.</p>
      </div>
    </form>
  );
};

interface StripeCheckoutProps {
  clientSecret: string;
  paymentIntentId: string;
  packageName: string;
  amount: string;
  currency: string;
  totalTokens: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  clientSecret,
  paymentIntentId,
  packageName,
  amount,
  currency,
  totalTokens,
  onSuccess,
  onError,
  onCancel,
}) => {
  console.log("clientSecret in StripeCheckout:", clientSecret);

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Purchase</h2>
          <p className="text-gray-600">Secure payment powered by Stripe</p>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            clientSecret={clientSecret}
            paymentIntentId={paymentIntentId}
            packageName={packageName}
            amount={amount}
            currency={currency}
            totalTokens={totalTokens}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel Payment
          </Button>
        </div>
      </Card>
    </div>
  );
};