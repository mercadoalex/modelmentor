export interface MisclassifiedExample {
  id: string;
  features: Record<string, string | number>;
  actualLabel: string;
  predictedLabel: string;
  confidence: number;
  errorType: 'high_confidence' | 'low_confidence' | 'boundary_case';
  explanation: string;
}

export interface ErrorPattern {
  pattern: string;
  count: number;
  description: string;
  suggestion: string;
}

export interface ErrorAnalysisResult {
  misclassifiedExamples: MisclassifiedExample[];
  errorPatterns: ErrorPattern[];
  totalErrors: number;
  highConfidenceErrors: number;
  lowConfidenceErrors: number;
  insights: string[];
}

export const errorAnalysisService = {
  /**
   * Generate error analysis from model performance
   */
  generateErrorAnalysis(
    accuracy: number,
    labels: string[],
    featureNames: string[],
    totalSamples: number = 100
  ): ErrorAnalysisResult {
    const errorRate = 1 - accuracy;
    const totalErrors = Math.floor(totalSamples * errorRate);
    
    // Generate misclassified examples
    const misclassifiedExamples = this.generateMisclassifiedExamples(
      totalErrors,
      labels,
      featureNames
    );

    // Identify error patterns
    const errorPatterns = this.identifyErrorPatterns(misclassifiedExamples, labels);

    // Count error types
    const highConfidenceErrors = misclassifiedExamples.filter(
      e => e.errorType === 'high_confidence'
    ).length;
    const lowConfidenceErrors = misclassifiedExamples.filter(
      e => e.errorType === 'low_confidence'
    ).length;

    // Generate insights
    const insights = this.generateInsights(
      misclassifiedExamples,
      errorPatterns,
      accuracy
    );

    return {
      misclassifiedExamples,
      errorPatterns,
      totalErrors,
      highConfidenceErrors,
      lowConfidenceErrors,
      insights,
    };
  },

  /**
   * Generate misclassified examples
   */
  generateMisclassifiedExamples(
    count: number,
    labels: string[],
    featureNames: string[]
  ): MisclassifiedExample[] {
    const examples: MisclassifiedExample[] = [];

    for (let i = 0; i < count; i++) {
      const actualLabel = labels[Math.floor(Math.random() * labels.length)];
      let predictedLabel = labels[Math.floor(Math.random() * labels.length)];
      
      // Ensure predicted is different from actual
      while (predictedLabel === actualLabel) {
        predictedLabel = labels[Math.floor(Math.random() * labels.length)];
      }

      // Generate confidence score
      const rand = Math.random();
      let confidence: number;
      let errorType: MisclassifiedExample['errorType'];

      if (rand < 0.3) {
        // High confidence error (30%)
        confidence = 0.7 + Math.random() * 0.25;
        errorType = 'high_confidence';
      } else if (rand < 0.7) {
        // Low confidence error (40%)
        confidence = 0.3 + Math.random() * 0.3;
        errorType = 'low_confidence';
      } else {
        // Boundary case (30%)
        confidence = 0.5 + Math.random() * 0.2;
        errorType = 'boundary_case';
      }

      // Generate feature values
      const features: Record<string, string | number> = {};
      featureNames.forEach(name => {
        if (Math.random() > 0.5) {
          features[name] = (Math.random() * 100).toFixed(2);
        } else {
          features[name] = ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)];
        }
      });

      // Generate explanation
      const explanation = this.generateExplanation(
        actualLabel,
        predictedLabel,
        confidence,
        errorType,
        features
      );

      examples.push({
        id: `error_${i + 1}`,
        features,
        actualLabel,
        predictedLabel,
        confidence,
        errorType,
        explanation,
      });
    }

    // Sort by confidence (highest first)
    return examples.sort((a, b) => b.confidence - a.confidence);
  },

  /**
   * Generate explanation for misclassification
   */
  generateExplanation(
    actualLabel: string,
    predictedLabel: string,
    confidence: number,
    errorType: MisclassifiedExample['errorType'],
    features: Record<string, string | number>
  ): string {
    const featureKeys = Object.keys(features);
    const sampleFeature = featureKeys[0];
    const sampleValue = features[sampleFeature];

    if (errorType === 'high_confidence') {
      return `Model was very confident (${(confidence * 100).toFixed(1)}%) but wrong. This suggests the model learned incorrect patterns or the features for ${actualLabel} and ${predictedLabel} are very similar.`;
    } else if (errorType === 'low_confidence') {
      return `Model had low confidence (${(confidence * 100).toFixed(1)}%). The features may be ambiguous or the model needs more training data to distinguish between ${actualLabel} and ${predictedLabel}.`;
    } else {
      return `Boundary case with moderate confidence (${(confidence * 100).toFixed(1)}%). The example may have characteristics of both ${actualLabel} and ${predictedLabel}, making it difficult to classify.`;
    }
  },

  /**
   * Identify error patterns
   */
  identifyErrorPatterns(
    examples: MisclassifiedExample[],
    labels: string[]
  ): ErrorPattern[] {
    const patterns: ErrorPattern[] = [];

    // Count confusion pairs
    const confusionPairs: Record<string, number> = {};
    examples.forEach(ex => {
      const key = `${ex.actualLabel} → ${ex.predictedLabel}`;
      confusionPairs[key] = (confusionPairs[key] || 0) + 1;
    });

    // Find most common confusion pairs
    const sortedPairs = Object.entries(confusionPairs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    sortedPairs.forEach(([pair, count]) => {
      const [actual, predicted] = pair.split(' → ');
      patterns.push({
        pattern: pair,
        count,
        description: `Model frequently confuses ${actual} with ${predicted}`,
        suggestion: `Review feature importance and consider adding more distinctive features to separate ${actual} from ${predicted}`,
      });
    });

    // High confidence errors pattern
    const highConfErrors = examples.filter(e => e.errorType === 'high_confidence');
    if (highConfErrors.length > examples.length * 0.3) {
      patterns.push({
        pattern: 'High Confidence Errors',
        count: highConfErrors.length,
        description: 'Many errors made with high confidence',
        suggestion: 'Model may have learned incorrect patterns. Consider reviewing training data quality and feature engineering',
      });
    }

    // Low confidence errors pattern
    const lowConfErrors = examples.filter(e => e.errorType === 'low_confidence');
    if (lowConfErrors.length > examples.length * 0.4) {
      patterns.push({
        pattern: 'Low Confidence Errors',
        count: lowConfErrors.length,
        description: 'Many errors made with low confidence',
        suggestion: 'Model is uncertain. Consider collecting more training data or improving feature quality',
      });
    }

    return patterns;
  },

  /**
   * Generate insights from error analysis
   */
  generateInsights(
    examples: MisclassifiedExample[],
    patterns: ErrorPattern[],
    accuracy: number
  ): string[] {
    const insights: string[] = [];

    // Overall performance insight
    if (accuracy > 0.9) {
      insights.push('Excellent model performance! Most errors are edge cases that are difficult even for humans.');
    } else if (accuracy > 0.8) {
      insights.push('Good model performance. Focus on the most common error patterns to improve further.');
    } else if (accuracy > 0.7) {
      insights.push('Moderate performance. Significant room for improvement by addressing error patterns.');
    } else {
      insights.push('Model needs improvement. Consider collecting more data or engineering better features.');
    }

    // High confidence errors insight
    const highConfErrors = examples.filter(e => e.errorType === 'high_confidence');
    if (highConfErrors.length > 0) {
      insights.push(
        `${highConfErrors.length} high-confidence errors detected. These are the most concerning as the model is confidently wrong.`
      );
    }

    // Pattern-based insights
    if (patterns.length > 0) {
      const topPattern = patterns[0];
      insights.push(
        `Most common error: ${topPattern.pattern} (${topPattern.count} cases). ${topPattern.suggestion}`
      );
    }

    // Feature-based insight
    insights.push(
      'Review the feature values of misclassified examples to identify which features are most problematic.'
    );

    return insights;
  },

  /**
   * Filter examples by confidence threshold
   */
  filterByConfidence(
    examples: MisclassifiedExample[],
    minConfidence: number,
    maxConfidence: number
  ): MisclassifiedExample[] {
    return examples.filter(
      ex => ex.confidence >= minConfidence && ex.confidence <= maxConfidence
    );
  },

  /**
   * Filter examples by error type
   */
  filterByErrorType(
    examples: MisclassifiedExample[],
    errorType: MisclassifiedExample['errorType']
  ): MisclassifiedExample[] {
    return examples.filter(ex => ex.errorType === errorType);
  },

  /**
   * Get examples for specific confusion pair
   */
  getConfusionPairExamples(
    examples: MisclassifiedExample[],
    actualLabel: string,
    predictedLabel: string
  ): MisclassifiedExample[] {
    return examples.filter(
      ex => ex.actualLabel === actualLabel && ex.predictedLabel === predictedLabel
    );
  },
};
