// src/utils/tfTraining/tfEngine.ts
// Core training loop with cancellation support and tensor cleanup

import type {
  TrainingRequest,
  TrainingResult,
  TrainingCallbacks,
  DeviceCapabilities,
  PreprocessingMetadata,
  ModelBuilderOptions,
} from './types';
import { normalizeFeatures, normalizeTargets, encodeLabels, tokenizeTexts, preprocessImages } from './preprocessing';
import { buildModel } from './modelBuilders';
import { createEpochReporter } from './epochReporter';
import { saveModel } from './modelRegistry';

export interface TFEngineConfig {
  request: TrainingRequest;
  tf: any;
  capabilities: DeviceCapabilities;
  callbacks: TrainingCallbacks;
}

export interface TFEngineHandle {
  start: () => Promise<TrainingResult>;
  cancel: () => void;
}

/**
 * Creates the TF Engine that performs real gradient descent training.
 * Returns a handle with start() and cancel() methods.
 *
 * Training flow:
 * 1. Preprocess data (normalize, tokenize, resize based on model type)
 * 2. Build model via appropriate model builder
 * 3. Compile with user-specified optimizer and learning rate
 * 4. Train with per-epoch callback that checks cancellation flag
 * 5. On completion: save model + return metrics
 * 6. On cancellation: dispose all tensors, return partial result
 */
