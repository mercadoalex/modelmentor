import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  neuralArchitectureSearchService,
  type Architecture,
  type SearchSpace,
  type SearchConfig,
  type SearchStrategy,
  type ParetoPoint,
} from '@/services/neuralArchitectureSearchService';
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Cpu,
  Play,
  Sparkles,
  TrendingUp,
  Layers,
  Zap,
  Award,
  GitBranch,
  Target,
  Download,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export function NeuralArchitectureSearch() {
  const [searchSpace] = useState<SearchSpace>(
    neuralArchitectureSearchService.getDefaultSearchSpace()
  );
  const [config, setConfig] = useState<SearchConfig>(
    neuralArchitectureSearchService.getDefaultSearchConfig()
  );
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [selectedArchitecture, setSelectedArchitecture] = useState<Architecture | null>(null);
  const [paretoFrontier, setParetoFrontier] = useState<ParetoPoint[]>([]);

  const handleStartSearch = () => {
    setSearching(true);
    setProgress(0);
    toast.info('Starting architecture search...');

    // Simulate progressive search
    const totalSteps = config.populationSize * config.generations;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep += config.populationSize;
      setProgress((currentStep / totalSteps) * 100);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        
        // Run search
        const results = neuralArchitectureSearchService.runSearch(searchSpace, config);
        setArchitectures(results);
        
        // Calculate Pareto frontier
        const pareto = neuralArchitectureSearchService.calculateParetoFrontier(results);
        setParetoFrontier(pareto);
        
        // Select best architecture
        setSelectedArchitecture(results[0]);
        
        setSearching(false);
        setProgress(100);
        toast.success(`Search complete! Found ${results.length} architectures`);
      }
    }, 100);
  };

  const handleExportArchitecture = (arch: Architecture) => {
    const blob = new Blob([JSON.stringify(arch, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-${arch.id}.json`;
    a.click();
    toast.success('Architecture exported');
  };

  const getStrategyDescription = (strategy: SearchStrategy) => {
    switch (strategy) {
      case 'random':
        return 'Randomly sample architectures from search space';
      case 'evolutionary':
        return 'Evolve architectures using mutation and crossover';
      case 'reinforcement_learning':
        return 'Use RL controller to generate architectures';
    }
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'dense': return '⬤';
      case 'conv2d': return '▦';
      case 'lstm': return '↻';
      case 'attention': return '◈';
      case 'dropout': return '⊗';
      case 'batch_norm': return '≈';
      default: return '○';
    }
  };

  const topArchitectures = architectures.slice(0, 5);
  const paretoOptimal = paretoFrontier.filter(p => !p.isDominated);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Cpu className="h-6 w-6" />
            Neural Architecture Search
          </CardTitle>
          <CardDescription className="text-pretty">
            Automatically discover optimal neural network architectures using evolutionary algorithms and reinforcement learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>AutoML for Architecture:</strong> Let the system design the neural network for you. NAS explores thousands of architectures to find the best accuracy-efficiency trade-off.
            </AlertDescription>
          </Alert>

          {searching && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Search Progress</span>
                <span className="font-medium">
                  Generation {Math.floor((progress / 100) * config.generations)} / {config.generations}
                </span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Target className="h-5 w-5" />
            Search Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Search Strategy</Label>
              <Select
                value={config.strategy}
                onValueChange={(v) => setConfig({ ...config, strategy: v as SearchStrategy })}
                disabled={searching}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random Search</SelectItem>
                  <SelectItem value="evolutionary">Evolutionary Algorithm</SelectItem>
                  <SelectItem value="reinforcement_learning">Reinforcement Learning</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getStrategyDescription(config.strategy)}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Population Size</Label>
                <span className="text-sm font-medium">{config.populationSize}</span>
              </div>
              <Slider
                value={[config.populationSize]}
                onValueChange={(v) => setConfig({ ...config, populationSize: v[0] })}
                min={10}
                max={50}
                step={5}
                disabled={searching}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Generations</Label>
                <span className="text-sm font-medium">{config.generations}</span>
              </div>
              <Slider
                value={[config.generations]}
                onValueChange={(v) => setConfig({ ...config, generations: v[0] })}
                min={5}
                max={20}
                step={1}
                disabled={searching}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Mutation Rate</Label>
                <span className="text-sm font-medium">{(config.mutationRate * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[config.mutationRate * 100]}
                onValueChange={(v) => setConfig({ ...config, mutationRate: v[0] / 100 })}
                min={10}
                max={50}
                step={5}
                disabled={searching}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Max Parameters</p>
              <p className="text-lg font-semibold">{(config.maxParameters / 1e6).toFixed(1)}M</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Max Latency</p>
              <p className="text-lg font-semibold">{config.maxLatency}ms</p>
            </div>
          </div>

          <Button
            onClick={handleStartSearch}
            disabled={searching}
            className="w-full"
          >
            {searching ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Searching...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Architecture Search
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {architectures.length > 0 && (
        <Tabs defaultValue="results">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="results">Top Results</TabsTrigger>
            <TabsTrigger value="pareto">Pareto Frontier</TabsTrigger>
            <TabsTrigger value="architecture">Architecture View</TabsTrigger>
            <TabsTrigger value="evolution">Evolution</TabsTrigger>
          </TabsList>

          {/* Top Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-balance flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top 5 Architectures
                </CardTitle>
                <CardDescription className="text-pretty">
                  Best performing architectures ranked by fitness score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topArchitectures.map((arch, index) => (
                  <div
                    key={arch.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedArchitecture?.id === arch.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedArchitecture(arch)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                        <span className="font-semibold">Architecture #{index + 1}</span>
                        <Badge variant="secondary">Gen {arch.generation}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportArchitecture(arch);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="text-lg font-bold">{(arch.metrics.accuracy * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Parameters</p>
                        <p className="text-lg font-bold">{(arch.metrics.parameters / 1e6).toFixed(2)}M</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Latency</p>
                        <p className="text-lg font-bold">{arch.metrics.latency.toFixed(1)}ms</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fitness</p>
                        <p className="text-lg font-bold">{arch.fitness.toFixed(3)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span>{arch.layers.length} layers</span>
                      <GitBranch className="h-4 w-4 text-muted-foreground ml-2" />
                      <span>{arch.connections}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pareto Frontier Tab */}
          <TabsContent value="pareto" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-balance">Accuracy vs Parameters Trade-off</CardTitle>
                <CardDescription className="text-pretty">
                  Pareto-optimal architectures (non-dominated solutions)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="parameters"
                      name="Parameters"
                      label={{ value: 'Parameters (M)', position: 'insideBottom', offset: -5 }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="accuracy"
                      name="Accuracy"
                      label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                      domain={[0.6, 1]}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold mb-1">Architecture</p>
                              <p className="text-sm">Accuracy: {(data.accuracy * 100).toFixed(2)}%</p>
                              <p className="text-sm">Parameters: {(data.parameters / 1e6).toFixed(2)}M</p>
                              <p className="text-sm">Latency: {data.latency.toFixed(1)}ms</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      data={paretoFrontier.map(p => ({
                        accuracy: p.architecture.metrics.accuracy,
                        parameters: p.architecture.metrics.parameters / 1e6,
                        latency: p.architecture.metrics.latency,
                        isDominated: p.isDominated,
                      }))}
                      fill="hsl(var(--primary))"
                    >
                      {paretoFrontier.map((p, index) => (
                        <Cell
                          key={index}
                          fill={p.isDominated ? '#94a3b8' : 'hsl(var(--primary))'}
                          opacity={p.isDominated ? 0.3 : 1}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>

                <Alert className="mt-4">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pareto Frontier:</strong> {paretoOptimal.length} non-dominated architectures found. These represent the best trade-offs between accuracy and model size.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-balance">Accuracy vs Latency Trade-off</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="latency"
                      name="Latency"
                      label={{ value: 'Latency (ms)', position: 'insideBottom', offset: -5 }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="accuracy"
                      name="Accuracy"
                      label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                      domain={[0.6, 1]}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Scatter
                      data={paretoFrontier.map(p => ({
                        accuracy: p.architecture.metrics.accuracy,
                        latency: p.architecture.metrics.latency,
                        isDominated: p.isDominated,
                      }))}
                      fill="hsl(var(--primary))"
                    >
                      {paretoFrontier.map((p, index) => (
                        <Cell
                          key={index}
                          fill={p.isDominated ? '#94a3b8' : '#10b981'}
                          opacity={p.isDominated ? 0.3 : 1}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture View Tab */}
          <TabsContent value="architecture" className="space-y-6">
            {selectedArchitecture && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Architecture Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="text-xl font-bold">{(selectedArchitecture.metrics.accuracy * 100).toFixed(2)}%</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Parameters</p>
                      <p className="text-xl font-bold">{(selectedArchitecture.metrics.parameters / 1e6).toFixed(2)}M</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Latency</p>
                      <p className="text-xl font-bold">{selectedArchitecture.metrics.latency.toFixed(1)}ms</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Training Time</p>
                      <p className="text-xl font-bold">{selectedArchitecture.metrics.trainingTime.toFixed(1)}min</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Layer Stack</h4>
                    <div className="space-y-2">
                      {selectedArchitecture.layers.map((layer, index) => (
                        <div key={layer.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <span className="text-2xl">{getLayerIcon(layer.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">{layer.type}</span>
                              {layer.activation && (
                                <Badge variant="secondary">{layer.activation}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {layer.units && `${layer.units} units`}
                              {layer.filters && `${layer.filters} filters, ${layer.kernelSize}x${layer.kernelSize} kernel`}
                              {layer.rate && `rate: ${layer.rate.toFixed(2)}`}
                            </p>
                          </div>
                          <Badge variant="outline">Layer {index + 1}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Connection Pattern</p>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      <span className="text-lg font-semibold capitalize">{selectedArchitecture.connections}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Evolution Tab */}
          <TabsContent value="evolution" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-balance">Evolution Progress</CardTitle>
                <CardDescription className="text-pretty">
                  Best fitness score across generations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={Array.from({ length: config.generations }, (_, i) => {
                      const genArchs = architectures.filter(a => a.generation === i);
                      const bestFitness = genArchs.length > 0
                        ? Math.max(...genArchs.map(a => a.fitness))
                        : 0;
                      return {
                        generation: i,
                        bestFitness,
                      };
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="generation"
                      label={{ value: 'Generation', position: 'insideBottom', offset: -5 }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      label={{ value: 'Best Fitness', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: 8 }} />
                    <Line
                      type="monotone"
                      dataKey="bestFitness"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Best Fitness"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-balance">Architecture Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Array.from({ length: config.generations }, (_, i) => ({
                      generation: i,
                      count: architectures.filter(a => a.generation === i).length,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="generation" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Architectures" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
