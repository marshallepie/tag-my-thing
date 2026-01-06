import { useState, useCallback } from 'react';
import { loadStripe, Stripe, PaymentIntent } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useTokens } from './useTokens';
import toast from 'react-hot-toast';

export interface TokenPackage {
  id: string;
  token_amount: number;
  price_gbp: number;
  name: string;
}

interface UseStripePaymentReturn {
  initiatePayment: (packageInfo: TokenPackage) => Promise<{clientSecret: string; paymentIntentId: string} | null>;
  confirmPayment: (stripe: Stripe, clientSecret: string) => Promise<PaymentIntent | null>;
  verifyAndCredit: (paymentIntentId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useStripePayment = (): UseStripePaymentReturn => {
  const { user, profile } = useAuth();
  const { refreshWallet } = useTokens();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

  // Initiate payment by creating Payment Intent
  const initiatePayment = useCallback(async (packageInfo: TokenPackage) => {
    if (!user || !profile) {
      toast.error('Please log in to purchase tokens');
      return null;
    }

    if (!publishableKey) {
      toast.error('Payment system not configured. Please contact support.');
      console.error('Stripe publishable key not found');
      return null;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Call edge function to create Payment Intent
      const { data, error: invokeError } = await supabase.functions.invoke(
        'create-stripe-payment-intent',
        {
          body: {
            packageId: packageInfo.id,
          },
        }
      );

      if (invokeError) {
        console.error('Error creating Payment Intent:', invokeError);
        setError(invokeError.message || 'Failed to initialize payment');
        toast.error(`Failed to initialize payment: ${data?.error || invokeError.message || 'Unknown error'}`);
        setLoading(false);
        return null;
      }

      if (!data.client_secret) {
        setError('No client secret returned');
        toast.error('Payment initialization failed');
        setLoading(false);
        return null;
      }

      return {
        clientSecret: data.client_secret,
        paymentIntentId: data.payment_intent_id,
      };
    } catch (err: any) {
      console.error('Unexpected error creating Payment Intent:', err);
      setError(err.message || 'Failed to initialize payment');
      toast.error('Failed to initialize payment');
      setLoading(false);
      return null;
    }
  }, [user, profile, publishableKey]);

  // Confirm payment with Stripe.js
  const confirmPayment = useCallback(async (stripe: Stripe, clientSecret: string) => {
    setLoading(true);
    setError(null);

    try {
      // Confirm the payment (Stripe handles 3D Secure automatically)
      const { paymentIntent, error: confirmError } = await stripe.confirmPayment({
        clientSecret,
        redirect: 'if_required', // Stay in app unless required for 3D Secure
        confirmParams: {
          return_url: window.location.origin + '/wallet',
        },
      });

      if (confirmError) {
        console.error('Payment confirmation error:', confirmError);
        setError(confirmError.message || 'Payment failed');
        toast.error(confirmError.message || 'Payment failed');
        setLoading(false);
        return null;
      }

      if (!paymentIntent) {
        setError('Payment Intent not returned');
        setLoading(false);
        return null;
      }

      // Check payment status
      if (paymentIntent.status === 'succeeded') {
        return paymentIntent;
      } else if (paymentIntent.status === 'requires_action') {
        // 3D Secure or other action required
        toast.info('Additional authentication required');
        setLoading(false);
        return null;
      } else {
        setError(`Payment status: ${paymentIntent.status}`);
        toast.error(`Payment ${paymentIntent.status}`);
        setLoading(false);
        return null;
      }
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      setError(err.message || 'Payment failed');
      toast.error('Payment failed');
      setLoading(false);
      return null;
    }
  }, []);

  // Verify payment and wait for webhook to credit tokens
  const verifyAndCredit = useCallback(async (paymentIntentId: string) => {
    setLoading(true);

    try {
      // Poll the verify endpoint until webhook processes the payment
      // Webhook is the single source of truth for token crediting
      const maxAttempts = 10; // Max 10 attempts (5 seconds total)
      const pollInterval = 500; // 500ms between polls

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { data, error: verifyError } = await supabase.functions.invoke(
          'verify-stripe-payment',
          {
            body: {
              paymentIntentId,
            },
          }
        );

        if (verifyError) {
          console.error('Payment verification error:', verifyError);
          setError('Payment verification failed. Please contact support.');
          toast.error('Payment verification failed');
          setLoading(false);
          return false;
        }

        // Success - webhook has processed the payment
        if (data?.success) {
          setSuccess(true);
          const tokensCredited = data.tokens_credited;
          toast.success(`Payment successful! ${tokensCredited} TMT tokens added to your wallet.`);

          // Refresh wallet to show new balance
          await refreshWallet();
          setLoading(false);
          return true;
        }

        // Still pending - webhook hasn't processed yet
        if (data?.status === 'pending') {
          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        // Error status
        setError(data?.message || 'Payment verification failed');
        toast.error(data?.message || 'Payment verification failed');
        setLoading(false);
        return false;
      }

      // Timeout - webhook took too long
      setError('Payment processing is taking longer than expected. Your tokens will be credited shortly.');
      toast.error('Processing timeout. Please refresh in a moment.');
      setLoading(false);
      return false;

    } catch (err: any) {
      console.error('Unexpected error verifying payment:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
      setLoading(false);
      return false;
    }
  }, [refreshWallet]);

  return {
    initiatePayment,
    confirmPayment,
    verifyAndCredit,
    loading,
    error,
    success,
  };
};

// Helper function to load Stripe.js
export const getStripePromise = () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.error('Stripe publishable key not configured');
    return null;
  }
  return loadStripe(publishableKey);
};
