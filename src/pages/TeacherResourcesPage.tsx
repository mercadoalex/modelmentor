import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Download, Clock, GraduationCap, Target, Lightbulb, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { lessonPlans } from '@/utils/lessonPlans';
import { toast } from 'sonner';

export default function TeacherResourcesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(lessonPlans[0]);

  useEffect(() => {
    // Redirect if user is not logged in or doesn't have teacher/admin role
    if (!user) {
      toast.error('Please sign in to access Teacher Resources');
      navigate('/login');
      return;
    }

    if (profile && profile.role !== 'teacher' && profile.role !== 'admin' && profile.role !== 'super_admin') {
      toast.error('Access denied. Teacher Resources are only available to teachers and administrators.');
      navigate('/');
      return;
    }
  }, [user, profile, navigate]);

  // Show loading state while checking authentication
  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show access denied if user doesn't have proper role
  if (profile.role !== 'teacher' && profile.role !== 'admin' && profile.role !== 'super_admin') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10">
                  <ShieldAlert className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Access Denied</CardTitle>
                  <CardDescription>You don't have permission to view this page</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Teacher Resources are only available to users with teacher or administrator roles.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleDownloadPDF = () => {
    toast.success('PDF download will be available soon');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Teacher Resources</h1>
              <p className="text-muted-foreground">Classroom-ready lesson plans and teaching materials</p>
            </div>
          </div>
        </div>

        {/* Lesson Plan Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Lesson Plan</CardTitle>
            <CardDescription>Choose a model type to view the corresponding lesson plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lessonPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedPlan.id === plan.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <p className="font-medium">{plan.modelType}</p>
                  <p className="text-sm text-muted-foreground mt-1">{plan.gradeLevel}</p>
                  <Badge variant="secondary" className="mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {plan.duration}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lesson Plan Content */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{selectedPlan.title}</CardTitle>
                <div className="flex gap-3">
                  <Badge variant="outline">{selectedPlan.gradeLevel}</Badge>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedPlan.duration}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  Print
                </Button>
                <Button onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="objectives">Objectives</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
                <TabsTrigger value="steps">Teaching Steps</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
                <TabsTrigger value="extension">Extension</TabsTrigger>
                <TabsTrigger value="troubleshooting">Help</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Lesson Overview</h3>
                  <p className="text-muted-foreground leading-relaxed">{selectedPlan.overview}</p>
                </div>
              </TabsContent>

              {/* Learning Objectives Tab */}
              <TabsContent value="objectives" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Learning Objectives</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedPlan.learningObjectives.map((objective, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{objective}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Materials Tab */}
              <TabsContent value="materials" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Required Materials</h3>
                  <div className="space-y-2">
                    {selectedPlan.materials.map((material, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-muted-foreground mt-1">•</span>
                        <p className="text-sm">{material}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Vocabulary Tab */}
              <TabsContent value="vocabulary" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Key Vocabulary</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPlan.vocabulary.map((item, index) => (
                      <div key={index} className="p-4 rounded-lg border border-border">
                        <p className="font-medium text-sm mb-2">{item.term}</p>
                        <p className="text-sm text-muted-foreground">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Teaching Steps Tab */}
              <TabsContent value="steps" className="space-y-6">
                <div className="space-y-6">
                  {selectedPlan.teachingSteps.map((step, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              Step {index + 1}: {step.step}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {step.duration}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Instructions:</p>
                          <ul className="space-y-2">
                            {step.instructions.map((instruction, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>{instruction}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Discussion Prompts:</p>
                          <div className="space-y-2">
                            {step.discussionPrompts.map((prompt, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                                <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-sm">{prompt}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Assessment Tab */}
              <TabsContent value="assessment" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Assessment Criteria</h3>
                  <div className="space-y-4">
                    {selectedPlan.assessmentCriteria.map((category, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-base">{category.category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {category.criteria.map((criterion, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span>{criterion}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Extension Activities Tab */}
              <TabsContent value="extension" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Extension Activities</h3>
                  <div className="space-y-3">
                    {selectedPlan.extensionActivities.map((activity, index) => (
                      <div key={index} className="p-4 rounded-lg border border-border">
                        <p className="text-sm">{activity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Troubleshooting Tab */}
              <TabsContent value="troubleshooting" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Troubleshooting Guide</h3>
                  </div>
                  <div className="space-y-4">
                    {selectedPlan.troubleshooting.map((item, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-destructive">
                            Issue: {item.issue}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Solution: </span>
                            {item.solution}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
