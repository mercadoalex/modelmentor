export interface ROCPoint {
  threshold: number;
  fpr: number; // False Positive Rate
  tpr: number; // True Positive Rate
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}

export interface ROCCurve {
  points: ROCPoint[];
  auc: number; // Area Under Curve
  optimalThreshold: number;
  optimalPoint: ROCPoint;
}

export interface PrecisionRecallCurve {
  points: Array<{ precision: number; recall: number; threshold: number }>;
  averagePrecision: number;
}

export interface ModelROC {
  modelName: string;
  curve: ROCCurve;
  color: string;
}

export const rocCurveService = {
  /**
   * Generate sample predictions for demonstration
   */
  generateSamplePredictions(
    numSamples: number = 200,
    modelQuality: 'poor' | 'fair' | 'good' | 'excellent' = 'good'
  ): { predictions: number[]; labels: number[] } {
    const predictions: number[] = [];
    const labels: number[] = [];
    
    // Quality affects separation between classes
    const qualityMap = {
      poor: 0.3,
      fair: 0.5,
      good: 0.7,
      excellent: 0.9,
    };
    const separation = qualityMap[modelQuality];
    
    for (let i = 0; i < numSamples; i++) {
      const label = Math.random() > 0.5 ? 1 : 0;
      
      // Generate prediction based on label and quality
      let prediction: number;
      if (label === 1) {
        // Positive class: higher predictions
        prediction = Math.random() * (1 - separation) + separation;
      } else {
        // Negative class: lower predictions
        prediction = Math.random() * (1 - separation);
      }
      
      // Add some noise
      prediction = Math.max(0, Math.min(1, prediction + (Math.random() - 0.5) * 0.1));
      
      predictions.push(prediction);
      labels.push(label);
    }
    
    return { predictions, labels };
  },

  /**
   * Calculate confusion matrix for a given threshold
   */
  calculateConfusionMatrix(
    predictions: number[],
    labels: number[],
    threshold: number
  ): {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  } {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      const predicted = predictions[i] >= threshold ? 1 : 0;
      const actual = labels[i];
      
      if (predicted === 1 && actual === 1) truePositives++;
      else if (predicted === 1 && actual === 0) falsePositives++;
      else if (predicted === 0 && actual === 0) trueNegatives++;
      else if (predicted === 0 && actual === 1) falseNegatives++;
    }
    
    return { truePositives, falsePositives, trueNegatives, falseNegatives };
  },

  /**
   * Calculate ROC curve
   */
  calculateROCCurve(
    predictions: number[],
    labels: number[]
  ): ROCCurve {
    // Generate thresholds from 0 to 1
    const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
    const points: ROCPoint[] = [];
    
    for (const threshold of thresholds) {
      const cm = this.calculateConfusionMatrix(predictions, labels, threshold);
      
      const fpr = cm.falsePositives / (cm.falsePositives + cm.trueNegatives) || 0;
      const tpr = cm.truePositives / (cm.truePositives + cm.falseNegatives) || 0;
      const precision = cm.truePositives / (cm.truePositives + cm.falsePositives) || 0;
      const recall = tpr;
      const f1Score = precision + recall > 0 
        ? 2 * (precision * recall) / (precision + recall) 
        : 0;
      
      points.push({
        threshold,
        fpr,
        tpr,
        precision,
        recall,
        f1Score,
        ...cm,
      });
    }
    
    // Calculate AUC using trapezoidal rule
    const auc = this.calculateAUC(points);
    
    // Find optimal threshold (maximize F1 score)
    const optimalPoint = points.reduce((best, current) => 
      current.f1Score > best.f1Score ? current : best
    );
    
    return {
      points,
      auc,
      optimalThreshold: optimalPoint.threshold,
      optimalPoint,
    };
  },

  /**
   * Calculate Area Under Curve using trapezoidal rule
   */
  calculateAUC(points: ROCPoint[]): number {
    let auc = 0;
    
    for (let i = 1; i < points.length; i++) {
      const width = points[i].fpr - points[i - 1].fpr;
      const height = (points[i].tpr + points[i - 1].tpr) / 2;
      auc += width * height;
    }
    
    return Math.abs(auc);
  },

  /**
   * Calculate Precision-Recall curve
   */
  calculatePrecisionRecallCurve(
    predictions: number[],
    labels: number[]
  ): PrecisionRecallCurve {
    const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
    const points: Array<{ precision: number; recall: number; threshold: number }> = [];
    
    for (const threshold of thresholds) {
      const cm = this.calculateConfusionMatrix(predictions, labels, threshold);
      
      const precision = cm.truePositives / (cm.truePositives + cm.falsePositives) || 0;
      const recall = cm.truePositives / (cm.truePositives + cm.falseNegatives) || 0;
      
      points.push({ precision, recall, threshold });
    }
    
    // Calculate average precision
    let averagePrecision = 0;
    for (let i = 1; i < points.length; i++) {
      const recallDiff = Math.abs(points[i].recall - points[i - 1].recall);
      averagePrecision += points[i].precision * recallDiff;
    }
    
    return { points, averagePrecision };
  },

  /**
   * Find optimal threshold based on criterion
   */
  findOptimalThreshold(
    rocCurve: ROCCurve,
    criterion: 'f1' | 'youden' | 'cost'
  ): {
    threshold: number;
    point: ROCPoint;
    reasoning: string;
  } {
    let optimalPoint: ROCPoint;
    let reasoning: string;
    
    switch (criterion) {
      case 'f1':
        // Maximize F1 score
        optimalPoint = rocCurve.points.reduce((best, current) => 
          current.f1Score > best.f1Score ? current : best
        );
        reasoning = 'Maximizes F1 score, balancing precision and recall equally.';
        break;
      
      case 'youden':
        // Maximize Youden's J statistic (TPR - FPR)
        optimalPoint = rocCurve.points.reduce((best, current) => {
          const currentJ = current.tpr - current.fpr;
          const bestJ = best.tpr - best.fpr;
          return currentJ > bestJ ? current : best;
        });
        reasoning = "Maximizes Youden's J statistic (TPR - FPR), finding the point farthest from the diagonal.";
        break;
      
      case 'cost':
        // Minimize cost (assuming equal costs for FP and FN)
        optimalPoint = rocCurve.points.reduce((best, current) => {
          const currentCost = current.falsePositives + current.falseNegatives;
          const bestCost = best.falsePositives + best.falseNegatives;
          return currentCost < bestCost ? current : best;
        });
        reasoning = 'Minimizes total misclassification cost (FP + FN).';
        break;
      
      default:
        optimalPoint = rocCurve.optimalPoint;
        reasoning = 'Default optimal point.';
    }
    
    return {
      threshold: optimalPoint.threshold,
      point: optimalPoint,
      reasoning,
    };
  },

  /**
   * Compare multiple models
   */
  compareModels(models: ModelROC[]): {
    bestModel: string;
    ranking: Array<{ modelName: string; auc: number; rank: number }>;
    recommendation: string;
  } {
    const ranking = models
      .map(m => ({ modelName: m.modelName, auc: m.curve.auc }))
      .sort((a, b) => b.auc - a.auc)
      .map((m, index) => ({ ...m, rank: index + 1 }));
    
    const bestModel = ranking[0].modelName;
    const bestAUC = ranking[0].auc;
    
    let recommendation: string;
    if (bestAUC > 0.9) {
      recommendation = `${bestModel} shows excellent performance (AUC > 0.9). This model is production-ready.`;
    } else if (bestAUC > 0.8) {
      recommendation = `${bestModel} shows good performance (AUC > 0.8). Consider further tuning for improvement.`;
    } else if (bestAUC > 0.7) {
      recommendation = `${bestModel} shows fair performance (AUC > 0.7). Significant improvement needed before deployment.`;
    } else {
      recommendation = `${bestModel} shows poor performance (AUC < 0.7). Consider different features or algorithms.`;
    }
    
    return { bestModel, ranking, recommendation };
  },

  /**
   * Get performance interpretation
   */
  interpretAUC(auc: number): {
    rating: 'excellent' | 'good' | 'fair' | 'poor' | 'random';
    description: string;
    color: string;
  } {
    if (auc >= 0.9) {
      return {
        rating: 'excellent',
        description: 'Outstanding discrimination. Model distinguishes classes very well.',
        color: 'text-green-600',
      };
    } else if (auc >= 0.8) {
      return {
        rating: 'good',
        description: 'Good discrimination. Model performs well in most cases.',
        color: 'text-green-600',
      };
    } else if (auc >= 0.7) {
      return {
        rating: 'fair',
        description: 'Fair discrimination. Model has some predictive value.',
        color: 'text-yellow-600',
      };
    } else if (auc >= 0.6) {
      return {
        rating: 'poor',
        description: 'Poor discrimination. Model barely better than random.',
        color: 'text-red-600',
      };
    } else {
      return {
        rating: 'random',
        description: 'No discrimination. Model is no better than random guessing.',
        color: 'text-red-600',
      };
    }
  },

  /**
   * Get educational explanations
   */
  getExplanations(): {
    roc: string;
    auc: string;
    tpr: string;
    fpr: string;
    precision: string;
    recall: string;
    f1Score: string;
    threshold: string;
  } {
    return {
      roc: 'ROC (Receiver Operating Characteristic) curve plots True Positive Rate vs False Positive Rate at different classification thresholds. It shows the tradeoff between sensitivity and specificity.',
      auc: 'AUC (Area Under Curve) measures the entire two-dimensional area underneath the ROC curve. AUC ranges from 0 to 1, where 0.5 is random and 1.0 is perfect classification.',
      tpr: 'TPR (True Positive Rate) or Sensitivity or Recall is the proportion of actual positives correctly identified. TPR = TP / (TP + FN)',
      fpr: 'FPR (False Positive Rate) is the proportion of actual negatives incorrectly identified as positive. FPR = FP / (FP + TN)',
      precision: 'Precision is the proportion of positive predictions that are actually correct. Precision = TP / (TP + FP)',
      recall: 'Recall (same as TPR) is the proportion of actual positives that are correctly identified. Recall = TP / (TP + FN)',
      f1Score: 'F1 Score is the harmonic mean of precision and recall, providing a single metric that balances both. F1 = 2 × (Precision × Recall) / (Precision + Recall)',
      threshold: 'Threshold is the cutoff value for converting predicted probabilities to class labels. Predictions ≥ threshold are classified as positive, others as negative.',
    };
  },

  /**
   * Get best practices
   */
  getBestPractices(): string[] {
    return [
      'Use ROC curves for balanced datasets where both classes are equally important',
      'Use Precision-Recall curves for imbalanced datasets where positive class is rare',
      'AUC of 0.5 means the model is no better than random guessing',
      'Choose threshold based on your specific use case and cost of errors',
      'High threshold increases precision but decreases recall',
      'Low threshold increases recall but decreases precision',
      'Compare multiple models by plotting their ROC curves on the same graph',
      'Consider the cost of false positives vs false negatives when selecting threshold',
    ];
  },

  /**
   * Get threshold recommendations
   */
  getThresholdRecommendations(
    useCase: 'medical' | 'fraud' | 'spam' | 'general'
  ): {
    recommendedThreshold: number;
    reasoning: string;
    priority: 'precision' | 'recall' | 'balanced';
  } {
    const recommendations = {
      medical: {
        recommendedThreshold: 0.3,
        reasoning: 'Medical diagnosis prioritizes recall (catching all potential cases) over precision. Better to have false positives than miss actual cases.',
        priority: 'recall' as const,
      },
      fraud: {
        recommendedThreshold: 0.7,
        reasoning: 'Fraud detection prioritizes precision to avoid false accusations. High threshold reduces false positives.',
        priority: 'precision' as const,
      },
      spam: {
        recommendedThreshold: 0.6,
        reasoning: 'Spam filtering balances precision and recall. Some spam getting through is acceptable, but blocking legitimate emails is worse.',
        priority: 'balanced' as const,
      },
      general: {
        recommendedThreshold: 0.5,
        reasoning: 'Default threshold of 0.5 treats both classes equally. Adjust based on your specific requirements.',
        priority: 'balanced' as const,
      },
    };
    
    return recommendations[useCase];
  },
};
