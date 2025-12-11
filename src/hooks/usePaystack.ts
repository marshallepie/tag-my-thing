import { useState, useCallback } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useTokens } from './useTokens';
import toast from 'react-hot-toast';

export interface TokenPackage {
  id: string;
  tokens: number;
  price: number;
  currency: string;
  popular?: boolean;
  savings?: string;
}

export interface PaystackConfig {
  reference: string;
  email: string;
  amount: number; // in kobo (NGN) or lowest currency unit
  publicKey: string;
  currency?: string;
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string | number;
    }>;
  };
}

interface UsePaystackPaymentReturn {
  initiatePayment: (packageInfo: TokenPackage) => void;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const usePaystackPayment = (): UsePaystackPaymentReturn => {
  const { user, profile } = useAuth();
  const { refreshWallet } = useTokens();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

  // Generate unique transaction reference
  const generateReference = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TMT-${timestamp}-${random}`;
  }, []);

  // Convert amount to kobo (or lowest currency unit)
  const convertToLowestUnit = (amount: number, currency: string): number => {
    // Paystack requires amounts in the lowest currency unit (kobo for NGN, pesewas for GHS, etc.)
    return Math.round(amount * 100);
  };

  // Create payment transaction record in database
  const createPaymentTransaction = async (
    reference: string,
    packageInfo: TokenPackage
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('payment_transactions').insert({
        user_id: user.id,
        transaction_reference: reference,
        payment_provider: 'paystack',
        amount: packageInfo.price,
        currency: packageInfo.currency,
        tokens_purchased: packageInfo.tokens,
        status: 'pending',
        paystack_reference: reference,
        metadata: {
          package_id: packageInfo.id,
          customer_email: user.email,
          customer_name: profile?.full_name || user.email,
        },
      });

      if (error) {
        console.error('Error creating payment transaction:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error creating payment transaction:', err);
      return false;
    }
  };

  // Verify payment on the server side
  const verifyPayment = async (reference: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Call edge function to verify payment
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: {
          reference,
        },
      });

      if (error) {
        console.error('Payment verification error:', error);
        setError('Payment verification failed. Please contact support.');
        toast.error('Payment verification failed');
        return false;
      }

      if (data?.success) {
        setSuccess(true);
        toast.success(`Payment successful! ${data.tokens_credited} TMT tokens added to your wallet.`);

        // Refresh wallet to show new balance
        await refreshWallet();
        return true;
      } else {
        setError(data?.message || 'Payment verification failed');
        toast.error(data?.message || 'Payment verification failed');
        return false;
      }
    } catch (err: any) {
      console.error('Unexpected error verifying payment:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle successful payment callback
  const handlePaymentCallback = useCallback(
    async (response: any) => {
      console.log('Paystack payment response:', response);

      if (response.status === 'success') {
        setLoading(true);

        // Verify payment on server
        const verified = await verifyPayment(response.reference);

        if (verified) {
          console.log('Payment verified and tokens credited');
        } else {
          console.error('Payment verification failed');
        }
      } else {
        toast.error('Payment was not completed');
        setError('Payment was not completed');

        // Update transaction status to cancelled
        try {
          await supabase
            .from('payment_transactions')
            .update({ status: 'cancelled' })
            .eq('paystack_reference', response.reference);
        } catch (err) {
          console.error('Error updating cancelled transaction:', err);
        }
      }

      setLoading(false);
    },
    [verifyPayment]
  );

  // Handle payment close (user closes modal without completing)
  const handleClose = useCallback(() => {
    console.log('Payment modal closed');
    if (!success) {
      toast.info('Payment was cancelled');
    }
  }, [success]);

  // Initialize Paystack payment
  const initiatePayment = useCallback(
    async (packageInfo: TokenPackage) => {
      if (!user || !profile) {
        toast.error('Please log in to purchase tokens');
        return;
      }

      if (!publicKey) {
        toast.error('Payment system not configured. Please contact support.');
        console.error('Paystack public key not found');
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        // Generate transaction reference
        const reference = generateReference();

        // Create payment transaction record
        const created = await createPaymentTransaction(reference, packageInfo);
        if (!created) {
          toast.error('Failed to initialize payment');
          setLoading(false);
          return;
        }

        // Configure Paystack
        const config: PaystackConfig = {
          reference,
          email: user.email || '',
          amount: convertToLowestUnit(packageInfo.price, packageInfo.currency),
          publicKey,
          currency: packageInfo.currency,
          metadata: {
            custom_fields: [
              {
                display_name: 'Package',
                variable_name: 'package_id',
                value: packageInfo.id,
              },
              {
                display_name: 'Tokens',
                variable_name: 'tokens',
                value: packageInfo.tokens,
              },
              {
                display_name: 'Customer Name',
                variable_name: 'customer_name',
                value: profile.full_name || user.email || 'TagMyThing User',
              },
            ],
          },
        };

        // Use Paystack hook to handle payment
        const initializePayment = usePaystackPayment(config);

        initializePayment(handlePaymentCallback, handleClose);

      } catch (err: any) {
        console.error('Error initiating payment:', err);
        setError(err.message || 'Failed to initiate payment');
        toast.error('Failed to initiate payment');
      } finally {
        setLoading(false);
      }
    },
    [user, profile, publicKey, generateReference, createPaymentTransaction, handlePaymentCallback, handleClose]
  );

  return {
    initiatePayment,
    loading,
    error,
    success,
  };
};

// Default token packages (can be customized)
export const DEFAULT_TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    tokens: 10,
    price: 5.00,
    currency: 'USD',
  },
  {
    id: 'popular',
    tokens: 50,
    price: 20.00,
    currency: 'USD',
    popular: true,
    savings: 'Save 20%',
  },
  {
    id: 'value',
    tokens: 100,
    price: 35.00,
    currency: 'USD',
    savings: 'Save 30%',
  },
  {
    id: 'premium',
    tokens: 500,
    price: 150.00,
    currency: 'USD',
    savings: 'Save 40%',
  },
];

// Currency-specific packages
export const getTokenPackagesByCurrency = (currency: string): TokenPackage[] => {
  const conversionRates: Record<string, number> = {
    USD: 1,
    NGN: 1500,   // Nigerian Naira (Paystack's primary market)
    GHS: 15,     // Ghanaian Cedi
    KES: 160,    // Kenyan Shilling
    ZAR: 20,     // South African Rand
    XOF: 650,    // West African CFA Franc
  };

  const rate = conversionRates[currency] || 1;

  return DEFAULT_TOKEN_PACKAGES.map(pkg => ({
    ...pkg,
    price: Math.round(pkg.price * rate * 100) / 100,
    currency,
  }));
};
