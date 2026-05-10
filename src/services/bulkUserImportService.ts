import { supabase }          from '@/db/supabase';
import { invitationService } from '@/services/invitationService';
import type { ImportUserRow, ImportReport, ImportResultRow } from '@/types/bulkImport';
import type { UserRole } from '@/types/types';

export const bulkUserImportService = {

  async importUsers(rows: ImportUserRow[]): Promise<ImportReport> {
    const validRows     = rows.filter(r => r.status === 'valid');
    const duplicateRows = rows.filter(r => r.status === 'duplicate').length;
    const results: ImportResultRow[] = [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const organizationId: string = profile?.organization_id ?? '';

    for (const row of validRows) {
      try {
        const invitation = await invitationService.create(
          organizationId,
          row.email,
          row.role as UserRole,
          user.id,
          7
        );
        if (!invitation) throw new Error('Invitation creation returned null');
        results.push({ rowIndex: row.rowIndex, email: row.email, success: true });
      } catch (err: any) {
        results.push({
          rowIndex: row.rowIndex,
          email:    row.email,
          success:  false,
          error:    err?.message ?? 'Unknown error',
        });
      }
    }

    return {
      totalRows:    rows.length,
      imported:     results.filter(r => r.success).length,
      failed:       results.filter(r => !r.success).length,
      duplicateRows,
      completedAt:  new Date().toISOString(),
      results,
    };
  },
};
