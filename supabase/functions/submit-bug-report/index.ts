import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface BugReportData {
  screenshotBase64: string;
  errorMessage: string;
  consoleLogs?: string;
  pageUrl?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

interface BugReportData {
  screenshotBase64: string;
  errorMessage: string;
  consoleLogs?: string;
  pageUrl?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Initialize Supabase client with user's auth token
    // Initialize Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    // Verify user authentication
    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const bugReportData: BugReportData = await req.json();
    const { screenshotBase64, errorMessage, consoleLogs, pageUrl, userAgent, metadata } = bugReportData;
    const bugReportData: BugReportData = await req.json();
    const { screenshotBase64, errorMessage, consoleLogs, pageUrl, userAgent, metadata } = bugReportData;

    // Validate required fields
    // Validate required fields
    if (!screenshotBase64 || !errorMessage) {
      return new Response(JSON.stringify({ error: 'Missing required fields: screenshotBase64 and errorMessage' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user profile for additional context
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Get user profile for additional context
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // 1. Upload screenshot to storage
    let screenshotUrl = '';
    try {
      // Convert base64 to binary
      const base64Data = screenshotBase64.split(',')[1];
      const screenshotBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Determine file extension from base64 header
      const mimeType = screenshotBase64.split(';')[0].split(':')[1];
      const fileExtension = mimeType.split('/')[1];
      
      // Generate unique filename
      const fileName = `${user.id}/${Date.now()}-bug-report.${fileExtension}`;
      const base64Data = screenshotBase64.split(',')[1];
      const screenshotBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Determine file extension from base64 header
      const mimeType = screenshotBase64.split(';')[0].split(':')[1];
      const fileExtension = mimeType.split('/')[1];
      
      // Generate unique filename
      const fileName = `${user.id}/${Date.now()}-bug-report.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('bug-screenshots')
        .upload(fileName, screenshotBuffer, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) {
        console.error('Screenshot upload error:', uploadError);
        throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
      }

      // Get the public URL for the uploaded screenshot
      const { data: { publicUrl } } = supabaseClient.storage
        .from('bug-screenshots')
        .getPublicUrl(fileName);
      
      screenshotUrl = publicUrl;
    } catch (uploadError) {
      console.error('Screenshot processing error:', uploadError);
      // Continue without screenshot if upload fails
      screenshotUrl = '';
    }

    // 2. Insert bug report into database
    const bugReportRecord = {
      user_id: user.id,
      user_email: userProfile?.email || user.email || 'unknown',
      user_name: userProfile?.full_name || 'Unknown User',
      error_message: errorMessage,
      console_logs: consoleLogs || '',
      // Get the public URL for the uploaded screenshot
      const { data: { publicUrl } } = supabaseClient.storage
        .from('bug-screenshots')
        .getPublicUrl(fileName);
      
      screenshotUrl = publicUrl;
    } catch (uploadError) {
      console.error('Screenshot processing error:', uploadError);
      // Continue without screenshot if upload fails
      screenshotUrl = '';
    }
      page_url: pageUrl || '',
      user_agent: userAgent || '',
    const bugReportRecord = {
      user_id: user.id,
      user_email: userProfile?.email || user.email || 'unknown',
      user_name: userProfile?.full_name || 'Unknown User',
      error_message: errorMessage,
      console_logs: consoleLogs || '',
      screenshot_url: screenshotUrl,
      page_url: pageUrl || '',
      user_agent: userAgent || '',
      metadata: {
        timestamp: new Date().toISOString(),
        browser: userAgent ? userAgent.split(' ')[0] : 'unknown',
        ...metadata
      },
      status: 'new',
      priority: 'medium'
    };

    const { data: bugReport, error: insertError } = await supabaseClient
      .from('bug_reports')
      .insert(bugReportRecord)
      .select()
      .single();
        throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
      }

    console.log('Bug report submitted successfully:', bugReport.id);

    return new Response(JSON.stringify({ 
      success: true, 
      bugReportId: bugReport.id,
      message: 'Bug report submitted successfully'
    console.log('Bug report submitted successfully:', bugReport.id);

    return new Response(JSON.stringify({ 
      success: true, 
      bugReportId: bugReport.id,
      message: 'Bug report submitted successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'An unexpected error occurred while processing the bug report'
    }), {
      error: error.message || 'Internal server error',
      details: 'An unexpected error occurred while processing the bug report'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});