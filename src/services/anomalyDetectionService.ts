/**
 * Anomaly Detection Service
 * Implements three anomaly detection algorithms:
 * 1. Isolation Forest
 * 2. Autoencoder
 * 3. One-Class SVM
 */

export interface DataPoint {
  id: string;
  features: number[];
  isAnomaly?: boolean;
  anomalyScore?: number;
}

export interface AnomalyDetectionResult {
  anomalies: DataPoint[];
  normal: DataPoint[];
  scores: number[];
  threshold: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
}

export interface IsolationTreeNode {
  splitFeature?: number;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
  size: number;
  isLeaf: boolean;
}

class AnomalyDetectionService {
  /**
   * Isolation Forest Algorithm
   * Isolates anomalies by randomly selecting features and split values
   * Anomalies are easier to isolate (shorter path length)
   */
  isolationForest(
    data: DataPoint[],
    numTrees: number = 100,
    sampleSize: number = 256,
    contamination: number = 0.1
  ): AnomalyDetectionResult {
    const trees: IsolationTreeNode[] = [];
    
    // Build isolation trees
    for (let i = 0; i < numTrees; i++) {
      const sample = this.randomSample(data, Math.min(sampleSize, data.length));
      const tree = this.buildIsolationTree(sample, 0, Math.ceil(Math.log2(sampleSize)));
      trees.push(tree);
    }
    
    // Calculate anomaly scores for each point
    const scores = data.map(point => {
      const avgPathLength = trees.reduce((sum, tree) => {
        return sum + this.pathLength(point, tree, 0);
      }, 0) / numTrees;
      
      // Normalize by expected path length
      const c = this.expectedPathLength(sampleSize);
      return Math.pow(2, -avgPathLength / c);
    });
    
    // Determine threshold based on contamination rate
    const sortedScores = [...scores].sort((a, b) => b - a);
    const thresholdIndex = Math.floor(data.length * contamination);
    const threshold = sortedScores[thresholdIndex];
    
    // Classify points
    const anomalies: DataPoint[] = [];
    const normal: DataPoint[] = [];
    
    data.forEach((point, idx) => {
      const score = scores[idx];
      const isAnomaly = score > threshold;
      const classifiedPoint = { ...point, anomalyScore: score, isAnomaly };
      
      if (isAnomaly) {
        anomalies.push(classifiedPoint);
      } else {
        normal.push(classifiedPoint);
      }
    });
    
    return {
      anomalies,
      normal,
      scores,
      threshold,
      ...this.calculateMetrics(data, scores, threshold)
    };
  }
  
  private buildIsolationTree(
    data: DataPoint[],
    currentDepth: number,
    maxDepth: number
  ): IsolationTreeNode {
    if (currentDepth >= maxDepth || data.length <= 1) {
      return {
        size: data.length,
        isLeaf: true
      };
    }
    
    // Randomly select feature and split value
    const numFeatures = data[0].features.length;
    const splitFeature = Math.floor(Math.random() * numFeatures);
    
    const featureValues = data.map(d => d.features[splitFeature]);
    const minVal = Math.min(...featureValues);
    const maxVal = Math.max(...featureValues);
    
    if (minVal === maxVal) {
      return {
        size: data.length,
        isLeaf: true
      };
    }
    
    const splitValue = minVal + Math.random() * (maxVal - minVal);
    
    // Split data
    const leftData = data.filter(d => d.features[splitFeature] < splitValue);
    const rightData = data.filter(d => d.features[splitFeature] >= splitValue);
    
    return {
      splitFeature,
      splitValue,
      left: this.buildIsolationTree(leftData, currentDepth + 1, maxDepth),
      right: this.buildIsolationTree(rightData, currentDepth + 1, maxDepth),
      size: data.length,
      isLeaf: false
    };
  }
  
  private pathLength(point: DataPoint, node: IsolationTreeNode, currentLength: number): number {
    if (node.isLeaf) {
      return currentLength + this.expectedPathLength(node.size);
    }
    
    if (node.splitFeature !== undefined && node.splitValue !== undefined) {
      if (point.features[node.splitFeature] < node.splitValue && node.left) {
        return this.pathLength(point, node.left, currentLength + 1);
      } else if (node.right) {
        return this.pathLength(point, node.right, currentLength + 1);
      }
    }
    
    return currentLength;
  }
  
  private expectedPathLength(n: number): number {
    if (n <= 1) return 0;
    const H = Math.log(n - 1) + 0.5772156649; // Euler's constant
    return 2 * H - (2 * (n - 1) / n);
  }
  
