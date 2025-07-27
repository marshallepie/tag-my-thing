# Subscription System Evolution

## Overview
As of January 27, 2025, TagMyThing has evolved its subscription model to offer a hybrid approach: a token-based economy with a "Freemium" plan for personal users, plus paid business subscription plans for advanced features.

## Changes Made

### 1. Database Changes
- **Migration Applied**: `20250727085437_shy_wood.sql`
- Reintroduced paid subscription plans: `professional` and `enterprise`
- Legacy plans (`pro-monthly`, `pro-yearly`, `enterprise-monthly`, `enterprise-yearly`) have been deactivated
- Active plans: `freemium`, `professional`, `enterprise`
- Database constraint updated to allow all three plan types

### 2. Frontend Updates
- Removed subscription upgrade/downgrade UI elements
- Updated profile display to show only "Freemium" plan
- Simplified wallet and settings pages to focus on token economy
- Updated documentation and version information

### 3. Business Model
The hybrid model focuses on:
- **Freemium Plan**: Personal users get basic features with token-based access
- **Business Plans**: Professional and Enterprise subscriptions with monthly token allocations
- **Token Economy**: Users purchase TMT tokens for platform interactions
- **Referral System**: Influencers can earn tokens through referrals

## Benefits of the Hybrid Model

1. **Flexibility**: Personal users get simple token-based access, businesses get comprehensive plans
2. **Scalability**: Business plans provide monthly token allocations for high-volume usage
3. **Clear Segmentation**: Different plans for different user needs
4. **Flexible Monetization**: Pay-as-you-use token model

## Token Pricing Structure

### Asset Tagging Costs
- **Photo Tagging**: 5 TMT (2 TMT tagging + 3 TMT media upload)
- **Video Tagging**: 7 TMT (2 TMT tagging + 5 TMT media upload)

### Token Packages
- **Starter Pack**: 100 TMT for £1.00 / 750 XAF / 1,500 NGN
- **Power Pack**: 500 TMT for £4.50 / 3,375 XAF / 6,750 NGN
- **Mega Pack**: 5000 TMT for £39.99 / 29,992 XAF / 59,985 NGN

### Business Subscription Plans
- **Professional**: 1000 TMT/month for £8.00 / 6,000 XAF / 12,000 NGN
- **Enterprise**: 10000 TMT/month for £40.00 / 30,000 XAF / 60,000 NGN

### Free Token Allocation
- **Regular Users**: 50 TMT welcome bonus
- **Influencers**: 100 TMT welcome bonus
- **Business Users**: 50 TMT welcome bonus + business features
- **Referral Rewards**: Up to 115 TMT per successful referral chain (5 levels)

## Required Manual Actions

### 1. Stripe Dashboard
- [ ] Ensure business subscription products are active in Stripe dashboard
- [ ] Verify token purchase products are active
- [ ] Archive legacy subscription products (pro-monthly, pro-yearly, etc.)

### 2. Supabase Backend Verification
- [ ] Verify business subscription Edge Functions are working
- [ ] Check subscription-related database triggers for business plans
- [ ] Confirm subscription webhook handlers for business plans are active

### 3. Monitoring
- [ ] Monitor business subscription signup and billing flows
- [ ] Verify users can upgrade to business plans
- [ ] Test both token purchase and subscription flows

## Migration Verification

After applying the migration, verify:

```sql
-- Check active plans
SELECT name, active FROM subscription_plans ORDER BY name;

-- Verify user plan distribution
SELECT subscription_plan, COUNT(*) FROM user_profiles GROUP BY subscription_plan;

-- Should return freemium, professional, enterprise
```

## Rollback Plan (If Needed)

If you need to rollback this change:

1. Set subscription plans back to active:
```sql
UPDATE subscription_plans SET active = false WHERE name IN ('professional', 'enterprise');
```

2. Migrate users back to freemium:
```sql
UPDATE user_profiles SET subscription_plan = 'freemium' WHERE subscription_plan IN ('professional', 'enterprise');
```

3. Update constraint to freemium-only:
```sql
ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_subscription_plan_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_plan_check CHECK (subscription_plan = 'freemium');
```

## Support Impact

- Customer support queries will include both token purchases and business subscriptions
- Support team needs training on business plan features and billing
- Clear documentation needed for plan differences and upgrade paths

---

**Note**: This hybrid model provides flexibility for personal users while offering comprehensive business solutions with predictable monthly costs.