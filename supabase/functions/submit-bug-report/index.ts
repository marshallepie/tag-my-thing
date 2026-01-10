// supabase/functions/submit-bug-report/index.ts Updated comment to trigger Git source control
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Json = Record<string, unknown>;

interface BugReportData {
  screenshotBase64: string;  // data URL (e.g. "data:image/png;base64,...") or raw base64
  errorMessage: string;
  consoleLogs?: string;
  pageUrl?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseBase64Image(data: string): { mime: string; bytes: Uint8Array } {
  let base64 = data;
  let mime = "image/png";

  // If it's a data URL, extract mime + data
  if (data.startsWith("data:")) {
    const [header, b64] = data.split(",", 2);
    base64 = b64 ?? "";
    const m = header.match(/^data:(.*?);base64$/i);
    if (m && m[1]) mime = m[1];
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { mime, bytes };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Client for auth validation (with user's JWT)
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse body
    const body = (await req.json()) as BugReportData;
    const {
      screenshotBase64,
      errorMessage,
      consoleLogs = "",
      pageUrl = "",
      userAgent = "",
      metadata = {},
    } = body;

    if (!screenshotBase64 || !errorMessage) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: screenshotBase64 and errorMessage",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get extra user context (optional)
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    // Upload screenshot (best-effort)
    let screenshotUrl = "";
    try {
      console.log("Starting screenshot upload for user:", user.id);
      const { mime, bytes } = parseBase64Image(screenshotBase64);
      console.log("Parsed screenshot:", { mime, sizeBytes: bytes.length });

      const ext = mime.split("/")[1] ?? "png";
      const fileName = `${user.id}/${Date.now()}-bug-report.${ext}`;
      const blob = new Blob([bytes], { type: mime });
      console.log("Uploading to:", fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("bug-screenshots")
        .upload(fileName, blob, { contentType: mime, upsert: false });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL (bucket must be public for this to work)
      const { data: pub } = supabase.storage
        .from("bug-screenshots")
        .getPublicUrl(fileName);
      screenshotUrl = pub.publicUrl ?? "";
      console.log("Screenshot URL:", screenshotUrl);
    } catch (e) {
      // Continue without screenshot if upload fails
      console.error("Screenshot upload error (full):", e);
      console.error("Error details:", JSON.stringify(e, null, 2));
      screenshotUrl = "";
    }

    // Insert bug report
    const bugReportRecord: Json = {
      user_id: user.id,
      user_email: userProfile?.email ?? user.email ?? "unknown",
      user_name: userProfile?.full_name ?? "Unknown User",
      error_message: errorMessage,
      console_logs: consoleLogs,
      screenshot_url: screenshotUrl,
      page_url: pageUrl,
      user_agent: userAgent,
      metadata: {
        timestamp: new Date().toISOString(),
        browser: userAgent ? userAgent.split(" ")[0] : "unknown",
        ...metadata,
      },
      status: "new",
      priority: "medium",
    };

    console.log("Attempting to insert bug report for user:", user.id);
    console.log("Bug report record:", JSON.stringify(bugReportRecord, null, 2));

    const { data: bugReport, error: insertError } = await supabase
      .from("bug_reports")
      .insert(bugReportRecord)
      .select()
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
      return new Response(
        JSON.stringify({
          error: "Failed to save bug report",
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        bugReportId: bugReport.id,
        message: "Bug report submitted successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error)?.message ?? "Internal server error",
        details: "An unexpected error occurred while processing the bug report",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
