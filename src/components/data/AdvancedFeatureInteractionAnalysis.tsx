import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { featureInteractionService } from '@/services/featureInteractionService';
import type { FeatureInteraction } from '@/services/featureInteractionService';
import { 
  Network, 
  TrendingUp,
  Info,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

export function AdvancedFeatureInteractionAnalysis() {
  const [selectedInteractions, setSelectedInteractions] = useState<string[]>([]);
  const [strengthThreshold, setStrengthThreshold] = useState(0.5);
  const [topK, setTopK] = useState(10);
  const [selectedType, setSelectedType] = useState<FeatureInteraction['interactionType'] | 'all'>('all');

  // Generate sample features
  const features = useMemo(() => {
    return featureInteractionService.generateSampleFeatures();
  }, []);

  // Calculate all interactions
  const allInteractions = useMemo(() => {
    return featureInteractionService.calculatePairwiseInteractions(features);
  }, [features]);

  // Create interaction matrix
  const interactionMatrix = useMemo(() => {
    return featureInteractionService.createInteractionMatrix(features);
  }, [features]);

  // Filter interactions
  const filteredInteractions = useMemo(() => {
    let filtered = allInteractions;
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = featureInteractionService.filterByType(filtered, selectedType);
    }
    
    // Filter by strength
    filtered = featureInteractionService.filterByStrength(filtered, strengthThreshold);
    
    // Get top K
    return featureInteractionService.getTopKInteractions(filtered, topK);
  }, [allInteractions, selectedType, strengthThreshold, topK]);

  // Analyze interactions
  const analysis = useMemo(() => {
    return featureInteractionService.analyzeInteractions(allInteractions);
  }, [allInteractions]);

  // Get selected interaction objects
  const selectedInteractionObjects = useMemo(() => {
    return filteredInteractions.filter(i => 
      selectedInteractions.includes(`${i.feature1}-${i.feature2}-${i.interactionType}`)
    );
  }, [filteredInteractions, selectedInteractions]);

  // Create features result
  const creationResult = useMemo(() => {
    if (selectedInteractionObjects.length === 0) return null;
    return featureInteractionService.createInteractionFeatures(selectedInteractionObjects);
  }, [selectedInteractionObjects]);

  const typeExplanations = featureInteractionService.getInteractionTypeExplanations();
  const bestPractices = featureInteractionService.getBestPractices();
  const featureRecommendations = featureInteractionService.getRecommendationsByFeatureTypes(features);

  const handleInteractionToggle = (interaction: FeatureInteraction) => {
    const key = `${interaction.feature1}-${interaction.feature2}-${interaction.interactionType}`;
    setSelectedInteractions(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleSelectTop5 = () => {
    const top5 = filteredInteractions.slice(0, 5).map(i => 
      `${i.feature1}-${i.feature2}-${i.interactionType}`
    );
    setSelectedInteractions(top5);
    toast.success('Selected top 5 interactions');
  };

  const handleClearSelection = () => {
    setSelectedInteractions([]);
    toast.success('Cleared selection');
  };

  const handleCreateFeatures = () => {
    if (creationResult) {
      toast.success(`Created ${creationResult.newFeatures.length} interaction features`);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.7) return 'bg-green-500';
    if (strength >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 0.7) return 'text-green-600';
    if (importance >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Network className="h-6 w-6" />
            Advanced Feature Interaction Analysis
          </CardTitle>
          <CardDescription className="text-pretty">
            Discover and create powerful feature interactions to improve model performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSelectTop5} variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Select Top 5
            </Button>
            <Button onClick={handleClearSelection} variant="outline" size="sm">
              Clear Selection
            </Button>
            {creationResult && (
              <Button onClick={handleCreateFeatures} size="sm">
                Create {creationResult.newFeatures.length} Features
              </Button>
            )}
            <Badge variant="secondary">
              {selectedInteractions.length} interactions selected
            </Badge>
            {creationResult && (
              <Badge variant="default">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{(creationResult.expectedImprovement * 100).toFixed(1)}% expected
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Interaction Analysis Summary</CardTitle>
          <CardDescription className="text-pretty">
            Overview of feature interaction patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Interactions</p>
              <p className="text-2xl font-bold">{analysis.totalInteractions}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Strong Interactions</p>
              <p className="text-2xl font-bold text-green-600">{analysis.strongInteractions}</p>
              <p className="text-xs text-muted-foreground mt-1">Strength &gt; 0.7</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Average Strength</p>
              <p className="text-2xl font-bold">{(analysis.averageStrength * 100).toFixed(0)}%</p>
            </div>
          </div>

          {analysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommendations</h4>
              {analysis.recommendations.map((rec, index) => (
                <Alert key={index}>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>{rec}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Interactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interaction Type Filter */}
          <div className="space-y-3">
            <span className="font-medium text-sm">Interaction Type</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                All Types
              </Button>
              {(Object.keys(typeExplanations) as FeatureInteraction['interactionType'][]).map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {typeExplanations[type].name}
                </Button>
              ))}
            </div>
          </div>

          {/* Strength Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Minimum Strength</span>
              <span className="text-sm font-mono">{strengthThreshold.toFixed(2)}</span>
            </div>
            <Slider
              value={[strengthThreshold]}
              onValueChange={(value) => setStrengthThreshold(value[0])}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Only show interactions with strength above this threshold
            </p>
          </div>

          {/* Top K */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Show Top K Interactions</span>
              <span className="text-sm font-mono">{topK}</span>
            </div>
            <Slider
              value={[topK]}
              onValueChange={(value) => setTopK(value[0])}
              min={5}
              max={50}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Display the top K most important interactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Interaction Strength Heatmap</CardTitle>
          <CardDescription className="text-pretty">
            Visual representation of feature interaction strengths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 sticky left-0 bg-background">Feature</th>
                  {features.map(f => (
                    <th key={f} className="text-center p-2 min-w-24">
                      <div className="transform -rotate-45 origin-left whitespace-nowrap">
                        {f}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, i) => (
                  <tr key={feature}>
                    <td className="font-medium p-2 sticky left-0 bg-background">{feature}</td>
                    {features.map((_, j) => {
                      const strength = interactionMatrix.matrix[i][j];
                      return (
                        <td 
                          key={j} 
                          className="text-center p-2"
                          style={{
                            backgroundColor: i === j ? 'transparent' : 
                              `rgba(59, 130, 246, ${strength})`,
                          }}
                        >
                          {i === j ? '-' : (strength * 100).toFixed(0)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Darker colors indicate stronger interactions. Diagonal is empty (feature with itself).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Top Interactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Top Interactions</CardTitle>
          <CardDescription className="text-pretty">
            Select interactions to create new features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredInteractions.map((interaction, index) => {
            const key = `${interaction.feature1}-${interaction.feature2}-${interaction.interactionType}`;
            const isSelected = selectedInteractions.includes(key);
            
            return (
              <div
                key={key}
                className={`p-4 border rounded-lg ${isSelected ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleInteractionToggle(interaction)}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{interaction.example}</span>
                        <Badge variant="outline" className="text-xs">
                          {typeExplanations[interaction.interactionType].name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {interaction.feature1} and {interaction.feature2}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Strength</p>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getStrengthColor(interaction.strength)}`} />
                      <span className="text-sm font-medium">{(interaction.strength * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Importance</p>
                    <span className={`text-sm font-bold ${getImportanceColor(interaction.importance)}`}>
                      {(interaction.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Impact</p>
                    <span className="text-sm font-bold text-green-600">
                      +{(interaction.performanceImpact * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredInteractions.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No interactions match the current filters. Try lowering the strength threshold or changing the interaction type.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Creation Result */}
      {creationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Feature Creation Preview</CardTitle>
            <CardDescription className="text-pretty">
              New features that will be created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">New Features</p>
                <p className="text-2xl font-bold">{creationResult.newFeatures.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Expected Improvement</p>
                <p className="text-2xl font-bold text-green-600">
                  +{(creationResult.expectedImprovement * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Features to Create</h4>
              <div className="flex flex-wrap gap-2">
                {creationResult.newFeatures.map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {creationResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recommendations</h4>
                {creationResult.recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interaction Type Explanations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Interaction Types</CardTitle>
          <CardDescription className="text-pretty">
            Understanding different types of feature interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="multiply">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
              {(Object.keys(typeExplanations) as FeatureInteraction['interactionType'][]).map((type) => (
                <TabsTrigger key={type} value={type}>
                  {typeExplanations[type].name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {(Object.keys(typeExplanations) as FeatureInteraction['interactionType'][]).map((type) => {
              const exp = typeExplanations[type];
              return (
                <TabsContent key={type} value={type} className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{exp.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{exp.description}</p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">When to use: </span>
                        <span className="text-sm text-muted-foreground">{exp.whenToUse}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Example: </span>
                        <span className="text-sm font-mono">{exp.example}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Feature-based Recommendations */}
      {featureRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Smart Recommendations</CardTitle>
            <CardDescription className="text-pretty">
              Based on your feature types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {featureRecommendations.map((rec, index) => (
              <Alert key={index}>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>{rec}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

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
