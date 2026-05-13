/**
 * Learning Moment Modal Component
 * 
 * Displays contextual educational content in a dialog overlay.
 * Supports three-step flow: Content → Activity → Summary
 * 
 * The Activity step dynamically selects from available interactive components
 * (Quiz, Matching, Fill in the Blanks, Flash Cards, Sorting) using the
 * ComponentSelector and ComponentRegistry.
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SimplifiedExplanation } from '@/components/learning/SimplifiedExplanation';
import { 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft,
  Trophy,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { learningMomentService } from '@/services/learningMomentService';
import {
  getProcessedLearningMomentContent,
  type LearningMomentType,
  type LearningMomentContextData,
  type LearningMomentContent,
  type ContentSection
} from '@/utils/learningMomentContent';
import type { ModelType } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';
import { selectComponent } from './componentSelector';
import { getComponentForType } from './ComponentRegistry';
import { LearningComponentErrorBoundary } from './LearningComponentErrorBoundary';
import type { LearningComponentType, ComponentResult, QuizContent } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  model_type: ModelType;
  is_guided_tour?: boolean;
}

export interface LearningMomentModalProps {
  /** Type of learning moment to display */
  momentType: LearningMomentType;
  /** Project context for content adaptation */
  project: Project;
  /** Context data for dynamic content */
  contextData?: LearningMomentContextData;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when learning moment is completed */
  onComplete?: (result: LearningMomentResult) => void;
  /** Whether this is a guided tour project */
  isGuidedTour?: boolean;
}

export interface LearningMomentResult {
  momentType: LearningMomentType;
  completed: boolean;
  componentType: LearningComponentType;
  score: number;
  total: number;
  timeSpentSeconds: number;
}

