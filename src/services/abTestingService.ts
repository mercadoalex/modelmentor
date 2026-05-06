export type ExperimentStatus = 'draft' | 'running' | 'completed' | 'stopped';
export type VariantType = 'control' | 'treatment';

export interface ModelVariant {
  id: string;
  name: string;
  version: string;
  type: VariantType;
  trafficPercentage: number;
  description: string;
}

export interface ExperimentMetrics {
  variantId: string;
  sampleSize: number;
  accuracy: number;
  latency: number; // milliseconds
  throughput: number; // requests per second
  conversionRate: number;
  errorRate: number;
}

export interface StatisticalTest {
  testType: 't-test' | 'chi-square' | 'mann-whitney';
  pValue: number;
  statistic: number;
  significant: boolean;
  confidenceLevel: number;
}

export interface ConfidenceInterval {
  metric: string;
  lower: number;
  upper: number;
  mean: number;
  confidenceLevel: number;
}

export interface ExperimentResult {
  experimentId: string;
  winner: string | null;
  winnerConfidence: number;
  statisticalTests: StatisticalTest[];
  confidenceIntervals: ConfidenceInterval[];
  recommendation: string;
  shouldDeploy: boolean;
}

export interface ABExperiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  variants: ModelVariant[];
  startDate: Date;
  endDate?: Date;
  targetSampleSize: number;
  currentSampleSize: number;
  successMetric: 'accuracy' | 'latency' | 'conversion_rate';
  minimumDetectableEffect: number; // Minimum improvement to detect (e.g., 0.05 = 5%)
  significanceLevel: number; // Alpha (e.g., 0.05 = 95% confidence)
  metrics: ExperimentMetrics[];
  result?: ExperimentResult;
}

