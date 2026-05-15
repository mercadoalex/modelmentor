// src/utils/tfTraining/preprocessing/labelEncoding.ts
// One-hot encoding for categorical labels

/**
 * Encodes categorical labels into one-hot tensors.
 * For K unique classes, produces tensors of shape [N, K] where each row
 * has exactly one 1 and (K-1) zeros.
 */
export function encodeLabels(
  tf: any,
  labels: (string | number)[]
): { tensor: any; labelMap: Map<string | number, number>; numClasses: number } {
  // Build label map: unique labels → integer indices
  const uniqueLabels = Array.from(new Set(labels));
  uniqueLabels.sort((a, b) => String(a).localeCompare(String(b)));

  const labelMap = new Map<string | number, number>();
  uniqueLabels.forEach((label, index) => {
    labelMap.set(label, index);
  });

  const numClasses = uniqueLabels.length;

  // Convert labels to integer indices
  const indices = labels.map((label) => labelMap.get(label)!);

  // Create one-hot encoded tensor
  const tensor = tf.oneHot(tf.tensor1d(indices, 'int32'), numClasses);

  return { tensor, labelMap, numClasses };
}
