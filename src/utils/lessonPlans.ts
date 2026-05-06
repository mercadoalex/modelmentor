export interface LessonPlanSection {
  title: string;
  content: string[];
}

export interface LessonPlan {
  id: string;
  modelType: string;
  title: string;
  gradeLevel: string;
  duration: string;
  overview: string;
  learningObjectives: string[];
  materials: string[];
  vocabulary: { term: string; definition: string }[];
  teachingSteps: {
    step: string;
    duration: string;
    instructions: string[];
    discussionPrompts: string[];
  }[];
  assessmentCriteria: {
    category: string;
    criteria: string[];
  }[];
  extensionActivities: string[];
  troubleshooting: { issue: string; solution: string }[];
}

export const lessonPlans: LessonPlan[] = [
  {
    id: 'image-classification',
    modelType: 'Image Classification',
    title: 'Introduction to Image Classification with AI',
    gradeLevel: 'Grades 9-12',
    duration: '90 minutes',
    overview: 'Students will learn the fundamentals of image classification by training an AI model to recognize and categorize images. Through hands-on experience, they will understand how machines learn to identify patterns in visual data.',
    learningObjectives: [
      'Understand the concept of image classification and its real-world applications',
      'Identify the key components of a machine learning workflow',
      'Collect and organize training data for an image classification task',
      'Train a basic image classification model and interpret results',
      'Evaluate model performance using accuracy metrics',
      'Apply critical thinking to improve model performance'
    ],
    materials: [
      'Computer with internet access for each student or pair',
      'ModelMentor platform access',
      'Sample images or student-collected images for training',
      'Projector for demonstrations',
      'Handout: ML Vocabulary Reference Sheet',
      'Handout: Model Evaluation Checklist'
    ],
    vocabulary: [
      { term: 'Classification', definition: 'The process of categorizing data into predefined groups or classes' },
      { term: 'Training Data', definition: 'Examples used to teach the AI model to recognize patterns' },
      { term: 'Model', definition: 'A mathematical representation that learns patterns from data' },
      { term: 'Accuracy', definition: 'The percentage of correct predictions made by the model' },
      { term: 'Epoch', definition: 'One complete pass through the entire training dataset' },
      { term: 'Overfitting', definition: 'When a model learns training data too well and performs poorly on new data' },
      { term: 'Prediction', definition: 'The output or classification that the model assigns to new data' },
      { term: 'Confidence Score', definition: 'A percentage indicating how certain the model is about its prediction' }
    ],
    teachingSteps: [
      {
        step: 'Introduction and Hook',
        duration: '10 minutes',
        instructions: [
          'Begin with a real-world example: Show students how their phones recognize faces in photos',
          'Ask: "How does your phone know which photos have your friend in them?"',
          'Introduce the concept that computers can learn to recognize patterns in images',
          'Preview the lesson: Students will train their own AI to classify images'
        ],
        discussionPrompts: [
          'What are some other examples where computers classify images?',
          'How do you think a computer "sees" an image differently than we do?',
          'What might be challenging about teaching a computer to recognize objects?'
        ]
      },
      {
        step: 'Project Description',
        duration: '15 minutes',
        instructions: [
          'Guide students to the Project Creation page',
          'Demonstrate how to describe an ML project in plain language',
          'Show example projects and discuss different classification tasks',
          'Have students brainstorm and write their own project descriptions',
          'Encourage creativity while ensuring projects are achievable'
        ],
        discussionPrompts: [
          'What makes a good classification project?',
          'How many categories should your project have?',
          'What kinds of images will you need to collect?'
        ]
      },
      {
        step: 'Data Collection',
        duration: '20 minutes',
        instructions: [
          'Explain the importance of quality training data',
          'Demonstrate how to upload images or select sample datasets',
          'Discuss the minimum data requirements (10 images per class)',
          'Guide students through organizing their data by category',
          'Emphasize the need for diverse, representative examples'
        ],
        discussionPrompts: [
          'Why do we need multiple examples of each category?',
          'What happens if all our training images look too similar?',
          'How might biased training data affect the model?'
        ]
      },
      {
        step: 'Interactive Learning Module',
        duration: '15 minutes',
        instructions: [
          'Have students complete the interactive learning activities',
          'Pause to discuss key concepts as they appear',
          'Review quiz questions as a class',
          'Discuss the simulations showing bad data scenarios',
          'Connect concepts to real-world AI applications'
        ],
        discussionPrompts: [
          'What did you learn from the bad data simulation?',
          'Why is it important to understand these concepts before training?',
          'How do these concepts apply to AI systems you use daily?'
        ]
      },
      {
        step: 'Model Training',
        duration: '15 minutes',
        instructions: [
          'Explain what happens during training',
          'Demonstrate how to start the training process',
          'Have students observe the accuracy and loss curves',
          'Discuss what the metrics mean in real-time',
          'Encourage students to predict how their model will perform'
        ],
        discussionPrompts: [
          'What do you notice about the accuracy curve?',
          'Why does the loss decrease over time?',
          'When do you think the model has learned enough?'
        ]
      },
      {
        step: 'Testing and Evaluation',
        duration: '10 minutes',
        instructions: [
          'Guide students to test their models with new images',
          'Demonstrate how to interpret confidence scores',
          'Show the confusion matrix and explain its meaning',
          'Have students identify where their model performs well and poorly',
          'Discuss strategies for improvement'
        ],
        discussionPrompts: [
          'Which categories does your model classify best?',
          'Where does it make mistakes?',
          'What could you do to improve the model?'
        ]
      },
      {
        step: 'Reflection and Sharing',
        duration: '5 minutes',
        instructions: [
          'Have students export and share their models',
          'Facilitate peer testing of models',
          'Lead a class discussion on lessons learned',
          'Connect the activity to broader AI ethics and applications'
        ],
        discussionPrompts: [
          'What surprised you about training an AI model?',
          'How could this type of AI be used responsibly?',
          'What are potential concerns with image classification AI?'
        ]
      }
    ],
    assessmentCriteria: [
      {
        category: 'Understanding of Concepts',
        criteria: [
          'Student can explain what image classification is',
          'Student understands the role of training data',
          'Student can interpret accuracy metrics',
          'Student recognizes the importance of data quality'
        ]
      },
      {
        category: 'Technical Skills',
        criteria: [
          'Student successfully describes a classification project',
          'Student collects appropriate training data',
          'Student trains a model and monitors progress',
          'Student tests the model and interprets results'
        ]
      },
      {
        category: 'Critical Thinking',
        criteria: [
          'Student identifies model strengths and weaknesses',
          'Student proposes improvements to model performance',
          'Student considers ethical implications of AI',
          'Student makes connections to real-world applications'
        ]
      }
    ],
    extensionActivities: [
      'Challenge students to improve their model by collecting more diverse training data',
      'Have students research and present on real-world image classification applications',
      'Explore bias in AI by intentionally creating biased training datasets',
      'Compare model performance across different student projects',
      'Investigate how image classification is used in accessibility technology'
    ],
    troubleshooting: [
      {
        issue: 'Student model has low accuracy',
        solution: 'Check if training data is diverse and representative. Ensure minimum data requirements are met. Verify images are clear and properly labeled.'
      },
      {
        issue: 'Student confused about metrics',
        solution: 'Use concrete examples. Compare to test scores (accuracy = percentage correct). Draw parallels to familiar concepts.'
      },
      {
        issue: 'Student data collection taking too long',
        solution: 'Suggest using sample datasets for first attempt. Encourage simpler projects with fewer categories.'
      },
      {
        issue: 'Student frustrated with model mistakes',
        solution: 'Emphasize that mistakes are learning opportunities. Discuss how even human experts make errors. Focus on the learning process.'
      }
    ]
  },
  {
    id: 'text-classification',
    modelType: 'Text Classification',
    title: 'Understanding Text Classification and Sentiment Analysis',
    gradeLevel: 'Grades 9-12',
    duration: '90 minutes',
    overview: 'Students will explore how AI can understand and categorize text by training a text classification model. They will learn about natural language processing and apply it to real-world scenarios like sentiment analysis.',
    learningObjectives: [
      'Understand how computers process and analyze text data',
      'Identify applications of text classification in daily life',
      'Collect and prepare text data for machine learning',
      'Train a text classification model and evaluate its performance',
      'Recognize patterns in how language conveys meaning',
      'Consider ethical implications of automated text analysis'
    ],
    materials: [
      'Computer with internet access for each student or pair',
      'ModelMentor platform access',
      'Sample text data or student-collected text samples',
      'Projector for demonstrations',
      'Handout: Text Classification Examples',
      'Handout: Sentiment Analysis Guide'
    ],
    vocabulary: [
      { term: 'Natural Language Processing', definition: 'The field of AI focused on enabling computers to understand human language' },
      { term: 'Sentiment', definition: 'The emotional tone or attitude expressed in text' },
      { term: 'Text Classification', definition: 'Automatically categorizing text into predefined groups' },
      { term: 'Training Sample', definition: 'An example text with its correct category label' },
      { term: 'Feature', definition: 'A characteristic of the text that helps the model make predictions' },
      { term: 'Spam Detection', definition: 'Identifying unwanted or malicious messages automatically' },
      { term: 'False Positive', definition: 'When the model incorrectly predicts a positive class' },
      { term: 'False Negative', definition: 'When the model incorrectly predicts a negative class' }
    ],
    teachingSteps: [
      {
        step: 'Introduction and Real-World Context',
        duration: '10 minutes',
        instructions: [
          'Start with familiar examples: email spam filters, review ratings, social media content moderation',
          'Ask students to share experiences with automated text systems',
          'Introduce the concept that computers can learn to understand text meaning',
          'Preview the lesson objectives'
        ],
        discussionPrompts: [
          'How does your email know which messages are spam?',
          'Have you noticed AI analyzing sentiment in reviews or comments?',
          'What challenges might a computer face in understanding text?'
        ]
      },
      {
        step: 'Project Planning',
        duration: '15 minutes',
        instructions: [
          'Guide students through describing a text classification project',
          'Show examples: sentiment analysis, spam detection, topic categorization',
          'Discuss what makes text data different from image data',
          'Have students choose or create their project description',
          'Encourage projects relevant to student interests'
        ],
        discussionPrompts: [
          'What types of text classification would be useful in your life?',
          'How is analyzing text different from analyzing images?',
          'What categories make sense for your project?'
        ]
      },
      {
        step: 'Data Collection and Preparation',
        duration: '20 minutes',
        instructions: [
          'Explain the importance of representative text samples',
          'Demonstrate data collection methods',
          'Discuss minimum requirements (20 samples per category)',
          'Guide students in organizing their text data',
          'Address data quality and diversity'
        ],
        discussionPrompts: [
          'Why do we need examples from each category?',
          'How might the way people write affect the model?',
          'What makes a good training example?'
        ]
      },
      {
        step: 'Learning Module Completion',
        duration: '15 minutes',
        instructions: [
          'Have students work through interactive learning activities',
          'Discuss NLP concepts as they arise',
          'Review quiz responses together',
          'Analyze simulations about data quality',
          'Connect to real-world text analysis systems'
        ],
        discussionPrompts: [
          'How does the computer "read" text?',
          'What patterns help identify sentiment?',
          'Why is context important in text analysis?'
        ]
      },
      {
        step: 'Model Training and Observation',
        duration: '15 minutes',
        instructions: [
          'Explain the training process for text models',
          'Have students start training',
          'Monitor and discuss the metrics together',
          'Encourage prediction of model performance',
          'Discuss what the model is learning'
        ],
        discussionPrompts: [
          'What patterns is the model learning?',
          'How does accuracy change over time?',
          'What words or phrases might be most important?'
        ]
      },
      {
        step: 'Testing and Analysis',
        duration: '10 minutes',
        instructions: [
          'Guide students to test with new text samples',
          'Demonstrate interpretation of predictions',
          'Analyze where the model succeeds and fails',
          'Discuss the confusion matrix',
          'Identify improvement opportunities'
        ],
        discussionPrompts: [
          'Which types of text does your model classify well?',
          'Where does it struggle?',
          'What could improve the model?'
        ]
      },
      {
        step: 'Reflection and Ethics Discussion',
        duration: '5 minutes',
        instructions: [
          'Facilitate sharing of results',
          'Lead discussion on AI ethics in text analysis',
          'Address privacy and bias concerns',
          'Connect to responsible AI use',
          'Summarize key learnings'
        ],
        discussionPrompts: [
          'What are the benefits of automated text classification?',
          'What are potential risks or concerns?',
          'How can we ensure fair and ethical use of this technology?'
        ]
      }
    ],
    assessmentCriteria: [
      {
        category: 'Conceptual Understanding',
        criteria: [
          'Student explains text classification and its applications',
          'Student understands how computers process text',
          'Student recognizes the role of training data',
          'Student can interpret model predictions'
        ]
      },
      {
        category: 'Practical Application',
        criteria: [
          'Student successfully collects appropriate text data',
          'Student trains a functional text classification model',
          'Student tests and evaluates model performance',
          'Student identifies model limitations'
        ]
      },
      {
        category: 'Critical Analysis',
        criteria: [
          'Student considers ethical implications',
          'Student recognizes potential biases',
          'Student proposes improvements',
          'Student connects to real-world applications'
        ]
      }
    ],
    extensionActivities: [
      'Analyze bias by training models on different text sources',
      'Research how social media platforms use text classification',
      'Create a project analyzing news article topics',
      'Explore multilingual text classification challenges',
      'Investigate how text classification aids accessibility'
    ],
    troubleshooting: [
      {
        issue: 'Model confuses similar categories',
        solution: 'Discuss the importance of distinct categories. Help students refine their categories or collect more distinctive examples.'
      },
      {
        issue: 'Student struggles to collect text data',
        solution: 'Suggest using sample datasets initially. Provide examples of where to find appropriate text data.'
      },
      {
        issue: 'Student questions why model makes certain predictions',
        solution: 'Discuss how models identify patterns in word usage. Explain that models learn associations, not true understanding.'
      },
      {
        issue: 'Concerns about privacy in text analysis',
        solution: 'Validate concerns and discuss responsible data use. Emphasize using public or anonymized data.'
      }
    ]
  },
  {
    id: 'regression',
    modelType: 'Regression',
    title: 'Predictive Modeling with Regression',
    gradeLevel: 'Grades 10-12',
    duration: '90 minutes',
    overview: 'Students will learn how AI can predict numerical values by training a regression model. They will understand the relationship between input features and predicted outcomes through hands-on experience.',
    learningObjectives: [
      'Understand the concept of regression and prediction',
      'Identify relationships between variables in data',
      'Collect and organize numerical data for regression',
      'Train a regression model and interpret predictions',
      'Evaluate model performance using error metrics',
      'Apply regression concepts to real-world scenarios'
    ],
    materials: [
      'Computer with internet access for each student or pair',
      'ModelMentor platform access',
      'Sample datasets or student-collected numerical data',
      'Projector for demonstrations',
      'Handout: Regression Concepts Guide',
      'Handout: Data Analysis Worksheet'
    ],
    vocabulary: [
      { term: 'Regression', definition: 'A method for predicting continuous numerical values' },
      { term: 'Feature', definition: 'An input variable used to make predictions' },
      { term: 'Target Variable', definition: 'The numerical value we want to predict' },
      { term: 'Correlation', definition: 'A relationship between two variables' },
      { term: 'Error', definition: 'The difference between predicted and actual values' },
      { term: 'Mean Squared Error', definition: 'A metric measuring average prediction error' },
      { term: 'Trend', definition: 'A general pattern or direction in data' },
      { term: 'Outlier', definition: 'A data point that differs significantly from others' }
    ],
    teachingSteps: [
      {
        step: 'Introduction to Prediction',
        duration: '10 minutes',
        instructions: [
          'Begin with relatable examples: predicting test scores, weather forecasts, housing prices',
          'Ask students about predictions they make in daily life',
          'Introduce regression as mathematical prediction',
          'Preview the lesson activities'
        ],
        discussionPrompts: [
          'What factors help you predict outcomes in your life?',
          'How do weather apps predict temperature?',
          'What makes a prediction accurate or inaccurate?'
        ]
      },
      {
        step: 'Project Design',
        duration: '15 minutes',
        instructions: [
          'Guide students in describing a regression project',
          'Show examples: price prediction, score forecasting, trend analysis',
          'Discuss what makes a good regression problem',
          'Help students identify input features and target variables',
          'Encourage projects with clear relationships'
        ],
        discussionPrompts: [
          'What numerical values would be interesting to predict?',
          'What information would help make accurate predictions?',
          'How do different factors influence the outcome?'
        ]
      },
      {
        step: 'Data Collection',
        duration: '20 minutes',
        instructions: [
          'Explain the structure of regression data',
          'Demonstrate CSV format and data organization',
          'Discuss minimum requirements (50 data points)',
          'Guide students in collecting or selecting data',
          'Emphasize the importance of complete, accurate data'
        ],
        discussionPrompts: [
          'Why do we need many data points for regression?',
          'How do missing values affect predictions?',
          'What patterns do you notice in the data?'
        ]
      },
      {
        step: 'Interactive Learning',
        duration: '15 minutes',
        instructions: [
          'Have students complete learning activities',
          'Discuss regression concepts as they appear',
          'Review mathematical relationships',
          'Analyze simulations about data quality',
          'Connect to real-world prediction systems'
        ],
        discussionPrompts: [
          'How does the model learn relationships?',
          'What happens with insufficient data?',
          'Why is data quality critical for predictions?'
        ]
      },
      {
        step: 'Model Training',
        duration: '15 minutes',
        instructions: [
          'Explain the regression training process',
          'Have students start training their models',
          'Monitor error metrics together',
          'Discuss what decreasing error means',
          'Encourage observation of learning patterns'
        ],
        discussionPrompts: [
          'How does error change during training?',
          'What does it mean when error stops decreasing?',
          'How accurate do you expect your predictions to be?'
        ]
      },
      {
        step: 'Testing and Evaluation',
        duration: '10 minutes',
        instructions: [
          'Guide students to test with new data points',
          'Demonstrate interpretation of predictions',
          'Compare predicted vs. actual values',
          'Analyze prediction accuracy',
          'Discuss factors affecting performance'
        ],
        discussionPrompts: [
          'How close are the predictions to actual values?',
          'Where does the model perform best?',
          'What could improve prediction accuracy?'
        ]
      },
      {
        step: 'Application and Reflection',
        duration: '5 minutes',
        instructions: [
          'Have students share their models',
          'Discuss real-world applications of regression',
          'Address limitations and responsible use',
          'Summarize key concepts',
          'Connect to future learning'
        ],
        discussionPrompts: [
          'Where is regression used in the real world?',
          'What are the limitations of predictive models?',
          'How can predictions be used responsibly?'
        ]
      }
    ],
    assessmentCriteria: [
      {
        category: 'Understanding',
        criteria: [
          'Student explains regression and prediction',
          'Student identifies features and target variables',
          'Student understands error metrics',
          'Student recognizes data relationships'
        ]
      },
      {
        category: 'Application',
        criteria: [
          'Student collects appropriate numerical data',
          'Student trains a functional regression model',
          'Student tests and interprets predictions',
          'Student evaluates model performance'
        ]
      },
      {
        category: 'Analysis',
        criteria: [
          'Student identifies model strengths and weaknesses',
          'Student proposes improvements',
          'Student considers real-world applications',
          'Student recognizes limitations'
        ]
      }
    ],
    extensionActivities: [
      'Compare predictions across different student models',
      'Research how regression is used in scientific research',
      'Explore the impact of outliers on predictions',
      'Investigate multiple regression with many features',
      'Analyze how regression aids in climate modeling'
    ],
    troubleshooting: [
      {
        issue: 'Model predictions are inaccurate',
        solution: 'Check data quality and quantity. Ensure features are relevant to the target. Discuss realistic expectations for prediction accuracy.'
      },
      {
        issue: 'Student confused about features vs. target',
        solution: 'Use concrete examples. Features are "what we know," target is "what we want to predict." Draw diagrams showing relationships.'
      },
      {
        issue: 'Data collection is challenging',
        solution: 'Suggest using sample datasets initially. Provide examples of accessible data sources. Simplify the project scope.'
      },
      {
        issue: 'Student frustrated with error metrics',
        solution: 'Explain that all predictions have error. Focus on relative improvement. Use familiar analogies like margin of error in polls.'
      }
    ]
  }
];

