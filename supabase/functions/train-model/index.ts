import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIER_LIMITS = {
  free: { max_training_sessions_per_month: 10, max_concurrent_jobs: 1, max_daily_training_requests: 5, max_dataset_rows: 10000, max_epochs: 50, max_training_duration_seconds: 120 },
  pro: { max_training_sessions_per_month: 500, max_concurrent_jobs: 2, max_daily_training_requests: null, max_dataset_rows: 100000, max_epochs: 200, max_training_duration_seconds: 600 },
  enterprise: { max_training_sessions_per_month: null, max_concurrent_jobs: 5, max_daily_training_requests: null, max_dataset_rows: null, max_epochs: null, max_training_duration_seconds: null },
} as const

type Tier = keyof typeof TIER_LIMITS

interface TrainModelRequest {
  dataset_id: string
  model_type: 'classification' | 'regression' | 'image_classification' | 'text_classification'
  config: {
    epochs: number
    batch_size: number
    learning_rate: number
    architecture: 'shallow_nn' | 'decision_tree' | 'random_forest' | 'logistic_regression'
  }
}

interface TrainingMetrics {
  accuracy: number
  loss: number
  precision: number
  recall: number
  f1_score: number
}

// --- CSV Parsing ---
function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split('\n')
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) => line.split(',').map((cell) => cell.trim()))
  return { headers, rows }
}

// --- Simulated Training Loop ---
function simulateEpoch(epoch: number, totalEpochs: number): { loss: number; accuracy: number } {
  // Loss decreases over epochs with some noise
  const progress = epoch / totalEpochs
  const baseLoss = 2.0 * Math.exp(-3 * progress)
  const noise = (Math.random() - 0.5) * 0.1
  const loss = Math.max(0.01, baseLoss + noise)

  // Accuracy increases over epochs with some noise
  const baseAccuracy = 1 - Math.exp(-3 * progress)
  const accNoise = (Math.random() - 0.5) * 0.05
  const accuracy = Math.min(0.99, Math.max(0.1, baseAccuracy + accNoise))

  return { loss, accuracy }
}

