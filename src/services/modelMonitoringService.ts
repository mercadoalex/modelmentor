export type DriftStatus = 'healthy' | 'warning' | 'critical';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface FeatureDistribution {
  featureName: string;
  baseline: number[];
  current: number[];
  mean: number;
  stdDev: number;
}

export interface DriftMetrics {
  featureName: string;
  klDivergence: number;
  ksStatistic: number;
  psi: number; // Population Stability Index
  driftScore: number; // Combined drift score (0-1)
  status: DriftStatus;
}

export interface PredictionDrift {
  timestamp: Date;
  baselineMean: number;
  currentMean: number;
  drift: number;
  status: DriftStatus;
}

export interface PerformanceMetrics {
  timestamp: Date;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  sampleCount: number;
}

export interface MonitoringAlert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  type: 'prediction_drift' | 'data_drift' | 'performance_degradation';
  message: string;
  details: string;
  acknowledged: boolean;
}

export interface RetrainingRecommendation {
  shouldRetrain: boolean;
  urgency: 'low' | 'medium' | 'high';
  reasons: string[];
  estimatedImprovement: number;
  confidence: number;
}

export interface MonitoringConfig {
  predictionDriftThreshold: number;
  dataDriftThreshold: number;
  performanceDegradationThreshold: number;
  alertEnabled: boolean;
  autoRetrainingEnabled: boolean;
}

