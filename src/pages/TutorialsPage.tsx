import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InteractiveTour } from '@/components/onboarding/InteractiveTour';
import { TutorialQuizComponent } from '@/components/quiz/TutorialQuizComponent';
import { getQuizForTutorial } from '@/data/quizzes';
import { tutorialService } from '@/services/tutorialService';
import { quizService } from '@/services/quizService';
import { badgeService } from '@/services/badgeService';
import { useAuth } from '@/contexts/AuthContext';
import { Play, CheckCircle2, Clock, Search, RotateCcw, BookOpen, Award, Tag, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { tutorialCategories, getTutorialsByCategory, getAllTutorials, tutorials, type Tutorial } from '@/data/tutorials';

export default function TutorialsPage() {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTour, setActiveTour] = useState<Tutorial | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizTutorialId, setCurrentQuizTutorialId] = useState<string | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());

  // ── Load data on mount / user change ──────────────────────────────
  useEffect(() => {
    loadCompletedTutorials();
    loadEarnedBadges();
  }, [user]);

  // Load which tutorials the current user has completed
  const loadCompletedTutorials = async () => {
    if (!user) return;
    const allTutorials = await tutorialService.getAllTutorials(user.id);
    const completed = new Set(
      allTutorials
        .filter(t => t.status === 'completed')
        .map(t => t.tutorial_id)
    );
    setCompletedTutorials(completed);
  };

  // Load which quiz badges the user has already earned
  const loadEarnedBadges = async () => {
    if (!user) return;
    const badges = await badgeService.getTutorialBadges(user.id);
    setEarnedBadges(new Set(badges));
  };

  // ── Tutorial lifecycle handlers ────────────────────────────────────

  // Start a tutorial — marks it as started in DB and activates the tour
  const handleStartTutorial = async (tutorial: Tutorial) => {
    if (!user) {
      toast.error('Please sign in to access tutorials');
      return;
    }
    await tutorialService.startTutorial(user.id, tutorial.id);
    setActiveTour(tutorial);
    toast.success(`Starting tutorial: ${tutorial.title}`);
  };

  // Called when user finishes all tour steps — marks complete and shows quiz if available
  const handleCompleteTour = async () => {
    if (!user || !activeTour) return;
    await tutorialService.completeTutorial(user.id, activeTour.id);
    setActiveTour(null);
    loadCompletedTutorials();

    const quiz = getQuizForTutorial(activeTour.id);
    if (quiz) {
      setCurrentQuizTutorialId(activeTour.id);
      setShowQuiz(true);
      toast.success('Tutorial completed! Take the quiz to earn a badge.');
    } else {
      toast.success('Tutorial completed!');
    }
  };

  // Called when user clicks "Skip" during a tour
  const handleSkipTour = async () => {
    if (!user || !activeTour) return;
    await tutorialService.skipTutorial(user.id, activeTour.id);
    setActiveTour(null);
    toast.info('Tutorial skipped');
  };

  // ── Quiz handlers ──────────────────────────────────────────────────

  // Manually open the quiz for a completed tutorial
  const handleTakeQuiz = (tutorialId: string) => {
    if (!user) {
      toast.error('Please sign in to take quizzes');
      return;
    }
    setCurrentQuizTutorialId(tutorialId);
    setShowQuiz(true);
  };

  // Called when the quiz component reports completion — submits score and awards badge if passed
  const handleQuizComplete = async (
    score: number,
    passed: boolean,
    answers: Array<{ question_id: string; selected_answer: string; is_correct: boolean }>
  ) => {
    if (!user || !currentQuizTutorialId) return;

    const timeTaken = 0; // Calculated inside TutorialQuizComponent
    await quizService.submitQuizResult(user.id, currentQuizTutorialId, answers, timeTaken);

    if (passed) {
      await badgeService.awardTutorialBadge(user.id, currentQuizTutorialId);
      loadEarnedBadges();
      toast.success(`🎉 Quiz passed! You earned a badge with ${score}% score!`, { duration: 5000 });
    } else {
      toast.info(`Quiz score: ${score}%. You need 70% to pass and earn a badge.`);
    }
  };

  // Close the quiz dialog and reset state
  const handleCloseQuiz = () => {
    setShowQuiz(false);
    setCurrentQuizTutorialId(null);
  };

  // Reset a tutorial so the user can start fresh
  const handleResetTutorial = async (tutorialId: string) => {
    if (!user) return;
    await tutorialService.resetTutorial(user.id, tutorialId);
    loadCompletedTutorials();
    toast.success('Tutorial progress reset');
  };

  // ── Derived data ───────────────────────────────────────────────────

  // Filter tutorials by search query (title + description)
  const filteredTutorials = getAllTutorials().filter(tutorial =>
    tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Progress percentage across all tutorials
  const progressPercent = getAllTutorials().length > 0
    ? Math.round((completedTutorials.size / getAllTutorials().length) * 100)
    : 0;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Page Header ── */}
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

          {/* Search bar */}
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

        {/* ── Stats Row ── */}
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
              <p className="text-2xl font-semibold">{progressPercent}%</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Tutorial Categories ── */}
        {tutorialCategories.map(category => {
          // Show filtered results when searching, otherwise show all in category
          const categoryTutorials = searchQuery
            ? filteredTutorials.filter(t => t.category === category.id)
            : getTutorialsByCategory(category.id);

          // Hide empty categories
          if (categoryTutorials.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4">
              {/* Category heading */}
              <div>
                <h2 className="text-xl font-semibold">{category.title}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>

              {/* Tutorial cards grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {categoryTutorials.map(tutorial => {
                  const isCompleted = completedTutorials.has(tutorial.id);
                  const hasEarnedBadge = earnedBadges.has(tutorial.id);
                  const hasQuiz = !!getQuizForTutorial(tutorial.id);

                  // Locked if user hasn't completed required prerequisite tutorials
                  const prerequisitesMet = !tutorial.prerequisites ||
                    tutorial.prerequisites.every(p => completedTutorials.has(p));

                  // Difficulty badge colour
                  const difficultyColor = {
                    beginner: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                    advanced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                  }[tutorial.difficulty];

                  return (
                    <Card
                      key={tutorial.id}
                      className={`transition-all hover:shadow-md
                        ${isCompleted ? 'border-green-200 dark:border-green-800' : ''}
                        ${!prerequisitesMet ? 'opacity-70' : ''}
                      `}
                    >
                      {/* ── Card Header ── */}
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-snug">{tutorial.title}</CardTitle>
                          {/* Status icons */}
                          <div className="flex gap-1 shrink-0">
                            {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            {hasEarnedBadge && <Award className="h-5 w-5 text-yellow-500" />}
                            {!prerequisitesMet && <Lock className="h-5 w-5 text-muted-foreground" />}
                          </div>
                        </div>
                        <CardDescription className="text-sm">{tutorial.description}</CardDescription>
                      </CardHeader>

                      {/* ── Card Body ── */}
                      <CardContent className="space-y-3">

                        {/* Metadata: difficulty · time · step count */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor}`}>
                            {tutorial.difficulty}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {tutorial.estimatedTime}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {tutorial.steps.length} steps
                          </span>
                        </div>

                        {/* Tags (max 3 shown) */}
                        {tutorial.tags && (
                          <div className="flex flex-wrap gap-1">
                            {tutorial.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="flex items-center gap-0.5 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                              >
                                <Tag className="h-2.5 w-2.5" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Prerequisites warning — only shown when locked */}
                        {!prerequisitesMet && tutorial.prerequisites && (
                          <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                            🔒 Complete first:{' '}
                            {tutorial.prerequisites
                              .filter(p => !completedTutorials.has(p))
                              .map(p => tutorials[p]?.title || p)
                              .join(', ')}
                          </div>
                        )}

                        {/* Primary action: Start / Retry */}
                        <Button
                          onClick={() => handleStartTutorial(tutorial)}
                          disabled={!prerequisitesMet}
                          variant={isCompleted ? 'outline' : 'default'}
                          size="sm"
                          className="w-full"
                        >
                          {isCompleted ? (
                            <><RotateCcw className="h-4 w-4 mr-2" /> Retry</>
                          ) : (
                            <><Play className="h-4 w-4 mr-2" /> Start</>
                          )}
                        </Button>

                        {/* Secondary actions shown only for completed tutorials */}
                        {isCompleted && (
                          <div className="flex gap-2">
                            {/* Take Quiz button — only if a quiz exists for this tutorial */}
                            {hasQuiz && (
                              <Button
                                onClick={() => handleTakeQuiz(tutorial.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <Award className="h-4 w-4 mr-2" />
                                {hasEarnedBadge ? 'Retake Quiz' : 'Take Quiz'}
                              </Button>
                            )}

                            {/* Reset progress */}
                            <Button
                              onClick={() => handleResetTutorial(tutorial.id)}
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-muted-foreground text-xs"
                            >
                              Reset
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Empty search state ── */}
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

      {/* ── Active Tour Overlay ── */}
      {activeTour && (
        <InteractiveTour
          steps={activeTour.steps}
          isActive={true}
          onComplete={handleCompleteTour}
          onSkip={handleSkipTour}
          tourId={activeTour.id}
        />
      )}

      {/* ── Quiz Dialog ── */}
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