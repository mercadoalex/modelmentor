/**
 * Quiz Service
 * Manages quizzes, questions, answers, and student progress
 */

import { supabase } from '@/lib/supabase';

export type QuestionType = 'multiple_choice' | 'true_false' | 'matching' | 'fill_blank' | 'scenario';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  hint?: string;
  visualAid?: string;
  matchingPairs?: { term: string; definition: string }[];
}

export interface QuizAttempt {
  questionId: string;
  answer: string | string[];
  correct: boolean;
  timeSpent: number;
  hintsUsed: number;
  timestamp: Date;
}

export interface QuizProgress {
  topic: string;
  questionsAttempted: number;
  questionsCorrect: number;
  averageTime: number;
  lastAttempt: Date;
  masteryLevel: number; // 0-100
  needsReview: boolean;
}

export interface StudentQuizData {
  attempts: QuizAttempt[];
  progress: { [topic: string]: QuizProgress };
  totalPoints: number;
  streakDays: number;
  achievements: string[];
}

// Legacy type for tutorial quizzes
export interface TutorialQuizResult {
  userId: string;
  tutorialId: string;
  answers: { [key: string]: string };
  timeTaken: number;
  timestamp: Date;
  score?: number;
  passed?: boolean;
  time_taken?: number;
}

class QuizService {
  private readonly STORAGE_KEY = 'modelmentor_quiz_data';

