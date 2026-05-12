/**
 * StatisticalService - Statistical significance testing for model comparison
 * 
 * This service provides:
 * - Paired t-test for accuracy differences
 * - McNemar test for classification disagreement
 * - Pairwise comparison across multiple models
 */

import type { StatisticalTestResult, PredictionData } from '@/types/comparison';

// ─────────────────────────────────────────────────────────────────────────────
// Statistical Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate mean of an array of numbers
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(v => (v - avg) ** 2);
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}

/**
 * Calculate standard error of the mean
 */
function standardError(values: number[]): number {
  if (values.length < 2) return 0;
  return standardDeviation(values) / Math.sqrt(values.length);
}

/**
 * Approximate t-distribution critical value for 95% confidence
 * Uses a simplified approximation for degrees of freedom > 30
 */
function tCritical(df: number): number {
  // For df > 30, t approaches z = 1.96
  if (df > 120) return 1.96;
  if (df > 60) return 2.0;
  if (df > 30) return 2.04;
  if (df > 20) return 2.09;
  if (df > 10) return 2.23;
  if (df > 5) return 2.57;
  return 2.78;
}

/**
 * Calculate p-value from t-statistic using approximation
 * This is a simplified approximation for two-tailed test
 */
function tToPValue(t: number, df: number): number {
  // Use normal approximation for large df
  const absT = Math.abs(t);
  
  // Simplified p-value approximation
  // For |t| > 4, p < 0.0001
  if (absT > 4) return 0.0001;
  if (absT > 3.5) return 0.001;
  if (absT > 3) return 0.005;
  if (absT > 2.5) return 0.02;
  if (absT > 2) return 0.05;
  if (absT > 1.5) return 0.15;
  if (absT > 1) return 0.32;
  return 0.5;
}

/**
 * Calculate chi-squared p-value approximation
 */
function chiSquaredToPValue(chiSq: number, df: number = 1): number {
  // Simplified approximation for df=1
  if (chiSq > 10.83) return 0.001;
  if (chiSq > 6.63) return 0.01;
  if (chiSq > 3.84) return 0.05;
  if (chiSq > 2.71) return 0.1;
  if (chiSq > 1.32) return 0.25;
  return 0.5;
}

// ─────────────────────────────────────────────────────────────────────────────
// StatisticalService Class
// ─────────────────────────────────────────────────────────────────────────────

class StatisticalServiceImpl {
  /**
   * Compute paired t-test for accuracy differences between two models
   * 
   * @param modelAAccuracies - Array of accuracy values for model A (e.g., per-fold or per-sample)
   * @param modelBAccuracies - Array of accuracy values for model B
   * @returns StatisticalTestResult with p-value, significance, and confidence interval
   */
  computePairedTTest(
    modelAAccuracies: number[],
    modelBAccuracies: number[],
    modelAId: string,
    modelAName: string,
    modelBId: string,
    modelBName: string
  ): StatisticalTestResult {
    // Validate inputs
    if (modelAAccuracies.length !== modelBAccuracies.length) {
      throw new Error('Arrays must have the same length for paired t-test');
    }

    const n = modelAAccuracies.length;
    
    if (n < 2) {
      return {
        testName: 'paired_t_test',
        modelAId,
        modelAName,
        modelBId,
        modelBName,
        pValue: 1,
        significant: false,
        confidenceInterval: [0, 0],
        effectSize: 0,
      };
    }

    // Calculate differences
    const differences = modelAAccuracies.map((a, i) => a - modelBAccuracies[i]);
    
    // Calculate mean difference
    const meanDiff = mean(differences);
    
    // Calculate standard error of differences
    const seDiff = standardError(differences);
    
    // Calculate t-statistic
    const tStat = seDiff > 0 ? meanDiff / seDiff : 0;
    
    // Degrees of freedom
    const df = n - 1;
    
    // Calculate p-value (two-tailed)
    const pValue = tToPValue(tStat, df);
    
    // Calculate 95% confidence interval
    const tCrit = tCritical(df);
    const marginOfError = tCrit * seDiff;
    const confidenceInterval: [number, number] = [
      meanDiff - marginOfError,
      meanDiff + marginOfError,
    ];
    
    // Calculate Cohen's d effect size
    const pooledStd = standardDeviation(differences);
    const effectSize = pooledStd > 0 ? meanDiff / pooledStd : 0;

    return {
      testName: 'paired_t_test',
      modelAId,
      modelAName,
      modelBId,
      modelBName,
      pValue: Math.round(pValue * 1000) / 1000, // 3 decimal precision
      significant: pValue < 0.05,
      confidenceInterval,
      effectSize: Math.round(effectSize * 1000) / 1000,
    };
  }

