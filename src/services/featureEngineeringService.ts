export type FeatureType = 'numerical' | 'categorical' | 'text';

export type TransformationType = 
  | 'log' 
  | 'sqrt' 
  | 'square' 
  | 'normalize' 
  | 'standardize'
  | 'one_hot'
  | 'label_encode'
  | 'frequency_encode'
  | 'target_encode'
  | 'tfidf'
  | 'word_count'
  | 'char_count'
  | 'polynomial_2'
  | 'polynomial_3'
  | 'interaction';

export interface FeatureTransformation {
  type: TransformationType;
  name: string;
  description: string;
  applicableTo: FeatureType[];
  expectedImpact: 'high' | 'medium' | 'low';
  complexity: 'simple' | 'moderate' | 'complex';
}

// Legacy interface for backward compatibility
export interface EngineeringSuggestion {
  id: string;
  type: TransformationType;
  name: string;
  title?: string;
  description: string;
  expectedImpact: number;
  impact?: number;
  column?: string;
  columns?: string[];
  example?: string;
  newFeatureCount?: number;
}

export interface TransformationResult {
  originalDistribution: number[];
  transformedDistribution: number[];
  originalStats: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  };
  transformedStats: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  };
  importanceChange: number;
  performanceImpact: number;
  // Legacy fields for backward compatibility
  appliedSuggestions?: EngineeringSuggestion[];
  newColumns?: string[];
  data?: string[][];
}

export interface PolynomialFeature {
  feature: string;
  degree: number;
  importance: number;
  example: string;
}

export interface InteractionFeature {
  feature1: string;
  feature2: string;
  interactionType: 'multiply' | 'divide' | 'add' | 'subtract';
  importance: number;
  example: string;
}

