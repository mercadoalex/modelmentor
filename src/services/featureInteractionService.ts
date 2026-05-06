export interface FeatureInteraction {
  feature1: string;
  feature2: string;
  interactionType: 'multiply' | 'divide' | 'add' | 'subtract' | 'ratio' | 'difference';
  strength: number;
  importance: number;
  performanceImpact: number;
  example: string;
}

export interface InteractionMatrix {
  features: string[];
  matrix: number[][];
  topInteractions: FeatureInteraction[];
}

export interface InteractionAnalysis {
  totalInteractions: number;
  strongInteractions: number;
  averageStrength: number;
  recommendations: string[];
}

export const featureInteractionService = {
  /**
   * Generate sample feature data
   */
  generateSampleFeatures(): string[] {
    return [
      'age',
      'income',
      'experience',
      'education_years',
      'hours_worked',
      'distance_to_work',
      'team_size',
      'projects_completed',
    ];
  },

  /**
   * Calculate interaction strength between two features
   */
  calculateInteractionStrength(
    feature1: string,
    feature2: string
  ): number {
    // Simulate interaction strength based on feature names
    // In real implementation, this would use actual data
    const hash = (feature1 + feature2).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 100) / 100;
  },

  /**
   * Calculate interaction importance (contribution to model)
   */
  calculateInteractionImportance(
    feature1: string,
    feature2: string,
    strength: number
  ): number {
    // Importance is based on strength and feature relevance
    const baseImportance = strength * 0.8;
    const bonus = Math.random() * 0.2;
    return Math.min(baseImportance + bonus, 1.0);
  },

  /**
   * Estimate performance impact of interaction
   */
  estimatePerformanceImpact(importance: number): number {
    // Higher importance = higher performance impact
    return importance * 0.15; // Up to 15% improvement
  },

  /**
   * Generate interaction example
   */
  generateInteractionExample(
    feature1: string,
    feature2: string,
    interactionType: FeatureInteraction['interactionType']
  ): string {
    switch (interactionType) {
      case 'multiply':
        return `${feature1} × ${feature2}`;
      case 'divide':
        return `${feature1} ÷ ${feature2}`;
      case 'add':
        return `${feature1} + ${feature2}`;
      case 'subtract':
        return `${feature1} - ${feature2}`;
      case 'ratio':
        return `${feature1} / ${feature2}`;
      case 'difference':
        return `|${feature1} - ${feature2}|`;
      default:
        return `${feature1} × ${feature2}`;
    }
  },

  /**
   * Calculate pairwise interactions
   */
  calculatePairwiseInteractions(features: string[]): FeatureInteraction[] {
    const interactions: FeatureInteraction[] = [];
    
    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const feature1 = features[i];
        const feature2 = features[j];
        
        // Calculate for different interaction types
        const types: FeatureInteraction['interactionType'][] = [
          'multiply',
          'divide',
          'add',
          'subtract',
          'ratio',
          'difference',
        ];
        
        types.forEach(type => {
          const strength = this.calculateInteractionStrength(feature1, feature2);
          const importance = this.calculateInteractionImportance(feature1, feature2, strength);
          const performanceImpact = this.estimatePerformanceImpact(importance);
          const example = this.generateInteractionExample(feature1, feature2, type);
          
          interactions.push({
            feature1,
            feature2,
            interactionType: type,
            strength,
            importance,
            performanceImpact,
            example,
          });
        });
      }
    }
    
    return interactions.sort((a, b) => b.importance - a.importance);
  },

  /**
   * Create interaction matrix
   */
  createInteractionMatrix(features: string[]): InteractionMatrix {
    const matrix: number[][] = Array(features.length)
      .fill(0)
      .map(() => Array(features.length).fill(0));
    
    // Calculate interaction strength for each pair
    for (let i = 0; i < features.length; i++) {
      for (let j = 0; j < features.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          matrix[i][j] = this.calculateInteractionStrength(features[i], features[j]);
        }
      }
    }
    
    // Get top interactions
    const allInteractions = this.calculatePairwiseInteractions(features);
    const topInteractions = allInteractions.slice(0, 10);
    
    return {
      features,
      matrix,
      topInteractions,
    };
  },

  /**
   * Analyze interactions
   */
  analyzeInteractions(interactions: FeatureInteraction[]): InteractionAnalysis {
    const totalInteractions = interactions.length;
    const strongInteractions = interactions.filter(i => i.strength > 0.7).length;
    const averageStrength = interactions.reduce((sum, i) => sum + i.strength, 0) / totalInteractions;
    
    const recommendations: string[] = [];
    
    if (strongInteractions > 5) {
      recommendations.push('Many strong interactions detected. Consider creating interaction features for top 5-10 pairs.');
    }
    
    if (averageStrength > 0.6) {
      recommendations.push('High average interaction strength. Your features work well together.');
    } else if (averageStrength < 0.3) {
      recommendations.push('Low interaction strength. Features may be independent. Focus on individual feature engineering.');
    }
    
    const multiplyInteractions = interactions.filter(i => i.interactionType === 'multiply' && i.importance > 0.5);
    if (multiplyInteractions.length > 0) {
      recommendations.push(`Multiplication interactions show promise. Try creating: ${multiplyInteractions[0].example}`);
    }
    
    const ratioInteractions = interactions.filter(i => i.interactionType === 'ratio' && i.importance > 0.5);
    if (ratioInteractions.length > 0) {
      recommendations.push(`Ratio features may be valuable. Consider: ${ratioInteractions[0].example}`);
    }
    
    return {
      totalInteractions,
      strongInteractions,
      averageStrength,
      recommendations,
    };
  },

  /**
   * Get top K interactions
   */
  getTopKInteractions(
    interactions: FeatureInteraction[],
    k: number = 10
  ): FeatureInteraction[] {
    return interactions
      .sort((a, b) => b.importance - a.importance)
      .slice(0, k);
  },

  /**
   * Filter interactions by type
   */
  filterByType(
    interactions: FeatureInteraction[],
    type: FeatureInteraction['interactionType']
  ): FeatureInteraction[] {
    return interactions.filter(i => i.interactionType === type);
  },

  /**
   * Filter interactions by strength threshold
   */
  filterByStrength(
    interactions: FeatureInteraction[],
    minStrength: number
  ): FeatureInteraction[] {
    return interactions.filter(i => i.strength >= minStrength);
  },

  /**
   * Create interaction features
   */
  createInteractionFeatures(
    selectedInteractions: FeatureInteraction[]
  ): {
    newFeatures: string[];
    expectedImprovement: number;
    recommendations: string[];
  } {
    const newFeatures = selectedInteractions.map(i => i.example);
    const expectedImprovement = selectedInteractions.reduce(
      (sum, i) => sum + i.performanceImpact,
      0
    );
    
    const recommendations: string[] = [];
    
    if (selectedInteractions.length > 10) {
      recommendations.push('Creating many interaction features may lead to overfitting. Start with top 5-10.');
    }
    
    if (selectedInteractions.length < 3) {
      recommendations.push('Consider adding more interactions for better performance.');
    }
    
    const types = new Set(selectedInteractions.map(i => i.interactionType));
    if (types.size === 1) {
      recommendations.push('Try mixing different interaction types (multiply, ratio, etc.) for diversity.');
    }
    
    return {
      newFeatures,
      expectedImprovement,
      recommendations,
    };
  },

  /**
   * Get interaction type explanations
   */
  getInteractionTypeExplanations(): Record<FeatureInteraction['interactionType'], {
    name: string;
    description: string;
    whenToUse: string;
    example: string;
  }> {
    return {
      multiply: {
        name: 'Multiplication',
        description: 'Multiply two features together',
        whenToUse: 'When features have synergistic effects (e.g., price × quantity = revenue)',
        example: 'income × experience = earning potential',
      },
      divide: {
        name: 'Division',
        description: 'Divide one feature by another',
        whenToUse: 'When you want to normalize or create rates (e.g., distance / time = speed)',
        example: 'projects_completed ÷ experience = productivity rate',
      },
      add: {
        name: 'Addition',
        description: 'Add two features together',
        whenToUse: 'When features represent similar quantities that should be combined',
        example: 'base_salary + bonus = total_compensation',
      },
      subtract: {
        name: 'Subtraction',
        description: 'Subtract one feature from another',
        whenToUse: 'When the difference between features is meaningful',
        example: 'current_age - retirement_age = years_to_retirement',
      },
      ratio: {
        name: 'Ratio',
        description: 'Calculate ratio between features',
        whenToUse: 'When relative proportion matters more than absolute values',
        example: 'hours_worked / team_size = workload per person',
      },
      difference: {
        name: 'Absolute Difference',
        description: 'Calculate absolute difference between features',
        whenToUse: 'When the magnitude of difference matters, not the direction',
        example: '|expected_value - actual_value| = prediction error',
      },
    };
  },

  /**
   * Get best practices
   */
  getBestPractices(): string[] {
    return [
      'Start with domain knowledge: think about which features naturally interact',
      'Create interactions for features that measure related concepts',
      'Multiplication works well for synergistic effects (price × quantity)',
      'Ratios are useful for normalization (value / total)',
      'Limit interaction features to avoid overfitting (5-10 is usually enough)',
      'Always validate that interactions improve model performance',
      'Consider computational cost: more features = slower training',
      'Use feature importance to identify which interactions actually help',
    ];
  },

  /**
   * Get recommendations based on feature types
   */
  getRecommendationsByFeatureTypes(features: string[]): string[] {
    const recommendations: string[] = [];
    
    // Check for time-related features
    const timeFeatures = features.filter(f => 
      f.includes('time') || f.includes('hour') || f.includes('day') || f.includes('year')
    );
    if (timeFeatures.length >= 2) {
      recommendations.push(`Time features detected: Consider creating duration or time difference features`);
    }
    
    // Check for size/quantity features
    const sizeFeatures = features.filter(f => 
      f.includes('size') || f.includes('count') || f.includes('number') || f.includes('quantity')
    );
    if (sizeFeatures.length >= 2) {
      recommendations.push(`Size/quantity features detected: Try ratio features for normalization`);
    }
    
    // Check for rate/speed features
    const rateFeatures = features.filter(f => 
      f.includes('rate') || f.includes('speed') || f.includes('frequency')
    );
    if (rateFeatures.length >= 1 && timeFeatures.length >= 1) {
      recommendations.push(`Rate and time features detected: Consider distance = rate × time interactions`);
    }
    
    // Check for price/cost features
    const priceFeatures = features.filter(f => 
      f.includes('price') || f.includes('cost') || f.includes('salary') || f.includes('income')
    );
    if (priceFeatures.length >= 1 && sizeFeatures.length >= 1) {
      recommendations.push(`Price and quantity features detected: Create total value = price × quantity`);
    }
    
    return recommendations;
  },
};
