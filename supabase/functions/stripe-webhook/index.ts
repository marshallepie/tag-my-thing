import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@12.18.0";

// Supabase client (service role for DB writes)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle preflight
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
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeWebhookSecret || !stripeSecretKey) {
      throw new Error("Stripe webhook secret or API key not configured");
    }

    const body = await req.text(); // raw body for signature verification
    const sig = req.headers.get("stripe-signature");

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig!, stripeWebhookSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle completed checkout session
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Pull useful info from the session
      const email = session.customer_email;
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0; // pounds
      const currency = session.currency ?? "gbp";

      // Determine token amount
      let tokenAmount = 0;
      if (session.metadata?.token_amount) {
        tokenAmount = parseInt(session.metadata.token_amount);
      } else {
        if (amountPaid === 1.0) tokenAmount = 100;
        else if (amountPaid === 4.5) tokenAmount = 500;
        else if (amountPaid === 8.0) tokenAmount = 1000;
        else if (amountPaid === 39.99) tokenAmount = 5000;
        else if (amountPaid === 40.0) tokenAmount = 10000;
      }

      if (!email || tokenAmount <= 0) {
        console.error("⚠️ Missing email or invalid token amount", { email, tokenAmount });
        return new Response(JSON.stringify({ error: "Invalid session data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Look up the user by email
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        console.error("⚠️ No matching user profile found for email:", email);
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Record payment
      await supabase.from("payments").insert({
        user_id: profile.id,
        stripe_payment_intent_id: session.id,
        status: "completed",
        amount: amountPaid,
        currency,
        payment_method: "stripe",
        type: "tokens",
        metadata: {
          tokenAmount,
          stripeCustomerId: session.customer,
        },
      });

      // Update wallet
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("balance")
        .eq("user_id", profile.id)
        .single();

      if (wallet) {
        await supabase
          .from("user_wallets")
          .update({ balance: wallet.balance + tokenAmount })
          .eq("user_id", profile.id);
      }

      // Log token transaction
      await supabase.from("token_transactions").insert({
        user_id: profile.id,
        amount: tokenAmount,
        type: "earned",
        source: "purchase",
        description: `Purchased ${tokenAmount} TMT tokens via Stripe Payment Link`,
      });

      console.log(`✅ Credited ${tokenAmount} tokens to ${email}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error handling Stripe webhook:", err);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
