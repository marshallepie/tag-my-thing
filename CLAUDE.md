# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TagMyThing is a React/TypeScript application for documenting and protecting valuable items (physical/digital) with legacy planning features. Built on Vite + React with Supabase (PostgreSQL) backend, featuring:

- **Asset tagging** with photo/video capture and blockchain archiving (Arweave)
- **TMT token economy** - pay-per-use model (25 TMT/photo, 60 TMT/video)
- **5-level referral system** with automatic reward distribution
- **Next-of-Kin (NOK) management** with Dead Man's Switch protection
- **Business features** - QR code product verification for authenticated businesses
- **Internationalization** - i18next with English and French support

## Development Commands

```bash
# Development
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Testing
npm run test             # Run all tests (unit + e2e)
npm run test:unit        # Run Jest unit tests only
npm run test:e2e         # Run Cypress e2e tests headless
npm run test:e2e:open    # Open Cypress interactive test runner

# Database (requires Supabase CLI)
supabase db reset        # Reset local database and run all migrations
supabase db push         # Push migrations to remote Supabase instance
supabase migration new <name>  # Create new migration file
```

## High-Level Architecture

### Frontend Structure

**Entry Point & Routing** (`src/App.tsx`):
- All pages lazy-loaded via `React.lazy()` for performance
- Three route types: public (landing, auth), protected (dashboard, assets), role-gated (admin, business)
- Uses `<ProtectedRoute>` wrapper with props: `requiresAdmin`, `requiresModeration`, `requiresBusinessFeatures`

**State Management**:
- Custom React hooks (no external state library like Redux)
- `useAuth` - Central authentication and user profile state
- `useTokens` - Wallet balance and transaction management
- `useReferrals` - Referral chain tracking and reward calculations
- `useNOKAssignments` - Next-of-kin assignment lifecycle
- `useGeolocation` - GPS location capture with permissions

**Component Patterns**:
- Path alias `@/` maps to `src/` (configured in `vite.config.ts`)
- Base UI components in `src/components/ui/` (Button, Card, Modal, Input)
- Feature-specific components in `src/components/<feature>/`
- Modals follow consistent structure from `src/components/modals/`

### Backend Architecture (Supabase)

**Authentication**:
- Email/password + phone OTP authentication via Supabase Auth
- Profile sync trigger automatically creates `user_profiles` entry on signup
- Phone numbers synced between `auth.users` and `user_profiles.phone_number`
- Session persists in localStorage with auto-refresh tokens

**Database Layer**:
- **35+ migrations** in `supabase/migrations/` - always use Supabase CLI for changes
- **Row Level Security (RLS)** on all tables - policies enforce user isolation
- **Database types** auto-generated in `src/types/database.ts`
- **Database client** configured in `src/lib/supabase.ts` with PKCE auth flow

**Key Database Tables**:
- `user_profiles` - Extended user data (role, business flags, referral codes, last_activity_at)
- `user_wallets` - TMT token balances (never modify directly, use transactions)
- `token_transactions` - Audit trail for all token movements
- `assets` - Tagged items with media, blockchain hashes, GPS coordinates
- `next_of_kin` - NOK contact information
- `asset_nok_assignments` - Assignments with DMS dates and status
- `referrals` - 5-level referral chain relationships
- `referral_rewards` - Token reward distribution records
- `business_products` - QR-scannable product registry (business users only)

### Critical Business Logic

**Token System**:
- All token movements MUST go through `token_transactions` table
- Never directly update `user_wallets.balance` (violates audit trail)
- Use `useTokens` hook methods: `spendTokens()`, `earnTokens()`
- Signup bonus: 50 TMT (handled by database trigger)

**5-Level Referral System**:
- Rewards: L1: 50 TMT, L2: 30 TMT, L3: 20 TMT, L4: 10 TMT, L5: 5 TMT
- Fallback: If referrer not found, assigns to Marshall Epie (marshallepie@marshallepie.com)
- Database function `apply_referral_code(new_user_id, ref_code)` handles chain traversal
- Rewards processed automatically via database triggers

