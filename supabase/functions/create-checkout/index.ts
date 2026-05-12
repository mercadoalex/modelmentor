import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICE_IDS = {
  pro_monthly: 'price_pro_monthly',
  pro_yearly: 'price_pro_yearly',
  enterprise_monthly: 'price_enterprise_monthly',
  enterprise_yearly: 'price_enterprise_yearly',
}

type CheckoutTier = 'pro' | 'enterprise'
type BillingPeriod = 'monthly' | 'yearly'

interface CreateCheckoutRequest {
  tier: CheckoutTier
  billing_period: BillingPeriod
  success_url: string
  cancel_url: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  try {
    // --- Authenticate user ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ code: 'unauthorized', message: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ code: 'unauthorized', message: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Validate request body ---
    const body: CreateCheckoutRequest = await req.json()
    const { tier, billing_period, success_url, cancel_url } = body

    if (!tier || !billing_period) {
      return new Response(
        JSON.stringify({ code: 'invalid_request', message: 'Missing required fields: tier, billing_period' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['pro', 'enterprise'].includes(tier)) {
      return new Response(
        JSON.stringify({ code: 'invalid_request', message: 'Invalid tier. Must be "pro" or "enterprise"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['monthly', 'yearly'].includes(billing_period)) {
      return new Response(
        JSON.stringify({ code: 'invalid_request', message: 'Invalid billing_period. Must be "monthly" or "yearly"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ code: 'invalid_request', message: 'Missing required fields: success_url, cancel_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Look up or create Stripe customer ---
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let stripeCustomerId = subscription?.stripe_customer_id

    if (!stripeCustomerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      stripeCustomerId = customer.id

      // Store the Stripe customer ID in the subscription record
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('user_id', user.id)
    }

    // --- Determine price ID ---
    const priceKey = `${tier}_${billing_period}` as keyof typeof PRICE_IDS
    const priceId = PRICE_IDS[priceKey]

    // --- Create Stripe Checkout Session ---
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        supabase_user_id: user.id,
        tier,
        billing_period,
      },
    })

    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        session_id: session.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ code: 'internal_error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
