import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Wand2, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  BarChart3,
  Type,
  Play,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  FeatureType, 
  TransformationType, 
  TransformationSuggestion,
  ImpactLevel,
  ComplexityLevel,
  ApplicabilityStatus,
} from '@/types/workshop';

interface TransformationSuggestionPanelProps {
  featureType: FeatureType;
  featureData: number[] | string[];
  featureName: string;
  appliedTransformations?: TransformationType[];
  onSelect: (transformation: TransformationType) => void;
  onApply: (transformation: TransformationType) => void;
  onPreview?: (transformation: TransformationType) => void;
  selectedTransformation?: TransformationType | null;
  compact?: boolean;
}

// Transformation definitions with metadata
const TRANSFORMATION_DEFINITIONS: Record<TransformationType, {
  name: string;
  description: string;
  applicableTo: FeatureType[];
  expectedImpact: ImpactLevel;
  complexity: ComplexityLevel;
  formula?: string;
  useCases: string[];
  antiPatterns: string[];
}> = {
  // Numerical transformations
  log: {
    name: 'Log Transform',
    description: 'Apply natural logarithm to compress large values and reduce right skewness.',
    applicableTo: ['numerical'],
    expectedImpact: 'high',
    complexity: 'simple',
    formula: 'x\' = log(x)',
    useCases: [
      'Right-skewed distributions (e.g., income, prices)',
      'Data spanning multiple orders of magnitude',
      'Multiplicative relationships',
    ],
    antiPatterns: [
      'Data with zero or negative values',
      'Already normally distributed data',
      'Left-skewed distributions',
    ],
  },
  sqrt: {
    name: 'Square Root',
    description: 'Apply square root to moderately reduce skewness while preserving more of the original scale.',
    applicableTo: ['numerical'],
    expectedImpact: 'medium',
    complexity: 'simple',
    formula: 'x\' = √x',
    useCases: [
      'Count data (e.g., number of events)',
      'Moderately skewed distributions',
      'Data with zero values (unlike log)',
    ],
    antiPatterns: [
      'Negative values',
      'Heavily skewed data (use log instead)',
    ],
  },
  square: {
    name: 'Square Transform',
    description: 'Square values to emphasize larger values and create non-linear relationships.',
    applicableTo: ['numerical'],
    expectedImpact: 'medium',
    complexity: 'simple',
    formula: 'x\' = x²',
    useCases: [
      'Left-skewed distributions',
      'Emphasizing differences in larger values',
      'Creating polynomial features',
    ],
    antiPatterns: [
      'Right-skewed data (will increase skewness)',
      'Data with very large values (may overflow)',
    ],
  },
  normalize: {
    name: 'Min-Max Normalization',
    description: 'Scale values to [0, 1] range based on minimum and maximum values.',
    applicableTo: ['numerical'],
    expectedImpact: 'high',
    complexity: 'simple',
    formula: 'x\' = (x - min) / (max - min)',
    useCases: [
      'Neural networks (often expect [0, 1] input)',
      'Distance-based algorithms (KNN, K-means)',
      'Image pixel values',
    ],
    antiPatterns: [
      'Data with outliers (they compress the rest)',
      'When new data may exceed training range',
    ],
  },
  standardize: {
    name: 'Standardization (Z-score)',
    description: 'Transform to mean=0 and standard deviation=1.',
    applicableTo: ['numerical'],
    expectedImpact: 'high',
    complexity: 'simple',
    formula: 'x\' = (x - μ) / σ',
    useCases: [
      'Linear models (regression, SVM)',
      'PCA and other algorithms assuming centered data',
      'Comparing features on different scales',
    ],
    antiPatterns: [
      'Tree-based models (don\'t need scaling)',
      'Sparse data (destroys sparsity)',
    ],
  },
  binning: {
    name: 'Binning (Discretization)',
    description: 'Convert continuous values into discrete bins or categories.',
    applicableTo: ['numerical'],
    expectedImpact: 'medium',
    complexity: 'moderate',
    useCases: [
      'Handling outliers by grouping extreme values',
      'Creating ordinal features from continuous',
      'Simplifying complex relationships',
    ],
    antiPatterns: [
      'When precise values matter',
      'Small datasets (loses information)',
    ],
  },
  box_cox: {
    name: 'Box-Cox Transform',
    description: 'Automatically find the best power transformation to normalize data.',
    applicableTo: ['numerical'],
    expectedImpact: 'high',
    complexity: 'moderate',
    formula: 'x\' = (x^λ - 1) / λ',
    useCases: [
      'When you\'re unsure which transform to use',
      'Achieving normality for statistical tests',
    ],
    antiPatterns: [
      'Zero or negative values',
      'When interpretability is important',
    ],
  },
  yeo_johnson: {
    name: 'Yeo-Johnson Transform',
    description: 'Like Box-Cox but works with zero and negative values.',
    applicableTo: ['numerical'],
    expectedImpact: 'high',
    complexity: 'moderate',
    useCases: [
      'Data with zero or negative values',
      'When Box-Cox can\'t be applied',
    ],
    antiPatterns: [
      'When interpretability is important',
    ],
  },
  // Categorical transformations
  one_hot: {
    name: 'One-Hot Encoding',
    description: 'Create binary columns for each category.',
    applicableTo: ['categorical'],
    expectedImpact: 'high',
    complexity: 'simple',
    useCases: [
      'Nominal categories (no order)',
      'Low cardinality features',
      'Linear models',
    ],
    antiPatterns: [
      'High cardinality (creates too many columns)',
      'Tree-based models (label encoding often works)',
    ],
  },
  label_encode: {
    name: 'Label Encoding',
    description: 'Convert categories to integers (0, 1, 2, ...).',
    applicableTo: ['categorical'],
    expectedImpact: 'medium',
    complexity: 'simple',
    useCases: [
      'Ordinal categories (with natural order)',
      'Tree-based models',
      'Memory-efficient encoding',
    ],
    antiPatterns: [
      'Nominal categories with linear models (implies false ordering)',
    ],
  },
  frequency_encode: {
    name: 'Frequency Encoding',
    description: 'Replace categories with their frequency in the dataset.',
    applicableTo: ['categorical'],
    expectedImpact: 'medium',
    complexity: 'moderate',
    useCases: [
      'High cardinality features',
      'When category frequency is informative',
    ],
    antiPatterns: [
      'When categories have similar frequencies',
      'Small datasets',
    ],
  },
  target_encode: {
    name: 'Target Encoding',
    description: 'Replace categories with the mean of the target variable.',
    applicableTo: ['categorical'],
    expectedImpact: 'high',
    complexity: 'complex',
    useCases: [
      'High cardinality features',
      'When category strongly relates to target',
    ],
    antiPatterns: [
      'Small datasets (risk of overfitting)',
      'Must use cross-validation to prevent leakage',
    ],
  },
  binary_encode: {
    name: 'Binary Encoding',
    description: 'Encode categories as binary numbers, creating log2(n) columns.',
    applicableTo: ['categorical'],
    expectedImpact: 'medium',
    complexity: 'moderate',
    useCases: [
      'Medium-high cardinality features',
      'Balance between one-hot and label encoding',
    ],
    antiPatterns: [
      'Very low cardinality (one-hot is simpler)',
    ],
  },
  // Text transformations
  tfidf: {
    name: 'TF-IDF Vectorization',
    description: 'Convert text to numerical features based on term frequency and inverse document frequency.',
    applicableTo: ['text'],
    expectedImpact: 'high',
    complexity: 'complex',
    useCases: [
      'Document classification',
      'Text similarity',
      'Information retrieval',
    ],
    antiPatterns: [
      'Very short texts',
      'When word order matters (use embeddings)',
    ],
  },
  word_count: {
    name: 'Word Count',
    description: 'Count the number of words in each text.',
    applicableTo: ['text'],
    expectedImpact: 'medium',
    complexity: 'simple',
    useCases: [
      'Text length as a feature',
      'Spam detection',
      'Content analysis',
    ],
    antiPatterns: [
      'When content matters more than length',
    ],
  },
  char_count: {
    name: 'Character Count',
    description: 'Count the number of characters in each text.',
    applicableTo: ['text'],
    expectedImpact: 'low',
    complexity: 'simple',
    useCases: [
      'Text length analysis',
      'Combined with word count for avg word length',
    ],
    antiPatterns: [
      'Rarely useful alone',
    ],
  },
  sentence_count: {
    name: 'Sentence Count',
    description: 'Count the number of sentences in each text.',
    applicableTo: ['text'],
    expectedImpact: 'low',
    complexity: 'simple',
    useCases: [
      'Document structure analysis',
      'Readability metrics',
    ],
    antiPatterns: [
      'Short texts without sentences',
    ],
  },
  // Polynomial and interaction
  polynomial_2: {
    name: 'Polynomial (Degree 2)',
    description: 'Create squared terms to capture quadratic relationships.',
    applicableTo: ['numerical'],
    expectedImpact: 'high',
    complexity: 'moderate',
    formula: 'x\' = x²',
    useCases: [
      'Non-linear relationships',
      'U-shaped or inverted-U patterns',
    ],
    antiPatterns: [
      'Already complex models',
      'Risk of overfitting',
    ],
  },
  polynomial_3: {
    name: 'Polynomial (Degree 3)',
    description: 'Create cubic terms to capture more complex non-linear relationships.',
    applicableTo: ['numerical'],
    expectedImpact: 'medium',
    complexity: 'complex',
    formula: 'x\' = x³',
    useCases: [
      'Complex non-linear patterns',
      'S-shaped relationships',
    ],
    antiPatterns: [
      'High risk of overfitting',
      'Small datasets',
    ],
  },
  interaction: {
    name: 'Feature Interactions',
    description: 'Create new features by combining two existing features.',
    applicableTo: ['numerical'],
    expectedImpact: 'high',
    complexity: 'moderate',
    useCases: [
      'When features work together',
      'Domain knowledge suggests interactions',
    ],
    antiPatterns: [
      'Too many features (combinatorial explosion)',
    ],
  },
};

