-- Fix: Create wallets for the 10 specific users missing wallet records
-- Run this in Supabase SQL Editor

-- Insert wallets for the 10 users
INSERT INTO user_wallets (user_id, balance, created_at, updated_at)
VALUES
  ('146f3db3-d713-4796-82c8-c37db3f926bc', 50, NOW(), NOW()),
  ('7467e393-127a-45ab-9de8-948763072f56', 50, NOW(), NOW()),
  ('b00b0774-1245-4870-b4ed-ac3a1b66930c', 50, NOW(), NOW()),
  ('45be8a9d-d35c-483a-a376-c11a5f4e2904', 50, NOW(), NOW()),
  ('2af8b15f-8f9b-4d63-84fd-2f3047f86135', 50, NOW(), NOW()),
  ('b7595403-5b3e-4ea9-a190-814bd50bfaa4', 50, NOW(), NOW()),
  ('451f5675-6e76-4ace-adc2-50ecb0a241f8', 50, NOW(), NOW()),
  ('22b4e6f1-52f5-452d-92bb-81fd811ebd73', 50, NOW(), NOW()),
  ('f197a5b0-5d15-4995-acd2-042d713518a6', 50, NOW(), NOW()),
  ('4319adfc-252e-46ff-8d29-11a4d02ab468', 50, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Create transaction records for these wallets
INSERT INTO token_transactions (user_id, amount, type, source, description)
VALUES
  ('146f3db3-d713-4796-82c8-c37db3f926bc', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively'),
  ('7467e393-127a-45ab-9de8-948763072f56', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively'),
  ('b00b0774-1245-4870-b4ed-ac3a1b66930c', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively'),
  ('45be8a9d-d35c-483a-a376-c11a5f4e2904', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively'),
  ('2af8b15f-8f9b-4d63-84fd-2f3047f86135', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively'),
  ('b7595403-5b3e-4ea9-a190-814bd50bfaa4', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively'),
  ('451f5675-6e76-4ace-adc2-50ecb0a241f8', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively'),
  ('22b4e6f1-52f5-452d-92bb-81fd811ebd73', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively'),
  ('f197a5b0-5d15-4995-acd2-042d713518a6', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively'),
  ('4319adfc-252e-46ff-8d29-11a4d02ab468', 50, 'earned', 'signup', 'Welcome bonus - wallet created retroactively')
ON CONFLICT DO NOTHING;

-- Verify the fix
SELECT COUNT(*) as wallets_created 
FROM user_wallets 
WHERE user_id IN (
  '146f3db3-d713-4796-82c8-c37db3f926bc',
  '7467e393-127a-45ab-9de8-948763072f56',
  'b00b0774-1245-4870-b4ed-ac3a1b66930c',
  '45be8a9d-d35c-483a-a376-c11a5f4e2904',
  '2af8b15f-8f9b-4d63-84fd-2f3047f86135',
  'b7595403-5b3e-4ea9-a190-814bd50bfaa4',
  '451f5675-6e76-4ace-adc2-50ecb0a241f8',
  '22b4e6f1-52f5-452d-92bb-81fd811ebd73',
  'f197a5b0-5d15-4995-acd2-042d713518a6',
  '4319adfc-252e-46ff-8d29-11a4d02ab468'
);
