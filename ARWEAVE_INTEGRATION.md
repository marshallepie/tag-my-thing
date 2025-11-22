# Arweave Permanent Storage Integration

## Overview

Tag My Thing now integrates with Arweave blockchain for permanent, immutable storage of archived assets using the Turbo SDK. This provides users with guaranteed permanent storage of their important assets on the Arweave blockchain.

## Features

### Core Functionality
- **Real Arweave Uploads**: Assets are uploaded to Arweave blockchain with guaranteed permanence
- **Turbo SDK Integration**: Production-ready bundling service for reliable uploads
- **Free Tier Optimization**: Automatic compression to target <100 KiB for free uploads
- **Client-Side Encryption**: Optional AES-GCM 256-bit encryption with user-controlled keys
- **Manifest Bundling**: Group related assets into Arweave manifests for cost optimization
- **90-Day Backup Retention**: Automatic backup cleanup after successful Arweave upload

### Migration Strategy (Option C)
- Existing mock archives marked as `upgrade_available`
- Users can upgrade mock archives to real Arweave storage for 300 TMT
- "Upgrade to Real Arweave" button visible on assets with `upgrade_available` status

## Architecture

### Frontend Components

#### `/src/lib/arweaveUploader.ts`
Comprehensive utility library for Arweave operations:

**Encryption Functions:**
- `generateEncryptionKey()`: Create AES-GCM 256-bit encryption keys
- `encryptData()`: Encrypt data before upload
- `decryptData()`: Decrypt downloaded data
- `exportKey()`: Export encryption keys for storage
- `importKey()`: Import stored encryption keys

**Upload Functions:**
- `uploadToArweave()`: Main upload function with progress callbacks
- `compressImage()`: Automatic image optimization for free tier
- `calculateArweaveCost()`: Estimate upload costs in Winston
- `createArweaveManifest()`: Bundle multiple assets into manifest

**Utility Functions:**
- `getArweaveUrl()`: Generate Arweave gateway URL
- `getViewBlockUrl()`: Generate ViewBlock explorer URL for better UX
- `getTurboBalance()`: Check remaining Turbo balance

#### `/src/pages/Assets.tsx`
Updated to support real Arweave uploads:

**Key Changes:**
- `handleArchiveAsset()`: Now calls Edge Function instead of mock RPC
- Archive buttons updated to show "Upgrade to Real Arweave" for mock archives
- ViewBlock links for better transaction viewing experience
- New archive statuses: `uploading`, `upgrade_available`

### Backend Components

#### `/supabase/migrations/20251122000000_arweave_turbo_integration.sql`
Database schema updates:

**New Columns on `assets` table:**
- `turbo_upload_id`: Turbo SDK upload identifier
- `arweave_data_item_id`: Arweave data item ID
- `upload_cost_winston`: Cost in Winston units
- `archive_metadata`: JSON metadata about upload
- `encryption_key_id`: Reference to encryption key
- `encryption_iv`: Initialization vector for decryption
- `is_encrypted`: Boolean flag for encrypted assets
- `original_size_bytes`: Original file size
- `compressed_size_bytes`: Compressed file size
- `manifest_id`: Reference to Arweave manifest
- `backup_expires_at`: Backup expiration timestamp

**New Tables:**
- `encryption_keys`: User encryption keys with NOK/DMS support
- `arweave_manifests`: Track bundled asset manifests
- `arweave_upload_log`: Comprehensive upload history

**New Functions:**
- `archive_tag_now_v2()`: RPC function for real Arweave uploads with token deduction
- `cleanup_expired_backups()`: Scheduled function for 90-day backup cleanup

#### `/supabase/functions/upload-to-arweave/index.ts`
Edge Function for server-side Arweave uploads:

**Features:**
- User authentication via JWT
- Asset validation and ownership check
- File download from Supabase Storage
- Optional compression and encryption
- Turbo SDK upload with metadata tags
- Database update via `archive_tag_now_v2()` RPC
- Comprehensive error handling and logging

## Setup Instructions

### 1. Environment Configuration

Add the following to your `.env` file:

```bash
# Arweave Wallet Configuration
# Generate a wallet at https://arweave.app/
VITE_ARWEAVE_WALLET_KEY=your_arweave_wallet_private_key_here
ARWEAVE_WALLET_KEY=your_arweave_wallet_private_key_here

# Turbo API Key (optional, for enhanced features)
# Get from https://turbo.ardrive.io/
TURBO_API_KEY=your_turbo_api_key_here
```

### 2. Database Migration

Run the migration to update your database schema:

```bash
cd supabase
supabase db push
```

Or manually run the SQL file:
```bash
psql your_database_url < migrations/20251122000000_arweave_turbo_integration.sql
```

### 3. Deploy Edge Function

Deploy the upload-to-arweave Edge Function:

```bash
supabase functions deploy upload-to-arweave
```

Set the required environment variables for the Edge Function:

```bash
supabase secrets set ARWEAVE_WALLET_KEY=your_wallet_key
supabase secrets set TURBO_API_KEY=your_turbo_api_key
```

