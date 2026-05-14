# Implementation Plan: Smart Training Simulation

## Overview

Implement a deterministic, physics-informed training simulation engine as a set of pure TypeScript modules under `src/utils/simulation/`. The engine computes realistic epoch-by-epoch metrics based on student-configured hyperparameters, dataset properties, and model architecture. It integrates with the existing `EnhancedTrainingPipeline` callback system and `TrainingPage` UI via an adapter that replays results with artificial delays.

## Tasks

- [ ] 1. Set up simulation module structure and core types
  - [ ] 1.1 Create `src/utils/simulation/types.ts` with all type definitions
    - Define `OptimizerType`, `ModelComplexity` type aliases
    - Define `SimulationConfig`, `EpochMetrics`, `FinalMetrics`, `PerClassMetrics`, `Diagnostics`, `SimulationResult` interfaces
    - Define `BaseParameters` interface (optimalLR, divergenceThreshold, oscillationRange, convergenceEpoch, overfittingOnset, maxAccuracy, noiseFloor, noiseAmplitude, convergenceRate)
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 1.2 Create `src/utils/simulation/rng.ts` with seeded PRNG
    - Implement `mulberry32` (Mulberry32 algorithm) returning a `() => number` closure
    - Implement `createRng(seed: number)` that guards against seed=0 (use seed=1 instead)
    - Implement `generateSeed()` that produces a random integer seed
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 1.3 Write unit tests for PRNG determinism
    - Verify same seed produces identical sequences
    - Verify different seeds produce different sequences
    - Verify output is in [0, 1) range
    - _Requirements: 8.2_

- [ ] 2. Implement base parameter computation
  - [ ] 2.1 Create `src/utils/simulation/parameters.ts` with `computeBaseParameters`
    - Compute `optimalLR` based on optimizer type and model complexity
    - Compute `divergenceThreshold` (e.g., 10× optimal LR)
    - Compute `oscillationRange` (e.g., [2× optimal, divergenceThreshold])
    - Compute `maxAccuracy` as product of architectureCeiling × datasetSizeFactor × dataQualityFactor × classBalanceFactor
    - Compute `noiseFloor` from data quality and class imbalance
    - Compute `noiseAmplitude` scaled by 1/sqrt(batchSize)
    - Compute `convergenceRate` from LR ratio, complexity factor, and data sufficiency
    - Compute `overfittingOnset` from data sufficiency and complexity
    - _Requirements: 1.5, 2.1, 2.2, 2.4, 3.1, 5.1, 5.2, 6.4, 7.1, 9.4_

  - [ ]* 2.2 Write property test for multiplicative composition
    - **Property 18: Multiplicative composition of parameter effects**
    - **Validates: Requirements 9.4**

  - [ ]* 2.3 Write unit tests for `computeBaseParameters`
    - Test all (optimizer, complexity) combinations produce sensible optimalLR values
    - Test maxAccuracy is capped at 0.70 when datasetSize < 100
    - Test noiseAmplitude decreases with larger batchSize
    - _Requirements: 1.5, 2.1, 6.4_

- [ ] 3. Implement loss curve generation
  - [ ] 3.1 Create `src/utils/simulation/curves.ts` with `generateLossCurve`
    - Implement diverging path: monotonically increasing loss when LR > divergenceThreshold
    - Implement oscillating path: sinusoidal fluctuations when LR in oscillation range
    - Implement converging path: exponential decay toward noiseFloor when LR in optimal range
    - Implement slow convergence path: reduced convergence rate when LR < 10% of optimal
    - Clamp all loss values to [0, 100] for numerical stability
    - Add per-epoch noise scaled by noiseAmplitude from PRNG
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.4, 7.2_

  - [ ]* 3.2 Write property test for diverging loss monotonicity
    - **Property 2: Diverging loss is monotonically increasing**
    - **Validates: Requirements 1.1**

  - [ ]* 3.3 Write property test for oscillating loss non-convergence
    - **Property 3: Oscillating loss does not converge**
    - **Validates: Requirements 1.2**

  - [ ]* 3.4 Write property test for slow LR convergence
    - **Property 4: Slow learning rate produces slow convergence**
    - **Validates: Requirements 1.3**

  - [ ]* 3.5 Write property test for optimal LR convergence speed
    - **Property 5: Optimal learning rate converges within 60% of epochs**
    - **Validates: Requirements 1.4**

