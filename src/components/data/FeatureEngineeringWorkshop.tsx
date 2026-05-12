import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { featureEngineeringService } from '@/services/featureEngineeringService';
import type { FeatureType, TransformationType } from '@/services/featureEngineeringService';
import { 
  DistributionVisualizer, 
  calculateStats,
} from '@/components/data/workshop/DistributionVisualizer';
import { StatisticsComparison } from '@/components/data/workshop/StatisticsComparison';
import { 
  TransformationSuggestionPanel,
} from '@/components/data/workshop/TransformationSuggestionPanel';
import { PolynomialFeaturesDemo } from '@/components/data/workshop/PolynomialFeaturesDemo';
import { InteractionFeaturesDemo } from '@/components/data/workshop/InteractionFeaturesDemo';
import { ImpactSimulator } from '@/components/data/workshop/ImpactSimulator';
import { WorkshopSummary } from '@/components/data/workshop/WorkshopSummary';
import type { 
  TransformationType as WorkshopTransformationType,
  PolynomialFeatureResult,
  InteractionFeatureResult,
  AppliedTransformation,
  ImpactSimulationResult,
} from '@/types/workshop';
import { 
  Wand2, 
  Info,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Zap,
  RotateCcw,
  Eye,
  Play,
  Target,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';

// Props for the enhanced workshop
interface FeatureEngineeringWorkshopProps {
  /** Optional data to use for transformations (if not provided, uses simulated data) */
  data?: string[][];
  /** Column information for the data */
  columnInfo?: { name: string; type: string }[];
  /** Callback when data is transformed */
  onDataTransformed?: (data: string[][], appliedTransformations: TransformationType[]) => void;
}

export function FeatureEngineeringWorkshop({
  data,
  columnInfo,
  onDataTransformed,
}: FeatureEngineeringWorkshopProps = {}) {
  const [selectedType, setSelectedType] = useState<FeatureType>('numerical');
  const [selectedTransformation, setSelectedTransformation] = useState<TransformationType | null>(null);
  const [appliedTransformations, setAppliedTransformations] = useState<TransformationType[]>([]);
  const [showEnhancedView, setShowEnhancedView] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [createdPolynomialFeatures, setCreatedPolynomialFeatures] = useState<PolynomialFeatureResult[]>([]);
  const [createdInteractionFeatures, setCreatedInteractionFeatures] = useState<InteractionFeatureResult[]>([]);
  const [workshopStartTime] = useState<number>(Date.now());
  const [simulationResult, setSimulationResult] = useState<ImpactSimulationResult | null>(null);
  const [completedTutorials] = useState<string[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);

  // Get transformations for the selected type
  const transformations = useMemo(() => {
    return featureEngineeringService.getSuggestionsForType(selectedType);
  }, [selectedType]);

  // Simulate transformation result
  const transformationResult = useMemo(() => {
    if (!selectedTransformation) return null;
    return featureEngineeringService.simulateTransformation(selectedType, selectedTransformation);
  }, [selectedType, selectedTransformation]);

  // Calculate enhanced statistics for the new visualizer
  const enhancedStats = useMemo(() => {
    if (!transformationResult) return null;
    
    const originalStats = calculateStats(transformationResult.originalDistribution);
    const transformedStats = calculateStats(transformationResult.transformedDistribution);
    
    return {
      original: originalStats,
      transformed: transformedStats,
    };
  }, [transformationResult]);

  // Generate sample feature data for the suggestion panel
  const sampleFeatureData = useMemo(() => {
    if (transformationResult) {
      return transformationResult.originalDistribution;
    }
    // Generate sample data based on feature type
    return featureEngineeringService.generateSampleData('skewed', 100);
  }, [transformationResult]);

  const recommendations = useMemo(() => {
    return featureEngineeringService.getRecommendations(selectedType);
  }, [selectedType]);

  const bestPractices = featureEngineeringService.getBestPractices();

  const handleSelectTransformation = useCallback((transformation: TransformationType) => {
    setSelectedTransformation(transformation);
    setPreviewMode(true);
  }, []);

  const handleApplyTransformation = useCallback(() => {
    if (!selectedTransformation) return;
    
    setAppliedTransformations(prev => {
      const newTransformations = [...prev, selectedTransformation];
      // Notify parent if callback provided
      if (onDataTransformed && data) {
        onDataTransformed(data, newTransformations);
      }
      return newTransformations;
    });
    
    const transformName = transformations.find(t => t.type === selectedTransformation)?.name;
    toast.success(`Applied ${transformName}`, {
      description: 'Transformation has been added to your pipeline.',
    });
    
    setPreviewMode(false);
  }, [selectedTransformation, transformations, onDataTransformed, data]);

  const handlePreviewTransformation = useCallback((transformation: TransformationType) => {
    setSelectedTransformation(transformation);
    setPreviewMode(true);
  }, []);

  const handleReset = useCallback(() => {
    setAppliedTransformations([]);
    setSelectedTransformation(null);
    setPreviewMode(false);
    setCreatedPolynomialFeatures([]);
    setCreatedInteractionFeatures([]);
    setSimulationResult(null);
    toast.success('Reset all transformations');
  }, []);

  const handleSimulationComplete = useCallback((result: ImpactSimulationResult) => {
    setSimulationResult(result);
    // Award badge for first simulation
    if (!earnedBadges.includes('first-simulation')) {
      setEarnedBadges(prev => [...prev, 'first-simulation']);
      toast.success('Badge earned: First Simulation! 🎯');
    }
  }, [earnedBadges]);

  // Calculate time spent in workshop
  const timeSpent = useMemo(() => {
    return Math.floor((Date.now() - workshopStartTime) / 1000);
  }, [workshopStartTime]);

  // Build applied transformations list for summary
  const appliedTransformationsList: AppliedTransformation[] = useMemo(() => {
    return appliedTransformations.map((type, index) => ({
      id: `transform-${index}`,
      type: type as WorkshopTransformationType,
      feature: `feature_${index}`,
      timestamp: new Date(Date.now() - (appliedTransformations.length - index) * 60000),
      performanceImpact: 0.02 + Math.random() * 0.05,
      importanceChange: 0.01 + Math.random() * 0.03,
    }));
  }, [appliedTransformations]);

  const handlePolynomialFeatureCreated = useCallback((result: PolynomialFeatureResult) => {
    setCreatedPolynomialFeatures(prev => [...prev, result]);
    toast.success(`Created polynomial feature: ${result.formula}`, {
      description: `R² improvement: +${(result.r2Improvement * 100).toFixed(1)}%`,
    });
  }, []);

  const handleInteractionFeatureCreated = useCallback((result: InteractionFeatureResult) => {
    setCreatedInteractionFeatures(prev => [...prev, result]);
    toast.success(`Created interaction feature: ${result.formula}`, {
      description: `Correlation: ${result.correlation?.toFixed(3)}`,
    });
  }, []);

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
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset All
            </Button>
            <Button 
              onClick={() => setShowEnhancedView(!showEnhancedView)} 
              variant="outline" 
              size="sm"
            >
              <Eye className="h-4 w-4 mr-1" />
              {showEnhancedView ? 'Classic View' : 'Enhanced View'}
            </Button>
            <Badge variant="secondary">
              {appliedTransformations.length + createdPolynomialFeatures.length + createdInteractionFeatures.length} features created
            </Badge>
            {previewMode && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Preview Mode
              </Badge>
            )}
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
              onClick={() => {
                setSelectedType('numerical');
                setSelectedTransformation(null);
              }}
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
              onClick={() => {
                setSelectedType('categorical');
                setSelectedTransformation(null);
              }}
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
              onClick={() => {
                setSelectedType('text');
                setSelectedTransformation(null);
              }}
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="transformations">Transformations</TabsTrigger>
          <TabsTrigger value="polynomial">Polynomial</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="impact">
            <Target className="h-4 w-4 mr-1" />
            Impact
          </TabsTrigger>
          <TabsTrigger value="summary">
            <Trophy className="h-4 w-4 mr-1" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Transformations Tab */}
        <TabsContent value="transformations" className="space-y-6">
          {showEnhancedView ? (
            // Enhanced View with new components
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: Transformation Suggestions */}
              <TransformationSuggestionPanel
                featureType={selectedType}
                featureData={sampleFeatureData}
                featureName={`Sample ${selectedType} feature`}
                appliedTransformations={appliedTransformations as WorkshopTransformationType[]}
                selectedTransformation={selectedTransformation as WorkshopTransformationType | null}
                onSelect={(t) => handleSelectTransformation(t as TransformationType)}
                onApply={(t) => {
                  setSelectedTransformation(t as TransformationType);
                  handleApplyTransformation();
                }}
                onPreview={(t) => handlePreviewTransformation(t as TransformationType)}
              />

              {/* Right: Visualization */}
              <div className="space-y-4">
                {transformationResult && enhancedStats ? (
                  <>
                    {/* Distribution Visualizer */}
                    <DistributionVisualizer
                      originalData={transformationResult.originalDistribution}
                      transformedData={transformationResult.transformedDistribution}
                      transformationType={selectedTransformation as WorkshopTransformationType}
                      featureName={`Sample ${selectedType} feature`}
                      showAnimation={true}
                    />

                    {/* Statistics Comparison */}
                    <StatisticsComparison
                      originalStats={enhancedStats.original}
                      transformedStats={enhancedStats.transformed}
                      transformationType={selectedTransformation as WorkshopTransformationType}
                      featureName={`Sample ${selectedType} feature`}
                      showInterpretation={true}
                    />

                    {/* Impact Metrics */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Expected Impact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
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

                        {/* Apply Button */}
                        <Button 
                          onClick={handleApplyTransformation} 
                          className="w-full"
                          disabled={appliedTransformations.includes(selectedTransformation!)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {appliedTransformations.includes(selectedTransformation!) 
                            ? 'Already Applied' 
                            : 'Apply Transformation'}
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="h-full flex items-center justify-center min-h-[400px]">
                    <CardContent className="text-center">
                      <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Select a Transformation</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Choose a transformation from the panel on the left to see a preview 
                        of how it will affect your data distribution.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            // Classic View (original implementation)
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
                      {/* Use the new DistributionVisualizer */}
                      <DistributionVisualizer
                        originalData={transformationResult.originalDistribution}
                        transformedData={transformationResult.transformedDistribution}
                        transformationType={selectedTransformation as WorkshopTransformationType}
                        showAnimation={false}
                      />

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
          )}

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
          <PolynomialFeaturesDemo
            featureData={sampleFeatureData}
            featureName="sample_feature"
            onCreateFeature={handlePolynomialFeatureCreated}
            showAnimation={true}
          />
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-6">
          <InteractionFeaturesDemo
            onCreateFeature={handleInteractionFeatureCreated}
            showAnimation={true}
          />
        </TabsContent>

        {/* Impact Simulator Tab */}
        <TabsContent value="impact" className="space-y-6">
          <ImpactSimulator
            appliedTransformations={appliedTransformationsList}
            modelType="regression"
            showAnimation={true}
            onSimulationComplete={handleSimulationComplete}
          />
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <WorkshopSummary
            appliedTransformations={appliedTransformationsList}
            timeSpent={timeSpent}
            completedTutorials={completedTutorials}
            earnedBadges={earnedBadges}
            initialPerformance={simulationResult?.originalMetrics.r2 || 0.45}
            finalPerformance={simulationResult?.transformedMetrics.r2 || 0.65}
            onExportPipeline={() => {
              toast.success('Pipeline exported!', {
                description: 'Your transformation pipeline has been saved.',
              });
            }}
            onProceedToTraining={() => {
              toast.info('Proceeding to training...', {
                description: 'Your transformations will be applied to the training data.',
              });
            }}
            showAnimation={true}
          />
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
