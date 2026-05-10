export type ImportStatus = 'valid' | 'invalid' | 'duplicate' | 'error';

export interface ImportUserRow {
  rowIndex:     number;
  email:        string;
  firstName:    string;
  lastName:     string;
  role:         string;
  organization: string;
  group:        string;
  status:       ImportStatus;
  errors:       string[];
}

export interface ImportResultRow {
  rowIndex: number;
  email:    string;
  success:  boolean;
  error?:   string;
}

export interface ImportReport {
  totalRows:     number;
  imported:      number;
  failed:        number;
  duplicateRows: number;
  completedAt:   string;
  results:       ImportResultRow[];
}