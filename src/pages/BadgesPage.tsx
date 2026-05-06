import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Lock, Share2, Download, Trophy, CheckCircle2 } from 'lucide-react';
import { badgeService } from '@/services/badgeService';
import type { BadgeProgress } from '@/types/types';
import { toast } from 'sonner';

export default function BadgesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadBadgeProgress();
  }, [user, navigate]);

  const loadBadgeProgress = async () => {
    if (!user) return;

    setLoading(true);
    const progress = await badgeService.getBadgeProgress(user.id);
    setBadgeProgress(progress);
    setLoading(false);
  };

  const getBadgeIcon = (level: string, isEarned: boolean) => {
    if (!isEarned) {
      return <Lock className="h-16 w-16 text-muted-foreground" />;
    }

    const colors = {
      beginner: 'text-green-600',
      intermediate: 'text-yellow-600',
      advanced: 'text-red-600'
    };

    return <Award className={`h-16 w-16 ${colors[level as keyof typeof colors]}`} />;
  };

  const getBadgeTitle = (level: string) => {
    const titles = {
      beginner: 'Beginner ML Explorer',
      intermediate: 'Intermediate ML Practitioner',
      advanced: 'Advanced ML Expert'
    };
    return titles[level as keyof typeof titles];
  };

  const getBadgeDescription = (level: string) => {
    const descriptions = {
      beginner: 'Complete all beginner-level example projects',
      intermediate: 'Complete all intermediate-level example projects',
      advanced: 'Complete all advanced-level example projects'
    };
    return descriptions[level as keyof typeof descriptions];
  };

  const handleShareToLinkedIn = (level: string) => {
    const badgeTitle = getBadgeTitle(level);
    const text = `I just earned the "${badgeTitle}" badge on ModelMentor! 🎉 I completed all ${level}-level machine learning projects and gained hands-on experience with AI model training. #MachineLearning #AI #ModelMentor`;
    const url = window.location.origin;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=600');
  };

  const handleDownloadBadge = (level: string) => {
    toast.success('Badge download feature coming soon!');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your achievements...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Badges & Achievements</h1>
              <p className="text-muted-foreground">Track your progress and share your accomplishments</p>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Complete all examples at each level to earn badges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {badgeProgress.map((progress) => {
                const percentage = (progress.completedExamples / progress.totalExamples) * 100;
                return (
                  <div key={progress.level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{progress.level}</span>
                        {progress.isEarned && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {progress.completedExamples} / {progress.totalExamples}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Badge Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {badgeProgress.map((progress) => (
            <Card key={progress.level} className={progress.isEarned ? 'border-primary' : ''}>
              <CardHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  {getBadgeIcon(progress.level, progress.isEarned)}
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg">{getBadgeTitle(progress.level)}</CardTitle>
                  <CardDescription className="text-xs">
                    {getBadgeDescription(progress.level)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {progress.isEarned ? (
                  <>
                    <div className="text-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Earned {new Date(progress.earnedAt!).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleShareToLinkedIn(progress.level)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadBadge(progress.level)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {progress.totalExamples - progress.completedExamples} more to unlock
                    </p>
                    <Progress
                      value={(progress.completedExamples / progress.totalExamples) * 100}
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to Earn Badges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Complete all example projects at each difficulty level to earn the corresponding badge.
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Beginner: Complete 9 beginner-level projects</li>
              <li>Intermediate: Complete 10 intermediate-level projects</li>
              <li>Advanced: Complete 7 advanced-level projects</li>
            </ul>
            <p>
              Once earned, you can share your badges on LinkedIn to showcase your machine learning skills!
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
