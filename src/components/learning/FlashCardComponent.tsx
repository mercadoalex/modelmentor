/**
 * Flash Card Component
 *
 * Displays one statement at a time with True/False buttons.
 * Provides immediate feedback with explanations after each answer.
 * Tracks score and advances through all statements.
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import type { LearningComponentProps, FlashCardContent, ComponentResult } from './types';

export default function FlashCardComponent({ content, onComplete }: LearningComponentProps) {
  const flashContent = content as FlashCardContent;
  const startTimeRef = useRef(Date.now());

  const totalStatements = flashContent.statements.length;

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const currentStatement = flashContent.statements[currentIndex];

  const handleAnswer = useCallback((answer: boolean) => {
    if (showResult || !currentStatement) return;

    setSelectedAnswer(answer);
    const correct = answer === currentStatement.isTrue;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore(prev => prev + 1);
    }

    setAnnouncement(
      correct
        ? `Correct! ${currentStatement.explanation}`
        : `Incorrect. The statement is ${currentStatement.isTrue ? 'true' : 'false'}. ${currentStatement.explanation}`
    );
  }, [showResult, currentStatement]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalStatements - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setAnnouncement('');
    } else {
      // All statements evaluated - complete
      const finalScore = score + (isCorrect ? 0 : 0); // score already updated in handleAnswer
      const result: ComponentResult = {
        componentType: 'flash_cards',
        score: finalScore,
        total: totalStatements,
        timeSpentMs: Date.now() - startTimeRef.current,
      };
      onComplete(result);
    }
  }, [currentIndex, totalStatements, score, isCorrect, onComplete]);

  if (!currentStatement) return null;

  return (
    <div className="space-y-4" role="region" aria-label="Flash cards activity">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          Card {currentIndex + 1} of {totalStatements}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          Score: {score}/{currentIndex + (showResult ? 1 : 0)}
        </Badge>
      </div>

      {/* Statement card */}
      <Card className="p-6 text-center">
        <p className="text-lg font-medium leading-relaxed">
          &ldquo;{currentStatement.statement}&rdquo;
        </p>
      </Card>

      {/* True/False buttons */}
      {!showResult && (
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleAnswer(true)}
            className="min-w-[120px] border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30"
          >
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
            True
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleAnswer(false)}
            className="min-w-[120px] border-2 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <XCircle className="h-5 w-5 mr-2 text-red-600" />
            False
          </Button>
        </div>
      )}

      {/* Feedback */}
      {showResult && (
        <>
          {/* Answer indicator */}
          <div className="flex justify-center gap-4">
            <div
              className={`min-w-[120px] px-4 py-2 rounded-lg border-2 text-center ${
                selectedAnswer === true
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/30'
                  : currentStatement.isTrue
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-border'
              }`}
            >
              <span className="flex items-center justify-center gap-1 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                True
                {selectedAnswer === true && !isCorrect && <XCircle className="h-3 w-3 text-red-600" />}
                {currentStatement.isTrue && <CheckCircle2 className="h-3 w-3 text-green-600" />}
              </span>
            </div>
            <div
              className={`min-w-[120px] px-4 py-2 rounded-lg border-2 text-center ${
                selectedAnswer === false
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-red-500 bg-red-50 dark:bg-red-950/30'
                  : !currentStatement.isTrue
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-border'
              }`}
            >
              <span className="flex items-center justify-center gap-1 text-sm">
                <XCircle className="h-4 w-4" />
                False
                {selectedAnswer === false && !isCorrect && <XCircle className="h-3 w-3 text-red-600" />}
                {!currentStatement.isTrue && <CheckCircle2 className="h-3 w-3 text-green-600" />}
              </span>
            </div>
          </div>

          {/* Explanation */}
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
              <p className="text-sm">{currentStatement.explanation}</p>
            </AlertDescription>
          </Alert>
        </>
      )}

      {/* ARIA live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Next button */}
      {showResult && (
        <div className="flex justify-end">
          <Button size="sm" onClick={handleNext}>
            {currentIndex < totalStatements - 1 ? (
              <>
                Next Card
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              'See Results'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
