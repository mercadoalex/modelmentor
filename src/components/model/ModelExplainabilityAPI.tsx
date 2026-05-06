import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { explainabilityApiService } from '@/services/explainabilityApiService';
import type { APIResponse, SHAPValue, CounterfactualExplanation } from '@/services/explainabilityApiService';
import { 
  Code, 
  Play,
  Info,
  Lightbulb,
  CheckCircle2,
  Key,
  Zap,
  Copy,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export function ModelExplainabilityAPI() {
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  
  // Test inputs
  const [testFeatures, setTestFeatures] = useState({
    age: '35',
    income: '75000',
    experience: '10',
    education: '16',
  });
  const [targetPrediction, setTargetPrediction] = useState('0.8');

  const endpoints = explainabilityApiService.getAPIDocumentation();
  const authDocs = explainabilityApiService.getAuthDocumentation();
  const rateLimitInfo = explainabilityApiService.getRateLimitInfo();
  const bestPractices = explainabilityApiService.getBestPractices();
  const codeExamples = explainabilityApiService.getCodeExamples();

  const handleTestEndpoint = async () => {
    setLoading(true);
    setApiResponse(null);

    try {
      const endpoint = endpoints[selectedEndpoint];
      let response: APIResponse;

      // Convert string inputs to numbers
      const features = Object.fromEntries(
        Object.entries(testFeatures).map(([key, value]) => [
          key,
          isNaN(Number(value)) ? value : Number(value)
        ])
      );

      switch (endpoint.path) {
        case '/api/v1/explain/shap':
          response = await explainabilityApiService.callSHAPEndpoint(features);
          break;
        case '/api/v1/explain/importance':
          response = await explainabilityApiService.callFeatureImportanceEndpoint();
          break;
        case '/api/v1/explain/counterfactual':
          response = await explainabilityApiService.callCounterfactualEndpoint(
            features,
            Number(targetPrediction)
          );
          break;
        case '/api/v1/explain/batch':
          response = await explainabilityApiService.callBatchExplainEndpoint([features]);
          break;
        default:
          throw new Error('Unknown endpoint');
      }

      setApiResponse(response);
      toast.success('API call successful');
    } catch (error) {
      toast.error('API call failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleCopyResponse = () => {
    if (apiResponse) {
      navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
      toast.success('Response copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Code className="h-6 w-6" />
            Model Explainability API
          </CardTitle>
          <CardDescription className="text-pretty">
            REST API endpoints for SHAP values, feature importance, and counterfactual explanations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Production-Ready API:</strong> These endpoints provide programmatic access to model explanations, 
              enabling integration with your applications, dashboards, and workflows.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">API Endpoints</CardTitle>
          <CardDescription className="text-pretty">
            Available endpoints for model explainability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${selectedEndpoint === index ? 'border-primary bg-primary/5' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant={endpoint.method === 'POST' ? 'default' : 'secondary'}>
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono">{endpoint.path}</code>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedEndpoint(index)}
                >
                  {selectedEndpoint === index ? 'Selected' : 'Select'}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{endpoint.description}</p>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Parameters</h4>
                {endpoint.parameters.map((param, pIndex) => (
                  <div key={pIndex} className="flex items-start gap-2 text-sm">
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {param.name}
                    </code>
                    <span className="text-muted-foreground">
                      {param.type} {param.required && <Badge variant="destructive" className="ml-1 text-xs">required</Badge>}
                    </span>
                    <span className="text-muted-foreground">- {param.description}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>Rate limit: {endpoint.rateLimit}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Interactive API Tester */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Play className="h-5 w-5" />
            Interactive API Tester
          </CardTitle>
          <CardDescription className="text-pretty">
            Test API endpoints with custom inputs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected Endpoint Info */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={endpoints[selectedEndpoint].method === 'POST' ? 'default' : 'secondary'}>
                {endpoints[selectedEndpoint].method}
              </Badge>
              <code className="text-sm font-mono">{endpoints[selectedEndpoint].path}</code>
            </div>
            <p className="text-sm text-muted-foreground">{endpoints[selectedEndpoint].description}</p>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <h4 className="font-semibold">Test Inputs</h4>
            
            {(selectedEndpoint === 0 || selectedEndpoint === 2 || selectedEndpoint === 3) && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={testFeatures.age}
                    onChange={(e) => setTestFeatures({ ...testFeatures, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income">Income</Label>
                  <Input
                    id="income"
                    type="number"
                    value={testFeatures.income}
                    onChange={(e) => setTestFeatures({ ...testFeatures, income: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={testFeatures.experience}
                    onChange={(e) => setTestFeatures({ ...testFeatures, experience: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education (years)</Label>
                  <Input
                    id="education"
                    type="number"
                    value={testFeatures.education}
                    onChange={(e) => setTestFeatures({ ...testFeatures, education: e.target.value })}
                  />
                </div>
              </div>
            )}

            {selectedEndpoint === 2 && (
              <div className="space-y-2">
                <Label htmlFor="target">Target Prediction (0-1)</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={targetPrediction}
                  onChange={(e) => setTargetPrediction(e.target.value)}
                />
              </div>
            )}

            <Button onClick={handleTestEndpoint} disabled={loading} className="w-full">
              {loading ? 'Calling API...' : 'Test Endpoint'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* API Response */}
          {apiResponse && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">API Response</h4>
                <Button size="sm" variant="outline" onClick={handleCopyResponse}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted/50">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>

              {/* Visualize SHAP Values */}
              {apiResponse.data?.shapValues && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">SHAP Values Visualization</h4>
                  {(apiResponse.data.shapValues as SHAPValue[]).map((value, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-32">{value.featureName}</span>
                      <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden flex items-center">
                        <div
                          className={`h-full ${value.shapValue > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{
                            width: `${Math.abs(value.shapValue) * 100}%`,
                            marginLeft: value.shapValue < 0 ? 'auto' : '0',
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono w-20 text-right">
                        {value.shapValue > 0 ? '+' : ''}{value.shapValue.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Visualize Counterfactual */}
              {apiResponse.data?.counterfactual && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Counterfactual Changes</h4>
                  {(apiResponse.data.counterfactual as CounterfactualExplanation).changes.map((change, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{change.feature}</span>
                        <Badge variant="secondary">Change #{index + 1}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Original</p>
                          <p className="font-mono">{String(change.originalValue)}</p>
                        </div>
                        <div className="flex items-center justify-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-muted-foreground">Suggested</p>
                          <p className="font-mono">{String(change.suggestedValue)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{change.changeReason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Code Examples</CardTitle>
          <CardDescription className="text-pretty">
            Integration examples in different programming languages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="python">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>

            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{lang.charAt(0).toUpperCase() + lang.slice(1)} Example</h4>
                  <Button size="sm" variant="outline" onClick={() => handleCopyCode(code)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <pre className="text-xs overflow-x-auto">
                    <code>{code}</code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Method: {authDocs.method}</h4>
            <p className="text-sm text-muted-foreground mb-3">{authDocs.description}</p>
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-sm">{authDocs.example}</code>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Security:</strong> Never expose your API key in client-side code. 
              Always make API calls from your backend server.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Rate Limiting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Endpoint Limits</h4>
            {Object.entries(rateLimitInfo.limits).map(([endpoint, limit]) => (
              <div key={endpoint} className="flex items-center justify-between p-2 border rounded">
                <code className="text-xs">{endpoint}</code>
                <span className="text-sm text-muted-foreground">{limit}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Response Headers</h4>
            <div className="p-3 bg-muted rounded-lg space-y-1">
              {rateLimitInfo.headers.map((header, index) => (
                <code key={index} className="text-xs block">{header}</code>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Rate Limit Error Response</h4>
            <div className="p-3 bg-muted rounded-lg">
              <pre className="text-xs">
                {JSON.stringify(rateLimitInfo.errorResponse, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {bestPractices.map((practice, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{practice}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
