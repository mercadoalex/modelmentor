import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { featureEngineeringService } from '@/services/featureEngineeringService';
import { transformationAnalysisService } from '@/services/transformationAnalysisService';
import { TransformationExplanationDialog } from './TransformationExplanationDialog';
import type { EngineeringSuggestion, TransformationResult } from '@/services/featureEngineeringService';
import type { TransformationPreview } from '@/services/transformationAnalysisService';
import type { ColumnInfo } from '@/services/dataValidationService';
import { Wand2, Plus, TrendingUp, Grid3x3, Binary, Info, CheckCircle2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureEngineeringPanelProps {
  data: string[][];
  columnInfo: ColumnInfo[];
  targetColumn?: string;
  onFeaturesEngineered?: (transformedData: string[][], newColumns: string[]) => void;
}

export function FeatureEngineeringPanel({ data, columnInfo, targetColumn, onFeaturesEngineered }: FeatureEngineeringPanelProps) {
  const [suggestions, setSuggestions] = useState<EngineeringSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastTransformation, setLastTransformation] = useState<TransformationResult | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<TransformationPreview | null>(null);

  useEffect(() => {
    generateSuggestions();
  }, [data, columnInfo]);

  const generateSuggestions = () => {
    setIsGenerating(true);
    try {
      const newSuggestions = featureEngineeringService.generateSuggestions(data, columnInfo);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast.error('Failed to generate feature engineering suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionToggle = (suggestionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSuggestions);
    if (checked) {
      newSelected.add(suggestionId);
    } else {
      newSelected.delete(suggestionId);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map(s => s.id)));
  };

  const handleSelectRecommended = () => {
    const recommended = suggestions.filter(s => {
      const impactValue = s.impact || s.expectedImpact;
      return impactValue >= 5; // High or medium impact (>= 5)
    });
    setSelectedSuggestions(new Set(recommended.map(s => s.id)));
  };

  const handleClearAll = () => {
    setSelectedSuggestions(new Set());
  };

  const handleApplyTransformations = () => {
    if (selectedSuggestions.size === 0) {
      toast.error('Please select at least one transformation');
      return;
    }

    try {
      const selectedSuggestionObjects = suggestions.filter(s => selectedSuggestions.has(s.id));
      const result = featureEngineeringService.applyMultipleSuggestions(data, selectedSuggestionObjects);
      
      setLastTransformation(result);
      
      if (onFeaturesEngineered && result.data) {
        onFeaturesEngineered(result.data, result.newColumns || []);
      }
      
      toast.success(
        `Applied ${result.appliedSuggestions?.length || 0} transformations, created ${result.newColumns?.length || 0} new features`
      );
    } catch (error) {
      console.error('Failed to apply transformations:', error);
      toast.error('Failed to apply transformations');
    }
  };

  const handlePreviewTransformation = (suggestion: EngineeringSuggestion) => {
    try {
      const preview = transformationAnalysisService.generatePreview(
        data,
        columnInfo,
        suggestion,
        targetColumn
      );
      setCurrentPreview(preview);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const getSuggestionIcon = (type: EngineeringSuggestion['type']) => {
    switch (type) {
      case 'polynomial_2':
      case 'polynomial_3':
        return <TrendingUp className="h-5 w-5" />;
      case 'interaction':
        return <Plus className="h-5 w-5" />;
      case 'one_hot':
        return <Binary className="h-5 w-5" />;
      default:
        return <Grid3x3 className="h-5 w-5" />;
    }
  };

  const getImpactBadge = (impact: EngineeringSuggestion['impact']) => {
    const impactValue = typeof impact === 'number' ? (impact > 7 ? 'high' : impact > 4 ? 'medium' : 'low') : impact;
    switch (impactValue) {
      case 'high':
        return <Badge className="bg-green-500">High Impact</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Impact</Badge>;
      case 'low':
        return <Badge variant="outline">Low Impact</Badge>;
    }
  };

  const totalNewFeatures = Array.from(selectedSuggestions)
    .map(id => suggestions.find(s => s.id === id))
    .filter(Boolean)
    .reduce((sum, s) => sum + (s?.newFeatureCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Automated Feature Engineering
          </CardTitle>
          <CardDescription className="text-pretty">
            Create new features through transformations to improve model performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-medium">What is Feature Engineering?</p>
              <p>
                Feature engineering creates new features from existing ones to help your model learn better patterns.
                Think of it like giving your model a magnifying glass — transformations reveal hidden patterns in your data
                that the raw numbers alone might not show.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                💡 <strong>Tip:</strong> Start with "Recommended" transformations — they're chosen based on your data's characteristics.
                Each transformation is explained below so you can learn what it does and why it helps.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Suggested Transformations</CardTitle>
            <CardDescription className="text-pretty">
              {suggestions.length} transformation{suggestions.length !== 1 ? 's' : ''} available based on your data.
              Each one is explained below — hover or read to learn what it does.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSelectRecommended} variant="outline" size="sm">
                Select Recommended
              </Button>
              <Button onClick={handleSelectAll} variant="outline" size="sm">
                Select All
              </Button>
              <Button onClick={handleClearAll} variant="outline" size="sm">
                Clear All
              </Button>
            </div>

            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={suggestion.id}
                    checked={selectedSuggestions.has(suggestion.id)}
                    onCheckedChange={(checked) => handleSuggestionToggle(suggestion.id, checked as boolean)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={suggestion.id} className="cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        {getSuggestionIcon(suggestion.type)}
                        <span className="font-medium">{suggestion.title}</span>
                        {getImpactBadge(suggestion.impact)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.description}
                      </p>
                      {/* Educational explanation of why this transformation helps */}
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                        💡 <strong>Why this helps:</strong>{' '}
                        {suggestion.type === 'normalize' && 'Puts all features on the same scale (0-1) so the model treats them equally. Without this, features with bigger numbers dominate.'}
                        {suggestion.type === 'standardize' && 'Centers data around zero with equal spread. Helps models that assume data is normally distributed (like neural networks).'}
                        {suggestion.type === 'log' && 'Compresses large values and spreads small ones. Great for skewed data like prices or populations where outliers are common.'}
                        {suggestion.type === 'sqrt' && 'Similar to log but gentler. Reduces the impact of large values while keeping the data positive.'}
                        {suggestion.type === 'square' && 'Amplifies differences between values. Useful when larger values should have proportionally more influence.'}
                        {suggestion.type === 'one_hot' && 'Converts categories (like "red", "blue") into separate yes/no columns. Models need numbers, not text!'}
                        {suggestion.type === 'label_encode' && 'Converts categories to numbers (0, 1, 2...). Simpler than one-hot but implies an order between categories.'}
                        {suggestion.type === 'frequency_encode' && 'Replaces categories with how often they appear. Rare categories get small numbers, common ones get large numbers.'}
                        {suggestion.type === 'target_encode' && 'Replaces categories with the average target value for that category. Directly captures the relationship to what you\'re predicting.'}
                        {suggestion.type === 'polynomial_2' && 'Creates squared versions of features to capture curved relationships that a straight line would miss.'}
                        {suggestion.type === 'polynomial_3' && 'Creates cubed versions for even more complex curves. Use sparingly — can cause overfitting with small datasets.'}
                        {suggestion.type === 'interaction' && 'Multiplies features together to capture combined effects. Example: "size × location" might predict price better than either alone.'}
                        {suggestion.type === 'tfidf' && 'Measures how important a word is in a document relative to all documents. Common words get low scores, distinctive words get high scores.'}
                        {suggestion.type === 'word_count' && 'Counts the number of words in text. Simple but effective — longer reviews might indicate stronger opinions.'}
                        {suggestion.type === 'char_count' && 'Counts characters in text. Can reveal patterns like spam messages being shorter or longer than normal ones.'}
                      </p>
                      {suggestion.example && (
                        <div className="bg-muted p-2 rounded text-xs font-mono">
                          Example: {suggestion.example}
                        </div>
                      )}
                    </Label>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Badge variant="outline">
                      +{suggestion.newFeatureCount} feature{suggestion.newFeatureCount !== 1 ? 's' : ''}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewTransformation(suggestion)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Selected Transformations</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSuggestions.size} transformation{selectedSuggestions.size !== 1 ? 's' : ''} selected
                    {totalNewFeatures > 0 && ` • Will create ${totalNewFeatures} new features`}
                  </p>
                </div>
                <Button
                  onClick={handleApplyTransformations}
                  disabled={selectedSuggestions.size === 0}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Apply Transformations
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Suggestions */}
      {suggestions.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No feature engineering suggestions available for this dataset
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Transformation Result */}
      {lastTransformation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Transformation Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transformations Applied</p>
                  <p className="text-2xl font-semibold">{lastTransformation.appliedSuggestions?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Features Created</p>
                  <p className="text-2xl font-semibold">{lastTransformation.newColumns?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Features</p>
                  <p className="text-2xl font-semibold">{lastTransformation.data?.[0]?.length || 0}</p>
                </div>
              </div>

              {lastTransformation.newColumns && lastTransformation.newColumns.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium">New Features:</p>
                  <div className="flex flex-wrap gap-2">
                    {lastTransformation.newColumns.map((col, index) => (
                      <Badge key={index} variant="secondary">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <TransformationExplanationDialog
        preview={currentPreview}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
      />
    </div>
  );
}
