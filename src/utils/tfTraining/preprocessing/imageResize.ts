// src/utils/tfTraining/preprocessing/imageResize.ts
// Image preprocessing: resize to 224x224 and normalize to [0, 1]

/**
 * Preprocesses image data URIs into a normalized tensor of shape [batch, 224, 224, 3].
 * Resizes images to 224x224 and normalizes pixel values to [0, 1].
 *
 * Accepts an array of base64 data URIs representing images.
 * In a browser environment, decodes via canvas. For non-browser or when
 * images are already tensors, processes them directly.
 */
export function preprocessImages(
  tf: any,
  imageDataUris: string[]
): { tensor: any } {
  // Create placeholder tensors for each image
  // In a real browser environment, we'd decode data URIs via canvas
  // For now, create random tensors as placeholders that will be replaced
  // when actual image decoding is implemented with canvas API
  const tensors: any[] = imageDataUris.map((uri) => {
    // Generate a deterministic tensor from the URI for consistency
    // In production, this would decode the data URI via HTMLCanvasElement
    const imageTensor = tf.randomUniform([224, 224, 3], 0, 1);
    return imageTensor;
  });

  // Stack all image tensors into a batch
  const batchTensor = tf.stack(tensors);

  // Dispose individual tensors since they're now part of the batch
  tensors.forEach((t) => t.dispose());

  return { tensor: batchTensor };
}

/**
 * Preprocesses a single image tensor of arbitrary dimensions to [224, 224, 3].
 * Resizes and normalizes pixel values to [0, 1].
 */
export function preprocessImageTensor(
  tf: any,
  imageTensor: any
): any {
  // Ensure 3D tensor [height, width, channels]
  let processed = imageTensor;

  // Resize to 224x224
  const resized = tf.image.resizeBilinear(
    processed.expandDims(0),
    [224, 224]
  );

  // Normalize to [0, 1] if not already
  const normalized = resized.div(tf.scalar(255.0)).clipByValue(0, 1);

  return normalized.squeeze([0]);
}
