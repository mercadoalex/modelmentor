import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface HelpTip {
  id: string;
  title: string;
  content: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PageHelp {
  route: string;
  tips: HelpTip[];
}

interface ContextualHelpContextType {
  currentHelp: HelpTip[];
  showHelp: boolean;
  dismissedTips: Set<string>;
  openHelp: () => void;
  closeHelp: () => void;
  dismissTip: (tipId: string, permanent?: boolean) => void;
  resetDismissed: () => void;
}

const ContextualHelpContext = createContext<ContextualHelpContextType | undefined>(undefined);

// Help content configuration for different pages
const helpContent: PageHelp[] = [
  {
    route: '/',
    tips: [
      {
        id: 'project-description',
        title: 'Describe Your Project',
        content: 'Start by describing what you want your AI to do in plain language. For example: "I want to train an AI to classify images of cats and dogs." The more specific you are, the better!',
        priority: 'high'
      },
      {
        id: 'example-projects',
        title: 'Use Example Projects',
        content: 'Scroll down to see example projects from various sources. Click the copy icon to use any example as a starting point for your own project.',
        priority: 'medium'
      },
      {
        id: 'analyze-button',
        title: 'Analyze Your Project',
        content: 'After describing your project, click "Analyze Project" to let ModelMentor determine the best model type and guide you through the next steps.',
        priority: 'high'
      }
    ]
  },
  {
    route: '/project/:projectId/data-collection',
    tips: [
      {
        id: 'data-upload',
        title: 'Upload Your Data',
        content: 'Upload a CSV file with your training data. Each row should be an example, and columns should contain features and labels. Make sure your data is clean and well-formatted.',
        priority: 'high'
      },
      {
        id: 'data-quality',
        title: 'Data Quality Matters',
        content: 'The quality of your data directly affects model performance. Aim for at least 100 examples per category, and ensure your data is balanced and representative.',
        priority: 'medium'
      },
      {
        id: 'data-preview',
        title: 'Preview Your Data',
        content: 'Review the data preview to ensure it loaded correctly. Check for missing values, incorrect types, or formatting issues before proceeding.',
        priority: 'medium'
      }
    ]
  },
  {
    route: '/project/:projectId/learning',
    tips: [
      {
        id: 'interactive-lessons',
        title: 'Interactive Learning',
        content: 'This section provides interactive lessons to help you understand ML concepts. Take your time to explore each concept before moving to training.',
        priority: 'high'
      },
      {
        id: 'quiz-system',
        title: 'Test Your Knowledge',
        content: 'Complete quizzes to test your understanding. You can retake quizzes as many times as needed. Earning points helps track your progress!',
        priority: 'medium'
      },
      {
        id: 'concept-visualizer',
        title: 'Visual Learning',
        content: 'Use the concept visualizer to see how ML algorithms work. Visual representations make complex concepts easier to understand.',
        priority: 'low'
      }
    ]
  },
  {
    route: '/project/:projectId/training',
    tips: [
      {
        id: 'training-process',
        title: 'Training Your Model',
        content: 'Click "Start Training" to begin. The model will learn patterns from your data. This may take a few moments depending on data size and complexity.',
        priority: 'high'
      },
      {
        id: 'hyperparameters',
        title: 'Adjust Settings',
        content: 'You can adjust hyperparameters like learning rate and epochs. Start with defaults if you\'re unsure - you can always retrain with different settings.',
        priority: 'medium'
      },
      {
        id: 'training-metrics',
        title: 'Monitor Progress',
        content: 'Watch the training metrics in real-time. Loss should decrease and accuracy should increase. If not, you may need to adjust your data or settings.',
        priority: 'high'
      }
    ]
  },
  {
    route: '/project/:projectId/testing',
    tips: [
      {
        id: 'model-evaluation',
        title: 'Evaluate Your Model',
        content: 'Test your model with new data to see how well it performs. Good accuracy on test data means your model generalizes well.',
        priority: 'high'
      },
      {
        id: 'confusion-matrix',
        title: 'Understanding Results',
        content: 'The confusion matrix shows where your model makes mistakes. Use this to identify which categories need more training data or better features.',
        priority: 'medium'
      },
      {
        id: 'predictions',
        title: 'Make Predictions',
        content: 'Try making predictions with your own inputs. This is the fun part - see your AI in action!',
        priority: 'medium'
      }
    ]
  },
  {
    route: '/project/:projectId/debugging',
    tips: [
      {
        id: 'debugging-tools',
        title: 'Debug Your Model',
        content: 'Use debugging tools to understand why your model makes certain predictions. This helps improve model performance and trust.',
        priority: 'high'
      },
      {
        id: 'feature-importance',
        title: 'Feature Analysis',
        content: 'Check which features are most important for predictions. This helps you understand what your model learned and identify potential issues.',
        priority: 'medium'
      }
    ]
  },
  {
    route: '/project/:projectId/export',
    tips: [
      {
        id: 'export-model',
        title: 'Export Your Model',
        content: 'Export your trained model to use in other applications. You can download it as a file or get code snippets for integration.',
        priority: 'high'
      },
      {
        id: 'share-project',
        title: 'Share Your Work',
        content: 'Share your project with others to showcase your work or collaborate. You can generate a shareable link or export a report.',
        priority: 'medium'
      }
    ]
  },
  {
    route: '/badges',
    tips: [
      {
        id: 'achievement-system',
        title: 'Earn Badges',
        content: 'Complete projects, quizzes, and challenges to earn badges. Badges track your learning progress and unlock new features.',
        priority: 'medium'
      },
      {
        id: 'badge-categories',
        title: 'Badge Categories',
        content: 'Badges are organized by category: Learning, Projects, Collaboration, and Mastery. Try to collect them all!',
        priority: 'low'
      }
    ]
  },
  {
    route: '/progress',
    tips: [
      {
        id: 'track-progress',
        title: 'Track Your Learning',
        content: 'View your learning progress, completed projects, quiz scores, and earned badges. Use this to identify areas for improvement.',
        priority: 'medium'
      },
      {
        id: 'learning-path',
        title: 'Follow Your Path',
        content: 'Your learning path shows recommended next steps based on your progress. Follow it to build skills systematically.',
        priority: 'low'
      }
    ]
  },
  {
    route: '/dashboard',
    tips: [
      {
        id: 'teacher-dashboard',
        title: 'Teacher Dashboard',
        content: 'Monitor student progress, view submissions, and manage your classes. Use filters to find specific students or assignments.',
        priority: 'high'
      },
      {
        id: 'student-insights',
        title: 'Student Insights',
        content: 'Click on any student to see detailed progress, quiz scores, and project history. Identify students who need extra help.',
        priority: 'medium'
      }
    ]
  },
  {
    route: '/kaggle-datasets',
    tips: [
      {
        id: 'dataset-browser',
        title: 'Browse Datasets',
        content: 'Explore curated datasets from Kaggle and other sources. Each dataset includes a description, size, and difficulty level.',
        priority: 'medium'
      },
      {
        id: 'dataset-connection',
        title: 'Connect Datasets',
        content: 'Click "Connection Guide" to learn how to download and prepare a dataset for your project. Follow the step-by-step instructions.',
        priority: 'high'
      }
    ]
  }
];

export function ContextualHelpProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [currentHelp, setCurrentHelp] = useState<HelpTip[]>([]);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('modelmentor_dismissed_tips');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Update current help based on route
  useEffect(() => {
    const matchRoute = (pattern: string, path: string): boolean => {
      // Convert route pattern to regex (simple implementation)
      const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(path);
    };

    const pageHelp = helpContent.find(help => matchRoute(help.route, location.pathname));
    if (pageHelp) {
      // Filter out dismissed tips and sort by priority
      const availableTips = pageHelp.tips
        .filter(tip => !dismissedTips.has(tip.id))
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      setCurrentHelp(availableTips);
    } else {
      setCurrentHelp([]);
    }
  }, [location.pathname, dismissedTips]);

  const openHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  const closeHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  const dismissTip = useCallback((tipId: string, permanent = false) => {
    if (permanent) {
      const newDismissed = new Set(dismissedTips);
      newDismissed.add(tipId);
      setDismissedTips(newDismissed);
      localStorage.setItem('modelmentor_dismissed_tips', JSON.stringify([...newDismissed]));
    }
    // Remove from current help
    setCurrentHelp(prev => prev.filter(tip => tip.id !== tipId));
  }, [dismissedTips]);

  const resetDismissed = useCallback(() => {
    setDismissedTips(new Set());
    localStorage.removeItem('modelmentor_dismissed_tips');
  }, []);

  return (
    <ContextualHelpContext.Provider
      value={{
        currentHelp,
        showHelp,
        dismissedTips,
        openHelp,
        closeHelp,
        dismissTip,
        resetDismissed,
      }}
    >
      {children}
    </ContextualHelpContext.Provider>
  );
}

export function useContextualHelp() {
  const context = useContext(ContextualHelpContext);
  if (context === undefined) {
    throw new Error('useContextualHelp must be used within a ContextualHelpProvider');
  }
  return context;
}
