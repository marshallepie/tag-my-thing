# Arweave Integration - Quick Reference

## 🎯 What Was Implemented

Real Arweave permanent storage integration using Turbo SDK to replace mock archiving system.

## 📦 Files Created/Modified

### New Files (3 Core + 3 Docs)
1. **`/src/lib/arweaveUploader.ts`** - Arweave utility library (316 lines)
2. **`/supabase/migrations/20251122000000_arweave_turbo_integration.sql`** - Database schema (287 lines)
3. **`/supabase/functions/upload-to-arweave/index.ts`** - Edge Function (142 lines)
4. **`ARWEAVE_INTEGRATION.md`** - Technical documentation
5. **`DEPLOYMENT_CHECKLIST.md`** - Deployment guide
6. **`IMPLEMENTATION_SUMMARY.md`** - Implementation summary

### Modified Files (3)
1. **`package.json`** - Added @ardrive/turbo-sdk, arweave, arbundles
2. **`.env`** - Added ARWEAVE_WALLET_KEY, TURBO_API_KEY variables
3. **`/src/pages/Assets.tsx`** - Updated archive functionality

## ⚙️ Key Features

- ✅ Real Arweave blockchain uploads (permanent storage)
- ✅ Free tier optimization (<100 KiB automatic compression)
- ✅ ViewBlock explorer integration for better UX
- ✅ Mock archive upgrade system (300 TMT to upgrade)
- ✅ Client-side encryption framework (AES-GCM 256-bit)
- ✅ Manifest bundling framework (cost optimization)
- ✅ 90-day backup retention with auto-cleanup
- ✅ Comprehensive upload tracking and logging

## 🚀 Deployment Commands

```bash
# 1. Database Migration
supabase db push --project-ref your-project-ref

# 2. Edge Function Deployment
supabase functions deploy upload-to-arweave
supabase secrets set ARWEAVE_WALLET_KEY="your_key"
supabase secrets set TURBO_API_KEY="your_key"

# 3. Frontend Build & Deploy
npm run build
# Deploy to hosting platform
```

## 🔑 Required Setup

### 1. Get Arweave Wallet
- Visit: https://arweave.app/
- Create wallet and save private key
- Fund with AR tokens for production

### 2. Get Turbo API Key (Optional)
- Visit: https://turbo.ardrive.io/
- Sign up and get API key
- Provides enhanced features

### 3. Update Environment Variables
```bash
# Add to .env
VITE_ARWEAVE_WALLET_KEY=your_private_key_here
ARWEAVE_WALLET_KEY=your_private_key_here
TURBO_API_KEY=your_api_key_here

# Set in Supabase Edge Functions
supabase secrets set ARWEAVE_WALLET_KEY="..."
supabase secrets set TURBO_API_KEY="..."
```

## 📊 Database Schema Changes

### New Tables (3)
- `encryption_keys` - User encryption key management
- `arweave_manifests` - Bundled asset tracking  
- `arweave_upload_log` - Upload history and monitoring

### New Columns on `assets` (11)
- `turbo_upload_id`, `arweave_data_item_id`, `upload_cost_winston`
- `encryption_key_id`, `encryption_iv`, `is_encrypted`
- `original_size_bytes`, `compressed_size_bytes`
- `manifest_id`, `backup_expires_at`, `archive_metadata`

### New Functions (2)
- `archive_tag_now_v2()` - Real Arweave upload with token deduction
- `cleanup_expired_backups()` - 90-day backup cleanup

## 🎨 UI Changes

### Archive Buttons
- **"Archive"** - For assets with `archive_status='pending'`
- **"Upgrade to Real Arweave"** - For `archive_status='upgrade_available'`
- **"View on Arweave"** - Opens ViewBlock explorer (better than raw Arweave URL)

### Archive Status Colors
- `archived` → Green
- `pending` → Yellow/Warning
- `uploading` → Blue (new)
- `upgrade_available` → Purple (new)
- `failed` → Red

## 💰 Token Economy

- **Archive Cost**: 300 TMT (unchanged)
- **Upgrade Cost**: 300 TMT (for mock archives)
- **Free Tier**: Files <100 KiB upload free to Arweave
- **Paid Uploads**: Files >100 KiB charged based on size

## 🔍 Monitoring

### Check Upload Success Rate
```sql
SELECT status, COUNT(*) as count
FROM arweave_upload_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

### Check Recent Uploads
```sql
SELECT a.title, al.arweave_tx_id, al.status, al.created_at
FROM arweave_upload_log al
JOIN assets a ON a.id = al.asset_id
ORDER BY al.created_at DESC
LIMIT 20;
```

### Edge Function Logs
```bash
supabase functions logs upload-to-arweave --tail
```

## 🧪 Testing Checklist

- [ ] Create new asset
- [ ] Archive to Arweave (verify 300 TMT deducted)
- [ ] Verify asset appears on ViewBlock
- [ ] Check database for upload_log entry
- [ ] Try upgrading a mock archive
- [ ] Verify "View on Arweave" button works
- [ ] Test with insufficient tokens (should fail gracefully)

## 🐛 Troubleshooting

### "Insufficient Balance" Error
- Check wallet balance: Visit arweave.app
- Fund wallet with AR tokens
- Verify ARWEAVE_WALLET_KEY is set correctly

### Edge Function Fails
- Check logs: `supabase functions logs upload-to-arweave`
- Verify secrets are set: `supabase secrets list`
- Test with curl command (see DEPLOYMENT_CHECKLIST.md)

### Upload Timeout
- Check file size (large files take longer)
- Verify Arweave network status
- Check Edge Function timeout settings

## 📚 Documentation Files

- **`ARWEAVE_INTEGRATION.md`** - Full technical guide
- **`DEPLOYMENT_CHECKLIST.md`** - Deployment steps
- **`IMPLEMENTATION_SUMMARY.md`** - What was built

## ✅ Status: Ready for Deployment

All code is complete. Follow DEPLOYMENT_CHECKLIST.md to deploy.

## 🎯 Next Phase (Phase 2)

1. Encryption UI for user key management
2. Manifest creation UI for bundling assets
3. Real-time upload progress bars
4. Batch archive operations
5. Download & decrypt archived assets
6. Turbo balance monitoring dashboard

## 📞 Support

- Arweave Discord: https://discord.gg/arweave
- Turbo SDK Issues: https://github.com/ardriveapp/turbo-sdk/issues
- Documentation: See ARWEAVE_INTEGRATION.md
