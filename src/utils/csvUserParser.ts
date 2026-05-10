import type { ImportUserRow } from '@/types/bulkImport';

const VALID_ROLES = ['student', 'teacher', 'admin', 'super_admin', 'school_admin'];

// ── Parse a CSV string into ImportUserRow[] ───────────────────────────────
export function parseUserCSV(csvText: string): ImportUserRow[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // First line = headers (case-insensitive)
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  return lines.slice(1).map((line, i) => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const get    = (col: string) => values[headers.indexOf(col)] ?? '';

    return {
      rowIndex:     i + 2,                 // row 1 = header
      email:        get('email'),
      firstName:    get('firstname'),
      lastName:     get('lastname'),
      role:         get('role'),
      organization: get('organization'),
      group:        get('group'),
      status:       'valid',               // default; validation service will update
      errors:       [],
    };
  });
}

// ── Generate a downloadable CSV template ──────────────────────────────────
export function generateCSVTemplate(): string {
  const header = 'email,firstName,lastName,role,organization,group';
  const sample = [
    'student@school.edu,Jane,Doe,student,Lincoln High,Section A',
    'teacher@school.edu,John,Smith,teacher,Lincoln High,',
    'admin@school.edu,Sara,Connor,admin,Lincoln High,',
  ];
  return [header, ...sample].join('\n');
}