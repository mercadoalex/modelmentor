// src/data/lessonPlans/types.ts

export type GradeBand = '6-8' | '9-12';
export type ModelType = 'image-classification' | 'text-classification' | 'regression';
export type SubjectArea = 'computer-science' | 'mathematics' | 'science' | 'cross-curricular';
export type Duration = '45min' | '60min' | '90min';
export type PerformanceLevel = 'beginning' | 'developing' | 'proficient' | 'advanced';

export interface Standard {
  code: string;
  name: string;
  description: string;
  type: 'CSTA' | 'ISTE';
}

export interface SEPAlignment {
  area: string;
  description: string;
}

export interface RubricCriterion {
  criterion: string;
  levels: Record<PerformanceLevel, string>;
}

export interface LessonPhase {
  name: string;
  duration: string;
  steps: string[];
  teacherNotes?: string[];
  discussionPrompts?: string[];
  modelMentorFeatures?: string[];
}

export interface DifferentiationStrategy {
  level: 'struggling' | 'on-level' | 'advanced';
  strategies: string[];
  modelMentorFeatures?: string[];
}

export interface StudentHandout {
  title: string;
  instructions: string;
  sections: {
    heading: string;
    prompts: string[];
    reflectionQuestions?: string[];
    hasResponseSpace: boolean;
  }[];
  workflowSteps: string[];
}

export interface TeacherNotes {
  misconceptions: {
    misconception: string;
    correction: string;
  }[];
  classroomTips: string[];
  discussionPrompts: {
    phase: string;
    prompts: string[];
  }[];
}

export interface CurriculumLessonPlan {
  id: string;
  slug: string;
  title: string;
  overview: string;
  gradeBand: GradeBand;
  modelType: ModelType;
  subjectArea: SubjectArea;
  duration: Duration;
  objectives: string[];
  standards: Standard[];
  sepAlignment?: SEPAlignment;
  materials: string[];
  vocabulary: {
    term: string;
    definition: string;
  }[];
  procedure: LessonPhase[];
  formativeAssessment: {
    indicators: string[];
  };
  rubric: RubricCriterion[];
  differentiation: DifferentiationStrategy[];
  handout: StudentHandout;
  teacherNotes: TeacherNotes;
}
