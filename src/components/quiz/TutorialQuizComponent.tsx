import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Clock, Award, RotateCcw, ArrowRight } from 'lucide-react';
import type { TutorialQuiz, QuizQuestion } from '@/data/quizzes';

interface TutorialQuizComponentProps {
  quiz: TutorialQuiz;
  onComplete: (score: number, passed: boolean, answers: Array<{ question_id: string; selected_answer: string; is_correct: boolean }>) => void;
  onClose: () => void;
}

export function TutorialQuizComponent({ quiz, onComplete, onClose }: TutorialQuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasAnswered = selectedAnswers[currentQuestion.id] !== undefined;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answerIndex,
    });
    setShowFeedback(false);
  };

  const handleNext = () => {
    if (!hasAnswered) return;

    setShowFeedback(true);

    // Wait a moment to show feedback before moving to next question
    setTimeout(() => {
      if (isLastQuestion) {
        handleSubmit();
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setShowFeedback(false);
      }
    }, 2000);
  };

  const handleSubmit = () => {
    const answers = quiz.questions.map(q => {
      const selectedIndex = selectedAnswers[q.id];
      return {
        question_id: q.id,
        selected_answer: q.options[selectedIndex],
        is_correct: selectedIndex === q.correctAnswer,
      };
    });

    const correctCount = answers.filter(a => a.is_correct).length;
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    setShowResults(true);
    
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    onComplete(score, passed, answers);
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowFeedback(false);
  };

  if (showResults) {
    const correctCount = Object.entries(selectedAnswers).filter(
      ([questionId, answerIndex]) => {
        const question = quiz.questions.find(q => q.id === questionId);
        return question && answerIndex === question.correctAnswer;
      }
    ).length;

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-balance">Quiz Complete!</CardTitle>
              <CardDescription className="text-pretty">
                Here are your results
              </CardDescription>
            </div>
            {passed ? (
              <Award className="h-12 w-12 text-primary" />
            ) : (
              <RotateCcw className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score */}
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold">{score}%</div>
            <p className="text-muted-foreground">
              {correctCount} out of {quiz.questions.length} correct
            </p>
          </div>

          {/* Pass/Fail Badge */}
          <div className="flex justify-center">
            {passed ? (
              <Badge className="gap-2 px-4 py-2 text-base">
                <CheckCircle2 className="h-5 w-5" />
                Passed! (Required: {quiz.passingScore}%)
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-2 px-4 py-2 text-base">
                <XCircle className="h-5 w-5" />
                Not Passed (Required: {quiz.passingScore}%)
              </Badge>
            )}
          </div>

          {/* Review Answers */}
          <div className="space-y-4">
            <h3 className="font-semibold">Review Your Answers</h3>
            {quiz.questions.map((question, index) => {
              const selectedIndex = selectedAnswers[question.id];
              const isCorrect = selectedIndex === question.correctAnswer;

              return (
                <Card key={question.id} className={isCorrect ? 'border-green-500' : 'border-red-500'}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-base text-balance">
                          {index + 1}. {question.question}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Your answer:</p>
                      <p className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {question.options[selectedIndex]}
                      </p>
                    </div>
                    {!isCorrect && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Correct answer:</p>
                        <p className="text-green-600">
                          {question.options[question.correctAnswer]}
                        </p>
                      </div>
                    )}
                    <div className="text-sm pt-2 border-t">
                      <p className="text-muted-foreground">{question.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!passed && (
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button onClick={onClose} className="flex-1">
              {passed ? 'Continue' : 'Close'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="space-y-4">
          <div>
            <CardTitle className="text-balance">{quiz.title}</CardTitle>
            <CardDescription className="text-pretty">{quiz.description}</CardDescription>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <Badge variant="secondary">
                Passing: {quiz.passingScore}%
              </Badge>
            </div>
            <Progress 
              value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} 
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-balance">
            {currentQuestion.question}
          </h3>

          {/* Options */}
          <RadioGroup
            value={selectedAnswers[currentQuestion.id]?.toString()}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
          >
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestion.id] === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const showCorrectness = showFeedback && isSelected;

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? showCorrectness
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : 'border-red-500 bg-red-50 dark:bg-red-950'
                          : 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer text-pretty"
                    >
                      {option}
                    </Label>
                    {showCorrectness && (
                      isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </RadioGroup>

          {/* Feedback */}
          {showFeedback && (
            <Card className={
              selectedAnswers[currentQuestion.id] === currentQuestion.correctAnswer
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : 'border-red-500 bg-red-50 dark:bg-red-950'
            }>
              <CardContent className="pt-4">
                <p className="text-sm text-pretty">{currentQuestion.explanation}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{Math.round((Date.now() - startTime) / 1000)}s</span>
          </div>

          <Button
            onClick={handleNext}
            disabled={!hasAnswered || showFeedback}
          >
            {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
