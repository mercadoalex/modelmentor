export type SearchStrategy = 'grid' | 'random' | 'bayesian';

export interface HyperparameterSpace {
  learningRate: { min: number; max: number; scale: 'linear' | 'log' };
  batchSize: { values: number[] };
  epochs: { min: number; max: number };
  hiddenLayers: { values: number[] };
  dropout: { min: number; max: number };
  optimizer: { values: string[] };
}

export interface Trial {
  id: number;
  parameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    hiddenLayers: number;
    dropout: number;
    optimizer: string;
  };
  accuracy: number;
  loss: number;
  trainingTime: number;
  timestamp: Date;
}

export interface TuningResult {
  bestTrial: Trial;
  allTrials: Trial[];
  parameterImportance: Array<{
    parameter: string;
    importance: number;
    correlation: number;
  }>;
  convergenceHistory: Array<{
    trialNumber: number;
    bestAccuracy: number;
  }>;
  recommendations: string[];
}

export interface BayesianState {
  trials: Trial[];
  acquisitionFunction: 'ei' | 'ucb' | 'poi'; // Expected Improvement, Upper Confidence Bound, Probability of Improvement
  explorationWeight: number;
}

export const hyperparameterTuningService = {
  /**
   * Generate parameter combinations for grid search
   */
  generateGridSearchSpace(space: HyperparameterSpace): Array<Trial['parameters']> {
    const learningRates = this.generateRange(
      space.learningRate.min,
      space.learningRate.max,
      5,
      space.learningRate.scale
    );
    const batchSizes = space.batchSize.values;
    const epochsRange = this.generateRange(space.epochs.min, space.epochs.max, 3, 'linear');
    const hiddenLayers = space.hiddenLayers.values;
    const dropouts = this.generateRange(space.dropout.min, space.dropout.max, 3, 'linear');
    const optimizers = space.optimizer.values;

    const combinations: Array<Trial['parameters']> = [];

    // Generate all combinations (limited to prevent explosion)
    const maxCombinations = 100;
    let count = 0;

    for (const lr of learningRates) {
      for (const bs of batchSizes) {
        for (const ep of epochsRange) {
          for (const hl of hiddenLayers) {
            for (const dr of dropouts) {
              for (const opt of optimizers) {
                if (count >= maxCombinations) break;
                combinations.push({
                  learningRate: lr,
                  batchSize: bs,
                  epochs: Math.round(ep),
                  hiddenLayers: hl,
                  dropout: dr,
                  optimizer: opt,
                });
                count++;
              }
              if (count >= maxCombinations) break;
            }
            if (count >= maxCombinations) break;
          }
          if (count >= maxCombinations) break;
        }
        if (count >= maxCombinations) break;
      }
      if (count >= maxCombinations) break;
    }

    return combinations;
  },

  /**
   * Generate random parameter combinations
   */
  generateRandomSearchSpace(
    space: HyperparameterSpace,
    numTrials: number
  ): Array<Trial['parameters']> {
    const combinations: Array<Trial['parameters']> = [];

    for (let i = 0; i < numTrials; i++) {
      const lr = this.sampleFromRange(
        space.learningRate.min,
        space.learningRate.max,
        space.learningRate.scale
      );
      const bs = space.batchSize.values[
        Math.floor(Math.random() * space.batchSize.values.length)
      ];
      const ep = Math.round(
        this.sampleFromRange(space.epochs.min, space.epochs.max, 'linear')
      );
      const hl = space.hiddenLayers.values[
        Math.floor(Math.random() * space.hiddenLayers.values.length)
      ];
      const dr = this.sampleFromRange(space.dropout.min, space.dropout.max, 'linear');
      const opt = space.optimizer.values[
        Math.floor(Math.random() * space.optimizer.values.length)
      ];

      combinations.push({
        learningRate: lr,
        batchSize: bs,
        epochs: ep,
        hiddenLayers: hl,
        dropout: dr,
        optimizer: opt,
      });
    }

    return combinations;
  },

  /**
   * Bayesian optimization - suggest next trial based on previous results
   */
  suggestNextTrial(
    space: HyperparameterSpace,
    previousTrials: Trial[],
    state: BayesianState
  ): Trial['parameters'] {
    if (previousTrials.length === 0) {
      // First trial - random sample
      return this.generateRandomSearchSpace(space, 1)[0];
    }

    // Find best trial so far
    const bestAccuracy = Math.max(...previousTrials.map(t => t.accuracy));

    // Generate candidate points
    const candidates = this.generateRandomSearchSpace(space, 20);

    // Score each candidate using acquisition function
    const scoredCandidates = candidates.map(candidate => {
      const score = this.calculateAcquisitionScore(
        candidate,
        previousTrials,
        bestAccuracy,
        state
      );
      return { candidate, score };
    });

    // Return candidate with highest score
    scoredCandidates.sort((a, b) => b.score - a.score);
    return scoredCandidates[0].candidate;
  },

  /**
   * Calculate acquisition function score for Bayesian optimization
   */
  calculateAcquisitionScore(
    candidate: Trial['parameters'],
    previousTrials: Trial[],
    bestAccuracy: number,
    state: BayesianState
  ): number {
    // Simplified acquisition function
    // In practice, this would use Gaussian Process regression

    // Calculate distance to nearest previous trial
    let minDistance = Infinity;
    let nearestAccuracy = 0;

    for (const trial of previousTrials) {
      const distance = this.calculateParameterDistance(candidate, trial.parameters);
      if (distance < minDistance) {
        minDistance = distance;
        nearestAccuracy = trial.accuracy;
      }
    }

    // Expected Improvement approximation
    const exploration = state.explorationWeight * minDistance;
    const exploitation = nearestAccuracy;

    return exploitation + exploration;
  },

  /**
   * Calculate distance between two parameter sets
   */
  calculateParameterDistance(
    params1: Trial['parameters'],
    params2: Trial['parameters']
  ): number {
    // Normalized Euclidean distance
    const lrDist = Math.abs(Math.log10(params1.learningRate) - Math.log10(params2.learningRate)) / 3;
    const bsDist = Math.abs(params1.batchSize - params2.batchSize) / 128;
    const epDist = Math.abs(params1.epochs - params2.epochs) / 100;
    const hlDist = Math.abs(params1.hiddenLayers - params2.hiddenLayers) / 5;
    const drDist = Math.abs(params1.dropout - params2.dropout);
    const optDist = params1.optimizer === params2.optimizer ? 0 : 1;

    return Math.sqrt(
      lrDist ** 2 + bsDist ** 2 + epDist ** 2 + 
      hlDist ** 2 + drDist ** 2 + optDist ** 2
    );
  },

  /**
   * Simulate training with given parameters
   */
  simulateTrial(
    trialId: number,
    parameters: Trial['parameters']
  ): Trial {
    // Simulate training performance based on parameters
    // In practice, this would run actual training

    // Learning rate impact (optimal around 0.001-0.01)
    const lrScore = this.gaussianScore(Math.log10(parameters.learningRate), -2.5, 0.5);

    // Batch size impact (optimal around 32-64)
    const bsScore = this.gaussianScore(parameters.batchSize, 48, 32);

    // Epochs impact (more is better, but diminishing returns)
    const epScore = Math.min(parameters.epochs / 100, 1);

    // Hidden layers impact (optimal around 2-3)
    const hlScore = this.gaussianScore(parameters.hiddenLayers, 2.5, 1);

    // Dropout impact (optimal around 0.2-0.3)
    const drScore = this.gaussianScore(parameters.dropout, 0.25, 0.15);

    // Optimizer impact
    const optimizerScores: Record<string, number> = {
      adam: 0.9,
      sgd: 0.7,
      rmsprop: 0.85,
      adagrad: 0.75,
    };
    const optScore = optimizerScores[parameters.optimizer] || 0.7;

    // Combine scores with weights
    const baseAccuracy = 
      lrScore * 0.3 +
      bsScore * 0.15 +
      epScore * 0.15 +
      hlScore * 0.15 +
      drScore * 0.15 +
      optScore * 0.1;

    // Add some randomness
    const noise = (Math.random() - 0.5) * 0.1;
    const accuracy = Math.max(0.5, Math.min(0.98, baseAccuracy + noise));
    const loss = 1 - accuracy + Math.random() * 0.1;

    // Training time based on epochs and batch size
    const trainingTime = (parameters.epochs * 1000) / parameters.batchSize;

    return {
      id: trialId,
      parameters,
      accuracy,
      loss,
      trainingTime,
      timestamp: new Date(),
    };
  },

  /**
   * Run complete tuning process
   */
  async runTuning(
    strategy: SearchStrategy,
    space: HyperparameterSpace,
    numTrials: number,
    onProgress?: (trial: Trial, progress: number) => void
  ): Promise<TuningResult> {
    const trials: Trial[] = [];
    let parameterCombinations: Array<Trial['parameters']>;

    // Generate parameter combinations based on strategy
    if (strategy === 'grid') {
      parameterCombinations = this.generateGridSearchSpace(space);
      numTrials = Math.min(numTrials, parameterCombinations.length);
    } else if (strategy === 'random') {
      parameterCombinations = this.generateRandomSearchSpace(space, numTrials);
    } else {
      // Bayesian optimization
      parameterCombinations = [];
      const bayesianState: BayesianState = {
        trials: [],
        acquisitionFunction: 'ei',
        explorationWeight: 0.1,
      };

      for (let i = 0; i < numTrials; i++) {
        const params = this.suggestNextTrial(space, trials, bayesianState);
        parameterCombinations.push(params);

        // Simulate trial
        const trial = this.simulateTrial(i + 1, params);
        trials.push(trial);
        bayesianState.trials = trials;

        if (onProgress) {
          onProgress(trial, ((i + 1) / numTrials) * 100);
        }

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Run trials for grid and random search
    if (strategy !== 'bayesian') {
      for (let i = 0; i < numTrials; i++) {
        const trial = this.simulateTrial(i + 1, parameterCombinations[i]);
        trials.push(trial);

        if (onProgress) {
          onProgress(trial, ((i + 1) / numTrials) * 100);
        }

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Find best trial
    const bestTrial = trials.reduce((best, current) =>
      current.accuracy > best.accuracy ? current : best
    );

    // Calculate parameter importance
    const parameterImportance = this.calculateParameterImportance(trials);

    // Generate convergence history
    const convergenceHistory = trials.map((trial, index) => ({
      trialNumber: index + 1,
      bestAccuracy: Math.max(...trials.slice(0, index + 1).map(t => t.accuracy)),
    }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      bestTrial,
      trials,
      parameterImportance,
      strategy
    );

    return {
      bestTrial,
      allTrials: trials,
      parameterImportance,
      convergenceHistory,
      recommendations,
    };
  },

  /**
   * Calculate parameter importance using correlation with accuracy
   */
  calculateParameterImportance(trials: Trial[]): Array<{
    parameter: string;
    importance: number;
    correlation: number;
  }> {
    const parameters = [
      'learningRate',
      'batchSize',
      'epochs',
      'hiddenLayers',
      'dropout',
    ];

    return parameters.map(param => {
      // Calculate correlation with accuracy
      const values = trials.map(t => {
        const value = t.parameters[param as keyof Trial['parameters']];
        return typeof value === 'number' ? value : 0;
      });
      const accuracies = trials.map(t => t.accuracy);

      const correlation = this.calculateCorrelation(values, accuracies);
      const importance = Math.abs(correlation);

      return {
        parameter: this.formatParameterName(param),
        importance,
        correlation,
      };
    }).sort((a, b) => b.importance - a.importance);
  },

  /**
   * Calculate Pearson correlation coefficient
   */
  calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  },

  /**
   * Generate recommendations based on tuning results
   */
  generateRecommendations(
    bestTrial: Trial,
    allTrials: Trial[],
    parameterImportance: Array<{ parameter: string; importance: number }>,
    strategy: SearchStrategy
  ): string[] {
    const recommendations: string[] = [];

    // Best parameters
    recommendations.push(
      `Best configuration achieved ${(bestTrial.accuracy * 100).toFixed(1)}% accuracy`
    );

    // Most important parameter
    const mostImportant = parameterImportance[0];
    recommendations.push(
      `${mostImportant.parameter} has the highest impact (${(mostImportant.importance * 100).toFixed(0)}% importance)`
    );

    // Learning rate recommendation
    if (bestTrial.parameters.learningRate < 0.0001) {
      recommendations.push('Learning rate is very low - consider increasing for faster convergence');
    } else if (bestTrial.parameters.learningRate > 0.1) {
      recommendations.push('Learning rate is high - consider decreasing for better stability');
    }

    // Epochs recommendation
    const avgAccuracy = allTrials.reduce((sum, t) => sum + t.accuracy, 0) / allTrials.length;
    const improvement = bestTrial.accuracy - avgAccuracy;
    if (improvement < 0.05) {
      recommendations.push('Small improvement over average - try expanding search space');
    }

    // Strategy recommendation
    if (strategy === 'random' && allTrials.length < 20) {
      recommendations.push('Consider running more trials for better exploration');
    } else if (strategy === 'grid') {
      recommendations.push('Grid search completed - consider Bayesian optimization for refinement');
    } else if (strategy === 'bayesian') {
      recommendations.push('Bayesian optimization converged - parameters are well-tuned');
    }

    return recommendations;
  },

  /**
   * Helper: Generate range of values
   */
  generateRange(
    min: number,
    max: number,
    steps: number,
    scale: 'linear' | 'log'
  ): number[] {
    const values: number[] = [];

    if (scale === 'linear') {
      const step = (max - min) / (steps - 1);
      for (let i = 0; i < steps; i++) {
        values.push(min + step * i);
      }
    } else {
      // Logarithmic scale
      const logMin = Math.log10(min);
      const logMax = Math.log10(max);
      const step = (logMax - logMin) / (steps - 1);
      for (let i = 0; i < steps; i++) {
        values.push(Math.pow(10, logMin + step * i));
      }
    }

    return values;
  },

  /**
   * Helper: Sample from range
   */
  sampleFromRange(min: number, max: number, scale: 'linear' | 'log'): number {
    if (scale === 'linear') {
      return min + Math.random() * (max - min);
    } else {
      const logMin = Math.log10(min);
      const logMax = Math.log10(max);
      return Math.pow(10, logMin + Math.random() * (logMax - logMin));
    }
  },

  /**
   * Helper: Gaussian score function
   */
  gaussianScore(value: number, mean: number, stdDev: number): number {
    const exponent = -Math.pow(value - mean, 2) / (2 * Math.pow(stdDev, 2));
    return Math.exp(exponent);
  },

  /**
   * Helper: Format parameter name
   */
  formatParameterName(param: string): string {
    return param
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  },

  /**
   * Get default search space
   */
  getDefaultSearchSpace(): HyperparameterSpace {
    return {
      learningRate: { min: 0.0001, max: 0.1, scale: 'log' },
      batchSize: { values: [16, 32, 64, 128] },
      epochs: { min: 10, max: 100 },
      hiddenLayers: { values: [1, 2, 3, 4] },
      dropout: { min: 0.0, max: 0.5 },
      optimizer: { values: ['adam', 'sgd', 'rmsprop'] },
    };
  },
};
