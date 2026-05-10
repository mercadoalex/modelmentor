import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

/**
 * Props for TrainingCurvesOverlay
 * @param modelIds - Array of selected model IDs to compare
 */
interface TrainingCurvesOverlayProps {
  modelIds: string[];
}

/**
 * TrainingCurvesOverlay
 * - Displays overlayed training/validation loss and accuracy curves for selected models
 * - Interactive legend to toggle models on/off
 */
export function TrainingCurvesOverlay({ modelIds }: TrainingCurvesOverlayProps) {
  // Placeholder for fetched curve data
  const [curveData, setCurveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch training curves for selected models
  useEffect(() => {
    setLoading(true);
    // TODO: Replace with real fetch from backend or Supabase
    // Example placeholder data structure
    const example = [
      {
        modelId: 'model1',
        modelName: 'ResNet50 v1',
        epochs: Array.from({ length: 10 }, (_, i) => i + 1),
        trainLoss: [1.2, 1.0, 0.9, 0.8, 0.7, 0.65, 0.6, 0.58, 0.57, 0.56],
        valLoss:   [1.3, 1.1, 1.0, 0.9, 0.8, 0.75, 0.7, 0.68, 0.67, 0.66],
        trainAcc:  [0.5, 0.6, 0.65, 0.7, 0.75, 0.78, 0.8, 0.82, 0.83, 0.84],
        valAcc:    [0.48, 0.58, 0.62, 0.68, 0.72, 0.76, 0.78, 0.8, 0.81, 0.82],
      },
      {
        modelId: 'model2',
        modelName: 'EfficientNet B0',
        epochs: Array.from({ length: 10 }, (_, i) => i + 1),
        trainLoss: [1.1, 0.95, 0.85, 0.8, 0.75, 0.7, 0.68, 0.67, 0.66, 0.65],
        valLoss:   [1.2, 1.0, 0.92, 0.88, 0.83, 0.78, 0.75, 0.74, 0.73, 0.72],
        trainAcc:  [0.52, 0.62, 0.68, 0.73, 0.77, 0.8, 0.82, 0.84, 0.85, 0.86],
        valAcc:    [0.5, 0.6, 0.65, 0.7, 0.74, 0.78, 0.8, 0.82, 0.83, 0.84],
      },
    ];
    // Filter example data by selected modelIds
    setCurveData(example.filter(d => modelIds.includes(d.modelId)));
    setLoading(false);
  }, [modelIds]);

  // Prepare chart data for loss and accuracy overlays
  const lossChartData = {
    labels: curveData[0]?.epochs || [],
    datasets: curveData.flatMap(model => [
      {
        label: `${model.modelName} - Train Loss`,
        data: model.trainLoss,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderDash: [],
        fill: false,
      },
      {
        label: `${model.modelName} - Val Loss`,
        data: model.valLoss,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderDash: [5, 5],
        fill: false,
      },
    ]),
  };

  const accChartData = {
    labels: curveData[0]?.epochs || [],
    datasets: curveData.flatMap(model => [
      {
        label: `${model.modelName} - Train Acc`,
        data: model.trainAcc,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderDash: [],
        fill: false,
      },
      {
        label: `${model.modelName} - Val Acc`,
        data: model.valAcc,
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.1)',
        borderDash: [5, 5],
        fill: false,
      },
    ]),
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
      {loading ? (
        <div>Loading curves...</div>
      ) : (
        <Line data={lossChartData} options={chartOptions} />
      )}
      <h3 className="text-lg font-semibold mt-8 mb-2">Training & Validation Accuracy</h3>
      {loading ? (
        <div>Loading curves...</div>
      ) : (
        <Line data={accChartData} options={chartOptions} />
      )}
      <div className="text-xs text-muted-foreground mt-2">
        Interactive legend: click to show/hide curves for each model.
      </div>
    </div>
  );
}