// Session management utilities
export const sessionUtils = {
  getSessionId(): string {
    let sessionId = localStorage.getItem('ml_session_id');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('ml_session_id', sessionId);
    }
    
    return sessionId;
  },

  clearSession(): void {
    localStorage.removeItem('ml_session_id');
  }
};

// Training simulation utilities
export const trainingSimulation = {
  generateMetrics(epoch: number, totalEpochs: number, modelType: string): { accuracy: number; loss: number } {
    const progress = epoch / totalEpochs;
    
    // Simulate realistic training curves
    const baseAccuracy = 0.5;
    const maxAccuracy = 0.85 + Math.random() * 0.1;
    const accuracy = baseAccuracy + (maxAccuracy - baseAccuracy) * (1 - Math.exp(-3 * progress));
    
    const baseLoss = 2.0;
    const minLoss = 0.2 + Math.random() * 0.1;
    const loss = baseLoss * Math.exp(-2 * progress) + minLoss;
    
    return {
      accuracy: Number.parseFloat(accuracy.toFixed(4)),
      loss: Number.parseFloat(loss.toFixed(6))
    };
  },

  generateConfusionMatrix(labels: string[], accuracy: number): number[][] {
    const size = labels.length;
    const matrix: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    
    const samplesPerClass = 20;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i === j) {
          matrix[i][j] = Math.floor(samplesPerClass * accuracy);
        } else {
          matrix[i][j] = Math.floor(samplesPerClass * (1 - accuracy) / (size - 1));
        }
      }
    }
    
    return matrix;
  },

  generatePrediction(modelType: string, accuracy: number): { prediction: string; confidence: number } {
    const isCorrect = Math.random() < accuracy;
    const confidence = isCorrect 
      ? 0.7 + Math.random() * 0.3 
      : 0.3 + Math.random() * 0.4;
    
    return {
      prediction: isCorrect ? 'Correct Class' : 'Incorrect Class',
      confidence: Number.parseFloat(confidence.toFixed(2))
    };
  }
};
