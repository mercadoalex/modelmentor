export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
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

export const DEFAULT_LIMITS: Record<SubscriptionTier, UsageLimits> = {
  free: {
    tier: 'free',
    max_projects: 3,
    max_training_sessions: 10,
    max_storage_mb: 100,
    max_api_calls: 50,
    max_reports: 5,
    features: {
      pdf_export: true,
      kaggle_integration: false,
      collaboration: false,
      advanced_visualizations: false,
      model_deployment: false,
      priority_support: false,
    },
  },
  pro: {
    tier: 'pro',
    max_projects: 50,
    max_training_sessions: 500,
    max_storage_mb: 5000,
    max_api_calls: 1000,
    max_reports: 100,
    features: {
      pdf_export: true,
      kaggle_integration: true,
      collaboration: true,
      advanced_visualizations: true,
      model_deployment: true,
      priority_support: false,
    },
  },
  enterprise: {
    tier: 'enterprise',
    max_projects: null,
    max_training_sessions: null,
    max_storage_mb: null,
    max_api_calls: null,
    max_reports: null,
    features: {
      pdf_export: true,
      kaggle_integration: true,
      collaboration: true,
      advanced_visualizations: true,
      model_deployment: true,
      priority_support: true,
    },
  },
};