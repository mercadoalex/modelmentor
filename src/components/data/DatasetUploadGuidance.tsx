import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  ArrowLeft, 
  FolderTree, 
  FileSpreadsheet, 
  Image, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb,
  Target
} from 'lucide-react';
import type { ModelType } from '@/types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DatasetUploadGuidanceProps {
  /** The project's model type - determines which guidance to show */
  modelType: ModelType;
  /** Called when user wants to go back to premade templates */
  onUsePremadeTemplate: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Guidance content by model type
// ─────────────────────────────────────────────────────────────────────────────

interface GuidanceContent {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  formatTitle: string;
  formatDescription: string;
  requirements: string[];
  tips: string[];
  examples: string[];
  minSamples: number;
  sampleUnit: string;
}

const GUIDANCE_BY_MODEL_TYPE: Record<ModelType, GuidanceContent> = {
  image_classification: {
    title: 'Image Classification Dataset',
    description: 'Upload images organized by category to train your model to recognize different objects or patterns.',
    icon: Image,
    iconColor: 'text-cyan-500',
    formatTitle: 'Folder Structure',
    formatDescription: 'Organize your images into folders — one folder per category/class.',
    requirements: [
      'Create one folder for each category you want to classify',
      'Place images of that category inside its folder',
      'Use common image formats: JPG, PNG, GIF, or WEBP',
      'Aim for similar image sizes (the system will resize if needed)',
      'Include at least 10 images per category for basic training',
    ],
    tips: [
      'More images = better accuracy (20-50 per class is ideal for learning)',
      'Include variety within each class (different angles, lighting, backgrounds)',
      'Keep class sizes balanced (similar number of images in each folder)',
      'Avoid blurry or very small images',
    ],
    examples: [
      'cats/ → cat1.jpg, cat2.jpg, cat3.jpg...',
      'dogs/ → dog1.jpg, dog2.jpg, dog3.jpg...',
      'birds/ → bird1.jpg, bird2.jpg, bird3.jpg...',
    ],
    minSamples: 10,
    sampleUnit: 'images per class',
  },

  text_classification: {
    title: 'Text Classification Dataset',
    description: 'Upload text samples with labels to train your model to categorize text into different classes.',
    icon: FileText,
    iconColor: 'text-yellow-500',
    formatTitle: 'CSV Format',
    formatDescription: 'Create a CSV file with a text column and a label column.',
    requirements: [
      'First row should be column headers (e.g., "text,label")',
      'One text sample per row',
      'Include a label/category column for each text',
      'Use UTF-8 encoding for special characters',
      'Minimum 20 samples recommended for basic training',
    ],
    tips: [
      'Balance your classes (similar number of samples per label)',
      'Include diverse examples within each class',
      'Clean your text (remove excessive whitespace, fix encoding issues)',
      'Longer texts often work better than very short ones',
    ],
    examples: [
      '"I love this product!",positive',
      '"Terrible experience, never again",negative',
      '"The service was okay",neutral',
    ],
    minSamples: 20,
    sampleUnit: 'text samples',
  },

  regression: {
    title: 'Regression Dataset',
    description: 'Upload numerical data to train your model to predict continuous values.',
    icon: FileSpreadsheet,
    iconColor: 'text-green-500',
    formatTitle: 'CSV Format',
    formatDescription: 'Create a CSV file with feature columns and a target column (the value to predict).',
    requirements: [
      'First row should be column headers',
      'Include multiple feature columns (inputs)',
      'Include one target column (the value to predict)',
      'All values should be numeric',
      'Minimum 50 samples recommended for meaningful predictions',
    ],
    tips: [
      'More features can improve predictions, but avoid irrelevant ones',
      'Check for missing values and handle them appropriately',
      'Normalize features if they have very different scales',
      'Include a good range of target values in your data',
    ],
    examples: [
      'sqft,bedrooms,bathrooms,age,price',
      '1500,3,2,10,250000',
      '2200,4,3,5,380000',
    ],
    minSamples: 50,
    sampleUnit: 'data rows',
  },

  classification: {
    title: 'Classification Dataset',
    description: 'Upload tabular data with features and a categorical target to train your model.',
    icon: FileSpreadsheet,
    iconColor: 'text-purple-500',
    formatTitle: 'CSV Format',
    formatDescription: 'Create a CSV file with feature columns and a label/class column.',
    requirements: [
      'First row should be column headers',
      'Include multiple feature columns (can be numeric or categorical)',
      'Include one label/class column (the category to predict)',
      'Minimum 50 samples recommended for reliable classification',
    ],
    tips: [
      'Balance your classes when possible',
      'Handle missing values before uploading',
      'Categorical features work well for classification',
      'Include relevant features that help distinguish between classes',
    ],
    examples: [
      'age,income,education,purchased',
      '25,50000,bachelors,yes',
      '45,80000,masters,no',
    ],
    minSamples: 50,
    sampleUnit: 'data rows',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DatasetUploadGuidance({ modelType, onUsePremadeTemplate }: DatasetUploadGuidanceProps) {
  const guidance = GUIDANCE_BY_MODEL_TYPE[modelType];
  const Icon = guidance.icon;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Upload Guidelines
        </CardTitle>
        <CardDescription>
          Follow these instructions to prepare your own dataset
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Dataset type header */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shrink-0 border">
            <Icon className={`h-5 w-5 ${guidance.iconColor}`} />
          </div>
          <div>
            <p className="font-medium text-sm">{guidance.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{guidance.description}</p>
          </div>
        </div>

        {/* Format requirements */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            <p className="font-medium text-sm">{guidance.formatTitle}</p>
          </div>
          <p className="text-xs text-muted-foreground">{guidance.formatDescription}</p>
        </div>

        {/* Requirements checklist */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="font-medium text-sm">Requirements</p>
          </div>
          <ul className="space-y-1.5">
            {guidance.requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <p className="font-medium text-sm">Tips for Better Results</p>
          </div>
          <ul className="space-y-1.5">
            {guidance.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-amber-500 mt-0.5">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Example format */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <p className="font-medium text-sm">Example Format</p>
          </div>
          <div className="bg-muted rounded-md p-2 font-mono text-xs space-y-0.5">
            {guidance.examples.map((example, idx) => (
              <p key={idx} className="text-muted-foreground">{example}</p>
            ))}
          </div>
        </div>

        {/* Minimum samples alert */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Minimum required:</strong> {guidance.minSamples} {guidance.sampleUnit}
          </AlertDescription>
        </Alert>

        {/* Go back to templates button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={onUsePremadeTemplate}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Use Premade Template Instead
        </Button>
      </CardContent>
    </Card>
  );
}