### 4. Install Dependencies

Dependencies are already installed:
```bash
npm install @ardrive/turbo-sdk arweave arbundles
```

### 5. Configure Scheduled Backup Cleanup

Set up a cron job or scheduled task to run the backup cleanup function:

```sql
-- Run daily at 2 AM
SELECT cron.schedule(
  'cleanup-expired-backups',
  '0 2 * * *',
  $$SELECT cleanup_expired_backups()$$
);
```

## Usage

### Archiving an Asset

1. Navigate to the Assets page
2. Find the asset you want to archive
3. Click the "Archive" button (costs 300 TMT)
4. The asset will be uploaded to Arweave via the Edge Function
5. Once complete, a "View on Arweave" button will appear

### Upgrading Mock Archives

1. Assets with mock archives show "Upgrade to Real Arweave" button
2. Click the upgrade button (costs 300 TMT)
3. The mock archive is replaced with a real Arweave upload
4. The asset receives a real Arweave transaction ID

### Viewing Archived Assets

Click "View on Arweave" to open the asset in ViewBlock explorer for:
- Transaction details
- Block confirmation
- Data preview
- Network statistics

## Cost Optimization

### Free Tier Strategy (<100 KiB)
- Images are automatically compressed to target <100 KiB
- Free uploads via `TurboFactory.unauthenticated()`
- No wallet funding required for small files

### Paid Uploads (>100 KiB)
- Larger files require funded Arweave wallet
- Costs calculated in Winston (1 AR = 10^12 Winston)
- Display cost estimate before upload
- Automatic retry with exponential backoff

### Manifest Bundling
- Group related assets into single manifest
- Reduces transaction fees for multiple assets
- Creates folder-like structure on Arweave
- Single transaction ID for entire bundle

## Security

### Client-Side Encryption
- AES-GCM 256-bit encryption before upload
- User controls encryption keys (stored in database)
- Keys encrypted with user's authentication
- NOK can access via Dead Man's Switch reveal

### Privacy Options
- Private assets encrypted by default
- Public assets uploaded without encryption
- Encryption keys never transmitted to Arweave
- Encrypted data stored on blockchain, keys in database

## Monitoring & Maintenance

### Check Turbo Balance
```typescript
import { getTurboBalance } from './lib/arweaveUploader';

const balance = await getTurboBalance();
console.log('Turbo Balance:', balance);
```

### View Upload Logs
```sql
SELECT * FROM arweave_upload_log
WHERE user_id = 'user_id_here'
ORDER BY created_at DESC;
```

### Monitor Failed Uploads
```sql
SELECT * FROM arweave_upload_log
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Check Backup Storage Usage
```sql
SELECT 
  COUNT(*) as total_backups,
  SUM(original_size_bytes) as total_size_bytes
FROM assets
WHERE backup_expires_at > NOW();
```

## Troubleshooting

### Upload Fails with "Insufficient Balance"
- Check Turbo wallet balance with `getTurboBalance()`
- Fund your Arweave wallet at https://arweave.app/
- Ensure ARWEAVE_WALLET_KEY is correctly set

### TypeScript Errors in arweaveUploader.ts
- Type assertions used for Turbo SDK unauthenticated client
- Will be resolved in future SDK updates
- Production should use authenticated client for full API

### Edge Function Deployment Errors
- Verify ARWEAVE_WALLET_KEY secret is set
- Check Edge Function logs: `supabase functions logs upload-to-arweave`
- Ensure Deno.env permissions are granted

### Migration Fails
- Check for existing column conflicts
- Verify RLS policies don't block migration
- Run migration with database admin credentials

## Roadmap

### Phase 2 Enhancements
- [ ] UI for encryption key management
- [ ] Batch upload interface for multiple assets
- [ ] Manifest creation UI for bundling
- [ ] Progress tracking during upload
- [ ] Cost estimator before archive
- [ ] Turbo balance monitoring dashboard
- [ ] Automatic wallet top-up alerts
- [ ] Download and decrypt archived assets
- [ ] Share encrypted assets with NOK
- [ ] Arweave Name Service (ANS) integration

### Phase 3 Advanced Features
- [ ] SmartWeave contract integration for asset ownership
- [ ] Atomic NFT creation from archived assets
- [ ] Arweave gateway redundancy
- [ ] IPFS fallback for faster retrieval
- [ ] Multi-wallet support
- [ ] Custom manifest templates
- [ ] Bulk archive operations
- [ ] Archive analytics dashboard

## Resources

- [Arweave Documentation](https://docs.arweave.org/)
- [Turbo SDK GitHub](https://github.com/ardriveapp/turbo-sdk)
- [ViewBlock Explorer](https://viewblock.io/arweave)
- [Arweave Web Wallet](https://arweave.app/)
- [ArDrive Turbo](https://turbo.ardrive.io/)

## Support

For issues or questions:
1. Check this documentation first
2. Review Edge Function logs for errors
3. Check database logs for failed transactions
4. Contact Arweave community on Discord
5. Open GitHub issue with detailed logs
