export interface PerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface SimulationParameters {
  dataSize: number;
  classImbalance: number; // 0.5 = balanced, 0.9 = 90% class 0
  noiseLevel: number; // 0 to 1
}

export interface LearningCurvePoint {
  dataSize: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export const performanceSimulatorService = {
  /**
   * Simulate model performance based on parameters
   */
  simulatePerformance(params: SimulationParameters): PerformanceMetrics {
    const { dataSize, classImbalance, noiseLevel } = params;
    
    // Base performance increases with data size (logarithmic growth)
    const dataSizeFactor = Math.min(1, Math.log10(dataSize) / Math.log10(10000));
    
    // Class imbalance penalty (worse when imbalanced)
    const imbalancePenalty = Math.abs(classImbalance - 0.5) * 0.4;
    
    // Noise penalty (linear degradation)
    const noisePenalty = noiseLevel * 0.5;
    
    // Calculate base accuracy
    let baseAccuracy = 0.6 + (dataSizeFactor * 0.35) - imbalancePenalty - noisePenalty;
    baseAccuracy = Math.max(0.5, Math.min(0.98, baseAccuracy));
    
    // Calculate confusion matrix values
    const totalSamples = 1000; // Normalized to 1000 for calculation
    const positiveClass = Math.round(totalSamples * (1 - classImbalance));
    const negativeClass = totalSamples - positiveClass;
    
    // True positives (affected by recall)
    let recallRate = baseAccuracy - (imbalancePenalty * 0.5);
    recallRate = Math.max(0.4, Math.min(0.95, recallRate));
    const truePositives = Math.round(positiveClass * recallRate);
    const falseNegatives = positiveClass - truePositives;
    
    // True negatives (affected by specificity)
    let specificityRate = baseAccuracy + (imbalancePenalty * 0.3);
    specificityRate = Math.max(0.5, Math.min(0.98, specificityRate));
    const trueNegatives = Math.round(negativeClass * specificityRate);
    const falsePositives = negativeClass - trueNegatives;
    
    // Calculate metrics
    const accuracy = (truePositives + trueNegatives) / totalSamples;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = (2 * precision * recall) / (precision + recall) || 0;
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives,
    };
  },

  /**
   * Generate learning curve data
   */
  generateLearningCurve(
    classImbalance: number,
    noiseLevel: number
  ): LearningCurvePoint[] {
    const dataSizes = [100, 200, 500, 1000, 2000, 3000, 5000, 7000, 10000];
    
    return dataSizes.map(dataSize => {
      const metrics = this.simulatePerformance({
        dataSize,
        classImbalance,
        noiseLevel,
      });
      
      return {
        dataSize,
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
      };
    });
  },

  /**
   * Analyze the impact of data size
   */
  analyzeDataSizeImpact(
    currentSize: number,
    classImbalance: number,
    noiseLevel: number
  ): {
    currentPerformance: number;
    doubleDataImprovement: number;
    tenXDataImprovement: number;
    recommendation: string;
  } {
    const current = this.simulatePerformance({
      dataSize: currentSize,
      classImbalance,
      noiseLevel,
    });
    
    const doubled = this.simulatePerformance({
      dataSize: currentSize * 2,
      classImbalance,
      noiseLevel,
    });
    
    const tenX = this.simulatePerformance({
      dataSize: Math.min(currentSize * 10, 10000),
      classImbalance,
      noiseLevel,
    });
    
    const doubleImprovement = (doubled.accuracy - current.accuracy) * 100;
    const tenXImprovement = (tenX.accuracy - current.accuracy) * 100;
    
    let recommendation = '';
    if (currentSize < 500) {
      recommendation = 'Collect more data! Your dataset is small and will benefit significantly from additional samples.';
    } else if (currentSize < 2000) {
      recommendation = 'Moderate dataset size. More data will still improve performance, but with diminishing returns.';
    } else if (currentSize < 5000) {
      recommendation = 'Good dataset size. Additional data will provide smaller improvements. Consider other optimizations.';
    } else {
      recommendation = 'Large dataset. You\'re experiencing diminishing returns. Focus on data quality and model architecture.';
    }
    
    return {
      currentPerformance: current.accuracy,
      doubleDataImprovement: doubleImprovement,
      tenXDataImprovement: tenXImprovement,
      recommendation,
    };
  },

  /**
   * Analyze the impact of class imbalance
   */
  analyzeClassImbalanceImpact(
    dataSize: number,
    currentImbalance: number,
    noiseLevel: number
  ): {
    currentMetrics: PerformanceMetrics;
    balancedMetrics: PerformanceMetrics;
    improvement: number;
    recommendation: string;
  } {
    const current = this.simulatePerformance({
      dataSize,
      classImbalance: currentImbalance,
      noiseLevel,
    });
    
    const balanced = this.simulatePerformance({
      dataSize,
      classImbalance: 0.5,
      noiseLevel,
    });
    
    const improvement = (balanced.f1Score - current.f1Score) * 100;
    
    let recommendation = '';
    const imbalanceRatio = Math.max(currentImbalance, 1 - currentImbalance);
    
    if (imbalanceRatio > 0.8) {
      recommendation = 'Severe class imbalance detected! Consider oversampling minority class, undersampling majority class, or using class weights.';
    } else if (imbalanceRatio > 0.7) {
      recommendation = 'Moderate class imbalance. Your model may be biased toward the majority class. Consider balancing techniques.';
    } else if (imbalanceRatio > 0.6) {
      recommendation = 'Slight class imbalance. Monitor precision and recall to ensure both classes are learned well.';
    } else {
      recommendation = 'Well-balanced classes. Your model should learn both classes equally well.';
    }
    
    return {
      currentMetrics: current,
      balancedMetrics: balanced,
      improvement,
      recommendation,
    };
  },

