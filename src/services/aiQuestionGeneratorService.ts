/**
 * AI Question Generator Service
 * Simulates AI-powered question generation based on student learning history,
 * performance analysis, and teacher input
 */

import { supabase } from '@/lib/supabase';
import { quizService, type QuizQuestion, type QuestionType } from './quizService';

export interface KnowledgeGap {
  topic: string;
  concept: string;
  weaknessLevel: number; // 0-100, higher = weaker
  missedQuestions: string[];
  recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratedQuestion extends QuizQuestion {
  generatedAt: Date;
  generationMethod: 'ai_analysis' | 'teacher_request' | 'variation';
  sourceQuestionId?: string;
  effectiveness?: number; // 0-100, based on student performance
  approved: boolean;
  flagged: boolean;
  flagReason?: string;
}

export interface TeacherQuestionRequest {
  description: string;
  targetConcept?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questionType?: QuestionType;
  contextData?: {
    modelType?: string;
    accuracy?: number;
    lossValue?: number;
  };
}

export interface QuestionGenerationResult {
  questions: GeneratedQuestion[];
  confidence: number; // 0-100
  suggestions: string[];
}

class AIQuestionGeneratorService {
  private readonly STORAGE_KEY = 'modelmentor_ai_questions';
  private readonly HISTORY_KEY = 'modelmentor_generation_history';

  // Question templates for different concepts
  private readonly questionTemplates = {
    neural_networks: {
      beginner: [
        {
          template: 'What happens when you add more layers to a neural network?',
          options: [
            'The network can learn more complex patterns',
            'The network always performs better',
            'Training becomes faster',
            'The network uses less memory'
          ],
          correctIndex: 0,
          explanation: 'More layers allow the network to learn more complex patterns, but don\'t always guarantee better performance. Too many layers can lead to overfitting!'
        },
        {
          template: 'Which activation function is most commonly used in modern neural networks?',
          options: ['ReLU', 'Sigmoid', 'Linear', 'Step function'],
          correctIndex: 0,
          explanation: 'ReLU (Rectified Linear Unit) is widely used because it\'s simple, fast, and helps prevent vanishing gradients!'
        }
      ],
      intermediate: [
        {
          template: 'Your model has {accuracy}% accuracy on training data but only {validationAccuracy}% on validation data. What\'s the problem?',
          options: [
            'Overfitting - the model memorized training data',
            'Underfitting - the model is too simple',
            'Perfect fit - this is normal',
            'Data quality issue'
          ],
          correctIndex: 0,
          explanation: 'This large gap between training and validation accuracy is a classic sign of overfitting. The model learned the training data too well!'
        }
      ],
      advanced: [
        {
          template: 'Why might batch normalization improve training stability?',
          options: [
            'It normalizes layer inputs, reducing internal covariate shift',
            'It increases the learning rate automatically',
            'It adds more parameters to learn',
            'It removes the need for activation functions'
          ],
          correctIndex: 0,
          explanation: 'Batch normalization normalizes inputs to each layer, which helps stabilize training and allows for higher learning rates.'
        }
      ]
    },
    overfitting: {
      beginner: [
        {
          template: 'What is the main sign of overfitting?',
          options: [
            'High training accuracy, low validation accuracy',
            'Low training accuracy, high validation accuracy',
            'Both accuracies are low',
            'Both accuracies are high'
          ],
          correctIndex: 0,
          explanation: 'Overfitting shows up as great performance on training data but poor performance on new data. It\'s like memorizing answers without understanding!'
        }
      ],
      intermediate: [
        {
          template: 'Which technique helps prevent overfitting?',
          options: [
            'Dropout - randomly turning off neurons during training',
            'Increasing model complexity',
            'Training for more epochs',
            'Using a smaller dataset'
          ],
          correctIndex: 0,
          explanation: 'Dropout prevents overfitting by randomly disabling neurons, forcing the network to learn robust features that don\'t depend on any single neuron.'
        }
      ]
    },
    gradient_descent: {
      beginner: [
        {
          template: 'What does gradient descent try to minimize?',
          options: ['Loss (error)', 'Accuracy', 'Training time', 'Model size'],
          correctIndex: 0,
          explanation: 'Gradient descent minimizes the loss function, which measures how wrong our predictions are. Lower loss = better predictions!'
        }
      ],
      intermediate: [
        {
          template: 'Your loss is bouncing up and down instead of decreasing smoothly. What should you try?',
          options: [
            'Decrease the learning rate',
            'Increase the learning rate',
            'Add more layers',
            'Use more training data'
          ],
          correctIndex: 0,
          explanation: 'Bouncing loss usually means the learning rate is too high, causing the optimizer to overshoot the minimum. Try a smaller learning rate!'
        }
      ]
    }
  };

