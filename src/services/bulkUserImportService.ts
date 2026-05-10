import { invitationService } from '@/services/invitationService';
import type { ImportUserRow, ImportReport, ImportResultRow } from '@/types/bulkImport';

// ─────────────────────────────────────────────────────────────────────────────
// bulkUserImportService — iterates valid rows and sends invitations via
// invitationService. Returns an ImportReport for the UI to display.
// ─────────────────────────────────────────────────────────────────────────────
export const bulkUserImportService = {

  async importUsers(rows: ImportUserRow[]): Promise<ImportReport> {
    const validRows    = rows.filter(r => r.status === 'valid');
    const duplicateRows = rows.filter(r => r.status === 'duplicate').length;
    const results: ImportResultRow[] = [];

    for (const row of validRows) {
      try {
        await invitationService.sendInvitation({
          email:     row.email,
          firstName: row.firstName,
          lastName:  row.lastName,
          role:      row.role as any,
        });
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

    const imported = results.filter(r => r.success).length;
    const failed   = results.filter(r => !r.success).length;

    return {
      totalRows:    rows.length,
      imported,
      failed,
      duplicateRows,
      completedAt:  new Date().toISOString(),
      results,
    };
  },
};