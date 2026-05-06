export interface ConfusionMatrixData {
  matrix: number[][];
  labels: string[];
  totalSamples: number;
}

export interface BinaryMetrics {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  specificity: number;
}

export interface MultiClassMetrics {
  accuracy: number;
  macroAvgPrecision: number;
  macroAvgRecall: number;
  macroAvgF1: number;
  perClassMetrics: {
    label: string;
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
  }[];
}

export const confusionMatrixService = {
  /**
   * Generate a simulated confusion matrix based on accuracy
   */
  generateConfusionMatrix(
    accuracy: number,
    labels: string[],
    totalSamples: number = 100
  ): ConfusionMatrixData {
    const numClasses = labels.length;
    const matrix: number[][] = Array(numClasses).fill(0).map(() => Array(numClasses).fill(0));

    // Distribute samples across classes
    const samplesPerClass = Math.floor(totalSamples / numClasses);
    
    for (let i = 0; i < numClasses; i++) {
      const correctPredictions = Math.floor(samplesPerClass * accuracy);
      const incorrectPredictions = samplesPerClass - correctPredictions;

      // Diagonal elements (correct predictions)
      matrix[i][i] = correctPredictions;

      // Distribute errors across other classes
      if (incorrectPredictions > 0) {
        const errorsPerClass = Math.floor(incorrectPredictions / (numClasses - 1));
        const remainder = incorrectPredictions % (numClasses - 1);

        for (let j = 0; j < numClasses; j++) {
          if (i !== j) {
            matrix[i][j] = errorsPerClass;
          }
        }

        // Add remainder to first off-diagonal element
        if (i < numClasses - 1) {
          matrix[i][i + 1] += remainder;
        } else {
          matrix[i][0] += remainder;
        }
      }
    }

    return {
      matrix,
      labels,
      totalSamples,
    };
  },

  /**
   * Calculate binary classification metrics (for 2-class problems)
   */
  calculateBinaryMetrics(matrix: number[][]): BinaryMetrics {
    if (matrix.length !== 2 || matrix[0].length !== 2) {
      throw new Error('Binary metrics require a 2x2 confusion matrix');
    }

    const truePositives = matrix[1][1];
    const falsePositives = matrix[0][1];
    const trueNegatives = matrix[0][0];
    const falseNegatives = matrix[1][0];

    const total = truePositives + falsePositives + trueNegatives + falseNegatives;
    const accuracy = (truePositives + trueNegatives) / total;

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const specificity = trueNegatives / (trueNegatives + falsePositives) || 0;

    return {
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
      accuracy,
      precision,
      recall,
      f1Score,
      specificity,
    };
  },

  /**
   * Calculate multi-class classification metrics
   */
  calculateMultiClassMetrics(matrix: number[][], labels: string[]): MultiClassMetrics {
    const numClasses = matrix.length;
    const perClassMetrics = [];

    let totalCorrect = 0;
    let totalSamples = 0;

    for (let i = 0; i < numClasses; i++) {
      // Calculate per-class metrics
      const truePositives = matrix[i][i];
      
      let falsePositives = 0;
      let falseNegatives = 0;
      let support = 0;

      for (let j = 0; j < numClasses; j++) {
        if (i !== j) {
          falsePositives += matrix[j][i]; // Predicted as i but actually j
          falseNegatives += matrix[i][j]; // Actually i but predicted as j
        }
        support += matrix[i][j]; // Total actual samples of class i
      }

      totalCorrect += truePositives;
      totalSamples += support;

      const precision = truePositives / (truePositives + falsePositives) || 0;
      const recall = truePositives / (truePositives + falseNegatives) || 0;
      const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

      perClassMetrics.push({
        label: labels[i],
        precision,
        recall,
        f1Score,
        support,
      });
    }

    const accuracy = totalCorrect / totalSamples;

    const macroAvgPrecision = perClassMetrics.reduce((sum, m) => sum + m.precision, 0) / numClasses;
    const macroAvgRecall = perClassMetrics.reduce((sum, m) => sum + m.recall, 0) / numClasses;
    const macroAvgF1 = perClassMetrics.reduce((sum, m) => sum + m.f1Score, 0) / numClasses;

    return {
      accuracy,
      macroAvgPrecision,
      macroAvgRecall,
      macroAvgF1,
      perClassMetrics,
    };
  },

  /**
   * Get explanation for a confusion matrix cell
   */
  getCellExplanation(actualIndex: number, predictedIndex: number, labels: string[]): string {
    const actualLabel = labels[actualIndex];
    const predictedLabel = labels[predictedIndex];

    if (actualIndex === predictedIndex) {
      return `Correct predictions: Model correctly identified ${actualLabel}`;
    } else {
      return `Misclassification: Model predicted ${predictedLabel} when it was actually ${actualLabel}`;
    }
  },

  /**
   * Get improvement suggestions based on confusion matrix
   */
  getImprovementSuggestions(matrix: number[][], labels: string[]): string[] {
    const suggestions: string[] = [];
    const numClasses = matrix.length;

    // Find most confused pairs
    let maxConfusion = 0;
    let confusedPair: [number, number] | null = null;

    for (let i = 0; i < numClasses; i++) {
      for (let j = 0; j < numClasses; j++) {
        if (i !== j && matrix[i][j] > maxConfusion) {
          maxConfusion = matrix[i][j];
          confusedPair = [i, j];
        }
      }
    }

    if (confusedPair && maxConfusion > 0) {
      const [actual, predicted] = confusedPair;
      suggestions.push(
        `Model often confuses ${labels[actual]} with ${labels[predicted]}. Consider adding more distinctive features or collecting more training examples for these classes.`
      );
    }

    // Check for class imbalance
    const classSizes = matrix.map((row, i) => row.reduce((sum, val) => sum + val, 0));
    const maxSize = Math.max(...classSizes);
    const minSize = Math.min(...classSizes);

    if (maxSize > minSize * 2) {
      suggestions.push(
        'Class imbalance detected. Consider balancing your dataset or using techniques like oversampling or class weights.'
      );
    }

    // Check for low recall classes
    for (let i = 0; i < numClasses; i++) {
      const total = matrix[i].reduce((sum, val) => sum + val, 0);
      const correct = matrix[i][i];
      const recall = correct / total;

      if (recall < 0.6) {
        suggestions.push(
          `Low recall for ${labels[i]} (${(recall * 100).toFixed(1)}%). The model misses many ${labels[i]} examples. Try collecting more training data for this class.`
        );
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('Model performance looks good! Continue monitoring on new data.');
    }

    return suggestions;
  },
};
