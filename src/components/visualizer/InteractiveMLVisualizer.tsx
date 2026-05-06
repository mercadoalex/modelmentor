import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Play,
  Pause,
  RotateCcw,
  Lightbulb,
  TrendingDown,
  Layers,
  Zap,
  Target,
  Info
} from 'lucide-react';
import { LineChart } from '@/components/charts/ChartComponents';
import { InteractiveQuiz } from '@/components/quiz/InteractiveQuiz';
import { 
  interactiveMLVisualizerService,
  type NetworkArchitecture,
  type DataPoint,
  type GradientStep
} from '@/services/interactiveMLVisualizerService';

export function InteractiveMLVisualizer() {
  // Neural Network State
  const [networkLayers, setNetworkLayers] = useState([2, 4, 3, 1]);
  const [network, setNetwork] = useState<NetworkArchitecture | null>(null);
  const [networkInput, setNetworkInput] = useState([0.5, 0.5]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Decision Boundary State
  const [dataPattern, setDataPattern] = useState<'linear' | 'circular' | 'xor'>('linear');
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [modelComplexity, setModelComplexity] = useState(1);
  const [boundaryAccuracy, setBoundaryAccuracy] = useState(0);

  // Gradient Descent State
  const [learningRate, setLearningRate] = useState(0.1);
  const [momentum, setMomentum] = useState(0);
  const [gradientSteps, setGradientSteps] = useState<GradientStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Overfitting State
  const [trainingComplexity, setTrainingComplexity] = useState(3);
  const [regularization, setRegularization] = useState(0);
  const [trainingCurves, setTrainingCurves] = useState<{ training: number[]; validation: number[] } | null>(null);
  const [dropoutRate, setDropoutRate] = useState(0.5);

  useEffect(() => {
    initializeNetwork();
    initializeData();
  }, []);

  const initializeNetwork = () => {
    const net = interactiveMLVisualizerService.createNetwork(networkLayers);
    setNetwork(net);
  };

  const initializeData = () => {
    const points = interactiveMLVisualizerService.generateClassificationData(50, dataPattern);
    setDataPoints(points);
    updateDecisionBoundary(points, modelComplexity);
  };

  const updateDecisionBoundary = (points: DataPoint[], complexity: number) => {
    const boundary = interactiveMLVisualizerService.calculateDecisionBoundary(points, complexity);
    setBoundaryAccuracy(boundary.accuracy);
  };

  const runGradientDescent = () => {
    const steps = interactiveMLVisualizerService.simulateGradientDescent(
      learningRate,
      momentum,
      50
    );
    setGradientSteps(steps);
    setCurrentStep(0);
    animateGradientDescent(steps);
  };

  const animateGradientDescent = (steps: GradientStep[]) => {
    setIsAnimating(true);
    let step = 0;
    
    const interval = setInterval(() => {
      if (step >= steps.length) {
        clearInterval(interval);
        setIsAnimating(false);
        return;
      }
      setCurrentStep(step);
      step++;
    }, 100);
  };

  const runTrainingSimulation = () => {
    const curves = interactiveMLVisualizerService.simulateTrainingCurves(
      trainingComplexity,
      regularization,
      100
    );
    setTrainingCurves(curves);
  };

  const addDataPoint = (x: number, y: number, label: number) => {
    const newPoint: DataPoint = {
      id: `point-${Date.now()}`,
      x,
      y,
      label,
      color: label === 1 ? '#3b82f6' : '#ef4444'
    };
    const newPoints = [...dataPoints, newPoint];
    setDataPoints(newPoints);
    updateDecisionBoundary(newPoints, modelComplexity);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Brain className="h-6 w-6" />
                Interactive ML Concepts Visualizer
              </CardTitle>
              <CardDescription className="mt-2">
                Learn machine learning by seeing and doing! Experiment with interactive visualizations.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              <Lightbulb className="h-3 w-3 mr-1" />
              Hands-On Learning
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="network" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="network">Neural Network</TabsTrigger>
          <TabsTrigger value="boundary">Decision Boundary</TabsTrigger>
          <TabsTrigger value="gradient">Gradient Descent</TabsTrigger>
          <TabsTrigger value="overfitting">Overfitting</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        {/* Neural Network Playground */}
        <TabsContent value="network" className="space-y-6">
          <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              <p className="font-semibold mb-1">What is a Neural Network? 🧠</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A neural network is like a team of workers passing information! Each circle (neuron) receives information, 
                processes it, and passes it to the next layer. The connections (lines) have weights that determine how much 
                influence each neuron has.
              </p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Build Your Network</CardTitle>
              <CardDescription>Adjust the number of neurons in each layer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                {networkLayers.map((count, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm">
                      {index === 0 ? 'Input' : index === networkLayers.length - 1 ? 'Output' : `Hidden ${index}`} Layer: {count}
                    </Label>
                    <Slider
                      value={[count]}
                      onValueChange={([v]) => {
                        const newLayers = [...networkLayers];
                        newLayers[index] = v;
                        setNetworkLayers(newLayers);
                      }}
                      min={1}
                      max={8}
                      step={1}
                    />
                  </div>
                ))}
              </div>

              <Button onClick={initializeNetwork} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Rebuild Network
              </Button>

              {/* Network Visualization */}
              {network && (
                <div className="p-6 rounded-lg border bg-card">
                  <svg width="100%" height="300" viewBox="0 0 800 300">
                    {/* Draw connections */}
                    {network.connections.map((conn, idx) => {
                      const fromNode = network.nodes.find(n => n.id === conn.from);
                      const toNode = network.nodes.find(n => n.id === conn.to);
                      if (!fromNode || !toNode) return null;

                      const opacity = Math.abs(conn.weight) / 2;
                      const color = conn.weight > 0 ? '#3b82f6' : '#ef4444';

                      return (
                        <line
                          key={idx}
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={color}
                          strokeWidth={Math.abs(conn.weight) * 2}
                          opacity={opacity}
                        />
                      );
                    })}

                    {/* Draw nodes */}
                    {network.nodes.map((node) => (
                      <g key={node.id}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={20}
                          fill={`hsl(var(--primary))`}
                          opacity={0.1 + node.activation * 0.9}
                          stroke={`hsl(var(--primary))`}
                          strokeWidth={2}
                        />
                        <text
                          x={node.x}
                          y={node.y + 5}
                          textAnchor="middle"
                          fontSize="10"
                          fill="currentColor"
                        >
                          {node.activation.toFixed(2)}
                        </text>
                      </g>
                    ))}

                    {/* Layer labels */}
                    {Array.from(new Set(network.nodes.map(n => n.layer))).map(layer => {
                      const layerNodes = network.nodes.filter(n => n.layer === layer);
                      const x = layerNodes[0].x;
                      return (
                        <text
                          key={layer}
                          x={x}
                          y={280}
                          textAnchor="middle"
                          fontSize="12"
                          fill="currentColor"
                          opacity={0.6}
                        >
                          {layer === 0 ? 'Input' : layer === network.layers.length - 1 ? 'Output' : `Hidden ${layer}`}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              )}

              {/* Input Controls */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Network Inputs</Label>
                {networkInput.map((value, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm">Input {index + 1}: {value.toFixed(2)}</Label>
                    <Slider
                      value={[value * 100]}
                      onValueChange={([v]) => {
                        const newInput = [...networkInput];
                        newInput[index] = v / 100;
                        setNetworkInput(newInput);
                        if (network) {
                          const updatedNodes = interactiveMLVisualizerService.forwardPropagate(network, newInput);
                          setNetwork({ ...network, nodes: updatedNodes });
                        }
                      }}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
            <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription>
              <p className="font-semibold mb-1">Try This! 💡</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Adjust the input sliders and watch how the activation values change through the network! 
                Brighter circles mean higher activation. The connections show how information flows.
              </p>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Decision Boundary Visualizer */}
        <TabsContent value="boundary" className="space-y-6">
          <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              <p className="font-semibold mb-1">What is a Decision Boundary? 🎯</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A decision boundary is like drawing a line to separate different groups! Your AI learns where to draw 
                this line to best separate red and blue points. Simple models draw simple lines, complex models draw 
                wiggly lines.
              </p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interactive Classification</CardTitle>
              <CardDescription>See how model complexity affects the decision boundary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Data Pattern</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['linear', 'circular', 'xor'] as const).map((pattern) => (
                      <Button
                        key={pattern}
                        variant={dataPattern === pattern ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setDataPattern(pattern);
                          const points = interactiveMLVisualizerService.generateClassificationData(50, pattern);
                          setDataPoints(points);
                          updateDecisionBoundary(points, modelComplexity);
                        }}
                      >
                        {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Model Complexity: {modelComplexity === 1 ? 'Simple' : modelComplexity === 2 ? 'Medium' : 'Complex'}
                  </Label>
                  <Slider
                    value={[modelComplexity]}
                    onValueChange={([v]) => {
                      setModelComplexity(v);
                      updateDecisionBoundary(dataPoints, v);
                    }}
                    min={1}
                    max={3}
                    step={1}
                  />
                </div>
              </div>

              {/* Visualization */}
              <div className="p-6 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold">
                    Accuracy: {(boundaryAccuracy * 100).toFixed(1)}%
                  </p>
                  <Badge variant={boundaryAccuracy > 0.9 ? 'default' : 'secondary'}>
                    {boundaryAccuracy > 0.9 ? 'Excellent' : boundaryAccuracy > 0.7 ? 'Good' : 'Needs Work'}
                  </Badge>
                </div>

                <svg width="100%" height="400" viewBox="-6 -6 12 12">
                  {/* Grid */}
                  <g opacity={0.1}>
                    {Array.from({ length: 11 }).map((_, i) => {
                      const pos = i - 5;
                      return (
                        <g key={i}>
                          <line x1={pos} y1={-5} x2={pos} y2={5} stroke="currentColor" strokeWidth={0.05} />
                          <line x1={-5} y1={pos} x2={5} y2={pos} stroke="currentColor" strokeWidth={0.05} />
                        </g>
                      );
                    })}
                  </g>

                  {/* Data points */}
                  {dataPoints.map((point) => (
                    <circle
                      key={point.id}
                      cx={point.x}
                      cy={-point.y}
                      r={0.3}
                      fill={point.color}
                      opacity={0.8}
                      stroke="white"
                      strokeWidth={0.05}
                    />
                  ))}

                  {/* Axes */}
                  <line x1={-5} y1={0} x2={5} y2={0} stroke="currentColor" strokeWidth={0.05} opacity={0.3} />
                  <line x1={0} y1={-5} x2={0} y2={5} stroke="currentColor" strokeWidth={0.05} opacity={0.3} />
                </svg>
              </div>

              <Button onClick={() => initializeData()} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Generate New Data
              </Button>
            </CardContent>
          </Card>

          <Alert className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
            <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription>
              <p className="font-semibold mb-1">Understanding Complexity 📊</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>Simple:</strong> Draws a straight line. Fast but might miss patterns.<br />
                <strong>Medium:</strong> Draws a curved line. Good balance.<br />
                <strong>Complex:</strong> Draws very wiggly lines. Might memorize instead of learn!
              </p>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Gradient Descent Animation */}
        <TabsContent value="gradient" className="space-y-6">
          <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              <p className="font-semibold mb-1">What is Gradient Descent? ⛰️</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Imagine you're on a mountain in the fog and want to reach the valley (lowest point). Gradient descent 
                is like taking steps downhill! Learning rate controls step size - too big and you might overshoot, 
                too small and it takes forever.
              </p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Optimization Playground</CardTitle>
              <CardDescription>Watch how learning rate and momentum affect convergence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Learning Rate: {learningRate.toFixed(3)}</Label>
                  <Slider
                    value={[learningRate * 1000]}
                    onValueChange={([v]) => setLearningRate(v / 1000)}
                    min={10}
                    max={500}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    {learningRate < 0.05 ? 'Too slow - will take many steps' : 
                     learningRate > 0.3 ? 'Too fast - might overshoot!' : 
                     'Good balance'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Momentum: {momentum.toFixed(2)}</Label>
                  <Slider
                    value={[momentum * 100]}
                    onValueChange={([v]) => setMomentum(v / 100)}
                    min={0}
                    max={90}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Momentum helps push through small bumps
                  </p>
                </div>
              </div>

              <Button 
                onClick={runGradientDescent} 
                disabled={isAnimating}
                className="w-full"
              >
                {isAnimating ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Optimization
                  </>
                )}
              </Button>

              {gradientSteps.length > 0 && (
                <>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{currentStep + 1}</p>
                        <p className="text-xs text-muted-foreground">Step</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{gradientSteps[currentStep]?.loss.toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">Loss</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {Math.sqrt(
                            gradientSteps[currentStep]?.gradient[0] ** 2 + 
                            gradientSteps[currentStep]?.gradient[1] ** 2
                          ).toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">Gradient Magnitude</p>
                      </div>
                    </div>
                  </div>

                  <LineChart
                    data={{
                      labels: gradientSteps.map((_, i) => i.toString()),
                      datasets: [{
                        label: 'Loss',
                        data: gradientSteps.map(s => s.loss),
                        borderColor: 'hsl(var(--chart-1))',
                        backgroundColor: 'hsla(var(--chart-1), 0.1)',
                        tension: 0.4,
                        fill: true,
                      }]
                    }}
                    options={{
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Iteration',
                            color: 'hsl(var(--muted-foreground))',
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Loss',
                            color: 'hsl(var(--muted-foreground))',
                          }
                        }
                      },
                      plugins: {
                        legend: { display: false }
                      }
                    }}
                    height={250}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overfitting Demonstrator */}
        <TabsContent value="overfitting" className="space-y-6">
          <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              <p className="font-semibold mb-1">What is Overfitting? 🤔</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Overfitting is like memorizing test answers without understanding! Your AI does great on training data 
                but fails on new data. It's too complex and learns noise instead of patterns. Regularization helps by 
                keeping the model simple.
              </p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Training Behavior Simulator</CardTitle>
              <CardDescription>See how complexity and regularization affect overfitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Model Complexity: {trainingComplexity}</Label>
                  <Slider
                    value={[trainingComplexity]}
                    onValueChange={([v]) => setTrainingComplexity(v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    {trainingComplexity < 3 ? 'Too simple - underfitting' : 
                     trainingComplexity > 6 ? 'Too complex - overfitting risk' : 
                     'Good balance'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Regularization: {regularization.toFixed(2)}</Label>
                  <Slider
                    value={[regularization * 100]}
                    onValueChange={([v]) => setRegularization(v / 100)}
                    min={0}
                    max={50}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Regularization prevents overfitting
                  </p>
                </div>
              </div>

              <Button onClick={runTrainingSimulation} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Simulate Training
              </Button>

              {trainingCurves && (
                <LineChart
                  data={{
                    labels: trainingCurves.training.map((_, i) => i.toString()),
                    datasets: [
                      {
                        label: 'Training Loss',
                        data: trainingCurves.training,
                        borderColor: 'hsl(var(--chart-1))',
                        backgroundColor: 'hsla(var(--chart-1), 0.1)',
                        tension: 0.4,
                        fill: false,
                      },
                      {
                        label: 'Validation Loss',
                        data: trainingCurves.validation,
                        borderColor: 'hsl(var(--chart-2))',
                        backgroundColor: 'hsla(var(--chart-2), 0.1)',
                        tension: 0.4,
                        fill: false,
                      }
                    ]
                  }}
                  options={{
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Epoch',
                          color: 'hsl(var(--muted-foreground))',
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Loss',
                          color: 'hsl(var(--muted-foreground))',
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top' as const,
                      }
                    }
                  }}
                  height={300}
                />
              )}

              {trainingCurves && (
                <Alert className={
                  trainingCurves.validation[trainingCurves.validation.length - 1] > 
                  trainingCurves.validation[20]
                    ? 'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30'
                }>
                  <Target className={`h-4 w-4 ${
                    trainingCurves.validation[trainingCurves.validation.length - 1] > 
                    trainingCurves.validation[20]
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                  <AlertDescription>
                    <p className="font-semibold mb-1">
                      {trainingCurves.validation[trainingCurves.validation.length - 1] > 
                       trainingCurves.validation[20]
                        ? 'Overfitting Detected! ⚠️'
                        : 'Good Fit! ✅'}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {trainingCurves.validation[trainingCurves.validation.length - 1] > 
                       trainingCurves.validation[20]
                        ? 'Validation loss is increasing while training loss decreases. Try reducing complexity or increasing regularization.'
                        : 'Both training and validation losses are decreasing together. Your model is learning well!'}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Dropout Visualization */}
              <div className="space-y-2">
                <Label className="text-sm">Dropout Rate: {(dropoutRate * 100).toFixed(0)}%</Label>
                <Slider
                  value={[dropoutRate * 100]}
                  onValueChange={([v]) => setDropoutRate(v / 100)}
                  min={0}
                  max={80}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">
                  Dropout randomly turns off neurons during training to prevent overfitting
                </p>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
            <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription>
              <p className="font-semibold mb-1">Key Takeaways 📚</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>Underfitting:</strong> Model too simple, both losses stay high<br />
                <strong>Good Fit:</strong> Both losses decrease together<br />
                <strong>Overfitting:</strong> Training loss decreases but validation loss increases
              </p>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-6">
          <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              <p className="font-semibold mb-1">Test Your Knowledge! 🎯</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Answer questions about the concepts you've learned! Earn points for correct answers, 
                get bonus points for speed and accuracy, and unlock achievements as you master each topic.
              </p>
            </AlertDescription>
          </Alert>

          <InteractiveQuiz />
        </TabsContent>
      </Tabs>
    </div>
  );
}
