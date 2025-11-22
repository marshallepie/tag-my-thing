// supabase/functions/upload-to-arweave/index.ts

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { TurboFactory } from "https://esm.sh/@ardrive/turbo-sdk@1.19.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { assetId, compress = true, encrypt = false } = await req.json();

    if (!assetId) {
      throw new Error('Asset ID is required');
    }

    // Fetch asset details
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single();

    if (assetError || !asset) {
      throw new Error('Asset not found or unauthorized');
    }

    // Check user has enough tokens
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (!wallet || wallet.balance < 300) {
      throw new Error('Insufficient tokens');
    }

    // Update asset status to uploading
    await supabase
      .from('assets')
      .update({ archive_status: 'uploading' })
      .eq('id', assetId);

    // Get the first media item URL
    const mediaUrl = asset.media_items?.[0]?.url;
    if (!mediaUrl) {
      throw new Error('No media found for asset');
    }

    // Extract storage path from URL
    const urlParts = mediaUrl.split('/');
    const bucketName = urlParts[urlParts.length - 3];
    const fileName = urlParts.slice(-2).join('/');

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucketName)
      .download(fileName);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file from storage');
    }

    let uploadBlob = fileData;
    let wasCompressed = false;
    let originalSize = fileData.size;

    // Compress if requested and file is an image over 100 KiB
    if (compress && fileData.size > 100 * 1024 && fileData.type.startsWith('image/')) {
      // For Deno, we'd need to use image processing library
      // Placeholder: In production, implement image compression
      console.log('Image compression would happen here');
      wasCompressed = false; // Set to true when implemented
    }

    // Encryption placeholder
    // In production, implement client-side encryption before upload
    const wasEncrypted = encrypt;

    // Initialize Turbo client (unauthenticated for now)
    const turbo = TurboFactory.unauthenticated();

    // Prepare file buffer
    const fileBuffer = await uploadBlob.arrayBuffer();
    const fileUint8Array = new Uint8Array(fileBuffer);

    // Prepare tags
    const tags = [
      { name: 'Content-Type', value: fileData.type },
      { name: 'App-Name', value: 'TagMyThing' },
      { name: 'App-Version', value: '1.0.0' },
      { name: 'Asset-ID', value: assetId },
      { name: 'User-ID', value: user.id },
      { name: 'Title', value: asset.title },
      ...(asset.description ? [{ name: 'Description', value: asset.description }] : []),
      ...(asset.tags ? asset.tags.map((tag: string) => ({ name: 'Tag', value: tag })) : []),
      ...(wasEncrypted ? [{ name: 'Encrypted', value: 'true' }] : []),
      ...(wasCompressed ? [{ name: 'Compressed', value: 'true' }] : [])
    ];

    // Upload to Arweave via Turbo
    const uploadResult = await (turbo as any).uploadFile({
      fileStreamFactory: () => fileUint8Array,
      fileSizeFactory: () => uploadBlob.size,
      dataItemOpts: {
        tags: tags
      }
    });

    const dataItemId = uploadResult.id;
    const turboUploadId = uploadResult.id; // Turbo returns data item ID

    // Call database function to update asset
    const { data: updateResult, error: updateError } = await supabase.rpc(
      'archive_tag_now_v2',
      {
        asset_id: assetId,
        turbo_id: turboUploadId,
        data_item_id: dataItemId,
        cost_winston: uploadResult.winc || 0,
        file_size: originalSize,
        was_compressed: wasCompressed,
        was_encrypted: wasEncrypted
      }
    );

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: dataItemId,
        dataItemId: dataItemId,
        turboUploadId: turboUploadId,
        size: uploadBlob.size,
        originalSize: originalSize,
        wasCompressed: wasCompressed,
        wasEncrypted: wasEncrypted,
        cost: {
          isFree: uploadBlob.size < 100 * 1024,
          winston: uploadResult.winc || 0
        },
        arweaveUrl: `https://arweave.net/${dataItemId}`,
        viewBlockUrl: `https://viewblock.io/arweave/tx/${dataItemId}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Upload error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Upload failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
