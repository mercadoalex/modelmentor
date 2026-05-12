/**
 * Workshop Summary Component
 * 
 * Displays a comprehensive summary of the workshop session including:
 * - Total transformations applied
 * - Cumulative improvement achieved
 * - Most impactful transformation
 * - Completed tutorials and badges earned
 * - Time spent in workshop
 * - Recommendations for next steps
 * 
 * Requirements: 9.5
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Award,
  Clock,
  TrendingUp,
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Star,
  Trophy,
  Target,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { AppliedTransformation, WorkshopProgress } from '@/types/workshop';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface WorkshopSummaryProps {
  /** Applied transformations during the session */
  appliedTransformations?: AppliedTransformation[];
  /** Workshop progress data */
  progress?: WorkshopProgress;
  /** Time spent in workshop (in seconds) */
  timeSpent?: number;
  /** Completed tutorial IDs */
  completedTutorials?: string[];
  /** Earned badge IDs */
  earnedBadges?: string[];
  /** Initial model performance (R²) */
  initialPerformance?: number;
  /** Final model performance (R²) */
  finalPerformance?: number;
  /** Callback when user wants to export pipeline */
  onExportPipeline?: () => void;
  /** Callback when user wants to proceed to training */
  onProceedToTraining?: () => void;
  /** Callback when user wants to share results */
  onShare?: () => void;
  /** Whether to show animations */
  showAnimation?: boolean;
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TUTORIAL_NAMES: Record<string, string> = {
  'log-transform': 'Log Transform',
  'one-hot-encoding': 'One-Hot Encoding',
  'standardization': 'Standardization',
  'polynomial-features': 'Polynomial Features',
  'interaction-features': 'Interaction Features',
  'text-vectorization': 'Text Vectorization',
};

