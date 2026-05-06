export interface LearningCurvePoint {
  dataSize: number;
  trainScore: number;
  valScore: number;
  trainTime: number;
}

export interface LearningCurveAnalysis {
  points: LearningCurvePoint[];
  pattern: 'overfitting' | 'underfitting' | 'good_fit' | 'high_variance';
  gap: number;
  convergence: number;
  recommendation: string;
  insights: string[];
  needMoreData: boolean;
}

export const learningCurveService = {
  /**
   * Generate learning curve by training with different data sizes
   */
  generateLearningCurve(
    totalSamples: number,
    features: number
  ): LearningCurveAnalysis {
    const points: LearningCurvePoint[] = [];
    
    // Test with different percentages of data
    const dataSizes = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    
    dataSizes.forEach(fraction => {
      const dataSize = Math.floor(totalSamples * fraction);
      const point = this.trainWithDataSize(dataSize, totalSamples, features);
      points.push(point);
    });

    // Analyze the curve
    const pattern = this.detectPattern(points);
    const gap = this.calculateGap(points);
    const convergence = this.calculateConvergence(points);
    const needMoreData = this.shouldCollectMoreData(points, pattern);
    const recommendation = this.generateRecommendation(pattern, gap, convergence, needMoreData);
    const insights = this.generateInsights(points, pattern, gap, convergence);

    return {
      points,
      pattern,
      gap,
      convergence,
      recommendation,
      insights,
      needMoreData,
    };
  },

  /**
   * Simulate training with a specific data size
   */
  trainWithDataSize(
    dataSize: number,
    totalSamples: number,
    features: number
  ): LearningCurvePoint {
    // Base performance depends on data size
    const dataSizeFactor = Math.log(dataSize + 1) / Math.log(totalSamples + 1);
    
    // Training score (usually higher, can overfit with small data)
    let trainScore = 0.6 + dataSizeFactor * 0.3;
    
    // Add overfitting effect for small datasets
    if (dataSize < totalSamples * 0.3) {
      trainScore += 0.15 * (1 - dataSizeFactor);
    }
    
    // Validation score (more realistic, improves with more data)
    let valScore = 0.5 + dataSizeFactor * 0.35;
    
    // Add noise
    trainScore += (Math.random() - 0.5) * 0.03;
    valScore += (Math.random() - 0.5) * 0.03;
    
    // Ensure train >= val (usually)
    if (valScore > trainScore) {
      valScore = trainScore - 0.02;
    }
    
    // Training time increases with data size
    const trainTime = dataSize * 0.5 + Math.random() * 50;

    return {
      dataSize,
      trainScore: Math.min(0.98, Math.max(0.5, trainScore)),
      valScore: Math.min(0.95, Math.max(0.45, valScore)),
      trainTime,
    };
  },

  /**
   * Detect the pattern in the learning curve
   */
  detectPattern(points: LearningCurvePoint[]): 'overfitting' | 'underfitting' | 'good_fit' | 'high_variance' {
    if (points.length < 3) return 'underfitting';

    const lastPoint = points[points.length - 1];
    const gap = lastPoint.trainScore - lastPoint.valScore;
    const avgValScore = points.reduce((sum, p) => sum + p.valScore, 0) / points.length;

    // High gap between train and val = overfitting
    if (gap > 0.15) {
      return 'overfitting';
    }

    // Both scores low = underfitting
    if (lastPoint.trainScore < 0.75 && lastPoint.valScore < 0.7) {
      return 'underfitting';
    }

    // High variance in validation scores
    const valVariance = this.calculateVariance(points.map(p => p.valScore));
    if (valVariance > 0.01) {
      return 'high_variance';
    }

    // Otherwise good fit
    return 'good_fit';
  },

  /**
   * Calculate the gap between training and validation scores
   */
  calculateGap(points: LearningCurvePoint[]): number {
    if (points.length === 0) return 0;
    
    const lastPoint = points[points.length - 1];
    return lastPoint.trainScore - lastPoint.valScore;
  },

  /**
   * Calculate convergence (how much val score improves with more data)
   */
  calculateConvergence(points: LearningCurvePoint[]): number {
    if (points.length < 2) return 0;

    // Compare last 3 points to first 3 points
    const firstThird = points.slice(0, Math.ceil(points.length / 3));
    const lastThird = points.slice(-Math.ceil(points.length / 3));

    const avgFirst = firstThird.reduce((sum, p) => sum + p.valScore, 0) / firstThird.length;
    const avgLast = lastThird.reduce((sum, p) => sum + p.valScore, 0) / lastThird.length;

    return avgLast - avgFirst;
  },

  /**
   * Determine if more data would help
   */
  shouldCollectMoreData(
    points: LearningCurvePoint[],
    pattern: string
  ): boolean {
    if (points.length < 2) return true;

    // Check if validation score is still improving
    const lastThree = points.slice(-3);
    const improvements = [];
    
    for (let i = 1; i < lastThree.length; i++) {
      improvements.push(lastThree[i].valScore - lastThree[i - 1].valScore);
    }

    const avgImprovement = improvements.reduce((sum, val) => sum + val, 0) / improvements.length;

    // If still improving significantly, more data would help
    if (avgImprovement > 0.01) {
      return true;
    }

    // If overfitting, more data would help
    if (pattern === 'overfitting') {
      return true;
    }

    return false;
  },

  /**
   * Generate recommendation based on analysis
   */
  generateRecommendation(
    pattern: string,
    gap: number,
    convergence: number,
    needMoreData: boolean
  ): string {
    switch (pattern) {
      case 'overfitting':
        return needMoreData
          ? 'Your model is overfitting. Collect more training data to improve generalization.'
          : 'Your model is overfitting. Try regularization techniques, reduce model complexity, or use data augmentation.';
      
      case 'underfitting':
        return 'Your model is underfitting. Try increasing model complexity, training for more epochs, or engineering better features.';
      
      case 'high_variance':
        return 'Your model shows high variance. Use cross-validation, collect more data, or try ensemble methods to stabilize performance.';
      
      case 'good_fit':
        return needMoreData
          ? 'Your model is performing well, but validation scores are still improving. Collecting more data could further improve performance.'
          : 'Your model has achieved a good fit! Performance has plateaued, so collecting more data is unlikely to help significantly.';
      
      default:
        return 'Continue monitoring your model\'s performance as you collect more data.';
    }
  },

  /**
   * Generate insights from the learning curve
   */
  generateInsights(
    points: LearningCurvePoint[],
    pattern: string,
    gap: number,
    convergence: number
  ): string[] {
    const insights: string[] = [];

    // Gap insight
    if (gap > 0.15) {
      insights.push(
        `Large gap (${(gap * 100).toFixed(1)}%) between training and validation scores indicates overfitting. The model memorizes training data but doesn't generalize well.`
      );
    } else if (gap < 0.05) {
      insights.push(
        `Small gap (${(gap * 100).toFixed(1)}%) between training and validation scores indicates good generalization.`
      );
    }

    // Convergence insight
    if (convergence > 0.1) {
      insights.push(
        `Validation score improved by ${(convergence * 100).toFixed(1)}% as data size increased. More data is likely to help.`
      );
    } else if (convergence < 0.03) {
      insights.push(
        `Validation score improved by only ${(convergence * 100).toFixed(1)}% with more data. Performance has plateaued.`
      );
    }

    // Pattern-specific insights
    switch (pattern) {
      case 'overfitting':
        insights.push(
          'Training accuracy is much higher than validation accuracy. The model is too complex for the available data.'
        );
        break;
      
      case 'underfitting':
        insights.push(
          'Both training and validation scores are low. The model is too simple to capture the patterns in your data.'
        );
        break;
      
      case 'high_variance':
        insights.push(
          'Validation scores fluctuate significantly. This suggests the model is sensitive to the specific data split.'
        );
        break;
      
      case 'good_fit':
        insights.push(
          'Training and validation scores are close and both are high. Your model has learned the patterns well without overfitting.'
        );
        break;
    }

    // Data size insight
    const lastPoint = points[points.length - 1];
    insights.push(
      `With ${lastPoint.dataSize} samples, your model achieves ${(lastPoint.valScore * 100).toFixed(1)}% validation accuracy.`
    );

    return insights;
  },

  /**
   * Calculate variance
   */
  calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  },

  /**
   * Get explanation of learning curves
   */
  getExplanation(): string[] {
    return [
      'Learning curves show how model performance changes with different amounts of training data',
      'The training curve shows performance on data the model has seen',
      'The validation curve shows performance on unseen data (the true test)',
      'A large gap between curves indicates overfitting (memorization)',
      'Both curves being low indicates underfitting (model too simple)',
      'If validation improves with more data, collecting more samples will help',
      'If validation plateaus, more data won\'t improve performance significantly',
    ];
  },

  /**
   * Get pattern explanation
   */
  getPatternExplanation(pattern: string): string {
    switch (pattern) {
      case 'overfitting':
        return 'Overfitting occurs when the model performs well on training data but poorly on validation data. It has memorized the training examples instead of learning general patterns.';
      
      case 'underfitting':
        return 'Underfitting occurs when the model performs poorly on both training and validation data. The model is too simple to capture the underlying patterns.';
      
      case 'high_variance':
        return 'High variance means the model\'s performance varies significantly with different data samples. This indicates instability and sensitivity to the training data.';
      
      case 'good_fit':
        return 'A good fit means the model performs well on both training and validation data with a small gap between them. The model has learned the patterns without overfitting.';
      
      default:
        return 'The learning curve shows how your model\'s performance changes with different amounts of training data.';
    }
  },
};
