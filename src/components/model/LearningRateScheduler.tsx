import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { learningRateSchedulingService } from '@/services/learningRateSchedulingService';
import type { SchedulingStrategy, SchedulingParams } from '@/services/learningRateSchedulingService';
import { 
  TrendingDown, 
  Zap,
  Info,
  Lightbulb,
  CheckCircle2,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';

export function LearningRateScheduler() {
  const [params, setParams] = useState<SchedulingParams>({
    strategy: 'exponential_decay',
    initialLR: 0.01,
    stepSize: 20,
    decayRate: 0.5,
    decayFactor: 0.96,
    minLR: 0.0001,
    cycleLength: 50,
  });

  const [epochs, setEpochs] = useState(100);
  const [comparisonMode, setComparisonMode] = useState(false);

  const schedule = useMemo(() => {
    return learningRateSchedulingService.generateSchedule(params, epochs);
  }, [params, epochs]);

  const comparison = useMemo(() => {
    return learningRateSchedulingService.compareStrategies(params.initialLR, epochs);
  }, [params.initialLR, epochs]);

  const optimalLR = useMemo(() => {
    return learningRateSchedulingService.findOptimalLearningRate();
  }, []);

  const explanations = learningRateSchedulingService.getStrategyExplanations();
  const bestPractices = learningRateSchedulingService.getBestPractices();

  const handleStrategyChange = (strategy: SchedulingStrategy) => {
    setParams({ ...params, strategy });
    toast.success(`Switched to ${explanations[strategy].name}`);
  };

  const handleReset = () => {
    setParams({
      strategy: 'exponential_decay',
      initialLR: 0.01,
      stepSize: 20,
      decayRate: 0.5,
      decayFactor: 0.96,
      minLR: 0.0001,
      cycleLength: 50,
    });
    setEpochs(100);
    toast.success('Reset to default settings');
  };

  const handleApplyOptimal = () => {
    setParams({ ...params, initialLR: optimalLR.optimalLR });
    toast.success('Applied optimal learning rate');
  };

  const currentExplanation = explanations[params.strategy];

  // Prepare comparison data
  const comparisonData = comparison.map(c => ({
    strategy: c.strategy.replace('_', ' '),
    'Final Loss': c.finalLoss,
    'Convergence Speed': c.convergenceSpeed * 100,
    'Stability': c.stability * 100,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <TrendingDown className="h-6 w-6" />
            Learning Rate Scheduling
          </CardTitle>
          <CardDescription className="text-pretty">
            Optimize training convergence by adjusting learning rate over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              Reset
            </Button>
            <Button onClick={handleApplyOptimal} variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Apply Optimal LR
            </Button>
            <Button 
              onClick={() => setComparisonMode(!comparisonMode)} 
              variant="outline" 
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {comparisonMode ? 'Hide' : 'Show'} Comparison
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Select Scheduling Strategy</CardTitle>
          <CardDescription className="text-pretty">
            Choose how learning rate changes during training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {(Object.keys(explanations) as SchedulingStrategy[]).map((strategy) => {
              const exp = explanations[strategy];
              return (
                <Button
                  key={strategy}
                  variant={params.strategy === strategy ? 'default' : 'outline'}
                  className="h-auto flex-col items-start p-4 text-left"
                  onClick={() => handleStrategyChange(strategy)}
                >
                  <span className="font-semibold mb-1">{exp.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {exp.description}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Parameters */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Parameters</CardTitle>
            <CardDescription className="text-pretty">
              Adjust scheduling parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Initial Learning Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Initial Learning Rate</span>
                <span className="text-sm font-mono">{params.initialLR.toFixed(4)}</span>
              </div>
              <Slider
                value={[Math.log10(params.initialLR)]}
                onValueChange={(value) => setParams({ ...params, initialLR: Math.pow(10, value[0]) })}
                min={-5}
                max={-1}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Starting learning rate (logarithmic scale)
              </p>
            </div>

            {/* Strategy-specific parameters */}
            {params.strategy === 'step_decay' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Step Size</span>
                    <span className="text-sm font-mono">{params.stepSize}</span>
                  </div>
                  <Slider
                    value={[params.stepSize || 20]}
                    onValueChange={(value) => setParams({ ...params, stepSize: value[0] })}
                    min={5}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Reduce LR every N epochs
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Decay Rate</span>
                    <span className="text-sm font-mono">{params.decayRate?.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[params.decayRate || 0.5]}
                    onValueChange={(value) => setParams({ ...params, decayRate: value[0] })}
                    min={0.1}
                    max={0.9}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Multiply LR by this factor at each step
                  </p>
                </div>
              </>
            )}

            {params.strategy === 'exponential_decay' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Decay Factor</span>
                  <span className="text-sm font-mono">{params.decayFactor?.toFixed(3)}</span>
                </div>
                <Slider
                  value={[params.decayFactor || 0.96]}
                  onValueChange={(value) => setParams({ ...params, decayFactor: value[0] })}
                  min={0.90}
                  max={0.99}
                  step={0.01}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Multiply LR by this factor each epoch
                </p>
              </div>
            )}

            {params.strategy === 'cosine_annealing' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Minimum LR</span>
                    <span className="text-sm font-mono">{params.minLR?.toFixed(6)}</span>
                  </div>
                  <Slider
                    value={[Math.log10(params.minLR || 0.0001)]}
                    onValueChange={(value) => setParams({ ...params, minLR: Math.pow(10, value[0]) })}
                    min={-6}
                    max={-3}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowest learning rate in cycle
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Cycle Length</span>
                    <span className="text-sm font-mono">{params.cycleLength}</span>
                  </div>
                  <Slider
                    value={[params.cycleLength || 50]}
                    onValueChange={(value) => setParams({ ...params, cycleLength: value[0] })}
                    min={10}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of epochs per cycle
                  </p>
                </div>
              </>
            )}

            {/* Training Epochs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Training Epochs</span>
                <span className="text-sm font-mono">{epochs}</span>
              </div>
              <Slider
                value={[epochs]}
                onValueChange={(value) => setEpochs(value[0])}
                min={20}
                max={200}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Total number of training epochs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Strategy Info */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">{currentExplanation.name}</CardTitle>
            <CardDescription className="text-pretty">
              {currentExplanation.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Formula</h4>
              <p className="text-sm font-mono">{currentExplanation.formula}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Advantages
              </h4>
              <ul className="space-y-1">
                {currentExplanation.pros.map((pro, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {pro}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-yellow-600" />
                Disadvantages
              </h4>
              <ul className="space-y-1">
                {currentExplanation.cons.map((con, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {con}
                  </li>
                ))}
              </ul>
            </div>

            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Best for:</strong> {currentExplanation.bestFor}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Learning Rate Schedule</CardTitle>
          <CardDescription className="text-pretty">
            Visualize how learning rate changes over training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lr">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lr">Learning Rate Curve</TabsTrigger>
              <TabsTrigger value="loss">Training Loss</TabsTrigger>
            </TabsList>

            {/* Learning Rate Curve */}
            <TabsContent value="lr" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={schedule}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="epoch" 
                      label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      scale="log"
                      domain={['auto', 'auto']}
                      label={{ value: 'Learning Rate (log scale)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="learningRate" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  {params.strategy === 'constant' && 'Learning rate remains constant throughout training.'}
                  {params.strategy === 'step_decay' && 'Learning rate drops at regular intervals, creating a staircase pattern.'}
                  {params.strategy === 'exponential_decay' && 'Learning rate decreases smoothly and exponentially over time.'}
                  {params.strategy === 'cosine_annealing' && 'Learning rate follows a cosine curve, cycling between maximum and minimum values.'}
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Training Loss */}
            <TabsContent value="loss" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={schedule}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="epoch" 
                      label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Training Loss', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="trainLoss" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Initial Loss</p>
                  <p className="text-2xl font-bold">{schedule[0]?.trainLoss.toFixed(3)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Final Loss</p>
                  <p className="text-2xl font-bold">{schedule[schedule.length - 1]?.trainLoss.toFixed(3)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Improvement</p>
                  <p className="text-2xl font-bold text-green-600">
                    {((1 - schedule[schedule.length - 1]?.trainLoss / schedule[0]?.trainLoss) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Strategy Comparison */}
      {comparisonMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Strategy Comparison</CardTitle>
            <CardDescription className="text-pretty">
              Compare different scheduling strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {comparison.map((comp, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">
                      {explanations[comp.strategy].name}
                    </span>
                    {comp.strategy === params.strategy && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Final Loss</p>
                      <p className="font-bold">{comp.finalLoss.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Convergence</p>
                      <p className="font-bold">{(comp.convergenceSpeed * 1000).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stability</p>
                      <p className="font-bold">{(comp.stability * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> Lower final loss and higher stability are better. 
                Convergence speed shows how quickly the model learns.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Learning Rate Finder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Learning Rate Finder
          </CardTitle>
          <CardDescription className="text-pretty">
            Find the optimal initial learning rate for your model
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Recommended Learning Rate</span>
              <span className="text-2xl font-bold text-primary">
                {optimalLR.optimalLR}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {optimalLR.recommendation}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium mb-1">Minimum LR</p>
              <p className="text-lg font-mono">{optimalLR.lrRange.min}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium mb-1">Maximum LR</p>
              <p className="text-lg font-mono">{optimalLR.lrRange.max}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {bestPractices.map((practice, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{practice}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
