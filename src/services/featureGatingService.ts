import { TIER_LIMITS, type SubscriptionTier } from '@/types/subscription';

interface UpgradePrompt {
  title: string;
  description: string;
  suggestedTier: SubscriptionTier;
}

const UPGRADE_PROMPTS: Record<string, UpgradePrompt> = {
  kaggle_integration: {
    title: 'Kaggle Dataset Integration',
    description: 'Import datasets directly from Kaggle for real-world ML practice',
    suggestedTier: 'pro',
  },
  collaboration: {
    title: 'Team Collaboration',
    description: 'Share projects and collaborate with classmates in real-time',
    suggestedTier: 'pro',
  },
  advanced_visualizations: {
    title: 'Advanced Visualizations',
    description: 'Access interactive 3D plots, confusion matrices, and model comparison dashboards',
    suggestedTier: 'pro',
  },
  model_deployment: {
    title: 'Model Deployment',
    description: 'Deploy your trained models as live APIs for real-world testing',
    suggestedTier: 'pro',
  },
  pdf_export: {
    title: 'PDF Report Export',
    description: 'Generate professional PDF reports of your ML experiments',
    suggestedTier: 'free',
  },
};

export const featureGatingService = {
  /**
   * Checks whether a given tier has access to a specific feature.
   * Returns true if the tier's feature configuration map has the feature set to true.
   */
  hasFeatureAccess(tier: SubscriptionTier, featureName: string): boolean {
    const tierConfig = TIER_LIMITS[tier];
    return tierConfig.features[featureName] === true;
  },

  /**
   * Returns the list of features that are NOT available on the given tier.
   */
  getGatedFeatures(tier: SubscriptionTier): string[] {
    const tierConfig = TIER_LIMITS[tier];
    return Object.entries(tierConfig.features)
      .filter(([, enabled]) => !enabled)
      .map(([featureName]) => featureName);
  },

  /**
   * Returns contextual upgrade messaging for a given feature.
   * If the feature is not found in the prompts map, returns a generic prompt.
   */
  getUpgradePrompt(featureName: string): UpgradePrompt {
    const prompt = UPGRADE_PROMPTS[featureName];
    if (prompt) {
      return prompt;
    }
    return {
      title: featureName,
      description: `Upgrade your plan to access ${featureName}`,
      suggestedTier: 'pro',
    };
  },
};
