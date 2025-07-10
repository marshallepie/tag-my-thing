import Stripe from 'npm:stripe@12.18.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
Deno.serve(async (req)=>{
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // ✅ ADD THIS LOG HERE
    console.log("Edge Function: Authorization header received:", req.headers.get('Authorization'));
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { packageId, currency = 'gbp' } = await req.json();
    if (!packageId) {
      return new Response(JSON.stringify({
        error: 'Package ID is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({
        error: 'Stripe secret key not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? ''
        }
      }
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(req.headers.get("Authorization")?.replace("Bearer ", "") || "");
    console.log("getUser() result:", JSON.stringify({
      user,
      userError
    }));
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Authentication required'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ Look up package in the database
    const { data: tokenPackage, error: packageError } = await supabaseClient.from('token_packages').select('*').eq('id', packageId).single();
    if (packageError || !tokenPackage) {
      return new Response(JSON.stringify({
        error: 'Invalid token package'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ✅ Get the price for the specified currency
    const priceField = currency === 'gbp' ? 'price_gbp' : 'price_xaf';
    const amount = Number(tokenPackage[priceField]);
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({
        error: 'Package price is invalid'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        user_id: user.id,
        packageId: tokenPackage.id,
        tokenAmount: tokenPackage.token_amount,
        bonusTokens: tokenPackage.bonus_tokens
      }
    });
    // Optionally store the payment record in your DB
    const { error: insertError } = await supabaseClient.from('payments').insert({
      user_id: user.id,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
      amount,
      currency,
      metadata: {
        tokenAmount: tokenPackage.token_amount,
        bonusTokens: tokenPackage.bonus_tokens
      }
    });
    if (insertError) {
      console.error('Error saving payment record:', insertError);
    }
    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create payment intent'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