  /**
   * Autoencoder-based Anomaly Detection
   * Trains a neural network to reconstruct normal data
   * High reconstruction error indicates anomaly
   */
  autoencoder(
    data: DataPoint[],
    encodingDim: number = 2,
    contamination: number = 0.1
  ): AnomalyDetectionResult {
    // Simplified autoencoder simulation
    // In production, this would use TensorFlow.js
    
    const inputDim = data[0].features.length;
    
    // Simulate encoding and decoding
    const reconstructionErrors = data.map(point => {
      // Simulate compression loss
      const compressionRatio = encodingDim / inputDim;
      
      // Calculate reconstruction error
      let error = 0;
      point.features.forEach((value, idx) => {
        // Simulate reconstruction with some loss
        const noise = (Math.random() - 0.5) * 0.1;
        const reconstructed = value * compressionRatio + noise;
        error += Math.pow(value - reconstructed, 2);
      });
      
      return Math.sqrt(error / inputDim); // MSE
    });
    
    // Normalize scores to [0, 1]
    const maxError = Math.max(...reconstructionErrors);
    const scores = reconstructionErrors.map(e => e / maxError);
    
    // Determine threshold
    const sortedScores = [...scores].sort((a, b) => b - a);
    const thresholdIndex = Math.floor(data.length * contamination);
    const threshold = sortedScores[thresholdIndex];
    
    // Classify points
    const anomalies: DataPoint[] = [];
    const normal: DataPoint[] = [];
    
    data.forEach((point, idx) => {
      const score = scores[idx];
      const isAnomaly = score > threshold;
      const classifiedPoint = { ...point, anomalyScore: score, isAnomaly };
      
      if (isAnomaly) {
        anomalies.push(classifiedPoint);
      } else {
        normal.push(classifiedPoint);
      }
    });
    
    return {
      anomalies,
      normal,
      scores,
      threshold,
      ...this.calculateMetrics(data, scores, threshold)
    };
  }
  
  /**
   * One-Class SVM
   * Learns a decision boundary around normal data
   * Points outside the boundary are anomalies
   */
  oneClassSVM(
    data: DataPoint[],
    nu: number = 0.1,
    gamma: number = 0.1
  ): AnomalyDetectionResult {
    // Simplified One-Class SVM simulation
    // In production, this would use a proper SVM library
    
    // Calculate center of normal data (assuming most data is normal)
    const center = this.calculateCenter(data);
    
    // Calculate distances from center
    const distances = data.map(point => {
      return this.euclideanDistance(point.features, center);
    });
    
    // Apply RBF kernel transformation
    const scores = distances.map(d => {
      return Math.exp(-gamma * d * d);
    });
    
    // Invert scores (higher distance = higher anomaly score)
    const invertedScores = scores.map(s => 1 - s);
    
    // Normalize to [0, 1]
    const maxScore = Math.max(...invertedScores);
    const normalizedScores = invertedScores.map(s => s / maxScore);
    
    // Determine threshold based on nu parameter
    const sortedScores = [...normalizedScores].sort((a, b) => b - a);
    const thresholdIndex = Math.floor(data.length * nu);
    const threshold = sortedScores[thresholdIndex];
    
    // Classify points
    const anomalies: DataPoint[] = [];
    const normal: DataPoint[] = [];
    
    data.forEach((point, idx) => {
      const score = normalizedScores[idx];
      const isAnomaly = score > threshold;
      const classifiedPoint = { ...point, anomalyScore: score, isAnomaly };
      
      if (isAnomaly) {
        anomalies.push(classifiedPoint);
      } else {
        normal.push(classifiedPoint);
      }
    });
    
    return {
      anomalies,
      normal,
      scores: normalizedScores,
      threshold,
      ...this.calculateMetrics(data, normalizedScores, threshold)
    };
  }
  
  /**
   * Generate synthetic dataset with anomalies
   */
  generateSyntheticData(
    numNormal: number = 200,
    numAnomalies: number = 20,
    numFeatures: number = 2
  ): DataPoint[] {
    const data: DataPoint[] = [];
    
    // Generate normal data (clustered around origin)
    for (let i = 0; i < numNormal; i++) {
      const features: number[] = [];
      for (let j = 0; j < numFeatures; j++) {
        // Normal distribution around 0
        features.push(this.randomNormal(0, 1));
      }
      data.push({
        id: `normal_${i}`,
        features,
        isAnomaly: false
      });
    }
    
    // Generate anomalies (far from origin)
    for (let i = 0; i < numAnomalies; i++) {
      const features: number[] = [];
      for (let j = 0; j < numFeatures; j++) {
        // Anomalies are far from center
        const sign = Math.random() > 0.5 ? 1 : -1;
        features.push(sign * (3 + Math.random() * 2));
      }
      data.push({
        id: `anomaly_${i}`,
        features,
        isAnomaly: true
      });
    }
    
    // Shuffle data
    return this.shuffleArray(data);
  }
  
  /**
   * Helper methods
   */
  private randomSample<T>(array: T[], size: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, size);
  }
  
  private calculateCenter(data: DataPoint[]): number[] {
    const numFeatures = data[0].features.length;
    const center: number[] = new Array(numFeatures).fill(0);
    
    data.forEach(point => {
      point.features.forEach((value, idx) => {
        center[idx] += value;
      });
    });
    
    return center.map(sum => sum / data.length);
  }
  
  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, idx) => sum + Math.pow(val - b[idx], 2), 0)
    );
  }
  
  private randomNormal(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
  
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  private calculateMetrics(
    data: DataPoint[],
    scores: number[],
    threshold: number
  ): { accuracy?: number; precision?: number; recall?: number; f1Score?: number } {
    // Only calculate if ground truth is available
    const hasGroundTruth = data.some(d => d.isAnomaly !== undefined);
    if (!hasGroundTruth) {
      return {};
    }
    
    let tp = 0, fp = 0, tn = 0, fn = 0;
    
    data.forEach((point, idx) => {
      const predicted = scores[idx] > threshold;
      const actual = point.isAnomaly || false;
      
      if (predicted && actual) tp++;
      else if (predicted && !actual) fp++;
      else if (!predicted && !actual) tn++;
      else fn++;
    });
    
    const accuracy = (tp + tn) / (tp + tn + fp + fn);
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    return { accuracy, precision, recall, f1Score };
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
