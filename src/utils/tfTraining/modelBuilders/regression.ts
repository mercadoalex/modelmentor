// src/utils/tfTraining/modelBuilders/regression.ts
// Dense regression network: Input → Dense(64, ReLU) → Dense(32, ReLU) → Dense(1, Linear)

import type { ModelBuilderOptions } from '../types';

/**
 * Builds a dense regression model.
 * Architecture: Input → Dense(64, ReLU) → Dense(32, ReLU) → Dense(1, Linear)
 * Compiled with meanSquaredError loss and the specified optimizer.
 */
export function buildRegressionModel(tf: any, opts: ModelBuilderOptions): any {
  const { inputShape, learningRate, optimizer } = opts;

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
      units: 1,
      activation: 'linear',
    })
  );

  const optimizerInstance = createOptimizer(tf, optimizer, learningRate);

  model.compile({
    optimizer: optimizerInstance,
    loss: 'meanSquaredError',
    metrics: ['mse'],
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
