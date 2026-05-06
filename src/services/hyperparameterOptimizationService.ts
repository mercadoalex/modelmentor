export interface HyperparameterConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
}

export interface OptimizationResult {
  config: HyperparameterConfig;
  accuracy: number;
  loss: number;
  trainingTime: number;
  iteration: number;
}

export interface OptimizationProgress {
  currentIteration: number;
  totalIterations: number;
  bestResult: OptimizationResult | null;
  allResults: OptimizationResult[];
  status: 'idle' | 'running' | 'completed';
}

export interface SearchSpace {
  epochs: number[];
  batchSize: number[];
  learningRate: number[];
}

export interface OptimizationRecommendation {
  bestConfig: HyperparameterConfig;
  expectedAccuracy: number;
  reasoning: string[];
  alternatives: {
    config: HyperparameterConfig;
    tradeoff: string;
  }[];
}

export const hyperparameterOptimizationService = {
  /**
   * Perform grid search optimization
   */
  async gridSearch(
    searchSpace: SearchSpace,
    onProgress?: (progress: OptimizationProgress) => void
  ): Promise<OptimizationProgress> {
    const results: OptimizationResult[] = [];
    let iteration = 0;
    
    // Calculate total iterations
    const totalIterations = 
      searchSpace.epochs.length * 
      searchSpace.batchSize.length * 
      searchSpace.learningRate.length;

    let bestResult: OptimizationResult | null = null;

    // Grid search through all combinations
    for (const epochs of searchSpace.epochs) {
      for (const batchSize of searchSpace.batchSize) {
        for (const learningRate of searchSpace.learningRate) {
          iteration++;

          // Simulate training with these hyperparameters
          const result = this.evaluateHyperparameters({
            epochs,
            batchSize,
            learningRate,
          }, iteration);

          results.push(result);

          // Update best result
          if (!bestResult || result.accuracy > bestResult.accuracy) {
            bestResult = result;
          }

          // Report progress
          if (onProgress) {
            onProgress({
              currentIteration: iteration,
              totalIterations,
              bestResult,
              allResults: [...results],
              status: iteration < totalIterations ? 'running' : 'completed',
            });
          }

          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    return {
      currentIteration: totalIterations,
      totalIterations,
      bestResult,
      allResults: results,
      status: 'completed',
    };
  },

  /**
   * Perform Bayesian optimization (simplified)
   */
  async bayesianOptimization(
    searchSpace: SearchSpace,
    maxIterations: number = 10,
    onProgress?: (progress: OptimizationProgress) => void
  ): Promise<OptimizationProgress> {
    const results: OptimizationResult[] = [];
    let bestResult: OptimizationResult | null = null;

    // Start with random sampling
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      // Select hyperparameters using acquisition function (simplified)
      const config = this.selectNextConfig(searchSpace, results, iteration);

      // Evaluate
      const result = this.evaluateHyperparameters(config, iteration);
      results.push(result);

      // Update best result
      if (!bestResult || result.accuracy > bestResult.accuracy) {
        bestResult = result;
      }

      // Report progress
      if (onProgress) {
        onProgress({
          currentIteration: iteration,
          totalIterations: maxIterations,
          bestResult,
          allResults: [...results],
          status: iteration < maxIterations ? 'running' : 'completed',
        });
      }

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    return {
      currentIteration: maxIterations,
      totalIterations: maxIterations,
      bestResult,
      allResults: results,
      status: 'completed',
    };
  },

  /**
   * Select next configuration for Bayesian optimization
   */
  selectNextConfig(
    searchSpace: SearchSpace,
    previousResults: OptimizationResult[],
    iteration: number
  ): HyperparameterConfig {
    // For first few iterations, use random sampling
    if (iteration <= 3) {
      return {
        epochs: searchSpace.epochs[Math.floor(Math.random() * searchSpace.epochs.length)],
        batchSize: searchSpace.batchSize[Math.floor(Math.random() * searchSpace.batchSize.length)],
        learningRate: searchSpace.learningRate[Math.floor(Math.random() * searchSpace.learningRate.length)],
      };
    }

    // For later iterations, explore around best results
    const bestResults = [...previousResults]
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3);

    const bestConfig = bestResults[0].config;

    // Add some exploration noise
    const epochsIndex = searchSpace.epochs.indexOf(bestConfig.epochs);
    const batchSizeIndex = searchSpace.batchSize.indexOf(bestConfig.batchSize);
    const learningRateIndex = searchSpace.learningRate.indexOf(bestConfig.learningRate);

    const newEpochsIndex = Math.max(0, Math.min(
      searchSpace.epochs.length - 1,
      epochsIndex + (Math.random() > 0.5 ? 1 : -1)
    ));
    const newBatchSizeIndex = Math.max(0, Math.min(
      searchSpace.batchSize.length - 1,
      batchSizeIndex + (Math.random() > 0.5 ? 1 : -1)
    ));
    const newLearningRateIndex = Math.max(0, Math.min(
      searchSpace.learningRate.length - 1,
      learningRateIndex + (Math.random() > 0.5 ? 1 : -1)
    ));

    return {
      epochs: searchSpace.epochs[newEpochsIndex],
      batchSize: searchSpace.batchSize[newBatchSizeIndex],
      learningRate: searchSpace.learningRate[newLearningRateIndex],
    };
  },

  /**
   * Evaluate hyperparameters (simulated)
   */
  evaluateHyperparameters(
    config: HyperparameterConfig,
    iteration: number
  ): OptimizationResult {
    // Simulate realistic performance based on hyperparameters
    let baseAccuracy = 0.75;

    // Epochs effect (more epochs generally better, but diminishing returns)
    const epochsFactor = Math.min(config.epochs / 50, 1.0) * 0.15;
    baseAccuracy += epochsFactor;

    // Batch size effect (moderate batch size often best)
    const optimalBatchSize = 32;
    const batchSizeFactor = 1 - Math.abs(config.batchSize - optimalBatchSize) / 100;
    baseAccuracy += batchSizeFactor * 0.05;

    // Learning rate effect (too high or too low is bad)
    const optimalLearningRate = 0.001;
    const lrDiff = Math.abs(config.learningRate - optimalLearningRate);
    const lrFactor = Math.exp(-lrDiff * 1000);
    baseAccuracy += lrFactor * 0.08;

    // Add some random noise
    const noise = (Math.random() - 0.5) * 0.03;
    const accuracy = Math.max(0.5, Math.min(0.98, baseAccuracy + noise));

    // Calculate loss (inversely related to accuracy)
    const loss = (1 - accuracy) * 2 + Math.random() * 0.1;

    // Estimate training time
    const trainingTime = config.epochs * config.batchSize * 0.5 + Math.random() * 100;

    return {
      config,
      accuracy,
      loss,
      trainingTime,
      iteration,
    };
  },

  /**
   * Generate recommendation from optimization results
   */
  generateRecommendation(progress: OptimizationProgress): OptimizationRecommendation {
    if (!progress.bestResult) {
      throw new Error('No results available');
    }

    const bestResult = progress.bestResult;
    const reasoning: string[] = [];

    // Analyze best configuration
    reasoning.push(
      `Best accuracy achieved: ${(bestResult.accuracy * 100).toFixed(2)}% with ${bestResult.config.epochs} epochs, batch size ${bestResult.config.batchSize}, and learning rate ${bestResult.config.learningRate}`
    );

    // Epochs reasoning
    if (bestResult.config.epochs >= 50) {
      reasoning.push('Higher epoch count allows the model to learn more complex patterns');
    } else if (bestResult.config.epochs <= 20) {
      reasoning.push('Lower epoch count provides faster training while maintaining good performance');
    }

    // Batch size reasoning
    if (bestResult.config.batchSize === 32) {
      reasoning.push('Batch size of 32 provides a good balance between training stability and speed');
    } else if (bestResult.config.batchSize < 32) {
      reasoning.push('Smaller batch size allows for more frequent weight updates');
    } else {
      reasoning.push('Larger batch size improves training speed but may reduce generalization');
    }

    // Learning rate reasoning
    if (bestResult.config.learningRate === 0.001) {
      reasoning.push('Learning rate of 0.001 is a well-established default that works for most problems');
    } else if (bestResult.config.learningRate > 0.001) {
      reasoning.push('Higher learning rate enables faster convergence but may be less stable');
    } else {
      reasoning.push('Lower learning rate provides more stable training but requires more epochs');
    }

    // Find alternative configurations
    const alternatives = progress.allResults
      .filter(r => r !== bestResult)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 2)
      .map(result => {
        let tradeoff = '';
        
        if (result.trainingTime < bestResult.trainingTime) {
          tradeoff = `Faster training (${result.trainingTime.toFixed(0)}ms vs ${bestResult.trainingTime.toFixed(0)}ms) with slightly lower accuracy`;
        } else if (result.config.epochs < bestResult.config.epochs) {
          tradeoff = `Fewer epochs (${result.config.epochs} vs ${bestResult.config.epochs}) for quicker experimentation`;
        } else {
          tradeoff = `Alternative configuration with ${(result.accuracy * 100).toFixed(2)}% accuracy`;
        }

        return {
          config: result.config,
          tradeoff,
        };
      });

    return {
      bestConfig: bestResult.config,
      expectedAccuracy: bestResult.accuracy,
      reasoning,
      alternatives,
    };
  },

  /**
   * Get default search space
   */
  getDefaultSearchSpace(): SearchSpace {
    return {
      epochs: [10, 20, 30, 50],
      batchSize: [16, 32, 64],
      learningRate: [0.0001, 0.001, 0.01],
    };
  },

  /**
   * Get quick search space (fewer combinations)
   */
  getQuickSearchSpace(): SearchSpace {
    return {
      epochs: [20, 50],
      batchSize: [32, 64],
      learningRate: [0.001, 0.01],
    };
  },
};
