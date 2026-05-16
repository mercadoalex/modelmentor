import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StandardsBadges } from '@/components/lesson-plans/StandardsBadges';
import { RubricTable } from '@/components/lesson-plans/RubricTable';
import { StudentHandoutView } from '@/components/lesson-plans/StudentHandoutView';
import { TeacherNotesCallout } from '@/components/lesson-plans/TeacherNotesCallout';
import { DifferentiationStrategies } from '@/components/lesson-plans/DifferentiationStrategies';
import { ArrowLeft, Clock, Download, Printer } from 'lucide-react';
import { getPlanBySlug } from '@/data/lessonPlans';
import { exportLessonPlanPDF, exportStudentHandoutPDF } from '@/utils/lessonPlanPdfExport';
import { toast } from 'sonner';

export default function LessonPlanDetailPage() {
  const { t } = useTranslation();
  const { planId } = useParams<{ planId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to access lesson plans');
      navigate('/login');
      return;
    }

    if (profile && profile.role !== 'teacher' && profile.role !== 'admin' && profile.role !== 'super_admin') {
      toast.error('Access denied.');
      navigate('/');
      return;
    }
  }, [user, profile, navigate]);

  const plan = planId ? getPlanBySlug(planId) : undefined;

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </AppLayout>
    );
  }

  if (!plan) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto text-center py-12 space-y-4">
          <h2 className="text-2xl font-semibold">Lesson Plan Not Found</h2>
          <p className="text-muted-foreground">
            The lesson plan you're looking for doesn't exist.
          </p>
          <Button asChild variant="outline">
            <Link to="/teacher/lesson-plans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('lessonPlans.ui.backToLibrary')}
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleExportPDF = () => {
    exportLessonPlanPDF(plan, t);
  };

  const handleExportHandout = () => {
    exportStudentHandoutPDF(plan, t);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/teacher/lesson-plans">
              <ArrowLeft className="h-4 w-4" />
              {t('lessonPlans.ui.backToLibrary')}
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              {t(`lessonPlans.plans.${plan.slug}.title`, { defaultValue: plan.title })}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {t(`lessonPlans.ui.gradeBands.${plan.gradeBand}`)}
              </Badge>
              <Badge variant="secondary">
                {t(`lessonPlans.ui.subjects.${plan.subjectArea}`)}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {t(`lessonPlans.ui.durations.${plan.duration}`)}
              </Badge>
              <Badge variant="outline">
                {t(`lessonPlans.ui.modelTypes.${plan.modelType}`)}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t('lessonPlans.ui.print')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportHandout}>
              <Download className="h-4 w-4 mr-2" />
              {t('lessonPlans.ui.exportHandout')}
            </Button>
            <Button size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              {t('lessonPlans.ui.exportPdf')}
            </Button>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value="overview">{t('lessonPlans.ui.overview')}</TabsTrigger>
            <TabsTrigger value="procedure">{t('lessonPlans.ui.procedure')}</TabsTrigger>
            <TabsTrigger value="assessment">{t('lessonPlans.ui.assessment')}</TabsTrigger>
            <TabsTrigger value="differentiation">{t('lessonPlans.ui.differentiation')}</TabsTrigger>
            <TabsTrigger value="handout">{t('lessonPlans.ui.handout')}</TabsTrigger>
            <TabsTrigger value="teacherNotes">{t('lessonPlans.ui.teacherNotes')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('lessonPlans.ui.overview')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  {t(`lessonPlans.plans.${plan.slug}.overview`, { defaultValue: plan.overview })}
                </p>

                {/* Objectives */}
                <div>
                  <h3 className="font-medium mb-2">{t('lessonPlans.ui.objectives')}</h3>
                  <ul className="space-y-1">
                    {plan.objectives.map((obj, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Standards */}
                <div>
                  <h3 className="font-medium mb-2">{t('lessonPlans.ui.standards')}</h3>
                  <StandardsBadges standards={plan.standards} sepAlignment={plan.sepAlignment} />
                </div>

                {/* Materials */}
                <div>
                  <h3 className="font-medium mb-2">{t('lessonPlans.ui.materials')}</h3>
                  <ul className="space-y-1">
                    {plan.materials.map((material, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>{material}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vocabulary */}
                {plan.vocabulary.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">{t('lessonPlans.ui.vocabulary')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plan.vocabulary.map((item, i) => (
                        <div key={i} className="p-3 rounded-lg border">
                          <p className="text-sm font-medium">{item.term}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Procedure Tab */}
          <TabsContent value="procedure" className="space-y-4">
            {plan.procedure.map((phase, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{phase.name}</CardTitle>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {phase.duration}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {phase.steps.map((step, sIndex) => (
                      <li key={sIndex}>{step}</li>
                    ))}
                  </ol>
                  {phase.discussionPrompts && phase.discussionPrompts.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Discussion</p>
                      {phase.discussionPrompts.map((prompt, pIndex) => (
                        <p key={pIndex} className="text-sm italic text-muted-foreground">
                          "{prompt}"
                        </p>
                      ))}
                    </div>
                  )}
                  {phase.modelMentorFeatures && phase.modelMentorFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t">
                      {phase.modelMentorFeatures.map((feature, fIndex) => (
                        <Badge key={fIndex} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Assessment Tab */}
          <TabsContent value="assessment" className="space-y-6">
            {/* Formative Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('lessonPlans.ui.formativeAssessment')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {plan.formativeAssessment.indicators.map((indicator, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Rubric */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('lessonPlans.ui.rubric')}</CardTitle>
              </CardHeader>
              <CardContent>
                <RubricTable rubric={plan.rubric} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Differentiation Tab */}
          <TabsContent value="differentiation">
            <DifferentiationStrategies differentiation={plan.differentiation} />
          </TabsContent>

          {/* Handout Tab */}
          <TabsContent value="handout">
            <StudentHandoutView handout={plan.handout} />
          </TabsContent>

          {/* Teacher Notes Tab */}
          <TabsContent value="teacherNotes">
            <TeacherNotesCallout teacherNotes={plan.teacherNotes} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
