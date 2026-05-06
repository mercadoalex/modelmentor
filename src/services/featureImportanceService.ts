import type { ColumnInfo } from './dataValidationService';

export interface FeatureImportance {
  feature: string;
  importance: number;
  method: string;
  rank: number;
  recommendation: 'high' | 'medium' | 'low';
}

export interface FeatureImportanceResult {
  features: FeatureImportance[];
  targetColumn: string;
  selectedFeatures: string[];
  recommendations: string[];
}

export const featureImportanceService = {
  /**
   * Calculate feature importance scores
   */
  calculateFeatureImportance(
    data: string[][],
    columnInfo: ColumnInfo[],
    targetColumnName: string
  ): FeatureImportanceResult {
    const targetIndex = columnInfo.findIndex(col => col.name === targetColumnName);
    if (targetIndex === -1) {
      throw new Error('Target column not found');
    }

    const targetColumn = columnInfo[targetIndex];
    const features: FeatureImportance[] = [];

    // Calculate importance for each feature (excluding target)
    columnInfo.forEach((col, index) => {
      if (index === targetIndex) return;

      let importance = 0;
      let method = '';

      if (col.type === 'numeric' && targetColumn.type === 'numeric') {
        // Use correlation for numeric-numeric
        importance = Math.abs(this.calculateCorrelation(data, index, targetIndex));
        method = 'Correlation';
      } else if (col.type === 'categorical' && targetColumn.type === 'categorical') {
        // Use chi-square for categorical-categorical
        importance = this.calculateChiSquare(data, index, targetIndex);
        method = 'Chi-Square';
      } else if (col.type === 'numeric' && targetColumn.type === 'categorical') {
        // Use ANOVA F-statistic for numeric-categorical
        importance = this.calculateANOVA(data, index, targetIndex);
        method = 'ANOVA';
      } else if (col.type === 'categorical' && targetColumn.type === 'numeric') {
        // Use correlation ratio for categorical-numeric
        importance = this.calculateCorrelationRatio(data, index, targetIndex);
        method = 'Correlation Ratio';
      } else {
        // Fallback to mutual information
        importance = this.calculateMutualInformation(data, index, targetIndex);
        method = 'Mutual Information';
      }

      // Also consider variance (for numeric features)
      if (col.type === 'numeric' && col.statistics) {
        const varianceScore = this.normalizeVariance(col.statistics.std || 0);
        importance = (importance * 0.8) + (varianceScore * 0.2);
      }

      features.push({
        feature: col.name,
        importance: Math.min(1, Math.max(0, importance)),
        method,
        rank: 0,
        recommendation: 'medium',
      });
    });

    // Rank features by importance
    features.sort((a, b) => b.importance - a.importance);
    features.forEach((f, index) => {
      f.rank = index + 1;
      
      // Set recommendation based on importance
      if (f.importance >= 0.6) {
        f.recommendation = 'high';
      } else if (f.importance >= 0.3) {
        f.recommendation = 'medium';
      } else {
        f.recommendation = 'low';
      }
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(features, targetColumn);

    // Auto-select high and medium importance features
    const selectedFeatures = features
      .filter(f => f.recommendation === 'high' || f.recommendation === 'medium')
      .map(f => f.feature);

    return {
      features,
      targetColumn: targetColumnName,
      selectedFeatures,
      recommendations,
    };
  },

  /**
   * Calculate Pearson correlation
   */
  calculateCorrelation(data: string[][], col1Index: number, col2Index: number): number {
    const rows = data.slice(1);
    const values1: number[] = [];
    const values2: number[] = [];

    rows.forEach(row => {
      const v1 = parseFloat(row[col1Index]);
      const v2 = parseFloat(row[col2Index]);
      if (!isNaN(v1) && !isNaN(v2)) {
        values1.push(v1);
        values2.push(v2);
      }
    });

    if (values1.length === 0) return 0;

    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const dx = values1[i] - mean1;
      const dy = values2[i] - mean2;
      numerator += dx * dy;
      denom1 += dx * dx;
      denom2 += dy * dy;
    }

    if (denom1 === 0 || denom2 === 0) return 0;

    return numerator / Math.sqrt(denom1 * denom2);
  },

  /**
   * Calculate chi-square statistic (normalized)
   */
  calculateChiSquare(data: string[][], col1Index: number, col2Index: number): number {
    const rows = data.slice(1);
    
    // Build contingency table
    const contingency: Record<string, Record<string, number>> = {};
    const row1Totals: Record<string, number> = {};
    const row2Totals: Record<string, number> = {};
    let total = 0;

    rows.forEach(row => {
      const v1 = row[col1Index];
      const v2 = row[col2Index];
      if (!v1 || !v2) return;

      if (!contingency[v1]) contingency[v1] = {};
      contingency[v1][v2] = (contingency[v1][v2] || 0) + 1;
      row1Totals[v1] = (row1Totals[v1] || 0) + 1;
      row2Totals[v2] = (row2Totals[v2] || 0) + 1;
      total++;
    });

    if (total === 0) return 0;

    // Calculate chi-square
    let chiSquare = 0;
    Object.keys(contingency).forEach(v1 => {
      Object.keys(contingency[v1]).forEach(v2 => {
        const observed = contingency[v1][v2];
        const expected = (row1Totals[v1] * row2Totals[v2]) / total;
        if (expected > 0) {
          chiSquare += Math.pow(observed - expected, 2) / expected;
        }
      });
    });

    // Normalize by degrees of freedom
    const df = (Object.keys(row1Totals).length - 1) * (Object.keys(row2Totals).length - 1);
    return df > 0 ? Math.min(1, chiSquare / (total * Math.sqrt(df))) : 0;
  },

  /**
   * Calculate ANOVA F-statistic (normalized)
   */
  calculateANOVA(data: string[][], numericIndex: number, categoricalIndex: number): number {
    const rows = data.slice(1);
    const groups: Record<string, number[]> = {};

    rows.forEach(row => {
      const value = parseFloat(row[numericIndex]);
      const category = row[categoricalIndex];
      if (!isNaN(value) && category) {
        if (!groups[category]) groups[category] = [];
        groups[category].push(value);
      }
    });

    const groupKeys = Object.keys(groups);
    if (groupKeys.length < 2) return 0;

    // Calculate overall mean
    const allValues = Object.values(groups).flat();
    const overallMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    // Calculate between-group variance
    let ssBetween = 0;
    groupKeys.forEach(key => {
      const groupMean = groups[key].reduce((a, b) => a + b, 0) / groups[key].length;
      ssBetween += groups[key].length * Math.pow(groupMean - overallMean, 2);
    });

    // Calculate within-group variance
    let ssWithin = 0;
    groupKeys.forEach(key => {
      const groupMean = groups[key].reduce((a, b) => a + b, 0) / groups[key].length;
      groups[key].forEach(value => {
        ssWithin += Math.pow(value - groupMean, 2);
      });
    });

    const dfBetween = groupKeys.length - 1;
    const dfWithin = allValues.length - groupKeys.length;

    if (dfBetween === 0 || dfWithin === 0 || ssWithin === 0) return 0;

    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    const fStatistic = msBetween / msWithin;

    // Normalize F-statistic to 0-1 range
    return Math.min(1, fStatistic / (fStatistic + dfWithin));
  },

  /**
   * Calculate correlation ratio (eta)
   */
  calculateCorrelationRatio(data: string[][], categoricalIndex: number, numericIndex: number): number {
    return this.calculateANOVA(data, numericIndex, categoricalIndex);
  },

  /**
   * Calculate mutual information (simplified)
   */
  calculateMutualInformation(data: string[][], col1Index: number, col2Index: number): number {
    const rows = data.slice(1);
    const joint: Record<string, number> = {};
    const marginal1: Record<string, number> = {};
    const marginal2: Record<string, number> = {};
    let total = 0;

    rows.forEach(row => {
      const v1 = String(row[col1Index]);
      const v2 = String(row[col2Index]);
      if (!v1 || !v2) return;

      const key = `${v1}|${v2}`;
      joint[key] = (joint[key] || 0) + 1;
      marginal1[v1] = (marginal1[v1] || 0) + 1;
      marginal2[v2] = (marginal2[v2] || 0) + 1;
      total++;
    });

    if (total === 0) return 0;

    let mi = 0;
    Object.keys(joint).forEach(key => {
      const [v1, v2] = key.split('|');
      const pxy = joint[key] / total;
      const px = marginal1[v1] / total;
      const py = marginal2[v2] / total;
      
      if (pxy > 0 && px > 0 && py > 0) {
        mi += pxy * Math.log2(pxy / (px * py));
      }
    });

    // Normalize by max possible MI
    const h1 = -Object.values(marginal1).reduce((sum, count) => {
      const p = count / total;
      return sum + (p > 0 ? p * Math.log2(p) : 0);
    }, 0);

    return h1 > 0 ? Math.min(1, mi / h1) : 0;
  },

  /**
   * Normalize variance to 0-1 range
   */
  normalizeVariance(std: number): number {
    // Simple normalization: higher std = higher importance
    // Cap at reasonable value
    return Math.min(1, std / 100);
  },

  /**
   * Generate recommendations based on feature importance
   */
  generateRecommendations(features: FeatureImportance[], targetColumn: ColumnInfo): string[] {
    const recommendations: string[] = [];

    const highImportance = features.filter(f => f.recommendation === 'high');
    const lowImportance = features.filter(f => f.recommendation === 'low');

    if (highImportance.length > 0) {
      recommendations.push(
        `${highImportance.length} features show high importance: ${highImportance.slice(0, 3).map(f => f.feature).join(', ')}${highImportance.length > 3 ? '...' : ''}`
      );
    }

    if (lowImportance.length > 0) {
      recommendations.push(
        `${lowImportance.length} features have low importance and can be excluded to improve model performance`
      );
    }

    if (features.length > 10) {
      recommendations.push(
        'Consider using only the top 10 features to reduce training time and prevent overfitting'
      );
    }

    const correlatedFeatures = features.filter(f => f.method === 'Correlation' && f.importance > 0.8);
    if (correlatedFeatures.length > 0) {
      recommendations.push(
        `${correlatedFeatures.length} features are highly correlated with the target variable`
      );
    }

    return recommendations;
  },
};
