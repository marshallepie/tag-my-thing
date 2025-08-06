# TagMyThing Comprehensive Data Model Analysis

**Generated:** January 3, 2025  
**Status:** Post-Database Reset Analysis  
**Purpose:** Complete documentation of data structures, relationships, and business logic

---

## Executive Summary

TagMyThing is a sophisticated digital asset management platform with a token-based economy, Next-of-Kin legacy planning, multi-level referral system, and business product verification capabilities. The application uses Supabase (PostgreSQL) as its backend with comprehensive Row Level Security (RLS) policies.

**Key Statistics:**
- **15 Core Tables** with comprehensive relationships
- **35+ RPC Functions** handling complex business logic
- **5-Level Referral System** with automatic reward processing
- **Dead Man's Switch** for legacy planning
- **Token Economy** powering all platform interactions

---

## 1. Core Database Schema

### 1.1 User Management Tables

#### `user_profiles` (Primary User Data)
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
- Business users get additional fields for company verification

#### `user_wallets` (Token Management)
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
- Updated through `token_transactions` for audit trail

### 1.2 Asset Management Tables

#### `assets` (Core Asset Data)
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
- `media_items` JSONB field stores array of media files with token costs
- Legacy `media_url`/`media_type` maintained for backward compatibility
- Archiving to Arweave costs 300 TMT tokens
- Public assets are discoverable by all users

### 1.3 Next-of-Kin System Tables

#### `next_of_kin` (NOK Relationships)
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

#### `asset_nok_assignments` (Asset-NOK Links with DMS)
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
- Dead Man's Switch triggers when `last_activity_at` < `dms_date`
- Privacy protection: NOKs can't see asset details until DMS triggers
- Reassignment capability allows NOKs to delegate responsibility
- Original assigner tracking for audit purposes

### 1.4 Token Economy Tables

#### `token_transactions` (Complete Audit Trail)
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

**Business Logic:**
- Immutable audit trail (no UPDATE/DELETE policies)
- Positive amounts for earned, negative for spent
- Source tracking for analytics and debugging

### 1.5 Referral System Tables

#### `referrals` (Multi-level Referral Tracking)
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

