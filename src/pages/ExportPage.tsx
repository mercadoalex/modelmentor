import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { Copy, Check, Share2, Code, Home, FileText, Database, GraduationCap, Zap, Bug, Share2 as ShareIcon, Award, Sparkles } from 'lucide-react';
import { MLWorkflowVisualizer } from '@/components/MLWorkflowVisualizer';
import { projectService } from '@/services/supabase';
import { badgeService } from '@/services/badgeService';
import { toast } from 'sonner';
import type { Project, DifficultyLevel } from '@/types/types';

const workflowSteps = [
  { id: 'describe', title: 'Describe', description: 'Define your ML project goals', icon: FileText },
  { id: 'data', title: 'Input Data', description: 'Upload or select training data', icon: Database },
  { id: 'learn', title: 'Learn', description: 'Understand ML concepts', icon: GraduationCap },
  { id: 'train', title: 'Train Model', description: 'Train your AI model', icon: Zap },
  { id: 'debug', title: 'Test & Debug', description: 'Evaluate and refine', icon: Bug },
  { id: 'deploy', title: 'Deploy', description: 'Share your model', icon: ShareIcon }
];

export default function ExportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [badgeEarned, setBadgeEarned] = useState<DifficultyLevel | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    
    const projectData = await projectService.getById(projectId);
    if (projectData) {
      setProject(projectData);
      
      // Check if this is an example project completion for registered users
      if (user && projectData.description) {
        // Try to extract difficulty from project description
        // This is a simplified approach - in production you'd store this with the project
        const exampleText = projectData.description;
        
        // For now, we'll skip automatic marking since we don't have difficulty stored
        // Users will need to complete projects from the example list
      }
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

  const demoUrl = `${window.location.origin}/demo/${projectId}`;
  const embedCode = `<iframe src="${demoUrl}" width="800" height="600" frameborder="0"></iframe>`;

  const copyToClipboard = (text: string, type: 'link' | 'embed') => {
    navigator.clipboard.writeText(text);
    
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
    
    toast.success('Copied to clipboard');
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Workflow Progress - All Complete */}
        <Card className="border-none shadow-none bg-muted/30">
          <CardContent className="pt-6 pb-6">
            <MLWorkflowVisualizer steps={workflowSteps} currentStep={6} />
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-semibold">Step 6: Deploy & Share</h1>
            <p className="text-lg text-muted-foreground">
              Your model has been trained and is ready to share
            </p>
          </div>

        {/* Badge Earned Notification */}
        {badgeEarned && user && (
          <Alert className="border-primary bg-primary/5">
            <Award className="h-5 w-5 text-primary" />
            <AlertDescription className="ml-2">
              <div className="space-y-2">
                <p className="font-medium">🎉 Congratulations! You earned a badge!</p>
                <p className="text-sm">
                  You've completed all {badgeEarned}-level projects and earned the{' '}
                  <span className="font-medium capitalize">{badgeEarned} ML {badgeEarned === 'beginner' ? 'Explorer' : badgeEarned === 'intermediate' ? 'Practitioner' : 'Expert'}</span> badge!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/badges')}
                  className="mt-2"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  View Your Badges
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Project Name</p>
              <p className="font-medium">{project.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Model Type</p>
              <Badge variant="secondary">
                {project.model_type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant="default">Completed</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Shareable Link
            </CardTitle>
            <CardDescription>
              Share this link to let others try your model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={demoUrl} readOnly className="flex-1" />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(demoUrl, 'link')}
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex justify-center p-4 bg-muted rounded-lg">
              <QRCodeDataUrl text={demoUrl} width={200} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Embed Code
            </CardTitle>
            <CardDescription>
              Embed this model in your website or blog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={embedCode} readOnly className="flex-1 font-mono text-sm" />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(embedCode, 'embed')}
              >
                {copiedEmbed ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="bg-background border rounded p-4 text-center">
                <p className="text-sm">Your embedded model will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Share your model with friends and classmates</li>
              <li>• Collect feedback on model performance</li>
              <li>• Create more projects to explore different ML techniques</li>
              <li>• Improve your model by collecting more training data</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={() => navigate('/')} size="lg">
            <Home className="h-5 w-5 mr-2" />
            Back to Projects
          </Button>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