  /**
   * Get all quiz questions
   */
  getAllQuestions(): QuizQuestion[] {
    return [
      // Neural Network Questions
      {
        id: 'nn_basics_1',
        type: 'multiple_choice',
        topic: 'neural_networks',
        difficulty: 'beginner',
        question: 'What is a neural network inspired by?',
        options: [
          'The human brain',
          'Computer circuits',
          'Mathematical equations',
          'Tree structures'
        ],
        correctAnswer: 'The human brain',
        explanation: 'Neural networks are inspired by how neurons in the human brain connect and process information. Each artificial neuron mimics a biological neuron!',
        hint: 'Think about biology - what processes information in living things?'
      },
      {
        id: 'nn_basics_2',
        type: 'true_false',
        topic: 'neural_networks',
        difficulty: 'beginner',
        question: 'A neural network with more layers is always better.',
        correctAnswer: 'false',
        explanation: 'False! More layers can lead to overfitting and make training harder. The right number of layers depends on your problem. Sometimes simpler is better!',
        hint: 'Remember the concept of overfitting - can a model be too complex?'
      },
      {
        id: 'nn_activation_1',
        type: 'multiple_choice',
        topic: 'neural_networks',
        difficulty: 'intermediate',
        question: 'What does the ReLU activation function do?',
        options: [
          'Returns 0 for negative inputs, keeps positive inputs unchanged',
          'Squashes all values between 0 and 1',
          'Returns -1 for negative, +1 for positive',
          'Multiplies the input by 2'
        ],
        correctAnswer: 'Returns 0 for negative inputs, keeps positive inputs unchanged',
        explanation: 'ReLU (Rectified Linear Unit) is simple: if input is negative, output 0. If positive, output the same value. It\'s like a one-way gate!',
        hint: 'ReLU stands for Rectified Linear Unit - it "rectifies" by removing negatives.'
      },
      {
        id: 'nn_matching_1',
        type: 'matching',
        topic: 'neural_networks',
        difficulty: 'beginner',
        question: 'Match each neural network component to its description:',
        matchingPairs: [
          { term: 'Input Layer', definition: 'Receives the initial data' },
          { term: 'Hidden Layer', definition: 'Processes information between input and output' },
          { term: 'Output Layer', definition: 'Produces the final prediction' },
          { term: 'Weights', definition: 'Control the strength of connections' }
        ],
        correctAnswer: [],
        explanation: 'Each part of a neural network has a specific job! Input receives data, hidden layers process it, output gives results, and weights control how information flows.'
      },

      // Decision Boundary Questions
      {
        id: 'db_basics_1',
        type: 'multiple_choice',
        topic: 'decision_boundary',
        difficulty: 'beginner',
        question: 'What is a decision boundary?',
        options: [
          'A line or curve that separates different classes',
          'The edge of your training data',
          'The maximum accuracy you can achieve',
          'A type of neural network'
        ],
        correctAnswer: 'A line or curve that separates different classes',
        explanation: 'A decision boundary is like drawing a line to separate different groups! It helps your AI decide which class a new data point belongs to.',
        hint: 'Think about separating red and blue points - what would you draw between them?'
      },
      {
        id: 'db_complexity_1',
        type: 'scenario',
        topic: 'decision_boundary',
        difficulty: 'intermediate',
        question: 'You have data that forms two circles - one inside the other. What type of decision boundary would work best?',
        options: [
          'A straight line',
          'A curved/circular boundary',
          'Multiple straight lines',
          'No boundary needed'
        ],
        correctAnswer: 'A curved/circular boundary',
        explanation: 'For circular patterns, you need a curved boundary! A straight line can\'t separate circles. This is why we sometimes need more complex models.',
        visualAid: 'circular_pattern',
        hint: 'Can a straight line separate two circles? What shape would you need?'
      },
      {
        id: 'db_overfitting_1',
        type: 'true_false',
        topic: 'decision_boundary',
        difficulty: 'intermediate',
        question: 'A very wiggly decision boundary that perfectly fits all training points is always the best choice.',
        correctAnswer: 'false',
        explanation: 'False! A super wiggly boundary might be overfitting - memorizing noise instead of learning patterns. It won\'t work well on new data!',
        hint: 'Remember overfitting - is memorizing every detail always good?'
      },

      // Gradient Descent Questions
      {
        id: 'gd_basics_1',
        type: 'multiple_choice',
        topic: 'gradient_descent',
        difficulty: 'beginner',
        question: 'What is gradient descent trying to find?',
        options: [
          'The lowest point (minimum loss)',
          'The highest point (maximum accuracy)',
          'The middle point',
          'A random point'
        ],
        correctAnswer: 'The lowest point (minimum loss)',
        explanation: 'Gradient descent is like walking downhill to find the valley (lowest point). Lower loss means better predictions!',
        hint: 'Think of walking down a mountain - where are you trying to go?'
      },
      {
        id: 'gd_lr_1',
        type: 'scenario',
        topic: 'gradient_descent',
        difficulty: 'intermediate',
        question: 'Your model is bouncing around and never settling down. What\'s likely the problem?',
        options: [
          'Learning rate is too high',
          'Learning rate is too low',
          'Not enough data',
          'Too many layers'
        ],
        correctAnswer: 'Learning rate is too high',
        explanation: 'When learning rate is too high, your model takes huge steps and overshoots the minimum, bouncing around like a ball! Try a smaller learning rate.',
        hint: 'If you\'re taking giant steps, you might jump over the target!'
      },
      {
        id: 'gd_momentum_1',
        type: 'fill_blank',
        topic: 'gradient_descent',
        difficulty: 'advanced',
        question: 'Momentum helps gradient descent by remembering _____ steps and using that information to smooth out the path.',
        correctAnswer: 'previous',
        explanation: 'Momentum remembers previous steps! It\'s like a ball rolling downhill - it builds up speed and can push through small bumps.',
        hint: 'What does momentum mean in physics? It involves memory of motion.'
      },

      // Overfitting Questions
      {
        id: 'of_basics_1',
        type: 'multiple_choice',
        topic: 'overfitting',
        difficulty: 'beginner',
        question: 'What is overfitting?',
        options: [
          'When a model memorizes training data instead of learning patterns',
          'When a model is too simple',
          'When training takes too long',
          'When you have too much data'
        ],
        correctAnswer: 'When a model memorizes training data instead of learning patterns',
        explanation: 'Overfitting is like memorizing test answers without understanding! Your model does great on training data but fails on new data.',
        hint: 'Think about the difference between memorizing and understanding.'
      },
      {
        id: 'of_detection_1',
        type: 'scenario',
        topic: 'overfitting',
        difficulty: 'intermediate',
        question: 'Your training accuracy is 99% but validation accuracy is only 65%. What\'s happening?',
        options: [
          'Overfitting - model memorized training data',
          'Underfitting - model too simple',
          'Perfect fit - this is normal',
          'Bad data - need to collect more'
        ],
        correctAnswer: 'Overfitting - model memorized training data',
        explanation: 'Big gap between training and validation accuracy is a classic sign of overfitting! Your model learned the training data too well and can\'t generalize.',
        visualAid: 'overfitting_curves',
        hint: 'When training is great but validation is poor, what does that suggest?'
      },
      {
        id: 'of_regularization_1',
        type: 'true_false',
        topic: 'overfitting',
        difficulty: 'intermediate',
        question: 'Regularization helps prevent overfitting by keeping the model simpler.',
        correctAnswer: 'true',
        explanation: 'True! Regularization adds a penalty for complexity, encouraging the model to stay simple and focus on important patterns instead of memorizing noise.',
        hint: 'Does regularization make models more or less complex?'
      },
      {
        id: 'of_dropout_1',
        type: 'multiple_choice',
        topic: 'overfitting',
        difficulty: 'advanced',
        question: 'How does dropout prevent overfitting?',
        options: [
          'Randomly turns off neurons during training',
          'Removes data points from training',
          'Reduces the learning rate',
          'Adds more layers to the network'
        ],
        correctAnswer: 'Randomly turns off neurons during training',
        explanation: 'Dropout randomly "drops out" neurons during training, forcing the network to learn robust features that don\'t depend on any single neuron. It\'s like practicing with different team members!',
        hint: 'The name "dropout" is a clue - what is dropping out?'
      },

      // General ML Concepts
      {
        id: 'ml_accuracy_1',
        type: 'multiple_choice',
        topic: 'general',
        difficulty: 'beginner',
        question: 'What does 90% accuracy mean?',
        options: [
          'The model is correct 90 out of 100 times',
          'The model is 90% confident',
          'Training took 90% of the time',
          'The model uses 90% of the data'
        ],
        correctAnswer: 'The model is correct 90 out of 100 times',
        explanation: 'Accuracy is like a test score! 90% accuracy means your model gets the right answer 9 out of 10 times. Higher is better!',
        hint: 'Think of accuracy like a percentage on a test.'
      },
      {
        id: 'ml_loss_1',
        type: 'true_false',
        topic: 'general',
        difficulty: 'beginner',
        question: 'Lower loss is better than higher loss.',
        correctAnswer: 'true',
        explanation: 'True! Loss measures how wrong your predictions are. Lower loss = fewer mistakes = better model. We want loss to go down during training!',
        hint: 'Loss measures mistakes - do you want more or fewer mistakes?'
      }
    ];
  }

