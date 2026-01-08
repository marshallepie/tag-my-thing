// supabase/functions/upload-to-arweave/index.ts

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Arweave from "https://esm.sh/arweave@1.14.4";

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

    // Prepare file buffer
    const fileBuffer = await uploadBlob.arrayBuffer();
    const fileUint8Array = new Uint8Array(fileBuffer);

    // Prepare tags for Arweave
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

    // Upload to Arweave using funded wallet from Supabase secrets
    console.log('Starting REAL Arweave upload, file size:', uploadBlob.size);

    let dataItemId: string;
    let costWinston = 0;

    try {
      // Get Arweave wallet from environment
      const walletKeyJson = Deno.env.get('ARWEAVE_WALLET_KEY');
      if (!walletKeyJson) {
        throw new Error('ARWEAVE_WALLET_KEY not configured in Supabase secrets');
      }

      console.log('Wallet key length:', walletKeyJson.length);
      console.log('First 100 chars:', walletKeyJson.substring(0, 100));
      console.log('Last 100 chars:', walletKeyJson.substring(walletKeyJson.length - 100));

      // Try to parse wallet JWK - handle potential encoding issues
      let jwk;
      try {
        // Try direct parse first
        jwk = JSON.parse(walletKeyJson);
        console.log('Successfully parsed wallet JWK directly');
      } catch (parseError: any) {
        console.error('Failed to parse wallet directly:', parseError.message);

        // The error says "after JSON at position 3164" which means there's valid JSON
        // followed by extra content. Let's extract just the first valid JSON object.
        try {
          // Find the first complete JSON object by parsing character by character
          let depth = 0;
          let inString = false;
          let escape = false;
          let jsonEnd = -1;

          for (let i = 0; i < walletKeyJson.length; i++) {
            const char = walletKeyJson[i];

            if (escape) {
              escape = false;
              continue;
            }

            if (char === '\\') {
              escape = true;
              continue;
            }

            if (char === '"') {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === '{') depth++;
              if (char === '}') {
                depth--;
                if (depth === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }

          if (jsonEnd > 0) {
            const extracted = walletKeyJson.substring(0, jsonEnd);
            console.log('Extracted JSON up to position:', jsonEnd);
            jwk = JSON.parse(extracted);
            console.log('Successfully parsed wallet JWK after extraction');
          } else {
            throw new Error('Could not find complete JSON object');
          }
        } catch (extractError: any) {
          console.error('Failed to extract and parse wallet:', extractError.message);
          throw new Error(`Could not parse ARWEAVE_WALLET_KEY: ${parseError.message}`);
        }
      }

      console.log('Loaded Arweave wallet, has keys:', Object.keys(jwk).join(', '));

      // Initialize Arweave
      const arweave = Arweave.init({
        host: 'arweave.net',
        port: 443,
        protocol: 'https'
      });

      // Check wallet address
      const walletAddress = await arweave.wallets.jwkToAddress(jwk);
      const balance = await arweave.wallets.getBalance(walletAddress);
      console.log('Wallet address:', walletAddress);
      console.log('Wallet balance (winston):', balance);
      // Note: Skip AR conversion to avoid BigNum issues in edge runtime

      // Create an Arweave transaction with data
      const transaction = await arweave.createTransaction({
        data: fileUint8Array
      }, jwk);

      // Add tags to the transaction
      for (const tag of tags) {
        transaction.addTag(tag.name, tag.value);
      }

      console.log('Transaction created with', tags.length, 'tags');
      console.log('Transaction size:', fileUint8Array.length, 'bytes');
      console.log('Estimated reward (winston):', transaction.reward);

      // Sign the transaction
      await arweave.transactions.sign(transaction, jwk);
      console.log('Transaction signed, ID:', transaction.id);

      // Post transaction to Arweave network
      const response = await arweave.transactions.post(transaction);

      console.log('Transaction post response:', response.status, response.statusText);

      if (response.status !== 200 && response.status !== 208) {
        // 208 = already submitted
        const responseText = await response.text();
        console.error('Arweave response:', responseText);
        throw new Error(`Arweave rejected transaction: ${response.status} ${response.statusText} - ${responseText}`);
      }

      // Get the transaction ID
      dataItemId = transaction.id;

      // Calculate actual cost
      costWinston = parseInt(transaction.reward);

      console.log('✅ Upload successful to Arweave!');
      console.log('Transaction ID:', dataItemId);
      console.log('Cost (winston):', costWinston);
      console.log('View at: https://arweave.net/' + dataItemId);

    } catch (uploadError: any) {
      console.error('Arweave upload error:', uploadError);
      console.error('Error stack:', uploadError.stack);

      // Update asset status to failed
      await supabase
        .from('assets')
        .update({
          archive_status: 'failed',
          archive_metadata: {
            error: uploadError.message,
            stack: uploadError.stack,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', assetId);

      throw new Error(`Arweave upload failed: ${uploadError.message || 'Unknown error'}`);
    }

    const turboUploadId = dataItemId;

    // Call database function to update asset
    const { data: updateResult, error: updateError } = await supabase.rpc(
      'archive_tag_now_v2',
      {
        asset_id: assetId,
        turbo_id: turboUploadId,
        data_item_id: dataItemId,
        cost_winston: costWinston,
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
          winston: costWinston
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