export const getTeacherNotes = (pageType: string, modelType?: string): string[] => {
  const notes: Record<string, string[]> = {
    'project-creation': [
      'Encourage students to think creatively but realistically about their projects',
      'Help students understand the difference between classification and regression',
      'Emphasize that simpler projects often lead to better learning outcomes',
      'Allow time for students to explore example projects before committing'
    ],
    'data-collection': [
      'Stress the importance of data quality over quantity',
      'Discuss real-world data collection challenges and ethics',
      'Help students understand why diverse, representative data matters',
      'Monitor that students meet minimum data requirements before proceeding'
    ],
    'learning': [
      'Pause frequently to check for understanding',
      'Encourage students to discuss quiz questions with partners',
      'Use simulations as teaching moments about data quality',
      'Connect concepts to students\' prior knowledge'
    ],
    'training': [
      'Help students interpret the training visualizations',
      'Discuss what "learning" means for a machine',
      'Address misconceptions about AI and machine learning',
      'Encourage patience as training progresses'
    ],
    'testing': [
      'Guide students to think critically about model performance',
      'Discuss why models make mistakes',
      'Help students identify patterns in errors',
      'Encourage iterative improvement thinking'
    ],
    'export': [
      'Facilitate peer sharing and feedback',
      'Lead discussion on responsible AI deployment',
      'Help students articulate what they learned',
      'Connect the activity to broader AI literacy goals'
    ]
  };

  return notes[pageType] || [];
};
