import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { hyperparameterOptimizationService } from '@/services/hyperparameterOptimizationService';
import type { OptimizationProgress, OptimizationRecommendation, SearchSpace } from '@/services/hyperparameterOptimizationService';
import { Settings, Play, CheckCircle2, TrendingUp, Clock, Zap, Info, Award } from 'lucide-react';
import { toast } from 'sonner';

interface HyperparameterOptimizerProps {
  onApplySettings?: (config: { epochs: number; batchSize: number; learningRate: number }) => void;
}

export function HyperparameterOptimizer({ onApplySettings }: HyperparameterOptimizerProps) {
  const [optimizationMethod, setOptimizationMethod] = useState<'grid' | 'bayesian'>('bayesian');
  const [searchSpace, setSearchSpace] = useState<'default' | 'quick'>('quick');
  const [progress, setProgress] = useState<OptimizationProgress | null>(null);
  const [recommendation, setRecommendation] = useState<OptimizationRecommendation | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleStartOptimization = async () => {
    setIsRunning(true);
    setProgress(null);
    setRecommendation(null);

    try {
      const space: SearchSpace = searchSpace === 'quick'
        ? hyperparameterOptimizationService.getQuickSearchSpace()
        : hyperparameterOptimizationService.getDefaultSearchSpace();

      let result: OptimizationProgress;

      if (optimizationMethod === 'grid') {
        result = await hyperparameterOptimizationService.gridSearch(
          space,
          (p) => setProgress(p)
        );
      } else {
        result = await hyperparameterOptimizationService.bayesianOptimization(
          space,
          10,
          (p) => setProgress(p)
        );
      }

      setProgress(result);
      const rec = hyperparameterOptimizationService.generateRecommendation(result);
      setRecommendation(rec);
      toast.success('Optimization completed!');
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Optimization failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplyRecommendation = () => {
    if (recommendation && onApplySettings) {
      onApplySettings(recommendation.bestConfig);
      toast.success('Applied recommended settings');
    }
  };

  const progressPercentage = progress
    ? (progress.currentIteration / progress.totalIterations) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Hyperparameter Optimization
          </CardTitle>
          <CardDescription className="text-pretty">
            Automatically find the best training settings for your model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Hyperparameter optimization tests different combinations of epochs, batch size, and learning rate
              to find the settings that give the best model performance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Configuration */}
      {!isRunning && !recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Configuration</CardTitle>
            <CardDescription className="text-pretty">
              Choose your optimization strategy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Optimization Method</label>
              <Select value={optimizationMethod} onValueChange={(v) => setOptimizationMethod(v as 'grid' | 'bayesian')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bayesian">Bayesian Optimization (Recommended)</SelectItem>
                  <SelectItem value="grid">Grid Search</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {optimizationMethod === 'bayesian'
                  ? 'Intelligently explores the search space, faster and more efficient'
                  : 'Tests all combinations systematically, thorough but slower'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search Space</label>
              <Select value={searchSpace} onValueChange={(v) => setSearchSpace(v as 'default' | 'quick')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick (8 combinations)</SelectItem>
                  <SelectItem value="default">Comprehensive (36 combinations)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {searchSpace === 'quick'
                  ? 'Faster optimization with fewer parameter combinations'
                  : 'More thorough search across wider parameter ranges'}
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">What will be tested:</p>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Epochs</p>
                  <p className="text-sm font-medium">
                    {searchSpace === 'quick' ? '20, 50' : '10, 20, 30, 50'}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Batch Size</p>
                  <p className="text-sm font-medium">
                    {searchSpace === 'quick' ? '32, 64' : '16, 32, 64'}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Learning Rate</p>
                  <p className="text-sm font-medium">
                    {searchSpace === 'quick' ? '0.001, 0.01' : '0.0001, 0.001, 0.01'}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleStartOptimization} className="w-full" size="lg">
              <Play className="h-5 w-5 mr-2" />
              Start Optimization
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {isRunning && progress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Optimization in Progress</CardTitle>
            <CardDescription className="text-pretty">
              Testing different hyperparameter combinations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">
                  {progress.currentIteration} / {progress.totalIterations} combinations
                </span>
              </div>
              <Progress value={progressPercentage} />
            </div>

            {progress.bestResult && (
              <div className="p-4 border rounded-lg bg-green-50">
                <p className="text-sm font-medium mb-2">Best Result So Far:</p>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className="text-lg font-semibold">
                      {(progress.bestResult.accuracy * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Configuration</p>
                    <p className="text-sm">
                      E:{progress.bestResult.config.epochs} B:{progress.bestResult.config.batchSize} LR:{progress.bestResult.config.learningRate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Training Time</p>
                    <p className="text-sm">{progress.bestResult.trainingTime.toFixed(0)}ms</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {recommendation && progress && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Recommended Configuration
              </CardTitle>
              <CardDescription className="text-pretty">
                Best hyperparameters found during optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Epochs</p>
                    <p className="text-3xl font-semibold">{recommendation.bestConfig.epochs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Batch Size</p>
                    <p className="text-3xl font-semibold">{recommendation.bestConfig.batchSize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Learning Rate</p>
                    <p className="text-3xl font-semibold">{recommendation.bestConfig.learningRate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="font-medium">
                    Expected Accuracy: {(recommendation.expectedAccuracy * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Why these settings?</p>
                <ul className="space-y-1">
                  {recommendation.reasoning.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {onApplySettings && (
                <Button onClick={handleApplyRecommendation} className="w-full" size="lg">
                  <Zap className="h-5 w-5 mr-2" />
                  Apply These Settings
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Alternative Configurations */}
          {recommendation.alternatives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-balance">Alternative Configurations</CardTitle>
                <CardDescription className="text-pretty">
                  Other good options with different tradeoffs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendation.alternatives.map((alt, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="space-y-1">
                          <p className="font-medium">
                            Epochs: {alt.config.epochs}, Batch Size: {alt.config.batchSize}, LR: {alt.config.learningRate}
                          </p>
                          <p className="text-sm text-muted-foreground">{alt.tradeoff}</p>
                        </div>
                        {onApplySettings && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onApplySettings(alt.config);
                              toast.success('Applied alternative settings');
                            }}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">All Tested Combinations</CardTitle>
              <CardDescription className="text-pretty">
                Complete results from the optimization search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-sm font-medium whitespace-nowrap">#</th>
                      <th className="p-2 text-left text-sm font-medium whitespace-nowrap">Epochs</th>
                      <th className="p-2 text-left text-sm font-medium whitespace-nowrap">Batch Size</th>
                      <th className="p-2 text-left text-sm font-medium whitespace-nowrap">Learning Rate</th>
                      <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Accuracy</th>
                      <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Loss</th>
                      <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Time (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.allResults
                      .sort((a, b) => b.accuracy - a.accuracy)
                      .map((result, index) => {
                        const isBest = result === progress.bestResult;
                        return (
                          <tr key={result.iteration} className={`border-b ${isBest ? 'bg-green-50' : ''}`}>
                            <td className="p-2 whitespace-nowrap">
                              {isBest && <Badge className="bg-green-500">Best</Badge>}
                              {!isBest && <span className="text-sm text-muted-foreground">{index + 1}</span>}
                            </td>
                            <td className="p-2 whitespace-nowrap">{result.config.epochs}</td>
                            <td className="p-2 whitespace-nowrap">{result.config.batchSize}</td>
                            <td className="p-2 whitespace-nowrap">{result.config.learningRate}</td>
                            <td className="p-2 text-right whitespace-nowrap font-medium">
                              {(result.accuracy * 100).toFixed(2)}%
                            </td>
                            <td className="p-2 text-right whitespace-nowrap">{result.loss.toFixed(4)}</td>
                            <td className="p-2 text-right whitespace-nowrap">{result.trainingTime.toFixed(0)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
