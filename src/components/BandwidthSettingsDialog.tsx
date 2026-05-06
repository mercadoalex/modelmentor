import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Gauge, Clock, Battery, BarChart3, Loader2 } from 'lucide-react';
import { bandwidthService, type BandwidthSettings, type BandwidthStats } from '@/services/bandwidthService';
import { toast } from 'sonner';

export function BandwidthSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<BandwidthSettings | null>(null);
  const [stats, setStats] = useState<BandwidthStats | null>(null);
  const [maxBandwidth, setMaxBandwidth] = useState('10');
  const [startHour, setStartHour] = useState('22');
  const [endHour, setEndHour] = useState('6');

  useEffect(() => {
    if (open) {
      loadSettings();
      loadStats();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    const data = await bandwidthService.getOrCreateSettings();
    if (data) {
      setSettings(data);
      setMaxBandwidth(data.max_bandwidth_mbps.toString());
      setStartHour(data.download_schedule.start_hour.toString());
      setEndHour(data.download_schedule.end_hour.toString());
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const data = await bandwidthService.getStats(30);
    if (data) {
      setStats(data);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    const success = await bandwidthService.updateSettings({
      max_bandwidth_mbps: parseFloat(maxBandwidth),
      throttle_enabled: settings.throttle_enabled,
      download_schedule: {
        enabled: settings.download_schedule.enabled,
        start_hour: parseInt(startHour),
        end_hour: parseInt(endHour)
      },
      pause_on_low_battery: settings.pause_on_low_battery
    });

    if (success) {
      toast.success('Bandwidth settings saved');
      loadSettings();
    } else {
      toast.error('Failed to save settings');
    }
  };

  const handleToggleThrottle = async (enabled: boolean) => {
    if (!settings) return;
    const success = await bandwidthService.updateSettings({ throttle_enabled: enabled });
    if (success) {
      setSettings({ ...settings, throttle_enabled: enabled });
      toast.success(enabled ? 'Throttling enabled' : 'Throttling disabled');
    }
  };

  const handleToggleSchedule = async (enabled: boolean) => {
    if (!settings) return;
    const success = await bandwidthService.updateSettings({
      download_schedule: {
        ...settings.download_schedule,
        enabled
      }
    });
    if (success) {
      setSettings({
        ...settings,
        download_schedule: { ...settings.download_schedule, enabled }
      });
      toast.success(enabled ? 'Schedule enabled' : 'Schedule disabled');
    }
  };

  const handleToggleBattery = async (enabled: boolean) => {
    if (!settings) return;
    const success = await bandwidthService.updateSettings({ pause_on_low_battery: enabled });
    if (success) {
      setSettings({ ...settings, pause_on_low_battery: enabled });
      toast.success(enabled ? 'Battery protection enabled' : 'Battery protection disabled');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Bandwidth Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bandwidth Management</DialogTitle>
          <DialogDescription>
            Configure download bandwidth and scheduling
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="settings">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              {/* Bandwidth Throttling */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      <CardTitle>Bandwidth Throttling</CardTitle>
                    </div>
                    <Switch
                      checked={settings?.throttle_enabled || false}
                      onCheckedChange={handleToggleThrottle}
                    />
                  </div>
                  <CardDescription>
                    Limit download speed to prevent network congestion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-bandwidth">Maximum Bandwidth (Mbps)</Label>
                    <Input
                      id="max-bandwidth"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={maxBandwidth}
                      onChange={(e) => setMaxBandwidth(e.target.value)}
                      disabled={!settings?.throttle_enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Downloads will not exceed this speed
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Download Schedule */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <CardTitle>Download Schedule</CardTitle>
                    </div>
                    <Switch
                      checked={settings?.download_schedule.enabled || false}
                      onCheckedChange={handleToggleSchedule}
                    />
                  </div>
                  <CardDescription>
                    Schedule downloads for off-peak hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-hour">Start Hour (24h)</Label>
                      <Input
                        id="start-hour"
                        type="number"
                        min="0"
                        max="23"
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        disabled={!settings?.download_schedule.enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-hour">End Hour (24h)</Label>
                      <Input
                        id="end-hour"
                        type="number"
                        min="0"
                        max="23"
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        disabled={!settings?.download_schedule.enabled}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Downloads will only start during these hours (e.g., 22:00 to 6:00 for overnight)
                  </p>
                </CardContent>
              </Card>

              {/* Battery Protection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Battery className="h-5 w-5" />
                      <CardTitle>Battery Protection</CardTitle>
                    </div>
                    <Switch
                      checked={settings?.pause_on_low_battery || false}
                      onCheckedChange={handleToggleBattery}
                    />
                  </div>
                  <CardDescription>
                    Pause downloads when battery is low (below 20%)
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  Save Settings
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              {stats && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Bandwidth Statistics (Last 30 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Downloaded</p>
                          <p className="text-2xl font-semibold">
                            {stats.total_downloaded_gb.toFixed(2)} GB
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Average Speed</p>
                          <p className="text-2xl font-semibold">
                            {bandwidthService.formatSpeed(stats.average_speed_mbps)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Peak Speed</p>
                          <p className="text-2xl font-semibold">
                            {bandwidthService.formatSpeed(stats.peak_speed_mbps)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Downloads</p>
                          <p className="text-2xl font-semibold">
                            {stats.download_count}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Current Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Throttling:</span>
                        <span className="font-medium">
                          {settings?.throttle_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {settings?.throttle_enabled && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max Bandwidth:</span>
                          <span className="font-medium">
                            {settings.max_bandwidth_mbps} Mbps
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Scheduled Downloads:</span>
                        <span className="font-medium">
                          {settings?.download_schedule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {settings?.download_schedule.enabled && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Schedule:</span>
                          <span className="font-medium">
                            {settings.download_schedule.start_hour}:00 - {settings.download_schedule.end_hour}:00
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Battery Protection:</span>
                        <span className="font-medium">
                          {settings?.pause_on_low_battery ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