  /**
   * Analyze student performance to identify knowledge gaps
   */
  async analyzeKnowledgeGaps(userId: string): Promise<KnowledgeGap[]> {
    const studentData = await quizService.getStudentData(userId);
    const stats = await quizService.getStatistics(userId);
    const gaps: KnowledgeGap[] = [];

    // Analyze each topic
    Object.keys(stats.topicStats).forEach(topic => {
      const topicStat = stats.topicStats[topic];
      const progress = studentData.progress[topic];

      if (!progress) return;

      // Identify weak areas (accuracy < 70%)
      if (topicStat.accuracy < 70) {
        // Find missed questions
        const missedQuestions = studentData.attempts
          .filter(a => {
            const q = quizService.getAllQuestions().find(qu => qu.id === a.questionId);
            return q?.topic === topic && !a.correct;
          })
          .map(a => a.questionId);

        gaps.push({
          topic,
          concept: topic,
          weaknessLevel: 100 - topicStat.accuracy,
          missedQuestions,
          recommendedDifficulty: this.determineRecommendedDifficulty(topicStat.accuracy)
        });
      }
    });

    // Sort by weakness level (highest first)
    return gaps.sort((a, b) => b.weaknessLevel - a.weaknessLevel);
  }

  /**
   * Determine recommended difficulty based on accuracy
   */
  private determineRecommendedDifficulty(accuracy: number): 'beginner' | 'intermediate' | 'advanced' {
    if (accuracy < 60) return 'beginner';
    if (accuracy < 85) return 'intermediate';
    return 'advanced';
  }

  /**
   * Generate questions based on knowledge gaps
   */
  async generateQuestionsForGaps(userId: string, maxQuestions: number = 5): Promise<GeneratedQuestion[]> {
    const gaps = await this.analyzeKnowledgeGaps(userId);
    const generated: GeneratedQuestion[] = [];

    for (const gap of gaps) {
      if (generated.length >= maxQuestions) break;

      // Generate questions for this gap
      const questions = await this.generateQuestionsForTopic(
        userId,
        gap.topic,
        gap.recommendedDifficulty,
        Math.min(2, maxQuestions - generated.length)
      );

      generated.push(...questions);
    }

    return generated;
  }

  /**
   * Generate questions for a specific topic
   */
  private async generateQuestionsForTopic(
    userId: string,
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    count: number
  ): Promise<GeneratedQuestion[]> {
    const templates = this.questionTemplates[topic as keyof typeof this.questionTemplates];
    if (!templates) return [];

    const difficultyTemplates = templates[difficulty as keyof typeof templates];
    if (!difficultyTemplates || !Array.isArray(difficultyTemplates) || difficultyTemplates.length === 0) return [];

    const generated: GeneratedQuestion[] = [];
    const studentData = await quizService.getStudentData(userId);

    // Get context data from student's recent activities
    const contextData = await this.getStudentContextData(userId);

    for (let i = 0; i < Math.min(count, difficultyTemplates.length); i++) {
      const template = difficultyTemplates[i];
      
      // Replace placeholders with context data
      let questionText = template.template;
      if (contextData.accuracy !== undefined) {
        questionText = questionText.replace('{accuracy}', contextData.accuracy.toString());
      }
      if (contextData.validationAccuracy !== undefined) {
        questionText = questionText.replace('{validationAccuracy}', contextData.validationAccuracy.toString());
      }

      const question: GeneratedQuestion = {
        id: `ai_gen_${Date.now()}_${i}`,
        type: 'multiple_choice',
        topic,
        difficulty,
        question: questionText,
        options: template.options,
        correctAnswer: template.options[template.correctIndex],
        explanation: template.explanation,
        generatedAt: new Date(),
        generationMethod: 'ai_analysis',
        approved: false,
        flagged: false
      };

      // Validate question
      const validation = this.validateQuestion(question);
      if (!validation.isValid) {
        question.flagged = true;
        question.flagReason = validation.reason;
      }

      generated.push(question);
    }

    return generated;
  }

