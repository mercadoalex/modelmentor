import type { ColumnInfo } from './dataValidationService';

export interface CleaningOperation {
  type: 'fill_missing' | 'remove_duplicates' | 'handle_outliers' | 'normalize';
  column?: string;
  method?: string;
  parameters?: Record<string, unknown>;
  affectedRows?: number;
}

export interface CleaningResult {
  data: string[][];
  operations: CleaningOperation[];
  summary: {
    rowsRemoved: number;
    valuesFilled: number;
    outliersHandled: number;
    columnsNormalized: number;
  };
}

export const dataCleaningService = {
  /**
   * Fill missing values in a column
   */
  fillMissingValues(
    data: string[][],
    columnIndex: number,
    method: 'mean' | 'median' | 'mode' | 'forward_fill' | 'constant',
    constantValue?: string
  ): { data: string[][]; valuesFilled: number } {
    const headers = data[0];
    const rows = data.slice(1);
    let valuesFilled = 0;

    // Get non-empty values
    const values = rows.map(row => row[columnIndex]).filter(v => v !== null && v !== undefined && v !== '');

    let fillValue: string;

    if (method === 'constant' && constantValue !== undefined) {
      fillValue = constantValue;
    } else if (method === 'mean') {
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      fillValue = mean.toFixed(2);
    } else if (method === 'median') {
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v)).sort((a, b) => a - b);
      const median = numericValues[Math.floor(numericValues.length / 2)];
      fillValue = median.toFixed(2);
    } else if (method === 'mode') {
      const frequency: Record<string, number> = {};
      values.forEach(v => {
        frequency[v] = (frequency[v] || 0) + 1;
      });
      fillValue = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0][0];
    } else if (method === 'forward_fill') {
      // Forward fill will be handled row by row
      fillValue = '';
    } else {
      fillValue = '';
    }

    const cleanedRows = rows.map((row, rowIndex) => {
      const newRow = [...row];
      if (!newRow[columnIndex] || newRow[columnIndex] === '') {
        if (method === 'forward_fill') {
          // Use previous non-empty value
          if (rowIndex > 0) {
            const prevValue = rows[rowIndex - 1][columnIndex];
            if (prevValue && prevValue !== '') {
              newRow[columnIndex] = prevValue;
              valuesFilled++;
            }
          }
        } else {
          newRow[columnIndex] = fillValue;
          valuesFilled++;
        }
      }
      return newRow;
    });

    return {
      data: [headers, ...cleanedRows],
      valuesFilled,
    };
  },

  /**
   * Fill all missing values in dataset
   */
  fillAllMissingValues(
    data: string[][],
    columnInfo: ColumnInfo[]
  ): { data: string[][]; valuesFilled: number } {
    let currentData = data;
    let totalFilled = 0;

    columnInfo.forEach((col, index) => {
      if (col.missingCount > 0) {
        // Choose method based on column type
        let method: 'mean' | 'median' | 'mode' = 'mode';
        if (col.type === 'numeric') {
          method = 'median'; // Median is more robust to outliers
        } else if (col.type === 'categorical') {
          method = 'mode';
        }

        const result = this.fillMissingValues(currentData, index, method);
        currentData = result.data;
        totalFilled += result.valuesFilled;
      }
    });

    return {
      data: currentData,
      valuesFilled: totalFilled,
    };
  },

  /**
   * Remove duplicate rows
   */
  removeDuplicates(data: string[][]): { data: string[][]; rowsRemoved: number } {
    const headers = data[0];
    const rows = data.slice(1);
    
    const seen = new Set<string>();
    const uniqueRows: string[][] = [];
    let duplicatesRemoved = 0;

    rows.forEach(row => {
      const key = row.join('|');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(row);
      } else {
        duplicatesRemoved++;
      }
    });

    return {
      data: [headers, ...uniqueRows],
      rowsRemoved: duplicatesRemoved,
    };
  },

  /**
   * Handle outliers in a numeric column
   */
  handleOutliers(
    data: string[][],
    columnIndex: number,
    method: 'cap' | 'remove',
    threshold: number = 3
  ): { data: string[][]; outliersHandled: number } {
    const headers = data[0];
    const rows = data.slice(1);

    // Get numeric values
    const values = rows.map(row => parseFloat(row[columnIndex])).filter(v => !isNaN(v));
    
    if (values.length === 0) {
      return { data, outliersHandled: 0 };
    }

    // Calculate mean and standard deviation
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    const lowerBound = mean - threshold * std;
    const upperBound = mean + threshold * std;

    let outliersHandled = 0;
    const cleanedRows: string[][] = [];

    rows.forEach(row => {
      const value = parseFloat(row[columnIndex]);
      
      if (isNaN(value)) {
        cleanedRows.push(row);
        return;
      }

      if (value < lowerBound || value > upperBound) {
        outliersHandled++;
        
        if (method === 'cap') {
          // Cap the value
          const newRow = [...row];
          if (value < lowerBound) {
            newRow[columnIndex] = lowerBound.toFixed(2);
          } else {
            newRow[columnIndex] = upperBound.toFixed(2);
          }
          cleanedRows.push(newRow);
        }
        // If method is 'remove', don't add the row
      } else {
        cleanedRows.push(row);
      }
    });

    return {
      data: [headers, ...cleanedRows],
      outliersHandled,
    };
  },

  /**
   * Normalize a numeric column
   */
  normalizeColumn(
    data: string[][],
    columnIndex: number,
    method: 'min-max' | 'z-score'
  ): { data: string[][]; normalized: boolean } {
    const headers = data[0];
    const rows = data.slice(1);

    // Get numeric values
    const values = rows.map(row => parseFloat(row[columnIndex])).filter(v => !isNaN(v));
    
    if (values.length === 0) {
      return { data, normalized: false };
    }

    let normalizedRows: string[][];

    if (method === 'min-max') {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;

      if (range === 0) {
        return { data, normalized: false };
      }

      normalizedRows = rows.map(row => {
        const newRow = [...row];
        const value = parseFloat(row[columnIndex]);
        if (!isNaN(value)) {
          const normalized = (value - min) / range;
          newRow[columnIndex] = normalized.toFixed(4);
        }
        return newRow;
      });
    } else {
      // z-score normalization
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);

      if (std === 0) {
        return { data, normalized: false };
      }

      normalizedRows = rows.map(row => {
        const newRow = [...row];
        const value = parseFloat(row[columnIndex]);
        if (!isNaN(value)) {
          const normalized = (value - mean) / std;
          newRow[columnIndex] = normalized.toFixed(4);
        }
        return newRow;
      });
    }

    return {
      data: [headers, ...normalizedRows],
      normalized: true,
    };
  },

  /**
   * Normalize all numeric columns
   */
  normalizeAllNumericColumns(
    data: string[][],
    columnInfo: ColumnInfo[],
    method: 'min-max' | 'z-score'
  ): { data: string[][]; columnsNormalized: number } {
    let currentData = data;
    let columnsNormalized = 0;

    columnInfo.forEach((col, index) => {
      if (col.type === 'numeric') {
        const result = this.normalizeColumn(currentData, index, method);
        if (result.normalized) {
          currentData = result.data;
          columnsNormalized++;
        }
      }
    });

    return {
      data: currentData,
      columnsNormalized,
    };
  },

  /**
   * Apply quick fix - automatic cleaning with sensible defaults
   */
  quickFix(data: string[][], columnInfo: ColumnInfo[]): CleaningResult {
    const operations: CleaningOperation[] = [];
    let currentData = data;
    let rowsRemoved = 0;
    let valuesFilled = 0;
    let outliersHandled = 0;
    let columnsNormalized = 0;

    // 1. Remove duplicates
    const duplicateResult = this.removeDuplicates(currentData);
    if (duplicateResult.rowsRemoved > 0) {
      currentData = duplicateResult.data;
      rowsRemoved += duplicateResult.rowsRemoved;
      operations.push({
        type: 'remove_duplicates',
        affectedRows: duplicateResult.rowsRemoved,
      });
    }

    // 2. Fill missing values
    const fillResult = this.fillAllMissingValues(currentData, columnInfo);
    if (fillResult.valuesFilled > 0) {
      currentData = fillResult.data;
      valuesFilled = fillResult.valuesFilled;
      operations.push({
        type: 'fill_missing',
        method: 'auto',
        affectedRows: fillResult.valuesFilled,
      });
    }

    // 3. Handle outliers in numeric columns (cap method)
    columnInfo.forEach((col, index) => {
      if (col.type === 'numeric' && col.statistics) {
        const outlierResult = this.handleOutliers(currentData, index, 'cap', 3);
        if (outlierResult.outliersHandled > 0) {
          currentData = outlierResult.data;
          outliersHandled += outlierResult.outliersHandled;
          operations.push({
            type: 'handle_outliers',
            column: col.name,
            method: 'cap',
            affectedRows: outlierResult.outliersHandled,
          });
        }
      }
    });

    return {
      data: currentData,
      operations,
      summary: {
        rowsRemoved,
        valuesFilled,
        outliersHandled,
        columnsNormalized,
      },
    };
  },

  /**
   * Convert data array to CSV string
   */
  dataToCSV(data: string[][]): string {
    return data.map(row => row.map(cell => {
      // Escape cells containing commas or quotes
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')).join('\n');
  },

  /**
   * Download CSV file
   */
  downloadCSV(data: string[][], filename: string) {
    const csv = this.dataToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
