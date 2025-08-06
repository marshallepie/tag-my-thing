import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend"; // Import Resend

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

    // Initialize Resend client
    const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com'; // Your verified sender email

    console.log('DMS Checker: Starting Dead Man\'s Switch check...');

    // Call the DMS check function
    const { data, error } = await supabaseClient.rpc('check_and_trigger_dms');

    if (error) {
      console.error('DMS Checker: Error calling check_and_trigger_dms:', error);
      throw error;
    }

    console.log('DMS Checker: Check completed:', data);

    let emailsSentCount = 0;
    if (data?.triggered_assignments_count > 0 && data?.triggered_assignments_details) {
      console.log(`DMS Checker: ${data.triggered_assignments_count} assignments triggered. Sending notifications...`);
      
      for (const assignment of data.triggered_assignments_details) {
        const { nok_email, nok_name, assigner_name, asset_title, access_granted_at, dms_date } = assignment;

        const subject = `Action Required: ${assigner_name}'s asset "${asset_title}" is now accessible`;
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dead Man's Switch Triggered - TagMyThing</title>
            <style>
              body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #14b8a6 100%); color: white; padding: 40px 30px; text-align: center; }
              .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
              .content { padding: 40px 30px; }
              .highlight { background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #14b8a6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
              .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Tag<span style="color: #14b8a6;">My</span>Thing</div>
                <div style="font-size: 18px; opacity: 0.9;">Dead Man's Switch Triggered</div>
              </div>
              
              <div class="content">
                <h2 style="color: #1f2937; margin-bottom: 20px;">🚨 Action Required: Asset Now Accessible</h2>
                
                <p>Dear ${nok_name},</p>
                
                <p>This is an important notification from TagMyThing regarding an asset assigned to you by <strong>${assigner_name}</strong>.</p>
                
                <div class="highlight">
                  <h3 style="margin-top: 0; color: #2563eb;">Asset: "${asset_title}"</h3>
                  <p>The Dead Man's Switch for this asset has been triggered due to inactivity from ${assigner_name}.</p>
                  <p>Access was granted on: <strong>${new Date(access_granted_at).toLocaleDateString()}</strong></p>
                  <p>Original DMS date: ${new Date(dms_date).toLocaleDateString()}</p>
                </div>
                
                <p>You can now access the full details of this asset by logging into your TagMyThing account and navigating to your Next-of-Kin assignments.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get('SITE_URL')}/nok" class="button">View Your Assignments</a>
                </div>
                
                <p>If you have any questions or require assistance, please contact our support team.</p>
                
                <p>Sincerely,<br>The TagMyThing Team</p>
              </div>
              
              <div class="footer">
                <p>This email was sent because a Dead Man's Switch was triggered for an asset assigned to you on TagMyThing.</p>
                <p>TagMyThing - Secure Asset Management & Digital Legacy Planning</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const textContent = `
Dear ${nok_name},

This is an important notification from TagMyThing regarding an asset assigned to you by ${assigner_name}.

Asset: "${asset_title}"
The Dead Man's Switch for this asset has been triggered due to inactivity from ${assigner_name}.
Access was granted on: ${new Date(access_granted_at).toLocaleDateString()}
Original DMS date: ${new Date(dms_date).toLocaleDateString()}

You can now access the full details of this asset by logging into your TagMyThing account and navigating to your Next-of-Kin assignments.

View your assignments here: ${Deno.env.get('SITE_URL')}/nok

If you have any questions or require assistance, please contact our support team.

Sincerely,
The TagMyThing Team
        `;

        try {
          await resend.emails.send({
            from: fromEmail,
            to: nok_email,
            subject: subject,
            html: htmlContent,
            text: textContent,
          });
          emailsSentCount++;
          console.log(`DMS Checker: Email sent to ${nok_email} for asset "${asset_title}".`);
        } catch (emailError) {
          console.error(`DMS Checker: Failed to send email to ${nok_email}:`, emailError);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      triggered_count: data?.triggered_assignments_count || 0,
      emails_sent: emailsSentCount,
      message: `DMS check completed. ${emailsSentCount} emails sent.`,
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
