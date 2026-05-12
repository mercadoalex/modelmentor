import { Check, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LearningMomentType } from '@/utils/learningMomentContent';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isLearnStep?: boolean;
  /** For learn steps: the moment type for tracking */
  momentType?: LearningMomentType;
}

interface LearningMomentProgress {
  data: boolean;
  model: boolean;
  next_steps: boolean;
}

interface MLWorkflowVisualizerProps {
  steps: WorkflowStep[];
  currentStep?: number;
  className?: string;
  /** Completion status for learning moments */
  learningMomentProgress?: LearningMomentProgress;
  /** Callback when a learning moment is clicked */
  onLearningMomentClick?: (momentType: LearningMomentType) => void;
}

export function MLWorkflowVisualizer({ 
  steps, 
  currentStep = 0, 
  className = '',
  learningMomentProgress,
  onLearningMomentClick
}: MLWorkflowVisualizerProps) {
  // Separate main steps and learn steps for a cleaner two-row layout
  const mainSteps = steps.filter(s => !s.isLearnStep);
  const learnSteps = steps.filter(s => s.isLearnStep);

  // Get completion status for a learn step
  const isLearningMomentCompleted = (step: WorkflowStep): boolean => {
    if (!learningMomentProgress || !step.momentType) return false;
    return learningMomentProgress[step.momentType];
  };

  // Handle learn step click
  const handleLearnStepClick = (step: WorkflowStep) => {
    if (step.momentType && onLearningMomentClick) {
      onLearningMomentClick(step.momentType);
    }
  };
  
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
            {learnSteps.map((step) => {
              const isCompleted = isLearningMomentCompleted(step);
              const isClickable = !!onLearningMomentClick && !!step.momentType;
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleLearnStepClick(step)}
                  disabled={!isClickable}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                    ${isCompleted 
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                    }
                    ${isClickable 
                      ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2' 
                      : 'cursor-default'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${isCompleted 
                      ? 'bg-green-100 dark:bg-green-900/50' 
                      : 'bg-amber-100 dark:bg-amber-900/50'
                    }
                  `}>
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${
                        isCompleted 
                          ? 'text-green-800 dark:text-green-200' 
                          : 'text-amber-800 dark:text-amber-200'
                      }`}>
                        {step.title.replace('Learn: ', '')}
                      </p>
                      {isCompleted && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300">
                          Done
                        </span>
                      )}
                      {!isCompleted && isClickable && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 animate-pulse">
                          New
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${
                      isCompleted 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
