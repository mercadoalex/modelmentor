import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }   from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Users, AlertCircle, Download, Play } from 'lucide-react';
import { toast }    from 'sonner';
import { parseUserCSV, generateCSVTemplate }   from '@/utils/csvUserParser';
import { userImportValidationService }          from '@/services/userImportValidationService';
import { bulkUserImportService }                from '@/services/bulkUserImportService';
import { ImportPreviewTable }      from './ImportPreviewTable';
import { ImportValidationDisplay } from './ImportValidationDisplay';
import { ImportReportModal }       from './ImportReportModal';
import type { ImportUserRow, ImportReport } from '@/types/bulkImport';

export function BulkUserImportPanel() {
  const [rows,       setRows]       = useState<ImportUserRow[]>([]);
  const [validating, setValidating] = useState(false);
  const [importing,  setImporting]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [report,     setReport]     = useState<ImportReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [fileName,   setFileName]   = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setFileName(file.name);
    setRows([]);
    setProgress(0);
    try {
      const text   = await file.text();
      const parsed = parseUserCSV(text);
      if (parsed.length === 0) {
        toast.error('No rows found. Check your CSV format.');
        return;
      }
      toast.info(`Parsed ${parsed.length} rows — validating…`);
      setValidating(true);
      const validated = await userImportValidationService.validateRows(parsed);
      setRows(validated);
      const valid = validated.filter(r => r.status === 'valid').length;
      toast.success(`Validation complete: ${valid}/${validated.length} rows ready`);
    } catch (err) {
      toast.error('Failed to parse CSV. Check the file format.');
      console.error(err);
    } finally {
      setValidating(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleImport = async () => {
    const validRows = rows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }
    setImporting(true);
    setProgress(10);
    try {
      const importReport = await bulkUserImportService.importUsers(rows);
      setProgress(100);
      setReport(importReport);
      setShowReport(true);
      toast.success(`Import complete: ${importReport.imported} users added`);
    } catch (err) {
      toast.error('Import failed. Please try again.');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv  = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'user-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter(r => r.status === 'valid').length;
  const hasIssues  = rows.some(r => r.status !== 'valid');
  const hasRows    = rows.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk User Import
          </CardTitle>
          <CardDescription>
            Upload a CSV file to create multiple users at once. Invitation emails are sent automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Template download hint */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Download the CSV template to ensure correct formatting.</span>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">
              {isDragActive ? 'Drop your CSV here' : 'Drag & drop a CSV or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Columns: email, firstName, lastName, role, organization, group
            </p>
            {fileName && (
              <p className="text-sm text-primary mt-2 font-medium">📄 {fileName}</p>
            )}
          </div>

          {/* Progress bar */}
          {(validating || importing) && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {validating ? 'Validating rows…' : `Importing users… ${progress}%`}
              </p>
              <Progress value={validating ? undefined : progress} />
            </div>
          )}

          {/* Import action row */}
          {hasRows && !validating && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                <span className="text-green-600 font-medium">{validCount}</span>
                {' '}of{' '}
                <span className="font-medium">{rows.length}</span> rows ready
              </p>
              <Button onClick={handleImport} disabled={importing || validCount === 0}>
                <Play className="h-4 w-4 mr-2" />
                {importing ? 'Importing…' : `Import ${validCount} Users`}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Preview / Issues tabs */}
      {hasRows && !validating && (
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Preview ({rows.length})</TabsTrigger>
            {hasIssues && (
              <TabsTrigger value="issues">
                Issues ({rows.filter(r => r.status !== 'valid').length})
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="preview" className="mt-4">
            <ImportPreviewTable rows={rows} />
          </TabsContent>
          {hasIssues && (
            <TabsContent value="issues" className="mt-4">
              <ImportValidationDisplay rows={rows} />
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Import report modal */}
      <ImportReportModal
        report={report}
        open={showReport}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}