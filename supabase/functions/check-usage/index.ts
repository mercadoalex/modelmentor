import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIER_LIMITS = {
  free: { max_projects: 3, max_training_sessions_per_month: 10, max_storage_mb: 100, max_file_size_mb: 50, max_training_duration_seconds: 120, max_dataset_rows: 10000, max_epochs: 50, max_concurrent_jobs: 1, max_daily_training_requests: 5 },
  pro: { max_projects: 50, max_training_sessions_per_month: 500, max_storage_mb: 5000, max_file_size_mb: 500, max_training_duration_seconds: 600, max_dataset_rows: 100000, max_epochs: 200, max_concurrent_jobs: 2, max_daily_training_requests: null },
  enterprise: { max_projects: null, max_training_sessions_per_month: null, max_storage_mb: null, max_file_size_mb: null, max_training_duration_seconds: null, max_dataset_rows: null, max_epochs: null, max_concurrent_jobs: 5, max_daily_training_requests: null },
} as const

type Tier = keyof typeof TIER_LIMITS

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

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

    // --- Query user subscription ---
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status, trial_ends_at, current_period_start, current_period_end')
      .eq('user_id', user.id)
      .single()

    const tier: Tier = (subscription?.tier as Tier) || 'free'
    const status = subscription?.status || 'active'
    const limits = TIER_LIMITS[tier]

    // --- Calculate trial days remaining ---
    let trialDaysRemaining: number | null = null
    if (subscription?.trial_ends_at) {
      const trialEndsAt = new Date(subscription.trial_ends_at).getTime()
      const now = Date.now()
      const diffMs = trialEndsAt - now
      trialDaysRemaining = diffMs > 0 ? Math.ceil(diffMs / 86400000) : 0
    }

    // --- Aggregate monthly usage from usage_events ---
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: usageEvents } = await supabase
      .from('usage_events')
      .select('resource_type, amount')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    // Aggregate usage by resource type
    const usageSummary: Record<string, number> = {
      project: 0,
      training: 0,
      storage: 0,
      api_call: 0,
      report: 0,
    }

    if (usageEvents) {
      for (const event of usageEvents) {
        const resourceType = event.resource_type as string
        if (resourceType in usageSummary) {
          usageSummary[resourceType] += Number(event.amount) || 0
        }
      }
    }

    // --- Get total storage used (from datasets table) ---
    const { data: datasets } = await supabase
      .from('datasets')
      .select('file_size_bytes')
      .eq('user_id', user.id)

    const totalStorageMb = datasets
      ? datasets.reduce((sum, d) => sum + (Number(d.file_size_bytes) || 0), 0) / (1024 * 1024)
      : 0

    // --- Get total projects count ---
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // --- Fetch compute budget status ---
    const today = new Date().toISOString().split('T')[0]

    const { data: dailyUsage } = await supabase
      .from('daily_compute_usage')
      .select('total_minutes')
      .eq('date', today)
      .single()

    const { data: budgetConfig } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', 'daily_compute_budget')
      .single()

    const dailyBudgetLimit = budgetConfig?.value?.limit_minutes ?? 1440
    const consumedTodayMinutes = dailyUsage?.total_minutes ?? 0

    // --- Build response ---
    const response = {
      tier,
      status,
      trial_days_remaining: trialDaysRemaining,
      usage: {
        projects: projectCount ?? 0,
        training_sessions_this_month: usageSummary.training,
        storage_mb: parseFloat(totalStorageMb.toFixed(2)),
        api_calls_this_month: usageSummary.api_call,
      },
      limits: {
        max_projects: limits.max_projects,
        max_training_sessions_per_month: limits.max_training_sessions_per_month,
        max_storage_mb: limits.max_storage_mb,
        max_file_size_mb: limits.max_file_size_mb,
        max_training_duration_seconds: limits.max_training_duration_seconds,
        max_dataset_rows: limits.max_dataset_rows,
        max_epochs: limits.max_epochs,
        max_concurrent_jobs: limits.max_concurrent_jobs,
        max_daily_training_requests: limits.max_daily_training_requests,
      },
      compute_budget: {
        daily_limit_minutes: dailyBudgetLimit,
        consumed_today_minutes: parseFloat(Number(consumedTodayMinutes).toFixed(2)),
        available: consumedTodayMinutes < dailyBudgetLimit,
      },
    }

    return new Response(
      JSON.stringify(response),
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