/**
 * Check if a transformation is applicable to the given data
 */
function checkApplicability(
  transformation: TransformationType,
  featureData: number[] | string[],
  featureType: FeatureType
): { status: ApplicabilityStatus; reason?: string } {
  const def = TRANSFORMATION_DEFINITIONS[transformation];
  
  // Check if transformation applies to this feature type
  if (!def.applicableTo.includes(featureType)) {
    return { 
      status: 'not_applicable', 
      reason: `This transformation is for ${def.applicableTo.join(' or ')} features.` 
    };
  }
  
  // Numerical-specific checks
  if (featureType === 'numerical') {
    const numData = featureData as number[];
    const hasNegative = numData.some(v => v < 0);
    const hasZero = numData.some(v => v === 0);
    const min = Math.min(...numData);
    
    if (transformation === 'log') {
      if (hasNegative || hasZero) {
        return { 
          status: 'not_applicable', 
          reason: `Log transform requires all positive values. Found ${hasNegative ? 'negative' : 'zero'} values.` 
        };
      }
    }
    
    if (transformation === 'sqrt') {
      if (hasNegative) {
        return { 
          status: 'not_applicable', 
          reason: 'Square root requires non-negative values.' 
        };
      }
    }
    
    if (transformation === 'box_cox') {
      if (min <= 0) {
        return { 
          status: 'not_applicable', 
          reason: 'Box-Cox requires strictly positive values. Consider Yeo-Johnson instead.' 
        };
      }
    }
  }
  
  // Categorical-specific checks
  if (featureType === 'categorical') {
    const uniqueValues = new Set(featureData as string[]).size;
    
    if (transformation === 'one_hot' && uniqueValues > 50) {
      return { 
        status: 'warning', 
        reason: `High cardinality (${uniqueValues} unique values) will create many columns. Consider frequency or target encoding.` 
      };
    }
  }
  
  return { status: 'applicable' };
}

