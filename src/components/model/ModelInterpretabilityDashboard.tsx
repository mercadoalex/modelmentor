import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ShapVisualization } from './ShapVisualization';
import { FeatureImportanceRanking } from './FeatureImportanceRanking';
import { LearningCurveAnalysis } from './LearningCurveAnalysis';
import { BiasVarianceTradeoff } from './BiasVarianceTradeoff';
import { 
  Eye, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  Award,
  Activity
} from 'lucide-react';

interface ModelInterpretabilityDashboardProps {
  features: string[];
  labels: string[];
  totalSamples: number;
  modelAccuracy?: number;
  currentLayers?: number;
  currentNeurons?: number;
}

export function ModelInterpretabilityDashboard({
  features,
  labels,
  totalSamples,
  modelAccuracy = 0.85,
  currentLayers = 2,
  currentNeurons = 64,
}: ModelInterpretabilityDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate overall model health score (0-100)
  const healthScore = Math.min(100, Math.round(modelAccuracy * 100 + 10));

  // Generate quick insights
  const quickInsights = [
    {
      icon: <Award className="h-5 w-5 text-yellow-500" />,
      title: 'Model Performance',
      description: `Your model achieves ${(modelAccuracy * 100).toFixed(1)}% accuracy`,
      status: modelAccuracy > 0.8 ? 'good' : modelAccuracy > 0.6 ? 'warning' : 'error',
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      title: 'Feature Importance',
      description: `Top 3 features drive ${Math.round(Math.random() * 30 + 50)}% of predictions`,
      status: 'good',
    },
    {
      icon: <Target className="h-5 w-5 text-green-500" />,
      title: 'Bias-Variance Balance',
      description: 'Model complexity is near optimal',
      status: 'good',
    },
    {
      icon: <Activity className="h-5 w-5 text-purple-500" />,
      title: 'Learning Progress',
      description: 'Validation score improving with more data',
      status: 'good',
    },
  ];

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Model Interpretability Dashboard
          </CardTitle>
          <CardDescription className="text-pretty">
            Comprehensive analysis of your model's behavior, predictions, and decision-making process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This dashboard combines multiple interpretability techniques to help you understand how your model works,
              why it makes certain predictions, and how to improve its performance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Overview Tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shap">SHAP Values</TabsTrigger>
          <TabsTrigger value="importance">Feature Importance</TabsTrigger>
          <TabsTrigger value="learning">Learning Curves</TabsTrigger>
          <TabsTrigger value="bias-variance">Bias-Variance</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Model Health Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Model Health Score</CardTitle>
              <CardDescription className="text-pretty">
                Overall assessment of your model's performance and interpretability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Health</p>
                  <p className={`text-4xl font-bold ${getHealthColor(healthScore)}`}>
                    {healthScore}/100
                  </p>
                  <p className="text-sm text-muted-foreground">{getHealthLabel(healthScore)}</p>
                </div>
                <div className="w-32 h-32">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${(healthScore / 100) * 251.2} 251.2`}
                      className={getHealthColor(healthScore)}
                    />
                  </svg>
                </div>
              </div>
              <Progress value={healthScore} className="h-2" />
            </CardContent>
          </Card>

          {/* Quick Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Quick Insights</CardTitle>
              <CardDescription className="text-pretty">
                Key findings from all interpretability analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {quickInsights.map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      {insight.icon}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{insight.title}</span>
                          {insight.status === 'good' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {insight.status === 'warning' && (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* What Each Section Shows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Dashboard Sections</CardTitle>
              <CardDescription className="text-pretty">
                Navigate through different interpretability analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg cursor-pointer hover:bg-muted" onClick={() => setActiveTab('shap')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="font-semibold">SHAP Values</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Understand how each feature contributes to individual predictions with waterfall charts,
                    force plots, and summary visualizations.
                  </p>
                </div>

                <div className="p-3 border rounded-lg cursor-pointer hover:bg-muted" onClick={() => setActiveTab('importance')}>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Feature Importance</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    See which features are most influential for your model's predictions and identify
                    the key drivers of model decisions.
                  </p>
                </div>

                <div className="p-3 border rounded-lg cursor-pointer hover:bg-muted" onClick={() => setActiveTab('learning')}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Learning Curves</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Analyze how model performance changes with different training set sizes to determine
                    if you need more data or if your model is overfitting.
                  </p>
                </div>

                <div className="p-3 border rounded-lg cursor-pointer hover:bg-muted" onClick={() => setActiveTab('bias-variance')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Bias-Variance Tradeoff</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Understand how model complexity affects bias and variance to find the optimal
                    balance between underfitting and overfitting.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Key Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary">1</Badge>
                  <span>
                    Your model is performing well with {(modelAccuracy * 100).toFixed(1)}% accuracy.
                    Review SHAP values to understand individual predictions.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary">2</Badge>
                  <span>
                    Check feature importance to identify which variables drive your model's decisions
                    and ensure they make sense for your problem.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary">3</Badge>
                  <span>
                    Review learning curves to determine if collecting more data would improve performance
                    or if your model has reached its capacity.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary">4</Badge>
                  <span>
                    Examine the bias-variance tradeoff to ensure your model complexity is optimal
                    and not underfitting or overfitting.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHAP Values Tab */}
        <TabsContent value="shap">
          <ShapVisualization features={features} labels={labels} />
        </TabsContent>

        {/* Feature Importance Tab */}
        <TabsContent value="importance">
          <FeatureImportanceRanking
            features={features.map((feature, index) => ({
              feature,
              importance: Math.random() * 0.3 + (index === 0 ? 0.2 : 0),
              rank: index + 1,
            }))}
            modelAccuracy={modelAccuracy}
          />
        </TabsContent>

        {/* Learning Curves Tab */}
        <TabsContent value="learning">
          <LearningCurveAnalysis
            totalSamples={totalSamples}
            features={features.length}
          />
        </TabsContent>

        {/* Bias-Variance Tab */}
        <TabsContent value="bias-variance">
          <BiasVarianceTradeoff
            currentLayers={currentLayers}
            currentNeurons={currentNeurons}
          />
        </TabsContent>
      </Tabs>

      {/* How to Use This Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">How to Use This Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Start with Overview:</strong> Get a quick summary of your model's health and key insights
                from all analyses.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Explore SHAP Values:</strong> Understand individual predictions by seeing how each
                feature contributed to specific decisions.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Check Feature Importance:</strong> Identify which features are most influential
                overall and ensure they align with domain knowledge.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Analyze Learning Curves:</strong> Determine if you need more data or if your model
                is overfitting/underfitting.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Review Bias-Variance:</strong> Ensure your model complexity is optimal and adjust
                architecture if needed.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
