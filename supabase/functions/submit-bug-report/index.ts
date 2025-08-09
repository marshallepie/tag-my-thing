// supabase/functions/submit-bug-report/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Json = Record<string, unknown>;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*", // tighten to your domains if you want
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BugReportData {
  screenshotBase64: string;  // data URL (e.g. "data:image/png;base64,...") or raw base64
  errorMessage: string;
  consoleLogs?: string;
  pageUrl?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

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
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Supabase client with caller's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL/ANON_KEY env" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      const { mime, bytes } = parseBase64Image(screenshotBase64);
      const ext = mime.split("/")[1] ?? "png";
      const fileName = `${user.id}/${Date.now()}-bug-report.${ext}`;
      const blob = new Blob([bytes], { type: mime });

      const { error: uploadError } = await supabase.storage
        .from("bug-screenshots")
        .upload(fileName, blob, { contentType: mime, upsert: false });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage
        .from("bug-screenshots")
        .getPublicUrl(fileName);
      screenshotUrl = pub.publicUrl ?? "";
    } catch (e) {
      // Continue without screenshot if upload fails
      console.error("Screenshot upload error:", e);
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

    const { data: bugReport, error: insertError } = await supabase
      .from("bug_reports")
      .insert(bugReportRecord)
      .select()
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save bug report" }),
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
