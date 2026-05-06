import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { HistogramChart, CategoryBarChart, BoxPlotChart } from './DataVisualizationCharts';
import { CorrelationHeatmap } from './CorrelationHeatmap';
import { dataProfilingService } from '@/services/dataProfilingService';
import type { ColumnInfo } from '@/services/dataValidationService';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

interface DataProfilingPanelProps {
  data: string[][];
  columnInfo: ColumnInfo[];
}

export function DataProfilingPanel({ data, columnInfo }: DataProfilingPanelProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>(columnInfo[0]?.name || '');

  const selectedColumnInfo = columnInfo.find(col => col.name === selectedColumn);
  const selectedColumnIndex = columnInfo.findIndex(col => col.name === selectedColumn);

  // Calculate visualizations
  const numericColumns = columnInfo.filter(col => col.type === 'numeric');
  const categoricalColumns = columnInfo.filter(col => col.type === 'categorical');

  // Histogram for selected numeric column
  const histogramData = selectedColumnInfo?.type === 'numeric' && selectedColumnIndex >= 0
    ? dataProfilingService.calculateHistogram(data, selectedColumnIndex, 10)
    : [];

  // Category frequency for selected categorical column
  const categoryData = selectedColumnInfo?.type === 'categorical' && selectedColumnIndex >= 0
    ? dataProfilingService.calculateCategoryFrequency(data, selectedColumnIndex, 10)
    : [];

  // Correlation matrix for all numeric columns
  const correlationData = numericColumns.length >= 2
    ? dataProfilingService.calculateCorrelationMatrix(data, columnInfo)
    : [];

  // Box plots for all numeric columns
  const boxPlotData = dataProfilingService.calculateAllBoxPlots(data, columnInfo);

  // Distribution summary for selected numeric column
  const distributionSummary = selectedColumnInfo?.type === 'numeric' && selectedColumnIndex >= 0
    ? dataProfilingService.getDistributionSummary(data, selectedColumnIndex)
    : null;

  return (
    <div className="space-y-6">
      {/* Column Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Profiling & Visualization
          </CardTitle>
          <CardDescription className="text-pretty">
            Explore your data through interactive visualizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Select Column to Analyze</Label>
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columnInfo.map(col => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Column Distribution */}
      {selectedColumnInfo && (
        <>
          {selectedColumnInfo.type === 'numeric' && histogramData.length > 0 && (
            <div className="space-y-4">
              <HistogramChart
                data={histogramData}
                title={`Distribution of ${selectedColumn}`}
                description="Histogram showing the frequency distribution of values"
              />

              {distributionSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-balance">Distribution Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Skewness</p>
                        <p className="text-2xl font-semibold">{distributionSummary.skewness.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.abs(distributionSummary.skewness) < 0.5 ? 'Symmetric' : distributionSummary.skewness > 0 ? 'Right-skewed' : 'Left-skewed'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Kurtosis</p>
                        <p className="text-2xl font-semibold">{distributionSummary.kurtosis.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.abs(distributionSummary.kurtosis) < 0.5 ? 'Normal' : distributionSummary.kurtosis > 0 ? 'Heavy-tailed' : 'Light-tailed'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Distribution</p>
                        <Badge variant={distributionSummary.isNormal ? 'default' : 'secondary'} className="mt-2">
                          {distributionSummary.isNormal ? 'Approximately Normal' : 'Non-Normal'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {selectedColumnInfo.type === 'categorical' && categoryData.length > 0 && (
            <CategoryBarChart
              data={categoryData}
              title={`Distribution of ${selectedColumn}`}
              description="Top 10 most frequent categories"
            />
          )}
        </>
      )}

      {/* Box Plots for Outlier Detection */}
      {boxPlotData.length > 0 && (
        <BoxPlotChart
          data={boxPlotData}
          title="Outlier Detection (Box Plots)"
          description="Box plots showing quartiles and outliers for all numeric columns"
        />
      )}

      {/* Correlation Heatmap */}
      {correlationData.length > 0 && (
        <CorrelationHeatmap
          data={correlationData}
          title="Correlation Matrix"
          description="Pearson correlation coefficients between numeric columns"
        />
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Data Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Column Types</p>
                <p className="text-sm text-muted-foreground">
                  {numericColumns.length} numeric, {categoricalColumns.length} categorical columns detected
                </p>
              </div>
            </div>

            {boxPlotData.length > 0 && (
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Outliers Detected</p>
                  <p className="text-sm text-muted-foreground">
                    {boxPlotData.reduce((sum, bp) => sum + bp.outliers.length, 0)} outliers found across {boxPlotData.filter(bp => bp.outliers.length > 0).length} columns
                  </p>
                </div>
              </div>
            )}

            {correlationData.filter(d => Math.abs(d.correlation) >= 0.8 && d.column1 !== d.column2).length > 0 && (
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Strong Correlations</p>
                  <p className="text-sm text-muted-foreground">
                    {correlationData.filter(d => Math.abs(d.correlation) >= 0.8 && d.column1 !== d.column2).length} pairs of columns are highly correlated
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