/**
 * Get suggestions for a feature type
 */
function getSuggestionsForFeature(
  featureType: FeatureType,
  featureData: number[] | string[],
  featureName: string
): TransformationSuggestion[] {
  const suggestions: TransformationSuggestion[] = [];
  
  for (const [type, def] of Object.entries(TRANSFORMATION_DEFINITIONS)) {
    if (!def.applicableTo.includes(featureType)) continue;
    
    const { status, reason } = checkApplicability(
      type as TransformationType, 
      featureData, 
      featureType
    );
    
    suggestions.push({
      type: type as TransformationType,
      name: def.name,
      description: def.description,
      expectedImpact: def.expectedImpact,
      applicability: status,
      applicabilityReason: reason,
      complexity: def.complexity,
      formula: def.formula,
      useCases: def.useCases,
      antiPatterns: def.antiPatterns,
    });
  }
  
  // Sort by impact (high first) and applicability
  return suggestions.sort((a, b) => {
    // Applicable first
    if (a.applicability === 'applicable' && b.applicability !== 'applicable') return -1;
    if (a.applicability !== 'applicable' && b.applicability === 'applicable') return 1;
    
    // Then by impact
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.expectedImpact] - impactOrder[b.expectedImpact];
  });
}

/**
 * Impact badge component
 */
function ImpactBadge({ impact }: { impact: ImpactLevel }) {
  const variants: Record<ImpactLevel, { variant: 'default' | 'secondary' | 'outline'; icon: typeof Sparkles }> = {
    high: { variant: 'default', icon: Sparkles },
    medium: { variant: 'secondary', icon: Zap },
    low: { variant: 'outline', icon: Info },
  };
  
  const { variant, icon: Icon } = variants[impact];
  
  return (
    <Badge variant={variant} className="text-xs">
      <Icon className="h-3 w-3 mr-1" />
      {impact}
    </Badge>
  );
}

/**
 * Complexity indicator
 */
function ComplexityIndicator({ complexity }: { complexity: ComplexityLevel }) {
  const colors: Record<ComplexityLevel, string> = {
    simple: 'text-green-600',
    moderate: 'text-yellow-600',
    complex: 'text-red-600',
  };
  
  return (
    <span className={cn('text-xs', colors[complexity])}>
      {complexity}
    </span>
  );
}

/**
 * Applicability indicator
 */
