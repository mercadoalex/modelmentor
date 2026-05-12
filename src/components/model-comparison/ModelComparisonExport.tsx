import { useState } from 'react';
import { exportService } from '@/services/exportService';
import type { ExportOptions, ExportResult } from '@/types/comparison';

/**
 * Props for ModelComparisonExport
 */
interface ModelComparisonExportProps {
  /** Array of model IDs to export */
  modelIds: string[];
  /** Whether export buttons should be disabled */
  disabled?: boolean;
  /** Callback when export starts */
  onExportStart?: () => void;
  /** Callback when export completes successfully */
  onExportComplete?: (result: ExportResult) => void;
  /** Callback when export fails */
  onExportError?: (error: string) => void;
  /** User name for export metadata */
  userName?: string;
}

/**
 * ModelComparisonExport
 * - Provides export functionality for model comparison reports
 * - Supports PDF export, CSV export, and chart image export
 * - Shows loading indicators during export operations
 * - Handles errors with retry capability
 */
export function ModelComparisonExport({
  modelIds,
  disabled,
  onExportStart,
  onExportComplete,
  onExportError,
  userName = 'User',
}: ModelComparisonExportProps) {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingCharts, setExportingCharts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExporting = exportingPDF || exportingCSV || exportingCharts;

  const createExportOptions = (): ExportOptions => ({
    modelIds,
    includeCharts: true,
    includeMetrics: true,
    includePredictions: true,
    includeHyperparameters: true,
    includeLineage: true,
    userName,
    comparisonDate: new Date().toISOString(),
  });

  // Handler for exporting as PDF
  const handleExportPDF = async () => {
    setExportingPDF(true);
    setError(null);
    onExportStart?.();

    try {
      const result = await exportService.exportToPDF(createExportOptions());
      
      if (result.success) {
        onExportComplete?.(result);
      } else {
        setError(result.error || 'PDF export failed');
        onExportError?.(result.error || 'PDF export failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PDF export failed';
      setError(errorMessage);
      onExportError?.(errorMessage);
    } finally {
      setExportingPDF(false);
    }
  };

  // Handler for exporting as CSV
  const handleExportCSV = async () => {
    setExportingCSV(true);
    setError(null);
    onExportStart?.();

    try {
      const result = await exportService.exportToCSV(createExportOptions());
      
      if (result.success) {
        onExportComplete?.(result);
      } else {
        setError(result.error || 'CSV export failed');
        onExportError?.(result.error || 'CSV export failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'CSV export failed';
      setError(errorMessage);
      onExportError?.(errorMessage);
    } finally {
      setExportingCSV(false);
    }
  };

  // Handler for exporting charts as images
  const handleExportCharts = async () => {
    setExportingCharts(true);
    setError(null);
    onExportStart?.();

    try {
      const result = await exportService.exportCharts();
      
      if (result.success) {
        onExportComplete?.(result);
      } else {
        setError(result.error || 'Chart export failed');
        onExportError?.(result.error || 'Chart export failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Chart export failed';
      setError(errorMessage);
      onExportError?.(errorMessage);
    } finally {
      setExportingCharts(false);
    }
  };

  // Handler for retrying after error
  const handleRetry = () => {
    setError(null);
  };

  const noModelsSelected = modelIds.length === 0;

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex gap-2 flex-wrap">
        <button
          className="px-3 py-1 rounded bg-primary text-white disabled:opacity-50 flex items-center gap-2"
          onClick={handleExportPDF}
          disabled={disabled || isExporting || noModelsSelected}
          title={noModelsSelected ? 'Select models to export' : 'Export as PDF'}
        >
          {exportingPDF ? (
            <>
              <LoadingSpinner />
              Exporting PDF...
            </>
          ) : (
            'Export PDF'
          )}
        </button>
        <button
          className="px-3 py-1 rounded bg-secondary text-black border border-gray-300 disabled:opacity-50 flex items-center gap-2"
          onClick={handleExportCSV}
          disabled={disabled || isExporting || noModelsSelected}
          title={noModelsSelected ? 'Select models to export' : 'Export as CSV'}
        >
          {exportingCSV ? (
            <>
              <LoadingSpinner />
              Exporting CSV...
            </>
          ) : (
            'Export CSV'
          )}
        </button>
        <button
          className="px-3 py-1 rounded bg-secondary text-black border border-gray-300 disabled:opacity-50 flex items-center gap-2"
          onClick={handleExportCharts}
          disabled={disabled || isExporting || noModelsSelected}
          title={noModelsSelected ? 'Select models to export' : 'Export charts as images'}
        >
          {exportingCharts ? (
            <>
              <LoadingSpinner />
              Exporting Charts...
            </>
          ) : (
            'Export Charts'
          )}
        </button>
      </div>

      {/* Error message with retry */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          <span>⚠️ {error}</span>
          <button
            className="text-red-700 underline hover:no-underline"
            onClick={handleRetry}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Info message when no models selected */}
      {noModelsSelected && (
        <p className="text-sm text-gray-500">
          Select models to compare before exporting.
        </p>
      )}
    </div>
  );
}

/**
 * Simple loading spinner component
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
