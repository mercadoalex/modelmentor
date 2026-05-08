import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, FileText, Database, GraduationCap, Zap, Bug, Share2 } from 'lucide-react';
import { MLWorkflowVisualizer } from '@/components/MLWorkflowVisualizer';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { projectService } from '@/services/supabase';
import { activityTrackingService } from '@/services/activityTrackingService';
import { learningContent, quizQuestions, simulations } from '@/utils/learning';
import { toast } from 'sonner';
import type { Project, QuizQuestion, ConceptName } from '@/types/types';

const workflowSteps = [
  { id: 'describe', title: 'Describe', description: 'Define your ML project goals', icon: FileText },
  { id: 'data', title: 'Input Data', description: 'Upload or select training data', icon: Database },
  { id: 'learn', title: 'Learn', description: 'Understand ML concepts', icon: GraduationCap },
  { id: 'train', title: 'Train Model', description: 'Train your AI model', icon: Zap },
  { id: 'debug', title: 'Test & Debug', description: 'Evaluate and refine', icon: Bug },
  { id: 'deploy', title: 'Deploy', description: 'Share your model', icon: Share2 }
];

export default function InteractiveLearningPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [currentStep, setCurrentStep] = useState<'content' | 'quiz' | 'simulation'>('content');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    
    const projectData = await projectService.getById(projectId);
    if (projectData) {
      setProject(projectData);
    }
  };

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const content = learningContent[project.model_type];
  const questions = quizQuestions[project.model_type];
  const currentQuestion = questions[currentQuizIndex];
  const totalSteps = 3;
  const currentStepNumber = currentStep === 'content' ? 1 : currentStep === 'quiz' ? 2 : 3;
  const progress = (currentStepNumber / totalSteps) * 100;

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null) {
      toast.error('Please select an answer');
      return;
    }
    
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      toast.success('Correct!');
    } else {
      toast.error('Incorrect');
    }
    
    setAnsweredQuestions(prev => new Set(prev).add(currentQuizIndex));
    setShowExplanation(true);
    
    // Track quiz completion for registered users
    if (user && project) {
      // Map model type to concept (simplified mapping)
      const conceptMap: Record<string, ConceptName> = {
        'image_classification': 'overfitting',
        'text_classification': 'bias_variance',
        'regression': 'gradient_descent'
      };
      
      const concept = conceptMap[project.model_type] || 'model_evaluation';
      
      await activityTrackingService.trackQuizCompletion(
        user.id,
        concept,
        `${project.model_type}_q${currentQuizIndex}`,
        isCorrect,
        currentQuestion.options[selectedAnswer],
        timeSpent
      );
    }
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < questions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now()); // Reset timer for next question
    } else {
      setCurrentStep('simulation');
    }
  };

  const handleContinueToTraining = async () => {
    if (!projectId) return;
    
    setLoading(true);
    
    try {
      await projectService.update(projectId, { status: 'training' });
      navigate(`/project/${projectId}/training`);
    } catch (error) {
      toast.error('Failed to proceed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Workflow Progress */}
        <Card className="border-none shadow-none bg-muted/30">
          <CardContent className="pt-6 pb-6">
            <MLWorkflowVisualizer steps={workflowSteps} currentStep={2} />
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold">Step 3: Learn ML Concepts</h1>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{currentStepNumber} of {totalSteps}</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>

        {currentStep === 'content' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{content.visual}</span>
                <div>
                  <CardTitle>{content.title}</CardTitle>
                  <CardDescription>{content.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Key Concepts
                </h3>
                <ul className="space-y-3">
                  {content.concepts.map((concept, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{concept}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button onClick={() => setCurrentStep('quiz')} className="w-full" size="lg">
                Continue to Quiz
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 'quiz' && (
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Check</CardTitle>
              <CardDescription>
                Question {currentQuizIndex + 1} of {questions.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="font-medium">{currentQuestion.question}</p>
                
                <RadioGroup value={selectedAnswer?.toString()} onValueChange={(value) => setSelectedAnswer(Number.parseInt(value))}>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                        {showExplanation && index === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                        {showExplanation && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    ))}
                  </div>
                </RadioGroup>
                
                {showExplanation && (
                  <Alert>
                    <AlertDescription>{currentQuestion.explanation}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              {!showExplanation ? (
                <Button onClick={handleAnswerSubmit} className="w-full" size="lg">
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} className="w-full" size="lg">
                  {currentQuizIndex < questions.length - 1 ? 'Next Question' : 'Continue to Simulation'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              )}
              
              <div className="flex items-center justify-center gap-2">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      answeredQuestions.has(index) ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'simulation' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <p className="text-4xl font-semibold">{correctAnswers} / {questions.length}</p>
                  <p className="text-muted-foreground">Correct Answers</p>
                  <Badge variant={correctAnswers >= questions.length * 0.7 ? 'default' : 'secondary'} className="mt-2">
                    {correctAnswers >= questions.length * 0.7 ? 'Great Job!' : 'Keep Learning!'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{simulations.badData.title}</CardTitle>
                <CardDescription>{simulations.badData.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {simulations.badData.scenarios.map((scenario, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <p className="font-medium text-sm">{scenario.condition}</p>
                      <p className="text-sm text-muted-foreground">→ {scenario.result}</p>
                      <Badge variant="destructive">{scenario.impact}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{simulations.insufficientData.title}</CardTitle>
                <CardDescription>{simulations.insufficientData.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {simulations.insufficientData.scenarios.map((scenario, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <p className="font-medium text-sm">{scenario.condition}</p>
                      <p className="text-sm text-muted-foreground">→ {scenario.result}</p>
                      <Badge variant={index === 2 ? 'default' : 'secondary'}>{scenario.impact}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleContinueToTraining} disabled={loading} className="w-full" size="lg">
              Start Training
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}
        </div>
      </div>
      {projectId && (
        <div className="mt-6">
          <CollaborationPanel projectId={projectId} />
        </div>
      )}
    </AppLayout>
  );
}
