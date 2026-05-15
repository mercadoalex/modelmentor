// src/utils/tfTraining/index.ts
// Public API barrel export for the Browser Real Training module

// Types
export type {
  TrainingRequest,
  TrainingResult,
  TrainingConfig,
  TrainingCallbacks,
  TrainingStatus,
  TrainingRunner,
  EpochLogs,
  DeviceCapabilities,
  StoredModelMetadata,
  PreprocessingMetadata,
  ModelBuilderOptions,
  TFModule,
  LoaderStatus,
  ModelRegistryEntry,
  DataPoint,
  OptimizerType,
} from './types';

// Orchestrator (main entry point)
export { createTrainingRunner } from './orchestrator';

// Dynamic loader
export { loadTensorFlow, getTFStatus, isTFLoaded } from './dynamicLoader';

// Device capability detection
export { detectCapabilities } from './deviceCapability';

// TF Engine
export { createTFEngine } from './tfEngine';
export type { TFEngineConfig, TFEngineHandle } from './tfEngine';

// Epoch reporter
export { createEpochReporter, sanitizeMetric, computePseudoAccuracy } from './epochReporter';

// Model registry
export { saveModel, loadModel, hasModel, deleteModel, getModelStorageKey, getMetadataStorageKey } from './modelRegistry';

// Model builders
export { buildModel, modelBuilderRegistry } from './modelBuilders';
export { buildClassificationModel } from './modelBuilders/classification';
export { buildRegressionModel } from './modelBuilders/regression';
export { buildTextClassificationModel } from './modelBuilders/textClassification';
export { buildImageClassificationModel } from './modelBuilders/imageClassification';

// Preprocessing
export { normalizeFeatures, normalizeTargets, denormalize } from './preprocessing/normalization';
export { encodeLabels } from './preprocessing/labelEncoding';
export { tokenizeTexts } from './preprocessing/tokenization';
export { preprocessImages, preprocessImageTensor } from './preprocessing/imageResize';
