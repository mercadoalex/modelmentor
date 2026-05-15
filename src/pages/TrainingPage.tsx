import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTraining } from '@/contexts/TrainingContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, ArrowRight, FileText, Database, GraduationCap, Zap, Bug, Share2, Download, FileDown, Loader2 } from 'lucide-react';
import { LineChart } from '@/components/charts/ChartComponents';
import { MLWorkflowVisualizer } from '@/components/MLWorkflowVisualizer';
import { TrainingStageIndicator, type TrainingStage } from '@/components/TrainingStageIndicator';
import { TrainingLogs, type TrainingLog } from '@/components/TrainingLogs';
import { TrainingConfigPanel, type TrainingConfig } from '@/components/TrainingConfigPanel';
import { TrainingMetricsDisplay } from '@/components/TrainingMetricsDisplay';
import { ModelComparisonPanel } from '@/components/model/ModelComparisonPanel';
import { ConfusionMatrixVisualization } from '@/components/model/ConfusionMatrixVisualization';
import { ErrorAnalysisDashboard } from '@/components/model/ErrorAnalysisDashboard';
import { FeatureImportanceRanking, type FeatureImportanceData } from '@/components/model/FeatureImportanceRanking';
import { ShapVisualization } from '@/components/model/ShapVisualization';
import { ModelComparisonDashboard } from '@/components/model/ModelComparisonDashboard';
import { LearningCurveAnalysis } from '@/components/model/LearningCurveAnalysis';
import { BiasVarianceTradeoff } from '@/components/model/BiasVarianceTradeoff';
import { ModelInterpretabilityDashboard } from '@/components/model/ModelInterpretabilityDashboard';
import { ModelDeploymentGuide } from '@/components/model/ModelDeploymentGuide';
import { ModelPlayground } from '@/components/model/ModelPlayground';
import { PerformanceSimulator } from '@/components/model/PerformanceSimulator';
import { RegularizationTuner } from '@/components/model/RegularizationTuner';
import { LearningRateScheduler } from '@/components/model/LearningRateScheduler';
import { ROCCurveVisualization } from '@/components/model/ROCCurveVisualization';
import { ModelEnsembleSystem } from '@/components/model/ModelEnsembleSystem';
import { ModelExplainabilityAPI } from '@/components/model/ModelExplainabilityAPI';
import { AutomatedHyperparameterTuning } from '@/components/model/AutomatedHyperparameterTuning';
import { ModelMonitoringDashboard } from '@/components/model/ModelMonitoringDashboard';
import { ModelGovernanceDashboard } from '@/components/model/ModelGovernanceDashboard';
import { ABTestingDashboard } from '@/components/model/ABTestingDashboard';
import { NeuralArchitectureSearch } from '@/components/model/NeuralArchitectureSearch';
import { ModelVersionHistory } from '@/components/model/ModelVersionHistory';
import { HyperparameterOptimizer } from '@/components/model/HyperparameterOptimizer';
import { TrainingCompletionSummary } from '@/components/model/TrainingCompletionSummary';
import { AnomalyDetectionWorkshop } from '@/components/model/AnomalyDetectionWorkshop';
import { TimeSeriesAnalysisWorkshop } from '@/components/model/TimeSeriesAnalysisWorkshop';
import { ReinforcementLearningPlayground } from '@/components/model/ReinforcementLearningPlayground';
import { TransferLearningPanel } from '@/components/model/TransferLearningPanel';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { CrossValidationPreview } from '@/components/model/CrossValidationPreview';
import { EarlyStoppingConfigPanel } from '@/components/model/EarlyStoppingConfigPanel';
import { earlyStoppingService } from '@/services/earlyStoppingService';
import type { EarlyStoppingConfig } from '@/services/earlyStoppingService';
import { confusionMatrixService } from '@/services/confusionMatrixService';
import { errorAnalysisService } from '@/services/errorAnalysisService';
import { modelVersionService } from '@/services/modelVersionService';
import { EnhancedTrainingPipeline } from '@/utils/enhancedTrainingPipeline';
import { createTrainingRunner } from '@/utils/tfTraining';
import type { TrainingStatus } from '@/utils/tfTraining';
import { projectService, datasetService, trainingService } from '@/services/supabase';
import { activityTrackingService } from '@/services/activityTrackingService';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { exportTrainingResultsPDF } from '@/utils/pdfExport';
import * as tf from '@tensorflow/tfjs';
import {
  trainTextClassificationModel,
  trainRegressionModel,
  trainNumericClassificationModel,
  downloadModel,
  type DataPoint,
} from '@/utils/tensorflowUtils';
import type { Project, Dataset, TrainingSession, TrainingMetrics } from '@/types/types';

