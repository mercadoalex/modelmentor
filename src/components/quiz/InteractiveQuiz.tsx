import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  XCircle,
  Lightbulb,
  Trophy,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { quizService, type QuizQuestion } from '@/services/quizService';
import { gamificationService } from '@/services/gamificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InteractiveQuizProps {
  topic?: string;
  onComplete?: () => void;
}

export function InteractiveQuiz({ topic, onComplete }: InteractiveQuizProps) {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-123'; // Fallback for development
  
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [matchingAnswers, setMatchingAnswers] = useState<{ [key: string]: string }>({});
  const [stats, setStats] = useState<{
    totalAttempts: number;
    totalCorrect: number;
    overallAccuracy: number;
    topicStats: { [topic: string]: { accuracy: number; mastery: number } };
    averageTime: number;
  }>({ 
    totalAttempts: 0, 
    totalCorrect: 0, 
    overallAccuracy: 0, 
    topicStats: {}, 
    averageTime: 0 
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNextQuestion();
    loadStats();
  }, [topic]);

  const loadStats = async () => {
    try {
      const statistics = await quizService.getStatistics(userId);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadNextQuestion = async () => {
    try {
      setIsLoading(true);
      const next = await quizService.getNextQuestion(userId, topic);
      if (next) {
        setCurrentQuestion(next);
        setSelectedAnswer('');
        setShowFeedback(false);
        setIsCorrect(false);
        setHintsUsed(0);
        setShowHint(false);
        setStartTime(Date.now());
        setMatchingAnswers({});
      } else {
        // No more questions
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Error loading question:', error);
      toast.error('Failed to load question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    try {
      setIsLoading(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      let answer: string | string[];
      let correct = false;

      switch (currentQuestion.type) {
        case 'multiple_choice':
        case 'true_false':
        case 'scenario':
          answer = selectedAnswer as string;
          correct = answer === currentQuestion.correctAnswer;
          break;
        
        case 'fill_blank':
          answer = (selectedAnswer as string).toLowerCase().trim();
          correct = answer === (currentQuestion.correctAnswer as string).toLowerCase().trim();
          break;
        
        case 'matching':
          answer = Object.values(matchingAnswers);
          // Check if all pairs are correctly matched
          correct = currentQuestion.matchingPairs?.every(pair => 
            matchingAnswers[pair.term] === pair.definition
          ) || false;
          break;
      }

      setIsCorrect(correct);
      setShowFeedback(true);

      // Record attempt
      const result = await quizService.recordAttempt(
        userId,
        currentQuestion.id,
        answer,
        correct,
        timeSpent,
        hintsUsed
      );

      // Update gamification
      if (correct) {
        await gamificationService.addPoints(userId, result.points + result.bonusPoints);
        
        // Show success toast
        toast.success('Correct! 🎉', {
          description: `+${result.points + result.bonusPoints} points${result.bonusPoints > 0 ? ` (${result.bonusPoints} bonus!)` : ''}`
        });

        // Check for new achievements
        if (result.newAchievements.length > 0) {
          result.newAchievements.forEach(achievement => {
            toast.success('Achievement Unlocked! 🏆', {
              description: achievement.replace(/_/g, ' ').toUpperCase()
            });
          });
        }
      }

      // Update stats
      await loadStats();
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    loadNextQuestion();
  };

  const handleShowHint = () => {
    setShowHint(true);
    setHintsUsed(hintsUsed + 1);
  };

  if (!currentQuestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Quiz Complete!
          </CardTitle>
          <CardDescription>
            You've completed all available questions for this topic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border bg-card text-center">
              <p className="text-3xl font-bold">{stats.totalAttempts}</p>
              <p className="text-sm text-muted-foreground">Questions Attempted</p>
            </div>
            <div className="p-4 rounded-lg border bg-card text-center">
              <p className="text-3xl font-bold">{stats.overallAccuracy.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Overall Accuracy</p>
            </div>
            <div className="p-4 rounded-lg border bg-card text-center">
              <p className="text-3xl font-bold">{stats.averageTime.toFixed(0)}s</p>
              <p className="text-sm text-muted-foreground">Avg Time</p>
            </div>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try More Questions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quiz Challenge
              </CardTitle>
              <CardDescription className="mt-1">
                Test your understanding and earn points!
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                <Trophy className="h-3 w-3 mr-1" />
                {stats.totalCorrect} Correct
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Target className="h-3 w-3 mr-1" />
                {stats.overallAccuracy.toFixed(0)}% Accuracy
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">
              {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
            </Badge>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {Math.floor((Date.now() - startTime) / 1000)}s
            </Badge>
          </div>
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Multiple Choice / True-False / Scenario */}
          {(currentQuestion.type === 'multiple_choice' || 
            currentQuestion.type === 'true_false' || 
            currentQuestion.type === 'scenario') && (
            <div className="space-y-3">
              {currentQuestion.type === 'true_false' ? (
                <div className="grid grid-cols-2 gap-3">
                  {['true', 'false'].map((option) => (
                    <button
                      key={option}
                      onClick={() => !showFeedback && setSelectedAnswer(option)}
                      disabled={showFeedback}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedAnswer === option
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      } ${showFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <p className="font-semibold capitalize">{option}</p>
                    </button>
                  ))}
                </div>
              ) : (
                currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !showFeedback && setSelectedAnswer(option)}
                    disabled={showFeedback}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedAnswer === option
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    } ${showFeedback ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <p className="text-sm leading-relaxed">{option}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Fill in the Blank */}
          {currentQuestion.type === 'fill_blank' && (
            <div className="space-y-2">
              <Input
                value={selectedAnswer as string}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={showFeedback}
                placeholder="Type your answer here..."
                className="text-base"
              />
            </div>
          )}

          {/* Matching */}
          {currentQuestion.type === 'matching' && currentQuestion.matchingPairs && (
            <div className="space-y-4">
              {currentQuestion.matchingPairs.map((pair, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 p-3 rounded-lg border bg-card">
                    <p className="font-semibold text-sm">{pair.term}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <select
                    value={matchingAnswers[pair.term] || ''}
                    onChange={(e) => setMatchingAnswers({
                      ...matchingAnswers,
                      [pair.term]: e.target.value
                    })}
                    disabled={showFeedback}
                    className="flex-1 p-3 rounded-lg border bg-background text-sm"
                  >
                    <option value="">Select definition...</option>
                    {currentQuestion.matchingPairs?.map((p, i) => (
                      <option key={i} value={p.definition}>
                        {p.definition}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Hint */}
          {!showFeedback && currentQuestion.hint && (
            <div>
              {!showHint ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShowHint}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Show Hint
                </Button>
              ) : (
                <Alert className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
                  <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription>
                    <p className="text-sm leading-relaxed">{currentQuestion.hint}</p>
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
                <p className="font-semibold mb-2">
                  {isCorrect ? 'Correct! 🎉' : 'Not quite right 🤔'}
                </p>
                <p className="text-sm leading-relaxed mb-2">
                  {currentQuestion.explanation}
                </p>
                {!isCorrect && (
                  <p className="text-sm font-semibold">
                    Correct answer: {Array.isArray(currentQuestion.correctAnswer) 
                      ? currentQuestion.correctAnswer.join(', ') 
                      : currentQuestion.correctAnswer}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!showFeedback ? (
              <Button 
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  (currentQuestion.type === 'matching' && Object.keys(matchingAnswers).length !== (currentQuestion.matchingPairs?.length || 0)) ||
                  (!selectedAnswer && currentQuestion.type !== 'matching')
                }
                className="flex-1"
              >
                {isLoading ? 'Submitting...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1">
                <Sparkles className="h-4 w-4 mr-2" />
                Next Question
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Topic Progress */}
      {topic && stats.topicStats[topic] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topic Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Mastery Level</span>
                <span className="font-semibold">{stats.topicStats[topic].mastery.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${stats.topicStats[topic].mastery}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.topicStats[topic].mastery >= 85 
                  ? 'Excellent! You\'ve mastered this topic! 🌟'
                  : stats.topicStats[topic].mastery >= 70
                  ? 'Great progress! Keep going! 💪'
                  : 'Keep practicing to improve! 📚'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
