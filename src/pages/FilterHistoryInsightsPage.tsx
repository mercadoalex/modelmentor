import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, Clock, Filter, Users } from 'lucide-react';
import { filterHistoryService, type FilterHistory } from '@/services/filterHistoryService';
import { supabase } from '@/db/supabase';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FilterHistoryInsightsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get('organizationId') || '';
  const adminId = searchParams.get('adminId') || '';
  
  const [history, setHistory] = useState<FilterHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    if (organizationId && adminId) {
      loadHistory();
    }
  }, [organizationId, adminId, period]);

  const loadHistory = async () => {
    setLoading(true);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await filterHistoryService.getByDateRange(
      organizationId,
      adminId,
      startDate,
      new Date()
    );

    setHistory(data);
    setLoading(false);
  };

  // Timeline data
  const getTimelineData = () => {
    if (history.length === 0) return [];

    const grouped: Record<string, number> = {};

    history.forEach(item => {
      const date = new Date(item.accessed_at);
      let key: string;

      if (viewMode === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (viewMode === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Filter type distribution
  const getFilterTypeDistribution = () => {
    const distribution: Record<string, number> = {
      'Role Filter': 0,
      'Status Filter': 0,
      'Date Range': 0,
      'Search': 0,
      'No Filters': 0
    };

    history.forEach(item => {
      const params = new URLSearchParams(item.filter_url);
      let hasFilter = false;

      if (params.get('roles')) {
        distribution['Role Filter']++;
        hasFilter = true;
      }
      if (params.get('status') && params.get('status') !== 'all') {
        distribution['Status Filter']++;
        hasFilter = true;
      }
      if (params.get('from') || params.get('to')) {
        distribution['Date Range']++;
        hasFilter = true;
      }
      if (params.get('search')) {
        distribution['Search']++;
        hasFilter = true;
      }
      if (!hasFilter) {
        distribution['No Filters']++;
      }
    });

    return Object.entries(distribution)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  };

  // Active hours heatmap
  const getActiveHoursData = () => {
    const hours: Record<number, number> = {};

    history.forEach(item => {
      const hour = new Date(item.accessed_at).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hours[i] || 0,
      label: `${i}:00`
    }));
  };

  // Filter combinations
  const getFilterCombinations = () => {
    const combinations: Record<string, number> = {};

    history.forEach(item => {
      const params = new URLSearchParams(item.filter_url);
      const parts: string[] = [];

      const roles = params.get('roles');
      if (roles) {
        parts.push(roles.split(',').map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', '));
      }

      const status = params.get('status');
      if (status && status !== 'all') {
        parts.push(status.charAt(0).toUpperCase() + status.slice(1));
      }

      if (params.get('from') || params.get('to')) {
        parts.push('Date Range');
      }

      if (params.get('search')) {
        parts.push('Search');
      }

      if (parts.length > 0) {
        const combo = parts.join(' + ');
        combinations[combo] = (combinations[combo] || 0) + 1;
      }
    });

    return Object.entries(combinations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([combination, count]) => ({ combination, count }));
  };

  // Comparison metrics
  const getComparisonMetrics = () => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const midpoint = new Date();
    midpoint.setDate(midpoint.getDate() - Math.floor(days / 2));

    const currentPeriod = history.filter(h => new Date(h.accessed_at) >= midpoint);
    const previousPeriod = history.filter(h => new Date(h.accessed_at) < midpoint);

    const currentCount = currentPeriod.length;
    const previousCount = previousPeriod.length;
    const change = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;

    return {
      current: currentCount,
      previous: previousCount,
      change: Math.round(change),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  const timelineData = getTimelineData();
  const distributionData = getFilterTypeDistribution();
  const activeHoursData = getActiveHoursData();
  const combinationsData = getFilterCombinations();
  const comparisonMetrics = getComparisonMetrics();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--border))'];

  if (!organizationId || !adminId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Invalid parameters. Please access this page from the filter history.</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Filter History Insights</h1>
            <p className="text-sm text-muted-foreground">Visual analytics and patterns</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as '7d' | '30d' | '90d')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading insights...</p>
          </CardContent>
        </Card>
      ) : history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No filter history data available for this period</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Filters</CardDescription>
                <CardTitle className="text-3xl">{history.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className={`h-4 w-4 ${comparisonMetrics.trend === 'up' ? 'text-green-500' : comparisonMetrics.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`} />
                  <span className={comparisonMetrics.trend === 'up' ? 'text-green-500' : comparisonMetrics.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}>
                    {comparisonMetrics.change > 0 ? '+' : ''}{comparisonMetrics.change}%
                  </span>
                  <span className="text-muted-foreground">vs previous period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Unique Filters</CardDescription>
                <CardTitle className="text-3xl">
                  {new Set(history.map(h => h.filter_url)).size}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Different filter combinations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Per Day</CardDescription>
                <CardTitle className="text-3xl">
                  {Math.round((history.length / (period === '7d' ? 7 : period === '30d' ? 30 : 90)) * 10) / 10}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Average filters applied daily</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Most Active Hour</CardDescription>
                <CardTitle className="text-3xl">
                  {activeHoursData.reduce((max, h) => h.count > max.count ? h : max, activeHoursData[0]).label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Peak filtering time</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Usage Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filter Usage Timeline</CardTitle>
                  <CardDescription>Track your filtering activity over time</CardDescription>
                </div>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'daily' | 'weekly' | 'monthly')}>
                  <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="Filters Applied" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filter Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Type Distribution</CardTitle>
                <CardDescription>Breakdown of filter usage by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Most Active Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Most Active Hours</CardTitle>
                <CardDescription>When you apply filters throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activeHoursData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={2} name="Filters" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Filter Combinations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Filter Combinations</CardTitle>
              <CardDescription>Most frequently used filter patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {combinationsData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No filter combinations found</p>
              ) : (
                <div className="space-y-3">
                  {combinationsData.map((combo, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium">{combo.combination}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{combo.count} times</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(combo.count / combinationsData[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
