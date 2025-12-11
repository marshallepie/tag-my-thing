-- Update payment_transactions table to support Paystack
-- Adds Paystack as a valid payment provider and adds Paystack-specific fields

-- Add Paystack to the payment_provider enum
ALTER TABLE public.payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_payment_provider_check;

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_payment_provider_check
  CHECK (payment_provider IN ('stripe', 'flutterwave', 'paystack'));

-- Add Paystack-specific columns
ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS paystack_reference TEXT,
  ADD COLUMN IF NOT EXISTS paystack_access_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_authorization_code TEXT;

-- Add index for Paystack reference lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_paystack_reference
  ON public.payment_transactions(paystack_reference)
  WHERE paystack_reference IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.payment_transactions.paystack_reference IS 'Paystack transaction reference for webhook verification';
COMMENT ON COLUMN public.payment_transactions.paystack_access_code IS 'Paystack access code for payment initialization';
COMMENT ON COLUMN public.payment_transactions.paystack_authorization_code IS 'Paystack authorization code for card tokenization';
