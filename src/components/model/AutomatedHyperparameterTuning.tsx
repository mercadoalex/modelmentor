import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  hyperparameterTuningService,
  type SearchStrategy,
  type Trial,
  type TuningResult,
} from '@/services/hyperparameterTuningService';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { 
  Settings,
  Play,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Zap,
  Target,
  Clock,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

export function AutomatedHyperparameterTuning() {
  const [strategy, setStrategy] = useState<SearchStrategy>('random');
  const [numTrials, setNumTrials] = useState(20);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTrial, setCurrentTrial] = useState<Trial | null>(null);
  const [result, setResult] = useState<TuningResult | null>(null);

  const handleStartTuning = async () => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);
    setCurrentTrial(null);

    try {
      const space = hyperparameterTuningService.getDefaultSearchSpace();
      
      const tuningResult = await hyperparameterTuningService.runTuning(
        strategy,
        space,
        numTrials,
        (trial, progressPercent) => {
          setCurrentTrial(trial);
          setProgress(progressPercent);
        }
      );

      setResult(tuningResult);
      toast.success('Hyperparameter tuning completed!');
    } catch (error) {
      toast.error('Tuning failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStrategyColor = (strat: SearchStrategy) => {
    switch (strat) {
      case 'grid': return 'bg-blue-500';
      case 'random': return 'bg-green-500';
      case 'bayesian': return 'bg-purple-500';
    }
  };

  const getImportanceColor = (importance: number) => {
    if (importance > 0.7) return 'bg-red-500';
    if (importance > 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Automated Hyperparameter Tuning
          </CardTitle>
          <CardDescription className="text-pretty">
            Automatically search for optimal hyperparameters using grid search, random search, or Bayesian optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Smart Optimization:</strong> Hyperparameter tuning can improve model accuracy by 5-10% 
              and reduce training time by finding optimal configurations automatically.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Tuning Configuration</CardTitle>
          <CardDescription className="text-pretty">
            Select search strategy and number of trials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strategy Selection */}
          <div className="space-y-3">
            <Label>Search Strategy</Label>
            <Select value={strategy} onValueChange={(v) => setStrategy(v as SearchStrategy)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid Search</SelectItem>
                <SelectItem value="random">Random Search</SelectItem>
                <SelectItem value="bayesian">Bayesian Optimization</SelectItem>
              </SelectContent>
            </Select>

            {/* Strategy Descriptions */}
            <div className="p-4 border rounded-lg bg-muted/50">
              {strategy === 'grid' && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Grid Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Exhaustively searches all parameter combinations in a predefined grid. 
                    Thorough but computationally expensive.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">Exhaustive</Badge>
                    <Badge variant="secondary">Reproducible</Badge>
                    <Badge variant="secondary">Slow</Badge>
                  </div>
                </div>
              )}
              {strategy === 'random' && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Random Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Randomly samples parameter combinations. Often finds good solutions faster than grid search.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">Fast</Badge>
                    <Badge variant="secondary">Efficient</Badge>
                    <Badge variant="secondary">Flexible</Badge>
                  </div>
                </div>
              )}
              {strategy === 'bayesian' && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Bayesian Optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    Uses previous trial results to intelligently suggest next parameters. 
                    Most efficient for expensive evaluations.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">Intelligent</Badge>
                    <Badge variant="secondary">Adaptive</Badge>
                    <Badge variant="secondary">Efficient</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Number of Trials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Number of Trials</Label>
              <span className="text-sm font-medium">{numTrials}</span>
            </div>
            <Slider
              value={[numTrials]}
              onValueChange={(v) => setNumTrials(v[0])}
              min={5}
              max={50}
              step={5}
              disabled={isRunning}
            />
            <p className="text-xs text-muted-foreground">
              More trials = better results but longer tuning time. 
              Recommended: 20-30 for random/Bayesian, 50+ for grid search.
            </p>
          </div>

          {/* Start Button */}
          <Button 
            onClick={handleStartTuning} 
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>Running Tuning...</>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Hyperparameter Tuning
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance flex items-center gap-2">
              <Zap className="h-5 w-5 animate-pulse" />
              Tuning in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>

            {currentTrial && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Trial #{currentTrial.id}</span>
                  <Badge variant="secondary">
                    {(currentTrial.accuracy * 100).toFixed(1)}% accuracy
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Learning Rate</p>
                    <p className="font-mono">{currentTrial.parameters.learningRate.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Batch Size</p>
                    <p className="font-mono">{currentTrial.parameters.batchSize}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Epochs</p>
                    <p className="font-mono">{currentTrial.parameters.epochs}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hidden Layers</p>
                    <p className="font-mono">{currentTrial.parameters.hiddenLayers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dropout</p>
                    <p className="font-mono">{currentTrial.parameters.dropout.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Optimizer</p>
                    <p className="font-mono">{currentTrial.parameters.optimizer}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Best Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Best Configuration Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">Trial #{result.bestTrial.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {(result.bestTrial.accuracy * 100).toFixed(2)}% accuracy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{(result.bestTrial.trainingTime / 1000).toFixed(1)}s</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Optimal Parameters</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Learning Rate</span>
                      <code className="text-sm font-mono">
                        {result.bestTrial.parameters.learningRate.toFixed(4)}
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Batch Size</span>
                      <code className="text-sm font-mono">
                        {result.bestTrial.parameters.batchSize}
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Epochs</span>
                      <code className="text-sm font-mono">
                        {result.bestTrial.parameters.epochs}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Model Architecture</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Hidden Layers</span>
                      <code className="text-sm font-mono">
                        {result.bestTrial.parameters.hiddenLayers}
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Dropout</span>
                      <code className="text-sm font-mono">
                        {result.bestTrial.parameters.dropout.toFixed(2)}
                      </code>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Optimizer</span>
                      <code className="text-sm font-mono">
                        {result.bestTrial.parameters.optimizer}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  toast.success('Best parameters ready to apply');
                }}
              >
                <Target className="h-4 w-4 mr-2" />
                Apply These Parameters to Training
              </Button>
            </CardContent>
          </Card>

          {/* Parameter Importance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Parameter Importance</CardTitle>
              <CardDescription className="text-pretty">
                Which hyperparameters have the biggest impact on model performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={result.parameterImportance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="parameter" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Importance', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="importance" radius={[4, 4, 0, 0]}>
                    {result.parameterImportance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsl(var(--primary))`}
                        opacity={0.5 + entry.importance * 0.5}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                {result.parameterImportance.map((param, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32">{param.parameter}</span>
                    <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden">
                      <div
                        className={getImportanceColor(param.importance)}
                        style={{ width: `${param.importance * 100}%`, height: '100%' }}
                      />
                    </div>
                    <span className="text-sm font-mono w-16 text-right">
                      {(param.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Focus on high-importance parameters:</strong> Parameters with higher importance 
                  scores have more impact on model performance. Tune these carefully in future experiments.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Convergence History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Convergence History</CardTitle>
              <CardDescription className="text-pretty">
                Best accuracy found over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={result.convergenceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="trialNumber" 
                    label={{ value: 'Trial Number', position: 'insideBottom', offset: -5 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Best Accuracy', angle: -90, position: 'insideLeft' }}
                    domain={[0.5, 1]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: 8 }} />
                  <Line 
                    type="monotone" 
                    dataKey="bestAccuracy" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Best Accuracy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trial Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">All Trials Comparison</CardTitle>
              <CardDescription className="text-pretty">
                Accuracy vs training time for all trials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="trainingTime" 
                    name="Training Time (ms)"
                    label={{ value: 'Training Time (ms)', position: 'insideBottom', offset: -5 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="accuracy" 
                    name="Accuracy"
                    domain={[0.5, 1]}
                    label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ paddingTop: 8 }} />
                  <Scatter 
                    name="Trials" 
                    data={result.allTrials} 
                    fill="hsl(var(--primary))"
                    opacity={0.6}
                  />
                  <Scatter 
                    name="Best Trial" 
                    data={[result.bestTrial]} 
                    fill="hsl(var(--destructive))"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
