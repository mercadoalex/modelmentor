# Implementation Plan: Browser Real Training (Level 2)

## Overview

This plan implements real TensorFlow.js model training for authenticated users while preserving the existing Level 1 simulation for unauthenticated users. The implementation follows the module structure defined in the design (`src/utils/tfTraining/`), building incrementally from types and infrastructure through preprocessing, model builders, the training engine, persistence, orchestration, and finally page integration.

All code is TypeScript. The project uses vitest for testing and will add `fast-check` for property-based tests.

## Tasks

- [x] 1. Types and infrastructure setup
  - [x] 1.1 Create shared type definitions (`src/utils/tfTraining/types.ts`)
    - Define `TrainingRequest`, `TrainingResult`, `TrainingConfig`, `TrainingCallbacks`, `TrainingStatus`, `TrainingRunner` interfaces
    - Define `EpochLogs`, `DeviceCapabilities`, `StoredModelMetadata`, `PreprocessingMetadata` interfaces
    - Define `ModelBuilderOptions`, `TFModule`, `LoaderStatus` types
    - Export all types from barrel `src/utils/tfTraining/index.ts`
    - _Requirements: 1.1, 1.2, 7.1, 8.3_

  - [x] 1.2 Implement dynamic TensorFlow.js loader (`src/utils/tfTraining/dynamicLoader.ts`)
    - Implement `loadTensorFlow()` using dynamic `import('@tensorflow/tfjs')` with module caching
    - Implement `getTFStatus()` and `isTFLoaded()` helper functions
    - Cache the module reference after first successful load so subsequent calls return immediately
    - Handle network errors by rejecting with a descriptive error
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 1.3 Implement device capability detector (`src/utils/tfTraining/deviceCapability.ts`)
    - Implement `detectCapabilities(tf)` that checks WebGL via `tf.env().get('WEBGL_VERSION')`
    - Use `navigator.deviceMemory` with fallback heuristic for memory estimation
    - Set `maxParameters` to 50,000 and `maxSamples` to 500 on low-memory devices (< 2GB)
    - Populate `warnings` array and determine `recommendedBackend`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 1.4 Write property tests for dynamic loader caching (Property 2)
    - **Property 2: Dynamic loader caching**
    - Verify that N calls (N ≥ 2) to `loadTensorFlow()` trigger only one import and resolve to the same reference
    - **Validates: Requirements 2.5**

  - [ ]* 1.5 Write property tests for device capability constraints (Property 13)
    - **Property 13: Device capability memory-based constraints**
    - For memory < 2GB, verify `maxParameters` = 50,000 and warnings array is non-empty
    - For memory ≥ 2GB, verify no such constraint is applied
    - **Validates: Requirements 9.3, 9.4**

