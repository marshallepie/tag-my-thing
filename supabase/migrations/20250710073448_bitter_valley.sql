/*
  # Update Token Packages for New Payment Flow

  1. Updates
    - Update token packages to match the new payment flow requirements
    - Starter Pack: 100 TMT tokens for £1 / 500 XAF
    - Value Pack: 275 TMT tokens for £2.50 / 1,250 XAF  
    - Power Pack: 575 TMT tokens for £4.50 / 2,250 XAF
    - Mega Pack: 1200 TMT tokens for £7.99 / 4,000 XAF

  2. Changes
    - Set bonus_tokens to 0 (total tokens now in token_amount)
    - Update token_amount to include previous bonus amounts
    - Keep existing price_gbp and price_xaf values
*/

-- Update existing token packages with new token amounts
UPDATE token_packages SET 
  token_amount = CASE name
    WHEN 'Starter Pack' THEN 100
    WHEN 'Value Pack' THEN 275
    WHEN 'Power Pack' THEN 575
    WHEN 'Mega Pack' THEN 1200
  END,
  bonus_tokens = 0,
  updated_at = now()
WHERE name IN ('Starter Pack', 'Value Pack', 'Power Pack', 'Mega Pack');

-- Ensure all packages are active
UPDATE token_packages SET 
  active = true,
  updated_at = now()
WHERE name IN ('Starter Pack', 'Value Pack', 'Power Pack', 'Mega Pack');

-- Verify the updates with a comment
COMMENT ON TABLE token_packages IS 'Updated 2025-01-10: Token packages now show total tokens in token_amount field, bonus_tokens set to 0';

-- Insert packages if they don't exist (fallback)
INSERT INTO token_packages (name, token_amount, bonus_tokens, price_gbp, price_xaf, active)
VALUES 
  ('Starter Pack', 100, 0, 1.00, 500, true),
  ('Value Pack', 275, 0, 2.50, 1250, true),
  ('Power Pack', 575, 0, 4.50, 2250, true),
  ('Mega Pack', 1200, 0, 7.99, 4000, true)
ON CONFLICT (name) DO UPDATE SET
  token_amount = EXCLUDED.token_amount,
  bonus_tokens = EXCLUDED.bonus_tokens,
  price_gbp = EXCLUDED.price_gbp,
  price_xaf = EXCLUDED.price_xaf,
  active = EXCLUDED.active,
  updated_at = now();