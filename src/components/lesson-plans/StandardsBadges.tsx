import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Standard, SEPAlignment } from '@/data/lessonPlans/types';

interface StandardsBadgesProps {
  standards: Standard[];
  sepAlignment?: SEPAlignment;
}

export function StandardsBadges({ standards, sepAlignment }: StandardsBadgesProps) {
  const { t, i18n } = useTranslation();
  const showSEP = i18n.language.startsWith('es');

  return (
    <div className="space-y-3">
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {standards.map((standard) => (
            <Tooltip key={standard.code}>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-help">
                  {standard.code} ({standard.type})
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">{t(`lessonPlans.standards.${standard.code.toLowerCase().replace(/\./g, '-')}.name`, { defaultValue: standard.name })}</p>
                <p className="text-xs mt-1">
                  {t(`lessonPlans.standards.${standard.code.toLowerCase().replace(/\./g, '-')}.description`, { defaultValue: standard.description })}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {showSEP && sepAlignment && (
        <div className="mt-2 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            SEP: {sepAlignment.area}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {sepAlignment.description}
          </p>
        </div>
      )}
    </div>
  );
}
