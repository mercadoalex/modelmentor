import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InteractiveTour } from '@/components/onboarding/InteractiveTour';
import { TutorialQuizComponent } from '@/components/quiz/TutorialQuizComponent';
import { tutorialCategories, getTutorialsByCategory, getAllTutorials, type Tutorial } from '@/data/tutorials';
import { getQuizForTutorial } from '@/data/quizzes';
import { tutorialService } from '@/services/tutorialService';
import { quizService } from '@/services/quizService';
import { badgeService } from '@/services/badgeService';
import { useAuth } from '@/contexts/AuthContext';
import { Play, CheckCircle2, Clock, Search, RotateCcw, BookOpen, Award, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function TutorialsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTour, setActiveTour] = useState<Tutorial | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizTutorialId, setCurrentQuizTutorialId] = useState<string | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCompletedTutorials();
    loadEarnedBadges();
  }, [user]);

  const loadCompletedTutorials = async () => {
    if (!user) return;

    const tutorials = await tutorialService.getAllTutorials(user.id);
    const completed = new Set(
      tutorials
        .filter(t => t.status === 'completed')
        .map(t => t.tutorial_id)
    );
    setCompletedTutorials(completed);
  };

  const loadEarnedBadges = async () => {
    if (!user) return;

    const badges = await badgeService.getTutorialBadges(user.id);
    setEarnedBadges(new Set(badges));
  };

  const handleStartTutorial = async (tutorial: Tutorial) => {
    if (!user) {
      toast.error('Please sign in to access tutorials');
      return;
    }

    await tutorialService.startTutorial(user.id, tutorial.id);
    setActiveTour(tutorial);
    toast.success(`Starting tutorial: ${tutorial.title}`);
  };

  const handleCompleteTour = async () => {
    if (!user || !activeTour) return;

    await tutorialService.completeTutorial(user.id, activeTour.id);
    setActiveTour(null);
    loadCompletedTutorials();
    
    // Show quiz after completing tutorial
    const quiz = getQuizForTutorial(activeTour.id);
    if (quiz) {
      setCurrentQuizTutorialId(activeTour.id);
      setShowQuiz(true);
      toast.success('Tutorial completed! Take the quiz to earn a badge.');
    } else {
      toast.success('Tutorial completed!');
    }
  };

  const handleSkipTour = async () => {
    if (!user || !activeTour) return;

    await tutorialService.skipTutorial(user.id, activeTour.id);
    setActiveTour(null);
    toast.info('Tutorial skipped');
  };

  const handleQuizComplete = async (
    score: number,
    passed: boolean,
    answers: Array<{ question_id: string; selected_answer: string; is_correct: boolean }>
  ) => {
    if (!user || !currentQuizTutorialId) return;

    const timeTaken = 0; // Will be calculated in component
    await quizService.submitQuizResult(user.id, currentQuizTutorialId, answers, timeTaken);

    if (passed) {
      // Award badge
      await badgeService.awardTutorialBadge(user.id, currentQuizTutorialId);
      loadEarnedBadges();
      toast.success(`🎉 Quiz passed! You earned a badge with ${score}% score!`, {
        duration: 5000,
      });
    } else {
      toast.info(`Quiz score: ${score}%. You need 70% to pass and earn a badge.`);
    }
  };

  const handleCloseQuiz = () => {
    setShowQuiz(false);
    setCurrentQuizTutorialId(null);
  };

  const handleTakeQuiz = (tutorialId: string) => {
    if (!user) {
      toast.error('Please sign in to take quizzes');
      return;
    }

    setCurrentQuizTutorialId(tutorialId);
    setShowQuiz(true);
  };

  const handleResetTutorial = async (tutorialId: string) => {
    if (!user) return;

    await tutorialService.resetTutorial(user.id, tutorialId);
    loadCompletedTutorials();
    toast.success('Tutorial progress reset');
  };

  const filteredTutorials = getAllTutorials().filter(tutorial =>
    tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Tutorial Library</h1>
              <p className="text-muted-foreground">
                Interactive guides to help you master ModelMentor
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Tutorials</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{getAllTutorials().length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{completedTutorials.size}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {getAllTutorials().length > 0
                  ? Math.round((completedTutorials.size / getAllTutorials().length) * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tutorial Categories */}
        {tutorialCategories.map(category => {
          const categoryTutorials = searchQuery
            ? filteredTutorials.filter(t => t.category === category.id)
            : getTutorialsByCategory(category.id);

          if (categoryTutorials.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{category.title}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {categoryTutorials.map(tutorial => {
                  const isCompleted = completedTutorials.has(tutorial.id);
                  const hasBadge = earnedBadges.has(tutorial.id);
                  const hasQuiz = !!getQuizForTutorial(tutorial.id);

                  return (
                    <Card key={tutorial.id} className="relative h-full flex flex-col">
                      <div className="absolute top-4 right-4 flex gap-2">
                        {hasBadge && (
                          <Badge className="gap-1">
                            <Trophy className="h-3 w-3" />
                            Badge Earned
                          </Badge>
                        )}
                        {isCompleted && !hasBadge && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                      </div>

                      <CardHeader>
                        <CardTitle className="text-balance pr-24">{tutorial.title}</CardTitle>
                        <CardDescription className="text-pretty">
                          {tutorial.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {tutorial.estimatedTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <Play className="h-4 w-4" />
                            {tutorial.steps.length} steps
                          </div>
                          {hasQuiz && (
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              Quiz
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <Button
                            onClick={() => handleStartTutorial(tutorial)}
                            className="flex-1"
                            variant={isCompleted ? 'outline' : 'default'}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {isCompleted ? 'Replay' : 'Start Tutorial'}
                          </Button>

                          {hasQuiz && (
                            <Button
                              onClick={() => handleTakeQuiz(tutorial.id)}
                              variant={hasBadge ? 'outline' : 'secondary'}
                              className="flex-1"
                            >
                              <Award className="h-4 w-4 mr-2" />
                              {hasBadge ? 'Retake Quiz' : 'Take Quiz'}
                            </Button>
                          )}

                          {isCompleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetTutorial(tutorial.id)}
                              title="Reset progress"
                              className="shrink-0"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* No results */}
        {searchQuery && filteredTutorials.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No tutorials found matching "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Tour */}
      {activeTour && (
        <InteractiveTour
          steps={activeTour.steps}
          isActive={true}
          onComplete={handleCompleteTour}
          onSkip={handleSkipTour}
          tourId={activeTour.id}
        />
      )}

      {/* Quiz Dialog */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Tutorial Quiz</DialogTitle>
            <DialogDescription>Test your knowledge</DialogDescription>
          </DialogHeader>
          {currentQuizTutorialId && (
            <TutorialQuizComponent
              quiz={getQuizForTutorial(currentQuizTutorialId)!}
              onComplete={handleQuizComplete}
              onClose={handleCloseQuiz}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
