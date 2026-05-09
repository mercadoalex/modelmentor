import { supabase } from '@/db/supabase';
import type { UserSubscription, UsageTracking, ResourceType, UsageSummary, SubscriptionTier } from '@/types/subscription';
import { DEFAULT_LIMITS } from '@/types/subscription';

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

  // ── Usage tracking ─────────────────────────────────────────────────────────
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

  // ── Limit checks ───────────────────────────────────────────────────────────
  async canPerformAction(userId: string, resourceType: ResourceType): Promise<{ allowed: boolean; reason?: string; tier: SubscriptionTier }> {
    const tier    = await this.getTier(userId);
    const limits  = DEFAULT_LIMITS[tier];
    const usage   = await this.getUsageSummary(userId);

    const checks: Partial<Record<ResourceType, { used: number; max: number | null; label: string }>> = {
      project:   { used: usage.projects,          max: limits.max_projects,          label: 'projects' },
      training:  { used: usage.training_sessions,  max: limits.max_training_sessions, label: 'training sessions' },
      storage:   { used: usage.storage_mb,         max: limits.max_storage_mb,        label: 'MB storage' },
      api_call:  { used: usage.api_calls,          max: limits.max_api_calls,         label: 'API calls' },
      report:    { used: usage.reports,            max: limits.max_reports,           label: 'reports' },
    };

    const check = checks[resourceType];
    if (!check || check.max === null) return { allowed: true, tier };

    if (check.used >= check.max) {
      return {
        allowed: false,
        reason:  `You've reached your ${tier} plan limit of ${check.max} ${check.label} this month.`,
        tier,
      };
    }

    return { allowed: true, tier };
  },

  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const tier    = await this.getTier(userId);
    const limits  = DEFAULT_LIMITS[tier];
    return limits.features[feature] ?? false;
  },
};