  /**
   * Get questions by topic
   */
  getQuestionsByTopic(topic: string, difficulty?: string): QuizQuestion[] {
    const allQuestions = this.getAllQuestions();
    return allQuestions.filter(q => 
      q.topic === topic && (!difficulty || q.difficulty === difficulty)
    );
  }

  /**
   * Get student quiz data
   */
  async getStudentData(userId: string): Promise<StudentQuizData> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quiz data:', error);
        return this.getDefaultStudentData();
      }

      if (!data || data.length === 0) {
        return this.getDefaultStudentData();
      }

      // Aggregate quiz data
      const attempts: QuizAttempt[] = [];
      const progress: { [topic: string]: QuizProgress } = {};
      let totalPoints = 0;

      data.forEach(quiz => {
        if (quiz.questions && Array.isArray(quiz.questions)) {
          quiz.questions.forEach((q: any) => {
            if (q.attempt) {
              attempts.push({
                ...q.attempt,
                timestamp: new Date(q.attempt.timestamp)
              });
            }
          });
        }
        if (quiz.score) {
          totalPoints += quiz.score;
        }
      });

      return {
        attempts,
        progress,
        totalPoints,
        streakDays: 0,
        achievements: []
      };
    } catch (error) {
      console.error('Error in getStudentData:', error);
      return this.getDefaultStudentData();
    }
  }

  private getDefaultStudentData(): StudentQuizData {
    return {
      attempts: [],
      progress: {},
      totalPoints: 0,
      streakDays: 0,
      achievements: []
    };
  }

  /**
   * Save student quiz data
   */
  async saveStudentData(userId: string, data: StudentQuizData): Promise<void> {
    try {
      // For now, we'll store this as a single quiz record
      // In a real implementation, you'd want to normalize this data
      const { error } = await supabase
        .from('quizzes')
        .insert({
          user_id: userId,
          title: 'Quiz Progress',
          questions: JSON.stringify(data),
          score: data.totalPoints,
          total_questions: data.attempts.length,
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving quiz data:', error);
      }
    } catch (error) {
      console.error('Error in saveStudentData:', error);
    }
  }

  /**
   * Record quiz attempt
   */
  async recordAttempt(
    userId: string,
    questionId: string,
    answer: string | string[],
    correct: boolean,
    timeSpent: number,
    hintsUsed: number
  ): Promise<{ points: number; bonusPoints: number; newAchievements: string[] }> {
    const data = await this.getStudentData(userId);
    const question = this.getAllQuestions().find(q => q.id === questionId);
    
    if (!question) {
      return { points: 0, bonusPoints: 0, newAchievements: [] };
    }

    // Record attempt
    const attempt: QuizAttempt = {
      questionId,
      answer,
      correct,
      timeSpent,
      hintsUsed,
      timestamp: new Date()
    };
    data.attempts.push(attempt);

    // Update progress
    if (!data.progress[question.topic]) {
      data.progress[question.topic] = {
        topic: question.topic,
        questionsAttempted: 0,
        questionsCorrect: 0,
        averageTime: 0,
        lastAttempt: new Date(),
        masteryLevel: 0,
        needsReview: false
      };
    }

    const progress = data.progress[question.topic];
    progress.questionsAttempted++;
    if (correct) {
      progress.questionsCorrect++;
    }
    progress.averageTime = (progress.averageTime * (progress.questionsAttempted - 1) + timeSpent) / progress.questionsAttempted;
    progress.lastAttempt = new Date();
    progress.masteryLevel = (progress.questionsCorrect / progress.questionsAttempted) * 100;
    progress.needsReview = progress.masteryLevel < 70;

    // Calculate points
    let points = 0;
    let bonusPoints = 0;
    const newAchievements: string[] = [];

    if (correct) {
      // Base points
      points = question.difficulty === 'beginner' ? 10 : question.difficulty === 'intermediate' ? 20 : 30;
      
      // Speed bonus (if answered in under 30 seconds)
      if (timeSpent < 30) {
        bonusPoints += 5;
      }
      
      // No hints bonus
      if (hintsUsed === 0) {
        bonusPoints += 5;
      }

      data.totalPoints += points + bonusPoints;
    }

    // Check for achievements
    const topicAttempts = data.attempts.filter(a => {
      const q = this.getAllQuestions().find(qu => qu.id === a.questionId);
      return q?.topic === question.topic;
    });

    // Perfect topic achievement
    if (topicAttempts.length >= 5 && topicAttempts.every(a => a.correct)) {
      const achievementId = `perfect_${question.topic}`;
      if (!data.achievements.includes(achievementId)) {
        data.achievements.push(achievementId);
        newAchievements.push(achievementId);
      }
    }

    // Quiz streak achievement
    const recentAttempts = data.attempts.slice(-10);
    if (recentAttempts.length === 10 && recentAttempts.every(a => a.correct)) {
      if (!data.achievements.includes('quiz_streak_10')) {
        data.achievements.push('quiz_streak_10');
        newAchievements.push('quiz_streak_10');
      }
    }

    // Speed demon achievement (5 correct answers under 20 seconds)
    const fastCorrect = data.attempts.filter(a => a.correct && a.timeSpent < 20);
    if (fastCorrect.length >= 5 && !data.achievements.includes('speed_demon')) {
      data.achievements.push('speed_demon');
      newAchievements.push('speed_demon');
    }

    await this.saveStudentData(userId, data);
    return { points, bonusPoints, newAchievements };
  }

  /**
   * Get next recommended question
   */
  async getNextQuestion(userId: string, currentTopic?: string): Promise<QuizQuestion | null> {
    const data = await this.getStudentData(userId);
    const allQuestions = this.getAllQuestions();
    const attemptedIds = new Set(data.attempts.map(a => a.questionId));

    // Filter by topic if specified
    let candidates = currentTopic 
      ? allQuestions.filter(q => q.topic === currentTopic)
      : allQuestions;

    // Remove already attempted questions
    candidates = candidates.filter(q => !attemptedIds.has(q.id));

    if (candidates.length === 0) {
      return null;
    }

    // Adaptive difficulty: start with beginner, progress based on mastery
    const topicProgress = currentTopic ? data.progress[currentTopic] : null;
    
    if (!topicProgress || topicProgress.masteryLevel < 60) {
      // Focus on beginner questions
      const beginnerQuestions = candidates.filter(q => q.difficulty === 'beginner');
      if (beginnerQuestions.length > 0) {
        return beginnerQuestions[0];
      }
    } else if (topicProgress.masteryLevel < 85) {
      // Move to intermediate
      const intermediateQuestions = candidates.filter(q => q.difficulty === 'intermediate');
      if (intermediateQuestions.length > 0) {
        return intermediateQuestions[0];
      }
    } else {
      // Advanced questions
      const advancedQuestions = candidates.filter(q => q.difficulty === 'advanced');
      if (advancedQuestions.length > 0) {
        return advancedQuestions[0];
      }
    }

    // Return any available question
    return candidates[0];
  }

  /**
   * Get quiz statistics
   */
  async getStatistics(userId: string): Promise<{
    totalAttempts: number;
    totalCorrect: number;
    overallAccuracy: number;
    topicStats: { [topic: string]: { accuracy: number; mastery: number } };
    averageTime: number;
  }> {
    const data = await this.getStudentData(userId);
    
    const totalAttempts = data.attempts.length;
    const totalCorrect = data.attempts.filter(a => a.correct).length;
    const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    
    const topicStats: { [topic: string]: { accuracy: number; mastery: number } } = {};
    Object.keys(data.progress).forEach(topic => {
      const progress = data.progress[topic];
      topicStats[topic] = {
        accuracy: progress.questionsAttempted > 0 
          ? (progress.questionsCorrect / progress.questionsAttempted) * 100 
          : 0,
        mastery: progress.masteryLevel
      };
    });

    const averageTime = data.attempts.length > 0
      ? data.attempts.reduce((sum, a) => sum + a.timeSpent, 0) / data.attempts.length
      : 0;

    return {
      totalAttempts,
      totalCorrect,
      overallAccuracy,
      topicStats,
      averageTime
    };
  }

  /**
   * Reset quiz data (for testing)
   */
  async resetData(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting quiz data:', error);
      }
    } catch (error) {
      console.error('Error in resetData:', error);
    }
  }

  /**
   * Submit tutorial quiz result (legacy method for compatibility)
   */
  async submitQuizResult(
    userId: string,
    tutorialId: string,
    answers: { [key: string]: string } | { question_id: string; selected_answer: string; is_correct: boolean }[],
    timeTaken: number
  ): Promise<void> {
    try {
      // Calculate score
      let score = 0;
      let totalQuestions = 0;

      if (Array.isArray(answers)) {
        totalQuestions = answers.length;
        score = answers.filter(a => a.is_correct).length;
      } else {
        totalQuestions = Object.keys(answers).length;
        // For non-array answers, we can't determine correctness without question data
        score = 0;
      }

      const { error } = await supabase
        .from('quizzes')
        .insert({
          user_id: userId,
          title: `Tutorial: ${tutorialId}`,
          questions: JSON.stringify(answers),
          score,
          total_questions: totalQuestions,
          time_taken: timeTaken,
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error submitting quiz result:', error);
      }
    } catch (error) {
      console.error('Error in submitQuizResult:', error);
    }
  }
}

export const quizService = new QuizService();