  /**
   * Compute McNemar test for classification disagreement between two models
   * 
   * McNemar test compares the disagreement patterns:
   * - b: cases where A is correct and B is wrong
   * - c: cases where A is wrong and B is correct
   * 
   * @param modelAPredictions - Array of predictions from model A
   * @param modelBPredictions - Array of predictions from model B
   * @param trueLabels - Array of true labels
   * @returns StatisticalTestResult with p-value and significance
   */
  computeMcNemarTest(
    modelAPredictions: string[],
    modelBPredictions: string[],
    trueLabels: string[],
    modelAId: string,
    modelAName: string,
    modelBId: string,
    modelBName: string
  ): StatisticalTestResult {
    // Validate inputs
    if (
      modelAPredictions.length !== modelBPredictions.length ||
      modelAPredictions.length !== trueLabels.length
    ) {
      throw new Error('All arrays must have the same length for McNemar test');
    }

    const n = modelAPredictions.length;
    
    if (n < 2) {
      return {
        testName: 'mcnemar_test',
        modelAId,
        modelAName,
        modelBId,
        modelBName,
        pValue: 1,
        significant: false,
      };
    }

    // Count disagreement patterns
    let b = 0; // A correct, B wrong
    let c = 0; // A wrong, B correct

    for (let i = 0; i < n; i++) {
      const aCorrect = modelAPredictions[i] === trueLabels[i];
      const bCorrect = modelBPredictions[i] === trueLabels[i];

      if (aCorrect && !bCorrect) b++;
      if (!aCorrect && bCorrect) c++;
    }

    // McNemar test statistic with continuity correction
    const bcSum = b + c;
    
    if (bcSum === 0) {
      // No disagreement, models are equivalent
      return {
        testName: 'mcnemar_test',
        modelAId,
        modelAName,
        modelBId,
        modelBName,
        pValue: 1,
        significant: false,
      };
    }

    // Chi-squared statistic with continuity correction
    const chiSquared = ((Math.abs(b - c) - 1) ** 2) / bcSum;
    
    // Calculate p-value
    const pValue = chiSquaredToPValue(chiSquared);

    return {
      testName: 'mcnemar_test',
      modelAId,
      modelAName,
      modelBId,
      modelBName,
      pValue: Math.round(pValue * 1000) / 1000, // 3 decimal precision
      significant: pValue < 0.05,
    };
  }

  /**
   * Compute all pairwise statistical tests for multiple models
   * 
   * @param modelIds - Array of model IDs
   * @param modelNames - Map of model ID to model name
   * @param predictions - Array of prediction data with all models' predictions
   * @returns Array of StatisticalTestResult for all unique pairs
   */
  async computeAllPairwiseTests(
    modelIds: string[],
    modelNames: Map<string, string>,
    predictions: PredictionData[]
  ): Promise<StatisticalTestResult[]> {
    const results: StatisticalTestResult[] = [];
    
    if (modelIds.length < 2 || predictions.length === 0) {
      return results;
    }

    // Generate all unique pairs
    for (let i = 0; i < modelIds.length; i++) {
      for (let j = i + 1; j < modelIds.length; j++) {
        const modelAId = modelIds[i];
        const modelBId = modelIds[j];
        const modelAName = modelNames.get(modelAId) || modelAId;
        const modelBName = modelNames.get(modelBId) || modelBId;

        // Extract predictions for this pair
        const modelAPreds: string[] = [];
        const modelBPreds: string[] = [];
        const trueLabels: string[] = [];
        const modelACorrect: number[] = [];
        const modelBCorrect: number[] = [];

        for (const pred of predictions) {
          const predA = pred.predictions[modelAId];
          const predB = pred.predictions[modelBId];
          
          if (predA !== undefined && predB !== undefined) {
            modelAPreds.push(predA);
            modelBPreds.push(predB);
            trueLabels.push(pred.trueLabel);
            modelACorrect.push(predA === pred.trueLabel ? 1 : 0);
            modelBCorrect.push(predB === pred.trueLabel ? 1 : 0);
          }
        }

        if (modelAPreds.length >= 2) {
          // Compute paired t-test on accuracy
          try {
            const tTestResult = this.computePairedTTest(
              modelACorrect,
              modelBCorrect,
              modelAId,
              modelAName,
              modelBId,
              modelBName
            );
            results.push(tTestResult);
          } catch (e) {
            // Skip if test fails
          }

          // Compute McNemar test
          try {
            const mcNemarResult = this.computeMcNemarTest(
              modelAPreds,
              modelBPreds,
              trueLabels,
              modelAId,
              modelAName,
              modelBId,
              modelBName
            );
            results.push(mcNemarResult);
          } catch (e) {
            // Skip if test fails
          }
        }
      }
    }

    return results;
  }
}

// Export singleton instance
export const statisticalService = new StatisticalServiceImpl();