export function createTFEngine(config: TFEngineConfig): TFEngineHandle {
  const { request, tf, capabilities, callbacks } = config;
  const { modelType, data, config: trainingConfig, projectId } = request;

  let cancelled = false;
  let tensorsToDispose: any[] = [];

  const cancel = () => {
    cancelled = true;
  };

  const start = async (): Promise<TrainingResult> => {
    const startTime = Date.now();
    const metadata: PreprocessingMetadata = {};

    const reporter = createEpochReporter({
      totalEpochs: trainingConfig.epochs,
      modelType,
      onEpochEnd: callbacks.onEpochEnd,
      onComplete: callbacks.onComplete,
    });

    let model: any = null;

    try {
      // Step 1: Preprocess data based on model type
      let xTensor: any;
      let yTensor: any;
      let builderOpts: ModelBuilderOptions;

      switch (modelType) {
        case 'classification': {
          const features = data.map((d) => d.features || []);
          const labels = data.map((d) => d.label!);

          const normResult = normalizeFeatures(tf, features);
          xTensor = normResult.tensor;
          tensorsToDispose.push(xTensor);
          metadata.normalization = { mean: normResult.mean, std: normResult.std };

          const labelResult = encodeLabels(tf, labels);
          yTensor = labelResult.tensor;
          tensorsToDispose.push(yTensor);
          metadata.labelMap = Object.fromEntries(labelResult.labelMap);
          metadata.numClasses = labelResult.numClasses;

          builderOpts = {
            inputShape: [features[0].length],
            numClasses: labelResult.numClasses,
            learningRate: trainingConfig.learningRate,
            optimizer: trainingConfig.optimizer,
          };
          break;
        }

        case 'regression': {
          const features = data.map((d) => d.features || []);
          const targets = data.map((d) => d.label as number);

          const normResult = normalizeFeatures(tf, features);
          xTensor = normResult.tensor;
          tensorsToDispose.push(xTensor);
          metadata.normalization = { mean: normResult.mean, std: normResult.std };

          const targetResult = normalizeTargets(tf, targets);
          yTensor = targetResult.tensor;
          tensorsToDispose.push(yTensor);
          metadata.targetNormalization = {
            mean: targetResult.mean[0],
            std: targetResult.std[0],
          };

          builderOpts = {
            inputShape: [features[0].length],
            learningRate: trainingConfig.learningRate,
            optimizer: trainingConfig.optimizer,
          };
          break;
        }

        case 'text_classification': {
          const texts = data.map((d) => d.text || '');
          const labels = data.map((d) => d.label!);

          const tokenResult = tokenizeTexts(tf, texts);
          xTensor = tokenResult.sequences;
          tensorsToDispose.push(xTensor);
          metadata.vocabulary = Object.fromEntries(tokenResult.vocabulary);
          metadata.maxSequenceLength = tokenResult.maxLength;

          const labelResult = encodeLabels(tf, labels);
          yTensor = labelResult.tensor;
          tensorsToDispose.push(yTensor);
          metadata.labelMap = Object.fromEntries(labelResult.labelMap);
          metadata.numClasses = labelResult.numClasses;

          builderOpts = {
            inputShape: [tokenResult.maxLength],
            numClasses: labelResult.numClasses,
            vocabSize: tokenResult.vocabulary.size,
            maxSequenceLength: tokenResult.maxLength,
            learningRate: trainingConfig.learningRate,
            optimizer: trainingConfig.optimizer,
          };
          break;
        }

        case 'image_classification': {
          const imageUris = data.map((d) => d.imageDataUri || '');
          const labels = data.map((d) => d.label!);

          const imageResult = preprocessImages(tf, imageUris);
          xTensor = imageResult.tensor;
          tensorsToDispose.push(xTensor);

          const labelResult = encodeLabels(tf, labels);
          yTensor = labelResult.tensor;
          tensorsToDispose.push(yTensor);
          metadata.labelMap = Object.fromEntries(labelResult.labelMap);
          metadata.numClasses = labelResult.numClasses;

          builderOpts = {
            inputShape: [224, 224, 3],
            numClasses: labelResult.numClasses,
            learningRate: trainingConfig.learningRate,
            optimizer: trainingConfig.optimizer,
          };
          break;
        }

        default:
          throw new Error(`Unsupported model type: ${modelType}`);
      }

      // Check cancellation before building model
      if (cancelled) {
        return createCancelledResult(startTime, metadata, reporter.getMetrics());
      }

      // Step 2: Build model
      model = await buildModel(tf, modelType, builderOpts);

      // Check cancellation before training
      if (cancelled) {
        return createCancelledResult(startTime, metadata, reporter.getMetrics());
      }

      // Step 3: Train with per-epoch cancellation check
      await model.fit(xTensor, yTensor, {
        epochs: trainingConfig.epochs,
        batchSize: trainingConfig.batchSize,
        validationSplit: trainingConfig.validationSplit,
        callbacks: {
          onEpochEnd: (epoch: number, logs: any) => {
            if (cancelled) {
              model.stopTraining = true;
              return;
            }
            reporter.handleEpoch(epoch, logs || {});
          },
        },
      });

      // Check if training was cancelled during fit
      if (cancelled) {
        return createCancelledResult(startTime, metadata, reporter.getMetrics());
      }

      // Step 4: Save model on successful completion
      const durationMs = Date.now() - startTime;
      const metrics = reporter.getMetrics();
      const finalLogs = metrics[metrics.length - 1] || { loss: 0, acc: 0, val_loss: 0, val_acc: 0 };

      const result: TrainingResult = {
        metrics,
        finalMetrics: {
          loss: finalLogs.loss,
          accuracy: finalLogs.acc,
          val_loss: finalLogs.val_loss,
          val_accuracy: finalLogs.val_acc,
        },
        model,
        metadata,
        cancelled: false,
        durationMs,
      };

      // Persist model to IndexedDB
      try {
        await saveModel({
          model,
          metadata: {
            projectId,
            modelType,
            trainedAt: new Date().toISOString(),
            epochs: trainingConfig.epochs,
            finalAccuracy: finalLogs.acc,
            finalLoss: finalLogs.loss,
            preprocessing: metadata,
          },
        });
      } catch (error) {
        console.warn('Failed to persist model:', error);
      }

      reporter.handleComplete(model, metadata);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks.onError(err);
      throw err;
    } finally {
      // Dispose all tracked tensors
      for (const tensor of tensorsToDispose) {
        try {
          if (tensor && typeof tensor.dispose === 'function') {
            tensor.dispose();
          }
        } catch {
          // Ignore disposal errors
        }
      }
      tensorsToDispose = [];
    }
  };

  return { start, cancel };
}

function createCancelledResult(
  startTime: number,
  metadata: PreprocessingMetadata,
  metrics: any[]
): TrainingResult {
  const finalLogs = metrics[metrics.length - 1] || { loss: 0, acc: 0, val_loss: 0, val_acc: 0 };
  return {
    metrics,
    finalMetrics: {
      loss: finalLogs.loss,
      accuracy: finalLogs.acc,
      val_loss: finalLogs.val_loss,
      val_accuracy: finalLogs.val_acc,
    },
    model: null,
    metadata,
    cancelled: true,
    durationMs: Date.now() - startTime,
  };
}
