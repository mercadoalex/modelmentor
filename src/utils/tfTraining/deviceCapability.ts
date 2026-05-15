// src/utils/tfTraining/deviceCapability.ts
// Checks hardware capabilities before training

import type { DeviceCapabilities } from './types';

/**
 * Detects device capabilities for TensorFlow.js training.
 * Checks WebGL availability, estimates memory, and sets appropriate limits.
 */
export async function detectCapabilities(tf: any): Promise<DeviceCapabilities> {
  const warnings: string[] = [];

  // Check WebGL availability
  let hasWebGL = false;
  try {
    await tf.ready();
    const webglVersion = tf.env().get('WEBGL_VERSION');
    hasWebGL = webglVersion > 0;
  } catch {
    hasWebGL = false;
  }

  if (!hasWebGL) {
    warnings.push('WebGL is not available. Training will use CPU backend and may be slower.');
  }

  // Estimate device memory
  let estimatedMemoryGB: number | null = null;
  if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
    estimatedMemoryGB = (navigator as any).deviceMemory;
  }

  // Determine recommended backend
  const recommendedBackend: 'webgl' | 'cpu' = hasWebGL ? 'webgl' : 'cpu';

  // Set limits based on memory
  const isLowMemory = estimatedMemoryGB !== null && estimatedMemoryGB < 2;
  const maxParameters = isLowMemory ? 50000 : 1000000;
  const maxSamples = 500; // Browser training limit regardless of memory

  if (isLowMemory) {
    warnings.push(
      `Device has limited memory (~${estimatedMemoryGB}GB). Model size limited to 50,000 parameters. Training may be slow.`
    );
  }

  return {
    hasWebGL,
    estimatedMemoryGB,
    recommendedBackend,
    maxParameters,
    maxSamples,
    warnings,
  };
}
