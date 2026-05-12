/**
 * Feature Engineering Workshop Type Definitions
 * 
 * This module contains all TypeScript interfaces for the Feature Engineering Workshop,
 * supporting transformation suggestions, distribution visualizations, feature importance
 * tracking, polynomial/interaction features, tutorials, and progress tracking.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core Feature Types
// ─────────────────────────────────────────────────────────────────────────────

/** Feature type classification for columns in a dataset */
export type FeatureType = 'numerical' | 'categorical' | 'text';

/** All supported transformation types */
export type TransformationType =
  // Numerical transformations
  | 'log'
  | 'sqrt'
  | 'square'
  | 'normalize'
  | 'standardize'
  | 'binning'
  | 'box_cox'
  | 'yeo_johnson'
  // Categorical transformations
  | 'one_hot'
  | 'label_encode'
  | 'frequency_encode'
  | 'target_encode'
  | 'binary_encode'
  // Text transformations
  | 'tfidf'
  | 'word_count'
  | 'char_count'
  | 'sentence_count'
  // Polynomial and interaction
  | 'polynomial_2'
  | 'polynomial_3'
  | 'interaction';

/** Impact level for transformations */
export type ImpactLevel = 'low' | 'medium' | 'high';

/** Complexity level for transformations */
export type ComplexityLevel = 'simple' | 'moderate' | 'complex';

/** Applicability status for a transformation */
export type ApplicabilityStatus = 'applicable' | 'not_applicable' | 'warning';

// ─────────────────────────────────────────────────────────────────────────────
// Transformation Suggestions
// ─────────────────────────────────────────────────────────────────────────────

/** A transformation suggestion with metadata */
export interface TransformationSuggestion {
  type: TransformationType;
  name: string;
  description: string;
  expectedImpact: ImpactLevel;
  applicability: ApplicabilityStatus;
  applicabilityReason?: string;
  complexity: ComplexityLevel;
  /** Mathematical formula if applicable */
  formula?: string;
  /** When to use this transformation */
  useCases?: string[];
  /** When NOT to use this transformation */
  antiPatterns?: string[];
}

/** Result of checking transformation applicability */
export interface ApplicabilityResult {
  applicable: boolean;
  reason?: string;
  alternatives?: TransformationType[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Distribution Statistics
// ─────────────────────────────────────────────────────────────────────────────

/** Statistical summary of a distribution */
export interface DistributionStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
  /** Number of unique values */
  uniqueCount?: number;
  /** Number of missing values */
  missingCount?: number;
  /** Quartiles [Q1, Q2, Q3] */
  quartiles?: [number, number, number];
}

/** Comparison between original and transformed distributions */
export interface DistributionComparison {
  original: DistributionStats;
  transformed: DistributionStats;
  changes: {
    meanChange: number;
    meanChangePercent: number;
    stdChange: number;
    stdChangePercent: number;
    skewnessChange: number;
    rangeChange: number;
  };
}

/** Histogram bin data for visualization */
export interface HistogramBin {
  binStart: number;
  binEnd: number;
  count: number;
  frequency: number;
}

/** Data for distribution visualization */
export interface DistributionVisualizationData {
  originalBins: HistogramBin[];
  transformedBins: HistogramBin[];
  originalStats: DistributionStats;
  transformedStats: DistributionStats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Importance
// ─────────────────────────────────────────────────────────────────────────────

/** Feature importance change after transformation */
export interface FeatureImportanceChange {
  featureName: string;
  originalImportance: number;
  transformedImportance: number;
  percentageChange: number;
  transformation: TransformationType;
  explanation: string;
  /** Rank before transformation */
  originalRank?: number;
  /** Rank after transformation */
  transformedRank?: number;
}

/** Cumulative importance changes from multiple transformations */
export interface CumulativeImportanceChange {
  featureName: string;
  originalImportance: number;
  finalImportance: number;
  totalPercentageChange: number;
  transformations: {
    type: TransformationType;
    importanceAfter: number;
    incrementalChange: number;
  }[];
  mostImpactfulTransformation: TransformationType;
}

// ─────────────────────────────────────────────────────────────────────────────
// Polynomial Features
// ─────────────────────────────────────────────────────────────────────────────

/** Result of polynomial feature generation */
export interface PolynomialFeatureResult {
  originalFeature: string;
  degree: number;
  formula: string;
  values: number[];
  correlation: number;
  r2Improvement: number;
  overfittingRisk: 'low' | 'medium' | 'high';
  /** Sample of generated values for preview */
  sampleValues?: number[];
}

/** Configuration for polynomial feature generation */
export interface PolynomialFeatureConfig {
  feature: string;
  degree: number;
  includeInteractions?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interaction Features
// ─────────────────────────────────────────────────────────────────────────────

/** Types of feature interactions */
export type InteractionType = 'multiply' | 'divide' | 'add' | 'subtract';

/** Result of interaction feature generation */
export interface InteractionFeatureResult {
  feature1: string;
  feature2: string;
  interactionType: InteractionType;
  formula: string;
  values: number[];
  importance: number;
  explanation: string;
  /** Correlation with target */
  correlation?: number;
}

/** Suggested interaction between features */
export interface SuggestedInteraction {
  feature1: string;
  feature2: string;
  type: InteractionType;
  expectedCorrelation: number;
  rank: number;
  rationale: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Workshop State
// ─────────────────────────────────────────────────────────────────────────────

/** Current tab in the workshop */
export type WorkshopTab = 'transformations' | 'polynomial' | 'interactions' | 'tutorials' | 'summary';

/** Main workshop state */
export interface WorkshopState {
  currentTab: WorkshopTab;
  selectedFeatureType: FeatureType;
  selectedFeature: string | null;
  selectedTransformation: TransformationType | null;
  appliedTransformations: AppliedTransformation[];
  previewData: TransformationPreview | null;
  progress: WorkshopProgress;
  /** Whether the workshop is in tutorial mode */
  tutorialMode: boolean;
  /** Current tutorial ID if in tutorial mode */
  currentTutorialId?: string;
}

/** A transformation that has been applied */
export interface AppliedTransformation {
  id: string;
  type: TransformationType;
  feature: string;
  timestamp: Date;
  importanceChange: number;
  performanceImpact: number;
  /** The new column name created by this transformation */
  newColumnName?: string;
  /** Parameters used for the transformation */
  parameters?: Record<string, unknown>;
}

/** Preview of a transformation before applying */
export interface TransformationPreview {
  transformation: TransformationType;
  feature: string;
  originalData: number[] | string[];
  transformedData: number[] | string[];
  stats: DistributionComparison;
  estimatedImportanceChange: number;
  estimatedPerformanceImpact: number;
  warnings?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Tracking
// ─────────────────────────────────────────────────────────────────────────────

/** Workshop progress state */
export interface WorkshopProgress {
  /** Total number of transformations applied */
  totalTransformationsApplied: number;
  /** Count of transformations by type */
  transformationsByType: Record<string, number>;
  /** Feature types that have been explored */
  featureTypesExplored: FeatureType[];
  /** Completed tutorial IDs */
  tutorialsCompleted: string[];
  /** Badges earned */
  badgesEarned: string[];
  /** Cumulative model improvement achieved (0-1 scale) */
  cumulativeImprovement: number;
  /** Most impactful transformation applied */
  mostImpactfulTransformation: AppliedTransformation | null;
  /** Number of workshop sessions */
  sessionCount: number;
  /** Total time spent in workshop (minutes) */
  totalTimeSpent: number;
  
