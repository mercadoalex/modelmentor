import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RotateCcw } from 'lucide-react';

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
  epochs: 20,
  batchSize: 32,
  learningRate: 0.001,
  optimizer: 'adam',
  validationSplit: 0.2,
  earlyStopping: true,
  earlyStoppingPatience: 3,
  shuffle: true,
};

const BEGINNER_PRESET: TrainingConfig = {
  epochs: 10,
  batchSize: 32,
  learningRate: 0.01,
  optimizer: 'adam',
  validationSplit: 0.2,
  earlyStopping: true,
  earlyStoppingPatience: 3,
  shuffle: true,
};

const ADVANCED_PRESET: TrainingConfig = {
  epochs: 50,
  batchSize: 16,
  learningRate: 0.0001,
  optimizer: 'adam',
  validationSplit: 0.15,
  earlyStopping: true,
  earlyStoppingPatience: 5,
  shuffle: true,
};

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
    
    if (presetName === 'beginner') {
      onChange(BEGINNER_PRESET);
    } else if (presetName === 'advanced') {
      onChange(ADVANCED_PRESET);
    } else if (presetName === 'default') {
      onChange(DEFAULT_CONFIG);
    } else {
      const preset = presets.find(p => p.name === presetName);
      if (preset && onLoad) {
        onLoad(preset.config);
      }
    }
  };

  const handleReset = () => {
    onChange(DEFAULT_CONFIG);
    setSelectedPreset('default');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Training Configuration</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={disabled}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        <CardDescription>
          Configure hyperparameters for model training
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Presets */}
          <div className="space-y-2">
            <Label>Preset</Label>
            <Select
              value={selectedPreset}
              onValueChange={handlePresetChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="beginner">Beginner (Fast)</SelectItem>
                <SelectItem value="advanced">Advanced (Accurate)</SelectItem>
                {presets.map(preset => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="basic" className="space-y-4">
            {/* Epochs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="epochs">Epochs</Label>
                <Badge variant="secondary" className="text-xs">
                  {config.epochs}
                </Badge>
              </div>
              <Input
                id="epochs"
                type="number"
                min="1"
                max="200"
                value={config.epochs}
                onChange={(e) => handleChange('epochs', parseInt(e.target.value) || 1)}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Number of complete passes through the training dataset
              </p>
            </div>

            {/* Batch Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="batchSize">Batch Size</Label>
                <Badge variant="secondary" className="text-xs">
                  {config.batchSize}
                </Badge>
              </div>
              <Select
                value={config.batchSize.toString()}
                onValueChange={(value) => handleChange('batchSize', parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger id="batchSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 (Small)</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="32">32 (Recommended)</SelectItem>
                  <SelectItem value="64">64</SelectItem>
                  <SelectItem value="128">128 (Large)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Number of samples processed before updating the model
              </p>
            </div>

            {/* Learning Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="learningRate">Learning Rate</Label>
                <Badge variant="secondary" className="text-xs">
                  {config.learningRate}
                </Badge>
              </div>
              <Select
                value={config.learningRate.toString()}
                onValueChange={(value) => handleChange('learningRate', parseFloat(value))}
                disabled={disabled}
              >
                <SelectTrigger id="learningRate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1 (Very High)</SelectItem>
                  <SelectItem value="0.01">0.01 (High)</SelectItem>
                  <SelectItem value="0.001">0.001 (Recommended)</SelectItem>
                  <SelectItem value="0.0001">0.0001 (Low)</SelectItem>
                  <SelectItem value="0.00001">0.00001 (Very Low)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Step size for model weight updates
              </p>
            </div>

            {/* Optimizer */}
            <div className="space-y-2">
              <Label htmlFor="optimizer">Optimizer</Label>
              <Select
                value={config.optimizer}
                onValueChange={(value: any) => handleChange('optimizer', value)}
                disabled={disabled}
              >
                <SelectTrigger id="optimizer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adam">Adam (Recommended)</SelectItem>
                  <SelectItem value="sgd">SGD (Stochastic Gradient Descent)</SelectItem>
                  <SelectItem value="rmsprop">RMSprop</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Algorithm used to update model weights
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Validation Split */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="validationSplit">Validation Split</Label>
                <Badge variant="secondary" className="text-xs">
                  {(config.validationSplit * 100).toFixed(0)}%
                </Badge>
              </div>
              <Input
                id="validationSplit"
                type="number"
                min="0"
                max="0.5"
                step="0.05"
                value={config.validationSplit}
                onChange={(e) => handleChange('validationSplit', parseFloat(e.target.value) || 0)}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Fraction of data reserved for validation (0-0.5)
              </p>
            </div>

            {/* Early Stopping */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="earlyStopping">Early Stopping</Label>
                <Badge 
                  variant={config.earlyStopping ? "default" : "secondary"} 
                  className="text-xs"
                >
                  {config.earlyStopping ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <Select
                value={config.earlyStopping.toString()}
                onValueChange={(value) => handleChange('earlyStopping', value === 'true')}
                disabled={disabled}
              >
                <SelectTrigger id="earlyStopping">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Stop training when validation loss stops improving
              </p>
            </div>

            {/* Early Stopping Patience */}
            {config.earlyStopping && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="patience">Patience</Label>
                  <Badge variant="secondary" className="text-xs">
                    {config.earlyStoppingPatience} epochs
                  </Badge>
                </div>
                <Input
                  id="patience"
                  type="number"
                  min="1"
                  max="20"
                  value={config.earlyStoppingPatience}
                  onChange={(e) => handleChange('earlyStoppingPatience', parseInt(e.target.value) || 1)}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Number of epochs to wait before stopping
                </p>
              </div>
            )}

            {/* Shuffle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shuffle">Shuffle Data</Label>
                <Badge 
                  variant={config.shuffle ? "default" : "secondary"} 
                  className="text-xs"
                >
                  {config.shuffle ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <Select
                value={config.shuffle.toString()}
                onValueChange={(value) => handleChange('shuffle', value === 'true')}
                disabled={disabled}
              >
                <SelectTrigger id="shuffle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Randomly shuffle training data each epoch
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {onSave && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const name = prompt('Enter a name for this configuration:');
                if (name) {
                  onSave(name, config);
                }
              }}
              disabled={disabled}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
