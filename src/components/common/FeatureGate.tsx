import { ReactNode } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { featureGatingService } from '@/services/featureGatingService';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';

interface FeatureGateProps {
  featureName: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that checks tier access for a given feature.
 * If the current user's tier has access, renders children.
 * If access is denied, renders the UpgradePrompt or a custom fallback.
 */
export function FeatureGate({ featureName, children, fallback }: FeatureGateProps) {
  const { tier } = useSubscription();
  const hasAccess = featureGatingService.hasFeatureAccess(tier, featureName);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <UpgradePrompt featureName={featureName} />;
}