- [ ] 4. Implement accuracy and validation curve generation
  - [ ] 4.1 Implement `generateAccuracyCurve` in `src/utils/simulation/curves.ts`
    - Derive accuracy from loss curve inversely (lower loss → higher accuracy)
    - Cap accuracy at `maxAccuracy` from base parameters
    - Add per-epoch noise from PRNG
    - Clamp accuracy values to [0, 1]
    - _Requirements: 2.1, 2.2, 5.1, 5.2_

  - [ ] 4.2 Implement `generateValidationCurves` in `src/utils/simulation/curves.ts`
    - Compute `val_loss` as `loss + generalizationGap`
    - Implement generalization gap that increases after `overfittingOnset`
    - Compute `val_accuracy` inversely from `val_loss`, capped at `maxAccuracy`
    - Model overfitting: val_accuracy peaks then declines after onset
    - _Requirements: 2.3, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 4.3 Write property test for small dataset accuracy cap
    - **Property 6: Small dataset caps validation accuracy at 70%**
    - **Validates: Requirements 2.1**

  - [ ]* 4.4 Write property test for logarithmic dataset scaling
    - **Property 7: Dataset size effect is logarithmic**
    - **Validates: Requirements 2.2**

  - [ ]* 4.5 Write property test for insufficient data overfitting
    - **Property 8: Insufficient data produces overfitting**
    - **Validates: Requirements 2.3**

  - [ ]* 4.6 Write property test for excess epochs overfitting curve
    - **Property 12: Excess epochs produce overfitting curve**
    - **Validates: Requirements 4.2**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement diagnostics and final metrics computation
  - [ ] 6.1 Create `src/utils/simulation/diagnostics.ts` with `computeDiagnostics`
    - Detect `isOverfitting`: val_accuracy declining while train_accuracy rising
    - Detect `isUnderfitting`: both train and val accuracy below 75% at final epoch
    - Detect `isDiverging`: loss increasing over last 5 epochs
    - Detect `isOscillating`: 3+ sign changes in loss derivative
    - _Requirements: 4.1, 4.2, 1.1, 1.2_

  - [ ] 6.2 Implement `computeFinalMetrics` in `src/utils/simulation/diagnostics.ts`
    - Extract final accuracy and loss from last epoch
    - Compute precision, recall, F1 from accuracy and class balance
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 6.3 Implement `computePerClassMetrics` in `src/utils/simulation/diagnostics.ts`
    - Generate per-class precision/recall/F1 based on classImbalanceRatio
    - Majority class gets inflated metrics; minority class gets degraded metrics
    - Balanced datasets produce uniform per-class metrics
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.4 Write property test for class imbalance minority degradation
    - **Property 9: Class imbalance degrades minority metrics proportionally**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.5 Write property test for balanced class uniformity
    - **Property 10: Balanced datasets produce uniform per-class metrics**
    - **Validates: Requirements 3.3**

  - [ ]* 6.6 Write property test for insufficient epochs underfitting
    - **Property 11: Insufficient epochs produce underfitting**
    - **Validates: Requirements 4.1**

