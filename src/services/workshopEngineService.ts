// Workshop Engine Service - Part 1
// Core functionality for the Feature Engineering Workshop

import type {
  FeatureType,
  TransformationType,
  TransformationSuggestion,
  DistributionStats,
  ApplicabilityResult,
  DatasetAnalysis,
  ColumnAnalysis,
  TransformationPipeline,
  PipelineStep,
  AppliedTransformation,
  TransformationExplanation,
  UseCase,
  AntiPattern,
  DidYouKnowTip,
  GlossaryEntry,
  ImpactLevel,
} from '@/types/workshop';

/**
 * Workshop Engine Service
 * 
 * Orchestrates the Feature Engineering Workshop functionality including:
 * - Dataset analysis and feature categorization
 * - Transformation suggestions and applicability checking
 * - Transformation application and undo
 * - Statistics calculation and comparison
 * - Pipeline management
 * - Educational content
 */

// ─────────────────────────────────────────────────────────────────────────────
// Feature Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Categorize a feature based on its values
 */
export function categorizeFeature(values: (string | number)[]): FeatureType {
  if (values.length === 0) return 'categorical';
  
  // Check if all values are numbers
  const numericValues = values.filter(v => typeof v === 'number' || !isNaN(Number(v)));
  const numericRatio = numericValues.length / values.length;
  
  if (numericRatio > 0.9) {
    return 'numerical';
  }
  
  // Check if values look like text (long strings, sentences)
  const stringValues = values.filter(v => typeof v === 'string') as string[];
  if (stringValues.length > 0) {
    const avgLength = stringValues.reduce((sum, s) => sum + s.length, 0) / stringValues.length;
    const hasSpaces = stringValues.some(s => s.includes(' '));
    
    if (avgLength > 50 || hasSpaces) {
      return 'text';
    }
  }
  
  return 'categorical';
}

/**
 * Analyze a dataset and return column information
 */
