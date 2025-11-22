-- Check these specific 10 users
SELECT 
  up.id,
  up.email,
  uw.id as wallet_id,
  uw.balance,
  CASE 
    WHEN uw.id IS NULL THEN 'MISSING WALLET'
    ELSE 'HAS WALLET'
  END as status
FROM user_profiles up
LEFT JOIN user_wallets uw ON up.id = uw.user_id
WHERE up.id IN (
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
)
ORDER BY up.email;
