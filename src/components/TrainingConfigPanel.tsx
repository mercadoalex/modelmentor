import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings, Save, RotateCcw, HelpCircle } from 'lucide-react';
import { mlExplanations } from '@/components/learning/SimplifiedExplanation';

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: 'adam' | 'sgd' | 'rmsprop';
  validationSplit: number;
  earlyStopping: boolean;
  earlyStoppingPatience: number;
  shuffle: boolean;
}

interface TrainingConfigPanelProps {
  config: TrainingConfig;
  onChange: (config: TrainingConfig) => void;
  onSave?: (name: string, config: TrainingConfig) => void;
  onLoad?: (config: TrainingConfig) => void;
  disabled?: boolean;
  presets?: { name: string; config: TrainingConfig }[];
}

const DEFAULT_CONFIG: TrainingConfig = {
  epochs: 20, batchSize: 32, learningRate: 0.001,
  optimizer: 'adam', validationSplit: 0.2,
  earlyStopping: true, earlyStoppingPatience: 3, shuffle: true,
};

const BEGINNER_PRESET: TrainingConfig = {
  epochs: 10, batchSize: 32, learningRate: 0.01,
  optimizer: 'adam', validationSplit: 0.2,
  earlyStopping: true, earlyStoppingPatience: 3, shuffle: true,
};

const ADVANCED_PRESET: TrainingConfig = {
  epochs: 50, batchSize: 16, learningRate: 0.0001,
  optimizer: 'adam', validationSplit: 0.15,
  earlyStopping: true, earlyStoppingPatience: 5, shuffle: true,
};

