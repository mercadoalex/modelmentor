/**
 * Learning Moment Content Module
 * 
 * Provides contextual educational content for the three Learning Moments:
 * - Learn: Data (after data upload)
 * - Learn: Model (after training)
 * - Learn: Next Steps (after deployment)
 * 
 * Content adapts based on model type and includes dynamic placeholders
 * for contextual data like dataset statistics and training metrics.
 */

import type { ModelType } from '@/types/types';
import type { MatchingContent, FillBlanksContent, FlashCardContent, SortingContent } from '@/components/learning/types';

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export type LearningMomentType = 'data' | 'model' | 'next_steps';

export interface SimplifiedExplanationData {
  term: string;
  explanation: string;
  example?: string;
  variant?: 'default' | 'tip' | 'fun';
}

export interface ContentSection {
  id: string;
  title: string;
  content: string;
  /** Whether content contains dynamic placeholders like {{sampleCount}} */
  dynamicContent?: boolean;
  /** Term explanations to show inline */
  explanations?: SimplifiedExplanationData[];
  /** Optional visualization component key */
  visualization?: string;
}

export interface LearningMomentQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  hint?: string;
}

export interface LearningMomentQuiz {
  questions: LearningMomentQuizQuestion[];
  passingScore: number;
}

/** Aggregated interactive content for a learning moment */
export interface InteractiveContent {
  matching?: MatchingContent;
  fillBlanks?: FillBlanksContent;
  flashCards?: FlashCardContent;
  sorting?: SortingContent;
}

export interface LearningMomentContent {
  title: string;
  description: string;
  icon: string;
  sections: ContentSection[];
  quiz: LearningMomentQuiz;
  interactive?: InteractiveContent;
}

