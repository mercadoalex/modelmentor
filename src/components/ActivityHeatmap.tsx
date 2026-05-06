import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Activity } from 'lucide-react';
import { activityLogService, type ActivityCount } from '@/services/activityLogService';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types/types';

interface ActivityHeatmapProps {
  organizationId: string;
}

export function ActivityHeatmap({ organizationId }: ActivityHeatmapProps) {
  const [activityCounts, setActivityCounts] = useState<ActivityCount[]>([]);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [mostActiveDay, setMostActiveDay] = useState<{ date: string; count: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Get last 30 days
  const getLast30Days = () => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const last30Days = getLast30Days();

  useEffect(() => {
    loadAdmins();
  }, [organizationId]);

  useEffect(() => {
    loadActivityData();
  }, [organizationId, selectedAdminId]);

  const loadAdmins = async () => {
    // Get all admins who have created bulk actions
    const { data, error } = await supabase
      .from('bulk_actions')
      .select('admin_id, admin:profiles!admin_id(*)')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error loading admins:', error);
      return;
    }

    // Get unique admins
    const adminMap = new Map<string, Profile>();
    data?.forEach((item: any) => {
      if (item.admin && !adminMap.has(item.admin_id)) {
        // admin is returned as an array by Supabase, take first element
        const adminProfile = Array.isArray(item.admin) ? item.admin[0] : item.admin;
        if (adminProfile) {
          adminMap.set(item.admin_id, adminProfile as Profile);
        }
      }
    });

    setAdmins(Array.from(adminMap.values()));
  };

  const loadActivityData = async () => {
    setLoading(true);
    const startDate = last30Days[0];
    const endDate = new Date();

    const counts = await activityLogService.getActivityCounts(
      organizationId,
      selectedAdminId === 'all' ? undefined : selectedAdminId,
      startDate,
      endDate
    );

    setActivityCounts(counts);

    // Calculate total count
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    setTotalCount(total);

    // Find most active day
    if (counts.length > 0) {
      const mostActive = counts.reduce((max, item) =>
        item.count > max.count ? item : max
      );
      setMostActiveDay(mostActive);
    } else {
      setMostActiveDay(null);
    }

    setLoading(false);
  };

  const getActivityCount = (date: Date): number => {
    const dateStr = date.toISOString().split('T')[0];
    const activity = activityCounts.find(a => a.date === dateStr);
    return activity?.count || 0;
  };

  const getColorClass = (count: number): string => {
    if (count === 0) return 'bg-muted';
    if (count <= 2) return 'bg-green-100';
    if (count <= 5) return 'bg-green-200';
    if (count <= 10) return 'bg-green-300';
    return 'bg-green-400';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayOfWeek = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  last30Days.forEach((day, index) => {
    currentWeek.push(day);
    if (day.getDay() === 6 || index === last30Days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Heatmap
            </CardTitle>
            <CardDescription>
              Admin activity patterns over the last 30 days
            </CardDescription>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-filter">Filter by Admin</Label>
            <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
              <SelectTrigger id="admin-filter" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.first_name} {admin.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Statistics */}
          <div className="flex items-center gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">Total Activities: </span>
              <span className="font-medium">{totalCount}</span>
            </div>
            {mostActiveDay && (
              <div>
                <span className="text-muted-foreground">Most Active Day: </span>
                <span className="font-medium">
                  {formatDate(new Date(mostActiveDay.date))} ({mostActiveDay.count} activities)
                </span>
              </div>
            )}
          </div>

          {/* Heatmap */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-2">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(...weeks.map(w => w.length))}, minmax(0, 1fr))` }}>
                {weeks.map((week, weekIndex) => (
                  week.map((day, dayIndex) => {
                    const count = getActivityCount(day);
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`relative group h-12 rounded border ${getColorClass(count)} transition-colors cursor-pointer`}
                        title={`${formatDate(day)}: ${count} activities`}
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                          <div className="font-medium">{getDayOfWeek(day)}</div>
                          <div className="text-[10px] opacity-75">{day.getDate()}</div>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {formatDate(day)}: {count} {count === 1 ? 'activity' : 'activities'}
                        </div>
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded bg-muted border" />
              <div className="h-4 w-4 rounded bg-green-100 border" />
              <div className="h-4 w-4 rounded bg-green-200 border" />
              <div className="h-4 w-4 rounded bg-green-300 border" />
              <div className="h-4 w-4 rounded bg-green-400 border" />
            </div>
            <span>More</span>
            <div className="ml-4 flex items-center gap-2">
              <span>0</span>
              <span>1-2</span>
              <span>3-5</span>
              <span>6-10</span>
              <span>10+</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
