export type DeploymentPlatform = 'web' | 'mobile' | 'server-python' | 'server-node';

export interface DeploymentCode {
  platform: DeploymentPlatform;
  title: string;
  description: string;
  exportCode: string;
  deploymentCode: string;
  monitoringCode: string;
  dependencies: string[];
}

export const modelDeploymentService = {
  /**
   * Get deployment code for a specific platform
   */
  getDeploymentCode(platform: DeploymentPlatform, modelName: string = 'my_model'): DeploymentCode {
    switch (platform) {
      case 'web':
        return this.getWebDeployment(modelName);
      case 'mobile':
        return this.getMobileDeployment(modelName);
      case 'server-python':
        return this.getPythonDeployment(modelName);
      case 'server-node':
        return this.getNodeDeployment(modelName);
      default:
        return this.getWebDeployment(modelName);
    }
  },

  /**
   * Web deployment (TensorFlow.js)
   */
  getWebDeployment(modelName: string): DeploymentCode {
    return {
      platform: 'web',
      title: 'Web Deployment (TensorFlow.js)',
      description: 'Deploy your model directly in the browser using TensorFlow.js for real-time predictions',
      exportCode: `// Export model for TensorFlow.js
import * as tf from '@tensorflow/tfjs';

// Save model
await model.save('downloads://${modelName}');

// This will download two files:
// - ${modelName}.json (model architecture)
// - ${modelName}.weights.bin (model weights)`,
      deploymentCode: `// Load and use model in browser
import * as tf from '@tensorflow/tfjs';

// Load the model
const model = await tf.loadLayersModel('/models/${modelName}/model.json');

// Make predictions
async function predict(inputData) {
  // Prepare input tensor
  const inputTensor = tf.tensor2d([inputData]);
  
  // Make prediction
  const prediction = model.predict(inputTensor);
  const result = await prediction.data();
  
  // Clean up tensors
  inputTensor.dispose();
  prediction.dispose();
  
  return result;
}

// Example usage
const input = [1.2, 3.4, 5.6, 7.8];
const result = await predict(input);
console.log('Prediction:', result);`,
      monitoringCode: `// Monitor model performance
class ModelMonitor {
  constructor() {
    this.predictions = [];
    this.errors = [];
  }
  
  async trackPrediction(input, prediction, actualValue = null) {
    const record = {
      timestamp: new Date().toISOString(),
      input,
      prediction,
      actualValue,
      latency: 0
    };
    
    this.predictions.push(record);
    
    // Send to analytics
    if (window.gtag) {
      gtag('event', 'model_prediction', {
        model_name: '${modelName}',
        prediction_value: prediction
      });
    }
    
    // Check for drift
    if (this.predictions.length > 100) {
      this.checkDataDrift();
    }
  }
  
  checkDataDrift() {
    // Simple drift detection
    const recent = this.predictions.slice(-50);
    const older = this.predictions.slice(-100, -50);
    
    const recentMean = recent.reduce((sum, p) => sum + p.prediction, 0) / recent.length;
    const olderMean = older.reduce((sum, p) => sum + p.prediction, 0) / older.length;
    
    const drift = Math.abs(recentMean - olderMean) / olderMean;
    
    if (drift > 0.2) {
      console.warn('Data drift detected:', drift);
      // Alert or retrain
    }
  }
}

const monitor = new ModelMonitor();
await monitor.trackPrediction(input, result);`,
      dependencies: [
        '@tensorflow/tfjs',
        '@tensorflow/tfjs-vis (optional, for visualization)',
      ],
    };
  },

  /**
   * Mobile deployment (TensorFlow Lite)
   */
  getMobileDeployment(modelName: string): DeploymentCode {
    return {
      platform: 'mobile',
      title: 'Mobile Deployment (TensorFlow Lite)',
      description: 'Deploy your model on iOS and Android devices using TensorFlow Lite for on-device inference',
      exportCode: `# Export model for TensorFlow Lite
import tensorflow as tf

# Convert to TensorFlow Lite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

# Save the model
with open('${modelName}.tflite', 'wb') as f:
    f.write(tflite_model)`,
      deploymentCode: `// Android (Kotlin)
import org.tensorflow.lite.Interpreter
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import java.io.FileInputStream

class ModelPredictor(private val context: Context) {
    private var interpreter: Interpreter? = null
    
    init {
        val model = loadModelFile("${modelName}.tflite")
        interpreter = Interpreter(model)
    }
    
    private fun loadModelFile(filename: String): MappedByteBuffer {
        val fileDescriptor = context.assets.openFd(filename)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }
    
    fun predict(input: FloatArray): FloatArray {
        val output = Array(1) { FloatArray(10) }
        interpreter?.run(input, output)
        return output[0]
    }
    
    fun close() {
        interpreter?.close()
    }
}

// iOS (Swift)
import TensorFlowLite

class ModelPredictor {
    private var interpreter: Interpreter?
    
    init() {
        guard let modelPath = Bundle.main.path(forResource: "${modelName}", ofType: "tflite") else {
            return
        }
        
        do {
            interpreter = try Interpreter(modelPath: modelPath)
            try interpreter?.allocateTensors()
        } catch {
            print("Failed to create interpreter: \\(error)")
        }
    }
    
    func predict(input: [Float]) -> [Float]? {
        guard let interpreter = interpreter else { return nil }
        
        do {
            let inputData = Data(copyingBufferOf: input)
            try interpreter.copy(inputData, toInputAt: 0)
            try interpreter.invoke()
            
            let outputTensor = try interpreter.output(at: 0)
            let results = [Float](unsafeData: outputTensor.data) ?? []
            return results
        } catch {
            print("Failed to invoke interpreter: \\(error)")
            return nil
        }
    }
}`,
      monitoringCode: `// Mobile monitoring (Android)
class ModelMonitor {
    private val predictions = mutableListOf<PredictionRecord>()
    
    data class PredictionRecord(
        val timestamp: Long,
        val input: FloatArray,
        val output: FloatArray,
        val latency: Long
    )
    
    fun trackPrediction(input: FloatArray, output: FloatArray, latency: Long) {
        val record = PredictionRecord(
            timestamp = System.currentTimeMillis(),
            input = input,
            output = output,
            latency = latency
        )
        predictions.add(record)
        
        // Log to Firebase Analytics
        FirebaseAnalytics.getInstance(context).logEvent("model_prediction") {
            param("model_name", "${modelName}")
            param("latency_ms", latency)
        }
        
        // Check performance
        if (predictions.size > 100) {
            checkPerformance()
        }
    }
    
    private fun checkPerformance() {
        val avgLatency = predictions.takeLast(100).map { it.latency }.average()
        if (avgLatency > 100) { // 100ms threshold
            Log.w("ModelMonitor", "High latency detected: \${avgLatency}ms")
        }
    }
}`,
      dependencies: [
        'org.tensorflow:tensorflow-lite:2.13.0 (Android)',
        'TensorFlowLiteSwift (iOS)',
        'Firebase Analytics (optional)',
      ],
    };
  },

  /**
   * Python server deployment
   */
  getPythonDeployment(modelName: string): DeploymentCode {
    return {
      platform: 'server-python',
      title: 'Server Deployment (Python/Flask)',
      description: 'Deploy your model as a REST API using Python and Flask for server-side predictions',
      exportCode: `# Save model for Python
model.save('${modelName}.h5')  # Keras format
# or
model.save('${modelName}')  # SavedModel format`,
      deploymentCode: `# Flask API server
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import logging

app = Flask(__name__)
CORS(app)

# Load model
model = tf.keras.models.load_model('${modelName}.h5')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get input data
        data = request.get_json()
        input_data = np.array(data['input']).reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(input_data)
        result = prediction.tolist()
        
        logger.info(f"Prediction made: {result}")
        
        return jsonify({
            'success': True,
            'prediction': result,
            'model_version': '1.0'
        })
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model': '${modelName}',
        'version': '1.0'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)`,
      monitoringCode: `# Production monitoring with Prometheus
from prometheus_client import Counter, Histogram, generate_latest
from flask import Response
import time

# Metrics
prediction_counter = Counter('model_predictions_total', 'Total predictions')
prediction_latency = Histogram('model_prediction_latency_seconds', 'Prediction latency')
prediction_errors = Counter('model_prediction_errors_total', 'Prediction errors')

@app.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()
    
    try:
        data = request.get_json()
        input_data = np.array(data['input']).reshape(1, -1)
        
        prediction = model.predict(input_data)
        result = prediction.tolist()
        
        # Track metrics
        prediction_counter.inc()
        prediction_latency.observe(time.time() - start_time)
        
        return jsonify({
            'success': True,
            'prediction': result
        })
    except Exception as e:
        prediction_errors.inc()
        logger.error(f"Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype='text/plain')

# Data drift detection
class DriftDetector:
    def __init__(self, window_size=1000):
        self.predictions = []
        self.window_size = window_size
    
    def add_prediction(self, prediction):
        self.predictions.append(prediction)
        if len(self.predictions) > self.window_size:
            self.predictions.pop(0)
    
    def check_drift(self):
        if len(self.predictions) < self.window_size:
            return False
        
        recent = self.predictions[-100:]
        older = self.predictions[-200:-100]
        
        recent_mean = np.mean(recent)
        older_mean = np.mean(older)
        
        drift = abs(recent_mean - older_mean) / older_mean
        
        if drift > 0.2:
            logger.warning(f"Data drift detected: {drift:.2%}")
            return True
        return False

drift_detector = DriftDetector()`,
      dependencies: [
        'flask',
        'flask-cors',
        'tensorflow',
        'numpy',
        'prometheus-client (for monitoring)',
        'gunicorn (for production)',
      ],
    };
  },

  /**
   * Node.js server deployment
   */
  getNodeDeployment(modelName: string): DeploymentCode {
    return {
      platform: 'server-node',
      title: 'Server Deployment (Node.js/Express)',
      description: 'Deploy your model as a REST API using Node.js and TensorFlow.js for server-side predictions',
      exportCode: `// Export model for Node.js
await model.save('file://./${modelName}');

// This creates a directory with:
// - model.json
// - weights.bin`,
      deploymentCode: `// Express API server
const express = require('express');
const tf = require('@tensorflow/tfjs-node');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let model;

// Load model on startup
async function loadModel() {
  model = await tf.loadLayersModel('file://./${modelName}/model.json');
  console.log('Model loaded successfully');
}

// Prediction endpoint
app.post('/predict', async (req, res) => {
  try {
    const { input } = req.body;
    
    // Create tensor
    const inputTensor = tf.tensor2d([input]);
    
    // Make prediction
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();
    
    // Clean up
    inputTensor.dispose();
    prediction.dispose();
    
    res.json({
      success: true,
      prediction: Array.from(result),
      modelVersion: '1.0'
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    model: '${modelName}',
    version: '1.0'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
loadModel().then(() => {
  app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
  });
});`,
      monitoringCode: `// Monitoring with Winston and custom metrics
const winston = require('winston');
const promClient = require('prom-client');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Prometheus metrics
const register = new promClient.Registry();
const predictionCounter = new promClient.Counter({
  name: 'model_predictions_total',
  help: 'Total number of predictions',
  registers: [register]
});

const predictionLatency = new promClient.Histogram({
  name: 'model_prediction_latency_seconds',
  help: 'Prediction latency in seconds',
  registers: [register]
});

// Enhanced prediction endpoint with monitoring
app.post('/predict', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { input } = req.body;
    
    const inputTensor = tf.tensor2d([input]);
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();
    
    inputTensor.dispose();
    prediction.dispose();
    
    // Track metrics
    predictionCounter.inc();
    predictionLatency.observe((Date.now() - startTime) / 1000);
    
    logger.info('Prediction successful', {
      latency: Date.now() - startTime,
      input: input.slice(0, 3) // Log first 3 values only
    });
    
    res.json({
      success: true,
      prediction: Array.from(result)
    });
  } catch (error) {
    logger.error('Prediction failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Data drift detection
class DriftMonitor {
  constructor() {
    this.predictions = [];
    this.maxSize = 1000;
  }
  
  addPrediction(value) {
    this.predictions.push(value);
    if (this.predictions.length > this.maxSize) {
      this.predictions.shift();
    }
  }
  
  checkDrift() {
    if (this.predictions.length < 200) return false;
    
    const recent = this.predictions.slice(-100);
    const older = this.predictions.slice(-200, -100);
    
    const recentMean = recent.reduce((a, b) => a + b) / recent.length;
    const olderMean = older.reduce((a, b) => a + b) / older.length;
    
    const drift = Math.abs(recentMean - olderMean) / olderMean;
    
    if (drift > 0.2) {
      logger.warn('Data drift detected', { drift });
      return true;
    }
    return false;
  }
}

const driftMonitor = new DriftMonitor();`,
      dependencies: [
        'express',
        'cors',
        '@tensorflow/tfjs-node',
        'winston (for logging)',
        'prom-client (for metrics)',
      ],
    };
  },

  /**
   * Get production best practices
   */
  getBestPractices(): string[] {
    return [
      'Version your models: Use semantic versioning (v1.0.0) and track changes',
      'Implement health checks: Add /health endpoint to monitor service status',
      'Add request validation: Validate input data before making predictions',
      'Set up logging: Log all predictions, errors, and performance metrics',
      'Monitor latency: Track prediction time and alert if it exceeds thresholds',
      'Implement rate limiting: Protect your API from abuse and overload',
      'Use HTTPS: Always encrypt data in transit for production deployments',
      'Add authentication: Secure your API with API keys or OAuth',
      'Monitor data drift: Detect when input data distribution changes',
      'Set up alerts: Get notified when errors spike or performance degrades',
      'Implement A/B testing: Test new model versions before full rollout',
      'Plan for rollback: Keep previous model versions for quick rollback',
      'Document your API: Provide clear documentation for API consumers',
      'Test thoroughly: Unit test, integration test, and load test before deploying',
      'Use containerization: Deploy with Docker for consistency across environments',
    ];
  },

  /**
   * Get production checklist
   */
  getProductionChecklist(): Array<{ category: string; items: string[] }> {
    return [
      {
        category: 'Pre-Deployment',
        items: [
          'Model is trained and validated with good performance',
          'Model is exported in the correct format for target platform',
          'API endpoints are defined and documented',
          'Input validation is implemented',
          'Error handling is comprehensive',
        ],
      },
      {
        category: 'Monitoring',
        items: [
          'Logging is configured and working',
          'Performance metrics are being tracked',
          'Health check endpoint is implemented',
          'Alerting is set up for critical issues',
          'Data drift detection is in place',
        ],
      },
      {
        category: 'Security',
        items: [
          'HTTPS is enabled',
          'Authentication is implemented',
          'Rate limiting is configured',
          'Input sanitization is in place',
          'Sensitive data is not logged',
        ],
      },
      {
        category: 'Scalability',
        items: [
          'Load testing has been performed',
          'Auto-scaling is configured (if needed)',
          'Caching strategy is implemented',
          'Database connections are pooled',
          'Resource limits are set',
        ],
      },
      {
        category: 'Maintenance',
        items: [
          'Model versioning is in place',
          'Rollback procedure is documented',
          'Backup strategy is defined',
          'Update process is documented',
          'Team is trained on operations',
        ],
      },
    ];
  },
};
