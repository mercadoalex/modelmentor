import {
  CurriculumLessonPlan,
  GradeBand,
  ModelType,
  SubjectArea,
  Duration,
} from './types';

export interface LessonPlanFilters {
  gradeBand?: GradeBand;
  modelType?: ModelType;
  subjectArea?: SubjectArea;
  duration?: Duration;
  standard?: string;
}

export function filterLessonPlans(
  plans: CurriculumLessonPlan[],
  filters: LessonPlanFilters
): CurriculumLessonPlan[] {
  return plans.filter((plan) => {
    if (filters.gradeBand && plan.gradeBand !== filters.gradeBand) return false;
    if (filters.modelType && plan.modelType !== filters.modelType) return false;
    if (filters.subjectArea && plan.subjectArea !== filters.subjectArea) return false;
    if (filters.duration && plan.duration !== filters.duration) return false;
    if (filters.standard && !plan.standards.some((s) => s.code === filters.standard)) return false;
    return true;
  });
}
