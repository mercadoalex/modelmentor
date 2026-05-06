export interface PretrainedModel {
  id: string;
  name: string;
  description: string;
  architecture: string;
  pretrainedOn: string;
  parameters: string;
  bestFor: string[];
  accuracy: number;
  size: string;
}

export interface TransferLearningConfig {
  pretrainedModel: PretrainedModel;
  freezeLayers: number;
  fineTuneEpochs: number;
  learningRate: number;
}

export interface TrainingComparison {
  fromScratch: {
    accuracy: number;
    loss: number;
    trainingTime: number;
    epochs: number;
    convergenceEpoch: number;
  };
  transferLearning: {
    accuracy: number;
    loss: number;
    trainingTime: number;
    epochs: number;
    convergenceEpoch: number;
  };
  benefits: {
    accuracyImprovement: number;
    timeReduction: number;
    dataEfficiency: number;
    fasterConvergence: boolean;
  };
  recommendation: string;
}

export const transferLearningService = {
  /**
   * Get available pre-trained models
   */
  getPretrainedModels(): PretrainedModel[] {
    return [
      {
        id: 'mobilenet_v2',
        name: 'MobileNetV2',
        description: 'Lightweight model optimized for mobile and edge devices',
        architecture: 'Convolutional Neural Network',
        pretrainedOn: 'ImageNet (1.4M images, 1000 classes)',
        parameters: '3.5M',
        bestFor: ['Image Classification', 'Object Recognition', 'Mobile Apps'],
        accuracy: 0.92,
        size: '14 MB',
      },
      {
        id: 'resnet50',
        name: 'ResNet50',
        description: 'Deep residual network with skip connections',
        architecture: '50-layer Residual Network',
        pretrainedOn: 'ImageNet (1.4M images, 1000 classes)',
        parameters: '25.6M',
        bestFor: ['Image Classification', 'Feature Extraction', 'High Accuracy'],
        accuracy: 0.95,
        size: '98 MB',
      },
      {
        id: 'efficientnet_b0',
        name: 'EfficientNet-B0',
        description: 'Balanced model optimizing accuracy and efficiency',
        architecture: 'Efficient Convolutional Network',
        pretrainedOn: 'ImageNet (1.4M images, 1000 classes)',
        parameters: '5.3M',
        bestFor: ['Image Classification', 'Balanced Performance', 'Resource Efficiency'],
        accuracy: 0.94,
        size: '21 MB',
      },
      {
        id: 'bert_base',
        name: 'BERT Base',
        description: 'Bidirectional transformer for text understanding',
        architecture: 'Transformer (12 layers)',
        pretrainedOn: 'Wikipedia + BookCorpus (3.3B words)',
        parameters: '110M',
        bestFor: ['Text Classification', 'Sentiment Analysis', 'NLP Tasks'],
        accuracy: 0.89,
        size: '440 MB',
      },
    ];
  },

  /**
   * Simulate transfer learning training
   */
  simulateTransferLearning(
    config: TransferLearningConfig,
    datasetSize: number,
    targetClasses: number
  ): TrainingComparison {
    const baseAccuracy = config.pretrainedModel.accuracy;
    
    // Transfer learning performance
    const transferAccuracy = Math.min(
      0.98,
      baseAccuracy + (Math.random() * 0.05) + (datasetSize > 100 ? 0.03 : 0)
    );
    const transferLoss = (1 - transferAccuracy) * 1.5 + Math.random() * 0.1;
    const transferTime = config.fineTuneEpochs * 200 + Math.random() * 100;
    const transferConvergence = Math.ceil(config.fineTuneEpochs * 0.4);

    // From scratch performance
    const scratchAccuracy = Math.min(
      0.92,
      0.70 + (datasetSize / 1000) * 0.2 + Math.random() * 0.05
    );
    const scratchLoss = (1 - scratchAccuracy) * 2 + Math.random() * 0.15;
    const scratchEpochs = config.fineTuneEpochs * 3;
    const scratchTime = scratchEpochs * 300 + Math.random() * 200;
    const scratchConvergence = Math.ceil(scratchEpochs * 0.7);

    // Calculate benefits
    const accuracyImprovement = ((transferAccuracy - scratchAccuracy) / scratchAccuracy) * 100;
    const timeReduction = ((scratchTime - transferTime) / scratchTime) * 100;
    const dataEfficiency = datasetSize < 500 ? 80 : datasetSize < 1000 ? 60 : 40;
    const fasterConvergence = transferConvergence < scratchConvergence;

    // Generate recommendation
    let recommendation = '';
    if (accuracyImprovement > 5 && timeReduction > 50) {
      recommendation = 'Transfer learning is highly recommended! It provides significantly better accuracy in much less time.';
    } else if (accuracyImprovement > 3) {
      recommendation = 'Transfer learning is beneficial. It improves accuracy and reduces training time.';
    } else if (datasetSize < 500) {
      recommendation = 'Transfer learning is recommended for small datasets. It helps overcome data limitations.';
    } else {
      recommendation = 'Both approaches work well. Transfer learning offers faster convergence.';
    }

    return {
      fromScratch: {
        accuracy: scratchAccuracy,
        loss: scratchLoss,
        trainingTime: scratchTime,
        epochs: scratchEpochs,
        convergenceEpoch: scratchConvergence,
      },
      transferLearning: {
        accuracy: transferAccuracy,
        loss: transferLoss,
        trainingTime: transferTime,
        epochs: config.fineTuneEpochs,
        convergenceEpoch: transferConvergence,
      },
      benefits: {
        accuracyImprovement,
        timeReduction,
        dataEfficiency,
        fasterConvergence,
      },
      recommendation,
    };
  },

  /**
   * Get recommended freeze layers based on dataset size
   */
  getRecommendedFreezeLayers(datasetSize: number, totalLayers: number = 20): number {
    if (datasetSize < 100) {
      // Very small dataset: freeze most layers
      return Math.floor(totalLayers * 0.9);
    } else if (datasetSize < 500) {
      // Small dataset: freeze many layers
      return Math.floor(totalLayers * 0.7);
    } else if (datasetSize < 1000) {
      // Medium dataset: freeze some layers
      return Math.floor(totalLayers * 0.5);
    } else {
      // Large dataset: freeze fewer layers
      return Math.floor(totalLayers * 0.3);
    }
  },

  /**
   * Get explanation for transfer learning benefits
   */
  getTransferLearningExplanation(datasetSize: number): string[] {
    const explanations: string[] = [
      'Transfer learning uses knowledge from models trained on large datasets (like ImageNet with 1.4M images)',
      'The pre-trained model already learned general features like edges, textures, and patterns',
      'Fine-tuning adapts these features to your specific task, requiring less data and time',
    ];

    if (datasetSize < 500) {
      explanations.push(
        'With small datasets, transfer learning is especially powerful as it prevents overfitting',
        'The pre-trained features provide a strong foundation even with limited training examples'
      );
    }

    explanations.push(
      'Training from scratch requires learning everything from random weights, which needs more data and time',
      'Transfer learning typically converges 2-3x faster and achieves 5-10% higher accuracy'
    );

    return explanations;
  },

  /**
   * Get fine-tuning strategy recommendation
   */
  getFineTuningStrategy(datasetSize: number, similarity: 'high' | 'medium' | 'low'): {
    freezeLayers: number;
    learningRate: number;
    epochs: number;
    strategy: string;
  } {
    let freezeLayers = 15;
    let learningRate = 0.0001;
    let epochs = 20;
    let strategy = '';

    if (similarity === 'high') {
      // Dataset very similar to pre-training data
      freezeLayers = 18;
      learningRate = 0.00001;
      epochs = 10;
      strategy = 'Freeze most layers and use very low learning rate. Your data is similar to the pre-training dataset.';
    } else if (similarity === 'medium') {
      // Dataset somewhat similar
      freezeLayers = 15;
      learningRate = 0.0001;
      epochs = 20;
      strategy = 'Freeze middle layers and use moderate learning rate. Balance between pre-trained features and new learning.';
    } else {
      // Dataset very different
      freezeLayers = 10;
      learningRate = 0.001;
      epochs = 30;
      strategy = 'Freeze fewer layers and use higher learning rate. Your data is different, so more adaptation is needed.';
    }

    // Adjust for dataset size
    if (datasetSize < 100) {
      freezeLayers += 3;
      epochs = Math.max(10, epochs - 5);
      strategy += ' Small dataset: freeze more layers to prevent overfitting.';
    } else if (datasetSize > 1000) {
      freezeLayers = Math.max(5, freezeLayers - 5);
      epochs += 10;
      strategy += ' Large dataset: can fine-tune more layers for better adaptation.';
    }

    return {
      freezeLayers,
      learningRate,
      epochs,
      strategy,
    };
  },

  /**
   * Generate learning curve comparison
   */
  generateLearningCurves(comparison: TrainingComparison): {
    epochs: number[];
    fromScratchAccuracy: number[];
    transferLearningAccuracy: number[];
  } {
    const maxEpochs = Math.max(
      comparison.fromScratch.epochs,
      comparison.transferLearning.epochs
    );

    const epochs = Array.from({ length: maxEpochs }, (_, i) => i + 1);
    const fromScratchAccuracy: number[] = [];
    const transferLearningAccuracy: number[] = [];

    // Generate from-scratch curve (slower convergence)
    for (let i = 0; i < maxEpochs; i++) {
      const progress = (i + 1) / comparison.fromScratch.epochs;
      const accuracy = 0.5 + (comparison.fromScratch.accuracy - 0.5) * Math.pow(progress, 1.5);
      fromScratchAccuracy.push(Math.min(comparison.fromScratch.accuracy, accuracy));
    }

    // Generate transfer learning curve (faster convergence)
    for (let i = 0; i < maxEpochs; i++) {
      if (i < comparison.transferLearning.epochs) {
        const progress = (i + 1) / comparison.transferLearning.epochs;
        const baseAccuracy = 0.75; // Start higher due to pre-training
        const accuracy = baseAccuracy + (comparison.transferLearning.accuracy - baseAccuracy) * Math.pow(progress, 0.8);
        transferLearningAccuracy.push(Math.min(comparison.transferLearning.accuracy, accuracy));
      } else {
        transferLearningAccuracy.push(comparison.transferLearning.accuracy);
      }
    }

    return {
      epochs,
      fromScratchAccuracy,
      transferLearningAccuracy,
    };
  },
};
