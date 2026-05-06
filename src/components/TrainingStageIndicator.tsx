import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type TrainingStage = 
  | 'idle'
  | 'preprocessing'
  | 'building'
  | 'training'
  | 'evaluating'
  | 'completed'
  | 'error';

interface TrainingStageIndicatorProps {
  currentStage: TrainingStage;
  stages: {
    id: TrainingStage;
    label: string;
    description: string;
  }[];
  progress?: number;
}

export function TrainingStageIndicator({ currentStage, stages, progress }: TrainingStageIndicatorProps) {
  const getStageStatus = (stageId: TrainingStage) => {
    const currentIndex = stages.findIndex(s => s.id === currentStage);
    const stageIndex = stages.findIndex(s => s.id === stageId);
    
    if (currentStage === 'error') return 'error';
    if (currentStage === 'completed' || stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Training Pipeline</h3>
            {progress !== undefined && (
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            )}
          </div>
          
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage.id);
              
              return (
                <div key={stage.id} className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                    {status === 'active' && (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    )}
                    {status === 'pending' && (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    {status === 'error' && (
                      <Circle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${
                        status === 'active' ? 'text-foreground' :
                        status === 'completed' ? 'text-muted-foreground' :
                        status === 'error' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {stage.label}
                      </p>
                      {status === 'active' && (
                        <span className="text-xs text-primary">In Progress</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stage.description}
                    </p>
                  </div>
                  
                  {/* Connector line */}
                  {index < stages.length - 1 && (
                    <div className="absolute left-[22px] mt-8 w-0.5 h-6 bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
