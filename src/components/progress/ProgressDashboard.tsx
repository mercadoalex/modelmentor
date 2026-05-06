import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { gamificationService, type StudentProgress, type Achievement } from '@/services/gamificationService';
import { useAuth } from '@/contexts/AuthContext';

export function ProgressDashboard() {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-123'; // Fallback for development
  
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setIsLoading(true);
      const currentProgress = await gamificationService.getProgress(userId);
      await gamificationService.updateStreak(userId);
      const learningMilestones = await gamificationService.getLearningMilestones(userId);
      setProgress(currentProgress);
      setMilestones(learningMilestones);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading your progress...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!progress) return null;

  const levelTitle = gamificationService.getLevelTitle(progress.level);
  const progressPercentage = ((progress.level * 1000 - progress.pointsToNextLevel) / (progress.level * 1000)) * 100;

  const unlockedAchievements = progress.achievements.filter(a => a.unlocked);
  const lockedAchievements = progress.achievements.filter(a => !a.unlocked);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6 text-primary" />
                Your Learning Journey
              </CardTitle>
              <CardDescription className="mt-2">
                Track your progress and celebrate your achievements!
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{progress.totalPoints}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Level {progress.level}</CardTitle>
              <CardDescription>{levelTitle}</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <TrendingUp className="h-4 w-4 mr-2" />
              {progress.pointsToNextLevel} to Level {progress.level + 1}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to next level</span>
              <span className="font-semibold">{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Models Trained
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{progress.modelsTrained}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {unlockedAchievements.length}/{progress.achievements.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{progress.currentStreak} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Workshops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{progress.workshopsCompleted.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>
            Unlock achievements by exploring and learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-sm text-muted-foreground">Unlocked</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {unlockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
                  >
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{achievement.title}</p>
                        <Badge variant="secondary" className="text-xs">
                          +{achievement.points}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Locked</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30 opacity-60"
                  >
                    <div className="text-3xl grayscale">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{achievement.title}</p>
                        <Badge variant="outline" className="text-xs">
                          +{achievement.points}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                    <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Path
          </CardTitle>
          <CardDescription>
            Follow these steps to master machine learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  milestone.completed
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  milestone.completed
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {milestone.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1">{milestone.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Encouragement */}
      <Alert className="border-primary/20 bg-primary/5">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertDescription>
          <p className="font-semibold mb-1">Keep up the great work!</p>
          <p className="text-sm text-muted-foreground">
            {progress.currentStreak > 0 
              ? `You're on a ${progress.currentStreak}-day streak! Come back tomorrow to keep it going.`
              : "Start your learning journey today and build a streak!"}
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