#### `referral_rewards` (Token Rewards)
```sql
CREATE TABLE referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
  referrer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referral_level integer NOT NULL CHECK (referral_level >= 1 AND referral_level <= 5),
  token_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Business Logic:**
- Automatic reward processing via `referral_completion_trigger`
- 5-level reward structure: 50, 30, 20, 10, 5 TMT tokens
- Duplicate prevention through unique constraints

---

## 2. Critical Business Logic Functions

### 2.1 Authentication & User Setup
```sql
-- Triggered on auth.users INSERT
FUNCTION create_user_profile_and_wallet()
```
- Creates user profile with role-based token bonus
- Creates wallet with initial balance
- Creates signup transaction record
- Handles influencer (100 TMT) vs regular (50 TMT) bonuses

### 2.2 Dead Man's Switch System
```sql
FUNCTION check_and_trigger_dms()
FUNCTION update_user_activity()
FUNCTION get_nok_assignment_stats()
```
- Monitors user activity vs DMS dates
- Triggers asset access when conditions are met
- Provides dashboard statistics for NOK management

### 2.3 Referral Processing
```sql
FUNCTION process_referral_rewards_v2(referred_user_id)
FUNCTION trigger_referral_rewards() -- Trigger function
```
- Automatic processing on referral completion
- Multi-level reward distribution (up to 5 levels)
- Wallet updates and transaction logging

### 2.4 Business Features
```sql
FUNCTION register_product(product_name, serial_number, description)
FUNCTION verify_product_scan(serial_number, ip_address, location, device_info)
FUNCTION check_business_subscription_limit(user_id, feature_type, current_usage)
```
- Product registration with unique serial numbers
- QR code verification with scan tracking
- Subscription-based feature limits

---

## 3. Frontend Architecture Analysis

### 3.1 Data Flow Patterns

#### Authentication Flow
```typescript
useAuth() → Supabase Auth → user_profiles → Dashboard
```
- Global authentication state management
- Profile data fetching and caching
- Role-based access control

#### Asset Tagging Flow
```typescript
CameraCapture → TagAssetForm → Token Calculation → Supabase Storage + Database
```
- Client-side token cost calculation
- Multi-media support (photos, videos, PDFs)
- Automatic NOK assignment option

#### NOK Management Flow
```typescript
NextOfKin Page → RPC Functions → Real-time Updates
```
- Incoming/outgoing assignment tracking
- Dead Man's Switch configuration
- Reassignment capabilities

### 3.2 State Management
- **React Hooks**: Custom hooks for data fetching and state management
- **Session Storage**: Temporary storage for unauthenticated tagging flow
- **Real-time Subscriptions**: Supabase real-time for live updates

---

## 4. Identified Redundancies and Technical Debt

### 4.1 Database Level
1. **Legacy Media Fields**: `media_url` and `media_type` in assets table are superseded by `media_items` JSONB
2. **Inactive Subscription Plans**: Multiple deactivated plans create clutter
3. **Test Functions**: Several RPC functions exist only for testing/debugging

### 4.2 Code Level
1. **Duplicate Components**: Some legacy auth components (`Login.tsx`, `Signup.tsx`) alongside new `AuthForm`
2. **Unused Imports**: Several components import unused dependencies
3. **Inconsistent Error Handling**: Mix of toast notifications and console logging

### 4.3 Migration History
1. **Column Renaming**: Multiple migrations to fix `level` → `referral_level` conflicts
2. **Subscription Model Changes**: Multiple iterations of subscription plans
3. **RLS Policy Fixes**: Several migrations to fix infinite recursion in admin policies

---

## 5. Security Model

### 5.1 Row Level Security (RLS)
- **User Data Isolation**: Users can only access their own data
- **Role-based Access**: Admin roles have elevated permissions
- **Privacy Protection**: NOK assignments respect DMS status
- **Public Asset Access**: Public assets readable by all authenticated users

### 5.2 Function Security
- **SECURITY DEFINER**: Critical functions bypass RLS for safe execution
- **Role Validation**: Admin functions verify user roles before execution
- **Input Validation**: Functions validate parameters and user permissions

---

## 6. Performance Considerations

### 6.1 Indexes
- **User Lookups**: Email, referral code, role-based indexes
- **Asset Queries**: User ID, privacy, tags (GIN index)
- **NOK Operations**: DMS date, status, assignment tracking
- **Referral Processing**: Multi-level chain traversal optimization

### 6.2 Query Patterns
- **Dashboard Stats**: Aggregated counts via RPC functions
- **Real-time Updates**: Supabase subscriptions for live data
- **Batch Operations**: Mass assignment and bulk archiving

---

## 7. Storage Architecture

### 7.1 Supabase Storage Buckets
- **`assets`**: Public bucket for user media (photos, videos, PDFs)
- **`avatars`**: Public bucket for profile pictures
- **`business-documents`**: Private bucket for business verification
- **`bug-screenshots`**: Private bucket for bug report screenshots

### 7.2 Storage Policies
- **User Isolation**: Users can only access their own files
- **Admin Access**: Admin roles can access all files for moderation
- **Public Assets**: Public asset media accessible to all users

---

## 8. Integration Points

### 8.1 External Services
- **Stripe**: Payment processing for token purchases and subscriptions
- **Arweave**: Permanent asset archiving (300 TMT cost)
- **Resend**: Email service for NOK invitations
- **IP Geolocation**: Location detection for product scans

### 8.2 Edge Functions
- **`send-nok-invite`**: Email notifications for NOK nominations
- **`submit-bug-report`**: Bug report processing with screenshot upload
- **`verify-stripe-session`**: Payment verification and token allocation
- **`dms-checker`**: Scheduled Dead Man's Switch monitoring
- **`archive-monthly-batch`**: Batch archiving operations

---

## 9. Business Rules Summary

### 9.1 Token Economy
- **Signup Bonus**: 50 TMT (regular), 100 TMT (influencer)
- **Asset Tagging**: 5 TMT (photo), 7 TMT (video)
- **Archiving**: 300 TMT (Arweave permanent storage)
- **Referral Rewards**: 50, 30, 20, 10, 5 TMT (levels 1-5)

### 9.2 Dead Man's Switch
- **Default Period**: 1 year (configurable 1-5 years)
- **Trigger Condition**: `last_activity_at` < `dms_date`
- **Privacy Protection**: Asset details hidden until triggered
- **Reassignment**: NOKs can delegate to others

### 9.3 Business Features
- **Product Limits**: Based on subscription plan
- **QR Code Generation**: Automatic for registered products
- **Scan Tracking**: IP, location, device info logging
- **Counterfeit Detection**: Pattern analysis for suspicious activity

---

## 10. Recommendations for Optimization

### 10.1 Immediate Actions
1. **Remove Legacy Auth Components**: Clean up `Login.tsx`, `Signup.tsx`, etc.
2. **Consolidate Media Handling**: Migrate fully to `media_items` JSONB
3. **Clean Up Test Functions**: Remove debugging RPC functions from production

### 10.2 Performance Improvements
1. **Add Composite Indexes**: For complex queries involving multiple conditions
2. **Implement Caching**: For frequently accessed configuration data
3. **Optimize RPC Functions**: Reduce database round trips in complex operations

### 10.3 Security Enhancements
1. **Audit Trail Expansion**: Add more detailed logging for sensitive operations
2. **Rate Limiting**: Implement rate limits for expensive operations
3. **Input Sanitization**: Enhanced validation in RPC functions

---

## 11. Data Relationships Diagram

```
auth.users (Supabase)
    ↓ (1:1)
