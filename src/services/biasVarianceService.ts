export interface BiasVariancePoint {
  complexity: number;
  bias: number;
  variance: number;
  totalError: number;
  label: string;
}

export interface BiasVarianceAnalysis {
  points: BiasVariancePoint[];
  optimalComplexity: number;
  optimalError: number;
  currentComplexity: number;
  currentBias: number;
  currentVariance: number;
  currentError: number;
  recommendation: string;
  insights: string[];
}

export const biasVarianceService = {
  /**
   * Generate bias-variance tradeoff curve
   */
  generateBiasVarianceCurve(
    currentLayers: number = 2,
    currentNeurons: number = 64
  ): BiasVarianceAnalysis {
    const points: BiasVariancePoint[] = [];
    
    // Generate points for different complexity levels (1-10)
    for (let complexity = 1; complexity <= 10; complexity++) {
      const point = this.calculateBiasVariance(complexity);
      points.push(point);
    }

    // Find optimal complexity (minimum total error)
    const optimalPoint = points.reduce((best, current) =>
      current.totalError < best.totalError ? current : best
    );

    // Estimate current complexity based on architecture
    const currentComplexity = this.estimateComplexity(currentLayers, currentNeurons);
    const currentPoint = this.calculateBiasVariance(currentComplexity);

    const recommendation = this.generateRecommendation(
      currentComplexity,
      optimalPoint.complexity,
      currentPoint
    );

    const insights = this.generateInsights(
      currentComplexity,
      optimalPoint.complexity,
      currentPoint,
      optimalPoint
    );

    return {
      points,
      optimalComplexity: optimalPoint.complexity,
      optimalError: optimalPoint.totalError,
      currentComplexity,
      currentBias: currentPoint.bias,
      currentVariance: currentPoint.variance,
      currentError: currentPoint.totalError,
      recommendation,
      insights,
    };
  },

  /**
   * Calculate bias and variance for a given complexity level
   */
  calculateBiasVariance(complexity: number): BiasVariancePoint {
    // Irreducible error (noise in data)
    const irreducibleError = 0.05;

    // Bias decreases with complexity (exponential decay)
    // High bias at low complexity (underfitting)
    const bias = 0.4 * Math.exp(-0.5 * complexity) + 0.02;

    // Variance increases with complexity (exponential growth)
    // High variance at high complexity (overfitting)
    const variance = 0.02 * Math.exp(0.3 * complexity) - 0.02;

    // Total error = bias^2 + variance + irreducible error
    const totalError = Math.pow(bias, 2) + variance + irreducibleError;

    const label = this.getComplexityLabel(complexity);

    return {
      complexity,
      bias,
      variance,
      totalError,
      label,
    };
  },

  /**
   * Estimate complexity from model architecture
   */
  estimateComplexity(layers: number, neurons: number): number {
    // Simple heuristic: more layers and neurons = higher complexity
    const layerFactor = layers / 3; // Normalize to ~1-3
    const neuronFactor = neurons / 64; // Normalize to ~0.5-2
    
    const complexity = (layerFactor + neuronFactor) * 2.5;
    
    // Clamp to 1-10 range
    return Math.max(1, Math.min(10, complexity));
  },

  /**
   * Get label for complexity level
   */
  getComplexityLabel(complexity: number): string {
    if (complexity <= 2) return 'Very Simple';
    if (complexity <= 4) return 'Simple';
    if (complexity <= 6) return 'Moderate';
    if (complexity <= 8) return 'Complex';
    return 'Very Complex';
  },

  /**
   * Generate recommendation based on current vs optimal complexity
   */
  generateRecommendation(
    currentComplexity: number,
    optimalComplexity: number,
    currentPoint: BiasVariancePoint
  ): string {
    const diff = currentComplexity - optimalComplexity;

    if (Math.abs(diff) < 1) {
      return 'Your model complexity is near optimal! The bias-variance tradeoff is well balanced.';
    }

    if (diff < -2) {
      return `Your model is too simple (complexity ${currentComplexity.toFixed(1)} vs optimal ${optimalComplexity.toFixed(1)}). Increase complexity by adding more layers or neurons to reduce bias and improve performance.`;
    }

    if (diff < 0) {
      return `Your model is slightly underfitting (complexity ${currentComplexity.toFixed(1)} vs optimal ${optimalComplexity.toFixed(1)}). Consider adding a bit more complexity to reduce bias.`;
    }

    if (diff > 2) {
      return `Your model is too complex (complexity ${currentComplexity.toFixed(1)} vs optimal ${optimalComplexity.toFixed(1)}). Reduce complexity by removing layers or neurons to reduce variance and prevent overfitting.`;
    }

    return `Your model is slightly overfitting (complexity ${currentComplexity.toFixed(1)} vs optimal ${optimalComplexity.toFixed(1)}). Consider reducing complexity slightly to reduce variance.`;
  },

  /**
   * Generate insights about bias-variance tradeoff
   */
  generateInsights(
    currentComplexity: number,
    optimalComplexity: number,
    currentPoint: BiasVariancePoint,
    optimalPoint: BiasVariancePoint
  ): string[] {
    const insights: string[] = [];

    // Current state insight
    if (currentComplexity < optimalComplexity - 1) {
      insights.push(
        `Your model has high bias (${(currentPoint.bias * 100).toFixed(1)}%) and low variance (${(currentPoint.variance * 100).toFixed(1)}%). This indicates underfitting - the model is too simple to capture patterns.`
      );
    } else if (currentComplexity > optimalComplexity + 1) {
      insights.push(
        `Your model has low bias (${(currentPoint.bias * 100).toFixed(1)}%) but high variance (${(currentPoint.variance * 100).toFixed(1)}%). This indicates overfitting - the model is too sensitive to training data.`
      );
    } else {
      insights.push(
        `Your model has balanced bias (${(currentPoint.bias * 100).toFixed(1)}%) and variance (${(currentPoint.variance * 100).toFixed(1)}%), indicating a good tradeoff.`
      );
    }

    // Error comparison
    const errorDiff = currentPoint.totalError - optimalPoint.totalError;
    if (errorDiff > 0.05) {
      insights.push(
        `Your current total error (${(currentPoint.totalError * 100).toFixed(1)}%) is ${(errorDiff * 100).toFixed(1)}% higher than optimal (${(optimalPoint.totalError * 100).toFixed(1)}%). Adjusting complexity could significantly improve performance.`
      );
    } else {
      insights.push(
        `Your current total error (${(currentPoint.totalError * 100).toFixed(1)}%) is close to optimal (${(optimalPoint.totalError * 100).toFixed(1)}%). Your model is well-tuned.`
      );
    }

    // Optimal point insight
    insights.push(
      `The optimal complexity level is ${optimalComplexity.toFixed(1)} (${this.getComplexityLabel(optimalComplexity)}), which minimizes total error by balancing bias and variance.`
    );

    return insights;
  },

  /**
   * Get explanation of bias-variance tradeoff
   */
  getExplanation(): string[] {
    return [
      'Bias is the error from oversimplified models that miss relevant patterns (underfitting)',
      'Variance is the error from models too sensitive to training data noise (overfitting)',
      'Total Error = Bias² + Variance + Irreducible Error',
      'Simple models have high bias but low variance',
      'Complex models have low bias but high variance',
      'The optimal model minimizes total error by balancing bias and variance',
      'This is called the bias-variance tradeoff',
    ];
  },

  /**
   * Get specific explanations for each component
   */
  getBiasExplanation(): string {
    return 'Bias represents systematic errors from model assumptions. High bias means the model is too simple and misses important patterns in the data (underfitting). As model complexity increases, bias decreases.';
  },

  getVarianceExplanation(): string {
    return 'Variance represents sensitivity to training data fluctuations. High variance means the model fits training data too closely, including noise (overfitting). As model complexity increases, variance increases.';
  },

  getTotalErrorExplanation(): string {
    return 'Total error combines bias and variance. The optimal model complexity minimizes this total error, achieving the best balance between underfitting and overfitting.';
  },

  /**
   * Get recommendations for adjusting complexity
   */
  getComplexityAdjustmentTips(): {
    increase: string[];
    decrease: string[];
  } {
    return {
      increase: [
        'Add more hidden layers to the neural network',
        'Increase the number of neurons per layer',
        'Use more complex activation functions',
        'Add more features or feature interactions',
        'Train for more epochs to allow model to learn',
      ],
      decrease: [
        'Remove hidden layers from the network',
        'Reduce the number of neurons per layer',
        'Use simpler activation functions',
        'Apply regularization (L1/L2) to constrain weights',
        'Use dropout to prevent co-adaptation',
        'Reduce the number of features (feature selection)',
      ],
    };
  },
};
