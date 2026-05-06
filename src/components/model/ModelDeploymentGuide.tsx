import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { modelDeploymentService } from '@/services/modelDeploymentService';
import type { DeploymentPlatform } from '@/services/modelDeploymentService';
import { 
  Rocket, 
  Code, 
  Copy, 
  CheckCircle2, 
  Globe, 
  Smartphone, 
  Server,
  Activity,
  Info,
  Download,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface ModelDeploymentGuideProps {
  modelName?: string;
}

export function ModelDeploymentGuide({ modelName = 'my_model' }: ModelDeploymentGuideProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<DeploymentPlatform>('web');
  const [copiedSection, setCopiedSection] = useState<string>('');

  const deploymentCode = modelDeploymentService.getDeploymentCode(selectedPlatform, modelName);
  const bestPractices = modelDeploymentService.getBestPractices();
  const checklist = modelDeploymentService.getProductionChecklist();

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedSection(''), 2000);
  };

  const platforms = [
    { id: 'web' as DeploymentPlatform, name: 'Web', icon: <Globe className="h-4 w-4" />, description: 'Browser deployment' },
    { id: 'mobile' as DeploymentPlatform, name: 'Mobile', icon: <Smartphone className="h-4 w-4" />, description: 'iOS & Android' },
    { id: 'server-python' as DeploymentPlatform, name: 'Python Server', icon: <Server className="h-4 w-4" />, description: 'Flask API' },
    { id: 'server-node' as DeploymentPlatform, name: 'Node.js Server', icon: <Server className="h-4 w-4" />, description: 'Express API' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            Model Deployment Guide
          </CardTitle>
          <CardDescription className="text-pretty">
            Export your trained model and deploy it to production environments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This guide walks you through exporting your model and deploying it to web, mobile, or server environments
              with code examples and best practices for production monitoring.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Select Deployment Platform</CardTitle>
          <CardDescription className="text-pretty">
            Choose where you want to deploy your model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {platforms.map(platform => (
              <div
                key={platform.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedPlatform === platform.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedPlatform(platform.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {platform.icon}
                  <span className="font-semibold">{platform.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{platform.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">{deploymentCode.title}</CardTitle>
          <CardDescription className="text-pretty">
            {deploymentCode.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="export">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="export">1. Export Model</TabsTrigger>
              <TabsTrigger value="deploy">2. Deploy Code</TabsTrigger>
              <TabsTrigger value="monitor">3. Monitor</TabsTrigger>
            </TabsList>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-4">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  First, export your trained model in the format required for {deploymentCode.title}
                </AlertDescription>
              </Alert>

              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{deploymentCode.exportCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(deploymentCode.exportCode, 'export')}
                >
                  {copiedSection === 'export' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Required Dependencies</h4>
                <ul className="space-y-1">
                  {deploymentCode.dependencies.map((dep, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Code className="h-3 w-3 text-primary" />
                      <code className="text-xs bg-muted px-2 py-1 rounded">{dep}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            {/* Deploy Tab */}
            <TabsContent value="deploy" className="space-y-4">
              <Alert>
                <Rocket className="h-4 w-4" />
                <AlertDescription>
                  Use this code to load and serve your model in production
                </AlertDescription>
              </Alert>

              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm max-h-96">
                  <code>{deploymentCode.deploymentCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(deploymentCode.deploymentCode, 'deploy')}
                >
                  {copiedSection === 'deploy' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    What This Code Does
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Loads your trained model</li>
                    <li>• Creates API endpoint for predictions</li>
                    <li>• Handles input validation</li>
                    <li>• Returns predictions in JSON format</li>
                    <li>• Includes error handling</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Important Notes
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Test locally before deploying</li>
                    <li>• Use environment variables for config</li>
                    <li>• Enable CORS for web clients</li>
                    <li>• Add authentication in production</li>
                    <li>• Monitor resource usage</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Monitor Tab */}
            <TabsContent value="monitor" className="space-y-4">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  Monitor your model's performance and detect issues in production
                </AlertDescription>
              </Alert>

              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm max-h-96">
                  <code>{deploymentCode.monitoringCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(deploymentCode.monitoringCode, 'monitor')}
                >
                  {copiedSection === 'monitor' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Key Metrics to Track</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="text-sm">
                    <strong>Performance Metrics:</strong>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      <li>• Prediction latency</li>
                      <li>• Throughput (requests/second)</li>
                      <li>• Error rate</li>
                    </ul>
                  </div>
                  <div className="text-sm">
                    <strong>Model Health:</strong>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      <li>• Data drift detection</li>
                      <li>• Prediction distribution</li>
                      <li>• Model accuracy over time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Production Best Practices</CardTitle>
          <CardDescription className="text-pretty">
            Follow these guidelines for reliable model deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {bestPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{practice}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Production Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Production Readiness Checklist</CardTitle>
          <CardDescription className="text-pretty">
            Ensure your deployment is production-ready
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checklist.map((section, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">{section.category}</h4>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        id={`check-${index}-${itemIndex}`}
                      />
                      <label
                        htmlFor={`check-${index}-${itemIndex}`}
                        className="cursor-pointer"
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <Badge variant="secondary">1</Badge>
              <span>
                <strong>Export your model</strong> using the code in the "Export Model" tab
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Badge variant="secondary">2</Badge>
              <span>
                <strong>Set up your deployment environment</strong> with required dependencies
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Badge variant="secondary">3</Badge>
              <span>
                <strong>Deploy the code</strong> from the "Deploy Code" tab to your server
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Badge variant="secondary">4</Badge>
              <span>
                <strong>Implement monitoring</strong> using the code in the "Monitor" tab
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Badge variant="secondary">5</Badge>
              <span>
                <strong>Test thoroughly</strong> with sample data before going live
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Badge variant="secondary">6</Badge>
              <span>
                <strong>Monitor performance</strong> and iterate based on real-world usage
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
