/**
 * ExportService - Service for exporting model comparison data
 * 
 * This service provides:
 * - PDF export (placeholder - coming soon)
 * - CSV export for metrics, hyperparameters, and predictions
 * - Chart image export (placeholder - coming soon)
 */

import type {
  ExportOptions,
  ExportResult,
  EfficiencyMetrics,
  HyperparameterData,
  PredictionData,
  TrainingCurveData,
  ConfusionMatrixData,
  LineageData,
  StatisticalTestResult,
} from '@/types/comparison';
import { comparisonService } from './comparisonService';

// ─────────────────────────────────────────────────────────────────────────────
// CSV Generation Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escape a value for CSV format
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // If the value contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert an array of objects to CSV string
 */
function arrayToCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCSVValue).join(',');
  const dataLines = rows.map(row => row.map(escapeCSVValue).join(','));
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Trigger a file download in the browser
 */
function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format training time from seconds to H:MM:SS
 */
function formatTrainingTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) {
    return 'N/A';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format model size to appropriate units
 */
function formatModelSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) {
    return 'N/A';
  }
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV Export Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate CSV for efficiency metrics
 */
function generateEfficiencyCSV(data: EfficiencyMetrics[], options: ExportOptions): string {
  const headers = ['Model Name', 'Training Time', 'Inference Time (ms)', 'Model Size', 'FLOPs'];
  const rows = data.map(m => [
    m.modelName,
    formatTrainingTime(m.trainingTimeSeconds),
    m.inferenceTimeMs !== null ? m.inferenceTimeMs.toFixed(3) : 'N/A',
    formatModelSize(m.modelSizeBytes),
    m.flops !== null ? m.flops.toString() : 'N/A',
  ]);
  
  // Add metadata header
  const metadata = [
    `# Model Comparison Export`,
    `# Date: ${options.comparisonDate}`,
    `# User: ${options.userName}`,
    `# Models: ${data.map(m => m.modelName).join(', ')}`,
    '',
  ].join('\n');
  
  return metadata + arrayToCSV(headers, rows);
}

/**
 * Generate CSV for hyperparameters
 */
function generateHyperparametersCSV(data: HyperparameterData[], options: ExportOptions): string {
  // Collect all unique custom parameter keys
  const customKeys = new Set<string>();
  data.forEach(m => {
    Object.keys(m.customParams || {}).forEach(key => customKeys.add(key));
  });
  
  const headers = ['Model Name', 'Learning Rate', 'Batch Size', 'Epochs', 'Optimizer', ...Array.from(customKeys)];
  const rows = data.map(m => [
    m.modelName,
    m.learningRate !== null ? m.learningRate.toString() : '—',
    m.batchSize !== null ? m.batchSize.toString() : '—',
    m.epochs !== null ? m.epochs.toString() : '—',
    m.optimizer || '—',
    ...Array.from(customKeys).map(key => {
      const value = m.customParams?.[key];
      return value !== undefined ? String(value) : '—';
    }),
  ]);
  
  // Add metadata header
  const metadata = [
    `# Model Comparison Export - Hyperparameters`,
    `# Date: ${options.comparisonDate}`,
    `# User: ${options.userName}`,
    `# Models: ${data.map(m => m.modelName).join(', ')}`,
    '',
  ].join('\n');
  
  return metadata + arrayToCSV(headers, rows);
}

/**
 * Generate CSV for predictions
 */
