// supabase/functions/send-nok-invite/index.ts

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend";

interface NOKInviteRequest {
  nokId: string;
  nokEmail: string;
  nokName: string;
  nominatorName: string;
  relationship: string;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { nokId, nokEmail, nokName, nominatorName, relationship }: NOKInviteRequest = await req.json();

    if (!nokId || !nokEmail || !nokName || !nominatorName) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: nokId, nokEmail, nokName, nominatorName' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: nokRecord, error: nokError } = await supabaseClient
      .from('next_of_kin')
      .select('*')
      .eq('id', nokId)
      .eq('status', 'invited')
      .single();

    if (nokError || !nokRecord) {
      return new Response(JSON.stringify({ 
        error: 'NOK record not found or not in invited status' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
    const inviteUrl = `${siteUrl}/influencer-signup?nok_invite_email=${encodeURIComponent(nokEmail)}`;

    const subject = `You've been nominated as a Next-of-Kin by ${nominatorName} on TagMyThing`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Next-of-Kin Nomination - TagMyThing</title>
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
            <div style="font-size: 18px; opacity: 0.9;">Next-of-Kin Nomination</div>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-bottom: 20px;">🛡️ You've Been Nominated as a Next-of-Kin</h2>
            
            <p>Hi ${nokName},</p>
            
            <p>Great news! You've been nominated as a <strong>Next-of-Kin</strong> by <strong>${nominatorName}</strong> on TagMyThing.</p>
            
            <div class="highlight">
              <h3 style="margin-top: 0; color: #2563eb;">What does this mean?</h3>
              <p style="margin-bottom: 0;">${nominatorName} trusts you to manage their digital legacy and assets if something were to happen to them. This is a significant responsibility and shows how much they value your relationship as their <strong>${relationship}</strong>.</p>
            </div>
            
            <p>To accept this nomination and see the details:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" class="button">Accept Nomination & Sign Up/Login</a>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>Important:</strong> The person who nominated you provided this email address. To accept, simply sign up or log in using the link above.</p>
            </div>
            
            <h3 style="color: #1f2937;">What happens next?</h3>
            <ul>
              <li>Click the link above to sign up or log in to TagMyThing</li>
              <li>Your email will be pre-filled for convenience</li>
              <li>Once you're logged in, you'll see the nomination in your dashboard</li>
              <li>You can then view the assets ${nominatorName} has assigned to you</li>
            </ul>
            
            <p>If you have any questions about this nomination, please contact ${nominatorName} directly.</p>
            
            <p>Best regards,<br>The TagMyThing Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent because ${nominatorName} nominated you as their Next-of-Kin on TagMyThing.</p>
            <p>TagMyThing - Secure Asset Management & Digital Legacy Planning</p>
            <p>If you believe this email was sent in error, please ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hi ${nokName},

Great news! You've been nominated as a Next-of-Kin by ${nominatorName} on TagMyThing.

This means ${nominatorName} trusts you to manage their digital legacy and assets if something were to happen to them.

To accept this nomination and see the details, please visit:
${inviteUrl}

The person who nominated you provided this email. To accept, simply sign up or log in.

What happens next:
- Click the link above to sign up or log in to TagMyThing
- Your email will be pre-filled for convenience
- Once you're logged in, you'll see the nomination in your dashboard
- You can then view the assets ${nominatorName} has assigned to you

If you have any questions about this nomination, please contact ${nominatorName} directly.

Best regards,
The TagMyThing Team

---
This email was sent because ${nominatorName} nominated you as their Next-of-Kin on TagMyThing.
TagMyThing - Secure Asset Management & Digital Legacy Planning
    `;

    // --- Resend integration ---
    const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '');

    await resend.emails.send({
      from: Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com',
      to: nokEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'NOK invitation email sent successfully.',
      inviteUrl
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-nok-invite Edge Function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'Failed to process NOK invitation'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
