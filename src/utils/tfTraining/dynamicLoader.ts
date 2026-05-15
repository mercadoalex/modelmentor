// src/utils/tfTraining/dynamicLoader.ts
// Lazily imports TensorFlow.js and caches the module reference

import type { TFModule, LoaderStatus } from './types';

let cachedModule: TFModule | null = null;
let loaderStatus: LoaderStatus = { state: 'idle' };
let loadPromise: Promise<TFModule> | null = null;

/**
 * Dynamically imports TensorFlow.js. Caches the module after first load
 * so subsequent calls return immediately without re-downloading.
 */
export async function loadTensorFlow(): Promise<TFModule> {
  // Return cached module immediately if already loaded
  if (cachedModule) {
    return cachedModule;
  }

  // If a load is already in progress, return the same promise
  if (loadPromise) {
    return loadPromise;
  }

  loaderStatus = { state: 'loading' };

  loadPromise = (async () => {
    try {
      const tf = await import('@tensorflow/tfjs');
      cachedModule = { tf };
      loaderStatus = { state: 'loaded' };
      return cachedModule;
    } catch (error) {
      const err = error instanceof Error
        ? error
        : new Error('Failed to load TensorFlow.js');
      loaderStatus = { state: 'error', error: err };
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

/**
 * Returns the current status of the TensorFlow.js loader.
 */
export function getTFStatus(): LoaderStatus {
  return { ...loaderStatus };
}

/**
 * Returns true if TensorFlow.js has been successfully loaded and cached.
 */
export function isTFLoaded(): boolean {
  return cachedModule !== null;
}

/**
 * Reset the loader state (useful for testing).
 * @internal
 */
export function _resetLoader(): void {
  cachedModule = null;
  loadPromise = null;
  loaderStatus = { state: 'idle' };
}
