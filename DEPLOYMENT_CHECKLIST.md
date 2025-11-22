# Arweave Integration Deployment Checklist

## Pre-Deployment Preparation

### ✅ Development Environment
- [x] Install dependencies (@ardrive/turbo-sdk, arweave, arbundles)
- [x] Create arweaveUploader.ts utility library
- [x] Create database migration SQL file
- [x] Create Edge Function for uploads
- [x] Update Assets.tsx frontend
- [x] Add ViewBlock URL integration
- [x] Update archive status types

### ⏳ Environment Configuration
- [ ] Generate Arweave wallet at https://arweave.app/
- [ ] Fund wallet with AR tokens for production use
- [ ] Get Turbo API key from https://turbo.ardrive.io/ (optional)
- [ ] Add VITE_ARWEAVE_WALLET_KEY to .env
- [ ] Add ARWEAVE_WALLET_KEY to .env
- [ ] Add TURBO_API_KEY to .env (optional)

### ⏳ Database Setup
- [ ] Review migration file: `supabase/migrations/20251122000000_arweave_turbo_integration.sql`
- [ ] Backup production database before migration
- [ ] Run migration on staging database first
- [ ] Verify all tables and columns created
- [ ] Test RLS policies work correctly
- [ ] Run migration on production database
- [ ] Verify existing assets not affected

### ⏳ Edge Function Deployment
- [ ] Test Edge Function locally with Supabase CLI
- [ ] Deploy to staging: `supabase functions deploy upload-to-arweave --project-ref staging`
- [ ] Set secrets in staging: `supabase secrets set ARWEAVE_WALLET_KEY=xxx --project-ref staging`
- [ ] Set secrets in staging: `supabase secrets set TURBO_API_KEY=xxx --project-ref staging`
- [ ] Test upload in staging environment
- [ ] Deploy to production: `supabase functions deploy upload-to-arweave --project-ref production`
- [ ] Set secrets in production: `supabase secrets set ARWEAVE_WALLET_KEY=xxx --project-ref production`
- [ ] Set secrets in production: `supabase secrets set TURBO_API_KEY=xxx --project-ref production`

## Deployment Steps

### Step 1: Database Migration
```bash
# Option A: Using Supabase CLI
cd supabase
supabase db push --project-ref your-project-ref

# Option B: Manual SQL execution
psql your_production_database_url < migrations/20251122000000_arweave_turbo_integration.sql
```

**Verification:**
```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('encryption_keys', 'arweave_manifests', 'arweave_upload_log');

-- Check new columns on assets table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'assets' 
AND column_name IN ('turbo_upload_id', 'arweave_data_item_id', 'encryption_key_id');

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('archive_tag_now_v2', 'cleanup_expired_backups');
```

### Step 2: Edge Function Deployment
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy Edge Function
supabase functions deploy upload-to-arweave

# Set environment secrets
supabase secrets set ARWEAVE_WALLET_KEY="your_wallet_private_key"
supabase secrets set TURBO_API_KEY="your_turbo_api_key"

# Verify deployment
supabase functions list
```

**Test Edge Function:**
```bash
# Get auth token
TOKEN=$(supabase auth token)

# Test upload (replace with real asset ID)
curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/upload-to-arweave \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetId": "test-asset-id", "enableCompression": true, "enableEncryption": false}'
```

### Step 3: Frontend Deployment
```bash
# Build production bundle
npm run build

# Test build locally
npm run preview

# Deploy to hosting (Vercel/Netlify/etc)
# Ensure environment variables are set in hosting platform:
# - VITE_ARWEAVE_WALLET_KEY
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### Step 4: Schedule Backup Cleanup
```sql
-- Using pg_cron extension
SELECT cron.schedule(
  'cleanup-expired-backups',
  '0 2 * * *', -- 2 AM daily
  $$SELECT cleanup_expired_backups()$$
);

-- Verify cron job
SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-backups';
```

## Post-Deployment Verification

### ⏳ Functional Testing
- [ ] Create new asset in production
- [ ] Archive asset to Arweave (verify 300 TMT deducted)
- [ ] Verify transaction appears on ViewBlock
- [ ] Verify asset archive_status changes to 'archived'
- [ ] Verify arweave_tx_id is populated
- [ ] Click "View on Arweave" button
- [ ] Verify asset accessible on Arweave gateway
- [ ] Check database for upload_log entry

### ⏳ Mock Archive Upgrade Testing
- [ ] Find asset with archive_status='upgrade_available'
- [ ] Click "Upgrade to Real Arweave" button
- [ ] Verify 300 TMT deducted
- [ ] Verify new arweave_tx_id replaces mock ID
- [ ] Verify old mock tx_id replaced with real one
- [ ] Verify upload_log shows upgrade

