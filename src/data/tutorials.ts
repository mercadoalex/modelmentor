import type { TourStep } from '@/components/onboarding/InteractiveTour';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  steps: TourStep[];
  category: 'getting-started' | 'workflow' | 'advanced' | 'ml-concepts' | 'real-world';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  prerequisites?: string[];
}

export const tutorials: Record<string, Tutorial> = {
  'dashboard-tour': {
    id: 'dashboard-tour',
    title: 'Dashboard Tour',
    description: 'Learn how to navigate your dashboard and access key features',
    estimatedTime: '2 min',
    category: 'getting-started',
    difficulty: 'beginner',
    tags: ['navigation', 'dashboard', 'basics'],
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
    difficulty: 'beginner',
    tags: ['project', 'setup', 'basics'],
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
    difficulty: 'beginner',
    tags: ['data', 'upload', 'csv'],
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
    difficulty: 'beginner',
    tags: ['training', 'epochs', 'accuracy'],
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
    difficulty: 'beginner',
    tags: ['testing', 'evaluation', 'predictions'],
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
    difficulty: 'beginner',
    tags: ['shortcuts', 'productivity'],
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

  // ─── ML CONCEPTS ─────────────────────────────────────────────────

  'what-is-ml': {
    id: 'what-is-ml',
    title: 'What is Machine Learning?',
    description: 'A beginner-friendly introduction to ML concepts with visual examples',
    estimatedTime: '5 min',
    category: 'ml-concepts',
    difficulty: 'beginner',
    tags: ['ml basics', 'introduction', 'concepts'],
    steps: [
      {
        target: 'body',
        title: '🤖 What is Machine Learning?',
        description: 'Machine Learning is teaching computers to learn from examples — just like how you learned to recognize a dog by seeing many dogs, not by reading a rulebook.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📊 Three Types of ML',
        description: '1. Supervised Learning — learn from labeled examples (e.g. spam/not spam). 2. Unsupervised Learning — find patterns without labels. 3. Reinforcement Learning — learn by trial and error.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🔄 The ML Workflow',
        description: 'Every ML project follows the same steps: Collect Data → Clean Data → Train Model → Evaluate → Deploy. ModelMentor guides you through each step!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🎯 What Can ML Do?',
        description: 'Real-world uses: detect cancer in X-rays, translate languages, recommend movies, predict stock prices, recognize faces, self-driving cars, and much more!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '✅ You\'re Ready!',
        description: 'Now you understand what ML is. Try creating your first project to put this into practice!',
        placement: 'bottom',
      },
    ],
  },

  'understanding-overfitting': {
    id: 'understanding-overfitting',
    title: 'Overfitting vs Underfitting',
    description: 'Learn why your model might fail and how to fix it',
    estimatedTime: '6 min',
    category: 'ml-concepts',
    difficulty: 'intermediate',
    tags: ['overfitting', 'underfitting', 'bias', 'variance'],
    prerequisites: ['what-is-ml'],
    steps: [
      {
        target: 'body',
        title: '😰 What is Overfitting?',
        description: 'Imagine studying ONLY past exam questions word-for-word. You\'d ace those exact questions but fail any new ones. That\'s overfitting — your model memorizes training data instead of learning general patterns.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📉 Signs of Overfitting',
        description: 'Training accuracy: 99% ✅ — Test accuracy: 60% ❌. When there\'s a big gap between training and test accuracy, your model is overfitting.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '😴 What is Underfitting?',
        description: 'Now imagine barely studying at all. You\'d fail both the practice and real exam. Underfitting means your model is too simple to learn anything useful.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📈 Signs of Underfitting',
        description: 'Training accuracy: 55% ❌ — Test accuracy: 53% ❌. Both scores are low, meaning the model hasn\'t learned much at all.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🎯 Finding the Sweet Spot',
        description: 'The goal is a model that generalizes well. Fix overfitting: add more data, use dropout, reduce complexity. Fix underfitting: train longer, add more layers, add more features.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="training-metrics"]',
        title: '👀 Watch This in Your Project',
        description: 'In your Training page, watch the training vs validation accuracy curves. They should both rise and stay close together.',
        placement: 'bottom',
      },
    ],
  },

  'understanding-loss': {
    id: 'understanding-loss',
    title: 'What is Loss? (And Why It Matters)',
    description: 'Understand what loss means and how to interpret it during training',
    estimatedTime: '5 min',
    category: 'ml-concepts',
    difficulty: 'beginner',
    tags: ['loss', 'training', 'metrics'],
    prerequisites: ['what-is-ml'],
    steps: [
      {
        target: 'body',
        title: '🎯 What is Loss?',
        description: 'Loss measures how wrong your model is. Think of it like a score in a game — but you want it to go DOWN, not up. A loss of 0 means perfect predictions.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📉 Loss Going Down = Good!',
        description: 'As your model trains, loss should decrease each epoch. This means the model is learning and making fewer mistakes.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '⚠️ Loss Not Going Down?',
        description: 'If loss stays flat or goes up, something is wrong! Common causes: learning rate too high, not enough data, wrong model type, or bad data quality.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📊 Loss vs Accuracy',
        description: 'Loss and accuracy are related but different. Accuracy = % of correct predictions. Loss = how confident and correct the predictions are. Both matter!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🔍 Types of Loss',
        description: 'Classification uses Cross-Entropy Loss. Regression uses Mean Squared Error (MSE). ModelMentor picks the right one automatically for your project type.',
        placement: 'bottom',
      },
    ],
  },

  'feature-engineering-basics': {
    id: 'feature-engineering-basics',
    title: 'Feature Engineering Basics',
    description: 'Learn how to prepare and transform your data for better model performance',
    estimatedTime: '7 min',
    category: 'ml-concepts',
    difficulty: 'intermediate',
    tags: ['features', 'data prep', 'engineering'],
    prerequisites: ['what-is-ml', 'data-upload'],
    steps: [
      {
        target: 'body',
        title: '🔧 What is Feature Engineering?',
        description: 'Features are the inputs your model learns from. Feature engineering means creating, selecting, and transforming these inputs to help your model learn better.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🗑️ Removing Useless Features',
        description: 'Not all columns help your model. A customer\'s ID number tells the model nothing useful. Remove columns that have no relationship to your prediction goal.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🔢 Handling Categories',
        description: 'Models need numbers, not text. Convert categories like "red/blue/green" into numbers using One-Hot Encoding: red=[1,0,0], blue=[0,1,0], green=[0,0,1].',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📏 Normalization',
        description: 'Features on different scales confuse models. Age (0-100) and salary (0-100,000) need to be normalized to the same range, like 0-1.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '❓ Handling Missing Data',
        description: 'Missing values are common. Options: remove rows with missing data, fill with average (mean), fill with most common (mode), or use ML to predict missing values.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '✨ Creating New Features',
        description: 'Sometimes combining features creates better signals. Example: from "birth year" create "age". From "price" and "quantity" create "total revenue".',
        placement: 'bottom',
      },
      {
        target: '[data-tour="upload-area"]',
        title: '🚀 Try It!',
        description: 'Go to your Data Collection page and explore the Feature Engineering panel to apply these techniques to your own data!',
        placement: 'bottom',
      },
    ],
  },

  'confusion-matrix-explained': {
    id: 'confusion-matrix-explained',
    title: 'Reading a Confusion Matrix',
    description: 'Understand what your confusion matrix tells you about model performance',
    estimatedTime: '6 min',
    category: 'ml-concepts',
    difficulty: 'intermediate',
    tags: ['confusion matrix', 'evaluation', 'metrics'],
    prerequisites: ['model-testing'],
    steps: [
      {
        target: 'body',
        title: '🟦 What is a Confusion Matrix?',
        description: 'A confusion matrix shows exactly where your model gets confused. Each row = actual class, each column = predicted class. Diagonal = correct predictions!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '✅ True Positives (TP)',
        description: 'Top-left cell: Model predicted "Cat" and it WAS a cat. These are correct positive predictions. You want this number HIGH.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '❌ False Positives (FP)',
        description: 'Model predicted "Cat" but it was actually "Dog". Also called Type I Error. This is a false alarm.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '❌ False Negatives (FN)',
        description: 'Model predicted "Dog" but it was actually a "Cat". Also called Type II Error. This is a missed detection.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📊 Precision vs Recall',
        description: 'Precision = of all "Cat" predictions, how many were actually cats? Recall = of all actual cats, how many did we find? Spam filters need high precision. Cancer detection needs high recall.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="confusion-matrix"]',
        title: '👀 Find It in Your Project',
        description: 'After testing your model, scroll to the Confusion Matrix section. Look at the diagonal — brighter = more correct predictions!',
        placement: 'top',
      },
    ],
  },

  'hyperparameter-tuning': {
    id: 'hyperparameter-tuning',
    title: 'Hyperparameter Tuning',
    description: 'Learn how to tune learning rate, epochs, and batch size for better results',
    estimatedTime: '8 min',
    category: 'ml-concepts',
    difficulty: 'intermediate',
    tags: ['hyperparameters', 'learning rate', 'epochs', 'tuning'],
    prerequisites: ['model-training'],
    steps: [
      {
        target: 'body',
        title: '🎛️ What Are Hyperparameters?',
        description: 'Hyperparameters are settings YOU control before training. Unlike model weights (learned automatically), you set these manually. The right settings can dramatically improve your model!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '⚡ Learning Rate',
        description: 'How big of steps the model takes when learning. Too high (0.1): model overshoots and never converges. Too low (0.00001): model learns too slowly. Sweet spot: 0.001-0.01.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🔄 Epochs',
        description: 'How many times the model sees ALL the training data. Too few: model hasn\'t learned enough. Too many: model starts overfitting. Watch the validation loss to find the right number.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📦 Batch Size',
        description: 'How many samples the model processes at once. Small batch (8-32): more stable learning, slower. Large batch (256-512): faster training, sometimes less accurate. Try 32 as a starting point.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🔍 How to Tune',
        description: 'Start with defaults → Train → Check validation metrics → Adjust one thing at a time → Retrain → Compare. Never change multiple things at once!',
        placement: 'bottom',
      },
      {
        target: '[data-tour="training-config"]',
        title: '🎯 Try It Now',
        description: 'Go to your Training page and experiment with different hyperparameter values. Start with the "Balanced" preset and adjust from there.',
        placement: 'right',
      },
    ],
  },

  // ─── REAL WORLD PROJECTS ─────────────────────────────────────────

  'sentiment-analysis-project': {
    id: 'sentiment-analysis-project',
    title: 'Build a Sentiment Analyzer',
    description: 'Real-world project: classify movie reviews as positive or negative',
    estimatedTime: '15 min',
    category: 'real-world',
    difficulty: 'beginner',
    tags: ['nlp', 'text', 'sentiment', 'real-world'],
    prerequisites: ['what-is-ml', 'data-upload'],
    steps: [
      {
        target: 'body',
        title: '🎬 Project: Movie Review Sentiment',
        description: 'You\'ll build a model that reads movie reviews and predicts if they\'re positive or negative. This is used by Netflix, IMDB, and Amazon every day!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📊 Your Dataset',
        description: 'You\'ll use movie reviews with labels: 1 = Positive, 0 = Negative. Example: "This movie was amazing!" → Positive. "Worst film ever" → Negative.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="create-project-button"]',
        title: '📁 Step 1: Create Project',
        description: 'Create a new project. Select "Text Classification" as the model type. Name it "Movie Sentiment Analyzer".',
        placement: 'bottom',
      },
      {
        target: '[data-tour="upload-area"]',
        title: '📤 Step 2: Upload Data',
        description: 'Upload a CSV with two columns: "review" (the text) and "sentiment" (0 or 1). You can find free movie review datasets on Kaggle!',
        placement: 'bottom',
      },
      {
        target: '[data-tour="training-config"]',
        title: '⚙️ Step 3: Configure Training',
        description: 'Use these settings: Epochs=20, Learning Rate=0.001, Batch Size=32. These work well for text classification tasks.',
        placement: 'right',
      },
      {
        target: '[data-tour="start-training"]',
        title: '🚀 Step 4: Train!',
        description: 'Click Start Training. You should see accuracy climb above 80% for a good sentiment model.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="test-input"]',
        title: '🧪 Step 5: Test It',
        description: 'Test with your own reviews! Try: "This was the best movie I\'ve ever seen" and "Complete waste of time".',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🎉 Real-World Applications',
        description: 'Congrats! You just built what companies use to analyze customer reviews, social media, and support tickets. This exact technique powers brand monitoring tools!',
        placement: 'bottom',
      },
    ],
  },

  'spam-detector-project': {
    id: 'spam-detector-project',
    title: 'Build a Spam Detector',
    description: 'Real-world project: detect spam emails using text classification',
    estimatedTime: '15 min',
    category: 'real-world',
    difficulty: 'beginner',
    tags: ['nlp', 'text', 'spam', 'classification', 'real-world'],
    prerequisites: ['what-is-ml'],
    steps: [
      {
        target: 'body',
        title: '📧 Project: Email Spam Detector',
        description: 'Build a model that detects spam emails! Gmail, Outlook, and every email provider uses exactly this kind of model. It\'s one of the most classic ML problems.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🔍 How It Works',
        description: 'Spam emails have patterns: "FREE MONEY!!!", "Click here NOW", excessive caps, lots of exclamation marks. Your model learns these patterns from thousands of examples.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="create-project-button"]',
        title: '📁 Step 1: Create Project',
        description: 'Create a new "Text Classification" project. Name it "Email Spam Detector". Set output classes to "spam" and "not_spam".',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📊 Step 2: Get Data',
        description: 'Go to Kaggle Datasets and search "SMS Spam Collection". It has 5,572 labeled messages — perfect for training!',
        placement: 'bottom',
      },
      {
        target: '[data-tour="training-config"]',
        title: '⚙️ Step 3: Train',
        description: 'For spam detection you want HIGH PRECISION — avoid false positives (marking real emails as spam is worse than missing some spam). Watch your precision metric!',
        placement: 'right',
      },
      {
        target: 'body',
        title: '🎯 Real-World Insight',
        description: 'Did you know? Gmail processes 100 billion emails per day and blocks ~100 million spam emails. Your model could be the foundation of something like that!',
        placement: 'bottom',
      },
    ],
  },

  'house-price-prediction': {
    id: 'house-price-prediction',
    title: 'Predict House Prices',
    description: 'Real-world project: predict house prices using regression',
    estimatedTime: '20 min',
    category: 'real-world',
    difficulty: 'intermediate',
    tags: ['regression', 'real estate', 'prediction', 'real-world'],
    prerequisites: ['what-is-ml', 'feature-engineering-basics'],
    steps: [
      {
        target: 'body',
        title: '🏠 Project: House Price Prediction',
        description: 'Predict house prices based on features like size, location, bedrooms, etc. Zillow and Redfin use this exact technique to power their "Zestimate" tool!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📊 Key Features',
        description: 'Important features for house prices: square footage, number of bedrooms/bathrooms, location, age of house, garage, school district rating.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="create-project-button"]',
        title: '📁 Step 1: Create Project',
        description: 'Create a new "Regression" project. Name it "House Price Predictor". Your output will be a number (price in $).',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📥 Step 2: Get Data',
        description: 'Search Kaggle for "House Prices - Advanced Regression Techniques". It\'s one of the most popular ML datasets with 79 features!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🔧 Step 3: Feature Engineering',
        description: 'Key transformations: log-transform the price (it\'s skewed), encode neighborhood as categories, create "total_sqft" by combining all area columns.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="training-config"]',
        title: '⚙️ Step 4: Train',
        description: 'For regression, watch the RMSE (Root Mean Squared Error) metric instead of accuracy. Lower RMSE = better predictions.',
        placement: 'right',
      },
      {
        target: 'body',
        title: '🎯 Real-World Insight',
        description: 'A good model achieves RMSE under $30,000. Professional models at Zillow achieve ~$20,000 RMSE. Can you beat them?',
        placement: 'bottom',
      },
    ],
  },

  'image-classifier-project': {
    id: 'image-classifier-project',
    title: 'Build an Image Classifier',
    description: 'Real-world project: classify images into categories',
    estimatedTime: '20 min',
    category: 'real-world',
    difficulty: 'intermediate',
    tags: ['image', 'classification', 'computer vision', 'real-world'],
    prerequisites: ['what-is-ml'],
    steps: [
      {
        target: 'body',
        title: '📷 Project: Image Classifier',
        description: 'Build a model that recognizes objects in images! This is the foundation of Google Lens, Face ID, medical imaging AI, and self-driving cars.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🔍 How Image Classification Works',
        description: 'Images are broken into pixels → pixels become numbers → model finds patterns in those numbers → patterns match to categories. A cat image always has certain pixel patterns!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📊 Choosing Your Categories',
        description: 'Start simple: 2-3 categories. Example: "cats vs dogs", "hotdog vs not hotdog", "damaged vs undamaged parts". More categories = harder problem.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="create-project-button"]',
        title: '📁 Step 1: Create Project',
        description: 'Create an "Image Classification" project. Plan for at least 50+ images per class for decent results.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📸 Step 2: Collect Images',
        description: 'Use Google Images, Kaggle, or your own photos. Make sure images are diverse — different angles, lighting, backgrounds. Variety = better model!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '⚙️ Step 3: Data Augmentation',
        description: 'Trick: flip, rotate, and zoom your images to create more training data without taking more photos. This dramatically improves accuracy!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🎯 Real-World Insight',
        description: 'Google\'s image classifier was trained on 1.2 million images. You can get surprisingly good results with just 200-300 images using modern transfer learning techniques!',
        placement: 'bottom',
      },
    ],
  },

  // ─── ADVANCED ────────────────────────────────────────────────────

  'debugging-training': {
    id: 'debugging-training',
    title: 'Debugging Training Failures',
    description: 'Why did training fail? Learn to diagnose and fix common training problems',
    estimatedTime: '10 min',
    category: 'advanced',
    difficulty: 'advanced',
    tags: ['debugging', 'errors', 'training', 'troubleshooting'],
    prerequisites: ['model-training', 'understanding-loss'],
    steps: [
      {
        target: 'body',
        title: '🔴 Training Failed — Now What?',
        description: 'Don\'t panic! Training failures are normal and fixable. The key is to read the error message and loss curve carefully. Every failure tells you something.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📉 Loss is NaN or Exploding',
        description: 'Cause: Learning rate too high. Fix: Reduce learning rate by 10x (e.g. 0.01 → 0.001). Also check for missing/infinite values in your data.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📊 Loss Stuck (Not Decreasing)',
        description: 'Causes: Learning rate too low, not enough data, wrong model type, or features with no signal. Try: increase learning rate, add more data, or check feature relevance.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📈 Validation Loss Going Up',
        description: 'Classic overfitting! Your model is memorizing training data. Fix: Add dropout, reduce model complexity, add more training data, or use early stopping.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🔢 Accuracy Stuck at Random Chance',
        description: 'If accuracy = 50% for binary classification and never improves, your model isn\'t learning. Check: is your data balanced? Are labels correct? Are features meaningful?',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '💥 Out of Memory Error',
        description: 'Reduce batch size (e.g. 256 → 32), reduce image resolution, or use a simpler model. Memory errors mean you\'re asking too much from the hardware.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="training-logs"]',
        title: '🔍 Use the Logs',
        description: 'Always check the Training Logs tab. The exact error message and epoch where things went wrong will be there. ModelMentor also shows plain-English explanations!',
        placement: 'top',
      },
    ],
  },

  'model-deployment': {
    id: 'model-deployment',
    title: 'Deploying Your Model',
    description: 'Learn how to share and deploy your trained model to the real world',
    estimatedTime: '8 min',
    category: 'advanced',
    difficulty: 'advanced',
    tags: ['deployment', 'export', 'production', 'sharing'],
    prerequisites: ['model-testing'],
    steps: [
      {
        target: 'body',
        title: '🚀 What is Deployment?',
        description: 'Deployment means making your model available for real use — on a website, app, or API. Training is just the beginning. The real value comes when others can use your model!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📦 Export Formats',
        description: 'Models can be exported as: TensorFlow SavedModel (for Python apps), TensorFlow.js (for web apps), ONNX (cross-platform), or TFLite (for mobile apps).',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🌐 REST API Deployment',
        description: 'The most common approach: wrap your model in a Flask or FastAPI server. Other apps can send data to your API and get predictions back in milliseconds.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📱 Mobile Deployment',
        description: 'Using TFLite, your model can run directly on a phone — no internet required! This is how Snapchat filters and Google Translate offline mode work.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '⚠️ Production Checklist',
        description: 'Before deploying: ✅ Test edge cases, ✅ Check for bias, ✅ Set up monitoring, ✅ Plan for model drift, ✅ Have a rollback plan.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="export-results"]',
        title: '📤 Export in ModelMentor',
        description: 'Go to the Export page to download your model and get deployment instructions. You can also share a demo link directly from ModelMentor!',
        placement: 'left',
      },
    ],
  },

  'transfer-learning': {
    id: 'transfer-learning',
    title: 'Transfer Learning',
    description: 'Use pre-trained models to get great results with less data',
    estimatedTime: '8 min',
    category: 'advanced',
    difficulty: 'advanced',
    tags: ['transfer learning', 'pretrained', 'fine-tuning'],
    prerequisites: ['model-training', 'what-is-ml'],
    steps: [
      {
        target: 'body',
        title: '🧠 What is Transfer Learning?',
        description: 'Instead of training from scratch, you start with a model already trained on millions of examples. Like hiring an expert photographer to learn your specific style — they already know the basics!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '⚡ Why It\'s Powerful',
        description: 'Without transfer learning: need 100,000+ images, train for days. WITH transfer learning: get great results with 100-200 images, train in minutes!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🏗️ How It Works',
        description: 'Step 1: Load a pre-trained model (e.g. ResNet trained on ImageNet). Step 2: Remove the last layer. Step 3: Add your own output layer. Step 4: Fine-tune on your data.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🎯 When to Use It',
        description: 'Use transfer learning when: you have limited data (< 10,000 samples), your problem is similar to an existing model\'s training task, or you need fast results.',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '📚 Popular Base Models',
        description: 'Images: ResNet, VGG, EfficientNet, MobileNet. Text: BERT, GPT, RoBERTa. These are trained on billions of examples and freely available!',
        placement: 'bottom',
      },
      {
        target: 'body',
        title: '🚀 Try It',
        description: 'In ModelMentor\'s Training page, look for the "Transfer Learning" option to use pre-trained models as your starting point.',
        placement: 'bottom',
      },
    ],
  },
};

export const tutorialCategories = [
  {
    id: 'getting-started',
    title: '🚀 Getting Started',
    description: 'Essential tutorials for new users',
  },
  {
    id: 'workflow',
    title: '🔄 ML Workflow',
    description: 'Learn each step of the ML process',
  },
  {
    id: 'ml-concepts',
    title: '🧠 ML Concepts',
    description: 'Deep dive into machine learning theory with visual examples',
  },
  {
    id: 'real-world',
    title: '🌍 Real-World Projects',
    description: 'Build real projects used by top tech companies',
  },
  {
    id: 'advanced',
    title: '⚡ Advanced',
    description: 'Power user tips, debugging, and deployment',
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