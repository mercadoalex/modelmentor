export interface FoldResult {
  fold: number;
  trainAccuracy: number;
  valAccuracy: number;
  trainLoss: number;
  valLoss: number;
}

export interface CrossValidationResult {
  folds: FoldResult[];
  meanTrainAccuracy: number;
  meanValAccuracy: number;
  stdTrainAccuracy: number;
  stdValAccuracy: number;
  accuracyRange: {
    min: number;
    max: number;
  };
  overfittingRisk: 'low' | 'medium' | 'high';
  overfittingIndicators: string[];
  recommendations: string[];
}

export interface SplitRecommendation {
  ratio: number;
  description: string;
  pros: string[];
  cons: string[];
  recommended: boolean;
}

export const crossValidationService = {
  /**
   * Perform k-fold cross-validation simulation
   */
  async performCrossValidation(
    datasetSize: number,
    numClasses: number,
    k: number = 5,
    onProgress?: (fold: number, total: number) => void
  ): Promise<CrossValidationResult> {
    const folds: FoldResult[] = [];
    
    // Base performance depends on dataset size and complexity
    const baseAccuracy = this.estimateBaseAccuracy(datasetSize, numClasses);
    const variance = this.estimateVariance(datasetSize);

    for (let i = 0; i < k; i++) {
      // Simulate training on this fold
      const trainAccuracy = Math.min(
        0.98,
        baseAccuracy + (Math.random() - 0.3) * variance + 0.05
      );
      
      const valAccuracy = Math.min(
        0.95,
        baseAccuracy + (Math.random() - 0.5) * variance
      );

      const trainLoss = (1 - trainAccuracy) * 1.5 + Math.random() * 0.1;
      const valLoss = (1 - valAccuracy) * 1.8 + Math.random() * 0.15;

      folds.push({
        fold: i + 1,
        trainAccuracy,
        valAccuracy,
        trainLoss,
        valLoss,
      });

      if (onProgress) {
        onProgress(i + 1, k);
      }

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Calculate statistics
    const meanTrainAccuracy = folds.reduce((sum, f) => sum + f.trainAccuracy, 0) / k;
    const meanValAccuracy = folds.reduce((sum, f) => sum + f.valAccuracy, 0) / k;
    
    const stdTrainAccuracy = Math.sqrt(
      folds.reduce((sum, f) => sum + Math.pow(f.trainAccuracy - meanTrainAccuracy, 2), 0) / k
    );
    const stdValAccuracy = Math.sqrt(
      folds.reduce((sum, f) => sum + Math.pow(f.valAccuracy - meanValAccuracy, 2), 0) / k
    );

    const accuracyRange = {
      min: Math.min(...folds.map(f => f.valAccuracy)),
      max: Math.max(...folds.map(f => f.valAccuracy)),
    };

    // Detect overfitting
    const overfittingGap = meanTrainAccuracy - meanValAccuracy;
    const overfittingRisk = this.assessOverfittingRisk(overfittingGap, stdValAccuracy);
    const overfittingIndicators = this.getOverfittingIndicators(
      overfittingGap,
      stdValAccuracy,
      datasetSize
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overfittingRisk,
      stdValAccuracy,
      datasetSize,
      meanValAccuracy
    );

    return {
      folds,
      meanTrainAccuracy,
      meanValAccuracy,
      stdTrainAccuracy,
      stdValAccuracy,
      accuracyRange,
      overfittingRisk,
      overfittingIndicators,
      recommendations,
    };
  },

  /**
   * Estimate base accuracy based on dataset characteristics
   */
  estimateBaseAccuracy(datasetSize: number, numClasses: number): number {
    let baseAccuracy = 0.6;

    // Dataset size effect
    if (datasetSize > 1000) {
      baseAccuracy += 0.15;
    } else if (datasetSize > 500) {
      baseAccuracy += 0.1;
    } else if (datasetSize > 200) {
      baseAccuracy += 0.05;
    }

    // Number of classes effect
    if (numClasses === 2) {
      baseAccuracy += 0.1; // Binary classification is easier
    } else if (numClasses > 10) {
      baseAccuracy -= 0.05; // Many classes is harder
    }

    return Math.min(0.9, baseAccuracy);
  },

  /**
   * Estimate variance based on dataset size
   */
  estimateVariance(datasetSize: number): number {
    if (datasetSize < 100) {
      return 0.15; // High variance with small datasets
    } else if (datasetSize < 500) {
      return 0.1;
    } else if (datasetSize < 1000) {
      return 0.06;
    } else {
      return 0.03; // Low variance with large datasets
    }
  },

  /**
   * Assess overfitting risk
   */
  assessOverfittingRisk(gap: number, std: number): 'low' | 'medium' | 'high' {
    if (gap > 0.15 || std > 0.08) {
      return 'high';
    } else if (gap > 0.08 || std > 0.05) {
      return 'medium';
    } else {
      return 'low';
    }
  },

  /**
   * Get overfitting indicators
   */
  getOverfittingIndicators(gap: number, std: number, datasetSize: number): string[] {
    const indicators: string[] = [];

    if (gap > 0.15) {
      indicators.push('Large gap between training and validation accuracy (>15%)');
    } else if (gap > 0.08) {
      indicators.push('Moderate gap between training and validation accuracy (8-15%)');
    }

    if (std > 0.08) {
      indicators.push('High variance across folds indicates unstable performance');
    } else if (std > 0.05) {
      indicators.push('Moderate variance across folds');
    }

    if (datasetSize < 200) {
      indicators.push('Small dataset size may lead to overfitting');
    }

    if (indicators.length === 0) {
      indicators.push('No significant overfitting indicators detected');
    }

    return indicators;
  },

  /**
   * Generate recommendations
   */
  generateRecommendations(
    overfittingRisk: 'low' | 'medium' | 'high',
    std: number,
    datasetSize: number,
    meanAccuracy: number
  ): string[] {
    const recommendations: string[] = [];

    if (overfittingRisk === 'high') {
      recommendations.push('Consider using regularization techniques (L1/L2) to reduce overfitting');
      recommendations.push('Try data augmentation to increase effective dataset size');
      recommendations.push('Reduce model complexity or use dropout layers');
    } else if (overfittingRisk === 'medium') {
      recommendations.push('Monitor training closely for signs of overfitting');
      recommendations.push('Consider early stopping based on validation performance');
    }

    if (std > 0.08) {
      recommendations.push('High variance suggests the model is sensitive to data splits');
      recommendations.push('Collect more training data to stabilize performance');
    }

    if (datasetSize < 200) {
      recommendations.push('Small dataset: consider transfer learning or data augmentation');
    }

    if (meanAccuracy < 0.7) {
      recommendations.push('Low accuracy: try feature engineering or a more complex model');
    }

    if (recommendations.length === 0) {
      recommendations.push('Model shows good generalization. Proceed with full training.');
    }

    return recommendations;
  },

  /**
   * Get split ratio recommendations
   */
  getSplitRecommendations(datasetSize: number): SplitRecommendation[] {
    const recommendations: SplitRecommendation[] = [];

    // 80-20 split
    recommendations.push({
      ratio: 0.8,
      description: '80% Training / 20% Validation',
      pros: [
        'Standard split used in most ML projects',
        'Good balance between training data and validation',
        'Works well for medium to large datasets',
      ],
      cons: [
        'May not provide enough validation data for small datasets',
        'Less training data than 90-10 split',
      ],
      recommended: datasetSize >= 200,
    });

    // 70-30 split
    recommendations.push({
      ratio: 0.7,
      description: '70% Training / 30% Validation',
      pros: [
        'More validation data for better performance estimation',
        'Good for small to medium datasets',
        'Reduces overfitting risk',
      ],
      cons: [
        'Less training data may reduce model performance',
        'Not standard in industry',
      ],
      recommended: datasetSize < 200,
    });

    // 90-10 split
    recommendations.push({
      ratio: 0.9,
      description: '90% Training / 10% Validation',
      pros: [
        'Maximum training data for learning',
        'Good for large datasets',
        'Can achieve higher accuracy',
      ],
      cons: [
        'Small validation set may not be representative',
        'Higher risk of overfitting',
        'Less reliable performance estimates',
      ],
      recommended: datasetSize > 1000,
    });

    return recommendations;
  },

  /**
   * Estimate expected accuracy range
   */
  estimateAccuracyRange(
    datasetSize: number,
    numClasses: number,
    splitRatio: number
  ): {
    expected: number;
    min: number;
    max: number;
    confidence: number;
  } {
    const baseAccuracy = this.estimateBaseAccuracy(datasetSize, numClasses);
    const variance = this.estimateVariance(datasetSize);

    // Adjust for split ratio
    const splitAdjustment = (splitRatio - 0.8) * 0.05;
    const expected = Math.min(0.95, baseAccuracy + splitAdjustment);

    const min = Math.max(0.5, expected - variance * 2);
    const max = Math.min(0.98, expected + variance);

    // Confidence based on dataset size
    let confidence = 0.7;
    if (datasetSize > 1000) {
      confidence = 0.95;
    } else if (datasetSize > 500) {
      confidence = 0.85;
    } else if (datasetSize > 200) {
      confidence = 0.75;
    }

    return {
      expected,
      min,
      max,
      confidence,
    };
  },
};
