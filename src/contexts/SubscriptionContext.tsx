import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/subscriptionService';
import { usageTrackingService } from '@/services/usageTrackingService';
import { toast } from 'sonner';
import type {
  SubscriptionTier,
  SubscriptionStatus,
  UsageSummary,
  TierLimits,
  ResourceType,
} from '@/types/subscription';
import { TIER_LIMITS } from '@/types/subscription';
import { shouldShowWarning } from '@/utils/subscriptionUtils';

interface Warning {
  resource: string;
  percentUsed: number;
}

interface CheckCanPerformResult {
  allowed: boolean;
  reason?: string;
}

interface SubscriptionContextType {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isOnTrial: boolean;
  trialDaysRemaining: number;
  usage: UsageSummary;
  limits: TierLimits;
  warnings: Warning[];
  loading: boolean;
  checkCanPerform: (resourceType: ResourceType) => CheckCanPerformResult;
  initiateCheckout: (tier: 'pro' | 'enterprise', billingPeriod: 'monthly' | 'yearly') => Promise<void>;
  refreshUsage: () => Promise<void>;
  startFreeTrial: () => Promise<void>;
}

const defaultUsage: UsageSummary = {
  projects: 0,
  training_sessions: 0,
  storage_mb: 0,
  api_calls: 0,
  reports: 0,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [isOnTrial, setIsOnTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [usage, setUsage] = useState<UsageSummary>(defaultUsage);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);

  const limits = TIER_LIMITS[tier];

  const fetchSubscriptionData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [subscription, trialStatus, usageSummary] = await Promise.all([
        subscriptionService.getSubscription(user.id),
        subscriptionService.getTrialStatus(user.id),
        usageTrackingService.getMonthlyUsageSummary(user.id),
      ]);

      if (subscription) {
        setTier(subscription.tier);
        setStatus(subscription.status);
      } else {
        setTier('free');
        setStatus('active');
      }

      setIsOnTrial(trialStatus.isOnTrial);
      setTrialDaysRemaining(trialStatus.daysRemaining);
      setUsage(usageSummary);

      // Calculate warnings
      const currentTier = subscription?.tier ?? 'free';
      const currentLimits = TIER_LIMITS[currentTier];
      const newWarnings: Warning[] = [];

      const resourceChecks: Array<{ resource: string; used: number; limit: number | null }> = [
        { resource: 'projects', used: usageSummary.projects, limit: currentLimits.max_projects },
        { resource: 'training_sessions', used: usageSummary.training_sessions, limit: currentLimits.max_training_sessions_per_month },
        { resource: 'storage_mb', used: usageSummary.storage_mb, limit: currentLimits.max_storage_mb },
      ];

      for (const { resource, used, limit } of resourceChecks) {
        if (shouldShowWarning(used, limit)) {
          const percentUsed = limit !== null ? Math.round((used / limit) * 100) : 0;
          newWarnings.push({ resource, percentUsed });
        }
      }

      setWarnings(newWarnings);

      // Show toast notifications for warnings
      for (const warning of newWarnings) {
        toast.warning(
          `You've used ${warning.percentUsed}% of your ${warning.resource.replace('_', ' ')} limit. Consider upgrading your plan.`
        );
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSubscriptionData();
    }
  }, [isAuthenticated, user, fetchSubscriptionData]);

  const checkCanPerform = useCallback(
    (resourceType: ResourceType): CheckCanPerformResult => {
      const resourceMap: Partial<Record<ResourceType, { used: number; max: number | null; label: string }>> = {
        project: { used: usage.projects, max: limits.max_projects, label: 'projects' },
        training: { used: usage.training_sessions, max: limits.max_training_sessions_per_month, label: 'training sessions' },
        storage: { used: usage.storage_mb, max: limits.max_storage_mb, label: 'MB storage' },
      };

      const check = resourceMap[resourceType];
      if (!check) {
        return { allowed: true };
      }

      // null limit means unlimited
      if (check.max === null) {
        return { allowed: true };
      }

      if (check.used >= check.max) {
        return {
          allowed: false,
          reason: `You've reached your ${tier} plan limit of ${check.max} ${check.label}. Please upgrade to continue.`,
        };
      }

      return { allowed: true };
    },
    [usage, limits, tier]
  );

  const initiateCheckout = useCallback(
    async (checkoutTier: 'pro' | 'enterprise', billingPeriod: 'monthly' | 'yearly'): Promise<void> => {
      try {
        const successUrl = `${window.location.origin}/settings?checkout=success`;
        const cancelUrl = `${window.location.origin}/pricing?checkout=cancelled`;

        const { checkoutUrl } = await subscriptionService.createCheckoutSession(
          checkoutTier,
          billingPeriod,
          successUrl,
          cancelUrl
        );

        window.location.href = checkoutUrl;
      } catch (error) {
        console.error('Error initiating checkout:', error);
        toast.error('Failed to start checkout. Please try again.');
        throw error;
      }
    },
    []
  );

  const refreshUsage = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const usageSummary = await usageTrackingService.getMonthlyUsageSummary(user.id);
      setUsage(usageSummary);

      // Recalculate warnings
      const currentLimits = TIER_LIMITS[tier];
      const newWarnings: Warning[] = [];

      const resourceChecks: Array<{ resource: string; used: number; limit: number | null }> = [
        { resource: 'projects', used: usageSummary.projects, limit: currentLimits.max_projects },
        { resource: 'training_sessions', used: usageSummary.training_sessions, limit: currentLimits.max_training_sessions_per_month },
        { resource: 'storage_mb', used: usageSummary.storage_mb, limit: currentLimits.max_storage_mb },
      ];

      for (const { resource, used, limit } of resourceChecks) {
        if (shouldShowWarning(used, limit)) {
          const percentUsed = limit !== null ? Math.round((used / limit) * 100) : 0;
          newWarnings.push({ resource, percentUsed });
        }
      }

      setWarnings(newWarnings);
    } catch (error) {
      console.error('Error refreshing usage:', error);
    }
  }, [user, tier]);

  const startFreeTrial = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      await subscriptionService.startTrial(user.id);
      toast.success('Your 14-day free trial has started! Enjoy Pro features.');
      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error('Failed to start trial. Please try again.');
      throw error;
    }
  }, [user, fetchSubscriptionData]);

  const value: SubscriptionContextType = {
    tier,
    status,
    isOnTrial,
    trialDaysRemaining,
    usage,
    limits,
    warnings,
    loading,
    checkCanPerform,
    initiateCheckout,
    refreshUsage,
    startFreeTrial,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
