export interface ModelConfig {
  id: string;
  name: string;
  architecture: 'simple_nn' | 'deep_nn' | 'cnn' | 'rnn';
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: 'adam' | 'sgd' | 'rmsprop';
}

export interface ModelTrainingResult {
  config: ModelConfig;
  accuracy: number;
  loss: number;
  trainingTime: number;
  trainingCurve: Array<{ epoch: number; accuracy: number; loss: number }>;
  featureImportance: Array<{ feature: string; importance: number }>;
  status: 'pending' | 'training' | 'completed' | 'failed';
}

export interface ComparisonInsight {
  type: 'winner' | 'info' | 'warning';
  title: string;
  description: string;
}

export const multiModelComparisonService = {
  /**
   * Train a single model with given configuration
   */
  async trainModel(
    config: ModelConfig,
    features: string[],
    onProgress?: (epoch: number, total: number) => void
  ): Promise<ModelTrainingResult> {
    const trainingCurve: Array<{ epoch: number; accuracy: number; loss: number }> = [];
    
    // Base performance depends on architecture
    const baseAccuracy = this.getBaseAccuracy(config.architecture);
    const convergenceRate = this.getConvergenceRate(config.architecture, config.learningRate);

    // Simulate training
    for (let epoch = 1; epoch <= config.epochs; epoch++) {
      const progress = epoch / config.epochs;
      const accuracy = baseAccuracy * (1 - Math.exp(-convergenceRate * progress)) + Math.random() * 0.02;
      const loss = (1 - accuracy) * 2 + Math.random() * 0.1;

      trainingCurve.push({
        epoch,
        accuracy: Math.min(0.98, accuracy),
        loss: Math.max(0.05, loss),
      });

      if (onProgress) {
        onProgress(epoch, config.epochs);
      }

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final metrics
    const finalMetrics = trainingCurve[trainingCurve.length - 1];
    const trainingTime = config.epochs * config.batchSize * 0.5 + Math.random() * 100;

    // Generate feature importance
    const featureImportance = features.map(feature => ({
      feature,
      importance: Math.random() * 0.3 + 0.05,
    })).sort((a, b) => b.importance - a.importance);

    return {
      config,
      accuracy: finalMetrics.accuracy,
      loss: finalMetrics.loss,
      trainingTime,
      trainingCurve,
      featureImportance,
      status: 'completed',
    };
  },

  /**
   * Get base accuracy for architecture
   */
  getBaseAccuracy(architecture: ModelConfig['architecture']): number {
    switch (architecture) {
      case 'simple_nn':
        return 0.75;
      case 'deep_nn':
        return 0.85;
      case 'cnn':
        return 0.88;
      case 'rnn':
        return 0.82;
      default:
        return 0.75;
    }
  },

  /**
   * Get convergence rate
   */
  getConvergenceRate(
    architecture: ModelConfig['architecture'],
    learningRate: number
  ): number {
    const baseRate = {
      simple_nn: 3,
      deep_nn: 2,
      cnn: 2.5,
      rnn: 2,
    }[architecture];

    return baseRate * (learningRate / 0.001);
  },

  /**
   * Compare multiple model results
   */
  compareModels(results: ModelTrainingResult[]): {
    bestAccuracy: ModelTrainingResult;
    fastestTraining: ModelTrainingResult;
    bestEfficiency: ModelTrainingResult;
    insights: ComparisonInsight[];
  } {
    if (results.length === 0) {
      throw new Error('No models to compare');
    }

    const bestAccuracy = results.reduce((best, current) =>
      current.accuracy > best.accuracy ? current : best
    );

    const fastestTraining = results.reduce((fastest, current) =>
      current.trainingTime < fastest.trainingTime ? current : fastest
    );

    // Efficiency = accuracy / training time
    const bestEfficiency = results.reduce((best, current) => {
      const currentEff = current.accuracy / current.trainingTime;
      const bestEff = best.accuracy / best.trainingTime;
      return currentEff > bestEff ? current : best;
    });

    const insights = this.generateInsights(results, bestAccuracy, fastestTraining, bestEfficiency);

    return {
      bestAccuracy,
      fastestTraining,
      bestEfficiency,
      insights,
    };
  },

  /**
   * Generate comparison insights
   */
  generateInsights(
    results: ModelTrainingResult[],
    bestAccuracy: ModelTrainingResult,
    fastestTraining: ModelTrainingResult,
    bestEfficiency: ModelTrainingResult
  ): ComparisonInsight[] {
    const insights: ComparisonInsight[] = [];

    // Winner insight
    insights.push({
      type: 'winner',
      title: 'Recommended Model',
      description: `${bestAccuracy.config.name} achieved the highest accuracy (${(bestAccuracy.accuracy * 100).toFixed(2)}%) and is recommended for production use.`,
    });

    // Speed insight
    if (fastestTraining.config.id !== bestAccuracy.config.id) {
      insights.push({
        type: 'info',
        title: 'Fastest Training',
        description: `${fastestTraining.config.name} trained ${((bestAccuracy.trainingTime / fastestTraining.trainingTime - 1) * 100).toFixed(0)}% faster but with ${((bestAccuracy.accuracy - fastestTraining.accuracy) * 100).toFixed(1)}% lower accuracy.`,
      });
    }

    // Efficiency insight
    if (bestEfficiency.config.id !== bestAccuracy.config.id) {
      insights.push({
        type: 'info',
        title: 'Best Efficiency',
        description: `${bestEfficiency.config.name} offers the best accuracy-to-time ratio, making it ideal for rapid experimentation.`,
      });
    }

    // Architecture insights
    const architectures = new Set(results.map(r => r.config.architecture));
    if (architectures.size > 1) {
      insights.push({
        type: 'info',
        title: 'Architecture Comparison',
        description: `Tested ${architectures.size} different architectures. ${bestAccuracy.config.architecture.toUpperCase()} performed best for this problem.`,
      });
    }

    // Hyperparameter insights
    const learningRates = results.map(r => r.config.learningRate);
    const maxLR = Math.max(...learningRates);
    const minLR = Math.min(...learningRates);
    if (maxLR !== minLR) {
      const bestLR = bestAccuracy.config.learningRate;
      insights.push({
        type: 'info',
        title: 'Learning Rate Impact',
        description: `Learning rate of ${bestLR} worked best. ${bestLR === maxLR ? 'Higher' : bestLR === minLR ? 'Lower' : 'Moderate'} learning rates performed better for this dataset.`,
      });
    }

    return insights;
  },

  /**
   * Get default model configurations
   */
  getDefaultConfigs(): ModelConfig[] {
    return [
      {
        id: 'model-1',
        name: 'Simple Neural Network',
        architecture: 'simple_nn',
        epochs: 20,
        batchSize: 32,
        learningRate: 0.001,
        optimizer: 'adam',
      },
      {
        id: 'model-2',
        name: 'Deep Neural Network',
        architecture: 'deep_nn',
        epochs: 30,
        batchSize: 32,
        learningRate: 0.001,
        optimizer: 'adam',
      },
      {
        id: 'model-3',
        name: 'Fast Training Model',
        architecture: 'simple_nn',
        epochs: 15,
        batchSize: 64,
        learningRate: 0.01,
        optimizer: 'sgd',
      },
    ];
  },

  /**
   * Generate training curve comparison data
   */
  generateCurveComparisonData(results: ModelTrainingResult[]): Array<{
    epoch: number;
    [key: string]: number;
  }> {
    if (results.length === 0) return [];

    const maxEpochs = Math.max(...results.map(r => r.config.epochs));
    const data: Array<{ epoch: number; [key: string]: number }> = [];

    for (let epoch = 1; epoch <= maxEpochs; epoch++) {
      const point: { epoch: number; [key: string]: number } = { epoch };

      results.forEach(result => {
        const curvePoint = result.trainingCurve.find(c => c.epoch === epoch);
        if (curvePoint) {
          point[result.config.name] = curvePoint.accuracy;
        }
      });

      data.push(point);
    }

    return data;
  },
};
