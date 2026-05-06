import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft, Eye, CheckCircle } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import type { StudentProgress } from '@/types/types';
import { toast } from 'sonner';

export default function AtRiskAlertsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [atRiskStudents, setAtRiskStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      toast.error('Access denied. Admin privileges required.');
      return;
    }

    loadAtRiskStudents();
  }, [user, profile, navigate]);

  const loadAtRiskStudents = async () => {
    setLoading(true);
    const students = await dashboardService.getAtRiskStudents();
    setAtRiskStudents(students);
    setLoading(false);
  };

  const getConceptLabel = (concept: string) => {
    const labels: Record<string, string> = {
      gradient_descent: 'Gradient Descent',
      overfitting: 'Overfitting',
      bias_variance: 'Bias & Variance',
      regularization: 'Regularization',
      model_evaluation: 'Model Evaluation'
    };
    return labels[concept] || concept;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    const success = await dashboardService.resolveAlert(alertId);
    if (success) {
      toast.success('Alert marked as resolved');
      loadAtRiskStudents();
    } else {
      toast.error('Failed to resolve alert');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">At-Risk Alerts</h1>
              <p className="text-muted-foreground">
                {atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's' : ''} need{atRiskStudents.length === 1 ? 's' : ''} attention
              </p>
            </div>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>High Priority</CardDescription>
              <CardTitle className="text-3xl text-destructive">
                {atRiskStudents.reduce((sum, s) => sum + s.alerts.filter(a => a.severity === 'high').length, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Medium Priority</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {atRiskStudents.reduce((sum, s) => sum + s.alerts.filter(a => a.severity === 'medium').length, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Low Priority</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {atRiskStudents.reduce((sum, s) => sum + s.alerts.filter(a => a.severity === 'low').length, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Alerts List */}
        {atRiskStudents.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Great news! No students are currently flagged as at-risk. All students are on track.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {atRiskStudents.map((studentProgress) => (
              <Card key={studentProgress.student.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{studentProgress.student.username || studentProgress.student.email}</CardTitle>
                      <CardDescription>
                        {studentProgress.alerts.length} active alert{studentProgress.alerts.length > 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/student/${studentProgress.student.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {studentProgress.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getConceptLabel(alert.concept_name)}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {alert.alert_type.replace('_', ' ')} • Created {new Date(alert.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {atRiskStudents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Schedule One-on-One Sessions</p>
                <p className="text-xs text-muted-foreground">
                  Consider scheduling individual review sessions with high-priority students to address specific challenges.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Provide Additional Resources</p>
                <p className="text-xs text-muted-foreground">
                  Share supplementary materials and practice exercises for concepts where students are struggling.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Adjust Lesson Plans</p>
                <p className="text-xs text-muted-foreground">
                  If multiple students struggle with the same concept, consider revisiting it in class with different teaching approaches.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