  /**
   * Get student context data for personalized questions
   */
  private async getStudentContextData(userId: string): Promise<{
    accuracy?: number;
    validationAccuracy?: number;
    modelType?: string;
    lossValue?: number;
  }> {
    // Simulate getting context from student's recent training
    // In a real implementation, this would fetch from training history
    return {
      accuracy: Math.floor(Math.random() * 20) + 75, // 75-95%
      validationAccuracy: Math.floor(Math.random() * 30) + 50, // 50-80%
      modelType: 'image_classification',
      lossValue: Math.random() * 0.5 + 0.1 // 0.1-0.6
    };
  }

  /**
   * Generate questions from teacher natural language input
   */
  generateFromTeacherInput(request: TeacherQuestionRequest): QuestionGenerationResult {
    const { description, targetConcept, difficulty, questionType, contextData } = request;

    // Parse teacher input to extract intent
    const intent = this.parseTeacherIntent(description);
    
    const questions: GeneratedQuestion[] = [];
    const suggestions: string[] = [];

    // Generate 3-5 question variations
    const numVariations = Math.floor(Math.random() * 3) + 3; // 3-5 variations

    for (let i = 0; i < numVariations; i++) {
      const question = this.generateQuestionFromIntent(
        intent,
        targetConcept || intent.topic,
        difficulty || intent.difficulty,
        questionType || 'multiple_choice',
        contextData
      );

      if (question) {
        questions.push(question);
      }
    }

    // Add suggestions for improvement
    if (questions.length > 0) {
      suggestions.push('Consider adding hints for challenging questions');
      suggestions.push('You can edit question text and options before approving');
      if (!contextData) {
        suggestions.push('Add context data (model accuracy, loss) for more personalized questions');
      }
    } else {
      suggestions.push('Try being more specific about the concept you want to test');
      suggestions.push('Example: "Create a question about overfitting for intermediate students"');
    }

    return {
      questions,
      confidence: questions.length > 0 ? 85 : 30,
      suggestions
    };
  }

  /**
   * Parse teacher natural language input
   */
  private parseTeacherIntent(description: string): {
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    concept: string;
    questionType: QuestionType;
  } {
    const lower = description.toLowerCase();

    // Detect topic
    let topic = 'neural_networks';
    if (lower.includes('overfit')) topic = 'overfitting';
    else if (lower.includes('gradient') || lower.includes('learning rate')) topic = 'gradient_descent';
    else if (lower.includes('decision boundary') || lower.includes('classification')) topic = 'decision_boundary';

    // Detect difficulty
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    if (lower.includes('beginner') || lower.includes('basic') || lower.includes('simple')) {
      difficulty = 'beginner';
    } else if (lower.includes('advanced') || lower.includes('complex') || lower.includes('difficult')) {
      difficulty = 'advanced';
    }

    // Detect question type
    let questionType: QuestionType = 'multiple_choice';
    if (lower.includes('true') && lower.includes('false')) questionType = 'true_false';
    else if (lower.includes('scenario') || lower.includes('situation')) questionType = 'scenario';
    else if (lower.includes('fill') || lower.includes('blank')) questionType = 'fill_blank';

    return {
      topic,
      difficulty,
      concept: topic,
      questionType
    };
  }

