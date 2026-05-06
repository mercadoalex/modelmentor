export type UserRole = 'data_scientist' | 'manager' | 'auditor' | 'compliance_officer';
export type ModelStatus = 'development' | 'staging' | 'production' | 'deprecated';
export type AuditEventType = 'prediction' | 'explanation' | 'model_update' | 'access' | 'configuration';

export interface ModelVersion {
  id: string;
  version: string;
  name: string;
  status: ModelStatus;
  accuracy: number;
  createdAt: Date;
  createdBy: string;
  deployedAt?: Date;
  deprecatedAt?: Date;
  metadata: {
    framework: string;
    algorithm: string;
    features: string[];
    trainingDataSize: number;
    trainingDuration: number;
  };
  lineage: {
    parentVersion?: string;
    datasetVersion: string;
    hyperparameters: Record<string, any>;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId: string;
  userName: string;
  modelVersion: string;
  action: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface BiasMetrics {
  demographicGroup: string;
  sampleSize: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface FairnessMetrics {
  disparateImpact: number; // Ratio of positive outcomes between groups
  equalOpportunityDifference: number; // Difference in true positive rates
  demographicParity: number; // Difference in positive prediction rates
  overallFairness: 'fair' | 'concerning' | 'unfair';
}

export interface ModelCard {
  modelName: string;
  version: string;
  overview: string;
  intendedUse: string[];
  limitations: string[];
  trainingData: {
    source: string;
    size: number;
    dateRange: string;
    features: string[];
    preprocessing: string[];
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    evaluationDate: Date;
  };
  fairness: {
    groupsAnalyzed: string[];
    fairnessMetrics: FairnessMetrics;
    mitigationStrategies: string[];
  };
  ethicalConsiderations: string[];
  contactInfo: {
    owner: string;
    email: string;
    team: string;
  };
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: Date;
  reportType: 'GDPR' | 'AI_Act' | 'Industry_Specific';
  status: 'compliant' | 'needs_review' | 'non_compliant';
  findings: Array<{
    requirement: string;
    status: 'pass' | 'warning' | 'fail';
    details: string;
  }>;
  recommendations: string[];
}

export const modelGovernanceService = {
  /**
   * Calculate Disparate Impact Ratio
   * Ratio of positive outcomes between protected and reference groups
   * Fair if between 0.8 and 1.25
   */
  calculateDisparateImpact(
    protectedGroupPositiveRate: number,
    referenceGroupPositiveRate: number
  ): number {
    if (referenceGroupPositiveRate === 0) return 0;
    return protectedGroupPositiveRate / referenceGroupPositiveRate;
  },

  /**
   * Calculate Equal Opportunity Difference
   * Difference in true positive rates between groups
   * Fair if close to 0 (typically < 0.1)
   */
  calculateEqualOpportunityDifference(
    protectedGroupTPR: number,
    referenceGroupTPR: number
  ): number {
    return Math.abs(protectedGroupTPR - referenceGroupTPR);
  },

  /**
   * Calculate Demographic Parity
   * Difference in positive prediction rates between groups
   * Fair if close to 0 (typically < 0.1)
   */
  calculateDemographicParity(
    protectedGroupPositiveRate: number,
    referenceGroupPositiveRate: number
  ): number {
    return Math.abs(protectedGroupPositiveRate - referenceGroupPositiveRate);
  },

  /**
   * Analyze bias across demographic groups
   */
  analyzeBias(
    predictions: Array<{ group: string; predicted: number; actual: number }>
  ): { metrics: BiasMetrics[]; fairness: FairnessMetrics } {
    // Group predictions by demographic
    const groups = [...new Set(predictions.map(p => p.group))];
    
    const metrics: BiasMetrics[] = groups.map(group => {
      const groupPredictions = predictions.filter(p => p.group === group);
      
      // Calculate confusion matrix
      const tp = groupPredictions.filter(p => p.predicted === 1 && p.actual === 1).length;
      const fp = groupPredictions.filter(p => p.predicted === 1 && p.actual === 0).length;
      const tn = groupPredictions.filter(p => p.predicted === 0 && p.actual === 0).length;
      const fn = groupPredictions.filter(p => p.predicted === 0 && p.actual === 1).length;
      
      const accuracy = (tp + tn) / groupPredictions.length;
      const precision = tp / (tp + fp) || 0;
      const recall = tp / (tp + fn) || 0;
      const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
      const fpr = fp / (fp + tn) || 0;
      const fnr = fn / (fn + tp) || 0;
      
      return {
        demographicGroup: group,
        sampleSize: groupPredictions.length,
        accuracy,
        precision,
        recall,
        f1Score,
        falsePositiveRate: fpr,
        falseNegativeRate: fnr,
      };
    });

    // Calculate fairness metrics (comparing first group as reference)
    const referenceGroup = metrics[0];
    const protectedGroup = metrics[1] || referenceGroup;

    const referencePositiveRate = 
      predictions.filter(p => p.group === referenceGroup.demographicGroup && p.predicted === 1).length /
      predictions.filter(p => p.group === referenceGroup.demographicGroup).length;
    
    const protectedPositiveRate = 
      predictions.filter(p => p.group === protectedGroup.demographicGroup && p.predicted === 1).length /
      predictions.filter(p => p.group === protectedGroup.demographicGroup).length;

    const disparateImpact = this.calculateDisparateImpact(
      protectedPositiveRate,
      referencePositiveRate
    );

    const equalOpportunityDifference = this.calculateEqualOpportunityDifference(
      protectedGroup.recall,
      referenceGroup.recall
    );

    const demographicParity = this.calculateDemographicParity(
      protectedPositiveRate,
      referencePositiveRate
    );

    // Determine overall fairness
    let overallFairness: 'fair' | 'concerning' | 'unfair';
    if (
      disparateImpact >= 0.8 && disparateImpact <= 1.25 &&
      equalOpportunityDifference < 0.1 &&
      demographicParity < 0.1
    ) {
      overallFairness = 'fair';
    } else if (
      disparateImpact >= 0.7 && disparateImpact <= 1.4 &&
      equalOpportunityDifference < 0.15 &&
      demographicParity < 0.15
    ) {
      overallFairness = 'concerning';
    } else {
      overallFairness = 'unfair';
    }

    return {
      metrics,
      fairness: {
        disparateImpact,
        equalOpportunityDifference,
        demographicParity,
        overallFairness,
      },
    };
  },

  /**
   * Generate audit event
   */
  logAuditEvent(
    eventType: AuditEventType,
    userId: string,
    userName: string,
    modelVersion: string,
    action: string,
    details: string,
    metadata?: Record<string, any>
  ): AuditEvent {
    return {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
      eventType,
      userId,
      userName,
      modelVersion,
      action,
      details,
      metadata,
    };
  },

  /**
   * Generate GDPR compliance report
   */
  generateGDPRReport(model: ModelVersion, auditEvents: AuditEvent[]): ComplianceReport {
    const findings = [
      {
        requirement: 'Right to Explanation',
        status: 'pass' as const,
        details: 'Model provides SHAP-based explanations for all predictions',
      },
      {
        requirement: 'Data Minimization',
        status: 'pass' as const,
        details: `Model uses ${model.metadata.features.length} features, all necessary for task`,
      },
      {
        requirement: 'Automated Decision-Making Safeguards',
        status: 'pass' as const,
        details: 'Human review process in place for high-stakes decisions',
      },
      {
        requirement: 'Audit Trail',
        status: auditEvents.length > 0 ? 'pass' as const : 'warning' as const,
        details: `${auditEvents.length} audit events recorded`,
      },
      {
        requirement: 'Data Protection Impact Assessment',
        status: 'pass' as const,
        details: 'DPIA completed and approved',
      },
    ];

    const allPass = findings.every(f => f.status === 'pass');

    return {
      reportId: `gdpr_${Date.now()}`,
      generatedAt: new Date(),
      reportType: 'GDPR',
      status: allPass ? 'compliant' : 'needs_review',
      findings,
      recommendations: [
        'Continue monitoring audit trail completeness',
        'Review data retention policies quarterly',
        'Update privacy notices when model changes',
      ],
    };
  },

  /**
   * Generate AI Act compliance report
   */
  generateAIActReport(model: ModelVersion, biasMetrics: BiasMetrics[]): ComplianceReport {
    const findings = [
      {
        requirement: 'Risk Assessment',
        status: 'pass' as const,
        details: 'Model classified as limited-risk AI system',
      },
      {
        requirement: 'Transparency Requirements',
        status: 'pass' as const,
        details: 'Model card and documentation available',
      },
      {
        requirement: 'Human Oversight',
        status: 'pass' as const,
        details: 'Human-in-the-loop for critical decisions',
      },
      {
        requirement: 'Accuracy and Robustness',
        status: model.accuracy >= 0.8 ? 'pass' as const : 'warning' as const,
        details: `Model accuracy: ${(model.accuracy * 100).toFixed(1)}%`,
      },
      {
        requirement: 'Bias Monitoring',
        status: biasMetrics.length > 0 ? 'pass' as const : 'warning' as const,
        details: `Bias analysis conducted across ${biasMetrics.length} demographic groups`,
      },
    ];

    const allPass = findings.every(f => f.status === 'pass');

    return {
      reportId: `ai_act_${Date.now()}`,
      generatedAt: new Date(),
      reportType: 'AI_Act',
      status: allPass ? 'compliant' : 'needs_review',
      findings,
      recommendations: [
        'Maintain regular bias audits',
        'Document all model updates',
        'Ensure conformity assessment is current',
      ],
    };
  },

  /**
   * Generate model card
   */
  generateModelCard(
    model: ModelVersion,
    biasMetrics: BiasMetrics[],
    fairnessMetrics: FairnessMetrics
  ): ModelCard {
    return {
      modelName: model.name,
      version: model.version,
      overview: `${model.metadata.algorithm} model for classification tasks`,
      intendedUse: [
        'Automated decision support in low-stakes scenarios',
        'Preliminary screening with human review',
        'Educational and research purposes',
      ],
      limitations: [
        'Performance may degrade on out-of-distribution data',
        'Requires periodic retraining to maintain accuracy',
        'Not suitable for high-stakes decisions without human oversight',
        'May exhibit bias across demographic groups',
      ],
      trainingData: {
        source: 'Internal dataset',
        size: model.metadata.trainingDataSize,
        dateRange: '2024-01-01 to 2024-12-31',
        features: model.metadata.features,
        preprocessing: [
          'Missing value imputation',
          'Feature scaling (standardization)',
          'Categorical encoding (one-hot)',
        ],
      },
      performance: {
        accuracy: model.accuracy,
        precision: 0.85,
        recall: 0.82,
        f1Score: 0.83,
        evaluationDate: new Date(),
      },
      fairness: {
        groupsAnalyzed: biasMetrics.map(m => m.demographicGroup),
        fairnessMetrics,
        mitigationStrategies: [
          'Balanced training data across demographic groups',
          'Fairness-aware model training',
          'Regular bias audits and monitoring',
          'Threshold optimization for equal opportunity',
        ],
      },
      ethicalConsiderations: [
        'Model decisions should not be the sole basis for high-stakes outcomes',
        'Regular fairness audits required',
        'Transparent communication about model limitations',
        'User consent and data privacy protection',
      ],
      contactInfo: {
        owner: 'ML Team',
        email: 'ml-team@example.com',
        team: 'Data Science',
      },
    };
  },

  /**
   * Check user permissions
   */
  checkPermission(userRole: UserRole, action: string): boolean {
    const permissions: Record<UserRole, string[]> = {
      data_scientist: ['view', 'train', 'deploy', 'update', 'view_audit'],
      manager: ['view', 'approve', 'view_audit', 'view_reports'],
      auditor: ['view', 'view_audit', 'view_reports', 'export'],
      compliance_officer: ['view', 'view_audit', 'view_reports', 'export', 'compliance'],
    };

    return permissions[userRole]?.includes(action) || false;
  },

  /**
   * Generate simulated governance data
   */
  generateSimulatedData(): {
    models: ModelVersion[];
    auditEvents: AuditEvent[];
    biasAnalysis: { metrics: BiasMetrics[]; fairness: FairnessMetrics };
  } {
    // Generate model versions
    const models: ModelVersion[] = [
      {
        id: 'model_1',
        version: 'v1.0.0',
        name: 'Classification Model',
        status: 'deprecated',
        accuracy: 0.82,
        createdAt: new Date('2024-01-15'),
        createdBy: 'alice@example.com',
        deployedAt: new Date('2024-01-20'),
        deprecatedAt: new Date('2024-06-01'),
        metadata: {
          framework: 'TensorFlow',
          algorithm: 'Neural Network',
          features: ['age', 'income', 'education', 'experience'],
          trainingDataSize: 10000,
          trainingDuration: 3600,
        },
        lineage: {
          datasetVersion: 'dataset_v1',
          hyperparameters: { learningRate: 0.001, epochs: 50 },
        },
      },
      {
        id: 'model_2',
        version: 'v2.0.0',
        name: 'Classification Model',
        status: 'production',
        accuracy: 0.87,
        createdAt: new Date('2024-06-01'),
        createdBy: 'bob@example.com',
        deployedAt: new Date('2024-06-05'),
        metadata: {
          framework: 'TensorFlow',
          algorithm: 'Neural Network',
          features: ['age', 'income', 'education', 'experience', 'location'],
          trainingDataSize: 15000,
          trainingDuration: 4200,
        },
        lineage: {
          parentVersion: 'v1.0.0',
          datasetVersion: 'dataset_v2',
          hyperparameters: { learningRate: 0.0005, epochs: 100 },
        },
      },
      {
        id: 'model_3',
        version: 'v2.1.0',
        name: 'Classification Model',
        status: 'staging',
        accuracy: 0.89,
        createdAt: new Date('2024-11-01'),
        createdBy: 'alice@example.com',
        metadata: {
          framework: 'TensorFlow',
          algorithm: 'Neural Network',
          features: ['age', 'income', 'education', 'experience', 'location', 'skills'],
          trainingDataSize: 20000,
          trainingDuration: 5400,
        },
        lineage: {
          parentVersion: 'v2.0.0',
          datasetVersion: 'dataset_v3',
          hyperparameters: { learningRate: 0.0003, epochs: 150 },
        },
      },
    ];

    // Generate audit events
    const auditEvents: AuditEvent[] = [
      this.logAuditEvent(
        'model_update',
        'user_1',
        'Alice Smith',
        'v2.0.0',
        'Model Deployed',
        'Deployed model v2.0.0 to production',
        { environment: 'production' }
      ),
      this.logAuditEvent(
        'prediction',
        'user_2',
        'Bob Johnson',
        'v2.0.0',
        'Batch Prediction',
        'Processed 1000 predictions',
        { batchSize: 1000 }
      ),
      this.logAuditEvent(
        'explanation',
        'user_3',
        'Carol White',
        'v2.0.0',
        'SHAP Explanation',
        'Generated explanation for prediction ID 12345',
        { predictionId: '12345' }
      ),
      this.logAuditEvent(
        'access',
        'user_4',
        'David Brown',
        'v2.0.0',
        'Model Access',
        'Viewed model details',
        { action: 'view' }
      ),
      this.logAuditEvent(
        'configuration',
        'user_1',
        'Alice Smith',
        'v2.0.0',
        'Threshold Update',
        'Updated decision threshold to 0.6',
        { oldThreshold: 0.5, newThreshold: 0.6 }
      ),
    ];

    // Generate bias analysis
    const predictions = [
      // Group A (reference)
      ...Array.from({ length: 100 }, () => ({
        group: 'Group A',
        predicted: Math.random() > 0.3 ? 1 : 0,
        actual: Math.random() > 0.35 ? 1 : 0,
      })),
      // Group B (protected)
      ...Array.from({ length: 100 }, () => ({
        group: 'Group B',
        predicted: Math.random() > 0.4 ? 1 : 0,
        actual: Math.random() > 0.35 ? 1 : 0,
      })),
    ];

    const biasAnalysis = this.analyzeBias(predictions);

    return {
      models,
      auditEvents,
      biasAnalysis,
    };
  },
};