user_profiles
    ↓ (1:1)
user_wallets
    ↓ (1:many)
token_transactions

user_profiles
    ↓ (1:many)
assets
    ↓ (1:many)
asset_nok_assignments
    ↑ (many:1)
next_of_kin
    ↑ (many:1)
user_profiles

user_profiles
    ↓ (1:many as referrer)
referrals
    ↓ (1:many)
referral_rewards

user_profiles (business)
    ↓ (1:many)
products
    ↓ (1:many via serial_number)
scan_events
```

---

## 12. Current State Assessment

### 12.1 Schema Maturity
- **✅ Well-structured**: Clear separation of concerns
- **✅ Comprehensive**: Covers all application features
- **✅ Secure**: Robust RLS implementation
- **⚠️ Some Legacy**: Backward compatibility fields present

### 12.2 Code Quality
- **✅ TypeScript**: Strong typing throughout
- **✅ Custom Hooks**: Good abstraction of data operations
- **✅ Error Handling**: Comprehensive error management
- **⚠️ Some Duplication**: Legacy components still present

### 12.3 Migration History
- **35+ Migrations**: Extensive evolution history
- **Recent Fixes**: Column naming conflicts resolved
- **Schema Stability**: Current structure is stable and production-ready

---

## 13. Next Steps Recommendations

### 13.1 Database Cleanup
1. Apply the reset migration to start fresh
2. Remove unused test functions
3. Consolidate media handling approach

### 13.2 Code Optimization
1. Remove legacy authentication components
2. Standardize error handling patterns
3. Implement comprehensive testing suite

### 13.3 Feature Enhancements
1. Implement the streamlined NOK assignment flow
2. Add batch operations for asset management
3. Enhance business analytics dashboard

---

This analysis provides a complete picture of your TagMyThing data model and identifies areas for optimization while confirming the robust foundation you've built. The database is ready for the reset and subsequent fresh development.