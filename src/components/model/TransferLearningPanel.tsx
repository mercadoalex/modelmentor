import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transferLearningService } from '@/services/transferLearningService';
import type { PretrainedModel, TrainingComparison } from '@/services/transferLearningService';
import { Layers, TrendingUp, Clock, Database, Info, CheckCircle2, Zap, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TransferLearningPanelProps {
  datasetSize: number;
  targetClasses: number;
  onEnableTransferLearning?: (enabled: boolean, model?: PretrainedModel) => void;
}

export function TransferLearningPanel({ 
  datasetSize, 
  targetClasses,
  onEnableTransferLearning 
}: TransferLearningPanelProps) {
  const [selectedModel, setSelectedModel] = useState<PretrainedModel | null>(null);
  const [comparison, setComparison] = useState<TrainingComparison | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const pretrainedModels = transferLearningService.getPretrainedModels();
  const explanations = transferLearningService.getTransferLearningExplanation(datasetSize);

  const handleModelSelect = (modelId: string) => {
    const model = pretrainedModels.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      setShowComparison(false);
      setComparison(null);
    }
  };

  const handleCompare = () => {
    if (!selectedModel) return;

    const freezeLayers = transferLearningService.getRecommendedFreezeLayers(datasetSize);
    const fineTuneEpochs = datasetSize < 500 ? 15 : 25;

    const result = transferLearningService.simulateTransferLearning(
      {
        pretrainedModel: selectedModel,
        freezeLayers,
        fineTuneEpochs,
        learningRate: 0.0001,
      },
      datasetSize,
      targetClasses
    );

    setComparison(result);
    setShowComparison(true);
  };

  const handleEnableTransferLearning = () => {
    if (onEnableTransferLearning && selectedModel) {
      onEnableTransferLearning(true, selectedModel);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Transfer Learning
          </CardTitle>
          <CardDescription className="text-pretty">
            Start with a pre-trained model and fine-tune it on your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Transfer learning uses models already trained on millions of images. This gives you a head start
              and typically achieves better results with less data and training time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Why Transfer Learning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Why Use Transfer Learning?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {explanations.map((explanation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{explanation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Select Pre-trained Model</CardTitle>
          <CardDescription className="text-pretty">
            Choose a model that matches your task
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedModel?.id || ''} onValueChange={handleModelSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a pre-trained model" />
            </SelectTrigger>
            <SelectContent>
              {pretrainedModels.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedModel && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{selectedModel.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedModel.description}</p>
                </div>
                <Badge>
                  {(selectedModel.accuracy * 100).toFixed(0)}% accuracy
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Architecture</p>
                  <p className="text-sm font-medium">{selectedModel.architecture}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parameters</p>
                  <p className="text-sm font-medium">{selectedModel.parameters}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pre-trained On</p>
                  <p className="text-sm font-medium">{selectedModel.pretrainedOn}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Model Size</p>
                  <p className="text-sm font-medium">{selectedModel.size}</p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Best For:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.bestFor.map((use, index) => (
                    <Badge key={index} variant="secondary">{use}</Badge>
                  ))}
                </div>
              </div>

              <Button onClick={handleCompare} className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                Compare with Training from Scratch
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {showComparison && comparison && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Performance Comparison
              </CardTitle>
              <CardDescription className="text-pretty">
                Transfer learning vs training from scratch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {comparison.recommendation}
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                {/* From Scratch */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3">Training from Scratch</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Accuracy</span>
                      <span className="font-semibold">{(comparison.fromScratch.accuracy * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Loss</span>
                      <span className="font-semibold">{comparison.fromScratch.loss.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Training Time</span>
                      <span className="font-semibold">{comparison.fromScratch.trainingTime.toFixed(0)}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Epochs</span>
                      <span className="font-semibold">{comparison.fromScratch.epochs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Convergence</span>
                      <span className="font-semibold">Epoch {comparison.fromScratch.convergenceEpoch}</span>
                    </div>
                  </div>
                </div>

                {/* Transfer Learning */}
                <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Transfer Learning
                    <Badge className="bg-green-500">Recommended</Badge>
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Accuracy</span>
                      <span className="font-semibold text-green-600">{(comparison.transferLearning.accuracy * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Loss</span>
                      <span className="font-semibold text-green-600">{comparison.transferLearning.loss.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Training Time</span>
                      <span className="font-semibold text-green-600">{comparison.transferLearning.trainingTime.toFixed(0)}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Epochs</span>
                      <span className="font-semibold text-green-600">{comparison.transferLearning.epochs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Convergence</span>
                      <span className="font-semibold text-green-600">Epoch {comparison.transferLearning.convergenceEpoch}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Accuracy Gain</span>
                  </div>
                  <p className="text-2xl font-semibold text-green-600">
                    +{comparison.benefits.accuracyImprovement.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Time Saved</span>
                  </div>
                  <p className="text-2xl font-semibold text-blue-600">
                    {comparison.benefits.timeReduction.toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Data Efficiency</span>
                  </div>
                  <p className="text-2xl font-semibold text-purple-600">
                    {comparison.benefits.dataEfficiency}%
                  </p>
                </div>
              </div>

              {onEnableTransferLearning && (
                <Button onClick={handleEnableTransferLearning} className="w-full" size="lg">
                  <Zap className="h-5 w-5 mr-2" />
                  Use Transfer Learning
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Learning Curves */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Learning Curves Comparison</CardTitle>
              <CardDescription className="text-pretty">
                How accuracy improves over training epochs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={(() => {
                      const curves = transferLearningService.generateLearningCurves(comparison);
                      return curves.epochs.map((epoch, i) => ({
                        epoch,
                        'From Scratch': (curves.fromScratchAccuracy[i] * 100).toFixed(1),
                        'Transfer Learning': (curves.transferLearningAccuracy[i] * 100).toFixed(1),
                      }));
                    })()}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="epoch" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Epoch', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 8 }}
                      iconType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="From Scratch" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Transfer Learning" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Transfer learning converges faster and reaches higher accuracy
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
