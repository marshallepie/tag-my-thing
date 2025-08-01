# TagMyThing Database Schema Documentation

## Overview
This document provides a comprehensive overview of the TagMyThing database schema, including all tables, relationships, functions, and security policies.

## Database Architecture

### Core Principles
- **Row Level Security (RLS)**: All tables implement RLS for data protection
- **SECURITY DEFINER Functions**: Safe execution without RLS conflicts
- **Role-based Access Control**: Granular permissions for different user types
- **Audit Trail**: Complete tracking of all token movements and changes
- **Privacy Protection**: Dead Man's Switch ensures privacy until triggered

## Table Structure

### Core User Tables

#### `user_profiles`
Extended user information beyond Supabase auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key, references auth.users |
| `email` | text | User email address (unique) |
| `full_name` | text | User's full name |
| `avatar_url` | text | Profile picture URL |
| `role` | text | User role (user, nok, moderator, admin, influencer, admin_influencer) |
| `subscription_plan` | text | Current plan (freemium, professional, enterprise) |
| `location` | text | User's location |
| `language` | text | Preferred language (default: 'en') |
| `referral_code` | text | Unique referral code for sharing |
| `is_business_user` | boolean | Whether user has business features |
| `company_name` | text | Business name (for business users) |
| `tax_id` | text | Tax identification number |
| `business_document_url` | text | Business verification document |
| `last_activity_at` | timestamptz | Last activity for Dead Man's Switch |
| `created_at` | timestamptz | Account creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

#### `user_wallets`
TMT token wallet management.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | References user_profiles(id) |
| `balance` | integer | Current TMT token balance |
| `created_at` | timestamptz | Wallet creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### Asset Management Tables

#### `assets`
Tagged assets with comprehensive metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Asset owner, references user_profiles(id) |
| `title` | text | Asset title |
| `description` | text | Asset description |
| `tags` | text[] | Array of tags for categorization |
| `media_url` | text | Primary media file URL |
| `media_type` | text | Type of media (photo, video) |
| `privacy` | text | Privacy setting (private, public) |
| `estimated_value` | decimal(10,2) | Estimated monetary value |
| `location` | text | Asset location |
| `blockchain_hash` | text | Blockchain transaction hash |
| `blockchain_network` | text | Blockchain network used |
| `blockchain_status` | text | Blockchain publishing status |
| `ipfs_cid` | text | IPFS content identifier |
| `arweave_tx_id` | text | Arweave transaction ID |
| `archive_status` | text | Archive status (pending, archived, failed) |
| `archive_requested_at` | timestamptz | When archiving was requested |
| `archive_method` | text | Method used for archiving |
| `media_items` | jsonb | Array of media files with metadata |
| `created_at` | timestamptz | Asset creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### Next-of-Kin System

#### `next_of_kin`
Next-of-kin relationships for legacy planning.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | User who added this NOK |
| `name` | text | NOK's full name |
| `email` | text | NOK's email address |
| `phone` | text | NOK's phone number |
| `relationship` | text | Relationship to user |
| `photo_url` | text | NOK's photo URL |
| `status` | text | Verification status (pending, verified, declined) |
| `created_at` | timestamptz | NOK creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

#### `asset_nok_assignments`
NOK assignments with Dead Man's Switch protection.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `asset_id` | uuid | Asset being assigned |
| `nok_id` | uuid | Next-of-kin receiving assignment |
| `dms_date` | timestamptz | Dead Man's Switch trigger date |
| `status` | text | Assignment status (pending, active, triggered, cancelled) |
| `access_granted_at` | timestamptz | When DMS was triggered |
| `reassigned_by_user_id` | uuid | User who reassigned this NOK |
| `reassigned_to_nok_id` | uuid | NOK who received reassignment |
| `original_assigner_user_id` | uuid | Original user who created assignment |
| `created_at` | timestamptz | Assignment creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### Token Economy Tables

#### `token_transactions`
Complete record of all token movements.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | User involved in transaction |
| `amount` | integer | Token amount (positive for earned, negative for spent) |
| `type` | text | Transaction type (earned, spent) |
| `source` | text | Source of transaction (signup, referral, purchase, etc.) |
| `description` | text | Human-readable description |
| `created_at` | timestamptz | Transaction timestamp |

#### `subscription_plans`
Business subscription tiers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Plan name (freemium, professional, enterprise) |
| `token_limit` | integer | Monthly token allocation |
| `price_gbp` | decimal(10,2) | Price in British Pounds |
| `price_xaf` | decimal(10,2) | Price in Central African Francs |
| `billing_interval` | text | Billing frequency (monthly, yearly) |
| `features` | text[] | Array of plan features |
| `active` | boolean | Whether plan is available |

#### `token_packages`
Token purchase options.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Package name |
| `token_amount` | integer | Number of tokens included |
| `bonus_tokens` | integer | Additional bonus tokens |
| `price_gbp` | decimal(10,2) | Price in British Pounds |
| `price_xaf` | decimal(10,2) | Price in Central African Francs |
| `active` | boolean | Whether package is available |

