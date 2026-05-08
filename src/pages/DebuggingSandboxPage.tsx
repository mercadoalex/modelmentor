import { AppLayout } from '@/components/layouts/AppLayout';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, RotateCcw, Play, ArrowRight, Info, Save, FolderOpen, Share2, Zap, TrendingUp, Layers, Clock, Plus, Library, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SaveConfigurationDialog } from '@/components/SaveConfigurationDialog';
import { SavedConfigurationsLibrary } from '@/components/SavedConfigurationsLibrary';
import { ShareConfigurationDialog } from '@/components/ShareConfigurationDialog';
import { MarkAsAssignmentDialog } from '@/components/MarkAsAssignmentDialog';
import { MyAssignments } from '@/components/MyAssignments';
import { CustomScenarioBuilder } from '@/components/CustomScenarioBuilder';
import { CustomScenarioLibrary } from '@/components/CustomScenarioLibrary';
import { ShareCustomScenarioDialog } from '@/components/ShareCustomScenarioDialog';
import { ScenarioHistoryPanel } from '@/components/ScenarioHistoryPanel';
import type { SandboxConfiguration, CustomFailureScenario, ScenarioHistoryItem } from '@/types/types';
import { supabase } from '@/db/supabase';

export default function DebuggingSandboxPage() {
  const navigate = useNavigate();
  
  // Original model configuration (well-trained)
  const originalConfig = {
    learningRate: 0.001,
    normalization: true,
    batchSize: 32,
    epochs: 50,
    accuracy: 92.5,
    loss: 0.15
  };

  // Current configuration state
  const [learningRate, setLearningRate] = useState(0.001);
  const [normalization, setNormalization] = useState(true);
  const [batchSize, setBatchSize] = useState('32');
  const [epochs, setEpochs] = useState('50');
  const [isRetraining, setIsRetraining] = useState(false);
  const [hasRetrained, setHasRetrained] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  
  // Simulated broken model results
  const [brokenModelResults, setBrokenModelResults] = useState({
    accuracy: 92.5,
    loss: 0.15,
    failureMode: 'none'
  });

  // Training curve data
  const [trainingData, setTrainingData] = useState<Array<{
    epoch: number;
    trainLoss: number;
    valLoss: number;
    trainAcc: number;
    valAcc: number;
  }>>([]);

  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [configToShare, setConfigToShare] = useState<SandboxConfiguration | null>(null);
  
  // Assignment states
  const [showMarkAsAssignment, setShowMarkAsAssignment] = useState(false);
  const [configToMark, setConfigToMark] = useState<SandboxConfiguration | null>(null);
  const [showMyAssignments, setShowMyAssignments] = useState(false);
  const [unviewedAssignmentsCount, setUnviewedAssignmentsCount] = useState(0);
  
  // Custom scenario states
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [showScenarioLibrary, setShowScenarioLibrary] = useState(false);
  const [showShareScenario, setShowShareScenario] = useState(false);
  const [scenarioToShare, setScenarioToShare] = useState<CustomFailureScenario | null>(null);
  const [customScenarios, setCustomScenarios] = useState<CustomFailureScenario[]>([]);
  
  // Scenario history state
  const [scenarioHistory, setScenarioHistory] = useState<ScenarioHistoryItem[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const modelType = 'image_classification'; // This should come from project context

  // Load custom scenarios and check user role
  useEffect(() => {
    loadCustomScenarios();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsTeacher(profile?.role === 'admin'); // Assuming teachers have admin role
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadCustomScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_failure_scenarios')
        .select('*')
        .eq('model_type', modelType)
        .or(`is_public.eq.true,user_id.eq.${(await supabase.auth.getUser()).data.user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomScenarios(data || []);
    } catch (error) {
      console.error('Error loading custom scenarios:', error);
    }
  };

  const getFailureMode = () => {
    if (learningRate > 0.5) return 'divergence';
    if (learningRate > 0.1) return 'oscillation';
    if (!normalization) return 'poor_convergence';
    if (parseInt(batchSize) < 4) return 'erratic';
    if (parseInt(epochs) < 10) return 'underfitting';
    return 'none';
  };

  const generateTrainingCurve = (mode: string, totalEpochs: number) => {
    const data = [];
    
    for (let epoch = 0; epoch <= totalEpochs; epoch++) {
      const progress = epoch / totalEpochs;
      let trainLoss, valLoss, trainAcc, valAcc;

      if (mode === 'divergence') {
        // Loss explodes exponentially
        trainLoss = 2.0 * Math.exp(progress * 3);
        valLoss = 2.0 * Math.exp(progress * 3.2);
        trainAcc = Math.max(10, 50 - progress * 40);
        valAcc = Math.max(5, 45 - progress * 40);
      } else if (mode === 'oscillation') {
        // Loss oscillates wildly
        trainLoss = 1.0 + Math.sin(progress * 20) * 0.5;
        valLoss = 1.2 + Math.sin(progress * 18) * 0.6;
        trainAcc = 60 + Math.sin(progress * 15) * 15;
        valAcc = 55 + Math.sin(progress * 13) * 12;
      } else if (mode === 'poor_convergence') {
        // Slow, poor convergence
        trainLoss = 0.8 - progress * 0.3;
        valLoss = 0.9 - progress * 0.25;
        trainAcc = 60 + progress * 15;
        valAcc = 55 + progress * 12;
      } else if (mode === 'erratic') {
        // Noisy, erratic training
        trainLoss = 0.6 - progress * 0.3 + (Math.random() - 0.5) * 0.3;
        valLoss = 0.7 - progress * 0.25 + (Math.random() - 0.5) * 0.35;
        trainAcc = 65 + progress * 15 + (Math.random() - 0.5) * 10;
        valAcc = 60 + progress * 12 + (Math.random() - 0.5) * 12;
      } else if (mode === 'underfitting') {
        // Both curves remain flat and poor
        trainLoss = 0.9 - progress * 0.15;
        valLoss = 0.95 - progress * 0.12;
        trainAcc = 55 + progress * 8;
        valAcc = 52 + progress * 6;
      } else {
        // Well-trained model
        trainLoss = 2.0 * Math.exp(-progress * 3);
        valLoss = 2.0 * Math.exp(-progress * 2.5) + 0.05;
        trainAcc = 100 - 50 * Math.exp(-progress * 3);
        valAcc = 100 - 55 * Math.exp(-progress * 2.5);
      }

      data.push({
        epoch,
        trainLoss: Math.max(0, trainLoss),
        valLoss: Math.max(0, valLoss),
        trainAcc: Math.min(100, Math.max(0, trainAcc)),
        valAcc: Math.min(100, Math.max(0, valAcc))
      });
    }

    return data;
  };

  const getFailureExplanation = (mode: string) => {
    const explanations = {
      divergence: {
        title: 'Gradient Explosion (Divergence)',
        description: 'The learning rate is too high, causing the model to overshoot the optimal solution. The loss increases instead of decreasing, and the model fails to converge.',
        why: 'When the learning rate is too large, weight updates are too aggressive, causing the model to "bounce" around the loss landscape instead of descending smoothly.',
        fix: 'Reduce the learning rate to 0.001 or lower. Start with small values and gradually increase if needed.',
        realWorld: 'This commonly occurs when using default learning rates from one problem domain on a different problem without tuning.'
      },
      oscillation: {
        title: 'Unstable Training (Oscillation)',
        description: 'The learning rate is moderately high, causing the loss to oscillate wildly. The model makes progress but in an unstable, inefficient manner.',
        why: 'The learning rate is large enough to cause overshooting but not large enough to completely diverge. The model oscillates around the optimal solution.',
        fix: 'Reduce the learning rate to 0.01 or lower for more stable training.',
        realWorld: 'This is often seen in the early stages of training before learning rate scheduling is applied.'
      },
      poor_convergence: {
        title: 'Poor Convergence (No Normalization)',
        description: 'Without data normalization, features with different scales cause uneven gradient updates. The model converges slowly or gets stuck in local minima.',
        why: 'Unnormalized data has features with vastly different ranges, making it difficult for the optimizer to find the right direction.',
        fix: 'Enable data normalization to scale all features to similar ranges (e.g., 0-1 or mean=0, std=1).',
        realWorld: 'This is a common mistake when working with datasets containing features like age (0-100) and income (0-1000000).'
      },
      erratic: {
        title: 'Erratic Training (Small Batch Size)',
        description: 'Very small batch sizes cause high variance in gradient estimates, leading to noisy, erratic training behavior.',
        why: 'Small batches provide poor estimates of the true gradient, causing the model to take inconsistent steps.',
        fix: 'Increase batch size to 16 or 32 for more stable gradient estimates.',
        realWorld: 'While small batches can help escape local minima, they make training unstable and slow.'
      },
      underfitting: {
        title: 'Underfitting (Insufficient Training)',
        description: 'The model hasn\'t trained long enough to learn the patterns in the data. Both training and validation accuracy are low.',
        why: 'The model needs more iterations to adjust its weights and learn the underlying patterns.',
        fix: 'Increase the number of epochs to 50 or more, monitoring for overfitting.',
        realWorld: 'This is common when using default epoch counts without considering dataset complexity.'
      },
      none: {
        title: 'Well-Configured Model',
        description: 'The current configuration is reasonable and should produce good results.',
        why: 'All hyperparameters are within acceptable ranges for typical machine learning tasks.',
        fix: 'No changes needed. This configuration should work well.',
        realWorld: 'These are standard hyperparameters used in many successful ML projects.'
      }
    };
    return explanations[mode as keyof typeof explanations] || explanations.none;
  };

  const handleRetrain = () => {
    setIsRetraining(true);
    setHasRetrained(false);
    setCurrentEpoch(0);
    setTrainingData([]);
    toast.info('Retraining model with new configuration...');

    const mode = getFailureMode();
    const totalEpochs = parseInt(epochs);
    const fullData = generateTrainingCurve(mode, totalEpochs);

    // Animate epochs progressively
    let currentEpochIndex = 0;
    const intervalDuration = Math.max(50, 2000 / totalEpochs); // Adjust speed based on epoch count

    const interval = setInterval(() => {
      if (currentEpochIndex <= totalEpochs) {
        setCurrentEpoch(currentEpochIndex);
        setTrainingData(fullData.slice(0, currentEpochIndex + 1));
        currentEpochIndex++;
      } else {
        clearInterval(interval);
        
        // Calculate final results
        const finalData = fullData[fullData.length - 1];
        const results = {
          accuracy: finalData.trainAcc,
          loss: finalData.trainLoss,
          failureMode: mode
        };
        
        setBrokenModelResults(results);
        setHasRetrained(true);
        setIsRetraining(false);
        
        if (mode !== 'none') {
          toast.error('Model training failed! Check the explanation below.');
        } else {
          toast.success('Model retrained successfully!');
        }
      }
    }, intervalDuration);
  };

  const handleReset = () => {
    setLearningRate(originalConfig.learningRate);
    setNormalization(originalConfig.normalization);
    setBatchSize(originalConfig.batchSize.toString());
    setEpochs(originalConfig.epochs.toString());
    setHasRetrained(false);
    setCurrentEpoch(0);
    setTrainingData([]);
    setBrokenModelResults({
      accuracy: originalConfig.accuracy,
      loss: originalConfig.loss,
      failureMode: 'none'
    });
    toast.success('Configuration reset to original values');
  };

  const handleLoadConfiguration = (config: SandboxConfiguration) => {
    setLearningRate(config.learning_rate);
    setNormalization(config.normalization);
    setBatchSize(config.batch_size.toString());
    setEpochs(config.epochs.toString());
    setHasRetrained(false);
    setCurrentEpoch(0);
    setTrainingData([]);
    setBrokenModelResults({
      accuracy: originalConfig.accuracy,
      loss: originalConfig.loss,
      failureMode: 'none'
    });
  };

  const handleShareConfiguration = (config: SandboxConfiguration) => {
    setConfigToShare(config);
    setShowShareDialog(true);
  };

  // Failure scenario handlers
  const addToHistory = (
    scenarioName: string,
    scenarioType: 'pre-loaded' | 'custom',
    config: {
      learningRate: number;
      normalization: boolean;
      batchSize: string;
      epochs: string;
    }
  ) => {
    const historyItem: ScenarioHistoryItem = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      scenarioName,
      scenarioType,
      configuration: config,
    };

    setScenarioHistory((prev) => [historyItem, ...prev]);
  };

  const applyFailureScenario = (
    scenarioName: string,
    config: {
      learningRate?: number;
      normalization?: boolean;
      batchSize?: string;
      epochs?: string;
    },
    scenarioType: 'pre-loaded' | 'custom' = 'pre-loaded'
  ) => {
    if (config.learningRate !== undefined) setLearningRate(config.learningRate);
    if (config.normalization !== undefined) setNormalization(config.normalization);
    if (config.batchSize !== undefined) setBatchSize(config.batchSize);
    if (config.epochs !== undefined) setEpochs(config.epochs);
    
    // Add to history with complete configuration
    const fullConfig = {
      learningRate: config.learningRate ?? learningRate,
      normalization: config.normalization ?? normalization,
      batchSize: config.batchSize ?? batchSize,
      epochs: config.epochs ?? epochs,
    };
    addToHistory(scenarioName, scenarioType, fullConfig);
    
    toast.success(`Applied "${scenarioName}" scenario`);
    
    // Automatically trigger retraining after a short delay
    setTimeout(() => {
      handleRetrain();
    }, 500);
  };

  const handleNoNormalization = () => {
    applyFailureScenario('No Normalization', {
      normalization: false,
      learningRate: 0.001,
      batchSize: '32',
      epochs: '50'
    });
  };

  const handleHighLearningRate = () => {
    applyFailureScenario('Learning Rate Too High', {
      learningRate: 0.8,
      normalization: true,
      batchSize: '32',
      epochs: '50'
    });
  };

  const handleTinyBatchSize = () => {
    applyFailureScenario('Tiny Batch Size', {
      batchSize: '1',
      learningRate: 0.001,
      normalization: true,
      epochs: '50'
    });
  };

  const handleInsufficientEpochs = () => {
    applyFailureScenario('Insufficient Epochs', {
      epochs: '5',
      learningRate: 0.001,
      normalization: true,
      batchSize: '32'
    });
  };

  // Custom scenario handlers
  const handleLoadCustomScenario = async (scenario: CustomFailureScenario) => {
    applyFailureScenario(
      scenario.name,
      {
        learningRate: scenario.learning_rate,
        epochs: scenario.epochs.toString(),
        normalization: scenario.normalization,
        batchSize: scenario.batch_size.toString()
      },
      'custom'
    );

    // Increment usage count
    try {
      await supabase
        .from('custom_failure_scenarios')
        .update({ usage_count: scenario.usage_count + 1 })
        .eq('id', scenario.id);
      
      loadCustomScenarios(); // Reload to update usage count
    } catch (error) {
      console.error('Error updating usage count:', error);
    }
  };

  const handleShareCustomScenario = (scenario: CustomFailureScenario) => {
    setScenarioToShare(scenario);
    setShowShareScenario(true);
  };

  const handleScenarioCreated = () => {
    loadCustomScenarios();
    toast.success('Custom scenario created successfully');
  };

  // Scenario history handlers
  const handleReapplyFromHistory = (item: ScenarioHistoryItem) => {
    setLearningRate(item.configuration.learningRate);
    setNormalization(item.configuration.normalization);
    setBatchSize(item.configuration.batchSize);
    setEpochs(item.configuration.epochs);
    
    toast.success(`Re-applied "${item.scenarioName}" from history`);
    
    // Automatically trigger retraining
    setTimeout(() => {
      handleRetrain();
    }, 500);
  };

  const handleClearHistory = () => {
    setScenarioHistory([]);
    toast.success('Scenario history cleared');
  };

  // Assignment handlers
  const handleMarkAsAssignment = (config: SandboxConfiguration) => {
    setConfigToMark(config);
    setShowMarkAsAssignment(true);
  };

  const handleAssignmentMarked = () => {
    toast.success('Configuration marked as assignment successfully');
  };

  const handleLoadAssignment = (config: SandboxConfiguration, instructions: string) => {
    // Show instructions to student
    toast.info(instructions, { duration: 10000 });
    
    // Apply configuration
    applyFailureScenario(config.assignment_title || config.name, {
      learningRate: config.learning_rate,
      epochs: config.epochs.toString(),
      normalization: config.normalization,
      batchSize: config.batch_size.toString()
    });
  };


  const isProblematic = () => {
    return learningRate > 0.1 || !normalization || parseInt(batchSize) < 4 || parseInt(epochs) < 10;
  };

  const currentFailureMode = getFailureMode();
  const explanation = getFailureExplanation(hasRetrained ? brokenModelResults.failureMode : currentFailureMode);

  return (
    <AppLayout>
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Debugging Sandbox</h1>
          <p className="text-muted-foreground">
            Experiment with model configurations to understand how different hyperparameters affect training.
            Try breaking the model to learn from failure modes!
          </p>
        </div>

        {/* Warning Banner */}
        {isProblematic() && (
          <Card className="border-yellow-600 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Problematic Configuration Detected
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Your current settings may cause training failures. Click "Retrain Model" to observe the failure mode.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Hyperparameter Configuration</CardTitle>
              <CardDescription>
                Adjust these settings to experiment with different training configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pre-loaded Failure Scenarios */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Quick Failure Scenarios</Label>
                <p className="text-sm text-muted-foreground">
                  Click a button to instantly apply a common problematic configuration
                </p>
                <TooltipProvider delayDuration={300}>
                  <div className="grid grid-cols-2 gap-3">
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={handleNoNormalization}
                          disabled={isRetraining}
                          className="h-auto py-3 flex flex-col items-start gap-1"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            <span className="font-medium">No Normalization</span>
                          </div>
                          <span className="text-xs text-muted-foreground text-left">
                            Disables data normalization
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
                        <div className="font-semibold text-sm">Configuration Details</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Learning Rate:</span>
                            <span className="font-mono">0.001</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Normalization:</span>
                            <span className="font-mono font-semibold">Disabled</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Batch Size:</span>
                            <span className="font-mono">32</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Epochs:</span>
                            <span className="font-mono">50</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t space-y-1">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Expected Failure:</span>
                            <span className="ml-1">Poor convergence, slow learning</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Training Time:</span>
                            <span className="ml-1 font-mono">~30 seconds</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </UITooltip>

                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={handleHighLearningRate}
                          disabled={isRetraining}
                          className="h-auto py-3 flex flex-col items-start gap-1"
                        >
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">High Learning Rate</span>
                          </div>
                          <span className="text-xs text-muted-foreground text-left">
                            Sets LR to 0.8 (divergence)
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
                        <div className="font-semibold text-sm">Configuration Details</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Learning Rate:</span>
                            <span className="font-mono font-semibold">0.8</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Normalization:</span>
                            <span className="font-mono">Enabled</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Batch Size:</span>
                            <span className="font-mono">32</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Epochs:</span>
                            <span className="font-mono">50</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t space-y-1">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Expected Failure:</span>
                            <span className="ml-1">Gradient explosion, divergence</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Training Time:</span>
                            <span className="ml-1 font-mono">~30 seconds</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </UITooltip>

                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={handleTinyBatchSize}
                          disabled={isRetraining}
                          className="h-auto py-3 flex flex-col items-start gap-1"
                        >
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span className="font-medium">Tiny Batch Size</span>
                          </div>
                          <span className="text-xs text-muted-foreground text-left">
                            Sets batch size to 1 (erratic)
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
                        <div className="font-semibold text-sm">Configuration Details</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Learning Rate:</span>
                            <span className="font-mono">0.001</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Normalization:</span>
                            <span className="font-mono">Enabled</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Batch Size:</span>
                            <span className="font-mono font-semibold">1</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Epochs:</span>
                            <span className="font-mono">50</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t space-y-1">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Expected Failure:</span>
                            <span className="ml-1">Erratic training, noisy curves</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Training Time:</span>
                            <span className="ml-1 font-mono">~45 seconds</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </UITooltip>

                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={handleInsufficientEpochs}
                          disabled={isRetraining}
                          className="h-auto py-3 flex flex-col items-start gap-1"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Insufficient Epochs</span>
                          </div>
                          <span className="text-xs text-muted-foreground text-left">
                            Sets epochs to 5 (underfitting)
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
                        <div className="font-semibold text-sm">Configuration Details</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Learning Rate:</span>
                            <span className="font-mono">0.001</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Normalization:</span>
                            <span className="font-mono">Enabled</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Batch Size:</span>
                            <span className="font-mono">32</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Epochs:</span>
                            <span className="font-mono font-semibold">5</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t space-y-1">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Expected Failure:</span>
                            <span className="ml-1">Underfitting, incomplete learning</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Training Time:</span>
                            <span className="ml-1 font-mono">~5 seconds</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                </TooltipProvider>
              </div>

              {/* Custom Scenarios Section */}
              {(customScenarios.length > 0 || isTeacher) && (
                <div className="space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Custom Scenarios</Label>
                      {customScenarios.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Teacher-created scenarios for targeted learning
                        </p>
                      )}
                    </div>
                    {isTeacher && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowScenarioLibrary(true)}
                        >
                          <Library className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowScenarioBuilder(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create
                        </Button>
                      </div>
                    )}
                  </div>

                  {customScenarios.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {customScenarios.slice(0, 4).map((scenario) => (
                        <UITooltip key={scenario.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => handleLoadCustomScenario(scenario)}
                              disabled={isRetraining}
                              className="h-auto py-3 flex flex-col items-start gap-1 border-dashed"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <TrendingUp className="h-4 w-4 shrink-0" />
                                <span className="font-medium text-left truncate">
                                  {scenario.name}
                                </span>
                              </div>
                              {scenario.description && (
                                <span className="text-xs text-muted-foreground text-left line-clamp-2">
                                  {scenario.description}
                                </span>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs p-3 space-y-2">
                            <div className="font-semibold text-sm">Configuration Details</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Learning Rate:</span>
                                <span className="font-mono">{scenario.learning_rate.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Normalization:</span>
                                <span className="font-mono">
                                  {scenario.normalization ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Batch Size:</span>
                                <span className="font-mono">{scenario.batch_size}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Epochs:</span>
                                <span className="font-mono">{scenario.epochs}</span>
                              </div>
                            </div>
                            {scenario.description && (
                              <div className="pt-2 border-t">
                                <div className="text-xs text-muted-foreground">
                                  {scenario.description}
                                </div>
                              </div>
                            )}
                          </TooltipContent>
                        </UITooltip>
                      ))}
                    </div>
                  )}

                  {customScenarios.length === 0 && isTeacher && (
                    <div className="text-center py-4 border rounded-lg border-dashed">
                      <p className="text-sm text-muted-foreground">
                        No custom scenarios yet. Create your first scenario to get started.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="border-t pt-6">
                <Label className="text-base font-semibold">Manual Adjustments</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Or fine-tune hyperparameters manually
                </p>
              </div>

              {/* Learning Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Learning Rate</Label>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {learningRate.toFixed(4)}
                  </span>
                </div>
                <Slider
                  value={[learningRate]}
                  onValueChange={(value) => setLearningRate(value[0])}
                  min={0.0001}
                  max={1.0}
                  step={0.0001}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Controls how much to adjust weights during training. Too high causes divergence, too low causes slow learning.
                </p>
                {learningRate > 0.1 && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Warning: Learning rate is very high!
                  </p>
                )}
              </div>

              {/* Normalization */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Data Normalization</Label>
                  <Switch
                    checked={normalization}
                    onCheckedChange={setNormalization}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Scales features to similar ranges. Disabling can cause poor convergence.
                </p>
                {!normalization && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Warning: Normalization is disabled!
                  </p>
                )}
              </div>

              {/* Batch Size */}
              <div className="space-y-3">
                <Label>Batch Size</Label>
                <Select value={batchSize} onValueChange={setBatchSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Very Small)</SelectItem>
                    <SelectItem value="2">2 (Very Small)</SelectItem>
                    <SelectItem value="4">4 (Small)</SelectItem>
                    <SelectItem value="8">8 (Small)</SelectItem>
                    <SelectItem value="16">16 (Medium)</SelectItem>
                    <SelectItem value="32">32 (Standard)</SelectItem>
                    <SelectItem value="64">64 (Large)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Number of samples processed before updating weights. Very small batches cause erratic training.
                </p>
                {parseInt(batchSize) < 4 && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Warning: Batch size is very small!
                  </p>
                )}
              </div>

              {/* Epochs */}
              <div className="space-y-3">
                <Label>Training Epochs</Label>
                <Select value={epochs} onValueChange={setEpochs}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 (Very Few)</SelectItem>
                    <SelectItem value="10">10 (Few)</SelectItem>
                    <SelectItem value="20">20 (Moderate)</SelectItem>
                    <SelectItem value="50">50 (Standard)</SelectItem>
                    <SelectItem value="100">100 (Many)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Number of complete passes through the training data. Too few causes underfitting.
                </p>
                {parseInt(epochs) < 10 && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Warning: Very few training epochs!
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleRetrain}
                  disabled={isRetraining}
                  className="flex-1"
                >
                  {isRetraining ? (
                    <>
                      <Play className="mr-2 h-4 w-4 animate-spin" />
                      Retraining...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Retrain Model
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isRetraining}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>

              {/* Configuration Management Buttons */}
              <div className="flex gap-3 pt-3 border-t">
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  variant="outline"
                  className="flex-1"
                  disabled={isRetraining}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </Button>
                <Button
                  onClick={() => setShowLibrary(true)}
                  variant="outline"
                  className="flex-1"
                  disabled={isRetraining}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  My Configurations
                </Button>
                <Button
                  onClick={() => setShowMyAssignments(true)}
                  variant="outline"
                  className="flex-1 relative"
                  disabled={isRetraining}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  My Assignments
                  {unviewedAssignmentsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unviewedAssignmentsCount}
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comparison View */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>
                Compare original model with current configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Original Model */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Original Model (Well-Trained)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {originalConfig.accuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Loss</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {originalConfig.loss.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Model */}
              {hasRetrained && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Current Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${
                      brokenModelResults.failureMode === 'none' 
                        ? 'bg-green-50 dark:bg-green-950' 
                        : 'bg-red-50 dark:bg-red-950'
                    }`}>
                      <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                      <p className={`text-2xl font-bold ${
                        brokenModelResults.failureMode === 'none'
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {brokenModelResults.accuracy.toFixed(1)}%
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      brokenModelResults.failureMode === 'none' 
                        ? 'bg-green-50 dark:bg-green-950' 
                        : 'bg-red-50 dark:bg-red-950'
                    }`}>
                      <p className="text-xs text-muted-foreground mb-1">Loss</p>
                      <p className={`text-2xl font-bold ${
                        brokenModelResults.failureMode === 'none'
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {brokenModelResults.loss.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!hasRetrained && (
                <div className="bg-muted p-8 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Click "Retrain Model" to see how your configuration affects performance
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scenario History Panel */}
          <ScenarioHistoryPanel
            history={scenarioHistory}
            onReapply={handleReapplyFromHistory}
            onClear={handleClearHistory}
          />
        </div>

        {/* Training Curves */}
        {(isRetraining || hasRetrained) && trainingData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Loss Curve */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loss Over Epochs</CardTitle>
                <CardDescription>
                  {isRetraining && `Training... Epoch ${currentEpoch}/${epochs}`}
                  {hasRetrained && 'Training completed'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="epoch" 
                      label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                      stroke="hsl(var(--foreground))"
                    />
                    <YAxis 
                      label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
                      stroke="hsl(var(--foreground))"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="trainLoss" 
                      stroke="#3b82f6" 
                      name="Training Loss"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={300}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valLoss" 
                      stroke="#f97316" 
                      name="Validation Loss"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={300}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Accuracy Curve */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Accuracy Over Epochs</CardTitle>
                <CardDescription>
                  {isRetraining && `Training... Epoch ${currentEpoch}/${epochs}`}
                  {hasRetrained && 'Training completed'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="epoch" 
                      label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                      stroke="hsl(var(--foreground))"
                    />
                    <YAxis 
                      label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                      stroke="hsl(var(--foreground))"
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="trainAcc" 
                      stroke="#3b82f6" 
                      name="Training Accuracy"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={300}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valAcc" 
                      stroke="#f97316" 
                      name="Validation Accuracy"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={300}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Educational Explanation */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <CardTitle>{explanation.title}</CardTitle>
                <CardDescription>{explanation.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Why This Happens</h4>
              <p className="text-sm text-muted-foreground">{explanation.why}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">How to Fix It</h4>
              <p className="text-sm text-muted-foreground">{explanation.fix}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Real-World Context</h4>
              <p className="text-sm text-muted-foreground">{explanation.realWorld}</p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={() => navigate('/training')}
            variant="outline"
          >
            Back to Training
          </Button>
          <Button
            onClick={() => navigate('/testing')}
          >
            Continue to Testing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <SaveConfigurationDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        configuration={{
          learningRate,
          normalization,
          batchSize,
          epochs,
          failureMode: getFailureMode()
        }}
        onSaved={() => {
          // Optionally refresh library or show success message
        }}
      />

      <SavedConfigurationsLibrary
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onLoad={handleLoadConfiguration}
        onShare={handleShareConfiguration}
        onMarkAsAssignment={handleMarkAsAssignment}
      />

      <ShareConfigurationDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        configuration={configToShare}
      />

      {/* Assignment Dialogs */}
      <MarkAsAssignmentDialog
        open={showMarkAsAssignment}
        onOpenChange={setShowMarkAsAssignment}
        configuration={configToMark}
        onMarked={handleAssignmentMarked}
      />

      <MyAssignments
        open={showMyAssignments}
        onOpenChange={setShowMyAssignments}
        onLoadAssignment={handleLoadAssignment}
        modelType={modelType}
      />

      {/* Custom Scenario Dialogs */}
      <CustomScenarioBuilder
        open={showScenarioBuilder}
        onOpenChange={setShowScenarioBuilder}
        onScenarioCreated={handleScenarioCreated}
        modelType={modelType}
      />

      <CustomScenarioLibrary
        open={showScenarioLibrary}
        onOpenChange={setShowScenarioLibrary}
        onLoadScenario={handleLoadCustomScenario}
        onShareScenario={handleShareCustomScenario}
        modelType={modelType}
      />

      <ShareCustomScenarioDialog
        open={showShareScenario}
        onOpenChange={setShowShareScenario}
        scenario={scenarioToShare}
      />
    </div>
    </AppLayout>
  );
}
