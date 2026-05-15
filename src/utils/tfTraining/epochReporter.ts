// src/utils/tfTraining/epochReporter.ts
// Formats TF.js callback logs into the standard format expected by TrainingPage

import type { EpochLogs, TrainingResult, PreprocessingMetadata } from './types';

export interface EpochReporterConfig {
  totalEpochs: number;
  modelType: 'classification' | 'regression' | 'text_classification' | 'image_classification';
  onEpochEnd: (epoch: number, logs: EpochLogs) => void;
  onComplete: (result: TrainingResult) => void;
}

/**
 * Sanitizes a numeric value, replacing NaN and Infinity with 0.
 */
export function sanitizeMetric(value: unknown): number {
  if (typeof value !== 'number' || !isFinite(value)) {
    return 0;
  }
  return value;
}

/**
 * Computes pseudo-accuracy for regression models.
 * Formula: max(0, 1 - normalizedMSE)
 * Result is always in [0, 1].
 */
export function computePseudoAccuracy(mse: number): number {
  if (!isFinite(mse) || mse < 0) {
    return 0;
  }
  return Math.max(0, 1 - mse);
}

/**
 * Creates an epoch reporter that formats TF.js logs into the standard
 * {loss, acc, val_loss, val_acc} format and dispatches callbacks.
 */
export function createEpochReporter(config: EpochReporterConfig) {
  const { totalEpochs, modelType, onEpochEnd, onComplete } = config;
  const allMetrics: EpochLogs[] = [];
  const startTime = Date.now();

  /**
   * Handles a single epoch's logs from TensorFlow.js.
   * Maps TF.js log keys to the standard format and sanitizes values.
   */
  function handleEpoch(epoch: number, tfLogs: Record<string, any>): void {
    const isRegression = modelType === 'regression';

    let loss = sanitizeMetric(tfLogs.loss);
    let acc: number;
    let valLoss = sanitizeMetric(tfLogs.val_loss);
    let valAcc: number;

    if (isRegression) {
      // For regression, derive pseudo-accuracy from MSE
      const mse = sanitizeMetric(tfLogs.mse ?? tfLogs.loss);
      const valMse = sanitizeMetric(tfLogs.val_mse ?? tfLogs.val_loss);
      acc = computePseudoAccuracy(mse);
      valAcc = computePseudoAccuracy(valMse);
    } else {
      // For classification, use accuracy directly
      acc = sanitizeMetric(tfLogs.acc ?? tfLogs.accuracy);
      valAcc = sanitizeMetric(tfLogs.val_acc ?? tfLogs.val_accuracy);
    }

    const logs: EpochLogs = {
      loss: sanitizeMetric(loss),
      acc: sanitizeMetric(acc),
      val_loss: sanitizeMetric(valLoss),
      val_acc: sanitizeMetric(valAcc),
    };

    allMetrics.push(logs);
    onEpochEnd(epoch, logs);
  }

  /**
   * Handles training completion. Formats the final result.
   */
  function handleComplete(model: any, metadata: PreprocessingMetadata): void {
    const durationMs = Date.now() - startTime;
    const finalLogs = allMetrics[allMetrics.length - 1] || {
      loss: 0,
      acc: 0,
      val_loss: 0,
      val_acc: 0,
    };

    const result: TrainingResult = {
      metrics: allMetrics,
      finalMetrics: {
        loss: finalLogs.loss,
        accuracy: finalLogs.acc,
        val_loss: finalLogs.val_loss,
        val_accuracy: finalLogs.val_acc,
      },
      model,
      metadata,
      cancelled: false,
      durationMs,
    };

    onComplete(result);
  }

  return {
    handleEpoch,
    handleComplete,
    getMetrics: () => [...allMetrics],
    getElapsedMs: () => Date.now() - startTime,
    getETA: (currentEpoch: number) => {
      const elapsed = Date.now() - startTime;
      if (currentEpoch === 0) return null;
      const msPerEpoch = elapsed / currentEpoch;
      const remaining = (totalEpochs - currentEpoch) * msPerEpoch;
      return Math.round(remaining);
    },
  };
}
