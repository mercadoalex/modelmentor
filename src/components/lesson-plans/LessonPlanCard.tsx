import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { CurriculumLessonPlan } from '@/data/lessonPlans/types';

interface LessonPlanCardProps {
  plan: CurriculumLessonPlan;
}

export function LessonPlanCard({ plan }: LessonPlanCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/teacher/lesson-plans/${plan.slug}`);
  };

  const overview = t(`lessonPlans.plans.${plan.slug}.overview`, { defaultValue: plan.overview });
  const truncatedOverview = overview.length > 100 ? overview.slice(0, 100) + '…' : overview;

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {t(`lessonPlans.plans.${plan.slug}.title`, { defaultValue: plan.title })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{truncatedOverview}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {t(`lessonPlans.ui.gradeBands.${plan.gradeBand}`)}
          </Badge>
          <Badge variant="secondary">
            {t(`lessonPlans.ui.subjects.${plan.subjectArea}`)}
          </Badge>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {t(`lessonPlans.ui.durations.${plan.duration}`)}
          </Badge>
          <Badge variant="outline">
            {t(`lessonPlans.ui.modelTypes.${plan.modelType}`)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
