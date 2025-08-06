# TagMyThing Comprehensive Data Model Analysis

**Generated:** January 3, 2025  
**Version:** 1.0.0  
**Database:** PostgreSQL via Supabase  
**Application:** React + TypeScript + Supabase

---

## Executive Summary

TagMyThing is a sophisticated digital asset management platform featuring:
- **Token-based economy** (TMT tokens)
- **Next-of-Kin legacy planning** with Dead Man's Switch
- **Multi-level referral system** (5 levels deep)
- **Business product verification** with QR codes
- **Blockchain integration** for permanent archiving
- **Role-based access control** with 6 user roles

The system manages **15 core tables**, **35+ RPC functions**, and **4 storage buckets** with comprehensive Row Level Security (RLS) policies.

---

## 1. Database Schema Overview

### 1.1 Core User Management

#### `user_profiles` - Extended User Information
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'nok', 'moderator', 'admin', 'influencer', 'admin_influencer')),
  subscription_plan text NOT NULL DEFAULT 'freemium' CHECK (subscription_plan IN ('freemium', 'professional', 'enterprise')),
  location text,
  language text DEFAULT 'en',
  referral_code text UNIQUE,
  is_business_user boolean DEFAULT false,
  company_name text,
  tax_id text,
  business_document_url text,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Business Logic:**
- Automatically created via trigger when user signs up through Supabase Auth
- `last_activity_at` is critical for Dead Man's Switch functionality
- `referral_code` is auto-generated for all users (universal referral access)
- Business users get additional company verification fields

#### `user_wallets` - TMT Token Management
```sql
CREATE TABLE user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

**Business Logic:**
- One wallet per user (enforced by UNIQUE constraint)
- Balance represents TMT tokens
- Updated through `token_transactions` for complete audit trail

### 1.2 Asset Management System

#### `assets` - Core Asset Data
```sql
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  media_url text NOT NULL, -- Legacy field for backward compatibility
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')), -- Legacy field
  media_items jsonb, -- New field: Array of media objects with metadata
  privacy text NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
  estimated_value decimal(10,2),
  location text,
  blockchain_hash text,
  blockchain_network text,
  blockchain_status text CHECK (blockchain_status IN ('pending', 'published', 'failed')),
  ipfs_cid text,
  arweave_tx_id text,
  archive_status text DEFAULT 'pending' CHECK (archive_status IN ('pending', 'archived', 'instant_requested', 'failed')),
  archive_requested_at timestamptz,
  archive_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Business Logic:**
- `media_items` JSONB field stores array of media files with individual token costs
- Legacy `media_url`/`media_type` maintained for backward compatibility
- Archiving to Arweave costs 300 TMT tokens
- Public assets are discoverable by all users
- GIN index on `tags` for efficient tag-based searches

### 1.3 Next-of-Kin System with Dead Man's Switch

