import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Lightbulb,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import type { TransformationType } from '@/types/workshop';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ExerciseType = 'apply_transformation' | 'select_option' | 'interpret_result';

interface ExerciseOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  context?: string;
  options?: ExerciseOption[];
  targetTransformation?: TransformationType;
  hint?: string;
  explanation: string;
}

interface TutorialExerciseProps {
  /** The exercise to display */
  exercise: Exercise;
  /** Whether the exercise has been completed */
  isCompleted: boolean;
  /** Callback when exercise is completed */
  onComplete: (correct: boolean) => void;
  /** Callback when user wants to skip */
  onSkip?: () => void;
  /** Callback when transformation is applied (for apply_transformation type) */
  onApplyTransformation?: (transformation: TransformationType) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample Exercises (can be imported from a separate file)
// ─────────────────────────────────────────────────────────────────────────────

export const SAMPLE_EXERCISES: Exercise[] = [
  {
    id: 'ex-log-when',
    type: 'select_option',
    question: 'When should you use a log transformation?',
    context: 'You have a dataset with an "income" column that ranges from $20,000 to $10,000,000.',
    options: [
      {
        id: 'a',
        text: 'When data is normally distributed',
        isCorrect: false,
        feedback: 'Log transform is not needed for normally distributed data - it\'s already symmetric!',
      },
      {
        id: 'b',
        text: 'When data has a long right tail (positive skewness)',
        isCorrect: true,
        feedback: 'Correct! Log transform compresses large values and is perfect for right-skewed data like income.',
      },
      {
        id: 'c',
        text: 'When data contains negative values',
        isCorrect: false,
        feedback: 'Log transform cannot be applied to negative values - log of negative numbers is undefined!',
      },
      {
        id: 'd',
        text: 'When using tree-based models',
        isCorrect: false,
        feedback: 'Tree-based models don\'t require log transformation - they handle skewed data naturally.',
      },
    ],
    hint: 'Think about what log transform does to the distribution shape.',
    explanation: 'Log transformation is ideal for right-skewed data because it compresses large values while expanding small ones, making the distribution more symmetric.',
  },
  {
    id: 'ex-one-hot-cardinality',
    type: 'select_option',
    question: 'What is a potential problem with one-hot encoding a "city" column with 500 unique cities?',
    options: [
      {
        id: 'a',
        text: 'It will create 500 new columns, causing dimensionality issues',
        isCorrect: true,
        feedback: 'Correct! High cardinality leads to many columns, which can cause memory issues and overfitting.',
      },
      {
        id: 'b',
        text: 'It won\'t work with categorical data',
        isCorrect: false,
        feedback: 'One-hot encoding is specifically designed for categorical data!',
      },
      {
        id: 'c',
        text: 'It requires numerical input',
        isCorrect: false,
        feedback: 'One-hot encoding converts categorical (text) data to numerical format.',
      },
      {
        id: 'd',
        text: 'It only works with binary categories',
        isCorrect: false,
        feedback: 'One-hot encoding works with any number of categories, not just binary.',
      },
    ],
    hint: 'Consider what happens when you create a column for each unique value.',
    explanation: 'High cardinality categorical features create many columns with one-hot encoding. Consider target encoding or frequency encoding as alternatives.',
  },
  {
    id: 'ex-standardization-formula',
    type: 'select_option',
    question: 'After standardization, what are the mean and standard deviation of the transformed data?',
    options: [
      {
        id: 'a',
        text: 'Mean = 0, Std = 1',
        isCorrect: true,
        feedback: 'Correct! Standardization (z-score normalization) centers data at 0 and scales to unit variance.',
      },
      {
        id: 'b',
        text: 'Mean = 0.5, Std = 0.5',
        isCorrect: false,
        feedback: 'This would be closer to min-max normalization, not standardization.',
      },
      {
        id: 'c',
        text: 'Mean = 1, Std = 0',
        isCorrect: false,
        feedback: 'A standard deviation of 0 would mean all values are identical!',
      },
      {
        id: 'd',
        text: 'Mean = 0, Std = 0.5',
        isCorrect: false,
        feedback: 'Standardization specifically scales to std = 1, not 0.5.',
      },
    ],
    hint: 'Remember the z-score formula: z = (x - μ) / σ',
    explanation: 'Standardization transforms data to have mean = 0 and standard deviation = 1, making features comparable and helping gradient-based algorithms converge faster.',
  },
  {
    id: 'ex-interpret-skewness',
    type: 'interpret_result',
    question: 'A feature has skewness = 2.5. What does this tell you?',
    options: [
      {
        id: 'a',
        text: 'The data is heavily right-skewed with a long tail of large values',
        isCorrect: true,
        feedback: 'Correct! Positive skewness > 1 indicates significant right skew. Consider log or sqrt transform.',
      },
      {
        id: 'b',
        text: 'The data is normally distributed',
        isCorrect: false,
        feedback: 'Normal distribution has skewness ≈ 0. A value of 2.5 is far from normal.',
      },
      {
        id: 'c',
        text: 'The data is left-skewed',
        isCorrect: false,
        feedback: 'Left-skewed data has negative skewness. Positive values indicate right skew.',
      },
      {
        id: 'd',
        text: 'The data needs no transformation',
        isCorrect: false,
        feedback: 'High skewness often benefits from transformation to improve model performance.',
      },
    ],
    hint: 'Skewness > 0 means the tail extends to the right.',
    explanation: 'Skewness measures asymmetry. Values > 1 or < -1 indicate significant skew. For skewness = 2.5, log or sqrt transform would help normalize the distribution.',
  },
  {
    id: 'ex-polynomial-overfitting',
    type: 'select_option',
    question: 'Why should you be careful when using polynomial features with degree > 3?',
    options: [
      {
        id: 'a',
        text: 'Higher degrees increase the risk of overfitting',
        isCorrect: true,
        feedback: 'Correct! High-degree polynomials can fit training data too closely, capturing noise instead of patterns.',
      },
      {
        id: 'b',
        text: 'They only work with categorical data',
        isCorrect: false,
        feedback: 'Polynomial features are specifically for numerical data.',
      },
      {
        id: 'c',
        text: 'They make the model faster',
        isCorrect: false,
        feedback: 'Actually, more features typically slow down training.',
      },
      {
        id: 'd',
        text: 'They require standardization first',
        isCorrect: false,
        feedback: 'While standardization helps, it\'s not the main concern with high-degree polynomials.',
      },
    ],
    hint: 'Think about what happens when a model becomes too complex.',
    explanation: 'High-degree polynomials can perfectly fit training data but fail on new data. This is overfitting. Start with degree 2 and only increase if needed.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TutorialExercise({
  exercise,
  isCompleted,
  onComplete,
  onSkip,
  onApplyTransformation,
}: TutorialExerciseProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Get selected option data
  const selectedOptionData = exercise.options?.find(o => o.id === selectedOption);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (!selectedOption || !selectedOptionData) return;

    setShowFeedback(true);
    setAttempts(prev => prev + 1);

    if (selectedOptionData.isCorrect) {
      onComplete(true);
    }
  }, [selectedOption, selectedOptionData, onComplete]);

  // Handle try again
  const handleTryAgain = useCallback(() => {
    setSelectedOption(null);
    setShowFeedback(false);
  }, []);

  // Handle apply transformation (for apply_transformation type)
  const handleApplyTransformation = useCallback(() => {
    if (exercise.targetTransformation && onApplyTransformation) {
      onApplyTransformation(exercise.targetTransformation);
      onComplete(true);
    }
  }, [exercise.targetTransformation, onApplyTransformation, onComplete]);

  // Render completed state
  if (isCompleted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                Exercise Completed!
              </p>
              <p className="text-sm text-muted-foreground">
                {exercise.explanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render apply_transformation type
  if (exercise.type === 'apply_transformation') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Practice Exercise</CardTitle>
          <CardDescription>{exercise.question}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercise.context && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>{exercise.context}</AlertDescription>
            </Alert>
          )}

          <div className="p-4 border-2 border-dashed rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Apply the {exercise.targetTransformation?.replace(/_/g, ' ')} transformation to complete this exercise.
            </p>
            <Button onClick={handleApplyTransformation}>
              Apply Transformation
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {exercise.hint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-muted-foreground"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
          )}

          {showHint && exercise.hint && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>{exercise.hint}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render select_option or interpret_result type
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {exercise.type === 'interpret_result' ? 'Interpret the Result' : 'Knowledge Check'}
          </CardTitle>
          {attempts > 0 && (
            <Badge variant="outline">
              Attempts: {attempts}
            </Badge>
          )}
        </div>
        <CardDescription>{exercise.question}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context */}
        {exercise.context && (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>{exercise.context}</AlertDescription>
          </Alert>
        )}

        {/* Options */}
        <RadioGroup
          value={selectedOption || ''}
          onValueChange={setSelectedOption}
          disabled={showFeedback}
        >
          {exercise.options?.map(option => (
            <div
              key={option.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                showFeedback && option.id === selectedOption
                  ? option.isCorrect
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/20'
                  : selectedOption === option.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value={option.id} id={option.id} />
              <Label
                htmlFor={option.id}
                className="flex-1 cursor-pointer font-normal"
              >
                {option.text}
              </Label>
              {showFeedback && option.id === selectedOption && (
                option.isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                )
              )}
            </div>
          ))}
        </RadioGroup>

        {/* Feedback */}
        {showFeedback && selectedOptionData && (
          <Alert className={selectedOptionData.isCorrect ? 'border-green-200' : 'border-red-200'}>
            <AlertDescription>
              <p className={`font-medium ${selectedOptionData.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {selectedOptionData.isCorrect ? '✓ Correct!' : '✗ Not quite right'}
              </p>
              <p className="mt-1">{selectedOptionData.feedback}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Hint */}
        {!showFeedback && exercise.hint && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-muted-foreground"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              {showHint ? 'Hide Hint' : 'Need a Hint?'}
            </Button>

            {showHint && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>{exercise.hint}</AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {onSkip && !showFeedback && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip
            </Button>
          )}
          
          {showFeedback && !selectedOptionData?.isCorrect ? (
            <Button onClick={handleTryAgain} variant="outline">
              <RotateCcw className="h-4 w-4 mr-1" />
              Try Again
            </Button>
          ) : !showFeedback ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="ml-auto"
            >
              Check Answer
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export type { Exercise, ExerciseOption, ExerciseType };
export default TutorialExercise;
