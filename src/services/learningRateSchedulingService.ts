export type SchedulingStrategy = 'constant' | 'step_decay' | 'exponential_decay' | 'cosine_annealing';

export interface SchedulingParams {
  strategy: SchedulingStrategy;
  initialLR: number;
  // Step decay params
  stepSize?: number;
  decayRate?: number;
  // Exponential decay params
  decayFactor?: number;
  // Cosine annealing params
  minLR?: number;
  cycleLength?: number;
}

export interface LearningRatePoint {
  epoch: number;
  learningRate: number;
  trainLoss: number;
}

export interface SchedulingComparison {
  strategy: SchedulingStrategy;
  finalLoss: number;
  convergenceSpeed: number;
  stability: number;
}

export const learningRateSchedulingService = {
  /**
   * Calculate learning rate for a given epoch
   */
  calculateLearningRate(
    epoch: number,
    params: SchedulingParams
  ): number {
    const { strategy, initialLR } = params;
    
    switch (strategy) {
      case 'constant':
        return initialLR;
      
      case 'step_decay': {
        const stepSize = params.stepSize || 10;
        const decayRate = params.decayRate || 0.5;
        const steps = Math.floor(epoch / stepSize);
        return initialLR * Math.pow(decayRate, steps);
      }
      
      case 'exponential_decay': {
        const decayFactor = params.decayFactor || 0.95;
        return initialLR * Math.pow(decayFactor, epoch);
      }
      
      case 'cosine_annealing': {
        const minLR = params.minLR || initialLR * 0.01;
        const cycleLength = params.cycleLength || 50;
        const progress = (epoch % cycleLength) / cycleLength;
        const cosineDecay = 0.5 * (1 + Math.cos(Math.PI * progress));
        return minLR + (initialLR - minLR) * cosineDecay;
      }
      
      default:
        return initialLR;
    }
  },

  /**
   * Generate learning rate schedule
   */
  generateSchedule(
    params: SchedulingParams,
    epochs: number = 100
  ): LearningRatePoint[] {
    const schedule: LearningRatePoint[] = [];
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      const learningRate = this.calculateLearningRate(epoch, params);
      const trainLoss = this.simulateTrainingLoss(epoch, learningRate, params.strategy);
      
      schedule.push({
        epoch: epoch + 1,
        learningRate,
        trainLoss,
      });
    }
    
    return schedule;
  },

  /**
   * Simulate training loss based on learning rate
   */
  simulateTrainingLoss(
    epoch: number,
    learningRate: number,
    strategy: SchedulingStrategy
  ): number {
    // Base loss that decreases over time
    const baseLoss = 2.0 * Math.exp(-0.03 * epoch);
    
    // Learning rate effect
    // Too high LR causes instability, too low LR causes slow convergence
    const optimalLR = 0.01;
    const lrPenalty = Math.abs(Math.log(learningRate / optimalLR)) * 0.1;
    
    // Strategy-specific effects
    let strategyBonus = 0;
    switch (strategy) {
      case 'step_decay':
        // Good for most cases
        strategyBonus = -0.05;
        break;
      case 'exponential_decay':
        // Smooth convergence
        strategyBonus = -0.08;
        break;
      case 'cosine_annealing':
        // Best convergence but cyclical
        strategyBonus = -0.10;
        // Add cyclical variation
        const cycle = Math.sin(epoch * 0.1) * 0.05;
        strategyBonus += cycle;
        break;
      case 'constant':
        // No bonus
        strategyBonus = 0;
        break;
    }
    
    // Add some noise
    const noise = (Math.random() - 0.5) * 0.02;
    
    return Math.max(0.05, baseLoss + lrPenalty + strategyBonus + noise);
  },

  /**
   * Find optimal initial learning rate
   */
  findOptimalLearningRate(): {
    optimalLR: number;
    lrRange: { min: number; max: number };
    recommendation: string;
  } {
    // Simulate LR finder algorithm
    const lrRange = { min: 1e-5, max: 1.0 };
    const optimalLR = 0.01; // Typical good starting point
    
    const recommendation = 
      'Start with 0.01 for most models. ' +
      'Use 0.001 for fine-tuning or transfer learning. ' +
      'Use 0.1 for simple models with small datasets.';
    
    return {
      optimalLR,
      lrRange,
      recommendation,
    };
  },

  /**
   * Compare different scheduling strategies
   */
  compareStrategies(
    initialLR: number,
    epochs: number = 100
  ): SchedulingComparison[] {
    const strategies: SchedulingStrategy[] = [
      'constant',
      'step_decay',
      'exponential_decay',
      'cosine_annealing',
    ];
    
    return strategies.map(strategy => {
      const params: SchedulingParams = {
        strategy,
        initialLR,
        stepSize: 20,
        decayRate: 0.5,
        decayFactor: 0.96,
        minLR: initialLR * 0.01,
        cycleLength: 50,
      };
      
      const schedule = this.generateSchedule(params, epochs);
      
      // Calculate metrics
      const finalLoss = schedule[schedule.length - 1].trainLoss;
      
      // Convergence speed: how quickly loss decreases
      const initialLoss = schedule[0].trainLoss;
      const lossReduction = initialLoss - finalLoss;
      const convergenceSpeed = lossReduction / epochs;
      
      // Stability: variance in loss over last 20 epochs
      const lastEpochs = schedule.slice(-20);
      const avgLoss = lastEpochs.reduce((sum, p) => sum + p.trainLoss, 0) / lastEpochs.length;
      const variance = lastEpochs.reduce((sum, p) => sum + Math.pow(p.trainLoss - avgLoss, 2), 0) / lastEpochs.length;
      const stability = 1 / (1 + variance * 100); // Higher is more stable
      
      return {
        strategy,
        finalLoss,
        convergenceSpeed,
        stability,
      };
    });
  },

  /**
   * Get recommendations based on training scenario
   */
  getRecommendations(
    modelComplexity: 'simple' | 'medium' | 'complex',
    datasetSize: 'small' | 'medium' | 'large',
    trainingTime: 'short' | 'medium' | 'long'
  ): {
    recommendedStrategy: SchedulingStrategy;
    recommendedParams: SchedulingParams;
    reasoning: string;
  } {
    let recommendedStrategy: SchedulingStrategy;
    let reasoning: string;
    
    // Decision logic
    if (trainingTime === 'long' && datasetSize === 'large') {
      recommendedStrategy = 'cosine_annealing';
      reasoning = 'Cosine annealing works best for long training with large datasets, providing cyclical learning rates that help escape local minima.';
    } else if (modelComplexity === 'complex') {
      recommendedStrategy = 'exponential_decay';
      reasoning = 'Exponential decay provides smooth, gradual reduction ideal for complex models that need careful optimization.';
    } else if (datasetSize === 'small') {
      recommendedStrategy = 'step_decay';
      reasoning = 'Step decay is simple and effective for smaller datasets, reducing learning rate at key milestones.';
    } else {
      recommendedStrategy = 'exponential_decay';
      reasoning = 'Exponential decay is a safe default choice that works well across most scenarios.';
    }
    
    // Set parameters based on strategy
    const recommendedParams: SchedulingParams = {
      strategy: recommendedStrategy,
      initialLR: 0.01,
      stepSize: 20,
      decayRate: 0.5,
      decayFactor: 0.96,
      minLR: 0.0001,
      cycleLength: 50,
    };
    
    return {
      recommendedStrategy,
      recommendedParams,
      reasoning,
    };
  },

  /**
   * Get strategy explanations
   */
  getStrategyExplanations(): Record<SchedulingStrategy, {
    name: string;
    description: string;
    formula: string;
    pros: string[];
    cons: string[];
    bestFor: string;
  }> {
    return {
      constant: {
        name: 'Constant Learning Rate',
        description: 'Learning rate stays the same throughout training',
        formula: 'LR(t) = LR₀',
        pros: [
          'Simple to understand and implement',
          'No hyperparameters to tune',
          'Predictable behavior',
        ],
        cons: [
          'May not converge to optimal solution',
          'Can overshoot minimum with high LR',
          'Slow convergence with low LR',
        ],
        bestFor: 'Quick experiments and baseline models',
      },
      step_decay: {
        name: 'Step Decay',
        description: 'Learning rate decreases by a factor every N epochs',
        formula: 'LR(t) = LR₀ × γ^⌊t/s⌋',
        pros: [
          'Easy to understand and tune',
          'Works well in practice',
          'Clear milestones for LR reduction',
        ],
        cons: [
          'Requires tuning step size and decay rate',
          'Sudden drops can cause instability',
          'May not be optimal for all problems',
        ],
        bestFor: 'General purpose training with clear phases',
      },
      exponential_decay: {
        name: 'Exponential Decay',
        description: 'Learning rate decreases exponentially over time',
        formula: 'LR(t) = LR₀ × γ^t',
        pros: [
          'Smooth, gradual reduction',
          'Mathematically elegant',
          'Good for fine-tuning',
        ],
        cons: [
          'Can decay too quickly or slowly',
          'Requires careful tuning of decay factor',
          'May need adjustment mid-training',
        ],
        bestFor: 'Complex models requiring smooth optimization',
      },
      cosine_annealing: {
        name: 'Cosine Annealing',
        description: 'Learning rate follows a cosine curve, cycling between max and min',
        formula: 'LR(t) = LRₘᵢₙ + (LR₀ - LRₘᵢₙ) × (1 + cos(πt/T)) / 2',
        pros: [
          'Helps escape local minima',
          'Cyclical exploration and exploitation',
          'Often achieves best final performance',
        ],
        cons: [
          'More complex to understand',
          'Requires longer training',
          'Cyclical loss can be confusing',
        ],
        bestFor: 'Long training runs with large datasets',
      },
    };
  },

  /**
   * Get best practices
   */
  getBestPractices(): string[] {
    return [
      'Start with a learning rate finder to identify a good initial LR',
      'Monitor training loss to ensure learning rate is appropriate',
      'Use learning rate scheduling for training runs longer than 50 epochs',
      'Reduce learning rate if loss plateaus or oscillates',
      'Try exponential decay as a safe default strategy',
      'Use cosine annealing for state-of-the-art results on large datasets',
      'Combine learning rate scheduling with early stopping',
      'Save checkpoints at different learning rate stages',
    ];
  },

  /**
   * Analyze training progress and suggest adjustments
   */
  analyzeTraining(
    lossHistory: number[],
    currentLR: number
  ): {
    status: 'good' | 'plateau' | 'diverging' | 'oscillating';
    recommendation: string;
    suggestedLR: number;
  } {
    if (lossHistory.length < 10) {
      return {
        status: 'good',
        recommendation: 'Not enough data to analyze. Continue training.',
        suggestedLR: currentLR,
      };
    }
    
    const recent = lossHistory.slice(-10);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = lossHistory.slice(-20, -10);
    const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
    
    // Check for plateau
    const improvement = avgOlder - avgRecent;
    if (improvement < 0.001) {
      return {
        status: 'plateau',
        recommendation: 'Loss has plateaued. Reduce learning rate by 50% or try a different strategy.',
        suggestedLR: currentLR * 0.5,
      };
    }
    
    // Check for divergence
    if (avgRecent > avgOlder * 1.1) {
      return {
        status: 'diverging',
        recommendation: 'Loss is increasing! Reduce learning rate immediately or restart training.',
        suggestedLR: currentLR * 0.1,
      };
    }
    
    // Check for oscillation
    const variance = recent.reduce((sum, loss) => sum + Math.pow(loss - avgRecent, 2), 0) / recent.length;
    if (variance > avgRecent * 0.1) {
      return {
        status: 'oscillating',
        recommendation: 'Loss is oscillating. Reduce learning rate to stabilize training.',
        suggestedLR: currentLR * 0.7,
      };
    }
    
    return {
      status: 'good',
      recommendation: 'Training is progressing well. Continue with current settings.',
      suggestedLR: currentLR,
    };
  },
};
