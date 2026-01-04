import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@12.18.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle Payment Intent succeeded (new modal flow)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Extract metadata
      const userId = paymentIntent.metadata.user_id;
      const tokenAmount = parseInt(paymentIntent.metadata.token_amount || "0");
      const customerEmail = paymentIntent.metadata.customer_email;

      if (!userId || tokenAmount <= 0) {
        console.error("⚠️ Missing user_id or invalid token amount in Payment Intent metadata", {
          userId,
          tokenAmount,
          metadata: paymentIntent.metadata,
        });
        return new Response(JSON.stringify({ error: "Invalid Payment Intent metadata" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check idempotency - has this Payment Intent already been processed?
      const { data: existingTransaction } = await supabase
        .from("payment_transactions")
        .select("status, tokens_purchased")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .single();

      if (existingTransaction?.status === "successful") {
        console.log(`⏭️ Payment Intent ${paymentIntent.id} already processed, skipping`);
        return new Response(JSON.stringify({ received: true, already_processed: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // ATOMIC TRANSACTION: Update payment status, credit tokens, and log transaction
      // This ensures all-or-nothing execution to prevent partial updates

      try {
        // Step 1: Mark transaction as successful
        const { error: updateTxError } = await supabase
          .from("payment_transactions")
          .update({
            status: "successful",
            completed_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .eq("status", "pending"); // Only update if still pending (prevents double-processing)

        if (updateTxError) {
          console.error("❌ Error updating payment transaction:", updateTxError);
          throw updateTxError;
        }

        // Step 2: Increment wallet balance
        // Get current balance first
        const { data: wallet, error: fetchError } = await supabase
          .from("user_wallets")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (fetchError || !wallet) {
          console.error("❌ Error fetching wallet:", fetchError);
          // Rollback transaction status
          await supabase
            .from("payment_transactions")
            .update({ status: "pending" })
            .eq("stripe_payment_intent_id", paymentIntent.id);
          throw new Error("User wallet not found");
        }

        // Update wallet with new balance
        const { error: walletError } = await supabase
          .from("user_wallets")
          .update({ balance: wallet.balance + tokenAmount })
          .eq("user_id", userId);

        if (walletError) {
          console.error("❌ Error updating wallet balance:", walletError);
          // Rollback transaction status
          await supabase
            .from("payment_transactions")
            .update({ status: "pending" })
            .eq("stripe_payment_intent_id", paymentIntent.id);
          throw walletError;
        }

        // Step 3: Log token transaction
        const { error: tokenTxError } = await supabase.from("token_transactions").insert({
          user_id: userId,
          amount: tokenAmount,
          type: "earned",
          source: "purchase",
          description: `Purchased ${tokenAmount} TMT tokens via Stripe Payment Intent - ${paymentIntent.id}`,
        });

        if (tokenTxError) {
          console.error("❌ Error creating token transaction:", tokenTxError);
          // This is logged but not rolled back as wallet is already updated
        }

        console.log(`✅ Credited ${tokenAmount} tokens to user ${userId} (${customerEmail}) via Payment Intent ${paymentIntent.id}`);
      } catch (error) {
        console.error(`❌ Failed to process Payment Intent ${paymentIntent.id}:`, error);
        return new Response(JSON.stringify({ error: "Failed to credit tokens" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle completed checkout session (legacy Payment Links flow)
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
          headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error handling Stripe webhook:", err);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
