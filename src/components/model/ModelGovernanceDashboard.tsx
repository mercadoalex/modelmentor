import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  modelGovernanceService,
  type ModelVersion,
  type AuditEvent,
  type BiasMetrics,
  type FairnessMetrics,
  type ModelCard,
  type ComplianceReport,
  type UserRole,
  type ModelStatus,
} from '@/services/modelGovernanceService';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Shield,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  Lock,
  GitBranch,
  Clock,
  Scale,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export function ModelGovernanceDashboard() {
  const [userRole, setUserRole] = useState<UserRole>('data_scientist');
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelVersion | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [biasMetrics, setBiasMetrics] = useState<BiasMetrics[]>([]);
  const [fairnessMetrics, setFairnessMetrics] = useState<FairnessMetrics | null>(null);
  const [modelCard, setModelCard] = useState<ModelCard | null>(null);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);

  useEffect(() => {
    // Load simulated data
    const data = modelGovernanceService.generateSimulatedData();
    setModels(data.models);
    setSelectedModel(data.models[1]); // Select production model
    setAuditEvents(data.auditEvents);
    setBiasMetrics(data.biasAnalysis.metrics);
    setFairnessMetrics(data.biasAnalysis.fairness);

    // Generate model card
    const card = modelGovernanceService.generateModelCard(
      data.models[1],
      data.biasAnalysis.metrics,
      data.biasAnalysis.fairness
    );
    setModelCard(card);

    // Generate compliance reports
    const gdprReport = modelGovernanceService.generateGDPRReport(
      data.models[1],
      data.auditEvents
    );
    const aiActReport = modelGovernanceService.generateAIActReport(
      data.models[1],
      data.biasAnalysis.metrics
    );
    setComplianceReports([gdprReport, aiActReport]);
  }, []);

  const handleExportModelCard = () => {
    if (modelCard) {
      const blob = new Blob([JSON.stringify(modelCard, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `model-card-${modelCard.version}.json`;
      a.click();
      toast.success('Model card exported');
    }
  };

  const handleExportAuditTrail = () => {
    const csv = [
      ['Timestamp', 'Event Type', 'User', 'Model Version', 'Action', 'Details'].join(','),
      ...auditEvents.map(event => [
        event.timestamp.toISOString(),
        event.eventType,
        event.userName,
        event.modelVersion,
        event.action,
        event.details,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-trail.csv';
    a.click();
    toast.success('Audit trail exported');
  };

  const getStatusBadge = (status: ModelStatus) => {
    switch (status) {
      case 'production':
        return <Badge className="bg-green-500">Production</Badge>;
      case 'staging':
        return <Badge variant="secondary">Staging</Badge>;
      case 'development':
        return <Badge variant="outline">Development</Badge>;
      case 'deprecated':
        return <Badge variant="destructive">Deprecated</Badge>;
    }
  };

  const getFairnessBadge = (fairness: FairnessMetrics['overallFairness']) => {
    switch (fairness) {
      case 'fair':
        return <Badge className="bg-green-500">Fair</Badge>;
      case 'concerning':
        return <Badge className="bg-yellow-500">Concerning</Badge>;
      case 'unfair':
        return <Badge variant="destructive">Unfair</Badge>;
    }
  };

  const getComplianceStatusBadge = (status: ComplianceReport['status']) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500">Compliant</Badge>;
      case 'needs_review':
        return <Badge className="bg-yellow-500">Needs Review</Badge>;
      case 'non_compliant':
        return <Badge variant="destructive">Non-Compliant</Badge>;
    }
  };

  const canPerformAction = (action: string) => {
    return modelGovernanceService.checkPermission(userRole, action);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Model Governance Dashboard
          </CardTitle>
          <CardDescription className="text-pretty">
            Comprehensive oversight for model compliance, fairness, and accountability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">User Role</p>
              <Select value={userRole} onValueChange={(v) => setUserRole(v as UserRole)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_scientist">Data Scientist</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Role-based access control active
              </span>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Governance Active:</strong> All model activities are logged and monitored for compliance with GDPR, AI Act, and fairness requirements.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Governance Tabs */}
      <Tabs defaultValue="registry">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="registry">Model Registry</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="fairness">Fairness Analysis</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="model-card">Model Card</TabsTrigger>
        </TabsList>

        {/* Model Registry Tab */}
        <TabsContent value="registry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Model Version Registry
              </CardTitle>
              <CardDescription className="text-pretty">
                Track all model versions, metadata, and lineage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`p-4 border rounded-lg ${selectedModel?.id === model.id ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{model.name}</span>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{model.version}</code>
                        {getStatusBadge(model.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created by {model.createdBy} on {model.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{(model.accuracy * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">accuracy</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Framework</p>
                      <p className="font-medium">{model.metadata.framework}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Algorithm</p>
                      <p className="font-medium">{model.metadata.algorithm}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Training Samples</p>
                      <p className="font-medium">{model.metadata.trainingDataSize.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Features ({model.metadata.features.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {model.metadata.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">{feature}</Badge>
                      ))}
                    </div>
                  </div>

                  {model.lineage.parentVersion && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <GitBranch className="h-3 w-3 inline mr-1" />
                        Derived from version {model.lineage.parentVersion}
                      </p>
                    </div>
                  )}

                  {canPerformAction('view') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setSelectedModel(model)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-balance flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Audit Trail
                  </CardTitle>
                  <CardDescription className="text-pretty">
                    Complete history of model activities and changes
                  </CardDescription>
                </div>
                {canPerformAction('export') && (
                  <Button onClick={handleExportAuditTrail} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditEvents.map((event) => (
                <div key={event.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{event.eventType}</Badge>
                      <span className="font-medium">{event.action}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {event.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{event.details}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      <Users className="h-3 w-3 inline mr-1" />
                      {event.userName}
                    </span>
                    <span>
                      <GitBranch className="h-3 w-3 inline mr-1" />
                      {event.modelVersion}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fairness Analysis Tab */}
        <TabsContent value="fairness" className="space-y-6">
          {fairnessMetrics && (
            <>
              {/* Fairness Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Fairness Metrics Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold mb-1">Overall Fairness Assessment</p>
                      <p className="text-sm text-muted-foreground">
                        Based on disparate impact, equal opportunity, and demographic parity
                      </p>
                    </div>
                    {getFairnessBadge(fairnessMetrics.overallFairness)}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Disparate Impact</p>
                      <p className="text-2xl font-bold">{fairnessMetrics.disparateImpact.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fair range: 0.8 - 1.25
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Equal Opportunity Diff</p>
                      <p className="text-2xl font-bold">{fairnessMetrics.equalOpportunityDifference.toFixed(3)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fair if &lt; 0.1
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Demographic Parity</p>
                      <p className="text-2xl font-bold">{fairnessMetrics.demographicParity.toFixed(3)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fair if &lt; 0.1
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance by Group */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-balance">Performance by Demographic Group</CardTitle>
                  <CardDescription className="text-pretty">
                    Comparing model performance across different groups
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={biasMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="demographicGroup" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ paddingTop: 8 }} />
                      <Bar dataKey="accuracy" fill="hsl(var(--primary))" name="Accuracy" />
                      <Bar dataKey="precision" fill="#10b981" name="Precision" />
                      <Bar dataKey="recall" fill="#f59e0b" name="Recall" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {biasMetrics.map((metric, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">{metric.demographicGroup}</span>
                          <Badge variant="secondary">{metric.sampleSize} samples</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Accuracy</p>
                            <p className="font-semibold">{(metric.accuracy * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Precision</p>
                            <p className="font-semibold">{(metric.precision * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Recall</p>
                            <p className="font-semibold">{(metric.recall * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">F1 Score</p>
                            <p className="font-semibold">{(metric.f1Score * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          {complianceReports.map((report, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-balance flex items-center gap-2">
                      <FileCheck className="h-5 w-5" />
                      {report.reportType.replace('_', ' ')} Compliance Report
                    </CardTitle>
                    <CardDescription className="text-pretty">
                      Generated on {report.generatedAt.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {getComplianceStatusBadge(report.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Compliance Findings</h4>
                  {report.findings.map((finding, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3 p-3 border rounded-lg">
                      {finding.status === 'pass' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : finding.status === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{finding.requirement}</p>
                        <p className="text-sm text-muted-foreground">{finding.details}</p>
                      </div>
                      <Badge variant={
                        finding.status === 'pass' ? 'secondary' :
                        finding.status === 'warning' ? 'outline' : 'destructive'
                      }>
                        {finding.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Recommendations</h4>
                  <ul className="space-y-1">
                    {report.recommendations.map((rec, rIndex) => (
                      <li key={rIndex} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Model Card Tab */}
        <TabsContent value="model-card" className="space-y-6">
          {modelCard && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-balance flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Model Card: {modelCard.modelName} {modelCard.version}
                    </CardTitle>
                    <CardDescription className="text-pretty">
                      Comprehensive documentation for transparency and accountability
                    </CardDescription>
                  </div>
                  {canPerformAction('export') && (
                    <Button onClick={handleExportModelCard} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overview */}
                <div>
                  <h3 className="font-semibold mb-2">Overview</h3>
                  <p className="text-sm text-muted-foreground">{modelCard.overview}</p>
                </div>

                {/* Intended Use */}
                <div>
                  <h3 className="font-semibold mb-2">Intended Use</h3>
                  <ul className="space-y-1">
                    {modelCard.intendedUse.map((use, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                <div>
                  <h3 className="font-semibold mb-2">Limitations</h3>
                  <ul className="space-y-1">
                    {modelCard.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Training Data */}
                <div>
                  <h3 className="font-semibold mb-2">Training Data</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium">{modelCard.trainingData.source}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium">{modelCard.trainingData.size.toLocaleString()} samples</p>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h3 className="font-semibold mb-2">Performance Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="text-xl font-bold">{(modelCard.performance.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Precision</p>
                      <p className="text-xl font-bold">{(modelCard.performance.precision * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Recall</p>
                      <p className="text-xl font-bold">{(modelCard.performance.recall * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">F1 Score</p>
                      <p className="text-xl font-bold">{(modelCard.performance.f1Score * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Fairness */}
                <div>
                  <h3 className="font-semibold mb-2">Fairness Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Groups analyzed: {modelCard.fairness.groupsAnalyzed.join(', ')}
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Mitigation Strategies</h4>
                    <ul className="space-y-1">
                      {modelCard.fairness.mitigationStrategies.map((strategy, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {strategy}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Ethical Considerations */}
                <div>
                  <h3 className="font-semibold mb-2">Ethical Considerations</h3>
                  <ul className="space-y-1">
                    {modelCard.ethicalConsiderations.map((consideration, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {consideration}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contact Info */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Owner</p>
                      <p className="font-medium">{modelCard.contactInfo.owner}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{modelCard.contactInfo.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Team</p>
                      <p className="font-medium">{modelCard.contactInfo.team}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
