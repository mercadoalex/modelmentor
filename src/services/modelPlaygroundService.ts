export interface FeatureValue {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  importance?: number;
}

export interface PredictionResult {
  prediction: number;
  confidence: number;
  timestamp: number;
  features: Record<string, number>;
}

export interface DecisionBoundaryPoint {
  x: number;
  y: number;
  prediction: number;
  confidence: number;
}

export interface FeatureInteraction {
  feature1: string;
  feature2: string;
  correlation: number;
  impact: number;
}

export interface PlaygroundState {
  features: FeatureValue[];
  currentPrediction: PredictionResult | null;
  predictionHistory: PredictionResult[];
  decisionBoundary: DecisionBoundaryPoint[][];
  featureInteractions: FeatureInteraction[];
}

export const modelPlaygroundService = {
  /**
   * Initialize feature values with reasonable defaults
   */
  initializeFeatures(featureNames: string[], featureImportance?: number[]): FeatureValue[] {
    return featureNames.map((name, index) => ({
      name,
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      importance: featureImportance?.[index] || 0.5,
    }));
  },

  /**
   * Make a prediction based on current feature values
   */
  makePrediction(features: FeatureValue[]): PredictionResult {
    // Simulate model prediction
    // In real implementation, this would call the actual trained model
    const featureValues = features.map(f => f.value);
    
    // Weighted sum based on feature importance
    let prediction = 0;
    let totalImportance = 0;
    
    features.forEach((feature, index) => {
      const importance = feature.importance || 0.5;
      prediction += featureValues[index] * importance;
      totalImportance += importance;
    });
    
    prediction = prediction / totalImportance;
    
    // Add some non-linearity
    prediction = 1 / (1 + Math.exp(-5 * (prediction - 0.5)));
    
    // Calculate confidence based on how extreme the prediction is
    const confidence = Math.abs(prediction - 0.5) * 2;
    
    const featureRecord: Record<string, number> = {};
    features.forEach(f => {
      featureRecord[f.name] = f.value;
    });
    
    return {
      prediction,
      confidence,
      timestamp: Date.now(),
      features: featureRecord,
    };
  },

  /**
   * Calculate decision boundary for two features
   */
  calculateDecisionBoundary(
    feature1Index: number,
    feature2Index: number,
    features: FeatureValue[],
    resolution: number = 20
  ): DecisionBoundaryPoint[][] {
    const boundary: DecisionBoundaryPoint[][] = [];
    
    const feature1 = features[feature1Index];
    const feature2 = features[feature2Index];
    
    if (!feature1 || !feature2) return boundary;
    
    const step1 = (feature1.max - feature1.min) / resolution;
    const step2 = (feature2.max - feature2.min) / resolution;
    
    for (let i = 0; i <= resolution; i++) {
      const row: DecisionBoundaryPoint[] = [];
      const x = feature1.min + i * step1;
      
      for (let j = 0; j <= resolution; j++) {
        const y = feature2.min + j * step2;
        
        // Create temporary feature set with these values
        const tempFeatures = features.map((f, idx) => {
          if (idx === feature1Index) return { ...f, value: x };
          if (idx === feature2Index) return { ...f, value: y };
          return f;
        });
        
        const result = this.makePrediction(tempFeatures);
        
        row.push({
          x,
          y,
          prediction: result.prediction,
          confidence: result.confidence,
        });
      }
      
      boundary.push(row);
    }
    
    return boundary;
  },

  /**
   * Analyze feature interactions
   */
  analyzeFeatureInteractions(features: FeatureValue[]): FeatureInteraction[] {
    const interactions: FeatureInteraction[] = [];
    
    // Calculate pairwise interactions
    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const feature1 = features[i];
        const feature2 = features[j];
        
        // Simulate correlation (in real implementation, use actual data)
        const correlation = Math.random() * 2 - 1; // -1 to 1
        
        // Calculate interaction impact
        const impact = Math.abs(correlation) * 
          (feature1.importance || 0.5) * 
          (feature2.importance || 0.5);
        
        interactions.push({
          feature1: feature1.name,
          feature2: feature2.name,
          correlation,
          impact,
        });
      }
    }
    
    // Sort by impact
    return interactions.sort((a, b) => b.impact - a.impact);
  },

  /**
   * Calculate feature impact on prediction
   */
  calculateFeatureImpact(
    featureIndex: number,
    features: FeatureValue[],
    baselinePrediction: number
  ): { increase: number; decrease: number } {
    const feature = features[featureIndex];
    
    // Test increasing the feature
    const increasedFeatures = features.map((f, idx) => 
      idx === featureIndex 
        ? { ...f, value: Math.min(f.value + 0.1, f.max) }
        : f
    );
    const increasedPrediction = this.makePrediction(increasedFeatures).prediction;
    
    // Test decreasing the feature
    const decreasedFeatures = features.map((f, idx) => 
      idx === featureIndex 
        ? { ...f, value: Math.max(f.value - 0.1, f.min) }
        : f
    );
    const decreasedPrediction = this.makePrediction(decreasedFeatures).prediction;
    
    return {
      increase: increasedPrediction - baselinePrediction,
      decrease: baselinePrediction - decreasedPrediction,
    };
  },

  /**
   * Generate what-if scenarios
   */
  generateScenarios(features: FeatureValue[]): Array<{
    name: string;
    description: string;
    features: FeatureValue[];
    prediction: PredictionResult;
  }> {
    const scenarios = [];
    
    // Scenario 1: All features at minimum
    const minFeatures = features.map(f => ({ ...f, value: f.min }));
    scenarios.push({
      name: 'Minimum Values',
      description: 'All features set to their minimum values',
      features: minFeatures,
      prediction: this.makePrediction(minFeatures),
    });
    
    // Scenario 2: All features at maximum
    const maxFeatures = features.map(f => ({ ...f, value: f.max }));
    scenarios.push({
      name: 'Maximum Values',
      description: 'All features set to their maximum values',
      features: maxFeatures,
      prediction: this.makePrediction(maxFeatures),
    });
    
    // Scenario 3: All features at average
    const avgFeatures = features.map(f => ({ ...f, value: (f.min + f.max) / 2 }));
    scenarios.push({
      name: 'Average Values',
      description: 'All features set to their average values',
      features: avgFeatures,
      prediction: this.makePrediction(avgFeatures),
    });
    
    // Scenario 4: Only most important feature high
    const mostImportantIndex = features.reduce(
      (maxIdx, f, idx, arr) => 
        (f.importance || 0) > (arr[maxIdx].importance || 0) ? idx : maxIdx,
      0
    );
    const importantHighFeatures = features.map((f, idx) => ({
      ...f,
      value: idx === mostImportantIndex ? f.max : f.min,
    }));
    scenarios.push({
      name: 'Key Feature High',
      description: `Only ${features[mostImportantIndex].name} at maximum`,
      features: importantHighFeatures,
      prediction: this.makePrediction(importantHighFeatures),
    });
    
    return scenarios;
  },

  /**
   * Get insights based on current state
   */
  getInsights(
    currentPrediction: PredictionResult,
    features: FeatureValue[]
  ): string[] {
    const insights: string[] = [];
    
    // Prediction confidence insight
    if (currentPrediction.confidence > 0.8) {
      insights.push('The model is very confident about this prediction');
    } else if (currentPrediction.confidence < 0.3) {
      insights.push('The model has low confidence - the input is near the decision boundary');
    }
    
    // Feature value insights
    const highFeatures = features.filter(f => f.value > 0.7);
    const lowFeatures = features.filter(f => f.value < 0.3);
    
    if (highFeatures.length > 0) {
      insights.push(`High values: ${highFeatures.map(f => f.name).join(', ')}`);
    }
    
    if (lowFeatures.length > 0) {
      insights.push(`Low values: ${lowFeatures.map(f => f.name).join(', ')}`);
    }
    
    // Important feature insight
    const sortedByImportance = [...features].sort(
      (a, b) => (b.importance || 0) - (a.importance || 0)
    );
    const mostImportant = sortedByImportance[0];
    
    if (mostImportant.value > 0.7) {
      insights.push(`${mostImportant.name} (most important feature) is high, strongly influencing the prediction`);
    } else if (mostImportant.value < 0.3) {
      insights.push(`${mostImportant.name} (most important feature) is low, reducing the prediction`);
    }
    
    return insights;
  },

  /**
   * Export current state as JSON
   */
  exportState(state: PlaygroundState): string {
    return JSON.stringify({
      features: state.features.map(f => ({
        name: f.name,
        value: f.value,
      })),
      prediction: state.currentPrediction,
      timestamp: new Date().toISOString(),
    }, null, 2);
  },

  /**
   * Compare two predictions
   */
  comparePredictions(
    pred1: PredictionResult,
    pred2: PredictionResult
  ): {
    predictionDiff: number;
    confidenceDiff: number;
    featureChanges: Array<{ feature: string; change: number }>;
  } {
    const predictionDiff = pred2.prediction - pred1.prediction;
    const confidenceDiff = pred2.confidence - pred1.confidence;
    
    const featureChanges: Array<{ feature: string; change: number }> = [];
    
    Object.keys(pred1.features).forEach(feature => {
      const change = pred2.features[feature] - pred1.features[feature];
      if (Math.abs(change) > 0.01) {
        featureChanges.push({ feature, change });
      }
    });
    
    return {
      predictionDiff,
      confidenceDiff,
      featureChanges,
    };
  },
};
