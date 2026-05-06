import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  modelMonitoringService,
  type DriftMetrics,
  type PredictionDrift,
  type PerformanceMetrics,
  type MonitoringAlert,
  type RetrainingRecommendation,
  type MonitoringConfig,
  type DriftStatus,
} from '@/services/modelMonitoringService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Bell,
  Settings,
  Eye,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export function ModelMonitoringDashboard() {
  const [config, setConfig] = useState<MonitoringConfig>(
    modelMonitoringService.getDefaultConfig()
  );
  const [monitoring, setMonitoring] = useState(false);
  const [dataDrift, setDataDrift] = useState<DriftMetrics[]>([]);
  const [predictionDrift, setPredictionDrift] = useState<PredictionDrift[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [recommendation, setRecommendation] = useState<RetrainingRecommendation | null>(null);

  useEffect(() => {
    if (monitoring) {
      // Load simulated data
      const data = modelMonitoringService.generateSimulatedData(30);
      setDataDrift(data.dataDrift);
      setPredictionDrift(data.predictionDrift);
      setPerformanceMetrics(data.performanceMetrics);

      // Generate alerts
      const currentPerformance = data.performanceMetrics[data.performanceMetrics.length - 1];
      const historicalPerformance = data.performanceMetrics.slice(0, -1);
      const perfStatus = modelMonitoringService.detectPerformanceDegradation(
        historicalPerformance,
        currentPerformance
      );

      const currentPredDrift = data.predictionDrift[data.predictionDrift.length - 1];
      const newAlerts = modelMonitoringService.generateAlerts(
        data.dataDrift,
        currentPredDrift,
        perfStatus,
        config
      );
      setAlerts(newAlerts);

      // Generate retraining recommendation
      const retrainRec = modelMonitoringService.generateRetrainingRecommendation(
        data.dataDrift,
        currentPredDrift,
        perfStatus
      );
      setRecommendation(retrainRec);

      if (newAlerts.length > 0) {
        toast.warning(`${newAlerts.length} monitoring alert(s) detected`);
      }
    }
  }, [monitoring, config]);

  const handleStartMonitoring = () => {
    setMonitoring(true);
    toast.success('Model monitoring started');
  };

  const handleStopMonitoring = () => {
    setMonitoring(false);
    toast.info('Model monitoring stopped');
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    toast.success('Alert acknowledged');
  };

  const handleTriggerRetraining = () => {
    toast.success('Retraining triggered - model will be updated with new data');
  };

  const getStatusColor = (status: DriftStatus) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
    }
  };

  const getStatusBadge = (status: DriftStatus) => {
    switch (status) {
      case 'healthy': return <Badge variant="secondary" className="bg-green-500/10 text-green-500">Healthy</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">Warning</Badge>;
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
    }
  };

  const getSeverityIcon = (severity: MonitoringAlert['severity']) => {
    switch (severity) {
      case 'info': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Model Monitoring System
          </CardTitle>
          <CardDescription className="text-pretty">
            Real-time monitoring for prediction drift, data drift, and performance degradation with automated retraining recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${monitoring ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
              <span className="font-medium">
                {monitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </span>
            </div>
            <Button
              onClick={monitoring ? handleStopMonitoring : handleStartMonitoring}
              variant={monitoring ? 'outline' : 'default'}
            >
              {monitoring ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Start Monitoring
                </>
              )}
            </Button>
          </div>

          {!monitoring && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Start monitoring</strong> to track model performance, detect drift, and receive alerts when retraining is needed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {monitoring && (
        <>
          {/* Monitoring Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Monitoring Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Prediction Drift Threshold</Label>
                    <span className="text-sm font-medium">{(config.predictionDriftThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[config.predictionDriftThreshold * 100]}
                    onValueChange={(v) => setConfig({ ...config, predictionDriftThreshold: v[0] / 100 })}
                    min={5}
                    max={30}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Data Drift Threshold</Label>
                    <span className="text-sm font-medium">{(config.dataDriftThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[config.dataDriftThreshold * 100]}
                    onValueChange={(v) => setConfig({ ...config, dataDriftThreshold: v[0] / 100 })}
                    min={10}
                    max={50}
                    step={5}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Performance Degradation Threshold</Label>
                    <span className="text-sm font-medium">{(config.performanceDegradationThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[config.performanceDegradationThreshold * 100]}
                    onValueChange={(v) => setConfig({ ...config, performanceDegradationThreshold: v[0] / 100 })}
                    min={2}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Enable Alerts</Label>
                    <Switch
                      checked={config.alertEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, alertEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-Retraining</Label>
                    <Switch
                      checked={config.autoRetrainingEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, autoRetrainingEnabled: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-balance flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Active Alerts ({alerts.filter(a => !a.acknowledged).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg ${alert.acknowledged ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <span className="font-semibold">{alert.message}</span>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Monitoring Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="data-drift">Data Drift</TabsTrigger>
              <TabsTrigger value="prediction-drift">Prediction Drift</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Status Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Data Drift Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        {getStatusBadge(
                          dataDrift.filter(d => d.status === 'critical').length > 0 ? 'critical' :
                          dataDrift.filter(d => d.status === 'warning').length > 0 ? 'warning' : 'healthy'
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {dataDrift.filter(d => d.status !== 'healthy').length}
                        </p>
                        <p className="text-xs text-muted-foreground">features drifting</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Prediction Drift</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        {predictionDrift.length > 0 && getStatusBadge(predictionDrift[predictionDrift.length - 1].status)}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {predictionDrift.length > 0 ? (predictionDrift[predictionDrift.length - 1].drift * 100).toFixed(1) : '0'}%
                        </p>
                        <p className="text-xs text-muted-foreground">drift detected</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Model Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        {performanceMetrics.length > 0 && (
                          performanceMetrics[performanceMetrics.length - 1].accuracy < 0.8 ? (
                            <Badge variant="destructive">Degraded</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500">Good</Badge>
                          )
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {performanceMetrics.length > 0 ? (performanceMetrics[performanceMetrics.length - 1].accuracy * 100).toFixed(1) : '0'}%
                        </p>
                        <p className="text-xs text-muted-foreground">accuracy</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Retraining Recommendation */}
              {recommendation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-balance flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Retraining Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {recommendation.shouldRetrain ? 'Retraining Recommended' : 'No Retraining Needed'}
                          </span>
                          <Badge variant={
                            recommendation.urgency === 'high' ? 'destructive' :
                            recommendation.urgency === 'medium' ? 'secondary' : 'outline'
                          }>
                            {recommendation.urgency} urgency
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          {recommendation.reasons.map((reason, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Expected Improvement</p>
                            <p className="text-lg font-semibold">
                              +{(recommendation.estimatedImprovement * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Confidence</p>
                            <p className="text-lg font-semibold">
                              {(recommendation.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {recommendation.shouldRetrain && (
                        <Button onClick={handleTriggerRetraining} className="shrink-0">
                          <Zap className="h-4 w-4 mr-2" />
                          Trigger Retraining
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Data Drift Tab */}
            <TabsContent value="data-drift" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance">Feature Drift Analysis</CardTitle>
                  <CardDescription className="text-pretty">
                    Drift metrics for each feature using KL divergence, KS statistic, and PSI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataDrift}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="featureName" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        label={{ value: 'Drift Score', angle: -90, position: 'insideLeft' }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar dataKey="driftScore" radius={[4, 4, 0, 0]}>
                        {dataDrift.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={
                              entry.status === 'critical' ? 'hsl(var(--destructive))' :
                              entry.status === 'warning' ? '#eab308' : 'hsl(var(--primary))'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {dataDrift.map((drift, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{drift.featureName}</span>
                          {getStatusBadge(drift.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">KL Divergence</p>
                            <p className="font-mono">{drift.klDivergence.toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">KS Statistic</p>
                            <p className="font-mono">{drift.ksStatistic.toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">PSI</p>
                            <p className="font-mono">{drift.psi.toFixed(3)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prediction Drift Tab */}
            <TabsContent value="prediction-drift" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance">Prediction Drift Over Time</CardTitle>
                  <CardDescription className="text-pretty">
                    Tracking changes in model predictions compared to baseline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={predictionDrift.map((d, i) => ({ ...d, day: i + 1 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="day" 
                        label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        label={{ value: 'Prediction Mean', angle: -90, position: 'insideLeft' }}
                        domain={[0, 1]}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend wrapperStyle={{ paddingTop: 8 }} />
                      <Line 
                        type="monotone" 
                        dataKey="baselineMean" 
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        dot={false}
                        name="Baseline"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="currentMean" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        name="Current"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance">Performance Metrics Over Time</CardTitle>
                  <CardDescription className="text-pretty">
                    Tracking model accuracy, precision, recall, and F1 score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceMetrics.map((m, i) => ({ ...m, day: i + 1 }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="day" 
                        label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                        domain={[0.5, 1]}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend wrapperStyle={{ paddingTop: 8 }} />
                      <Area 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        name="Accuracy"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="f1Score" 
                        stroke="#10b981" 
                        fill="#10b981"
                        fillOpacity={0.2}
                        name="F1 Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
