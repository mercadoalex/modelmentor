import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, TrendingUp, TrendingDown, Activity, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { mlExplanations } from '@/components/learning/SimplifiedExplanation';

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
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return value.toFixed(4);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  // Human-readable interpretation of current metrics
  const getLossMessage = (loss?: number) => {
    if (loss === undefined) return null;
    if (loss > 2) return { text: 'Very high — model is still learning basics', color: 'text-red-500' };
    if (loss > 1) return { text: 'Getting better, keep training', color: 'text-orange-500' };
    if (loss > 0.5) return { text: 'Decent — model is learning well', color: 'text-yellow-500' };
    return { text: 'Great — model is performing well!', color: 'text-green-500' };
  };

  const getAccuracyMessage = (acc?: number) => {
    if (acc === undefined) return null;
    if (acc < 0.5) return { text: 'Below random chance — check your data', color: 'text-red-500' };
    if (acc < 0.7) return { text: 'Learning but needs improvement', color: 'text-orange-500' };
    if (acc < 0.85) return { text: 'Good accuracy!', color: 'text-yellow-500' };
    return { text: 'Excellent accuracy! 🎉', color: 'text-green-500' };
  };

  const lossMsg = getLossMessage(currentLoss);
  const accMsg = getAccuracyMessage(currentAccuracy);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Training Metrics</CardTitle>
          <CardDescription>Real-time performance indicators — hover the <HelpCircle className="inline h-3 w-3" /> icons to learn what each metric means</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Epoch Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 font-medium">
                Epoch Progress
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs space-y-1">
                    <p className="font-semibold">{mlExplanations.epoch.term}</p>
                    <p className="text-xs">{mlExplanations.epoch.explanation}</p>
                    <p className="text-xs text-muted-foreground">{mlExplanations.epoch.example}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-muted-foreground">{currentEpoch} / {totalEpochs}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">

            {/* Current Loss */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Current Loss</span>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs space-y-1">
                    <p className="font-semibold">{mlExplanations.loss.term}</p>
                    <p className="text-xs">{mlExplanations.loss.explanation}</p>
                    <p className="text-xs text-muted-foreground">{mlExplanations.loss.example}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-semibold">{formatMetric(currentLoss)}</p>
              {/* Plain-English interpretation */}
              {lossMsg && <p className={`text-xs font-medium ${lossMsg.color}`}>{lossMsg.text}</p>}
              {bestLoss !== undefined && currentLoss !== undefined && (
                <p className="text-xs text-muted-foreground">Best: {formatMetric(bestLoss)}</p>
              )}
            </div>

            {/* Current Accuracy */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Current Accuracy</span>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs space-y-1">
                    <p className="font-semibold">{mlExplanations.accuracy.term}</p>
                    <p className="text-xs">{mlExplanations.accuracy.explanation}</p>
                    <p className="text-xs text-muted-foreground">{mlExplanations.accuracy.example}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-semibold">{formatPercentage(currentAccuracy)}</p>
              {/* Plain-English interpretation */}
              {accMsg && <p className={`text-xs font-medium ${accMsg.color}`}>{accMsg.text}</p>}
              {bestAccuracy !== undefined && currentAccuracy !== undefined && (
                <p className="text-xs text-muted-foreground">Best: {formatPercentage(bestAccuracy)}</p>
              )}
            </div>

            {/* Elapsed Time */}
            {elapsedTime !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Elapsed Time</span>
                </div>
                <p className="text-lg font-semibold">{formatTime(elapsedTime)}</p>
              </div>
            )}

            {/* Time Remaining */}
            {estimatedTimeRemaining !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Time Remaining</span>
                </div>
                <p className="text-lg font-semibold">{formatTime(estimatedTimeRemaining)}</p>
              </div>
            )}

            {/* Samples Per Second */}
            {samplesPerSecond !== undefined && (
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Training Speed</span>
                </div>
                <p className="text-lg font-semibold">{samplesPerSecond.toFixed(1)} samples/sec</p>
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {currentLoss !== undefined && bestLoss !== undefined && (
              <Badge variant={currentLoss <= bestLoss ? 'default' : 'secondary'}>
                {currentLoss <= bestLoss ? '📉 Improving' : '➡️ Stable'}
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
    </TooltipProvider>
  );
}