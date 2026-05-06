import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TrainingMetricsDisplayProps {
  currentEpoch: number;
  totalEpochs: number;
  currentLoss?: number;
  currentAccuracy?: number;
  bestLoss?: number;
  bestAccuracy?: number;
  elapsedTime?: number;
  estimatedTimeRemaining?: number;
  samplesPerSecond?: number;
}

export function TrainingMetricsDisplay({
  currentEpoch,
  totalEpochs,
  currentLoss,
  currentAccuracy,
  bestLoss,
  bestAccuracy,
  elapsedTime,
  estimatedTimeRemaining,
  samplesPerSecond,
}: TrainingMetricsDisplayProps) {
  const progress = (currentEpoch / totalEpochs) * 100;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return value.toFixed(4);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Metrics</CardTitle>
        <CardDescription>Real-time performance indicators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Epoch Progress</span>
            <span className="text-muted-foreground">
              {currentEpoch} / {totalEpochs}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Loss */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Current Loss</span>
            </div>
            <p className="text-2xl font-semibold">
              {formatMetric(currentLoss)}
            </p>
            {bestLoss !== undefined && currentLoss !== undefined && (
              <p className="text-xs text-muted-foreground">
                Best: {formatMetric(bestLoss)}
              </p>
            )}
          </div>

          {/* Current Accuracy */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Current Accuracy</span>
            </div>
            <p className="text-2xl font-semibold">
              {formatPercentage(currentAccuracy)}
            </p>
            {bestAccuracy !== undefined && currentAccuracy !== undefined && (
              <p className="text-xs text-muted-foreground">
                Best: {formatPercentage(bestAccuracy)}
              </p>
            )}
          </div>

          {/* Elapsed Time */}
          {elapsedTime !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Elapsed Time</span>
              </div>
              <p className="text-lg font-semibold">
                {formatTime(elapsedTime)}
              </p>
            </div>
          )}

          {/* Estimated Time Remaining */}
          {estimatedTimeRemaining !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Time Remaining</span>
              </div>
              <p className="text-lg font-semibold">
                {formatTime(estimatedTimeRemaining)}
              </p>
            </div>
          )}

          {/* Samples Per Second */}
          {samplesPerSecond !== undefined && (
            <div className="space-y-1 col-span-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Training Speed</span>
              </div>
              <p className="text-lg font-semibold">
                {samplesPerSecond.toFixed(1)} samples/sec
              </p>
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {currentLoss !== undefined && bestLoss !== undefined && (
            <Badge variant={currentLoss <= bestLoss ? "default" : "secondary"}>
              {currentLoss <= bestLoss ? 'Improving' : 'Stable'}
            </Badge>
          )}
          {currentEpoch === totalEpochs && (
            <Badge variant="default">
              <Zap className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
