export interface ShapValue {
  feature: string;
  value: number;
  featureValue: string | number;
}

export interface ShapExplanation {
  prediction: number;
  baseValue: number;
  shapValues: ShapValue[];
  predictionLabel: string;
}

export interface ShapSummary {
  feature: string;
  meanAbsShap: number;
  shapValues: number[];
  featureValues: number[];
}

export const shapService = {
  /**
   * Generate SHAP explanation for a single prediction
   */
  generateShapExplanation(
    features: string[],
    prediction: number,
    actualLabel: string
  ): ShapExplanation {
    const baseValue = 0.5; // Base prediction (average)
    const shapValues: ShapValue[] = [];

    // Generate SHAP values that sum to (prediction - baseValue)
    const targetSum = prediction - baseValue;
    const rawValues: number[] = [];

    // Generate random SHAP values
    for (let i = 0; i < features.length; i++) {
      const value = (Math.random() - 0.5) * 0.3;
      rawValues.push(value);
    }

    // Normalize to sum to targetSum
    const currentSum = rawValues.reduce((sum, val) => sum + val, 0);
    const scale = currentSum !== 0 ? targetSum / currentSum : 1;

    features.forEach((feature, index) => {
      shapValues.push({
        feature,
        value: rawValues[index] * scale,
        featureValue: this.generateFeatureValue(feature),
      });
    });

    // Sort by absolute value for better visualization
    shapValues.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return {
      prediction,
      baseValue,
      shapValues,
      predictionLabel: actualLabel,
    };
  },

  /**
   * Generate SHAP summary across multiple predictions
   */
  generateShapSummary(
    features: string[],
    numSamples: number = 100
  ): ShapSummary[] {
    const summaries: ShapSummary[] = [];

    features.forEach(feature => {
      const shapValues: number[] = [];
      const featureValues: number[] = [];

      // Generate SHAP values for this feature across samples
      for (let i = 0; i < numSamples; i++) {
        shapValues.push((Math.random() - 0.5) * 0.4);
        featureValues.push(Math.random());
      }

      const meanAbsShap = shapValues.reduce((sum, val) => sum + Math.abs(val), 0) / numSamples;

      summaries.push({
        feature,
        meanAbsShap,
        shapValues,
        featureValues,
      });
    });

    // Sort by mean absolute SHAP value
    summaries.sort((a, b) => b.meanAbsShap - a.meanAbsShap);

    return summaries;
  },

  /**
   * Generate waterfall chart data
   */
  generateWaterfallData(explanation: ShapExplanation): Array<{
    feature: string;
    value: number;
    cumulative: number;
    direction: 'positive' | 'negative';
  }> {
    const data: Array<{
      feature: string;
      value: number;
      cumulative: number;
      direction: 'positive' | 'negative';
    }> = [];

    let cumulative = explanation.baseValue;

    // Add base value
    data.push({
      feature: 'Base Value',
      value: explanation.baseValue,
      cumulative,
      direction: 'positive',
    });

    // Add each feature contribution
    explanation.shapValues.forEach(shap => {
      cumulative += shap.value;
      data.push({
        feature: shap.feature,
        value: shap.value,
        cumulative,
        direction: shap.value >= 0 ? 'positive' : 'negative',
      });
    });

    return data;
  },

  /**
   * Generate force plot data
   */
  generateForcePlotData(explanation: ShapExplanation): {
    baseValue: number;
    prediction: number;
    positiveFeatures: Array<{ feature: string; value: number; featureValue: string | number }>;
    negativeFeatures: Array<{ feature: string; value: number; featureValue: string | number }>;
  } {
    const positiveFeatures = explanation.shapValues
      .filter(s => s.value > 0)
      .sort((a, b) => b.value - a.value);

    const negativeFeatures = explanation.shapValues
      .filter(s => s.value < 0)
      .sort((a, b) => a.value - b.value);

    return {
      baseValue: explanation.baseValue,
      prediction: explanation.prediction,
      positiveFeatures,
      negativeFeatures,
    };
  },

  /**
   * Generate feature value (simulated)
   */
  generateFeatureValue(feature: string): string | number {
    const rand = Math.random();
    if (rand < 0.3) {
      return (Math.random() * 100).toFixed(2);
    } else if (rand < 0.6) {
      return ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)];
    } else {
      return ['Yes', 'No'][Math.floor(Math.random() * 2)];
    }
  },

  /**
   * Get explanation text for SHAP values
   */
  getShapExplanation(): string[] {
    return [
      'SHAP (SHapley Additive exPlanations) values show how much each feature contributes to a prediction',
      'Positive SHAP values push the prediction higher, negative values push it lower',
      'The magnitude shows the strength of the contribution',
      'SHAP values are additive: Base Value + Sum of SHAP values = Final Prediction',
      'SHAP values are based on game theory and provide fair feature attributions',
    ];
  },

  /**
   * Get waterfall explanation
   */
  getWaterfallExplanation(): string {
    return 'The waterfall chart shows how each feature contribution builds up from the base value to the final prediction. Features pushing the prediction up are shown in green, while features pushing it down are shown in red.';
  },

  /**
   * Get force plot explanation
   */
  getForcePlotExplanation(): string {
    return 'The force plot shows features pushing the prediction higher (right, in red) versus features pushing it lower (left, in blue). The width of each bar represents the strength of the contribution.';
  },

  /**
   * Get summary plot explanation
   */
  getSummaryPlotExplanation(): string {
    return 'The summary plot shows the distribution of SHAP values for each feature across all predictions. Features at the top have the highest average impact. The color shows the feature value (red = high, blue = low).';
  },

  /**
   * Generate insights from SHAP values
   */
  generateInsights(explanation: ShapExplanation): string[] {
    const insights: string[] = [];
    const topPositive = explanation.shapValues.filter(s => s.value > 0).slice(0, 2);
    const topNegative = explanation.shapValues.filter(s => s.value < 0).slice(0, 2);

    if (topPositive.length > 0) {
      const top = topPositive[0];
      insights.push(
        `"${top.feature}" (value: ${top.featureValue}) is the strongest positive contributor, increasing the prediction by ${(top.value * 100).toFixed(1)}%`
      );
    }

    if (topNegative.length > 0) {
      const top = topNegative[0];
      insights.push(
        `"${top.feature}" (value: ${top.featureValue}) is the strongest negative contributor, decreasing the prediction by ${(Math.abs(top.value) * 100).toFixed(1)}%`
      );
    }

    const totalPositive = explanation.shapValues
      .filter(s => s.value > 0)
      .reduce((sum, s) => sum + s.value, 0);
    const totalNegative = Math.abs(
      explanation.shapValues
        .filter(s => s.value < 0)
        .reduce((sum, s) => sum + s.value, 0)
    );

    if (totalPositive > totalNegative) {
      insights.push(
        `Overall, positive contributions (${(totalPositive * 100).toFixed(1)}%) outweigh negative ones (${(totalNegative * 100).toFixed(1)}%), leading to a higher prediction`
      );
    } else {
      insights.push(
        `Overall, negative contributions (${(totalNegative * 100).toFixed(1)}%) outweigh positive ones (${(totalPositive * 100).toFixed(1)}%), leading to a lower prediction`
      );
    }

    return insights;
  },

  /**
   * Generate multiple example predictions
   */
  generateExamples(
    features: string[],
    labels: string[],
    count: number = 5
  ): Array<{
    id: number;
    prediction: number;
    label: string;
    confidence: number;
  }> {
    const examples: Array<{
      id: number;
      prediction: number;
      label: string;
      confidence: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const prediction = Math.random();
      const labelIndex = Math.floor(prediction * labels.length);
      const label = labels[labelIndex] || labels[0];
      const confidence = 0.6 + Math.random() * 0.3;

      examples.push({
        id: i + 1,
        prediction,
        label,
        confidence,
      });
    }

    return examples;
  },
};
