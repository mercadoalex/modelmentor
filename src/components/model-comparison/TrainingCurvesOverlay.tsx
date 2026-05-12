import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { TrainingCurvesOverlayProps, TrainingCurveData } from '@/types/comparison';

// Color palette for distinct model colors
const MODEL_COLORS = [
  { train: 'rgba(54, 162, 235, 1)', val: 'rgba(54, 162, 235, 0.6)' },
  { train: 'rgba(255, 99, 132, 1)', val: 'rgba(255, 99, 132, 0.6)' },
  { train: 'rgba(75, 192, 192, 1)', val: 'rgba(75, 192, 192, 0.6)' },
  { train: 'rgba(255, 206, 86, 1)', val: 'rgba(255, 206, 86, 0.6)' },
  { train: 'rgba(153, 102, 255, 1)', val: 'rgba(153, 102, 255, 0.6)' },
  { train: 'rgba(255, 159, 64, 1)', val: 'rgba(255, 159, 64, 0.6)' },
  { train: 'rgba(46, 204, 113, 1)', val: 'rgba(46, 204, 113, 0.6)' },
  { train: 'rgba(231, 76, 60, 1)', val: 'rgba(231, 76, 60, 0.6)' },
  { train: 'rgba(52, 73, 94, 1)', val: 'rgba(52, 73, 94, 0.6)' },
  { train: 'rgba(155, 89, 182, 1)', val: 'rgba(155, 89, 182, 0.6)' },
];

/**
 * Loading skeleton for training curves
 */
function TrainingCurvesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded" />
      <div className="h-64 bg-gray-200 rounded" />
      <div className="h-6 w-48 bg-gray-200 rounded mt-8" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  );
}

/**
 * Error display with retry button
 */
function TrainingCurvesError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * TrainingCurvesOverlay
 * - Displays overlayed training/validation loss and accuracy curves for selected models
 * - Interactive legend to toggle models on/off
 * - Accepts data via props from parent dashboard
 */
export function TrainingCurvesOverlay({
  modelIds,
  data,
  loading = false,
  error,
  onRetry,
}: TrainingCurvesOverlayProps) {
  // Show loading skeleton
  if (loading) {
    return <TrainingCurvesSkeleton />;
  }

  // Show error state
  if (error) {
    return <TrainingCurvesError message={error.message} onRetry={onRetry} />;
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No training curve data available for the selected models.
      </div>
    );
  }

  // Filter data to only include requested model IDs
  const curveData = data.filter(d => modelIds.includes(d.modelId));

  if (curveData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No training curve data available for the selected models.
      </div>
    );
  }

  // Find the maximum number of epochs across all models
  const maxEpochs = Math.max(...curveData.map(d => d.epochs.length));
  const epochLabels = Array.from({ length: maxEpochs }, (_, i) => i + 1);

  // Prepare chart data for loss overlay
  const lossChartData = {
    labels: epochLabels,
    datasets: curveData.flatMap((model, index) => {
      const colorIndex = index % MODEL_COLORS.length;
      return [
        {
          label: `${model.modelName} - Train Loss`,
          data: model.trainLoss,
          borderColor: MODEL_COLORS[colorIndex].train,
          backgroundColor: MODEL_COLORS[colorIndex].train.replace('1)', '0.1)'),
          borderDash: [],
          fill: false,
          tension: 0.1,
        },
        {
          label: `${model.modelName} - Val Loss`,
          data: model.valLoss,
          borderColor: MODEL_COLORS[colorIndex].val,
          backgroundColor: MODEL_COLORS[colorIndex].val.replace('0.6)', '0.1)'),
          borderDash: [5, 5],
          fill: false,
          tension: 0.1,
        },
      ];
    }),
  };

  // Prepare chart data for accuracy overlay
  const accChartData = {
    labels: epochLabels,
    datasets: curveData.flatMap((model, index) => {
      const colorIndex = index % MODEL_COLORS.length;
      return [
        {
          label: `${model.modelName} - Train Acc`,
          data: model.trainAcc,
          borderColor: MODEL_COLORS[colorIndex].train,
          backgroundColor: MODEL_COLORS[colorIndex].train.replace('1)', '0.1)'),
          borderDash: [],
          fill: false,
          tension: 0.1,
        },
        {
          label: `${model.modelName} - Val Acc`,
          data: model.valAcc,
          borderColor: MODEL_COLORS[colorIndex].val,
          backgroundColor: MODEL_COLORS[colorIndex].val.replace('0.6)', '0.1)'),
          borderDash: [5, 5],
          fill: false,
          tension: 0.1,
        },
      ];
    }),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Epoch',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Value',
        },
      },
    },
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Training & Validation Loss</h3>
      <Line data={lossChartData} options={chartOptions} />
      
      <h3 className="text-lg font-semibold mt-8 mb-2">Training & Validation Accuracy</h3>
      <Line data={accChartData} options={chartOptions} />
      
      <div className="text-xs text-muted-foreground mt-2">
        Interactive legend: click to show/hide curves for each model.
      </div>
    </div>
  );
}
