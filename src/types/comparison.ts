/**
 * Type definitions for the Model Comparison Dashboard
 * These types support the comparison service layer and component interfaces
 */

// ─────────────────────────────────────────────────────────────────────────────
// Database Entity Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Training curve record from the training_curves table
 */
export interface TrainingCurve {
  id: string;
  trainingSessionId: string;
  epoch: number;
  trainLoss: number | null;
  valLoss: number | null;
  trainAccuracy: number | null;
  valAccuracy: number | null;
  createdAt: string;
}

/**
 * Model lineage record from the model_lineage table
 */
export interface ModelLineage {
  id: string;
  modelVersionId: string;
  parentModelVersionId: string | null;
  relationshipType: string;
  notes: string | null;
  createdAt: string;
}

/**
 * Extended ModelVersion with new efficiency and experiment tracking fields
 */
export interface ExtendedModelVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  versionName: string | null;
  trainingSessionId: string | null;
  datasetId: string | null;
  accuracy: number | null;
  loss: number | null;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  epochs: number | null;
  batchSize: number | null;
  learningRate: number | null;
  featureCount: number | null;
  sampleCount: number | null;
  classLabels: string[] | null;
  changesFromPrevious: Record<string, unknown> | null;
  notes: string | null;
  isActive: boolean;
  isDeployed: boolean;
  createdAt: string;
  createdBy: string | null;
  // New efficiency fields
  trainingTimeSeconds: number | null;
  inferenceTimeMs: number | null;
  modelSizeBytes: number | null;
  flops: number | null;
  experimentId: string | null;
  optimizer: string | null;
}

/**
 * Prediction sample structure within test_results.predictions
 */
export interface PredictionSample {
  id: string;
  trueLabel: string;
  predictedLabel: string;
  confidence?: number;
}

/**
 * Structure of the predictions JSONB field in test_results
 */
