import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { modelVersionService } from '@/services/modelVersionService';
import type { ModelVersion } from '@/types/types';
import type { VersionComparison } from '@/services/modelVersionService';
import { History, TrendingUp, TrendingDown, CheckCircle2, Clock, GitBranch, Info, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ModelVersionHistoryProps {
  projectId: string;
}

export function ModelVersionHistory({ projectId }: ModelVersionHistoryProps) {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<ModelVersion | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const [versionsList, active] = await Promise.all([
        modelVersionService.getVersions(projectId),
        modelVersionService.getActiveVersion(projectId),
      ]);
      setVersions(versionsList);
      setActiveVersion(active);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (versionNumber: number) => {
    const success = await modelVersionService.rollbackToVersion(projectId, versionNumber);
    if (success) {
      toast.success(`Rolled back to version ${versionNumber}`);
      loadVersions();
    } else {
      toast.error('Failed to rollback version');
    }
  };

  const handleCompare = async (v1: number, v2: number) => {
    const result = await modelVersionService.compareVersions(projectId, v1, v2);
    if (result) {
      setComparison(result);
      setSelectedVersions([v1, v2]);
    } else {
      toast.error('Failed to compare versions');
    }
  };

  const getPerformanceChange = (version: ModelVersion, previousVersion: ModelVersion | null) => {
    if (!previousVersion || !version.accuracy || !previousVersion.accuracy) return null;
    
    const change = version.accuracy - previousVersion.accuracy;
    return {
      value: change,
      percentage: (change * 100).toFixed(2),
      improved: change > 0,
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading version history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <History className="h-5 w-5" />
            Model Version History
          </CardTitle>
          <CardDescription className="text-pretty">
            Track and compare different training runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Each training run creates a new version. You can compare versions to see what changed
              and rollback to previous versions if needed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Version List */}
      {versions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No versions yet. Complete a training run to create your first version.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => {
            const previousVersion = index < versions.length - 1 ? versions[index + 1] : null;
            const performanceChange = getPerformanceChange(version, previousVersion);
            const isActive = activeVersion?.id === version.id;

            return (
              <Card key={version.id} className={isActive ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-balance">
                          Version {version.version_number}
                        </CardTitle>
                        {isActive && (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {version.is_deployed && (
                          <Badge variant="secondary">Deployed</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRollback(version.version_number)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metrics */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-semibold">
                          {version.accuracy ? (version.accuracy * 100).toFixed(1) : 'N/A'}%
                        </p>
                        {performanceChange && (
                          <div className="flex items-center gap-1">
                            {performanceChange.improved ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`text-sm ${performanceChange.improved ? 'text-green-500' : 'text-red-500'}`}>
                              {performanceChange.improved ? '+' : ''}{performanceChange.percentage}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Loss</p>
                      <p className="text-2xl font-semibold">
                        {version.loss ? version.loss.toFixed(4) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Epochs</p>
                      <p className="text-2xl font-semibold">{version.epochs || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Samples</p>
                      <p className="text-2xl font-semibold">{version.sample_count || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Changes from previous */}
                  {version.changes_from_previous && Object.keys(version.changes_from_previous).length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Changes from previous version:</p>
                      <div className="space-y-1">
                        {Object.entries(version.changes_from_previous).map(([key, value]) => (
                          <p key={key} className="text-sm text-muted-foreground">
                            • {key}: {JSON.stringify(value)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {version.notes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground">{version.notes}</p>
                    </div>
                  )}

                  {/* Compare button */}
                  {previousVersion && (
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompare(previousVersion.version_number, version.version_number)}
                      >
                        Compare with v{previousVersion.version_number}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Comparison View */}
      {comparison && selectedVersions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">
              Version Comparison: v{selectedVersions[0]} vs v{selectedVersions[1]}
            </CardTitle>
            <CardDescription className="text-pretty">
              {comparison.performanceImprovement ? 'Performance improved' : 'Performance decreased'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div>
              <p className="text-sm font-medium mb-2">Summary:</p>
              <ul className="space-y-1">
                {comparison.summary.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Changes */}
            {comparison.changes.performance && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Performance Changes:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {comparison.changes.performance.accuracy && (
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="text-lg font-semibold">
                        {(comparison.changes.performance.accuracy.old * 100).toFixed(1)}% →{' '}
                        {(comparison.changes.performance.accuracy.new * 100).toFixed(1)}%
                      </p>
                      <p className={`text-sm ${comparison.changes.performance.accuracy.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {comparison.changes.performance.accuracy.change > 0 ? '+' : ''}
                        {(comparison.changes.performance.accuracy.change * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                  {comparison.changes.performance.loss && (
                    <div className="p-3 border rounded">
                      <p className="text-sm text-muted-foreground">Loss</p>
                      <p className="text-lg font-semibold">
                        {comparison.changes.performance.loss.old.toFixed(4)} →{' '}
                        {comparison.changes.performance.loss.new.toFixed(4)}
                      </p>
                      <p className={`text-sm ${comparison.changes.performance.loss.change < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {comparison.changes.performance.loss.change > 0 ? '+' : ''}
                        {comparison.changes.performance.loss.change.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