const workflowSteps = [
  { id: 'describe', title: 'Describe',     description: 'Define your ML project goals',   icon: FileText      },
  { id: 'data',     title: 'Input Data',   description: 'Upload or select training data', icon: Database      },
  { id: 'learn',    title: 'Learn',        description: 'Understand ML concepts',         icon: GraduationCap },
  { id: 'train',    title: 'Train Model',  description: 'Train your AI model',            icon: Zap           },
  { id: 'debug',    title: 'Test & Debug', description: 'Evaluate and refine',            icon: Bug           },
  { id: 'deploy',   title: 'Deploy',       description: 'Share your model',               icon: Share2        },
];

const pipelineStages = [
  { id: 'idle'          as TrainingStage, label: 'Ready',         description: 'Waiting to start'                     },
  { id: 'preprocessing' as TrainingStage, label: 'Preprocessing', description: 'Preparing and normalizing data'       },
  { id: 'building'      as TrainingStage, label: 'Building',      description: 'Creating neural network architecture' },
  { id: 'training'      as TrainingStage, label: 'Training',      description: 'Training the model'                   },
  { id: 'evaluating'    as TrainingStage, label: 'Evaluating',    description: 'Evaluating model performance'         },
  { id: 'completed'     as TrainingStage, label: 'Completed',     description: 'Training finished'                    },
];

