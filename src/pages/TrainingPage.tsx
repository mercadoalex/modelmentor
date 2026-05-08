import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, ArrowRight, FileText, Database, GraduationCap, Zap, Bug, Share2, Download, FileDown } from 'lucide-react';
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
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadProject = async () => {
    if (!projectId) return;

    const projectData = await projectService.getById(projectId);
    if (projectData) {
      setProject(projectData);

      const datasetData = await datasetService.getByProjectId(projectId);
      if (datasetData) setDataset(datasetData);

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

    setIsTraining(true);
    setIsPaused(false);
    setIsCompleted(false);
    setTrainingStartTime(Date.now());
    setElapsedTime(0);
    setCurrentEpoch(0);
    setMetrics([]);
    setLogs([]);
    setCurrentMetrics({});
    trainingCancelledRef.current = false;

    let session = trainingSession;

    if (!session) {
      session = await trainingService.create({
        project_id:    projectId,
        dataset_id:    dataset.id,
        epochs:        trainingConfig.epochs,
        current_epoch: 0,
        status:        'training',
        started_at:    new Date().toISOString(),
      });
      setTrainingSession(session);
    }

    try {
      const pipeline = new EnhancedTrainingPipeline({
        onStageChange: (stage) => setCurrentStage(stage),
        onLog:         (log)   => setLogs(prev => [...prev, log]),
        onProgress:    ()      => {},
        onEpochEnd: async (epoch, epochLogs) => {
          if (trainingCancelledRef.current) return;

          setCurrentEpoch(epoch);

          const elapsed         = (Date.now() - (trainingStartTime || Date.now())) / 1000;
          const avgTimePerEpoch = elapsed / epoch;
          setEstimatedTimeRemaining(Math.max(0, avgTimePerEpoch * (trainingConfig.epochs - epoch)));

          const newMetric = {
            epoch,
            loss:         epochLogs.loss    as number,
            accuracy:     epochLogs.acc     as number,
            val_loss:     epochLogs.val_loss as number,
            val_accuracy: epochLogs.val_acc  as number,
          };

          const newMetrics = [...metrics, newMetric];
          setMetrics(newMetrics);

          if (session) {
            await trainingService.update(session.id, {
              current_epoch: epoch,
              accuracy:      epochLogs.acc  as number,
              loss:          epochLogs.loss as number,
              metrics:       newMetrics as unknown as Record<string, unknown>,
            });
          }
        },
        onMetricsUpdate: (metricsUpdate) => {
          setCurrentMetrics(prev => ({
            currentLoss:     metricsUpdate.loss,
            currentAccuracy: metricsUpdate.accuracy,
            bestLoss:
              prev.bestLoss === undefined || metricsUpdate.loss < prev.bestLoss
                ? metricsUpdate.loss
                : prev.bestLoss,
            bestAccuracy:
              prev.bestAccuracy === undefined ||
              (metricsUpdate.accuracy && metricsUpdate.accuracy > prev.bestAccuracy!)
                ? metricsUpdate.accuracy
                : prev.bestAccuracy,
          }));
        },
      });

      pipelineRef.current = pipeline;

      // ── Build training data ───────────────────────────────────────────────
      let trainingData: DataPoint[] = [];

      if (project.model_type === 'text_classification') {
        trainingData = [
          { input: 'This is great',      output: 'positive' },
          { input: 'I love this',        output: 'positive' },
          { input: 'Amazing product',    output: 'positive' },
          { input: 'Excellent service',  output: 'positive' },
          { input: 'Very good quality',  output: 'positive' },
          { input: 'This is terrible',   output: 'negative' },
          { input: 'I hate this',        output: 'negative' },
          { input: 'Awful experience',   output: 'negative' },
          { input: 'Poor quality',       output: 'negative' },
          { input: 'Very disappointing', output: 'negative' },
          { input: 'It is okay',         output: 'neutral'  },
          { input: 'Not bad',            output: 'neutral'  },
          { input: 'Average product',    output: 'neutral'  },
          { input: 'Could be better',    output: 'neutral'  },
          { input: 'Acceptable',         output: 'neutral'  },
        ];
      } else if (project.model_type === 'regression') {
        trainingData = Array.from({ length: 50 }, (_, i) => ({
          input:  [i / 10],
          output: (i / 10) * 2 + Math.random() * 0.5,
        }));
      } else {
        trainingData = Array.from({ length: 50 }, (_, i) => ({
          input:  [i / 10, Math.random()],
          output: i < 25 ? 'class_a' : 'class_b',
        }));
      }

      if (trainingData.length === 0) {
        toast.error('No training data available');
        setIsTraining(false);
        setCurrentStage('idle');
        return;
      }

      // ── Numeric / regression pipeline ─────────────────────────────────────
      if (
        project.model_type === 'regression' ||
        (Array.isArray(trainingData[0].input) && typeof trainingData[0].output === 'number')
      ) {
        const inputFeatures = Array.isArray(trainingData[0].input)
          ? trainingData[0].input.map((_, i) => `feature_${i}`)
          : ['feature_0'];

        const dataForPipeline = trainingData.map((d, i) => {
          const row: Record<string, number> = { id: i };
          if (Array.isArray(d.input)) {
            d.input.forEach((val, idx) => { row[`feature_${idx}`] = val as number; });
          } else {
            row['feature_0'] = typeof d.input === 'number' ? d.input : 0;
          }
          row['label'] = d.output as number;
          return row;
        });

        const { xs, ys, inputShape } = await pipeline.preprocessData(
          dataForPipeline, inputFeatures, 'label'
        );

        const model = await pipeline.buildModel(inputShape, 1, {
          hiddenLayers: [64, 32],
          activation:   'relu',
          optimizer:    trainingConfig.optimizer,
          learningRate: trainingConfig.learningRate,
        });

        await pipeline.trainModel(model, xs, ys, {
          epochs:                trainingConfig.epochs,
          batchSize:             trainingConfig.batchSize,
          validationSplit:       trainingConfig.validationSplit,
          earlyStopping:         trainingConfig.earlyStopping,
          earlyStoppingPatience: trainingConfig.earlyStoppingPatience,
          shuffle:               trainingConfig.shuffle,
        });

        await pipeline.evaluateModel(model, xs, ys);
        pipeline.complete();

        xs.dispose();
        ys.dispose();

        if (!trainingCancelledRef.current) {
          setTrainedModel(model);
          stopTraining(true);
        }

      // ── Text / classification pipeline ────────────────────────────────────
      } else {
        const config = {
          epochs:          trainingConfig.epochs,
          batchSize:       Math.min(trainingConfig.batchSize, Math.floor(trainingData.length / 4)),
          validationSplit: trainingConfig.validationSplit,
          learningRate:    trainingConfig.learningRate,
        };

        const callbacks = {
          onEpochEnd: async (
            epoch: number,
            epochLogs: { loss: number; accuracy: number; val_loss?: number; val_accuracy?: number }
          ) => {
            if (trainingCancelledRef.current) return;

            setCurrentEpoch(epoch + 1);

            const elapsed         = (Date.now() - (trainingStartTime || Date.now())) / 1000;
            const avgTimePerEpoch = elapsed / (epoch + 1);
            setEstimatedTimeRemaining(
              Math.max(0, avgTimePerEpoch * (trainingConfig.epochs - epoch - 1))
            );

            const newMetric = {
              epoch:        epoch + 1,
              loss:         epochLogs.loss,
              accuracy:     epochLogs.accuracy,
              val_loss:     epochLogs.val_loss,
              val_accuracy: epochLogs.val_accuracy,
            };

            const newMetrics = [...metrics, newMetric];
            setMetrics(newMetrics);

            setCurrentMetrics(prev => ({
              currentLoss:     epochLogs.loss,
              currentAccuracy: epochLogs.accuracy,
              bestLoss:
                prev.bestLoss === undefined || epochLogs.loss < prev.bestLoss
                  ? epochLogs.loss
                  : prev.bestLoss,
              bestAccuracy:
                prev.bestAccuracy === undefined || epochLogs.accuracy > prev.bestAccuracy!
                  ? epochLogs.accuracy
                  : prev.bestAccuracy,
            }));

            setLogs(prev => [...prev, {
              timestamp: new Date(),
              level:     'success',
              message:   `Epoch ${epoch + 1}/${trainingConfig.epochs} completed`,
              details:   `Loss: ${epochLogs.loss.toFixed(4)}, Accuracy: ${(epochLogs.accuracy * 100).toFixed(2)}%`,
            }]);

            if (session) {
              await trainingService.update(session.id, {
                current_epoch: epoch + 1,
                accuracy:      epochLogs.accuracy,
                loss:          epochLogs.loss,
                metrics:       newMetrics as unknown as Record<string, unknown>,
              });
            }
          },
          onTrainingEnd: () => {
            if (!trainingCancelledRef.current) stopTraining(true);
          },
        };

        setCurrentStage('training');
        setLogs([{ timestamp: new Date(), level: 'info', message: 'Starting training...' }]);

        let model: tf.LayersModel | null = null;

        const isTextData      = typeof trainingData[0].input  === 'string';
        const isNumericOutput = typeof trainingData[0].output === 'number';

        if (project.model_type === 'text_classification' || (isTextData && !isNumericOutput)) {
          const result = await trainTextClassificationModel(trainingData, config, callbacks);
          model = result.model;
        } else if (isNumericOutput && Array.isArray(trainingData[0].input)) {
          const result = await trainRegressionModel(trainingData, config, callbacks);
          model = result.model;
        } else {
          const result = await trainNumericClassificationModel(trainingData, config, callbacks);
          model = result.model;
        }

        if (model && !trainingCancelledRef.current) {
          setTrainedModel(model);
          setCurrentStage('completed');
          setLogs(prev => [...prev, {
            timestamp: new Date(),
            level:     'success',
            message:   'Training completed successfully!',
          }]);
        }
      }
    } catch (error) {
      console.error('Training error:', error);
      setCurrentStage('error');
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
          {isCompleted && (
            <Badge variant="default" className="text-sm px-3 py-1 bg-green-500 text-white">
              ✓ Training Complete
            </Badge>
          )}
        </div>

        {/* Main two-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: config + stage indicator + quick stats */}
          <div className="lg:col-span-1 space-y-6">

            {!isTraining && !isCompleted && (
              <TrainingConfigPanel
                config={trainingConfig}
                onChange={setTrainingConfig}
                disabled={isTraining}
              />
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
                    <Button onClick={startTraining} size="lg" className="flex-1 min-w-[200px]">
                      <Play className="h-5 w-5 mr-2" />
                      Start Training
                    </Button>
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
              <TrainingLogs logs={logs} maxHeight="400px" autoScroll={true} />
            )}

            {/* Live metrics chart */}
            {metrics.length > 0 && (
              <Card>
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