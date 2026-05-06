import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Play, 
  RotateCcw,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { LineChart, BarChart } from '@/components/charts/ChartComponents';
import { 
  timeSeriesService, 
  type TimeSeriesData, 
  type ForecastResult,
  type DecompositionResult,
  type AnomalyResult,
  type StationarityTest
} from '@/services/timeSeriesService';

type ForecastMethod = 'arima' | 'lstm' | 'prophet';
type AnomalyMethod = 'zscore' | 'iqr' | 'isolation_forest';

export function TimeSeriesAnalysisWorkshop() {
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [decomposition, setDecomposition] = useState<DecompositionResult | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);
  const [stationarityTest, setStationarityTest] = useState<StationarityTest | null>(null);
  const [acf, setAcf] = useState<number[]>([]);
  const [pacf, setPacf] = useState<number[]>([]);
  
  const [selectedForecastMethod, setSelectedForecastMethod] = useState<ForecastMethod>('arima');
  const [selectedAnomalyMethod, setSelectedAnomalyMethod] = useState<AnomalyMethod>('zscore');
  const [isRunning, setIsRunning] = useState(false);
  
  // Data generation parameters
  const [dataLength, setDataLength] = useState(100);
  const [trend, setTrend] = useState(0.5);
  const [seasonalPeriod, setSeasonalPeriod] = useState(12);
  const [seasonalAmplitude, setSeasonalAmplitude] = useState(10);
  const [noiseLevel, setNoiseLevel] = useState(5);
  const [includeAnomalies, setIncludeAnomalies] = useState(true);
  
  // Forecast parameters
  const [forecastSteps, setForecastSteps] = useState(20);
  
  // Anomaly detection parameters
  const [zScoreThreshold, setZScoreThreshold] = useState(3);
  const [iqrMultiplier, setIqrMultiplier] = useState(1.5);
  const [contamination, setContamination] = useState(0.1);

  const generateData = () => {
    const newData = timeSeriesService.generateTimeSeriesData(
      dataLength,
      trend,
      seasonalPeriod,
      seasonalAmplitude,
      noiseLevel,
      includeAnomalies
    );
    setData(newData);
    
    // Run stationarity test
    const adfResult = timeSeriesService.adfTest(newData);
    setStationarityTest(adfResult);
    
    // Calculate ACF and PACF
    const acfValues = timeSeriesService.calculateACF(newData, 20);
    const pacfValues = timeSeriesService.calculatePACF(newData, 20);
    setAcf(acfValues);
    setPacf(pacfValues);
    
    // Clear previous results
    setForecastResult(null);
    setDecomposition(null);
    setAnomalyResult(null);
  };

  const runDecomposition = () => {
    if (data.length === 0) return;
    
    setIsRunning(true);
    setTimeout(() => {
      const result = timeSeriesService.seasonalDecomposition(data, seasonalPeriod);
      setDecomposition(result);
      setIsRunning(false);
    }, 500);
  };

  const runForecast = () => {
    if (data.length === 0) {
      generateData();
      return;
    }

    setIsRunning(true);
    setTimeout(() => {
      let result: ForecastResult;
      
      switch (selectedForecastMethod) {
        case 'arima':
          result = timeSeriesService.arimaForecast(data, forecastSteps);
          break;
        case 'lstm':
          result = timeSeriesService.lstmForecast(data, forecastSteps);
          break;
        case 'prophet':
          result = timeSeriesService.prophetForecast(data, forecastSteps, seasonalPeriod);
          break;
      }
      
      setForecastResult(result);
      setIsRunning(false);
    }, 1000);
  };

  const runAnomalyDetection = () => {
    if (data.length === 0) return;

    setIsRunning(true);
    setTimeout(() => {
      let result: AnomalyResult;
      
      switch (selectedAnomalyMethod) {
        case 'zscore':
          result = timeSeriesService.zScoreAnomalyDetection(data, zScoreThreshold);
          break;
        case 'iqr':
          result = timeSeriesService.iqrAnomalyDetection(data, iqrMultiplier);
          break;
        case 'isolation_forest':
          result = timeSeriesService.isolationForestTemporal(data, contamination);
          break;
      }
      
      setAnomalyResult(result);
      setIsRunning(false);
    }, 800);
  };

  const reset = () => {
    setData([]);
    setForecastResult(null);
    setDecomposition(null);
    setAnomalyResult(null);
    setStationarityTest(null);
    setAcf([]);
    setPacf([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="h-6 w-6" />
                Time Series Analysis Workshop
              </CardTitle>
              <CardDescription className="mt-2">
                Comprehensive forecasting and anomaly detection for temporal data
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              <Calendar className="h-3 w-3 mr-1" />
              Temporal Analysis
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Generation</CardTitle>
          <CardDescription>Configure synthetic time series parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm">Data Points: {dataLength}</Label>
              <Slider
                value={[dataLength]}
                onValueChange={([v]) => setDataLength(v)}
                min={50}
                max={200}
                step={10}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Trend Strength: {trend.toFixed(2)}</Label>
              <Slider
                value={[trend * 100]}
                onValueChange={([v]) => setTrend(v / 100)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Seasonal Period: {seasonalPeriod}</Label>
              <Slider
                value={[seasonalPeriod]}
                onValueChange={([v]) => setSeasonalPeriod(v)}
                min={4}
                max={24}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Seasonal Amplitude: {seasonalAmplitude}</Label>
              <Slider
                value={[seasonalAmplitude]}
                onValueChange={([v]) => setSeasonalAmplitude(v)}
                min={0}
                max={30}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Noise Level: {noiseLevel}</Label>
              <Slider
                value={[noiseLevel]}
                onValueChange={([v]) => setNoiseLevel(v)}
                min={0}
                max={20}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Include Anomalies</Label>
              <Button
                variant={includeAnomalies ? 'default' : 'outline'}
                onClick={() => setIncludeAnomalies(!includeAnomalies)}
                className="w-full"
                size="sm"
              >
                {includeAnomalies ? 'Yes' : 'No'}
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={generateData} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Generate Data
            </Button>
            {data.length > 0 && (
              <Button onClick={reset} variant="outline">
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stationarity Test */}
      {stationarityTest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stationarity Test (ADF)</CardTitle>
            <CardDescription>Augmented Dickey-Fuller test results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Alert className={stationarityTest.isStationary ? 'border-green-200 dark:border-green-900' : 'border-orange-200 dark:border-orange-900'}>
                {stationarityTest.isStationary ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                )}
                <AlertDescription>
                  <p className="font-semibold mb-1">
                    {stationarityTest.isStationary ? 'Series is Stationary' : 'Series is Non-Stationary'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Test Statistic: {stationarityTest.testStatistic.toFixed(4)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    P-Value: {stationarityTest.pValue.toFixed(4)}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Critical Values:</p>
                {Object.entries(stationarityTest.criticalValues).map(([level, value]) => (
                  <div key={level} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{level}:</span>
                    <span className="font-mono">{value.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analysis Tabs */}
      {data.length > 0 && (
        <Tabs defaultValue="forecast" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forecast">Forecasting</TabsTrigger>
            <TabsTrigger value="decomposition">Decomposition</TabsTrigger>
            <TabsTrigger value="anomaly">Anomaly Detection</TabsTrigger>
          </TabsList>

          {/* Forecasting Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forecasting Methods</CardTitle>
                <CardDescription>Select and configure forecasting algorithm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                  {(['arima', 'lstm', 'prophet'] as ForecastMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setSelectedForecastMethod(method)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedForecastMethod === method
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-semibold text-sm mb-1">
                        {method === 'arima' ? 'ARIMA' : method === 'lstm' ? 'LSTM' : 'Prophet'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {method === 'arima' && 'Statistical model with AR, I, MA components'}
                        {method === 'lstm' && 'Neural network for complex patterns'}
                        {method === 'prophet' && 'Additive model for business time series'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Forecast Steps: {forecastSteps}</Label>
                  <Slider
                    value={[forecastSteps]}
                    onValueChange={([v]) => setForecastSteps(v)}
                    min={5}
                    max={50}
                    step={5}
                  />
                </div>

                <Button onClick={runForecast} disabled={isRunning} className="w-full">
                  {isRunning ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Forecast
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {forecastResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Results</CardTitle>
                  <CardDescription>Historical data and future predictions with confidence intervals</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart
                    data={{
                      labels: [
                        ...forecastResult.historical.map(d => d.date || d.timestamp.toString()),
                        ...forecastResult.forecast.map(d => d.date || d.timestamp.toString())
                      ],
                      datasets: [
                        {
                          label: 'Historical',
                          data: [
                            ...forecastResult.historical.map(d => d.value),
                            ...Array(forecastResult.forecast.length).fill(null)
                          ] as number[],
                          borderColor: 'hsl(var(--chart-1))',
                          backgroundColor: 'hsla(var(--chart-1), 0.1)',
                          tension: 0.4,
                          fill: false,
                        },
                        {
                          label: 'Forecast',
                          data: [
                            ...Array(forecastResult.historical.length).fill(null),
                            ...forecastResult.forecast.map(d => d.value)
                          ] as number[],
                          borderColor: 'hsl(var(--chart-2))',
                          backgroundColor: 'hsla(var(--chart-2), 0.1)',
                          tension: 0.4,
                          fill: false,
                        },
                        {
                          label: 'Upper Bound',
                          data: [
                            ...Array(forecastResult.historical.length).fill(null),
                            ...(forecastResult.upperBound?.map(d => d.value) || [])
                          ] as number[],
                          borderColor: 'hsla(var(--chart-3), 0.3)',
                          backgroundColor: 'hsla(var(--chart-3), 0.05)',
                          tension: 0.4,
                          fill: false,
                        },
                        {
                          label: 'Lower Bound',
                          data: [
                            ...Array(forecastResult.historical.length).fill(null),
                            ...(forecastResult.lowerBound?.map(d => d.value) || [])
                          ] as number[],
                          borderColor: 'hsla(var(--chart-3), 0.3)',
                          backgroundColor: 'hsla(var(--chart-3), 0.05)',
                          tension: 0.4,
                          fill: false,
                        }
                      ]
                    }}
                    options={{
                      scales: {
                        x: {
                          display: false
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Value',
                            color: 'hsl(var(--muted-foreground))',
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top' as const,
                        }
                      }
                    }}
                    height={350}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Decomposition Tab */}
          <TabsContent value="decomposition" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seasonal Decomposition</CardTitle>
                <CardDescription>Separate trend, seasonal, and residual components</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={runDecomposition} disabled={isRunning} className="w-full">
                  {isRunning ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Decomposition
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {decomposition && (
              <>
                {['original', 'trend', 'seasonal', 'residual'].map((component) => (
                  <Card key={component}>
                    <CardHeader>
                      <CardTitle className="text-base capitalize">{component} Component</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LineChart
                        data={{
                          labels: decomposition[component as keyof DecompositionResult].map(d => d.date || d.timestamp.toString()),
                          datasets: [{
                            label: component.charAt(0).toUpperCase() + component.slice(1),
                            data: decomposition[component as keyof DecompositionResult].map(d => d.value),
                            borderColor: `hsl(var(--chart-${component === 'original' ? '1' : component === 'trend' ? '2' : component === 'seasonal' ? '3' : '4'}))`,
                            backgroundColor: `hsla(var(--chart-${component === 'original' ? '1' : component === 'trend' ? '2' : component === 'seasonal' ? '3' : '4'}), 0.1)`,
                            tension: 0.4,
                            fill: true,
                          }]
                        }}
                        options={{
                          scales: {
                            x: { display: false },
                            y: {
                              title: {
                                display: true,
                                text: 'Value',
                                color: 'hsl(var(--muted-foreground))',
                              }
                            }
                          },
                          plugins: {
                            legend: { display: false }
                          }
                        }}
                        height={200}
                      />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* ACF and PACF */}
            {acf.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ACF (Autocorrelation)</CardTitle>
                    <CardDescription>Correlation with lagged values</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={{
                        labels: acf.map((_, i) => i.toString()),
                        datasets: [{
                          label: 'ACF',
                          data: acf,
                          backgroundColor: acf.map(v => 
                            Math.abs(v) > 0.2 ? 'hsl(var(--chart-1))' : 'hsl(var(--muted))'
                          ),
                        }]
                      }}
                      options={{
                        scales: {
                          y: {
                            min: -1,
                            max: 1,
                            title: {
                              display: true,
                              text: 'Correlation',
                              color: 'hsl(var(--muted-foreground))',
                            }
                          }
                        },
                        plugins: {
                          legend: { display: false }
                        }
                      }}
                      height={250}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">PACF (Partial Autocorrelation)</CardTitle>
                    <CardDescription>Direct correlation at each lag</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={{
                        labels: pacf.map((_, i) => i.toString()),
                        datasets: [{
                          label: 'PACF',
                          data: pacf,
                          backgroundColor: pacf.map(v => 
                            Math.abs(v) > 0.2 ? 'hsl(var(--chart-2))' : 'hsl(var(--muted))'
                          ),
                        }]
                      }}
                      options={{
                        scales: {
                          y: {
                            min: -1,
                            max: 1,
                            title: {
                              display: true,
                              text: 'Correlation',
                              color: 'hsl(var(--muted-foreground))',
                            }
                          }
                        },
                        plugins: {
                          legend: { display: false }
                        }
                      }}
                      height={250}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Anomaly Detection Tab */}
          <TabsContent value="anomaly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anomaly Detection Methods</CardTitle>
                <CardDescription>Detect unusual patterns in time series</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                  {(['zscore', 'iqr', 'isolation_forest'] as AnomalyMethod[]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setSelectedAnomalyMethod(method)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedAnomalyMethod === method
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-semibold text-sm mb-1">
                        {method === 'zscore' ? 'Z-Score' : method === 'iqr' ? 'IQR' : 'Isolation Forest'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {method === 'zscore' && 'Statistical deviation from mean'}
                        {method === 'iqr' && 'Interquartile range outliers'}
                        {method === 'isolation_forest' && 'Temporal pattern isolation'}
                      </p>
                    </button>
                  ))}
                </div>

                {selectedAnomalyMethod === 'zscore' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Z-Score Threshold: {zScoreThreshold}</Label>
                    <Slider
                      value={[zScoreThreshold]}
                      onValueChange={([v]) => setZScoreThreshold(v)}
                      min={1}
                      max={5}
                      step={0.5}
                    />
                  </div>
                )}

                {selectedAnomalyMethod === 'iqr' && (
                  <div className="space-y-2">
                    <Label className="text-sm">IQR Multiplier: {iqrMultiplier.toFixed(1)}</Label>
                    <Slider
                      value={[iqrMultiplier * 10]}
                      onValueChange={([v]) => setIqrMultiplier(v / 10)}
                      min={10}
                      max={30}
                      step={1}
                    />
                  </div>
                )}

                {selectedAnomalyMethod === 'isolation_forest' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Contamination: {(contamination * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[contamination * 100]}
                      onValueChange={([v]) => setContamination(v / 100)}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                )}

                <Button onClick={runAnomalyDetection} disabled={isRunning} className="w-full">
                  {isRunning ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Detect Anomalies
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {anomalyResult && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Detected Anomalies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{anomalyResult.anomalies.length}</p>
                      <p className="text-sm text-muted-foreground">
                        {((anomalyResult.anomalies.length / anomalyResult.data.length) * 100).toFixed(1)}% of data
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">{anomalyResult.method}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Threshold
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold">{anomalyResult.threshold.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Anomaly Visualization</CardTitle>
                    <CardDescription>Time series with detected anomalies highlighted</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={{
                        labels: anomalyResult.data.map(d => d.date || d.timestamp.toString()),
                        datasets: [
                          {
                            label: 'Normal Data',
                            data: anomalyResult.data.map(d => {
                              const isAnomaly = anomalyResult.anomalies.some(a => a.timestamp === d.timestamp);
                              return isAnomaly ? 0 : d.value;
                            }),
                            borderColor: 'hsl(var(--chart-2))',
                            backgroundColor: 'hsla(var(--chart-2), 0.1)',
                            tension: 0.4,
                          },
                          {
                            label: 'Anomalies',
                            data: anomalyResult.data.map(d => {
                              const isAnomaly = anomalyResult.anomalies.some(a => a.timestamp === d.timestamp);
                              return isAnomaly ? d.value : 0;
                            }),
                            borderColor: 'hsl(var(--chart-1))',
                            backgroundColor: 'hsl(var(--chart-1))',
                          }
                        ]
                      }}
                      options={{
                        scales: {
                          x: { display: false },
                          y: {
                            title: {
                              display: true,
                              text: 'Value',
                              color: 'hsl(var(--muted-foreground))',
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top' as const,
                          }
                        }
                      }}
                      height={350}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Time Series Concepts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="concepts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="concepts">Key Concepts</TabsTrigger>
              <TabsTrigger value="methods">Methods</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>

            <TabsContent value="concepts" className="space-y-3">
              {[
                {
                  title: 'Stationarity',
                  description: 'A stationary time series has constant mean, variance, and autocorrelation over time. Most forecasting methods require stationary data.'
                },
                {
                  title: 'Trend',
                  description: 'Long-term increase or decrease in the data. Trends can be linear, exponential, or polynomial.'
                },
                {
                  title: 'Seasonality',
                  description: 'Regular, periodic fluctuations in the data. Common in business data (daily, weekly, monthly, yearly patterns).'
                },
                {
                  title: 'Autocorrelation',
                  description: 'Correlation of a time series with its own past values. ACF shows correlation at different lags, PACF shows direct correlation.'
                }
              ].map((concept, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <Activity className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">{concept.title}</p>
                    <p className="text-sm text-muted-foreground">{concept.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="methods" className="space-y-3">
              {[
                {
                  title: 'ARIMA',
                  description: 'Combines AutoRegressive (AR), Integrated (I), and Moving Average (MA) components. Best for univariate time series with trends.'
                },
                {
                  title: 'LSTM Networks',
                  description: 'Recurrent neural networks that can learn long-term dependencies. Excellent for complex, non-linear patterns.'
                },
                {
                  title: 'Prophet',
                  description: 'Developed by Facebook for business time series. Handles missing data, outliers, and multiple seasonality automatically.'
                },
                {
                  title: 'Seasonal Decomposition',
                  description: 'Separates time series into trend, seasonal, and residual components for better understanding and modeling.'
                }
              ].map((method, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <LineChartIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">{method.title}</p>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="applications" className="space-y-3">
              {[
                {
                  title: 'Demand Forecasting',
                  description: 'Predict future product demand for inventory management and supply chain optimization.'
                },
                {
                  title: 'Stock Price Prediction',
                  description: 'Forecast stock prices and market trends for investment decisions (note: markets are highly unpredictable).'
                },
                {
                  title: 'Sensor Monitoring',
                  description: 'Monitor IoT sensors for anomalies in temperature, pressure, vibration, etc. for predictive maintenance.'
                },
                {
                  title: 'Energy Consumption',
                  description: 'Forecast electricity demand for grid management and renewable energy integration.'
                }
              ].map((app, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 rounded-lg border bg-card">
                  <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">{app.title}</p>
                    <p className="text-sm text-muted-foreground">{app.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
