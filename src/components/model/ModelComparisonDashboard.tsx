import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { multiModelComparisonService } from '@/services/multiModelComparisonService';
import type { ModelConfig, ModelTrainingResult, ComparisonInsight } from '@/services/multiModelComparisonService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Play, Trophy, Clock, Zap, Info, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ModelComparisonDashboardProps {
  features: string[];
}

export function ModelComparisonDashboard({ features }: ModelComparisonDashboardProps) {
  const [modelConfigs] = useState<ModelConfig[]>(multiModelComparisonService.getDefaultConfigs());
  const [results, setResults] = useState<ModelTrainingResult[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [trainingProgress, setTrainingProgress] = useState<{ [key: string]: number }>({});

  const handleTrainAll = async () => {
    setIsTraining(true);
    setResults([]);
    setTrainingProgress({});

    try {
      const newResults: ModelTrainingResult[] = [];

      for (const config of modelConfigs) {
        setCurrentModel(config.name);
        
        const result = await multiModelComparisonService.trainModel(
          config,
          features,
          (epoch, total) => {
            setTrainingProgress(prev => ({
              ...prev,
              [config.id]: (epoch / total) * 100,
            }));
          }
        );

        newResults.push(result);
        setResults([...newResults]);
      }

      toast.success('All models trained successfully!');
    } catch (error) {
      console.error('Training failed:', error);
      toast.error('Training failed');
    } finally {
      setIsTraining(false);
      setCurrentModel('');
    }
  };

  const comparison = results.length > 0 
    ? multiModelComparisonService.compareModels(results)
    : null;

  const curveData = results.length > 0
    ? multiModelComparisonService.generateCurveComparisonData(results)
    : [];

  const getModelColor = (index: number) => {
    const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Model Comparison Dashboard
          </CardTitle>
          <CardDescription className="text-pretty">
            Train multiple models side-by-side and compare their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Compare different model architectures and hyperparameters to find the best approach for your problem.
              This helps you understand the tradeoffs between accuracy, training time, and model complexity.
            </AlertDescription>
          </Alert>

          {!isTraining && results.length === 0 && (
            <Button onClick={handleTrainAll} className="w-full mt-4" size="lg">
              <Play className="h-5 w-5 mr-2" />
              Train All Models ({modelConfigs.length})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Model Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Models to Compare</CardTitle>
          <CardDescription className="text-pretty">
            {modelConfigs.length} different configurations will be trained
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {modelConfigs.map((config, index) => (
              <div key={config.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getModelColor(index) }}
                    />
                    <span className="font-semibold">{config.name}</span>
                  </div>
                  {results.find(r => r.config.id === config.id) && (
                    <Badge className="bg-green-500">Completed</Badge>
                  )}
                  {isTraining && currentModel === config.name && (
                    <Badge>Training...</Badge>
                  )}
                </div>
                <div className="grid md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Architecture:</span>{' '}
                    <span className="font-medium">{config.architecture.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Epochs:</span>{' '}
                    <span className="font-medium">{config.epochs}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Batch Size:</span>{' '}
                    <span className="font-medium">{config.batchSize}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Learning Rate:</span>{' '}
                    <span className="font-medium">{config.learningRate}</span>
                  </div>
                </div>
                {isTraining && trainingProgress[config.id] !== undefined && (
                  <div className="mt-2">
                    <Progress value={trainingProgress[config.id]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Winner Announcement */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Comparison Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comparison.insights.map((insight, index) => (
              <Alert key={index}>
                {insight.type === 'winner' && <Trophy className="h-4 w-4 text-yellow-500" />}
                {insight.type === 'info' && <Info className="h-4 w-4" />}
                {insight.type === 'warning' && <TrendingUp className="h-4 w-4" />}
                <AlertDescription>
                  <strong>{insight.title}:</strong> {insight.description}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics Comparison */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Performance Metrics</CardTitle>
            <CardDescription className="text-pretty">
              Side-by-side comparison of key metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left text-sm font-medium whitespace-nowrap">Model</th>
                    <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Accuracy</th>
                    <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Loss</th>
                    <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Training Time</th>
                    <th className="p-2 text-center text-sm font-medium whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => {
                    const isBest = comparison && result.config.id === comparison.bestAccuracy.config.id;
                    return (
                      <tr key={result.config.id} className={`border-b ${isBest ? 'bg-green-50' : ''}`}>
                        <td className="p-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: getModelColor(index) }}
                            />
                            <span className="font-medium">{result.config.name}</span>
                            {isBest && <Trophy className="h-4 w-4 text-yellow-500" />}
                          </div>
                        </td>
                        <td className="p-2 text-right whitespace-nowrap font-semibold">
                          {(result.accuracy * 100).toFixed(2)}%
                        </td>
                        <td className="p-2 text-right whitespace-nowrap">{result.loss.toFixed(4)}</td>
                        <td className="p-2 text-right whitespace-nowrap">{result.trainingTime.toFixed(0)}ms</td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Curves Comparison */}
      {curveData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Training Curves Comparison</CardTitle>
            <CardDescription className="text-pretty">
              How accuracy improved during training for each model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={curveData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="epoch"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Epoch', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Accuracy', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: 8 }}
                    iconType="line"
                  />
                  {results.map((result, index) => (
                    <Line
                      key={result.config.id}
                      type="monotone"
                      dataKey={result.config.name}
                      stroke={getModelColor(index)}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Importance Comparison */}
      {results.length > 0 && features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Feature Importance Comparison</CardTitle>
            <CardDescription className="text-pretty">
              How different models weight the same features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={Math.max(300, features.length * 60)}>
                <BarChart
                  data={features.map(feature => {
                    const data: { feature: string; [key: string]: string | number } = { feature };
                    results.forEach(result => {
                      const importance = result.featureImportance.find(f => f.feature === feature);
                      data[result.config.name] = importance ? (importance.importance * 100).toFixed(1) : 0;
                    });
                    return data;
                  })}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Importance (%)', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="feature"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                    width={90}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: 8 }}
                  />
                  {results.map((result, index) => (
                    <Bar
                      key={result.config.id}
                      dataKey={result.config.name}
                      fill={getModelColor(index)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Performers */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Best Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Highest Accuracy</span>
                </div>
                <p className="text-2xl font-bold">{comparison.bestAccuracy.config.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(comparison.bestAccuracy.accuracy * 100).toFixed(2)}% accuracy
                </p>
              </div>

              <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Fastest Training</span>
                </div>
                <p className="text-2xl font-bold">{comparison.fastestTraining.config.name}</p>
                <p className="text-sm text-muted-foreground">
                  {comparison.fastestTraining.trainingTime.toFixed(0)}ms
                </p>
              </div>

              <div className="p-4 border-2 border-purple-500 rounded-lg bg-purple-50">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Best Efficiency</span>
                </div>
                <p className="text-2xl font-bold">{comparison.bestEfficiency.config.name}</p>
                <p className="text-sm text-muted-foreground">
                  Best accuracy-to-time ratio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