- [x] 2. Data preprocessors
  - [x] 2.1 Implement normalization preprocessor (`src/utils/tfTraining/preprocessing/normalization.ts`)
    - Implement `normalizeFeatures(tf, data)` returning tensor, mean, and std arrays
    - Implement `normalizeTargets(tf, targets)` for regression target normalization
    - Implement `denormalize(value, mean, std)` utility for prediction denormalization
    - Handle edge case of constant features (std = 0) by setting std to 1
    - _Requirements: 3.2, 4.2, 4.5_

  - [ ]* 2.2 Write property tests for normalization (Properties 3, 4)
    - **Property 3: Normalization produces zero mean and unit variance**
    - For datasets with ≥ 2 distinct values per feature, verify column means ≈ 0 (±1e-5) and stds ≈ 1 (±1e-5)
    - **Validates: Requirements 3.2, 4.2**
    - **Property 4: Normalization round-trip preserves data**
    - Verify normalizing then denormalizing recovers original values within ±1e-6
    - **Validates: Requirements 4.5**

  - [x] 2.3 Implement label encoding preprocessor (`src/utils/tfTraining/preprocessing/labelEncoding.ts`)
    - Implement `encodeLabels(tf, labels)` returning one-hot tensor, labelMap, and numClasses
    - Use one-hot encoding for multi-class (K ≥ 3) and binary encoding for two-class
    - _Requirements: 3.3_

  - [ ]* 2.4 Write property tests for one-hot encoding (Property 5)
    - **Property 5: One-hot encoding correctness**
    - For K unique classes (K ≥ 2), verify output shape [N, K], each row has exactly one 1, row sums equal 1
    - **Validates: Requirements 3.3**

  - [x] 2.5 Implement tokenization preprocessor (`src/utils/tfTraining/preprocessing/tokenization.ts`)
    - Implement `tokenizeTexts(tf, texts, maxVocab?, maxLength?)` with whitespace splitting
    - Build vocabulary from training data, limit to 1000 words max
    - Pad or truncate all sequences to maxLength (default 100)
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ]* 2.6 Write property tests for tokenization (Properties 7, 8)
    - **Property 7: Tokenization output shape and vocabulary constraints**
    - Verify output sequences have exactly `maxLength` elements and vocab ≤ 1000 entries
    - **Validates: Requirements 5.3, 5.4**
    - **Property 8: Tokenization vocabulary consistency**
    - Verify every non-zero index maps back to a word in the input corpus
    - **Validates: Requirements 5.2**

  - [x] 2.7 Implement image resize preprocessor (`src/utils/tfTraining/preprocessing/imageResize.ts`)
    - Implement `preprocessImages(tf, images)` that resizes to 224×224 and normalizes to [0, 1]
    - Return tensor of shape [batch, 224, 224, 3]
    - _Requirements: 6.3_

  - [ ]* 2.8 Write property tests for image preprocessing (Property 9)
    - **Property 9: Image preprocessing output invariants**
    - For arbitrary input dimensions, verify output shape [224, 224, 3] and pixel values in [0, 1]
    - **Validates: Requirements 6.3**

  - [x] 2.9 Create preprocessing barrel export (`src/utils/tfTraining/preprocessing/index.ts`)
    - Export all preprocessors from a single entry point
    - _Requirements: 3.2, 5.2, 6.3_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Model builders
  - [x] 4.1 Implement classification model builder (`src/utils/tfTraining/modelBuilders/classification.ts`)
    - Implement `buildClassificationModel(tf, opts)` with architecture: Input → Dense(64, ReLU) → Dense(32, ReLU) → Dense(numClasses, Softmax)
    - Compile with user-specified optimizer and learning rate, using categoricalCrossentropy loss
    - _Requirements: 3.1, 3.5_

  - [x] 4.2 Implement regression model builder (`src/utils/tfTraining/modelBuilders/regression.ts`)
    - Implement `buildRegressionModel(tf, opts)` with architecture: Input → Dense(64, ReLU) → Dense(32, ReLU) → Dense(1, Linear)
    - Compile with meanSquaredError loss
    - _Requirements: 4.1, 4.3_

  - [x] 4.3 Implement text classification model builder (`src/utils/tfTraining/modelBuilders/textClassification.ts`)
    - Implement `buildTextClassificationModel(tf, opts)` with architecture: Embedding(vocabSize, 32) → GlobalAveragePooling → Dense(16, ReLU) → Dense(numClasses, Softmax)
    - _Requirements: 5.1_

  - [x] 4.4 Implement image classification model builder (`src/utils/tfTraining/modelBuilders/imageClassification.ts`)
    - Implement `buildImageClassificationModel(tf, opts)` that loads MobileNet, freezes base layers, adds GlobalAveragePooling → Dense(numClasses, Softmax)
    - Implement fallback to Conv2D → MaxPool → Flatten → Dense if MobileNet fails to load
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ]* 4.5 Write property tests for model architecture invariants (Property 6)
    - **Property 6: Model architecture invariants**
    - For random inputShape and numClasses, verify classification layers are [64, 32, numClasses] with [relu, relu, softmax]
    - Verify regression layers are [64, 32, 1] with [relu, relu, linear]
    - Verify text model has Embedding → GlobalAveragePooling → Dense(16, relu) → Dense(numClasses, softmax)
    - **Validates: Requirements 3.1, 4.1, 5.1**

  - [x] 4.6 Create model builders barrel export (`src/utils/tfTraining/modelBuilders/index.ts`)
    - Export all builders and create a builder registry that selects the correct builder by modelType
    - _Requirements: 3.1, 4.1, 5.1, 6.1_

- [ ] 5. Epoch reporter and model registry
  - [x] 5.1 Implement epoch reporter (`src/utils/tfTraining/epochReporter.ts`)
    - Implement `createEpochReporter(config)` that formats TF.js logs into `{loss, acc, val_loss, val_acc}`
    - Replace NaN/Infinity with 0 before dispatching
    - Compute pseudo-accuracy for regression as `max(0, 1 - normalizedMSE)`
    - Track elapsed time and compute ETA per epoch
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 5.2 Write property tests for epoch reporter (Properties 10, 11, 12)
    - **Property 10: Epoch reporter metric sanitization**
    - For any numeric value (NaN, Infinity, -Infinity, finite), verify output is always finite, non-finite replaced with 0
    - **Validates: Requirements 7.5**
    - **Property 11: Epoch reporter format compatibility**
    - For any TF.js log object, verify output has exactly keys {loss, acc, val_loss, val_acc} with finite values
    - **Validates: Requirements 7.1, 7.2**
    - **Property 12: Pseudo-accuracy derivation for regression**
    - For any non-negative MSE, verify pseudo-accuracy = max(0, 1 - normalizedMSE) and is in [0, 1]
    - **Validates: Requirements 4.4**

  - [x] 5.3 Implement model registry (`src/utils/tfTraining/modelRegistry.ts`)
    - Implement `saveModel(entry)` that saves model to `indexeddb://modelmentor-{projectId}` and metadata to localStorage
    - Implement `loadModel(projectId)` that retrieves model and metadata
    - Implement `hasModel(projectId)` and `deleteModel(projectId)` utilities
    - Handle IndexedDB quota exceeded and private browsing fallbacks
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 5.4 Write property tests for model registry (Properties 17, 18)
    - **Property 17: Model registry metadata round-trip**
    - For any valid `PreprocessingMetadata`, verify save then load produces deeply equal object
    - **Validates: Requirements 8.3**
    - **Property 18: Model registry key format**
    - For any projectId string, verify storage key matches pattern `modelmentor-{projectId}`
    - **Validates: Requirements 8.6**

