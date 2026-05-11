import React, { useEffect, useState } from 'react';
// Removed: import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import ReactModal from 'react-modal';

/**
 * SuperAdminDashboardPage
 * - Provides super admin with analytics and management tools.
 * - Displays user/admin counts, recent activity, analytics charts, error logs, user management, and audit logging.
 * - Access is restricted to users with role 'admin' in the users table.
 */

// Helper to log admin actions to the audit log table
async function logAdminAction(adminId: string, targetUserId: string, action: string, details: any = {}) {
  await supabase.from('admin_audit_log').insert([
    {
      admin_id: adminId,
      target_user_id: targetUserId,
      action,
      details,
    },
  ]);
}

export default function SuperAdminDashboardPage() {
  // State for route protection
  const [authChecked, setAuthChecked] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

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

  // User management enhancements
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);

  // Audit log state and filters
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditPage, setAuditPage] = useState(1);
  const auditLogsPerPage = 20;
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  // --- Route Protection: Only allow superadmins ---
  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in.');
        window.location.replace('/login');
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (error || !data || data.role !== 'admin') {
        toast.error('Access denied. Superadmin only.');
        window.location.replace('/');
        return;
      }
      setAdminUserId(user.id); // Save admin user id for logging
      setAuthChecked(true);
    };
    checkSuperAdmin();
    // eslint-disable-next-line
  }, []);

  // --- Fetch user/admin counts ---
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

  // --- Fetch recent activity from activity_log table ---
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

  // --- Fetch user growth (users created per day for last 14 days) ---
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

  // --- Fetch error logs (if available) ---
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

  // --- Fetch users for management ---
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

  // --- Fetch audit logs with pagination and emails ---
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setAuditLoading(true);
      // Count total logs for pagination
      const { count } = await supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact', head: true });
      setAuditTotalPages(Math.max(1, Math.ceil((count ?? 0) / auditLogsPerPage)));

      // Fetch paginated logs with emails
      const from = (auditPage - 1) * auditLogsPerPage;
      const to = from + auditLogsPerPage - 1;
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select(`
          id,
          action,
          details,
          created_at,
          admin:admin_id (email),
          target:target_user_id (email)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (!error && data) setAuditLogs(data);
      setAuditLoading(false);
    };
    fetchAuditLogs();
    // eslint-disable-next-line
  }, [auditPage]);

  // --- User Management Handlers with Audit Logging ---

  // Promote user to admin
  const handleMakeAdmin = async (userId: string) => {
    const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
    if (!error) {
      toast.success('Role updated!');
      setUsers(users =>
        users.map(u => (u.id === userId ? { ...u, role: 'admin' } : u))
      );
      setAdminCount((prev) => (prev !== null ? prev + 1 : null));
      if (adminUserId) {
        await logAdminAction(adminUserId, userId, 'make_admin', {});
      }
    } else {
      toast.error('Failed to update role.');
    }
  };

  // Deactivate user
  const handleDeactivate = async (userId: string) => {
    const { error } = await supabase.from('users').update({ role: 'deactivated' }).eq('id', userId);
    if (!error) {
      toast.success('User deactivated!');
      setUsers(users => users.map(u => (u.id === userId ? { ...u, role: 'deactivated' } : u)));
      if (adminUserId) {
        await logAdminAction(adminUserId, userId, 'deactivate', {});
      }
    } else {
      toast.error('Failed to deactivate user.');
    }
  };

  // Delete user
  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (!error) {
      toast.success('User deleted!');
      setUsers(users => users.filter(u => u.id !== userId));
      if (adminUserId) {
        await logAdminAction(adminUserId, userId, 'delete', {});
      }
    } else {
      toast.error('Failed to delete user.');
    }
  };

  // Change user role (inline editing)
  const handleChangeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (!error) {
      toast.success('Role updated!');
      setUsers(users =>
        users.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (adminUserId) {
        await logAdminAction(adminUserId, userId, 'change_role', { newRole });
      }
      // Optionally update admin count if role changed to/from admin
      if (newRole === 'admin') setAdminCount((prev) => (prev !== null ? prev + 1 : null));
      if (newRole !== 'admin') setAdminCount((prev) => (prev !== null ? prev - 1 : null));
    } else {
      toast.error('Failed to update role.');
    }
  };

  // Reset password (mock)
  const handleResetPassword = async (email: string) => {
    toast.info(`Password reset link sent to ${email} (mock).`);
  };

  // --- User Detail Modal logic ---
  const openUserDetail = async (userId: string) => {
    setUserDetailLoading(true);
    setUserDetailError(null);
    setSelectedUser(null);
    setEditUser(null);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) {
      setUserDetailError('Failed to load user details.');
    } else {
      setSelectedUser(data);
      setEditUser({ ...data });
    }
    setUserDetailLoading(false);
  };

  const saveUserDetails = async () => {
    if (!editUser) return;
    setUserDetailLoading(true);
    const { error } = await supabase
      .from('users')
      .update({
        email: editUser.email,
        // Add other editable fields here if needed
      })
      .eq('id', editUser.id);
    if (!error) {
      toast.success('User updated!');
      setSelectedUser(editUser);
      setUsers(users =>
        users.map(u => (u.id === editUser.id ? { ...u, ...editUser } : u))
      );
      if (adminUserId) {
        await logAdminAction(adminUserId, editUser.id, 'edit_user', { ...editUser });
      }
    } else {
      toast.error('Failed to update user.');
    }
    setUserDetailLoading(false);
  };

  // --- Modal: Reset password and send verification email handlers ---
  const handleModalResetPassword = async (email: string) => {
    toast.info(`Password reset link sent to ${email} (mock).`);
  };

  const handleModalSendVerification = async (email: string) => {
    toast.info(`Verification email sent to ${email} (mock).`);
  };

  // --- User Management Filtering & Pagination ---
  const filteredUsers = users
    .filter(u =>
      (!userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase())) &&
      (roleFilter === 'all' || u.role === roleFilter)
    );
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // --- Audit log filtering ---
  const filteredAuditLogs = auditLogs.filter(log =>
    (!auditSearch ||
      (log.admin?.email && log.admin.email.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.target?.email && log.target.email.toLowerCase().includes(auditSearch.toLowerCase()))
    ) &&
    (auditActionFilter === 'all' || log.action === auditActionFilter)
  );

  // --- Export audit logs as CSV ---
  const exportAuditLogsCSV = () => {
    const headers = ['Time', 'Admin Email', 'Target User Email', 'Action', 'Details'];
    const rows = filteredAuditLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.admin?.email || '-',
      log.target?.email || '-',
      log.action,
      JSON.stringify(log.details),
    ]);
    const csvContent =
      [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_audit_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Export audit logs as JSON ---
  const exportAuditLogsJSON = () => {
    const json = JSON.stringify(filteredAuditLogs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_audit_log_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Route protection loading state ---
  if (!authChecked) {
    return (
      <div className="p-8 text-center text-gray-500">
        Checking permissions...
      </div>
    );
  }

  // --- Main Dashboard UI ---
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
        {/* Search and Filter */}
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by email"
            value={userSearch}
            onChange={e => {
              setUserSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="border px-2 py-1 rounded"
          />
          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border px-2 py-1 rounded"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="deactivated">Deactivated</option>
            <option value="user">User</option>
          </select>
        </div>
        {usersLoading ? (
          <div className="text-gray-500">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-gray-500">No users found.</div>
        ) : (
          <>
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
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="border px-2 py-1">
                      <button
                        className="underline text-blue-600"
                        onClick={() => openUserDetail(user.id)}
                      >
                        {user.email}
                      </button>
                    </td>
                    {/* Inline role editing */}
                    <td className="border px-2 py-1">
                      <select
                        value={user.role}
                        onChange={e => {
                          const newRole = e.target.value;
                          if (
                            window.confirm(
                              `Are you sure you want to change this user's role to "${newRole}"?`
                            )
                          ) {
                            handleChangeRole(user.id, newRole);
                          }
                        }}
                        className="border rounded px-1 py-0.5 text-xs"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="deactivated">Deactivated</option>
                      </select>
                    </td>
                    <td className="border px-2 py-1">{new Date(user.created_at).toLocaleString()}</td>
                    <td className="border px-2 py-1 flex flex-wrap gap-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to promote this user to admin?')) {
                            handleMakeAdmin(user.id);
                          }
                        }}
                        disabled={user.role === 'admin'}
                      >
                        Make Admin
                      </button>
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to deactivate this user?')) {
                            handleDeactivate(user.id);
                          }
                        }}
                        disabled={user.role === 'deactivated'}
                      >
                        Deactivate
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this user?')) {
                            handleDelete(user.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                      <button
                        className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
                        onClick={() => handleResetPassword(user.email)}
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex gap-2 mt-4">
              <button
                className="px-2 py-1 border rounded"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className="px-2 py-1">{currentPage} / {totalPages}</span>
              <button
                className="px-2 py-1 border rounded"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* User Detail Modal */}
      <ReactModal
        isOpen={!!selectedUser}
        onRequestClose={() => setSelectedUser(null)}
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
      >
        <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
          <button
            className="absolute top-2 right-2 text-gray-500"
            onClick={() => setSelectedUser(null)}
          >
            ✕
          </button>
          <h2 className="text-xl font-bold mb-4">User Details</h2>
          {userDetailLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : userDetailError ? (
            <div className="text-red-500">{userDetailError}</div>
          ) : editUser ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                saveUserDetails();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                  className="border px-2 py-1 rounded w-full"
                  required
                />
              </div>
              {/* Add more editable fields as needed */}
              {/* Example:
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={editUser.name || ''}
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                  className="border px-2 py-1 rounded w-full"
                />
              </div>
              */}
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={userDetailLoading}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="bg-gray-300 px-4 py-2 rounded"
                  onClick={() => setSelectedUser(null)}
                >
                  Cancel
                </button>
              </div>
              {/* Password reset and verification actions */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => handleModalResetPassword(editUser.email)}
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  className="bg-green-600 text-white px-4 py-2 rounded"
                  onClick={() => handleModalSendVerification(editUser.email)}
                >
                  Send Verification Email
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </ReactModal>

      {/* Admin Audit Log */}
      <div className="bg-white border rounded p-6 shadow mb-8">
        <div className="text-lg font-semibold mb-2">Admin Audit Log</div>
        {/* Audit log search, filter, and export */}
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by admin or user email"
            value={auditSearch}
            onChange={e => setAuditSearch(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <select
            value={auditActionFilter}
            onChange={e => setAuditActionFilter(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="all">All Actions</option>
            <option value="make_admin">Make Admin</option>
            <option value="deactivate">Deactivate</option>
            <option value="delete">Delete</option>
            <option value="change_role">Change Role</option>
            <option value="edit_user">Edit User</option>
          </select>
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
            onClick={exportAuditLogsCSV}
          >
            Export CSV
          </button>
          <button
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
            onClick={exportAuditLogsJSON}
          >
            Export JSON
          </button>
        </div>
        {auditLoading ? (
          <div className="text-gray-500">Loading audit log...</div>
        ) : filteredAuditLogs.length === 0 ? (
          <div className="text-gray-500">No audit log entries found.</div>
        ) : (
          <>
            <table className="min-w-full border text-xs">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Time</th>
                  <th className="border px-2 py-1">Admin Email</th>
                  <th className="border px-2 py-1">Target User Email</th>
                  <th className="border px-2 py-1">Action</th>
                  <th className="border px-2 py-1">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="border px-2 py-1">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="border px-2 py-1">{log.admin?.email || '-'}</td>
                    <td className="border px-2 py-1">{log.target?.email || '-'}</td>
                    <td className="border px-2 py-1">{log.action}</td>
                    <td className="border px-2 py-1">{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Audit log pagination */}
            <div className="flex gap-2 mt-4">
              <button
                className="px-2 py-1 border rounded"
                onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                disabled={auditPage === 1}
              >
                Prev
              </button>
              <span className="px-2 py-1">{auditPage} / {auditTotalPages}</span>
              <button
                className="px-2 py-1 border rounded"
                onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                disabled={auditPage === auditTotalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}