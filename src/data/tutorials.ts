import type { TourStep } from '@/components/onboarding/InteractiveTour';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  steps: TourStep[];
  category: 'getting-started' | 'workflow' | 'advanced';
}

export const tutorials: Record<string, Tutorial> = {
  'dashboard-tour': {
    id: 'dashboard-tour',
    title: 'Dashboard Tour',
    description: 'Learn how to navigate your dashboard and access key features',
    estimatedTime: '2 min',
    category: 'getting-started',
    steps: [
      {
        target: '[data-tour="create-project-button"]',
        title: 'Create Your First Project',
        description: 'Click here to start a new ML project. You can create projects for image classification, text classification, or regression tasks.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="projects-list"]',
        title: 'Your Projects',
        description: 'All your projects are listed here. You can see their status, progress, and quickly access them.',
        placement: 'top',
      },
      {
        target: '[data-tour="stats-cards"]',
        title: 'Quick Stats',
        description: 'Track your progress with these stats: total projects, completed projects, and training hours.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="recent-activity"]',
        title: 'Recent Activity',
        description: 'See your latest actions and stay updated on your learning journey.',
        placement: 'top',
      },
      {
        target: '[data-tour="help-menu"]',
        title: 'Need Help?',
        description: 'Access tutorials, documentation, and support anytime from the help menu.',
        placement: 'left',
      },
    ],
  },

  'project-creation': {
    id: 'project-creation',
    title: 'Creating a Project',
    description: 'Step-by-step guide to creating your first ML project',
    estimatedTime: '3 min',
    category: 'workflow',
    steps: [
      {
        target: '[data-tour="project-title"]',
        title: 'Name Your Project',
        description: 'Give your project a descriptive name that explains what you want to build.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="model-type"]',
        title: 'Choose Model Type',
        description: 'Select the type of ML model: Image Classification, Text Classification, or Regression.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="project-description"]',
        title: 'Describe Your Goal',
        description: 'Explain what you want your model to do in plain language. Be specific about inputs and outputs.',
        placement: 'top',
      },
      {
        target: '[data-tour="create-button"]',
        title: 'Create Project',
        description: 'Click here to create your project and move to the next step: uploading data.',
        placement: 'bottom',
      },
    ],
  },

  'data-upload': {
    id: 'data-upload',
    title: 'Uploading Training Data',
    description: 'Learn how to prepare and upload data for training',
    estimatedTime: '3 min',
    category: 'workflow',
    steps: [
      {
        target: '[data-tour="upload-area"]',
        title: 'Upload Your Data',
        description: 'Drag and drop your CSV file or click to browse. Your data should have features (inputs) and labels (outputs).',
        placement: 'bottom',
      },
      {
        target: '[data-tour="data-preview"]',
        title: 'Preview Your Data',
        description: 'Review your uploaded data to ensure it looks correct. Check column names and sample values.',
        placement: 'top',
      },
      {
        target: '[data-tour="column-mapping"]',
        title: 'Map Columns',
        description: 'Tell us which columns are features (inputs) and which is the label (output to predict).',
        placement: 'bottom',
      },
      {
        target: '[data-tour="continue-button"]',
        title: 'Continue to Learning',
        description: 'Once your data is ready, proceed to learn about ML concepts before training.',
        placement: 'bottom',
      },
    ],
  },

  'model-training': {
    id: 'model-training',
    title: 'Training Your Model',
    description: 'Understand the training process and configuration options',
    estimatedTime: '4 min',
    category: 'workflow',
    steps: [
      {
        target: '[data-tour="training-config"]',
        title: 'Configure Training',
        description: 'Adjust hyperparameters like epochs, batch size, and learning rate. Use presets if you\'re unsure.',
        placement: 'right',
      },
      {
        target: '[data-tour="start-training"]',
        title: 'Start Training',
        description: 'Click here to begin training. Your model will learn patterns from your data.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="training-metrics"]',
        title: 'Monitor Progress',
        description: 'Watch real-time metrics like loss and accuracy. Lower loss and higher accuracy mean better performance.',
        placement: 'left',
      },
      {
        target: '[data-tour="training-logs"]',
        title: 'Training Logs',
        description: 'Detailed logs show what\'s happening at each stage. Use these for debugging if something goes wrong.',
        placement: 'top',
      },
      {
        target: '[data-tour="training-chart"]',
        title: 'Performance Chart',
        description: 'Visualize how your model improves over time. The chart shows accuracy and loss for each epoch.',
        placement: 'top',
      },
    ],
  },

  'model-testing': {
    id: 'model-testing',
    title: 'Testing Your Model',
    description: 'Learn how to test and evaluate your trained model',
    estimatedTime: '3 min',
    category: 'workflow',
    steps: [
      {
        target: '[data-tour="test-tabs"]',
        title: 'Testing Options',
        description: 'Choose between single predictions (test one sample) or batch testing (test multiple samples from CSV).',
        placement: 'bottom',
      },
      {
        target: '[data-tour="test-input"]',
        title: 'Enter Test Data',
        description: 'Provide input data to test your model. For text classification, enter text. For images, upload an image.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="prediction-results"]',
        title: 'View Predictions',
        description: 'See your model\'s predictions with confidence scores. Higher confidence means the model is more certain.',
        placement: 'top',
      },
      {
        target: '[data-tour="confusion-matrix"]',
        title: 'Confusion Matrix',
        description: 'Understand which classes your model predicts well and where it makes mistakes.',
        placement: 'top',
      },
      {
        target: '[data-tour="export-results"]',
        title: 'Export Results',
        description: 'Download test results as PDF for your records or to share with others.',
        placement: 'left',
      },
    ],
  },

  'keyboard-shortcuts': {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow with keyboard shortcuts',
    estimatedTime: '2 min',
    category: 'advanced',
    steps: [
      {
        target: 'body',
        title: 'Keyboard Shortcuts',
        description: 'Press Ctrl+K (Cmd+K on Mac) to open the command palette and quickly navigate anywhere.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: 'Quick Actions',
        description: 'Press N to create a new project, T to start training, or ? to view all shortcuts.',
        placement: 'bottom',
      },
    ],
  },
};

export const tutorialCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Essential tutorials for new users',
  },
  {
    id: 'workflow',
    title: 'ML Workflow',
    description: 'Learn each step of the ML process',
  },
  {
    id: 'advanced',
    title: 'Advanced Features',
    description: 'Power user tips and tricks',
  },
];

export function getTutorial(id: string): Tutorial | undefined {
  return tutorials[id];
}

export function getTutorialsByCategory(category: string): Tutorial[] {
  return Object.values(tutorials).filter(t => t.category === category);
}

export function getAllTutorials(): Tutorial[] {
  return Object.values(tutorials);
}