  /**
   * Generate question from parsed intent
   */
  private generateQuestionFromIntent(
    intent: ReturnType<typeof this.parseTeacherIntent>,
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    questionType: QuestionType,
    contextData?: TeacherQuestionRequest['contextData']
  ): GeneratedQuestion | null {
    const templates = this.questionTemplates[topic as keyof typeof this.questionTemplates];
    if (!templates) return null;

    const difficultyTemplates = templates[difficulty as keyof typeof templates];
    if (!difficultyTemplates || !Array.isArray(difficultyTemplates) || difficultyTemplates.length === 0) return null;

    // Pick a random template
    const template = difficultyTemplates[Math.floor(Math.random() * difficultyTemplates.length)];

    // Apply context data if provided
    let questionText = template.template;
    if (contextData?.accuracy) {
      questionText = questionText.replace('{accuracy}', contextData.accuracy.toString());
    }
    if (contextData?.lossValue) {
      questionText = questionText.replace('{loss}', contextData.lossValue.toFixed(3));
    }

    const question: GeneratedQuestion = {
      id: `teacher_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: questionType === 'multiple_choice' ? 'multiple_choice' : questionType,
      topic,
      difficulty,
      question: questionText,
      options: template.options,
      correctAnswer: template.options[template.correctIndex],
      explanation: template.explanation,
      generatedAt: new Date(),
      generationMethod: 'teacher_request',
      approved: false,
      flagged: false
    };

    // Validate
    const validation = this.validateQuestion(question);
    if (!validation.isValid) {
      question.flagged = true;
      question.flagReason = validation.reason;
    }

    return question;
  }

  /**
   * Generate variation of an existing question
   */
  generateVariation(sourceQuestion: QuizQuestion): GeneratedQuestion {
    // Create a variation by modifying the question slightly
    const variation: GeneratedQuestion = {
      ...sourceQuestion,
      id: `variation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date(),
      generationMethod: 'variation',
      sourceQuestionId: sourceQuestion.id,
      approved: false,
      flagged: false
    };

    // Modify question text slightly
    if (sourceQuestion.type === 'multiple_choice' && sourceQuestion.options) {
      // Shuffle options
      const shuffled = [...sourceQuestion.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      variation.options = shuffled;
    }

    return variation;
  }

  /**
   * Validate generated question for quality
   */
  validateQuestion(question: GeneratedQuestion): { isValid: boolean; reason?: string } {
    // Check question text length
    if (question.question.length < 10) {
      return { isValid: false, reason: 'Question text too short' };
    }

    if (question.question.length > 500) {
      return { isValid: false, reason: 'Question text too long' };
    }

    // Check for multiple choice questions
    if (question.type === 'multiple_choice') {
      if (!question.options || question.options.length < 2) {
        return { isValid: false, reason: 'Multiple choice needs at least 2 options' };
      }

      if (question.options.length > 6) {
        return { isValid: false, reason: 'Too many options (max 6)' };
      }

      // Check if correct answer exists in options
      if (!question.options.includes(question.correctAnswer as string)) {
        return { isValid: false, reason: 'Correct answer not found in options' };
      }
    }

    // Check explanation
    if (!question.explanation || question.explanation.length < 20) {
      return { isValid: false, reason: 'Explanation too short or missing' };
    }

    return { isValid: true };
  }

  /**
   * Save generated questions
   */
  async saveGeneratedQuestions(userId: string, questions: GeneratedQuestion[]): Promise<void> {
    try {
      const questionsToInsert = questions.map(q => ({
        user_id: userId,
        question_text: q.question,
        question_type: q.type,
        options: q.options ? JSON.stringify(q.options) : null,
        correct_answer: typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer),
        difficulty: q.difficulty,
        concept: q.topic || 'general',
        topic: q.topic,
        hint: q.hint,
        explanation: q.explanation,
        generation_method: q.generationMethod,
        source_question_id: q.sourceQuestionId,
        effectiveness: q.effectiveness || 0,
        approved: q.approved,
        flagged: q.flagged,
        flag_reason: q.flagReason,
        generated_at: q.generatedAt
      }));

      const { error } = await supabase
        .from('generated_questions')
        .insert(questionsToInsert);

      if (error) {
        console.error('Error saving generated questions:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveGeneratedQuestions:', error);
      throw error;
    }
  }

  /**
   * Get all generated questions
   */
  async getGeneratedQuestions(userId: string): Promise<GeneratedQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('generated_questions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting generated questions:', error);
        return [];
      }

