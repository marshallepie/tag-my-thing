# User Management Dashboard - Missing Users Issue

## Problem Summary

The admin dashboard's user management table is not displaying all signed-up users. Users who signed up recently are missing from the table, even though they can log in successfully.

## Root Cause

The admin dashboard displays users from the **`user_profiles`** table, not directly from `auth.users`.

### Important: Confirmed vs Unconfirmed Users

**All users (confirmed or not) should have profiles created by the trigger.** The trigger fires immediately when a user signs up, regardless of email confirmation status.

- **Confirmed users**: Have verified their email (`email_confirmed_at` is set) and can fully use the app
- **Unconfirmed users**: Signed up but haven't clicked the confirmation link yet (`email_confirmed_at` is NULL) - they can't log in but should still have profiles

If unconfirmed users are missing profiles, it's still a bug. However, you may want to prioritize fixing confirmed users first since unconfirmed users might be abandoned signups.

### Expected Flow
1. User signs up → Entry created in `auth.users` (Supabase Auth table)
2. Trigger `on_auth_user_created` fires automatically
3. Function `create_user_profile_and_wallet()` creates:
   - Entry in `user_profiles` table
   - Entry in `user_wallets` table
   - Initial token transaction record

### What Went Wrong
The trigger function has a silent error handler that catches exceptions without failing the signup. If profile creation fails (e.g., database timeout, permission issue, constraint violation), the user gets created in `auth.users` but NOT in `user_profiles`.

**Result:** User can authenticate but won't appear in admin dashboard.

## Diagnosis & Fix

### Step 1: Diagnose the Issue

Run the diagnostic script to identify orphaned users:

```bash
supabase db execute --file diagnostic_orphaned_users.sql
```

This will show:
- Count of orphaned users (users without profiles)
- List of specific users affected
- Verification that the trigger exists
- Recent entries in both tables for comparison
- **Users with NULL emails** (these cannot be fixed automatically)

### Step 2: Fix Orphaned Users

You have two options:

#### Option A: Fix ALL orphaned users (confirmed + unconfirmed)
```bash
supabase db execute --file fix_orphaned_users.sql
```
Use this if you want all users (even those who haven't confirmed their email) to appear in the admin dashboard.

#### Option B: Fix ONLY confirmed users (recommended)
```bash
supabase db execute --file fix_orphaned_users_confirmed_only.sql
```
Use this to only fix users who have verified their email. Unconfirmed users may be abandoned signups and can be left alone.

Both scripts will:
- Create `user_profiles` entries for orphaned users **with valid emails**
- Create `user_wallets` with 50 TMT signup bonus
- Create initial token transaction records
- Preserve the original `created_at` timestamp from `auth.users`
- Show a summary of how many profiles were created
- **Skip users with NULL emails** (logs a warning with count)

### Step 3: Verify the Fix

After running the fix script:
1. Check the admin dashboard - all users should now appear
2. The diagnostic script output will show 0 orphaned users
3. Users should retain their original signup dates

## Prevention

The trigger should prevent this in the future, but the silent error handling means problems can go unnoticed. Consider:

1. **Monitoring**: Periodically run the diagnostic script to catch issues early
2. **Alerting**: Set up database logging to track trigger failures
3. **Improved Error Handling**: Modify the trigger to log errors to a dedicated table rather than silently catching them

## Technical Details

### Tables Involved
- **`auth.users`**: Supabase Auth table (source of truth for authentication)
- **`user_profiles`**: Application table with extended user data (displayed in admin dashboard)
- **`user_wallets`**: Token balance table
- **`token_transactions`**: Transaction audit trail

### Trigger Location
- **Trigger**: `on_auth_user_created` (on `auth.users` table)
- **Function**: `create_user_profile_and_wallet()`
- **Migration**: `20250801153905_rapid_cloud.sql` (line 96-99)

### Admin Dashboard Query
File: `src/pages/AdminInfluencerDashboard.tsx` (line 136)
```typescript
const usersPromise = supabase
  .from('user_profiles')  // ← Queries this table, not auth.users
  .select(`...`)
  .order('created_at', { ascending: false });
```

## Quick Reference Commands

```bash
# 1. Check for orphaned users (shows confirmed vs unconfirmed breakdown)
supabase db execute --file diagnostic_orphaned_users.sql

# 2a. Fix ALL orphaned users (confirmed + unconfirmed)
supabase db execute --file fix_orphaned_users.sql

# 2b. Fix ONLY confirmed orphaned users (recommended)
supabase db execute --file fix_orphaned_users_confirmed_only.sql

# 3. Check Supabase connection status
supabase status

# 4. View database logs (if configured)
supabase db logs
```

## Additional Notes

- The fix is **safe to run multiple times** - it only creates profiles for users who don't have them
- Original signup dates are preserved
- All users get the standard 50 TMT signup bonus
- The fix script uses the same logic as the original trigger function

### Users with NULL Emails

Some users may have NULL emails in `auth.users`. This can happen due to:
- Incomplete test signups
- Legacy data issues
- Database anomalies

**These users cannot be fixed automatically** because the `user_profiles.email` column has a NOT NULL constraint. The scripts will:
1. Count and log these users with a warning
2. Skip them during profile creation
3. List them in the diagnostic output for manual investigation

If you find NULL email users, you can:
- Manually delete them from `auth.users` if they're test data
- Update them with valid emails if they're legitimate users
- Leave them as-is (they won't affect the app since they can't log in)
