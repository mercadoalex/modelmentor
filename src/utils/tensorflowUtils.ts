import * as tf from '@tensorflow/tfjs';

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  validationSplit: number;
  learningRate: number;
}

export interface TrainingCallbacks {
  onEpochEnd?: (epoch: number, logs: { loss: number; accuracy: number; val_loss?: number; val_accuracy?: number }) => void;
  onTrainingEnd?: () => void;
}

export interface DataPoint {
  input: string | number[];
  output: string | number;
}

/**
 * Preprocess text data for training
 */
export function preprocessTextData(data: DataPoint[], maxWords: number = 1000) {
  // Build vocabulary
  const vocabulary = new Map<string, number>();
  let wordIndex = 1; // Start from 1, reserve 0 for padding

  data.forEach((point) => {
    if (typeof point.input === 'string') {
      const words = point.input.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (!vocabulary.has(word) && vocabulary.size < maxWords) {
          vocabulary.set(word, wordIndex++);
        }
      });
    }
  });

  // Convert text to sequences
  const sequences = data.map((point) => {
    if (typeof point.input === 'string') {
      const words = point.input.toLowerCase().split(/\s+/);
      return words.map((word) => vocabulary.get(word) || 0).filter((idx) => idx !== 0);
    }
    return [];
  });

  // Pad sequences to same length
  const maxLength = Math.min(100, Math.max(...sequences.map((seq) => seq.length)));
  const paddedSequences = sequences.map((seq) => {
    if (seq.length > maxLength) {
      return seq.slice(0, maxLength);
    }
    return [...seq, ...Array(maxLength - seq.length).fill(0)];
  });

  return { sequences: paddedSequences, vocabulary, maxLength };
}

/**
 * Preprocess numeric data for training
 */
export function preprocessNumericData(data: DataPoint[]) {
  const inputs = data.map((point) => {
    if (Array.isArray(point.input)) {
      return point.input;
    }
    return [parseFloat(String(point.input))];
  });

  // Normalize inputs
  const inputTensor = tf.tensor2d(inputs);
  const { mean, variance } = tf.moments(inputTensor, 0);
  const std = tf.sqrt(variance);
  const normalizedInputs = inputTensor.sub(mean).div(std.add(1e-7));

  return {
    inputs: normalizedInputs,
    mean: mean.arraySync() as number[],
    std: std.arraySync() as number[],
  };
}

/**
 * Encode labels for classification
 */
export function encodeLabels(labels: (string | number)[]) {
  const uniqueLabels = Array.from(new Set(labels));
  const labelMap = new Map(uniqueLabels.map((label, idx) => [label, idx]));
  const encodedLabels = labels.map((label) => labelMap.get(label) || 0);

  return {
    encodedLabels,
    labelMap,
    numClasses: uniqueLabels.length,
  };
}

/**
 * Create a simple text classification model
 */
export function createTextClassificationModel(
  vocabSize: number,
  maxLength: number,
  numClasses: number,
  embeddingDim: number = 32
) {
  const model = tf.sequential();

  // Embedding layer
  model.add(
    tf.layers.embedding({
      inputDim: vocabSize + 1,
      outputDim: embeddingDim,
      inputLength: maxLength,
    })
  );

  // Global average pooling
  model.add(tf.layers.globalAveragePooling1d());

  // Dense hidden layer
  model.add(
    tf.layers.dense({
      units: 16,
      activation: 'relu',
    })
  );

  // Output layer
  model.add(
    tf.layers.dense({
      units: numClasses,
      activation: numClasses > 2 ? 'softmax' : 'sigmoid',
    })
  );

  return model;
}

/**
 * Create a simple regression model
 */
export function createRegressionModel(inputShape: number) {
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      units: 32,
      activation: 'relu',
      inputShape: [inputShape],
    })
  );

  model.add(
    tf.layers.dense({
      units: 16,
      activation: 'relu',
    })
  );

  model.add(
    tf.layers.dense({
      units: 1,
    })
  );

  return model;
}

/**
 * Create a simple classification model for numeric data
 */
export function createNumericClassificationModel(inputShape: number, numClasses: number) {
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [inputShape],
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
      activation: numClasses > 2 ? 'softmax' : 'sigmoid',
    })
  );

  return model;
}

/**
 * Train a text classification model
 */
