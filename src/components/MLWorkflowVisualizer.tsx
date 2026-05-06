import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface MLWorkflowVisualizerProps {
  steps: WorkflowStep[];
  currentStep?: number;
  className?: string;
}

export function MLWorkflowVisualizer({ steps, currentStep = 0, className = '' }: MLWorkflowVisualizerProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-border hidden md:block" />
        
        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="relative flex flex-col items-center text-center">
                {/* Step number/icon */}
                <div
                  className={`
                    relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all
                    ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                    ${isCurrent ? 'bg-background border-primary text-primary scale-110' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-background border-border text-muted-foreground' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                
                {/* Step content */}
                <div className="mt-4 space-y-1">
                  <p
                    className={`
                      text-sm font-medium transition-colors
                      ${isCurrent ? 'text-foreground' : ''}
                      ${isCompleted ? 'text-foreground' : ''}
                      ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}
                    `}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[140px] mx-auto">
                    {step.description}
                  </p>
                </div>
                
                {/* Connector line for mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden w-0.5 h-8 bg-border mx-auto my-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