#### `next_of_kin` - NOK Relationships
```sql
CREATE TABLE next_of_kin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  relationship text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'verified', 'declined', 'reverted')),
  linked_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `asset_nok_assignments` - Asset-NOK Links with DMS
```sql
CREATE TABLE asset_nok_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  nok_id uuid REFERENCES next_of_kin(id) ON DELETE CASCADE NOT NULL,
  dms_date timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'triggered', 'cancelled')),
  access_granted_at timestamptz,
  reassigned_by_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reassigned_to_nok_id uuid REFERENCES next_of_kin(id) ON DELETE SET NULL,
  original_assigner_user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(asset_id, nok_id)
);
```

**Business Logic:**
- **Dead Man's Switch**: Triggers when `last_activity_at` < `dms_date`
- **Privacy Protection**: NOKs can't see asset details until DMS triggers
- **Reassignment**: NOKs can delegate responsibility to others
- **Original Assigner Tracking**: Maintains audit trail of who created assignments

### 1.4 Token Economy

#### `token_transactions` - Complete Audit Trail
```sql
CREATE TABLE token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'spent')),
  source text NOT NULL CHECK (source IN ('signup', 'referral', 'daily_login', 'admin_reward', 'purchase', 'tag_asset', 'edit_asset', 'upload_media', 'assign_nok', 'blockchain_publish')),
  description text,
  created_at timestamptz DEFAULT now()
);
```

**Token Pricing Structure:**
- **Photo Tagging**: 5 TMT (first: 25 TMT, subsequent: 12.5 TMT)
- **Video Tagging**: 7 TMT (≤60s: 60 TMT, ≤120s: 110 TMT)
- **PDF Upload**: 25 TMT (first), 12.5 TMT (subsequent)
- **Arweave Archiving**: 300 TMT
- **Signup Bonus**: 50 TMT (regular), 100 TMT (influencer)

### 1.5 Referral System (5-Level Deep)

#### `referrals` - Multi-level Referral Tracking
```sql
CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code text NOT NULL,
  referral_level integer NOT NULL DEFAULT 1 CHECK (referral_level >= 1 AND referral_level <= 5),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referred_id) -- Each user can only be referred once
);
```

#### `referral_rewards` - Token Rewards
**Reward Structure:**
- Level 1: 50 TMT
- Level 2: 30 TMT
- Level 3: 20 TMT
- Level 4: 10 TMT
- Level 5: 5 TMT
- **Total Potential**: 115 TMT per referral chain

### 1.6 Business Features

#### `products` - Business Product Registration
```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  serial_number text UNIQUE NOT NULL,
  description text,
  business_user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `scan_events` - Product Verification Tracking
```sql
CREATE TABLE scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text NOT NULL,
  scanned_at timestamptz DEFAULT now(),
  ip_address text,
  location text,
  device_info text,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL
);
```

---

## 2. Critical RPC Functions

### 2.1 Authentication & User Setup
- `create_user_profile_and_wallet()` - Auto-creates profile, wallet, and initial tokens
- `update_user_activity()` - Updates last activity for DMS tracking

### 2.2 Dead Man's Switch System
- `check_and_trigger_dms()` - Monitors and triggers DMS when conditions are met
- `assign_nok_to_asset_with_dms()` - Assigns NOK with DMS date
- `mass_assign_assets_to_nok()` - Bulk assignment of all assets to one NOK
- `reassign_incoming_nok_assignment()` - Allows NOK reassignment
- `get_nok_assignment_stats()` - Dashboard statistics

### 2.3 Referral Processing
- `process_referral_rewards_v2()` - Processes multi-level rewards
- `trigger_referral_rewards()` - Automatic trigger on referral completion
- `generate_referral_code()` - Creates unique referral codes

### 2.4 Business Features
- `register_product()` - Registers products with unique serial numbers
- `verify_product_scan()` - Verifies authenticity and logs scans
- `get_business_products()` - Retrieves user's registered products

### 2.5 Admin Functions
- `adjust_user_tokens()` - Admin token balance adjustments
- `get_user_analytics()` - Comprehensive user analytics

---

## 3. Data Relationships

```
auth.users (Supabase)
    ↓ (1:1)
user_profiles
    ├─ (1:1) → user_wallets
    ├─ (1:many) → assets
    ├─ (1:many) → next_of_kin
    ├─ (1:many) → token_transactions
    ├─ (1:many) → referrals (as referrer)
    ├─ (1:1) → referrals (as referred)
    ├─ (1:many) → products (if business user)
    └─ (1:many) → bug_reports

assets
    └─ (1:many) → asset_nok_assignments

next_of_kin
    └─ (1:many) → asset_nok_assignments

referrals
    └─ (1:many) → referral_rewards

products
    └─ (1:many) → scan_events (via serial_number)
```

---

## 4. Identified Redundancies & Technical Debt

### 4.1 Database Level
1. **Legacy Media Fields**: `media_url` and `media_type` in assets table superseded by `media_items` JSONB
2. **Inactive Subscription Plans**: Multiple deactivated plans create clutter
3. **Test Functions**: Several RPC functions exist only for testing/debugging
4. **Column Naming History**: Multiple migrations to fix `level` → `referral_level` conflicts

