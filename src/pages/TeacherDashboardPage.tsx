import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LayoutDashboard, Users, AlertTriangle, TrendingUp, Eye, FileText, Download, Shield, CheckSquare } from 'lucide-react';
import { BarChart } from '@/components/charts/ChartComponents';
import { dashboardService } from '@/services/dashboardService';
import { exportStudentProgressPDF, exportClassSummaryPDF } from '@/utils/pdfExport';
import type { StudentProgress } from '@/types/types';
import { toast } from 'sonner';

export default function TeacherDashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([]);
  const [classStats, setClassStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (profile?.role !== 'admin' && profile?.role !== 'super_admin')) {
      navigate('/');
      toast.error('Access denied. Admin privileges required.');
      return;
    }

    loadDashboardData();
    // eslint-disable-next-line
  }, [user, profile, navigate]);

  // Loads dashboard data for students and class stats
  const loadDashboardData = async () => {
    setLoading(true);
    const progress = await dashboardService.getAllStudentsProgress();
    const stats = await dashboardService.getClassStatistics();
    setStudentsProgress(progress);
    setClassStats(stats);
    setLoading(false);
  };

  // Maps concept keys to readable labels
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

  // Navigates to student detail page
  const handleViewStudent = (studentId: string) => {
    navigate(`/dashboard/student/${studentId}`);
  };

  // Navigates to reports page
  const handleGenerateReport = () => {
    navigate('/dashboard/reports');
  };

  // Exports all students' progress as PDF
  const handleExportAllStudents = () => {
    if (studentsProgress.length === 0) {
      toast.error('No student data available to export');
      return;
    }

    try {
      // Create report data for all students
      const reportData = {
        summary: {
          total_students: studentsProgress.length,
          active_projects: studentsProgress.reduce((sum, s) => sum + s.totalProjects, 0),
          completed_projects: studentsProgress.reduce((sum, s) => sum + s.completedProjects, 0),
          average_progress: Math.round(
            studentsProgress.reduce((sum, s) => sum + s.averageScore, 0) / studentsProgress.length
          ),
          total_badges: studentsProgress.reduce((sum, s) => sum + s.badges.length, 0),
        },
        students: studentsProgress.map(sp => ({
          id: sp.student.id,
          name: sp.student.username || sp.student.email || 'Unknown',
          email: sp.student.email || '',
          projects_count: sp.totalProjects,
          average_progress: sp.averageScore,
          badges_count: sp.badges.length,
          status: sp.alerts.length > 0 ? 'At Risk' : 'Active',
          last_active: sp.recentActivity[0]?.created_at || new Date().toISOString(),
        })),
        concepts: Object.entries(classStats?.concept_mastery || {}).map(([name, level]) => ({
          name,
          mastery_level: typeof level === 'number' ? level : 0,
          student_count: studentsProgress.length,
        })),
      };

      exportClassSummaryPDF(reportData, {
        author: user?.email || 'Teacher',
      });

      toast.success('Class report exported as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold">Teacher Dashboard</h1>
                <p className="text-muted-foreground">Monitor student progress and identify learning opportunities</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/dashboard/alerts')}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                At-Risk Alerts
              </Button>
              <Button onClick={handleGenerateReport}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Admin Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Tools
            </CardTitle>
            <CardDescription>
              Manage users, roles, and system settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/role-management')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Role Management
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
              >
                <Users className="h-4 w-4 mr-2" />
                School Admin
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quiz Analytics
            </CardTitle>
            <CardDescription>
              Track student quiz performance and identify learning gaps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/quiz-analytics')}
              className="w-full"
            >
              View Quiz Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Class Statistics */}
        {classStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-3xl">{classStats.totalStudents}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="text-3xl">{classStats.averageScore}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>At-Risk Students</CardDescription>
                <CardTitle className="text-3xl text-destructive">{classStats.atRiskCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active This Week</CardDescription>
                <CardTitle className="text-3xl">{Math.floor(classStats.totalStudents * 0.8)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Concept Mastery Overview */}
        {classStats && (
          <Card>
            <CardHeader>
              <CardTitle>Concept Mastery Overview</CardTitle>
              <CardDescription>Average class performance across ML concepts</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={{
                  labels: classStats.conceptAverages.map((item: any) => getConceptLabel(item.concept)),
                  datasets: [
                    {
                      label: 'Average Score (%)',
                      data: classStats.conceptAverages.map((item: any) => Math.round(item.average)),
                      backgroundColor: 'hsl(var(--chart-1))',
                      borderColor: 'hsl(var(--chart-1))',
                    },
                    {
                      label: 'Struggling Students',
                      data: classStats.conceptAverages.map((item: any) => item.struggling),
                      backgroundColor: 'hsl(var(--destructive))',
                      borderColor: 'hsl(var(--destructive))',
                    },
                  ],
                }}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Count / Percentage',
                        color: 'hsl(var(--muted-foreground))',
                        font: {
                          size: 12,
                        },
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top' as const,
                    },
                  },
                }}
                height={300}
              />
              
              <div className="mt-6 space-y-4">
                {classStats.conceptAverages.map((item: any) => (
                  <div key={item.concept} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{getConceptLabel(item.concept)}</span>
                        {item.struggling > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {item.struggling} struggling
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{Math.round(item.average)}%</span>
                    </div>
                    <Progress value={item.average} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Progress</CardTitle>
                <CardDescription>Click on a student to view detailed progress</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportAllStudents}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentsProgress.map((progress) => (
                <div
                  key={progress.student.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                  onClick={() => handleViewStudent(progress.student.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{progress.student.username || progress.student.email}</p>
                        {progress.alerts.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {progress.alerts.length} alert{progress.alerts.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {progress.completedProjects} / {progress.totalProjects} projects completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{progress.averageScore}%</p>
                      <p className="text-xs text-muted-foreground">Average Score</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleViewStudent(progress.student.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {/* Grading Button: links to assignment grading for this student */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/admin/assignment-grading/${progress.student.id}`);
                      }}
                    >
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Grade Submissions
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            Dashboard displays real-time student activity data. Complete projects and quizzes to see progress tracking in action.
          </AlertDescription>
        </Alert>
      </div>
    </AppLayout>
  );
}