// Inline help tooltip component for reuse across all fields
function FieldHelp({ title, body, example }: { title: string; body: string; example?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger type="button">
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs space-y-1">
        <p className="font-semibold text-xs">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
        {example && <p className="text-xs italic text-muted-foreground border-t pt-1">{example}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

// Show a contextual tip based on the current value
function LearningRateTip({ value }: { value: number }) {
  if (value > 0.05) return <p className="text-xs text-red-500">⚠️ Very high — may cause unstable training</p>;
  if (value > 0.01) return <p className="text-xs text-orange-500">⚠️ High — good for quick experiments</p>;
  if (value >= 0.001) return <p className="text-xs text-green-500">✅ Good default for most projects</p>;
  if (value >= 0.0001) return <p className="text-xs text-blue-500">🔵 Low — slower but more precise</p>;
  return <p className="text-xs text-muted-foreground">Very low — may train too slowly</p>;
}

function EpochsTip({ value }: { value: number }) {
  if (value < 5) return <p className="text-xs text-orange-500">⚠️ Very few — model may underfit</p>;
  if (value <= 20) return <p className="text-xs text-green-500">✅ Good for most projects</p>;
  if (value <= 50) return <p className="text-xs text-blue-500">🔵 More thorough — watch for overfitting</p>;
  return <p className="text-xs text-orange-500">⚠️ Many epochs — enable early stopping!</p>;
}

function BatchSizeTip({ value }: { value: number }) {
  if (value <= 16) return <p className="text-xs text-blue-500">🔵 Small batch — stable but slower</p>;
  if (value <= 64) return <p className="text-xs text-green-500">✅ Good balance of speed and stability</p>;
  return <p className="text-xs text-orange-500">⚠️ Large batch — fast but may reduce accuracy</p>;
}

export function TrainingConfigPanel({
  config,
  onChange,
  onSave,
  onLoad,
  disabled = false,
  presets = [],
}: TrainingConfigPanelProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  const handleChange = (key: keyof TrainingConfig, value: any) => {
    onChange({ ...config, [key]: value });
    setSelectedPreset('custom');
  };

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName === 'beginner') onChange(BEGINNER_PRESET);
    else if (presetName === 'advanced') onChange(ADVANCED_PRESET);
    else if (presetName === 'default') onChange(DEFAULT_CONFIG);
    else {
      const preset = presets.find(p => p.name === presetName);
      if (preset && onLoad) onLoad(preset.config);
    }
  };

  const handleReset = () => {
    onChange(DEFAULT_CONFIG);
    setSelectedPreset('default');
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Training Configuration
              </CardTitle>
              <CardDescription>
                Hover the <HelpCircle className="inline h-3 w-3" /> icons to understand each setting
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={disabled}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Preset selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label>Preset</Label>
              <FieldHelp
                title="What are presets?"
                body="Presets are recommended combinations of settings for different experience levels. Start here if you're unsure!"
              />
            </div>
            <Select value={selectedPreset} onValueChange={handlePresetChange} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">🟢 Beginner — quick and simple</SelectItem>
                <SelectItem value="default">🟡 Balanced — good all-rounder</SelectItem>
                <SelectItem value="advanced">🔴 Advanced — more thorough</SelectItem>
                {presets.map(p => (
                  <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
            </TabsList>

            {/* ── Basic Tab ── */}
            <TabsContent value="basic" className="space-y-4 pt-4">

              {/* Epochs */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label htmlFor="epochs">Epochs</Label>
                  <FieldHelp
                    title={mlExplanations.epoch.term}
                    body={mlExplanations.epoch.explanation}
                    example={mlExplanations.epoch.example}
                  />
                </div>
                <Input
                  id="epochs"
                  type="number"
                  min={1} max={200}
                  value={config.epochs}
                  onChange={e => handleChange('epochs', parseInt(e.target.value))}
                  disabled={disabled}
                />
                <EpochsTip value={config.epochs} />
              </div>

              {/* Learning Rate */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label htmlFor="learningRate">Learning Rate</Label>
                  <FieldHelp
                    title={mlExplanations.learningRate.term}
                    body={mlExplanations.learningRate.explanation}
                    example={mlExplanations.learningRate.example}
                  />
                </div>
                <Input
                  id="learningRate"
                  type="number"
                  step={0.0001} min={0.00001} max={1}
                  value={config.learningRate}
                  onChange={e => handleChange('learningRate', parseFloat(e.target.value))}
                  disabled={disabled}
                />
                <LearningRateTip value={config.learningRate} />
              </div>

              {/* Batch Size */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <FieldHelp
                    title={mlExplanations.batchSize.term}
                    body={mlExplanations.batchSize.explanation}
                    example={mlExplanations.batchSize.example}
                  />
                </div>
                <Select
                  value={String(config.batchSize)}
                  onValueChange={v => handleChange('batchSize', parseInt(v))}
                  disabled={disabled}
                >
                  <SelectTrigger id="batchSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 16, 32, 64, 128, 256].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <BatchSizeTip value={config.batchSize} />
              </div>

              {/* Optimizer */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label htmlFor="optimizer">Optimizer</Label>
                  <FieldHelp
                    title="What is an Optimizer? ⚙️"
                    body="The optimizer is the algorithm that updates the model's weights during training. Think of it as the strategy for climbing down a hill to find the lowest point (lowest loss)."
                    example="Adam is the best default choice — it adapts the learning rate automatically. SGD is simpler but needs more tuning."
                  />
                </div>
                <Select
                  value={config.optimizer}
                  onValueChange={v => handleChange('optimizer', v)}
                  disabled={disabled}
                >
                  <SelectTrigger id="optimizer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adam">Adam — ✅ Recommended for beginners</SelectItem>
                    <SelectItem value="sgd">SGD — classic, needs tuning</SelectItem>
                    <SelectItem value="rmsprop">RMSProp — good for RNNs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* ── Advanced Tab ── */}
            <TabsContent value="advanced" className="space-y-4 pt-4">

              {/* Validation Split */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label htmlFor="validationSplit">Validation Split</Label>
                  <FieldHelp
                    title={mlExplanations.validation.term}
                    body={mlExplanations.validation.explanation}
                    example={mlExplanations.validation.example}
                  />
                </div>
                <Select
                  value={String(config.validationSplit)}
                  onValueChange={v => handleChange('validationSplit', parseFloat(v))}
                  disabled={disabled}
                >
                  <SelectTrigger id="validationSplit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.1">10% validation (90% training)</SelectItem>
                    <SelectItem value="0.2">20% validation — ✅ Recommended</SelectItem>
                    <SelectItem value="0.3">30% validation (70% training)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {Math.round((1 - config.validationSplit) * 100)}% of your data trains the model,{' '}
                  {Math.round(config.validationSplit * 100)}% checks if it's actually learning
                </p>
              </div>

              {/* Early Stopping */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label>Early Stopping</Label>
                  <FieldHelp
                    title="What is Early Stopping? ⏹️"
                    body="Early stopping automatically stops training when the model stops improving. This prevents overfitting and saves time!"
                    example="If validation loss doesn't improve for 3 epochs in a row, training stops automatically."
                  />
                  {config.earlyStopping && (
                    <Badge variant="secondary" className="ml-auto text-xs">Enabled</Badge>
                  )}
                </div>
                <Select
                  value={config.earlyStopping ? 'true' : 'false'}
                  onValueChange={v => handleChange('earlyStopping', v === 'true')}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">✅ Enabled — Recommended</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Early Stopping Patience */}
              {config.earlyStopping && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="patience">Patience</Label>
                    <FieldHelp
                      title="What is Patience? ⏳"
                      body="How many epochs to wait for improvement before stopping early. Higher patience = trains longer before giving up."
                      example="Patience of 3 means: if 3 epochs pass with no improvement, stop training."
                    />
                  </div>
                  <Input
                    id="patience"
                    type="number"
                    min={1} max={20}
                    value={config.earlyStoppingPatience}
                    onChange={e => handleChange('earlyStoppingPatience', parseInt(e.target.value))}
                    disabled={disabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Training will stop if no improvement for {config.earlyStoppingPatience} epochs
                  </p>
                </div>
              )}

              {/* Shuffle */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label>Shuffle Data</Label>
                  <FieldHelp
                    title="What is Shuffling? 🔀"
                    body="Shuffling randomizes the order your model sees training examples each epoch. This prevents the model from learning the order of data instead of actual patterns."
                    example="Without shuffling: model sees all cats first, then all dogs — it may learn order, not features!"
                  />
                </div>
                <Select
                  value={config.shuffle ? 'true' : 'false'}
                  onValueChange={v => handleChange('shuffle', v === 'true')}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">✅ Shuffle each epoch — Recommended</SelectItem>
                    <SelectItem value="false">No shuffle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Save config */}
              {onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={disabled}
                  onClick={() => onSave('My Config', config)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}