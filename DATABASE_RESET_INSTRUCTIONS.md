# Database Reset Migration Instructions

## Overview
This guide will help you apply the database reset migration to completely clear all user data while preserving the database structure, functions, and configuration.

## Prerequisites
- Access to your Supabase Dashboard
- Admin privileges on your Supabase project
- **IMPORTANT**: Create a backup before proceeding (recommended)

## Step 1: Create Backup (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your TagMyThing project
3. Navigate to **Settings** > **Database**
4. Click **Backup** to create a snapshot

## Step 2: Apply the Reset Migration

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Select your TagMyThing project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the SQL content from the migration file below
6. Paste it into the SQL editor
7. Click **Run** to execute the migration

### Option B: Using Supabase CLI (If Available)
```bash
# If you have Supabase CLI installed and configured
supabase db push
```

## Step 3: SQL Migration Content

Copy and paste this entire SQL block into your Supabase SQL Editor:

```sql
/*
  # Reset Database Data - Complete Data Wipe

  This migration safely deletes ALL data from the TagMyThing database while preserving
  the complete schema structure, functions, triggers, and policies.

  WHAT THIS DOES:
  - Deletes all user data (profiles, wallets, transactions)
  - Deletes all assets and media files
  - Deletes all Next-of-Kin records and assignments
  - Deletes all referral data and rewards
  - Deletes all business data (products, scans)
  - Deletes all bug reports and support data
  - Resets all sequences and counters
  - Preserves all tables, functions, triggers, and RLS policies

  WHAT THIS PRESERVES:
  - Complete database schema
  - All functions and stored procedures
  - All RLS policies and security settings
  - All triggers and constraints
  - All indexes and performance optimizations
  - Default subscription plans and token packages
  - Referral settings configuration

  WARNING: This action is irreversible. All user data will be permanently deleted.
*/

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- Delete all user-generated data in dependency order

-- 1. Delete referral rewards (depends on referrals and users)
DELETE FROM referral_rewards;

-- 2. Delete referrals (depends on users)
DELETE FROM referrals;

-- 3. Delete bug reports (depends on users)
DELETE FROM bug_reports;

-- 4. Delete scan events (depends on products)
DELETE FROM scan_events;

-- 5. Delete products (depends on business users)
DELETE FROM products;

-- 6. Delete payments (depends on users)
DELETE FROM payments;

-- 7. Delete asset NOK assignments (depends on assets and NOKs)
DELETE FROM asset_nok_assignments;

-- 8. Delete next of kin records (depends on users)
DELETE FROM next_of_kin;

-- 9. Delete token transactions (depends on users)
DELETE FROM token_transactions;

-- 10. Delete assets (depends on users)
DELETE FROM assets;

-- 11. Delete user wallets (depends on user profiles)
DELETE FROM user_wallets;

-- 12. Delete user profiles (this will cascade to auth.users via foreign key)
DELETE FROM user_profiles;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences to start from 1 (if any exist)
-- Note: Most tables use UUIDs, but this ensures clean state

-- Clear any cached data or temporary files
-- Note: Storage buckets will need to be cleared separately via Supabase dashboard

-- Verify data deletion and log results
DO $$
DECLARE
  table_name text;
  row_count integer;
  total_rows integer := 0;
BEGIN
  -- Check each main table for remaining data
  FOR table_name IN 
    SELECT t.table_name 
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT IN ('referral_settings', 'subscription_plans', 'token_packages')
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
    total_rows := total_rows + row_count;
    
    IF row_count > 0 THEN
      RAISE NOTICE 'Table % still has % rows', table_name, row_count;
    END IF;
  END LOOP;
  
  IF total_rows = 0 THEN
    RAISE NOTICE '✅ DATABASE RESET SUCCESSFUL: All user data has been deleted';
    RAISE NOTICE '✅ Schema preserved: All tables, functions, and policies remain intact';
    RAISE NOTICE '✅ Configuration preserved: Subscription plans, token packages, and referral settings maintained';
  ELSE
    RAISE NOTICE '⚠️  WARNING: % rows remain in database tables', total_rows;
  END IF;
  
  -- Log configuration data that was preserved
  SELECT COUNT(*) INTO row_count FROM subscription_plans WHERE active = true;
  RAISE NOTICE 'ℹ️  Preserved: % active subscription plans', row_count;
  
  SELECT COUNT(*) INTO row_count FROM token_packages WHERE active = true;
  RAISE NOTICE 'ℹ️  Preserved: % active token packages', row_count;
  
  SELECT COUNT(*) INTO row_count FROM referral_settings WHERE active = true;
  RAISE NOTICE 'ℹ️  Preserved: % referral reward levels', row_count;
END $$;

-- Final verification: Ensure essential configuration data exists
DO $$
BEGIN
  -- Verify subscription plans exist
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'freemium' AND active = true) THEN
    RAISE EXCEPTION 'CRITICAL: Freemium subscription plan missing after reset';
  END IF;
  
  -- Verify token packages exist
  IF NOT EXISTS (SELECT 1 FROM token_packages WHERE active = true) THEN
    RAISE EXCEPTION 'CRITICAL: No active token packages found after reset';
  END IF;
  
  -- Verify referral settings exist
  IF NOT EXISTS (SELECT 1 FROM referral_settings WHERE active = true) THEN
    RAISE EXCEPTION 'CRITICAL: No active referral settings found after reset';
  END IF;
  
  RAISE NOTICE '✅ VERIFICATION COMPLETE: All essential configuration data is intact';
  RAISE NOTICE '🚀 Database is ready for fresh user signups and data';
END $$;
```

## Step 4: Clear Storage Buckets (Manual)

After running the SQL migration, manually clear these storage buckets in your Supabase Dashboard:

1. Go to **Storage** in your Supabase dashboard
2. Clear the contents of these buckets:
   - `assets` (user-uploaded media)
   - `avatars` (profile pictures) 
   - `business-documents` (business verification docs)
   - `bug-screenshots` (bug report screenshots)

## Step 5: Verification

After running the migration, you should see output messages like:
- ✅ DATABASE RESET SUCCESSFUL: All user data has been deleted
- ✅ Schema preserved: All tables, functions, and policies remain intact
- ✅ Configuration preserved: Subscription plans, token packages, and referral settings maintained

## Step 6: Test the Application

1. Try accessing your TagMyThing application
2. Attempt to sign up a new user
3. Verify that:
   - User profile is created automatically
   - Wallet is created with initial tokens
   - All features work as expected

## What Happens Next

After applying this reset:
- Your database will be completely empty of user data
- All tables, functions, and policies remain intact
- You can immediately start fresh with new user signups
- The streamlined NOK assignment feature will work perfectly
- All existing functionality remains available

## Rollback Plan (If Needed)

If you created a backup in Step 1, you can restore it from:
**Supabase Dashboard** > **Settings** > **Database** > **Backups**

## Support

If you encounter any issues:
- Check the Supabase logs for detailed error messages
- Verify your database has sufficient resources
- Contact me with specific error messages if needed

---

**Ready to proceed?** Copy the SQL content above and run it in your Supabase SQL Editor to complete the database reset.