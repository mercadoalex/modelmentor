import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Rocket, 
  Upload, 
  Play,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  X
} from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tips: string[];
}

export function OnboardingTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const { showTutorial, closeTutorial } = useTutorial();

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ModelMentor! 🎉',
      description: 'Learn machine learning by doing! We\'ll guide you through training your first AI model in just a few simple steps.',
      icon: Rocket,
      tips: [
        'No coding required - just follow along!',
        'Learn by experimenting and having fun',
        'Earn points and unlock achievements as you learn'
      ]
    },
    {
      id: 'upload',
      title: 'Step 1: Upload Your Data 📊',
      description: 'Machine learning starts with data! Upload a CSV file with examples you want your AI to learn from.',
      icon: Upload,
      tips: [
        'Think of data like flashcards - each row is an example',
        'Your AI will learn patterns from these examples',
        'More examples = smarter AI!'
      ]
    },
    {
      id: 'train',
      title: 'Step 2: Train Your Model 🚀',
      description: 'Click "Start Training" and watch your AI learn! It will study your data and figure out patterns.',
      icon: Play,
      tips: [
        'Training is like teaching - it takes a few moments',
        'The AI tries different approaches to find the best one',
        'You\'ll see progress in real-time!'
      ]
    },
    {
      id: 'results',
      title: 'Step 3: Check Your Results 📈',
      description: 'See how well your AI learned! Higher accuracy means your AI is smarter.',
      icon: BarChart3,
      tips: [
        'Accuracy shows how often your AI is correct',
        '90%+ accuracy is excellent!',
        'You can always retrain to improve'
      ]
    },
    {
      id: 'explore',
      title: 'Step 4: Explore & Learn More ✨',
      description: 'Try different workshops to learn advanced topics! Each one teaches you something new.',
      icon: Sparkles,
      tips: [
        'Workshops are like mini-lessons with hands-on practice',
        'Complete workshops to earn achievements',
        'Take your time and experiment!'
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      closeTutorial();
      setCurrentStep(0); // Reset for next time
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    closeTutorial();
    setCurrentStep(0); // Reset for next time
  };

  if (!showTutorial) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pointer-events-none">
      <Card className="w-full max-w-2xl shadow-lg pointer-events-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-1">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                  style={{ minWidth: '40px' }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Tutorial
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkip}
                className="h-8 w-8 p-0"
                aria-label="Close tutorial"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl mb-2">{currentStepData.title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {currentStepData.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tips */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span>Quick Tips:</span>
            </div>
            {currentStepData.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          {/* Visual Aid */}
          {currentStep === 0 && (
            <Alert className="border-primary/20 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription>
                <p className="font-semibold mb-1">What is Machine Learning?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  It's like teaching a computer to recognize patterns! Just like you learned to recognize cats by seeing many cat pictures, AI learns from examples you provide.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {currentStep === 1 && (
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm font-semibold mb-3">Example: Teaching AI to recognize fruits</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  <span className="font-mono">🍎 Red, Round, Sweet</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Apple</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  <span className="font-mono">🍌 Yellow, Long, Sweet</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Banana</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  <span className="font-mono">🍊 Orange, Round, Citrus</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Orange</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Each row is an example. The AI learns: "If it's red and round, it's probably an apple!"
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm font-semibold mb-3">What happens during training?</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                  <div>
                    <p className="text-sm font-semibold">AI makes a guess</p>
                    <p className="text-xs text-muted-foreground">It tries to predict the answer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                  <div>
                    <p className="text-sm font-semibold">Check if it's correct</p>
                    <p className="text-xs text-muted-foreground">Compare with the real answer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                  <div>
                    <p className="text-sm font-semibold">Learn from mistakes</p>
                    <p className="text-xs text-muted-foreground">Adjust to be more accurate next time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold">4</div>
                  <div>
                    <p className="text-sm font-semibold">Repeat many times</p>
                    <p className="text-xs text-muted-foreground">Gets smarter with each try!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm font-semibold mb-3">Understanding Your Results</p>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">90%+</div>
                    <span className="text-sm font-semibold">Excellent!</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Your AI is very smart and accurate</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">70-90%</div>
                    <span className="text-sm font-semibold">Good!</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Your AI is learning well, can be improved</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">&lt;70%</div>
                    <span className="text-sm font-semibold">Needs Work</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Try training longer or with more data</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
            <Button onClick={handleNext} size="lg">
              {isLastStep ? (
                <>
                  Get Started
                  <Rocket className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
