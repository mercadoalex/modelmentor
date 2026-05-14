// src/utils/simulation/index.ts
// Barrel export for the simulation module

export { simulateTraining } from './engine';
export { createSimulationRunner } from './adapter';
export { computeBaseParameters } from './parameters';
export { generateLossCurve, generateAccuracyCurve, generateValidationCurves } from './curves';
export { computeDiagnostics, computeFinalMetrics, computePerClassMetrics } from './diagnostics';
export { createRng, generateSeed, mulberry32 } from './rng';

export type {
  OptimizerType,
  ModelComplexity,
  SimulationConfig,
  EpochMetrics,
  FinalMetrics,
  PerClassMetrics,
  Diagnostics,
  SimulationResult,
  BaseParameters,
} from './types';

export type {
  SimulationCallbacks,
  SimulationRunnerOptions,
  SimulationRunner,
} from './adapter';