  /**
   * Analyze the impact of noise
   */
  analyzeNoiseImpact(
    dataSize: number,
    classImbalance: number,
    currentNoise: number
  ): {
    currentPerformance: number;
    cleanDataPerformance: number;
    degradation: number;
    recommendation: string;
  } {
    const current = this.simulatePerformance({
      dataSize,
      classImbalance,
      noiseLevel: currentNoise,
    });
    
    const clean = this.simulatePerformance({
      dataSize,
      classImbalance,
      noiseLevel: 0,
    });
    
    const degradation = (clean.accuracy - current.accuracy) * 100;
    
    let recommendation = '';
    if (currentNoise > 0.3) {
      recommendation = 'High noise level! Clean your data by removing outliers, fixing errors, and validating labels.';
    } else if (currentNoise > 0.15) {
      recommendation = 'Moderate noise detected. Consider data cleaning and validation to improve model performance.';
    } else if (currentNoise > 0.05) {
      recommendation = 'Low noise level. Some noise is normal, but continue monitoring data quality.';
    } else {
      recommendation = 'Very clean data! Your data quality is excellent.';
    }
    
    return {
      currentPerformance: current.accuracy,
      cleanDataPerformance: clean.accuracy,
      degradation,
      recommendation,
    };
  },

  /**
   * Get comprehensive insights
   */
  getInsights(params: SimulationParameters): string[] {
    const insights: string[] = [];
    const metrics = this.simulatePerformance(params);
    
    // Accuracy insight
    if (metrics.accuracy > 0.9) {
      insights.push('Excellent accuracy! Your model is performing very well.');
    } else if (metrics.accuracy > 0.8) {
      insights.push('Good accuracy. There\'s room for improvement with more data or better quality.');
    } else if (metrics.accuracy > 0.7) {
      insights.push('Moderate accuracy. Consider collecting more data or reducing noise.');
    } else {
      insights.push('Low accuracy. Your model needs more data, better balance, or cleaner data.');
    }
    
    // Precision vs Recall
    const precisionRecallDiff = Math.abs(metrics.precision - metrics.recall);
    if (precisionRecallDiff > 0.2) {
      if (metrics.precision > metrics.recall) {
        insights.push('High precision but low recall. Your model is conservative and misses positive cases.');
      } else {
        insights.push('High recall but low precision. Your model is aggressive and produces false positives.');
      }
    } else {
      insights.push('Balanced precision and recall. Your model handles both classes well.');
    }
    
    // F1 Score
    if (metrics.f1Score > 0.85) {
      insights.push('Excellent F1-score! Your model balances precision and recall well.');
    } else if (metrics.f1Score < 0.6) {
      insights.push('Low F1-score indicates issues with either precision or recall.');
    }
    
    // Data size insight
    if (params.dataSize < 1000) {
      insights.push('Small dataset. Collecting more data will significantly improve performance.');
    } else if (params.dataSize > 5000) {
      insights.push('Large dataset. You\'re getting diminishing returns from more data.');
    }
    
    // Imbalance insight
    const imbalanceRatio = Math.max(params.classImbalance, 1 - params.classImbalance);
    if (imbalanceRatio > 0.7) {
      insights.push('Class imbalance is affecting your metrics. Consider balancing techniques.');
    }
    
    // Noise insight
    if (params.noiseLevel > 0.2) {
      insights.push('High noise is degrading performance. Focus on data cleaning.');
    }
    
    return insights;
  },

  /**
   * Get recommendations for improvement
   */
  getRecommendations(params: SimulationParameters): Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
  }> {
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      expectedImpact: string;
    }> = [];
    
    // Noise recommendation
    if (params.noiseLevel > 0.2) {
      recommendations.push({
        priority: 'high',
        action: 'Clean your data by removing outliers and fixing label errors',
        expectedImpact: `+${(params.noiseLevel * 50).toFixed(0)}% accuracy improvement`,
      });
    }
    
    // Imbalance recommendation
    const imbalanceRatio = Math.max(params.classImbalance, 1 - params.classImbalance);
    if (imbalanceRatio > 0.7) {
      recommendations.push({
        priority: 'high',
        action: 'Balance your classes using oversampling, undersampling, or class weights',
        expectedImpact: `+${((imbalanceRatio - 0.5) * 40).toFixed(0)}% F1-score improvement`,
      });
    }
    
    // Data size recommendation
    if (params.dataSize < 2000) {
      const improvement = this.analyzeDataSizeImpact(
        params.dataSize,
        params.classImbalance,
        params.noiseLevel
      );
      recommendations.push({
        priority: params.dataSize < 500 ? 'high' : 'medium',
        action: 'Collect more training data',
        expectedImpact: `+${improvement.doubleDataImprovement.toFixed(1)}% with 2x data`,
      });
    }
    
    // General recommendations
    if (params.noiseLevel < 0.1 && imbalanceRatio < 0.6 && params.dataSize > 3000) {
      recommendations.push({
        priority: 'low',
        action: 'Experiment with different model architectures',
        expectedImpact: 'Potential 2-5% improvement',
      });
      
      recommendations.push({
        priority: 'low',
        action: 'Try hyperparameter optimization',
        expectedImpact: 'Potential 3-7% improvement',
      });
    }
    
    return recommendations;
  },

  /**
   * Calculate optimal parameters
   */
  findOptimalParameters(): SimulationParameters {
    return {
      dataSize: 5000,
      classImbalance: 0.5,
      noiseLevel: 0.05,
    };
  },
};
