export type EnsembleMethod = 'voting_hard' | 'voting_soft' | 'averaging' | 'weighted_averaging' | 'stacking';

export interface ModelPrediction {
  modelName: string;
  predictions: number[];
  accuracy: number;
  confidence: number;
}

export interface EnsembleResult {
  method: EnsembleMethod;
  predictions: number[];
  accuracy: number;
  improvement: number;
  diversity: number;
}

export interface DiversityMetrics {
  pairwiseDiversity: number[][];
  averageDiversity: number;
  disagreementRate: number;
  correlationMatrix: number[][];
}

export interface EnsembleRecommendation {
  method: EnsembleMethod;
  models: string[];
  expectedImprovement: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

export const ensembleService = {
  /**
   * Generate sample model predictions
   */
  generateModelPredictions(
    numSamples: number = 100,
    numModels: number = 3
  ): { models: ModelPrediction[]; trueLabels: number[] } {
    const trueLabels: number[] = [];
    const models: ModelPrediction[] = [];
    
    // Generate true labels
    for (let i = 0; i < numSamples; i++) {
      trueLabels.push(Math.random() > 0.5 ? 1 : 0);
    }
    
    // Generate predictions for each model
    const modelNames = ['Decision Tree', 'Random Forest', 'Neural Network', 'SVM', 'Logistic Regression'];
    const baseAccuracies = [0.75, 0.82, 0.85, 0.78, 0.80];
    
    for (let m = 0; m < numModels; m++) {
      const predictions: number[] = [];
      const baseAccuracy = baseAccuracies[m] || 0.80;
      
      for (let i = 0; i < numSamples; i++) {
        const correctProb = baseAccuracy + (Math.random() - 0.5) * 0.1;
        const prediction = Math.random() < correctProb ? trueLabels[i] : 1 - trueLabels[i];
        predictions.push(prediction);
      }
      
      const accuracy = predictions.filter((p, i) => p === trueLabels[i]).length / numSamples;
      
      models.push({
        modelName: modelNames[m],
        predictions,
        accuracy,
        confidence: 0.7 + Math.random() * 0.2,
      });
    }
    
    return { models, trueLabels };
  },

  /**
   * Hard voting ensemble
   */
  hardVoting(models: ModelPrediction[]): number[] {
    const numSamples = models[0].predictions.length;
    const ensemblePredictions: number[] = [];
    
    for (let i = 0; i < numSamples; i++) {
      const votes = models.map(m => m.predictions[i]);
      const sum = votes.reduce((a, b) => a + b, 0);
      ensemblePredictions.push(sum > models.length / 2 ? 1 : 0);
    }
    
    return ensemblePredictions;
  },

  /**
   * Soft voting ensemble (weighted by confidence)
   */
  softVoting(models: ModelPrediction[]): number[] {
    const numSamples = models[0].predictions.length;
    const ensemblePredictions: number[] = [];
    
    for (let i = 0; i < numSamples; i++) {
      let weightedSum = 0;
      let totalWeight = 0;
      
      models.forEach(model => {
        weightedSum += model.predictions[i] * model.confidence;
        totalWeight += model.confidence;
      });
      
      ensemblePredictions.push(weightedSum / totalWeight > 0.5 ? 1 : 0);
    }
    
    return ensemblePredictions;
  },

  /**
   * Simple averaging ensemble
   */
  averaging(models: ModelPrediction[]): number[] {
    const numSamples = models[0].predictions.length;
    const ensemblePredictions: number[] = [];
    
    for (let i = 0; i < numSamples; i++) {
      const avg = models.reduce((sum, m) => sum + m.predictions[i], 0) / models.length;
      ensemblePredictions.push(avg > 0.5 ? 1 : 0);
    }
    
    return ensemblePredictions;
  },

  /**
   * Weighted averaging ensemble (weighted by accuracy)
   */
  weightedAveraging(models: ModelPrediction[]): number[] {
    const numSamples = models[0].predictions.length;
    const ensemblePredictions: number[] = [];
    
    const totalAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0);
    
    for (let i = 0; i < numSamples; i++) {
      let weightedSum = 0;
      
      models.forEach(model => {
        weightedSum += model.predictions[i] * (model.accuracy / totalAccuracy);
      });
      
      ensemblePredictions.push(weightedSum > 0.5 ? 1 : 0);
    }
    
    return ensemblePredictions;
  },

  /**
   * Stacking ensemble (meta-learner)
   */
  stacking(models: ModelPrediction[], trueLabels: number[]): number[] {
    const numSamples = models[0].predictions.length;
    const ensemblePredictions: number[] = [];
    
    // Simple meta-learner: weighted combination based on model accuracy
    const weights = models.map(m => m.accuracy);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    for (let i = 0; i < numSamples; i++) {
      let weightedSum = 0;
      
      models.forEach((model, idx) => {
        weightedSum += model.predictions[i] * normalizedWeights[idx];
      });
      
      ensemblePredictions.push(weightedSum > 0.5 ? 1 : 0);
    }
    
    return ensemblePredictions;
  },

