import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, Sparkles, FileText, Image, TrendingUp, Users, Heart, Home, Star, Eye, Package } from 'lucide-react';
import type { ModelType } from '@/types/types';
import { toast } from 'sonner';
import { generateImageClassification, generateColorPatterns, generateDigits, generateAnimalSilhouettes, type ImageDatasetRow } from '@/services/syntheticDatasetGeneratorService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DatasetTemplate {
  id: string;
  name: string;
  description: string;
  modelType: ModelType;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Number of rows/images that will be generated */
  rows: number;
  /** CSV column names (empty for image datasets) */
  columns: string[];
  /** One-liner about how this is used in industry */
  realWorldUse: string;
  icon: React.ElementType;
  iconColor: string;
  /** Returns synthetic rows (excluding header) for tabular data */
  generateData: () => string[][];
  /** Whether this template uses bundled/synthetic data (no network required) */
  bundledImages?: boolean;
  /** For image templates: generates image dataset */
  generateImageData?: () => ImageDatasetRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic data helpers — no network or DB required
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a random number between min and max, rounded to `decimals` places */
function randomBetween(min: number, max: number, decimals = 0): number {
  const val = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(val.toFixed(decimals)) : Math.round(val);
}

/** Picks a random element from an array */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Template definitions
// Each template generates realistic synthetic data that mirrors the real dataset
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: DatasetTemplate[] = [

  // ── Classification ─────────────────────────────────────────────────────────

  {
    id: 'iris',
    name: 'Iris Flowers 🌸',
    description: 'Classic dataset: classify flowers by petal and sepal measurements. Perfect first ML project.',
    modelType: 'classification',
    tags: ['classic', 'biology', 'multiclass'],
    difficulty: 'beginner',
    rows: 150,
    columns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'],
    realWorldUse: 'Used to introduce ML at universities worldwide. Same technique classifies plant diseases.',
    icon: Star,
    iconColor: 'text-pink-500',
    generateData: () => {
      const rows: string[][] = [];
      // Each class has distinct measurement ranges to create separable clusters
      const classes = [
        { name: 'setosa',     sl: [4.6, 5.4], sw: [3.0, 3.9], pl: [1.0, 1.9], pw: [0.1, 0.6] },
        { name: 'versicolor', sl: [4.9, 7.0], sw: [2.0, 3.4], pl: [3.0, 5.1], pw: [1.0, 1.8] },
        { name: 'virginica',  sl: [6.0, 7.9], sw: [2.6, 3.8], pl: [4.5, 6.9], pw: [1.4, 2.5] },
      ];
      for (let i = 0; i < 150; i++) {
        const c = classes[i % 3];
        rows.push([
          randomBetween(c.sl[0], c.sl[1], 1).toString(),
          randomBetween(c.sw[0], c.sw[1], 1).toString(),
          randomBetween(c.pl[0], c.pl[1], 1).toString(),
          randomBetween(c.pw[0], c.pw[1], 1).toString(),
          c.name,
        ]);
      }
      return rows;
    },
  },

  {
    id: 'titanic',
    name: 'Titanic Survival 🚢',
    description: 'Predict who survived the Titanic based on passenger info. A classic binary classification problem.',
    modelType: 'classification',
    tags: ['history', 'binary', 'famous'],
    difficulty: 'beginner',
    rows: 200,
    columns: ['age', 'fare', 'pclass', 'sex', 'siblings_aboard', 'survived'],
    realWorldUse: 'Same technique predicts loan defaults, disease risk, and customer churn.',
    icon: Users,
    iconColor: 'text-blue-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const pclass = randomChoice([1, 2, 3]);
        const sex = randomChoice(['male', 'female']);
        const age = randomBetween(1, 75);
        // Fare correlates with class (realistic)
        const fare = pclass === 1 ? randomBetween(50, 500) : pclass === 2 ? randomBetween(10, 50) : randomBetween(5, 20);
        const siblings = randomBetween(0, 4);
        // Survival chance based on historical patterns: women and 1st class had higher survival
        const surviveChance = (sex === 'female' ? 0.7 : 0.2) + (pclass === 1 ? 0.2 : 0);
        const survived = Math.random() < surviveChance ? 1 : 0;
        rows.push([age.toString(), fare.toString(), pclass.toString(), sex, siblings.toString(), survived.toString()]);
      }
      return rows;
    },
  },

  {
    id: 'heart-disease',
    name: 'Heart Disease Risk ❤️',
    description: 'Predict heart disease risk from patient health metrics. High-impact real-world application.',
    modelType: 'classification',
    tags: ['healthcare', 'binary', 'important'],
    difficulty: 'intermediate',
    rows: 200,
    columns: ['age', 'cholesterol', 'blood_pressure', 'heart_rate', 'blood_sugar', 'has_heart_disease'],
    realWorldUse: 'Used by hospitals to flag high-risk patients for early intervention.',
    icon: Heart,
    iconColor: 'text-red-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const age = randomBetween(30, 75);
        const cholesterol = randomBetween(150, 400);
        const bp = randomBetween(90, 180);
        const hr = randomBetween(60, 120);
        const bs = randomChoice([0, 1]); // 0 = normal, 1 = elevated blood sugar
        // Risk accumulates from multiple factors (medically inspired heuristic)
        const risk =
          (age > 55 ? 0.3 : 0) +
          (cholesterol > 240 ? 0.3 : 0) +
          (bp > 140 ? 0.2 : 0) +
          (bs === 1 ? 0.2 : 0);
        const disease = Math.random() < risk ? 1 : 0;
        rows.push([age.toString(), cholesterol.toString(), bp.toString(), hr.toString(), bs.toString(), disease.toString()]);
      }
      return rows;
    },
  },

  // ── Regression ─────────────────────────────────────────────────────────────

  {
    id: 'house-prices',
    name: 'House Prices 🏠',
    description: 'Predict house sale prices from size, location, and features. The hello world of regression.',
    modelType: 'regression',
    tags: ['real-estate', 'popular', 'numeric'],
    difficulty: 'beginner',
    rows: 200,
    columns: ['sqft', 'bedrooms', 'bathrooms', 'age_years', 'garage', 'price'],
    realWorldUse: 'Zillow, Redfin and every real estate app uses this exact approach.',
    icon: Home,
    iconColor: 'text-green-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const sqft = randomBetween(600, 4000);
        const beds = randomBetween(1, 6);
        const baths = randomBetween(1, 4);
        const age = randomBetween(0, 60);
        const garage = randomChoice([0, 1, 2]); // number of garage spaces
        // Price formula with realistic weights + noise
        const price = Math.round(
          sqft * 150 +
          beds * 10000 +
          baths * 8000 -
          age * 1000 +
          garage * 15000 +
          randomBetween(-20000, 20000),
        );
        rows.push([sqft.toString(), beds.toString(), baths.toString(), age.toString(), garage.toString(), price.toString()]);
      }
      return rows;
    },
  },

  {
    id: 'salary',
    name: 'Salary Prediction 💼',
    description: 'Predict employee salary from years of experience, education, and role.',
    modelType: 'regression',
    tags: ['HR', 'career', 'numeric'],
    difficulty: 'beginner',
    rows: 200,
    columns: ['years_experience', 'education_level', 'role_level', 'skills_count', 'salary'],
    realWorldUse: 'HR teams use this to ensure fair pay and create transparent salary bands.',
    icon: TrendingUp,
    iconColor: 'text-purple-500',
    generateData: () => {
      const rows: string[][] = [];
      for (let i = 0; i < 200; i++) {
        const exp = randomBetween(0, 25);
        const edu = randomBetween(1, 4);  // 1=HS, 2=BS, 3=MS, 4=PhD
        const role = randomBetween(1, 5); // 1=junior … 5=director
        const skills = randomBetween(2, 15);
        const salary = Math.round(
          30000 +
          exp * 3000 +
          edu * 8000 +
          role * 12000 +
          skills * 500 +
          randomBetween(-5000, 5000),
        );
        rows.push([exp.toString(), edu.toString(), role.toString(), skills.toString(), salary.toString()]);
      }
      return rows;
    },
  },

  // ── Text Classification ────────────────────────────────────────────────────

  {
    id: 'sentiment',
    name: 'Product Reviews 💬',
    description: 'Classify customer reviews as positive or negative. Core NLP task used everywhere.',
    modelType: 'text_classification',
    tags: ['NLP', 'sentiment', 'e-commerce'],
    difficulty: 'beginner',
    rows: 100,
    columns: ['review_text', 'sentiment'],
    realWorldUse: 'Amazon, Yelp, and every review platform uses sentiment analysis to surface quality content.',
    icon: FileText,
    iconColor: 'text-yellow-500',
    generateData: () => {
      const positive = [
        'Absolutely love this product! Works perfectly.',
        'Great quality, fast shipping. Highly recommend!',
        'Exceeded my expectations. Will buy again.',
        'Perfect fit, looks exactly like the picture.',
        'Amazing value for the price. Very happy!',
        'Fantastic product, my family loves it.',
        'Super easy to use and works great.',
        'Best purchase I made this year!',
        'Outstanding quality and quick delivery.',
        'Five stars! Would definitely recommend.',
      ];
      const negative = [
        'Terrible quality, broke after one week.',
        'Does not match the description at all.',
        'Very disappointed. Waste of money.',
        'Arrived damaged and customer service was unhelpful.',
        'Poor quality materials, fell apart quickly.',
        'Completely different from the photo shown.',
        'Stopped working after 3 days. Awful.',
        'Not worth the price at all.',
        'Worst product I have ever bought.',
        'Would give zero stars if I could.',
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        // Alternate positive / negative for balanced classes
        rows.push(i % 2 === 0
          ? [randomChoice(positive), 'positive']
          : [randomChoice(negative), 'negative'],
        );
      }
      return rows;
    },
  },

  {
    id: 'spam',
    name: 'Spam Detection 📧',
    description: 'Classify emails as spam or not spam. One of the earliest practical ML applications.',
    modelType: 'text_classification',
    tags: ['NLP', 'email', 'classic'],
    difficulty: 'intermediate',
    rows: 100,
    columns: ['email_text', 'label'],
    realWorldUse: 'Gmail, Outlook and every email provider uses this to keep your inbox clean.',
    icon: FileText,
    iconColor: 'text-orange-500',
    generateData: () => {
      const spam = [
        'WINNER! You have been selected for a $1000 prize. Click now!',
        'Congratulations! Claim your free iPhone today. Limited offer!',
        'Make $5000 a week from home. No experience needed.',
        'URGENT: Your account will be suspended. Verify immediately.',
        'Buy cheap meds online. No prescription needed. 90% off.',
      ];
      const ham = [
        'Hi, can we reschedule our meeting to Thursday afternoon?',
        'Please find attached the report from last quarter.',
        'Just checking in to see how the project is going.',
        'Reminder: team lunch is tomorrow at noon.',
        'Thanks for your help with the presentation yesterday.',
      ];
      const rows: string[][] = [];
      for (let i = 0; i < 100; i++) {
        // Alternate spam / ham for balanced classes
        rows.push(i % 2 === 0
          ? [randomChoice(spam), 'spam']
          : [randomChoice(ham), 'ham'],
        );
      }
      return rows;
    },
  },

  // ── Image Classification ───────────────────────────────────────────────────

  {
    id: 'shapes-classification',
    name: 'Shapes Classification 🔷',
    description: 'Classify geometric shapes (circles, squares, triangles). Perfect for learning image classification basics.',
    modelType: 'image_classification',
    tags: ['images', 'shapes', 'beginner-friendly'],
    difficulty: 'beginner',
    rows: 36, // 12 circles + 12 squares + 12 triangles
    columns: ['image', 'label'],
    realWorldUse: 'Same technique powers Google Photos, medical imaging, and autonomous vehicles.',
    icon: Image,
    iconColor: 'text-cyan-500',
    bundledImages: true,
    generateData: () => [], // Not used for image datasets
    generateImageData: () => {
      const dataset = generateImageClassification();
      return dataset.images;
    },
  },

  {
    id: 'colors-classification',
    name: 'Color Patterns 🎨',
    description: 'Classify images by dominant color (red, green, blue). Great for understanding how models see color.',
    modelType: 'image_classification',
    tags: ['images', 'colors', 'beginner-friendly'],
    difficulty: 'beginner',
    rows: 36, // 12 per color class
    columns: ['image', 'label'],
    realWorldUse: 'Color detection is used in quality control, fashion apps, and accessibility tools.',
    icon: Image,
    iconColor: 'text-rose-500',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateColorPatterns();
      return dataset.images;
    },
  },

  {
    id: 'digits-classification',
    name: 'Handwritten Digits 🔢',
    description: 'Classify handwritten digits 0-9. The classic MNIST-inspired dataset for beginners.',
    modelType: 'image_classification',
    tags: ['images', 'digits', 'classic'],
    difficulty: 'beginner',
    rows: 40, // 4 per digit
    columns: ['image', 'label'],
    realWorldUse: 'Digit recognition powers check processing, postal sorting, and form digitization.',
    icon: Image,
    iconColor: 'text-indigo-500',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateDigits();
      return dataset.images;
    },
  },

  {
    id: 'animals-classification',
    name: 'Animal Silhouettes 🐱',
    description: 'Classify animal silhouettes (cat, dog, bird). Learn shape-based recognition.',
    modelType: 'image_classification',
    tags: ['images', 'animals', 'shapes'],
    difficulty: 'intermediate',
    rows: 36, // 12 per animal
    columns: ['image', 'label'],
    realWorldUse: 'Animal detection is used in wildlife monitoring, pet apps, and smart cameras.',
    icon: Image,
    iconColor: 'text-amber-500',
    bundledImages: true,
    generateData: () => [],
    generateImageData: () => {
      const dataset = generateAnimalSilhouettes();
      return dataset.images;
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSV helper
// ─────────────────────────────────────────────────────────────────────────────

/** Converts headers + rows into a CSV string with quoted values */
function toCSV(headers: string[], rows: string[][]): string {
  return [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${v}"`).join(',')),
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface DatasetTemplatesPanelProps {
  /** Only templates matching this model type are shown */
  modelType: ModelType;
  /** Called with the generated CSV text, filename, and template metadata */
  onLoadDataset: (csvText: string, filename: string, template: DatasetTemplate) => void;
  /** Called with image dataset for image classification templates */
  onLoadImageDataset?: (images: ImageDatasetRow[], template: DatasetTemplate) => void;
}

export function DatasetTemplatesPanel({ modelType, onLoadDataset, onLoadImageDataset }: DatasetTemplatesPanelProps) {
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  // Controls which template's info panel is expanded
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Filter by model type first, then by search query
  const filtered = TEMPLATES.filter(t =>
    t.modelType === modelType &&
    (search === '' ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.includes(search.toLowerCase()))),
  );

  const difficultyColor: Record<DatasetTemplate['difficulty'], string> = {
    beginner:     'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    advanced:     'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  /** Generate data, convert to CSV, and hand off to the parent page */
  const handleLoad = async (template: DatasetTemplate) => {
    setLoadingId(template.id);
    await new Promise(r => setTimeout(r, 400)); // brief delay for UX feedback

    try {
      // Handle image classification templates with bundled images
      if (template.modelType === 'image_classification' && template.bundledImages && template.generateImageData) {
        const images = template.generateImageData();
        
        if (onLoadImageDataset) {
          onLoadImageDataset(images, template);
          toast.success(`✅ Loaded "${template.name}" — ${images.length} images ready!`);
        } else {
          // Fallback: convert to CSV format for compatibility
          const csvRows = images.map(img => [img.filename, img.label]);
          const csv = toCSV(['filename', 'label'], csvRows);
          onLoadDataset(csv, `${template.id}-sample.csv`, template);
          toast.success(`✅ Loaded "${template.name}" — ${images.length} images ready!`);
        }
        
        setLoadingId(null);
        return;
      }

      // Handle tabular datasets
      const rows = template.generateData();
      const csv = toCSV(template.columns, rows);
      onLoadDataset(csv, `${template.id}-sample.csv`, template);

      toast.success(`✅ Loaded "${template.name}" — ${rows.length} rows ready!`);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template data. Please try again.');
    }
    
    setLoadingId(null);
  };

  /** Check if template can be loaded (has data or bundled images) */
  const canLoadTemplate = (template: DatasetTemplate): boolean => {
    if (template.bundledImages) return true;
    return template.rows > 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Dataset Templates
        </CardTitle>
        <CardDescription>
          One-click sample datasets — no upload needed. Used by real companies.
        </CardDescription>

        {/* Search — only rendered when there are templates to filter */}
        {filtered.length > 0 && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">

        {/* Empty state */}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No templates found for this project type.
          </p>
        )}

        {filtered.map(template => {
          const Icon = template.icon;
          const isLoading = loadingId === template.id;
          const isPreview = previewId === template.id;
          const canLoad = canLoadTemplate(template);

          return (
            <div
              key={template.id}
              className="rounded-lg border p-4 space-y-3 hover:border-primary transition-colors"
            >
              {/* ── Header: icon + name + difficulty badge + description ── */}
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className={`h-5 w-5 ${template.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{template.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[template.difficulty]}`}>
                      {template.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                </div>
                {/* Row/image count badge with bundled indicator */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {template.bundledImages ? (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {template.rows} images
                      </Badge>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                        <Package className="h-3 w-3 mr-1" />
                        Bundled
                      </Badge>
                    </>
                  ) : template.rows > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {template.rows} rows
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700">
                      Upload Required
                    </Badge>
                  )}
                </div>
              </div>

              {/* ── Tags ── */}
              <div className="flex flex-wrap gap-1">
                {template.tags.map(tag => (
                  <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              {/* ── Expandable info panel: real-world use + column names ── */}
              {isPreview && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">🌍 Real-World Use</p>
                  <p className="text-xs text-muted-foreground">{template.realWorldUse}</p>
                  {template.columns.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mt-2">📋 Columns</p>
                      <div className="flex flex-wrap gap-1">
                        {template.columns.map(col => (
                          <code key={col} className="text-xs bg-background border px-1.5 py-0.5 rounded">
                            {col}
                          </code>
                        ))}
                      </div>
                    </>
                  )}
                  {template.bundledImages && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                      ✓ Works offline — images are bundled with the app
                    </p>
                  )}
                </div>
              )}

              {/* ── Actions: load dataset + toggle info panel ── */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleLoad(template)}
                  disabled={isLoading || !canLoad}
                >
                  {isLoading
                    ? <><span className="animate-spin mr-2">⏳</span>Loading...</>
                    : <><Download className="h-4 w-4 mr-2" />Use This Dataset</>
                  }
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewId(isPreview ? null : template.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {isPreview ? 'Hide' : 'Info'}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
