import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, User, Award, AlertTriangle, TrendingUp, Clock, FileDown } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { exportStudentProgressPDF } from '@/utils/pdfExport';
import type { StudentProgress } from '@/types/types';
import { toast } from 'sonner';

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      navigate('/');
      toast.error('Access denied. Admin privileges required.');
      return;
    }

    if (studentId) {
      loadStudentData();
    }
  }, [user, profile, studentId, navigate]);

  const loadStudentData = async () => {
    if (!studentId) return;
    
    setLoading(true);
    const progress = await dashboardService.getStudentProgress(studentId);
    setStudentProgress(progress);
    setLoading(false);
  };

  const handleResolveAlert = async (alertId: string) => {
    const success = await dashboardService.resolveAlert(alertId);
    if (success) {
      toast.success('Alert marked as resolved');
      loadStudentData();
    } else {
      toast.error('Failed to resolve alert');
    }
  };

  const handleExportPDF = () => {
    if (!studentProgress) {
      toast.error('No student data available to export');
      return;
    }

    try {
      const studentName = studentProgress.student.username || studentProgress.student.email || 'Unknown Student';
      
      // Create report data
      const reportData = {
        summary: {
          total_projects: studentProgress.totalProjects,
          completed_projects: studentProgress.completedProjects,
          in_progress_projects: studentProgress.totalProjects - studentProgress.completedProjects,
          average_progress: studentProgress.averageScore,
          total_badges: studentProgress.badges.length,
          total_time_hours: Math.round(studentProgress.recentActivity.length * 0.5), // Estimate based on activity
        },
        projects: [], // Would need to fetch from database
        badges: studentProgress.badges.map((badge: any) => ({
          id: badge.id,
          name: badge.badge_name,
          description: badge.description || '',
          earned_at: badge.earned_at,
        })),
        concepts: studentProgress.conceptMastery.map((concept: any) => ({
          name: concept.concept_name,
          mastery_level: concept.mastery_level,
          last_practiced: concept.last_practiced || new Date().toISOString(),
        })),
      };

      exportStudentProgressPDF(studentName, reportData, {
        author: user?.email || 'Teacher',
      });

      toast.success('Student report exported as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
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

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading student data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!studentProgress) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Student not found</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
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
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">
                {studentProgress.student.username || studentProgress.student.email}
              </h1>
              <p className="text-muted-foreground">
                Joined {new Date(studentProgress.student.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Projects Completed</CardDescription>
              <CardTitle className="text-3xl">{studentProgress.completedProjects}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl">{studentProgress.averageScore}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Badges Earned</CardDescription>
              <CardTitle className="text-3xl">{studentProgress.badges.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Alerts</CardDescription>
              <CardTitle className="text-3xl text-destructive">{studentProgress.alerts.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Alerts */}
        {studentProgress.alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Active Alerts
              </CardTitle>
              <CardDescription>Areas where this student needs support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {studentProgress.alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{getConceptLabel(alert.concept_name)}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {alert.alert_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    Mark Resolved
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Concept Mastery */}
        <Card>
          <CardHeader>
            <CardTitle>Concept Mastery</CardTitle>
            <CardDescription>Understanding of key ML concepts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentProgress.conceptMastery.map((mastery) => (
              <div key={mastery.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{getConceptLabel(mastery.concept_name)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {mastery.attempts} attempt{mastery.attempts > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{mastery.mastery_score}%</span>
                </div>
                <Progress value={mastery.mastery_score} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Last attempt: {new Date(mastery.last_attempt_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentProgress.conceptMastery
              .filter(m => m.mastery_score < 75)
              .map((mastery) => (
                <div key={mastery.id} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">
                    Review {getConceptLabel(mastery.concept_name)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current score: {mastery.mastery_score}%. Consider additional practice exercises or one-on-one review.
                  </p>
                </div>
              ))}
            {studentProgress.conceptMastery.every(m => m.mastery_score >= 75) && (
              <p className="text-sm text-muted-foreground">
                This student is performing well across all concepts. Consider advanced challenges.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
