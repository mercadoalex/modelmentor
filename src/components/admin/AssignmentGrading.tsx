import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
// Import toast from your toast library (here using sonner)
import { toast } from 'sonner';

/**
 * AssignmentGrading
 * - Displays all student submissions for an assignment in a table
 * - Shows attached files with preview
 * - Allows teachers to assign grades and feedback
 * - Supports filtering, sorting, pagination, bulk grading, student name search, and real-time updates (Supabase Realtime)
 */
export function AssignmentGrading({ assignmentId }: { assignmentId: string }) {
  // State for submissions, loading, filters, sorting, pagination, and bulk selection
  const [completions, setCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [filterName, setFilterName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkGrade, setBulkGrade] = useState<string>('');
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  // Sorting state
  const [sortKey, setSortKey] = useState<'student' | 'status' | 'grade'>('student');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Action loading state for save/bulk actions
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Fetch submissions for the assignment from Supabase and subscribe to realtime changes.
   */
  useEffect(() => {
    let isMounted = true;

    // Fetch data from Supabase
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId);

      if (!isMounted) return;
      if (error) {
        setCompletions([]);
        toast.error('Failed to fetch submissions.');
      } else {
        setCompletions(data || []);
      }
      setLoading(false);
    };

    fetchData();

    // Subscribe to realtime changes for this assignment's submissions
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `assignment_id=eq.${assignmentId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [assignmentId]);

  /**
   * Filter and sort completions based on current UI state.
   */
  const filteredCompletions = useMemo(() => {
    let filtered = completions.filter(c => {
      const statusMatch =
        filterStatus === 'all' ||
        (filterStatus === 'completed' && c.completed_at) ||
        (filterStatus === 'in_progress' && !c.completed_at);
      const nameMatch =
        !filterName ||
        (c.student_name && c.student_name.toLowerCase().includes(filterName.toLowerCase())) ||
        (c.student_id && c.student_id.toLowerCase().includes(filterName.toLowerCase()));
      return statusMatch && nameMatch;
    });

    // Sorting logic
    filtered = filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortKey === 'student') {
        aVal = a.student_name?.toLowerCase() || '';
        bVal = b.student_name?.toLowerCase() || '';
      } else if (sortKey === 'status') {
        aVal = a.completed_at ? 1 : 0;
        bVal = b.completed_at ? 1 : 0;
      } else if (sortKey === 'grade') {
        aVal = a.grade ?? -1;
        bVal = b.grade ?? -1;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [completions, filterStatus, filterName, sortKey, sortDir]);

  /**
   * Paginate the filtered and sorted completions.
   */
  const paginatedCompletions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCompletions.slice(start, start + PAGE_SIZE);
  }, [filteredCompletions, page]);

  // Reset to first page when filters or sorting change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterName, sortKey, sortDir]);

  /**
   * Handle sorting when header is clicked.
   */
  const handleSort = (key: 'student' | 'status' | 'grade') => {
    if (sortKey === key) {
      setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  /**
   * Handle grade and feedback update (per student, local state only).
   */
  const handleGradeChange = (id: string, grade: string) => {
    setCompletions(completions =>
      completions.map(c =>
        c.id === id ? { ...c, grade: grade === '' ? null : Number(grade) } : c
      )
    );
  };

  const handleFeedbackChange = (id: string, feedback: string) => {
    setCompletions(completions =>
      completions.map(c =>
        c.id === id ? { ...c, feedback } : c
      )
    );
  };

  /**
   * Save grade/feedback to Supabase for a single submission.
   * Shows toast and disables inputs while saving.
   * Realtime will update the UI after save.
   */
  const handleSave = async (id: string) => {
    const completion = completions.find(c => c.id === id);
    if (!completion) return;

    setActionLoading(true);
    const { error } = await supabase
      .from('submissions')
      .update({
        grade: completion.grade,
        feedback: completion.feedback,
      })
      .eq('id', id);

    setActionLoading(false);

    if (error) {
      toast.error('Failed to save grade/feedback.');
    } else {
      toast.success('Grade and feedback saved!');
    }
    // No local state update needed; realtime will refresh data
  };

  /**
   * Bulk grading handler: update grade/feedback for all selected submissions in Supabase.
   * Shows toast and disables inputs while saving.
   * Realtime will update the UI after save.
   */
  const handleBulkGrade = async () => {
    setActionLoading(true);
    const { error } = await supabase
      .from('submissions')
      .update({
        grade: bulkGrade === '' ? null : Number(bulkGrade),
        feedback: bulkFeedback,
      })
      .in('id', selectedIds);

    setActionLoading(false);
    setShowBulk(false);
    setBulkGrade('');
    setBulkFeedback('');

    if (error) {
      toast.error('Failed to apply bulk grade/feedback.');
    } else {
      toast.success('Bulk grade and feedback applied!');
    }
    // No local state update needed; realtime will refresh data
  };

  /**
   * Bulk selection handlers.
   */
  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(ids =>
      checked ? [...ids, id] : ids.filter(selId => selId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginatedCompletions.map(c => c.id) : []);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Student Submissions</h2>
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2 font-medium">Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="border rounded px-2 py-1"
            disabled={actionLoading}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium">Student Name:</label>
          <input
            type="text"
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="Search by name or ID"
            disabled={actionLoading}
          />
        </div>
        <div>
          <input
            type="checkbox"
            checked={
              paginatedCompletions.length > 0 &&
              selectedIds.length === paginatedCompletions.length
            }
            onChange={e => handleSelectAll(e.target.checked)}
            className="mr-2"
            id="select-all"
            disabled={actionLoading}
          />
          <label htmlFor="select-all" className="font-medium">
            Select All (Page)
          </label>
        </div>
        <Button
          variant="outline"
          disabled={selectedIds.length === 0 || actionLoading}
          onClick={() => setShowBulk(true)}
        >
          Bulk Grade
        </Button>
      </div>

      {/* Bulk Grading Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Bulk Grade Selected Submissions</h3>
            <div className="mb-2">
              <label className="font-medium mr-2">Grade:</label>
              <input
                type="number"
                min={0}
                max={100}
                value={bulkGrade}
                onChange={e => setBulkGrade(e.target.value)}
                className="border rounded px-2 py-1 w-24"
                disabled={actionLoading}
              />
            </div>
            <div className="mb-2">
              <label className="font-medium mr-2">Feedback:</label>
              <textarea
                value={bulkFeedback}
                onChange={e => setBulkFeedback(e.target.value)}
                className="border rounded px-2 py-1 w-full"
                rows={2}
                disabled={actionLoading}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleBulkGrade} disabled={bulkGrade === '' || actionLoading}>
                {actionLoading ? 'Saving...' : `Apply to ${selectedIds.length} Selected`}
              </Button>
              <Button variant="outline" onClick={() => setShowBulk(false)} disabled={actionLoading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table View for Submissions with Pagination */}
      {loading ? (
        <div>Loading...</div>
      ) : filteredCompletions.length === 0 ? (
        <div>No submissions found.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-100 p-1">
                    <input
                      type="checkbox"
                      checked={
                        paginatedCompletions.length > 0 &&
                        selectedIds.length === paginatedCompletions.length
                      }
                      onChange={e => handleSelectAll(e.target.checked)}
                      disabled={actionLoading}
                    />
                  </th>
                  <th
                    className="border border-gray-300 bg-gray-100 p-1 cursor-pointer select-none"
                    onClick={() => handleSort('student')}
                  >
                    Student
                    {sortKey === 'student' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                  <th
                    className="border border-gray-300 bg-gray-100 p-1 cursor-pointer select-none"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {sortKey === 'status' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                  <th className="border border-gray-300 bg-gray-100 p-1">File</th>
                  <th
                    className="border border-gray-300 bg-gray-100 p-1 cursor-pointer select-none"
                    onClick={() => handleSort('grade')}
                  >
                    Grade
                    {sortKey === 'grade' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                  <th className="border border-gray-300 bg-gray-100 p-1">Feedback</th>
                  <th className="border border-gray-300 bg-gray-100 p-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompletions.map(completion => (
                  <tr key={completion.id}>
                    <td className="border border-gray-300 text-center p-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(completion.id)}
                        onChange={e => handleSelect(completion.id, e.target.checked)}
                        disabled={actionLoading}
                      />
                    </td>
                    <td className="border border-gray-300 text-center p-1">
                      {completion.student_name} <br />
                      <span className="text-xs text-muted-foreground">{completion.student_id}</span>
                    </td>
                    <td className="border border-gray-300 text-center p-1">
                      {completion.completed_at ? (
                        <span className="text-green-600">Completed</span>
                      ) : (
                        <span className="text-yellow-600">In Progress</span>
                      )}
                    </td>
                    <td className="border border-gray-300 text-center p-1">
                      {completion.file_url ? (
                        <div>
                          <a
                            href={completion.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-600"
                          >
                            Download
                          </a>
                          <div className="mt-1">
                            {completion.file_url.match(/\.(jpg|jpeg|png|gif)$/i) && (
                              <img
                                src={completion.file_url}
                                alt="Preview"
                                className="max-w-[80px] max-h-[60px] border rounded"
                              />
                            )}
                            {completion.file_url.match(/\.pdf$/i) && (
                              <iframe
                                src={completion.file_url}
                                title="PDF Preview"
                                className="w-24 h-16 border rounded"
                              />
                            )}
                            {completion.file_url.match(/\.(txt|csv|md)$/i) && (
                              <iframe
                                src={completion.file_url}
                                title="Text Preview"
                                className="w-24 h-16 border rounded"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <span>No file</span>
                      )}
                    </td>
                    <td className="border border-gray-300 text-center p-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={completion.grade ?? ''}
                        onChange={e => handleGradeChange(completion.id, e.target.value)}
                        className="border rounded px-2 py-1 w-16"
                        disabled={actionLoading}
                      />
                    </td>
                    <td className="border border-gray-300 text-center p-1">
                      <textarea
                        value={completion.feedback}
                        onChange={e => handleFeedbackChange(completion.id, e.target.value)}
                        className="border rounded px-2 py-1 w-32"
                        rows={2}
                        disabled={actionLoading}
                      />
                    </td>
                    <td className="border border-gray-300 text-center p-1">
                      <Button
                        size="sm"
                        onClick={() => handleSave(completion.id)}
                        disabled={completion.grade === null || actionLoading}
                      >
                        {actionLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredCompletions.length)}-
              {Math.min(page * PAGE_SIZE, filteredCompletions.length)} of {filteredCompletions.length}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || actionLoading}
              >
                Previous
              </Button>
              <span className="text-sm px-2">Page {page}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page * PAGE_SIZE >= filteredCompletions.length || actionLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}