export type LearningMomentContentMap = {
  [K in ModelType]: {
    data: LearningMomentContent;
    model: LearningMomentContent;
    next_steps: LearningMomentContent;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Context Data Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface DatasetStats {
  sampleCount: number;
  labelCount: number;
  labelDistribution: { [label: string]: number };
  hasClassImbalance: boolean;
  imbalancedClasses: string[];
  detectedIssues: string[];
}

export interface TrainingMetrics {
  accuracy: number;
  loss: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  epochs: number;
  trainingAccuracy: number;
  validationAccuracy: number;
  isOverfitting: boolean;
  isUnderfitting: boolean;
}

export interface ModelPerformance {
  finalAccuracy: number;
  performanceCategory: 'high' | 'medium' | 'low';
  modelType: ModelType;
  trainingDuration: number;
}

export interface LearningMomentContextData {
  datasetStats?: DatasetStats;
  trainingMetrics?: TrainingMetrics;
  modelPerformance?: ModelPerformance;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conditional Content
// ─────────────────────────────────────────────────────────────────────────────

export interface ConditionalContent {
  classImbalance?: ContentSection;
  overfitting?: ContentSection;
  underfitting?: ContentSection;
}

export const conditionalContentSections: ConditionalContent = {
  classImbalance: {
    id: 'class-imbalance-warning',
    title: '⚠️ Class Imbalance Detected',
    content: `Your dataset has **class imbalance** - some categories have significantly fewer examples than others. 
    
This can cause your model to:
- Favor the majority class in predictions
- Perform poorly on minority classes
- Show misleadingly high accuracy

**Tips to address this:**
1. Collect more examples for underrepresented classes
2. Use data augmentation techniques
3. Consider using weighted loss functions during training`,
    explanations: [
      {
        term: 'Class Imbalance',
        explanation: 'When some categories in your dataset have many more examples than others. Like having 100 cat photos but only 10 dog photos.',
        example: 'If 90% of your data is cats and 10% is dogs, the model might just predict "cat" for everything and still get 90% accuracy!',
        variant: 'tip'
      }
    ]
  },
  overfitting: {
    id: 'overfitting-warning',
    title: '⚠️ Possible Overfitting Detected',
    content: `Your model shows signs of **overfitting** - it's performing much better on training data than on validation data.

This means your model might be memorizing the training examples instead of learning general patterns.

**Signs of overfitting:**
- Training accuracy: {{trainingAccuracy}}%
- Validation accuracy: {{validationAccuracy}}%
- Gap: {{accuracyGap}}%

**Tips to reduce overfitting:**
1. Add more training data
2. Use data augmentation
3. Reduce model complexity
4. Add regularization (dropout)
5. Stop training earlier`,
    dynamicContent: true,
    explanations: [
      {
        term: 'Overfitting',
        explanation: 'When your model memorizes the training data instead of learning patterns. It\'s like memorizing test answers without understanding the subject!',
        example: 'A student who memorizes "Q1=A, Q2=B" will fail if the questions change, even slightly.',
        variant: 'tip'
      }
    ]
  },
  underfitting: {
    id: 'underfitting-warning',
    title: '⚠️ Possible Underfitting Detected',
    content: `Your model shows signs of **underfitting** - the loss isn't decreasing during training, which means the model isn't learning effectively.

**Possible causes:**
- Model is too simple for the data
- Learning rate is too high or too low
- Not enough training epochs
- Data quality issues

**Tips to improve:**
1. Train for more epochs
2. Adjust the learning rate
3. Check your data for quality issues
4. Consider a more complex model architecture`,
    explanations: [
      {
        term: 'Underfitting',
        explanation: 'When your model is too simple to capture the patterns in your data. It\'s like trying to draw a curve with only a straight line!',
        example: 'If you try to predict house prices using only the number of rooms, you\'ll miss important factors like location and size.',
        variant: 'tip'
      }
    ]
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Learn: Data Content
// ─────────────────────────────────────────────────────────────────────────────

const learnDataContent: Record<ModelType, LearningMomentContent> = {
  image_classification: {
    title: 'Understanding Your Image Data 🖼️',
    description: 'Learn why good data is the foundation of a successful image classification model',
    icon: '📊',
    sections: [
      {
        id: 'data-overview',
        title: 'Your Dataset at a Glance',
        content: `Great job uploading your dataset! Here's what we found:

📦 **{{sampleCount}} images** across **{{labelCount}} categories**

Your images will be used to teach the AI to recognize patterns and make predictions.`,
        dynamicContent: true
      },
      {
        id: 'image-quality',
        title: 'Image Quality Matters',
        content: `For the best results, your training images should have:

✅ **Good Resolution** - Clear, not blurry images work best
✅ **Consistent Lighting** - Similar brightness across images
✅ **Diverse Examples** - Different angles, backgrounds, and variations
✅ **Correct Labels** - Each image in the right category

Think of it like teaching a friend to recognize dogs - you'd show them many different dogs, not just one photo repeated!`,
        explanations: [
          {
            term: 'Training Data',
            explanation: 'The collection of labeled examples your AI learns from. Better training data = smarter AI!',
            example: 'To teach an AI to recognize cats, you need many labeled cat photos showing different cats in different situations.',
            variant: 'default'
          }
        ]
      },
      {
        id: 'feature-selection',
        title: 'What the AI Sees',
        content: `When your AI looks at images, it learns to detect **features** - patterns like:

🔷 **Edges and Shapes** - Outlines of objects
🎨 **Colors and Textures** - Surface patterns
📐 **Spatial Relationships** - How parts connect

The more diverse your training images, the better features your AI will learn!`,
        explanations: [
          {
            term: 'Features',
            explanation: 'Distinctive patterns in images that help the AI tell things apart. Like how you recognize a cat by its ears, whiskers, and fur pattern.',
            variant: 'fun'
          }
        ]
      }
    ],
    quiz: {
      questions: [
        {
          id: 'data-q1',
          question: 'Why is it important to have diverse training images?',
          options: [
            'To make the dataset larger',
            'To help the model learn patterns that work in different situations',
            'To slow down training',
            'To use more storage space'
          ],
          correctAnswer: 1,
          explanation: 'Diverse images help your model learn robust features that work across different lighting, angles, and backgrounds - not just memorize specific examples!',
          hint: 'Think about what happens if you only show the AI cats in one pose...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'img-data-m1', concept: 'Training Data', definition: 'Labeled examples the model learns from' },
          { id: 'img-data-m2', concept: 'Features', definition: 'Patterns like edges, shapes, and textures detected in images' },
          { id: 'img-data-m3', concept: 'Labels', definition: 'Category names assigned to each image' },
          { id: 'img-data-m4', concept: 'Data Augmentation', definition: 'Creating new training examples by modifying existing images' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'img-data-fb1',
            template: 'Good training images should have consistent {{b1}} and diverse {{b2}}.',
            blanks: { b1: 'lighting', b2: 'angles' }
          },
          {
            id: 'img-data-fb2',
            template: 'The AI learns to detect {{b3}} such as edges, shapes, and textures from training images.',
            blanks: { b3: 'features' }
          },
          {
            id: 'img-data-fb3',
            template: 'Each image must be placed in the correct {{b4}} to ensure the model learns accurately.',
            blanks: { b4: 'category' }
          }
        ],
        distractors: ['pixels', 'layers', 'neurons']
      },
      flashCards: {
        statements: [
          { id: 'img-data-fc1', statement: 'Blurry images are just as useful as clear images for training.', isTrue: false, explanation: 'Clear, high-resolution images help the model detect features more reliably than blurry ones.' },
          { id: 'img-data-fc2', statement: 'Having images from different angles helps the model generalize better.', isTrue: true, explanation: 'Diverse angles prevent the model from only recognizing objects in one specific orientation.' },
          { id: 'img-data-fc3', statement: 'You only need one example per category to train a good model.', isTrue: false, explanation: 'Models need many diverse examples per category to learn robust patterns and avoid overfitting.' },
          { id: 'img-data-fc4', statement: 'Mislabeled images can confuse the model during training.', isTrue: true, explanation: 'Incorrect labels teach the model wrong associations, reducing accuracy on correctly labeled test data.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'good-data', label: 'Good Data Practices' },
          { id: 'bad-data', label: 'Poor Data Practices' }
        ],
        items: [
          { id: 'img-data-s1', concept: 'Diverse backgrounds in images', correctCategoryId: 'good-data' },
          { id: 'img-data-s2', concept: 'All images taken from same angle', correctCategoryId: 'bad-data' },
          { id: 'img-data-s3', concept: 'Balanced number of examples per class', correctCategoryId: 'good-data' },
          { id: 'img-data-s4', concept: 'Using blurry or low-quality images', correctCategoryId: 'bad-data' },
          { id: 'img-data-s5', concept: 'Verifying labels are correct', correctCategoryId: 'good-data' },
          { id: 'img-data-s6', concept: 'Having 90% of data in one category', correctCategoryId: 'bad-data' }
        ]
      }
    }
  },

  text_classification: {
    title: 'Understanding Your Text Data 📝',
    description: 'Learn why quality text data leads to better classification results',
    icon: '📊',
    sections: [
      {
        id: 'data-overview',
        title: 'Your Dataset at a Glance',
        content: `Excellent! Your text dataset is ready. Here's the summary:

📦 **{{sampleCount}} text samples** across **{{labelCount}} categories**

Each text sample will help your AI learn the language patterns for each category.`,
        dynamicContent: true
      },
      {
        id: 'text-quality',
        title: 'Text Quality Factors',
        content: `For effective text classification, consider:

✅ **Sufficient Length** - Texts should have enough words to show patterns
✅ **Rich Vocabulary** - Varied word usage helps the model learn
✅ **Balanced Categories** - Similar amounts of text per category
✅ **Clean Text** - Remove irrelevant content or formatting issues

The AI learns from word patterns - the more representative your examples, the better it learns!`,
        explanations: [
          {
            term: 'Text Embeddings',
            explanation: 'A way to convert words into numbers that capture their meaning. Similar words get similar numbers!',
            example: '"happy" and "joyful" would have similar number representations because they mean similar things.',
            variant: 'default'
          }
        ]
      },
      {
        id: 'balance-importance',
        title: 'Why Balance Matters',
        content: `Having roughly equal examples per category is crucial:

⚖️ **Balanced data** → Model learns all categories equally
⚠️ **Imbalanced data** → Model favors categories with more examples

If you have 100 positive reviews but only 10 negative ones, the model might just predict "positive" for everything!`,
        explanations: [
          {
            term: 'Class Balance',
            explanation: 'Having similar numbers of examples for each category you want to classify.',
            example: 'For spam detection: 500 spam emails and 500 normal emails = balanced. 900 spam and 100 normal = imbalanced.',
            variant: 'tip'
          }
        ]
      }
    ],
    quiz: {
      questions: [
        {
          id: 'text-q1',
          question: 'What happens if your text dataset is heavily imbalanced?',
          options: [
            'The model trains faster',
            'The model may ignore minority categories',
            'The model becomes more accurate',
            'Nothing, balance doesn\'t matter'
          ],
          correctAnswer: 1,
          explanation: 'With imbalanced data, the model learns to favor the majority category because it sees those examples more often during training.',
          hint: 'Think about what the model sees most during training...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'txt-data-m1', concept: 'Tokenization', definition: 'Breaking text into smaller pieces for processing' },
          { id: 'txt-data-m2', concept: 'Class Balance', definition: 'Having similar numbers of examples per category' },
          { id: 'txt-data-m3', concept: 'Text Embeddings', definition: 'Numerical representations that capture word meaning' },
          { id: 'txt-data-m4', concept: 'Vocabulary', definition: 'The set of unique words in the dataset' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'txt-data-fb1',
            template: 'A {{b1}} dataset has similar numbers of examples for each category.',
            blanks: { b1: 'balanced' }
          },
          {
            id: 'txt-data-fb2',
            template: 'Text must be converted to {{b2}} before a model can process it.',
            blanks: { b2: 'numbers' }
          },
          {
            id: 'txt-data-fb3',
            template: 'If 90% of reviews are positive, the model might always predict {{b3}}.',
            blanks: { b3: 'positive' }
          }
        ],
        distractors: ['negative', 'images', 'layers']
      },
      flashCards: {
        statements: [
          { id: 'txt-data-fc1', statement: 'Imbalanced text data can cause the model to ignore minority categories.', isTrue: true, explanation: 'The model sees majority examples more often and learns to favor them in predictions.' },
          { id: 'txt-data-fc2', statement: 'Short texts with only one or two words are ideal for classification.', isTrue: false, explanation: 'Very short texts may not contain enough information for the model to identify meaningful patterns.' },
          { id: 'txt-data-fc3', statement: 'Removing irrelevant formatting from text can improve model performance.', isTrue: true, explanation: 'Clean text helps the model focus on meaningful content rather than noise from formatting artifacts.' },
          { id: 'txt-data-fc4', statement: 'The order of words in a sentence never matters for classification.', isTrue: false, explanation: 'Word order often carries meaning. "Dog bites man" and "Man bites dog" have very different meanings.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'helps-quality', label: 'Improves Data Quality' },
          { id: 'hurts-quality', label: 'Reduces Data Quality' }
        ],
        items: [
          { id: 'txt-data-s1', concept: 'Removing HTML tags and formatting', correctCategoryId: 'helps-quality' },
          { id: 'txt-data-s2', concept: 'Mixing languages without labels', correctCategoryId: 'hurts-quality' },
          { id: 'txt-data-s3', concept: 'Verifying category assignments', correctCategoryId: 'helps-quality' },
          { id: 'txt-data-s4', concept: 'Having 95% of data in one class', correctCategoryId: 'hurts-quality' },
          { id: 'txt-data-s5', concept: 'Including diverse writing styles', correctCategoryId: 'helps-quality' },
          { id: 'txt-data-s6', concept: 'Duplicating the same text many times', correctCategoryId: 'hurts-quality' }
        ]
      }
    }
  },

  regression: {
    title: 'Understanding Your Numerical Data 📊',
    description: 'Learn how data quality affects prediction accuracy in regression',
    icon: '📊',
    sections: [
      {
        id: 'data-overview',
        title: 'Your Dataset at a Glance',
        content: `Your regression dataset is loaded! Here's what we found:

📦 **{{sampleCount}} data points** with **{{labelCount}} features**

Each data point helps your AI learn the relationship between inputs and the target value.`,
        dynamicContent: true
      },
      {
        id: 'numerical-quality',
        title: 'Numerical Data Quality',
        content: `For accurate predictions, watch out for:

🔍 **Outliers** - Extreme values that don't fit the pattern
❓ **Missing Values** - Gaps in your data that need handling
📏 **Feature Scaling** - Different scales can confuse the model
🔗 **Feature Relationships** - How inputs relate to the target

Clean, well-prepared data leads to more accurate predictions!`,
        explanations: [
          {
            term: 'Outliers',
            explanation: 'Data points that are very different from the rest. They can throw off your model\'s predictions.',
            example: 'If most houses cost $200K-$500K but one costs $50 million, that\'s an outlier that might skew predictions.',
            variant: 'tip'
          }
        ]
      },
      {
        id: 'feature-scaling',
        title: 'Why Scaling Matters',
        content: `When features have very different ranges, scaling helps:

📏 **Before scaling:**
- Age: 0-100
- Income: 0-1,000,000
- The model might think income is more important just because the numbers are bigger!

📏 **After scaling:**
- Both features: 0-1
- Now the model can fairly compare their importance

Most ML frameworks handle this automatically, but it's good to understand why!`,
        explanations: [
          {
            term: 'Feature Scaling',
            explanation: 'Adjusting features to similar ranges so the model treats them fairly.',
            example: 'Converting both age (0-100) and income ($0-$1M) to a 0-1 scale.',
            variant: 'default'
          }
        ]
      }
    ],
    quiz: {
      questions: [
        {
          id: 'reg-q1',
          question: 'Why should you handle outliers in regression data?',
          options: [
            'Outliers make the dataset more interesting',
            'Outliers can significantly skew predictions',
            'Outliers speed up training',
            'Outliers improve accuracy'
          ],
          correctAnswer: 1,
          explanation: 'Outliers can pull the regression line toward them, causing poor predictions for normal data points. It\'s like one extreme value throwing off an average!',
          hint: 'Think about how one extreme value affects an average...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'reg-data-m1', concept: 'Outliers', definition: 'Extreme values that do not fit the general pattern' },
          { id: 'reg-data-m2', concept: 'Feature Scaling', definition: 'Adjusting features to similar ranges for fair comparison' },
          { id: 'reg-data-m3', concept: 'Missing Values', definition: 'Gaps in the dataset that need handling before training' },
          { id: 'reg-data-m4', concept: 'Correlation', definition: 'A measure of how two variables change together' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'reg-data-fb1',
            template: '{{b1}} are extreme data points that can skew model predictions.',
            blanks: { b1: 'Outliers' }
          },
          {
            id: 'reg-data-fb2',
            template: 'Feature {{b2}} converts all features to a similar range like 0 to 1.',
            blanks: { b2: 'scaling' }
          },
          {
            id: 'reg-data-fb3',
            template: 'A strong {{b3}} between input and target means the feature is useful for prediction.',
            blanks: { b3: 'correlation' }
          }
        ],
        distractors: ['accuracy', 'classification', 'labels']
      },
      flashCards: {
        statements: [
          { id: 'reg-data-fc1', statement: 'Feature scaling is unnecessary when all features already have the same units.', isTrue: false, explanation: 'Even with the same units, features can have vastly different ranges (e.g., age 0-100 vs. income 0-1,000,000) which affects model training.' },
          { id: 'reg-data-fc2', statement: 'A single outlier can significantly change the slope of a regression line.', isTrue: true, explanation: 'Regression minimizes squared errors, so extreme values have outsized influence on the fitted line.' },
          { id: 'reg-data-fc3', statement: 'Missing values should always be deleted from the dataset.', isTrue: false, explanation: 'Deleting rows with missing values can lose important information. Imputation (filling in estimates) is often a better approach.' },
          { id: 'reg-data-fc4', statement: 'Features with no correlation to the target add noise and can hurt predictions.', isTrue: true, explanation: 'Irrelevant features introduce noise that the model may incorrectly learn from, reducing prediction quality.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'preprocessing', label: 'Data Preprocessing Steps' },
          { id: 'quality-issues', label: 'Data Quality Issues' }
        ],
        items: [
          { id: 'reg-data-s1', concept: 'Normalizing feature ranges', correctCategoryId: 'preprocessing' },
          { id: 'reg-data-s2', concept: 'Extreme values far from the mean', correctCategoryId: 'quality-issues' },
          { id: 'reg-data-s3', concept: 'Filling in missing values', correctCategoryId: 'preprocessing' },
          { id: 'reg-data-s4', concept: 'Features with different scales', correctCategoryId: 'quality-issues' },
          { id: 'reg-data-s5', concept: 'Removing duplicate rows', correctCategoryId: 'preprocessing' },
          { id: 'reg-data-s6', concept: 'Highly correlated input features', correctCategoryId: 'quality-issues' }
        ]
      }
    }
  },

  classification: {
    title: 'Understanding Your Tabular Data 🗂️',
    description: 'Learn how to prepare structured data for classification',
    icon: '📊',
    sections: [
      {
        id: 'data-overview',
        title: 'Your Dataset at a Glance',
        content: `Your classification dataset is ready! Here's the summary:

📦 **{{sampleCount}} rows** across **{{labelCount}} categories**

Each row represents one example the AI will learn from to make predictions.`,
        dynamicContent: true
      },
      {
        id: 'tabular-quality',
        title: 'Tabular Data Quality',
        content: `For effective classification, ensure:

✅ **Class Balance** - Similar examples per category
✅ **Feature Types** - Understand numeric vs categorical columns
✅ **Missing Values** - Handle gaps appropriately
✅ **Relevant Features** - Include columns that actually help predict

The quality of your features directly impacts how well the model can separate categories!`,
        explanations: [
          {
            term: 'Categorical Features',
            explanation: 'Columns with distinct categories like "red/blue/green" or "yes/no" rather than numbers.',
            example: 'Color, country, or product type are categorical. Age and price are numerical.',
            variant: 'default'
          }
        ]
      },
      {
        id: 'decision-boundaries',
        title: 'How Classification Works',
        content: `Your model will learn to draw **decision boundaries** - invisible lines that separate categories:

🔵 Category A on one side
🔴 Category B on the other

The better your features distinguish categories, the cleaner these boundaries will be!

Think of it like sorting mail - clear addresses make sorting easy, smudged ones make it hard.`,
        explanations: [
          {
            term: 'Decision Boundary',
            explanation: 'The line (or surface) that separates different categories in your data.',
            example: 'If classifying emails as spam/not-spam, the boundary separates suspicious patterns from normal ones.',
            variant: 'fun'
          }
        ]
      }
    ],
    quiz: {
      questions: [
        {
          id: 'class-q1',
          question: 'What is a decision boundary in classification?',
          options: [
            'The edge of your dataset',
            'A line that separates different categories',
            'The maximum number of features',
            'The training time limit'
          ],
          correctAnswer: 1,
          explanation: 'A decision boundary is the line (or surface in higher dimensions) that the model learns to separate different categories. Points on one side get one label, points on the other side get a different label.',
          hint: 'Think about how you would draw a line to separate two groups of points...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'cls-data-m1', concept: 'Decision Boundary', definition: 'A line or surface that separates different categories' },
          { id: 'cls-data-m2', concept: 'Categorical Features', definition: 'Columns with distinct groups like colors or types' },
          { id: 'cls-data-m3', concept: 'Class Balance', definition: 'Having similar numbers of examples per category' },
          { id: 'cls-data-m4', concept: 'Feature Selection', definition: 'Choosing which input columns help predict the target' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'cls-data-fb1',
            template: 'A {{b1}} boundary is the line that separates different categories in the data.',
            blanks: { b1: 'decision' }
          },
          {
            id: 'cls-data-fb2',
            template: 'Features can be either {{b2}} (like color) or numerical (like age).',
            blanks: { b2: 'categorical' }
          },
          {
            id: 'cls-data-fb3',
            template: 'Including irrelevant {{b3}} can confuse the model and reduce accuracy.',
            blanks: { b3: 'features' }
          }
        ],
        distractors: ['regression', 'neurons', 'pixels']
      },
      flashCards: {
        statements: [
          { id: 'cls-data-fc1', statement: 'All columns in a dataset are equally useful for classification.', isTrue: false, explanation: 'Some features are more informative than others. Irrelevant features add noise and can reduce model performance.' },
          { id: 'cls-data-fc2', statement: 'Balanced classes help the model learn to predict all categories fairly.', isTrue: true, explanation: 'When classes are balanced, the model gets equal exposure to each category during training.' },
          { id: 'cls-data-fc3', statement: 'Categorical features must be converted to numbers before training.', isTrue: true, explanation: 'Models work with numbers internally, so categories like "red/blue/green" must be encoded numerically.' },
          { id: 'cls-data-fc4', statement: 'Missing values in the dataset have no effect on model training.', isTrue: false, explanation: 'Missing values can cause errors or bias in training. They need to be handled through imputation or removal.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'numerical-feat', label: 'Numerical Features' },
          { id: 'categorical-feat', label: 'Categorical Features' }
        ],
        items: [
          { id: 'cls-data-s1', concept: 'Age in years', correctCategoryId: 'numerical-feat' },
          { id: 'cls-data-s2', concept: 'Product color', correctCategoryId: 'categorical-feat' },
          { id: 'cls-data-s3', concept: 'Temperature in Celsius', correctCategoryId: 'numerical-feat' },
          { id: 'cls-data-s4', concept: 'Country of origin', correctCategoryId: 'categorical-feat' },
          { id: 'cls-data-s5', concept: 'Annual income', correctCategoryId: 'numerical-feat' },
          { id: 'cls-data-s6', concept: 'Subscription tier (basic/premium)', correctCategoryId: 'categorical-feat' }
        ]
      }
    }
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Learn: Model Content
// ─────────────────────────────────────────────────────────────────────────────

const learnModelContent: Record<ModelType, LearningMomentContent> = {
  image_classification: {
    title: 'How Your Image Model Works 🧠',
    description: 'Understand how your trained model recognizes and classifies images',
    icon: '🔬',
    sections: [
      {
        id: 'training-results',
        title: 'Your Training Results',
        content: `Congratulations! Your model has finished training. Here's how it performed:

📈 **Accuracy: {{accuracy}}%** - How often the model predicts correctly
📉 **Loss: {{loss}}** - How far off predictions are (lower is better)
🔄 **Epochs: {{epochs}}** - Training cycles completed

These metrics tell you how well your model learned from the data!`,
        dynamicContent: true
      },
      {
        id: 'cnn-basics',
        title: 'Convolutional Neural Networks (CNNs)',
        content: `Your image model uses a **Convolutional Neural Network** - a special type of AI designed for images!

🔍 **How it works:**
1. **Convolution Layers** - Scan the image for patterns (edges, shapes, textures)
2. **Pooling Layers** - Simplify the information while keeping important features
3. **Dense Layers** - Combine features to make the final prediction

It's like having many tiny pattern detectors working together!`,
        explanations: [
          {
            term: 'Convolutional Neural Network (CNN)',
            explanation: 'A type of AI that\'s especially good at understanding images by detecting patterns at different scales.',
            example: 'First it might detect edges, then shapes, then whole objects like "this looks like a cat face!"',
            variant: 'default'
          }
        ],
        visualization: 'cnn-layers'
      },
      {
        id: 'feature-maps',
        title: 'What Your Model Learned',
        content: `During training, your model created **feature maps** - internal representations of what it looks for:

🎯 **Early layers** detect simple patterns:
- Edges, lines, corners

🎯 **Middle layers** combine these into shapes:
- Circles, curves, textures

🎯 **Later layers** recognize complex features:
- Eyes, wheels, specific objects

The model learned these automatically from your training images!`,
        explanations: [
          {
            term: 'Feature Maps',
            explanation: 'Internal images showing what patterns the model is detecting at each layer.',
            example: 'One feature map might highlight all the edges in an image, another might highlight all the round shapes.',
            variant: 'fun'
          }
        ]
      },
      {
        id: 'metrics-explained',
        title: 'Understanding Your Metrics',
        content: `Let's break down what your training metrics mean:

📊 **Accuracy ({{accuracy}}%)**
The percentage of correct predictions. Higher is better!

📉 **Loss ({{loss}})**
Measures prediction errors. Should decrease during training.

⚖️ **Training vs Validation**
- Training accuracy: How well it learned the training data
- Validation accuracy: How well it generalizes to new data

If validation is much lower than training, the model might be overfitting!`,
        dynamicContent: true,
        explanations: [
          {
            term: 'Validation Accuracy',
            explanation: 'How well your model performs on data it hasn\'t seen during training - the true test of learning!',
            variant: 'tip'
          }
        ]
      }
    ],
    quiz: {
      questions: [
        {
          id: 'model-q1',
          question: 'What do the early layers of a CNN typically detect?',
          options: [
            'Complete objects like cats or cars',
            'Simple patterns like edges and lines',
            'Colors only',
            'Text in images'
          ],
          correctAnswer: 1,
          explanation: 'Early CNN layers detect simple, low-level features like edges, lines, and corners. These are combined in later layers to recognize more complex patterns and eventually whole objects.',
          hint: 'Think about building blocks - what comes first?'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'img-model-m1', concept: 'Convolution Layer', definition: 'Scans the image for patterns like edges and textures' },
          { id: 'img-model-m2', concept: 'Pooling Layer', definition: 'Simplifies information while keeping important features' },
          { id: 'img-model-m3', concept: 'Feature Maps', definition: 'Internal representations showing detected patterns at each layer' },
          { id: 'img-model-m4', concept: 'Validation Accuracy', definition: 'Performance on data the model has not seen during training' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'img-model-fb1',
            template: 'A CNN uses {{b1}} layers to detect patterns like edges and shapes in images.',
            blanks: { b1: 'convolution' }
          },
          {
            id: 'img-model-fb2',
            template: 'If validation accuracy is much lower than training accuracy, the model may be {{b2}}.',
            blanks: { b2: 'overfitting' }
          },
          {
            id: 'img-model-fb3',
            template: 'Early layers detect simple patterns while later layers recognize complex {{b3}}.',
            blanks: { b3: 'objects' }
          }
        ],
        distractors: ['underfitting', 'labels', 'datasets']
      },
      flashCards: {
        statements: [
          { id: 'img-model-fc1', statement: 'Later layers in a CNN detect more complex features than early layers.', isTrue: true, explanation: 'Early layers detect edges and lines; middle layers detect shapes; later layers detect whole objects or complex patterns.' },
          { id: 'img-model-fc2', statement: 'A lower loss value means the model is making more errors.', isTrue: false, explanation: 'Loss measures prediction error — lower loss means fewer and smaller errors, which is better.' },
          { id: 'img-model-fc3', statement: 'Training for more epochs always improves model performance.', isTrue: false, explanation: 'Too many epochs can cause overfitting, where the model memorizes training data instead of learning general patterns.' },
          { id: 'img-model-fc4', statement: 'Pooling layers reduce the spatial size of feature maps.', isTrue: true, explanation: 'Pooling (like max pooling) reduces dimensions while retaining the most important information, making computation more efficient.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'signs-good', label: 'Signs of Good Training' },
          { id: 'signs-bad', label: 'Signs of Problems' }
        ],
        items: [
          { id: 'img-model-s1', concept: 'Loss decreasing over epochs', correctCategoryId: 'signs-good' },
          { id: 'img-model-s2', concept: 'Training accuracy much higher than validation', correctCategoryId: 'signs-bad' },
          { id: 'img-model-s3', concept: 'Validation accuracy improving steadily', correctCategoryId: 'signs-good' },
          { id: 'img-model-s4', concept: 'Loss not decreasing after many epochs', correctCategoryId: 'signs-bad' },
          { id: 'img-model-s5', concept: 'Similar training and validation accuracy', correctCategoryId: 'signs-good' },
          { id: 'img-model-s6', concept: 'Model predicts same class for all inputs', correctCategoryId: 'signs-bad' }
        ]
      }
    }
  },

  text_classification: {
    title: 'How Your Text Model Works 📚',
    description: 'Understand how your model analyzes and classifies text',
    icon: '🔬',
    sections: [
      {
        id: 'training-results',
        title: 'Your Training Results',
        content: `Your text classification model is trained! Here's the summary:

📈 **Accuracy: {{accuracy}}%** - Correct classification rate
📉 **Loss: {{loss}}** - Prediction error measure
🔄 **Epochs: {{epochs}}** - Training iterations completed

Let's understand how your model processes text!`,
        dynamicContent: true
      },
      {
        id: 'embeddings',
        title: 'Text Embeddings: Words as Numbers',
        content: `Computers can't read text directly, so we convert words to numbers called **embeddings**:

🔤 **How it works:**
1. Each word gets a unique numerical representation
2. Similar words get similar numbers
3. The model learns which number patterns match each category

"Happy" and "joyful" would have similar embeddings because they mean similar things!`,
        explanations: [
          {
            term: 'Word Embeddings',
            explanation: 'A way to represent words as lists of numbers that capture their meaning and relationships.',
            example: '"King" - "Man" + "Woman" ≈ "Queen" in embedding space - the math actually works!',
            variant: 'fun'
          }
        ]
      },
      {
        id: 'classification-process',
        title: 'The Classification Process',
        content: `Your model classifies text in steps:

1️⃣ **Tokenization** - Split text into words/pieces
2️⃣ **Embedding** - Convert tokens to numbers
3️⃣ **Processing** - Analyze patterns and context
4️⃣ **Classification** - Predict the category

The model learned which word patterns are associated with each category from your training data!`,
        explanations: [
          {
            term: 'Tokenization',
            explanation: 'Breaking text into smaller pieces (tokens) that the model can process.',
            example: '"I love AI" becomes ["I", "love", "AI"] or even ["I", "lov", "e", "AI"] depending on the method.',
            variant: 'default'
          }
        ]
      },
      {
        id: 'metrics-explained',
        title: 'Understanding Your Metrics',
        content: `Here's what your metrics tell you:

📊 **Accuracy ({{accuracy}}%)**
How often the model correctly classifies text.

📉 **Loss ({{loss}})**
How confident and correct the predictions are.

🎯 **Precision & Recall**
- Precision: When it predicts a category, how often is it right?
- Recall: Of all texts in a category, how many did it find?

Both matter for a well-rounded model!`,
        dynamicContent: true,
        explanations: [
          {
            term: 'Precision vs Recall',
            explanation: 'Precision = "Of my predictions, how many were correct?" Recall = "Of all correct answers, how many did I find?"',
            example: 'A spam filter with high precision rarely marks good emails as spam. High recall catches most spam.',
            variant: 'tip'
          }
        ]
      }
    ],
    quiz: {
      questions: [
        {
          id: 'text-model-q1',
          question: 'What are word embeddings?',
          options: [
            'Pictures of words',
            'Numerical representations that capture word meaning',
            'The font style of text',
            'Word count statistics'
          ],
          correctAnswer: 1,
          explanation: 'Word embeddings convert words into lists of numbers that capture their meaning. Similar words have similar embeddings, allowing the model to understand relationships between words.',
          hint: 'How can a computer understand that "happy" and "joyful" are similar?'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'txt-model-m1', concept: 'Tokenization', definition: 'Splitting text into smaller pieces the model can process' },
          { id: 'txt-model-m2', concept: 'Word Embeddings', definition: 'Numerical representations that capture word meaning' },
          { id: 'txt-model-m3', concept: 'Precision', definition: 'Of predictions made, how many were correct' },
          { id: 'txt-model-m4', concept: 'Recall', definition: 'Of all correct answers, how many were found' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'txt-model-fb1',
            template: '{{b1}} converts words into numerical representations that capture meaning.',
            blanks: { b1: 'Embedding' }
          },
          {
            id: 'txt-model-fb2',
            template: 'The first step in text processing is {{b2}}, which splits text into tokens.',
            blanks: { b2: 'tokenization' }
          },
          {
            id: 'txt-model-fb3',
            template: '{{b3}} measures how many of the model\'s positive predictions were actually correct.',
            blanks: { b3: 'Precision' }
          }
        ],
        distractors: ['accuracy', 'convolution', 'pooling']
      },
      flashCards: {
        statements: [
          { id: 'txt-model-fc1', statement: 'Words with similar meanings have similar embeddings.', isTrue: true, explanation: 'Embedding algorithms place semantically similar words close together in vector space, capturing meaning relationships.' },
          { id: 'txt-model-fc2', statement: 'Tokenization always splits text into individual characters.', isTrue: false, explanation: 'Tokenization can split by words, subwords, or characters depending on the method. Word-level and subword tokenization are most common.' },
          { id: 'txt-model-fc3', statement: 'A model with high precision but low recall finds most positives but also makes many false alarms.', isTrue: false, explanation: 'High precision means few false alarms. Low recall means it misses many actual positives. You described the opposite.' },
          { id: 'txt-model-fc4', statement: 'The loss function measures how far the model predictions are from the correct answers.', isTrue: true, explanation: 'Loss quantifies prediction error. During training, the model adjusts to minimize this value.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'text-preprocessing', label: 'Text Preprocessing' },
          { id: 'model-evaluation', label: 'Model Evaluation' }
        ],
        items: [
          { id: 'txt-model-s1', concept: 'Splitting text into tokens', correctCategoryId: 'text-preprocessing' },
          { id: 'txt-model-s2', concept: 'Calculating precision and recall', correctCategoryId: 'model-evaluation' },
          { id: 'txt-model-s3', concept: 'Removing stop words', correctCategoryId: 'text-preprocessing' },
          { id: 'txt-model-s4', concept: 'Comparing predictions to true labels', correctCategoryId: 'model-evaluation' },
          { id: 'txt-model-s5', concept: 'Converting words to lowercase', correctCategoryId: 'text-preprocessing' },
          { id: 'txt-model-s6', concept: 'Computing the F1 score', correctCategoryId: 'model-evaluation' }
        ]
      }
    }
  },

  regression: {
    title: 'How Your Regression Model Works 📈',
    description: 'Understand how your model predicts numerical values',
    icon: '🔬',
    sections: [
      {
        id: 'training-results',
        title: 'Your Training Results',
        content: `Your regression model is ready to make predictions! Here's how it performed:

📈 **R² Score: {{accuracy}}%** - How well the model explains the data
📉 **Loss (MSE): {{loss}}** - Average squared prediction error
🔄 **Epochs: {{epochs}}** - Training cycles completed

Let's understand what these mean for your predictions!`,
        dynamicContent: true
      },
      {
        id: 'linear-relationships',
        title: 'Finding Relationships in Data',
        content: `Your regression model learned the **relationship** between input features and the target value:

📊 **Linear Regression** finds the best straight line through your data
📈 **The line** represents the pattern: "When X increases, Y tends to..."

For example: "For every extra bedroom, house price increases by $50,000"

The model found these patterns automatically from your data!`,
        explanations: [
          {
            term: 'Linear Relationship',
            explanation: 'When one variable changes, another changes proportionally - like a straight line on a graph.',
            example: 'If you drive twice as far, you use roughly twice as much gas - that\'s a linear relationship!',
            variant: 'default'
          }
        ],
        visualization: 'regression-line'
      },
      {
        id: 'prediction-intervals',
        title: 'Prediction Confidence',
        content: `Your model doesn't just predict a single number - it has varying confidence:

🎯 **Point Prediction** - The model's best guess
📊 **Prediction Interval** - A range where the true value likely falls

Predictions near your training data are more confident than predictions for unusual inputs.

Think of weather forecasts: "High of 75°F" is the prediction, "between 72-78°F" is the interval!`,
        explanations: [
          {
            term: 'Prediction Interval',
            explanation: 'A range of values that likely contains the true answer, accounting for uncertainty.',
            example: 'Predicting a house price of $300K with a 95% interval of $280K-$320K means you\'re pretty confident it\'s in that range.',
            variant: 'tip'
          }
        ]
      },
      {
        id: 'metrics-explained',
        title: 'Understanding R² and Loss',
        content: `Your regression metrics explained:

📊 **R² Score ({{accuracy}}%)**
- 100% = Perfect predictions
- 0% = No better than guessing the average
- Higher is better!

📉 **Mean Squared Error ({{loss}})**
- Measures average prediction error
- Lower is better
- Penalizes big mistakes more than small ones

A good model has high R² and low MSE!`,
        dynamicContent: true,
        explanations: [
          {
            term: 'R² Score',
            explanation: 'The percentage of variation in your target that the model explains. 80% means the model captures 80% of the pattern.',
            variant: 'default'
          }
        ]
      }
    ],
    quiz: {
      questions: [
        {
          id: 'reg-model-q1',
          question: 'What does an R² score of 85% mean?',
          options: [
            'The model is 85% complete',
            'The model explains 85% of the variation in the data',
            'The model has 85 features',
            'The model trained for 85 epochs'
          ],
          correctAnswer: 1,
          explanation: 'R² (R-squared) measures how much of the variation in your target variable is explained by the model. 85% means the model captures most of the pattern, with 15% unexplained variation.',
          hint: 'Think about how much of the pattern the model has learned...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'reg-model-m1', concept: 'R² Score', definition: 'Percentage of variation in the target explained by the model' },
          { id: 'reg-model-m2', concept: 'Mean Squared Error', definition: 'Average of squared differences between predictions and actual values' },
          { id: 'reg-model-m3', concept: 'Linear Regression', definition: 'Finding the best straight line through data points' },
          { id: 'reg-model-m4', concept: 'Prediction Interval', definition: 'A range where the true value likely falls' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'reg-model-fb1',
            template: 'An R² score of 100% means the model perfectly {{b1}} all variation in the data.',
            blanks: { b1: 'explains' }
          },
          {
            id: 'reg-model-fb2',
            template: 'Mean Squared Error penalizes {{b2}} mistakes more than small ones.',
            blanks: { b2: 'large' }
          },
          {
            id: 'reg-model-fb3',
            template: 'A regression model learns the {{b3}} between input features and the target value.',
            blanks: { b3: 'relationship' }
          }
        ],
        distractors: ['classification', 'categories', 'labels']
      },
      flashCards: {
        statements: [
          { id: 'reg-model-fc1', statement: 'An R² score of 0% means the model is no better than predicting the average.', isTrue: true, explanation: 'R² = 0 means the model explains none of the variance — it performs the same as simply guessing the mean value every time.' },
          { id: 'reg-model-fc2', statement: 'Mean Squared Error can be negative.', isTrue: false, explanation: 'MSE is the average of squared values, and squares are always non-negative, so MSE is always ≥ 0.' },
          { id: 'reg-model-fc3', statement: 'A regression model can only learn linear relationships.', isTrue: false, explanation: 'While linear regression fits straight lines, polynomial regression and neural networks can capture non-linear relationships.' },
          { id: 'reg-model-fc4', statement: 'Predictions near the training data range are generally more reliable.', isTrue: true, explanation: 'Models are most confident within the range of data they trained on. Extrapolating far beyond that range is less reliable.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'regression-metrics', label: 'Regression Metrics' },
          { id: 'regression-concepts', label: 'Model Concepts' }
        ],
        items: [
          { id: 'reg-model-s1', concept: 'R² Score', correctCategoryId: 'regression-metrics' },
          { id: 'reg-model-s2', concept: 'Learning Rate', correctCategoryId: 'regression-concepts' },
          { id: 'reg-model-s3', concept: 'Mean Squared Error', correctCategoryId: 'regression-metrics' },
          { id: 'reg-model-s4', concept: 'Epochs', correctCategoryId: 'regression-concepts' },
          { id: 'reg-model-s5', concept: 'Mean Absolute Error', correctCategoryId: 'regression-metrics' },
          { id: 'reg-model-s6', concept: 'Batch Size', correctCategoryId: 'regression-concepts' }
        ]
      }
    }
  },

  classification: {
    title: 'How Your Classification Model Works 🎯',
    description: 'Understand how your model makes category predictions',
    icon: '🔬',
    sections: [
      {
        id: 'training-results',
        title: 'Your Training Results',
        content: `Your classification model is trained! Here's the performance summary:

📈 **Accuracy: {{accuracy}}%** - Overall correct predictions
📉 **Loss: {{loss}}** - Prediction confidence measure
🔄 **Epochs: {{epochs}}** - Training iterations

Let's explore how your model makes decisions!`,
        dynamicContent: true
      },
      {
        id: 'decision-boundaries',
        title: 'Decision Boundaries',
        content: `Your model learned to draw **decision boundaries** - invisible lines that separate categories:

🔵 Points on one side → Category A
🔴 Points on the other side → Category B

The model found the best boundaries by analyzing patterns in your training data.

With more features, these boundaries become surfaces in higher dimensions - but the concept is the same!`,
        explanations: [
          {
            term: 'Decision Boundary',
            explanation: 'The line (or surface) that separates different categories. Points on each side get different predictions.',
            example: 'Imagine drawing a line to separate cats from dogs on a graph of "fluffiness" vs "size".',
            variant: 'default'
          }
        ],
        visualization: 'decision-boundary'
      },
      {
        id: 'feature-importance',
        title: 'Feature Importance',
        content: `Not all features are equally useful for classification. Your model learned which features matter most:

⭐ **High importance** - Features that strongly distinguish categories
📊 **Medium importance** - Helpful but not decisive features
➖ **Low importance** - Features that don't help much

Understanding feature importance helps you:
- Know what drives predictions
- Identify which data to collect
- Simplify models by removing unimportant features`,
        explanations: [
          {
            term: 'Feature Importance',
            explanation: 'A measure of how much each input feature contributes to the model\'s predictions.',
            example: 'For predicting loan approval, income might be very important while favorite color is not important at all.',
            variant: 'tip'
          }
        ]
      },
      {
        id: 'metrics-explained',
        title: 'Classification Metrics Deep Dive',
        content: `Understanding your model's performance:

📊 **Accuracy ({{accuracy}}%)**
Overall percentage of correct predictions.

🎯 **Precision**
When the model predicts a class, how often is it right?

🔍 **Recall**
Of all actual instances of a class, how many did the model find?

⚖️ **F1 Score**
Balances precision and recall - useful for imbalanced data!`,
        dynamicContent: true,
        explanations: [
          {
            term: 'F1 Score',
            explanation: 'The harmonic mean of precision and recall - a single number that balances both.',
            example: 'If precision is 80% and recall is 60%, F1 is about 69% - it penalizes having one much lower than the other.',
            variant: 'default'
          }
        ]
      }
    ],
    quiz: {
      questions: [
        {
          id: 'class-model-q1',
          question: 'Why is feature importance useful to understand?',
          options: [
            'It makes the model train faster',
            'It helps you know what drives predictions and what data matters',
            'It increases accuracy automatically',
            'It reduces the dataset size'
          ],
          correctAnswer: 1,
          explanation: 'Understanding feature importance helps you interpret why the model makes certain predictions, identify which data is most valuable to collect, and potentially simplify models by removing unimportant features.',
          hint: 'Think about what you can learn and do with this information...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'cls-model-m1', concept: 'Decision Boundary', definition: 'The surface that separates different predicted categories' },
          { id: 'cls-model-m2', concept: 'Feature Importance', definition: 'A measure of how much each input contributes to predictions' },
          { id: 'cls-model-m3', concept: 'F1 Score', definition: 'Harmonic mean of precision and recall' },
          { id: 'cls-model-m4', concept: 'Overfitting', definition: 'Model memorizes training data instead of learning general patterns' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'cls-model-fb1',
            template: 'The {{b1}} score balances precision and recall into a single metric.',
            blanks: { b1: 'F1' }
          },
          {
            id: 'cls-model-fb2',
            template: 'Features with high {{b2}} contribute more to the model\'s predictions.',
            blanks: { b2: 'importance' }
          },
          {
            id: 'cls-model-fb3',
            template: 'A model that memorizes training data instead of learning patterns is {{b3}}.',
            blanks: { b3: 'overfitting' }
          }
        ],
        distractors: ['underfitting', 'regression', 'embedding']
      },
      flashCards: {
        statements: [
          { id: 'cls-model-fc1', statement: 'Feature importance tells you which inputs the model relies on most.', isTrue: true, explanation: 'Feature importance ranks how much each input variable contributes to the model\'s decision-making process.' },
          { id: 'cls-model-fc2', statement: 'A model with 99% accuracy is always a good model.', isTrue: false, explanation: 'With imbalanced data, a model could predict the majority class every time and still get 99% accuracy while being useless for the minority class.' },
          { id: 'cls-model-fc3', statement: 'Decision boundaries become more complex with more features.', isTrue: true, explanation: 'In higher dimensions, decision boundaries become hyperplanes or complex surfaces rather than simple lines.' },
          { id: 'cls-model-fc4', statement: 'Precision and recall always have the same value.', isTrue: false, explanation: 'Precision and recall measure different things and often trade off against each other. Improving one can decrease the other.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'overfitting-signs', label: 'Signs of Overfitting' },
          { id: 'good-generalization', label: 'Signs of Good Generalization' }
        ],
        items: [
          { id: 'cls-model-s1', concept: 'High training accuracy, low test accuracy', correctCategoryId: 'overfitting-signs' },
          { id: 'cls-model-s2', concept: 'Similar performance on training and test data', correctCategoryId: 'good-generalization' },
          { id: 'cls-model-s3', concept: 'Model fails on slightly different inputs', correctCategoryId: 'overfitting-signs' },
          { id: 'cls-model-s4', concept: 'Consistent accuracy across cross-validation folds', correctCategoryId: 'good-generalization' },
          { id: 'cls-model-s5', concept: 'Perfect score on training set only', correctCategoryId: 'overfitting-signs' },
          { id: 'cls-model-s6', concept: 'Handles unseen examples well', correctCategoryId: 'good-generalization' }
        ]
      }
    }
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Learn: Next Steps Content
// ─────────────────────────────────────────────────────────────────────────────

const learnNextStepsContent: Record<ModelType, LearningMomentContent> = {
  image_classification: {
    title: 'Your ML Journey Continues! 🚀',
    description: 'Discover what to learn next after deploying your image classification model',
    icon: '🎓',
    sections: [
      {
        id: 'journey-summary',
        title: 'What You\'ve Accomplished',
        content: `Congratulations on deploying your image classification model! 🎉

📊 **Your Journey:**
- Collected and prepared image data
- Trained a CNN model
- Achieved **{{accuracy}}%** accuracy
- Deployed your model for predictions

You've completed a full ML workflow - that's a huge achievement!`,
        dynamicContent: true
      },
      {
        id: 'high-accuracy-path',
        title: 'Level Up Your Model',
        content: `Your model is performing well! Here are advanced techniques to explore:

🎯 **Hyperparameter Tuning**
Fine-tune learning rate, batch size, and architecture for even better results.

🔄 **Data Augmentation**
Artificially expand your dataset with rotations, flips, and color adjustments.

🏗️ **Transfer Learning**
Use pre-trained models (like ResNet or VGG) as a starting point.

📊 **Cross-Validation**
Test your model more rigorously with k-fold validation.`,
        explanations: [
          {
            term: 'Transfer Learning',
            explanation: 'Using a model trained on millions of images as a starting point, then fine-tuning it for your specific task.',
            example: 'A model trained on ImageNet already knows edges, shapes, and textures - you just teach it your specific categories!',
            variant: 'tip'
          },
          {
            term: 'Data Augmentation',
            explanation: 'Creating new training examples by modifying existing ones - flipping, rotating, adjusting brightness.',
            example: 'One cat photo becomes 10 by flipping it, rotating slightly, and adjusting colors.',
            variant: 'default'
          }
        ]
      },
      {
        id: 'low-accuracy-path',
        title: 'Improving Your Results',
        content: `Want to boost your model's accuracy? Try these strategies:

📦 **More Data**
Collect more diverse training images, especially for categories with lower accuracy.

🧹 **Data Quality**
Review and clean your dataset - remove mislabeled or low-quality images.

⚖️ **Balance Classes**
Ensure each category has similar numbers of examples.

🔧 **Adjust Training**
Try more epochs, different learning rates, or early stopping.`,
        explanations: [
          {
            term: 'Early Stopping',
            explanation: 'Automatically stop training when the model stops improving, preventing overfitting.',
            example: 'If validation accuracy hasn\'t improved for 5 epochs, stop training and use the best model so far.',
            variant: 'tip'
          }
        ]
      },
      {
        id: 'next-workshops',
        title: 'Recommended Next Steps',
        content: `Continue your ML journey with these ModelMentor features:

🎮 **ML Playground**
Experiment with different model architectures and see results in real-time.

🔬 **Advanced Workshops**
- Object Detection: Find AND locate objects in images
- Image Segmentation: Identify exact object boundaries
- Style Transfer: Apply artistic styles to images

📚 **Concepts to Explore**
- Ensemble methods (combining multiple models)
- Model interpretability (understanding predictions)
- Edge deployment (running models on devices)`
      }
    ],
    quiz: {
      questions: [
        {
          id: 'next-q1',
          question: 'What is transfer learning?',
          options: [
            'Moving your model to a different computer',
            'Using a pre-trained model as a starting point for your task',
            'Transferring data between datasets',
            'Learning multiple tasks at once'
          ],
          correctAnswer: 1,
          explanation: 'Transfer learning uses models pre-trained on large datasets (like ImageNet) as a starting point. The model already knows general features, so you just fine-tune it for your specific task - often achieving better results with less data!',
          hint: 'Think about not starting from scratch...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'img-next-m1', concept: 'Transfer Learning', definition: 'Using a pre-trained model as a starting point for a new task' },
          { id: 'img-next-m2', concept: 'Data Augmentation', definition: 'Creating new training examples by modifying existing images' },
          { id: 'img-next-m3', concept: 'Cross-Validation', definition: 'Testing model performance on multiple data splits' },
          { id: 'img-next-m4', concept: 'Hyperparameter Tuning', definition: 'Optimizing settings like learning rate and batch size' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'img-next-fb1',
            template: '{{b1}} learning uses a model pre-trained on millions of images as a starting point.',
            blanks: { b1: 'Transfer' }
          },
          {
            id: 'img-next-fb2',
            template: 'Data {{b2}} creates new training examples by rotating, flipping, or adjusting images.',
            blanks: { b2: 'augmentation' }
          },
          {
            id: 'img-next-fb3',
            template: 'K-fold cross-{{b3}} tests the model on multiple different data splits for more reliable evaluation.',
            blanks: { b3: 'validation' }
          }
        ],
        distractors: ['classification', 'regression', 'pooling']
      },
      flashCards: {
        statements: [
          { id: 'img-next-fc1', statement: 'Transfer learning typically requires less training data than training from scratch.', isTrue: true, explanation: 'Pre-trained models already know general features, so they need fewer examples to learn your specific task.' },
          { id: 'img-next-fc2', statement: 'Data augmentation changes the original images in your dataset.', isTrue: false, explanation: 'Augmentation creates new copies with modifications — the original images remain unchanged.' },
          { id: 'img-next-fc3', statement: 'A deployed model never needs to be updated or retrained.', isTrue: false, explanation: 'Models can degrade over time as real-world data changes. Regular monitoring and retraining keeps them accurate.' },
          { id: 'img-next-fc4', statement: 'Hyperparameter tuning can significantly improve model performance without changing the data.', isTrue: true, explanation: 'Settings like learning rate, batch size, and architecture choices can have a large impact on how well the model learns.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'improve-data', label: 'Improve with More/Better Data' },
          { id: 'improve-model', label: 'Improve with Model Changes' }
        ],
        items: [
          { id: 'img-next-s1', concept: 'Collect more diverse images', correctCategoryId: 'improve-data' },
          { id: 'img-next-s2', concept: 'Use transfer learning from ResNet', correctCategoryId: 'improve-model' },
          { id: 'img-next-s3', concept: 'Apply rotation and flip augmentation', correctCategoryId: 'improve-data' },
          { id: 'img-next-s4', concept: 'Tune the learning rate', correctCategoryId: 'improve-model' },
          { id: 'img-next-s5', concept: 'Fix mislabeled training images', correctCategoryId: 'improve-data' },
          { id: 'img-next-s6', concept: 'Add dropout regularization', correctCategoryId: 'improve-model' }
        ]
      }
    }
  },

  text_classification: {
    title: 'Your ML Journey Continues! 🚀',
    description: 'Discover what to learn next after deploying your text classification model',
    icon: '🎓',
    sections: [
      {
        id: 'journey-summary',
        title: 'What You\'ve Accomplished',
        content: `Congratulations on deploying your text classification model! 🎉

📊 **Your Journey:**
- Collected and labeled text data
- Trained a text classification model
- Achieved **{{accuracy}}%** accuracy
- Deployed your model for predictions

You've built a working NLP system - impressive!`,
        dynamicContent: true
      },
      {
        id: 'high-accuracy-path',
        title: 'Advanced NLP Techniques',
        content: `Ready to level up? Explore these advanced concepts:

🤖 **Transformer Models**
Modern architectures like BERT and GPT that understand context better.

📊 **Sentiment Analysis**
Go beyond categories to understand emotions and opinions.

🔍 **Named Entity Recognition**
Identify people, places, organizations in text.

💬 **Sequence-to-Sequence**
Build chatbots, translators, and summarizers.`,
        explanations: [
          {
            term: 'Transformer Models',
            explanation: 'Modern AI architectures that understand context by looking at all words simultaneously, not just sequentially.',
            example: 'BERT understands that "bank" means different things in "river bank" vs "bank account" by looking at surrounding words.',
            variant: 'tip'
          }
        ]
      },
      {
        id: 'low-accuracy-path',
        title: 'Improving Text Classification',
        content: `Want better results? Try these approaches:

📝 **More Training Data**
Collect more examples, especially for underperforming categories.

🧹 **Text Preprocessing**
Clean your text - handle typos, remove noise, normalize formats.

⚖️ **Handle Imbalance**
Use techniques like oversampling or class weights for rare categories.

🔤 **Better Embeddings**
Try pre-trained embeddings like Word2Vec or GloVe.`,
        explanations: [
          {
            term: 'Pre-trained Embeddings',
            explanation: 'Word representations learned from billions of words of text, capturing rich semantic relationships.',
            example: 'GloVe embeddings learned from Wikipedia know that "Paris" relates to "France" like "Tokyo" relates to "Japan".',
            variant: 'default'
          }
        ]
      },
      {
        id: 'next-workshops',
        title: 'Recommended Next Steps',
        content: `Continue exploring NLP with ModelMentor:

🎮 **NLP Playground**
Experiment with different text models and preprocessing techniques.

🔬 **Advanced Workshops**
- Sentiment Analysis: Understand emotions in text
- Topic Modeling: Discover themes in document collections
- Question Answering: Build systems that answer questions

📚 **Concepts to Explore**
- Attention mechanisms
- Fine-tuning language models
- Multi-label classification`
      }
    ],
    quiz: {
      questions: [
        {
          id: 'text-next-q1',
          question: 'What makes transformer models better at understanding text?',
          options: [
            'They use more memory',
            'They process words faster',
            'They understand context by looking at all words simultaneously',
            'They only work with short texts'
          ],
          correctAnswer: 2,
          explanation: 'Transformers use "attention" to look at all words in a sentence at once, understanding how each word relates to every other word. This helps them understand context much better than older sequential models.',
          hint: 'Think about how context helps understand word meaning...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'txt-next-m1', concept: 'Transformer Models', definition: 'Architectures that understand context by attending to all words simultaneously' },
          { id: 'txt-next-m2', concept: 'Sentiment Analysis', definition: 'Detecting emotions and opinions in text' },
          { id: 'txt-next-m3', concept: 'Named Entity Recognition', definition: 'Identifying people, places, and organizations in text' },
          { id: 'txt-next-m4', concept: 'Pre-trained Embeddings', definition: 'Word representations learned from billions of words of text' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'txt-next-fb1',
            template: '{{b1}} models like BERT understand context by looking at all words simultaneously.',
            blanks: { b1: 'Transformer' }
          },
          {
            id: 'txt-next-fb2',
            template: 'Sentiment {{b2}} goes beyond categories to understand emotions in text.',
            blanks: { b2: 'analysis' }
          },
          {
            id: 'txt-next-fb3',
            template: 'Pre-trained {{b3}} like GloVe capture semantic relationships between words.',
            blanks: { b3: 'embeddings' }
          }
        ],
        distractors: ['convolution', 'pixels', 'regression']
      },
      flashCards: {
        statements: [
          { id: 'txt-next-fc1', statement: 'BERT can understand that "bank" means different things in different contexts.', isTrue: true, explanation: 'BERT uses attention to look at surrounding words, so it understands "river bank" vs "bank account" differently.' },
          { id: 'txt-next-fc2', statement: 'Once deployed, a text model will always maintain its accuracy over time.', isTrue: false, explanation: 'Language evolves, new slang appears, and topics change. Models need periodic retraining to stay accurate.' },
          { id: 'txt-next-fc3', statement: 'Fine-tuning a pre-trained model is usually faster than training from scratch.', isTrue: true, explanation: 'Pre-trained models already understand language structure, so fine-tuning only needs to adapt them to your specific task.' },
          { id: 'txt-next-fc4', statement: 'Multi-label classification assigns exactly one label to each text.', isTrue: false, explanation: 'Multi-label classification can assign multiple labels to a single text (e.g., a movie review could be both "positive" and "comedy-related").' }
        ]
      },
      sorting: {
        categories: [
          { id: 'nlp-tasks', label: 'NLP Tasks' },
          { id: 'nlp-techniques', label: 'NLP Techniques' }
        ],
        items: [
          { id: 'txt-next-s1', concept: 'Spam detection', correctCategoryId: 'nlp-tasks' },
          { id: 'txt-next-s2', concept: 'Word embeddings', correctCategoryId: 'nlp-techniques' },
          { id: 'txt-next-s3', concept: 'Sentiment analysis', correctCategoryId: 'nlp-tasks' },
          { id: 'txt-next-s4', concept: 'Attention mechanisms', correctCategoryId: 'nlp-techniques' },
          { id: 'txt-next-s5', concept: 'Machine translation', correctCategoryId: 'nlp-tasks' },
          { id: 'txt-next-s6', concept: 'Tokenization strategies', correctCategoryId: 'nlp-techniques' }
        ]
      }
    }
  },

  regression: {
    title: 'Your ML Journey Continues! 🚀',
    description: 'Discover what to learn next after deploying your regression model',
    icon: '🎓',
    sections: [
      {
        id: 'journey-summary',
        title: 'What You\'ve Accomplished',
        content: `Congratulations on deploying your regression model! 🎉

📊 **Your Journey:**
- Prepared numerical data with features
- Trained a regression model
- Achieved **{{accuracy}}%** R² score
- Deployed your model for predictions

You can now predict numerical values - that's powerful!`,
        dynamicContent: true
      },
      {
        id: 'high-accuracy-path',
        title: 'Advanced Regression Techniques',
        content: `Your model is performing well! Explore these advanced topics:

🌳 **Ensemble Methods**
Combine multiple models (Random Forest, Gradient Boosting) for better predictions.

📈 **Polynomial Regression**
Capture non-linear relationships in your data.

🎯 **Regularization**
Prevent overfitting with L1 (Lasso) and L2 (Ridge) regularization.

🔮 **Time Series**
If your data has a time component, explore forecasting techniques.`,
        explanations: [
          {
            term: 'Ensemble Methods',
            explanation: 'Combining predictions from multiple models to get better results than any single model.',
            example: 'Random Forest uses hundreds of decision trees and averages their predictions - like asking many experts instead of one!',
            variant: 'tip'
          },
          {
            term: 'Regularization',
            explanation: 'Adding a penalty for complex models to prevent overfitting and improve generalization.',
            example: 'Like telling the model "keep it simple" - don\'t rely too heavily on any single feature.',
            variant: 'default'
          }
        ]
      },
      {
        id: 'low-accuracy-path',
        title: 'Improving Predictions',
        content: `Want more accurate predictions? Try these strategies:

🔍 **Feature Engineering**
Create new features from existing ones - combinations, ratios, transformations.

📊 **Handle Outliers**
Identify and address extreme values that might skew predictions.

📈 **Non-linear Models**
If relationships aren't linear, try polynomial features or tree-based models.

🔧 **Hyperparameter Tuning**
Optimize model settings with grid search or random search.`,
        explanations: [
          {
            term: 'Feature Engineering',
            explanation: 'Creating new input features from existing data to help the model learn better patterns.',
            example: 'From "length" and "width", create "area = length × width" - the model might find area more useful!',
            variant: 'tip'
          }
        ]
      },
      {
        id: 'next-workshops',
        title: 'Recommended Next Steps',
        content: `Continue your regression journey with ModelMentor:

🎮 **Regression Playground**
Compare different regression algorithms on your data.

🔬 **Advanced Workshops**
- Time Series Forecasting: Predict future values
- Multi-output Regression: Predict multiple targets
- Quantile Regression: Predict ranges, not just points

📚 **Concepts to Explore**
- Cross-validation strategies
- Feature selection techniques
- Model interpretation (SHAP values)`
      }
    ],
    quiz: {
      questions: [
        {
          id: 'reg-next-q1',
          question: 'What is feature engineering?',
          options: [
            'Removing all features from the dataset',
            'Creating new features from existing data to improve model performance',
            'Engineering new hardware for ML',
            'Automatically selecting the best model'
          ],
          correctAnswer: 1,
          explanation: 'Feature engineering is the process of creating new input features from existing data. Good features can dramatically improve model performance by making patterns easier for the model to learn.',
          hint: 'Think about transforming or combining existing data...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'reg-next-m1', concept: 'Ensemble Methods', definition: 'Combining predictions from multiple models for better results' },
          { id: 'reg-next-m2', concept: 'Regularization', definition: 'Adding a penalty for complexity to prevent overfitting' },
          { id: 'reg-next-m3', concept: 'Feature Engineering', definition: 'Creating new input features from existing data' },
          { id: 'reg-next-m4', concept: 'Time Series Forecasting', definition: 'Predicting future values based on historical patterns' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'reg-next-fb1',
            template: '{{b1}} methods combine multiple models to get better predictions than any single model.',
            blanks: { b1: 'Ensemble' }
          },
          {
            id: 'reg-next-fb2',
            template: '{{b2}} adds a penalty for model complexity to prevent overfitting.',
            blanks: { b2: 'Regularization' }
          },
          {
            id: 'reg-next-fb3',
            template: 'Feature {{b3}} creates new inputs by combining or transforming existing features.',
            blanks: { b3: 'engineering' }
          }
        ],
        distractors: ['classification', 'tokenization', 'pooling']
      },
      flashCards: {
        statements: [
          { id: 'reg-next-fc1', statement: 'Random Forest averages predictions from hundreds of decision trees.', isTrue: true, explanation: 'Random Forest is an ensemble method that builds many decision trees and averages their predictions for more robust results.' },
          { id: 'reg-next-fc2', statement: 'Regularization makes the model more complex to improve accuracy.', isTrue: false, explanation: 'Regularization does the opposite — it penalizes complexity to prevent overfitting and improve generalization.' },
          { id: 'reg-next-fc3', statement: 'A deployed model should be monitored for performance degradation over time.', isTrue: true, explanation: 'Real-world data can shift over time, causing model accuracy to degrade. Regular monitoring helps catch this early.' },
          { id: 'reg-next-fc4', statement: 'Polynomial regression can only fit straight lines through data.', isTrue: false, explanation: 'Polynomial regression fits curves by using powers of features (x², x³, etc.), capturing non-linear relationships.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'supervised-methods', label: 'Supervised Learning Methods' },
          { id: 'improvement-techniques', label: 'Model Improvement Techniques' }
        ],
        items: [
          { id: 'reg-next-s1', concept: 'Linear Regression', correctCategoryId: 'supervised-methods' },
          { id: 'reg-next-s2', concept: 'Cross-validation', correctCategoryId: 'improvement-techniques' },
          { id: 'reg-next-s3', concept: 'Random Forest', correctCategoryId: 'supervised-methods' },
          { id: 'reg-next-s4', concept: 'Hyperparameter tuning', correctCategoryId: 'improvement-techniques' },
          { id: 'reg-next-s5', concept: 'Gradient Boosting', correctCategoryId: 'supervised-methods' },
          { id: 'reg-next-s6', concept: 'Feature selection', correctCategoryId: 'improvement-techniques' }
        ]
      }
    }
  },

  classification: {
    title: 'Your ML Journey Continues! 🚀',
    description: 'Discover what to learn next after deploying your classification model',
    icon: '🎓',
    sections: [
      {
        id: 'journey-summary',
        title: 'What You\'ve Accomplished',
        content: `Congratulations on deploying your classification model! 🎉

📊 **Your Journey:**
- Prepared tabular data with features
- Trained a classification model
- Achieved **{{accuracy}}%** accuracy
- Deployed your model for predictions

You've built a decision-making AI system!`,
        dynamicContent: true
      },
      {
        id: 'high-accuracy-path',
        title: 'Advanced Classification Techniques',
        content: `Your model is performing well! Explore these advanced topics:

🌳 **Ensemble Methods**
Combine classifiers with Random Forest, XGBoost, or voting ensembles.

🎯 **Probability Calibration**
Make your model's confidence scores more reliable.

⚖️ **Cost-Sensitive Learning**
Handle cases where some mistakes are worse than others.

🔍 **Model Interpretability**
Understand WHY your model makes specific predictions.`,
        explanations: [
          {
            term: 'XGBoost',
            explanation: 'A powerful ensemble method that builds trees sequentially, with each tree correcting the previous ones\' mistakes.',
            example: 'XGBoost often wins ML competitions because it\'s both accurate and handles many data types well.',
            variant: 'tip'
          },
          {
            term: 'Probability Calibration',
            explanation: 'Adjusting model outputs so that "80% confident" actually means correct 80% of the time.',
            example: 'A well-calibrated model saying "90% chance of rain" should be right about 9 out of 10 times.',
            variant: 'default'
          }
        ]
      },
      {
        id: 'low-accuracy-path',
        title: 'Improving Classification',
        content: `Want better accuracy? Try these approaches:

📊 **Feature Engineering**
Create meaningful features that help distinguish categories.

⚖️ **Handle Imbalance**
Use SMOTE, class weights, or undersampling for imbalanced data.

🔧 **Hyperparameter Tuning**
Optimize model settings systematically.

🧹 **Data Quality**
Review misclassified examples to find data issues or edge cases.`,
        explanations: [
          {
            term: 'SMOTE',
            explanation: 'Synthetic Minority Over-sampling Technique - creates synthetic examples of minority classes to balance your dataset.',
            example: 'If you have 1000 "approved" loans but only 100 "rejected", SMOTE creates synthetic rejected examples.',
            variant: 'tip'
          }
        ]
      },
      {
        id: 'next-workshops',
        title: 'Recommended Next Steps',
        content: `Continue your classification journey with ModelMentor:

🎮 **Classification Playground**
Compare algorithms: Decision Trees, SVM, Neural Networks, and more.

🔬 **Advanced Workshops**
- Multi-label Classification: Assign multiple labels per example
- Anomaly Detection: Find unusual patterns
- Online Learning: Update models with streaming data

📚 **Concepts to Explore**
- ROC curves and AUC
- Confusion matrix analysis
- SHAP values for interpretability`
      }
    ],
    quiz: {
      questions: [
        {
          id: 'class-next-q1',
          question: 'What is SMOTE used for?',
          options: [
            'Making models train faster',
            'Creating synthetic examples to balance imbalanced datasets',
            'Removing outliers from data',
            'Visualizing model predictions'
          ],
          correctAnswer: 1,
          explanation: 'SMOTE (Synthetic Minority Over-sampling Technique) creates synthetic examples of minority classes by interpolating between existing examples. This helps balance imbalanced datasets without just duplicating existing data.',
          hint: 'Think about what to do when one class has far fewer examples...'
        }
      ],
      passingScore: 1
    },
    interactive: {
      matching: {
        pairs: [
          { id: 'cls-next-m1', concept: 'SMOTE', definition: 'Creates synthetic examples to balance imbalanced datasets' },
          { id: 'cls-next-m2', concept: 'XGBoost', definition: 'Ensemble method that builds trees correcting previous mistakes' },
          { id: 'cls-next-m3', concept: 'Probability Calibration', definition: 'Making confidence scores reflect true likelihood' },
          { id: 'cls-next-m4', concept: 'SHAP Values', definition: 'Explaining how much each feature contributes to a prediction' }
        ]
      },
      fillBlanks: {
        sentences: [
          {
            id: 'cls-next-fb1',
            template: '{{b1}} creates synthetic minority examples to balance an imbalanced dataset.',
            blanks: { b1: 'SMOTE' }
          },
          {
            id: 'cls-next-fb2',
            template: 'Model {{b2}} helps you understand why the model makes specific predictions.',
            blanks: { b2: 'interpretability' }
          },
          {
            id: 'cls-next-fb3',
            template: 'An {{b3}} method combines multiple classifiers for better performance.',
            blanks: { b3: 'ensemble' }
          }
        ],
        distractors: ['regression', 'augmentation', 'tokenization']
      },
      flashCards: {
        statements: [
          { id: 'cls-next-fc1', statement: 'SMOTE works by interpolating between existing minority class examples.', isTrue: true, explanation: 'SMOTE creates synthetic examples by finding nearest neighbors in the minority class and generating points between them.' },
          { id: 'cls-next-fc2', statement: 'A well-calibrated model saying 80% confidence is correct exactly 80% of the time.', isTrue: true, explanation: 'Calibration means the predicted probabilities match actual frequencies — 80% confidence should correspond to being right 80% of the time.' },
          { id: 'cls-next-fc3', statement: 'ROC curves are only useful for binary classification problems.', isTrue: false, explanation: 'ROC curves can be extended to multi-class problems using one-vs-rest or one-vs-one approaches.' },
          { id: 'cls-next-fc4', statement: 'Ensemble methods always outperform single models.', isTrue: false, explanation: 'While ensembles often improve performance, they add complexity and may not help if the base models are already very good or the data is too noisy.' }
        ]
      },
      sorting: {
        categories: [
          { id: 'classification-algos', label: 'Classification Algorithms' },
          { id: 'evaluation-tools', label: 'Evaluation & Interpretation Tools' }
        ],
        items: [
          { id: 'cls-next-s1', concept: 'Decision Trees', correctCategoryId: 'classification-algos' },
          { id: 'cls-next-s2', concept: 'Confusion Matrix', correctCategoryId: 'evaluation-tools' },
          { id: 'cls-next-s3', concept: 'Support Vector Machines', correctCategoryId: 'classification-algos' },
          { id: 'cls-next-s4', concept: 'ROC Curve', correctCategoryId: 'evaluation-tools' },
          { id: 'cls-next-s5', concept: 'XGBoost', correctCategoryId: 'classification-algos' },
          { id: 'cls-next-s6', concept: 'SHAP values', correctCategoryId: 'evaluation-tools' }
        ]
      }
    }
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Combined Content Map
// ─────────────────────────────────────────────────────────────────────────────

export const learningMomentContentMap: LearningMomentContentMap = {
  image_classification: {
    data: learnDataContent.image_classification,
    model: learnModelContent.image_classification,
    next_steps: learnNextStepsContent.image_classification
  },
  text_classification: {
    data: learnDataContent.text_classification,
    model: learnModelContent.text_classification,
    next_steps: learnNextStepsContent.text_classification
  },
  regression: {
    data: learnDataContent.regression,
    model: learnModelContent.regression,
    next_steps: learnNextStepsContent.regression
  },
  classification: {
    data: learnDataContent.classification,
    model: learnModelContent.classification,
    next_steps: learnNextStepsContent.classification
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get content for a specific learning moment based on model type and moment type
 */
export function getContentForMoment(
  modelType: ModelType,
  momentType: LearningMomentType
): LearningMomentContent {
  return learningMomentContentMap[modelType][momentType];
}

/**
 * Replace dynamic placeholders in content with actual values
 * Supports placeholders like {{sampleCount}}, {{accuracy}}, etc.
 */
export function replacePlaceholders(
  content: string,
  contextData: LearningMomentContextData
): string {
  let result = content;
  
  // Dataset stats placeholders
  if (contextData.datasetStats) {
    const stats = contextData.datasetStats;
    result = result.replace(/\{\{sampleCount\}\}/g, stats.sampleCount.toString());
    result = result.replace(/\{\{labelCount\}\}/g, stats.labelCount.toString());
  }
  
  // Training metrics placeholders
  if (contextData.trainingMetrics) {
    const metrics = contextData.trainingMetrics;
    result = result.replace(/\{\{accuracy\}\}/g, (metrics.accuracy * 100).toFixed(1));
    result = result.replace(/\{\{loss\}\}/g, metrics.loss.toFixed(4));
    result = result.replace(/\{\{epochs\}\}/g, metrics.epochs.toString());
    result = result.replace(/\{\{trainingAccuracy\}\}/g, (metrics.trainingAccuracy * 100).toFixed(1));
    result = result.replace(/\{\{validationAccuracy\}\}/g, (metrics.validationAccuracy * 100).toFixed(1));
    
    const accuracyGap = Math.abs(metrics.trainingAccuracy - metrics.validationAccuracy) * 100;
    result = result.replace(/\{\{accuracyGap\}\}/g, accuracyGap.toFixed(1));
    
    if (metrics.precision !== undefined) {
      result = result.replace(/\{\{precision\}\}/g, (metrics.precision * 100).toFixed(1));
    }
    if (metrics.recall !== undefined) {
      result = result.replace(/\{\{recall\}\}/g, (metrics.recall * 100).toFixed(1));
    }
    if (metrics.f1Score !== undefined) {
      result = result.replace(/\{\{f1Score\}\}/g, (metrics.f1Score * 100).toFixed(1));
    }
  }
  
  // Model performance placeholders
  if (contextData.modelPerformance) {
    const perf = contextData.modelPerformance;
    result = result.replace(/\{\{accuracy\}\}/g, (perf.finalAccuracy * 100).toFixed(1));
    result = result.replace(/\{\{performanceCategory\}\}/g, perf.performanceCategory);
  }
  
  return result;
}

/**
 * Process all content sections, replacing placeholders where needed
 */
export function processContentSections(
  sections: ContentSection[],
  contextData: LearningMomentContextData
): ContentSection[] {
  return sections.map(section => ({
    ...section,
    content: section.dynamicContent 
      ? replacePlaceholders(section.content, contextData)
      : section.content
  }));
}

/**
 * Get conditional content sections based on data characteristics
 */
export function getConditionalContent(
  datasetStats?: DatasetStats,
  trainingMetrics?: TrainingMetrics
): ContentSection[] {
  const conditionalSections: ContentSection[] = [];
  
  // Check for class imbalance
  if (datasetStats?.hasClassImbalance && conditionalContentSections.classImbalance) {
    conditionalSections.push(conditionalContentSections.classImbalance);
  }
  
  // Check for overfitting
  if (trainingMetrics?.isOverfitting && conditionalContentSections.overfitting) {
    const overfittingSection = { ...conditionalContentSections.overfitting };
    overfittingSection.content = replacePlaceholders(overfittingSection.content, {
      trainingMetrics
    });
    conditionalSections.push(overfittingSection);
  }
  
  // Check for underfitting
  if (trainingMetrics?.isUnderfitting && conditionalContentSections.underfitting) {
    conditionalSections.push(conditionalContentSections.underfitting);
  }
  
  return conditionalSections;
}

/**
 * Determine performance category based on accuracy
 */
export function getPerformanceCategory(accuracy: number): 'high' | 'medium' | 'low' {
  if (accuracy >= 0.9) return 'high';
  if (accuracy >= 0.7) return 'medium';
  return 'low';
}

/**
 * Check if dataset has class imbalance (any class < 20% of total)
 */
export function checkClassImbalance(labelDistribution: { [label: string]: number }): {
  hasImbalance: boolean;
  imbalancedClasses: string[];
} {
  const total = Object.values(labelDistribution).reduce((sum, count) => sum + count, 0);
  const threshold = total * 0.2;
  
  const imbalancedClasses = Object.entries(labelDistribution)
    .filter(([, count]) => count < threshold)
    .map(([label]) => label);
  
  return {
    hasImbalance: imbalancedClasses.length > 0,
    imbalancedClasses
  };
}

/**
 * Check if model is overfitting (validation accuracy > 10% lower than training)
 */
export function checkOverfitting(
  trainingAccuracy: number,
  validationAccuracy: number
): boolean {
  return (trainingAccuracy - validationAccuracy) > 0.1;
}

/**
 * Check if model is underfitting (loss not decreasing)
 * This is a simplified check - in practice you'd look at loss history
 */
export function checkUnderfitting(
  loss: number,
  epochs: number,
  accuracy: number
): boolean {
  // Simple heuristic: if accuracy is low after many epochs, likely underfitting
  return epochs >= 10 && accuracy < 0.5;
}

/**
 * Create dataset stats from raw data
 */
export function createDatasetStats(
  sampleCount: number,
  labelDistribution: { [label: string]: number },
  detectedIssues: string[] = []
): DatasetStats {
  const { hasImbalance, imbalancedClasses } = checkClassImbalance(labelDistribution);
  
  return {
    sampleCount,
    labelCount: Object.keys(labelDistribution).length,
    labelDistribution,
    hasClassImbalance: hasImbalance,
    imbalancedClasses,
    detectedIssues
  };
}

/**
 * Create training metrics from raw training results
 */
export function createTrainingMetrics(
  accuracy: number,
  loss: number,
  epochs: number,
  trainingAccuracy: number,
  validationAccuracy: number,
  precision?: number,
  recall?: number,
  f1Score?: number
): TrainingMetrics {
  return {
    accuracy,
    loss,
    precision,
    recall,
    f1Score,
    epochs,
    trainingAccuracy,
    validationAccuracy,
    isOverfitting: checkOverfitting(trainingAccuracy, validationAccuracy),
    isUnderfitting: checkUnderfitting(loss, epochs, accuracy)
  };
}

/**
 * Create model performance summary
 */
export function createModelPerformance(
  finalAccuracy: number,
  modelType: ModelType,
  trainingDuration: number
): ModelPerformance {
  return {
    finalAccuracy,
    performanceCategory: getPerformanceCategory(finalAccuracy),
    modelType,
    trainingDuration
  };
}

/**
 * Get the full processed content for a learning moment
 */
export function getProcessedLearningMomentContent(
  modelType: ModelType,
  momentType: LearningMomentType,
  contextData: LearningMomentContextData
): LearningMomentContent {
  const baseContent = getContentForMoment(modelType, momentType);
  
  // Process sections with placeholder replacement
  const processedSections = processContentSections(baseContent.sections, contextData);
  
  // Add conditional content based on data characteristics
  const conditionalSections = getConditionalContent(
    contextData.datasetStats,
    contextData.trainingMetrics
  );
  
  // Insert conditional sections after the first section
  const allSections = [
    processedSections[0],
    ...conditionalSections,
    ...processedSections.slice(1)
  ];
  
  return {
    ...baseContent,
    sections: allSections
  };
}
