// src/utils/simulation/parameters.ts
// Computes base parameters from a SimulationConfig

import type { SimulationConfig, BaseParameters } from './types';

/**
 * Compute base parameters that drive the simulation curves.
 * Uses multiplicative composition for maxAccuracy.
 */
export function computeBaseParameters(config: SimulationConfig): BaseParameters {
  const { learningRate, batchSize, optimizer, architecture, datasetSize, classImbalanceRatio, dataQualityScore } = config;

  // ── Optimal Learning Rate ──────────────────────────────────────────────────
  const complexityScale: Record<string, number> = { low: 3, medium: 1, high: 0.3 };
  const optimizerBase: Record<string, number> = { adam: 0.001, sgd: 0.01, rmsprop: 0.001 };

  const baseLR = optimizerBase[optimizer] ?? 0.001;
  const scale = complexityScale[architecture] ?? 1;
  const optimalLR = baseLR * scale;

  // ── Divergence & Oscillation thresholds ────────────────────────────────────
  const divergenceThreshold = optimalLR * 10;
  const oscillationRange: [number, number] = [optimalLR * 2, divergenceThreshold];

  // ── Maximum Achievable Accuracy (multiplicative composition) ───────────────
  const architectureCeiling: Record<string, number> = { low: 0.82, medium: 0.91, high: 0.97 };
  const ceiling = architectureCeiling[architecture] ?? 0.91;

  // Dataset size factor: capped at 0.7 when datasetSize < 100
  let datasetSizeFactor: number;
  if (datasetSize < 100) {
    datasetSizeFactor = 0.7;
  } else {
    datasetSizeFactor = Math.min(1.0, 0.7 + 0.3 * Math.log10(datasetSize) / Math.log10(10000));
  }

  // Data quality factor: when score > 0.9, factor = 1.0
  const dataQualityFactor = dataQualityScore > 0.9 ? 1.0 : 0.8 + 0.2 * dataQualityScore;

  // Class balance factor: clamped to [0.6, 1.0]
  const classBalanceFactor = Math.max(0.6, Math.min(1.0, 1.0 - 0.1 * Math.log2(Math.max(1, classImbalanceRatio))));

  const maxAccuracy = ceiling * datasetSizeFactor * dataQualityFactor * classBalanceFactor;

  // ── Noise Floor ────────────────────────────────────────────────────────────
  const noiseFloor = (1 - dataQualityScore) * 0.3 + Math.log2(Math.max(1, classImbalanceRatio)) * 0.05;

  // ── Noise Amplitude ────────────────────────────────────────────────────────
  const baseNoise = 0.15;
  const noiseAmplitude = (baseNoise / Math.sqrt(Math.max(1, batchSize))) * (1 + (1 - dataQualityScore));

  // ── Convergence Rate ───────────────────────────────────────────────────────
  const lrRatio = Math.min(2, learningRate / optimalLR);
  const baseLREffect = lrRatio > 1 ? 1 / lrRatio : lrRatio;
  const complexityFactor: Record<string, number> = { low: 1.5, medium: 1.0, high: 0.6 };
  const cFactor = complexityFactor[architecture] ?? 1.0;

  // Model parameters approximation based on complexity
  const modelParams: Record<string, number> = { low: 100, medium: 1000, high: 10000 };
  const params = modelParams[architecture] ?? 1000;
  const dataSufficiencyFactor = Math.min(1.0, datasetSize / (params * 10));

  const convergenceRate = baseLREffect * cFactor * dataSufficiencyFactor;

  // ── Convergence Epoch ──────────────────────────────────────────────────────
  // Approximate epoch where loss reaches within 10% of noise floor
  const convergenceEpoch = convergenceRate > 0 ? Math.ceil(3 / convergenceRate) : config.epochs;

  // ── Overfitting Onset ──────────────────────────────────────────────────────
  const dataSufficiencyRatio = datasetSize / (params * 10);
  const complexityMultiplier: Record<string, number> = { low: 0.8, medium: 1.0, high: 1.5 };
  const cMult = complexityMultiplier[architecture] ?? 1.0;
  const baseOnset = config.epochs * 0.5;
  const overfittingOnset = Math.max(5, Math.min(config.epochs, baseOnset * dataSufficiencyRatio * (1 / cMult)));

  return {
    optimalLR,
    divergenceThreshold,
    oscillationRange,
    convergenceEpoch,
    overfittingOnset,
    maxAccuracy,
    noiseFloor,
    noiseAmplitude,
    convergenceRate,
  };
}
