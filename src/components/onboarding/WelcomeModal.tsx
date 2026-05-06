import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, GraduationCap, Rocket, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
  userName?: string;
}

export function WelcomeModal({ open, onClose, onStartTour, userName }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: `Welcome to ModelMentor${userName ? `, ${userName}` : ''}!`,
      description: 'Your journey to mastering machine learning starts here',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            ModelMentor is a no-code platform that makes machine learning accessible to everyone. 
            Whether you're a student, teacher, or curious learner, we'll guide you through every step.
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <GraduationCap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Learn by Doing</p>
                <p className="text-sm text-muted-foreground">
                  Build real ML models without writing code
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Instant Feedback</p>
                <p className="text-sm text-muted-foreground">
                  See your models train and test in real-time
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Rocket className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Share Your Work</p>
                <p className="text-sm text-muted-foreground">
                  Export and deploy your models easily
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'How It Works',
      description: 'A simple 6-step workflow to build ML models',
      icon: Zap,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            ModelMentor guides you through a proven workflow that professional ML engineers use:
          </p>
          <div className="space-y-3">
            {[
              { step: 1, title: 'Describe', desc: 'Tell us what you want to build in plain language' },
              { step: 2, title: 'Input Data', desc: 'Upload or select training data' },
              { step: 3, title: 'Learn', desc: 'Understand ML concepts with interactive lessons' },
              { step: 4, title: 'Train', desc: 'Watch your model learn from the data' },
              { step: 5, title: 'Test', desc: 'Evaluate performance and make predictions' },
              { step: 6, title: 'Deploy', desc: 'Export and share your trained model' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <Badge variant="secondary" className="shrink-0 h-6 w-6 flex items-center justify-center p-0">
                  {item.step}
                </Badge>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Ready to Get Started?',
      description: 'Take a quick tour or jump right in',
      icon: Rocket,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            We recommend taking a quick 2-minute tour to familiarize yourself with the platform. 
            You can always access tutorials later from the help menu.
          </p>
          <div className="grid gap-3">
            <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <p className="font-medium">Recommended: Take the Tour</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Interactive walkthrough of key features (~2 minutes)
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">Skip and Explore</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Jump straight to the dashboard and explore on your own
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartTour = () => {
    onStartTour();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-balance">{currentStepData.title}</DialogTitle>
              <DialogDescription className="text-pretty">
                {currentStepData.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {currentStepData.content}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
                Back
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} className="flex-1 sm:flex-none">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleSkip} className="flex-1 sm:flex-none">
                  Skip Tour
                </Button>
                <Button onClick={handleStartTour} className="flex-1 sm:flex-none">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Start Tour
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
