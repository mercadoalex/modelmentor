// src/utils/simulation/adapter.ts
// Integration adapter that replays simulation results through callbacks

import type { SimulationConfig, SimulationResult } from './types';
import { simulateTraining } from './engine';

export interface SimulationCallbacks {
  onEpochEnd: (epoch: number, logs: Record<string, number>) => void;
  onComplete: (result: SimulationResult) => void;
}

export interface SimulationRunnerOptions {
  replayDelayMs?: number;
}

export interface SimulationRunner {
  start: () => Promise<void>;
  cancel: () => void;
}

/**
 * Create a simulation runner that replays epoch results with configurable delay.
 * Computes all results upfront via simulateTraining, then replays them
 * one-by-one through the onEpochEnd callback.
 *
 * @param config - Simulation configuration
 * @param callbacks - onEpochEnd and onComplete callbacks
 * @param options - Optional replay delay (default 100ms per epoch)
 * @returns Object with start() and cancel() methods
 */
export function createSimulationRunner(
  config: SimulationConfig,
  callbacks: SimulationCallbacks,
  options?: SimulationRunnerOptions
): SimulationRunner {
  const delayMs = options?.replayDelayMs ?? 100;
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Compute all results upfront
  const result = simulateTraining(config);

  const start = (): Promise<void> => {
    cancelled = false;

    return new Promise<void>((resolve) => {
      let index = 0;

      const replayNext = () => {
        if (cancelled || index >= result.metrics.length) {
          if (!cancelled) {
            callbacks.onComplete(result);
          }
          resolve();
          return;
        }

        const epochMetrics = result.metrics[index];
        callbacks.onEpochEnd(epochMetrics.epoch, {
          loss: epochMetrics.loss,
          acc: epochMetrics.accuracy,
          val_loss: epochMetrics.val_loss,
          val_acc: epochMetrics.val_accuracy,
        });

        index++;

        if (index < result.metrics.length && !cancelled) {
          timeoutId = setTimeout(replayNext, delayMs);
        } else {
          if (!cancelled) {
            callbacks.onComplete(result);
          }
          resolve();
        }
      };

      // Start replay
      if (delayMs <= 0) {
        // No delay: replay all synchronously
        for (let i = 0; i < result.metrics.length && !cancelled; i++) {
          const m = result.metrics[i];
          callbacks.onEpochEnd(m.epoch, {
            loss: m.loss,
            acc: m.accuracy,
            val_loss: m.val_loss,
            val_acc: m.val_accuracy,
          });
        }
        if (!cancelled) {
          callbacks.onComplete(result);
        }
        resolve();
      } else {
        replayNext();
      }
    });
  };

  const cancel = () => {
    cancelled = true;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { start, cancel };
}
