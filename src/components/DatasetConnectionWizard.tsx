import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  Key,
  FileText,
  Database,
  ArrowRight,
  Copy,
  Eye,
  Loader2,
  ListPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { datasetDownloadService, type DatasetDownload } from '@/services/datasetDownloadService';
import { downloadQueueService } from '@/services/downloadQueueService';
import { bandwidthService } from '@/services/bandwidthService';
import { DownloadHistoryDialog } from './DownloadHistoryDialog';
import { DownloadQueueDialog } from './DownloadQueueDialog';
import { BandwidthSettingsDialog } from './BandwidthSettingsDialog';
import { useAuth } from '@/contexts/AuthContext';

interface DatasetConnectionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetUrl: string;
  datasetName: string;
  source: string;
}

type Platform = 'kaggle' | 'huggingface' | 'tensorflow' | 'github' | 'other';

export function DatasetConnectionWizard({
  open,
  onOpenChange,
  datasetUrl,
  datasetName,
  source,
}: DatasetConnectionWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [existingDownload, setExistingDownload] = useState<DatasetDownload | null>(null);
  const [currentDownload, setCurrentDownload] = useState<DatasetDownload | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const detectPlatform = (): Platform => {
    if (datasetUrl.includes('kaggle.com')) return 'kaggle';
    if (datasetUrl.includes('huggingface.co')) return 'huggingface';
    if (datasetUrl.includes('tensorflow.org')) return 'tensorflow';
    if (datasetUrl.includes('github.com')) return 'github';
    return 'other';
  };

  const platform = detectPlatform();

  const platformInfo = {
    kaggle: {
      name: 'Kaggle',
      color: 'bg-blue-500',
      requiresAuth: true,
      authUrl: 'https://www.kaggle.com/account',
      instructions: [
        'Go to your Kaggle account settings',
        'Scroll to the API section',
        'Click "Create New API Token"',
        'Download the kaggle.json file',
        'Copy the API key from the file'
      ]
    },
    huggingface: {
      name: 'Hugging Face',
      color: 'bg-yellow-500',
      requiresAuth: false,
      authUrl: 'https://huggingface.co/settings/tokens',
      instructions: [
        'Visit Hugging Face datasets page',
        'Click on the dataset you want',
        'Use the "Use in Python" code snippet',
        'Install datasets library: pip install datasets',
        'Load dataset with: load_dataset("dataset_name")'
      ]
    },
    tensorflow: {
      name: 'TensorFlow',
      color: 'bg-orange-500',
      requiresAuth: false,
      authUrl: '',
      instructions: [
        'Install TensorFlow Datasets: pip install tensorflow-datasets',
        'Import the library: import tensorflow_datasets as tfds',
        'Load dataset: tfds.load("dataset_name")',
        'Access train/test splits as needed',
        'Convert to numpy arrays for processing'
      ]
    },
    github: {
      name: 'GitHub',
      color: 'bg-gray-700',
      requiresAuth: false,
      authUrl: '',
      instructions: [
        'Visit the GitHub repository',
        'Clone the repository or download ZIP',
        'Navigate to the dataset folder',
        'Read the README for data format',
        'Load data using appropriate library (pandas, numpy, etc.)'
      ]
    },
    other: {
      name: 'External Source',
      color: 'bg-purple-500',
      requiresAuth: false,
      authUrl: '',
      instructions: [
        'Visit the dataset URL',
        'Follow the download instructions',
        'Check the data format and structure',
        'Use appropriate library to load data',
        'Prepare data for training'
      ]
    }
  };

  const info = platformInfo[platform];

  const datasetFormats = [
    { name: 'CSV', description: 'Comma-separated values, use pandas.read_csv()', icon: FileText },
    { name: 'JSON', description: 'JavaScript Object Notation, use json.load()', icon: FileText },
    { name: 'Images', description: 'Image files (JPG, PNG), use PIL or OpenCV', icon: FileText },
    { name: 'TFRecord', description: 'TensorFlow format, use tf.data.TFRecordDataset', icon: Database },
    { name: 'Parquet', description: 'Columnar format, use pandas.read_parquet()', icon: Database },
  ];

  const preprocessingTips = [
    'Normalize numerical features to 0-1 range',
    'Handle missing values (drop or impute)',
    'Encode categorical variables (one-hot or label encoding)',
    'Split data into train/validation/test sets (70/15/15)',
    'Resize images to consistent dimensions',
    'Balance classes if dataset is imbalanced',
    'Remove duplicates and outliers',
    'Standardize text (lowercase, remove punctuation)'
  ];

  // Check for existing download on mount
  useEffect(() => {
    if (open && user) {
      checkExistingDownload();
    }
  }, [open, user, datasetUrl]);

  // Subscribe to download progress
  useEffect(() => {
    if (currentDownload && currentDownload.status === 'downloading') {
      const unsubscribe = datasetDownloadService.subscribeToDownload(
        currentDownload.id,
        (updated) => {
          setCurrentDownload(updated);
          setDownloadProgress(updated.progress);
          
          if (updated.status === 'completed') {
            setDownloading(false);
            toast.success('Dataset downloaded successfully!');
            setStep(4);
          } else if (updated.status === 'failed') {
            setDownloading(false);
            toast.error(`Download failed: ${updated.error_message}`);
          }
        }
      );

      return unsubscribe;
    }
  }, [currentDownload]);

  const checkExistingDownload = async () => {
    const existing = await datasetDownloadService.checkExistingDownload(datasetUrl);
    setExistingDownload(existing);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  const handleAddToQueue = async () => {
    if (!user) {
      toast.error('Please log in to use queue');
      return;
    }

    try {
      const queue = await downloadQueueService.getOrCreateDefaultQueue();
      if (!queue) {
        throw new Error('Failed to create queue');
      }

      const item = await downloadQueueService.addToQueue(
        queue.id,
        datasetName,
        datasetUrl,
        platform,
        0 // default priority
      );

      if (!item) {
        throw new Error('Failed to add to queue');
      }

      // Start processing the queue
      await downloadQueueService.processQueue(queue.id);

      toast.success('Added to download queue');
      onOpenChange(false);
    } catch (error) {
      console.error('Queue error:', error);
      toast.error('Failed to add to queue');
    }
  };

  const handleStartDownload = async () => {
    if (!user) {
      toast.error('Please log in to download datasets');
      return;
    }

    // Check bandwidth settings
    const settings = await bandwidthService.getOrCreateSettings();
    if (settings) {
      const { allowed, reason } = await bandwidthService.shouldAllowDownload(settings);
      if (!allowed) {
        toast.error(`Download blocked: ${reason}`);
        return;
      }
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      // Create download record
      const download = await datasetDownloadService.createDownload(
        datasetName,
        datasetUrl,
        platform
      );

      if (!download) {
        throw new Error('Failed to create download record');
      }

      setCurrentDownload(download);

      // Start download
      const success = await datasetDownloadService.startDownload(
        download.id,
        datasetUrl,
        datasetName,
        platform
      );

      if (!success) {
        throw new Error('Failed to start download');
      }
    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
      toast.error('Failed to start download');
    }
  };

  const handleUseExistingDownload = () => {
    if (existingDownload) {
      setCurrentDownload(existingDownload);
      toast.success('Using cached dataset');
      setStep(4);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setApiKey('');
    setDownloading(false);
    setDownloadProgress(0);
    setExistingDownload(null);
    setCurrentDownload(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetWizard();
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dataset Connection Helper
          </DialogTitle>
          <DialogDescription>
            Learn how to connect to {datasetName} from {info.name}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step >= s
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-16 h-0.5 ${
                    step > s ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Platform Information */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${info.color}`} />
                  {info.name} Dataset
                </CardTitle>
                <CardDescription>
                  {source}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span className="text-sm font-medium">Dataset URL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(datasetUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </div>

                {info.requiresAuth && (
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      This platform requires authentication. You'll need an API key to download datasets.
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <h4 className="font-medium mb-2">What you'll learn:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>How to access datasets from {info.name}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Dataset format and structure</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>Data preprocessing best practices</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>How to prepare data for training</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {existingDownload && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You already have this dataset downloaded! It expires {new Date(existingDownload.expires_at!).toLocaleDateString()}.
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={handleUseExistingDownload}
                  >
                    Use cached version
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <DownloadHistoryDialog />
                <DownloadQueueDialog />
                <BandwidthSettingsDialog />
              </div>
              <div className="flex gap-2">
                {user && (
                  <>
                    <Button variant="outline" onClick={handleAddToQueue} disabled={downloading}>
                      <ListPlus className="h-4 w-4 mr-2" />
                      Add to Queue
                    </Button>
                    <Button onClick={handleStartDownload} disabled={downloading}>
                      {downloading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download Now
                        </>
                      )}
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setStep(2)}>
                  Setup Guide
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            {downloading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Download Progress</span>
                  <span className="font-medium">{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Setup Instructions */}
        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
                <CardDescription>
                  Follow these steps to access the dataset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {info.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm">{instruction}</p>
                    </div>
                  ))}
                </div>

                {info.requiresAuth && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="api-key">API Key (Optional for this demo)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="Enter your API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyApiKey}
                        disabled={!apiKey}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {info.authUrl && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => window.open(info.authUrl, '_blank')}
                        className="p-0 h-auto"
                      >
                        Get API Key from {info.name}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Dataset Format
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Dataset Format & Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <Tabs defaultValue="format">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="preprocessing">Preprocessing</TabsTrigger>
              </TabsList>

              <TabsContent value="format" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Common Dataset Formats</CardTitle>
                    <CardDescription>
                      Understanding different data formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {datasetFormats.map((format, index) => {
                        const Icon = format.icon;
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                            <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{format.name}</p>
                              <p className="text-xs text-muted-foreground">{format.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Dataset Preview
                    </CardTitle>
                    <CardDescription>
                      Sample data structure (educational example)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        This is a sample preview. Actual data will vary based on the dataset.
                      </AlertDescription>
                    </Alert>

                    <div className="bg-muted/50 p-4 rounded font-mono text-xs space-y-2">
                      <div className="text-muted-foreground">// Sample data structure</div>
                      <div>{'{'}</div>
                      <div className="pl-4">"feature_1": "value_1",</div>
                      <div className="pl-4">"feature_2": 123.45,</div>
                      <div className="pl-4">"label": "category_A"</div>
                      <div>{'}'}</div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Estimated Size:</span>
                        <Badge variant="outline">~50 MB</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Number of Samples:</span>
                        <Badge variant="outline">~10,000</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Features:</span>
                        <Badge variant="outline">Multiple</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preprocessing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Preprocessing Tips</CardTitle>
                    <CardDescription>
                      Best practices for data preparation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {preprocessingTips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={downloading}>
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Guide
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {downloading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Completion */}
        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Guide Completed!</h3>
                  <p className="text-sm text-muted-foreground">
                    You now know how to access and prepare datasets from {info.name}
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Next Steps:</strong> Visit the dataset URL, follow the instructions, and prepare your data for training. Remember to check the dataset license and terms of use.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-2 pt-4">
                  <Button onClick={() => window.open(datasetUrl, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Dataset Page
                  </Button>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
