import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ensembleService } from '@/services/ensembleService';
import type { EnsembleMethod, ModelPrediction } from '@/services/ensembleService';
import { 
  Users, 
  TrendingUp,
  Info,
  Lightbulb,
  CheckCircle2,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

export function ModelEnsembleSystem() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<EnsembleMethod>('voting_hard');

  // Generate sample data
  const { models: allModels, trueLabels } = useMemo(() => {
    return ensembleService.generateModelPredictions(100, 5);
  }, []);

  // Filter selected models
  const activeModels = useMemo(() => {
    if (selectedModels.length === 0) return allModels.slice(0, 3);
    return allModels.filter(m => selectedModels.includes(m.modelName));
  }, [allModels, selectedModels]);

  // Create ensemble
  const ensembleResult = useMemo(() => {
    if (activeModels.length < 2) return null;
    return ensembleService.createEnsemble(activeModels, trueLabels, selectedMethod);
  }, [activeModels, trueLabels, selectedMethod]);

  // Calculate diversity
  const diversity = useMemo(() => {
    if (activeModels.length < 2) return null;
    return ensembleService.calculateDiversity(activeModels);
  }, [activeModels]);

  // Get recommendations
  const recommendations = useMemo(() => {
    if (activeModels.length < 2) return [];
    return ensembleService.getRecommendations(activeModels, trueLabels);
  }, [activeModels, trueLabels]);

  // Analyze potential
  const potential = useMemo(() => {
    if (activeModels.length < 2) return null;
    return ensembleService.analyzeEnsemblePotential(activeModels);
  }, [activeModels]);

  const explanations = ensembleService.getMethodExplanations();
  const bestPractices = ensembleService.getBestPractices();

  const handleModelToggle = (modelName: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelName)) {
        return prev.filter(m => m !== modelName);
      } else {
        return [...prev, modelName];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedModels(allModels.map(m => m.modelName));
    toast.success('Selected all models');
  };

  const handleClearAll = () => {
    setSelectedModels([]);
    toast.success('Cleared selection');
  };

  const handleApplyRecommendation = (method: EnsembleMethod) => {
    setSelectedMethod(method);
    toast.success(`Applied ${explanations[method].name}`);
  };

  // Prepare comparison data
  const comparisonData = [
    ...activeModels.map(m => ({
      name: m.modelName,
      accuracy: m.accuracy * 100,
      type: 'Base Model',
    })),
    ...(ensembleResult ? [{
      name: 'Ensemble',
      accuracy: ensembleResult.accuracy * 100,
      type: 'Ensemble',
    }] : []),
  ];

  // Prepare diversity heatmap data
  const diversityData = diversity ? activeModels.map((model, i) => ({
    model: model.modelName,
    ...Object.fromEntries(
      activeModels.map((m, j) => [m.modelName, diversity.pairwiseDiversity[i][j]])
    ),
  })) : [];

  const currentExplanation = explanations[selectedMethod];

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Users className="h-6 w-6" />
            Model Ensemble System
          </CardTitle>
          <CardDescription className="text-pretty">
            Combine multiple models to improve prediction accuracy and robustness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSelectAll} variant="outline" size="sm">
              Select All Models
            </Button>
            <Button onClick={handleClearAll} variant="outline" size="sm">
              Clear Selection
            </Button>
            <Badge variant="secondary">
              {activeModels.length} models selected
            </Badge>
            {ensembleResult && (
              <Badge variant="default">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{(ensembleResult.improvement * 100).toFixed(1)}% improvement
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ensemble Potential */}
      {potential && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Ensemble Potential</CardTitle>
            <CardDescription className="text-pretty">
              Analysis of how much improvement you can expect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Potential Level</p>
                <p className={`text-2xl font-bold ${getPotentialColor(potential.potential)}`}>
                  {potential.potential.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Expected Improvement</p>
                <p className="text-2xl font-bold text-green-600">
                  +{(potential.expectedImprovement * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {potential.reasoning}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Model Selection */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Select Base Models</CardTitle>
            <CardDescription className="text-pretty">
              Choose models to include in the ensemble
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {allModels.map((model) => (
              <div
                key={model.modelName}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedModels.length === 0 ? 
                      allModels.slice(0, 3).some(m => m.modelName === model.modelName) :
                      selectedModels.includes(model.modelName)
                    }
                    onCheckedChange={() => handleModelToggle(model.modelName)}
                  />
                  <div>
                    <p className="font-medium">{model.modelName}</p>
                    <p className="text-xs text-muted-foreground">
                      Confidence: {(model.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{(model.accuracy * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ensemble Method Selection */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Ensemble Method</CardTitle>
            <CardDescription className="text-pretty">
              Choose how to combine model predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(explanations) as EnsembleMethod[]).map((method) => {
              const exp = explanations[method];
              return (
                <Button
                  key={method}
                  variant={selectedMethod === method ? 'default' : 'outline'}
                  className="w-full h-auto flex-col items-start p-4 text-left"
                  onClick={() => setSelectedMethod(method)}
                >
                  <span className="font-semibold mb-1">{exp.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {exp.description}
                  </span>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison */}
      {ensembleResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Performance Comparison</CardTitle>
            <CardDescription className="text-pretty">
              Compare ensemble performance against individual models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                    domain={[0, 100]}
                  />
                  <Tooltip />
                  <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === 'Ensemble' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Best Base Model</p>
                <p className="text-xl font-bold">
                  {(Math.max(...activeModels.map(m => m.accuracy)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ensemble Accuracy</p>
                <p className="text-xl font-bold text-primary">
                  {(ensembleResult.accuracy * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Improvement</p>
                <p className="text-xl font-bold text-green-600">
                  +{(ensembleResult.improvement * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Diversity Score</p>
                <p className="text-xl font-bold">
                  {(ensembleResult.diversity * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diversity Analysis */}
      {diversity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Model Diversity Analysis</CardTitle>
            <CardDescription className="text-pretty">
              How different are the models from each other?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Average Diversity</p>
                <p className="text-2xl font-bold">{(diversity.averageDiversity * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher is better for ensembles
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Disagreement Rate</p>
                <p className="text-2xl font-bold">{(diversity.disagreementRate * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage of samples where models disagree
                </p>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Diversity is key:</strong> Models that make different errors can correct each other. 
                Aim for diversity &gt; 20% for effective ensembles.
              </AlertDescription>
            </Alert>

            {/* Pairwise Diversity Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Model</th>
                    {activeModels.map(m => (
                      <th key={m.modelName} className="text-center p-2">{m.modelName.split(' ')[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeModels.map((model, i) => (
                    <tr key={model.modelName}>
                      <td className="font-medium p-2">{model.modelName.split(' ')[0]}</td>
                      {activeModels.map((_, j) => (
                        <td 
                          key={j} 
                          className="text-center p-2"
                          style={{
                            backgroundColor: i === j ? 'transparent' : 
                              `rgba(var(--primary-rgb, 0, 0, 0), ${diversity.pairwiseDiversity[i][j]})`,
                          }}
                        >
                          {i === j ? '-' : (diversity.pairwiseDiversity[i][j] * 100).toFixed(0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance flex items-center gap-2">
              <Target className="h-5 w-5" />
              Ensemble Recommendations
            </CardTitle>
            <CardDescription className="text-pretty">
              Suggested ensemble methods based on your models
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{explanations[rec.method].name}</span>
                    <Badge variant={rec.confidence === 'high' ? 'default' : 'secondary'}>
                      {rec.confidence} confidence
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleApplyRecommendation(rec.method)}
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{rec.reasoning}</p>
                <p className="text-sm">
                  <strong>Expected improvement:</strong>{' '}
                  <span className="text-green-600">+{(rec.expectedImprovement * 100).toFixed(1)}%</span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Method Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">{currentExplanation.name}</CardTitle>
          <CardDescription className="text-pretty">
            {currentExplanation.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">How It Works</h4>
            <p className="text-sm text-muted-foreground">{currentExplanation.howItWorks}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
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
              <h4 className="font-semibold mb-2 flex items-center gap-2">
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
          </div>

          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Best for:</strong> {currentExplanation.bestFor}
            </AlertDescription>
          </Alert>
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