### 4.2 Frontend Level
1. **Duplicate Auth Components**: Legacy `Login.tsx`, `Signup.tsx` alongside new `AuthForm`
2. **Unused Imports**: Several components import unused dependencies
3. **Inconsistent Error Handling**: Mix of toast notifications and console logging
4. **Legacy Route Redirects**: Some routes redirect to maintain backward compatibility

### 4.3 Migration History Issues
1. **Multiple Column Renames**: Several migrations to fix PostgreSQL keyword conflicts
2. **Subscription Model Changes**: Multiple iterations of subscription plans
3. **RLS Policy Fixes**: Several migrations to fix infinite recursion in admin policies

---

## 5. Security Model

### 5.1 Row Level Security (RLS)
- **User Data Isolation**: Users can only access their own data
- **Role-based Access**: Admin roles have elevated permissions via `is_user_role()` function
- **Privacy Protection**: NOK assignments respect DMS status for conditional access
- **Public Asset Access**: Public assets readable by all authenticated users
- **Anonymous Access**: Limited to referral code lookups and public asset viewing

### 5.2 Function Security
- **SECURITY DEFINER**: Critical functions bypass RLS for safe execution
- **Role Validation**: Admin functions verify user roles before execution
- **Input Validation**: Functions validate parameters and user permissions
- **Audit Trails**: All sensitive operations are logged

---

## 6. Storage Architecture

### 6.1 Supabase Storage Buckets
- **`assets`**: Public bucket for user media (photos, videos, PDFs)
- **`avatars`**: Public bucket for profile pictures
- **`business-documents`**: Private bucket for business verification documents
- **`bug-screenshots`**: Private bucket for bug report screenshots

### 6.2 Storage Policies
- **User Isolation**: Users can only access their own files
- **Admin Access**: Admin roles can access all files for moderation
- **Public Assets**: Public asset media accessible to all users
- **Business Documents**: Only accessible to document owner and admin influencers

---

## 7. Frontend Architecture Analysis

### 7.1 Custom Hooks
- **`useAuth`**: Global authentication state, profile management, role checking
- **`useTokens`**: Token balance, transactions, spending/earning operations
- **`useNOKAssignments`**: NOK assignment management, DMS statistics
- **`useReferrals`**: Referral code generation, URL creation, statistics
- **`useGeolocation`**: Location detection for enhanced user experience

### 7.2 Data Flow Patterns

#### Authentication Flow
```
Supabase Auth → useAuth → Profile Fetch → Role-based Routing
```

#### Asset Tagging Flow
```
CameraCapture → TokenCalculation → TagAssetForm → Supabase Storage + Database
```

#### NOK Assignment Flow
```
Assets Page → Add NOK Form → Create NOK → Assign Asset → Update Counts
```

#### Referral Flow
```
Generate Code → Share URL → New User Signup → Automatic Reward Processing
```

### 7.3 State Management
- **React Context**: Authentication state shared globally
- **Session Storage**: Temporary storage for unauthenticated tagging flow
- **Real-time Subscriptions**: Supabase real-time for live updates
- **Local State**: Component-level state for forms and UI interactions

---

## 8. Business Rules & Logic

### 8.1 Token Economy Rules
```typescript
// From src/lib/tokenCalculator.ts
export const TOKEN_PRICING = {
  PHOTO_FIRST: 25,
  PHOTO_SUBSEQUENT: 12.5,
  VIDEO_60S: 60,
  VIDEO_120S: 110,
  PDF_FIRST: 25,
  PDF_SUBSEQUENT: 12.5,
} as const;

// Simplified pricing shown to users
// Photo: 5 TMT, Video: 7 TMT
```

### 8.2 Dead Man's Switch Logic
```sql
-- DMS triggers when: last_activity_at < dms_date
-- Default period: 1 year (configurable 1-5 years)
-- Privacy: NOKs can't see asset details until triggered
```

### 8.3 Referral System Logic
```sql
-- Universal access: All users can generate referral codes
-- 5-level rewards: 50, 30, 20, 10, 5 TMT
-- Automatic processing via database triggers
-- Landing page selection for targeted marketing
```