  // Legacy fields for backward compatibility
  /** Transformations that have been explored (viewed) */
  exploredTransformations?: Set<TransformationType>;
  /** Transformations that have been applied */
  appliedTransformations?: AppliedTransformation[];
  /** Progress percentage for each feature type */
  featureTypeProgress?: {
    numerical: number;
    categorical: number;
    text: number;
  };
  /** Total model improvement achieved */
  totalImprovement?: number;
  /** Milestone IDs that have been reached */
  milestonesReached?: string[];
  /** Time spent in workshop (seconds) */
  timeSpent?: number;
  /** Session start time */
  sessionStartTime?: Date;
}

/** A milestone achievement */
export interface Milestone {
  id: string;
  name: string;
  description: string;
  condition: MilestoneCondition;
  reward: {
    points: number;
    badge?: string;
  };
  /** Whether this milestone has been reached */
  reached?: boolean;
  /** When the milestone was reached */
  reachedAt?: Date;
}

/** Condition for reaching a milestone */
export type MilestoneCondition =
  | { type: 'transformations_applied'; count: number }
  | { type: 'tutorials_completed'; count: number }
  | { type: 'improvement_achieved'; percentage: number }
  | { type: 'feature_types_explored'; count: number };

// ─────────────────────────────────────────────────────────────────────────────
// Transformation Pipeline
// ─────────────────────────────────────────────────────────────────────────────

/** A saved transformation pipeline */
export interface TransformationPipeline {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  steps: PipelineStep[];
  metadata: {
    originalColumns: string[];
    newColumns: string[];
    totalImprovement: number;
  };
}

/** A step in a transformation pipeline */
export interface PipelineStep {
  id: string;
  order: number;
  transformation: TransformationType;
  sourceColumn: string;
  targetColumn: string;
  parameters?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial System
// ─────────────────────────────────────────────────────────────────────────────

/** Tutorial topic categories */
export type TutorialTopic =
  | 'log_transform'
  | 'one_hot_encoding'
  | 'standardization'
  | 'polynomial_features'
  | 'interaction_features'
  | 'text_vectorization';

/** A tutorial definition */
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  topic: TutorialTopic;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: TutorialStep[];
  exercises: TutorialExercise[];
  estimatedTime: number; // minutes
  prerequisites?: string[];
}

/** A step in a tutorial */
export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  /** CSS selector for element to highlight */
  highlightElement?: string;
  /** Action the user should take */
  action?: TutorialAction;
  /** Validation for the step */
  validation?: TutorialValidation;
}

/** Action types for tutorial steps */
export type TutorialAction =
  | { type: 'click'; target: string }
  | { type: 'select'; target: string; value: string }
  | { type: 'apply_transformation'; transformation: TransformationType }
  | { type: 'observe'; duration: number };

/** Validation for tutorial steps */
export interface TutorialValidation {
  type: 'element_exists' | 'value_changed' | 'transformation_applied';
  target?: string;
  expectedValue?: unknown;
}

/** An exercise in a tutorial */
export interface TutorialExercise {
  id: string;
  question: string;
  type: 'apply_transformation' | 'select_option' | 'interpret_result';
  options?: string[];
  correctAnswer: string | string[];
  feedback: {
    correct: string;
    incorrect: string;
  };
  hints?: string[];
}

/** A badge earned from completing a tutorial */
export interface TutorialBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tutorialId: string;
  earnedAt?: Date;
}

/** Progress through a tutorial */
export interface TutorialProgress {
  tutorialId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentStep: number;
  completedExercises: string[];
  score: number;
  startedAt?: Date;
  completedAt?: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Workshop Session
// ─────────────────────────────────────────────────────────────────────────────

/** A workshop session */
export interface WorkshopSession {
  id: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  datasetId?: string;
  progress: WorkshopProgress;
  transformationHistory: TransformationHistoryEntry[];
  summary?: WorkshopSummary;
}

/** An entry in the transformation history */
export interface TransformationHistoryEntry {
  id: string;
  timestamp: Date;
  action: 'apply' | 'undo' | 'preview';
  transformation: TransformationType;
  feature: string;
  result?: {
    importanceChange: number;
    performanceImpact: number;
  };
}

/** Summary of a completed workshop session */
export interface WorkshopSummary {
  totalTransformationsApplied: number;
  totalImprovementAchieved: number;
  mostImpactfulTransformation: {
    type: TransformationType;
    feature: string;
    impact: number;
  } | null;
  tutorialsCompleted: string[];
  badgesEarned: string[];
  timeSpent: number; // minutes
  recommendations: string[];
  featureTypeBreakdown: {
    numerical: number;
    categorical: number;
    text: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Educational Content
// ─────────────────────────────────────────────────────────────────────────────

/** Explanation for a transformation */
export interface TransformationExplanation {
  whatItDoes: string;
  whyItHelps: string;
  visualAnalogy?: string;
  realWorldExample?: string;
  mathematicalFormula?: string;
}

/** A use case for a transformation */
export interface UseCase {
  scenario: string;
  example: string;
  benefit: string;
}

/** An anti-pattern (when NOT to use a transformation) */
export interface AntiPattern {
  scenario: string;
  problem: string;
  alternative: string;
}

/** A "Did you know?" tip */
export interface DidYouKnowTip {
  id: string;
  content: string;
  relatedTransformation?: TransformationType;
}

/** A glossary entry for technical terms */
export interface GlossaryEntry {
  term: string;
  definition: string;
  relatedTerms: string[];
  example?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dataset Analysis
// ─────────────────────────────────────────────────────────────────────────────

/** Analysis of a dataset */
export interface DatasetAnalysis {
  columns: ColumnAnalysis[];
  suggestedTransformations: Map<string, TransformationSuggestion[]>;
  overallRecommendations: string[];
  dataQualityScore: number;
}

/** Analysis of a single column */
export interface ColumnAnalysis {
  name: string;
  type: FeatureType;
  statistics: DistributionStats | null;
  uniqueValues: number;
  missingValues: number;
  missingPercentage: number;
  suggestedTransformations: TransformationType[];
  /** Whether this column is likely the target variable */
  isLikelyTarget?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Impact Simulation
// ─────────────────────────────────────────────────────────────────────────────

/** Model metrics for impact simulation */
export interface ModelMetrics {
  accuracy?: number;
  r2?: number;
  mse?: number;
  mae?: number;
  precision?: number;
  recall?: number;
  f1?: number;
}

/** Learning curve data */
export interface LearningCurveData {
  trainingSizes: number[];
  trainingScores: number[];
  validationScores: number[];
}

/** Result of impact simulation */
export interface ImpactSimulationResult {
  originalMetrics: ModelMetrics;
  transformedMetrics: ModelMetrics;
  improvement: {
    accuracy?: number;
    r2?: number;
    mse?: number;
  };
  learningCurve: LearningCurveData;
  crossValidationScores: number[];
  recommendation: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Types
// ─────────────────────────────────────────────────────────────────────────────

/** Error when a transformation cannot be applied */
export interface TransformationError {
  type: 'invalid_input' | 'division_by_zero' | 'insufficient_data' | 'memory_limit' | 'unknown';
  message: string;
  feature: string;
  transformation: TransformationType;
  alternatives?: TransformationType[];
}

/** Error when computation fails */
export interface ComputationError {
  type: 'correlation' | 'importance' | 'simulation';
  message: string;
  details?: string;
}
