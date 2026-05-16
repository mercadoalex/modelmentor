import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DifferentiationStrategy } from '@/data/lessonPlans/types';

interface DifferentiationStrategiesProps {
  differentiation: DifferentiationStrategy[];
}

const LEVEL_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  struggling: {
    border: 'border-orange-200 dark:border-orange-800',
    bg: 'bg-orange-50 dark:bg-orange-950',
    text: 'text-orange-700 dark:text-orange-300',
  },
  'on-level': {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
  },
  advanced: {
    border: 'border-purple-200 dark:border-purple-800',
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-700 dark:text-purple-300',
  },
};

export function DifferentiationStrategies({ differentiation }: DifferentiationStrategiesProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {differentiation.map((strategy) => {
        const styles = LEVEL_STYLES[strategy.level] || LEVEL_STYLES['on-level'];
        return (
          <Card key={strategy.level} className={`${styles.border}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm ${styles.text}`}>
                {t(`lessonPlans.ui.diffLevels.${strategy.level}`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {strategy.strategies.map((s, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              {strategy.modelMentorFeatures && strategy.modelMentorFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  {strategy.modelMentorFeatures.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
