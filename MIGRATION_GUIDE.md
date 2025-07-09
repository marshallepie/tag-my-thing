# How to Apply Migrations in Bolt IDE

Since the Bolt IDE doesn't have direct access to the Supabase CLI, you'll need to apply the migrations manually through the Supabase dashboard.

## Step 1: Access Your Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your TagMyThing project

## Step 2: Open the SQL Editor

1. In your project dashboard, click on "SQL Editor" in the left sidebar
2. Click "New Query" to create a new SQL query

## Step 3: Apply Migrations in Order

You need to run each migration file in chronological order. Copy and paste the content of each file into the SQL editor and run them:

### Migration 1: Initial Schema
Copy the entire content from `supabase/migrations/20250623115320_patient_limit.sql` and run it.

### Migration 2: Influencer Referral System  
Copy the entire content from `supabase/migrations/20250702165527_mute_spire.sql` and run it.

### Migration 3: Referral Rewards Function Fixes
Copy the entire content from `supabase/migrations/20250706132642_pale_credit.sql` and run it.

### Migration 4: Test Influencer User
Copy the entire content from `supabase/migrations/20250706153438_jolly_river.sql` and run it.

## Step 4: Verify the Setup

After running all migrations, you should see these tables in your database:

- `user_profiles`
- `user_wallets` 
- `assets`
- `next_of_kin`
- `asset_nok_assignments`
- `token_transactions`
- `referrals`
- `referral_rewards`
- `referral_settings`
- `subscription_plans`
- `token_packages`
- `payments`

## Step 5: Test the System

1. Try signing up as an influencer at `/influencer-signup`
2. Test the referral system with code `marshallepie`
3. Check that the test influencer user "Marshall Epie" exists

## Troubleshooting

If you encounter errors:
1. Make sure to run migrations in the exact order listed above
2. Check that each migration completes successfully before running the next
3. If a migration fails, check the error message and fix any issues before proceeding

## Alternative: Quick Setup Script

If you prefer, you can also copy all migration content into a single query and run it all at once, but running them separately is safer for debugging.