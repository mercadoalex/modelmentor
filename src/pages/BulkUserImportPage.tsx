import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { BulkUserImportPanel } from '@/components/admin/BulkUserImport/BulkUserImportPanel';

// ─────────────────────────────────────────────────────────────────────────────
// BulkUserImportPage — super admin only page for batch user creation via CSV
// ─────────────────────────────────────────────────────────────────────────────
export default function BulkUserImportPage() {
  const { profile } = useAuth();
  const navigate    = useNavigate();

  // Guard: redirect non-admins away
  useEffect(() => {
    if (profile && !['admin', 'super_admin'].includes(profile.role)) {
      navigate('/');
    }
  }, [profile, navigate]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bulk User Import</h1>
          <p className="text-muted-foreground mt-1">
            Super Admin · Import users in bulk via CSV upload
          </p>
        </div>
        <BulkUserImportPanel />
      </div>
    </AppLayout>
  );
}