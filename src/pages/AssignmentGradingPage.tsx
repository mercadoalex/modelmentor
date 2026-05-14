import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Minus,
  FileText,
  Download,
  Loader2,
  GraduationCap,
} from 'lucide-react';

/**
 * AssignmentGradingPage
 * - Allows instructors/admins to view, grade, and give feedback on student assignments.
 * - Lists assignments, shows submission details, and provides grading UI.
 */

type Submission = {
  id: string;
  student_name: string;
  assignment_title: string;
  submitted_at: string;
  file_url?: string;
  grade?: string;
  feedback?: string;
};

function getGradeBadge(grade?: string) {
  if (!grade) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" />
        Not graded
      </Badge>
    );
  }

  const normalized = grade.toUpperCase().trim();

  if (normalized === 'A' || normalized === 'A+') {
    return (
      <Badge className="gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        <CheckCircle2 className="h-3 w-3" />
        {grade}
      </Badge>
    );
  }

  if (normalized === 'B' || normalized === 'B+') {
    return (
      <Badge className="gap-1 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
        <ThumbsUp className="h-3 w-3" />
        {grade}
      </Badge>
    );
  }

  if (normalized === 'C' || normalized === 'C+') {
    return (
      <Badge className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
        <Minus className="h-3 w-3" />
        {grade}
      </Badge>
    );
  }

  if (normalized === 'D' || normalized === 'F') {
    return (
      <Badge className="gap-1 bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
        <AlertTriangle className="h-3 w-3" />
        {grade}
      </Badge>
    );
  }

  // Fallback for numeric or other grades
  return (
    <Badge variant="secondary" className="gap-1">
      {grade}
    </Badge>
  );
}

function getStatusIndicator(grade?: string) {
  if (grade) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        Graded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm text-amber-600">
      <Clock className="h-4 w-4" />
      Pending
    </span>
  );
}

export default function AssignmentGradingPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Upload progress state (per-file simulation)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch submissions (mock API)
  useEffect(() => {
    setTimeout(() => {
      setSubmissions([
        {
          id: '1',
          student_name: 'Alice Smith',
          assignment_title: 'Essay 1: Introduction to ML',
          submitted_at: '2024-06-01T10:00:00Z',
          file_url: 'https://example.com/essay1.pdf',
          grade: 'A',
          feedback: 'Excellent analysis and well-structured arguments.',
        },
        {
          id: '2',
          student_name: 'Bob Johnson',
          assignment_title: 'Essay 1: Introduction to ML',
          submitted_at: '2024-06-01T11:00:00Z',
          file_url: 'https://example.com/essay1-bob.pdf',
        },
        {
          id: '3',
          student_name: 'Carol Williams',
          assignment_title: 'Lab Report: Neural Networks',
          submitted_at: '2024-06-02T09:30:00Z',
          file_url: 'https://example.com/lab-carol.pdf',
          grade: 'B+',
          feedback: 'Good work, but could improve on the methodology section.',
        },
        {
          id: '4',
          student_name: 'David Lee',
          assignment_title: 'Lab Report: Neural Networks',
          submitted_at: '2024-06-02T14:15:00Z',
          file_url: 'https://example.com/lab-david.pdf',
          grade: 'C',
          feedback: 'Needs more depth in the analysis. Please review the rubric.',
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const openGrading = (submission: Submission) => {
    setSelected(submission);
    setGrade(submission.grade || '');
    setFeedback(submission.feedback || '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelected(null);
  };

  const saveGrade = () => {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      setSubmissions(prev =>
        prev.map(s =>
          s.id === selected.id ? { ...s, grade, feedback } : s
        )
      );
      setSaving(false);
      closeDialog();
    }, 600);
  };

  // Simulate file download with progress
  const handleDownload = (fileName: string) => {
    setUploadingFile(fileName);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadingFile(null);
            setUploadProgress(0);
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const gradedCount = submissions.filter(s => s.grade).length;
  const pendingCount = submissions.filter(s => !s.grade).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assignment Grading</h1>
            <p className="text-muted-foreground">
              Review submissions, assign grades, and provide feedback to students.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Submissions</CardDescription>
              <CardTitle className="text-3xl">{submissions.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Graded</CardDescription>
              <CardTitle className="text-3xl text-green-600">{gradedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Upload Progress Indicator */}
        {uploadingFile && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="py-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Downloading: {uploadingFile}
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              All student submissions awaiting review or already graded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading submissions...</span>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-2" />
                <p>No submissions found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.student_name}</TableCell>
                      <TableCell>{sub.assignment_title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(sub.submitted_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{getStatusIndicator(sub.grade)}</TableCell>
                      <TableCell>{getGradeBadge(sub.grade)}</TableCell>
                      <TableCell>
                        {sub.file_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleDownload(sub.file_url!.split('/').pop() || 'file')}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => openGrading(sub)}
                        >
                          <GraduationCap className="h-4 w-4 mr-1" />
                          Grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Grading Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Grade Submission
              </DialogTitle>
              <DialogDescription>
                {selected
                  ? `${selected.student_name} — ${selected.assignment_title}`
                  : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="grade-input">Grade</Label>
                <Input
                  id="grade-input"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="e.g. A, B+, 95"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-input">Feedback</Label>
                <Textarea
                  id="feedback-input"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback for the student..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveGrade} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Grade'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
