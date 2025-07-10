import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export const createPaymentIntent = async (packageId: string, currency: 'gbp' | 'xaf') => {
  console.log('createPaymentIntent called with:', { packageId, currency });
  
  // Get the current user's session to extract the access token
  const { data } = await supabase.auth.getSession();
  const access_token = data.session?.access_token;
  
  if (!access_token) {
    console.error('No access token available');
    throw new Error('User is not authenticated.');
  }
  
  console.log('Access token available:', access_token.substring(0, 20) + '...');
  
  const requestBody = { packageId, currency };
  console.log('Request body:', requestBody);

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    },
    body: JSON.stringify(requestBody),
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Response error text:', errorText);
    
    let error;
    try {
      error = JSON.parse(errorText);
    } catch (e) {
      error = { error: errorText };
    }
    
    console.error('Parsed error:', error);
    throw new Error(error.error || 'Failed to create payment intent');
  }

  const result = await response.json();
  console.log('Payment intent created successfully:', result);
  return result;
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