export type ModelType = 'linear_regression' | 'decision_tree' | 'random_forest' | 'neural_network';
export type ProblemType = 'classification' | 'regression';

export interface ModelMetrics {
  // Common metrics
  trainingTime: number; // in milliseconds
  
  // Classification metrics
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  
  // Regression metrics
  mse?: number;
  rmse?: number;
  mae?: number;
  r2Score?: number;
}

export interface ModelResult {
  modelType: ModelType;
  modelName: string;
  description: string;
  metrics: ModelMetrics;
  pros: string[];
  cons: string[];
  bestFor: string[];
  complexity: 'low' | 'medium' | 'high';
  interpretability: 'high' | 'medium' | 'low';
}

export interface ComparisonResult {
  problemType: ProblemType;
  models: ModelResult[];
  recommendation: {
    bestModel: ModelType;
    reasoning: string[];
  };
  datasetInfo: {
    featureCount: number;
    sampleCount: number;
    targetType: string;
  };
}

export const modelComparisonService = {
  /**
   * Compare multiple models on the dataset
   */
  compareModels(
    featureCount: number,
    sampleCount: number,
    problemType: ProblemType
  ): ComparisonResult {
    const models: ModelResult[] = [
      this.trainLinearRegression(featureCount, sampleCount, problemType),
      this.trainDecisionTree(featureCount, sampleCount, problemType),
      this.trainRandomForest(featureCount, sampleCount, problemType),
      this.trainNeuralNetwork(featureCount, sampleCount, problemType),
    ];

    const recommendation = this.generateRecommendation(models, featureCount, sampleCount, problemType);

    return {
      problemType,
      models,
      recommendation,
      datasetInfo: {
        featureCount,
        sampleCount,
        targetType: problemType,
      },
    };
  },

  /**
   * Simulate Linear Regression training
   */
  trainLinearRegression(
    featureCount: number,
    sampleCount: number,
    problemType: ProblemType
  ): ModelResult {
    const trainingTime = 50 + Math.random() * 100; // Fast training

    const metrics: ModelMetrics = {
      trainingTime,
    };

    if (problemType === 'classification') {
      metrics.accuracy = 0.70 + Math.random() * 0.15;
      metrics.precision = 0.68 + Math.random() * 0.15;
      metrics.recall = 0.65 + Math.random() * 0.15;
      metrics.f1Score = 0.67 + Math.random() * 0.15;
    } else {
      const baseR2 = 0.65 + Math.random() * 0.20;
      metrics.r2Score = baseR2;
      metrics.mse = (1 - baseR2) * 100 + Math.random() * 50;
      metrics.rmse = Math.sqrt(metrics.mse);
      metrics.mae = metrics.rmse * 0.8;
    }

    return {
      modelType: 'linear_regression',
      modelName: 'Linear Regression',
      description: 'Simple linear model that finds the best straight line through the data',
      metrics,
      pros: [
        'Very fast training',
        'Easy to interpret',
        'Works well with linear relationships',
        'Low computational cost',
      ],
      cons: [
        'Cannot capture non-linear patterns',
        'Sensitive to outliers',
        'Assumes linear relationships',
      ],
      bestFor: [
        'Linear relationships',
        'Small datasets',
        'When interpretability is important',
      ],
      complexity: 'low',
      interpretability: 'high',
    };
  },

  /**
   * Simulate Decision Tree training
   */
  trainDecisionTree(
    featureCount: number,
    sampleCount: number,
    problemType: ProblemType
  ): ModelResult {
    const trainingTime = 100 + Math.random() * 200;

    const metrics: ModelMetrics = {
      trainingTime,
    };

    if (problemType === 'classification') {
      metrics.accuracy = 0.75 + Math.random() * 0.15;
      metrics.precision = 0.73 + Math.random() * 0.15;
      metrics.recall = 0.72 + Math.random() * 0.15;
      metrics.f1Score = 0.73 + Math.random() * 0.15;
    } else {
      const baseR2 = 0.70 + Math.random() * 0.18;
      metrics.r2Score = baseR2;
      metrics.mse = (1 - baseR2) * 90 + Math.random() * 40;
      metrics.rmse = Math.sqrt(metrics.mse);
      metrics.mae = metrics.rmse * 0.75;
    }

    return {
      modelType: 'decision_tree',
      modelName: 'Decision Tree',
      description: 'Tree-based model that makes decisions by asking yes/no questions about features',
      metrics,
      pros: [
        'Handles non-linear relationships',
        'Easy to visualize and understand',
        'No need for feature scaling',
        'Handles mixed data types',
      ],
      cons: [
        'Prone to overfitting',
        'Can be unstable',
        'May not generalize well',
      ],
      bestFor: [
        'Non-linear patterns',
        'Mixed feature types',
        'When you need interpretability',
      ],
      complexity: 'medium',
      interpretability: 'high',
    };
  },

  /**
   * Simulate Random Forest training
   */
  trainRandomForest(
    featureCount: number,
    sampleCount: number,
    problemType: ProblemType
  ): ModelResult {
    const trainingTime = 500 + Math.random() * 1000; // Slower training

    const metrics: ModelMetrics = {
      trainingTime,
    };

    if (problemType === 'classification') {
      metrics.accuracy = 0.82 + Math.random() * 0.12;
      metrics.precision = 0.80 + Math.random() * 0.12;
      metrics.recall = 0.79 + Math.random() * 0.12;
      metrics.f1Score = 0.80 + Math.random() * 0.12;
    } else {
      const baseR2 = 0.78 + Math.random() * 0.15;
      metrics.r2Score = baseR2;
      metrics.mse = (1 - baseR2) * 70 + Math.random() * 30;
      metrics.rmse = Math.sqrt(metrics.mse);
      metrics.mae = metrics.rmse * 0.7;
    }

    return {
      modelType: 'random_forest',
      modelName: 'Random Forest',
      description: 'Ensemble of decision trees that vote together for better predictions',
      metrics,
      pros: [
        'High accuracy',
        'Reduces overfitting',
        'Handles complex patterns',
        'Provides feature importance',
      ],
      cons: [
        'Slower training',
        'Less interpretable than single tree',
        'Requires more memory',
      ],
      bestFor: [
        'Complex datasets',
        'When accuracy is priority',
        'Large datasets',
      ],
      complexity: 'high',
      interpretability: 'medium',
    };
  },

  /**
   * Simulate Neural Network training
   */
  trainNeuralNetwork(
    featureCount: number,
    sampleCount: number,
    problemType: ProblemType
  ): ModelResult {
    const trainingTime = 800 + Math.random() * 1500; // Slowest training

    const metrics: ModelMetrics = {
      trainingTime,
    };

    // Neural networks perform better with more data
    const dataBonus = Math.min(sampleCount / 1000, 0.1);

    if (problemType === 'classification') {
      metrics.accuracy = 0.78 + Math.random() * 0.15 + dataBonus;
      metrics.precision = 0.76 + Math.random() * 0.15 + dataBonus;
      metrics.recall = 0.75 + Math.random() * 0.15 + dataBonus;
      metrics.f1Score = 0.76 + Math.random() * 0.15 + dataBonus;
    } else {
      const baseR2 = 0.75 + Math.random() * 0.17 + dataBonus;
      metrics.r2Score = baseR2;
      metrics.mse = (1 - baseR2) * 75 + Math.random() * 35;
      metrics.rmse = Math.sqrt(metrics.mse);
      metrics.mae = metrics.rmse * 0.72;
    }

    return {
      modelType: 'neural_network',
      modelName: 'Neural Network',
      description: 'Deep learning model with multiple layers that can learn complex patterns',
      metrics,
      pros: [
        'Learns complex patterns',
        'Flexible architecture',
        'Can handle large datasets',
        'State-of-the-art performance',
      ],
      cons: [
        'Requires more data',
        'Longest training time',
        'Difficult to interpret',
        'Needs hyperparameter tuning',
      ],
      bestFor: [
        'Large datasets',
        'Complex non-linear patterns',
        'When accuracy is critical',
      ],
      complexity: 'high',
      interpretability: 'low',
    };
  },

  /**
   * Generate recommendation for best model
   */
  generateRecommendation(
    models: ModelResult[],
    featureCount: number,
    sampleCount: number,
    problemType: ProblemType
  ): { bestModel: ModelType; reasoning: string[] } {
    const reasoning: string[] = [];

    // Sort by primary metric
    const sortedModels = [...models].sort((a, b) => {
      const metricA = problemType === 'classification' 
        ? (a.metrics.accuracy || 0)
        : (a.metrics.r2Score || 0);
      const metricB = problemType === 'classification'
        ? (b.metrics.accuracy || 0)
        : (b.metrics.r2Score || 0);
      return metricB - metricA;
    });

    const bestModel = sortedModels[0];
    const primaryMetric = problemType === 'classification' ? 'accuracy' : 'R² score';

    reasoning.push(
      `${bestModel.modelName} achieved the highest ${primaryMetric} (${
        problemType === 'classification'
          ? ((bestModel.metrics.accuracy || 0) * 100).toFixed(1)
          : ((bestModel.metrics.r2Score || 0) * 100).toFixed(1)
      }%)`
    );

    // Consider dataset size
    if (sampleCount < 100) {
      reasoning.push('For small datasets, simpler models like Linear Regression or Decision Tree often work better');
    } else if (sampleCount > 1000) {
      reasoning.push('Your large dataset allows complex models like Random Forest and Neural Networks to shine');
    }

    // Consider feature count
    if (featureCount > 20) {
      reasoning.push('With many features, ensemble methods like Random Forest can handle complexity well');
    }

    // Training time consideration
    const fastestModel = [...models].sort((a, b) => a.metrics.trainingTime - b.metrics.trainingTime)[0];
    if (fastestModel.modelType !== bestModel.modelType) {
      reasoning.push(
        `If training time is important, consider ${fastestModel.modelName} (${fastestModel.metrics.trainingTime.toFixed(0)}ms vs ${bestModel.metrics.trainingTime.toFixed(0)}ms)`
      );
    }

    return {
      bestModel: bestModel.modelType,
      reasoning,
    };
  },
};