function ApplicabilityIndicator({ 
  status, 
  reason 
}: { 
  status: ApplicabilityStatus; 
  reason?: string;
}) {
  if (status === 'applicable') {
    return (
      <span className="flex items-center text-green-600 text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Applicable
      </span>
    );
  }
  
  if (status === 'warning') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center text-amber-600 text-xs cursor-help">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Warning
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs max-w-xs">{reason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center text-red-600 text-xs cursor-help">
            <XCircle className="h-3 w-3 mr-1" />
            Not applicable
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Single transformation card
 */
function TransformationCard({
  suggestion,
  isSelected,
  isApplied,
  onSelect,
  onApply,
  onPreview,
  compact,
}: {
  suggestion: TransformationSuggestion;
  isSelected: boolean;
  isApplied: boolean;
  onSelect: () => void;
  onApply: () => void;
  onPreview?: () => void;
  compact: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDisabled = suggestion.applicability === 'not_applicable';
  
  return (
    <div
      className={cn(
        'border rounded-lg transition-all',
        isSelected && 'border-primary ring-1 ring-primary',
        isApplied && 'bg-green-50 dark:bg-green-950 border-green-200',
        isDisabled && 'opacity-60',
        !isDisabled && !isSelected && 'hover:border-primary/50 cursor-pointer'
      )}
      onClick={() => !isDisabled && onSelect()}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{suggestion.name}</span>
            {isApplied && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Applied
              </Badge>
            )}
          </div>
          <ImpactBadge impact={suggestion.expectedImpact} />
        </div>
        
        {/* Description */}
        <p className="text-xs text-muted-foreground mb-2">
          {suggestion.description}
        </p>
        
        {/* Formula if available */}
        {suggestion.formula && (
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
            {suggestion.formula}
          </code>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <ComplexityIndicator complexity={suggestion.complexity} />
            <ApplicabilityIndicator 
              status={suggestion.applicability} 
              reason={suggestion.applicabilityReason}
            />
          </div>
          
          {!compact && !isDisabled && (
            <div className="flex gap-1">
              {onPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview();
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              )}
              <Button
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply();
                }}
                disabled={isApplied}
              >
                <Play className="h-3 w-3 mr-1" />
                Apply
              </Button>
            </div>
          )}
        </div>
        
        {/* Expandable details */}
        {!compact && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                {isExpanded ? 'Hide details' : 'Show details'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {suggestion.useCases && suggestion.useCases.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">✓ When to use:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 ml-3">
                    {suggestion.useCases.map((useCase, i) => (
                      <li key={i}>• {useCase}</li>
                    ))}
                  </ul>
                </div>
              )}
              {suggestion.antiPatterns && suggestion.antiPatterns.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1">✗ When NOT to use:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 ml-3">
                    {suggestion.antiPatterns.map((pattern, i) => (
                      <li key={i}>• {pattern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

/**
 * Feature type icon
 */
function FeatureTypeIcon({ type }: { type: FeatureType }) {
  const icons: Record<FeatureType, typeof BarChart3> = {
    numerical: BarChart3,
    categorical: Zap,
    text: Type,
  };
  const Icon = icons[type];
  return <Icon className="h-4 w-4" />;
}

export function TransformationSuggestionPanel({
  featureType,
  featureData,
  featureName,
  appliedTransformations = [],
  onSelect,
  onApply,
  onPreview,
  selectedTransformation,
  compact = false,
}: TransformationSuggestionPanelProps) {
  // Get suggestions for this feature
  const suggestions = useMemo(() => {
    return getSuggestionsForFeature(featureType, featureData, featureName);
  }, [featureType, featureData, featureName]);
  
  // Count applicable suggestions
  const applicableCount = suggestions.filter(s => s.applicability === 'applicable').length;

  return (
    <Card className={cn(compact && 'border-0 shadow-none')}>
      {!compact && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Transformation Suggestions
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <FeatureTypeIcon type={featureType} />
            <span className="capitalize">{featureType}</span> feature: {featureName}
            <Badge variant="outline" className="ml-2">
              {applicableCount} applicable
            </Badge>
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn(compact && 'p-0')}>
        <ScrollArea className={cn(compact ? 'h-64' : 'h-96')}>
          <div className="space-y-2 pr-4">
            {suggestions.map((suggestion) => (
              <TransformationCard
                key={suggestion.type}
                suggestion={suggestion}
                isSelected={selectedTransformation === suggestion.type}
                isApplied={appliedTransformations.includes(suggestion.type)}
                onSelect={() => onSelect(suggestion.type)}
                onApply={() => onApply(suggestion.type)}
                onPreview={onPreview ? () => onPreview(suggestion.type) : undefined}
                compact={compact}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Export utility functions and definitions
export { 
  TRANSFORMATION_DEFINITIONS, 
  checkApplicability, 
  getSuggestionsForFeature,
};