### 8.4 Business Verification Logic
```sql
-- Product registration with unique serial numbers
-- QR code generation for verification URLs
-- Scan tracking with IP, location, device info
-- Pattern analysis for counterfeit detection
```

---

## 9. Critical Functions Analysis

### 9.1 User Lifecycle Functions
```sql
-- Triggered on auth.users INSERT
create_user_profile_and_wallet()
  ├─ Creates user_profiles record
  ├─ Creates user_wallets with signup bonus
  ├─ Creates initial token_transaction
  └─ Generates referral_code

-- Manual activity tracking
update_user_activity()
  └─ Updates last_activity_at for DMS
```

### 9.2 NOK & DMS Functions
```sql
assign_nok_to_asset_with_dms(asset_id, nok_id, dms_date)
  ├─ Validates asset ownership
  ├─ Creates/updates assignment
  └─ Sets DMS trigger date

mass_assign_assets_to_nok(nok_id, dms_date)
  ├─ Finds all user assets
  ├─ Creates assignments for each
  └─ Returns assignment count

check_and_trigger_dms()
  ├─ Finds overdue assignments
  ├─ Checks user activity
  ├─ Triggers access if inactive
  └─ Updates assignment status
```

### 9.3 Referral Processing Functions
```sql
process_referral_rewards_v2(referred_user_id)
  ├─ Traces referral chain (up to 5 levels)
  ├─ Calculates rewards per level
  ├─ Updates wallet balances
  ├─ Creates transaction records
  └─ Marks rewards as paid

-- Automatic trigger
trigger_referral_rewards()
  └─ Calls process_referral_rewards_v2 on referral completion
```

### 9.4 Business Functions
```sql
register_product(product_name, serial_number, description)
  ├─ Validates business user status
  ├─ Checks subscription limits
  ├─ Creates product record
  └─ Returns success/error

verify_product_scan(serial_number, ip_address, location, device_info)
  ├─ Validates product exists
  ├─ Logs scan event
  ├─ Analyzes scan patterns
  ├─ Flags suspicious activity
  └─ Returns authenticity result
```

---

## 10. Performance Considerations

### 10.1 Indexes
```sql
-- User lookups
idx_user_profiles_email
idx_user_profiles_referral_code
idx_user_profiles_is_business_user

-- Asset queries
idx_assets_user_id
idx_assets_privacy
idx_assets_tags (GIN index)

-- NOK operations
idx_asset_nok_assignments_dms_date
idx_asset_nok_assignments_status

-- Referral processing
idx_referrals_referrer_id
idx_referrals_referred_id
idx_referrals_code

-- Business features
idx_products_serial_number
idx_scan_events_serial_number
```

### 10.2 Query Patterns
- **Dashboard Stats**: Aggregated counts via RPC functions
- **Real-time Updates**: Supabase subscriptions for live data
- **Batch Operations**: Mass assignment and bulk archiving
- **Search Operations**: Tag-based asset discovery with GIN indexes

---

## 11. Integration Points

### 11.1 External Services
- **Stripe**: Payment processing for token purchases and subscriptions
- **Arweave**: Permanent asset archiving (300 TMT cost)
- **Resend**: Email service for NOK invitations
- **IP Geolocation APIs**: Location detection for product scans

### 11.2 Edge Functions
```typescript
// supabase/functions/
send-nok-invite/          // NOK invitation emails
submit-bug-report/        // Bug report processing
verify-stripe-session/    // Payment verification
dms-checker/             // Scheduled DMS monitoring
archive-monthly-batch/   // Batch archiving operations
```

---

## 12. Redundancies & Cleanup Opportunities

### 12.1 Immediate Cleanup Needed
```typescript
// Legacy auth components (can be removed)
src/Login.tsx
src/Signup.tsx
src/ResetPassword.tsx
src/UpdatePassword.tsx
src/LogoutButton.tsx

// Superseded by AuthForm component
```