#### `payments`
Payment processing records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | User making payment |
| `amount` | decimal(10,2) | Payment amount |
| `currency` | text | Payment currency |
| `payment_method` | text | Method used (stripe, mtn_money, orange_money) |
| `stripe_payment_intent_id` | text | Stripe payment identifier |
| `mobile_money_reference` | text | Mobile money reference |
| `status` | text | Payment status (pending, completed, failed, cancelled) |
| `type` | text | Payment type (subscription, tokens) |
| `metadata` | jsonb | Additional payment metadata |

### Referral System Tables

#### `referrals`
Multi-level referral tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `referrer_id` | uuid | User who made the referral |
| `referred_id` | uuid | User who was referred |
| `referral_code` | text | Referral code used |
| `referral_level` | integer | Level in referral chain (1-5) |
| `status` | text | Referral status (pending, completed, cancelled) |
| `completed_at` | timestamptz | When referral was completed |

#### `referral_rewards`
Token rewards for successful referrals.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `referral_id` | uuid | Associated referral |
| `referrer_id` | uuid | User receiving reward |
| `referred_id` | uuid | User who was referred |
| `referral_level` | integer | Level in chain (1-5) |
| `token_amount` | integer | Tokens awarded |
| `status` | text | Reward status (pending, paid, cancelled) |
| `paid_at` | timestamptz | When reward was paid |

#### `referral_settings`
Configurable referral reward amounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `referral_level` | integer | Referral level (1-5) |
| `token_reward` | integer | Tokens awarded for this level |
| `active` | boolean | Whether this level is active |

### Business Features Tables

#### `products`
Business product registration for verification.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `product_name` | text | Product name |
| `serial_number` | text | Unique serial number |
| `description` | text | Product description |
| `business_user_id` | uuid | Business user who registered product |
| `created_at` | timestamptz | Registration timestamp |
| `updated_at` | timestamptz | Last update timestamp |

#### `scan_events`
Product verification scan tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `serial_number` | text | Product serial number scanned |
| `scanned_at` | timestamptz | Scan timestamp |
| `ip_address` | text | Scanner's IP address |
| `location` | text | Scan location |
| `device_info` | text | Scanner's device information |
| `user_id` | uuid | User who performed scan (if authenticated) |

### Support Tables

#### `bug_reports`
In-app bug reporting system.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | User who reported bug |
| `user_email` | text | Reporter's email |
| `user_name` | text | Reporter's name |
| `error_message` | text | Bug description |
| `console_logs` | text | Browser console logs |
| `screenshot_url` | text | Screenshot of bug |
| `page_url` | text | Page where bug occurred |
| `user_agent` | text | Browser user agent |
| `metadata` | jsonb | Additional bug metadata |
| `status` | text | Bug status (new, triaged, in_progress, resolved, wont_fix) |
| `priority` | text | Bug priority (low, medium, high, critical) |
| `admin_notes` | text | Internal admin notes |

## Key Functions

### Next-of-Kin & Dead Man's Switch Functions

#### `get_user_incoming_nok_assignments()`
Returns assets where the current user is designated as next-of-kin.

**Returns**: Table with assignment details, privacy-protected until DMS triggers.

#### `get_user_outgoing_nok_assignments()`
Returns assets the current user has assigned to others as next-of-kin.

**Returns**: Table with assignment details and DMS countdown.

#### `assign_nok_to_asset_with_dms(asset_id, nok_id, dms_date)`
Assigns a next-of-kin to an asset with Dead Man's Switch protection.

**Parameters**:
- `asset_id`: UUID of asset to assign
- `nok_id`: UUID of next-of-kin
- `dms_date`: Date when DMS triggers (default: 1 year)

#### `mass_assign_assets_to_nok(nok_id, dms_date)`
Assigns all user's assets to a single next-of-kin.

**Parameters**:
- `nok_id`: UUID of next-of-kin
- `dms_date`: Date when DMS triggers (default: 1 year)

#### `reassign_incoming_nok_assignment(assignment_id, new_nok_id)`
Allows a designated NOK to reassign their responsibility to another NOK.

**Parameters**:
- `assignment_id`: UUID of assignment to reassign
- `new_nok_id`: UUID of new next-of-kin

#### `get_nok_assignment_stats()`
Returns statistics about incoming and outgoing NOK assignments.

**Returns**: JSON object with counts for dashboard display.

#### `check_and_trigger_dms()`
Checks and triggers Dead Man's Switch for overdue assignments.

**Returns**: JSON object with trigger results.

### Business Functions

#### `register_product(product_name, serial_number, description)`
Registers a new business product for verification.

#### `verify_product_scan(serial_number, ip_address, location, device_info)`
Verifies product authenticity and logs scan event.

#### `get_business_products()`
Returns all products registered by the current business user.

#### `get_product_scan_history(serial_number)`
Returns scan history for a specific product.

### Admin Functions

#### `adjust_user_tokens(target_user_id, adjustment_amount, reason)`
Allows admin influencers to adjust user token balances.

#### `get_user_analytics()`
Returns comprehensive user analytics for admin dashboard.

### Utility Functions

#### `update_user_activity()`
Updates the current user's last activity timestamp for DMS tracking.

