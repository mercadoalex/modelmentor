import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { quizAnalyticsService } from '@/services/quizAnalyticsService';
import type { TutorialAnalytics, QuestionAnalytics, StudentPerformance } from '@/services/quizAnalyticsService';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import { getAllTutorials } from '@/data/tutorials';

export default function QuizAnalyticsPage() {
  const { user } = useAuth();
  const [tutorialAnalytics, setTutorialAnalytics] = useState<TutorialAnalytics[]>([]);
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [overallStats, setOverallStats] = useState({
    total_students: 0,
    total_quiz_attempts: 0,
    average_score: 0,
    pass_rate: 0,
  });
  const [selectedTutorial, setSelectedTutorial] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedTutorial]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Load overall statistics
      const stats = await quizAnalyticsService.getOverallStatistics();
      setOverallStats(stats);

      // Load tutorial analytics
      const tutorials = await quizAnalyticsService.getTutorialAnalytics();
      setTutorialAnalytics(tutorials);

      // Load student performance
      const students = await quizAnalyticsService.getStudentPerformance();
      setStudentPerformance(students);

      // Load question analytics for selected tutorial
      if (selectedTutorial !== 'all') {
        const questions = await quizAnalyticsService.getQuestionAnalytics(selectedTutorial);
        setQuestionAnalytics(questions);
      } else {
        setQuestionAnalytics([]);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const strugglingQuestions = questionAnalytics.filter(q => q.success_rate < 50);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Quiz Analytics</h1>
              <p className="text-muted-foreground">
                Track student performance and identify learning gaps
              </p>
            </div>
          </div>

          {/* Tutorial Filter */}
          <Select value={selectedTutorial} onValueChange={setSelectedTutorial}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select tutorial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tutorials</SelectItem>
              {getAllTutorials().map(tutorial => (
                <SelectItem key={tutorial.id} value={tutorial.id}>
                  {tutorial.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overall Statistics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{overallStats.total_students}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{overallStats.total_quiz_attempts}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{overallStats.average_score}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{overallStats.pass_rate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Struggling Questions Alert */}
        {selectedTutorial !== 'all' && strugglingQuestions.length > 0 && (
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <CardTitle className="text-balance">Questions Students Struggle With</CardTitle>
                  <CardDescription className="text-pretty">
                    These questions have a success rate below 50%. Consider reviewing these topics with students.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strugglingQuestions.map(question => (
                  <div key={question.question_id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{question.question_text}</p>
                      <p className="text-sm text-muted-foreground">
                        {question.correct_attempts} / {question.total_attempts} correct
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {question.success_rate}% success
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tutorial Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Tutorial Performance</CardTitle>
            <CardDescription className="text-pretty">
              Overview of quiz performance across all tutorials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Tutorial</TableHead>
                    <TableHead className="whitespace-nowrap">Students</TableHead>
                    <TableHead className="whitespace-nowrap">Attempts</TableHead>
                    <TableHead className="whitespace-nowrap">Avg Score</TableHead>
                    <TableHead className="whitespace-nowrap">Pass Rate</TableHead>
                    <TableHead className="whitespace-nowrap">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorialAnalytics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No quiz data available yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    tutorialAnalytics.map(tutorial => (
                      <TableRow key={tutorial.tutorial_id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {tutorial.tutorial_title}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{tutorial.unique_students}</TableCell>
                        <TableCell className="whitespace-nowrap">{tutorial.total_attempts}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{tutorial.average_score}%</span>
                            {tutorial.average_score >= 70 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Progress value={tutorial.pass_rate} className="w-16" />
                            <span className="text-sm">{tutorial.pass_rate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Progress value={tutorial.completion_rate} className="w-16" />
                            <span className="text-sm">{tutorial.completion_rate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Question-Level Analytics */}
        {selectedTutorial !== 'all' && questionAnalytics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Question Difficulty Analysis</CardTitle>
              <CardDescription className="text-pretty">
                Success rate for each question in this tutorial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questionAnalytics.map(question => (
                  <div key={question.question_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{question.question_text}</p>
                        <p className="text-sm text-muted-foreground">
                          {question.correct_attempts} / {question.total_attempts} students answered correctly
                        </p>
                      </div>
                      <Badge
                        variant={
                          question.success_rate >= 70
                            ? 'default'
                            : question.success_rate >= 50
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {question.success_rate}%
                      </Badge>
                    </div>
                    <Progress value={question.success_rate} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Student Performance</CardTitle>
            <CardDescription className="text-pretty">
              Individual student quiz performance and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Student</TableHead>
                    <TableHead className="whitespace-nowrap">Quizzes Taken</TableHead>
                    <TableHead className="whitespace-nowrap">Passed</TableHead>
                    <TableHead className="whitespace-nowrap">Avg Score</TableHead>
                    <TableHead className="whitespace-nowrap">Time Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentPerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No student data available yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    studentPerformance.map(student => (
                      <TableRow key={student.user_id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {student.user_email}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{student.total_quizzes_taken}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {student.quizzes_passed} / {student.total_quizzes_taken}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{student.average_score}%</span>
                            {student.average_score >= 70 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {Math.round(student.total_time_spent / 60)}m
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
