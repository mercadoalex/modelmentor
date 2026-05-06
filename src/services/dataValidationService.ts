export interface DataValidationResult {
  isValid: boolean;
  qualityScore: number; // 0-100
  issues: DataIssue[];
  statistics: DataStatistics;
  columnInfo: ColumnInfo[];
}

export interface DataIssue {
  severity: 'critical' | 'warning' | 'info';
  type: 'missing_values' | 'duplicate_rows' | 'invalid_type' | 'outliers' | 'empty_column' | 'inconsistent_format';
  column?: string;
  message: string;
  affectedRows?: number;
  suggestion?: string;
}

export interface DataStatistics {
  totalRows: number;
  totalColumns: number;
  missingValueCount: number;
  duplicateRowCount: number;
  numericColumns: number;
  categoricalColumns: number;
  dateColumns: number;
}

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text' | 'unknown';
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  sampleValues: string[];
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    std?: number;
  };
}

export const dataValidationService = {
  /**
   * Validate CSV data
   */
  validateData(data: string[][]): DataValidationResult {
    if (!data || data.length === 0) {
      return {
        isValid: false,
        qualityScore: 0,
        issues: [{
          severity: 'critical',
          type: 'missing_values',
          message: 'No data provided',
          suggestion: 'Please upload a valid CSV file with data',
        }],
        statistics: this.getEmptyStatistics(),
        columnInfo: [],
      };
    }

    const issues: DataIssue[] = [];
    const headers = data[0];
    const rows = data.slice(1);

    // Check if there's at least one row of data
    if (rows.length === 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_values',
        message: 'No data rows found',
        suggestion: 'CSV file must contain at least one row of data',
      });
    }

    // Analyze columns
    const columnInfo = this.analyzeColumns(headers, rows);

    // Detect issues
    this.detectMissingValues(columnInfo, rows.length, issues);
    this.detectDuplicateRows(rows, issues);
    this.detectEmptyColumns(columnInfo, issues);
    this.detectOutliers(columnInfo, issues);

    // Calculate statistics
    const statistics: DataStatistics = {
      totalRows: rows.length,
      totalColumns: headers.length,
      missingValueCount: columnInfo.reduce((sum, col) => sum + col.missingCount, 0),
      duplicateRowCount: this.countDuplicateRows(rows),
      numericColumns: columnInfo.filter(c => c.type === 'numeric').length,
      categoricalColumns: columnInfo.filter(c => c.type === 'categorical').length,
      dateColumns: columnInfo.filter(c => c.type === 'date').length,
    };

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(statistics, issues, rows.length, headers.length);

    // Determine if valid (no critical issues)
    const isValid = !issues.some(issue => issue.severity === 'critical');

    return {
      isValid,
      qualityScore,
      issues,
      statistics,
      columnInfo,
    };
  },

  /**
   * Analyze columns to determine types and statistics
   */
  analyzeColumns(headers: string[], rows: string[][]): ColumnInfo[] {
    return headers.map((header, colIndex) => {
      const values = rows.map(row => row[colIndex]).filter(v => v !== undefined);
      const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
      
      const missingCount = values.length - nonEmptyValues.length;
      const missingPercentage = (missingCount / values.length) * 100;
      const uniqueCount = new Set(nonEmptyValues).size;
      const sampleValues = Array.from(new Set(nonEmptyValues)).slice(0, 5);

      // Detect column type
      const type = this.detectColumnType(nonEmptyValues);

      // Calculate statistics for numeric columns
      let statistics;
      if (type === 'numeric') {
        const numericValues = nonEmptyValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (numericValues.length > 0) {
          const sorted = [...numericValues].sort((a, b) => a - b);
          const sum = numericValues.reduce((a, b) => a + b, 0);
          const mean = sum / numericValues.length;
          const median = sorted[Math.floor(sorted.length / 2)];
          const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
          const std = Math.sqrt(variance);

          statistics = {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            mean: parseFloat(mean.toFixed(2)),
            median: parseFloat(median.toFixed(2)),
            std: parseFloat(std.toFixed(2)),
          };
        }
      }

      return {
        name: header,
        type,
        missingCount,
        missingPercentage: parseFloat(missingPercentage.toFixed(2)),
        uniqueCount,
        sampleValues,
        statistics,
      };
    });
  },

  /**
   * Detect column type
   */
  detectColumnType(values: string[]): ColumnInfo['type'] {
    if (values.length === 0) return 'unknown';

    // Check if numeric
    const numericCount = values.filter(v => !isNaN(parseFloat(v)) && isFinite(parseFloat(v))).length;
    if (numericCount / values.length > 0.8) return 'numeric';

    // Check if date
    const dateCount = values.filter(v => !isNaN(Date.parse(v))).length;
    if (dateCount / values.length > 0.8) return 'date';

    // Check if categorical (low unique count relative to total)
    const uniqueCount = new Set(values).size;
    if (uniqueCount < values.length * 0.5 && uniqueCount < 50) return 'categorical';

    return 'text';
  },

  /**
   * Detect missing values
   */
  detectMissingValues(columnInfo: ColumnInfo[], totalRows: number, issues: DataIssue[]) {
    columnInfo.forEach(col => {
      if (col.missingPercentage > 50) {
        issues.push({
          severity: 'critical',
          type: 'missing_values',
          column: col.name,
          message: `Column "${col.name}" has ${col.missingPercentage.toFixed(1)}% missing values`,
          affectedRows: col.missingCount,
          suggestion: 'Consider removing this column or filling missing values',
        });
      } else if (col.missingPercentage > 20) {
        issues.push({
          severity: 'warning',
          type: 'missing_values',
          column: col.name,
          message: `Column "${col.name}" has ${col.missingPercentage.toFixed(1)}% missing values`,
          affectedRows: col.missingCount,
          suggestion: 'Consider filling missing values with mean/median or removing affected rows',
        });
      } else if (col.missingPercentage > 0) {
        issues.push({
          severity: 'info',
          type: 'missing_values',
          column: col.name,
          message: `Column "${col.name}" has ${col.missingCount} missing values`,
          affectedRows: col.missingCount,
          suggestion: 'Missing values will be handled during training',
        });
      }
    });
  },

  /**
   * Detect duplicate rows
   */
  detectDuplicateRows(rows: string[][], issues: DataIssue[]) {
    const duplicateCount = this.countDuplicateRows(rows);
    
    if (duplicateCount > 0) {
      const percentage = (duplicateCount / rows.length) * 100;
      
      if (percentage > 10) {
        issues.push({
          severity: 'warning',
          type: 'duplicate_rows',
          message: `Found ${duplicateCount} duplicate rows (${percentage.toFixed(1)}%)`,
          affectedRows: duplicateCount,
          suggestion: 'Consider removing duplicate rows to improve model performance',
        });
      } else {
        issues.push({
          severity: 'info',
          type: 'duplicate_rows',
          message: `Found ${duplicateCount} duplicate rows`,
          affectedRows: duplicateCount,
          suggestion: 'Duplicate rows detected but percentage is low',
        });
      }
    }
  },

  /**
   * Count duplicate rows
   */
  countDuplicateRows(rows: string[][]): number {
    const seen = new Set<string>();
    let duplicates = 0;

    rows.forEach(row => {
      const key = row.join('|');
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    });

    return duplicates;
  },

  /**
   * Detect empty columns
   */
  detectEmptyColumns(columnInfo: ColumnInfo[], issues: DataIssue[]) {
    columnInfo.forEach(col => {
      if (col.missingPercentage === 100) {
        issues.push({
          severity: 'critical',
          type: 'empty_column',
          column: col.name,
          message: `Column "${col.name}" is completely empty`,
          suggestion: 'Remove this column before training',
        });
      }
    });
  },

  /**
   * Detect outliers in numeric columns
   */
  detectOutliers(columnInfo: ColumnInfo[], issues: DataIssue[]) {
    columnInfo.forEach(col => {
      if (col.type === 'numeric' && col.statistics) {
        const { mean, std } = col.statistics;
        if (mean !== undefined && std !== undefined) {
          // Simple outlier detection: values beyond 3 standard deviations
          const threshold = std * 3;
          
          if (std > mean * 2) {
            issues.push({
              severity: 'info',
              type: 'outliers',
              column: col.name,
              message: `Column "${col.name}" may contain outliers (high variance)`,
              suggestion: 'Review data distribution and consider outlier treatment',
            });
          }
        }
      }
    });
  },

  /**
   * Calculate overall data quality score
   */
  calculateQualityScore(
    statistics: DataStatistics,
    issues: DataIssue[],
    totalRows: number,
    totalColumns: number
  ): number {
    let score = 100;

    // Deduct for missing values
    const missingPercentage = (statistics.missingValueCount / (totalRows * totalColumns)) * 100;
    score -= missingPercentage * 0.5;

    // Deduct for duplicates
    const duplicatePercentage = (statistics.duplicateRowCount / totalRows) * 100;
    score -= duplicatePercentage * 0.3;

    // Deduct for critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    score -= criticalIssues * 15;

    // Deduct for warnings
    const warnings = issues.filter(i => i.severity === 'warning').length;
    score -= warnings * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  },

  /**
   * Get empty statistics
   */
  getEmptyStatistics(): DataStatistics {
    return {
      totalRows: 0,
      totalColumns: 0,
      missingValueCount: 0,
      duplicateRowCount: 0,
      numericColumns: 0,
      categoricalColumns: 0,
      dateColumns: 0,
    };
  },

  /**
   * Parse CSV string to 2D array
   */
  parseCSV(csvString: string): string[][] {
    const lines = csvString.split('\n').filter(line => line.trim());
    return lines.map(line => {
      // Simple CSV parsing (doesn't handle quoted commas)
      return line.split(',').map(cell => cell.trim());
    });
  },
};
