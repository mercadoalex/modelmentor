import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * SuperAdminDashboardPage
 * - Provides super admin with analytics and management tools.
 * - Displays user/admin counts, recent activity, analytics charts, error logs, and user management.
 */
export default function SuperAdminDashboardPage() {
  // Dashboard counts
  const [userCount, setUserCount] = useState<number | null>(null);
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recent activity state
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Analytics state
  const [userGrowth, setUserGrowth] = useState<{ date: string; count: number }[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Fetch user/admin counts
  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Count all users
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        setUserCount(userCount ?? 0);

        // Count admins (assuming a 'role' column)
        const { count: adminCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');
        setAdminCount(adminCount ?? 0);
      } catch (e) {
        setError('Failed to fetch dashboard data.');
        toast.error('Failed to fetch dashboard data.');
      }
      setLoading(false);
    };
    fetchCounts();
  }, []);

  // Fetch recent activity from activity_log table
  useEffect(() => {
    const fetchActivity = async () => {
      setActivityLoading(true);
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, user_id, action, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) {
        toast.error('Failed to fetch recent activity.');
        setRecentActivity([]);
      } else {
        setRecentActivity(data || []);
      }
      setActivityLoading(false);
    };
    fetchActivity();
  }, []);

  // Fetch user growth (users created per day for last 14 days)
  useEffect(() => {
    const fetchUserGrowth = async () => {
      // This assumes you have a user_growth_last_14_days RPC function
      const { data, error } = await supabase.rpc('user_growth_last_14_days');
      if (!error && data) {
        setUserGrowth(data);
      } else {
        setUserGrowth([]);
      }
    };
    fetchUserGrowth();
  }, []);

  // Fetch error logs (if available)
  useEffect(() => {
    const fetchLogs = async () => {
      setLogsLoading(true);
      const { data, error } = await supabase
        .from('error_logs')
        .select('id, message, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        setErrorLogs(data);
      } else {
        setErrorLogs([]);
      }
      setLogsLoading(false);
    };
    fetchLogs();
  }, []);

  // Fetch users for management
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });
      if (!error && data) setUsers(data);
      setUsersLoading(false);
    };
    fetchUsers();
  }, []);

  // Handler to promote a user to admin
  const handleMakeAdmin = async (userId: string) => {
    const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
    if (!error) {
      toast.success('Role updated!');
      setUsers(users =>
        users.map(u => (u.id === userId ? { ...u, role: 'admin' } : u))
      );
      setAdminCount((prev) => (prev !== null ? prev + 1 : null));
    } else {
      toast.error('Failed to update role.');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Super Admin Dashboard</h1>

      {/* User/Admin Counts */}
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border rounded p-6 shadow">
            <div className="text-lg font-semibold mb-2">Total Users</div>
            <div className="text-3xl font-bold">{userCount}</div>
          </div>
          <div className="bg-white border rounded p-6 shadow">
            <div className="text-lg font-semibold mb-2">Total Admins</div>
            <div className="text-3xl font-bold">{adminCount}</div>
          </div>
        </div>
      )}

      {/* User Growth Chart */}
      <div className="bg-white border rounded p-6 shadow mb-8">
        <div className="text-lg font-semibold mb-2">User Growth (Last 14 Days)</div>
        {userGrowth.length === 0 ? (
          <div className="text-gray-500">No user growth data.</div>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {userGrowth.map(({ date, count }) => (
              <div key={date} className="flex flex-col items-center">
                <div
                  className="bg-blue-500 w-6 rounded"
                  style={{ height: `${count * 8}px`, minHeight: 4 }}
                  title={`${count} new users`}
                />
                <div className="text-xs mt-1 text-center w-12 truncate">{date.slice(5)}</div>
                <div className="text-xs text-gray-600">{count}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white border rounded p-6 shadow mb-8">
        <div className="text-lg font-semibold mb-2">Recent Activity</div>
        {activityLoading ? (
          <div className="text-gray-500">Loading activity...</div>
        ) : recentActivity.length === 0 ? (
          <div className="text-gray-500">No recent activity found.</div>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border px-2 py-1">User ID</th>
                <th className="border px-2 py-1">Action</th>
                <th className="border px-2 py-1">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity) => (
                <tr key={activity.id}>
                  <td className="border px-2 py-1">{activity.user_id}</td>
                  <td className="border px-2 py-1">{activity.action}</td>
                  <td className="border px-2 py-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Error Logs */}
      <div className="bg-white border rounded p-6 shadow mb-8">
        <div className="text-lg font-semibold mb-2">Recent Error Logs</div>
        {logsLoading ? (
          <div className="text-gray-500">Loading error logs...</div>
        ) : errorLogs.length === 0 ? (
          <div className="text-gray-500">No error logs found.</div>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Time</th>
                <th className="border px-2 py-1">Message</th>
              </tr>
            </thead>
            <tbody>
              {errorLogs.map((log) => (
                <tr key={log.id}>
                  <td className="border px-2 py-1">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="border px-2 py-1">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Management */}
      <div className="bg-white border rounded p-6 shadow mb-8">
        <div className="text-lg font-semibold mb-2">User Management</div>
        {usersLoading ? (
          <div className="text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-gray-500">No users found.</div>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Role</th>
                <th className="border px-2 py-1">Created</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border px-2 py-1">{user.email}</td>
                  <td className="border px-2 py-1">{user.role}</td>
                  <td className="border px-2 py-1">{new Date(user.created_at).toLocaleString()}</td>
                  <td className="border px-2 py-1">
                    {/* Promote to admin button */}
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleMakeAdmin(user.id)}
                      disabled={user.role === 'admin'}
                    >
                      Make Admin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}