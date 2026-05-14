// src/utils/simulation/engine.ts
// Main simulation orchestrator

import type { SimulationConfig, SimulationResult, EpochMetrics } from './types';
import { createRng, generateSeed } from './rng';
import { computeBaseParameters } from './parameters';
import { generateLossCurve, generateAccuracyCurve, generateValidationCurves } from './curves';
import { computeDiagnostics, computeFinalMetrics, computePerClassMetrics } from './diagnostics';

/**
 * Validate and clamp all input parameters to valid ranges.
 * The function never throws — it always returns a valid config.
 */
function validateConfig(config: SimulationConfig): SimulationConfig {
  return {
    learningRate: Math.max(0.000001, Math.min(10, config.learningRate)),
    batchSize: Math.max(1, Math.min(4096, Math.floor(config.batchSize))),
    epochs: Math.max(1, Math.min(200, Math.floor(config.epochs))),
    optimizer: (['adam', 'sgd', 'rmsprop'].includes(config.optimizer) ? config.optimizer : 'adam') as SimulationConfig['optimizer'],
    architecture: (['low', 'medium', 'high'].includes(config.architecture) ? config.architecture : 'medium') as SimulationConfig['architecture'],
    datasetSize: Math.max(10, Math.floor(config.datasetSize)),
    classImbalanceRatio: Math.max(1.0, config.classImbalanceRatio),
    dataQualityScore: Math.max(0, Math.min(1, config.dataQualityScore)),
    seed: config.seed !== undefined ? Math.floor(config.seed) : undefined,
  };
}

/**
 * Run the full training simulation.
 * Pure function: no side effects, deterministic given a seed.
 *
 * @param config - The simulation configuration
 * @returns Complete simulation result with all metrics
 */
export function simulateTraining(config: SimulationConfig): SimulationResult {
  // Validate and clamp inputs
  const validConfig = validateConfig(config);

  // Generate or use provided seed
  const seed = validConfig.seed ?? generateSeed();
  const rng = createRng(seed);

  // Compute base parameters
  const params = computeBaseParameters(validConfig);

  // Generate training loss curve
  const trainLoss = generateLossCurve(params, validConfig, rng);

  // Generate training accuracy curve
  const trainAccuracy = generateAccuracyCurve(trainLoss, params, validConfig, rng);

  // Generate validation curves
  const { valLoss, valAccuracy } = generateValidationCurves(
    trainLoss, trainAccuracy, params, validConfig, rng
  );

  // Assemble epoch metrics
  const metrics: EpochMetrics[] = trainLoss.map((loss, i) => ({
    epoch: i + 1,
    loss,
    accuracy: trainAccuracy[i],
    val_loss: valLoss[i],
    val_accuracy: valAccuracy[i],
  }));

  // Compute diagnostics
  const diagnostics = computeDiagnostics(metrics);

  // Compute final metrics
  const finalMetrics = computeFinalMetrics(metrics, params);

  // Compute per-class metrics
  const perClassMetrics = computePerClassMetrics(finalMetrics, validConfig);

  return {
    metrics,
    finalMetrics,
    perClassMetrics,
    diagnostics,
    seed,
  };
}
