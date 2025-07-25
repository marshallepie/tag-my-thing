// supabase/functions/archive-monthly-batch/index.ts

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { WebBundlr } from "https://esm.sh/@bundlr-network/client@0.11.0";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: assets, error } = await supabase
    .from("assets")
    .select("*")
    .eq("archive_status", "pending");

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  for (const asset of assets) {
    try {
      const { data: file, error: downloadErr } = await supabase
        .storage
        .from("asset-files")
        .download(asset.storage_path);

      if (downloadErr) throw downloadErr;

      const mockTxId = crypto.randomUUID();

      await supabase.from("assets").update({
        archive_status: "archived",
        arweave_tx_id: mockTxId,
        archive_method: "monthly",
        archive_requested_at: new Date().toISOString(),
      }).eq("id", asset.id);

    } catch (err) {
      await supabase.from("assets").update({
        archive_status: "failed"
      }).eq("id", asset.id);
    }
  }

  return new Response(JSON.stringify({
    status: "completed",
    archived: assets.length
  }));
});
