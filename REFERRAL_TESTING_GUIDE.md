# Referral System Testing Guide

## Current Issue
The referral system is calculating reward amounts correctly but not creating reward records in the database. This indicates an issue with the `process_referral_rewards` function.

## Step 1: Apply the Fix Migration

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- The content from supabase/migrations/20250706160000_fix_referral_rewards.sql
```

## Step 2: Test the Fix

After applying the migration, run these tests:

### Test 1: Check Current State
```sql
SELECT * FROM debug_referral_chain('sophie@marshallepie.com');
```

### Test 2: Manual Trigger Processing
```sql
SELECT trigger_referral_processing('sophie@marshallepie.com');
```

### Test 3: Comprehensive System Test
```sql
SELECT * FROM test_referral_system('sophie@marshallepie.com');
```

### Test 4: Verify Results
```sql
SELECT * FROM debug_referral_chain('sophie@marshallepie.com');
```

## Expected Results

After running the manual trigger, you should see:
- `reward_status` changes from "not_created" to "paid"
- New records in `referral_rewards` table
- Updated wallet balance for the referrer
- New transaction records

## Debugging Steps

If the issue persists:

1. **Check referral_settings table:**
```sql
SELECT * FROM referral_settings WHERE active = true ORDER BY referral_level;
```

2. **Check referrals table:**
```sql
SELECT r.*, 
       referrer.email as referrer_email,
       referred.email as referred_email
FROM referrals r
JOIN user_profiles referrer ON referrer.id = r.referrer_id
JOIN user_profiles referred ON referred.id = r.referred_id
WHERE referred.email = 'sophie@marshallepie.com';
```

3. **Check for existing rewards:**
```sql
SELECT * FROM referral_rewards 
WHERE referred_id = (SELECT id FROM user_profiles WHERE email = 'sophie@marshallepie.com');
```

## Common Issues and Solutions

### Issue 1: Column Name Mismatch
**Symptom:** Function errors about unknown columns
**Solution:** The migration fixes column name inconsistencies

### Issue 2: Missing Referral Settings
**Symptom:** reward_amount shows 0
**Solution:** The migration ensures referral_settings are properly populated

### Issue 3: Duplicate Prevention
**Symptom:** Rewards not created on subsequent runs
**Solution:** The function checks for existing rewards to prevent duplicates

### Issue 4: Transaction Failures
**Symptom:** Partial reward creation
**Solution:** The updated function has better error handling and logging

## Manual Reward Creation (Emergency Fix)

If the automatic processing still fails, you can manually create rewards:

```sql
-- Replace these values with actual IDs from your database
INSERT INTO referral_rewards (
  referral_id,
  referrer_id,
  referred_id,
  referral_level,
  token_amount,
  status,
  paid_at
) VALUES (
  (SELECT id FROM referrals WHERE referred_id = (SELECT id FROM user_profiles WHERE email = 'sophie@marshallepie.com')),
  (SELECT referrer_id FROM referrals WHERE referred_id = (SELECT id FROM user_profiles WHERE email = 'sophie@marshallepie.com')),
  (SELECT id FROM user_profiles WHERE email = 'sophie@marshallepie.com'),
  1,
  50,
  'paid',
  now()
);

-- Update wallet balance
UPDATE user_wallets 
SET balance = balance + 50
WHERE user_id = (
  SELECT referrer_id FROM referrals 
  WHERE referred_id = (SELECT id FROM user_profiles WHERE email = 'sophie@marshallepie.com')
);

-- Create transaction record
INSERT INTO token_transactions (
  user_id,
  amount,
  type,
  source,
  description
) VALUES (
  (SELECT referrer_id FROM referrals WHERE referred_id = (SELECT id FROM user_profiles WHERE email = 'sophie@marshallepie.com')),
  50,
  'earned',
  'referral',
  'Level 1 referral reward for sophie@marshallepie.com'
);
```

## Next Steps

1. Apply the migration
2. Run the test functions
3. Verify the results
4. Test the frontend referral flow
5. Monitor for any remaining issues

The updated function includes detailed logging (RAISE NOTICE statements) that will help identify exactly where the process is failing if issues persist.