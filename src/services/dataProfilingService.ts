import type { ColumnInfo } from './dataValidationService';

export interface HistogramData {
  bin: string;
  count: number;
  range: string;
}

export interface CategoryFrequency {
  category: string;
  count: number;
  percentage: number;
}

export interface CorrelationData {
  column1: string;
  column2: string;
  correlation: number;
}

export interface BoxPlotData {
  column: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

export const dataProfilingService = {
  /**
   * Calculate histogram data for a numeric column
   */
  calculateHistogram(data: string[][], columnIndex: number, bins: number = 10): HistogramData[] {
    const rows = data.slice(1);
    const values = rows
      .map(row => parseFloat(row[columnIndex]))
      .filter(v => !isNaN(v));

    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;

    const histogram: HistogramData[] = [];
    
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = min + (i + 1) * binWidth;
      const count = values.filter(v => v >= binStart && (i === bins - 1 ? v <= binEnd : v < binEnd)).length;
      
      histogram.push({
        bin: `Bin ${i + 1}`,
        count,
        range: `${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`,
      });
    }

    return histogram;
  },

  /**
   * Calculate frequency distribution for categorical column
   */
  calculateCategoryFrequency(data: string[][], columnIndex: number, topN: number = 10): CategoryFrequency[] {
    const rows = data.slice(1);
    const values = rows
      .map(row => row[columnIndex])
      .filter(v => v !== null && v !== undefined && v !== '');

    if (values.length === 0) return [];

    const frequency: Record<string, number> = {};
    values.forEach(v => {
      frequency[v] = (frequency[v] || 0) + 1;
    });

    const total = values.length;
    const frequencies: CategoryFrequency[] = Object.entries(frequency)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);

    return frequencies;
  },

  /**
   * Calculate correlation matrix for numeric columns
   */
  calculateCorrelationMatrix(data: string[][], columnInfo: ColumnInfo[]): CorrelationData[] {
    const numericColumns = columnInfo
      .map((col, index) => ({ col, index }))
      .filter(({ col }) => col.type === 'numeric');

    if (numericColumns.length < 2) return [];

    const rows = data.slice(1);
    const correlations: CorrelationData[] = [];

    // Get numeric values for each column
    const columnValues: Record<number, number[]> = {};
    numericColumns.forEach(({ index }) => {
      columnValues[index] = rows
        .map(row => parseFloat(row[index]))
        .filter(v => !isNaN(v));
    });

    // Calculate correlation for each pair
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i; j < numericColumns.length; j++) {
        const col1Index = numericColumns[i].index;
        const col2Index = numericColumns[j].index;
        const col1Name = numericColumns[i].col.name;
        const col2Name = numericColumns[j].col.name;

        const values1 = columnValues[col1Index];
        const values2 = columnValues[col2Index];

        // Calculate Pearson correlation
        const correlation = this.pearsonCorrelation(values1, values2);

        correlations.push({
          column1: col1Name,
          column2: col2Name,
          correlation,
        });
      }
    }

    return correlations;
  },

  /**
   * Calculate Pearson correlation coefficient
   */
  pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    if (denomX === 0 || denomY === 0) return 0;

    return numerator / Math.sqrt(denomX * denomY);
  },

  /**
   * Calculate box plot statistics
   */
  calculateBoxPlot(data: string[][], columnIndex: number): BoxPlotData | null {
    const headers = data[0];
    const rows = data.slice(1);
    const values = rows
      .map(row => parseFloat(row[columnIndex]))
      .filter(v => !isNaN(v))
      .sort((a, b) => a - b);

    if (values.length === 0) return null;

    const q1Index = Math.floor(values.length * 0.25);
    const medianIndex = Math.floor(values.length * 0.5);
    const q3Index = Math.floor(values.length * 0.75);

    const q1 = values[q1Index];
    const median = values[medianIndex];
    const q3 = values[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = values.filter(v => v < lowerBound || v > upperBound);
    const nonOutliers = values.filter(v => v >= lowerBound && v <= upperBound);

    return {
      column: headers[columnIndex],
      min: nonOutliers.length > 0 ? Math.min(...nonOutliers) : values[0],
      q1,
      median,
      q3,
      max: nonOutliers.length > 0 ? Math.max(...nonOutliers) : values[values.length - 1],
      outliers,
    };
  },

  /**
   * Calculate box plots for all numeric columns
   */
  calculateAllBoxPlots(data: string[][], columnInfo: ColumnInfo[]): BoxPlotData[] {
    const boxPlots: BoxPlotData[] = [];

    columnInfo.forEach((col, index) => {
      if (col.type === 'numeric') {
        const boxPlot = this.calculateBoxPlot(data, index);
        if (boxPlot) {
          boxPlots.push(boxPlot);
        }
      }
    });

    return boxPlots;
  },

  /**
   * Get distribution summary
   */
  getDistributionSummary(data: string[][], columnIndex: number): {
    skewness: number;
    kurtosis: number;
    isNormal: boolean;
  } {
    const rows = data.slice(1);
    const values = rows
      .map(row => parseFloat(row[columnIndex]))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      return { skewness: 0, kurtosis: 0, isNormal: false };
    }

    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    if (std === 0) {
      return { skewness: 0, kurtosis: 0, isNormal: false };
    }

    // Calculate skewness
    const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 3), 0) / n;

    // Calculate kurtosis
    const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / std, 4), 0) / n - 3;

    // Simple normality check (skewness and kurtosis close to 0)
    const isNormal = Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 0.5;

    return { skewness, kurtosis, isNormal };
  },
};
