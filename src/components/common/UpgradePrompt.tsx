import { Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { featureGatingService } from '@/services/featureGatingService';

interface UpgradePromptProps {
  featureName: string;
}

/**
 * Contextual upgrade dialog that shows when a user tries to access a gated feature.
 * Displays the feature description, suggested tier, and action buttons.
 */
export function UpgradePrompt({ featureName }: UpgradePromptProps) {
  const { tier, isOnTrial, initiateCheckout, startFreeTrial } = useSubscription();
  const prompt = featureGatingService.getUpgradePrompt(featureName);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">{prompt.title}</CardTitle>
          </div>
          <Badge variant="secondary" className="capitalize">
            {tier} tier
          </Badge>
        </div>
        <CardDescription>{prompt.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {!isOnTrial && (
            <Button variant="outline" size="sm" onClick={() => startFreeTrial()}>
              <Sparkles className="h-3.5 w-3.5" />
              Start Free Trial
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => initiateCheckout(prompt.suggestedTier === 'enterprise' ? 'enterprise' : 'pro', 'monthly')}
          >
            Upgrade to {prompt.suggestedTier === 'enterprise' ? 'Enterprise' : 'Pro'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
