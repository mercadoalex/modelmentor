/**
 * Time Series Analysis Service
 * Implements forecasting and anomaly detection for temporal data
 */

export interface TimeSeriesData {
  timestamp: number;
  value: number;
  date?: string;
}

export interface ForecastResult {
  historical: TimeSeriesData[];
  forecast: TimeSeriesData[];
  lowerBound?: TimeSeriesData[];
  upperBound?: TimeSeriesData[];
  metrics?: {
    mae?: number;
    rmse?: number;
    mape?: number;
  };
}

export interface DecompositionResult {
  trend: TimeSeriesData[];
  seasonal: TimeSeriesData[];
  residual: TimeSeriesData[];
  original: TimeSeriesData[];
}

export interface AnomalyResult {
  data: TimeSeriesData[];
  anomalies: TimeSeriesData[];
  threshold: number;
  method: string;
}

export interface StationarityTest {
  isStationary: boolean;
  testStatistic: number;
  pValue: number;
  criticalValues: { [key: string]: number };
}

class TimeSeriesService {
  /**
   * Generate synthetic time series data
   */
  generateTimeSeriesData(
    length: number = 100,
    trend: number = 0.5,
    seasonalPeriod: number = 12,
    seasonalAmplitude: number = 10,
    noiseLevel: number = 5,
    includeAnomalies: boolean = false
  ): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < length; i++) {
      const trendComponent = trend * i;
      const seasonalComponent = seasonalAmplitude * Math.sin((2 * Math.PI * i) / seasonalPeriod);
      const noise = (Math.random() - 0.5) * noiseLevel;
      
      let value = 50 + trendComponent + seasonalComponent + noise;

      // Add anomalies
      if (includeAnomalies && Math.random() < 0.05) {
        value += (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 20);
      }

      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      data.push({
        timestamp: i,
        value: Math.max(0, value),
        date: date.toISOString().split('T')[0]
      });
    }

    return data;
  }

  /**
   * Seasonal Decomposition
   * Separates time series into trend, seasonal, and residual components
   */
  seasonalDecomposition(
    data: TimeSeriesData[],
    period: number = 12
  ): DecompositionResult {
    const values = data.map(d => d.value);
    
    // Calculate trend using moving average
    const trend = this.movingAverage(values, period);
    
    // Detrend the data
    const detrended = values.map((v, i) => v - trend[i]);
    
    // Calculate seasonal component
    const seasonal = this.calculateSeasonal(detrended, period);
    
    // Calculate residual
    const residual = values.map((v, i) => v - trend[i] - seasonal[i]);

    return {
      original: data,
      trend: data.map((d, i) => ({ ...d, value: trend[i] })),
      seasonal: data.map((d, i) => ({ ...d, value: seasonal[i] })),
      residual: data.map((d, i) => ({ ...d, value: residual[i] }))
    };
  }

  private movingAverage(values: number[], window: number): number[] {
    const result: number[] = [];
    const halfWindow = Math.floor(window / 2);

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(values.length, i + halfWindow + 1);
      const slice = values.slice(start, end);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      result.push(avg);
    }

    return result;
  }

  private calculateSeasonal(detrended: number[], period: number): number[] {
    const seasonalPattern: number[] = [];
    
    // Calculate average for each seasonal position
    for (let i = 0; i < period; i++) {
      const values: number[] = [];
      for (let j = i; j < detrended.length; j += period) {
        values.push(detrended[j]);
      }
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      seasonalPattern.push(avg);
    }

    // Repeat pattern for full length
    const seasonal: number[] = [];
    for (let i = 0; i < detrended.length; i++) {
      seasonal.push(seasonalPattern[i % period]);
    }

    return seasonal;
  }

  /**
   * Augmented Dickey-Fuller Test (simplified)
   * Tests for stationarity in time series
   */
  adfTest(data: TimeSeriesData[]): StationarityTest {
    const values = data.map(d => d.value);
    
    // Calculate first differences
    const diffs: number[] = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }

    // Calculate test statistic (simplified)
    const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const variance = diffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / diffs.length;
    const stdDev = Math.sqrt(variance);
    
    // Simplified test statistic
    const testStatistic = mean / (stdDev / Math.sqrt(diffs.length));
    
    // Critical values (approximate)
    const criticalValues = {
      '1%': -3.43,
      '5%': -2.86,
      '10%': -2.57
    };

    // Simplified p-value estimation
    const pValue = testStatistic < -2.86 ? 0.01 : testStatistic < -2.57 ? 0.05 : 0.10;
    
    return {
      isStationary: testStatistic < criticalValues['5%'],
      testStatistic,
      pValue,
      criticalValues
    };
  }

  /**
   * ARIMA Forecasting (simplified)
   * Auto-regressive Integrated Moving Average
   */
  arimaForecast(
    data: TimeSeriesData[],
    forecastSteps: number = 10,
    p: number = 1,
    d: number = 1,
    q: number = 1
  ): ForecastResult {
    const values = data.map(d => d.value);
    
    // Apply differencing (d)
    let diffed = [...values];
    for (let i = 0; i < d; i++) {
      diffed = this.difference(diffed);
    }

    // Simple AR(p) model for forecasting
    const forecast: number[] = [];
    const lastValues = values.slice(-p);
    
    for (let i = 0; i < forecastSteps; i++) {
      // Simple weighted average of last p values
      const weights = Array.from({ length: p }, (_, i) => 1 - (i / p));
      const weightSum = weights.reduce((a, b) => a + b, 0);
      const normalizedWeights = weights.map(w => w / weightSum);
      
      const predicted = lastValues.reduce((sum, val, idx) => 
        sum + val * normalizedWeights[idx], 0
      );
      
      forecast.push(predicted);
      lastValues.shift();
      lastValues.push(predicted);
    }

    // Calculate confidence intervals (simplified)
    const stdDev = this.calculateStdDev(values);
    const confidenceMultiplier = 1.96; // 95% confidence

    const forecastData: TimeSeriesData[] = forecast.map((val, i) => ({
      timestamp: data.length + i,
      value: val,
      date: this.addDays(data[data.length - 1].date || '', i + 1)
    }));

    const lowerBound: TimeSeriesData[] = forecast.map((val, i) => ({
      timestamp: data.length + i,
      value: val - confidenceMultiplier * stdDev * Math.sqrt(i + 1),
      date: this.addDays(data[data.length - 1].date || '', i + 1)
    }));

    const upperBound: TimeSeriesData[] = forecast.map((val, i) => ({
      timestamp: data.length + i,
      value: val + confidenceMultiplier * stdDev * Math.sqrt(i + 1),
      date: this.addDays(data[data.length - 1].date || '', i + 1)
    }));

    return {
      historical: data,
      forecast: forecastData,
      lowerBound,
      upperBound
    };
  }

  /**
   * LSTM-based Forecasting (simplified simulation)
   */
  lstmForecast(
    data: TimeSeriesData[],
    forecastSteps: number = 10,
    lookback: number = 10
  ): ForecastResult {
    const values = data.map(d => d.value);
    
    // Simulate LSTM with exponential smoothing and pattern recognition
    const forecast: number[] = [];
    const recentValues = values.slice(-lookback);
    
    // Calculate trend and momentum
    const trend = (recentValues[recentValues.length - 1] - recentValues[0]) / lookback;
    
    for (let i = 0; i < forecastSteps; i++) {
      // Weighted combination of recent values with trend
      const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      const predicted = recentAvg + trend * (i + 1) * 0.8;
      
      forecast.push(predicted);
      recentValues.shift();
      recentValues.push(predicted);
    }

    const stdDev = this.calculateStdDev(values);

    return {
      historical: data,
      forecast: forecast.map((val, i) => ({
        timestamp: data.length + i,
        value: val,
        date: this.addDays(data[data.length - 1].date || '', i + 1)
      })),
      lowerBound: forecast.map((val, i) => ({
        timestamp: data.length + i,
        value: val - 1.96 * stdDev * Math.sqrt(i + 1),
        date: this.addDays(data[data.length - 1].date || '', i + 1)
      })),
      upperBound: forecast.map((val, i) => ({
        timestamp: data.length + i,
        value: val + 1.96 * stdDev * Math.sqrt(i + 1),
        date: this.addDays(data[data.length - 1].date || '', i + 1)
      }))
    };
  }

  /**
   * Prophet-style Forecasting (simplified)
   * Additive model with trend and seasonality
   */
  prophetForecast(
    data: TimeSeriesData[],
    forecastSteps: number = 10,
    seasonalPeriod: number = 12
  ): ForecastResult {
    const values = data.map(d => d.value);
    
    // Decompose into trend and seasonal
    const decomposition = this.seasonalDecomposition(data, seasonalPeriod);
    const trendValues = decomposition.trend.map(d => d.value);
    const seasonalValues = decomposition.seasonal.map(d => d.value);
    
    // Extrapolate trend (linear regression)
    const trendSlope = (trendValues[trendValues.length - 1] - trendValues[0]) / trendValues.length;
    const lastTrend = trendValues[trendValues.length - 1];
    
    // Forecast
    const forecast: number[] = [];
    for (let i = 0; i < forecastSteps; i++) {
      const trendComponent = lastTrend + trendSlope * (i + 1);
      const seasonalComponent = seasonalValues[data.length % seasonalPeriod];
      forecast.push(trendComponent + seasonalComponent);
    }

    const stdDev = this.calculateStdDev(values);

    return {
      historical: data,
      forecast: forecast.map((val, i) => ({
        timestamp: data.length + i,
        value: val,
        date: this.addDays(data[data.length - 1].date || '', i + 1)
      })),
      lowerBound: forecast.map((val, i) => ({
        timestamp: data.length + i,
        value: val - 1.96 * stdDev,
        date: this.addDays(data[data.length - 1].date || '', i + 1)
      })),
      upperBound: forecast.map((val, i) => ({
        timestamp: data.length + i,
        value: val + 1.96 * stdDev,
        date: this.addDays(data[data.length - 1].date || '', i + 1)
      }))
    };
  }

  /**
   * Z-Score Anomaly Detection
   */
  zScoreAnomalyDetection(
    data: TimeSeriesData[],
    threshold: number = 3
  ): AnomalyResult {
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = this.calculateStdDev(values);

    const anomalies: TimeSeriesData[] = [];
    data.forEach(point => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push(point);
      }
    });

    return {
      data,
      anomalies,
      threshold,
      method: 'Z-Score'
    };
  }

  /**
   * IQR (Interquartile Range) Anomaly Detection
   */
  iqrAnomalyDetection(
    data: TimeSeriesData[],
    multiplier: number = 1.5
  ): AnomalyResult {
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    
    const q1 = values[q1Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    const anomalies: TimeSeriesData[] = [];
    data.forEach(point => {
      if (point.value < lowerBound || point.value > upperBound) {
        anomalies.push(point);
      }
    });

    return {
      data,
      anomalies,
      threshold: multiplier,
      method: 'IQR'
    };
  }

  /**
   * Isolation Forest for Time Series (simplified)
   */
  isolationForestTemporal(
    data: TimeSeriesData[],
    contamination: number = 0.1
  ): AnomalyResult {
    // Use sliding window features
    const windowSize = 5;
    const features: number[][] = [];
    
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i).map(d => d.value);
      features.push(window);
    }

    // Simple anomaly scoring based on local deviation
    const scores: number[] = [];
    for (let i = 0; i < features.length; i++) {
      const window = features[i];
      const mean = window.reduce((a, b) => a + b, 0) / window.length;
      const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
      scores.push(variance);
    }

    // Determine threshold
    const sortedScores = [...scores].sort((a, b) => b - a);
    const thresholdIndex = Math.floor(scores.length * contamination);
    const threshold = sortedScores[thresholdIndex];

    const anomalies: TimeSeriesData[] = [];
    scores.forEach((score, idx) => {
      if (score > threshold) {
        anomalies.push(data[idx + windowSize]);
      }
    });

    return {
      data,
      anomalies,
      threshold,
      method: 'Isolation Forest'
    };
  }

  /**
   * Calculate ACF (Autocorrelation Function)
   */
  calculateACF(data: TimeSeriesData[], maxLag: number = 20): number[] {
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    const acf: number[] = [];
    for (let lag = 0; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < values.length - lag; i++) {
        sum += (values[i] - mean) * (values[i + lag] - mean);
      }
      acf.push(sum / (values.length * variance));
    }

    return acf;
  }

  /**
   * Calculate PACF (Partial Autocorrelation Function) - simplified
   */
  calculatePACF(data: TimeSeriesData[], maxLag: number = 20): number[] {
    const acf = this.calculateACF(data, maxLag);
    const pacf: number[] = [1]; // PACF at lag 0 is always 1

    // Simplified PACF calculation using Durbin-Levinson algorithm
    for (let k = 1; k <= maxLag; k++) {
      let numerator = acf[k];
      let denominator = 1;

      for (let j = 1; j < k; j++) {
        numerator -= pacf[j] * acf[k - j];
      }

      pacf.push(numerator / denominator);
    }

    return pacf;
  }

  /**
   * Helper methods
   */
  private difference(values: number[]): number[] {
    const result: number[] = [];
    for (let i = 1; i < values.length; i++) {
      result.push(values[i] - values[i - 1]);
    }
    return result;
  }

  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private addDays(dateStr: string, days: number): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

export const timeSeriesService = new TimeSeriesService();
