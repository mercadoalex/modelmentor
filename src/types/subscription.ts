export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due';
export type ResourceType = 'project' | 'training' | 'storage' | 'api_call' | 'report';

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  started_at: string;
  expires_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  trial_ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  resource_type: ResourceType;
  amount: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface UsageEvent {
  id: string;
  user_id: string;
  resource_type: ResourceType;
  amount: number;
  compute_minutes?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface TrainingConfig {
  epochs: number;
  batch_size: number;
  learning_rate: number;
  architecture: 'shallow_nn' | 'decision_tree' | 'random_forest' | 'logistic_regression';
}

export interface TrainModelRequest {
  dataset_id: string;
  model_type: 'classification' | 'regression' | 'image_classification' | 'text_classification';
  config: TrainingConfig;
}

export interface TrainModelResponse {
  session_id: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  metrics?: {
    accuracy: number;
    loss: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  error?: string;
}

export interface CheckUsageResponse {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trial_days_remaining: number | null;
  usage: UsageSummary;
  limits: TierLimits;
  compute_budget: {
    daily_limit_minutes: number;
    consumed_today_minutes: number;
    available: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: {
    limit?: number;
    current?: number;
    remaining?: number;
    upgrade_tier?: string;
  };
}

export interface UsageLimits {
  tier: SubscriptionTier;
  max_projects: number | null;
  max_training_sessions: number | null;
  max_storage_mb: number | null;
  max_api_calls: number | null;
  max_reports: number | null;
  features: Record<string, boolean>;
}

export interface UsageSummary {
  projects: number;
  training_sessions: number;
  storage_mb: number;
  api_calls: number;
  reports: number;
}

export interface TierLimits {
  max_projects: number | null;
  max_training_sessions_per_month: number | null;
  max_storage_mb: number | null;
  max_file_size_mb: number | null;
  max_training_duration_seconds: number | null;
  max_dataset_rows: number | null;
  max_epochs: number | null;
  max_concurrent_jobs: number;
  max_daily_training_requests: number | null;
  features: Record<string, boolean>;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    max_projects: 3,
    max_training_sessions_per_month: 10,
    max_storage_mb: 100,
    max_file_size_mb: 50,
    max_training_duration_seconds: 120,
    max_dataset_rows: 10_000,
    max_epochs: 50,
    max_concurrent_jobs: 1,
    max_daily_training_requests: 5,
    features: {
      kaggle_integration: false,
      collaboration: false,
      advanced_visualizations: false,
      model_deployment: false,
      pdf_export: true,
    },
  },
  pro: {
    max_projects: 50,
    max_training_sessions_per_month: 500,
    max_storage_mb: 5_000,
    max_file_size_mb: 500,
    max_training_duration_seconds: 600,
    max_dataset_rows: 100_000,
    max_epochs: 200,
    max_concurrent_jobs: 2,
    max_daily_training_requests: null,
    features: {
      kaggle_integration: true,
      collaboration: true,
      advanced_visualizations: true,
      model_deployment: true,
      pdf_export: true,
    },
  },
  enterprise: {
    max_projects: null,
    max_training_sessions_per_month: null,
    max_storage_mb: null,
    max_file_size_mb: null,
    max_training_duration_seconds: null,
    max_dataset_rows: null,
    max_epochs: null,
    max_concurrent_jobs: 5,
    max_daily_training_requests: null,
    features: {
      kaggle_integration: true,
      collaboration: true,
      advanced_visualizations: true,
      model_deployment: true,
      pdf_export: true,
    },
  },
} as const;

/**
 * @deprecated Use TIER_LIMITS instead. This alias is kept for backward compatibility.
 */
export const DEFAULT_LIMITS: Record<SubscriptionTier, UsageLimits> = {
  free: {
    tier: 'free',
    max_projects: TIER_LIMITS.free.max_projects,
    max_training_sessions: TIER_LIMITS.free.max_training_sessions_per_month,
    max_storage_mb: TIER_LIMITS.free.max_storage_mb,
    max_api_calls: 50,
    max_reports: 5,
    features: TIER_LIMITS.free.features,
  },
  pro: {
    tier: 'pro',
    max_projects: TIER_LIMITS.pro.max_projects,
    max_training_sessions: TIER_LIMITS.pro.max_training_sessions_per_month,
    max_storage_mb: TIER_LIMITS.pro.max_storage_mb,
    max_api_calls: 1000,
    max_reports: 100,
    features: TIER_LIMITS.pro.features,
  },
  enterprise: {
    tier: 'enterprise',
    max_projects: TIER_LIMITS.enterprise.max_projects,
    max_training_sessions: TIER_LIMITS.enterprise.max_training_sessions_per_month,
    max_storage_mb: TIER_LIMITS.enterprise.max_storage_mb,
    max_api_calls: null,
    max_reports: null,
    features: TIER_LIMITS.enterprise.features,
  },
};
