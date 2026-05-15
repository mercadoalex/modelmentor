// src/utils/tfTraining/types.ts
// Shared type definitions for the Browser Real Training module

export type OptimizerType = 'adam' | 'sgd' | 'rmsprop';

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: OptimizerType;
  validationSplit: number;
}

export interface TrainingRequest {
  modelType: 'classification' | 'regression' | 'text_classification' | 'image_classification';
  data: DataPoint[];
  config: TrainingConfig;
  projectId: string;
}

export interface DataPoint {
  features?: number[];
  label?: string | number;
  text?: string;
  imageDataUri?: string;
}

export interface EpochLogs {
  loss: number;
  acc: number;
  val_loss: number;
  val_acc: number;
}

export interface TrainingResult {
  metrics: EpochLogs[];
  finalMetrics: {
    loss: number;
    accuracy: number;
    val_loss: number;
    val_accuracy: number;
  };
  model: any | null; // tf.LayersModel or null if cancelled
  metadata: PreprocessingMetadata;
  cancelled: boolean;
  durationMs: number;
}

export interface TrainingCallbacks {
  onEpochEnd: (epoch: number, logs: EpochLogs) => void;
  onComplete: (result: TrainingResult) => void;
  onError: (error: Error) => void;
  onStatusChange: (status: TrainingStatus) => void;
}

export type TrainingStatus =
  | { type: 'loading_tf'; estimatedSizeMB: number }
  | { type: 'checking_device' }
  | { type: 'training'; isReal: boolean }
  | { type: 'fallback_to_simulation'; reason: string };

export interface TrainingRunner {
  start: () => Promise<void>;
  cancel: () => void;
}

export interface DeviceCapabilities {
  hasWebGL: boolean;
  estimatedMemoryGB: number | null;
  recommendedBackend: 'webgl' | 'cpu';
  maxParameters: number;
  maxSamples: number;
  warnings: string[];
}

export interface StoredModelMetadata {
  projectId: string;
  modelType: 'classification' | 'regression' | 'text_classification' | 'image_classification';
  trainedAt: string;
  epochs: number;
  finalAccuracy: number;
  finalLoss: number;
  preprocessing: PreprocessingMetadata;
}

export interface PreprocessingMetadata {
  normalization?: { mean: number[]; std: number[] };
  targetNormalization?: { mean: number; std: number };
  vocabulary?: Record<string, number>;
  maxSequenceLength?: number;
  labelMap?: Record<string, number>;
  numClasses?: number;
}

export interface ModelBuilderOptions {
  inputShape: number[];
  numClasses?: number;
  vocabSize?: number;
  maxSequenceLength?: number;
  learningRate: number;
  optimizer: OptimizerType;
}

export interface TFModule {
  tf: any; // dynamically imported @tensorflow/tfjs module
}

export interface LoaderStatus {
  state: 'idle' | 'loading' | 'loaded' | 'error';
  error?: Error;
}

export interface ModelRegistryEntry {
  model: any; // tf.LayersModel
  metadata: StoredModelMetadata;
}