- [ ] 7. Implement main simulation engine and input validation
  - [ ] 7.1 Create `src/utils/simulation/engine.ts` with `simulateTraining`
    - Validate and clamp all input parameters per the error handling spec
    - Generate or use provided seed
    - Call `computeBaseParameters` → `generateLossCurve` → `generateAccuracyCurve` → `generateValidationCurves`
    - Assemble `EpochMetrics[]` array
    - Call `computeDiagnostics`, `computeFinalMetrics`, `computePerClassMetrics`
    - Return complete `SimulationResult`
    - _Requirements: 1.1–1.5, 2.1–2.4, 3.1–3.4, 4.1–4.4, 5.1–5.4, 6.1–6.4, 7.1–7.4, 8.1–8.3, 9.1–9.4_

  - [ ] 7.2 Create `src/utils/simulation/index.ts` barrel export
    - Export `simulateTraining`, `createSimulationRunner`, all types
    - _Requirements: 8.1_

  - [ ]* 7.3 Write property test for deterministic reproducibility
    - **Property 1: Deterministic reproducibility**
    - **Validates: Requirements 8.2**

  - [ ]* 7.4 Write property test for architecture complexity tradeoff
    - **Property 13: Architecture complexity tradeoff**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 7.5 Write property test for noise scaling with batch size
    - **Property 14: Noise amplitude scales inversely with sqrt(batchSize)**
    - **Validates: Requirements 6.4, 6.1**

  - [ ]* 7.6 Write property test for large batch slowing convergence
    - **Property 15: Large batch size slows convergence**
    - **Validates: Requirements 6.2**

  - [ ]* 7.7 Write property test for low data quality reducing accuracy
    - **Property 16: Low data quality reduces maximum accuracy**
    - **Validates: Requirements 7.1**

  - [ ]* 7.8 Write property test for high data quality equivalence
    - **Property 17: High data quality is indistinguishable from perfect**
    - **Validates: Requirements 7.3**

  - [ ]* 7.9 Write property test for combined effects amplification
    - **Property 19: Combined effects amplify beyond individual effects**
    - **Validates: Requirements 9.1, 9.3**

  - [ ]* 7.10 Write property test for more data reducing overfitting
    - **Property 20: More data reduces overfitting for complex models**
    - **Validates: Requirements 9.2**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement integration adapter
  - [ ] 9.1 Create `src/utils/simulation/adapter.ts` with `createSimulationRunner`
    - Accept `SimulationConfig`, callbacks (`onEpochEnd`, `onComplete`), and options (`replayDelayMs`)
    - Call `simulateTraining` to compute all results upfront
    - Return `{ start, cancel }` interface
    - `start()`: replay epochs one-by-one through `onEpochEnd` callback with configurable delay (default 100ms)
    - `cancel()`: stop replay loop, do not call `onComplete`
    - Format epoch logs to match `EnhancedTrainingPipeline` callback shape (`loss`, `acc`, `val_loss`, `val_acc`)
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 9.2 Write unit tests for adapter
    - Verify all epochs are replayed in order
    - Verify cancellation stops replay mid-stream
    - Verify callback log format matches pipeline expectations
    - _Requirements: 8.1_

- [ ] 10. Wire simulation into TrainingPage
  - [ ] 10.1 Add simulation mode detection to `TrainingPage`
    - Add a `useSimulation` flag or detect when to use simulation (e.g., offline/fallback mode)
    - Map existing `TrainingConfig` fields to `SimulationConfig` (learningRate, batchSize, epochs, optimizer)
    - Add default values for simulation-only fields (datasetSize, classImbalanceRatio, dataQualityScore, architecture)
    - _Requirements: 1.1–1.5, 2.1–2.4, 3.1–3.4, 4.1–4.4, 5.1–5.4, 6.1–6.4, 7.1–7.4_

  - [ ] 10.2 Replace naive metric generation with simulation adapter
    - In the offline/fallback training path of `startTraining`, use `createSimulationRunner` instead of the current TensorFlow.js pipeline
    - Feed simulation results through existing `onEpochEnd` / `onMetricsUpdate` / `onProgress` callbacks
    - Preserve existing UI rendering (charts, logs, stage indicator) without changes
    - _Requirements: 8.1, 9.1–9.4_

  - [ ]* 10.3 Write integration tests for TrainingPage simulation path
    - Verify simulation mode produces valid metrics array
    - Verify UI callbacks receive correctly formatted data
    - Verify cancellation works during replay
    - _Requirements: 8.1, 8.2_

- [ ] 11. Install fast-check and configure test infrastructure
  - [ ] 11.1 Add `fast-check` as a dev dependency
    - Run `npm install --save-dev fast-check`
    - Create test file `src/utils/simulation/__tests__/simulation.property.test.ts`
    - Create shared arbitrary generators for `SimulationConfig` (valid ranges for all fields)
    - _Requirements: 8.2_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (20 properties total)
- Unit tests validate specific examples and edge cases
- The simulation module is entirely standalone — no changes to existing components until task 10
- `fast-check` (task 11) should be installed early if property tests are being implemented alongside core logic