### 12.2 Database Cleanup
```sql
-- Legacy media fields in assets table
media_url, media_type -- Superseded by media_items JSONB

-- Inactive subscription plans
-- Multiple deactivated plans creating clutter

-- Test/Debug functions (production cleanup)
debug_referral_chain()
test_referral_system()
trigger_referral_processing()
manual_process_rewards()
```

### 12.3 Code Optimization
```typescript
// Inconsistent error handling patterns
// Mix of toast notifications and console logging

// Unused imports in several components
// Some components import dependencies they don't use

// Legacy route handling
// Some routes exist for backward compatibility only
```

---

## 13. Security Analysis

### 13.1 RLS Policy Structure
```sql
-- User data isolation
"Users can read own [table]" USING (user_id = auth.uid())

-- Role-based access
"Admin influencers can read all [table]" USING (is_user_role('admin_influencer'))

-- Conditional access (NOK system)
"NOKs can read designated assignments" USING (conditional DMS logic)

-- Public access
"Anyone can read public assets" USING (privacy = 'public')
```

### 13.2 Function Security
```sql
-- SECURITY DEFINER functions bypass RLS safely
-- Role validation in admin functions
-- Input sanitization and validation
-- Comprehensive error handling
```

---

## 14. Current State Assessment

### 14.1 Schema Maturity
- ✅ **Well-structured**: Clear separation of concerns
- ✅ **Comprehensive**: Covers all application features
- ✅ **Secure**: Robust RLS implementation
- ⚠️ **Some Legacy**: Backward compatibility fields present
- ⚠️ **Migration Debt**: Multiple fixes for naming conflicts

### 14.2 Code Quality
- ✅ **TypeScript**: Strong typing throughout
- ✅ **Custom Hooks**: Good abstraction of data operations
- ✅ **Error Handling**: Comprehensive error management
- ⚠️ **Some Duplication**: Legacy components still present
- ⚠️ **Inconsistent Patterns**: Mixed approaches in some areas

### 14.3 Feature Completeness
- ✅ **Core Features**: All major features implemented
- ✅ **Business Logic**: Complex workflows properly handled
- ✅ **Security**: Comprehensive access control
- ✅ **Scalability**: Architecture supports growth
- ⚠️ **Optimization**: Some performance improvements possible

---

## 15. Recommendations

### 15.1 Immediate Actions
1. **Apply Database Reset**: Use the provided migration for clean slate
2. **Remove Legacy Components**: Clean up old auth components
3. **Consolidate Media Handling**: Migrate fully to `media_items` JSONB
4. **Clean Test Functions**: Remove debugging RPC functions

### 15.2 Performance Improvements
1. **Add Composite Indexes**: For complex multi-condition queries
2. **Implement Caching**: For frequently accessed configuration data
3. **Optimize RPC Functions**: Reduce database round trips
4. **Batch Operations**: Enhance bulk processing capabilities

### 15.3 Security Enhancements
1. **Audit Trail Expansion**: More detailed logging for sensitive operations
2. **Rate Limiting**: Implement limits for expensive operations
3. **Input Sanitization**: Enhanced validation in RPC functions
4. **Session Management**: Improved session timeout handling

---

## 16. Migration Strategy

### 16.1 Database Reset Process
1. **Backup Current State**: Create snapshot before reset
2. **Apply Reset Migration**: Clear all user data
3. **Verify Schema Integrity**: Ensure all structures remain
4. **Clear Storage Buckets**: Manual cleanup of file storage
5. **Test Core Functions**: Verify all RPC functions work

### 16.2 Code Optimization Process
1. **Remove Legacy Files**: Delete unused auth components
2. **Update Import Statements**: Clean up unused imports
3. **Standardize Error Handling**: Consistent patterns across app
4. **Update Documentation**: Reflect current state accurately

---

This comprehensive analysis provides a complete picture of your TagMyThing data model, highlighting both the sophisticated architecture you've built and the opportunities for optimization. The database is ready for reset while preserving all the powerful functionality you've developed.

**Next Steps:**
1. Apply the database reset migration
2. Implement the cleanup recommendations
3. Test the streamlined NOK assignment feature
4. Monitor performance with fresh data

Would you like me to proceed with any specific optimizations or help you implement the database reset?