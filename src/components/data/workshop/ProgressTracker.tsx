import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  Zap,
  CheckCircle2,
  Star,
  Award,
} from 'lucide-react';
import type { WorkshopProgress, FeatureType, AppliedTransformation } from '@/types/workshop';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressTrackerProps {
  /** Current workshop progress */
  progress: WorkshopProgress;
  /** Applied transformations for detailed tracking */
  appliedTransformations?: AppliedTransformation[];
  /** Whether to show detailed breakdown */
  showDetails?: boolean;
  /** Whether to show milestones */
  showMilestones?: boolean;
  /** Callback when a milestone is achieved */
  onMilestoneAchieved?: (milestone: Milestone) => void;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement: number;
  current: number;
  achieved: boolean;
  icon: React.ReactNode;
  category: 'transformations' | 'exploration' | 'tutorials' | 'improvement';
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestone Definitions
// ─────────────────────────────────────────────────────────────────────────────

const MILESTONES = {
  FIRST_TRANSFORMATION: {
    id: 'first-transformation',
    name: 'First Steps',
    description: 'Apply your first transformation',
    requirement: 1,
    category: 'transformations' as const,
  },
  FIVE_TRANSFORMATIONS: {
    id: 'five-transformations',
    name: 'Getting Started',
    description: 'Apply 5 transformations',
    requirement: 5,
    category: 'transformations' as const,
  },
  TEN_TRANSFORMATIONS: {
    id: 'ten-transformations',
    name: 'Transformation Pro',
    description: 'Apply 10 transformations',
    requirement: 10,
    category: 'transformations' as const,
  },
  EXPLORE_NUMERICAL: {
    id: 'explore-numerical',
    name: 'Number Cruncher',
    description: 'Explore numerical transformations',
    requirement: 1,
    category: 'exploration' as const,
  },
  EXPLORE_CATEGORICAL: {
    id: 'explore-categorical',
    name: 'Category Master',
    description: 'Explore categorical transformations',
    requirement: 1,
    category: 'exploration' as const,
  },
  EXPLORE_ALL: {
    id: 'explore-all',
    name: 'Feature Explorer',
    description: 'Explore all feature types',
    requirement: 3,
    category: 'exploration' as const,
  },
  FIRST_TUTORIAL: {
    id: 'first-tutorial',
    name: 'Eager Learner',
    description: 'Complete your first tutorial',
    requirement: 1,
    category: 'tutorials' as const,
  },
  THREE_TUTORIALS: {
    id: 'three-tutorials',
    name: 'Knowledge Seeker',
    description: 'Complete 3 tutorials',
    requirement: 3,
    category: 'tutorials' as const,
  },
  ALL_TUTORIALS: {
    id: 'all-tutorials',
    name: 'Tutorial Master',
    description: 'Complete all tutorials',
    requirement: 6,
    category: 'tutorials' as const,
  },
  FIVE_PERCENT_IMPROVEMENT: {
    id: 'five-percent-improvement',
    name: 'Making Progress',
    description: 'Achieve 5% cumulative improvement',
    requirement: 5,
    category: 'improvement' as const,
  },
  TEN_PERCENT_IMPROVEMENT: {
    id: 'ten-percent-improvement',
    name: 'Significant Impact',
    description: 'Achieve 10% cumulative improvement',
    requirement: 10,
    category: 'improvement' as const,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getMilestoneIcon(category: Milestone['category']): React.ReactNode {
  switch (category) {
    case 'transformations':
      return <Zap className="h-4 w-4" />;
    case 'exploration':
      return <Target className="h-4 w-4" />;
    case 'tutorials':
      return <Award className="h-4 w-4" />;
    case 'improvement':
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Star className="h-4 w-4" />;
  }
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getFeatureTypeLabel(type: FeatureType): string {
  switch (type) {
    case 'numerical':
      return 'Numerical';
    case 'categorical':
      return 'Categorical';
    case 'text':
      return 'Text';
    default:
      return type;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ProgressTracker({
  progress,
  appliedTransformations = [],
  showDetails = true,
  showMilestones = true,
  onMilestoneAchieved,
}: ProgressTrackerProps) {
  // Calculate milestones
  const milestones = useMemo((): Milestone[] => {
    const result: Milestone[] = [];

    // Transformation milestones
    [MILESTONES.FIRST_TRANSFORMATION, MILESTONES.FIVE_TRANSFORMATIONS, MILESTONES.TEN_TRANSFORMATIONS].forEach(m => {
      result.push({
        ...m,
        current: progress.totalTransformationsApplied,
        achieved: progress.totalTransformationsApplied >= m.requirement,
        icon: getMilestoneIcon(m.category),
      });
    });

    // Exploration milestones
    const numericalExplored = progress.featureTypesExplored.includes('numerical');
    const categoricalExplored = progress.featureTypesExplored.includes('categorical');
    
    result.push({
      ...MILESTONES.EXPLORE_NUMERICAL,
      current: numericalExplored ? 1 : 0,
      achieved: numericalExplored,
      icon: getMilestoneIcon(MILESTONES.EXPLORE_NUMERICAL.category),
    });

    result.push({
      ...MILESTONES.EXPLORE_CATEGORICAL,
      current: categoricalExplored ? 1 : 0,
      achieved: categoricalExplored,
      icon: getMilestoneIcon(MILESTONES.EXPLORE_CATEGORICAL.category),
    });

    result.push({
      ...MILESTONES.EXPLORE_ALL,
      current: progress.featureTypesExplored.length,
      achieved: progress.featureTypesExplored.length >= 3,
      icon: getMilestoneIcon(MILESTONES.EXPLORE_ALL.category),
    });

    // Tutorial milestones
    [MILESTONES.FIRST_TUTORIAL, MILESTONES.THREE_TUTORIALS, MILESTONES.ALL_TUTORIALS].forEach(m => {
      result.push({
        ...m,
        current: progress.tutorialsCompleted.length,
        achieved: progress.tutorialsCompleted.length >= m.requirement,
        icon: getMilestoneIcon(m.category),
      });
    });

    // Improvement milestones
    const improvementPercent = progress.cumulativeImprovement * 100;
    [MILESTONES.FIVE_PERCENT_IMPROVEMENT, MILESTONES.TEN_PERCENT_IMPROVEMENT].forEach(m => {
      result.push({
        ...m,
        current: improvementPercent,
        achieved: improvementPercent >= m.requirement,
        icon: getMilestoneIcon(m.category),
      });
    });

    return result;
  }, [progress]);

  // Calculate overall completion percentage
  const overallCompletion = useMemo(() => {
    const achieved = milestones.filter(m => m.achieved).length;
    return Math.round((achieved / milestones.length) * 100);
  }, [milestones]);

  // Calculate feature type breakdown
  const featureTypeBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    appliedTransformations.forEach(t => {
      // Infer feature type from transformation type
      let featureType: FeatureType = 'numerical';
      if (['one_hot', 'label_encode', 'frequency_encode', 'target_encode', 'binary_encode'].includes(t.type)) {
        featureType = 'categorical';
      } else if (['tfidf', 'word_count', 'char_count', 'sentence_count'].includes(t.type)) {
        featureType = 'text';
      }
      breakdown[featureType] = (breakdown[featureType] || 0) + 1;
    });
    return breakdown;
  }, [appliedTransformations]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Workshop Progress
        </CardTitle>
        <CardDescription>
          Track your feature engineering journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-medium">{overallCompletion}%</span>
          </div>
          <Progress value={overallCompletion} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Zap className="h-4 w-4" />
              Transformations
            </div>
            <div className="text-2xl font-bold">{progress.totalTransformationsApplied}</div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Improvement
            </div>
            <div className="text-2xl font-bold text-green-600">
              +{(progress.cumulativeImprovement * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Award className="h-4 w-4" />
              Tutorials
            </div>
            <div className="text-2xl font-bold">{progress.tutorialsCompleted.length}/6</div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Time Spent
            </div>
            <div className="text-2xl font-bold">{formatTime(progress.totalTimeSpent)}</div>
          </div>
        </div>

        {/* Feature Type Breakdown */}
        {showDetails && Object.keys(featureTypeBreakdown).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Transformations by Type</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(featureTypeBreakdown).map(([type, count]) => (
                <Badge key={type} variant="secondary">
                  {getFeatureTypeLabel(type as FeatureType)}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Most Impactful Transformation */}
        {progress.mostImpactfulTransformation && (
          <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 mb-1">
              <Star className="h-4 w-4" />
              Most Impactful
            </div>
            <div className="font-medium">
              {progress.mostImpactfulTransformation.type.replace(/_/g, ' ')}
            </div>
            <div className="text-sm text-muted-foreground">
              +{(progress.mostImpactfulTransformation.performanceImpact * 100).toFixed(1)}% improvement
            </div>
          </div>
        )}

        {/* Milestones */}
        {showMilestones && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Milestones</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {milestones.map(milestone => (
                <div
                  key={milestone.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    milestone.achieved 
                      ? 'bg-green-50 dark:bg-green-950/20' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${
                    milestone.achieved 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {milestone.achieved ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      milestone.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        milestone.achieved ? 'text-green-700 dark:text-green-400' : ''
                      }`}>
                        {milestone.name}
                      </span>
                      {milestone.achieved && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {milestone.description}
                    </div>
                  </div>
                  {!milestone.achieved && (
                    <div className="text-xs text-muted-foreground">
                      {milestone.current}/{milestone.requirement}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges Earned */}
        {progress.badgesEarned.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Badges Earned</h4>
            <div className="flex flex-wrap gap-2">
              {progress.badgesEarned.map(badge => (
                <Badge key={badge} variant="default" className="bg-yellow-500">
                  <Trophy className="h-3 w-3 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProgressTracker;