  /**
   * Create ensemble with specified method
   */
  createEnsemble(
    models: ModelPrediction[],
    trueLabels: number[],
    method: EnsembleMethod
  ): EnsembleResult {
    let predictions: number[];
    
    switch (method) {
      case 'voting_hard':
        predictions = this.hardVoting(models);
        break;
      case 'voting_soft':
        predictions = this.softVoting(models);
        break;
      case 'averaging':
        predictions = this.averaging(models);
        break;
      case 'weighted_averaging':
        predictions = this.weightedAveraging(models);
        break;
      case 'stacking':
        predictions = this.stacking(models, trueLabels);
        break;
      default:
        predictions = this.hardVoting(models);
    }
    
    const accuracy = predictions.filter((p, i) => p === trueLabels[i]).length / trueLabels.length;
    const bestModelAccuracy = Math.max(...models.map(m => m.accuracy));
    const improvement = accuracy - bestModelAccuracy;
    const diversity = this.calculateDiversity(models).averageDiversity;
    
    return {
      method,
      predictions,
      accuracy,
      improvement,
      diversity,
    };
  },

  /**
   * Calculate diversity metrics
   */
  calculateDiversity(models: ModelPrediction[]): DiversityMetrics {
    const numModels = models.length;
    const numSamples = models[0].predictions.length;
    
    // Pairwise diversity (disagreement rate)
    const pairwiseDiversity: number[][] = Array(numModels).fill(0).map(() => Array(numModels).fill(0));
    
    for (let i = 0; i < numModels; i++) {
      for (let j = 0; j < numModels; j++) {
        if (i === j) {
          pairwiseDiversity[i][j] = 0;
        } else {
          let disagreements = 0;
          for (let k = 0; k < numSamples; k++) {
            if (models[i].predictions[k] !== models[j].predictions[k]) {
              disagreements++;
            }
          }
          pairwiseDiversity[i][j] = disagreements / numSamples;
        }
      }
    }
    
    // Average diversity
    let totalDiversity = 0;
    let count = 0;
    for (let i = 0; i < numModels; i++) {
      for (let j = i + 1; j < numModels; j++) {
        totalDiversity += pairwiseDiversity[i][j];
        count++;
      }
    }
    const averageDiversity = count > 0 ? totalDiversity / count : 0;
    
    // Overall disagreement rate
    let totalDisagreements = 0;
    for (let k = 0; k < numSamples; k++) {
      const predictions = models.map(m => m.predictions[k]);
      const uniquePredictions = new Set(predictions).size;
      if (uniquePredictions > 1) {
        totalDisagreements++;
      }
    }
    const disagreementRate = totalDisagreements / numSamples;
    
    // Correlation matrix (simplified)
    const correlationMatrix = pairwiseDiversity.map(row => 
      row.map(val => 1 - val) // Convert disagreement to agreement
    );
    
    return {
      pairwiseDiversity,
      averageDiversity,
      disagreementRate,
      correlationMatrix,
    };
  },

  /**
   * Get ensemble recommendations
   */
  getRecommendations(
    models: ModelPrediction[],
    trueLabels: number[]
  ): EnsembleRecommendation[] {
    const diversity = this.calculateDiversity(models);
    const recommendations: EnsembleRecommendation[] = [];
    
    // Analyze model characteristics
    const avgAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0) / models.length;
    const accuracyVariance = models.reduce((sum, m) => sum + Math.pow(m.accuracy - avgAccuracy, 2), 0) / models.length;
    
    // Recommendation 1: Voting
    if (diversity.averageDiversity > 0.2) {
      recommendations.push({
        method: 'voting_hard',
        models: models.map(m => m.modelName),
        expectedImprovement: 0.03 + diversity.averageDiversity * 0.1,
        reasoning: 'High diversity between models makes voting effective. Models make different errors that can cancel out.',
        confidence: 'high',
      });
    }
    
    // Recommendation 2: Weighted averaging
    if (accuracyVariance > 0.01) {
      recommendations.push({
        method: 'weighted_averaging',
        models: models.map(m => m.modelName),
        expectedImprovement: 0.04 + accuracyVariance * 0.5,
        reasoning: 'Models have different accuracy levels. Weighted averaging gives more influence to better models.',
        confidence: 'high',
      });
    }
    
    // Recommendation 3: Stacking
    if (models.length >= 3 && diversity.averageDiversity > 0.15) {
      recommendations.push({
        method: 'stacking',
        models: models.map(m => m.modelName),
        expectedImprovement: 0.05 + diversity.averageDiversity * 0.15,
        reasoning: 'Multiple diverse models available. Stacking can learn optimal combination weights.',
        confidence: 'medium',
      });
    }
    
