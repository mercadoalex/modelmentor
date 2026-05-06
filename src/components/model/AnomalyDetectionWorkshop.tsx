import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  RotateCcw,
  TrendingUp,
  Brain,
  Target,
  Zap,
  Info,
  BarChart3
} from 'lucide-react';
import { 
  ScatterChart as RechartsScatter,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis
} from 'recharts';
import { anomalyDetectionService, type DataPoint, type AnomalyDetectionResult } from '@/services/anomalyDetectionService';

type Algorithm = 'isolation_forest' | 'autoencoder' | 'one_class_svm';

export function AnomalyDetectionWorkshop() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('isolation_forest');
  const [data, setData] = useState<DataPoint[]>([]);
  const [result, setResult] = useState<AnomalyDetectionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Hyperparameters
  const [numNormal, setNumNormal] = useState(200);
  const [numAnomalies, setNumAnomalies] = useState(20);
  const [contamination, setContamination] = useState(0.1);
  const [numTrees, setNumTrees] = useState(100);
  const [encodingDim, setEncodingDim] = useState(2);
  const [nu, setNu] = useState(0.1);
  const [gamma, setGamma] = useState(0.1);

  const generateData = () => {
    const newData = anomalyDetectionService.generateSyntheticData(
      numNormal,
      numAnomalies,
      2 // 2D for visualization
    );
    setData(newData);
    setResult(null);
  };

  const runDetection = () => {
    if (data.length === 0) {
      generateData();
      return;
    }

    setIsRunning(true);
    
    // Simulate processing time for educational purposes
    setTimeout(() => {
      let detectionResult: AnomalyDetectionResult;
      
      switch (selectedAlgorithm) {
        case 'isolation_forest':
          detectionResult = anomalyDetectionService.isolationForest(
            data,
            numTrees,
            256,
            contamination
          );
          break;
        case 'autoencoder':
          detectionResult = anomalyDetectionService.autoencoder(
            data,
            encodingDim,
            contamination
          );
          break;
        case 'one_class_svm':
          detectionResult = anomalyDetectionService.oneClassSVM(
            data,
            nu,
            gamma
          );
          break;
      }
      
      setResult(detectionResult);
      setIsRunning(false);
    }, 1000);
  };

  const reset = () => {
    setData([]);
    setResult(null);
  };

  const getAlgorithmInfo = (algo: Algorithm) => {
    const info = {
      isolation_forest: {
        name: 'Isolation Forest',
        icon: Target,
        description: 'Isolates anomalies by randomly partitioning data. Anomalies are easier to isolate (shorter path length).',
        strengths: [
          'Fast and efficient for large datasets',
          'Works well with high-dimensional data',
          'No assumptions about data distribution',
          'Handles outliers naturally'
        ],
        weaknesses: [
          'May struggle with local anomalies',
          'Performance depends on contamination parameter',
          'Less interpretable than other methods'
        ],
        useCases: [
          'Fraud detection in financial transactions',
          'Network intrusion detection',
          'Manufacturing defect detection',
          'Log anomaly detection'
        ]
      },
      autoencoder: {
        name: 'Autoencoder',
        icon: Brain,
        description: 'Neural network that learns to compress and reconstruct normal data. High reconstruction error indicates anomaly.',
        strengths: [
          'Learns complex patterns in data',
          'Effective for high-dimensional data',
          'Can capture non-linear relationships',
          'Unsupervised learning approach'
        ],
        weaknesses: [
          'Requires more training time',
          'Needs careful architecture design',
          'May overfit to training data',
          'Computationally expensive'
        ],
        useCases: [
          'Image anomaly detection',
          'Time series anomaly detection',
          'Sensor data monitoring',
          'Quality control in manufacturing'
        ]
      },
      one_class_svm: {
        name: 'One-Class SVM',
        icon: Zap,
        description: 'Learns a decision boundary around normal data using support vector machines. Points outside are anomalies.',
        strengths: [
          'Effective with small datasets',
          'Robust to outliers in training',
          'Works well in high dimensions',
          'Theoretical guarantees'
        ],
        weaknesses: [
          'Sensitive to kernel choice',
          'Requires parameter tuning',
          'Computationally intensive for large datasets',
          'Memory intensive'
        ],
        useCases: [
          'Medical diagnosis',
          'Equipment failure prediction',
          'Novelty detection',
          'Rare event detection'
        ]
      }
    };
    return info[algo];
  };

  const currentAlgoInfo = getAlgorithmInfo(selectedAlgorithm);
  const Icon = currentAlgoInfo.icon;

  // Prepare scatter plot data
  const getScatterData = () => {
    if (!result) return null;

    const normalData = result.normal.map((p, idx) => ({
      x: p.features[0],
      y: p.features[1],
      type: 'normal',
      id: p.id
    }));

    const anomalyData = result.anomalies.map((p, idx) => ({
      x: p.features[0],
      y: p.features[1],
      type: 'anomaly',
      id: p.id
    }));

    return { normalData, anomalyData };
  };

  const scatterData = getScatterData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <AlertTriangle className="h-6 w-6" />
                Anomaly Detection Workshop
              </CardTitle>
              <CardDescription className="mt-2">
                Learn three powerful algorithms for detecting outliers and unusual patterns in data
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Unsupervised Learning
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Algorithm Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Algorithm</CardTitle>
            <CardDescription>Choose an anomaly detection method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['isolation_forest', 'autoencoder', 'one_class_svm'] as Algorithm[]).map((algo) => {
              const info = getAlgorithmInfo(algo);
              const AlgoIcon = info.icon;
              return (
                <button
                  key={algo}
                  onClick={() => setSelectedAlgorithm(algo)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedAlgorithm === algo
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      selectedAlgorithm === algo ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <AlgoIcon className={`h-5 w-5 ${
                        selectedAlgorithm === algo ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-1">{info.name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {info.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
            <CardDescription>Adjust parameters and generate data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Generation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Data Generation</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Normal Points: {numNormal}</Label>
                  <Slider
                    value={[numNormal]}
                    onValueChange={([v]) => setNumNormal(v)}
                    min={50}
                    max={500}
                    step={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Anomalies: {numAnomalies}</Label>
                  <Slider
                    value={[numAnomalies]}
                    onValueChange={([v]) => setNumAnomalies(v)}
                    min={5}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            </div>

            {/* Algorithm-specific parameters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Algorithm Parameters</h3>
              
              {selectedAlgorithm === 'isolation_forest' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Number of Trees: {numTrees}</Label>
                    <Slider
                      value={[numTrees]}
                      onValueChange={([v]) => setNumTrees(v)}
                      min={10}
                      max={200}
                      step={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      More trees = better accuracy but slower
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Contamination: {(contamination * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[contamination * 100]}
                      onValueChange={([v]) => setContamination(v / 100)}
                      min={1}
                      max={30}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Expected proportion of anomalies
                    </p>
                  </div>
                </div>
              )}

              {selectedAlgorithm === 'autoencoder' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Encoding Dimension: {encodingDim}</Label>
                    <Slider
                      value={[encodingDim]}
                      onValueChange={([v]) => setEncodingDim(v)}
                      min={1}
                      max={5}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Compressed representation size
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Contamination: {(contamination * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[contamination * 100]}
                      onValueChange={([v]) => setContamination(v / 100)}
                      min={1}
                      max={30}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Expected proportion of anomalies
                    </p>
                  </div>
                </div>
              )}

              {selectedAlgorithm === 'one_class_svm' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Nu (ν): {nu.toFixed(2)}</Label>
                    <Slider
                      value={[nu * 100]}
                      onValueChange={([v]) => setNu(v / 100)}
                      min={1}
                      max={30}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upper bound on fraction of outliers
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Gamma (γ): {gamma.toFixed(2)}</Label>
                    <Slider
                      value={[gamma * 100]}
                      onValueChange={([v]) => setGamma(v / 100)}
                      min={1}
                      max={50}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      RBF kernel coefficient
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={generateData} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Generate Data
              </Button>
              <Button 
                onClick={runDetection} 
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Detection
                  </>
                )}
              </Button>
              {result && (
                <Button onClick={reset} variant="ghost">
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Detected Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{result.anomalies.length}</p>
                  <p className="text-sm text-muted-foreground">
                    / {data.length} points
                  </p>
                </div>
              </CardContent>
            </Card>

            {result.accuracy !== undefined && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {(result.accuracy * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Precision
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {((result.precision || 0) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Recall
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {((result.recall || 0) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Detection Results</CardTitle>
              <CardDescription>
                Scatter plot showing normal points and detected anomalies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scatterData && (
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsScatter>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Feature 1"
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Feature 1', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Feature 2"
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Feature 2', angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis range={[60, 60]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Scatter 
                      name="Normal" 
                      data={scatterData.normalData} 
                      fill="hsl(var(--chart-2))"
                      shape="circle"
                    />
                    <Scatter 
                      name="Anomalies" 
                      data={scatterData.anomalyData} 
                      fill="hsl(var(--chart-1))"
                      shape="triangle"
                    />
                  </RechartsScatter>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            About {currentAlgoInfo.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="strengths">Strengths</TabsTrigger>
              <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
              <TabsTrigger value="usecases">Use Cases</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">How it works</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentAlgoInfo.description}
                  </p>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="strengths" className="space-y-2">
              {currentAlgoInfo.strengths.map((strength, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <p className="text-sm">{strength}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="weaknesses" className="space-y-2">
              {currentAlgoInfo.weaknesses.map((weakness, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                  <p className="text-sm">{weakness}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="usecases" className="space-y-2">
              {currentAlgoInfo.useCases.map((useCase, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm">{useCase}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
