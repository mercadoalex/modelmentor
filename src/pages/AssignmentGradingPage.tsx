import React, { useEffect, useState } from 'react';

/**
 * AssignmentGradingPage
 * - Allows instructors/admins to view, grade, and give feedback on student assignments.
 * - Lists assignments, shows submission details, and provides grading UI.
 * - This is a basic scaffold. Integrate with your backend as needed.
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

export default function AssignmentGradingPage() {
  // State for submissions
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch submissions (replace with real API)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSubmissions([
        {
          id: '1',
          student_name: 'Alice Smith',
          assignment_title: 'Essay 1',
          submitted_at: '2024-06-01T10:00:00Z',
          file_url: 'https://example.com/essay1.pdf',
          grade: 'A',
          feedback: 'Great job!',
        },
        {
          id: '2',
          student_name: 'Bob Johnson',
          assignment_title: 'Essay 1',
          submitted_at: '2024-06-01T11:00:00Z',
          file_url: 'https://example.com/essay1-bob.pdf',
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  // Open grading modal
  const openGrading = (submission: Submission) => {
    setSelected(submission);
    setGrade(submission.grade || '');
    setFeedback(submission.feedback || '');
  };

  // Save grade/feedback (replace with real API)
  const saveGrade = () => {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      setSubmissions(submissions =>
        submissions.map(s =>
          s.id === selected.id ? { ...s, grade, feedback } : s
        )
      );
      setSaving(false);
      setSelected(null);
    }, 600);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Assignment Grading</h1>
      {loading ? (
        <div className="text-gray-500">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="text-gray-500">No submissions found.</div>
      ) : (
        <table className="min-w-full border mb-8">
          <thead>
            <tr>
              <th className="border px-2 py-1">Student</th>
              <th className="border px-2 py-1">Assignment</th>
              <th className="border px-2 py-1">Submitted At</th>
              <th className="border px-2 py-1">File</th>
              <th className="border px-2 py-1">Grade</th>
              <th className="border px-2 py-1">Feedback</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => (
              <tr key={sub.id}>
                <td className="border px-2 py-1">{sub.student_name}</td>
                <td className="border px-2 py-1">{sub.assignment_title}</td>
                <td className="border px-2 py-1">
                  {new Date(sub.submitted_at).toLocaleString()}
                </td>
                <td className="border px-2 py-1">
                  {sub.file_url ? (
                    <a
                      href={sub.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="border px-2 py-1">{sub.grade || '-'}</td>
                <td className="border px-2 py-1">{sub.feedback || '-'}</td>
                <td className="border px-2 py-1">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                    onClick={() => openGrading(sub)}
                  >
                    Grade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Grading Modal */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">
              Grade: {selected.student_name} - {selected.assignment_title}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium">Grade</label>
              <input
                type="text"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="border px-2 py-1 rounded w-full"
                placeholder="e.g. A, B+, 95"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Feedback</label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="border px-2 py-1 rounded w-full"
                rows={3}
                placeholder="Feedback for the student"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={saveGrade}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setSelected(null)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}