export const modelMonitoringService = {
  /**
   * Calculate KL Divergence between two distributions
   */
  calculateKLDivergence(baseline: number[], current: number[]): number {
    // Create histograms
    const bins = 10;
    const min = Math.min(...baseline, ...current);
    const max = Math.max(...baseline, ...current);
    const binWidth = (max - min) / bins;

    const baselineHist = this.createHistogram(baseline, min, max, bins);
    const currentHist = this.createHistogram(current, min, max, bins);

    // Calculate KL divergence
    let klDiv = 0;
    for (let i = 0; i < bins; i++) {
      const p = baselineHist[i] + 1e-10; // Add small constant to avoid log(0)
      const q = currentHist[i] + 1e-10;
      klDiv += p * Math.log(p / q);
    }

    return Math.max(0, klDiv);
  },

  /**
   * Calculate Kolmogorov-Smirnov statistic
   */
  calculateKSStatistic(baseline: number[], current: number[]): number {
    // Sort both arrays
    const sortedBaseline = [...baseline].sort((a, b) => a - b);
    const sortedCurrent = [...current].sort((a, b) => a - b);

    // Calculate empirical CDFs and find maximum difference
    let maxDiff = 0;
    const allValues = [...new Set([...sortedBaseline, ...sortedCurrent])].sort((a, b) => a - b);

    for (const value of allValues) {
      const baselineCDF = sortedBaseline.filter(v => v <= value).length / sortedBaseline.length;
      const currentCDF = sortedCurrent.filter(v => v <= value).length / sortedCurrent.length;
      const diff = Math.abs(baselineCDF - currentCDF);
      maxDiff = Math.max(maxDiff, diff);
    }

    return maxDiff;
  },

  /**
   * Calculate Population Stability Index (PSI)
   */
  calculatePSI(baseline: number[], current: number[]): number {
    const bins = 10;
    const min = Math.min(...baseline, ...current);
    const max = Math.max(...baseline, ...current);

    const baselineHist = this.createHistogram(baseline, min, max, bins);
    const currentHist = this.createHistogram(current, min, max, bins);

    let psi = 0;
    for (let i = 0; i < bins; i++) {
      const expected = baselineHist[i] + 1e-10;
      const actual = currentHist[i] + 1e-10;
      psi += (actual - expected) * Math.log(actual / expected);
    }

    return Math.abs(psi);
  },

  /**
   * Create histogram from data
   */
  createHistogram(data: number[], min: number, max: number, bins: number): number[] {
    const hist = new Array(bins).fill(0);
    const binWidth = (max - min) / bins;

    for (const value of data) {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      hist[binIndex]++;
    }

    // Normalize to probabilities
    const total = data.length;
    return hist.map(count => count / total);
  },

  /**
   * Detect data drift for multiple features
   */
  detectDataDrift(
    baselineData: Record<string, number[]>,
    currentData: Record<string, number[]>
  ): DriftMetrics[] {
    const features = Object.keys(baselineData);
    
    return features.map(feature => {
      const baseline = baselineData[feature];
      const current = currentData[feature];

      const klDivergence = this.calculateKLDivergence(baseline, current);
      const ksStatistic = this.calculateKSStatistic(baseline, current);
      const psi = this.calculatePSI(baseline, current);

      // Combined drift score (weighted average)
      const driftScore = (klDivergence * 0.4 + ksStatistic * 0.3 + psi * 0.3);

      // Determine status
      let status: DriftStatus;
      if (driftScore < 0.1) {
        status = 'healthy';
      } else if (driftScore < 0.25) {
        status = 'warning';
      } else {
        status = 'critical';
      }

      return {
        featureName: feature,
        klDivergence,
        ksStatistic,
        psi,
        driftScore,
        status,
      };
    });
  },

  /**
   * Detect prediction drift
   */
  detectPredictionDrift(
    baselinePredictions: number[],
    currentPredictions: number[]
  ): PredictionDrift {
    const baselineMean = baselinePredictions.reduce((a, b) => a + b, 0) / baselinePredictions.length;
    const currentMean = currentPredictions.reduce((a, b) => a + b, 0) / currentPredictions.length;
    
    const drift = Math.abs(currentMean - baselineMean);

    let status: DriftStatus;
    if (drift < 0.05) {
      status = 'healthy';
    } else if (drift < 0.15) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      timestamp: new Date(),
      baselineMean,
      currentMean,
      drift,
      status,
    };
  },

  /**
   * Track performance degradation
   */
  detectPerformanceDegradation(
    historicalMetrics: PerformanceMetrics[],
    currentMetrics: PerformanceMetrics,
    threshold: number = 0.05
  ): { degraded: boolean; degradation: number; status: DriftStatus } {
    if (historicalMetrics.length === 0) {
      return { degraded: false, degradation: 0, status: 'healthy' };
    }

    // Calculate baseline performance (average of historical)
    const baselineAccuracy = 
      historicalMetrics.reduce((sum, m) => sum + m.accuracy, 0) / historicalMetrics.length;

    const degradation = baselineAccuracy - currentMetrics.accuracy;
    const degraded = degradation > threshold;

    let status: DriftStatus;
    if (degradation < threshold) {
      status = 'healthy';
    } else if (degradation < threshold * 2) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return { degraded, degradation, status };
  },

  /**
   * Generate monitoring alerts
   */
  generateAlerts(
    dataDrift: DriftMetrics[],
    predictionDrift: PredictionDrift,
    performanceStatus: { degraded: boolean; degradation: number; status: DriftStatus },
    config: MonitoringConfig
  ): MonitoringAlert[] {
    const alerts: MonitoringAlert[] = [];

    // Data drift alerts
    const criticalDrift = dataDrift.filter(d => d.status === 'critical');
    if (criticalDrift.length > 0) {
      alerts.push({
        id: `data_drift_${Date.now()}`,
        timestamp: new Date(),
        severity: 'critical',
        type: 'data_drift',
        message: `Critical data drift detected in ${criticalDrift.length} feature(s)`,
        details: `Features: ${criticalDrift.map(d => d.featureName).join(', ')}`,
        acknowledged: false,
      });
    }

    const warningDrift = dataDrift.filter(d => d.status === 'warning');
    if (warningDrift.length > 0) {
      alerts.push({
        id: `data_drift_warning_${Date.now()}`,
        timestamp: new Date(),
        severity: 'warning',
        type: 'data_drift',
        message: `Data drift warning in ${warningDrift.length} feature(s)`,
        details: `Features: ${warningDrift.map(d => d.featureName).join(', ')}`,
        acknowledged: false,
      });
    }

    // Prediction drift alerts
    if (predictionDrift.status === 'critical') {
      alerts.push({
        id: `pred_drift_${Date.now()}`,
        timestamp: new Date(),
        severity: 'critical',
        type: 'prediction_drift',
        message: 'Critical prediction drift detected',
        details: `Drift: ${(predictionDrift.drift * 100).toFixed(1)}%`,
        acknowledged: false,
      });
    } else if (predictionDrift.status === 'warning') {
      alerts.push({
        id: `pred_drift_warning_${Date.now()}`,
        timestamp: new Date(),
        severity: 'warning',
        type: 'prediction_drift',
        message: 'Prediction drift warning',
        details: `Drift: ${(predictionDrift.drift * 100).toFixed(1)}%`,
        acknowledged: false,
      });
    }

    // Performance degradation alerts
    if (performanceStatus.status === 'critical') {
      alerts.push({
        id: `perf_degrade_${Date.now()}`,
        timestamp: new Date(),
        severity: 'critical',
        type: 'performance_degradation',
        message: 'Critical performance degradation detected',
        details: `Accuracy dropped by ${(performanceStatus.degradation * 100).toFixed(1)}%`,
        acknowledged: false,
      });
    } else if (performanceStatus.status === 'warning') {
      alerts.push({
        id: `perf_degrade_warning_${Date.now()}`,
        timestamp: new Date(),
        severity: 'warning',
        type: 'performance_degradation',
        message: 'Performance degradation warning',
        details: `Accuracy dropped by ${(performanceStatus.degradation * 100).toFixed(1)}%`,
        acknowledged: false,
      });
    }

    return alerts;
  },

  /**
   * Generate retraining recommendation
   */
  generateRetrainingRecommendation(
    dataDrift: DriftMetrics[],
    predictionDrift: PredictionDrift,
    performanceStatus: { degraded: boolean; degradation: number }
  ): RetrainingRecommendation {
    const reasons: string[] = [];
    let urgencyScore = 0;

    // Check data drift
    const criticalDriftCount = dataDrift.filter(d => d.status === 'critical').length;
    const warningDriftCount = dataDrift.filter(d => d.status === 'warning').length;
    
    if (criticalDriftCount > 0) {
      reasons.push(`${criticalDriftCount} feature(s) show critical data drift`);
      urgencyScore += 3;
    }
    if (warningDriftCount > 0) {
      reasons.push(`${warningDriftCount} feature(s) show moderate data drift`);
      urgencyScore += 1;
    }

    // Check prediction drift
    if (predictionDrift.status === 'critical') {
      reasons.push('Critical prediction drift detected');
      urgencyScore += 3;
    } else if (predictionDrift.status === 'warning') {
      reasons.push('Moderate prediction drift detected');
      urgencyScore += 1;
    }

    // Check performance degradation
    if (performanceStatus.degraded) {
      reasons.push(`Performance degraded by ${(performanceStatus.degradation * 100).toFixed(1)}%`);
      urgencyScore += performanceStatus.degradation > 0.1 ? 3 : 2;
    }

    // Determine urgency
    let urgency: 'low' | 'medium' | 'high';
    if (urgencyScore >= 6) {
      urgency = 'high';
    } else if (urgencyScore >= 3) {
      urgency = 'medium';
    } else {
      urgency = 'low';
    }

    // Estimate improvement
    const avgDriftScore = dataDrift.reduce((sum, d) => sum + d.driftScore, 0) / dataDrift.length;
    const estimatedImprovement = Math.min(0.15, avgDriftScore * 0.5 + performanceStatus.degradation);

    // Calculate confidence
    const confidence = reasons.length > 0 ? Math.min(0.95, 0.5 + urgencyScore * 0.1) : 0.3;

    return {
      shouldRetrain: urgencyScore >= 3,
      urgency,
      reasons,
      estimatedImprovement,
      confidence,
    };
  },

  /**
   * Generate simulated monitoring data for demonstration
   */
  generateSimulatedData(daysBack: number = 30): {
    dataDrift: DriftMetrics[];
    predictionDrift: PredictionDrift[];
    performanceMetrics: PerformanceMetrics[];
  } {
    const features = ['age', 'income', 'experience', 'education', 'hours_worked'];
    
    // Generate baseline data
    const baselineData: Record<string, number[]> = {};
    features.forEach(feature => {
      baselineData[feature] = Array.from({ length: 1000 }, () => 
        50 + Math.random() * 50
      );
    });

    // Generate time series data
    const predictionDrift: PredictionDrift[] = [];
    const performanceMetrics: PerformanceMetrics[] = [];
    const dataDriftTimeSeries: DriftMetrics[][] = [];

    for (let day = 0; day < daysBack; day++) {
      const date = new Date();
      date.setDate(date.getDate() - (daysBack - day));

      // Simulate gradual drift
      const driftFactor = day / daysBack;
      
      // Current data with drift
      const currentData: Record<string, number[]> = {};
      features.forEach(feature => {
        currentData[feature] = Array.from({ length: 100 }, () => 
          50 + Math.random() * 50 + driftFactor * 20
        );
      });

      // Calculate drift metrics
      const drift = this.detectDataDrift(baselineData, currentData);
      dataDriftTimeSeries.push(drift);

      // Prediction drift
      const baselinePredictions = Array.from({ length: 100 }, () => 0.7 + Math.random() * 0.2);
      const currentPredictions = Array.from({ length: 100 }, () => 
        0.7 + Math.random() * 0.2 - driftFactor * 0.1
      );
      predictionDrift.push(this.detectPredictionDrift(baselinePredictions, currentPredictions));

      // Performance metrics
      const baselineAccuracy = 0.85;
      const accuracy = baselineAccuracy - driftFactor * 0.1 + (Math.random() - 0.5) * 0.02;
      performanceMetrics.push({
        timestamp: date,
        accuracy,
        precision: accuracy + 0.02,
        recall: accuracy - 0.01,
        f1Score: accuracy,
        sampleCount: 100,
      });
    }

    return {
      dataDrift: dataDriftTimeSeries[dataDriftTimeSeries.length - 1],
      predictionDrift,
      performanceMetrics,
    };
  },

  /**
   * Get default monitoring configuration
   */
  getDefaultConfig(): MonitoringConfig {
    return {
      predictionDriftThreshold: 0.1,
      dataDriftThreshold: 0.2,
      performanceDegradationThreshold: 0.05,
      alertEnabled: true,
      autoRetrainingEnabled: false,
    };
  },
};
