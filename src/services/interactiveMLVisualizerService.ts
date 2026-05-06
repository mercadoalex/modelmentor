/**
 * Interactive ML Visualizer Service
 * Provides utilities for visualizing ML concepts
 */

export interface NetworkNode {
  id: string;
  layer: number;
  index: number;
  x: number;
  y: number;
  activation: number;
  bias: number;
}

export interface NetworkConnection {
  from: string;
  to: string;
  weight: number;
}

export interface NetworkArchitecture {
  layers: number[];
  nodes: NetworkNode[];
  connections: NetworkConnection[];
}

export interface DataPoint {
  id: string;
  x: number;
  y: number;
  label: number;
  color: string;
}

export interface DecisionBoundary {
  points: { x: number; y: number; prediction: number }[];
  accuracy: number;
}

export interface GradientStep {
  iteration: number;
  weights: number[];
  loss: number;
  gradient: number[];
}

class InteractiveMLVisualizerService {
  /**
   * Create a neural network architecture
   */
  createNetwork(layers: number[]): NetworkArchitecture {
    const nodes: NetworkNode[] = [];
    const connections: NetworkConnection[] = [];
    
    const layerSpacing = 200;
    const nodeSpacing = 60;

    // Create nodes
    layers.forEach((nodeCount, layerIndex) => {
      const startY = (300 - (nodeCount - 1) * nodeSpacing) / 2;
      
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          id: `L${layerIndex}N${i}`,
          layer: layerIndex,
          index: i,
          x: layerIndex * layerSpacing + 50,
          y: startY + i * nodeSpacing,
          activation: 0,
          bias: (Math.random() - 0.5) * 0.5
        });
      }
    });

    // Create connections
    for (let l = 0; l < layers.length - 1; l++) {
      const currentLayer = nodes.filter(n => n.layer === l);
      const nextLayer = nodes.filter(n => n.layer === l + 1);
      
      currentLayer.forEach(from => {
        nextLayer.forEach(to => {
          connections.push({
            from: from.id,
            to: to.id,
            weight: (Math.random() - 0.5) * 2
          });
        });
      });
    }

    return { layers, nodes, connections };
  }

  /**
   * Forward propagation through network
   */
  forwardPropagate(
    network: NetworkArchitecture,
    input: number[]
  ): NetworkNode[] {
    const nodes = JSON.parse(JSON.stringify(network.nodes)) as NetworkNode[];
    
    // Set input layer activations
    const inputNodes = nodes.filter(n => n.layer === 0);
    inputNodes.forEach((node, i) => {
      node.activation = input[i] || 0;
    });

    // Propagate through layers
    for (let l = 1; l < network.layers.length; l++) {
      const currentLayer = nodes.filter(n => n.layer === l);
      const prevLayer = nodes.filter(n => n.layer === l - 1);
      
      currentLayer.forEach(node => {
        let sum = node.bias;
        
        prevLayer.forEach(prevNode => {
          const connection = network.connections.find(
            c => c.from === prevNode.id && c.to === node.id
          );
          if (connection) {
            sum += prevNode.activation * connection.weight;
          }
        });
        
        // ReLU activation
        node.activation = Math.max(0, sum);
      });
    }

    return nodes;
  }

  /**
   * Generate synthetic classification data
   */
  generateClassificationData(
    count: number = 50,
    pattern: 'linear' | 'circular' | 'xor' = 'linear'
  ): DataPoint[] {
    const points: DataPoint[] = [];
    
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 10 - 5;
      const y = Math.random() * 10 - 5;
      
      let label = 0;
      
      switch (pattern) {
        case 'linear':
          label = y > x ? 1 : 0;
          break;
        case 'circular':
          label = Math.sqrt(x * x + y * y) < 3 ? 1 : 0;
          break;
        case 'xor':
          label = (x > 0 && y > 0) || (x < 0 && y < 0) ? 1 : 0;
          break;
      }
      
      points.push({
        id: `point-${i}`,
        x,
        y,
        label,
        color: label === 1 ? '#3b82f6' : '#ef4444'
      });
    }
    
    return points;
  }

  /**
   * Calculate decision boundary
   */
  calculateDecisionBoundary(
    data: DataPoint[],
    complexity: number = 1
  ): DecisionBoundary {
    const points: { x: number; y: number; prediction: number }[] = [];
    const resolution = 20;
    
    // Simple decision boundary based on complexity
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = (i / resolution) * 10 - 5;
        const y = (j / resolution) * 10 - 5;
        
        // Simplified prediction based on complexity
        let prediction = 0;
        if (complexity === 1) {
          // Linear
          prediction = y > x ? 1 : 0;
        } else if (complexity === 2) {
          // Quadratic
          prediction = y > x * x / 3 ? 1 : 0;
        } else {
          // Complex (overfitting)
          const nearest = this.findNearestPoint(data, x, y);
          prediction = nearest.label;
        }
        
        points.push({ x, y, prediction });
      }
    }
    
    // Calculate accuracy
    let correct = 0;
    data.forEach(point => {
      const boundaryPoint = points.reduce((closest, p) => {
        const dist = Math.sqrt(
          Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)
        );
        const closestDist = Math.sqrt(
          Math.pow(closest.x - point.x, 2) + Math.pow(closest.y - point.y, 2)
        );
        return dist < closestDist ? p : closest;
      });
      
      if (boundaryPoint.prediction === point.label) {
        correct++;
      }
    });
    
    const accuracy = correct / data.length;
    
    return { points, accuracy };
  }

  private findNearestPoint(data: DataPoint[], x: number, y: number): DataPoint {
    return data.reduce((nearest, point) => {
      const dist = Math.sqrt(
        Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
      );
      const nearestDist = Math.sqrt(
        Math.pow(nearest.x - x, 2) + Math.pow(nearest.y - y, 2)
      );
      return dist < nearestDist ? point : nearest;
    });
  }

  /**
   * Simulate gradient descent
   */
  simulateGradientDescent(
    learningRate: number = 0.1,
    momentum: number = 0,
    steps: number = 50
  ): GradientStep[] {
    const history: GradientStep[] = [];
    
    // Start at a random point
    let weights = [Math.random() * 4 - 2, Math.random() * 4 - 2];
    let velocity = [0, 0];
    
    for (let i = 0; i < steps; i++) {
      // Calculate loss (simple quadratic function)
      const loss = weights[0] * weights[0] + weights[1] * weights[1];
      
      // Calculate gradient
      const gradient = [2 * weights[0], 2 * weights[1]];
      
      // Update with momentum
      velocity[0] = momentum * velocity[0] - learningRate * gradient[0];
      velocity[1] = momentum * velocity[1] - learningRate * gradient[1];
      
      weights[0] += velocity[0];
      weights[1] += velocity[1];
      
      history.push({
        iteration: i,
        weights: [...weights],
        loss,
        gradient: [...gradient]
      });
    }
    
    return history;
  }

  /**
   * Generate loss landscape for visualization
   */
  generateLossLandscape(resolution: number = 20): number[][] {
    const landscape: number[][] = [];
    
    for (let i = 0; i < resolution; i++) {
      const row: number[] = [];
      for (let j = 0; j < resolution; j++) {
        const x = (i / resolution) * 4 - 2;
        const y = (j / resolution) * 4 - 2;
        
        // Simple quadratic loss function
        const loss = x * x + y * y;
        row.push(loss);
      }
      landscape.push(row);
    }
    
    return landscape;
  }

  /**
   * Simulate training with overfitting
   */
  simulateTrainingCurves(
    complexity: number,
    regularization: number = 0,
    epochs: number = 100
  ): { training: number[]; validation: number[] } {
    const training: number[] = [];
    const validation: number[] = [];
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      // Training loss decreases
      const trainingLoss = Math.exp(-epoch / 20) * (1 + Math.random() * 0.1);
      training.push(trainingLoss);
      
      // Validation loss behavior depends on complexity and regularization
      let validationLoss: number;
      
      if (complexity > 5 && regularization < 0.1) {
        // Overfitting: validation loss increases after initial decrease
        if (epoch < 20) {
          validationLoss = Math.exp(-epoch / 20) * (1 + Math.random() * 0.15);
        } else {
          validationLoss = Math.exp(-20 / 20) * (1 + (epoch - 20) / 50) * (1 + Math.random() * 0.15);
        }
      } else if (complexity < 2) {
        // Underfitting: both losses remain high
        validationLoss = 0.5 + Math.exp(-epoch / 30) * 0.3 * (1 + Math.random() * 0.1);
      } else {
        // Good fit: validation loss decreases similarly to training
        validationLoss = Math.exp(-epoch / 20) * (1 + Math.random() * 0.15) * (1 + regularization);
      }
      
      validation.push(validationLoss);
    }
    
    return { training, validation };
  }

  /**
   * Simulate dropout effect
   */
  simulateDropout(
    network: NetworkArchitecture,
    dropoutRate: number
  ): { active: string[]; dropped: string[] } {
    const active: string[] = [];
    const dropped: string[] = [];
    
    // Don't drop input or output layer
    network.nodes.forEach(node => {
      if (node.layer === 0 || node.layer === network.layers.length - 1) {
        active.push(node.id);
      } else {
        if (Math.random() > dropoutRate) {
          active.push(node.id);
        } else {
          dropped.push(node.id);
        }
      }
    });
    
    return { active, dropped };
  }

  /**
   * Calculate activation function output
   */
  activationFunction(x: number, type: 'relu' | 'sigmoid' | 'tanh'): number {
    switch (type) {
      case 'relu':
        return Math.max(0, x);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
        return Math.tanh(x);
      default:
        return x;
    }
  }

  /**
   * Generate activation function curve
   */
  generateActivationCurve(
    type: 'relu' | 'sigmoid' | 'tanh',
    points: number = 100
  ): { x: number; y: number }[] {
    const curve: { x: number; y: number }[] = [];
    
    for (let i = 0; i < points; i++) {
      const x = (i / points) * 10 - 5;
      const y = this.activationFunction(x, type);
      curve.push({ x, y });
    }
    
    return curve;
  }
}

export const interactiveMLVisualizerService = new InteractiveMLVisualizerService();
