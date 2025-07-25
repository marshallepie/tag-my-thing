import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { WebBundlr } from "@bundlr-network/client"; // requires bundling with wallet
import Arweave from "arweave"; // optional

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: assets, error } = await supabase
    .from("assets")
    .select("*")
    .eq("archive_status", "pending");

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });

  for (const asset of assets) {
    try {
      // Retrieve media from Supabase Storage
      const { data: file } = await supabase.storage.from("asset-files").download(asset.storage_path);

      // Upload to IPFS (if needed)
      if (!asset.ipfs_cid) {
        const ipfsCid = await uploadToIPFS(file); // Your implementation
        await supabase.from("assets").update({ ipfs_cid: ipfsCid }).eq("id", asset.id);
      }

      // Upload to Arweave using Bundlr
      const bundlrTxId = await uploadToArweave(file); // Your implementation

      await supabase.from("assets").update({
        archive_status: "archived",
        arweave_tx_id: bundlrTxId,
        archive_method: "monthly",
        archive_requested_at: new Date().toISOString(),
      }).eq("id", asset.id);
    } catch (err) {
      await supabase.from("assets").update({ archive_status: "failed" }).eq("id", asset.id);
    }
  }

  return new Response(JSON.stringify({ status: "completed", archived: assets.length }));
});
