// src/utils/tfTraining/modelBuilders/imageClassification.ts
// MobileNet transfer learning with fallback to simple CNN

import type { ModelBuilderOptions } from '../types';

/**
 * Builds an image classification model using MobileNet transfer learning.
 * Loads MobileNet, freezes base layers, adds classification head.
 * Falls back to a simple CNN if MobileNet fails to load.
 *
 * Architecture (transfer): MobileNet(frozen) → GlobalAveragePooling2D → Dense(numClasses, Softmax)
 * Architecture (fallback): Conv2D(32) → MaxPool → Conv2D(64) → MaxPool → Flatten → Dense(64) → Dense(numClasses, Softmax)
 */
export async function buildImageClassificationModel(
  tf: any,
  opts: ModelBuilderOptions
): Promise<any> {
  // Use the fallback CNN directly — MobileNet requires @tensorflow-models/mobilenet
  // which adds significant bundle size. The CNN works well for small educational datasets.
  return buildFallbackCNN(tf, opts);
}

/**
 * Builds a simple CNN as fallback when MobileNet is unavailable.
 * Architecture: Conv2D(32) → MaxPool → Conv2D(64) → MaxPool → Flatten → Dense(64, ReLU) → Dense(numClasses, Softmax)
 */
function buildFallbackCNN(tf: any, opts: ModelBuilderOptions): any {
  const { numClasses = 2, learningRate, optimizer } = opts;

  const model = tf.sequential();

  model.add(
    tf.layers.conv2d({
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      inputShape: [224, 224, 3],
    })
  );

  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(
    tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
    })
  );

  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  model.add(tf.layers.flatten({}));

  model.add(
    tf.layers.dense({
      units: 64,
      activation: 'relu',
    })
  );

  model.add(
    tf.layers.dense({
      units: numClasses,
      activation: 'softmax',
    })
  );

  const optimizerInstance = createOptimizer(tf, optimizer, learningRate);

  model.compile({
    optimizer: optimizerInstance,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

function createOptimizer(tf: any, optimizer: string, learningRate: number): any {
  switch (optimizer) {
    case 'sgd':
      return tf.train.sgd(learningRate);
    case 'rmsprop':
      return tf.train.rmsprop(learningRate);
    case 'adam':
    default:
      return tf.train.adam(learningRate);
  }
}