export async function trainTextClassificationModel(
  data: DataPoint[],
  config: TrainingConfig,
  callbacks: TrainingCallbacks
) {
  // Preprocess data
  const { sequences, vocabulary, maxLength } = preprocessTextData(data);
  const labels = data.map((point) => point.output);
  const { encodedLabels, labelMap, numClasses } = encodeLabels(labels);

  // Create tensors
  const xs = tf.tensor2d(sequences);
  const ys = tf.oneHot(tf.tensor1d(encodedLabels, 'int32'), numClasses);

  // Create model
  const model = createTextClassificationModel(vocabulary.size, maxLength, numClasses);

  // Compile model
  model.compile({
    optimizer: tf.train.adam(config.learningRate),
    loss: numClasses > 2 ? 'categoricalCrossentropy' : 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  // Train model
  await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: config.validationSplit,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (callbacks.onEpochEnd && logs) {
          callbacks.onEpochEnd(epoch, {
            loss: logs.loss,
            accuracy: logs.acc,
            val_loss: logs.val_loss,
            val_accuracy: logs.val_acc,
          });
        }
      },
    },
  });

  // Cleanup tensors
  xs.dispose();
  ys.dispose();

  if (callbacks.onTrainingEnd) {
    callbacks.onTrainingEnd();
  }

  return { model, vocabulary, maxLength, labelMap };
}

/**
 * Train a regression model
 */
export async function trainRegressionModel(
  data: DataPoint[],
  config: TrainingConfig,
  callbacks: TrainingCallbacks
) {
  // Preprocess data
  const { inputs, mean, std } = preprocessNumericData(data);
  const outputs = data.map((point) => parseFloat(String(point.output)));
  const ys = tf.tensor2d(outputs, [outputs.length, 1]);

  // Normalize outputs
  const { mean: yMean, variance: yVariance } = tf.moments(ys, 0);
  const yStd = tf.sqrt(yVariance);
  const normalizedYs = ys.sub(yMean).div(yStd.add(1e-7));

  // Create model
  const inputShape = Array.isArray(data[0].input) ? data[0].input.length : 1;
  const model = createRegressionModel(inputShape);

  // Compile model
  model.compile({
    optimizer: tf.train.adam(config.learningRate),
    loss: 'meanSquaredError',
    metrics: ['mae'],
  });

  // Train model
  await model.fit(inputs, normalizedYs, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: config.validationSplit,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (callbacks.onEpochEnd && logs) {
          callbacks.onEpochEnd(epoch, {
            loss: logs.loss,
            accuracy: 1 - logs.loss, // Pseudo-accuracy for regression
            val_loss: logs.val_loss,
            val_accuracy: logs.val_loss ? 1 - logs.val_loss : undefined,
          });
        }
      },
    },
  });

  // Cleanup tensors
  inputs.dispose();
  ys.dispose();
  normalizedYs.dispose();

  if (callbacks.onTrainingEnd) {
    callbacks.onTrainingEnd();
  }

  return {
    model,
    mean,
    std,
    yMean: (yMean.arraySync() as number[])[0],
    yStd: (yStd.arraySync() as number[])[0],
  };
}

/**
 * Train a numeric classification model
 */
export async function trainNumericClassificationModel(
  data: DataPoint[],
  config: TrainingConfig,
  callbacks: TrainingCallbacks
) {
  // Preprocess data
  const { inputs, mean, std } = preprocessNumericData(data);
  const labels = data.map((point) => point.output);
  const { encodedLabels, labelMap, numClasses } = encodeLabels(labels);

  // Create tensors
  const ys = tf.oneHot(tf.tensor1d(encodedLabels, 'int32'), numClasses);

  // Create model
  const inputShape = Array.isArray(data[0].input) ? data[0].input.length : 1;
  const model = createNumericClassificationModel(inputShape, numClasses);

  // Compile model
  model.compile({
    optimizer: tf.train.adam(config.learningRate),
    loss: numClasses > 2 ? 'categoricalCrossentropy' : 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  // Train model
  await model.fit(inputs, ys, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: config.validationSplit,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (callbacks.onEpochEnd && logs) {
          callbacks.onEpochEnd(epoch, {
            loss: logs.loss,
            accuracy: logs.acc,
            val_loss: logs.val_loss,
            val_accuracy: logs.val_acc,
          });
        }
      },
    },
  });

  // Cleanup tensors
  inputs.dispose();
  ys.dispose();

  if (callbacks.onTrainingEnd) {
    callbacks.onTrainingEnd();
  }

  return { model, mean, std, labelMap };
}

/**
 * Parse CSV data into DataPoint format
 */
export function parseCSVData(csvContent: string, inputColumn: string, outputColumn: string): DataPoint[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const inputIdx = headers.indexOf(inputColumn);
  const outputIdx = headers.indexOf(outputColumn);

  if (inputIdx === -1 || outputIdx === -1) return [];

  const dataPoints: DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length > Math.max(inputIdx, outputIdx)) {
      const input = values[inputIdx];
      const output = values[outputIdx];

      // Try to parse as number, otherwise keep as string
      const numericInput = parseFloat(input);
      const numericOutput = parseFloat(output);

      dataPoints.push({
        input: isNaN(numericInput) ? input : [numericInput],
        output: isNaN(numericOutput) ? output : numericOutput,
      });
    }
  }

  return dataPoints;
}

/**
 * Download model as files
 */
export async function downloadModel(model: tf.LayersModel, modelName: string) {
  await model.save(`downloads://${modelName}`);
}
