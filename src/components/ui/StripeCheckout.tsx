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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/wallet?payment_success=true`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An unexpected error occurred.');
      onError(error.message || 'Payment failed');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Pass the entire paymentIntent object to onSuccess
      onSuccess(paymentIntent);
    }

    setLoading(false);
  };

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
        
        <PaymentElement 
          options={{
            layout: 'tabs',
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
        disabled={!stripe || loading}
        loading={loading}
        className="w-full"
        size="lg"
      >
        <CreditCard className="h-5 w-5 mr-2" />
        {loading ? 'Processing...' : `Pay ${amount}`}
      </Button>

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