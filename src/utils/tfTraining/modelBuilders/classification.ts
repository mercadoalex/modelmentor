// src/utils/tfTraining/modelBuilders/classification.ts
// Dense classification network: Input → Dense(64, ReLU) → Dense(32, ReLU) → Dense(numClasses, Softmax)

import type { ModelBuilderOptions } from '../types';

/**
 * Builds a dense classification model.
 * Architecture: Input → Dense(64, ReLU) → Dense(32, ReLU) → Dense(numClasses, Softmax)
 * Compiled with categoricalCrossentropy loss and the specified optimizer.
 */
export function buildClassificationModel(tf: any, opts: ModelBuilderOptions): any {
  const { inputShape, numClasses = 2, learningRate, optimizer } = opts;

  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape,
    })
  );

  model.add(
    tf.layers.dense({
      units: 32,
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