export function analyzeDataset(
  data: string[][],
  columnInfo: { name: string; type?: string }[]
): DatasetAnalysis {
  const columns: ColumnAnalysis[] = [];
  const suggestedTransformations = new Map<string, TransformationSuggestion[]>();
  
  if (data.length === 0 || columnInfo.length === 0) {
    return {
      columns: [],
      suggestedTransformations,
      overallRecommendations: ['Upload data to get transformation suggestions'],
      dataQualityScore: 0,
    };
  }
  
  // Analyze each column
  columnInfo.forEach((col, colIndex) => {
    const columnValues = data.map(row => row[colIndex]).filter(v => v !== undefined && v !== '');
    const featureType = categorizeFeature(columnValues);
    
    let statistics: DistributionStats | null = null;
    if (featureType === 'numerical') {
      const numericValues = columnValues.map(v => Number(v)).filter(v => !isNaN(v));
      statistics = calculateDistributionStats(numericValues);
    }
    
    const uniqueValues = new Set(columnValues).size;
    const missingValues = data.length - columnValues.length;
    const missingPercentage = (missingValues / data.length) * 100;
    
    // Get suggestions for this column
    const suggestions = getSuggestionsForFeature(featureType, columnValues, col.name);
    suggestedTransformations.set(col.name, suggestions);
    
    columns.push({
      name: col.name,
      type: featureType,
      statistics,
      uniqueValues,
      missingValues,
      missingPercentage,
      suggestedTransformations: suggestions
        .filter(s => s.applicability === 'applicable')
        .map(s => s.type),
    });
  });
  
  // Calculate data quality score
  const avgMissingPercentage = columns.reduce((sum, c) => sum + c.missingPercentage, 0) / columns.length;
  const dataQualityScore = Math.max(0, 100 - avgMissingPercentage * 2);
  
  // Generate overall recommendations
  const overallRecommendations: string[] = [];
  
  const numericalCols = columns.filter(c => c.type === 'numerical');
  const categoricalCols = columns.filter(c => c.type === 'categorical');
  
  if (numericalCols.length > 0) {
    const skewedCols = numericalCols.filter(c => c.statistics && Math.abs(c.statistics.skewness) > 1);
    if (skewedCols.length > 0) {
      overallRecommendations.push(
        `${skewedCols.length} numerical column(s) are skewed. Consider log or sqrt transforms.`
      );
    }
  }
  
  if (categoricalCols.length > 0) {
    const highCardinalityCols = categoricalCols.filter(c => c.uniqueValues > 20);
    if (highCardinalityCols.length > 0) {
      overallRecommendations.push(
        `${highCardinalityCols.length} categorical column(s) have high cardinality. Consider target or frequency encoding.`
      );
    }
  }
  
  if (avgMissingPercentage > 5) {
    overallRecommendations.push(
      `${avgMissingPercentage.toFixed(1)}% of data is missing. Handle missing values before transformations.`
    );
  }
  
  return {
    columns,
    suggestedTransformations,
    overallRecommendations,
    dataQualityScore,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistics Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate distribution statistics for numeric data
 */
export function calculateDistributionStats(data: number[]): DistributionStats {
  if (data.length === 0) {
    return { mean: 0, median: 0, std: 0, min: 0, max: 0, skewness: 0, kurtosis: 0 };
  }
  
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  
  // Mean
  const mean = data.reduce((sum, val) => sum + val, 0) / n;
  
  // Median
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  
  // Standard deviation
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  
  // Min and Max
  const min = sorted[0];
  const max = sorted[n - 1];
  
  // Skewness (Fisher-Pearson coefficient)
  let skewness = 0;
  if (std > 0) {
    const m3 = data.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / n;
    skewness = m3 / Math.pow(std, 3);
  }
  
  // Kurtosis (excess kurtosis)
  let kurtosis = 0;
  if (std > 0) {
    const m4 = data.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / n;
    kurtosis = m4 / Math.pow(std, 4) - 3;
  }
  
  // Quartiles
  const q1Index = Math.floor(n * 0.25);
  const q2Index = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);
  const quartiles: [number, number, number] = [sorted[q1Index], sorted[q2Index], sorted[q3Index]];
  
  return { mean, median, std, min, max, skewness, kurtosis, quartiles };
}

/**
 * Calculate skewness for an array of numbers
 */
export function calculateSkewness(data: number[]): number {
  if (data.length < 3) return 0;
  
  const n = data.length;
  const mean = data.reduce((sum, val) => sum + val, 0) / n;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  
  if (std === 0) return 0;
  
  const m3 = data.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / n;
  return m3 / Math.pow(std, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// Transformation Suggestions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get transformation suggestions for a feature
 */
export function getSuggestionsForFeature(
  featureType: FeatureType,
  featureData: (string | number)[],
  featureName: string
): TransformationSuggestion[] {
  const suggestions: TransformationSuggestion[] = [];
  
  const transformationDefs = getTransformationDefinitions();
  
  for (const [type, def] of Object.entries(transformationDefs)) {
    if (!def.applicableTo.includes(featureType)) continue;
    
    const applicability = checkTransformationApplicability(
      type as TransformationType,
      featureData,
      featureType
    );
    
    suggestions.push({
      type: type as TransformationType,
      name: def.name,
      description: def.description,
      expectedImpact: def.expectedImpact,
      applicability: applicability.applicable ? 'applicable' : 'not_applicable',
      applicabilityReason: applicability.reason,
      complexity: def.complexity,
      formula: def.formula,
      useCases: def.useCases,
      antiPatterns: def.antiPatterns,
    });
  }
  
  // Sort by impact and applicability
  return suggestions.sort((a, b) => {
    if (a.applicability === 'applicable' && b.applicability !== 'applicable') return -1;
    if (a.applicability !== 'applicable' && b.applicability === 'applicable') return 1;
    
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.expectedImpact] - impactOrder[b.expectedImpact];
  });
}

/**
 * Check if a transformation is applicable to the given data
 */
export function checkTransformationApplicability(
  transformation: TransformationType,
  featureData: (string | number)[],
  featureType: FeatureType
): ApplicabilityResult {
  const def = getTransformationDefinitions()[transformation];
  
  if (!def || !def.applicableTo.includes(featureType)) {
    return {
      applicable: false,
      reason: `This transformation is not applicable to ${featureType} features.`,
      alternatives: getAlternativesForFeatureType(featureType),
    };
  }
  
  // Numerical-specific checks
  if (featureType === 'numerical') {
    const numData = featureData.map(v => Number(v)).filter(v => !isNaN(v));
    const hasNegative = numData.some(v => v < 0);
    const hasZero = numData.some(v => v === 0);
    const min = Math.min(...numData);
    
    if (transformation === 'log') {
      if (hasNegative || hasZero) {
        return {
          applicable: false,
          reason: `Log transform requires all positive values. Found ${hasNegative ? 'negative' : 'zero'} values.`,
          alternatives: ['sqrt', 'yeo_johnson', 'standardize'],
        };
      }
    }
    
    if (transformation === 'sqrt') {
      if (hasNegative) {
        return {
          applicable: false,
          reason: 'Square root requires non-negative values.',
          alternatives: ['yeo_johnson', 'standardize'],
        };
      }
    }
    
    if (transformation === 'box_cox') {
      if (min <= 0) {
        return {
          applicable: false,
          reason: 'Box-Cox requires strictly positive values. Consider Yeo-Johnson instead.',
          alternatives: ['yeo_johnson'],
        };
      }
    }
  }
  
  // Categorical-specific checks
  if (featureType === 'categorical') {
    const uniqueValues = new Set(featureData).size;
    
    if (transformation === 'one_hot' && uniqueValues > 50) {
      return {
        applicable: true, // Still applicable but with warning
        reason: `High cardinality (${uniqueValues} unique values) will create many columns.`,
        alternatives: ['frequency_encode', 'target_encode', 'binary_encode'],
      };
    }
  }
  
  return { applicable: true };
}

function getAlternativesForFeatureType(featureType: FeatureType): TransformationType[] {
  switch (featureType) {
    case 'numerical':
      return ['standardize', 'normalize', 'log', 'sqrt'];
    case 'categorical':
      return ['one_hot', 'label_encode', 'frequency_encode'];
    case 'text':
      return ['tfidf', 'word_count', 'char_count'];
    default:
      return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Transformation Definitions
// ─────────────────────────────────────────────────────────────────────────────

interface TransformationDefinition {
  name: string;
  description: string;
  applicableTo: FeatureType[];
  expectedImpact: ImpactLevel;
  complexity: 'simple' | 'moderate' | 'complex';
  formula?: string;
  useCases: string[];
  antiPatterns: string[];
}

function getTransformationDefinitions(): Record<TransformationType, TransformationDefinition> {
  return {
    log: {
      name: 'Log Transform',
      description: 'Apply natural logarithm to compress large values and reduce right skewness.',
      applicableTo: ['numerical'],
      expectedImpact: 'high',
      complexity: 'simple',
      formula: "x' = log(x)",
      useCases: ['Right-skewed distributions', 'Data spanning multiple orders of magnitude'],
      antiPatterns: ['Data with zero or negative values', 'Already normally distributed data'],
    },
    sqrt: {
      name: 'Square Root',
      description: 'Apply square root to moderately reduce skewness.',
      applicableTo: ['numerical'],
      expectedImpact: 'medium',
      complexity: 'simple',
      formula: "x' = sqrt(x)",
      useCases: ['Count data', 'Moderately skewed distributions'],
      antiPatterns: ['Negative values', 'Heavily skewed data'],
    },
    square: {
      name: 'Square Transform',
      description: 'Square values to emphasize larger values.',
      applicableTo: ['numerical'],
      expectedImpact: 'medium',
      complexity: 'simple',
      formula: "x' = x^2",
      useCases: ['Left-skewed distributions', 'Emphasizing differences'],
      antiPatterns: ['Right-skewed data', 'Very large values'],
    },
    normalize: {
      name: 'Min-Max Normalization',
      description: 'Scale values to [0, 1] range.',
      applicableTo: ['numerical'],
      expectedImpact: 'high',
      complexity: 'simple',
      formula: "x' = (x - min) / (max - min)",
      useCases: ['Neural networks', 'Distance-based algorithms'],
      antiPatterns: ['Data with outliers', 'When new data may exceed range'],
    },
    standardize: {
      name: 'Standardization (Z-score)',
      description: 'Transform to mean=0 and std=1.',
      applicableTo: ['numerical'],
      expectedImpact: 'high',
      complexity: 'simple',
      formula: "x' = (x - mean) / std",
      useCases: ['Linear models', 'PCA', 'Comparing features'],
      antiPatterns: ['Tree-based models', 'Sparse data'],
    },
    binning: {
      name: 'Binning',
      description: 'Convert continuous values into discrete bins.',
      applicableTo: ['numerical'],
      expectedImpact: 'medium',
      complexity: 'moderate',
      useCases: ['Handling outliers', 'Creating ordinal features'],
      antiPatterns: ['When precise values matter', 'Small datasets'],
    },
    box_cox: {
      name: 'Box-Cox Transform',
      description: 'Automatically find the best power transformation.',
      applicableTo: ['numerical'],
      expectedImpact: 'high',
      complexity: 'moderate',
      formula: "x' = (x^lambda - 1) / lambda",
      useCases: ['Achieving normality', 'When unsure which transform to use'],
      antiPatterns: ['Zero or negative values', 'When interpretability matters'],
    },
    yeo_johnson: {
      name: 'Yeo-Johnson Transform',
      description: 'Like Box-Cox but works with zero and negative values.',
      applicableTo: ['numerical'],
      expectedImpact: 'high',
      complexity: 'moderate',
      useCases: ['Data with zero or negative values'],
      antiPatterns: ['When interpretability matters'],
    },
    one_hot: {
      name: 'One-Hot Encoding',
      description: 'Create binary columns for each category.',
      applicableTo: ['categorical'],
      expectedImpact: 'high',
      complexity: 'simple',
      useCases: ['Nominal categories', 'Low cardinality', 'Linear models'],
      antiPatterns: ['High cardinality', 'Tree-based models'],
    },
    label_encode: {
      name: 'Label Encoding',
      description: 'Convert categories to integers.',
      applicableTo: ['categorical'],
      expectedImpact: 'medium',
      complexity: 'simple',
      useCases: ['Ordinal categories', 'Tree-based models'],
      antiPatterns: ['Nominal categories with linear models'],
    },
    frequency_encode: {
      name: 'Frequency Encoding',
      description: 'Replace categories with their frequency.',
      applicableTo: ['categorical'],
      expectedImpact: 'medium',
      complexity: 'moderate',
      useCases: ['High cardinality', 'When frequency is informative'],
      antiPatterns: ['Similar frequencies', 'Small datasets'],
    },
    target_encode: {
      name: 'Target Encoding',
      description: 'Replace categories with target mean.',
      applicableTo: ['categorical'],
      expectedImpact: 'high',
      complexity: 'complex',
      useCases: ['High cardinality', 'Strong category-target relationship'],
      antiPatterns: ['Small datasets', 'Risk of overfitting'],
    },
    binary_encode: {
      name: 'Binary Encoding',
      description: 'Encode categories as binary numbers.',
      applicableTo: ['categorical'],
      expectedImpact: 'medium',
      complexity: 'moderate',
      useCases: ['Medium-high cardinality'],
      antiPatterns: ['Very low cardinality'],
    },
    tfidf: {
      name: 'TF-IDF Vectorization',
      description: 'Convert text to TF-IDF features.',
      applicableTo: ['text'],
      expectedImpact: 'high',
      complexity: 'complex',
      useCases: ['Document classification', 'Text similarity'],
      antiPatterns: ['Very short texts', 'When word order matters'],
    },
    word_count: {
      name: 'Word Count',
      description: 'Count the number of words.',
      applicableTo: ['text'],
      expectedImpact: 'medium',
      complexity: 'simple',
      useCases: ['Text length as feature', 'Spam detection'],
      antiPatterns: ['When content matters more than length'],
    },
    char_count: {
      name: 'Character Count',
      description: 'Count the number of characters.',
      applicableTo: ['text'],
      expectedImpact: 'low',
      complexity: 'simple',
      useCases: ['Text length analysis'],
      antiPatterns: ['Rarely useful alone'],
    },
    sentence_count: {
      name: 'Sentence Count',
      description: 'Count the number of sentences.',
      applicableTo: ['text'],
      expectedImpact: 'low',
      complexity: 'simple',
      useCases: ['Document structure analysis'],
      antiPatterns: ['Short texts'],
    },
    polynomial_2: {
      name: 'Polynomial (Degree 2)',
      description: 'Create squared terms.',
      applicableTo: ['numerical'],
      expectedImpact: 'high',
      complexity: 'moderate',
      formula: "x' = x^2",
      useCases: ['Non-linear relationships', 'U-shaped patterns'],
      antiPatterns: ['Complex models', 'Risk of overfitting'],
    },
    polynomial_3: {
      name: 'Polynomial (Degree 3)',
      description: 'Create cubic terms.',
      applicableTo: ['numerical'],
      expectedImpact: 'medium',
      complexity: 'complex',
      formula: "x' = x^3",
      useCases: ['Complex non-linear patterns'],
      antiPatterns: ['High overfitting risk', 'Small datasets'],
    },
    interaction: {
      name: 'Feature Interactions',
      description: 'Create features by combining two existing features.',
      applicableTo: ['numerical'],
      expectedImpact: 'high',
      complexity: 'moderate',
      useCases: ['Features that work together', 'Domain knowledge'],
      antiPatterns: ['Too many features'],
    },
  };
}

// Export the service object
export const workshopEngineService = {
  categorizeFeature,
  analyzeDataset,
  calculateDistributionStats,
  calculateSkewness,
  getSuggestionsForFeature,
  checkTransformationApplicability,
  getTransformationDefinitions,
};


// ─────────────────────────────────────────────────────────────────────────────
// Transformation Application
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply a transformation to numeric data
 */
export function applyTransformation(
  data: number[],
  transformation: TransformationType
): { transformed: number[]; success: boolean; error?: string } {
  try {
    let transformed: number[];
    
    switch (transformation) {
      case 'log':
        if (data.some(v => v <= 0)) {
          return { transformed: [], success: false, error: 'Log requires positive values' };
        }
        transformed = data.map(x => Math.log(x));
        break;
        
      case 'sqrt':
        if (data.some(v => v < 0)) {
          return { transformed: [], success: false, error: 'Sqrt requires non-negative values' };
        }
        transformed = data.map(x => Math.sqrt(x));
        break;
        
      case 'square':
        transformed = data.map(x => x * x);
        break;
        
      case 'normalize': {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        if (range === 0) {
          transformed = data.map(() => 0.5);
        } else {
          transformed = data.map(x => (x - min) / range);
        }
        break;
      }
        
      case 'standardize': {
        const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
        const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
        const std = Math.sqrt(variance);
        if (std === 0) {
          transformed = data.map(() => 0);
        } else {
          transformed = data.map(x => (x - mean) / std);
        }
        break;
      }
        
      case 'polynomial_2':
        transformed = data.map(x => x * x);
        break;
        
      case 'polynomial_3':
        transformed = data.map(x => x * x * x);
        break;
        
      case 'yeo_johnson': {
        // Simplified Yeo-Johnson with lambda = 0.5
        const lambda = 0.5;
        transformed = data.map(x => {
          if (x >= 0) {
            return (Math.pow(x + 1, lambda) - 1) / lambda;
          } else {
            return -(Math.pow(-x + 1, 2 - lambda) - 1) / (2 - lambda);
          }
        });
        break;
      }
        
      case 'binning': {
        // Create 10 equal-width bins
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / 10;
        transformed = data.map(x => {
          if (binWidth === 0) return 5;
          const bin = Math.floor((x - min) / binWidth);
          return Math.min(bin, 9); // Ensure max bin is 9
        });
        break;
      }
        
      default:
        return { transformed: data, success: true };
    }
    
    return { transformed, success: true };
  } catch (error) {
    return { 
      transformed: [], 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Store for transformation history (for undo functionality)
 */
const transformationHistory: Map<string, { original: number[]; transformations: string[] }> = new Map();

/**
 * Apply transformation with history tracking for undo
 */
export function applyTransformationWithHistory(
  featureId: string,
  data: number[],
  transformation: TransformationType
): { transformed: number[]; success: boolean; error?: string } {
  // Store original if this is the first transformation
  if (!transformationHistory.has(featureId)) {
    transformationHistory.set(featureId, { original: [...data], transformations: [] });
  }
  
  const result = applyTransformation(data, transformation);
  
  if (result.success) {
    const history = transformationHistory.get(featureId)!;
    history.transformations.push(transformation);
  }
  
  return result;
}

/**
 * Undo the last transformation for a feature
 */
export function undoTransformation(featureId: string): number[] | null {
  const history = transformationHistory.get(featureId);
  if (!history || history.transformations.length === 0) {
    return null;
  }
  
  // Remove the last transformation
  history.transformations.pop();
  
  // Reapply all remaining transformations from original
  let data = [...history.original];
  for (const transformation of history.transformations) {
    const result = applyTransformation(data, transformation as TransformationType);
    if (result.success) {
      data = result.transformed;
    }
  }
  
  return data;
}

/**
 * Clear transformation history for a feature
 */
export function clearTransformationHistory(featureId: string): void {
  transformationHistory.delete(featureId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save a transformation pipeline
 */
export function savePipeline(
  name: string,
  transformations: AppliedTransformation[],
  originalColumns: string[]
): TransformationPipeline {
  const steps: PipelineStep[] = transformations.map((t, index) => ({
    id: `step-${index + 1}`,
    order: index + 1,
    transformation: t.type,
    sourceColumn: t.feature,
    targetColumn: t.newColumnName || `${t.feature}_${t.type}`,
    parameters: t.parameters,
  }));
  
  const newColumns = steps.map(s => s.targetColumn);
  const totalImprovement = transformations.reduce((sum, t) => sum + t.performanceImpact, 0);
  
  return {
    id: `pipeline-${Date.now()}`,
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    steps,
    metadata: {
      originalColumns,
      newColumns,
      totalImprovement,
    },
  };
}

/**
 * Load a transformation pipeline
 */
export function loadPipeline(pipeline: TransformationPipeline): AppliedTransformation[] {
  return pipeline.steps.map(step => ({
    id: step.id,
    type: step.transformation,
    feature: step.sourceColumn,
    timestamp: pipeline.createdAt,
    importanceChange: 0, // Will be recalculated when applied
    performanceImpact: 0,
    newColumnName: step.targetColumn,
    parameters: step.parameters,
  }));
}

/**
 * Export a pipeline to JSON
 */
export function exportPipeline(pipeline: TransformationPipeline): string {
  return JSON.stringify(pipeline, null, 2);
}

/**
 * Import a pipeline from JSON
 */
export function importPipeline(json: string): TransformationPipeline | null {
  try {
    const parsed = JSON.parse(json);
    // Validate required fields
    if (!parsed.id || !parsed.name || !parsed.steps || !Array.isArray(parsed.steps)) {
      return null;
    }
    // Convert date strings back to Date objects
    parsed.createdAt = new Date(parsed.createdAt);
    parsed.updatedAt = new Date(parsed.updatedAt);
    return parsed as TransformationPipeline;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Educational Content
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get explanation for a transformation
 */
export function getTransformationExplanation(transformation: TransformationType): TransformationExplanation {
  const explanations: Record<TransformationType, TransformationExplanation> = {
    log: {
      whatItDoes: 'Applies the natural logarithm to each value, compressing large values and expanding small ones.',
      whyItHelps: 'Reduces right skewness, making the distribution more symmetric. Many ML algorithms perform better with normally distributed features.',
      visualAnalogy: 'Like using a magnifying glass for small values while shrinking large ones.',
      realWorldExample: 'Income data often spans from thousands to millions. Log transform makes $10K vs $20K as distinguishable as $100K vs $200K.',
      mathematicalFormula: "x' = ln(x)",
    },
    sqrt: {
      whatItDoes: 'Takes the square root of each value, moderately compressing the scale.',
      whyItHelps: 'Reduces skewness less aggressively than log. Works with zero values.',
      visualAnalogy: 'Like gently squeezing a balloon - it compresses but keeps the general shape.',
      realWorldExample: 'Count data like "number of purchases" often benefits from sqrt to reduce the impact of heavy buyers.',
      mathematicalFormula: "x' = √x",
    },
    square: {
      whatItDoes: 'Squares each value, emphasizing larger values.',
      whyItHelps: 'Can help with left-skewed data or when you want to emphasize differences in larger values.',
      visualAnalogy: 'Like a megaphone that amplifies louder sounds even more.',
      mathematicalFormula: "x' = x²",
    },
    normalize: {
      whatItDoes: 'Scales all values to fall between 0 and 1.',
      whyItHelps: 'Puts all features on the same scale, which is essential for neural networks and distance-based algorithms.',
      visualAnalogy: 'Like converting all measurements to percentages of the maximum.',
      realWorldExample: 'When combining age (0-100) with income (0-1M), normalization ensures neither dominates.',
      mathematicalFormula: "x' = (x - min) / (max - min)",
    },
    standardize: {
      whatItDoes: 'Centers data at 0 and scales to have standard deviation of 1.',
      whyItHelps: 'Makes features comparable and helps algorithms converge faster. Essential for PCA and many linear models.',
      visualAnalogy: 'Like grading on a curve - everyone is measured relative to the class average.',
      realWorldExample: 'Test scores from different subjects can be compared after standardization.',
      mathematicalFormula: "x' = (x - μ) / σ",
    },
    binning: {
      whatItDoes: 'Groups continuous values into discrete bins or categories.',
      whyItHelps: 'Can handle outliers, reduce noise, and capture non-linear relationships.',
      visualAnalogy: 'Like sorting items into labeled boxes instead of measuring each precisely.',
      realWorldExample: 'Age groups (18-25, 26-35, etc.) instead of exact ages.',
    },
    box_cox: {
      whatItDoes: 'Automatically finds the best power transformation to normalize data.',
      whyItHelps: 'Optimally reduces skewness without manual tuning.',
      mathematicalFormula: "x' = (x^λ - 1) / λ",
    },
    yeo_johnson: {
      whatItDoes: 'Like Box-Cox but works with zero and negative values.',
      whyItHelps: 'More flexible than Box-Cox, applicable to any numeric data.',
    },
    one_hot: {
      whatItDoes: 'Creates a new binary column for each category.',
      whyItHelps: 'Allows linear models to learn separate weights for each category.',
      visualAnalogy: 'Like giving each category its own checkbox.',
      realWorldExample: 'Color (red, blue, green) becomes three columns: is_red, is_blue, is_green.',
    },
    label_encode: {
      whatItDoes: 'Converts categories to integers (0, 1, 2, ...).',
      whyItHelps: 'Memory efficient and works well with tree-based models.',
      visualAnalogy: 'Like assigning jersey numbers to players.',
      realWorldExample: 'Size (S, M, L, XL) becomes (0, 1, 2, 3).',
    },
    frequency_encode: {
      whatItDoes: 'Replaces each category with how often it appears.',
      whyItHelps: 'Captures category popularity without creating many columns.',
      realWorldExample: 'City names replaced by their population counts.',
    },
    target_encode: {
      whatItDoes: 'Replaces categories with the average target value for that category.',
      whyItHelps: 'Directly captures the relationship between category and target.',
      realWorldExample: 'Zip codes replaced by average house prices in that area.',
    },
    binary_encode: {
      whatItDoes: 'Encodes categories as binary numbers, creating log2(n) columns.',
      whyItHelps: 'Balance between one-hot (many columns) and label encoding (single column).',
    },
    tfidf: {
      whatItDoes: 'Converts text to numbers based on word importance.',
      whyItHelps: 'Captures which words are distinctive for each document.',
      visualAnalogy: 'Like highlighting the unique words in each document.',
      realWorldExample: 'In a cooking blog, "recipe" appears everywhere (low TF-IDF), but "soufflé" is distinctive (high TF-IDF).',
    },
    word_count: {
      whatItDoes: 'Counts the number of words in each text.',
      whyItHelps: 'Simple feature that captures text length.',
      realWorldExample: 'Spam emails often have different word counts than legitimate ones.',
    },
    char_count: {
      whatItDoes: 'Counts the number of characters in each text.',
      whyItHelps: 'Can indicate text complexity or type.',
    },
    sentence_count: {
      whatItDoes: 'Counts the number of sentences in each text.',
      whyItHelps: 'Indicates document structure and complexity.',
    },
    polynomial_2: {
      whatItDoes: 'Creates squared terms to capture quadratic relationships.',
      whyItHelps: 'Allows linear models to learn curved relationships.',
      visualAnalogy: 'Like adding a curved lens to see non-linear patterns.',
      realWorldExample: 'The relationship between speed and fuel consumption is quadratic.',
      mathematicalFormula: "x' = x²",
    },
    polynomial_3: {
      whatItDoes: 'Creates cubic terms for more complex curves.',
      whyItHelps: 'Captures S-shaped and more complex non-linear patterns.',
      mathematicalFormula: "x' = x³",
    },
    interaction: {
      whatItDoes: 'Multiplies two features together.',
      whyItHelps: 'Captures how features work together to affect the target.',
      realWorldExample: 'Price × Quality interaction captures "value for money".',
    },
  };
  
  return explanations[transformation] || {
    whatItDoes: 'Transforms the feature values.',
    whyItHelps: 'May improve model performance.',
  };
}

/**
 * Get use cases for a transformation
 */
export function getUseCases(transformation: TransformationType): UseCase[] {
  const def = getTransformationDefinitions()[transformation];
  return def.useCases.map(scenario => ({
    scenario,
    example: `Apply ${def.name} when you have ${scenario.toLowerCase()}.`,
    benefit: `Improves model performance by addressing ${scenario.toLowerCase()}.`,
  }));
}

/**
 * Get anti-patterns for a transformation
 */
export function getAntiPatterns(transformation: TransformationType): AntiPattern[] {
  const def = getTransformationDefinitions()[transformation];
  const alternatives = getAlternativesForFeatureType(def.applicableTo[0]);
  
  return def.antiPatterns.map(scenario => ({
    scenario,
    problem: `Using ${def.name} with ${scenario.toLowerCase()} can cause issues.`,
    alternative: `Consider using ${alternatives.slice(0, 2).join(' or ')} instead.`,
  }));
}

// Tips database
const TIPS: DidYouKnowTip[] = [
  { id: 'tip-1', content: 'Log transform is one of the most powerful techniques for right-skewed data like income or prices.', relatedTransformation: 'log' },
  { id: 'tip-2', content: 'Standardization is essential for algorithms that use gradient descent, like neural networks and logistic regression.', relatedTransformation: 'standardize' },
  { id: 'tip-3', content: 'Tree-based models like Random Forest and XGBoost don\'t need feature scaling!', relatedTransformation: 'normalize' },
  { id: 'tip-4', content: 'Target encoding can cause data leakage if not done carefully. Always use cross-validation.', relatedTransformation: 'target_encode' },
  { id: 'tip-5', content: 'Polynomial features can dramatically improve linear models but increase overfitting risk.', relatedTransformation: 'polynomial_2' },
  { id: 'tip-6', content: 'Feature interactions often capture domain knowledge that single features miss.', relatedTransformation: 'interaction' },
  { id: 'tip-7', content: 'TF-IDF automatically downweights common words like "the" and "is".', relatedTransformation: 'tfidf' },
  { id: 'tip-8', content: 'One-hot encoding can create thousands of columns for high-cardinality features. Consider alternatives!', relatedTransformation: 'one_hot' },
];

/**
 * Get a random tip
 */
export function getTip(): DidYouKnowTip {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

/**
 * Get tips related to a transformation
 */
export function getTipsForTransformation(transformation: TransformationType): DidYouKnowTip[] {
  return TIPS.filter(tip => tip.relatedTransformation === transformation);
}

// Glossary database
const GLOSSARY: Record<string, GlossaryEntry> = {
  skewness: {
    term: 'Skewness',
    definition: 'A measure of asymmetry in a distribution. Positive skewness means a long right tail, negative means a long left tail.',
    relatedTerms: ['kurtosis', 'normal distribution', 'log transform'],
    example: 'Income data typically has positive skewness because a few people earn much more than average.',
  },
  kurtosis: {
    term: 'Kurtosis',
    definition: 'A measure of "tailedness" - how much of the data is in the tails vs the center.',
    relatedTerms: ['skewness', 'outliers', 'normal distribution'],
    example: 'High kurtosis means more outliers than a normal distribution.',
  },
  standardization: {
    term: 'Standardization',
    definition: 'Transforming data to have mean=0 and standard deviation=1.',
    relatedTerms: ['normalization', 'z-score', 'scaling'],
    example: 'After standardization, a value of 2 means "2 standard deviations above the mean".',
  },
  normalization: {
    term: 'Normalization',
    definition: 'Scaling data to a fixed range, typically [0, 1].',
    relatedTerms: ['standardization', 'min-max scaling'],
    example: 'After normalization, the smallest value becomes 0 and the largest becomes 1.',
  },
  cardinality: {
    term: 'Cardinality',
    definition: 'The number of unique values in a categorical feature.',
    relatedTerms: ['one-hot encoding', 'categorical', 'target encoding'],
    example: 'A "country" column with 195 unique values has high cardinality.',
  },
  overfitting: {
    term: 'Overfitting',
    definition: 'When a model learns the training data too well, including noise, and performs poorly on new data.',
    relatedTerms: ['regularization', 'cross-validation', 'polynomial features'],
    example: 'A model with 100% training accuracy but 60% test accuracy is overfitting.',
  },
  'feature engineering': {
    term: 'Feature Engineering',
    definition: 'The process of creating, transforming, and selecting features to improve model performance.',
    relatedTerms: ['transformation', 'feature selection', 'domain knowledge'],
    example: 'Creating "age_squared" from "age" to capture non-linear relationships.',
  },
  'data leakage': {
    term: 'Data Leakage',
    definition: 'When information from outside the training data is used to create the model, leading to overly optimistic results.',
    relatedTerms: ['target encoding', 'cross-validation', 'train-test split'],
    example: 'Using future data to predict past events, or including the target in features.',
  },
};

/**
 * Get a glossary term definition
 */
export function getGlossaryTerm(term: string): GlossaryEntry | null {
  const normalizedTerm = term.toLowerCase().trim();
  return GLOSSARY[normalizedTerm] || null;
}

/**
 * Get all glossary terms
 */
export function getAllGlossaryTerms(): GlossaryEntry[] {
  return Object.values(GLOSSARY);
}

// Add new methods to the service export
Object.assign(workshopEngineService, {
  applyTransformation,
  applyTransformationWithHistory,
  undoTransformation,
  clearTransformationHistory,
  savePipeline,
  loadPipeline,
  exportPipeline,
  importPipeline,
  getTransformationExplanation,
  getUseCases,
  getAntiPatterns,
  getTip,
  getTipsForTransformation,
  getGlossaryTerm,
  getAllGlossaryTerms,
});


// ─────────────────────────────────────────────────────────────────────────────
// Service Integration
// ─────────────────────────────────────────────────────────────────────────────

import { featureEngineeringService } from './featureEngineeringService';
import { featureImportanceService } from './featureImportanceService';
import { transformationAnalysisService } from './transformationAnalysisService';
import type { ColumnInfo } from './dataValidationService';
import type { EngineeringSuggestion, TransformationResult } from './featureEngineeringService';

/**
 * Integrated analysis combining workshop engine with existing services
 */
export interface IntegratedAnalysisResult {
  datasetAnalysis: DatasetAnalysis;
  featureImportance: ReturnType<typeof featureImportanceService.calculateFeatureImportance> | null;
  transformationPreviews: Map<string, ReturnType<typeof transformationAnalysisService.generatePreview>>;
  recommendations: string[];
}

/**
 * Perform integrated analysis using all available services
 */
export function performIntegratedAnalysis(
  data: string[][],
  columnInfo: ColumnInfo[],
  targetColumn?: string
): IntegratedAnalysisResult {
  // 1. Analyze dataset using workshop engine
  const datasetAnalysis = analyzeDataset(
    data.slice(1), // Skip header row
    columnInfo.map(c => ({ name: c.name, type: c.type }))
  );

  // 2. Calculate feature importance if target column is provided
  let featureImportance = null;
  if (targetColumn) {
    try {
      featureImportance = featureImportanceService.calculateFeatureImportance(
        data,
        columnInfo,
        targetColumn
      );
    } catch (error) {
      console.warn('Could not calculate feature importance:', error);
    }
  }

  // 3. Generate transformation previews for top suggestions
  const transformationPreviews = new Map<string, ReturnType<typeof transformationAnalysisService.generatePreview>>();
  
  datasetAnalysis.columns.forEach(column => {
    const suggestions = datasetAnalysis.suggestedTransformations.get(column.name);
    if (suggestions && suggestions.length > 0) {
      // Get top applicable suggestion
      const topSuggestion = suggestions.find(s => s.applicability === 'applicable');
      if (topSuggestion) {
        // Convert to EngineeringSuggestion format for transformationAnalysisService
        const legacySuggestion: EngineeringSuggestion = {
          id: `${column.name}-${topSuggestion.type}`,
          type: topSuggestion.type as any,
          name: topSuggestion.name,
          title: topSuggestion.name,
          description: topSuggestion.description,
          expectedImpact: topSuggestion.expectedImpact === 'high' ? 0.15 : 
                         topSuggestion.expectedImpact === 'medium' ? 0.10 : 0.05,
          impact: topSuggestion.expectedImpact === 'high' ? 0.15 : 
                 topSuggestion.expectedImpact === 'medium' ? 0.10 : 0.05,
          column: column.name,
          columns: [column.name],
        };

        try {
          const preview = transformationAnalysisService.generatePreview(
            data,
            columnInfo,
            legacySuggestion,
            targetColumn
          );
          transformationPreviews.set(column.name, preview);
        } catch (error) {
          console.warn(`Could not generate preview for ${column.name}:`, error);
        }
      }
    }
  });

  // 4. Combine recommendations from all sources
  const recommendations: string[] = [
    ...datasetAnalysis.overallRecommendations,
  ];

  if (featureImportance) {
    recommendations.push(...featureImportance.recommendations);
  }

  // Add recommendations based on transformation previews
  transformationPreviews.forEach((preview, columnName) => {
    if (preview.performanceImpact.estimatedImprovement > 5) {
      recommendations.push(
        `Consider applying ${preview.suggestion.name} to "${columnName}" for ~${preview.performanceImpact.estimatedImprovement}% improvement`
      );
    }
  });

  return {
    datasetAnalysis,
    featureImportance,
    transformationPreviews,
    recommendations,
  };
}

/**
 * Apply transformation using the legacy featureEngineeringService
 * and track it in the workshop engine
 */
export function applyTransformationWithTracking(
  data: string[][],
  columnName: string,
  transformation: TransformationType,
  featureId?: string
): TransformationResult & { workshopTracking: { featureId: string; historyLength: number } } {
  // Get column index
  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  
  if (colIndex === -1) {
    throw new Error(`Column "${columnName}" not found`);
  }

  // Extract numeric values from column
  const numericValues = data.slice(1).map(row => {
    const val = parseFloat(row[colIndex]);
    return isNaN(val) ? 0 : val;
  });

  // Apply transformation using workshop engine (with history tracking)
  const id = featureId || `${columnName}-${Date.now()}`;
  const result = applyTransformationWithHistory(id, numericValues, transformation);

  if (!result.success) {
    throw new Error(result.error || 'Transformation failed');
  }

  // Also use featureEngineeringService for the full result
  const legacyResult = featureEngineeringService.simulateTransformation(
    'numerical',
    transformation as any
  );

  // Get history length
  const history = transformationHistory.get(id);
  const historyLength = history?.transformations.length || 0;

  return {
    ...legacyResult,
    originalDistribution: numericValues,
    transformedDistribution: result.transformed,
    workshopTracking: {
      featureId: id,
      historyLength,
    },
  };
}

/**
 * Get combined suggestions from both workshop engine and legacy service
 */
export function getCombinedSuggestions(
  featureType: FeatureType,
  featureData: (string | number)[],
  featureName: string
): TransformationSuggestion[] {
  // Get suggestions from workshop engine (more detailed)
  const workshopSuggestions = getSuggestionsForFeature(featureType, featureData, featureName);

  // Get suggestions from legacy service
  const legacySuggestions = featureEngineeringService.getSuggestionsForType(featureType as any);

  // Merge: workshop suggestions take priority, but add any missing from legacy
  const suggestionTypes = new Set(workshopSuggestions.map(s => s.type));
  
  legacySuggestions.forEach(legacy => {
    if (!suggestionTypes.has(legacy.type as TransformationType)) {
      workshopSuggestions.push({
        type: legacy.type as TransformationType,
        name: legacy.name,
        description: legacy.description,
        expectedImpact: legacy.expectedImpact as ImpactLevel,
        applicability: 'applicable',
        complexity: legacy.complexity as 'simple' | 'moderate' | 'complex',
        useCases: [],
        antiPatterns: [],
      });
    }
  });

  return workshopSuggestions;
}

/**
 * Calculate feature importance change after transformation
 */
export function calculateImportanceChange(
  data: string[][],
  columnInfo: ColumnInfo[],
  targetColumn: string,
  transformedColumnName: string,
  originalColumnName: string
): { before: number; after: number; change: number; percentChange: number } {
  try {
    const importance = featureImportanceService.calculateFeatureImportance(
      data,
      columnInfo,
      targetColumn
    );

    const originalFeature = importance.features.find(f => f.feature === originalColumnName);
    const transformedFeature = importance.features.find(f => f.feature === transformedColumnName);

    const before = originalFeature?.importance || 0;
    const after = transformedFeature?.importance || before;
    const change = after - before;
    const percentChange = before > 0 ? (change / before) * 100 : 0;

    return { before, after, change, percentChange };
  } catch (error) {
    console.warn('Could not calculate importance change:', error);
    return { before: 0, after: 0, change: 0, percentChange: 0 };
  }
}

// Reference to transformation history for integration
const transformationHistoryRef = transformationHistory;

// Add integration methods to the service export
Object.assign(workshopEngineService, {
  performIntegratedAnalysis,
  applyTransformationWithTracking,
  getCombinedSuggestions,
  calculateImportanceChange,
  // Re-export integrated services for convenience
  featureEngineeringService,
  featureImportanceService,
  transformationAnalysisService,
});