- [ ] 6. TF Engine (core training loop)
  - [x] 6.1 Implement TF Engine (`src/utils/tfTraining/tfEngine.ts`)
    - Implement `createTFEngine(config)` returning `{ start, cancel }` handle
    - Orchestrate: preprocess data → build model → compile → train with per-epoch callbacks
    - Check cancellation flag between epochs; on cancel, dispose all tensors and return partial result
    - Wrap training loop in try/finally for tensor cleanup guarantees
    - Batch dataset processing to avoid blocking main thread > 100ms
    - _Requirements: 3.4, 10.1, 10.2, 10.5, 11.1, 11.5_

  - [ ]* 6.2 Write property tests for cancellation (Properties 14, 15, 16)
    - **Property 14: Cancellation stops training within one epoch**
    - Verify no further onEpochEnd callbacks after cancel() is called
    - **Validates: Requirements 10.1**
    - **Property 15: Cancelled training does not persist model**
    - Verify Model Registry has no model for the project after cancellation
    - **Validates: Requirements 10.4**
    - **Property 16: Tensor cleanup after cancellation**
    - Verify live tensor count after cleanup ≤ count before training (tolerance of 5)
    - **Validates: Requirements 10.2**

- [ ] 7. Training orchestrator (auth gate)
  - [x] 7.1 Implement training orchestrator (`src/utils/tfTraining/orchestrator.ts`)
    - Implement `createTrainingRunner(request, callbacks, isAuthenticated)` that routes to simulation or TF engine
    - When `isAuthenticated` is false, delegate to `createSimulationRunner`
    - When `isAuthenticated` is true, load TF.js → detect capabilities → start TF engine
    - If TF.js load fails or device is incapable, fall back to simulation with status notification
    - Emit `TrainingStatus` updates via `onStatusChange` callback
    - Register cleanup function for component unmount
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.3, 2.4_

  - [ ]* 7.2 Write property tests for authentication routing (Property 1)
    - **Property 1: Authentication-based routing**
    - For any training request, verify unauthenticated routes to simulation and authenticated routes to TF engine
    - **Validates: Requirements 1.1, 1.2**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. TrainingPage integration
  - [x] 9.1 Update TrainingPage to use the training orchestrator
    - Replace direct `createSimulationRunner` usage with `createTrainingRunner` from the orchestrator
    - Pass `isAuthenticated` from `useAuth()` context to the orchestrator
    - Wire `onStatusChange` callback to display loading/training/fallback status indicators
    - Show "Real Training" or "Simulation" badge based on training status
    - _Requirements: 1.1, 1.2, 1.5, 2.3_

  - [x] 9.2 Add training status UI indicators to TrainingPage
    - Display TF.js loading progress with estimated size when `status.type === 'loading_tf'`
    - Show device capability check status
    - Display fallback-to-simulation notification with reason when applicable
    - Add `beforeunload` handler that triggers cancellation and tensor disposal
    - _Requirements: 2.3, 9.2, 9.3, 10.3_

- [x] 10. TestingPage integration (real predictions)
  - [x] 10.1 Integrate model registry with TestingPage for real predictions
    - Import `loadModel` from model registry
    - On page load, check `hasModel(projectId)` and load the trained model if available
    - Display "No trained model" message with link to training page when model is not found
    - _Requirements: 8.4, 8.5_

  - [x] 10.2 Implement real prediction pipeline on TestingPage
    - Accept user input (text, numeric features, or image depending on model type)
    - Preprocess input using stored `PreprocessingMetadata` (normalize, tokenize, or resize)
    - Run `model.predict()` on preprocessed input
    - Denormalize regression outputs; decode classification outputs using stored labelMap
    - Display prediction results in the existing UI components
    - _Requirements: 4.5, 8.3, 8.4_

- [ ] 11. Install fast-check and set up property test infrastructure
  - [ ]* 11.1 Install fast-check and create test helpers
    - Add `fast-check` as a dev dependency
    - Create `src/utils/tfTraining/__tests__/helpers.ts` with shared generators for property tests
    - Create generators for random TrainingRequest, PreprocessingMetadata, numeric arrays, text arrays
    - Configure vitest timeout to 30s for property test files
    - _Requirements: All properties_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 18 universal correctness properties defined in the design
- Unit tests validate specific examples and edge cases
- TensorFlow.js is already in `package.json` (`@tensorflow/tfjs: ^4.22.0`) — no install needed
- The existing `createSimulationRunner` callback contract (`{loss, acc, val_loss, val_acc}`) is the target format for the epoch reporter
- `fast-check` needs to be added as a dev dependency for property-based tests