      return (data || []).map((q: any) => ({
        id: q.id,
        question: q.question_text,
        type: q.question_type,
        options: q.options ? JSON.parse(q.options) : undefined,
        correctAnswer: q.correct_answer,
        difficulty: q.difficulty,
        topic: q.topic || q.concept,
        hint: q.hint,
        explanation: q.explanation,
        generatedAt: new Date(q.generated_at || q.created_at),
        generationMethod: q.generation_method,
        sourceQuestionId: q.source_question_id,
        effectiveness: q.effectiveness,
        approved: q.approved,
        flagged: q.flagged,
        flagReason: q.flag_reason
      }));
    } catch (error) {
      console.error('Error in getGeneratedQuestions:', error);
      return [];
    }
  }

  /**
   * Approve question
   */
  async approveQuestion(userId: string, questionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_questions')
        .update({ approved: true })
        .eq('id', questionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error approving question:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in approveQuestion:', error);
      throw error;
    }
  }

  /**
   * Reject question
   */
  async rejectQuestion(userId: string, questionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_questions')
        .delete()
        .eq('id', questionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error rejecting question:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in rejectQuestion:', error);
      throw error;
    }
  }

  /**
   * Update question
   */
  async updateQuestion(userId: string, questionId: string, updates: Partial<GeneratedQuestion>): Promise<void> {
    try {
      const updateData: any = {};
      if (updates.question) updateData.question_text = updates.question;
      if (updates.type) updateData.question_type = updates.type;
      if (updates.options) updateData.options = JSON.stringify(updates.options);
      if (updates.correctAnswer) updateData.correct_answer = updates.correctAnswer;
      if (updates.difficulty) updateData.difficulty = updates.difficulty;
      if (updates.topic) updateData.topic = updates.topic;
      if (updates.hint) updateData.hint = updates.hint;
      if (updates.explanation) updateData.explanation = updates.explanation;
      if (updates.approved !== undefined) updateData.approved = updates.approved;
      if (updates.flagged !== undefined) updateData.flagged = updates.flagged;
      if (updates.flagReason) updateData.flag_reason = updates.flagReason;

      const { error } = await supabase
        .from('generated_questions')
        .update(updateData)
        .eq('id', questionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating question:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateQuestion:', error);
      throw error;
    }
  }

  /**
   * Get approved questions
   */
  async getApprovedQuestions(userId: string): Promise<GeneratedQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('generated_questions')
        .select('*')
        .eq('user_id', userId)
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting approved questions:', error);
        return [];
      }

      return (data || []).map((q: any) => ({
        id: q.id,
        question: q.question_text,
        type: q.question_type,
        options: q.options ? JSON.parse(q.options) : undefined,
        correctAnswer: q.correct_answer,
        difficulty: q.difficulty,
        topic: q.topic || q.concept,
        hint: q.hint,
        explanation: q.explanation,
        generatedAt: new Date(q.generated_at || q.created_at),
        generationMethod: q.generation_method,
        sourceQuestionId: q.source_question_id,
        effectiveness: q.effectiveness,
        approved: q.approved,
        flagged: q.flagged,
        flagReason: q.flag_reason
      }));
    } catch (error) {
      console.error('Error in getApprovedQuestions:', error);
      return [];
    }
  }

  /**
   * Save generation history
   */
  async saveGenerationHistory(userId: string, request: TeacherQuestionRequest, result: QuestionGenerationResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('question_generation_history')
        .insert({
          user_id: userId,
          description: request.description,
          target_concept: request.targetConcept,
          difficulty: request.difficulty,
          question_type: request.questionType,
          context_data: request.contextData ? JSON.stringify(request.contextData) : null,
          generated_count: result.questions.length,
          approved_count: 0,
          confidence: result.confidence,
          suggestions: result.suggestions ? JSON.stringify(result.suggestions) : null
        });

      if (error) {
        console.error('Error saving generation history:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveGenerationHistory:', error);
      throw error;
    }
  }

  /**
   * Get generation history
   */
  async getGenerationHistory(userId: string): Promise<Array<{
    timestamp: Date;
    request: TeacherQuestionRequest;
    result: { questionCount: number; confidence: number };
  }>> {
    try {
      const { data, error } = await supabase
        .from('question_generation_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error getting generation history:', error);
        return [];
      }

      return (data || []).map((h: any) => ({
        timestamp: new Date(h.created_at),
        request: {
          description: h.description,
          targetConcept: h.target_concept,
          difficulty: h.difficulty,
          questionType: h.question_type,
          contextData: h.context_data ? JSON.parse(h.context_data) : undefined
        },
        result: {
          questionCount: h.generated_count,
          confidence: h.confidence
        }
      }));
    } catch (error) {
      console.error('Error in getGenerationHistory:', error);
      return [];
    }
  }

  /**
   * Clear all generated questions
   */
  async clearGeneratedQuestions(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_questions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing generated questions:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in clearGeneratedQuestions:', error);
      throw error;
    }
  }

  /**
   * Clear generation history
   */
  clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
  }
}

export const aiQuestionGeneratorService = new AIQuestionGeneratorService();
