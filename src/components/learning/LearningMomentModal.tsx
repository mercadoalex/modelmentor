/**
 * Learning Moment Modal Component
 * 
 * Displays contextual educational content in a dialog overlay.
 * Supports three-step flow: Content → Quiz → Summary
 */

import { useState, useEffect, useCallback } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SimplifiedExplanation } from '@/components/learning/SimplifiedExplanation';
import { 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { learningMomentService } from '@/services/learningMomentService';
import {
  getProcessedLearningMomentContent,
  type LearningMomentType,
  type LearningMomentContextData,
  type LearningMomentContent,
  type ContentSection,
  type LearningMomentQuizQuestion
} from '@/utils/learningMomentContent';
import type { ModelType } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';

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
  quizScore?: number;
  quizTotal?: number;
  timeSpentSeconds: number;
}

type ModalStep = 'content' | 'quiz' | 'summary';

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
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  // Summary state
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
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('content');
      setCurrentSectionIndex(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowHint(false);
      setQuizScore(0);
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
      // Move to quiz
      setCurrentStep('quiz');
    }
  }, [currentSectionIndex, sections.length]);

  const handlePrevSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  }, [currentSectionIndex]);

  // Handle quiz answer selection
  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (!showFeedback) {
      setSelectedAnswer(answerIndex);
    }
  }, [showFeedback]);

  // Handle quiz submission
  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null || !currentQuestion) return;

    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setQuizScore(prev => prev + 1);
    }
  }, [selectedAnswer, currentQuestion]);

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowHint(false);
    } else {
      // Quiz complete - move to summary
      handleQuizComplete();
    }
  }, [currentQuestionIndex, totalQuestions]);

  // Handle quiz completion
  const handleQuizComplete = useCallback(async () => {
    setCurrentStep('summary');

    // Record completion
    const result: LearningMomentResult = {
      momentType,
      completed: true,
      quizScore,
      quizTotal: totalQuestions,
      timeSpentSeconds: getTimeSpent()
    };

    await learningMomentService.recordCompletion(project.id, result);

    // Award points
    const gamificationResult = await learningMomentService.awardPoints(
      userId,
      project.id,
      momentType,
      quizScore,
      totalQuestions
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
    onComplete?.(result);
  }, [momentType, quizScore, totalQuestions, getTimeSpent, project.id, userId, onComplete]);

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
      case 'quiz':
        return 33 + ((currentQuestionIndex + 1) / totalQuestions) * 33;
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
              {currentStep === 'quiz' && `Quiz ${currentQuestionIndex + 1}/${totalQuestions}`}
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
            <span className={currentStep === 'quiz' ? 'text-primary font-medium' : ''}>
              ❓ Quiz
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

          {/* Quiz Step */}
          {currentStep === 'quiz' && currentQuestion && (
            <QuizStepView
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              showFeedback={showFeedback}
              isCorrect={isCorrect}
              showHint={showHint}
              onAnswerSelect={handleAnswerSelect}
              onShowHint={() => setShowHint(true)}
            />
          )}

          {/* Summary Step */}
          {currentStep === 'summary' && (
            <SummaryStepView
              quizScore={quizScore}
              totalQuestions={totalQuestions}
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
                        Start Quiz
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </>
              )}

              {currentStep === 'quiz' && (
                <>
                  {!showFeedback ? (
                    <Button 
                      size="sm" 
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleNextQuestion}>
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>
                          Next Question
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          See Results
                          <Sparkles className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
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

interface QuizStepViewProps {
  question: LearningMomentQuizQuestion;
  selectedAnswer: number | null;
  showFeedback: boolean;
  isCorrect: boolean;
  showHint: boolean;
  onAnswerSelect: (index: number) => void;
  onShowHint: () => void;
}

function QuizStepView({
  question,
  selectedAnswer,
  showFeedback,
  isCorrect,
  showHint,
  onAnswerSelect,
  onShowHint
}: QuizStepViewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{question.question}</h3>

      {/* Answer options */}
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect(index)}
            disabled={showFeedback}
            className={`w-full p-3 rounded-lg border-2 text-left transition-all text-sm ${
              selectedAnswer === index
                ? showFeedback
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/30'
                  : 'border-primary bg-primary/5'
                : showFeedback && index === question.correctAnswer
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                  : 'border-border hover:border-primary/50'
            } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
              {showFeedback && index === question.correctAnswer && (
                <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
              )}
              {showFeedback && selectedAnswer === index && !isCorrect && (
                <XCircle className="h-4 w-4 text-red-600 ml-auto" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Hint */}
      {!showFeedback && question.hint && (
        <div>
          {!showHint ? (
            <Button variant="outline" size="sm" onClick={onShowHint}>
              <Lightbulb className="h-4 w-4 mr-2" />
              Show Hint
            </Button>
          ) : (
            <Alert className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
              <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription>
                <p className="text-sm">{question.hint}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <Alert className={
          isCorrect
            ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30'
            : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30'
        }>
          {isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <AlertDescription>
            <p className="font-semibold mb-1">
              {isCorrect ? 'Correct! 🎉' : 'Not quite right'}
            </p>
            <p className="text-sm">{question.explanation}</p>
          </AlertDescription>
        </Alert>
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