function generatePredictionsCSV(
  predictions: PredictionData[],
  modelNames: Map<string, string>,
  options: ExportOptions
): string {
  const modelIds = Array.from(modelNames.keys());
  const headers = ['Sample ID', 'True Label', ...modelIds.map(id => modelNames.get(id) || id), 'Ensemble Vote'];
  
  const rows = predictions.map(p => {
    // Calculate ensemble vote (majority)
    const votes: Record<string, number> = {};
    modelIds.forEach(id => {
      const pred = p.predictions[id];
      if (pred) {
        votes[pred] = (votes[pred] || 0) + 1;
      }
    });
    const maxVotes = Math.max(...Object.values(votes), 0);
    const winners = Object.entries(votes)
      .filter(([, count]) => count === maxVotes)
      .map(([label]) => label)
      .sort();
    const ensembleVote = winners[0] || '—';
    
    return [
      p.sampleId,
      p.trueLabel,
      ...modelIds.map(id => p.predictions[id] || '—'),
      ensembleVote,
    ];
  });
  
  // Add metadata header
  const metadata = [
    `# Model Comparison Export - Predictions`,
    `# Date: ${options.comparisonDate}`,
    `# User: ${options.userName}`,
    `# Total Samples: ${predictions.length}`,
    '',
  ].join('\n');
  
  return metadata + arrayToCSV(headers, rows);
}

/**
 * Generate CSV for training curves
 */
function generateTrainingCurvesCSV(data: TrainingCurveData[], options: ExportOptions): string {
  // Find max epochs across all models
  const maxEpochs = Math.max(...data.map(m => m.epochs.length), 0);
  
  // Build headers: Epoch, then for each model: Train Loss, Val Loss, Train Acc, Val Acc
  const headers = ['Epoch'];
  data.forEach(m => {
    headers.push(`${m.modelName} - Train Loss`);
    headers.push(`${m.modelName} - Val Loss`);
    headers.push(`${m.modelName} - Train Acc`);
    headers.push(`${m.modelName} - Val Acc`);
  });
  
  const rows: (string | number)[][] = [];
  for (let i = 0; i < maxEpochs; i++) {
    const row: (string | number)[] = [i + 1];
    data.forEach(m => {
      row.push(m.trainLoss[i] !== undefined ? m.trainLoss[i] : '');
      row.push(m.valLoss[i] !== undefined ? m.valLoss[i] : '');
      row.push(m.trainAcc[i] !== undefined ? m.trainAcc[i] : '');
      row.push(m.valAcc[i] !== undefined ? m.valAcc[i] : '');
    });
    rows.push(row);
  }
  
  // Add metadata header
  const metadata = [
    `# Model Comparison Export - Training Curves`,
    `# Date: ${options.comparisonDate}`,
    `# User: ${options.userName}`,
    `# Models: ${data.map(m => m.modelName).join(', ')}`,
    '',
  ].join('\n');
  
  return metadata + arrayToCSV(headers, rows);
}

/**
 * Generate CSV for lineage data
 */
function generateLineageCSV(data: LineageData[], options: ExportOptions): string {
  const headers = ['Model Name', 'Parent Model', 'Experiment ID', 'Created At', 'Created By', 'Notes'];
  const rows = data.map(m => [
    m.modelName,
    m.parentModelName || '—',
    m.experimentId || '—',
    m.createdAt ? new Date(m.createdAt).toLocaleString() : '—',
    m.createdBy || '—',
    m.notes || '—',
  ]);
  
  // Add metadata header
  const metadata = [
    `# Model Comparison Export - Model Lineage`,
    `# Date: ${options.comparisonDate}`,
    `# User: ${options.userName}`,
    `# Models: ${data.map(m => m.modelName).join(', ')}`,
    '',
  ].join('\n');
  
  return metadata + arrayToCSV(headers, rows);
}

// ─────────────────────────────────────────────────────────────────────────────
// ExportService Class
// ─────────────────────────────────────────────────────────────────────────────

class ExportServiceImpl {
  /**
   * Export comparison data to PDF
   * Note: This is a placeholder implementation. Full PDF export requires
   * a library like jsPDF or pdfmake.
   */
  async exportToPDF(options: ExportOptions): Promise<ExportResult> {
    // Placeholder implementation
    alert('PDF export coming soon! This feature will generate a comprehensive PDF report with all comparison tables and charts.');
    
    return {
      success: false,
      error: 'PDF export is not yet implemented. Coming soon!',
    };
  }

