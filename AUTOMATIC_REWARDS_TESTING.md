# Automatic Referral Rewards Testing Guide

## Overview
This guide helps you test the automatic referral reward processing system that should trigger when users sign up with referral codes.

## Step 1: Apply the New Migration

Copy and paste the content from `supabase/migrations/20250707170000_fix_automatic_rewards.sql` into your Supabase SQL Editor and run it.

This migration adds:
- A more robust reward processing function (`process_referral_rewards_v2`)
- An automatic trigger that processes rewards when referrals are completed
- Better error handling and logging
- Test functions for debugging

## Step 2: Test the Complete Flow

### Test 1: Simulate the Full Signup Process
```sql
-- This simulates what happens when someone signs up with a referral code
SELECT test_referral_flow('marshallepie', 'newuser@test.com');
```

Expected result:
```json
{
  "success": true,
  "rewards_created": 1,
  "total_tokens": 50,
  "levels_processed": 1,
  "errors": [],
  "referral_id": "uuid-here",
  "referrer_id": "uuid-here", 
  "referred_id": "uuid-here"
}
```

### Test 2: Check the Referral Chain
```sql
SELECT * FROM debug_referral_chain('newuser@test.com');
```

Expected result should show `reward_status` as "paid".

### Test 3: Verify Wallet Balance
```sql
-- Check that the referrer's wallet was updated
SELECT up.email, uw.balance 
FROM user_profiles up
JOIN user_wallets uw ON up.id = uw.user_id
WHERE up.referral_code = 'marshallepie';
```

### Test 4: Check Transaction Records
```sql
-- Verify transaction was created
SELECT * FROM token_transactions 
WHERE source = 'referral' 
ORDER BY created_at DESC 
LIMIT 5;
```

## Step 3: Test Frontend Integration

1. **Create a test user in your app:**
   - Go to `/auth?ref=marshallepie`
   - Sign up with a new email
   - Check browser console for logs

2. **Expected behavior:**
   - Referral code should be detected
   - User signup should complete successfully
   - Referral processing should happen automatically
   - Rewards should be created within 2-3 seconds

3. **Check results:**
   - Run the debug query to verify rewards were created
   - Check the influencer dashboard for updated stats

## Step 4: Debug Issues

If rewards are still not being created automatically:

### Check 1: Verify Trigger is Working
```sql
-- Check if the trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'referral_completion_trigger';
```

### Check 2: Manual Processing
```sql
-- Manually process rewards for a specific user
SELECT manual_process_rewards('your-test-email@example.com');
```

### Check 3: Check for Errors
```sql
-- Look for any error patterns in the logs
SELECT * FROM referral_rewards 
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

## Step 5: Production Testing

1. **Test with real signup flow:**
   - Use the actual `/auth?ref=marshallepie` URL
   - Complete the full signup process
   - Monitor the database for automatic reward creation

2. **Monitor performance:**
   - Check that rewards are created within 5 seconds of signup
   - Verify no duplicate rewards are created
   - Ensure wallet balances are updated correctly

## Common Issues and Solutions

### Issue 1: Trigger Not Firing
**Symptom:** Referrals are created but rewards are not processed
**Solution:** Check that the trigger exists and is enabled

### Issue 2: Timing Issues
**Symptom:** Rewards are processed but with delays
**Solution:** The new system includes longer delays and retry logic

### Issue 3: Permission Issues
**Symptom:** Function errors about permissions
**Solution:** Ensure RLS policies allow the necessary operations

### Issue 4: Duplicate Prevention
**Symptom:** Rewards not created on subsequent tests
**Solution:** The system prevents duplicates - use different test emails

## Rollback Plan

If the new system causes issues, you can disable the automatic trigger:

```sql
DROP TRIGGER IF EXISTS referral_completion_trigger ON referrals;
```

And fall back to manual processing using the original `process_referral_rewards` function.

## Success Criteria

The system is working correctly when:
1. ✅ New signups with referral codes automatically create referral records
2. ✅ Rewards are processed within 5 seconds of signup
3. ✅ Wallet balances are updated correctly
4. ✅ Transaction records are created
5. ✅ No duplicate rewards are created
6. ✅ The influencer dashboard shows updated stats
7. ✅ Frontend logs show successful referral processing

## Next Steps

Once automatic processing is confirmed working:
1. Test with multiple referral levels (if you have a chain)
2. Test edge cases (invalid codes, duplicate signups)
3. Monitor production performance
4. Consider adding email notifications for successful referrals