import { featureEngineeringService } from './featureEngineeringService';
import { dataProfilingService } from './dataProfilingService';
import type { EngineeringSuggestion } from './featureEngineeringService';
import type { ColumnInfo } from './dataValidationService';

export interface DistributionComparison {
  before: { value: string; count: number }[];
  after: { value: string; count: number }[];
  beforeStats?: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  afterStats?: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
}

export interface CorrelationChange {
  column: string;
  beforeCorrelation: number;
  afterCorrelation: number;
  change: number;
  improvement: boolean;
}

export interface PerformanceImpact {
  estimatedImprovement: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  benefits: string[];
  tradeoffs: string[];
}

export interface TransformationPreview {
  suggestion: EngineeringSuggestion;
  distributionComparison: DistributionComparison;
  correlationChanges: CorrelationChange[];
  performanceImpact: PerformanceImpact;
  sampleValues: {
    before: string[];
    after: string[];
  };
}

export const transformationAnalysisService = {
  /**
   * Generate preview for a transformation
   */
  generatePreview(
    data: string[][],
    columnInfo: ColumnInfo[],
    suggestion: EngineeringSuggestion,
    targetColumn?: string
  ): TransformationPreview {
    // Apply transformation to get preview data
    const transformedResult = featureEngineeringService.applySuggestion(data, suggestion);
    const transformedData = transformedResult.data;

    // Ensure transformedData is not undefined
    if (!transformedData) {
      return {
        suggestion,
        distributionComparison: {
          before: [],
          after: [],
          beforeStats: { mean: 0, std: 0, min: 0, max: 0 },
          afterStats: { mean: 0, std: 0, min: 0, max: 0 }
        },
        correlationChanges: [],
        performanceImpact: { estimatedImprovement: 0, confidence: 'low', reasoning: [], benefits: [], tradeoffs: [] },
        sampleValues: { before: [], after: [] }
      };
    }

    // Get distribution comparison
    const distributionComparison = this.compareDistributions(
      data,
      transformedData,
      suggestion
    );

    // Get correlation changes (if target column is provided)
    const correlationChanges = targetColumn
      ? this.analyzeCorrelationChanges(data, transformedData, suggestion, targetColumn)
      : [];

    // Estimate performance impact
    const performanceImpact = this.estimatePerformanceImpact(
      suggestion,
      distributionComparison,
      correlationChanges
    );

    // Get sample values
    const sampleValues = this.getSampleValues(data, transformedData, suggestion);

    return {
      suggestion,
      distributionComparison,
      correlationChanges,
      performanceImpact,
      sampleValues,
    };
  },

  /**
   * Compare distributions before and after transformation
   */
  compareDistributions(
    beforeData: string[][],
    afterData: string[][],
    suggestion: EngineeringSuggestion
  ): DistributionComparison {
    const beforeHeaders = beforeData[0];
    const afterHeaders = afterData[0];

    // For the original column
    const originalColumn = suggestion.columns?.[0];
    if (!originalColumn) {
      return {
        before: [],
        after: [],
        beforeStats: { mean: 0, std: 0, min: 0, max: 0 },
        afterStats: { mean: 0, std: 0, min: 0, max: 0 }
      };
    }
    
    const beforeIndex = beforeHeaders.indexOf(originalColumn);

    // Get before distribution
    const beforeValues = beforeData.slice(1).map(row => row[beforeIndex]);
    const beforeDist = this.calculateDistribution(beforeValues);
    const beforeStats = this.calculateStats(beforeValues);

    // For new columns, get the first new column
    const newColumnName = afterHeaders[afterHeaders.length - 1];
    const afterIndex = afterHeaders.indexOf(newColumnName);
    const afterValues = afterData.slice(1).map(row => row[afterIndex]);
    const afterDist = this.calculateDistribution(afterValues);
    const afterStats = this.calculateStats(afterValues);

    return {
      before: beforeDist,
      after: afterDist,
      beforeStats,
      afterStats,
    };
  },

  /**
   * Calculate distribution for values
   */
  calculateDistribution(values: string[]): { value: string; count: number }[] {
    const freq: Record<string, number> = {};
    values.forEach(v => {
      if (v) {
        freq[v] = (freq[v] || 0) + 1;
      }
    });

    return Object.entries(freq)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  /**
   * Calculate statistics for numeric values
   */
  calculateStats(values: string[]): {
    mean: number;
    std: number;
    min: number;
    max: number;
  } | undefined {
    const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    if (numericValues.length === 0) return undefined;

    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    return { mean, std, min, max };
  },

  /**
   * Analyze correlation changes
   */
  analyzeCorrelationChanges(
    beforeData: string[][],
    afterData: string[][],
    suggestion: EngineeringSuggestion,
    targetColumn: string
  ): CorrelationChange[] {
    const beforeHeaders = beforeData[0];
    const afterHeaders = afterData[0];
    const targetIndex = beforeHeaders.indexOf(targetColumn);

    if (targetIndex === -1) return [];

    const changes: CorrelationChange[] = [];

    // Get new columns
    const newColumns = afterHeaders.filter(h => !beforeHeaders.includes(h));

    newColumns.forEach(newCol => {
      const newColIndex = afterHeaders.indexOf(newCol);
      
      // Calculate correlation with target
      const afterCorrelation = this.calculateCorrelation(
        afterData,
        newColIndex,
        targetIndex
      );

      // For original column, get before correlation
      const originalColumn = suggestion.columns?.[0];
      if (!originalColumn) return;
      
      const beforeIndex = beforeHeaders.indexOf(originalColumn);
      const beforeCorrelation = this.calculateCorrelation(
        beforeData,
        beforeIndex,
        targetIndex
      );

      const change = Math.abs(afterCorrelation) - Math.abs(beforeCorrelation);
      const improvement = Math.abs(afterCorrelation) > Math.abs(beforeCorrelation);

      changes.push({
        column: newCol,
        beforeCorrelation,
        afterCorrelation,
        change,
        improvement,
      });
    });

    return changes;
  },

  /**
   * Calculate correlation between two columns
   */
  calculateCorrelation(data: string[][], col1Index: number, col2Index: number): number {
    const rows = data.slice(1);
    const values1: number[] = [];
    const values2: number[] = [];

    rows.forEach(row => {
      const v1 = parseFloat(row[col1Index]);
      const v2 = parseFloat(row[col2Index]);
      if (!isNaN(v1) && !isNaN(v2)) {
        values1.push(v1);
        values2.push(v2);
      }
    });

    if (values1.length === 0) return 0;

    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const dx = values1[i] - mean1;
      const dy = values2[i] - mean2;
      numerator += dx * dy;
      denom1 += dx * dx;
      denom2 += dy * dy;
    }

    if (denom1 === 0 || denom2 === 0) return 0;

    return numerator / Math.sqrt(denom1 * denom2);
  },

  /**
   * Estimate performance impact
   */
  estimatePerformanceImpact(
    suggestion: EngineeringSuggestion,
    distributionComparison: DistributionComparison,
    correlationChanges: CorrelationChange[]
  ): PerformanceImpact {
    const reasoning: string[] = [];
    const benefits: string[] = [];
    const tradeoffs: string[] = [];
    let estimatedImprovement = 0;
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    switch (suggestion.type) {
      case 'polynomial_2':
      case 'polynomial_3':
        estimatedImprovement = 5;
        confidence = 'medium';
        reasoning.push('Polynomial features can capture non-linear relationships in the data');
        benefits.push('Better fit for curved or exponential patterns');
        benefits.push('Can improve accuracy for non-linear problems');
        tradeoffs.push('Increases feature count and training time');
        tradeoffs.push('May lead to overfitting if not regularized');
        
        if (correlationChanges.some(c => c.improvement)) {
          estimatedImprovement += 3;
          confidence = 'high';
          reasoning.push('New features show stronger correlation with target');
        }
        break;

      case 'interaction':
        estimatedImprovement = 4;
        confidence = 'medium';
        reasoning.push('Interaction terms capture combined effects of features');
        benefits.push('Reveals relationships between features');
        benefits.push('Can improve model for multiplicative effects');
        tradeoffs.push('Adds one feature per interaction');
        
        if (correlationChanges.some(c => Math.abs(c.afterCorrelation) > 0.5)) {
          estimatedImprovement += 4;
          confidence = 'high';
          reasoning.push('Interaction shows strong correlation with target');
        }
        break;

      case 'one_hot':
        estimatedImprovement = 6;
        confidence = 'high';
        reasoning.push('One-hot encoding is essential for categorical variables');
        benefits.push('Allows models to use categorical data');
        benefits.push('No ordinal assumption between categories');
        benefits.push('Standard preprocessing for most ML models');
        tradeoffs.push('Increases feature count significantly');
        
        if (suggestion.newFeatureCount && suggestion.newFeatureCount > 20) {
          tradeoffs.push('High cardinality may cause dimensionality issues');
          estimatedImprovement -= 2;
        }
        break;
    }

    // Adjust based on distribution changes
    if (distributionComparison.afterStats && distributionComparison.beforeStats) {
      const beforeStd = distributionComparison.beforeStats.std;
      const afterStd = distributionComparison.afterStats.std;
      
      if (afterStd > beforeStd * 1.5) {
        reasoning.push('Transformation increases feature variance, providing more signal');
        estimatedImprovement += 2;
      }
    }

    return {
      estimatedImprovement: Math.max(0, Math.min(15, estimatedImprovement)),
      confidence,
      reasoning,
      benefits,
      tradeoffs,
    };
  },

  /**
   * Get sample values before and after transformation
   */
  getSampleValues(
    beforeData: string[][],
    afterData: string[][],
    suggestion: EngineeringSuggestion
  ): { before: string[]; after: string[] } {
    const beforeHeaders = beforeData[0];
    const afterHeaders = afterData[0];
    
    const originalColumn = suggestion.columns?.[0];
    if (!originalColumn) {
      return { before: [], after: [] };
    }
    
    const beforeIndex = beforeHeaders.indexOf(originalColumn);
    
    // Get first new column
    const newColumnName = afterHeaders[afterHeaders.length - 1];
    const afterIndex = afterHeaders.indexOf(newColumnName);

    const sampleSize = Math.min(5, beforeData.length - 1);
    const before: string[] = [];
    const after: string[] = [];

    for (let i = 1; i <= sampleSize; i++) {
      before.push(beforeData[i][beforeIndex]);
      after.push(afterData[i][afterIndex]);
    }

    return { before, after };
  },
};
