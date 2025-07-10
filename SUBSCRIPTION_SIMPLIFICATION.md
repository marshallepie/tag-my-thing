# Subscription System Simplification

## Overview
As of January 10, 2025, TagMyThing has simplified its subscription model to focus exclusively on a token-based economy with a single "Freemium" plan.

## Changes Made

### 1. Database Changes
- **Migration Applied**: `20250110120000_simplify_subscriptions.sql`
- All paid subscription plans (`pro-monthly`, `pro-yearly`, `enterprise-monthly`, `enterprise-yearly`) have been set to `active = false`
- All existing users have been migrated to the `freemium` plan
- Database constraint updated to only allow `freemium` as a valid subscription plan

### 2. Frontend Updates
- Removed subscription upgrade/downgrade UI elements
- Updated profile display to show only "Freemium" plan
- Simplified wallet and settings pages to focus on token economy
- Updated documentation and version information

### 3. Business Model
The new simplified model focuses on:
- **Single Plan**: Everyone uses the "Freemium" plan
- **Token Economy**: Users purchase TMT tokens for platform interactions
- **Referral System**: Influencers can earn tokens through referrals
- **No Recurring Subscriptions**: Eliminates subscription management complexity

## Benefits of Simplification

1. **Reduced Complexity**: Eliminates subscription tiers and billing cycles
2. **Better User Experience**: Clear, simple pricing model
3. **Lower Maintenance**: No subscription renewal logic or billing management
4. **Flexible Monetization**: Pay-as-you-use token model
5. **Easier Onboarding**: Single plan removes decision paralysis

## Token Pricing Structure

### Asset Tagging Costs
- **Photo Tagging**: 5 TMT (2 TMT tagging + 3 TMT media upload)
- **Video Tagging**: 7 TMT (2 TMT tagging + 5 TMT media upload)

### Token Packages
- **Starter Pack**: 100 TMT for £1.00 / 500 XAF
- **Value Pack**: 250 + 25 bonus TMT for £2.50 / 1,250 XAF
- **Power Pack**: 500 + 75 bonus TMT for £4.50 / 2,250 XAF
- **Mega Pack**: 1000 + 200 bonus TMT for £7.99 / 4,000 XAF

### Free Token Allocation
- **New Users**: 50 TMT welcome bonus
- **Influencers**: 100 TMT welcome bonus
- **Referral Rewards**: Up to 115 TMT per successful referral chain (5 levels)

## Required Manual Actions

### 1. Stripe Dashboard
- [ ] Archive all subscription products in Stripe dashboard
- [ ] Disable recurring billing for existing subscriptions
- [ ] Keep token purchase products active

### 2. Supabase Backend Verification
- [ ] Check for subscription renewal Edge Functions and remove if found
- [ ] Verify no subscription-related database triggers exist
- [ ] Confirm no subscription webhook handlers are active

### 3. Monitoring
- [ ] Monitor for any subscription-related errors in logs
- [ ] Verify all users are successfully on freemium plan
- [ ] Test token purchase flow continues to work

## Migration Verification

After applying the migration, verify:

```sql
-- Check all plans are inactive except freemium
SELECT name, active FROM subscription_plans ORDER BY name;

-- Verify all users are on freemium
SELECT DISTINCT subscription_plan FROM user_profiles;

-- Should return only 'freemium'
```

## Rollback Plan (If Needed)

If you need to rollback this change:

1. Set subscription plans back to active:
```sql
UPDATE subscription_plans SET active = true WHERE name != 'freemium';
```

2. Remove the subscription plan constraint:
```sql
ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_subscription_plan_check;
```

3. Restore subscription UI components from git history

## Support Impact

- Customer support queries about subscription billing should decrease
- Focus support on token purchases and referral system
- Simplified pricing explanations for users

---

**Note**: This change aligns TagMyThing with a simpler, more scalable business model focused on usage-based pricing rather than subscription tiers.