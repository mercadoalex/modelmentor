import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, XCircle } from 'lucide-react';
import type { DataValidationResult } from '@/services/dataValidationService';

interface DataValidationDisplayProps {
  validation: DataValidationResult;
}

export function DataValidationDisplay({ validation }: DataValidationDisplayProps) {
  const { isValid, qualityScore, issues, statistics } = validation;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const };
    if (score >= 40) return { label: 'Fair', variant: 'secondary' as const };
    return { label: 'Poor', variant: 'outline' as const };
  };

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  const scoreBadge = getScoreBadge(qualityScore);

  return (
    <div className="space-y-4">
      {/* Quality Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-balance">Data Quality Score</CardTitle>
              <CardDescription className="text-pretty">
                Overall assessment of your dataset
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${getScoreColor(qualityScore)}`}>
                {qualityScore}
              </div>
              <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={qualityScore} className="h-2" />
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Dataset Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Rows</p>
              <p className="text-2xl font-semibold">{statistics.totalRows}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Columns</p>
              <p className="text-2xl font-semibold">{statistics.totalColumns}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Missing Values</p>
              <p className="text-2xl font-semibold">{statistics.missingValueCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duplicates</p>
              <p className="text-2xl font-semibold">{statistics.duplicateRowCount}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Numeric Columns</p>
              <p className="text-xl font-semibold">{statistics.numericColumns}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categorical Columns</p>
              <p className="text-xl font-semibold">{statistics.categoricalColumns}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Columns</p>
              <p className="text-xl font-semibold">{statistics.dateColumns}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      <Card className={!isValid ? 'border-red-500' : 'border-green-500'}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {isValid ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <div>
              <CardTitle className="text-balance">
                {isValid ? 'Data Validation Passed' : 'Data Validation Failed'}
              </CardTitle>
              <CardDescription className="text-pretty">
                {isValid
                  ? 'Your data is ready for training'
                  : 'Please fix critical issues before proceeding'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Issues */}
      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Data Quality Issues</CardTitle>
            <CardDescription className="text-pretty">
              {criticalIssues.length} critical, {warnings.length} warnings, {infos.length} info
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Critical Issues */}
            {criticalIssues.map((issue, index) => (
              <Alert key={`critical-${index}`} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-sm">{issue.suggestion}</p>
                    )}
                    {issue.affectedRows !== undefined && (
                      <p className="text-sm">Affected rows: {issue.affectedRows}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}

            {/* Warnings */}
            {warnings.map((issue, index) => (
              <Alert key={`warning-${index}`} className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-sm text-muted-foreground">{issue.suggestion}</p>
                    )}
                    {issue.affectedRows !== undefined && (
                      <p className="text-sm text-muted-foreground">Affected rows: {issue.affectedRows}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}

            {/* Info */}
            {infos.map((issue, index) => (
              <Alert key={`info-${index}`}>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-sm text-muted-foreground">{issue.suggestion}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
