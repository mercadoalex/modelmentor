import { supabase } from '@/db/supabase';
import type { UserSubscription, UsageTracking, ResourceType, UsageSummary, SubscriptionTier } from '@/types/subscription';
import { DEFAULT_LIMITS, TIER_LIMITS } from '@/types/subscription';
import { shouldShowWarning } from '@/utils/subscriptionUtils';

export const usageTrackingService = {

  // ── Subscription ───────────────────────────────────────────────────────────
  async getSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) console.error('getSubscription error:', error);
    return data;
  },

  async getTier(userId: string): Promise<SubscriptionTier> {
    const subscription = await this.getSubscription(userId);
    return subscription?.tier ?? 'free';
  },

  // ── Legacy usage tracking (usage_tracking table) ───────────────────────────
  async track(userId: string, resourceType: ResourceType, amount = 1, metadata?: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('usage_tracking')
      .insert({ user_id: userId, resource_type: resourceType, amount, metadata });

    if (error) console.error('track usage error:', error);
  },

  async getUsageSummary(userId: string): Promise<UsageSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('resource_type, amount')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth);

    if (error) console.error('getUsageSummary error:', error);

    const rows = data ?? [];
    const sum = (type: ResourceType) =>
      rows.filter(r => r.resource_type === type).reduce((acc, r) => acc + r.amount, 0);

    return {
      projects:          sum('project'),
      training_sessions: sum('training'),
      storage_mb:        sum('storage'),
      api_calls:         sum('api_call'),
      reports:           sum('report'),
    };
  },

  // ── New event-based usage tracking (usage_events table) ────────────────────

  /**
   * Inserts a usage event into the usage_events table (new event-based tracking).
   */
  async trackEvent(
    userId: string,
    resourceType: ResourceType,
    amount: number,
    computeMinutes?: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        resource_type: resourceType,
        amount,
        compute_minutes: computeMinutes ?? null,
        metadata: metadata ?? null,
      });

    if (error) console.error('trackEvent error:', error);
  },

  /**
   * Aggregates usage from usage_events for the current calendar month only.
   */
  async getMonthlyUsageSummary(userId: string): Promise<UsageSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from('usage_events')
      .select('resource_type, amount')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth);

    if (error) console.error('getMonthlyUsageSummary error:', error);

    const rows = data ?? [];
    const sum = (type: ResourceType) =>
      rows.filter(r => r.resource_type === type).reduce((acc, r) => acc + r.amount, 0);

    return {
      projects:          sum('project'),
      training_sessions: sum('training'),
      storage_mb:        sum('storage'),
      api_calls:         sum('api_call'),
      reports:           sum('report'),
    };
  },

  /**
   * Counts today's training events for a user (for rate limiting).
   */
  async getDailyTrainingCount(userId: string): Promise<number> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data, error } = await supabase
      .from('usage_events')
      .select('amount')
      .eq('user_id', userId)
      .eq('resource_type', 'training')
      .gte('created_at', startOfDay);

    if (error) {
      console.error('getDailyTrainingCount error:', error);
      return 0;
    }

    return (data ?? []).reduce((acc, r) => acc + r.amount, 0);
  },

  /**
   * Enforces daily rate limit: 5 training requests/day for free tier.
   * A null max_daily_training_requests means unlimited.
   */
  async checkDailyRateLimit(
    userId: string,
    tier: SubscriptionTier
  ): Promise<{ allowed: boolean; reason?: string }> {
    const limits = TIER_LIMITS[tier];
    const maxDaily = limits.max_daily_training_requests;

    // null means unlimited
    if (maxDaily === null) {
      return { allowed: true };
    }

    const dailyCount = await this.getDailyTrainingCount(userId);

    if (dailyCount >= maxDaily) {
      return {
        allowed: false,
        reason: `You've reached your daily limit of ${maxDaily} training requests. Please try again tomorrow.`,
      };
    }

    return { allowed: true };
  },

  /**
   * Reads daily_compute_usage and platform_config to determine compute budget status.
   */
  async getComputeBudgetStatus(): Promise<{ available: boolean; consumedMinutes: number; limitMinutes: number }> {
    // Fetch the daily compute budget limit from platform_config
    const { data: configData, error: configError } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', 'daily_compute_budget')
      .maybeSingle();

    if (configError) console.error('getComputeBudgetStatus config error:', configError);

    const limitMinutes: number = configData?.value?.limit_minutes ?? 1440;

    // Fetch today's compute usage
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: usageData, error: usageError } = await supabase
      .from('daily_compute_usage')
      .select('total_minutes')
      .eq('date', today)
      .maybeSingle();

    if (usageError) console.error('getComputeBudgetStatus usage error:', usageError);

    const consumedMinutes: number = usageData?.total_minutes ?? 0;

    return {
      available: consumedMinutes < limitMinutes,
      consumedMinutes,
      limitMinutes,
    };
  },

  // ── Limit checks ───────────────────────────────────────────────────────────

  /**
   * Checks whether a user can perform an action, using the new usage_events table
   * and including daily rate limit checks for training.
   */
  async canPerformAction(userId: string, resourceType: ResourceType): Promise<{ allowed: boolean; reason?: string; tier: SubscriptionTier }> {
    const tier = await this.getTier(userId);
    const limits = TIER_LIMITS[tier];
    const usage = await this.getMonthlyUsageSummary(userId);

    // Monthly limit checks
    const checks: Partial<Record<ResourceType, { used: number; max: number | null; label: string }>> = {
      project:   { used: usage.projects,           max: limits.max_projects,                      label: 'projects' },
      training:  { used: usage.training_sessions,  max: limits.max_training_sessions_per_month,   label: 'training sessions' },
      storage:   { used: usage.storage_mb,         max: limits.max_storage_mb,                    label: 'MB storage' },
    };

    const check = checks[resourceType];
    if (check && check.max !== null && check.used >= check.max) {
      return {
        allowed: false,
        reason: `You've reached your ${tier} plan limit of ${check.max} ${check.label} this month.`,
        tier,
      };
    }

    // Daily rate limit check for training
    if (resourceType === 'training') {
      const rateLimit = await this.checkDailyRateLimit(userId, tier);
      if (!rateLimit.allowed) {
        return {
          allowed: false,
          reason: rateLimit.reason,
          tier,
        };
      }
    }

    return { allowed: true, tier };
  },

  /**
   * Returns resources at ≥80% usage for warning display.
   */
  async getWarnings(userId: string): Promise<Array<{ resource: string; percentUsed: number }>> {
    const tier = await this.getTier(userId);
    const limits = TIER_LIMITS[tier];
    const usage = await this.getMonthlyUsageSummary(userId);

    const warnings: Array<{ resource: string; percentUsed: number }> = [];

    const resourceChecks: Array<{ resource: string; used: number; limit: number | null }> = [
      { resource: 'projects',          used: usage.projects,           limit: limits.max_projects },
      { resource: 'training_sessions', used: usage.training_sessions,  limit: limits.max_training_sessions_per_month },
      { resource: 'storage_mb',        used: usage.storage_mb,         limit: limits.max_storage_mb },
    ];

    for (const { resource, used, limit } of resourceChecks) {
      if (shouldShowWarning(used, limit)) {
        const percentUsed = limit !== null ? Math.round((used / limit) * 100) : 0;
        warnings.push({ resource, percentUsed });
      }
    }

    return warnings;
  },

  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const tier    = await this.getTier(userId);
    const limits  = DEFAULT_LIMITS[tier];
    return limits.features[feature] ?? false;
  },
};