### ⏳ Error Handling Testing
- [ ] Test archive with insufficient tokens (should fail gracefully)
- [ ] Test archive with invalid asset ID (should show error)
- [ ] Test archive without authentication (should require login)
- [ ] Test upload of large file >100 KiB (should charge appropriately)
- [ ] Test Edge Function timeout (should retry)

### ⏳ Monitoring Setup
- [ ] Set up Turbo balance monitoring
- [ ] Create alert for low wallet balance
- [ ] Monitor Edge Function logs for errors
- [ ] Track upload success rate
- [ ] Monitor database backup storage size
- [ ] Set up daily backup cleanup verification

## Rollback Plan

### If Critical Issues Occur:

**1. Disable Archive Feature:**
```typescript
// In Assets.tsx, temporarily hide archive buttons
{false && asset.archive_status === 'pending' && (
  <Button>Archive</Button>
)}
```

**2. Rollback Edge Function:**
```bash
supabase functions delete upload-to-arweave
```

**3. Rollback Database Migration:**
```sql
-- Drop new tables
DROP TABLE IF EXISTS arweave_upload_log CASCADE;
DROP TABLE IF EXISTS arweave_manifests CASCADE;
DROP TABLE IF EXISTS encryption_keys CASCADE;

-- Drop new functions
DROP FUNCTION IF EXISTS archive_tag_now_v2(uuid);
DROP FUNCTION IF EXISTS cleanup_expired_backups();

-- Remove new columns (CAREFUL - verify no production data first)
ALTER TABLE assets 
  DROP COLUMN IF EXISTS turbo_upload_id,
  DROP COLUMN IF EXISTS arweave_data_item_id,
  DROP COLUMN IF EXISTS upload_cost_winston,
  DROP COLUMN IF EXISTS archive_metadata,
  DROP COLUMN IF EXISTS encryption_key_id,
  DROP COLUMN IF EXISTS encryption_iv,
  DROP COLUMN IF EXISTS is_encrypted,
  DROP COLUMN IF EXISTS original_size_bytes,
  DROP COLUMN IF EXISTS compressed_size_bytes,
  DROP COLUMN IF EXISTS manifest_id,
  DROP COLUMN IF EXISTS backup_expires_at;

-- Revert archive_status enum (if needed)
-- This is complex and may require data migration
```

**4. Revert Frontend:**
```bash
git revert <commit-hash>
npm run build
# Deploy reverted version
```

## Monitoring Commands

### Check Turbo Balance
```typescript
// In browser console on production site
const { getTurboBalance } = await import('./lib/arweaveUploader');
const balance = await getTurboBalance();
console.log('Balance:', balance);
```

### Monitor Upload Success Rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM arweave_upload_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

### Check Recent Uploads
```sql
SELECT 
  al.asset_id,
  a.title,
  al.turbo_upload_id,
  al.arweave_tx_id,
  al.status,
  al.upload_cost_winston,
  al.created_at
FROM arweave_upload_log al
JOIN assets a ON a.id = al.asset_id
ORDER BY al.created_at DESC
LIMIT 20;
```

### Monitor Backup Storage
```sql
SELECT 
  COUNT(*) as pending_cleanup,
  pg_size_pretty(SUM(original_size_bytes)::bigint) as total_size,
  MIN(backup_expires_at) as oldest_expiration,
  MAX(backup_expires_at) as newest_expiration
FROM assets
WHERE backup_expires_at IS NOT NULL 
AND backup_expires_at > NOW();
```

### Edge Function Logs
```bash
# Real-time logs
supabase functions logs upload-to-arweave --tail

# Last 100 entries
supabase functions logs upload-to-arweave --limit 100

# Filter for errors
supabase functions logs upload-to-arweave | grep ERROR
```

## Support Resources

- **Arweave Discord**: https://discord.gg/arweave
- **Supabase Discord**: https://discord.supabase.com
- **Turbo SDK Issues**: https://github.com/ardriveapp/turbo-sdk/issues
- **Documentation**: See ARWEAVE_INTEGRATION.md

## Success Criteria

- ✅ All mock archives marked as 'upgrade_available'
- ✅ New archives upload to real Arweave
- ✅ ViewBlock links work correctly
- ✅ Token deduction (300 TMT) works properly
- ✅ No errors in Edge Function logs
- ✅ Upload success rate >95%
- ✅ Backup cleanup runs daily without errors
- ✅ User can view archived assets on Arweave
- ✅ Database migration completes without data loss

## Notes
- First 7 days: Monitor closely for any issues
- Week 2-4: Optimize based on usage patterns
- Month 2+: Consider Phase 2 enhancements (encryption UI, manifest bundling)
