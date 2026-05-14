// src/utils/simulation/types.ts
// Core type definitions for the Smart Training Simulation engine

export type OptimizerType = 'adam' | 'sgd' | 'rmsprop';
export type ModelComplexity = 'low' | 'medium' | 'high';

export interface SimulationConfig {
  // Hyperparameters
  learningRate: number;        // e.g., 0.001
  batchSize: number;           // e.g., 32
  epochs: number;              // 1–200
  optimizer: OptimizerType;

  // Architecture
  architecture: ModelComplexity;

  // Dataset properties
  datasetSize: number;         // number of samples
  classImbalanceRatio: number; // e.g., 1.0 = balanced, 10.0 = 10:1 imbalance
  dataQualityScore: number;    // 0.0–1.0

  // Reproducibility
  seed?: number;               // optional; generated if omitted
}

export interface EpochMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  val_loss: number;
  val_accuracy: number;
}

export interface FinalMetrics {
  accuracy: number;
  loss: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface PerClassMetrics {
  className: string;
  precision: number;
  recall: number;
  f1: number;
}

export interface Diagnostics {
  isOverfitting: boolean;
  isUnderfitting: boolean;
  isDiverging: boolean;
  isOscillating: boolean;
}

export interface SimulationResult {
  metrics: EpochMetrics[];
  finalMetrics: FinalMetrics;
  perClassMetrics: PerClassMetrics[];
  diagnostics: Diagnostics;
  seed: number;
}

export interface BaseParameters {
  optimalLR: number;
  divergenceThreshold: number;
  oscillationRange: [number, number];
  convergenceEpoch: number;
  overfittingOnset: number;
  maxAccuracy: number;
  noiseFloor: number;
  noiseAmplitude: number;
  convergenceRate: number;
}
