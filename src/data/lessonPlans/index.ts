import { imageClassification68 } from './plans/image-classification-6-8';
import { imageClassification912 } from './plans/image-classification-9-12';
import { textClassification912 } from './plans/text-classification-9-12';
import { regression912 } from './plans/regression-9-12';
import { CurriculumLessonPlan } from './types';

export type {
  CurriculumLessonPlan,
  GradeBand,
  ModelType,
  SubjectArea,
  Duration,
  PerformanceLevel,
  Standard,
  SEPAlignment,
  RubricCriterion,
  LessonPhase,
  DifferentiationStrategy,
  StudentHandout,
  TeacherNotes,
} from './types';

const allPlans: CurriculumLessonPlan[] = [
  imageClassification68,
  imageClassification912,
  textClassification912,
  regression912,
];

export function getAllPlans(): CurriculumLessonPlan[] {
  return allPlans;
}

export function getPlanBySlug(slug: string): CurriculumLessonPlan | undefined {
  return allPlans.find((plan) => plan.slug === slug);
}
