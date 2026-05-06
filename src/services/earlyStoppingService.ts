export interface EarlyStoppingConfig {
  enabled: boolean;
  patience: number;
  minDelta: number;
  monitorMetric: 'val_accuracy' | 'val_loss';
  mode: 'max' | 'min';
  restoreBestWeights: boolean;
}

export interface EarlyStoppingState {
  bestValue: number;
  bestEpoch: number;
  waitCount: number;
  stopped: boolean;
  stoppedEpoch: number | null;
  improvementHistory: {
    epoch: number;
    value: number;
    improved: boolean;
  }[];
}

export interface EarlyStoppingResult {
  shouldStop: boolean;
  reason: string;
  epochsSaved: number;
  bestEpoch: number;
  bestValue: number;
  totalWaitEpochs: number;
}

export const earlyStoppingService = {
  /**
   * Initialize early stopping state
   */
  initializeState(config: EarlyStoppingConfig): EarlyStoppingState {
    return {
      bestValue: config.mode === 'max' ? -Infinity : Infinity,
      bestEpoch: 0,
      waitCount: 0,
      stopped: false,
      stoppedEpoch: null,
      improvementHistory: [],
    };
  },

  /**
   * Check if training should stop
   */
  shouldStop(
    currentEpoch: number,
    currentValue: number,
    state: EarlyStoppingState,
    config: EarlyStoppingConfig
  ): { shouldStop: boolean; state: EarlyStoppingState; improved: boolean } {
    if (!config.enabled) {
      return { shouldStop: false, state, improved: false };
    }

    const improved = this.hasImproved(currentValue, state.bestValue, config);

    // Update improvement history
    const newHistory = [
      ...state.improvementHistory,
      {
        epoch: currentEpoch,
        value: currentValue,
        improved,
      },
    ];

    if (improved) {
      // Model improved
      return {
        shouldStop: false,
        state: {
          ...state,
          bestValue: currentValue,
          bestEpoch: currentEpoch,
          waitCount: 0,
          improvementHistory: newHistory,
        },
        improved: true,
      };
    } else {
      // No improvement
      const newWaitCount = state.waitCount + 1;
      const shouldStopNow = newWaitCount >= config.patience;

      return {
        shouldStop: shouldStopNow,
        state: {
          ...state,
          waitCount: newWaitCount,
          stopped: shouldStopNow,
          stoppedEpoch: shouldStopNow ? currentEpoch : null,
          improvementHistory: newHistory,
        },
        improved: false,
      };
    }
  },

  /**
   * Check if current value is an improvement
   */
  hasImproved(
    currentValue: number,
    bestValue: number,
    config: EarlyStoppingConfig
  ): boolean {
    if (config.mode === 'max') {
      return currentValue > bestValue + config.minDelta;
    } else {
      return currentValue < bestValue - config.minDelta;
    }
  },

  /**
   * Get early stopping result
   */
  getResult(
    state: EarlyStoppingState,
    totalEpochs: number,
    config: EarlyStoppingConfig
  ): EarlyStoppingResult {
    const epochsSaved = state.stopped && state.stoppedEpoch
      ? totalEpochs - state.stoppedEpoch
      : 0;

    let reason = '';
    if (state.stopped) {
      reason = `Training stopped early at epoch ${state.stoppedEpoch}. No improvement in ${config.monitorMetric} for ${config.patience} consecutive epochs.`;
    } else {
      reason = 'Training completed all epochs';
    }

    return {
      shouldStop: state.stopped,
      reason,
      epochsSaved,
      bestEpoch: state.bestEpoch,
      bestValue: state.bestValue,
      totalWaitEpochs: state.waitCount,
    };
  },

  /**
   * Get default configuration
   */
  getDefaultConfig(): EarlyStoppingConfig {
    return {
      enabled: true,
      patience: 5,
      minDelta: 0.001,
      monitorMetric: 'val_accuracy',
      mode: 'max',
      restoreBestWeights: true,
    };
  },

  /**
   * Get recommended patience based on total epochs
   */
  getRecommendedPatience(totalEpochs: number): number {
    if (totalEpochs <= 10) {
      return 3;
    } else if (totalEpochs <= 30) {
      return 5;
    } else if (totalEpochs <= 50) {
      return 7;
    } else {
      return 10;
    }
  },

  /**
   * Get explanation for early stopping
   */
  getExplanation(): string[] {
    return [
      'Early stopping monitors validation performance during training',
      'If the model stops improving for a certain number of epochs (patience), training stops automatically',
      'This prevents overfitting by stopping before the model memorizes the training data',
      'It also saves training time by not running unnecessary epochs',
      'The best model weights from the epoch with best validation performance are restored',
    ];
  },

  /**
   * Get patience explanation
   */
  getPatienceExplanation(patience: number): string {
    if (patience <= 3) {
      return 'Low patience: Stops quickly if no improvement. Good for fast experimentation but may stop too early.';
    } else if (patience <= 7) {
      return 'Moderate patience: Balanced approach. Gives the model time to improve while preventing excessive training.';
    } else {
      return 'High patience: Waits longer for improvement. Good for complex models that improve slowly.';
    }
  },

  /**
   * Get min delta explanation
   */
  getMinDeltaExplanation(minDelta: number): string {
    if (minDelta < 0.001) {
      return 'Very sensitive: Considers tiny improvements as progress. May train longer than necessary.';
    } else if (minDelta <= 0.01) {
      return 'Moderate sensitivity: Requires meaningful improvement to continue. Good default setting.';
    } else {
      return 'Low sensitivity: Requires significant improvement. May stop too early for gradual improvements.';
    }
  },

  /**
   * Estimate time saved
   */
  estimateTimeSaved(epochsSaved: number, avgEpochTime: number): {
    seconds: number;
    formatted: string;
  } {
    const seconds = epochsSaved * avgEpochTime;
    
    if (seconds < 60) {
      return {
        seconds,
        formatted: `${seconds.toFixed(0)} seconds`,
      };
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return {
        seconds,
        formatted: `${minutes}m ${remainingSeconds}s`,
      };
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return {
        seconds,
        formatted: `${hours}h ${minutes}m`,
      };
    }
  },

  /**
   * Analyze improvement pattern
   */
  analyzeImprovementPattern(history: EarlyStoppingState['improvementHistory']): {
    totalImprovements: number;
    improvementRate: number;
    lastImprovementEpoch: number;
    plateauLength: number;
  } {
    const totalImprovements = history.filter(h => h.improved).length;
    const improvementRate = history.length > 0 ? totalImprovements / history.length : 0;
    
    const lastImprovement = history.slice().reverse().find(h => h.improved);
    const lastImprovementEpoch = lastImprovement ? lastImprovement.epoch : 0;
    
    const plateauLength = history.length > 0 
      ? history[history.length - 1].epoch - lastImprovementEpoch
      : 0;

    return {
      totalImprovements,
      improvementRate,
      lastImprovementEpoch,
      plateauLength,
    };
  },
};
