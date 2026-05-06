import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { featureEngineeringService } from '@/services/featureEngineeringService';
import type { FeatureType, TransformationType } from '@/services/featureEngineeringService';
import { 
  Wand2, 
  TrendingUp, 
  Info,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Zap
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
  BarChart,
  Bar,
  Cell
} from 'recharts';

export function FeatureEngineeringWorkshop() {
  const [selectedType, setSelectedType] = useState<FeatureType>('numerical');
  const [selectedTransformation, setSelectedTransformation] = useState<TransformationType | null>(null);
  const [appliedTransformations, setAppliedTransformations] = useState<TransformationType[]>([]);

  const transformations = useMemo(() => {
    return featureEngineeringService.getSuggestionsForType(selectedType);
  }, [selectedType]);

  const transformationResult = useMemo(() => {
    if (!selectedTransformation) return null;
    return featureEngineeringService.simulateTransformation(selectedType, selectedTransformation);
  }, [selectedType, selectedTransformation]);

  const polynomialFeatures = useMemo(() => {
    return featureEngineeringService.generatePolynomialFeatures(
      ['feature_1', 'feature_2', 'feature_3'],
      2
    );
  }, []);

  const interactionFeatures = useMemo(() => {
    return featureEngineeringService.generateInteractionFeatures(
      ['age', 'income', 'experience', 'education']
    );
  }, []);

  const recommendations = useMemo(() => {
    return featureEngineeringService.getRecommendations(selectedType);
  }, [selectedType]);

  const bestPractices = featureEngineeringService.getBestPractices();

  const handleApplyTransformation = () => {
    if (!selectedTransformation) return;
    
    setAppliedTransformations(prev => [...prev, selectedTransformation]);
    toast.success(`Applied ${transformations.find(t => t.type === selectedTransformation)?.name}`);
  };

  const handleReset = () => {
    setAppliedTransformations([]);
    setSelectedTransformation(null);
    toast.success('Reset all transformations');
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'complex': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  // Prepare distribution data for visualization
  const distributionData = useMemo(() => {
    if (!transformationResult) return [];
    
    const bins = 20;
    const originalHist = createHistogram(transformationResult.originalDistribution, bins);
    const transformedHist = createHistogram(transformationResult.transformedDistribution, bins);
    
    return originalHist.map((count, index) => ({
      bin: index,
      original: count,
      transformed: transformedHist[index],
    }));
  }, [transformationResult]);

  function createHistogram(data: number[], bins: number): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / bins;
    const histogram = new Array(bins).fill(0);
    
    data.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      histogram[binIndex]++;
    });
    
    return histogram;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Wand2 className="h-6 w-6" />
            Feature Engineering Workshop
          </CardTitle>
          <CardDescription className="text-pretty">
            Transform your features to improve model performance through data preparation techniques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              Reset All
            </Button>
            <Badge variant="secondary">
              {appliedTransformations.length} transformations applied
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Feature Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Select Feature Type</CardTitle>
          <CardDescription className="text-pretty">
            Choose the type of feature you want to transform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant={selectedType === 'numerical' ? 'default' : 'outline'}
              className="h-auto flex-col items-start p-4"
              onClick={() => setSelectedType('numerical')}
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="font-semibold">Numerical</span>
              <span className="text-xs text-muted-foreground mt-1">
                Continuous values, measurements
              </span>
            </Button>
            <Button
              variant={selectedType === 'categorical' ? 'default' : 'outline'}
              className="h-auto flex-col items-start p-4"
              onClick={() => setSelectedType('categorical')}
            >
              <Zap className="h-6 w-6 mb-2" />
              <span className="font-semibold">Categorical</span>
              <span className="text-xs text-muted-foreground mt-1">
                Categories, labels, groups
              </span>
            </Button>
            <Button
              variant={selectedType === 'text' ? 'default' : 'outline'}
              className="h-auto flex-col items-start p-4"
              onClick={() => setSelectedType('text')}
            >
              <Info className="h-6 w-6 mb-2" />
              <span className="font-semibold">Text</span>
              <span className="text-xs text-muted-foreground mt-1">
                Text data, documents, strings
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transformations">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transformations">Transformations</TabsTrigger>
          <TabsTrigger value="polynomial">Polynomial Features</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>

        {/* Transformations Tab */}
        <TabsContent value="transformations" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Transformation List */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-balance">Available Transformations</CardTitle>
                <CardDescription className="text-pretty">
                  Select a transformation to see its effect
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {transformations.map((transformation) => (
                  <div
                    key={transformation.type}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTransformation === transformation.type
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTransformation(transformation.type)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold">{transformation.name}</span>
                      <Badge variant={getImpactColor(transformation.expectedImpact) as any}>
                        {transformation.expectedImpact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {transformation.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={getComplexityColor(transformation.complexity)}>
                        {transformation.complexity}
                      </span>
                      {appliedTransformations.includes(transformation.type) && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Transformation Preview */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-balance">Transformation Preview</CardTitle>
                <CardDescription className="text-pretty">
                  See how the transformation affects your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {transformationResult ? (
                  <>
                    {/* Distribution Comparison */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="bin" label={{ value: 'Value Range', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Bar dataKey="original" fill="hsl(var(--muted-foreground))" name="Original" />
                          <Bar dataKey="transformed" fill="hsl(var(--primary))" name="Transformed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Statistics Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Original Statistics</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Mean:</span>
                            <span className="font-mono">{transformationResult.originalStats.mean.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Std:</span>
                            <span className="font-mono">{transformationResult.originalStats.std.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Min:</span>
                            <span className="font-mono">{transformationResult.originalStats.min.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max:</span>
                            <span className="font-mono">{transformationResult.originalStats.max.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Transformed Statistics</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Mean:</span>
                            <span className="font-mono">{transformationResult.transformedStats.mean.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Std:</span>
                            <span className="font-mono">{transformationResult.transformedStats.std.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Min:</span>
                            <span className="font-mono">{transformationResult.transformedStats.min.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max:</span>
                            <span className="font-mono">{transformationResult.transformedStats.max.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Impact Metrics */}
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Feature Importance Change</span>
                          <span className="text-lg font-bold text-green-600">
                            +{(transformationResult.importanceChange * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expected increase in feature importance
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Model Performance Impact</span>
                          <span className="text-lg font-bold text-green-600">
                            +{(transformationResult.performanceImpact * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expected improvement in model accuracy
                        </div>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <Button onClick={handleApplyTransformation} className="w-full">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Apply Transformation
                    </Button>
                  </>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Select a transformation from the list to see its preview
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommendations for {selectedType} Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Polynomial Features Tab */}
        <TabsContent value="polynomial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Polynomial Features</CardTitle>
              <CardDescription className="text-pretty">
                Create polynomial terms to capture non-linear relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Polynomial features can capture curves and non-linear patterns in your data
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {polynomialFeatures.slice(0, 6).map((poly, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{poly.example}</span>
                      <Badge variant={poly.importance > 0.25 ? 'default' : 'secondary'}>
                        Importance: {(poly.importance * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Degree {poly.degree} polynomial of {poly.feature}
                    </p>
                  </div>
                ))}
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> Start with degree 2 polynomials. Higher degrees can lead to overfitting.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Feature Interactions</CardTitle>
              <CardDescription className="text-pretty">
                Combine features to capture relationships between variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Interaction features can reveal how features work together to influence predictions
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {interactionFeatures.map((interaction, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{interaction.example}</span>
                      <Badge variant={interaction.importance > 0.3 ? 'default' : 'secondary'}>
                        Importance: {(interaction.importance * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {interaction.interactionType} interaction between {interaction.feature1} and {interaction.feature2}
                    </p>
                  </div>
                ))}
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> Multiplication interactions often work well for capturing synergies between features.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Best Practices</CardTitle>
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
