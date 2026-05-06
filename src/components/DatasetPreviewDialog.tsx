import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Eye,
  Download,
  AlertTriangle,
  Info,
  FileText,
  BarChart3,
  Loader2,
  Image as ImageIcon,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { datasetDownloadService, type DatasetDownload } from '@/services/datasetDownloadService';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface DatasetPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  download: DatasetDownload;
}

interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'text' | 'date' | 'unknown';
  sampleValues: any[];
  missingCount: number;
  uniqueCount: number;
}

interface DatasetStats {
  rowCount: number;
  columnCount: number;
  totalMissing: number;
  memoryUsage: string;
  shape: string;
}

export function DatasetPreviewDialog({
  open,
  onOpenChange,
  download,
}: DatasetPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && download.file_path) {
      loadPreview();
    }
  }, [open, download]);

  const detectDataType = (values: any[]): 'numeric' | 'categorical' | 'text' | 'date' | 'unknown' => {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNullValues.length === 0) return 'unknown';

    // Check if numeric
    const numericCount = nonNullValues.filter(v => !isNaN(Number(v))).length;
    if (numericCount / nonNullValues.length > 0.8) return 'numeric';

    // Check if date
    const dateCount = nonNullValues.filter(v => !isNaN(Date.parse(v))).length;
    if (dateCount / nonNullValues.length > 0.8) return 'date';

    // Check if categorical (low unique count)
    const uniqueValues = new Set(nonNullValues);
    if (uniqueValues.size < nonNullValues.length * 0.5 && uniqueValues.size < 20) {
      return 'categorical';
    }

    return 'text';
  };

  const analyzeColumns = (data: any[]): ColumnInfo[] => {
    if (data.length === 0) return [];

    const columnNames = Object.keys(data[0]);
    return columnNames.map(name => {
      const values = data.map(row => row[name]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const missingCount = values.length - nonNullValues.length;
      const uniqueCount = new Set(nonNullValues).size;
      const sampleValues = nonNullValues.slice(0, 3);
      const type = detectDataType(values);

      return {
        name,
        type,
        sampleValues,
        missingCount,
        uniqueCount
      };
    });
  };

  const calculateStats = (data: any[], cols: ColumnInfo[]): DatasetStats => {
    const rowCount = data.length;
    const columnCount = cols.length;
    const totalMissing = cols.reduce((sum, col) => sum + col.missingCount, 0);
    
    // Estimate memory usage (rough calculation)
    const dataString = JSON.stringify(data);
    const bytes = new Blob([dataString]).size;
    const mb = bytes / (1024 * 1024);
    const memoryUsage = mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;

    return {
      rowCount,
      columnCount,
      totalMissing,
      memoryUsage,
      shape: `${rowCount} rows × ${columnCount} columns`
    };
  };

  const generateDistributionData = (columnName: string) => {
    const values = previewData
      .map(row => row[columnName])
      .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
      .map(v => Number(v));

    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(10, values.length);
    const binSize = (max - min) / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
      count: 0
    }));

    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      bins[binIndex].count++;
    });

    return bins;
  };

  const generateCategoricalData = (columnName: string) => {
    const values = previewData
      .map(row => row[columnName])
      .filter(v => v !== null && v !== undefined && v !== '');

    const counts = values.reduce((acc, val) => {
      const key = String(val);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 10);
  };

  const calculateCorrelation = (col1: string, col2: string): number => {
    const pairs = previewData
      .map(row => [Number(row[col1]), Number(row[col2])])
      .filter(([a, b]) => !isNaN(a) && !isNaN(b));

    if (pairs.length === 0) return 0;

    const n = pairs.length;
    const sum1 = pairs.reduce((sum, [a]) => sum + a, 0);
    const sum2 = pairs.reduce((sum, [, b]) => sum + b, 0);
    const sum1Sq = pairs.reduce((sum, [a]) => sum + a * a, 0);
    const sum2Sq = pairs.reduce((sum, [, b]) => sum + b * b, 0);
    const pSum = pairs.reduce((sum, [a, b]) => sum + a * b, 0);

    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

    return den === 0 ? 0 : num / den;
  };

  const generateCorrelationMatrix = () => {
    const numericColumns = columns.filter(col => col.type === 'numeric').slice(0, 5);
    if (numericColumns.length < 2) return [];

    const matrix: any[] = [];
    numericColumns.forEach((col1, i) => {
      numericColumns.forEach((col2, j) => {
        const correlation = calculateCorrelation(col1.name, col2.name);
        matrix.push({
          x: col1.name,
          y: col2.name,
          value: correlation
        });
      });
    });

    return matrix;
  };

  const generateMissingValueData = () => {
    return columns
      .filter(col => col.missingCount > 0)
      .map(col => ({
        name: col.name,
        missing: col.missingCount,
        present: previewData.length - col.missingCount
      }))
      .sort((a, b) => b.missing - a.missing);
  };

  const calculateBoxPlotData = (columnName: string) => {
    const values = previewData
      .map(row => row[columnName])
      .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
      .map(v => Number(v))
      .sort((a, b) => a - b);

    if (values.length === 0) return null;

    const q1Index = Math.floor(values.length * 0.25);
    const q2Index = Math.floor(values.length * 0.5);
    const q3Index = Math.floor(values.length * 0.75);

    const q1 = values[q1Index];
    const q2 = values[q2Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = values.filter(v => v < lowerBound || v > upperBound);

    return {
      min: values[0],
      q1,
      median: q2,
      q3,
      max: values[values.length - 1],
      outliers: outliers.length,
      lowerBound,
      upperBound
    };
  };

  const assessFeatureQuality = (col: ColumnInfo) => {
    let score = 100;
    const issues: string[] = [];

    // Missing values penalty
    const missingRate = col.missingCount / previewData.length;
    if (missingRate > 0.5) {
      score -= 40;
      issues.push('High missing rate (>50%)');
    } else if (missingRate > 0.2) {
      score -= 20;
      issues.push('Moderate missing rate (>20%)');
    } else if (missingRate > 0) {
      score -= 5;
      issues.push('Some missing values');
    }

    // Cardinality issues
    if (col.uniqueCount === 1) {
      score -= 50;
      issues.push('Constant column (no variance)');
    } else if (col.type === 'categorical' && col.uniqueCount > previewData.length * 0.9) {
      score -= 30;
      issues.push('High cardinality categorical');
    }

    // Outliers for numeric columns
    if (col.type === 'numeric') {
      const boxData = calculateBoxPlotData(col.name);
      if (boxData && boxData.outliers > previewData.length * 0.1) {
        score -= 15;
        issues.push('Many outliers detected');
      }
    }

    return { score: Math.max(0, score), issues };
  };

  const detectClassImbalance = () => {
    const categoricalCols = columns.filter(col => col.type === 'categorical' && col.uniqueCount <= 20);
    const imbalances: Array<{ column: string; severity: string; ratio: number; recommendation: string }> = [];

    categoricalCols.forEach(col => {
      const catData = generateCategoricalData(col.name);
      if (catData.length < 2) return;

      const total = catData.reduce((sum, item) => sum + (item.count as number), 0);
      const maxCount = Math.max(...catData.map(item => item.count as number));
      const minCount = Math.min(...catData.map(item => item.count as number));
      const ratio = maxCount / minCount;

      let severity = 'None';
      let recommendation = '';

      if (ratio > 10) {
        severity = 'Severe';
        recommendation = 'Consider oversampling minority class or using class weights';
        imbalances.push({ column: col.name, severity, ratio, recommendation });
      } else if (ratio > 5) {
        severity = 'Moderate';
        recommendation = 'Consider using stratified sampling or class weights';
        imbalances.push({ column: col.name, severity, ratio, recommendation });
      } else if (ratio > 2) {
        severity = 'Mild';
        recommendation = 'Monitor model performance on minority class';
        imbalances.push({ column: col.name, severity, ratio, recommendation });
      }
    });

    return imbalances;
  };

  const detectMulticollinearity = () => {
    const numericCols = columns.filter(col => col.type === 'numeric');
    const warnings: Array<{ col1: string; col2: string; correlation: number }> = [];

    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const corr = Math.abs(calculateCorrelation(numericCols[i].name, numericCols[j].name));
        if (corr > 0.9) {
          warnings.push({
            col1: numericCols[i].name,
            col2: numericCols[j].name,
            correlation: corr
          });
        }
      }
    }

    return warnings;
  };

  const checkSampleSize = () => {
    const sampleSize = previewData.length;
    const featureCount = columns.length;
    const recommendations: Array<{ modelType: string; status: string; message: string }> = [];

    // Linear models
    if (sampleSize >= featureCount * 10) {
      recommendations.push({
        modelType: 'Linear Models',
        status: 'Good',
        message: `${sampleSize} samples for ${featureCount} features (10:1 ratio met)`
      });
    } else {
      recommendations.push({
        modelType: 'Linear Models',
        status: 'Warning',
        message: `Need ~${featureCount * 10} samples (currently ${sampleSize})`
      });
    }

    // Neural networks
    if (sampleSize >= 1000) {
      recommendations.push({
        modelType: 'Neural Networks',
        status: 'Good',
        message: `${sampleSize} samples sufficient for simple networks`
      });
    } else {
      recommendations.push({
        modelType: 'Neural Networks',
        status: 'Poor',
        message: `Need 1000+ samples (currently ${sampleSize})`
      });
    }

    // Tree-based models
    if (sampleSize >= 100) {
      recommendations.push({
        modelType: 'Tree-based Models',
        status: 'Good',
        message: `${sampleSize} samples adequate for decision trees/random forests`
      });
    } else {
      recommendations.push({
        modelType: 'Tree-based Models',
        status: 'Warning',
        message: `Prefer 100+ samples (currently ${sampleSize})`
      });
    }

    return recommendations;
  };

  const generatePreprocessingSteps = () => {
    const steps: Array<{ step: string; priority: string; reason: string }> = [];

    // Missing values
    const missingCols = columns.filter(col => col.missingCount > 0);
    if (missingCols.length > 0) {
      steps.push({
        step: 'Handle Missing Values',
        priority: 'High',
        reason: `${missingCols.length} columns have missing data`
      });
    }

    // Outliers
    const numericCols = columns.filter(col => col.type === 'numeric');
    const outliersDetected = numericCols.some(col => {
      const boxData = calculateBoxPlotData(col.name);
      return boxData && boxData.outliers > 0;
    });
    if (outliersDetected) {
      steps.push({
        step: 'Remove or Cap Outliers',
        priority: 'Medium',
        reason: 'Outliers detected in numeric features'
      });
    }

    // Scaling
    if (numericCols.length > 0) {
      steps.push({
        step: 'Feature Scaling',
        priority: 'High',
        reason: 'Normalize numeric features for better model performance'
      });
    }

    // Encoding
    const categoricalCols = columns.filter(col => col.type === 'categorical');
    if (categoricalCols.length > 0) {
      steps.push({
        step: 'Encode Categorical Variables',
        priority: 'High',
        reason: `${categoricalCols.length} categorical columns need encoding`
      });
    }

    // Multicollinearity
    const multicolWarnings = detectMulticollinearity();
    if (multicolWarnings.length > 0) {
      steps.push({
        step: 'Address Multicollinearity',
        priority: 'Medium',
        reason: `${multicolWarnings.length} highly correlated feature pairs found`
      });
    }

    // Class imbalance
    const imbalances = detectClassImbalance();
    if (imbalances.some(i => i.severity === 'Severe')) {
      steps.push({
        step: 'Balance Classes',
        priority: 'High',
        reason: 'Severe class imbalance detected'
      });
    }

    return steps;
  };

  const suggestModelTypes = () => {
    const suggestions: Array<{ model: string; suitability: string; reason: string }> = [];
    const numericCount = columns.filter(col => col.type === 'numeric').length;
    const categoricalCount = columns.filter(col => col.type === 'categorical').length;
    const sampleSize = previewData.length;
    const targetCandidates = columns.filter(col => col.type === 'categorical' && col.uniqueCount <= 10);

    // Classification vs Regression
    if (targetCandidates.length > 0) {
      // Classification task likely
      if (sampleSize >= 100) {
        suggestions.push({
          model: 'Random Forest Classifier',
          suitability: 'High',
          reason: 'Good sample size, handles mixed features well'
        });
        suggestions.push({
          model: 'Gradient Boosting (XGBoost)',
          suitability: 'High',
          reason: 'Excellent for tabular data with categorical targets'
        });
      }
      if (sampleSize >= 50) {
        suggestions.push({
          model: 'Logistic Regression',
          suitability: 'Medium',
          reason: 'Simple baseline model for classification'
        });
      }
    }

    if (numericCount > categoricalCount) {
      suggestions.push({
        model: 'Linear Regression',
        suitability: 'Medium',
        reason: 'Primarily numeric features suitable for regression'
      });
    }

    if (sampleSize >= 1000 && numericCount >= 5) {
      suggestions.push({
        model: 'Neural Network',
        suitability: 'Medium',
        reason: 'Sufficient data for deep learning approaches'
      });
    }

    if (categoricalCount > numericCount) {
      suggestions.push({
        model: 'Decision Tree',
        suitability: 'High',
        reason: 'Handles categorical features naturally'
      });
    }

    return suggestions;
  };

  const calculateMLReadinessScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    // Feature quality (40 points)
    columns.forEach(col => {
      const quality = assessFeatureQuality(col);
      totalScore += quality.score * 0.4;
      maxScore += 40;
    });

    // Sample size (20 points)
    const sampleSize = previewData.length;
    if (sampleSize >= 1000) totalScore += 20;
    else if (sampleSize >= 100) totalScore += 15;
    else if (sampleSize >= 50) totalScore += 10;
    else totalScore += 5;
    maxScore += 20;

    // Data completeness (20 points)
    const completeness = 1 - (stats?.totalMissing || 0) / (previewData.length * columns.length);
    totalScore += completeness * 20;
    maxScore += 20;

    // Feature diversity (10 points)
    const hasNumeric = columns.some(col => col.type === 'numeric');
    const hasCategorical = columns.some(col => col.type === 'categorical');
    if (hasNumeric && hasCategorical) totalScore += 10;
    else if (hasNumeric || hasCategorical) totalScore += 5;
    maxScore += 10;

    // Class balance (10 points)
    const imbalances = detectClassImbalance();
    if (imbalances.length === 0) totalScore += 10;
    else if (imbalances.every(i => i.severity !== 'Severe')) totalScore += 5;
    maxScore += 10;

    const finalScore = Math.round((totalScore / maxScore) * 100);
    let rating = 'Poor';
    if (finalScore >= 80) rating = 'Excellent';
    else if (finalScore >= 60) rating = 'Good';
    else if (finalScore >= 40) rating = 'Fair';

    return { score: finalScore, rating };
  };

  const loadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const signedUrl = await datasetDownloadService.getDownloadUrl(download.file_path!);
      if (!signedUrl) {
        throw new Error('Failed to get download URL');
      }

      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch dataset');
      }

      const text = await response.text();

      // Parse based on format
      if (download.format === 'csv') {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          preview: 10, // Only parse first 10 rows
          complete: (results) => {
            const data = results.data as any[];
            setPreviewData(data);
            
            const cols = analyzeColumns(data);
            setColumns(cols);
            
            const statistics = calculateStats(data, cols);
            setStats(statistics);
          },
          error: (error: Error) => {
            throw new Error(`CSV parsing error: ${error.message}`);
          }
        });
      } else if (download.format === 'json') {
        try {
          const jsonData = JSON.parse(text);
          const dataArray = Array.isArray(jsonData) ? jsonData.slice(0, 10) : [jsonData];
          setPreviewData(dataArray);
          
          const cols = analyzeColumns(dataArray);
          setColumns(cols);
          
          const statistics = calculateStats(dataArray, cols);
          setStats(statistics);
        } catch (e) {
          throw new Error('Invalid JSON format');
        }
      } else {
        setError('Preview not available for this format. Supported formats: CSV, JSON');
      }
    } catch (err) {
      console.error('Preview error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPreview = () => {
    const dataStr = JSON.stringify(previewData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${download.dataset_name}-preview.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Preview exported');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'numeric':
        return 'bg-blue-500/10 text-blue-500';
      case 'categorical':
        return 'bg-purple-500/10 text-purple-500';
      case 'text':
        return 'bg-green-500/10 text-green-500';
      case 'date':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Dataset Preview
          </DialogTitle>
          <DialogDescription>
            {download.dataset_name} - First 10 samples
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="preview">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="preview">Data Preview</TabsTrigger>
              <TabsTrigger value="columns">Column Info</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
              <TabsTrigger value="readiness">ML Readiness</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing first {previewData.length} rows
                </p>
                <Button variant="outline" size="sm" onClick={handleExportPreview}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Preview
                </Button>
              </div>

              {download.format === 'csv' || download.format === 'json' ? (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((col, idx) => (
                          <TableHead key={idx} className="font-medium">
                            {col.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                          {columns.map((col, colIdx) => (
                            <TableCell key={colIdx} className="text-sm">
                              {row[col.name] !== null && row[col.name] !== undefined
                                ? String(row[col.name])
                                : <span className="text-muted-foreground italic">null</span>
                              }
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                      {JSON.stringify(previewData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="columns" className="space-y-3">
              {columns.map((col, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{col.name}</CardTitle>
                      <Badge variant="outline" className={getTypeColor(col.type)}>
                        {col.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Unique Values</p>
                        <p className="font-medium">{col.uniqueCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Missing Values</p>
                        <p className="font-medium">
                          {col.missingCount}
                          {col.missingCount > 0 && (
                            <AlertTriangle className="inline h-3 w-3 ml-1 text-orange-500" />
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sample Values</p>
                        <p className="font-medium text-xs truncate">
                          {col.sampleValues.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              {stats && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Dataset Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Shape</p>
                          <p className="text-lg font-semibold">{stats.shape}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Rows</p>
                          <p className="text-lg font-semibold">{stats.rowCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Columns</p>
                          <p className="text-lg font-semibold">{stats.columnCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Memory</p>
                          <p className="text-lg font-semibold">{stats.memoryUsage}</p>
                        </div>
                      </div>

                      {stats.totalMissing > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Found {stats.totalMissing} missing values across all columns. Consider handling these before training.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Data Quality Indicators</CardTitle>
                      <CardDescription>Potential issues to address</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {columns.filter(col => col.missingCount > 0).length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">Missing Values Detected</p>
                            <p className="text-muted-foreground">
                              {columns.filter(col => col.missingCount > 0).length} columns have missing values
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {columns.filter(col => col.uniqueCount === 1).length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">Constant Columns</p>
                            <p className="text-muted-foreground">
                              {columns.filter(col => col.uniqueCount === 1).length} columns have only one unique value
                            </p>
                          </div>
                        </div>
                      )}

                      {columns.filter(col => col.type === 'unknown').length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">Unknown Data Types</p>
                            <p className="text-muted-foreground">
                              {columns.filter(col => col.type === 'unknown').length} columns have unknown data types
                            </p>
                          </div>
                        </div>
                      )}

                      {columns.filter(col => col.missingCount === 0).length === columns.length && (
                        <div className="flex items-start gap-2 text-sm">
                          <Info className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">No Issues Detected</p>
                            <p className="text-muted-foreground">
                              Dataset appears to be clean and ready for training
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="visualizations" className="space-y-4">
              {/* Distribution Charts for Numeric Columns */}
              {columns.filter(col => col.type === 'numeric').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Distribution Charts
                    </CardTitle>
                    <CardDescription>
                      Histograms showing value distributions for numeric columns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {columns
                      .filter(col => col.type === 'numeric')
                      .slice(0, 3)
                      .map((col, idx) => {
                        const distData = generateDistributionData(col.name);
                        return (
                          <div key={idx} className="space-y-2">
                            <p className="text-sm font-medium">{col.name}</p>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart data={distData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                  dataKey="range"
                                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                />
                                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px'
                                  }}
                                />
                                <Bar dataKey="count" fill="hsl(var(--primary))" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              )}

              {/* Bar Charts for Categorical Columns */}
              {columns.filter(col => col.type === 'categorical').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Categorical Distribution
                    </CardTitle>
                    <CardDescription>
                      Top 10 values for categorical columns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {columns
                      .filter(col => col.type === 'categorical')
                      .slice(0, 3)
                      .map((col, idx) => {
                        const catData = generateCategoricalData(col.name);
                        const colors = [
                          'hsl(var(--chart-1))',
                          'hsl(var(--chart-2))',
                          'hsl(var(--chart-3))',
                          'hsl(var(--chart-4))',
                          'hsl(var(--chart-5))'
                        ];
                        return (
                          <div key={idx} className="space-y-2">
                            <p className="text-sm font-medium">{col.name}</p>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart data={catData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                  type="number"
                                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                  width={100}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '6px'
                                  }}
                                />
                                <Bar dataKey="count">
                                  {catData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              )}

              {/* Missing Value Patterns */}
              {generateMissingValueData().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Missing Value Patterns
                    </CardTitle>
                    <CardDescription>
                      Columns with missing data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={generateMissingValueData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="present" stackId="a" fill="hsl(var(--chart-2))" name="Present" />
                        <Bar dataKey="missing" stackId="a" fill="hsl(var(--destructive))" name="Missing" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Correlation Heatmap */}
              {columns.filter(col => col.type === 'numeric').length >= 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Correlation Matrix</CardTitle>
                    <CardDescription>
                      Correlation between numeric features (top 5)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {columns
                        .filter(col => col.type === 'numeric')
                        .slice(0, 5)
                        .map((col1, i) => (
                          <div key={i} className="flex gap-2">
                            <div className="w-24 text-xs font-medium truncate flex items-center">
                              {col1.name}
                            </div>
                            {columns
                              .filter(col => col.type === 'numeric')
                              .slice(0, 5)
                              .map((col2, j) => {
                                const corr = calculateCorrelation(col1.name, col2.name);
                                const intensity = Math.abs(corr);
                                const color =
                                  corr > 0
                                    ? `rgba(34, 197, 94, ${intensity})`
                                    : `rgba(239, 68, 68, ${intensity})`;
                                return (
                                  <div
                                    key={j}
                                    className="flex-1 h-12 flex items-center justify-center text-xs font-medium rounded border border-border"
                                    style={{ backgroundColor: color }}
                                  >
                                    {corr.toFixed(2)}
                                  </div>
                                );
                              })}
                          </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Green indicates positive correlation, red indicates negative correlation. Values range from -1 to 1.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Box Plot Statistics */}
              {columns.filter(col => col.type === 'numeric').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Outlier Detection</CardTitle>
                    <CardDescription>
                      Box plot statistics for numeric columns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {columns
                        .filter(col => col.type === 'numeric')
                        .slice(0, 5)
                        .map((col, idx) => {
                          const boxData = calculateBoxPlotData(col.name);
                          if (!boxData) return null;
                          return (
                            <div key={idx} className="space-y-2">
                              <p className="text-sm font-medium">{col.name}</p>
                              <div className="grid grid-cols-6 gap-2 text-xs">
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">Min</p>
                                  <p className="font-medium">{boxData.min.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">Q1</p>
                                  <p className="font-medium">{boxData.q1.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">Median</p>
                                  <p className="font-medium">{boxData.median.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">Q3</p>
                                  <p className="font-medium">{boxData.q3.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">Max</p>
                                  <p className="font-medium">{boxData.max.toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground">Outliers</p>
                                  <p className="font-medium text-orange-500">{boxData.outliers}</p>
                                </div>
                              </div>
                              {boxData.outliers > 0 && (
                                <Alert>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    {boxData.outliers} outlier(s) detected outside range [{boxData.lowerBound.toFixed(2)}, {boxData.upperBound.toFixed(2)}]
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Class Balance Visualization */}
              {columns.filter(col => col.type === 'categorical' && col.uniqueCount <= 10).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Class Balance</CardTitle>
                    <CardDescription>
                      Distribution of categorical variables (potential target variables)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {columns
                      .filter(col => col.type === 'categorical' && col.uniqueCount <= 10)
                      .slice(0, 2)
                      .map((col, idx) => {
                        const catData = generateCategoricalData(col.name);
                        const total = catData.reduce((sum, item) => sum + (item.count as number), 0);
                        return (
                          <div key={idx} className="space-y-2">
                            <p className="text-sm font-medium">{col.name}</p>
                            <div className="space-y-2">
                              {catData.map((item, i) => {
                                const percentage = (((item.count as number) / total) * 100).toFixed(1);
                                return (
                                  <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span>{item.name}</span>
                                      <span className="text-muted-foreground">
                                        {item.count as number} ({percentage}%)
                                      </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="readiness" className="space-y-4">
              {/* ML Readiness Score */}
              {(() => {
                const readiness = calculateMLReadinessScore();
                const scoreColor =
                  readiness.score >= 80
                    ? 'text-green-500'
                    : readiness.score >= 60
                    ? 'text-blue-500'
                    : readiness.score >= 40
                    ? 'text-orange-500'
                    : 'text-red-500';
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        ML Readiness Score
                      </CardTitle>
                      <CardDescription>
                        Overall assessment of dataset suitability for machine learning
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className={`text-6xl font-bold ${scoreColor}`}>
                          {readiness.score}
                        </div>
                        <div className="flex-1">
                          <p className="text-2xl font-semibold">{readiness.rating}</p>
                          <p className="text-sm text-muted-foreground">
                            {readiness.score >= 80 && 'Dataset is well-prepared for ML training'}
                            {readiness.score >= 60 && readiness.score < 80 && 'Dataset is suitable with minor preprocessing'}
                            {readiness.score >= 40 && readiness.score < 60 && 'Dataset needs significant preprocessing'}
                            {readiness.score < 40 && 'Dataset requires major improvements before training'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Feature Quality Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle>Feature Quality Assessment</CardTitle>
                  <CardDescription>
                    Individual feature quality scores and issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {columns.map((col, idx) => {
                      const quality = assessFeatureQuality(col);
                      const scoreColor =
                        quality.score >= 80
                          ? 'text-green-500'
                          : quality.score >= 60
                          ? 'text-blue-500'
                          : quality.score >= 40
                          ? 'text-orange-500'
                          : 'text-red-500';
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 border rounded">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{col.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {col.type} • {col.uniqueCount} unique values
                            </p>
                            {quality.issues.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {quality.issues.map((issue, i) => (
                                  <p key={i} className="text-xs text-orange-500 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {issue}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`text-2xl font-bold ${scoreColor}`}>
                            {quality.score}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Class Imbalance Detection */}
              {detectClassImbalance().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Class Imbalance Detection
                    </CardTitle>
                    <CardDescription>
                      Potential target variables with imbalanced distributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detectClassImbalance().map((imbalance, idx) => {
                        const severityColor =
                          imbalance.severity === 'Severe'
                            ? 'text-red-500'
                            : imbalance.severity === 'Moderate'
                            ? 'text-orange-500'
                            : 'text-yellow-500';
                        return (
                          <div key={idx} className="p-3 border rounded space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{imbalance.column}</p>
                              <Badge variant="outline" className={severityColor}>
                                {imbalance.severity} (Ratio: {imbalance.ratio.toFixed(1)}:1)
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {imbalance.recommendation}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Multicollinearity Warnings */}
              {detectMulticollinearity().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Multicollinearity Warnings
                    </CardTitle>
                    <CardDescription>
                      Highly correlated feature pairs that may cause issues
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {detectMulticollinearity().map((warning, idx) => (
                        <div key={idx} className="p-3 border rounded">
                          <p className="text-sm font-medium">
                            {warning.col1} ↔ {warning.col2}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Correlation: {warning.correlation.toFixed(3)} (very high)
                          </p>
                          <p className="text-xs text-orange-500 mt-1">
                            Consider removing one feature or using PCA
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sample Size Adequacy */}
              <Card>
                <CardHeader>
                  <CardTitle>Sample Size Adequacy</CardTitle>
                  <CardDescription>
                    Dataset size assessment for different model types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {checkSampleSize().map((rec, idx) => {
                      const statusColor =
                        rec.status === 'Good'
                          ? 'text-green-500'
                          : rec.status === 'Warning'
                          ? 'text-orange-500'
                          : 'text-red-500';
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 border rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{rec.modelType}</p>
                            <p className="text-xs text-muted-foreground">{rec.message}</p>
                          </div>
                          <Badge variant="outline" className={statusColor}>
                            {rec.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Preprocessing Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Preprocessing Steps</CardTitle>
                  <CardDescription>
                    Priority-ordered steps to improve dataset quality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generatePreprocessingSteps().map((step, idx) => {
                      const priorityColor =
                        step.priority === 'High'
                          ? 'bg-red-500/10 text-red-500'
                          : step.priority === 'Medium'
                          ? 'bg-orange-500/10 text-orange-500'
                          : 'bg-blue-500/10 text-blue-500';
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 border rounded">
                          <Badge variant="outline" className={priorityColor}>
                            {step.priority}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{step.step}</p>
                            <p className="text-xs text-muted-foreground">{step.reason}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Model Type Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Model Types</CardTitle>
                  <CardDescription>
                    Recommended algorithms based on dataset characteristics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suggestModelTypes().map((suggestion, idx) => {
                      const suitabilityColor =
                        suggestion.suitability === 'High'
                          ? 'text-green-500'
                          : suggestion.suitability === 'Medium'
                          ? 'text-blue-500'
                          : 'text-orange-500';
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 border rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{suggestion.model}</p>
                            <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                          </div>
                          <Badge variant="outline" className={suitabilityColor}>
                            {suggestion.suitability} Suitability
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
