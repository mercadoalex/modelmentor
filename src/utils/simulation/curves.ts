// src/utils/simulation/curves.ts
// Loss and accuracy curve generation functions

import type { BaseParameters, SimulationConfig } from './types';

/**
 * Clamp a value to [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate the training loss curve based on the learning rate regime.
 *
 * Regimes:
 * - Diverging: LR > divergenceThreshold → exponential growth
 * - Oscillating: LR in oscillation range → sinusoidal fluctuations
 * - Converging: LR in optimal range → exponential decay
 * - Slow: LR < 10% of optimal → reduced rate decay
 */
export function generateLossCurve(
  params: BaseParameters,
  config: SimulationConfig,
  rng: () => number
): number[] {
  const { epochs, learningRate } = config;
  const {
    optimalLR,
    divergenceThreshold,
    oscillationRange,
    noiseFloor,
    noiseAmplitude,
    convergenceRate,
  } = params;

  const initialLoss = 2.5; // Starting loss for a fresh model
  const losses: number[] = [];

  for (let t = 0; t < epochs; t++) {
    let loss: number;
    const noise = (rng() - 0.5) * 2 * noiseAmplitude;

    if (learningRate > divergenceThreshold) {
      // Diverging: monotonically increasing loss
      loss = initialLoss * Math.pow(1 + 0.1 * t, 1.5);
    } else if (learningRate >= oscillationRange[0] && learningRate <= oscillationRange[1]) {
      // Oscillating: sinusoidal fluctuations that don't converge
      const targetLoss = noiseFloor + (initialLoss - noiseFloor) * 0.5;
      const amplitude = (initialLoss - noiseFloor) * 0.3;
      const period = Math.max(4, epochs / 5);
      const dampingFactor = 1 - 0.1 * (t / epochs); // Very slow damping — doesn't converge
      loss = targetLoss + amplitude * Math.sin((2 * Math.PI * t) / period) * dampingFactor;
    } else if (learningRate < optimalLR * 0.1) {
      // Slow convergence: reduced convergence rate (20% of normal)
      loss = noiseFloor + (initialLoss - noiseFloor) * Math.exp(-convergenceRate * 0.2 * t) + noise;
    } else {
      // Converging: exponential decay toward noise floor
      loss = noiseFloor + (initialLoss - noiseFloor) * Math.exp(-convergenceRate * t) + noise;
    }

    losses.push(clamp(loss, 0, 100));
  }

  return losses;
}

/**
 * Generate the training accuracy curve derived inversely from the loss curve.
 * Accuracy is capped at maxAccuracy.
 */
export function generateAccuracyCurve(
  lossCurve: number[],
  params: BaseParameters,
  config: SimulationConfig,
  rng: () => number
): number[] {
  const { maxAccuracy, noiseAmplitude, noiseFloor } = params;
  const initialLoss = 2.5;

  return lossCurve.map((loss) => {
    // Inverse relationship: lower loss → higher accuracy
    const normalizedProgress = 1 - (loss - noiseFloor) / (initialLoss - noiseFloor + 0.001);
    const baseAccuracy = Math.max(0, normalizedProgress) * maxAccuracy;
    const noise = (rng() - 0.5) * noiseAmplitude * 0.3;
    return clamp(baseAccuracy + noise, 0, 1);
  });
}

/**
 * Generate validation loss and accuracy curves.
 * Validation curves diverge from training curves after overfitting onset.
 */
export function generateValidationCurves(
  trainLoss: number[],
  trainAccuracy: number[],
  params: BaseParameters,
  config: SimulationConfig,
  rng: () => number
): { valLoss: number[]; valAccuracy: number[] } {
  const { overfittingOnset, maxAccuracy, noiseAmplitude } = params;
  const baseGap = 0.05; // Base generalization gap
  const overfitRate = 0.02;

  const valLoss: number[] = [];
  const valAccuracy: number[] = [];

  for (let t = 0; t < trainLoss.length; t++) {
    const noise = (rng() - 0.5) * noiseAmplitude * 0.5;

    // Generalization gap increases after overfitting onset
    let generalizationGap: number;
    if (t < overfittingOnset) {
      generalizationGap = baseGap;
    } else {
      generalizationGap = baseGap + overfitRate * Math.pow(t - overfittingOnset, 1.2);
    }

    const vLoss = trainLoss[t] + generalizationGap + noise;
    valLoss.push(clamp(vLoss, 0, 100));

    // Validation accuracy: inversely related to val_loss, capped at maxAccuracy
    // After overfitting onset, val_accuracy peaks then declines
    let vAcc: number;
    if (t < overfittingOnset) {
      vAcc = trainAccuracy[t] - baseGap * 0.5 + (rng() - 0.5) * noiseAmplitude * 0.2;
    } else {
      // Decline after overfitting onset
      const decline = 0.005 * Math.pow(t - overfittingOnset, 1.1);
      const peakAcc = trainAccuracy[Math.floor(overfittingOnset)] ?? trainAccuracy[trainAccuracy.length - 1];
      vAcc = peakAcc - decline + (rng() - 0.5) * noiseAmplitude * 0.2;
    }

    valAccuracy.push(clamp(Math.min(vAcc, maxAccuracy), 0, 1));
  }

  return { valLoss, valAccuracy };
}
