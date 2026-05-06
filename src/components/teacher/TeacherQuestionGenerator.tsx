import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertTriangle,
  Clock,
  Lightbulb,
  BookOpen,
  Loader2
} from 'lucide-react';
import {
  aiQuestionGeneratorService,
  type TeacherQuestionRequest,
  type GeneratedQuestion
} from '@/services/aiQuestionGeneratorService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function TeacherQuestionGenerator() {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-123';
  
  const [description, setDescription] = useState('');
  const [targetConcept, setTargetConcept] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedExplanation, setEditedExplanation] = useState('');
  const [approvedQuestions, setApprovedQuestions] = useState<GeneratedQuestion[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [approved, hist] = await Promise.all([
        aiQuestionGeneratorService.getApprovedQuestions(userId),
        aiQuestionGeneratorService.getGenerationHistory(userId)
      ]);
      setApprovedQuestions(approved);
      setHistory(hist);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please enter a question description');
      return;
    }

    try {
      setIsGenerating(true);

      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const request: TeacherQuestionRequest = {
        description,
        targetConcept: targetConcept || undefined,
        difficulty
      };

      const result = aiQuestionGeneratorService.generateFromTeacherInput(request);

      setGeneratedQuestions(result.questions);
      setConfidence(result.confidence);
      setSuggestions(result.suggestions);

      // Save to history
      await aiQuestionGeneratorService.saveGenerationHistory(userId, request, result);
      const updatedHistory = await aiQuestionGeneratorService.getGenerationHistory(userId);
      setHistory(updatedHistory);

      toast.success(`Generated ${result.questions.length} questions!`);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (questionId: string) => {
    const question = generatedQuestions.find(q => q.id === questionId);
    if (!question) return;

    try {
      await aiQuestionGeneratorService.approveQuestion(userId, questionId);
      await aiQuestionGeneratorService.saveGeneratedQuestions(userId, [question]);
      
      const updatedApproved = await aiQuestionGeneratorService.getApprovedQuestions(userId);
      setApprovedQuestions(updatedApproved);
      setGeneratedQuestions(prev => prev.filter(q => q.id !== questionId));
      
      toast.success('Question approved and added to question bank!');
    } catch (error) {
      console.error('Error approving question:', error);
      toast.error('Failed to approve question');
    }
  };

  const handleReject = (questionId: string) => {
    setGeneratedQuestions(prev => prev.filter(q => q.id !== questionId));
    toast.info('Question rejected');
  };

  const handleEdit = (question: GeneratedQuestion) => {
    setEditingQuestion(question.id);
    setEditedText(question.question);
    setEditedExplanation(question.explanation);
  };

  const handleSaveEdit = (questionId: string) => {
    const question = generatedQuestions.find(q => q.id === questionId);
    if (!question) return;

    const updated = {
      ...question,
      question: editedText,
      explanation: editedExplanation
    };

    setGeneratedQuestions(prev =>
      prev.map(q => (q.id === questionId ? updated : q))
    );

    setEditingQuestion(null);
    toast.success('Question updated!');
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditedText('');
    setEditedExplanation('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Question Generator
          </CardTitle>
          <CardDescription>
            Describe the question you want to create in plain English, and our AI will generate
            multiple variations for you to review and approve.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Questions</TabsTrigger>
          <TabsTrigger value="bank">
            Question Bank ({approvedQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Describe Your Question</CardTitle>
              <CardDescription>
                Example: "Create a question about overfitting for intermediate students"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Question Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you want to test... (e.g., 'Create a question about gradient descent that tests understanding of learning rate')"
                  className="min-h-24"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="concept">Target Concept (Optional)</Label>
                  <Input
                    id="concept"
                    value={targetConcept}
                    onChange={(e) => setTargetConcept(e.target.value)}
                    placeholder="e.g., neural_networks, overfitting"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                    className="w-full p-2 rounded-lg border bg-background"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Confidence & Suggestions */}
          {generatedQuestions.length > 0 && (
            <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription>
                <p className="font-semibold mb-2">
                  Generation Confidence: {confidence}%
                </p>
                {suggestions.length > 0 && (
                  <ul className="text-sm space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Generated Questions */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Generated Questions</h3>
              {generatedQuestions.map((question) => (
                <Card key={question.id} className={question.flagged ? 'border-yellow-500' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                          </Badge>
                          <Badge variant="outline">{question.topic}</Badge>
                          {question.flagged && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Flagged
                            </Badge>
                          )}
                        </div>
                        {editingQuestion === question.id ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Question Text</Label>
                              <Textarea
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                className="min-h-20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Explanation</Label>
                              <Textarea
                                value={editedExplanation}
                                onChange={(e) => setEditedExplanation(e.target.value)}
                                className="min-h-20"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveEdit(question.id)}>
                                Save Changes
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-base leading-relaxed">{question.question}</p>
                            {question.flagged && question.flagReason && (
                              <Alert className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
                                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                <AlertDescription className="text-sm">
                                  {question.flagReason}
                                </AlertDescription>
                              </Alert>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {editingQuestion !== question.id && (
                    <CardContent className="space-y-4">
                      {/* Options */}
                      {question.options && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Options:</p>
                          <div className="space-y-1">
                            {question.options.map((option, index) => (
                              <div
                                key={index}
                                className={`p-2 rounded-lg border text-sm ${
                                  option === question.correctAnswer
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                                    : 'border-border'
                                }`}
                              >
                                {option}
                                {option === question.correctAnswer && (
                                  <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Explanation:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(question.id)}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(question)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(question.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Question Bank Tab */}
        <TabsContent value="bank" className="space-y-4">
          {approvedQuestions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No approved questions yet. Generate and approve questions to build your question bank.
                </p>
              </CardContent>
            </Card>
          ) : (
            approvedQuestions.map((question) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                      </Badge>
                      <Badge variant="outline">{question.topic}</Badge>
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Approved
                      </Badge>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed mt-2">{question.question}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {question.options && (
                    <div className="space-y-1">
                      {question.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-lg border text-sm ${
                            option === question.correctAnswer
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                              : 'border-border'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No generation history yet. Start generating questions to see your history here.
                </p>
              </CardContent>
            </Card>
          ) : (
            history.reverse().map((entry, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {new Date(entry.timestamp).toLocaleString()}
                    </CardTitle>
                    <Badge variant="outline">
                      {entry.result.questionCount} questions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Description:</span> {entry.request.description}
                  </p>
                  {entry.request.targetConcept && (
                    <p className="text-sm">
                      <span className="font-semibold">Concept:</span> {entry.request.targetConcept}
                    </p>
                  )}
                  {entry.request.difficulty && (
                    <p className="text-sm">
                      <span className="font-semibold">Difficulty:</span>{' '}
                      {entry.request.difficulty.charAt(0).toUpperCase() + entry.request.difficulty.slice(1)}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-semibold">Confidence:</span> {entry.result.confidence}%
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
