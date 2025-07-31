import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('DMS Checker: Starting Dead Man\'s Switch check...');

    // Call the DMS check function
    const { data, error } = await supabaseClient.rpc('check_and_trigger_dms');

    if (error) {
      console.error('DMS Checker: Error calling check_and_trigger_dms:', error);
      throw error;
    }

    console.log('DMS Checker: Check completed:', data);

    // If any assignments were triggered, we could send notifications here
    if (data?.triggered_assignments_count > 0) {
      console.log(`DMS Checker: ${data.triggered_assignments_count} assignments triggered`);
      
      // TODO: Implement notification logic here
      // This could involve:
      // 1. Querying for the triggered assignments
      // 2. Getting NOK email addresses
      // 3. Sending notification emails
      // 4. Creating in-app notifications
    }

    return new Response(JSON.stringify({
      success: true,
      triggered_count: data?.triggered_assignments_count || 0,
      message: data?.message || 'DMS check completed',
      checked_at: data?.checked_at || new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('DMS Checker: Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});