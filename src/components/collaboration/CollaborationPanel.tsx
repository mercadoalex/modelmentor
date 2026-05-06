import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { collaborationService } from '@/services/collaborationService';
import type { SharedExperiment, ExperimentComment, CollaborationActivity } from '@/types/types';
import { Users, Share2, MessageSquare, Activity, TrendingUp, Clock, Info, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CollaborationPanelProps {
  projectId: string;
}

export function CollaborationPanel({ projectId }: CollaborationPanelProps) {
  const [experiments, setExperiments] = useState<SharedExperiment[]>([]);
  const [activities, setActivities] = useState<CollaborationActivity[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<SharedExperiment | null>(null);
  const [comments, setComments] = useState<ExperimentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareForm, setShareForm] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    const [exps, acts] = await Promise.all([
      collaborationService.getSharedExperiments(projectId),
      collaborationService.getActivityFeed(projectId),
    ]);
    setExperiments(exps);
    setActivities(acts);
  };

  const handleShareExperiment = async () => {
    if (!shareForm.title) {
      toast.error('Please enter a title');
      return;
    }

    const result = await collaborationService.shareExperiment(
      projectId,
      shareForm.title,
      shareForm.description,
      { accuracy: 0.85, loss: 0.15, trainingTime: 1200 },
      { epochs: 20, batchSize: 32, learningRate: 0.001 }
    );

    if (result) {
      toast.success('Experiment shared successfully');
      setShareDialogOpen(false);
      setShareForm({ title: '', description: '' });
      loadData();
    } else {
      toast.error('Failed to share experiment');
    }
  };

  const handleViewExperiment = async (experiment: SharedExperiment) => {
    setSelectedExperiment(experiment);
    const comms = await collaborationService.getComments(experiment.id);
    setComments(comms);
  };

  const handleAddComment = async () => {
    if (!selectedExperiment || !newComment.trim()) return;

    const result = await collaborationService.addComment(selectedExperiment.id, newComment);
    if (result) {
      toast.success('Comment added');
      setNewComment('');
      const comms = await collaborationService.getComments(selectedExperiment.id);
      setComments(comms);
      loadData();
    } else {
      toast.error('Failed to add comment');
    }
  };

  const comparison = collaborationService.compareExperiments(experiments);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaborative Training
          </CardTitle>
          <CardDescription className="text-pretty">
            Share experiments, compare results, and learn from your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Collaborate with other students by sharing your training experiments, comparing results,
              and discussing approaches to improve model performance together.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Share Experiment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-balance">Share Your Experiment</CardTitle>
              <CardDescription className="text-pretty">
                Share your training results with collaborators
              </CardDescription>
            </div>
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Experiment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Share Experiment</DialogTitle>
                  <DialogDescription>
                    Share your training results with your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={shareForm.title}
                      onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                      placeholder="e.g., High accuracy with data augmentation"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={shareForm.description}
                      onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                      placeholder="Describe what you tried and what you learned..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleShareExperiment} className="w-full">
                    Share
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Experiment Comparison */}
      {experiments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Team Results Comparison</CardTitle>
            <CardDescription className="text-pretty">
              Compare experiments from all team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {comparison.bestAccuracy && (
              <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Best Accuracy</span>
                  <Badge className="bg-green-500">{comparison.bestAccuracy.title}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{comparison.bestAccuracy.description}</p>
              </div>
            )}

            {comparison.fastestTraining && (
              <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Fastest Training</span>
                  <Badge className="bg-blue-500">{comparison.fastestTraining.title}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{comparison.fastestTraining.description}</p>
              </div>
            )}

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left text-sm font-medium whitespace-nowrap">Experiment</th>
                    <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Accuracy</th>
                    <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Loss</th>
                    <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Time</th>
                    <th className="p-2 text-center text-sm font-medium whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.comparison.map(({ experiment, metrics }) => (
                    <tr key={experiment.id} className="border-b">
                      <td className="p-2 whitespace-nowrap">
                        <div>
                          <p className="font-medium">{experiment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(experiment.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap font-medium">
                        {(metrics.accuracy * 100).toFixed(2)}%
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">{metrics.loss.toFixed(4)}</td>
                      <td className="p-2 text-right whitespace-nowrap">{metrics.trainingTime.toFixed(0)}ms</td>
                      <td className="p-2 text-center whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewExperiment(experiment)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experiment Details & Comments */}
      {selectedExperiment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">{selectedExperiment.title}</CardTitle>
            <CardDescription className="text-pretty">
              {selectedExperiment.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Comments ({comments.length})</p>
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
              ) : (
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 border rounded-lg">
                      <p className="text-sm">{comment.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button onClick={handleAddComment}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Feed */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="text-sm">
                      {activity.activity_type === 'experiment_shared' && 'Shared an experiment'}
                      {activity.activity_type === 'comment_added' && 'Added a comment'}
                      {activity.activity_type === 'collaborator_added' && 'Added a collaborator'}
                      {activity.activity_type === 'model_updated' && 'Updated the model'}
                      {activity.activity_type === 'dataset_updated' && 'Updated the dataset'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