type ModalStep = 'content' | 'activity' | 'summary';

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function LearningMomentModal({
  momentType,
  project,
  contextData = {},
  isOpen,
  onClose,
  onComplete,
  isGuidedTour = false
}: LearningMomentModalProps) {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-123';

  // State
  const [currentStep, setCurrentStep] = useState<ModalStep>('content');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Activity state (dynamic component selection)
  const [selectedComponentType, setSelectedComponentType] = useState<LearningComponentType | null>(null);
  
  // Summary state
  const [activityScore, setActivityScore] = useState(0);
  const [activityTotal, setActivityTotal] = useState(0);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [achievementsUnlocked, setAchievementsUnlocked] = useState<string[]>([]);

  // Get processed content
  const content: LearningMomentContent = getProcessedLearningMomentContent(
    project.model_type,
    momentType,
    contextData
  );

  const sections = content.sections;
  const quiz = content.quiz;
  const currentSection = sections[currentSectionIndex];

  // Build quiz content for fallback and quiz component type
  const quizContent: QuizContent = {
    questions: quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      hint: q.hint,
    })),
    passingScore: quiz.passingScore,
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('content');
      setCurrentSectionIndex(0);
      setSelectedComponentType(null);
      setActivityScore(0);
      setActivityTotal(0);
      setDontShowAgain(false);
    }
  }, [isOpen]);

  // Calculate time spent
  const getTimeSpent = useCallback(() => {
    return Math.floor((Date.now() - startTime) / 1000);
  }, [startTime]);

  // Handle close
  const handleClose = useCallback(() => {
    if (dontShowAgain && !isGuidedTour) {
      learningMomentService.setDontShowPreference(momentType, true);
    }
    onClose();
  }, [dontShowAgain, isGuidedTour, momentType, onClose]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (dontShowAgain && !isGuidedTour) {
      learningMomentService.setDontShowPreference(momentType, true);
    }
    onClose();
  }, [dontShowAgain, isGuidedTour, momentType, onClose]);

  // Navigate content sections
  const handleNextSection = useCallback(() => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      // Move to activity step - select a component
      const interactive = content.interactive;
      if (interactive) {
        const hasQuiz = quiz.questions.length > 0;
        const componentType = selectComponent(interactive, hasQuiz);
        setSelectedComponentType(componentType);
      } else {
        // No interactive content, fall back to quiz
        setSelectedComponentType('quiz');
      }
      setCurrentStep('activity');
    }
  }, [currentSectionIndex, sections.length, content.interactive]);

  const handlePrevSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  }, [currentSectionIndex]);

  // Handle activity component completion
  const handleActivityComplete = useCallback(async (result: ComponentResult) => {
    setActivityScore(result.score);
    setActivityTotal(result.total);
    setCurrentStep('summary');

    // Record completion
    const completionResult: LearningMomentResult = {
      momentType,
      completed: true,
      componentType: result.componentType,
      score: result.score,
      total: result.total,
      timeSpentSeconds: getTimeSpent()
    };

    await learningMomentService.recordCompletion(project.id, completionResult);

    // Award points
    const gamificationResult = await learningMomentService.awardPoints(
      userId,
      project.id,
      momentType,
      result.score,
      result.total
    );

    setPointsAwarded(gamificationResult.pointsAwarded);
    setBonusPoints(gamificationResult.bonusPoints);
    setAchievementsUnlocked(gamificationResult.achievementsUnlocked);

    // Show toast for points
    const totalPoints = gamificationResult.pointsAwarded + gamificationResult.bonusPoints;
    toast.success(`+${totalPoints} points earned!`, {
      description: gamificationResult.bonusPoints > 0 
        ? `Including ${gamificationResult.bonusPoints} bonus for perfect score!`
        : undefined
    });

    // Show toast for achievements
    gamificationResult.achievementsUnlocked.forEach(achievement => {
      toast.success('Achievement Unlocked! 🏆', {
        description: achievement.replace(/_/g, ' ').toUpperCase()
      });
    });

    // Notify parent
    onComplete?.(completionResult);
  }, [momentType, getTimeSpent, project.id, userId, onComplete]);

  // Handle completion (close from summary)
  const handleComplete = useCallback(() => {
    if (dontShowAgain && !isGuidedTour) {
      learningMomentService.setDontShowPreference(momentType, true);
    }
    onClose();
  }, [dontShowAgain, isGuidedTour, momentType, onClose]);

  // Get step progress
  const getStepProgress = () => {
    switch (currentStep) {
      case 'content':
        return ((currentSectionIndex + 1) / sections.length) * 33;
      case 'activity':
        return 50;
      case 'summary':
        return 100;
      default:
        return 0;
    }
  };

  // Get moment title
  const getMomentTitle = () => {
    switch (momentType) {
      case 'data':
        return 'Learn: Data';
      case 'model':
        return 'Learn: Model';
      case 'next_steps':
        return 'Learn: Next Steps';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-lg">{getMomentTitle()}</DialogTitle>
                <DialogDescription className="text-sm">
                  {content.title}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentStep === 'content' && `${currentSectionIndex + 1}/${sections.length}`}
              {currentStep === 'activity' && 'Activity'}
              {currentStep === 'summary' && 'Complete!'}
            </Badge>
          </div>
          
          {/* Progress bar */}
          <Progress value={getStepProgress()} className="h-1 mt-3" />
          
          {/* Step indicators */}
          <div className="flex justify-center gap-8 mt-2 text-xs text-muted-foreground">
            <span className={currentStep === 'content' ? 'text-primary font-medium' : ''}>
              📖 Learn
            </span>
            <span className={currentStep === 'activity' ? 'text-primary font-medium' : ''}>
              🎯 Activity
            </span>
            <span className={currentStep === 'summary' ? 'text-primary font-medium' : ''}>
              🎉 Summary
            </span>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {/* Content Step */}
          {currentStep === 'content' && currentSection && (
            <ContentStepView 
              section={currentSection}
            />
          )}

          {/* Activity Step (Dynamic Component) */}
          {currentStep === 'activity' && selectedComponentType && (() => {
            const SelectedComponent = getComponentForType(selectedComponentType);
            const componentContent = selectedComponentType === 'quiz'
              ? quizContent
              : content.interactive?.[
                  selectedComponentType === 'fill_blanks' ? 'fillBlanks' :
                  selectedComponentType === 'flash_cards' ? 'flashCards' :
                  selectedComponentType
                ];

            if (!componentContent) {
              // Fallback to quiz if content is missing
              return (
                <LearningComponentErrorBoundary
                  fallbackContent={quizContent}
                  onComplete={handleActivityComplete}
                >
                  <Suspense fallback={<div className="flex items-center justify-center p-8"><span className="text-sm text-muted-foreground">Loading activity...</span></div>}>
                    <SelectedComponent content={quizContent} onComplete={handleActivityComplete} />
                  </Suspense>
                </LearningComponentErrorBoundary>
              );
            }

            return (
              <LearningComponentErrorBoundary
                fallbackContent={quizContent}
                onComplete={handleActivityComplete}
              >
                <Suspense fallback={<div className="flex items-center justify-center p-8"><span className="text-sm text-muted-foreground">Loading activity...</span></div>}>
                  <SelectedComponent content={componentContent} onComplete={handleActivityComplete} />
                </Suspense>
              </LearningComponentErrorBoundary>
            );
          })()}

          {/* Summary Step */}
          {currentStep === 'summary' && (
            <SummaryStepView
              quizScore={activityScore}
              totalQuestions={activityTotal}
              pointsAwarded={pointsAwarded}
              bonusPoints={bonusPoints}
              achievementsUnlocked={achievementsUnlocked}
              momentType={momentType}
            />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            {/* Don't show again checkbox (hidden in guided tour) */}
            {!isGuidedTour && currentStep !== 'summary' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dontShowAgain"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                />
                <label
                  htmlFor="dontShowAgain"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Don't show again
                </label>
              </div>
            )}
            {(isGuidedTour || currentStep === 'summary') && <div />}

            {/* Navigation buttons */}
            <div className="flex gap-2">
              {currentStep === 'content' && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleSkip}>
                    Skip for now
                  </Button>
                  {currentSectionIndex > 0 && (
                    <Button variant="outline" size="sm" onClick={handlePrevSection}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                  <Button size="sm" onClick={handleNextSection}>
                    {currentSectionIndex < sections.length - 1 ? (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Start Activity
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </>
              )}

              {currentStep === 'summary' && (
                <Button size="sm" onClick={handleComplete}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Done
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface ContentStepViewProps {
  section: ContentSection;
}

function ContentStepView({ section }: ContentStepViewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{section.title}</h3>
      
      {/* Main content with markdown-like rendering */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {section.content.split('\n\n').map((paragraph, idx) => (
          <p key={idx} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {paragraph.split('**').map((part, partIdx) => 
              partIdx % 2 === 1 ? (
                <strong key={partIdx} className="text-foreground">{part}</strong>
              ) : (
                part
              )
            )}
          </p>
        ))}
      </div>

      {/* Explanations */}
      {section.explanations && section.explanations.length > 0 && (
        <div className="space-y-3 mt-4">
          {section.explanations.map((explanation, idx) => (
            <SimplifiedExplanation
              key={idx}
              term={explanation.term}
              explanation={explanation.explanation}
              example={explanation.example}
              variant={explanation.variant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SummaryStepViewProps {
  quizScore: number;
  totalQuestions: number;
  pointsAwarded: number;
  bonusPoints: number;
  achievementsUnlocked: string[];
  momentType: LearningMomentType;
}

function SummaryStepView({
  quizScore,
  totalQuestions,
  pointsAwarded,
  bonusPoints,
  achievementsUnlocked,
  momentType
}: SummaryStepViewProps) {
  const isPerfect = quizScore === totalQuestions;
  const percentage = totalQuestions > 0 ? Math.round((quizScore / totalQuestions) * 100) : 0;

  const getMomentName = () => {
    switch (momentType) {
      case 'data':
        return 'Data Quality';
      case 'model':
        return 'Model Understanding';
      case 'next_steps':
        return 'Next Steps';
    }
  };

  return (
    <div className="space-y-6 text-center">
      {/* Celebration */}
      <div className="py-4">
        <div className="text-6xl mb-4">
          {isPerfect ? '🏆' : percentage >= 50 ? '🎉' : '📚'}
        </div>
        <h3 className="text-xl font-bold">
          {isPerfect ? 'Perfect Score!' : percentage >= 50 ? 'Great Job!' : 'Keep Learning!'}
        </h3>
        <p className="text-muted-foreground mt-1">
          You completed the {getMomentName()} learning moment
        </p>
      </div>

      {/* Quiz Results */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">Quiz Results</span>
        </div>
        <div className="text-3xl font-bold text-primary">
          {quizScore}/{totalQuestions}
        </div>
        <p className="text-sm text-muted-foreground">
          {percentage}% correct
        </p>
      </div>

      {/* Points Earned */}
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span className="font-semibold">Points Earned</span>
        </div>
        <div className="text-3xl font-bold text-primary">
          +{pointsAwarded + bonusPoints}
        </div>
        {bonusPoints > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Includes +{bonusPoints} bonus for perfect score!
          </p>
        )}
      </div>

      {/* Achievements */}
      {achievementsUnlocked.length > 0 && (
        <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-amber-800 dark:text-amber-200">
              Achievements Unlocked!
            </span>
          </div>
          <div className="space-y-1">
            {achievementsUnlocked.map((achievement, idx) => (
              <Badge key={idx} variant="secondary" className="mx-1">
                🏆 {achievement.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Encouragement */}
      <p className="text-sm text-muted-foreground">
        {isPerfect 
          ? "You've mastered this topic! Keep up the excellent work! 🌟"
          : "Every step forward is progress. Keep exploring and learning! 💪"}
      </p>
    </div>
  );
}
