import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { HistogramData, CategoryFrequency, BoxPlotData } from '@/services/dataProfilingService';

interface HistogramChartProps {
  data: HistogramData[];
  title: string;
  description?: string;
}

export function HistogramChart({ data, title, description }: HistogramChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance">{title}</CardTitle>
        {description && <CardDescription className="text-pretty">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="bin" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as HistogramData;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.bin}</p>
                        <p className="text-sm text-muted-foreground">Range: {data.range}</p>
                        <p className="text-sm">Count: {data.count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface CategoryBarChartProps {
  data: CategoryFrequency[];
  title: string;
  description?: string;
}

export function CategoryBarChart({ data, title, description }: CategoryBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance">{title}</CardTitle>
        {description && <CardDescription className="text-pretty">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="category" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CategoryFrequency;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.category}</p>
                        <p className="text-sm">Count: {data.count}</p>
                        <p className="text-sm">Percentage: {data.percentage.toFixed(1)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface BoxPlotChartProps {
  data: BoxPlotData[];
  title: string;
  description?: string;
}

export function BoxPlotChart({ data, title, description }: BoxPlotChartProps) {
  // Transform box plot data for visualization
  const chartData = data.map(d => ({
    column: d.column,
    min: d.min,
    q1: d.q1,
    median: d.median,
    q3: d.q3,
    max: d.max,
    outlierCount: d.outliers.length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance">{title}</CardTitle>
        {description && <CardDescription className="text-pretty">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="column" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{d.column}</p>
                        <div className="space-y-1 text-sm">
                          <p>Min: {d.min.toFixed(2)}</p>
                          <p>Q1: {d.q1.toFixed(2)}</p>
                          <p>Median: {d.median.toFixed(2)}</p>
                          <p>Q3: {d.q3.toFixed(2)}</p>
                          <p>Max: {d.max.toFixed(2)}</p>
                          <p className="text-orange-500">Outliers: {d.outlierCount}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="min" stackId="a" fill="transparent" />
              <Bar dataKey="q1" stackId="a" fill="hsl(var(--muted))" />
              <Bar dataKey="median" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="q3" stackId="a" fill="hsl(var(--muted))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
