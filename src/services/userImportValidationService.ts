import { supabase } from '@/db/supabase';
import type { ImportUserRow } from '@/types/bulkImport';

const VALID_ROLES    = ['student', 'teacher', 'admin', 'super_admin', 'school_admin'];
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─────────────────────────────────────────────────────────────────────────────
// userImportValidationService — validates parsed CSV rows before import
// ─────────────────────────────────────────────────────────────────────────────
export const userImportValidationService = {

  async validateRows(rows: ImportUserRow[]): Promise<ImportUserRow[]> {
    // Collect all emails to check for duplicates in DB in one query
    const emails = rows.map(r => r.email).filter(Boolean);

    const { data: existing } = await supabase
      .from('profiles')
      .select('email')
      .in('email', emails);

    const existingEmails = new Set((existing ?? []).map((p: any) => p.email?.toLowerCase()));

    // Track duplicates within the file itself
    const seenInFile = new Set<string>();

    return rows.map(row => {
      const errors: string[] = [];
      const email = row.email?.toLowerCase();

      // Required fields
      if (!row.email)     errors.push('Email is required');
      else if (!EMAIL_REGEX.test(row.email)) errors.push('Invalid email format');

      if (!row.firstName) errors.push('First name is required');
      if (!row.lastName)  errors.push('Last name is required');
      if (!row.role)      errors.push('Role is required');
      else if (!VALID_ROLES.includes(row.role))
        errors.push(`Invalid role "${row.role}". Must be one of: ${VALID_ROLES.join(', ')}`);

      // Duplicate in DB
      if (email && existingEmails.has(email)) {
        errors.push('Email already exists in the system');
        return { ...row, status: 'duplicate', errors };
      }

      // Duplicate within the file
      if (email && seenInFile.has(email)) {
        errors.push('Duplicate email in the CSV file');
        return { ...row, status: 'duplicate', errors };
      }

      if (email) seenInFile.add(email);

      return {
        ...row,
        status: errors.length > 0 ? 'invalid' : 'valid',
        errors,
      };
    });
  },
};