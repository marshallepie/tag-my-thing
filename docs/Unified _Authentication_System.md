# Unified Authentication System - Migration Guide

## Overview
This migration simplifies your authentication system by implementing a flat role model where every user gets full referral privileges by default, eliminating the complex role hierarchy that was causing crashes.

## Key Changes

### 1. Unified User Profile Structure
**Before:** Multiple roles (`user`, `influencer`, `admin`, `moderator`, etc.) with different privileges
**After:** Single `standard` role with feature flags

```sql
-- Update user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS referral_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_referral_depth INTEGER DEFAULT 5;

-- Migrate existing users to unified system
UPDATE user_profiles 
SET 
  role = 'standard',
  referral_enabled = true,
  max_referral_depth = 5
WHERE role IN ('user', 'influencer');

-- Keep admin/moderator roles but give them referral access too
UPDATE user_profiles 
SET 
  referral_enabled = true,
  max_referral_depth = 5
WHERE role IN ('admin', 'moderator', 'admin_influencer');
```

### 2. Simplified Authentication Flow

#### AuthForm Changes:
- **Removed:** Complex role switching (`initialRole` prop)
- **Added:** `isBusinessSignup` flag for business features
- **Unified:** Single signup bonus (50 TMT for everyone)
- **Simplified:** Referral processing logic

#### useAuth Changes:
- **Removed:** Complex role hierarchy checks
- **Added:** Feature-based permissions (`hasReferralAccess`, `canModerate`, etc.)
- **Simplified:** Profile fetching with better error handling

### 3. Route Protection Updates

#### ProtectedRoute Changes:
- **Before:** `requiredRole="influencer"` for referral access
- **After:** All users have referral access by default
- **New:** Feature-based protection (`requiresBusinessFeatures`, `requiresAdmin`)

```typescript
// Before (complex)
<ProtectedRoute requiredRole="influencer">
  <ReferralDashboard />
</ProtectedRoute>

// After (simplified)
<ProtectedRoute>
  <ReferralDashboard />
</ProtectedRoute>

// Business features
<ProtectedRoute requiresBusinessFeatures>
  <BusinessDashboard />
</ProtectedRoute>
```

## Implementation Steps

### Step 1: Database Migration
```sql
-- Run this SQL migration
BEGIN;

-- Add new columns for unified system
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS referral_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_referral_depth INTEGER DEFAULT 5;

-- Migrate existing users
UPDATE user_profiles 
SET 
  role = CASE 
    WHEN role IN ('user', 'influencer') THEN 'standard'
    ELSE role 
  END,
  referral_enabled = true,
  max_referral_depth = 5;

-- Update referral transactions to be consistent
UPDATE token_transactions 
SET description = 'Referral reward'
WHERE source = 'referral' AND description LIKE '%Influencer%';

COMMIT;
```

### Step 2: Replace Components
Replace your existing auth components with the unified versions:

1. **AuthForm.tsx** → Use the unified version
2. **ProtectedRoute.tsx** → Use the simplified version  
3. **useAuth.ts** → Use the unified hook
4. **Auth.tsx** → Use the unified page

### Step 3: Update Route Definitions
```typescript
// Before
<Route path="/influencer-signup" element={<InfluencerAuth />} />
<Route path="/business-auth" element={<BusinessAuth />} />

// After (all routes use unified Auth component)
<Route path="/auth" element={<Auth />} />
<Route path="/signup" element={<Auth />} />
<Route path="/login" element={<Auth />} />
<Route path="/business-auth" element={<Auth />} />
<Route path="/influencer-signup" element={<Auth />} />
```

### Step 4: Update Referral Logic
```typescript
// Before: Check if user is "influencer"
if (userProfile.role === 'influencer') {
  // Process referral
}

// After: All users can refer
if (userProfile.referral_enabled) { // Always true
  // Process referral
}
```

### Step 5: Update UI Components
```typescript
// Before: Complex role-based rendering
{isInfluencer && <ReferralSection />}

// After: Always show (all users have referral access)
<ReferralSection />

// Business features still conditional
{isBusinessUser && <BusinessFeatures />}
```

## Benefits of Unified System

### 1. **Eliminates Crashes**
- No more complex role switching logic
- Simplified state management
- Cleaner error handling

### 2. **Better User Experience** 
- Every user can refer friends immediately
- No confusing "upgrade to influencer" flow
- Clearer feature boundaries

### 3. **Easier Maintenance**
- Single authentication flow
- Feature flags instead of roles
- Cleaner codebase

### 4. **Growth Friendly**
- Every user becomes a potential referrer
- Viral growth mechanics built-in
- Business features as add-ons

## Referral System Logic

### How It Works:
1. **User signs up** → Gets `standard` role + referral privileges
2. **With referral code** → Triggers referral chain processing
3. **Without referral code** → Still gets full account, `referred_by` is null
4. **All users** → Can generate referral links and earn from referrals

### Referral Chain Processing:
```typescript
// Simplified referral processing
const processReferral = async (referralCode: string, newUserId: string) => {
  // Find referrer (any user with referral_enabled = true)
  const referrer = await findUserByReferralCode(referralCode);
  
  if (referrer) {
    // Create referral link
    await createReferralConnection(referrer.id, newUserId);
    
    // Process rewards up the chain (max 5 levels)
    await processReferralRewards(newUserId, 5);
  }
};
```

## Testing Checklist

- [ ] New user signup (no referral) works
- [ ] New user signup (with referral) works
- [ ] Existing user login works
- [ ] Business signup works
- [ ] NOK invite acceptance works
- [ ] Referral rewards distribute correctly
- [ ] All users can access referral features
- [ ] Business users get business features
- [ ] Admin/moderator permissions still work

## Rollback Plan

If issues occur, you can rollback by:
1. Reverting to old components
2. Running reverse migration:
```sql
UPDATE user_profiles 
SET role = 'influencer' 
WHERE referral_enabled = true AND role = 'standard';
```

---

**Result:** A much simpler, crash-resistant authentication system where everyone gets referral privileges by default, with business features as optional upgrades.