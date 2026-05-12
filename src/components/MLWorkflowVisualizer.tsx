import { Check, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isLearnStep?: boolean;
}

interface MLWorkflowVisualizerProps {
  steps: WorkflowStep[];
  currentStep?: number;
  className?: string;
}

export function MLWorkflowVisualizer({ steps, currentStep = 0, className = '' }: MLWorkflowVisualizerProps) {
  // Separate main steps and learn steps for a cleaner two-row layout
  const mainSteps = steps.filter(s => !s.isLearnStep);
  const learnSteps = steps.filter(s => s.isLearnStep);
  
  return (
    <div className={`w-full space-y-8 ${className}`}>
      {/* Main workflow steps */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-border hidden md:block" />
        
        {/* Main Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
          {mainSteps.map((step, index) => {
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
                {index < mainSteps.length - 1 && (
                  <div className="md:hidden w-0.5 h-8 bg-border mx-auto my-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Learning steps - shown as a secondary row with special styling */}
      {learnSteps.length > 0 && (
        <div className="relative pt-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent flex-1 max-w-[100px]" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Learning Moments
            </span>
            <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent flex-1 max-w-[100px]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {learnSteps.map((step) => (
              <div 
                key={step.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 truncate">
                    {step.title.replace('Learn: ', '')}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
