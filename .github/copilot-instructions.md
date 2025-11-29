# TagMyThing AI Agent Instructions

## Project Overview
TagMyThing is a **React/TypeScript** app for documenting and protecting valuable items (physical/digital) with a focus on legacy planning. It uses **Supabase** backend with **PostgreSQL**, features GPS tracking, **TMT token economy**, **5-level referral system**, and **Next-of-Kin (NOK) management** with Dead Man's Switch protection.

## Key Architecture Patterns

### Database Layer
- **Supabase client**: Import from `src/lib/supabase.ts` - pre-configured with RLS
- **Row Level Security**: All tables enforce user isolation automatically
- **Database schema**: 35+ migrations in `supabase/migrations/` - use `npm run db:push` to sync
- **TypeScript types**: Auto-generated in `src/types/database.ts` from schema

### Authentication & Authorization  
- **useAuth hook** (`src/hooks/useAuth.ts`): Central auth state management
- **Role hierarchy**: `standard → moderator → admin` (admin inherits all permissions)
- **Business users**: `is_business_user` flag for product verification features
- **Protected routes**: Use `ProtectedRoute` wrapper with role requirements like `requiresAdmin={true}`

### Component Architecture
- **Lazy loading**: All pages use `React.lazy()` in `App.tsx`
- **Custom hooks**: Prefix with `use` (e.g., `useTokens`, `useGeolocation`, `useReferrals`)
- **Modal patterns**: Check `src/components/modals/` for consistent modal structure
- **UI components**: Base components in `src/components/ui/` (Button, Card, Modal)

### Key Business Logic

#### Token System (TMT)
- **Costs**: 25 TMT per photo, 60 TMT per video tag
- **Free credits**: 50 TMT on signup for all users
- **Transaction logging**: Use `token_transactions` table for all movements - never modify `user_wallets.balance` directly

#### Referral System (5-Level Deep)
- **Rewards**: Level 1: 50 TMT, Level 2: 30 TMT, Level 3: 20 TMT, Level 4: 10 TMT, Level 5: 5 TMT  
- **Fallback logic**: If referrer not found, assigns to Marshall Epie (`marshallepie@marshallepie.com`)
- **Database**: `referrals` tracks relationships, `referral_rewards` records token distributions

#### Next-of-Kin (NOK) & Dead Man's Switch
- **Dual assignment types**: `incoming_nok_assignments` (assigned TO you) vs `outgoing_nok_assignments` (you assigned to others)
- **Privacy protection**: NOK sees assignment exists but not asset details until DMS triggers
- **Critical fields**: `dms_date`, `access_granted_at`, `last_activity_at` for time-based access control

#### GPS Location System
- **Dual location tracking**: Manual item location (text) + automatic GPS coordinates (with permission)
- **Permission flow**: `LocationPermissionModal` during auth → `useGeolocation` hook → Google Maps reverse geocoding
- **Database fields**: `asset_latitude/longitude` for tagging location, separate from manual `location` description

## Development Workflows

### Database Changes
```bash
# Create migration (always use Supabase CLI)
supabase migration new descriptive_name

# Apply locally
supabase db reset

# Push to remote
supabase db push
```

### Key Commands
```bash
npm run dev          # Vite dev server
npm run build        # Production build  
npm run test         # Jest + React Testing Library
npm run test:e2e     # Cypress end-to-end tests
```

### Critical Files to Understand
- `src/App.tsx`: Route definitions and lazy loading patterns
- `src/hooks/useAuth.ts`: Authentication state management and role checking
- `src/lib/supabase.ts`: Database client configuration
- `DATABASE_SCHEMA.md`: Complete table structure and relationships
- `DEVELOPMENT.md`: Comprehensive technical documentation

## Common Patterns & Conventions

### Error Handling
- Use `react-hot-toast` for user notifications
- Database errors: Log to console, show user-friendly messages
- Auth errors: Redirect to `/auth` with appropriate error state

### File Uploads
- **Arweave integration**: Use `src/lib/arweaveUploader.ts` for blockchain storage
- **Image compression**: Auto-compress to <100KB for free tier
- **Client-side encryption**: Built-in encryption utilities available

### Testing Approach
- **Manual QA**: Follow `Test-Guide.md` for comprehensive testing scenarios
- **E2E tests**: Critical flows in `cypress/e2e/` (auth, tagging, referrals)
- **Unit tests**: Focus on custom hooks and utility functions

## Business Context
- **Target users**: Individuals for legacy planning, businesses for product verification
- **Revenue model**: Pay-per-use (TMT tokens), no monthly subscriptions  
- **MVP focus**: Asset documentation, NOK assignments, referral growth

## Environment Setup
- **Supabase**: Database + Auth + Storage (see `VITE_SUPABASE_*` env vars)
- **Google Maps**: For GPS reverse geocoding (`VITE_GOOGLE_MAPS_API_KEY`)
- **Stripe**: Token purchases (development keys in staging)

When making changes, prioritize **data integrity** (especially token transactions), **user privacy** (RLS policies), and **referral accuracy** (5-level calculations). Always test auth flows and database migrations thoroughly.