**Next-of-Kin & Dead Man's Switch**:
- **Incoming assignments**: Assets where YOU are designated as someone's NOK
- **Outgoing assignments**: Assets YOU assigned to others as NOK
- **Privacy protection**: NOK sees assignment exists but NOT asset details until DMS triggers
- **DMS trigger**: User inactivity (1-5 years) → `access_granted_at` set → NOK gains asset access
- **Activity tracking**: `last_activity_at` updated via `update_user_activity()` RPC function
- Mass assignment feature allows assigning all assets to one NOK at once

**GPS Location System**:
- Dual tracking: Manual `location` (text field) + GPS coordinates (`asset_latitude`/`asset_longitude`)
- Permission flow: `<LocationPermissionModal>` → `useGeolocation` hook → Google Maps reverse geocoding
- Location captured at asset tagging time, stored per-asset

**Role Hierarchy**:
- `standard` (default) → `moderator` → `admin`
- Admins inherit all moderator permissions
- Business features controlled by `is_business_user` flag (independent of role)
- Check via `useAuth` hook: `isAdmin`, `isModerator`, `isBusinessUser`, `canModerate`, `canAdmin`

## Common Patterns

### Authentication Flows

**Protected Page Access**:
```tsx
// Basic protection (logged-in users only)
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Admin-only access
<Route path="/admin" element={
  <ProtectedRoute requiresAdmin={true}>
    <AdminPanel />
  </ProtectedRoute>
} />

// Business features
<Route path="/business-dashboard" element={
  <ProtectedRoute requiresBusinessFeatures={true}>
    <BusinessDashboard />
  </ProtectedRoute>
} />
```

### Database Queries

**Always use Supabase client from `src/lib/supabase.ts`**:
```ts
import { supabase } from '@/lib/supabase';

// RLS automatically filters to current user
const { data, error } = await supabase
  .from('assets')
  .select('*')
  .eq('user_id', userId);
```

**Calling database functions**:
```ts
// Update user activity for DMS tracking
await supabase.rpc('update_user_activity');

// Apply referral code (returns reward details)
const { data } = await supabase.rpc('apply_referral_code', {
  new_user_id: userId,
  ref_code: code
});
```

### File Uploads (Arweave Integration)

**Asset archiving** via `src/lib/arweaveUploader.ts`:
- Images auto-compressed to <100KB for free Arweave tier
- Returns `arweave_tx_id` for permanent storage
- Client-side encryption utilities available in same module

### Error Handling

- Use `react-hot-toast` for all user-facing notifications
- Database errors: Log full error to console, show friendly message to user
- Auth errors: Redirect to `/auth` with error state
- Token validation: Always check balance before operations

### Internationalization

**Using translations**:
```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<h1>{t('common.welcome')}</h1>
```

**Adding translations**:
- English: `src/locales/en/common.json`
- French: `src/locales/fr/common.json`
- Configuration: `src/lib/i18n.ts`

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_GOOGLE_MAPS_API_KEY=<for-gps-reverse-geocoding>
```

## Security Considerations

- **RLS policies** enforce all data access - test thoroughly when modifying
- **Token transactions** must maintain audit trail - never bypass
- **Phone number validation** - numeric-only, uniqueness enforced
- **Business verification** - check `is_business_user` flag before allowing business features
- **NOK privacy** - asset details hidden until `access_granted_at` is set

## Testing Strategy

- **Unit tests** (Jest + React Testing Library): Custom hooks and utilities
- **E2E tests** (Cypress): Auth flows, asset tagging, referral chains, token spending
- **Manual QA checklist** in `README.md` (lines 389-468) covers critical user journeys

## Important Notes

- **Never modify `user_wallets.balance` directly** - always use `token_transactions` table
- **Referral code parameter**: URL param `?ref=<code>` is captured and processed during signup
- **Database migrations**: Always use Supabase CLI, never manual SQL in production
- **Asset deletion**: Triggers automatic token refund (reverse transaction)
- **Profile cache**: `useAuth` implements request deduplication to prevent redundant profile fetches

## Key Files Reference

- `src/App.tsx` - Route definitions and lazy loading
- `src/hooks/useAuth.ts` - Authentication state and role checks
- `src/lib/supabase.ts` - Database client configuration
- `DATABASE_SCHEMA.md` - Complete table structure and relationships
- `.github/copilot-instructions.md` - Additional development context
