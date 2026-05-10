import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

/**
 * Completion interface for assignment_completions table
 */
interface Completion {
  id: string;
  student_id: string;
  configuration_id: string;
  loaded_at: string | null;
  completed_at: string | null;
  file_url: string | null;
  time_spent_seconds: number | null;
  grade: number | null;
  feedback: string | null;
}

/**
 * AssignmentGrading component
 * - Lists all student submissions for a given assignment
 * - Allows teacher to download submitted files
 * - Allows teacher to enter grade and feedback for each submission
 * - Notifies student when graded
 */
export function AssignmentGrading({ assignmentId }: { assignmentId: string }) {
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Fetch completions for this assignment
  useEffect(() => {
    const fetchCompletions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('assignment_completions')
        .select('*')
        .eq('configuration_id', assignmentId);

      if (!error && data) setCompletions(data);
      setLoading(false);
    };
    fetchCompletions();
  }, [assignmentId]);

  // Handle grade/feedback change in local state
  const handleChange = (id: string, field: 'grade' | 'feedback', value: string) => {
    setCompletions(completions =>
      completions.map(c =>
        c.id === id ? { ...c, [field]: field === 'grade' ? Number(value) : value } : c
      )
    );
  };

  // Save grade and feedback to DB, notify student
  const handleSave = async (completion: Completion) => {
    setSavingId(completion.id);
    const { error } = await supabase
      .from('assignment_completions')
      .update({
        grade: completion.grade,
        feedback: completion.feedback,
      })
      .eq('id', completion.id);

    if (!error) {
      // Notify student
      await supabase
        .from('notifications')
        .insert({
          user_id: completion.student_id,
          type: 'assignment_graded',
          message: `Your assignment "${completion.configuration_id}" has been graded.`,
          link: `/dashboard`, // Or direct link to assignment
        });
      toast.success('Grade and feedback saved!');
    } else {
      toast.error('Failed to save grade/feedback');
    }
    setSavingId(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Student Submissions</h2>
      {loading ? (
        <div>Loading...</div>
      ) : completions.length === 0 ? (
        <div>No submissions yet.</div>
      ) : (
        completions.map((completion) => (
          <Card key={completion.id}>
            <CardHeader>
              <CardTitle>
                Student: <span className="font-mono">{completion.student_id}</span>
                {completion.completed_at ? (
                  <Badge className="ml-2 bg-green-500">Completed</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">In Progress</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <strong>Loaded at:</strong> {completion.loaded_at ? new Date(completion.loaded_at).toLocaleString() : '—'}
              </div>
              <div>
                <strong>Completed at:</strong> {completion.completed_at ? new Date(completion.completed_at).toLocaleString() : '—'}
              </div>
              <div>
                <strong>Time Spent:</strong> {completion.time_spent_seconds ? `${completion.time_spent_seconds} sec` : '—'}
              </div>
              <div>
                <strong>File Attachment:</strong>{' '}
                {completion.file_url ? (
                  <a href={completion.file_url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                    Download Submission
                  </a>
                ) : (
                  <span>No file uploaded</span>
                )}
              </div>
              {/* Grade and Feedback Fields */}
              <div className="mt-4 flex flex-col gap-2">
                <label>
                  <span className="font-medium">Grade:</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={completion.grade ?? ''}
                    onChange={e => handleChange(completion.id, 'grade', e.target.value)}
                    className="w-24 ml-2"
                  />
                </label>
                <label>
                  <span className="font-medium">Feedback:</span>
                  <Textarea
                    value={completion.feedback ?? ''}
                    onChange={e => handleChange(completion.id, 'feedback', e.target.value)}
                    className="mt-1"
                  />
                </label>
                <Button
                  size="sm"
                  className="mt-2 w-fit"
                  onClick={() => handleSave(completion)}
                  disabled={savingId === completion.id}
                >
                  {savingId === completion.id ? 'Saving...' : 'Save Grade & Feedback'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}