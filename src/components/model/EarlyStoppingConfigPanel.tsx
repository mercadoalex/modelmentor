import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { earlyStoppingService } from '@/services/earlyStoppingService';
import type { EarlyStoppingConfig } from '@/services/earlyStoppingService';
import { StopCircle, Info, CheckCircle2, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface EarlyStoppingConfigPanelProps {
  totalEpochs: number;
  config: EarlyStoppingConfig;
  onConfigChange: (config: EarlyStoppingConfig) => void;
}

export function EarlyStoppingConfigPanel({ 
  totalEpochs, 
  config, 
  onConfigChange 
}: EarlyStoppingConfigPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const explanations = earlyStoppingService.getExplanation();
  const patienceExplanation = earlyStoppingService.getPatienceExplanation(config.patience);
  const minDeltaExplanation = earlyStoppingService.getMinDeltaExplanation(config.minDelta);
  const recommendedPatience = earlyStoppingService.getRecommendedPatience(totalEpochs);

  const handleToggle = (enabled: boolean) => {
    onConfigChange({ ...config, enabled });
  };

  const handlePatienceChange = (value: string) => {
    onConfigChange({ ...config, patience: parseInt(value) });
  };

  const handleMinDeltaChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onConfigChange({ ...config, minDelta: numValue });
    }
  };

  const handleMetricChange = (value: string) => {
    const metric = value as 'val_accuracy' | 'val_loss';
    onConfigChange({
      ...config,
      monitorMetric: metric,
      mode: metric === 'val_accuracy' ? 'max' : 'min',
    });
  };

  const handleRestoreBestWeights = (checked: boolean) => {
    onConfigChange({ ...config, restoreBestWeights: checked });
  };

  const handleApplyRecommended = () => {
    onConfigChange({
      ...config,
      patience: recommendedPatience,
      minDelta: 0.001,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <StopCircle className="h-5 w-5" />
            Early Stopping
          </CardTitle>
          <CardDescription className="text-pretty">
            Automatically stop training when the model stops improving
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Early stopping monitors validation performance and stops training when there's no improvement
              for a specified number of epochs. This prevents overfitting and saves training time.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2">
            <Checkbox
              id="early-stopping-enabled"
              checked={config.enabled}
              onCheckedChange={handleToggle}
            />
            <label
              htmlFor="early-stopping-enabled"
              className="text-sm font-medium cursor-pointer"
            >
              Enable Early Stopping
            </label>
            {config.enabled && (
              <Badge className="bg-green-500">Active</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Why Use Early Stopping */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Why Use Early Stopping?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {explanations.map((explanation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{explanation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-balance">Configuration</CardTitle>
                <CardDescription className="text-pretty">
                  Customize early stopping behavior
                </CardDescription>
              </div>
              {config.patience !== recommendedPatience && (
                <Button variant="outline" size="sm" onClick={handleApplyRecommended}>
                  Use Recommended
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patience */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Patience (epochs)</label>
                {config.patience === recommendedPatience && (
                  <Badge variant="secondary">Recommended</Badge>
                )}
              </div>
              <Select value={config.patience.toString()} onValueChange={handlePatienceChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 epochs (Low patience)</SelectItem>
                  <SelectItem value="5">5 epochs (Moderate)</SelectItem>
                  <SelectItem value="7">7 epochs (Moderate-High)</SelectItem>
                  <SelectItem value="10">10 epochs (High patience)</SelectItem>
                  <SelectItem value="15">15 epochs (Very high)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{patienceExplanation}</p>
            </div>

            {/* Monitor Metric */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Monitor Metric</label>
              <Select value={config.monitorMetric} onValueChange={handleMetricChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="val_accuracy">Validation Accuracy (higher is better)</SelectItem>
                  <SelectItem value="val_loss">Validation Loss (lower is better)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The metric to monitor for improvement
              </p>
            </div>

            {/* Advanced Settings */}
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-2">
                {/* Min Delta */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Improvement (min_delta)</label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={config.minDelta}
                    onChange={(e) => handleMinDeltaChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{minDeltaExplanation}</p>
                </div>

                {/* Restore Best Weights */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="restore-best-weights"
                    checked={config.restoreBestWeights}
                    onCheckedChange={handleRestoreBestWeights}
                  />
                  <label
                    htmlFor="restore-best-weights"
                    className="text-sm cursor-pointer"
                  >
                    Restore best model weights after stopping
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, the model will be restored to the weights from the epoch with the best validation performance
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expected Behavior */}
      {config.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Expected Behavior</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Training Duration</p>
                  <p className="text-sm text-muted-foreground">
                    Training will run for up to {totalEpochs} epochs, but may stop earlier if no improvement
                    is seen for {config.patience} consecutive epochs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500 shrink-0 mt-0-5" />
                <div>
                  <p className="text-sm font-medium">Improvement Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    The system will track {config.monitorMetric} and consider an improvement when it changes
                    by at least {config.minDelta}.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Stopping Criteria</p>
                  <p className="text-sm text-muted-foreground">
                    If {config.monitorMetric} doesn't improve for {config.patience} epochs, training will stop
                    and {config.restoreBestWeights ? 'restore the best model weights' : 'keep the final weights'}.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
