// src/utils/tfTraining/orchestrator.ts
// Training Guard: routes to simulation or TF engine based on authentication

import type {
  TrainingRequest,
  TrainingCallbacks,
  TrainingRunner,
  TrainingStatus,
} from './types';
import { loadTensorFlow } from './dynamicLoader';
import { detectCapabilities } from './deviceCapability';
import { createTFEngine } from './tfEngine';
import { createSimulationRunner } from '../simulation/adapter';

/**
 * Creates a training runner that routes to either the simulation engine
 * or the real TF.js engine based on authentication state and device capabilities.
 *
 * Routing logic:
 * - isAuthenticated=false → simulation
 * - isAuthenticated=true → attempt TF.js load → check device → TF engine
 * - If TF.js load fails or device incapable → fallback to simulation
 */
export function createTrainingRunner(
  request: TrainingRequest,
  callbacks: TrainingCallbacks,
  isAuthenticated: boolean
): TrainingRunner {
  let cancelled = false;
  let innerRunner: TrainingRunner | null = null;

  const cancel = () => {
    cancelled = true;
    if (innerRunner) {
      innerRunner.cancel();
    }
  };

  const start = async (): Promise<void> => {
    // Route unauthenticated users to simulation
    if (!isAuthenticated) {
      emitStatus(callbacks, { type: 'training', isReal: false });
      innerRunner = createSimulationRunnerAdapter(request, callbacks);
      return innerRunner.start();
    }

    // Authenticated user: attempt real training
    try {
      // Step 1: Load TensorFlow.js
      emitStatus(callbacks, { type: 'loading_tf', estimatedSizeMB: 1.0 });

      if (cancelled) return;

      const { tf } = await loadTensorFlow();

      if (cancelled) return;

      // Step 2: Check device capabilities
      emitStatus(callbacks, { type: 'checking_device' });
      const capabilities = await detectCapabilities(tf);

      if (cancelled) return;

      // If device is not capable (no WebGL and very low memory), fall back
      if (!capabilities.hasWebGL && capabilities.estimatedMemoryGB !== null && capabilities.estimatedMemoryGB < 1) {
        const reason = 'Device lacks WebGL and has insufficient memory for real training.';
        emitStatus(callbacks, { type: 'fallback_to_simulation', reason });
        innerRunner = createSimulationRunnerAdapter(request, callbacks);
        return innerRunner.start();
      }

      // Step 3: Start real TF engine
      emitStatus(callbacks, { type: 'training', isReal: true });

      const engine = createTFEngine({
        request,
        tf,
        capabilities,
        callbacks,
      });

      // Wire up cancellation
      innerRunner = {
        start: async () => { await engine.start(); },
        cancel: () => engine.cancel(),
      };

      if (cancelled) {
        engine.cancel();
        return;
      }

      await engine.start();
    } catch (error) {
      // TF.js load failed or other error: fall back to simulation
      const reason = error instanceof Error
        ? error.message
        : 'Failed to initialize real training';

      emitStatus(callbacks, { type: 'fallback_to_simulation', reason });

      if (!cancelled) {
        innerRunner = createSimulationRunnerAdapter(request, callbacks);
        return innerRunner.start();
      }
    }
  };

  return { start, cancel };
}

/**
 * Emits a training status update via the callbacks.
 */
function emitStatus(callbacks: TrainingCallbacks, status: TrainingStatus): void {
  try {
    callbacks.onStatusChange(status);
  } catch {
    // Ignore callback errors
  }
}

/**
 * Adapts the simulation runner to match the TrainingCallbacks interface.
 * Maps simulation callbacks to the standard training callbacks format.
 */
function createSimulationRunnerAdapter(
  request: TrainingRequest,
  callbacks: TrainingCallbacks
): TrainingRunner {
  const simConfig = {
    learningRate: request.config.learningRate,
    batchSize: request.config.batchSize,
    epochs: request.config.epochs,
    optimizer: request.config.optimizer,
    architecture: 'medium' as const,
    datasetSize: request.data.length,
    classImbalanceRatio: 1.0,
    dataQualityScore: 0.8,
  };

  const runner = createSimulationRunner(
    simConfig,
    {
      onEpochEnd: (epoch, logs) => {
        callbacks.onEpochEnd(epoch, {
          loss: logs.loss ?? 0,
          acc: logs.acc ?? 0,
          val_loss: logs.val_loss ?? 0,
          val_acc: logs.val_acc ?? 0,
        });
      },
      onComplete: (result) => {
        const metrics = result.metrics.map((m) => ({
          loss: m.loss,
          acc: m.accuracy,
          val_loss: m.val_loss,
          val_acc: m.val_accuracy,
        }));
        const finalMetrics = metrics[metrics.length - 1] || { loss: 0, acc: 0, val_loss: 0, val_acc: 0 };

        callbacks.onComplete({
          metrics,
          finalMetrics: {
            loss: finalMetrics.loss,
            accuracy: finalMetrics.acc,
            val_loss: finalMetrics.val_loss,
            val_accuracy: finalMetrics.val_acc,
          },
          model: null,
          metadata: {},
          cancelled: false,
          durationMs: 0,
        });
      },
    },
    { replayDelayMs: 50 }
  );

  return runner;
}