#### `get_user_asset_count()`
Returns the count of assets for the current user.

#### `generate_referral_code(user_id, username)`
Generates a unique referral code for a user.

## Security Model

### Row Level Security Policies

#### User Data Protection
- Users can only access their own profiles, wallets, and assets
- Public assets are readable by all authenticated users
- Anonymous users can read public assets and referral codes

#### Next-of-Kin Privacy Protection
- NOK can see they've been assigned without viewing asset details
- Asset details only become visible when DMS is triggered
- Original assigners can manage their outgoing assignments
- NOK can reassign incoming assignments to others

#### Business Data Isolation
- Business users can only access their own products and scan data
- Product verification is public for authenticity checking
- Scan events are logged for all users but only accessible to product owners

#### Admin Access
- Admin influencers have read access to all data for dashboard analytics
- Admin influencers can adjust user tokens and manage system settings
- All admin actions are logged with proper audit trails

### Role-based Access Control

#### User Roles
- **user**: Standard user with basic features
- **nok**: Next-of-kin with limited asset access
- **moderator**: Content moderation capabilities
- **admin**: Full platform administration
- **influencer**: Enhanced referral capabilities
- **admin_influencer**: Combined admin and influencer privileges

#### Business Features
- **is_business_user**: Flag enabling business features
- Business users get access to product registration and verification
- Subscription plans provide different levels of business features

## Data Relationships

### Core Relationships
```
user_profiles (1) ←→ (1) user_wallets
user_profiles (1) ←→ (n) assets
user_profiles (1) ←→ (n) next_of_kin
user_profiles (1) ←→ (n) token_transactions
```

### NOK Relationships
```
assets (1) ←→ (n) asset_nok_assignments
next_of_kin (1) ←→ (n) asset_nok_assignments
user_profiles (1) ←→ (n) asset_nok_assignments (as original_assigner)
```

### Referral Relationships
```
user_profiles (1) ←→ (n) referrals (as referrer)
user_profiles (1) ←→ (1) referrals (as referred)
referrals (1) ←→ (n) referral_rewards
```

### Business Relationships
```
user_profiles (1) ←→ (n) products (as business_user)
products (1) ←→ (n) scan_events (via serial_number)
```

## Indexes for Performance

### User Tables
- `idx_user_profiles_email` - Email lookups
- `idx_user_profiles_referral_code` - Referral code lookups
- `idx_user_profiles_is_business_user` - Business user filtering
- `idx_user_profiles_last_activity` - DMS activity checks

### Asset Tables
- `idx_assets_user_id` - User's assets
- `idx_assets_privacy` - Public asset filtering
- `idx_assets_tags` - GIN index for tag searches
- `idx_assets_archive_status` - Archive status filtering

### NOK Tables
- `idx_next_of_kin_user_id` - User's NOK list
- `idx_next_of_kin_email` - NOK email lookups
- `idx_asset_nok_assignments_dms_date` - DMS date checks
- `idx_asset_nok_assignments_status` - Assignment status filtering

### Token Tables
- `idx_token_transactions_user_id` - User's transactions
- `idx_token_transactions_created_at` - Transaction history

### Referral Tables
- `idx_referrals_referrer_id` - Referrer's referrals
- `idx_referrals_code` - Referral code lookups
- `idx_referral_rewards_referrer_id` - Referrer's rewards

### Business Tables
- `idx_products_business_user_id` - Business user's products
- `idx_products_serial_number` - Product lookups
- `idx_scan_events_serial_number` - Product scan history

## Storage Buckets

### Asset Storage
- **assets**: Public bucket for user-uploaded media
- **avatars**: Public bucket for profile pictures

### Business Storage
- **business-documents**: Private bucket for business verification documents
- **bug-screenshots**: Private bucket for bug report screenshots

## Triggers and Automation

### Updated At Triggers
All tables have `updated_at` triggers that automatically update the timestamp on row modifications.

### Referral Processing
- Automatic trigger on referral completion
- Processes rewards up to 5 levels deep
- Creates token transactions and updates wallets

### Dead Man's Switch
- Scheduled function checks DMS dates
- Automatically triggers access when conditions are met
- Updates assignment status and grants access

## Data Flow Examples

### Asset Tagging Flow
1. User captures media → Upload to assets bucket
2. User fills form → Create asset record
3. Tokens deducted → Create transaction record
4. Optional NOK assignment → Create assignment record

### NOK Assignment Flow
1. User selects asset and NOK → Create assignment
2. Set DMS date → Configure trigger date
3. NOK receives notification → Assignment visible in incoming
4. DMS triggers → Asset details become accessible

### Referral Flow
1. User shares referral link → Contains referral code
2. New user signs up → Create referral record
3. Automatic processing → Create reward records
4. Update wallets → Create transaction records

### Business Verification Flow
1. Business registers product → Create product record
2. Generate QR code → Link to verification page
3. Customer scans → Create scan event
4. Verify authenticity → Check product exists
5. Track patterns → Flag suspicious activity

This schema provides a robust foundation for all TagMyThing features while maintaining security, performance, and scalability.