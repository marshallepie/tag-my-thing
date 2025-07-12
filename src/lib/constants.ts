// Currency conversion rates (fixed rates for display purposes)
export const CURRENCY_RATES = {
  XAF_RATE: 750, // 1 GBP = 750 XAF (approximate)
  NGN_RATE: 1500, // 1 GBP = 1500 NGN (approximate)
} as const;

// Token packages for the new Stripe Payment Link flow
export const TOKEN_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    token_amount: 100,
    price_gbp: 1.00,
    price_xaf: Math.round(1.00 * CURRENCY_RATES.XAF_RATE),
    price_ngn: Math.round(1.00 * CURRENCY_RATES.NGN_RATE),
    stripe_payment_link: 'https://buy.stripe.com/00w4gA4hJ8lm7mr9k1ak000'
  },
  {
    id: 'power',
    name: 'Power Pack', 
    token_amount: 500,
    price_gbp: 4.50,
    price_xaf: Math.round(4.50 * CURRENCY_RATES.XAF_RATE),
    price_ngn: Math.round(4.50 * CURRENCY_RATES.NGN_RATE),
    stripe_payment_link: 'https://buy.stripe.com/5kQ9AU8xZcBC4afdAhak001'
  },
] as const;