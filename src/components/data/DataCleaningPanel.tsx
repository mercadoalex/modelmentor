import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, Trash2, Droplets, TrendingUp, Download, CheckCircle2, Info } from 'lucide-react';
import { dataCleaningService } from '@/services/dataCleaningService';
import type { CleaningOperation, CleaningResult } from '@/services/dataCleaningService';
import type { ColumnInfo } from '@/services/dataValidationService';
import { toast } from 'sonner';

interface DataCleaningPanelProps {
  data: string[][];
  columnInfo: ColumnInfo[];
  onDataCleaned: (cleanedData: string[][], operations: CleaningOperation[]) => void;
}

export function DataCleaningPanel({ data, columnInfo, onDataCleaned }: DataCleaningPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCleaningResult, setLastCleaningResult] = useState<CleaningResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [fillMethod, setFillMethod] = useState<'mean' | 'median' | 'mode'>('median');
  const [outlierMethod, setOutlierMethod] = useState<'cap' | 'remove'>('cap');
  const [normalizeMethod, setNormalizeMethod] = useState<'min-max' | 'z-score'>('min-max');

  const handleQuickFix = () => {
    setIsProcessing(true);
    try {
      const result = dataCleaningService.quickFix(data, columnInfo);
      setLastCleaningResult(result);
      onDataCleaned(result.data, result.operations);
      
      const { summary } = result;
      toast.success(
        `Quick fix applied! ${summary.rowsRemoved} duplicates removed, ${summary.valuesFilled} values filled, ${summary.outliersHandled} outliers handled.`,
        { duration: 5000 }
      );
    } catch (error) {
      toast.error('Failed to apply quick fix');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveDuplicates = () => {
    setIsProcessing(true);
    try {
      const result = dataCleaningService.removeDuplicates(data);
      onDataCleaned(result.data, [{
        type: 'remove_duplicates',
        affectedRows: result.rowsRemoved,
      }]);
      toast.success(`Removed ${result.rowsRemoved} duplicate rows`);
    } catch (error) {
      toast.error('Failed to remove duplicates');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFillMissing = () => {
    if (!selectedColumn) {
      toast.error('Please select a column');
      return;
    }

    setIsProcessing(true);
    try {
      const columnIndex = columnInfo.findIndex(col => col.name === selectedColumn);
      const result = dataCleaningService.fillMissingValues(data, columnIndex, fillMethod);
      onDataCleaned(result.data, [{
        type: 'fill_missing',
        column: selectedColumn,
        method: fillMethod,
        affectedRows: result.valuesFilled,
      }]);
      toast.success(`Filled ${result.valuesFilled} missing values in ${selectedColumn}`);
      setShowAdvanced(false);
    } catch (error) {
      toast.error('Failed to fill missing values');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOutliers = () => {
    if (!selectedColumn) {
      toast.error('Please select a column');
      return;
    }

    setIsProcessing(true);
    try {
      const columnIndex = columnInfo.findIndex(col => col.name === selectedColumn);
      const result = dataCleaningService.handleOutliers(data, columnIndex, outlierMethod, 3);
      onDataCleaned(result.data, [{
        type: 'handle_outliers',
        column: selectedColumn,
        method: outlierMethod,
        affectedRows: result.outliersHandled,
      }]);
      toast.success(`Handled ${result.outliersHandled} outliers in ${selectedColumn}`);
      setShowAdvanced(false);
    } catch (error) {
      toast.error('Failed to handle outliers');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNormalize = () => {
    setIsProcessing(true);
    try {
      const result = dataCleaningService.normalizeAllNumericColumns(data, columnInfo, normalizeMethod);
      onDataCleaned(result.data, [{
        type: 'normalize',
        method: normalizeMethod,
        affectedRows: result.columnsNormalized,
      }]);
      toast.success(`Normalized ${result.columnsNormalized} numeric columns`);
    } catch (error) {
      toast.error('Failed to normalize data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const filename = `cleaned_data_${new Date().toISOString().split('T')[0]}.csv`;
    dataCleaningService.downloadCSV(data, filename);
    toast.success('Downloaded cleaned dataset');
  };

  const numericColumns = columnInfo.filter(col => col.type === 'numeric');
  const columnsWithMissing = columnInfo.filter(col => col.missingCount > 0);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Automatic Data Cleaning
          </CardTitle>
          <CardDescription className="text-pretty">
            One-click fixes for common data quality issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Button
              onClick={handleQuickFix}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Quick Fix All Issues
            </Button>

            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Cleaned Data
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Quick Fix will automatically remove duplicates, fill missing values with appropriate methods,
              and cap outliers to 3 standard deviations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Individual Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Individual Cleaning Operations</CardTitle>
          <CardDescription className="text-pretty">
            Apply specific cleaning operations to your dataset
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {/* Remove Duplicates */}
            <Button
              onClick={handleRemoveDuplicates}
              disabled={isProcessing}
              variant="outline"
              className="w-full justify-start"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Duplicates
            </Button>

            {/* Fill Missing Values */}
            <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={columnsWithMissing.length === 0}
                >
                  <Droplets className="h-4 w-4 mr-2" />
                  Fill Missing Values
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                <DialogHeader>
                  <DialogTitle>Fill Missing Values</DialogTitle>
                  <DialogDescription>
                    Choose a column and method to fill missing values
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Column</Label>
                    <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columnsWithMissing.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name} ({col.missingCount} missing)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fill Method</Label>
                    <Select value={fillMethod} onValueChange={(v) => setFillMethod(v as typeof fillMethod)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mean">Mean (average)</SelectItem>
                        <SelectItem value="median">Median (middle value)</SelectItem>
                        <SelectItem value="mode">Mode (most frequent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleFillMissing} disabled={isProcessing} className="w-full">
                    Apply
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Handle Outliers */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={numericColumns.length === 0}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Handle Outliers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                <DialogHeader>
                  <DialogTitle>Handle Outliers</DialogTitle>
                  <DialogDescription>
                    Choose a numeric column and method to handle outliers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Column</Label>
                    <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {numericColumns.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={outlierMethod} onValueChange={(v) => setOutlierMethod(v as typeof outlierMethod)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cap">Cap (limit to threshold)</SelectItem>
                        <SelectItem value="remove">Remove (delete rows)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleOutliers} disabled={isProcessing} className="w-full">
                    Apply
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Normalize Data */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={numericColumns.length === 0}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Normalize Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                <DialogHeader>
                  <DialogTitle>Normalize Data</DialogTitle>
                  <DialogDescription>
                    Normalize all numeric columns to a common scale
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Normalization Method</Label>
                    <Select value={normalizeMethod} onValueChange={(v) => setNormalizeMethod(v as typeof normalizeMethod)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="min-max">Min-Max (0 to 1)</SelectItem>
                        <SelectItem value="z-score">Z-Score (standardize)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      This will normalize all {numericColumns.length} numeric columns
                    </AlertDescription>
                  </Alert>

                  <Button onClick={handleNormalize} disabled={isProcessing} className="w-full">
                    Apply
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Cleaning History */}
      {lastCleaningResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Last Cleaning Operation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rows Removed</p>
                  <p className="text-2xl font-semibold">{lastCleaningResult.summary.rowsRemoved}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Values Filled</p>
                  <p className="text-2xl font-semibold">{lastCleaningResult.summary.valuesFilled}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outliers Handled</p>
                  <p className="text-2xl font-semibold">{lastCleaningResult.summary.outliersHandled}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Columns Normalized</p>
                  <p className="text-2xl font-semibold">{lastCleaningResult.summary.columnsNormalized}</p>
                </div>
              </div>

              {lastCleaningResult.operations.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium">Operations Applied:</p>
                  <div className="flex flex-wrap gap-2">
                    {lastCleaningResult.operations.map((op, index) => (
                      <Badge key={index} variant="secondary">
                        {op.type.replace(/_/g, ' ')}
                        {op.column && `: ${op.column}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