  /**
   * Export comparison data to CSV files
   * Generates separate CSV files for metrics, hyperparameters, and predictions
   */
  async exportToCSV(options: ExportOptions): Promise<ExportResult> {
    try {
      const { modelIds, includeMetrics, includeHyperparameters, includePredictions, includeLineage } = options;
      
      if (modelIds.length === 0) {
        return {
          success: false,
          error: 'No models selected for export',
        };
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filesGenerated: string[] = [];

      // Fetch and export efficiency metrics
      if (includeMetrics) {
        const efficiencyResult = await comparisonService.fetchEfficiencyMetrics(modelIds);
        if (efficiencyResult.data && efficiencyResult.data.length > 0) {
          const csv = generateEfficiencyCSV(efficiencyResult.data, options);
          downloadFile(csv, `model-comparison-metrics-${timestamp}.csv`, 'text/csv');
          filesGenerated.push('metrics');
        }

        // Also export training curves if available
        const curvesResult = await comparisonService.fetchTrainingCurves(modelIds);
        if (curvesResult.data && curvesResult.data.some(d => d.epochs.length > 0)) {
          const csv = generateTrainingCurvesCSV(curvesResult.data, options);
          downloadFile(csv, `model-comparison-training-curves-${timestamp}.csv`, 'text/csv');
          filesGenerated.push('training-curves');
        }
      }

      // Fetch and export hyperparameters
      if (includeHyperparameters) {
        const hyperparamsResult = await comparisonService.fetchHyperparameters(modelIds);
        if (hyperparamsResult.data && hyperparamsResult.data.length > 0) {
          const csv = generateHyperparametersCSV(hyperparamsResult.data, options);
          downloadFile(csv, `model-comparison-hyperparameters-${timestamp}.csv`, 'text/csv');
          filesGenerated.push('hyperparameters');
        }
      }

      // Fetch and export predictions
      if (includePredictions) {
        // Fetch all predictions (not paginated for export)
        const predictionsResult = await comparisonService.fetchPredictions(modelIds, 1, 10000);
        if (predictionsResult.data && predictionsResult.data.predictions.length > 0) {
          // Build model name map
          const efficiencyResult = await comparisonService.fetchEfficiencyMetrics(modelIds);
          const modelNames = new Map<string, string>();
          efficiencyResult.data?.forEach(m => modelNames.set(m.modelId, m.modelName));
          
          const csv = generatePredictionsCSV(predictionsResult.data.predictions, modelNames, options);
          downloadFile(csv, `model-comparison-predictions-${timestamp}.csv`, 'text/csv');
          filesGenerated.push('predictions');
        }
      }

      // Fetch and export lineage
      if (includeLineage) {
        const lineageResult = await comparisonService.fetchLineage(modelIds);
        if (lineageResult.data && lineageResult.data.length > 0) {
          const csv = generateLineageCSV(lineageResult.data, options);
          downloadFile(csv, `model-comparison-lineage-${timestamp}.csv`, 'text/csv');
          filesGenerated.push('lineage');
        }
      }

      if (filesGenerated.length === 0) {
        return {
          success: false,
          error: 'No data available to export',
        };
      }

      return {
        success: true,
        fileName: `model-comparison-${timestamp}.csv`,
      };
    } catch (error) {
      console.error('CSV export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export CSV',
      };
    }
  }

  /**
   * Export charts as PNG images
   * Note: This is a placeholder implementation. Full chart export requires
   * capturing chart elements using html2canvas or similar.
   */
  async exportCharts(chartRefs?: React.RefObject<HTMLElement>[]): Promise<ExportResult> {
    // Placeholder implementation
    alert('Chart export coming soon! This feature will generate PNG images of all comparison charts.');
    
    return {
      success: false,
      error: 'Chart export is not yet implemented. Coming soon!',
    };
  }
}

// Export singleton instance
export const exportService = new ExportServiceImpl();
