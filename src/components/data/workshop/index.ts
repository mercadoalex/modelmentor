/**
 * Feature Engineering Workshop Components
 * 
 * This module exports all components for the Feature Engineering Workshop feature.
 */

// Visualization components
export { DistributionVisualizer, calculateStats, createHistogramBins } from './DistributionVisualizer';
export { StatisticsComparison, calculateChange, isImprovement, getInterpretations } from './StatisticsComparison';

// Suggestion components
export { 
  TransformationSuggestionPanel, 
  TRANSFORMATION_DEFINITIONS,
  checkApplicability,
  getSuggestionsForFeature,
} from './TransformationSuggestionPanel';

// Progress tracking components
export { ProgressTracker } from './ProgressTracker';

// Tutorial components
export { TutorialSystem, TUTORIALS } from './TutorialSystem';
export type { Tutorial, TutorialStep } from './TutorialSystem';
export { TutorialExercise, SAMPLE_EXERCISES } from './TutorialExercise';
export type { Exercise, ExerciseOption, ExerciseType } from './TutorialExercise';

// Polynomial and Interaction Feature components
export { PolynomialFeaturesDemo } from './PolynomialFeaturesDemo';
export { InteractionFeaturesDemo } from './InteractionFeaturesDemo';
export { FeatureImportanceComparison } from './FeatureImportanceComparison';

// Impact Simulator and Learning Curve components
export { ImpactSimulator } from './ImpactSimulator';
export { LearningCurve } from './LearningCurve';

// Workshop Summary component
export { WorkshopSummary } from './WorkshopSummary';