export interface TestResultPredictions {
  samples: PredictionSample[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Error Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Error codes for ComparisonService operations
 */
export type ComparisonErrorCode =
  | 'NETWORK_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN';

/**
 * Structured error object returned by ComparisonService
 */
export interface ComparisonServiceError {
  code: ComparisonErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Generic result type for ComparisonService operations
 */
export interface ComparisonServiceResult<T> {
  data: T | null;
  error: ComparisonServiceError | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Data Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Model data for comparison selection dropdown
 */
export interface ModelForComparison {
  id: string;
  projectId: string;
  projectTitle: string;
  versionNumber: number;
  versionName: string | null;
  accuracy: number | null;
  loss: number | null;
  createdAt: string;
  createdBy: string | null;
}

/**
 * Aggregated training curve data for a single model
 */
export interface TrainingCurveData {
  modelId: string;
  modelName: string;
  epochs: number[];
  trainLoss: number[];
  valLoss: number[];
  trainAcc: number[];
  valAcc: number[];
}

/**
 * Confusion matrix data for a single model
 */
export interface ConfusionMatrixData {
  modelId: string;
  modelName: string;
  labels: string[];
  matrix: number[][];
}

/**
 * Sample-level prediction data for comparison
 */
export interface PredictionData {
  sampleId: string;
  trueLabel: string;
  predictions: Record<string, string>; // modelId -> predicted label
  confidence?: Record<string, number>; // modelId -> confidence score
}

/**
 * Paginated prediction response
 */
export interface PaginatedPredictions {
  predictions: PredictionData[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Efficiency metrics for a single model
 */
export interface EfficiencyMetrics {
  modelId: string;
  modelName: string;
  trainingTimeSeconds: number | null;
  inferenceTimeMs: number | null;
  modelSizeBytes: number | null;
  flops: number | null;
}

/**
 * Hyperparameter data for a single model
 */
export interface HyperparameterData {
  modelId: string;
  modelName: string;
  learningRate: number | null;
  batchSize: number | null;
  epochs: number | null;
  optimizer: string | null;
  customParams: Record<string, unknown>;
}

/**
 * Lineage data for a single model
 */
export interface LineageData {
  modelId: string;
  modelName: string;
  parentModelId: string | null;
  parentModelName: string | null;
  experimentId: string | null;
  createdAt: string;
  createdBy: string | null;
  notes: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Realtime Event Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Event type for model version changes
 */
export type ModelChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Event payload for realtime model changes
 */
export interface ModelChangeEvent {
  type: ModelChangeType;
  modelId: string;
  projectId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistical Test Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type of statistical test
 */
export type StatisticalTestType = 'paired_t_test' | 'mcnemar_test';

/**
 * Result of a statistical significance test
 */
export interface StatisticalTestResult {
  testName: StatisticalTestType;
  modelAId: string;
  modelAName: string;
  modelBId: string;
  modelBName: string;
  pValue: number;
  significant: boolean;
  confidenceInterval?: [number, number];
  effectSize?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for export operations
 */
export interface ExportOptions {
  modelIds: string[];
  includeCharts: boolean;
  includeMetrics: boolean;
  includePredictions: boolean;
  includeHyperparameters: boolean;
  includeLineage: boolean;
  userName: string;
  comparisonDate: string;
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  success: boolean;
  error?: string;
  downloadUrl?: string;
  fileName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Props Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Common props for comparison components with loading/error states
 */
export interface ComparisonComponentBaseProps {
  modelIds: string[];
  loading?: boolean;
  error?: ComparisonServiceError | null;
  onRetry?: () => void;
}

/**
 * Props for TrainingCurvesOverlay component
 */
export interface TrainingCurvesOverlayProps extends ComparisonComponentBaseProps {
  data?: TrainingCurveData[];
}

/**
 * Props for ConfusionMatrixComparison component
 */
export interface ConfusionMatrixComparisonProps extends ComparisonComponentBaseProps {
  data?: ConfusionMatrixData[];
}

/**
 * Props for PredictionAnalysis component
 */
export interface PredictionAnalysisProps extends ComparisonComponentBaseProps {
  data?: PaginatedPredictions;
  onPageChange?: (page: number) => void;
}

/**
 * Props for ModelEfficiencyTable component
 */
export interface ModelEfficiencyTableProps extends ComparisonComponentBaseProps {
  data?: EfficiencyMetrics[];
}

/**
 * Props for HyperparameterComparisonTable component
 */
export interface HyperparameterComparisonTableProps extends ComparisonComponentBaseProps {
  data?: HyperparameterData[];
}

/**
 * Props for StatisticalTests component
 */
export interface StatisticalTestsProps extends ComparisonComponentBaseProps {
  results?: StatisticalTestResult[];
}

/**
 * Props for ModelLineage component
 */
export interface ModelLineageProps extends ComparisonComponentBaseProps {
  data?: LineageData[];
}

/**
 * Props for ModelRecommendation component
 */
export interface ModelRecommendationProps {
  modelIds: string[];
  efficiencyData?: EfficiencyMetrics[];
  accuracyData?: { modelId: string; accuracy: number }[];
  loading?: boolean;
}

/**
 * Props for ModelComparisonExport component
 */
export interface ModelComparisonExportProps {
  modelIds: string[];
  disabled?: boolean;
  onExportStart?: () => void;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard State Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loading states for each dashboard component
 */
export interface DashboardLoadingStates {
  models: boolean;
  trainingCurves: boolean;
  confusionMatrices: boolean;
  predictions: boolean;
  efficiency: boolean;
  hyperparameters: boolean;
  statisticalTests: boolean;
  lineage: boolean;
}

/**
 * Error states for each dashboard component
 */
export interface DashboardErrorStates {
  models: ComparisonServiceError | null;
  trainingCurves: ComparisonServiceError | null;
  confusionMatrices: ComparisonServiceError | null;
  predictions: ComparisonServiceError | null;
  efficiency: ComparisonServiceError | null;
  hyperparameters: ComparisonServiceError | null;
  statisticalTests: ComparisonServiceError | null;
  lineage: ComparisonServiceError | null;
}

/**
 * Data states for each dashboard component
 */
export interface DashboardDataStates {
  trainingCurves: TrainingCurveData[];
  confusionMatrices: ConfusionMatrixData[];
  predictions: PaginatedPredictions;
  efficiency: EfficiencyMetrics[];
  hyperparameters: HyperparameterData[];
  statisticalTests: StatisticalTestResult[];
  lineage: LineageData[];
}

/**
 * Complete dashboard state
 */
export interface DashboardState {
  // Model selection
  availableModels: ModelForComparison[];
  selectedModelIds: string[];
  isComparing: boolean;
  
  // Loading states per component
  loadingStates: DashboardLoadingStates;
  
  // Error states per component
  errorStates: DashboardErrorStates;
  
  // Data states
  dataStates: DashboardDataStates;
  
  // Realtime
  hasNewModelData: boolean;
  realtimeSubscription: (() => void) | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cache entry with timestamp and expiration
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Cache TTL in milliseconds (5 minutes)
 */
export const CACHE_TTL_MS = 5 * 60 * 1000;
