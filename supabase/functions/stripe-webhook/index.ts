import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICE_TO_TIER: Record<string, 'pro' | 'enterprise'> = {
  'price_pro_monthly': 'pro',
  'price_pro_yearly': 'pro',
  'price_enterprise_monthly': 'enterprise',
  'price_enterprise_yearly': 'enterprise',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // --- Verify webhook signature ---
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response(
        JSON.stringify({ code: 'invalid_request', message: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
      return new Response(
        JSON.stringify({ code: 'invalid_signature', message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Idempotency check: skip already-processed events ---
    const { data: existingEvent } = await supabase
      .from('usage_events')
      .select('id')
      .eq('metadata->>stripe_event_id', event.id)
      .limit(1)
      .maybeSingle()

    if (existingEvent) {
      return new Response(
        JSON.stringify({ received: true, message: 'Event already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Handle events ---
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase, event.id)
        break
      }
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase, event.id)
        break
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase, event.id)
        break
      }
      case 'invoice.payment_failed': {
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase, event.id)
        break
      }
      default: {
        // Unhandled event type — acknowledge receipt
        break
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
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

/**
 * Handle checkout.session.completed
 * Upgrades user tier, sets period dates, stores Stripe IDs.
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createClient>,
  eventId: string
) {
  const userId = session.metadata?.supabase_user_id
  if (!userId) {
    throw new Error('Missing supabase_user_id in session metadata')
  }

  const subscriptionId = session.subscription as string
  const customerId = session.customer as string

  // Retrieve the subscription to get price and period info
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price?.id ?? ''
  const tier = PRICE_TO_TIER[priceId] ?? 'pro'

  await supabase
    .from('user_subscriptions')
    .update({
      tier,
      status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_ends_at: null,
      cancelled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Record idempotency marker
  await recordWebhookEvent(supabase, userId, eventId, 'checkout.session.completed')
}

/**
 * Handle customer.subscription.updated
 * Updates tier if price changed, updates period dates and status.
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>,
  eventId: string
) {
  const userId = await getUserIdFromStripeSubscription(subscription.id, supabase)
  if (!userId) return

  const priceId = subscription.items.data[0]?.price?.id ?? ''
  const tier = PRICE_TO_TIER[priceId] ?? 'pro'

  const status = subscription.cancel_at_period_end ? 'cancelled' : 'active'

  await supabase
    .from('user_subscriptions')
    .update({
      tier,
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelled_at: subscription.cancel_at_period_end
        ? new Date().toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Record idempotency marker
  await recordWebhookEvent(supabase, userId, eventId, 'customer.subscription.updated')
}

/**
 * Handle customer.subscription.deleted
 * Downgrades user to free tier while preserving their data.
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>,
  eventId: string
) {
  const userId = await getUserIdFromStripeSubscription(subscription.id, supabase)
  if (!userId) return

  await supabase
    .from('user_subscriptions')
    .update({
      tier: 'free',
      status: 'cancelled',
      stripe_subscription_id: null,
      current_period_start: null,
      current_period_end: null,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Record idempotency marker
  await recordWebhookEvent(supabase, userId, eventId, 'customer.subscription.deleted')
}

/**
 * Handle invoice.payment_failed
 * Sets subscription status to 'past_due'.
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof createClient>,
  eventId: string
) {
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const userId = await getUserIdFromStripeSubscription(subscriptionId, supabase)
  if (!userId) return

  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Record idempotency marker
  await recordWebhookEvent(supabase, userId, eventId, 'invoice.payment_failed')
}

/**
 * Look up the Supabase user ID from a Stripe subscription ID.
 */
async function getUserIdFromStripeSubscription(
  stripeSubscriptionId: string,
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle()

  return data?.user_id ?? null
}

/**
 * Record a webhook event for idempotency tracking.
 * Uses the usage_events table with metadata containing the Stripe event ID.
 */
async function recordWebhookEvent(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  eventId: string,
  eventType: string
) {
  await supabase
    .from('usage_events')
    .insert({
      user_id: userId,
      resource_type: 'api_call',
      amount: 0,
      metadata: {
        stripe_event_id: eventId,
        stripe_event_type: eventType,
      },
    })
}
