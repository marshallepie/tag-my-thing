# Database Migration Guide for TagMyThing

## Overview
This guide helps you migrate to the new comprehensive database schema that consolidates all TagMyThing functionality into a clean, efficient structure.

## Prerequisites
- Access to your Supabase dashboard
- Admin privileges on your Supabase project
- Backup of your current database (recommended)

## Migration Steps

### Step 1: Backup Current Database
Before proceeding, create a backup of your current database:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your TagMyThing project
3. Navigate to **Settings** > **Database**
4. Click **Backup** to create a snapshot

### Step 2: Apply New Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content from `supabase/migrations/20250801100000_comprehensive_schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the migration

### Step 3: Verify Migration
After running the migration, verify that all tables and functions are created:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

### Step 4: Test Core Functionality
Test the following key features to ensure everything works:

1. **User Authentication**: Try signing in/up
2. **Asset Management**: Create, view, and manage assets
3. **NOK System**: Test incoming/outgoing assignments
4. **Referral System**: Generate and use referral codes
5. **Business Features**: Register products and verify scans (if applicable)

## New Features Included

### Enhanced Next-of-Kin System
- **Incoming NOK Assignments**: Track assets where you're designated as NOK
- **Outgoing NOK Assignments**: Manage assets you've assigned to others
- **Dead Man's Switch**: Automatic access control based on user activity
- **Mass Assignment**: Assign all assets to a single NOK
- **Reassignment**: NOK can reassign responsibilities to others

### Comprehensive Token Economy
- **Multi-source Transactions**: Track all token movements
- **Business Subscriptions**: Professional and Enterprise plans
- **Referral Rewards**: 5-level referral system
- **Admin Controls**: Token adjustment capabilities

### Business Features
- **Product Registration**: Register products with unique serial numbers
- **QR Code Verification**: Scan tracking and authenticity verification
- **Business Analytics**: Comprehensive business user statistics

### Enhanced Security
- **Role-based Access**: Granular permissions for different user types
- **SECURITY DEFINER Functions**: Safe execution without RLS conflicts
- **Comprehensive RLS Policies**: Data protection at database level

## Database Schema Overview

### Core Tables
- `user_profiles` - Extended user information
- `user_wallets` - TMT token management
- `assets` - Tagged assets with archiving
- `next_of_kin` - NOK relationships
- `asset_nok_assignments` - NOK assignments with DMS

### Token Economy
- `token_transactions` - All token movements
- `subscription_plans` - Business subscription tiers
- `token_packages` - Token purchase options
- `payments` - Payment processing

### Referral System
- `referrals` - Multi-level referral tracking
- `referral_rewards` - Token rewards
- `referral_settings` - Configurable rewards

### Business Features
- `products` - Product registration
- `scan_events` - Verification scans

### Support
- `bug_reports` - In-app bug reporting

## Key Functions

### NOK & Dead Man's Switch
- `get_user_incoming_nok_assignments()` - Get incoming NOK assignments
- `get_user_outgoing_nok_assignments()` - Get outgoing NOK assignments
- `assign_nok_to_asset_with_dms()` - Assign NOK with DMS date
- `mass_assign_assets_to_nok()` - Mass assign all assets to NOK
- `reassign_incoming_nok_assignment()` - Reassign NOK responsibility
- `get_nok_assignment_stats()` - Get NOK statistics for dashboard
- `check_and_trigger_dms()` - Check and trigger Dead Man's Switch

### Business Functions
- `register_product()` - Register business products
- `verify_product_scan()` - Verify product authenticity
- `get_business_products()` - Get user's registered products
- `get_product_scan_history()` - Get scan history for products

### Admin Functions
- `adjust_user_tokens()` - Admin token adjustments
- `get_user_analytics()` - Comprehensive user analytics

### Utility Functions
- `update_user_activity()` - Update user activity for DMS
- `get_user_asset_count()` - Get user's asset count
- `generate_referral_code()` - Generate unique referral codes

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure you're running the migration with admin privileges
   - Check that RLS policies are properly configured

2. **Function Errors**
   - Verify all functions are created successfully
   - Check function permissions with `GRANT EXECUTE` statements

3. **Storage Issues**
   - Ensure storage buckets are created
   - Verify storage policies are applied correctly

### Rollback Plan
If you need to rollback:

1. Restore from the backup created in Step 1
2. Or manually drop the new schema:
```sql
-- Drop all new tables (be careful!)
DROP TABLE IF EXISTS bug_reports CASCADE;
DROP TABLE IF EXISTS scan_events CASCADE;
DROP TABLE IF EXISTS products CASCADE;
-- ... continue for all tables
```

## Support
If you encounter issues during migration:
- Check Supabase logs for detailed error messages
- Verify your database has sufficient resources
- Contact support with specific error messages

## Post-Migration Checklist
- [ ] All tables created successfully
- [ ] All functions created and executable
- [ ] RLS policies applied correctly
- [ ] Storage buckets and policies configured
- [ ] Initial data inserted (plans, packages, settings)
- [ ] Frontend connects successfully
- [ ] Core functionality tested
- [ ] NOK system working properly
- [ ] Referral system functional
- [ ] Business features operational (if applicable)

The new schema provides a solid foundation for all current and future TagMyThing features while maintaining optimal performance and security.