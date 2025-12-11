import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export interface MTNMomoTransaction {
  id: string;
  user_id: string;
  reference_id: string;
  mtn_transaction_id: string | null;
  phone_number: string;
  amount: number;
  currency: string;
  tmt_tokens_amount: number;
  status: 'pending' | 'processing' | 'successful' | 'failed' | 'cancelled' | 'timeout';
  payment_url: string | null;
  error_message: string | null;
  callback_data: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export interface TokenPackage {
  id: string;
  name: string;
  tmtTokens: number;
  priceXAF: number;
  savingsPercent?: number;
  popular?: boolean;
}

// Predefined token packages with pricing in XAF (Central African Franc)
export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    tmtTokens: 100,
    priceXAF: 1000, // ~$1.60 USD
  },
  {
    id: 'basic',
    name: 'Basic',
    tmtTokens: 500,
    priceXAF: 4500, // ~$7.20 USD (10% savings)
    savingsPercent: 10,
  },
  {
    id: 'popular',
    name: 'Popular',
    tmtTokens: 1000,
    priceXAF: 8000, // ~$12.80 USD (20% savings)
    savingsPercent: 20,
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    tmtTokens: 2500,
    priceXAF: 18750, // ~$30 USD (25% savings)
    savingsPercent: 25,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tmtTokens: 5000,
    priceXAF: 35000, // ~$56 USD (30% savings)
    savingsPercent: 30,
  },
];

export function useMTNMomo() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<MTNMomoTransaction | null>(null);

  /**
   * Validate MTN Cameroon phone number format
   * Must be in format: 237XXXXXXXXX (237 country code + 9 digits)
   */
  const validatePhoneNumber = useCallback((phoneNumber: string): boolean => {
    // Remove spaces and special characters
    const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

    // Check format: must start with 237 and have 9 more digits
    const regex = /^237\d{9}$/;
    return regex.test(cleaned);
  }, []);

  /**
   * Format phone number to MTN MOMO format (237XXXXXXXXX)
   */
  const formatPhoneNumber = useCallback((phoneNumber: string): string => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If starts with 237, return as is
    if (cleaned.startsWith('237') && cleaned.length === 12) {
      return cleaned;
    }

    // If starts with 6 or 7 (Cameroon mobile), add 237 prefix
    if ((cleaned.startsWith('6') || cleaned.startsWith('7')) && cleaned.length === 9) {
      return `237${cleaned}`;
    }

    return cleaned;
  }, []);

  /**
   * Initiate MTN MOMO payment request
   */
  const requestPayment = useCallback(
    async (phoneNumber: string, packageId: string): Promise<MTNMomoTransaction | null> => {
      setIsLoading(true);

      try {
        // Find selected package
        const selectedPackage = TOKEN_PACKAGES.find((pkg) => pkg.id === packageId);
        if (!selectedPackage) {
          toast.error('Invalid token package selected');
          return null;
        }

        // Format and validate phone number
        const formattedPhone = formatPhoneNumber(phoneNumber);
        if (!validatePhoneNumber(formattedPhone)) {
          toast.error('Invalid phone number. Must be a valid Cameroon MTN number.');
          return null;
        }

        // Get auth session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          toast.error('You must be logged in to purchase tokens');
          return null;
        }

        // Call Edge Function to request payment
        const { data, error } = await supabase.functions.invoke('mtn-momo-request-payment', {
          body: {
            amount: selectedPackage.priceXAF,
            phoneNumber: formattedPhone,
            tmtTokensAmount: selectedPackage.tmtTokens,
          },
        });

        if (error) {
          console.error('Payment request error:', error);
          toast.error(error.message || 'Failed to initiate payment');
          return null;
        }

        if (!data.success) {
          toast.error(data.error || 'Failed to initiate payment');
          return null;
        }

        const transaction = data.transaction as MTNMomoTransaction;
        setCurrentTransaction(transaction);

        toast.success('Payment request sent! Check your phone to approve.');
        return transaction;
      } catch (error: any) {
        console.error('MTN MOMO request error:', error);
        toast.error('Failed to initiate payment. Please try again.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [formatPhoneNumber, validatePhoneNumber]
  );

  /**
   * Verify payment status
   */
  const verifyPayment = useCallback(async (referenceId: string): Promise<MTNMomoTransaction | null> => {
    setIsLoading(true);

    try {
      // Get auth session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast.error('You must be logged in');
        return null;
      }

      // Call Edge Function to verify payment
      const { data, error } = await supabase.functions.invoke('mtn-momo-verify-payment', {
        body: { referenceId },
      });

      if (error) {
        console.error('Payment verification error:', error);
        toast.error(error.message || 'Failed to verify payment');
        return null;
      }

      const transaction = data.transaction as MTNMomoTransaction;
      setCurrentTransaction(transaction);

      // Show appropriate message based on status
      if (data.status === 'successful') {
        toast.success('Payment confirmed! Tokens credited to your account.');
      } else if (data.status === 'failed') {
        toast.error('Payment failed. Please try again.');
      } else if (data.status === 'pending') {
        // Don't show toast for pending status during polling
      }

      return transaction;
    } catch (error: any) {
      console.error('MTN MOMO verification error:', error);
      toast.error('Failed to verify payment. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get user's MTN MOMO transaction history
   */
  const getTransactionHistory = useCallback(async (): Promise<MTNMomoTransaction[]> => {
    try {
      const { data, error } = await supabase
        .from('mtn_momo_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transaction history:', error);
        return [];
      }

      return (data as MTNMomoTransaction[]) || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }, []);

  /**
   * Get a specific transaction by reference ID
   */
  const getTransaction = useCallback(async (referenceId: string): Promise<MTNMomoTransaction | null> => {
    try {
      const { data, error } = await supabase
        .from('mtn_momo_transactions')
        .select('*')
        .eq('reference_id', referenceId)
        .single();

      if (error) {
        console.error('Error fetching transaction:', error);
        return null;
      }

      return data as MTNMomoTransaction;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }, []);

  return {
    isLoading,
    currentTransaction,
    requestPayment,
    verifyPayment,
    getTransactionHistory,
    getTransaction,
    validatePhoneNumber,
    formatPhoneNumber,
    tokenPackages: TOKEN_PACKAGES,
  };
}
