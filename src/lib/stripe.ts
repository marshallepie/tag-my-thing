import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const createPaymentIntent = async (packageId: string, currency: 'gbp' | 'xaf') => {
  // Get the current user's session to extract the access token
  const { data } = await supabase.auth.getSession();
  const access_token = data.session?.access_token;
  
  if (!access_token) {
    throw new Error('User is not authenticated.');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify({ packageId, currency }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment intent');
  }

  return response.json();
};

export const confirmPayment = async (paymentIntentId: string) => {
  // Get the current user's session to extract the access token
  const { data } = await supabase.auth.getSession();
  const access_token = data.session?.access_token;
  
  if (!access_token) {
    throw new Error('User is not authenticated.');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify({ paymentIntentId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to confirm payment');
  }

  return response.json();
};