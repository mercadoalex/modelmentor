import * as tf from '@tensorflow/tfjs';
import type { TrainingLog } from '@/components/TrainingLogs';
import type { TrainingStage } from '@/components/TrainingStageIndicator';

export interface EnhancedTrainingCallbacks {
  onStageChange?: (stage: TrainingStage) => void;
  onLog?: (log: TrainingLog) => void;
  onProgress?: (progress: number) => void;
  onEpochEnd?: (epoch: number, logs: any) => void;
  onMetricsUpdate?: (metrics: {
    loss: number;
    accuracy?: number;
    valLoss?: number;
    valAccuracy?: number;
  }) => void;
}

export class EnhancedTrainingPipeline {
  private logs: TrainingLog[] = [];
  private currentStage: TrainingStage = 'idle';
  private callbacks: EnhancedTrainingCallbacks;
  private startTime: number = 0;
  private epochTimes: number[] = [];

  constructor(callbacks: EnhancedTrainingCallbacks = {}) {
    this.callbacks = callbacks;
  }

  private addLog(level: TrainingLog['level'], message: string, details?: string) {
    const log: TrainingLog = {
      timestamp: new Date(),
      level,
      message,
      details,
    };
    this.logs.push(log);
    this.callbacks.onLog?.(log);
  }

  private setStage(stage: TrainingStage) {
    this.currentStage = stage;
    this.callbacks.onStageChange?.(stage);
    this.addLog('info', `Stage: ${stage}`);
  }

