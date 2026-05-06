import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  abTestingService,
  type ABExperiment,
  type ExperimentMetrics,
  type ExperimentResult,
  type ExperimentStatus,
} from '@/services/abTestingService';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar,
} from 'recharts';
import {
  FlaskConical,
  Play,
  Pause,
  Trophy,
  TrendingUp,
  Users,
  Zap,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  GitCompare,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

export function ABTestingDashboard() {
  const [experiment, setExperiment] = useState<ABExperiment | null>(null);
  const [trafficSplit, setTrafficSplit] = useState(50);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    // Load sample experiment
    const sampleExperiment = abTestingService.generateSampleExperiment();
    setExperiment(sampleExperiment);
  }, []);

  const handleStartExperiment = () => {
    if (experiment) {
      setRunning(true);
      const updatedExperiment = {
        ...experiment,
        status: 'running' as ExperimentStatus,
      };
      setExperiment(updatedExperiment);
      toast.success('A/B test started');
    }
  };

  const handleStopExperiment = () => {
    if (experiment) {
      setRunning(false);
      const updatedExperiment = {
        ...experiment,
        status: 'stopped' as ExperimentStatus,
        endDate: new Date(),
      };
      setExperiment(updatedExperiment);
      toast.info('A/B test stopped');
    }
  };

  const handleUpdateTrafficSplit = (value: number) => {
    setTrafficSplit(value);
    if (experiment) {
      const updatedVariants = experiment.variants.map((v, index) => ({
        ...v,
        trafficPercentage: index === 0 ? value : 100 - value,
      }));
      setExperiment({
        ...experiment,
        variants: updatedVariants,
      });
    }
  };

  const handleDeployWinner = () => {
    if (experiment?.result?.winner) {
      const winnerVariant = experiment.variants.find(v => v.id === experiment.result?.winner);
      toast.success(`Deploying ${winnerVariant?.name} to production`);
    }
  };

  const getStatusBadge = (status: ExperimentStatus) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500">Running</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'stopped':
        return <Badge variant="secondary">Stopped</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getMetricComparison = (controlMetric: number, treatmentMetric: number) => {
    const improvement = ((treatmentMetric - controlMetric) / controlMetric) * 100;
    const isPositive = improvement > 0;
    return {
      improvement,
      isPositive,
      color: isPositive ? 'text-green-500' : 'text-red-500',
      icon: isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />,
    };
  };

  if (!experiment) {
    return <div>Loading experiment...</div>;
  }

  const controlMetrics = experiment.metrics.find(m =>
    experiment.variants.find(v => v.id === m.variantId)?.type === 'control'
  );
  const treatmentMetrics = experiment.metrics.find(m =>
    experiment.variants.find(v => v.id === m.variantId)?.type === 'treatment'
  );

  const progress = (experiment.currentSampleSize / experiment.targetSampleSize) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            A/B Testing Framework
          </CardTitle>
          <CardDescription className="text-pretty">
            Compare model versions with statistical rigor, traffic splitting, and automatic winner selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">{experiment.name}</h3>
              <p className="text-sm text-muted-foreground">{experiment.description}</p>
            </div>
            {getStatusBadge(experiment.status)}
          </div>

          <div className="flex items-center gap-3">
            {experiment.status === 'draft' || experiment.status === 'stopped' ? (
              <Button onClick={handleStartExperiment}>
                <Play className="h-4 w-4 mr-2" />
                Start Experiment
              </Button>
            ) : (
              <Button onClick={handleStopExperiment} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                Stop Experiment
              </Button>
            )}
          </div>

          {experiment.status === 'running' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Sample Collection Progress</span>
                <span className="font-medium">
                  {experiment.currentSampleSize.toLocaleString()} / {experiment.targetSampleSize.toLocaleString()}
                </span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traffic Split Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Traffic Split Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Control vs Treatment Split</Label>
              <span className="text-sm font-medium">{trafficSplit}% / {100 - trafficSplit}%</span>
            </div>
            <Slider
              value={[trafficSplit]}
              onValueChange={(v) => handleUpdateTrafficSplit(v[0])}
              min={10}
              max={90}
              step={5}
              disabled={experiment.status === 'running'}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {experiment.variants.map((variant) => (
              <div key={variant.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{variant.name}</p>
                    <p className="text-sm text-muted-foreground">{variant.version}</p>
                  </div>
                  <Badge variant={variant.type === 'control' ? 'secondary' : 'default'}>
                    {variant.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{variant.description}</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{variant.trafficPercentage}% traffic</span>
                </div>
              </div>
            ))}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Traffic split cannot be changed</strong> once the experiment is running to maintain statistical validity.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Experiment Tabs */}
      <Tabs defaultValue="metrics">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Metrics Comparison</TabsTrigger>
          <TabsTrigger value="statistics">Statistical Analysis</TabsTrigger>
          <TabsTrigger value="results">Results & Winner</TabsTrigger>
        </TabsList>

        {/* Metrics Comparison Tab */}
        <TabsContent value="metrics" className="space-y-6">
          {controlMetrics && treatmentMetrics && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Control</p>
                        <p className="text-xl font-bold">{(controlMetrics.accuracy * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Treatment</p>
                        <p className="text-xl font-bold">{(treatmentMetrics.accuracy * 100).toFixed(2)}%</p>
                      </div>
                      <div className={`flex items-center gap-1 ${getMetricComparison(controlMetrics.accuracy, treatmentMetrics.accuracy).color}`}>
                        {getMetricComparison(controlMetrics.accuracy, treatmentMetrics.accuracy).icon}
                        <span className="text-sm font-semibold">
                          {Math.abs(getMetricComparison(controlMetrics.accuracy, treatmentMetrics.accuracy).improvement).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Latency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Control</p>
                        <p className="text-xl font-bold">{controlMetrics.latency.toFixed(1)}ms</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Treatment</p>
                        <p className="text-xl font-bold">{treatmentMetrics.latency.toFixed(1)}ms</p>
                      </div>
                      <div className={`flex items-center gap-1 ${getMetricComparison(treatmentMetrics.latency, controlMetrics.latency).color}`}>
                        {getMetricComparison(treatmentMetrics.latency, controlMetrics.latency).icon}
                        <span className="text-sm font-semibold">
                          {Math.abs(getMetricComparison(treatmentMetrics.latency, controlMetrics.latency).improvement).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Control</p>
                        <p className="text-xl font-bold">{(controlMetrics.conversionRate * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Treatment</p>
                        <p className="text-xl font-bold">{(treatmentMetrics.conversionRate * 100).toFixed(2)}%</p>
                      </div>
                      <div className={`flex items-center gap-1 ${getMetricComparison(controlMetrics.conversionRate, treatmentMetrics.conversionRate).color}`}>
                        {getMetricComparison(controlMetrics.conversionRate, treatmentMetrics.conversionRate).icon}
                        <span className="text-sm font-semibold">
                          {Math.abs(getMetricComparison(controlMetrics.conversionRate, treatmentMetrics.conversionRate).improvement).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance">Performance Comparison</CardTitle>
                  <CardDescription className="text-pretty">
                    Side-by-side comparison of key metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          metric: 'Accuracy',
                          Control: controlMetrics.accuracy * 100,
                          Treatment: treatmentMetrics.accuracy * 100,
                        },
                        {
                          metric: 'Conversion',
                          Control: controlMetrics.conversionRate * 100,
                          Treatment: treatmentMetrics.conversionRate * 100,
                        },
                        {
                          metric: 'Throughput',
                          Control: controlMetrics.throughput,
                          Treatment: treatmentMetrics.throughput,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ paddingTop: 8 }} />
                      <Bar dataKey="Control" fill="#94a3b8" />
                      <Bar dataKey="Treatment" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sample Size Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance">Sample Size Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Control', value: controlMetrics.sampleSize },
                          { name: 'Treatment', value: treatmentMetrics.sampleSize },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value.toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#94a3b8" />
                        <Cell fill="hsl(var(--primary))" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Statistical Analysis Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {experiment.result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Statistical Significance Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {experiment.result.statisticalTests.map((test, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold">{test.testType.toUpperCase()}</span>
                        {test.significant ? (
                          <Badge className="bg-green-500">Significant</Badge>
                        ) : (
                          <Badge variant="secondary">Not Significant</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Test Statistic</p>
                          <p className="font-mono font-semibold">{test.statistic.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">P-Value</p>
                          <p className="font-mono font-semibold">{test.pValue.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence Level</p>
                          <p className="font-semibold">{(test.confidenceLevel * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                      <Alert className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {test.significant
                            ? `The difference is statistically significant (p < ${experiment.significanceLevel}). We can reject the null hypothesis.`
                            : `The difference is not statistically significant (p ≥ ${experiment.significanceLevel}). Cannot reject the null hypothesis.`}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-balance">Confidence Intervals (95%)</CardTitle>
                  <CardDescription className="text-pretty">
                    Range of plausible values for each variant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {experiment.result.confidenceIntervals.map((ci, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{ci.metric}</span>
                        <span className="text-sm font-mono">
                          [{(ci.lower * 100).toFixed(2)}%, {(ci.upper * 100).toFixed(2)}%]
                        </span>
                      </div>
                      <div className="relative h-8 bg-muted rounded">
                        <div
                          className="absolute h-full bg-primary/30 rounded"
                          style={{
                            left: `${ci.lower * 100}%`,
                            width: `${(ci.upper - ci.lower) * 100}%`,
                          }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-primary"
                          style={{ left: `${ci.mean * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Results & Winner Tab */}
        <TabsContent value="results" className="space-y-6">
          {experiment.result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Experiment Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {experiment.result.winner ? (
                    <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-6 w-6 text-primary" />
                            <h3 className="text-xl font-bold">Winner Declared</h3>
                          </div>
                          <p className="text-lg font-semibold">
                            {experiment.variants.find(v => v.id === experiment.result?.winner)?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <p className="text-2xl font-bold">{(experiment.result.winnerConfidence * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {experiment.result.recommendation}
                      </p>
                      {experiment.result.shouldDeploy && (
                        <Button onClick={handleDeployWinner} className="w-full">
                          <Zap className="h-4 w-4 mr-2" />
                          Deploy Winner to Production
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {experiment.result.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Minimum Detectable Effect</p>
                      <p className="text-xl font-bold">{(experiment.minimumDetectableEffect * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Significance Level</p>
                      <p className="text-xl font-bold">{(experiment.significanceLevel * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-balance">Deployment Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {experiment.result.shouldDeploy ? (
                      <>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Ready for Deployment</p>
                            <p className="text-sm text-muted-foreground">
                              Treatment variant shows statistically significant improvement above the minimum detectable effect threshold.
                            </p>
                          </div>
                        </div>
                        <Alert>
                          <Target className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Next Steps:</strong> Deploy the winning variant to production and continue monitoring performance.
                          </AlertDescription>
                        </Alert>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Not Ready for Deployment</p>
                            <p className="text-sm text-muted-foreground">
                              Continue the experiment or adjust parameters to reach conclusive results.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Results will be available once the experiment reaches the target sample size.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
