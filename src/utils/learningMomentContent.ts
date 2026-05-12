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

export interface LearningMomentContent {
  title: string;
  description: string;
  icon: string;
  sections: ContentSection[];
  quiz: LearningMomentQuiz;
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
