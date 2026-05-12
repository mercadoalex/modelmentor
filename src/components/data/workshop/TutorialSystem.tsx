import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft,
  Play,
  CheckCircle2,
  Circle,
  Lightbulb,
  Target,
  Award,
  X,
} from 'lucide-react';
import type { TransformationType } from '@/types/workshop';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  highlightElement?: string; // CSS selector for element to highlight
  action?: 'observe' | 'click' | 'select' | 'apply';
  targetTransformation?: TransformationType;
  tip?: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  transformation: TransformationType;
  steps: TutorialStep[];
  prerequisites?: string[];
  learningObjectives: string[];
}

interface TutorialSystemProps {
  /** Currently active tutorial ID */
  activeTutorialId: string | null;
  /** Current step in the tutorial */
  currentStep: number;
  /** List of completed tutorial IDs */
  completedTutorials: string[];
  /** Callback when starting a tutorial */
  onStartTutorial: (tutorialId: string) => void;
  /** Callback when moving to next step */
  onNextStep: () => void;
  /** Callback when moving to previous step */
  onPreviousStep: () => void;
  /** Callback when completing a tutorial */
  onCompleteTutorial: () => void;
  /** Callback when exiting a tutorial */
  onExitTutorial: () => void;
  /** Callback when a transformation should be highlighted */
  onHighlightTransformation?: (transformation: TransformationType) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial Definitions
// ─────────────────────────────────────────────────────────────────────────────

const TUTORIALS: Tutorial[] = [
  {
    id: 'log-transform',
    title: 'Log Transform',
    description: 'Learn how to use logarithmic transformation to handle skewed data',
    difficulty: 'beginner',
    estimatedTime: 5,
    transformation: 'log',
    learningObjectives: [
      'Understand when to use log transform',
      'Recognize right-skewed distributions',
      'Apply log transform to reduce skewness',
    ],
    steps: [
      {
        id: 'intro',
        title: 'Introduction to Log Transform',
        content: 'The logarithmic transformation is one of the most powerful techniques for handling right-skewed data. It compresses large values while expanding small ones, making the distribution more symmetric.',
        tip: 'Log transform is especially useful for data like income, prices, or counts that span multiple orders of magnitude.',
      },
      {
        id: 'when-to-use',
        title: 'When to Use Log Transform',
        content: 'Use log transform when:\n• Your data has a long right tail (positive skewness)\n• Values span multiple orders of magnitude\n• You want to reduce the impact of outliers\n\nDo NOT use when:\n• Data contains zero or negative values\n• Data is already normally distributed',
        highlightElement: '[data-tour="transformation-suggestions"]',
      },
      {
        id: 'select-feature',
        title: 'Select a Numerical Feature',
        content: 'First, select a numerical feature from your dataset. Look for features with high skewness values (> 1) - these are good candidates for log transformation.',
        action: 'select',
        highlightElement: '[data-tour="feature-selector"]',
      },
      {
        id: 'find-log',
        title: 'Find Log Transform',
        content: 'In the transformation suggestions panel, find "Log Transform". Notice the expected impact badge - log transform typically has HIGH impact on skewed data.',
        action: 'observe',
        targetTransformation: 'log',
        highlightElement: '[data-transformation="log"]',
      },
      {
        id: 'preview',
        title: 'Preview the Transformation',
        content: 'Click on Log Transform to see a preview. Notice how:\n• The distribution becomes more symmetric\n• The skewness value decreases\n• Large outliers are compressed',
        action: 'click',
        targetTransformation: 'log',
      },
      {
        id: 'apply',
        title: 'Apply the Transformation',
        content: 'If you\'re satisfied with the preview, click "Apply Transformation" to add it to your pipeline. The transformation will be tracked in your progress.',
        action: 'apply',
        targetTransformation: 'log',
        tip: 'You can always undo transformations if needed!',
      },
      {
        id: 'summary',
        title: 'Congratulations!',
        content: 'You\'ve learned how to use log transform! Key takeaways:\n\n✓ Log transform reduces right skewness\n✓ It requires positive values only\n✓ It\'s great for data spanning multiple orders of magnitude\n\nTry applying it to other skewed features in your dataset.',
      },
    ],
  },
  {
    id: 'one-hot-encoding',
    title: 'One-Hot Encoding',
    description: 'Convert categorical variables into a format suitable for machine learning',
    difficulty: 'beginner',
    estimatedTime: 5,
    transformation: 'one_hot',
    learningObjectives: [
      'Understand why categorical encoding is necessary',
      'Learn when to use one-hot encoding',
      'Apply one-hot encoding to categorical features',
    ],
    steps: [
      {
        id: 'intro',
        title: 'Introduction to One-Hot Encoding',
        content: 'Machine learning models work with numbers, not text. One-hot encoding converts categorical variables (like "red", "blue", "green") into binary columns that models can understand.',
        tip: 'One-hot encoding creates one new column for each unique category.',
      },
      {
        id: 'how-it-works',
        title: 'How One-Hot Encoding Works',
        content: 'For a "Color" column with values [red, blue, green]:\n\n• Creates 3 new columns: is_red, is_blue, is_green\n• Each row has exactly one "1" and the rest "0"\n• Original column can be dropped',
      },
      {
        id: 'when-to-use',
        title: 'When to Use One-Hot Encoding',
        content: 'Use one-hot encoding when:\n• Categories have no natural order (nominal)\n• Number of unique values is small (< 20)\n• Using linear models or neural networks\n\nConsider alternatives when:\n• High cardinality (many unique values)\n• Using tree-based models',
      },
      {
        id: 'select-categorical',
        title: 'Select a Categorical Feature',
        content: 'Select a categorical feature from your dataset. Look for features with a reasonable number of unique values.',
        action: 'select',
        highlightElement: '[data-tour="feature-selector"]',
      },
      {
        id: 'apply-encoding',
        title: 'Apply One-Hot Encoding',
        content: 'Find "One-Hot Encoding" in the suggestions and apply it. Watch how the preview shows the new binary columns that will be created.',
        action: 'apply',
        targetTransformation: 'one_hot',
      },
      {
        id: 'summary',
        title: 'Great Job!',
        content: 'You\'ve mastered one-hot encoding! Remember:\n\n✓ Creates binary columns for each category\n✓ Best for nominal (unordered) categories\n✓ Watch out for high cardinality\n\nNext, try learning about label encoding for ordinal categories!',
      },
    ],
  },
  {
    id: 'standardization',
    title: 'Standardization (Z-Score)',
    description: 'Scale features to have zero mean and unit variance',
    difficulty: 'beginner',
    estimatedTime: 4,
    transformation: 'standardize',
    learningObjectives: [
      'Understand the importance of feature scaling',
      'Learn the difference between standardization and normalization',
      'Apply standardization to numerical features',
    ],
    steps: [
      {
        id: 'intro',
        title: 'Why Feature Scaling Matters',
        content: 'Features often have different scales (e.g., age: 0-100, income: 0-1,000,000). Many algorithms perform better when features are on similar scales.',
        tip: 'Standardization is essential for algorithms using gradient descent!',
      },
      {
        id: 'formula',
        title: 'The Standardization Formula',
        content: 'Standardization transforms data using:\n\nz = (x - μ) / σ\n\nWhere:\n• μ is the mean\n• σ is the standard deviation\n\nResult: mean = 0, std = 1',
      },
      {
        id: 'when-to-use',
        title: 'When to Standardize',
        content: 'Use standardization for:\n• Linear regression, logistic regression\n• Neural networks\n• PCA and other algorithms using distances\n• Comparing features on different scales\n\nNot needed for:\n• Tree-based models (Random Forest, XGBoost)',
      },
      {
        id: 'apply',
        title: 'Apply Standardization',
        content: 'Select a numerical feature and apply standardization. Notice how the mean becomes 0 and values are expressed in terms of standard deviations.',
        action: 'apply',
        targetTransformation: 'standardize',
      },
      {
        id: 'summary',
        title: 'Well Done!',
        content: 'You\'ve learned standardization! Key points:\n\n✓ Centers data at mean = 0\n✓ Scales to std = 1\n✓ Essential for many ML algorithms\n✓ Preserves outliers (unlike normalization)',
      },
    ],
  },
  {
    id: 'polynomial-features',
    title: 'Polynomial Features',
    description: 'Capture non-linear relationships by creating polynomial terms',
    difficulty: 'intermediate',
    estimatedTime: 6,
    transformation: 'polynomial_2',
    prerequisites: ['standardization'],
    learningObjectives: [
      'Understand non-linear relationships in data',
      'Create polynomial features to capture curves',
      'Balance model complexity with overfitting risk',
    ],
    steps: [
      {
        id: 'intro',
        title: 'Beyond Linear Relationships',
        content: 'Not all relationships are linear! Sometimes the relationship between a feature and target follows a curve. Polynomial features help linear models capture these patterns.',
        tip: 'Think of polynomial features as giving your model "curved vision".',
      },
      {
        id: 'example',
        title: 'A Real-World Example',
        content: 'Consider the relationship between car speed and fuel consumption:\n\n• At low speeds: consumption increases slowly\n• At high speeds: consumption increases rapidly\n\nThis is a quadratic (x²) relationship!',
      },
      {
        id: 'degrees',
        title: 'Polynomial Degrees',
        content: 'Degree 2 (x²): Captures U-shaped or inverted-U patterns\nDegree 3 (x³): Captures S-shaped patterns\n\n⚠️ Higher degrees increase overfitting risk!',
      },
      {
        id: 'apply',
        title: 'Create Polynomial Features',
        content: 'Select a numerical feature and apply polynomial transformation. Start with degree 2 - it\'s usually sufficient and safer.',
        action: 'apply',
        targetTransformation: 'polynomial_2',
      },
      {
        id: 'summary',
        title: 'Excellent!',
        content: 'You\'ve learned polynomial features! Remember:\n\n✓ Captures non-linear patterns\n✓ Start with degree 2\n✓ Watch for overfitting\n✓ Consider standardizing first',
      },
    ],
  },
  {
    id: 'interaction-features',
    title: 'Feature Interactions',
    description: 'Discover how features work together to influence predictions',
    difficulty: 'intermediate',
    estimatedTime: 6,
    transformation: 'interaction',
    prerequisites: ['polynomial-features'],
    learningObjectives: [
      'Understand feature interactions',
      'Identify promising feature combinations',
      'Create interaction terms',
    ],
    steps: [
      {
        id: 'intro',
        title: 'Features Working Together',
        content: 'Sometimes the effect of one feature depends on another. For example, the impact of "experience" on salary might depend on "education level".',
        tip: 'Interaction features capture synergies between variables.',
      },
      {
        id: 'types',
        title: 'Types of Interactions',
        content: 'Common interaction types:\n\n• Multiply (A × B): Most common, captures synergies\n• Divide (A / B): Creates ratios\n• Add (A + B): Combined effect\n• Subtract (A - B): Difference effect',
      },
      {
        id: 'finding',
        title: 'Finding Good Interactions',
        content: 'Look for interactions when:\n• Domain knowledge suggests features work together\n• Features are correlated with target but not each other\n• You see patterns in residual plots',
      },
      {
        id: 'apply',
        title: 'Create an Interaction',
        content: 'Select two numerical features and create an interaction term. The workshop will suggest promising combinations based on correlation analysis.',
        action: 'apply',
        targetTransformation: 'interaction',
      },
      {
        id: 'summary',
        title: 'Great Work!',
        content: 'You\'ve mastered feature interactions! Key takeaways:\n\n✓ Captures how features work together\n✓ Multiplication is most common\n✓ Use domain knowledge to guide selection\n✓ Don\'t create too many - risk of overfitting',
      },
    ],
  },
  {
    id: 'text-vectorization',
    title: 'TF-IDF Vectorization',
    description: 'Convert text data into numerical features for machine learning',
    difficulty: 'advanced',
    estimatedTime: 8,
    transformation: 'tfidf',
    learningObjectives: [
      'Understand text vectorization concepts',
      'Learn how TF-IDF works',
      'Apply TF-IDF to text features',
    ],
    steps: [
      {
        id: 'intro',
        title: 'Text as Numbers',
        content: 'Machine learning models can\'t read text directly. TF-IDF (Term Frequency-Inverse Document Frequency) converts text into meaningful numerical features.',
        tip: 'TF-IDF automatically identifies important words!',
      },
      {
        id: 'tf',
        title: 'Term Frequency (TF)',
        content: 'TF measures how often a word appears in a document:\n\nTF = (count of word) / (total words)\n\nMore frequent words get higher scores.',
      },
      {
        id: 'idf',
        title: 'Inverse Document Frequency (IDF)',
        content: 'IDF measures how unique a word is across all documents:\n\nIDF = log(total docs / docs containing word)\n\nCommon words like "the" get low scores.\nRare, distinctive words get high scores.',
      },
      {
        id: 'combined',
        title: 'TF-IDF Combined',
        content: 'TF-IDF = TF × IDF\n\nThis gives high scores to words that are:\n• Frequent in the current document\n• Rare across all documents\n\nPerfect for finding distinctive terms!',
      },
      {
        id: 'apply',
        title: 'Apply TF-IDF',
        content: 'Select a text feature and apply TF-IDF vectorization. This will create numerical features representing the importance of different words.',
        action: 'apply',
        targetTransformation: 'tfidf',
      },
      {
        id: 'summary',
        title: 'Congratulations!',
        content: 'You\'ve completed the advanced TF-IDF tutorial! Summary:\n\n✓ Converts text to numbers\n✓ Identifies distinctive words\n✓ Great for document classification\n✓ Consider removing stop words first',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getDifficultyColor(difficulty: Tutorial['difficulty']): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    case 'advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TutorialSystem({
  activeTutorialId,
  currentStep,
  completedTutorials,
  onStartTutorial,
  onNextStep,
  onPreviousStep,
  onCompleteTutorial,
  onExitTutorial,
  onHighlightTransformation,
}: TutorialSystemProps) {
  const [showTutorialList, setShowTutorialList] = useState(!activeTutorialId);

  // Get active tutorial
  const activeTutorial = useMemo(() => {
    return TUTORIALS.find(t => t.id === activeTutorialId);
  }, [activeTutorialId]);

  // Get current step data
  const currentStepData = useMemo(() => {
    if (!activeTutorial) return null;
    return activeTutorial.steps[currentStep];
  }, [activeTutorial, currentStep]);

  // Check if tutorial is complete
  const isLastStep = activeTutorial && currentStep === activeTutorial.steps.length - 1;

  // Handle starting a tutorial
  const handleStartTutorial = useCallback((tutorialId: string) => {
    onStartTutorial(tutorialId);
    setShowTutorialList(false);
  }, [onStartTutorial]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (isLastStep) {
      onCompleteTutorial();
      setShowTutorialList(true);
    } else {
      onNextStep();
      // Highlight transformation if needed
      if (currentStepData?.targetTransformation && onHighlightTransformation) {
        onHighlightTransformation(currentStepData.targetTransformation);
      }
    }
  }, [isLastStep, onCompleteTutorial, onNextStep, currentStepData, onHighlightTransformation]);

  // Handle exit
  const handleExit = useCallback(() => {
    onExitTutorial();
    setShowTutorialList(true);
  }, [onExitTutorial]);

  // Render tutorial list
  if (showTutorialList || !activeTutorial) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Feature Engineering Tutorials
          </CardTitle>
          <CardDescription>
            Learn transformation techniques step by step
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {TUTORIALS.map(tutorial => {
            const isCompleted = completedTutorials.includes(tutorial.id);
            const hasPrerequisites = tutorial.prerequisites?.some(
              prereq => !completedTutorials.includes(prereq)
            );

            return (
              <div
                key={tutorial.id}
                className={`p-4 border rounded-lg transition-colors ${
                  isCompleted 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
                    : hasPrerequisites
                    ? 'opacity-60'
                    : 'hover:border-primary cursor-pointer'
                }`}
                onClick={() => !hasPrerequisites && handleStartTutorial(tutorial.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="font-medium">{tutorial.title}</span>
                  </div>
                  <Badge className={getDifficultyColor(tutorial.difficulty)}>
                    {tutorial.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2 ml-7">
                  {tutorial.description}
                </p>
                <div className="flex items-center gap-4 ml-7 text-xs text-muted-foreground">
                  <span>~{tutorial.estimatedTime} min</span>
                  <span>{tutorial.steps.length} steps</span>
                  {hasPrerequisites && (
                    <span className="text-yellow-600">
                      Requires: {tutorial.prerequisites?.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  // Render active tutorial
  return (
    <Card className="border-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {activeTutorial.title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleExit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Progress 
            value={((currentStep + 1) / activeTutorial.steps.length) * 100} 
            className="h-2 flex-1" 
          />
          <span className="text-xs text-muted-foreground">
            {currentStep + 1}/{activeTutorial.steps.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step Title */}
        <h3 className="font-semibold">{currentStepData?.title}</h3>

        {/* Step Content */}
        <div className="text-sm whitespace-pre-line">
          {currentStepData?.content}
        </div>

        {/* Tip */}
        {currentStepData?.tip && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>{currentStepData.tip}</AlertDescription>
          </Alert>
        )}

        {/* Action Indicator */}
        {currentStepData?.action && currentStepData.action !== 'observe' && (
          <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Action: {currentStepData.action === 'select' && 'Select a feature'}
              {currentStepData.action === 'click' && 'Click on the transformation'}
              {currentStepData.action === 'apply' && 'Apply the transformation'}
            </span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button size="sm" onClick={handleNext}>
            {isLastStep ? (
              <>
                <Award className="h-4 w-4 mr-1" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Export tutorials for use elsewhere
export { TUTORIALS };
export type { Tutorial, TutorialStep };
export default TutorialSystem;