function computeFinalMetrics(totalEpochs: number): TrainingMetrics {
  const accuracy = Math.min(0.99, 0.7 + Math.random() * 0.25)
  const loss = Math.max(0.01, 0.5 * Math.exp(-3) + (Math.random() - 0.5) * 0.05)
  const precision = Math.min(0.99, accuracy - 0.02 + Math.random() * 0.04)
  const recall = Math.min(0.99, accuracy - 0.03 + Math.random() * 0.05)
  const f1_score = 2 * (precision * recall) / (precision + recall)
  return {
    accuracy: parseFloat(accuracy.toFixed(4)),
    loss: parseFloat(loss.toFixed(4)),
    precision: parseFloat(precision.toFixed(4)),
    recall: parseFloat(recall.toFixed(4)),
    f1_score: parseFloat(f1_score.toFixed(4)),
  }
}

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

    // --- Validate request body ---
    const body: TrainModelRequest = await req.json()
    const { dataset_id, model_type, config } = body

    if (!dataset_id || !model_type || !config) {
      return new Response(
        JSON.stringify({ code: 'invalid_request', message: 'Missing required fields: dataset_id, model_type, config' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!config.epochs || !config.batch_size || !config.learning_rate || !config.architecture) {
      return new Response(
        JSON.stringify({ code: 'invalid_request', message: 'Config must include epochs, batch_size, learning_rate, and architecture' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Get user tier ---
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single()

    const tier: Tier = (subscription?.tier as Tier) || 'free'
    const limits = TIER_LIMITS[tier]

    // --- Check monthly session quota ---
    if (limits.max_training_sessions_per_month !== null) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: monthlyCount } = await supabase
        .from('training_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      if ((monthlyCount ?? 0) >= limits.max_training_sessions_per_month) {
        return new Response(
          JSON.stringify({
            code: 'quota_exceeded',
            message: 'Monthly training session limit reached',
            details: { limit: limits.max_training_sessions_per_month, current: monthlyCount, upgrade_tier: tier === 'free' ? 'pro' : 'enterprise' },
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // --- Check concurrent jobs ---
    const { count: runningCount } = await supabase
      .from('training_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'running')

    if ((runningCount ?? 0) >= limits.max_concurrent_jobs) {
      return new Response(
        JSON.stringify({
          code: 'concurrent_limit',
          message: 'Maximum concurrent training jobs reached',
          details: { limit: limits.max_concurrent_jobs, current: runningCount },
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Check daily rate limit ---
    if (limits.max_daily_training_requests !== null) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const { count: dailyCount } = await supabase
        .from('training_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())

      if ((dailyCount ?? 0) >= limits.max_daily_training_requests) {
        return new Response(
          JSON.stringify({
            code: 'daily_rate_limit',
            message: 'Daily training request limit reached',
            details: { limit: limits.max_daily_training_requests, current: dailyCount },
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // --- Check platform compute budget ---
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
    const consumedMinutes = dailyUsage?.total_minutes ?? 0

    if (consumedMinutes >= dailyBudgetLimit) {
      return new Response(
        JSON.stringify({
          code: 'platform_budget_exhausted',
          message: 'Platform compute budget exhausted. Your job has been queued.',
          details: { limit: dailyBudgetLimit, current: consumedMinutes },
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Fetch dataset and validate row count ---
    const { data: dataset } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', dataset_id)
      .eq('user_id', user.id)
      .single()

    if (!dataset) {
      return new Response(
        JSON.stringify({ code: 'not_found', message: 'Dataset not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (limits.max_dataset_rows !== null && dataset.row_count && dataset.row_count > limits.max_dataset_rows) {
      return new Response(
        JSON.stringify({
          code: 'dataset_too_large',
          message: `Dataset exceeds row limit for ${tier} tier`,
          details: { limit: limits.max_dataset_rows, current: dataset.row_count, upgrade_tier: tier === 'free' ? 'pro' : 'enterprise' },
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Validate epochs against tier limit ---
    if (limits.max_epochs !== null && config.epochs > limits.max_epochs) {
      return new Response(
        JSON.stringify({
          code: 'epochs_exceeded',
          message: `Requested epochs exceed limit for ${tier} tier`,
          details: { limit: limits.max_epochs, current: config.epochs, upgrade_tier: tier === 'free' ? 'pro' : 'enterprise' },
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Insert training session record ---
    const { data: session, error: insertError } = await supabase
      .from('training_sessions')
      .insert({
        user_id: user.id,
        dataset_id: dataset_id,
        project_id: dataset.project_id,
        model_type: model_type,
        config: config,
        epochs: config.epochs,
        current_epoch: 0,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError || !session) {
      return new Response(
        JSON.stringify({ code: 'internal_error', message: 'Failed to create training session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sessionId = session.id
    const startTime = Date.now()
    const maxDuration = limits.max_training_duration_seconds
      ? limits.max_training_duration_seconds * 1000
      : null

    // --- Fetch dataset content from storage ---
    let csvData: { headers: string[]; rows: string[][] } = { headers: [], rows: [] }
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-datasets')
        .download(dataset.file_url)

      if (downloadError || !fileData) {
        throw new Error('Failed to download dataset file')
      }

      const content = await fileData.text()
      csvData = parseCSV(content)
    } catch (_e) {
      // If we can't fetch the dataset, we still run the simulation
      // The training loop works with simulated metrics regardless
    }

    // --- Training loop ---
    const realtimeChannel = `training:${sessionId}`
    let lastMetrics = { loss: 2.0, accuracy: 0.1 }
    let timedOut = false

    try {
      for (let epoch = 1; epoch <= config.epochs; epoch++) {
        // Check timeout
        if (maxDuration && (Date.now() - startTime) >= maxDuration) {
          timedOut = true
          break
        }

        // Simulate epoch training
        const epochMetrics = simulateEpoch(epoch, config.epochs)
        lastMetrics = epochMetrics

        // Update current epoch in DB
        await supabase
          .from('training_sessions')
          .update({ current_epoch: epoch })
          .eq('id', sessionId)

        // Broadcast progress via Realtime
        await supabase.channel(realtimeChannel).send({
          type: 'broadcast',
          event: 'training_progress',
          payload: {
            epoch,
            total_epochs: config.epochs,
            loss: epochMetrics.loss,
            accuracy: epochMetrics.accuracy,
            elapsed_seconds: (Date.now() - startTime) / 1000,
          },
        })

        // Small delay to simulate computation time
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      if (timedOut) {
        // --- Timeout handling ---
        const elapsedMinutes = (Date.now() - startTime) / 60000
        const partialMetrics: TrainingMetrics = {
          accuracy: parseFloat(lastMetrics.accuracy.toFixed(4)),
          loss: parseFloat(lastMetrics.loss.toFixed(4)),
          precision: parseFloat((lastMetrics.accuracy * 0.95).toFixed(4)),
          recall: parseFloat((lastMetrics.accuracy * 0.93).toFixed(4)),
          f1_score: 0,
        }
        partialMetrics.f1_score = parseFloat(
          (2 * (partialMetrics.precision * partialMetrics.recall) / (partialMetrics.precision + partialMetrics.recall)).toFixed(4)
        )

        await supabase
          .from('training_sessions')
          .update({
            status: 'timeout',
            metrics: partialMetrics,
            accuracy: partialMetrics.accuracy,
            loss: partialMetrics.loss,
            precision_score: partialMetrics.precision,
            recall_score: partialMetrics.recall,
            f1_score: partialMetrics.f1_score,
            compute_minutes: elapsedMinutes,
            error_message: 'Training timed out - partial results available',
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionId)

        // Broadcast completion event
        await supabase.channel(realtimeChannel).send({
          type: 'broadcast',
          event: 'training_complete',
          payload: {
            session_id: sessionId,
            status: 'timeout',
            metrics: partialMetrics,
            error: 'Training timed out - partial results available',
          },
        })

        return new Response(
          JSON.stringify({
            session_id: sessionId,
            status: 'timeout',
            metrics: partialMetrics,
            error: 'Training timed out - partial results available',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // --- Completion ---
      const finalMetrics = computeFinalMetrics(config.epochs)
      const elapsedMinutes = (Date.now() - startTime) / 60000

      // Upload model artifact
      const artifactPath = `${user.id}/${sessionId}/model.json`
      const artifactContent = JSON.stringify({
        model_type,
        architecture: config.architecture,
        epochs: config.epochs,
        metrics: finalMetrics,
        trained_at: new Date().toISOString(),
        dataset_rows: csvData.rows.length || dataset.row_count || 0,
      })

      await supabase.storage
        .from('model-artifacts')
        .upload(artifactPath, new TextEncoder().encode(artifactContent), {
          contentType: 'application/json',
          upsert: true,
        })

      // Update session with completion
      await supabase
        .from('training_sessions')
        .update({
          status: 'completed',
          metrics: finalMetrics,
          accuracy: finalMetrics.accuracy,
          loss: finalMetrics.loss,
          precision_score: finalMetrics.precision,
          recall_score: finalMetrics.recall,
          f1_score: finalMetrics.f1_score,
          model_artifact_url: artifactPath,
          compute_minutes: elapsedMinutes,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      // Increment usage - only on success
      await supabase.from('usage_events').insert({
        user_id: user.id,
        resource_type: 'training',
        amount: 1,
        compute_minutes: elapsedMinutes,
        metadata: { session_id: sessionId, model_type, architecture: config.architecture },
      })

      // Update daily compute usage
      const { data: existingDailyUsage } = await supabase
        .from('daily_compute_usage')
        .select('*')
        .eq('date', today)
        .single()

      if (existingDailyUsage) {
        await supabase
          .from('daily_compute_usage')
          .update({
            total_minutes: existingDailyUsage.total_minutes + elapsedMinutes,
            job_count: existingDailyUsage.job_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('date', today)
      } else {
        await supabase.from('daily_compute_usage').insert({
          date: today,
          total_minutes: elapsedMinutes,
          job_count: 1,
        })
      }

      // Broadcast completion event
      await supabase.channel(realtimeChannel).send({
        type: 'broadcast',
        event: 'training_complete',
        payload: {
          session_id: sessionId,
          status: 'completed',
          metrics: finalMetrics,
          model_artifact_url: artifactPath,
        },
      })

      return new Response(
        JSON.stringify({
          session_id: sessionId,
          status: 'completed',
          metrics: finalMetrics,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (trainingError) {
      // --- Failure handling ---
      const errorMessage = trainingError instanceof Error ? trainingError.message : 'Unknown training error'

      await supabase
        .from('training_sessions')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      // Do NOT increment usage counter on failure
      // Broadcast failure event
      await supabase.channel(realtimeChannel).send({
        type: 'broadcast',
        event: 'training_complete',
        payload: {
          session_id: sessionId,
          status: 'failed',
          error: errorMessage,
        },
      })

      return new Response(
        JSON.stringify({
          session_id: sessionId,
          status: 'failed',
          error: errorMessage,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ code: 'internal_error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
