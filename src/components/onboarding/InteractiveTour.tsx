import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

export interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface InteractiveTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  tourId: string;
}

export function InteractiveTour({ steps, isActive, onComplete, onSkip, tourId }: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      if (!step) return;

      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetPosition(rect);
        
        // Scroll element into view if needed
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [currentStep, steps, isActive]);

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (step.action) {
      step.action.onClick();
    }
    
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!targetPosition) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const placement = step.placement || 'bottom';
    const padding = 16;
    const tooltipWidth = 400;
    const tooltipHeight = 200; // Approximate

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetPosition.top - tooltipHeight - padding;
        left = targetPosition.left + targetPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetPosition.bottom + padding;
        left = targetPosition.left + targetPosition.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetPosition.top + targetPosition.height / 2 - tooltipHeight / 2;
        left = targetPosition.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetPosition.top + targetPosition.height / 2 - tooltipHeight / 2;
        left = targetPosition.right + padding;
        break;
    }

    // Keep tooltip within viewport
    const maxLeft = window.innerWidth - tooltipWidth - padding;
    const maxTop = window.innerHeight - tooltipHeight - padding;
    left = Math.max(padding, Math.min(left, maxLeft));
    top = Math.max(padding, Math.min(top, maxTop));

    return { top: `${top}px`, left: `${left}px` };
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Highlight cutout */}
        {targetPosition && (
          <div
            className="absolute border-4 border-primary rounded-lg shadow-2xl animate-pulse"
            style={{
              top: `${targetPosition.top - 4}px`,
              left: `${targetPosition.left - 4}px`,
              width: `${targetPosition.width + 8}px`,
              height: `${targetPosition.height + 8}px`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Tooltip */}
        <Card
          className="absolute w-full max-w-md shadow-2xl"
          style={getTooltipPosition()}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="h-6 px-2">
                    {currentStep + 1} / {steps.length}
                  </Badge>
                  <CardTitle className="text-lg text-balance">{step.title}</CardTitle>
                </div>
                <CardDescription className="text-pretty">{step.description}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-8 w-8 p-0 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-8 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-primary'
                        : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={handleNext}>
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Finish
                    </>
                  ) : (
                    <>
                      {step.action?.label || 'Next'}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