export const abTestingService = {
  /**
   * Calculate t-test for comparing two means
   */
  calculateTTest(
    sample1: number[],
    sample2: number[],
    significanceLevel: number = 0.05
  ): StatisticalTest {
    const n1 = sample1.length;
    const n2 = sample2.length;

    // Calculate means
    const mean1 = sample1.reduce((a, b) => a + b, 0) / n1;
    const mean2 = sample2.reduce((a, b) => a + b, 0) / n2;

    // Calculate variances
    const variance1 = sample1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (n1 - 1);
    const variance2 = sample2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (n2 - 1);

    // Calculate pooled standard error
    const pooledSE = Math.sqrt(variance1 / n1 + variance2 / n2);

    // Calculate t-statistic
    const tStatistic = (mean1 - mean2) / pooledSE;

    // Degrees of freedom (Welch's approximation)
    const df = Math.pow(variance1 / n1 + variance2 / n2, 2) /
      (Math.pow(variance1 / n1, 2) / (n1 - 1) + Math.pow(variance2 / n2, 2) / (n2 - 1));

    // Approximate p-value using t-distribution
    // For simplicity, using normal approximation for large samples
    const pValue = this.approximatePValue(Math.abs(tStatistic), df);

    return {
      testType: 't-test',
      pValue,
      statistic: tStatistic,
      significant: pValue < significanceLevel,
      confidenceLevel: 1 - significanceLevel,
    };
  },

  /**
   * Calculate chi-square test for categorical data
   */
  calculateChiSquareTest(
    observed1: number[],
    observed2: number[],
    significanceLevel: number = 0.05
  ): StatisticalTest {
    // Calculate expected frequencies
    const total1 = observed1.reduce((a, b) => a + b, 0);
    const total2 = observed2.reduce((a, b) => a + b, 0);
    const grandTotal = total1 + total2;

    let chiSquare = 0;
    for (let i = 0; i < observed1.length; i++) {
      const expected1 = (observed1[i] + observed2[i]) * total1 / grandTotal;
      const expected2 = (observed1[i] + observed2[i]) * total2 / grandTotal;

      chiSquare += Math.pow(observed1[i] - expected1, 2) / expected1;
      chiSquare += Math.pow(observed2[i] - expected2, 2) / expected2;
    }

    const df = observed1.length - 1;
    const pValue = this.approximateChiSquarePValue(chiSquare, df);

    return {
      testType: 'chi-square',
      pValue,
      statistic: chiSquare,
      significant: pValue < significanceLevel,
      confidenceLevel: 1 - significanceLevel,
    };
  },

  /**
   * Calculate confidence interval
   */
  calculateConfidenceInterval(
    data: number[],
    confidenceLevel: number = 0.95
  ): { lower: number; upper: number; mean: number } {
    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
    const stdError = Math.sqrt(variance / n);

    // Z-score for confidence level (approximation)
    const alpha = 1 - confidenceLevel;
    const zScore = this.getZScore(1 - alpha / 2);

    const margin = zScore * stdError;

    return {
      lower: mean - margin,
      upper: mean + margin,
      mean,
    };
  },

  /**
   * Get Z-score for confidence level
   */
  getZScore(probability: number): number {
    // Approximation for common confidence levels
    if (probability >= 0.975) return 1.96; // 95% CI
    if (probability >= 0.95) return 1.645; // 90% CI
    if (probability >= 0.995) return 2.576; // 99% CI
    return 1.96; // Default to 95%
  },

  /**
   * Approximate p-value for t-test
   */
  approximatePValue(tStat: number, df: number): number {
    // Simple approximation using normal distribution for large df
    if (df > 30) {
      // Use standard normal approximation
      const z = tStat;
      return 2 * (1 - this.normalCDF(Math.abs(z)));
    }
    // For small df, use conservative estimate
    return Math.min(1, 2 * Math.exp(-0.5 * tStat * tStat));
  },

  /**
   * Approximate p-value for chi-square test
   */
  approximateChiSquarePValue(chiSquare: number, df: number): number {
    // Simple approximation
    if (chiSquare < 0) return 1;
    if (df === 1) {
      if (chiSquare > 10.83) return 0.001;
      if (chiSquare > 6.63) return 0.01;
      if (chiSquare > 3.84) return 0.05;
      return 0.1;
    }
    // Conservative estimate for other df
    return Math.max(0.001, Math.min(1, Math.exp(-chiSquare / (2 * df))));
  },

  /**
   * Normal CDF approximation
   */
  normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  },

  /**
   * Calculate required sample size for experiment
   */
  calculateRequiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    significanceLevel: number = 0.05,
    power: number = 0.8
  ): number {
    // Simplified sample size calculation
    const zAlpha = this.getZScore(1 - significanceLevel / 2);
    const zBeta = this.getZScore(power);

    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minimumDetectableEffect);

    const pooledP = (p1 + p2) / 2;
    const numerator = Math.pow(zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  },

  /**
   * Route traffic to variants based on percentages
   */
  routeTraffic(variants: ModelVariant[]): string {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.trafficPercentage;
      if (random <= cumulative) {
        return variant.id;
      }
    }

    return variants[0].id; // Fallback to first variant
  },

  /**
   * Determine experiment winner
   */
  determineWinner(
    experiment: ABExperiment
  ): ExperimentResult {
    const controlMetrics = experiment.metrics.find(m =>
      experiment.variants.find(v => v.id === m.variantId)?.type === 'control'
    );
    const treatmentMetrics = experiment.metrics.find(m =>
      experiment.variants.find(v => v.id === m.variantId)?.type === 'treatment'
    );

    if (!controlMetrics || !treatmentMetrics) {
      return {
        experimentId: experiment.id,
        winner: null,
        winnerConfidence: 0,
        statisticalTests: [],
        confidenceIntervals: [],
        recommendation: 'Insufficient data to determine winner',
        shouldDeploy: false,
      };
    }

    // Generate sample data for statistical tests
    const controlAccuracy = this.generateSampleData(
      controlMetrics.accuracy,
      controlMetrics.sampleSize,
      0.05
    );
    const treatmentAccuracy = this.generateSampleData(
      treatmentMetrics.accuracy,
      treatmentMetrics.sampleSize,
      0.05
    );

    // Perform t-test on accuracy
    const tTest = this.calculateTTest(
      treatmentAccuracy,
      controlAccuracy,
      experiment.significanceLevel
    );

    // Calculate confidence intervals
    const controlCI = this.calculateConfidenceInterval(controlAccuracy, 0.95);
    const treatmentCI = this.calculateConfidenceInterval(treatmentAccuracy, 0.95);

    const confidenceIntervals: ConfidenceInterval[] = [
      {
        metric: 'Control Accuracy',
        lower: controlCI.lower,
        upper: controlCI.upper,
        mean: controlCI.mean,
        confidenceLevel: 0.95,
      },
      {
        metric: 'Treatment Accuracy',
        lower: treatmentCI.lower,
        upper: treatmentCI.upper,
        mean: treatmentCI.mean,
        confidenceLevel: 0.95,
      },
    ];

    // Determine winner
    let winner: string | null = null;
    let winnerConfidence = 0;
    let recommendation = '';
    let shouldDeploy = false;

    const improvement = (treatmentMetrics.accuracy - controlMetrics.accuracy) / controlMetrics.accuracy;

    if (tTest.significant) {
      if (treatmentMetrics.accuracy > controlMetrics.accuracy) {
        winner = treatmentMetrics.variantId;
        winnerConfidence = 1 - tTest.pValue;
        recommendation = `Treatment variant shows statistically significant improvement of ${(improvement * 100).toFixed(2)}%. Recommend deployment.`;
        shouldDeploy = improvement >= experiment.minimumDetectableEffect;
      } else {
        winner = controlMetrics.variantId;
        winnerConfidence = 1 - tTest.pValue;
        recommendation = 'Control variant performs better. Do not deploy treatment.';
        shouldDeploy = false;
      }
    } else {
      recommendation = `No statistically significant difference detected (p=${tTest.pValue.toFixed(4)}). Continue experiment or increase sample size.`;
      shouldDeploy = false;
    }

    return {
      experimentId: experiment.id,
      winner,
      winnerConfidence,
      statisticalTests: [tTest],
      confidenceIntervals,
      recommendation,
      shouldDeploy,
    };
  },

  /**
   * Generate sample data for testing (normal distribution)
   */
  generateSampleData(mean: number, sampleSize: number, stdDev: number): number[] {
    const samples: number[] = [];
    for (let i = 0; i < sampleSize; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      samples.push(mean + z * stdDev);
    }
    return samples;
  },

  /**
   * Simulate experiment data collection
   */
  simulateExperiment(experiment: ABExperiment, days: number = 7): ABExperiment {
    const samplesPerDay = Math.floor(experiment.targetSampleSize / days);
    const metrics: ExperimentMetrics[] = [];

    for (const variant of experiment.variants) {
      const sampleSize = Math.floor(samplesPerDay * days * variant.trafficPercentage / 100);

      // Simulate metrics with some variation
      const baseAccuracy = variant.type === 'control' ? 0.85 : 0.88;
      const baseLatency = variant.type === 'control' ? 50 : 45;
      const baseConversion = variant.type === 'control' ? 0.12 : 0.14;

      metrics.push({
        variantId: variant.id,
        sampleSize,
        accuracy: baseAccuracy + (Math.random() - 0.5) * 0.02,
        latency: baseLatency + (Math.random() - 0.5) * 5,
        throughput: 100 + (Math.random() - 0.5) * 10,
        conversionRate: baseConversion + (Math.random() - 0.5) * 0.01,
        errorRate: 0.01 + Math.random() * 0.005,
      });
    }

    const updatedExperiment = {
      ...experiment,
      currentSampleSize: samplesPerDay * days,
      metrics,
      status: 'running' as ExperimentStatus,
    };

    // Determine winner if sample size reached
    if (updatedExperiment.currentSampleSize >= experiment.targetSampleSize) {
      updatedExperiment.result = this.determineWinner(updatedExperiment);
      updatedExperiment.status = 'completed';
      updatedExperiment.endDate = new Date();
    }

    return updatedExperiment;
  },

  /**
   * Create new A/B experiment
   */
  createExperiment(
    name: string,
    description: string,
    controlVariant: ModelVariant,
    treatmentVariant: ModelVariant,
    successMetric: ABExperiment['successMetric'],
    minimumDetectableEffect: number
  ): ABExperiment {
    const baselineRate = 0.85; // Assumed baseline
    const targetSampleSize = this.calculateRequiredSampleSize(
      baselineRate,
      minimumDetectableEffect,
      0.05,
      0.8
    );

    return {
      id: `exp_${Date.now()}`,
      name,
      description,
      status: 'draft',
      variants: [controlVariant, treatmentVariant],
      startDate: new Date(),
      targetSampleSize,
      currentSampleSize: 0,
      successMetric,
      minimumDetectableEffect,
      significanceLevel: 0.05,
      metrics: [],
    };
  },

  /**
   * Generate sample experiment for demonstration
   */
  generateSampleExperiment(): ABExperiment {
    const controlVariant: ModelVariant = {
      id: 'variant_control',
      name: 'Model v2.0.0',
      version: 'v2.0.0',
      type: 'control',
      trafficPercentage: 50,
      description: 'Current production model',
    };

    const treatmentVariant: ModelVariant = {
      id: 'variant_treatment',
      name: 'Model v2.1.0',
      version: 'v2.1.0',
      type: 'treatment',
      trafficPercentage: 50,
      description: 'New model with improved features',
    };

    const experiment = this.createExperiment(
      'Model v2.1.0 Rollout',
      'Testing new model version with additional features',
      controlVariant,
      treatmentVariant,
      'accuracy',
      0.03 // 3% minimum improvement
    );

    // Simulate 7 days of data
    return this.simulateExperiment(experiment, 7);
  },
};