export const featureEngineeringService = {
  /**
   * Get all available transformations
   */
  getTransformations(): FeatureTransformation[] {
    return [
      // Numerical transformations
      {
        type: 'log',
        name: 'Log Transform',
        description: 'Apply logarithm to reduce skewness in right-skewed data',
        applicableTo: ['numerical'],
        expectedImpact: 'high',
        complexity: 'simple',
      },
      {
        type: 'sqrt',
        name: 'Square Root Transform',
        description: 'Apply square root to moderate skewness',
        applicableTo: ['numerical'],
        expectedImpact: 'medium',
        complexity: 'simple',
      },
      {
        type: 'square',
        name: 'Square Transform',
        description: 'Square values to emphasize larger values',
        applicableTo: ['numerical'],
        expectedImpact: 'medium',
        complexity: 'simple',
      },
      {
        type: 'normalize',
        name: 'Min-Max Normalization',
        description: 'Scale values to [0, 1] range',
        applicableTo: ['numerical'],
        expectedImpact: 'high',
        complexity: 'simple',
      },
      {
        type: 'standardize',
        name: 'Standardization (Z-score)',
        description: 'Scale to mean=0, std=1',
        applicableTo: ['numerical'],
        expectedImpact: 'high',
        complexity: 'simple',
      },
      // Categorical transformations
      {
        type: 'one_hot',
        name: 'One-Hot Encoding',
        description: 'Create binary columns for each category',
        applicableTo: ['categorical'],
        expectedImpact: 'high',
        complexity: 'simple',
      },
      {
        type: 'label_encode',
        name: 'Label Encoding',
        description: 'Convert categories to integers',
        applicableTo: ['categorical'],
        expectedImpact: 'medium',
        complexity: 'simple',
      },
      {
        type: 'frequency_encode',
        name: 'Frequency Encoding',
        description: 'Replace categories with their frequency',
        applicableTo: ['categorical'],
        expectedImpact: 'medium',
        complexity: 'moderate',
      },
      {
        type: 'target_encode',
        name: 'Target Encoding',
        description: 'Replace categories with target mean',
        applicableTo: ['categorical'],
        expectedImpact: 'high',
        complexity: 'complex',
      },
      // Text transformations
      {
        type: 'tfidf',
        name: 'TF-IDF Vectorization',
        description: 'Convert text to TF-IDF features',
        applicableTo: ['text'],
        expectedImpact: 'high',
        complexity: 'complex',
      },
      {
        type: 'word_count',
        name: 'Word Count',
        description: 'Count number of words in text',
        applicableTo: ['text'],
        expectedImpact: 'medium',
        complexity: 'simple',
      },
      {
        type: 'char_count',
        name: 'Character Count',
        description: 'Count number of characters in text',
        applicableTo: ['text'],
        expectedImpact: 'low',
        complexity: 'simple',
      },
      // Polynomial features
      {
        type: 'polynomial_2',
        name: 'Polynomial Features (degree 2)',
        description: 'Create squared terms and interactions',
        applicableTo: ['numerical'],
        expectedImpact: 'high',
        complexity: 'moderate',
      },
      {
        type: 'polynomial_3',
        name: 'Polynomial Features (degree 3)',
        description: 'Create cubic terms and interactions',
        applicableTo: ['numerical'],
        expectedImpact: 'medium',
        complexity: 'complex',
      },
      // Interactions
      {
        type: 'interaction',
        name: 'Feature Interactions',
        description: 'Create pairwise feature interactions',
        applicableTo: ['numerical'],
        expectedImpact: 'high',
        complexity: 'moderate',
      },
    ];
  },

  /**
   * Get transformation suggestions for a feature type
   */
  getSuggestionsForType(featureType: FeatureType): FeatureTransformation[] {
    return this.getTransformations().filter(t => 
      t.applicableTo.includes(featureType)
    );
  },

  /**
   * Generate sample data for demonstration
   */
  generateSampleData(distribution: 'normal' | 'skewed' | 'uniform', size: number = 100): number[] {
    const data: number[] = [];
    
    for (let i = 0; i < size; i++) {
      if (distribution === 'normal') {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        data.push(z * 10 + 50);
      } else if (distribution === 'skewed') {
        // Right-skewed distribution (exponential-like)
        const u = Math.random();
        data.push(Math.pow(u, 0.3) * 100);
      } else {
        // Uniform distribution
        data.push(Math.random() * 100);
      }
    }
    
    return data;
  },

  /**
   * Apply transformation to data
   */
  applyTransformation(data: number[], transformation: TransformationType): number[] {
    switch (transformation) {
      case 'log':
        return data.map(x => Math.log(Math.max(x, 0.001)));
      
      case 'sqrt':
        return data.map(x => Math.sqrt(Math.max(x, 0)));
      
      case 'square':
        return data.map(x => x * x);
      
      case 'normalize': {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        return data.map(x => (x - min) / (range || 1));
      }
      
      case 'standardize': {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        const std = Math.sqrt(variance);
        return data.map(x => (x - mean) / (std || 1));
      }
      
      default:
        return data;
    }
  },

  /**
   * Calculate statistics for data
   */
  calculateStats(data: number[]): {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  } {
    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    return { mean, median, std, min, max };
  },

  /**
   * Simulate transformation result
   */
  simulateTransformation(
    featureType: FeatureType,
    transformation: TransformationType
  ): TransformationResult {
    // Generate appropriate sample data
    const distribution = featureType === 'numerical' ? 'skewed' : 'normal';
    const originalData = this.generateSampleData(distribution, 100);
    
    // Apply transformation
    const transformedData = this.applyTransformation(originalData, transformation);
    
    // Calculate stats
    const originalStats = this.calculateStats(originalData);
    const transformedStats = this.calculateStats(transformedData);
    
    // Simulate importance change (based on transformation type)
    const importanceChange = this.estimateImportanceChange(transformation);
    
    // Simulate performance impact
    const performanceImpact = this.estimatePerformanceImpact(transformation);
    
    return {
      originalDistribution: originalData,
      transformedDistribution: transformedData,
      originalStats,
      transformedStats,
      importanceChange,
      performanceImpact,
    };
  },

  /**
   * Estimate importance change from transformation
   */
  estimateImportanceChange(transformation: TransformationType): number {
    const impacts: Record<TransformationType, number> = {
      log: 0.15,
      sqrt: 0.10,
      square: 0.08,
      normalize: 0.20,
      standardize: 0.25,
      one_hot: 0.30,
      label_encode: 0.10,
      frequency_encode: 0.15,
      target_encode: 0.35,
      tfidf: 0.40,
      word_count: 0.12,
      char_count: 0.05,
      polynomial_2: 0.25,
      polynomial_3: 0.20,
      interaction: 0.30,
    };
    
    return impacts[transformation] || 0.10;
  },

  /**
   * Estimate performance impact from transformation
   */
  estimatePerformanceImpact(transformation: TransformationType): number {
    const impacts: Record<TransformationType, number> = {
      log: 0.05,
      sqrt: 0.03,
      square: 0.02,
      normalize: 0.08,
      standardize: 0.10,
      one_hot: 0.12,
      label_encode: 0.04,
      frequency_encode: 0.06,
      target_encode: 0.15,
      tfidf: 0.18,
      word_count: 0.05,
      char_count: 0.02,
      polynomial_2: 0.10,
      polynomial_3: 0.08,
      interaction: 0.12,
    };
    
    return impacts[transformation] || 0.05;
  },

  /**
   * Generate polynomial features
   */
  generatePolynomialFeatures(features: string[], degree: number): PolynomialFeature[] {
    const polynomials: PolynomialFeature[] = [];
    
    // Single feature polynomials
    features.forEach(feature => {
      for (let d = 2; d <= degree; d++) {
        polynomials.push({
          feature,
          degree: d,
          importance: Math.random() * 0.3 + 0.1,
          example: `${feature}^${d}`,
        });
      }
    });
    
    return polynomials.sort((a, b) => b.importance - a.importance);
  },

  /**
   * Generate interaction features
   */
  generateInteractionFeatures(features: string[]): InteractionFeature[] {
    const interactions: InteractionFeature[] = [];
    
    // Pairwise interactions
    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const types: Array<'multiply' | 'divide' | 'add' | 'subtract'> = 
          ['multiply', 'divide', 'add', 'subtract'];
        
        types.forEach(type => {
          const importance = Math.random() * 0.4 + 0.1;
          let example = '';
          
          switch (type) {
            case 'multiply':
              example = `${features[i]} × ${features[j]}`;
              break;
            case 'divide':
              example = `${features[i]} ÷ ${features[j]}`;
              break;
            case 'add':
              example = `${features[i]} + ${features[j]}`;
              break;
            case 'subtract':
              example = `${features[i]} - ${features[j]}`;
              break;
          }
          
          interactions.push({
            feature1: features[i],
            feature2: features[j],
            interactionType: type,
            importance,
            example,
          });
        });
      }
    }
    
    return interactions
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10); // Top 10 interactions
  },

  /**
   * Get recommendations based on feature type
   */
  getRecommendations(featureType: FeatureType): string[] {
    const recommendations: Record<FeatureType, string[]> = {
      numerical: [
        'Apply log transform to right-skewed features to make them more normal',
        'Standardize features to have mean=0 and std=1 for better model convergence',
        'Create polynomial features to capture non-linear relationships',
        'Generate interaction features for features that might work together',
        'Use normalization if you need features in [0, 1] range',
      ],
      categorical: [
        'Use one-hot encoding for nominal categories (no order)',
        'Use label encoding for ordinal categories (with order)',
        'Try target encoding for high-cardinality features',
        'Consider frequency encoding to capture category popularity',
        'Combine rare categories into an "Other" category',
      ],
      text: [
        'Use TF-IDF for document classification tasks',
        'Extract word count and character count as simple features',
        'Consider n-grams (bigrams, trigrams) for context',
        'Remove stop words to focus on meaningful words',
        'Apply stemming or lemmatization to reduce vocabulary',
      ],
    };
    
    return recommendations[featureType] || [];
  },

  /**
   * Get best practices
   */
  getBestPractices(): string[] {
    return [
      'Always split data before feature engineering to avoid data leakage',
      'Apply the same transformations to training and test sets',
      'Save transformation parameters (mean, std, etc.) for deployment',
      'Start with simple transformations before complex ones',
      'Validate that transformations improve model performance',
      'Document all transformations for reproducibility',
      'Be careful with target encoding to avoid overfitting',
      'Handle missing values before applying transformations',
    ];
  },

  /**
   * Legacy method: Generate suggestions (for backward compatibility)
   */
  generateSuggestions(data: string[][], columnInfo: any[]): EngineeringSuggestion[] {
    const suggestions: EngineeringSuggestion[] = [];
    
    columnInfo.forEach((col, index) => {
      const featureType: FeatureType = 
        col.type === 'number' ? 'numerical' :
        col.type === 'string' ? 'categorical' : 'text';
      
      const transformations = this.getSuggestionsForType(featureType);
      
      transformations.slice(0, 2).forEach((trans, idx) => {
        const impact = trans.expectedImpact === 'high' ? 0.15 : 
                      trans.expectedImpact === 'medium' ? 0.10 : 0.05;
        suggestions.push({
          id: `${index}-${idx}`,
          type: trans.type,
          name: trans.name,
          title: trans.name,
          description: trans.description,
          expectedImpact: impact,
          impact,
          column: col.name,
          columns: [col.name],
          example: `${col.name} → ${trans.name}`,
          newFeatureCount: 1,
        });
      });
    });
    
    return suggestions;
  },

  /**
   * Legacy method: Apply suggestion (for backward compatibility)
   */
  applySuggestion(
    data: string[][],
    suggestion: EngineeringSuggestion
  ): TransformationResult {
    const result = this.simulateTransformation('numerical', suggestion.type);
    return {
      ...result,
      appliedSuggestions: [suggestion],
      newColumns: [`${suggestion.column}_${suggestion.type}`],
      data,
    };
  },

  /**
   * Legacy method: Apply multiple suggestions (for backward compatibility)
   */
  applyMultipleSuggestions(
    data: string[][],
    suggestions: EngineeringSuggestion[]
  ): TransformationResult {
    const result = this.simulateTransformation('numerical', suggestions[0]?.type || 'normalize');
    return {
      ...result,
      appliedSuggestions: suggestions,
      newColumns: suggestions.map(s => `${s.column}_${s.type}`),
      data,
    };
  },
};
