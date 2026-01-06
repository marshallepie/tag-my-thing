import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@12.18.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token packages configuration (matches src/hooks/useMTNMomo.ts)
const TOKEN_PACKAGES = [
  { id: 'starter', token_amount: 100, price_gbp: 1.00 },
  { id: 'basic', token_amount: 500, price_gbp: 4.50 },
  { id: 'popular', token_amount: 5000, price_gbp: 39.99 },
  { id: 'pro_business', token_amount: 1000, price_gbp: 8.00 },
  { id: 'enterprise', token_amount: 10000, price_gbp: 40.00 },
] as const;

interface CreatePaymentIntentRequest {
  packageId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { packageId }: CreatePaymentIntentRequest = await req.json();

    if (!packageId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: packageId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the package
    const selectedPackage = TOKEN_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      return new Response(
        JSON.stringify({ error: 'Invalid package ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for metadata
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Calculate amount in pence (Stripe requires smallest currency unit)
    const amountInPence = Math.round(selectedPackage.price_gbp * 100);

    // Generate unique idempotency key
    const timestamp = Date.now();
    const idempotencyKey = `${user.id}-${packageId}-${timestamp}`;

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true, // Enables Apple Pay, Google Pay, and cards
      },
      metadata: {
        user_id: user.id,
        package_id: packageId,
        token_amount: selectedPackage.token_amount.toString(),
        customer_email: user.email || '',
        customer_name: profile?.full_name || user.email || '',
      },
      description: `TagMyThing - ${selectedPackage.token_amount} TMT Tokens`,
    }, {
      idempotencyKey,
    });

    // Create payment_transactions record
    const transactionReference = `TMT-STRIPE-${timestamp}-${Math.floor(Math.random() * 1000000)}`;

    const { error: dbError } = await supabase.from('payment_transactions').insert({
      user_id: user.id,
      transaction_reference: transactionReference,
      payment_provider: 'stripe',
      amount: selectedPackage.price_gbp,
      currency: 'gbp',
      tokens_purchased: selectedPackage.token_amount,
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
      metadata: {
        package_id: packageId,
        customer_email: user.email,
        customer_name: profile?.full_name || user.email,
        payment_intent_id: paymentIntent.id,
      },
    });

    if (dbError) {
      console.error('Error creating payment transaction:', dbError);
      // Don't fail the payment intent creation, but log the error
      // The webhook will handle token crediting as fallback
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: amountInPence,
        currency: 'gbp',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Payment Intent:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