export default function TrainingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Backend integration contexts
  const training = useTraining();
  const subscription = useSubscription();

  // ── Core state ─────────────────────────────────────────────────────────────
  const [project,           setProject]           = useState<Project | null>(null);
  const [dataset,           setDataset]           = useState<Dataset | null>(null);
  const [trainingSession,   setTrainingSession]   = useState<TrainingSession | null>(null);
  const [metrics,           setMetrics]           = useState<TrainingMetrics[]>([]);
  const [trainingStartTime, setTrainingStartTime] = useState<number | null>(null);
  const [isTraining,        setIsTraining]        = useState(false);
  const [isPaused,          setIsPaused]          = useState(false);
  const [currentEpoch,      setCurrentEpoch]      = useState(0);
  const [trainedModel,      setTrainedModel]      = useState<tf.LayersModel | null>(null);
  const [isCompleted,       setIsCompleted]       = useState(false);

  // ── Training status (real vs simulation) ───────────────────────────────────
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);

  // ── Pipeline state ─────────────────────────────────────────────────────────
  const [currentStage,   setCurrentStage]   = useState<TrainingStage>('idle');
  const [logs,           setLogs]           = useState<TrainingLog[]>([]);
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    epochs:               20,
    batchSize:            32,
    learningRate:         0.001,
    optimizer:            'adam',
    validationSplit:      0.2,
    earlyStopping:        true,
    earlyStoppingPatience: 3,
    shuffle:              true,
  });
  const [earlyStoppingConfig, setEarlyStoppingConfig] = useState<EarlyStoppingConfig>(
    earlyStoppingService.getDefaultConfig()
  );
  const [currentMetrics, setCurrentMetrics] = useState<{
    currentLoss?:    number;
    currentAccuracy?: number;
    bestLoss?:       number;
    bestAccuracy?:   number;
  }>({});
  const [elapsedTime,            setElapsedTime]            = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  const intervalRef          = useRef<NodeJS.Timeout | null>(null);
  const trainingCancelledRef = useRef(false);
  const pipelineRef          = useRef<EnhancedTrainingPipeline | null>(null);

  // ── Effects ────────────────────────────────────────────────────────────────
  // Sync real-time progress from TrainingContext when authenticated
  useEffect(() => {
    if (!isAuthenticated || !isTraining) return;

    // Find the active job's progress from TrainingContext
    const activeJob = training.activeJobs.find(j => j.status === 'running');
    if (!activeJob) return;

    const progress = training.currentProgress.get(activeJob.sessionId);
    if (!progress) return;

    setCurrentEpoch(progress.epoch);
    setCurrentMetrics(prev => ({
      currentLoss: progress.loss,
      currentAccuracy: progress.accuracy,
      bestLoss: prev.bestLoss === undefined || progress.loss < prev.bestLoss ? progress.loss : prev.bestLoss,
      bestAccuracy: prev.bestAccuracy === undefined || progress.accuracy > prev.bestAccuracy! ? progress.accuracy : prev.bestAccuracy,
    }));

    // Add to metrics array for chart
    setMetrics(prev => {
      const existing = prev.find(m => m.epoch === progress.epoch);
      if (existing) return prev;
      return [...prev, {
        epoch: progress.epoch,
        loss: progress.loss,
        accuracy: progress.accuracy,
        val_loss: progress.loss,
        val_accuracy: progress.accuracy,
      }];
    });

    // Update elapsed time from progress
    if (progress.elapsedSeconds > 0) {
      setElapsedTime(progress.elapsedSeconds);
    }

    // Estimate remaining time
    if (progress.epoch > 0) {
      const avgTimePerEpoch = progress.elapsedSeconds / progress.epoch;
      setEstimatedTimeRemaining(Math.max(0, avgTimePerEpoch * (progress.totalEpochs - progress.epoch)));
    }
  }, [isAuthenticated, isTraining, training.currentProgress, training.activeJobs]);

  // Detect when backend training job completes
  useEffect(() => {
    if (!isAuthenticated || !isTraining) return;

    // Check if the job moved to history (completed/failed)
    const recentJob = training.jobHistory[0];
    if (!recentJob) return;

    // Only react to jobs that started during this training session
    if (!trainingStartTime) return;
    const jobStarted = new Date(recentJob.startedAt).getTime();
    if (jobStarted < trainingStartTime - 5000) return; // Allow 5s tolerance

    if (recentJob.status === 'completed') {
      setIsTraining(false);
      setIsCompleted(true);
      setCurrentStage('completed');

      if (recentJob.metrics) {
        setCurrentMetrics({
          currentLoss: recentJob.metrics.loss,
          currentAccuracy: recentJob.metrics.accuracy,
          bestLoss: recentJob.metrics.loss,
          bestAccuracy: recentJob.metrics.accuracy,
        });
        // Ensure final metrics are in the array
        setMetrics(prev => {
          const lastEpoch = prev.length > 0 ? prev[prev.length - 1].epoch : 0;
          if (lastEpoch < trainingConfig.epochs) {
            return [...prev, {
              epoch: trainingConfig.epochs,
              loss: recentJob.metrics!.loss,
              accuracy: recentJob.metrics!.accuracy,
              val_loss: recentJob.metrics!.loss,
              val_accuracy: recentJob.metrics!.accuracy,
            }];
          }
          return prev;
        });
      }

      setLogs(prev => [...prev, { timestamp: new Date(), level: 'success', message: 'Training completed!' }]);
      toast.success('Training completed!');

      // Refresh usage after training completes
      subscription.refreshUsage();
    } else if (recentJob.status === 'failed' || recentJob.status === 'timeout') {
      setIsTraining(false);
      setCurrentStage('idle');
      setLogs(prev => [...prev, {
        timestamp: new Date(),
        level: 'error',
        message: recentJob.error || `Training ${recentJob.status}`,
      }]);
      toast.error(recentJob.error || `Training ${recentJob.status}`);
    }
  }, [isAuthenticated, isTraining, training.jobHistory, trainingStartTime, trainingConfig.epochs, subscription]);

  useEffect(() => {
    loadProject();

    let timeInterval: NodeJS.Timeout | null = null;
    if (isTraining && trainingStartTime) {
      timeInterval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - trainingStartTime) / 1000));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeInterval)        clearInterval(timeInterval);
    };
  }, [projectId, isTraining, trainingStartTime]);

  // ── Beforeunload: cancel training and dispose tensors on page leave ────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTraining) {
        trainingCancelledRef.current = true;
        const ref = pipelineRef.current as unknown as { cancel?: () => void };
        if (ref?.cancel) {
          ref.cancel();
        }
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTraining]);

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadProject = async () => {
    if (!projectId) return;

    const projectData = await projectService.getById(projectId);
    if (projectData) {
      setProject(projectData);

      // Try to load dataset — gracefully handle if datasets table doesn't have project_id column yet
      try {
        const datasetData = await datasetService.getByProjectId(projectId);
        if (datasetData) setDataset(datasetData);
      } catch (error) {
        console.warn('Could not load dataset by project_id (column may not exist yet):', error);
      }

      // If no dataset found, create a synthetic placeholder so training can proceed
      if (!dataset) {
        setDataset({
          id: `synthetic-${projectId}`,
          project_id: projectId,
          file_urls: [],
          labels: [],
          sample_count: 100,
          sample_dataset_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Dataset);
      }

      const existingSession = await trainingService.getByProjectId(projectId);
      if (existingSession) {
        setTrainingSession(existingSession);
        if (existingSession.metrics) {
          setMetrics(existingSession.metrics as TrainingMetrics[]);
        }
      }
    }
  };

  // ── Training logic ─────────────────────────────────────────────────────────
  const startTraining = async () => {
    if (!project || !dataset || !projectId) return;

    // ── Authenticated mode: use real backend via TrainingContext ──────────────
    if (isAuthenticated) {
      // Check quota/limits before starting
      const canTrain = subscription.checkCanPerform('training');
      if (!canTrain.allowed) {
        toast.error(canTrain.reason || 'Training limit reached', {
          action: {
            label: 'Upgrade',
            onClick: () => navigate('/pricing'),
          },
        });
        return;
      }

      setIsTraining(true);
      setIsPaused(false);
      setIsCompleted(false);
      setTrainingStartTime(Date.now());
      setElapsedTime(0);
      setCurrentEpoch(0);
      setMetrics([]);
      setLogs([]);
      setCurrentMetrics({});
      setCurrentStage('training');
      trainingCancelledRef.current = false;

      setLogs([{ timestamp: new Date(), level: 'info', message: 'Submitting training job to backend...' }]);

      try {
        const response = await training.startTraining({
          dataset_id: dataset.id,
          model_type: project.model_type as 'classification' | 'regression' | 'image_classification' | 'text_classification',
          config: {
            epochs: trainingConfig.epochs,
            batch_size: trainingConfig.batchSize,
            learning_rate: trainingConfig.learningRate,
            architecture: 'shallow_nn',
          },
        });

        // If the job completed immediately (unlikely but possible)
        if (response.status === 'completed') {
          setIsCompleted(true);
          setIsTraining(false);
          setCurrentStage('completed');
          if (response.metrics) {
            const finalMetric = {
              epoch: trainingConfig.epochs,
              loss: response.metrics.loss,
              accuracy: response.metrics.accuracy,
              val_loss: response.metrics.loss,
              val_accuracy: response.metrics.accuracy,
            };
            setMetrics([finalMetric]);
            setCurrentMetrics({
              currentLoss: response.metrics.loss,
              currentAccuracy: response.metrics.accuracy,
              bestLoss: response.metrics.loss,
              bestAccuracy: response.metrics.accuracy,
            });
          }
          setLogs(prev => [...prev, { timestamp: new Date(), level: 'success', message: 'Training completed!' }]);
          toast.success('Training completed!');
        } else if (response.status === 'failed') {
          setIsTraining(false);
          setCurrentStage('idle');
          setLogs(prev => [...prev, { timestamp: new Date(), level: 'error', message: response.error || 'Training failed' }]);
          toast.error(response.error || 'Training failed');
        } else {
          // Job is running/queued — progress will come via Realtime subscription in TrainingContext
          setLogs(prev => [...prev, { timestamp: new Date(), level: 'info', message: `Training job started (${response.session_id})` }]);
        }
      } catch (error) {
        console.error('Backend training error, falling back to simulated training:', error);
        setIsTraining(false);
        setCurrentStage('idle');
        setLogs([]);
        
        // Fall back to simulated training instead of blocking the user
        toast.info('Using local training mode (sign in for cloud training)');
        // Don't return — let it fall through to the offline training below
      }
    }

    // ── Offline/fallback mode: use training orchestrator ─────────────────────

    setIsTraining(true);
    setIsPaused(false);
    setIsCompleted(false);
    setTrainingStartTime(Date.now());
    setElapsedTime(0);
    setCurrentEpoch(0);
    setMetrics([]);
    setLogs([{ timestamp: new Date(), level: 'info', message: '🔧 Preparing training environment...' }]);
    setCurrentMetrics({});
    setCurrentStage('training');
    trainingCancelledRef.current = false;

    let session = trainingSession;

    if (!session) {
      setLogs(prev => [...prev, { timestamp: new Date(), level: 'info', message: '📦 Setting up training session...' }]);
      try {
        const sessionPromise = trainingService.create({
          project_id:    projectId,
          dataset_id:    dataset.id,
          epochs:        trainingConfig.epochs,
          current_epoch: 0,
          status:        'training',
          started_at:    new Date().toISOString(),
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
        session = await Promise.race([sessionPromise, timeoutPromise]) as typeof session;
        setTrainingSession(session);
      } catch {
        session = { id: `local-${Date.now()}` } as unknown as typeof session;
      }
      setLogs(prev => [...prev, { timestamp: new Date(), level: 'info', message: '✅ Ready. Loading data...' }]);
    }

    try {
      setLogs(prev => [...prev, { timestamp: new Date(), level: 'info', message: '🧠 Initializing training engine...' }]);

      const runner = createTrainingRunner(
        {
          modelType: (project.model_type as 'classification' | 'regression' | 'text_classification' | 'image_classification') || 'classification',
          data: [],
          config: {
            epochs: trainingConfig.epochs,
            batchSize: trainingConfig.batchSize,
            learningRate: trainingConfig.learningRate,
            optimizer: trainingConfig.optimizer as 'adam' | 'sgd' | 'rmsprop',
            validationSplit: trainingConfig.validationSplit,
          },
          projectId,
        },
        {
          onEpochEnd: (epoch, epochLogs) => {
            if (trainingCancelledRef.current) return;

            setCurrentEpoch(epoch);

            const elapsed = (Date.now() - (trainingStartTime || Date.now())) / 1000;
            const avgTimePerEpoch = elapsed / epoch;
            setEstimatedTimeRemaining(Math.max(0, avgTimePerEpoch * (trainingConfig.epochs - epoch)));

            const newMetric = {
              epoch,
              loss:         epochLogs.loss,
              accuracy:     epochLogs.acc,
              val_loss:     epochLogs.val_loss,
              val_accuracy: epochLogs.val_acc,
            };

            setMetrics(prev => [...prev, newMetric]);

            setCurrentMetrics(prev => ({
              currentLoss:     epochLogs.loss,
              currentAccuracy: epochLogs.acc,
              bestLoss:
                prev.bestLoss === undefined || epochLogs.loss < prev.bestLoss
                  ? epochLogs.loss
                  : prev.bestLoss,
              bestAccuracy:
                prev.bestAccuracy === undefined || epochLogs.acc > prev.bestAccuracy!
                  ? epochLogs.acc
                  : prev.bestAccuracy,
            }));

            setLogs(prev => [...prev, {
              timestamp: new Date(),
              level:     'success' as const,
              message:   `Epoch ${epoch}/${trainingConfig.epochs} completed`,
              details:   `Loss: ${epochLogs.loss.toFixed(4)}, Accuracy: ${(epochLogs.acc * 100).toFixed(2)}%`,
            }]);

            if (session) {
              trainingService.update(session.id, {
                current_epoch: epoch,
                accuracy:      epochLogs.acc,
                loss:          epochLogs.loss,
                metrics:       [] as unknown as Record<string, unknown>,
              });
            }
          },
          onComplete: (result) => {
            if (trainingCancelledRef.current) return;
            setIsCompleted(true);
            setCurrentStage('completed');
            setIsTraining(false);
            setLogs(prev => [...prev, {
              timestamp: new Date(),
              level:     'success' as const,
              message:   'Training completed successfully!',
              details:   `Final accuracy: ${(result.finalMetrics.accuracy * 100).toFixed(2)}%`,
            }]);
            toast.success('Training completed!');
            stopTraining(true);
          },
          onError: (error) => {
            console.error('Training error:', error);
            setCurrentStage('idle');
            setIsTraining(false);
            setLogs(prev => [...prev, {
              timestamp: new Date(),
              level:     'error',
              message:   'Training failed',
              details:   error.message,
            }]);
            toast.error('Training failed. Please try again.');
          },
          onStatusChange: (status) => {
            setTrainingStatus(status);
            if (status.type === 'loading_tf') {
              setLogs(prev => [...prev, {
                timestamp: new Date(),
                level:     'info',
                message:   `⏳ Loading TensorFlow.js (~${status.estimatedSizeMB}MB)...`,
              }]);
            } else if (status.type === 'fallback_to_simulation') {
              setLogs(prev => [...prev, {
                timestamp: new Date(),
                level:     'warning',
                message:   `📊 Falling back to simulation: ${status.reason}`,
              }]);
            } else if (status.type === 'training') {
              setLogs(prev => [...prev, {
                timestamp: new Date(),
                level:     'info',
                message:   status.isReal ? '🧪 Real TensorFlow.js training started' : '📊 Simulation training started',
              }]);
            }
          },
        },
        isAuthenticated
      );

      // Store cancel function for stop button
      pipelineRef.current = { cancel: () => runner.cancel() } as unknown as EnhancedTrainingPipeline;

      await runner.start();
    } catch (error) {
      console.error('Training error:', error);
      setCurrentStage('idle');
      setLogs(prev => [...prev, {
        timestamp: new Date(),
        level:     'error',
        message:   'Training failed',
        details:   error instanceof Error ? error.message : String(error),
      }]);
      toast.error('Training failed. Please try again.');
      setIsTraining(false);
    }
  };

  const pauseTraining = () => {
    toast.info('Pausing is not supported during active training. Please stop and restart.');
  };

  const resumeTraining = () => {
    setIsPaused(false);
    startTraining();
  };

  const stopTraining = async (completed = false) => {
    setIsTraining(false);
    setIsPaused(false);
    trainingCancelledRef.current = !completed;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (trainingSession && completed) {
      setIsCompleted(true);
      setCurrentStage('completed');

      await trainingService.update(trainingSession.id, {
        status:       'completed',
        completed_at: new Date().toISOString(),
      });

      if (projectId) await projectService.update(projectId, { status: 'testing' });

      if (user && project && projectId && trainingStartTime) {
        const durationSeconds = Math.floor((Date.now() - trainingStartTime) / 1000);
        const finalAccuracy   = metrics.length > 0 ? metrics[metrics.length - 1].accuracy : null;

        await activityTrackingService.trackTrainingCompletion(
          user.id, projectId, project.model_type, durationSeconds, finalAccuracy
        );

        if (finalAccuracy && dataset) {
          await modelVersionService.createVersion(projectId, {
            training_session_id: trainingSession.id,
            dataset_id:          dataset.id,
            accuracy:            finalAccuracy,
            loss:                metrics.length > 0 ? metrics[metrics.length - 1].loss : null,
            epochs:              trainingConfig.epochs,
            batch_size:          trainingConfig.batchSize,
            learning_rate:       trainingConfig.learningRate,
            feature_count:       dataset.labels?.length || 0,
            sample_count:        dataset.sample_count   || 0,
            class_labels:        dataset.labels         || [],
            notes:               `Training completed with ${(finalAccuracy * 100).toFixed(1)}% accuracy`,
          });
        }

        await supabase.from('notifications').insert({
          user_id: user.id,
          type:    'training_complete',
          title:   'Training Completed',
          message: `Your model "${project.title}" has finished training with ${
            finalAccuracy ? `${(finalAccuracy * 100).toFixed(1)}% accuracy` : 'completion'
          }!`,
          link: `/project/${projectId}/testing`,
          read: false,
        });
      }

      toast.success('Training completed!');
    } else if (!completed) {
      setCurrentStage('idle');
      setLogs(prev => [...prev, {
        timestamp: new Date(),
        level:     'warning',
        message:   'Training stopped by user',
      }]);
    }
  };

  // ── Export helpers ─────────────────────────────────────────────────────────
  const handleDownloadModel = async () => {
    if (!trainedModel || !project) { toast.error('No trained model available'); return; }
    try {
      await downloadModel(trainedModel, project.title.replace(/\s+/g, '_'));
      toast.success('Model downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download model');
    }
  };

  const handleExportPDF = () => {
    if (!project || metrics.length === 0) { toast.error('No training data available to export'); return; }
    try {
      const finalMetrics = metrics[metrics.length - 1];
      exportTrainingResultsPDF(
        project.title,
        project.model_type || 'Unknown',
        {
          final_accuracy: finalMetrics.accuracy,
          final_loss:     finalMetrics.loss,
          total_epochs:   metrics.length,
          training_time:  elapsedTime,
        },
        metrics.map(m => ({ epoch: m.epoch, loss: m.loss, accuracy: m.accuracy })),
        { author: user?.email || 'Student' }
      );
      toast.success('Training report exported as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleContinueToTesting = () => {
    if (!projectId) return;
    navigate(`/project/${projectId}/testing`);
  };

  // ── Loading guard ──────────────────────────────────────────────────────────
  if (!project || !dataset) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const progress     = (currentEpoch / trainingConfig.epochs) * 100;
  const latestMetric = metrics[metrics.length - 1];

  // ── Shorthand props shared across post-training panels ────────────────────
  const labels      = dataset.labels ?? [];
  const sampleCount = dataset.sample_count ?? 100;
  const bestAcc     = currentMetrics.bestAccuracy ?? 0.85;

  // ── Feature importance data derived from labels ───────────────────────────
  const featureImportanceData: FeatureImportanceData[] = labels.map((label, i) => ({
    feature:    label,
    importance: Math.max(0.05, 1 - i * (0.8 / Math.max(labels.length, 1))),
    rank:       i + 1,
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Workflow progress */}
        <Card className="border-none shadow-none bg-muted/30">
          <CardContent className="pt-6 pb-6">
            <MLWorkflowVisualizer steps={workflowSteps} currentStep={3} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">Step 4: Train Model</h1>
            <p className="text-muted-foreground">{project.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {isTraining && trainingStatus?.type === 'training' && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                {trainingStatus.isReal ? '🧪 Real Training' : '📊 Simulation'}
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="default" className="text-sm px-3 py-1 bg-green-500 text-white">
                ✓ Training Complete
              </Badge>
            )}
          </div>
        </div>

        {/* Training status indicators */}
        {trainingStatus?.type === 'loading_tf' && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Loading TensorFlow.js</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Estimated size: ~{trainingStatus.estimatedSizeMB}MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {trainingStatus?.type === 'fallback_to_simulation' && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">📊</span>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Using Simulation Mode</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">{trainingStatus.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main two-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: config + stage indicator + quick stats */}
          <div className="lg:col-span-1 space-y-6">

            {!isTraining && !isCompleted && (
              <div data-tour="training-config">
                <TrainingConfigPanel
                  config={trainingConfig}
                  onChange={setTrainingConfig}
                  disabled={isTraining}
                />
              </div>
            )}

            {(isTraining || isCompleted) && (
              <TrainingStageIndicator
                currentStage={currentStage}
                stages={pipelineStages}
                progress={progress}
              />
            )}

            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Current Epoch</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{currentEpoch} / {trainingConfig.epochs}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {latestMetric ? `${(latestMetric.accuracy * 100).toFixed(1)}%` : '—'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {latestMetric ? latestMetric.loss.toFixed(4) : '—'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: all training content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Live metrics display */}
            {(isTraining || isCompleted) && (
              <div data-tour="training-metrics">
                <TrainingMetricsDisplay
                  currentEpoch={currentEpoch}
                  totalEpochs={trainingConfig.epochs}
                  currentLoss={currentMetrics.currentLoss}
                  currentAccuracy={currentMetrics.currentAccuracy}
                  bestLoss={currentMetrics.bestLoss}
                  bestAccuracy={currentMetrics.bestAccuracy}
                  elapsedTime={elapsedTime}
                  estimatedTimeRemaining={estimatedTimeRemaining}
                />
              </div>
            )}

            {/* Pre-training tabbed panels */}
            {!isTraining && !isCompleted && (
              <Tabs defaultValue="validation" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                  <TabsTrigger value="hyperparams">Hyperparams</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="architecture">Architecture</TabsTrigger>
                </TabsList>

                <TabsContent value="validation" className="space-y-6 mt-4">
                  <CrossValidationPreview
                    datasetSize={sampleCount}
                    numClasses={labels.length || 2}
                    onRecommendationApply={(ratio) => {
                      setTrainingConfig({ ...trainingConfig, validationSplit: 1 - ratio });
                      toast.success(`Applied ${(ratio * 100).toFixed(0)}-${((1 - ratio) * 100).toFixed(0)} split`);
                    }}
                  />
                  <EarlyStoppingConfigPanel
                    totalEpochs={trainingConfig.epochs}
                    config={earlyStoppingConfig}
                    onConfigChange={(config) => {
                      setEarlyStoppingConfig(config);
                      setTrainingConfig({
                        ...trainingConfig,
                        earlyStopping:         config.enabled,
                        earlyStoppingPatience: config.patience,
                      });
                    }}
                  />
                  {project.model_type === 'image_classification' && (
                    <TransferLearningPanel
                      datasetSize={sampleCount}
                      targetClasses={labels.length || 2}
                      onEnableTransferLearning={(enabled, model) => {
                        if (enabled && model) toast.success(`Transfer learning enabled with ${model.name}`);
                      }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="hyperparams" className="space-y-6 mt-4">
                  <HyperparameterOptimizer
                    onApplySettings={(config) => {
                      setTrainingConfig({
                        ...trainingConfig,
                        epochs:       config.epochs,
                        batchSize:    config.batchSize,
                        learningRate: config.learningRate,
                      });
                    }}
                  />
                  <RegularizationTuner />
                  <LearningRateScheduler />
                  <AutomatedHyperparameterTuning />
                </TabsContent>

                <TabsContent value="analysis" className="space-y-6 mt-4">
                  <ModelComparisonPanel
                    featureCount={labels.length || 5}
                    sampleCount={sampleCount}
                    problemType={project.model_type === 'regression' ? 'regression' : 'classification'}
                  />
                  <ModelComparisonDashboard features={labels.length ? labels : ['feature_1', 'feature_2']} />
                  <LearningCurveAnalysis totalSamples={sampleCount} features={labels.length || 5} />
                  <BiasVarianceTradeoff currentLayers={2} currentNeurons={64} />
                </TabsContent>

                <TabsContent value="architecture" className="space-y-6 mt-4">
                  <NeuralArchitectureSearch />
                </TabsContent>
              </Tabs>
            )}

            {/* Training controls — always visible */}
            <Card>
              <CardHeader>
                <CardTitle>Training Controls</CardTitle>
                <CardDescription>
                  {isCompleted
                    ? 'Training completed — explore results below'
                    : isTraining
                    ? 'Training in progress…'
                    : 'Configure options above then start training'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                <div className="flex flex-wrap gap-3">
                  {!isTraining && !isCompleted && (
                    <Button onClick={startTraining} size="lg" className="flex-1 min-w-[200px]" data-tour="start-training">
                      <Play className="h-5 w-5 mr-2" />
                      Start Training the Model
                    </Button>
                  )}

                  {isTraining && currentEpoch === 0 && !isPaused && (
                    <div className="flex-1 min-w-[200px] flex items-center justify-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm font-medium text-primary">Preparing training environment…</span>
                    </div>
                  )}

                  {isTraining && !isPaused && (
                    <>
                      <Button onClick={pauseTraining} variant="outline" size="lg" className="flex-1">
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </Button>
                      <Button onClick={() => stopTraining(false)} variant="destructive" size="lg" className="flex-1">
                        <Square className="h-5 w-5 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}

                  {isPaused && (
                    <>
                      <Button onClick={resumeTraining} size="lg" className="flex-1">
                        <Play className="h-5 w-5 mr-2" />
                        Resume
                      </Button>
                      <Button onClick={() => stopTraining(false)} variant="destructive" size="lg" className="flex-1">
                        <Square className="h-5 w-5 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}

                  {isCompleted && (
                    <>
                      <Button onClick={handleContinueToTesting} size="lg" className="flex-1">
                        Continue to Testing
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                      {trainedModel && (
                        <Button onClick={handleDownloadModel} variant="outline" size="lg">
                          <Download className="h-5 w-5 mr-2" />
                          Download Model
                        </Button>
                      )}
                      {metrics.length > 0 && (
                        <Button onClick={handleExportPDF} variant="outline" size="lg">
                          <FileDown className="h-5 w-5 mr-2" />
                          Export PDF
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Training logs */}
            {logs.length > 0 && (
              <div data-tour="training-logs">
                <TrainingLogs logs={logs} maxHeight="400px" autoScroll={true} />
              </div>
            )}

            {/* Live metrics chart */}
            {metrics.length > 0 && (
              <Card data-tour="training-chart">
                <CardHeader>
                  <CardTitle>Training Metrics</CardTitle>
                  <CardDescription>Real-time accuracy and loss per epoch</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart
                    data={{
                      labels: metrics.map(m => `Epoch ${m.epoch}`),
                      datasets: [
                        {
                          label:           'Accuracy (%)',
                          data:            metrics.map(m => m.accuracy * 100),
                          borderColor:     'hsl(var(--chart-1))',
                          backgroundColor: 'hsla(var(--chart-1), 0.1)',
                          tension: 0.4,
                          fill:    true,
                        },
                        {
                          label:           'Loss',
                          data:            metrics.map(m => m.loss),
                          borderColor:     'hsl(var(--chart-3))',
                          backgroundColor: 'hsla(var(--chart-3), 0.1)',
                          tension: 0.4,
                          fill:    true,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text:    'Value',
                            color:   'hsl(var(--muted-foreground))',
                            font: { size: 12 },
                          },
                        },
                      },
                      plugins: {
                        legend: { display: true, position: 'top' as const },
                      },
                    }}
                    height={300}
                  />
                </CardContent>
              </Card>
            )}

            {/* Post-training tabbed panels */}
            {isCompleted && (
              <>
                {metrics.length > 0 && (
                  <TrainingCompletionSummary
                    finalAccuracy={metrics[metrics.length - 1]?.accuracy || 0}
                    finalLoss={metrics[metrics.length - 1]?.loss || 0}
                    totalEpochs={currentEpoch}
                    trainingTime={trainingStartTime ? Math.floor((Date.now() - trainingStartTime) / 1000) : 0}
                    modelType={project.model_type || 'classification'}
                    onContinue={handleContinueToTesting}
                  />
                )}

                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="interpretability">Explainability</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    <TabsTrigger value="deploy">Deploy</TabsTrigger>
                    <TabsTrigger value="monitor">Monitor</TabsTrigger>
                  </TabsList>

                  {/* Results */}
                  <TabsContent value="results" className="space-y-6 mt-4">
                    {project.model_type !== 'regression' && labels.length > 0 && (
                      <>
                        <ConfusionMatrixVisualization
                          matrixData={confusionMatrixService.generateConfusionMatrix(
                            bestAcc, labels, sampleCount
                          )}
                        />
                        <ErrorAnalysisDashboard
                          errorAnalysis={errorAnalysisService.generateErrorAnalysis(
                            bestAcc,
                            labels,
                            labels.map((_, i) => `Feature_${i + 1}`),
                            sampleCount
                          )}
                        />
                        <ROCCurveVisualization />
                      </>
                    )}
                    <ModelVersionHistory projectId={projectId!} />
                  </TabsContent>

                  {/* Explainability */}
                  <TabsContent value="interpretability" className="space-y-6 mt-4">
                    {labels.length > 0 && (
                      <>
                        <FeatureImportanceRanking
                          features={featureImportanceData}
                          modelAccuracy={currentMetrics.bestAccuracy}
                        />
                        <ShapVisualization features={labels} labels={labels} />
                        <ModelInterpretabilityDashboard
                          features={labels}
                          labels={labels}
                          totalSamples={sampleCount}
                          modelAccuracy={currentMetrics.bestAccuracy}
                          currentLayers={2}
                          currentNeurons={64}
                        />
                      </>
                    )}
                    <ModelExplainabilityAPI />
                  </TabsContent>

                  {/* Advanced */}
                  <TabsContent value="advanced" className="space-y-6 mt-4">
                    <ModelEnsembleSystem />
                    <NeuralArchitectureSearch />
                    <AutomatedHyperparameterTuning />
                    <PerformanceSimulator />
                    <AnomalyDetectionWorkshop />
                    <TimeSeriesAnalysisWorkshop />
                    <ReinforcementLearningPlayground />
                    {labels.length > 0 && (
                      <ModelPlayground
                        features={labels}
                        featureImportance={labels.map((_, index) =>
                          Math.random() * 0.3 + (index === 0 ? 0.2 : 0)
                        )}
                      />
                    )}
                  </TabsContent>

                  {/* Deploy */}
                  <TabsContent value="deploy" className="space-y-6 mt-4">
                    <ModelDeploymentGuide modelName={project.title || 'my_model'} />
                  </TabsContent>

                  {/* Monitor */}
                  <TabsContent value="monitor" className="space-y-6 mt-4">
                    <ModelMonitoringDashboard />
                    <ModelGovernanceDashboard />
                    <ABTestingDashboard />
                  </TabsContent>
                </Tabs>
              </>
            )}

            {/* Collaboration — always visible */}
            {projectId && (
              <CollaborationPanel projectId={projectId} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}