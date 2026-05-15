// src/utils/tfTraining/preprocessing/normalization.ts
// Z-score normalization for numeric features and targets

/**
 * Normalizes numeric features using Z-score normalization (zero mean, unit variance).
 * Handles constant features (std = 0) by setting std to 1.
 */
export function normalizeFeatures(
  tf: any,
  data: number[][]
): { tensor: any; mean: number[]; std: number[] } {
  const numFeatures = data[0]?.length ?? 0;
  const numSamples = data.length;

  // Compute mean and std per feature
  const mean: number[] = new Array(numFeatures).fill(0);
  const std: number[] = new Array(numFeatures).fill(0);

  for (let j = 0; j < numFeatures; j++) {
    let sum = 0;
    for (let i = 0; i < numSamples; i++) {
      sum += data[i][j];
    }
    mean[j] = sum / numSamples;

    let sumSqDiff = 0;
    for (let i = 0; i < numSamples; i++) {
      const diff = data[i][j] - mean[j];
      sumSqDiff += diff * diff;
    }
    const variance = sumSqDiff / numSamples;
    std[j] = Math.sqrt(variance);

    // Handle constant features: set std to 1 to avoid division by zero
    if (std[j] === 0) {
      std[j] = 1;
    }
  }

  // Normalize the data
  const normalized: number[][] = data.map((row) =>
    row.map((val, j) => (val - mean[j]) / std[j])
  );

  const tensor = tf.tensor2d(normalized);

  return { tensor, mean, std };
}

/**
 * Normalizes regression targets using Z-score normalization.
 * Returns a 1D tensor reshaped to [N, 1] for training compatibility.
 */
export function normalizeTargets(
  tf: any,
  targets: number[]
): { tensor: any; mean: number[]; std: number[] } {
  const numSamples = targets.length;

  let sum = 0;
  for (let i = 0; i < numSamples; i++) {
    sum += targets[i];
  }
  const meanVal = sum / numSamples;

  let sumSqDiff = 0;
  for (let i = 0; i < numSamples; i++) {
    const diff = targets[i] - meanVal;
    sumSqDiff += diff * diff;
  }
  const variance = sumSqDiff / numSamples;
  let stdVal = Math.sqrt(variance);

  // Handle constant targets
  if (stdVal === 0) {
    stdVal = 1;
  }

  const normalized = targets.map((val) => (val - meanVal) / stdVal);
  const tensor = tf.tensor2d(normalized.map((v) => [v]));

  return { tensor, mean: [meanVal], std: [stdVal] };
}

/**
 * Denormalizes a value using stored mean and std.
 * Used to convert model predictions back to original scale.
 */
export function denormalize(value: number, mean: number, std: number): number {
  return value * std + mean;
}
