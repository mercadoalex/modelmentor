import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * ProgressPage
 * - Shows user/class progress with filters and a summary chart.
 */
export default function ProgressPage() {
  const [progressData, setProgressData] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<{ [id: number]: string }>({});
  const [users, setUsers] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedConcept, setSelectedConcept] = useState<number | 'all'>('all');

  // Fetch concepts and users for mapping IDs to names
  useEffect(() => {
    const fetchMeta = async () => {
      const { data: conceptsData } = await supabase.from('concepts').select('id, name');
      const conceptsMap: { [id: number]: string } = {};
      conceptsData?.forEach((c: any) => (conceptsMap[c.id] = c.name));
      setConcepts(conceptsMap);

      const { data: usersData } = await supabase.from('users').select('id, email');
      const usersMap: { [id: string]: string } = {};
      usersData?.forEach((u: any) => (usersMap[u.id] = u.email));
      setUsers(usersMap);
    };
    fetchMeta();
  }, []);

  // Fetch progress data from Supabase
  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('concept_progress')
        .select('concept_id, progress, user_id');
      if (error) {
        setError('Failed to fetch progress data.');
        toast.error('Failed to fetch progress data.');
      } else {
        setProgressData(data || []);
      }
      setLoading(false);
    };
    fetchProgress();
  }, []);

  // Filtered data
  const filteredData = progressData.filter(row =>
    (selectedUser === 'all' || row.user_id === selectedUser) &&
    (selectedConcept === 'all' || row.concept_id === selectedConcept)
  );

  // Chart data: average progress per concept
  const chartData = Object.entries(concepts).map(([conceptId, name]) => {
    const rows = progressData.filter(row => row.concept_id === Number(conceptId));
    const avg =
      rows.length > 0
        ? rows.reduce((sum, r) => sum + (r.progress ?? 0), 0) / rows.length
        : 0;
    return { name, avg };
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Progress</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2 font-semibold">User:</label>
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="all">All</option>
            {Object.entries(users).map(([id, email]) => (
              <option key={id} value={id}>{email}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Concept:</label>
          <select
            value={selectedConcept}
            onChange={e => setSelectedConcept(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value="all">All</option>
            {Object.entries(concepts).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Simple Chart: Average Progress per Concept */}
      <div className="mb-8">
        <h2 className="font-semibold mb-2">Average Progress per Concept</h2>
        <div className="flex gap-4 overflow-x-auto">
          {chartData.map(({ name, avg }) => (
            <div key={name} className="flex flex-col items-center">
              <div className="w-8 h-24 bg-gray-200 rounded flex items-end">
                <div
                  className="bg-blue-500 w-8 rounded"
                  style={{ height: `${avg * 96}px` }}
                  title={`${(avg * 100).toFixed(0)}%`}
                />
              </div>
              <div className="text-xs mt-1 text-center w-16 truncate">{name}</div>
              <div className="text-xs text-gray-600">{(avg * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          <table className="min-w-full border mt-4">
            <thead>
              <tr>
                <th className="border px-2 py-1">User</th>
                <th className="border px-2 py-1">Concept</th>
                <th className="border px-2 py-1">Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{users[row.user_id] || row.user_id}</td>
                  <td className="border px-2 py-1">{concepts[row.concept_id] || row.concept_id}</td>
                  <td className="border px-2 py-1">
                    <div className="w-32 bg-gray-200 rounded h-2">
                      <div
                        className="bg-blue-500 h-2 rounded"
                        style={{ width: `${(row.progress ?? 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs ml-2">{((row.progress ?? 0) * 100).toFixed(0)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}