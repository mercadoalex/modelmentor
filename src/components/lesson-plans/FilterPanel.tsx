import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import type { LessonPlanFilters } from '@/data/lessonPlans/filters';
import type { GradeBand, ModelType, SubjectArea, Duration } from '@/data/lessonPlans/types';

interface FilterPanelProps {
  filters: LessonPlanFilters;
  onFilterChange: (filters: LessonPlanFilters) => void;
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const { t } = useTranslation();

  const gradeBands: GradeBand[] = ['6-8', '9-12'];
  const subjects: SubjectArea[] = ['computer-science', 'mathematics', 'science', 'cross-curricular'];
  const durations: Duration[] = ['45min', '60min', '90min'];
  const modelTypes: ModelType[] = ['image-classification', 'text-classification', 'regression'];

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const handleClear = () => {
    onFilterChange({});
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Select
        value={filters.gradeBand || ''}
        onValueChange={(value) =>
          onFilterChange({ ...filters, gradeBand: (value || undefined) as GradeBand | undefined })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('lessonPlans.ui.gradeBand')} />
        </SelectTrigger>
        <SelectContent>
          {gradeBands.map((band) => (
            <SelectItem key={band} value={band}>
              {t(`lessonPlans.ui.gradeBands.${band}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.subjectArea || ''}
        onValueChange={(value) =>
          onFilterChange({ ...filters, subjectArea: (value || undefined) as SubjectArea | undefined })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('lessonPlans.ui.subjectArea')} />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((subject) => (
            <SelectItem key={subject} value={subject}>
              {t(`lessonPlans.ui.subjects.${subject}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.duration || ''}
        onValueChange={(value) =>
          onFilterChange({ ...filters, duration: (value || undefined) as Duration | undefined })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('lessonPlans.ui.duration')} />
        </SelectTrigger>
        <SelectContent>
          {durations.map((dur) => (
            <SelectItem key={dur} value={dur}>
              {t(`lessonPlans.ui.durations.${dur}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.modelType || ''}
        onValueChange={(value) =>
          onFilterChange({ ...filters, modelType: (value || undefined) as ModelType | undefined })
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t('lessonPlans.ui.modelType')} />
        </SelectTrigger>
        <SelectContent>
          {modelTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`lessonPlans.ui.modelTypes.${type}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1">
          <X className="h-4 w-4" />
          {t('lessonPlans.ui.clearFilters')}
        </Button>
      )}
    </div>
  );
}
