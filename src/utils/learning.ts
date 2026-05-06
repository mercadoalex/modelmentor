import type { ModelType, QuizQuestion, LearningContent } from '@/types/types';

export const learningContent: Record<ModelType, LearningContent> = {
  image_classification: {
    title: 'Image Classification Fundamentals',
    description: 'Learn how AI models recognize and categorize images',
    visual: '🖼️',
    concepts: [
      'Images are converted into numerical data that computers can process',
      'Models learn patterns by analyzing thousands of example images',
      'Training accuracy improves as the model sees more diverse examples',
      'Quality and variety of training data directly impact model performance'
    ]
  },
  text_classification: {
    title: 'Text Classification Basics',
    description: 'Understand how AI analyzes and categorizes text',
    visual: '📝',
    concepts: [
      'Text is converted into numerical representations called embeddings',
      'Models learn to identify patterns in word usage and context',
      'More training examples help the model understand nuances',
      'Balanced datasets prevent bias toward specific categories'
    ]
  },
  regression: {
    title: 'Regression Analysis Essentials',
    description: 'Discover how AI predicts numerical values',
    visual: '📊',
    concepts: [
      'Regression models find relationships between input features and output values',
      'The model learns to draw a line (or curve) that best fits the data',
      'More data points lead to more accurate predictions',
      'Feature selection significantly impacts prediction quality'
    ]
  }
};

export const quizQuestions: Record<ModelType, QuizQuestion[]> = {
  image_classification: [
    {
      id: '1',
      question: 'What happens if you train an image classification model with only 5 images?',
      options: [
        'The model will work perfectly',
        'The model will overfit and perform poorly on new images',
        'The model will train faster',
        'The model will be more accurate'
      ],
      correctAnswer: 1,
      explanation: 'With too few training images, the model memorizes specific examples instead of learning general patterns, leading to poor performance on new data.'
    },
    {
      id: '2',
      question: 'Why is it important to have diverse training images?',
      options: [
        'To make the dataset look better',
        'To slow down training',
        'To help the model generalize to different scenarios',
        'To increase file size'
      ],
      correctAnswer: 2,
      explanation: 'Diverse training data helps the model learn robust features that work across different lighting, angles, and conditions.'
    },
    {
      id: '3',
      question: 'What does training accuracy measure?',
      options: [
        'How fast the model trains',
        'How well the model performs on training data',
        'The size of the dataset',
        'The number of epochs'
      ],
      correctAnswer: 1,
      explanation: 'Training accuracy shows how well the model correctly classifies images it has seen during training.'
    }
  ],
  text_classification: [
    {
      id: '1',
      question: 'What is the minimum number of text samples recommended per category?',
      options: [
        '5 samples',
        '10 samples',
        '20 samples',
        '100 samples'
      ],
      correctAnswer: 2,
      explanation: 'At least 20 samples per category helps the model learn meaningful patterns without overfitting.'
    },
    {
      id: '2',
      question: 'Why should training data be balanced across categories?',
      options: [
        'To make the dataset smaller',
        'To prevent bias toward overrepresented categories',
        'To speed up training',
        'To reduce accuracy'
      ],
      correctAnswer: 1,
      explanation: 'Balanced datasets ensure the model learns all categories equally well, preventing bias toward categories with more examples.'
    },
    {
      id: '3',
      question: 'What happens during the training process?',
      options: [
        'The model memorizes all text samples',
        'The model learns patterns in word usage and context',
        'The model deletes incorrect samples',
        'The model creates new text'
      ],
      correctAnswer: 1,
      explanation: 'During training, the model learns to identify patterns and relationships in the text that distinguish different categories.'
    }
  ],
  regression: [
    {
      id: '1',
      question: 'What does a regression model predict?',
      options: [
        'Categories or labels',
        'True or false',
        'Numerical values',
        'Images'
      ],
      correctAnswer: 2,
      explanation: 'Regression models predict continuous numerical values, such as prices, temperatures, or quantities.'
    },
    {
      id: '2',
      question: 'Why do we need at least 50 data points for regression?',
      options: [
        'To make training slower',
        'To ensure the model can learn meaningful relationships',
        'To increase file size',
        'To reduce accuracy'
      ],
      correctAnswer: 1,
      explanation: 'More data points help the model identify true relationships between features and target values, reducing the impact of outliers.'
    },
    {
      id: '3',
      question: 'What does the loss metric indicate during training?',
      options: [
        'How many data points were lost',
        'How far predictions are from actual values',
        'The training speed',
        'The dataset size'
      ],
      correctAnswer: 1,
      explanation: 'Loss measures the difference between predicted and actual values. Lower loss indicates better predictions.'
    }
  ]
};

export const simulations = {
  badData: {
    title: 'Training with Bad Data',
    description: 'See what happens when you train with low-quality or mislabeled data',
    scenarios: [
      {
        condition: 'Mislabeled images',
        result: 'Model learns incorrect patterns and makes wrong predictions',
        impact: 'Accuracy drops significantly'
      },
      {
        condition: 'Blurry or low-quality images',
        result: 'Model struggles to identify features',
        impact: 'Poor generalization to new data'
      },
      {
        condition: 'Inconsistent data format',
        result: 'Training becomes unstable',
        impact: 'Model fails to converge'
      }
    ]
  },
  insufficientData: {
    title: 'Training with Insufficient Data',
    description: 'Understand why more data leads to better models',
    scenarios: [
      {
        condition: 'Only 5 training samples',
        result: 'Model memorizes examples instead of learning patterns',
        impact: 'Overfitting - high training accuracy, low test accuracy'
      },
      {
        condition: '50 training samples',
        result: 'Model starts to learn general patterns',
        impact: 'Moderate performance on new data'
      },
      {
        condition: '500+ training samples',
        result: 'Model learns robust features',
        impact: 'Good generalization and high test accuracy'
      }
    ]
  }
};
