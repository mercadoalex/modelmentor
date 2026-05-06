export type RegularizationType = 'none' | 'l1' | 'l2' | 'dropout';

export interface RegularizationParams {
  l1Strength: number; // 0 to 1
  l2Strength: number; // 0 to 1
  dropoutRate: number; // 0 to 0.5
}

export interface TrainingCurvePoint {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  trainAccuracy: number;
  valAccuracy: number;
}

export interface RegularizationEffect {
  biasChange: number;
  varianceChange: number;
  overfittingReduction: number;
  performanceImpact: number;
}

export const regularizationService = {
  /**
   * Generate training curves with regularization
   */
  generateTrainingCurves(
    params: RegularizationParams,
    epochs: number = 50
  ): TrainingCurvePoint[] {
    const curves: TrainingCurvePoint[] = [];
    
    // Base learning parameters
    const baseTrainLoss = 0.8;
    const baseValLoss = 0.9;
    
    // Calculate regularization effect
    const totalRegularization = params.l1Strength + params.l2Strength + params.dropoutRate;
    const regularizationFactor = Math.min(totalRegularization, 0.5);
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      const progress = epoch / epochs;
      
      // Training loss decreases faster without regularization
      const trainDecayRate = 0.05 + regularizationFactor * 0.02;
      const trainLoss = baseTrainLoss * Math.exp(-trainDecayRate * epoch) + 0.05;
      
      // Validation loss with overfitting
      let valLoss: number;
      if (regularizationFactor < 0.1) {
        // No regularization: overfitting after epoch 20
        if (epoch < 20) {
          valLoss = baseValLoss * Math.exp(-0.04 * epoch) + 0.1;
        } else {
          valLoss = 0.3 + (epoch - 20) * 0.01; // Starts increasing
        }
      } else {
        // With regularization: better generalization
        const valDecayRate = 0.04 + regularizationFactor * 0.01;
        valLoss = baseValLoss * Math.exp(-valDecayRate * epoch) + 0.1 + regularizationFactor * 0.05;
      }
      
      // Convert loss to accuracy (inverse relationship)
      const trainAccuracy = 1 - trainLoss * 0.8;
      const valAccuracy = 1 - valLoss * 0.8;
      
      curves.push({
        epoch: epoch + 1,
        trainLoss,
        valLoss,
        trainAccuracy,
        valAccuracy,
      });
    }
    
    return curves;
  },

  /**
   * Calculate regularization effect
   */
  calculateEffect(params: RegularizationParams): RegularizationEffect {
    // L1 effect: feature selection, reduces model complexity
    const l1Effect = params.l1Strength * 0.3;
    
    // L2 effect: weight shrinkage, reduces overfitting
    const l2Effect = params.l2Strength * 0.4;
    
    // Dropout effect: prevents co-adaptation, reduces overfitting
    const dropoutEffect = params.dropoutRate * 2; // Dropout is 0-0.5, scale to 0-1
    
    // Total regularization effect
    const totalEffect = l1Effect + l2Effect + dropoutEffect;
    
    // Bias increases slightly with regularization
    const biasChange = totalEffect * 0.15;
    
    // Variance decreases significantly with regularization
    const varianceChange = -totalEffect * 0.6;
    
    // Overfitting reduction
    const overfittingReduction = totalEffect * 0.8;
    
    // Performance impact (slight decrease in training, improvement in validation)
    const performanceImpact = -totalEffect * 0.05 + overfittingReduction * 0.1;
    
    return {
      biasChange,
      varianceChange,
      overfittingReduction,
      performanceImpact,
    };
  },

  /**
   * Get optimal regularization parameters
   */
  getOptimalParams(): RegularizationParams {
    return {
      l1Strength: 0.01,
      l2Strength: 0.1,
      dropoutRate: 0.2,
    };
  },

  /**
   * Analyze overfitting from training curves
   */
  analyzeOverfitting(curves: TrainingCurvePoint[]): {
    isOverfitting: boolean;
    overfittingScore: number;
    overfittingStartEpoch: number | null;
    recommendation: string;
  } {
    if (curves.length < 10) {
      return {
        isOverfitting: false,
        overfittingScore: 0,
        overfittingStartEpoch: null,
        recommendation: 'Not enough epochs to detect overfitting',
      };
    }
    
    // Calculate gap between train and validation loss
    const gaps = curves.map(c => c.valLoss - c.trainLoss);
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    
    // Find where validation loss starts increasing
    let overfittingStartEpoch: number | null = null;
    for (let i = 10; i < curves.length - 5; i++) {
      const recentValLosses = curves.slice(i, i + 5).map(c => c.valLoss);
      const isIncreasing = recentValLosses.every((loss, idx) => 
        idx === 0 || loss >= recentValLosses[idx - 1]
      );
      
      if (isIncreasing) {
        overfittingStartEpoch = curves[i].epoch;
        break;
      }
    }
    
    // Calculate overfitting score (0 to 1)
    const overfittingScore = Math.min(avgGap * 2, 1);
    const isOverfitting = overfittingScore > 0.3;
    
    let recommendation = '';
    if (isOverfitting) {
      if (overfittingScore > 0.7) {
        recommendation = 'Severe overfitting detected! Increase regularization significantly or reduce model complexity.';
      } else if (overfittingScore > 0.5) {
        recommendation = 'Moderate overfitting. Try increasing L2 regularization or adding dropout.';
      } else {
        recommendation = 'Slight overfitting. Consider mild regularization or early stopping.';
      }
    } else {
      recommendation = 'No significant overfitting detected. Model is generalizing well.';
    }
    
    return {
      isOverfitting,
      overfittingScore,
      overfittingStartEpoch,
      recommendation,
    };
  },

  /**
   * Get recommendations based on current parameters
   */
  getRecommendations(params: RegularizationParams): Array<{
    type: 'l1' | 'l2' | 'dropout' | 'general';
    priority: 'high' | 'medium' | 'low';
    message: string;
  }> {
    const recommendations: Array<{
      type: 'l1' | 'l2' | 'dropout' | 'general';
      priority: 'high' | 'medium' | 'low';
      message: string;
    }> = [];
    
    const totalReg = params.l1Strength + params.l2Strength + params.dropoutRate;
    
    // Check if regularization is too weak
    if (totalReg < 0.1) {
      recommendations.push({
        type: 'general',
        priority: 'high',
        message: 'Very low regularization. Your model may overfit. Try adding L2 regularization or dropout.',
      });
    }
    
    // Check if regularization is too strong
    if (totalReg > 0.8) {
      recommendations.push({
        type: 'general',
        priority: 'high',
        message: 'Very high regularization. Your model may underfit. Reduce regularization strength.',
      });
    }
    
    // L1 specific recommendations
    if (params.l1Strength > 0.3) {
      recommendations.push({
        type: 'l1',
        priority: 'medium',
        message: 'High L1 regularization will aggressively remove features. Reduce if losing important features.',
      });
    } else if (params.l1Strength > 0 && params.l1Strength < 0.05) {
      recommendations.push({
        type: 'l1',
        priority: 'low',
        message: 'L1 regularization is very weak. Increase to 0.01-0.1 for effective feature selection.',
      });
    }
    
    // L2 specific recommendations
    if (params.l2Strength === 0) {
      recommendations.push({
        type: 'l2',
        priority: 'medium',
        message: 'No L2 regularization. Consider adding 0.01-0.1 to prevent overfitting.',
      });
    } else if (params.l2Strength > 0.5) {
      recommendations.push({
        type: 'l2',
        priority: 'medium',
        message: 'Very high L2 regularization. May be too restrictive. Try 0.01-0.2 range.',
      });
    }
    
    // Dropout specific recommendations
    if (params.dropoutRate === 0) {
      recommendations.push({
        type: 'dropout',
        priority: 'low',
        message: 'No dropout. Consider adding 0.2-0.3 for neural networks to prevent co-adaptation.',
      });
    } else if (params.dropoutRate > 0.4) {
      recommendations.push({
        type: 'dropout',
        priority: 'high',
        message: 'Very high dropout rate. May prevent learning. Keep dropout below 0.4.',
      });
    }
    
    // Optimal range
    if (totalReg >= 0.2 && totalReg <= 0.5) {
      recommendations.push({
        type: 'general',
        priority: 'low',
        message: 'Good regularization balance. Monitor training curves to fine-tune.',
      });
    }
    
    return recommendations;
  },

  /**
   * Get explanations for each regularization type
   */
  getExplanations(): Record<RegularizationType, {
    name: string;
    description: string;
    whenToUse: string;
    effect: string;
  }> {
    return {
      none: {
        name: 'No Regularization',
        description: 'Train without any regularization constraints',
        whenToUse: 'When you have very large datasets and simple models',
        effect: 'Model may overfit to training data',
      },
      l1: {
        name: 'L1 Regularization (Lasso)',
        description: 'Adds penalty proportional to absolute value of weights',
        whenToUse: 'When you want automatic feature selection',
        effect: 'Drives some weights to exactly zero, removing features',
      },
      l2: {
        name: 'L2 Regularization (Ridge)',
        description: 'Adds penalty proportional to square of weights',
        whenToUse: 'When you want to prevent overfitting while keeping all features',
        effect: 'Shrinks weights toward zero but keeps all features',
      },
      dropout: {
        name: 'Dropout',
        description: 'Randomly drops neurons during training',
        whenToUse: 'For neural networks to prevent co-adaptation',
        effect: 'Forces network to learn robust features',
      },
    };
  },

  /**
   * Calculate bias-variance tradeoff
   */
  calculateBiasVariance(params: RegularizationParams): {
    bias: number;
    variance: number;
    totalError: number;
    optimal: boolean;
  } {
    const totalReg = params.l1Strength + params.l2Strength + params.dropoutRate;
    
    // Base bias and variance (no regularization)
    const baseBias = 0.1;
    const baseVariance = 0.4;
    
    // Regularization increases bias, decreases variance
    const bias = baseBias + totalReg * 0.3;
    const variance = baseVariance * Math.exp(-totalReg * 2);
    
    // Total error is sum of bias and variance
    const totalError = bias + variance;
    
    // Optimal is when total error is minimized (around 0.2-0.3 regularization)
    const optimal = totalReg >= 0.15 && totalReg <= 0.35;
    
    return {
      bias,
      variance,
      totalError,
      optimal,
    };
  },

  /**
   * Get best practices
   */
  getBestPractices(): string[] {
    return [
      'Start with L2 regularization (0.01-0.1) as a baseline',
      'Use L1 if you suspect many features are irrelevant',
      'Add dropout (0.2-0.3) for deep neural networks',
      'Monitor both training and validation metrics',
      'Increase regularization if validation loss increases while training loss decreases',
      'Decrease regularization if both training and validation loss are high',
      'Use cross-validation to find optimal regularization strength',
      'Combine different regularization types for best results',
    ];
  },
};
