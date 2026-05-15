// src/utils/tfTraining/modelBuilders/textClassification.ts
// Embedding-based text classification: Embedding → GlobalAveragePooling → Dense(16, ReLU) → Dense(numClasses, Softmax)

import type { ModelBuilderOptions } from '../types';

/**
 * Builds a text classification model using embeddings.
 * Architecture: Embedding(vocabSize, 32) → GlobalAveragePooling1D → Dense(16, ReLU) → Dense(numClasses, Softmax)
 * Compiled with categoricalCrossentropy loss and the specified optimizer.
 */
export function buildTextClassificationModel(tf: any, opts: ModelBuilderOptions): any {
  const {
    vocabSize = 1000,
    maxSequenceLength = 100,
    numClasses = 2,
    learningRate,
    optimizer,
  } = opts;

  const model = tf.sequential();

  model.add(
    tf.layers.embedding({
      inputDim: vocabSize + 1, // +1 for padding index 0
      outputDim: 32,
      inputLength: maxSequenceLength,
    })
  );

  model.add(tf.layers.globalAveragePooling1d({}));

  model.add(
    tf.layers.dense({
      units: 16,
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