const BADGE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  'first-transform': { name: 'First Transform', icon: '🎯', color: 'bg-blue-100 text-blue-800' },
  'skewness-slayer': { name: 'Skewness Slayer', icon: '📊', color: 'bg-purple-100 text-purple-800' },
  'feature-engineer': { name: 'Feature Engineer', icon: '⚙️', color: 'bg-green-100 text-green-800' },
  'polynomial-pro': { name: 'Polynomial Pro', icon: '📈', color: 'bg-orange-100 text-orange-800' },
  'interaction-master': { name: 'Interaction Master', icon: '🔗', color: 'bg-pink-100 text-pink-800' },
  'workshop-complete': { name: 'Workshop Complete', icon: '🏆', color: 'bg-yellow-100 text-yellow-800' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format time duration
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Generate recommendations based on session data
 */
function generateRecommendations(
  transformations: AppliedTransformation[],
  completedTutorials: string[],
  improvement: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Check tutorial completion
  const allTutorials = Object.keys(TUTORIAL_NAMES);
  const incompleteTutorials = allTutorials.filter(t => !completedTutorials.includes(t));
  
  if (incompleteTutorials.length > 0) {
    recommendations.push({
      title: 'Complete More Tutorials',
      description: `You have ${incompleteTutorials.length} tutorial(s) remaining. Consider completing "${TUTORIAL_NAMES[incompleteTutorials[0]]}" next.`,
      priority: 'medium',
      action: 'View Tutorials',
    });
  }
  
  // Check transformation diversity
  const transformTypes = new Set(transformations.map(t => t.type));
  if (transformTypes.size < 3 && transformations.length > 0) {
    recommendations.push({
      title: 'Try Different Transformations',
      description: 'Explore more transformation types to find the best combination for your data.',
      priority: 'medium',
    });
  }
  
  // Performance-based recommendations
  if (improvement < 5) {
    recommendations.push({
      title: 'Explore Feature Interactions',
      description: 'Creating interaction features between correlated variables often yields significant improvements.',
      priority: 'high',
    });
  }
  
  if (improvement > 20) {
    recommendations.push({
      title: 'Validate on Test Data',
      description: 'Great improvement! Make sure to validate these transformations on held-out test data.',
      priority: 'high',
      action: 'Proceed to Training',
    });
  }
  
  // Always recommend saving pipeline
  if (transformations.length > 0) {
    recommendations.push({
      title: 'Save Your Pipeline',
      description: 'Export your transformation pipeline to reuse it on new data or share with teammates.',
      priority: 'low',
      action: 'Export Pipeline',
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Find the most impactful transformation
 */
function findMostImpactful(transformations: AppliedTransformation[]): AppliedTransformation | null {
  if (transformations.length === 0) return null;
  return transformations.reduce((best, current) => 
    Math.abs(current.performanceImpact) > Math.abs(best.performanceImpact) ? current : best
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function WorkshopSummary({
  appliedTransformations = [],
  progress,
  timeSpent = 0,
  completedTutorials = [],
  earnedBadges = [],
  initialPerformance = 0,
  finalPerformance = 0,
  onExportPipeline,
  onProceedToTraining,
  onShare,
  showAnimation = true,
}: WorkshopSummaryProps) {
  // Calculate metrics
  const improvement = useMemo(() => {
    if (initialPerformance === 0) return 0;
    return ((finalPerformance - initialPerformance) / initialPerformance) * 100;
  }, [initialPerformance, finalPerformance]);

  const mostImpactful = useMemo(() => 
    findMostImpactful(appliedTransformations), 
    [appliedTransformations]
  );

  const recommendations = useMemo(() => 
    generateRecommendations(appliedTransformations, completedTutorials, improvement),
    [appliedTransformations, completedTutorials, improvement]
  );

  const cumulativeImpact = useMemo(() => 
    appliedTransformations.reduce((sum, t) => sum + t.performanceImpact, 0) * 100,
    [appliedTransformations]
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={showAnimation ? containerVariants : undefined}
      initial={showAnimation ? "hidden" : false}
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={showAnimation ? itemVariants : undefined}>
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Workshop Summary
            </CardTitle>
            <CardDescription className="text-base">
              Great work! Here's what you accomplished in this session.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <motion.div 
        variants={showAnimation ? itemVariants : undefined}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Transformations Applied */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{appliedTransformations.length}</div>
                <div className="text-sm text-muted-foreground">Transformations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Improvement */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Improvement</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tutorials Completed */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedTutorials.length}</div>
                <div className="text-sm text-muted-foreground">Tutorials</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Spent */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatDuration(timeSpent)}</div>
                <div className="text-sm text-muted-foreground">Time Spent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Journey */}
      <motion.div variants={showAnimation ? itemVariants : undefined}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Performance Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Initial R²</div>
                <div className="text-xl font-semibold">{(initialPerformance * 100).toFixed(1)}%</div>
              </div>
              <div className="flex-1 mx-4">
                <div className="relative">
                  <Progress value={finalPerformance * 100} className="h-3" />
                  <ArrowRight className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Final R²</div>
                <div className="text-xl font-semibold text-green-600">{(finalPerformance * 100).toFixed(1)}%</div>
              </div>
            </div>
            
            {mostImpactful && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Most Impactful Transformation
                </div>
                <div className="flex items-center justify-between">
                  <span>{mostImpactful.type} on {mostImpactful.feature}</span>
                  <Badge variant={mostImpactful.performanceImpact > 0 ? 'default' : 'secondary'}>
                    {mostImpactful.performanceImpact > 0 ? '+' : ''}
                    {(mostImpactful.performanceImpact * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transformation History */}
      {appliedTransformations.length > 0 && (
        <motion.div variants={showAnimation ? itemVariants : undefined}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Transformation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appliedTransformations.map((t, index) => (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{t.type}</div>
                        <div className="text-sm text-muted-foreground">{t.feature}</div>
                      </div>
                    </div>
                    <div className={`font-semibold ${t.performanceImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {t.performanceImpact >= 0 ? '+' : ''}{(t.performanceImpact * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between font-semibold">
                <span>Cumulative Impact</span>
                <span className={cumulativeImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {cumulativeImpact >= 0 ? '+' : ''}{cumulativeImpact.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Badges Earned */}
      {earnedBadges.length > 0 && (
        <motion.div variants={showAnimation ? itemVariants : undefined}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map(badgeId => {
                  const badge = BADGE_INFO[badgeId] || { 
                    name: badgeId, 
                    icon: '🏅', 
                    color: 'bg-gray-100 text-gray-800' 
                  };
                  return (
                    <Badge 
                      key={badgeId} 
                      className={`${badge.color} px-3 py-1 text-sm`}
                    >
                      <span className="mr-1">{badge.icon}</span>
                      {badge.name}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tutorials Completed */}
      {completedTutorials.length > 0 && (
        <motion.div variants={showAnimation ? itemVariants : undefined}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Completed Tutorials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {completedTutorials.map(tutorialId => (
                  <Badge key={tutorialId} variant="secondary">
                    {TUTORIAL_NAMES[tutorialId] || tutorialId}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div variants={showAnimation ? itemVariants : undefined}>
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                Recommendations based on your session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    rec.priority === 'high' 
                      ? 'border-l-red-500 bg-red-50 dark:bg-red-950' 
                      : rec.priority === 'medium'
                      ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                      : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950'
                  }`}
                >
                  <div className="font-medium">{rec.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{rec.description}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div 
        variants={showAnimation ? itemVariants : undefined}
        className="flex flex-wrap gap-3"
      >
        {onExportPipeline && (
          <Button variant="outline" onClick={onExportPipeline}>
            <Download className="h-4 w-4 mr-2" />
            Export Pipeline
          </Button>
        )}
        {onShare && (
          <Button variant="outline" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        )}
        {onProceedToTraining && (
          <Button onClick={onProceedToTraining}>
            Proceed to Training
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}

export default WorkshopSummary;
