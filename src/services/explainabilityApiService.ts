export interface SHAPValue {
  featureName: string;
  shapValue: number;
  featureValue: number | string;
  baseValue: number;
}

export interface FeatureImportanceScore {
  featureName: string;
  importance: number;
  rank: number;
}

export interface CounterfactualExplanation {
  originalPrediction: number;
  targetPrediction: number;
  changes: Array<{
    feature: string;
    originalValue: number | string;
    suggestedValue: number | string;
    changeReason: string;
  }>;
  confidence: number;
}

export interface APIRequest {
  endpoint: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST';
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestExample: any;
  responseExample: any;
  rateLimit: string;
}

export const explainabilityApiService = {
  /**
   * Generate SHAP values for a prediction
   */
  generateSHAPValues(
    features: Record<string, number | string>,
    modelId: string = 'default'
  ): SHAPValue[] {
    const featureNames = Object.keys(features);
    const baseValue = 0.5; // Base prediction value
    
    return featureNames.map(name => {
      const value = features[name];
      // Simulate SHAP value calculation
      const shapValue = typeof value === 'number' 
        ? (value - 50) * 0.01 * (Math.random() - 0.5)
        : (Math.random() - 0.5) * 0.2;
      
      return {
        featureName: name,
        shapValue,
        featureValue: value,
        baseValue,
      };
    }).sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
  },

  /**
   * Calculate global feature importance
   */
  calculateFeatureImportance(
    featureNames: string[]
  ): FeatureImportanceScore[] {
    return featureNames
      .map(name => ({
        featureName: name,
        importance: Math.random(),
        rank: 0,
      }))
      .sort((a, b) => b.importance - a.importance)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  },

  /**
   * Generate counterfactual explanation
   */
  generateCounterfactual(
    features: Record<string, number | string>,
    currentPrediction: number,
    targetPrediction: number
  ): CounterfactualExplanation {
    const featureNames = Object.keys(features);
    const numChanges = Math.min(3, featureNames.length);
    
    // Select random features to change
    const selectedFeatures = featureNames
      .sort(() => Math.random() - 0.5)
      .slice(0, numChanges);
    
    const changes = selectedFeatures.map(feature => {
      const originalValue = features[feature];
      let suggestedValue: number | string;
      let changeReason: string;
      
      if (typeof originalValue === 'number') {
        const direction = targetPrediction > currentPrediction ? 1 : -1;
        suggestedValue = originalValue + (direction * originalValue * 0.2);
        changeReason = direction > 0 
          ? `Increase ${feature} to boost prediction`
          : `Decrease ${feature} to lower prediction`;
      } else {
        suggestedValue = 'Alternative_' + originalValue;
        changeReason = `Change ${feature} category`;
      }
      
      return {
        feature,
        originalValue,
        suggestedValue,
        changeReason,
      };
    });
    
    return {
      originalPrediction: currentPrediction,
      targetPrediction,
      changes,
      confidence: 0.7 + Math.random() * 0.2,
    };
  },

  /**
   * Simulate API call to SHAP endpoint
   */
  async callSHAPEndpoint(
    features: Record<string, number | string>,
    modelId: string = 'default'
  ): Promise<APIResponse<{ shapValues: SHAPValue[] }>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const shapValues = this.generateSHAPValues(features, modelId);
    
    return {
      success: true,
      data: { shapValues },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    };
  },

  /**
   * Simulate API call to feature importance endpoint
   */
  async callFeatureImportanceEndpoint(
    modelId: string = 'default'
  ): Promise<APIResponse<{ featureImportance: FeatureImportanceScore[] }>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const sampleFeatures = ['age', 'income', 'experience', 'education', 'hours_worked'];
    const featureImportance = this.calculateFeatureImportance(sampleFeatures);
    
    return {
      success: true,
      data: { featureImportance },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    };
  },

  /**
   * Simulate API call to counterfactual endpoint
   */
  async callCounterfactualEndpoint(
    features: Record<string, number | string>,
    targetPrediction: number,
    modelId: string = 'default'
  ): Promise<APIResponse<{ counterfactual: CounterfactualExplanation }>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const currentPrediction = 0.3 + Math.random() * 0.4;
    const counterfactual = this.generateCounterfactual(
      features,
      currentPrediction,
      targetPrediction
    );
    
    return {
      success: true,
      data: { counterfactual },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    };
  },

  /**
   * Batch processing for multiple predictions
   */
  async callBatchExplainEndpoint(
    instances: Array<Record<string, number | string>>,
    modelId: string = 'default'
  ): Promise<APIResponse<{ results: Array<{ shapValues: SHAPValue[] }> }>> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const results = instances.map(features => ({
      shapValues: this.generateSHAPValues(features, modelId),
    }));
    
    return {
      success: true,
      data: { results },
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
    };
  },

  /**
   * Get API documentation
   */
  getAPIDocumentation(): APIEndpoint[] {
    return [
      {
        path: '/api/v1/explain/shap',
        method: 'POST',
        description: 'Get SHAP values for a single prediction',
        parameters: [
          {
            name: 'features',
            type: 'object',
            required: true,
            description: 'Feature values for the instance to explain',
          },
          {
            name: 'model_id',
            type: 'string',
            required: false,
            description: 'Model identifier (default: "default")',
          },
        ],
        requestExample: {
          features: {
            age: 35,
            income: 75000,
            experience: 10,
            education: 16,
          },
          model_id: 'my_model_v1',
        },
        responseExample: {
          success: true,
          data: {
            shapValues: [
              {
                featureName: 'income',
                shapValue: 0.15,
                featureValue: 75000,
                baseValue: 0.5,
              },
              {
                featureName: 'experience',
                shapValue: 0.08,
                featureValue: 10,
                baseValue: 0.5,
              },
            ],
          },
          timestamp: '2024-01-15T10:30:00Z',
          requestId: 'req_abc123',
        },
        rateLimit: '100 requests per minute',
      },
      {
        path: '/api/v1/explain/importance',
        method: 'GET',
        description: 'Get global feature importance for the model',
        parameters: [
          {
            name: 'model_id',
            type: 'string',
            required: false,
            description: 'Model identifier (default: "default")',
          },
        ],
        requestExample: {
          model_id: 'my_model_v1',
        },
        responseExample: {
          success: true,
          data: {
            featureImportance: [
              {
                featureName: 'income',
                importance: 0.35,
                rank: 1,
              },
              {
                featureName: 'experience',
                importance: 0.28,
                rank: 2,
              },
            ],
          },
          timestamp: '2024-01-15T10:30:00Z',
          requestId: 'req_def456',
        },
        rateLimit: '200 requests per minute',
      },
      {
        path: '/api/v1/explain/counterfactual',
        method: 'POST',
        description: 'Generate counterfactual explanation (what-if scenario)',
        parameters: [
          {
            name: 'features',
            type: 'object',
            required: true,
            description: 'Current feature values',
          },
          {
            name: 'target_prediction',
            type: 'number',
            required: true,
            description: 'Desired prediction value (0-1)',
          },
          {
            name: 'model_id',
            type: 'string',
            required: false,
            description: 'Model identifier (default: "default")',
          },
        ],
        requestExample: {
          features: {
            age: 35,
            income: 75000,
            experience: 10,
          },
          target_prediction: 0.8,
          model_id: 'my_model_v1',
        },
        responseExample: {
          success: true,
          data: {
            counterfactual: {
              originalPrediction: 0.45,
              targetPrediction: 0.8,
              changes: [
                {
                  feature: 'income',
                  originalValue: 75000,
                  suggestedValue: 90000,
                  changeReason: 'Increase income to boost prediction',
                },
              ],
              confidence: 0.85,
            },
          },
          timestamp: '2024-01-15T10:30:00Z',
          requestId: 'req_ghi789',
        },
        rateLimit: '50 requests per minute',
      },
      {
        path: '/api/v1/explain/batch',
        method: 'POST',
        description: 'Batch explain multiple instances',
        parameters: [
          {
            name: 'instances',
            type: 'array',
            required: true,
            description: 'Array of feature objects to explain',
          },
          {
            name: 'model_id',
            type: 'string',
            required: false,
            description: 'Model identifier (default: "default")',
          },
        ],
        requestExample: {
          instances: [
            { age: 35, income: 75000 },
            { age: 42, income: 95000 },
          ],
          model_id: 'my_model_v1',
        },
        responseExample: {
          success: true,
          data: {
            results: [
              {
                shapValues: [
                  { featureName: 'income', shapValue: 0.15 },
                ],
              },
            ],
          },
          timestamp: '2024-01-15T10:30:00Z',
          requestId: 'req_jkl012',
        },
        rateLimit: '20 requests per minute',
      },
    ];
  },

  /**
   * Get authentication documentation
   */
  getAuthDocumentation(): {
    method: string;
    description: string;
    example: string;
  } {
    return {
      method: 'API Key',
      description: 'Include your API key in the Authorization header',
      example: 'Authorization: Bearer your_api_key_here',
    };
  },

  /**
   * Get rate limiting information
   */
  getRateLimitInfo(): {
    limits: Record<string, string>;
    headers: string[];
    errorResponse: any;
  } {
    return {
      limits: {
        '/api/v1/explain/shap': '100 requests per minute',
        '/api/v1/explain/importance': '200 requests per minute',
        '/api/v1/explain/counterfactual': '50 requests per minute',
        '/api/v1/explain/batch': '20 requests per minute',
      },
      headers: [
        'X-RateLimit-Limit: 100',
        'X-RateLimit-Remaining: 95',
        'X-RateLimit-Reset: 1642248600',
      ],
      errorResponse: {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        timestamp: '2024-01-15T10:30:00Z',
        requestId: 'req_error123',
      },
    };
  },

  /**
   * Get best practices
   */
  getBestPractices(): string[] {
    return [
      'Cache SHAP values for frequently queried instances to reduce API calls',
      'Use batch endpoint for explaining multiple instances efficiently',
      'Monitor rate limits using response headers',
      'Implement exponential backoff for rate limit errors',
      'Store feature importance globally and refresh periodically',
      'Use counterfactual explanations sparingly (computationally expensive)',
      'Include model_id to explain different model versions',
      'Validate feature values before sending to API',
    ];
  },

  /**
   * Get code examples
   */
  getCodeExamples(): Record<string, string> {
    return {
      python: `import requests

# SHAP values endpoint
url = "https://api.modelmentor.com/v1/explain/shap"
headers = {
    "Authorization": "Bearer your_api_key",
    "Content-Type": "application/json"
}
data = {
    "features": {
        "age": 35,
        "income": 75000,
        "experience": 10
    },
    "model_id": "my_model_v1"
}

response = requests.post(url, headers=headers, json=data)
shap_values = response.json()["data"]["shapValues"]

for value in shap_values:
    print(f"{value['featureName']}: {value['shapValue']}")`,
      
      javascript: `// SHAP values endpoint
const url = "https://api.modelmentor.com/v1/explain/shap";
const headers = {
  "Authorization": "Bearer your_api_key",
  "Content-Type": "application/json"
};
const data = {
  features: {
    age: 35,
    income: 75000,
    experience: 10
  },
  model_id: "my_model_v1"
};

const response = await fetch(url, {
  method: "POST",
  headers: headers,
  body: JSON.stringify(data)
});

const result = await response.json();
const shapValues = result.data.shapValues;

shapValues.forEach(value => {
  console.log(\`\${value.featureName}: \${value.shapValue}\`);
});`,
      
      curl: `# SHAP values endpoint
curl -X POST https://api.modelmentor.com/v1/explain/shap \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "features": {
      "age": 35,
      "income": 75000,
      "experience": 10
    },
    "model_id": "my_model_v1"
  }'`,
    };
  },

  /**
   * Generate request ID
   */
  generateRequestId(): string {
    return 'req_' + Math.random().toString(36).substring(2, 15);
  },
};
