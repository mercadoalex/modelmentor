// src/utils/simulation/diagnostics.ts
// Diagnostics, final metrics, and per-class metrics computation

import type { EpochMetrics, FinalMetrics, PerClassMetrics, Diagnostics, BaseParameters, SimulationConfig } from './types';

/**
 * Compute diagnostics from the epoch metrics array.
 */
export function computeDiagnostics(metrics: EpochMetrics[]): Diagnostics {
  if (metrics.length === 0) {
    return { isOverfitting: false, isUnderfitting: false, isDiverging: false, isOscillating: false };
  }

  const last = metrics[metrics.length - 1];
  const len = metrics.length;

  // ── isOverfitting: val_accuracy declining while train_accuracy rising ──────
  let isOverfitting = false;
  if (len >= 5) {
    const recentTrain = metrics.slice(-5).map(m => m.accuracy);
    const recentVal = metrics.slice(-5).map(m => m.val_accuracy);
    const trainRising = recentTrain[recentTrain.length - 1] > recentTrain[0];
    const valDeclining = recentVal[recentVal.length - 1] < recentVal[0];
    isOverfitting = trainRising && valDeclining;
  }

  // ── isUnderfitting: both train and val accuracy below 75% at final epoch ───
  const isUnderfitting = last.accuracy < 0.75 && last.val_accuracy < 0.75;

  // ── isDiverging: loss increasing over last 5 epochs ────────────────────────
  let isDiverging = false;
  if (len >= 5) {
    const recentLoss = metrics.slice(-5).map(m => m.loss);
    isDiverging = recentLoss.every((val, i) => i === 0 || val >= recentLoss[i - 1] * 0.99);
  }

  // ── isOscillating: 3+ sign changes in loss derivative ─────────────────────
  let signChanges = 0;
  for (let i = 2; i < len; i++) {
    const prevDelta = metrics[i - 1].loss - metrics[i - 2].loss;
    const currDelta = metrics[i].loss - metrics[i - 1].loss;
    if ((prevDelta > 0 && currDelta < 0) || (prevDelta < 0 && currDelta > 0)) {
      signChanges++;
    }
  }
  const isOscillating = signChanges >= 3;

  return { isOverfitting, isUnderfitting, isDiverging, isOscillating };
}

/**
 * Compute final metrics from the last epoch.
 */
export function computeFinalMetrics(metrics: EpochMetrics[], params: BaseParameters): FinalMetrics {
  if (metrics.length === 0) {
    return { accuracy: 0, loss: 0, precision: 0, recall: 0, f1_score: 0 };
  }

  const last = metrics[metrics.length - 1];
  const accuracy = last.val_accuracy;
  const loss = last.val_loss;

  // Derive precision and recall from accuracy with slight variation
  // In a balanced scenario, precision ≈ recall ≈ accuracy
  const precision = Math.min(1, accuracy * 1.02);
  const recall = Math.min(1, accuracy * 0.98);
  const f1_score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { accuracy, loss, precision, recall, f1_score };
}

/**
 * Compute per-class metrics based on class imbalance ratio.
 * - Majority class gets inflated metrics
 * - Minority class gets degraded metrics
 * - Balanced datasets produce uniform per-class metrics
 */
export function computePerClassMetrics(
  finalMetrics: FinalMetrics,
  config: SimulationConfig
): PerClassMetrics[] {
  const { classImbalanceRatio } = config;
  const baseAccuracy = finalMetrics.accuracy;

  // For simplicity, model as 2 classes: majority and minority
  const classes: PerClassMetrics[] = [];

  if (classImbalanceRatio < 2) {
    // Balanced: uniform per-class metrics within 0.10 of overall accuracy
    classes.push({
      className: 'class_0',
      precision: Math.min(1, baseAccuracy + 0.02),
      recall: Math.min(1, baseAccuracy + 0.01),
      f1: Math.min(1, baseAccuracy + 0.015),
    });
    classes.push({
      className: 'class_1',
      precision: Math.min(1, baseAccuracy - 0.02),
      recall: Math.min(1, baseAccuracy - 0.01),
      f1: Math.min(1, baseAccuracy - 0.015),
    });
  } else {
    // Imbalanced: majority class inflated, minority class degraded
    const imbalanceLog = Math.log2(classImbalanceRatio);

    // Majority class: inflated metrics
    const majorityPrecision = Math.min(1, baseAccuracy + 0.05 * imbalanceLog);
    const majorityRecall = Math.min(1, baseAccuracy + 0.08 * imbalanceLog);
    const majorityF1 = majorityPrecision + majorityRecall > 0
      ? (2 * majorityPrecision * majorityRecall) / (majorityPrecision + majorityRecall)
      : 0;

    classes.push({
      className: 'majority_class',
      precision: majorityPrecision,
      recall: majorityRecall,
      f1: majorityF1,
    });

    // Minority class: degraded metrics proportional to imbalance
    // When ratio > 5: recall < 0.40
    // When ratio > 10: precision < 0.50, recall < 0.25
    const minorityRecall = Math.max(0, 0.6 - 0.12 * imbalanceLog);
    const minorityPrecision = Math.max(0, 0.7 - 0.08 * imbalanceLog);
    const minorityF1 = minorityPrecision + minorityRecall > 0
      ? (2 * minorityPrecision * minorityRecall) / (minorityPrecision + minorityRecall)
      : 0;

    classes.push({
      className: 'minority_class',
      precision: minorityPrecision,
      recall: minorityRecall,
      f1: minorityF1,
    });
  }

  return classes;
}
