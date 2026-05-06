export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation: string;
}

export interface TutorialQuiz {
  tutorialId: string;
  title: string;
  description: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export const tutorialQuizzes: Record<string, TutorialQuiz> = {
  'dashboard-tour': {
    tutorialId: 'dashboard-tour',
    title: 'Dashboard Tour Quiz',
    description: 'Test your understanding of the ModelMentor dashboard',
    passingScore: 70,
    questions: [
      {
        id: 'dt-q1',
        question: 'Where do you click to create a new ML project?',
        options: [
          'The settings menu',
          'The create project button',
          'The help menu',
          'The profile icon',
        ],
        correctAnswer: 1,
        explanation: 'The create project button is prominently displayed on the dashboard to start new ML projects.',
      },
      {
        id: 'dt-q2',
        question: 'What information can you see in the quick stats section?',
        options: [
          'Only your username',
          'Total projects, completed projects, and training hours',
          'Just the current date',
          'Your email address',
        ],
        correctAnswer: 1,
        explanation: 'The quick stats section shows your total projects, completed projects, and training hours to track your progress.',
      },
      {
        id: 'dt-q3',
        question: 'Where can you access tutorials and help?',
        options: [
          'Only through email support',
          'The help menu',
          'By calling customer service',
          'Tutorials are not available',
        ],
        correctAnswer: 1,
        explanation: 'The help menu provides access to tutorials, documentation, and support anytime you need assistance.',
      },
    ],
  },

  'project-creation': {
    tutorialId: 'project-creation',
    title: 'Project Creation Quiz',
    description: 'Test your knowledge of creating ML projects',
    passingScore: 70,
    questions: [
      {
        id: 'pc-q1',
        question: 'What should you do first when creating a new project?',
        options: [
          'Upload data immediately',
          'Give your project a descriptive name',
          'Start training',
          'Export the model',
        ],
        correctAnswer: 1,
        explanation: 'Naming your project first helps you organize and identify it later. A descriptive name explains what you want to build.',
      },
      {
        id: 'pc-q2',
        question: 'Which of these is a valid model type in ModelMentor?',
        options: [
          'Image Classification',
          'Video Editing',
          'Audio Mixing',
          'Document Printing',
        ],
        correctAnswer: 0,
        explanation: 'ModelMentor supports Image Classification, Text Classification, and Regression model types.',
      },
      {
        id: 'pc-q3',
        question: 'Why is it important to describe your project goal clearly?',
        options: [
          'It\'s not important',
          'To help the system understand what you want to build',
          'Just for decoration',
          'Only teachers need to do this',
        ],
        correctAnswer: 1,
        explanation: 'A clear description helps ModelMentor understand your goals and guide you through the appropriate workflow.',
      },
      {
        id: 'pc-q4',
        question: 'After creating a project, what is the next step?',
        options: [
          'Delete the project',
          'Upload or select training data',
          'Export the model',
          'Close the browser',
        ],
        correctAnswer: 1,
        explanation: 'After creating a project, the next step is to upload or select training data for your model.',
      },
    ],
  },

  'data-upload': {
    tutorialId: 'data-upload',
    title: 'Data Upload Quiz',
    description: 'Test your understanding of data preparation and upload',
    passingScore: 70,
    questions: [
      {
        id: 'du-q1',
        question: 'What file format is typically used for uploading training data?',
        options: [
          'PDF',
          'CSV',
          'MP3',
          'EXE',
        ],
        correctAnswer: 1,
        explanation: 'CSV (Comma-Separated Values) files are the standard format for uploading structured training data.',
      },
      {
        id: 'du-q2',
        question: 'What are "features" in machine learning?',
        options: [
          'The output you want to predict',
          'The input data used for predictions',
          'The name of the model',
          'The training time',
        ],
        correctAnswer: 1,
        explanation: 'Features are the input columns in your data that the model uses to make predictions.',
      },
      {
        id: 'du-q3',
        question: 'What is a "label" in machine learning?',
        options: [
          'The name of your project',
          'The output column you want to predict',
          'The file name',
          'The model type',
        ],
        correctAnswer: 1,
        explanation: 'The label is the output column that contains the values you want your model to predict.',
      },
      {
        id: 'du-q4',
        question: 'Why is it important to preview your data before training?',
        options: [
          'It\'s not important',
          'To verify the data looks correct and columns are properly formatted',
          'Just to waste time',
          'Only for advanced users',
        ],
        correctAnswer: 1,
        explanation: 'Previewing data helps you catch errors early and ensure your columns are correctly formatted before training.',
      },
    ],
  },

  'model-training': {
    tutorialId: 'model-training',
    title: 'Model Training Quiz',
    description: 'Test your knowledge of the training process',
    passingScore: 70,
    questions: [
      {
        id: 'mt-q1',
        question: 'What does "epoch" mean in machine learning?',
        options: [
          'The name of the model',
          'One complete pass through the entire training dataset',
          'The number of features',
          'The file size',
        ],
        correctAnswer: 1,
        explanation: 'An epoch is one complete pass through the entire training dataset. More epochs allow the model to learn better.',
      },
      {
        id: 'mt-q2',
        question: 'What does "loss" indicate during training?',
        options: [
          'How much money you spent',
          'How wrong the model\'s predictions are',
          'The number of errors in your code',
          'The training time',
        ],
        correctAnswer: 1,
        explanation: 'Loss measures how wrong the model\'s predictions are. Lower loss means better performance.',
      },
      {
        id: 'mt-q3',
        question: 'What does "accuracy" represent?',
        options: [
          'The speed of training',
          'The percentage of correct predictions',
          'The file size',
          'The number of epochs',
        ],
        correctAnswer: 1,
        explanation: 'Accuracy is the percentage of predictions that the model gets correct. Higher accuracy is better.',
      },
      {
        id: 'mt-q4',
        question: 'Why should you monitor training metrics in real-time?',
        options: [
          'It\'s not necessary',
          'To ensure the model is learning properly and catch issues early',
          'Just for fun',
          'Only teachers need to do this',
        ],
        correctAnswer: 1,
        explanation: 'Monitoring metrics helps you ensure the model is learning properly and allows you to catch and fix issues early.',
      },
      {
        id: 'mt-q5',
        question: 'What should you do if the loss is not decreasing?',
        options: [
          'Ignore it and continue',
          'Check your data and adjust hyperparameters',
          'Delete the project',
          'Nothing can be done',
        ],
        correctAnswer: 1,
        explanation: 'If loss isn\'t decreasing, you should check your data quality and try adjusting hyperparameters like learning rate.',
      },
    ],
  },

  'model-testing': {
    tutorialId: 'model-testing',
    title: 'Model Testing Quiz',
    description: 'Test your understanding of model evaluation',
    passingScore: 70,
    questions: [
      {
        id: 'mtest-q1',
        question: 'What is the purpose of testing a trained model?',
        options: [
          'To delete it',
          'To evaluate its performance on new data',
          'To make it slower',
          'Testing is not necessary',
        ],
        correctAnswer: 1,
        explanation: 'Testing evaluates how well your model performs on new, unseen data to ensure it generalizes well.',
      },
      {
        id: 'mtest-q2',
        question: 'What does "confidence score" indicate?',
        options: [
          'The training time',
          'How certain the model is about its prediction',
          'The file size',
          'The number of features',
        ],
        correctAnswer: 1,
        explanation: 'Confidence score shows how certain the model is about its prediction. Higher confidence means more certainty.',
      },
      {
        id: 'mtest-q3',
        question: 'What is a confusion matrix used for?',
        options: [
          'To confuse users',
          'To visualize which classes the model predicts correctly and incorrectly',
          'To train the model',
          'To upload data',
        ],
        correctAnswer: 1,
        explanation: 'A confusion matrix shows which classes your model predicts correctly and where it makes mistakes.',
      },
      {
        id: 'mtest-q4',
        question: 'What is batch testing?',
        options: [
          'Testing one sample at a time',
          'Testing multiple samples at once from a CSV file',
          'Deleting test data',
          'Training the model again',
        ],
        correctAnswer: 1,
        explanation: 'Batch testing allows you to test multiple samples at once by uploading a CSV file with test data.',
      },
    ],
  },
};

export function getQuizForTutorial(tutorialId: string): TutorialQuiz | undefined {
  return tutorialQuizzes[tutorialId];
}

export function getAllQuizzes(): TutorialQuiz[] {
  return Object.values(tutorialQuizzes);
}