  async preprocessData(
    data: any[],
    inputFeatures: string[],
    outputFeature: string
  ): Promise<{ xs: tf.Tensor; ys: tf.Tensor; inputShape: number[] }> {
    this.setStage('preprocessing');
    this.addLog('info', 'Starting data preprocessing...');

    try {
      // Validate data
      if (!data || data.length === 0) {
        throw new Error('No data provided');
      }
      this.addLog('success', `Loaded ${data.length} samples`);

      // Extract features
      this.addLog('info', 'Extracting features...');
      const xData = data.map(row => 
        inputFeatures.map(feature => {
          const value = row[feature];
          return typeof value === 'number' ? value : parseFloat(value) || 0;
        })
      );

      const yData = data.map(row => {
        const value = row[outputFeature];
        return typeof value === 'number' ? value : parseFloat(value) || 0;
      });

      this.addLog('success', `Extracted ${inputFeatures.length} input features`);

      // Convert to tensors
      this.addLog('info', 'Converting to tensors...');
      const xs = tf.tensor2d(xData);
      const ys = tf.tensor2d(yData, [yData.length, 1]);

      // Normalize data
      this.addLog('info', 'Normalizing data...');
      const xsNorm = this.normalize(xs);
      const ysNorm = this.normalize(ys);

      xs.dispose();
      ys.dispose();

      this.addLog('success', 'Data preprocessing completed');
      
      return {
        xs: xsNorm,
        ys: ysNorm,
        inputShape: [inputFeatures.length],
      };
    } catch (error) {
      this.setStage('error');
      this.addLog('error', 'Preprocessing failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private normalize(tensor: tf.Tensor): tf.Tensor {
    const min = tensor.min();
    const max = tensor.max();
    const range = max.sub(min);
    const normalized = tensor.sub(min).div(range);
    
    min.dispose();
    max.dispose();
    range.dispose();
    
    return normalized;
  }

  async buildModel(
    inputShape: number[],
    outputUnits: number,
    config: {
      hiddenLayers?: number[];
      activation?: string;
      optimizer?: string;
      learningRate?: number;
    } = {}
  ): Promise<tf.LayersModel> {
    this.setStage('building');
    this.addLog('info', 'Building model architecture...');

    try {
      const model = tf.sequential();

      // Input layer
      const hiddenLayers = config.hiddenLayers || [64, 32];
      const activation = (config.activation || 'relu') as 'relu' | 'sigmoid' | 'tanh' | 'softmax';
      this.addLog('info', `Adding input layer (${inputShape[0]} features)`);
      
      model.add(tf.layers.dense({
        inputShape,
        units: hiddenLayers[0],
        activation,
      }));

      // Hidden layers
      for (let i = 1; i < hiddenLayers.length; i++) {
        this.addLog('info', `Adding hidden layer ${i} (${hiddenLayers[i]} units)`);
        model.add(tf.layers.dense({
          units: hiddenLayers[i],
          activation,
        }));
      }

      // Output layer
      this.addLog('info', `Adding output layer (${outputUnits} units)`);
      model.add(tf.layers.dense({
        units: outputUnits,
        activation: outputUnits === 1 ? 'linear' : 'softmax',
      }));

      // Compile model
      this.addLog('info', 'Compiling model...');
      const optimizerName = config.optimizer || 'adam';
      const learningRate = config.learningRate || 0.001;
      
      let optimizer: tf.Optimizer;
      if (optimizerName === 'adam') {
        optimizer = tf.train.adam(learningRate);
      } else if (optimizerName === 'sgd') {
        optimizer = tf.train.sgd(learningRate);
      } else if (optimizerName === 'rmsprop') {
        optimizer = tf.train.rmsprop(learningRate);
      } else {
        optimizer = tf.train.adam(learningRate);
      }
      
      model.compile({
        optimizer,
        loss: outputUnits === 1 ? 'meanSquaredError' : 'categoricalCrossentropy',
        metrics: ['accuracy'],
      });

      this.addLog('success', `Model built successfully (${model.countParams()} parameters)`);
      
      return model;
    } catch (error) {
      this.setStage('error');
      this.addLog('error', 'Model building failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async trainModel(
    model: tf.LayersModel,
    xs: tf.Tensor,
    ys: tf.Tensor,
    config: {
      epochs: number;
      batchSize: number;
      validationSplit: number;
      earlyStopping?: boolean;
      earlyStoppingPatience?: number;
      shuffle?: boolean;
    }
  ): Promise<tf.LayersModel> {
    this.setStage('training');
    this.startTime = Date.now();
    this.epochTimes = [];
    
    this.addLog('info', 'Starting model training...');
    this.addLog('info', `Configuration: ${config.epochs} epochs, batch size ${config.batchSize}`, 
      `Validation split: ${(config.validationSplit * 100).toFixed(0)}%`);

    try {
      let bestLoss = Infinity;
      let patienceCounter = 0;
      const patience = config.earlyStoppingPatience || 3;

      await model.fit(xs, ys, {
        epochs: config.epochs,
        batchSize: config.batchSize,
        validationSplit: config.validationSplit,
        shuffle: config.shuffle !== false,
        callbacks: {
          onEpochBegin: async (epoch) => {
            this.epochTimes[epoch] = Date.now();
            this.addLog('info', `Epoch ${epoch + 1}/${config.epochs} started`);
          },
          onEpochEnd: async (epoch, logs) => {
            const epochTime = Date.now() - this.epochTimes[epoch];
            const avgEpochTime = this.epochTimes.length > 0 
              ? this.epochTimes.reduce((sum, time, i) => sum + (Date.now() - time), 0) / this.epochTimes.length
              : epochTime;
            const remainingEpochs = config.epochs - (epoch + 1);
            const estimatedTimeRemaining = (avgEpochTime * remainingEpochs) / 1000;

            // Update metrics
            this.callbacks.onMetricsUpdate?.({
              loss: logs?.loss as number,
              accuracy: logs?.acc as number,
              valLoss: logs?.val_loss as number,
              valAccuracy: logs?.val_acc as number,
            });

            // Log epoch results
            const lossStr = (logs?.loss as number).toFixed(4);
            const accStr = logs?.acc ? `${((logs.acc as number) * 100).toFixed(2)}%` : 'N/A';
            const valLossStr = logs?.val_loss ? (logs.val_loss as number).toFixed(4) : 'N/A';
            const valAccStr = logs?.val_acc ? `${((logs.val_acc as number) * 100).toFixed(2)}%` : 'N/A';

            this.addLog('success', 
              `Epoch ${epoch + 1} completed in ${(epochTime / 1000).toFixed(1)}s`,
              `Loss: ${lossStr}, Acc: ${accStr}, Val Loss: ${valLossStr}, Val Acc: ${valAccStr}`
            );

            // Early stopping check
            if (config.earlyStopping && logs?.val_loss !== undefined) {
              const currentLoss = logs.val_loss as number;
              if (currentLoss < bestLoss) {
                bestLoss = currentLoss;
                patienceCounter = 0;
                this.addLog('success', 'New best model!', `Validation loss: ${currentLoss.toFixed(4)}`);
              } else {
                patienceCounter++;
                if (patienceCounter >= patience) {
                  this.addLog('warning', 'Early stopping triggered', 
                    `No improvement for ${patience} epochs`);
                  model.stopTraining = true;
                }
              }
            }

            // Update progress
            const progress = ((epoch + 1) / config.epochs) * 100;
            this.callbacks.onProgress?.(progress);
            this.callbacks.onEpochEnd?.(epoch + 1, logs);
          },
        },
      });

      const totalTime = (Date.now() - this.startTime) / 1000;
      this.addLog('success', `Training completed in ${totalTime.toFixed(1)}s`);
      
      return model;
    } catch (error) {
      this.setStage('error');
      this.addLog('error', 'Training failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async evaluateModel(
    model: tf.LayersModel,
    xs: tf.Tensor,
    ys: tf.Tensor
  ): Promise<{ loss: number; accuracy?: number }> {
    this.setStage('evaluating');
    this.addLog('info', 'Evaluating model performance...');

    try {
      const result = model.evaluate(xs, ys) as tf.Scalar[];
      const loss = await result[0].data();
      const accuracy = result.length > 1 ? await result[1].data() : undefined;

      result.forEach(tensor => tensor.dispose());

      this.addLog('success', 'Evaluation completed', 
        `Loss: ${loss[0].toFixed(4)}${accuracy ? `, Accuracy: ${(accuracy[0] * 100).toFixed(2)}%` : ''}`);

      return {
        loss: loss[0],
        accuracy: accuracy ? accuracy[0] : undefined,
      };
    } catch (error) {
      this.setStage('error');
      this.addLog('error', 'Evaluation failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  complete() {
    this.setStage('completed');
    const totalTime = (Date.now() - this.startTime) / 1000;
    this.addLog('success', 'Training pipeline completed!', 
      `Total time: ${totalTime.toFixed(1)}s`);
  }

  getLogs(): TrainingLog[] {
    return this.logs;
  }

  getCurrentStage(): TrainingStage {
    return this.currentStage;
  }
}
