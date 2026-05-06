import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  TrendingUp, 
  Target, 
  Brain, 
  Lightbulb, 
  ArrowRight,
  BookOpen,
  LineChart as LineChartIcon,
  Microscope,
  Rocket
} from 'lucide-react';

interface TrainingCompletionSummaryProps {
  finalAccuracy: number;
  finalLoss: number;
  totalEpochs: number;
  trainingTime: number;
  modelType: string;
  onContinue: () => void;
}

export function TrainingCompletionSummary({
  finalAccuracy,
  finalLoss,
  totalEpochs,
  trainingTime,
  modelType,
  onContinue
}: TrainingCompletionSummaryProps) {
  const accuracyPercentage = (finalAccuracy * 100).toFixed(1);
  const trainingMinutes = Math.floor(trainingTime / 60);
  const trainingSeconds = trainingTime % 60;

  // Determine performance level
  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 0.90) return { level: 'Excellent', color: 'text-green-600 dark:text-green-400', badge: 'default' };
    if (accuracy >= 0.80) return { level: 'Good', color: 'text-blue-600 dark:text-blue-400', badge: 'secondary' };
    if (accuracy >= 0.70) return { level: 'Fair', color: 'text-yellow-600 dark:text-yellow-400', badge: 'outline' };
    return { level: 'Needs Improvement', color: 'text-orange-600 dark:text-orange-400', badge: 'outline' };
  };

  const performance = getPerformanceLevel(finalAccuracy);

  // Key learnings based on model type
  const getKeyLearnings = () => {
    const baselearnings = [
      {
        icon: Brain,
        title: 'Neural Network Training',
        description: 'Your model learned patterns from the data through multiple iterations (epochs), adjusting its internal parameters to improve predictions.'
      },
      {
        icon: Target,
        title: 'Accuracy & Loss',
        description: `Accuracy (${accuracyPercentage}%) shows how often your model makes correct predictions. Loss (${finalLoss.toFixed(4)}) measures prediction errors - lower is better.`
      },
      {
        icon: TrendingUp,
        title: 'Iterative Learning',
        description: `Over ${totalEpochs} epochs, your model gradually improved by learning from mistakes and adjusting its predictions.`
      }
    ];

    if (modelType === 'image_classification') {
      baselearnings.push({
        icon: Microscope,
        title: 'Image Recognition',
        description: 'Your model learned to identify visual patterns and features that distinguish different categories of images.'
      });
    } else if (modelType === 'text_classification') {
      baselearnings.push({
        icon: BookOpen,
        title: 'Text Understanding',
        description: 'Your model learned to understand text patterns and classify documents based on their content and meaning.'
      });
    }

    return baselearnings;
  };

  const keyLearnings = getKeyLearnings();

  // Next steps suggestions
  const nextSteps = [
    {
      title: 'Analyze Performance',
      description: 'Review the confusion matrix and error analysis below to understand where your model performs well and where it struggles.',
      icon: LineChartIcon
    },
    {
      title: 'Test Your Model',
      description: 'Use the Model Playground to test your model with new examples and see how it makes predictions in real-time.',
      icon: Microscope
    },
    {
      title: 'Improve Further',
      description: 'Try adjusting hyperparameters, adding more training data, or using regularization techniques to boost performance.',
      icon: TrendingUp
    },
    {
      title: 'Deploy & Share',
      description: 'When satisfied with performance, download your model or follow the deployment guide to share it with others.',
      icon: Rocket
    }
  ];

  return (
    <div className="space-y-6">
      {/* Celebration Header */}
      <Alert className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-900 dark:text-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg mb-1">🎉 Training Completed Successfully!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your AI model has finished learning and is ready to make predictions.
              </p>
            </div>
            <Button onClick={onContinue} size="lg" className="shrink-0">
              Continue to Testing
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Training Results Summary
          </CardTitle>
          <CardDescription>
            Here's how your model performed during training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Final Accuracy</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${performance.color}`}>
                  {accuracyPercentage}%
                </p>
                <Badge variant={performance.badge as any}>
                  {performance.level}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {finalAccuracy >= 0.90 
                  ? 'Outstanding! Your model is highly accurate.'
                  : finalAccuracy >= 0.80
                  ? 'Great job! Your model performs well.'
                  : finalAccuracy >= 0.70
                  ? 'Good start! Consider tuning to improve further.'
                  : 'Try adjusting parameters or adding more data.'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Final Loss</p>
              <p className="text-3xl font-bold">
                {finalLoss.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">
                {finalLoss < 0.3 
                  ? 'Excellent - very low error rate'
                  : finalLoss < 0.5
                  ? 'Good - acceptable error level'
                  : 'Consider more training or tuning'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Training Epochs</p>
              <p className="text-3xl font-bold">
                {totalEpochs}
              </p>
              <p className="text-xs text-muted-foreground">
                Complete learning iterations
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Training Time</p>
              <p className="text-3xl font-bold">
                {trainingMinutes > 0 ? `${trainingMinutes}m ${trainingSeconds}s` : `${trainingSeconds}s`}
              </p>
              <p className="text-xs text-muted-foreground">
                Total time to train model
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What You Learned */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            What You Learned
          </CardTitle>
          <CardDescription>
            Key concepts and insights from this training session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {keyLearnings.map((learning, index) => {
              const Icon = learning.icon;
              return (
                <div key={index} className="flex gap-3 p-4 rounded-lg border bg-card">
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{learning.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {learning.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Suggested Next Steps
          </CardTitle>
          <CardDescription>
            Continue your learning journey with these recommended actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nextSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-sm">{step.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Educational Note */}
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-1">Understanding Your Results</p>
          <p className="text-sm text-muted-foreground">
            The sections below provide detailed analysis tools to help you understand your model's behavior, 
            identify areas for improvement, and make informed decisions about deployment. Take time to explore 
            each visualization and learn how professional data scientists evaluate their models.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