    // Recommendation 4: Simple averaging
    if (diversity.averageDiversity < 0.15) {
      recommendations.push({
        method: 'averaging',
        models: models.map(m => m.modelName),
        expectedImprovement: 0.02,
        reasoning: 'Models are similar. Simple averaging provides stable predictions without overfitting.',
        confidence: 'medium',
      });
    }
    
    return recommendations.sort((a, b) => b.expectedImprovement - a.expectedImprovement);
  },

  /**
   * Get method explanations
   */
  getMethodExplanations(): Record<EnsembleMethod, {
    name: string;
    description: string;
    howItWorks: string;
    pros: string[];
    cons: string[];
    bestFor: string;
  }> {
    return {
      voting_hard: {
        name: 'Hard Voting',
        description: 'Each model votes for a class, majority wins',
        howItWorks: 'Count votes from each model. The class with the most votes is the final prediction.',
        pros: [
          'Simple and intuitive',
          'Works well with diverse models',
          'Reduces variance',
        ],
        cons: [
          'Treats all models equally',
          'Ignores prediction confidence',
          'May not work well if models are similar',
        ],
        bestFor: 'Diverse models with similar accuracy',
      },
      voting_soft: {
        name: 'Soft Voting',
        description: 'Weighted voting based on model confidence',
        howItWorks: 'Average the predicted probabilities weighted by model confidence, then apply threshold.',
        pros: [
          'Considers prediction confidence',
          'More nuanced than hard voting',
          'Better for probabilistic models',
        ],
        cons: [
          'Requires probability estimates',
          'More complex than hard voting',
          'Sensitive to confidence calibration',
        ],
        bestFor: 'Models that output well-calibrated probabilities',
      },
      averaging: {
        name: 'Simple Averaging',
        description: 'Average predictions from all models',
        howItWorks: 'Take the arithmetic mean of all model predictions.',
        pros: [
          'Very simple to implement',
          'Reduces overfitting',
          'Stable predictions',
        ],
        cons: [
          'Treats all models equally',
          'May not be optimal if models have different quality',
          'Can be suboptimal with highly correlated models',
        ],
        bestFor: 'Models with similar performance',
      },
      weighted_averaging: {
        name: 'Weighted Averaging',
        description: 'Average predictions weighted by model accuracy',
        howItWorks: 'Weight each model\'s prediction by its accuracy, then average.',
        pros: [
          'Gives more weight to better models',
          'Often better than simple averaging',
          'Easy to understand',
        ],
        cons: [
          'Requires validation set to determine weights',
          'May overfit to validation performance',
          'Weights may not generalize',
        ],
        bestFor: 'Models with varying accuracy levels',
      },
      stacking: {
        name: 'Stacking (Meta-Learning)',
        description: 'Train a meta-model to combine base model predictions',
        howItWorks: 'Use base model predictions as features for a meta-learner that makes the final prediction.',
        pros: [
          'Can learn complex combination strategies',
          'Often achieves best performance',
          'Flexible and powerful',
        ],
        cons: [
          'More complex to implement',
          'Requires additional training data',
          'Risk of overfitting',
        ],
        bestFor: 'Large datasets with diverse base models',
      },
    };
  },

  /**
   * Get best practices
   */
  getBestPractices(): string[] {
    return [
      'Use diverse models (different algorithms, features, or hyperparameters)',
      'Ensure base models have reasonable accuracy (>60%) before ensembling',
      'More diversity generally leads to better ensemble performance',
      'Start with simple methods (voting, averaging) before trying stacking',
      'Use cross-validation to evaluate ensemble performance',
      'Monitor for overfitting, especially with stacking',
      'Consider computational cost: ensembles are slower than single models',
      'Ensemble 3-5 models for best balance of performance and complexity',
    ];
  },

  /**
   * Analyze ensemble potential
   */
  analyzeEnsemblePotential(models: ModelPrediction[]): {
    potential: 'high' | 'medium' | 'low';
    reasoning: string;
    expectedImprovement: number;
  } {
    const diversity = this.calculateDiversity(models);
    const avgAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0) / models.length;
    
    let potential: 'high' | 'medium' | 'low';
    let reasoning: string;
    let expectedImprovement: number;
    
    if (diversity.averageDiversity > 0.25 && avgAccuracy > 0.75) {
      potential = 'high';
      reasoning = 'High diversity and good base model accuracy. Ensemble can significantly improve performance.';
      expectedImprovement = 0.05 + diversity.averageDiversity * 0.1;
    } else if (diversity.averageDiversity > 0.15 && avgAccuracy > 0.65) {
      potential = 'medium';
      reasoning = 'Moderate diversity and acceptable base model accuracy. Ensemble will provide some improvement.';
      expectedImprovement = 0.03 + diversity.averageDiversity * 0.08;
    } else {
      potential = 'low';
      reasoning = 'Low diversity or poor base model accuracy. Ensemble may not provide significant improvement.';
      expectedImprovement = 0.01 + diversity.averageDiversity * 0.05;
    }
    
    return { potential, reasoning, expectedImprovement };
  },
};
