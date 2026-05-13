/**
 * Quiz Component
 *
 * Standalone multiple-choice quiz component extracted from LearningMomentModal.
 * Presents questions sequentially with immediate feedback and explanations.
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Lightbulb, ChevronRight } from 'lucide-react';
import type { LearningComponentProps, QuizContent, ComponentResult } from './types';

export default function QuizComponent({ content, onComplete }: LearningComponentProps) {
  const quizContent = content as QuizContent;
  const startTimeRef = useRef(Date.now());

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = quizContent.questions[currentQuestionIndex];
  const totalQuestions = quizContent.questions.length;

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (!showFeedback) {
      setSelectedAnswer(answerIndex);
    }
  }, [showFeedback]);

  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null || !currentQuestion) return;

    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(prev => prev + 1);
    }
  }, [selectedAnswer, currentQuestion]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowHint(false);
      setIsCorrect(false);
    } else {
      // Quiz complete
      const result: ComponentResult = {
        componentType: 'quiz',
        score: score + (isCorrect ? 0 : 0), // score already updated
        total: totalQuestions,
        timeSpentMs: Date.now() - startTimeRef.current,
      };
      onComplete(result);
    }
  }, [currentQuestionIndex, totalQuestions, score, isCorrect, onComplete]);

  if (!currentQuestion) return null;

  return (
    <div className="space-y-4" role="region" aria-label="Quiz activity">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          Score: {score}/{currentQuestionIndex + (showFeedback ? 1 : 0)}
        </Badge>
      </div>

      {/* Question */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>

        {/* Answer options */}
        <div className="space-y-2" role="radiogroup" aria-label="Answer options">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showFeedback}
              role="radio"
              aria-checked={selectedAnswer === index}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all text-sm ${
                selectedAnswer === index
                  ? showFeedback
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                      : 'border-red-500 bg-red-50 dark:bg-red-950/30'
                    : 'border-primary bg-primary/5'
                  : showFeedback && index === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-border hover:border-primary/50'
              } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
                {showFeedback && index === currentQuestion.correctAnswer && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                )}
                {showFeedback && selectedAnswer === index && !isCorrect && (
                  <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Hint */}
      {!showFeedback && currentQuestion.hint && (
        <div>
          {!showHint ? (
            <Button variant="outline" size="sm" onClick={() => setShowHint(true)}>
              <Lightbulb className="h-4 w-4 mr-2" />
              Show Hint
            </Button>
          ) : (
            <Alert className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
              <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription>
                <p className="text-sm">{currentQuestion.hint}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <Alert
          className={
            isCorrect
              ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30'
              : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30'
          }
        >
          {isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <AlertDescription>
            <p className="font-semibold mb-1">
              {isCorrect ? 'Correct! 🎉' : 'Not quite right'}
            </p>
            <p className="text-sm">{currentQuestion.explanation}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* ARIA live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {showFeedback && (
          isCorrect
            ? `Correct! ${currentQuestion.explanation}`
            : `Incorrect. The correct answer is ${currentQuestion.options[currentQuestion.correctAnswer]}. ${currentQuestion.explanation}`
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
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
              'See Results'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
