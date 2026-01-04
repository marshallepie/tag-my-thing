// Currency conversion rates (fixed rates for display purposes)
export const CURRENCY_RATES = {
  XAF_RATE: 750,  // 1 GBP = 750 XAF (approximate)
  NGN_RATE: 1500, // 1 GBP = 1500 NGN (approximate)
} as const;

// Token and Subscription packages
export const TOKEN_PACKAGES = [
  {
    id: 'starter',
    name: 'starter',
    token_amount: 100,
    price_gbp: 1.00,
    price_xaf: Math.round(1.00 * CURRENCY_RATES.XAF_RATE),
    price_ngn: Math.round(1.00 * CURRENCY_RATES.NGN_RATE),
  },
  {
    id: 'power',
    name: 'power',
    token_amount: 500,
    price_gbp: 4.50,
    price_xaf: Math.round(4.50 * CURRENCY_RATES.XAF_RATE),
    price_ngn: Math.round(4.50 * CURRENCY_RATES.NGN_RATE),
  },
  {
    id: 'mega',
    name: 'mega',
    token_amount: 5000,
    price_gbp: 39.99,
    price_xaf: Math.round(39.99 * CURRENCY_RATES.XAF_RATE),
    price_ngn: Math.round(39.99 * CURRENCY_RATES.NGN_RATE),
  },
  {
    id: 'pro_business',
    name: 'Pro Business Subscription',
    token_amount: 1000, // Monthly token allocation
    price_gbp: 8.00,
    price_xaf: Math.round(8.00 * CURRENCY_RATES.XAF_RATE),
    price_ngn: Math.round(8.00 * CURRENCY_RATES.NGN_RATE),
  },
  {
    id: 'enterprise',
    name: 'Enterprise Subscription',
    token_amount: 10000, // Monthly token allocation
    price_gbp: 40.00,
    price_xaf: Math.round(40.00 * CURRENCY_RATES.XAF_RATE),
    price_ngn: Math.round(40.00 * CURRENCY_RATES.NGN_RATE),
  },
] as const; 