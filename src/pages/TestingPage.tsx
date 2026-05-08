import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ArrowRight, CheckCircle2, FileText, Database, GraduationCap, Zap, Bug, Share2, X, FileDown, Play, BarChart3, GitBranch } from 'lucide-react';
import { MLWorkflowVisualizer } from '@/components/MLWorkflowVisualizer';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { ConfusionMatrixDisplay } from '@/components/ConfusionMatrixDisplay';
import { PredictionResultsDisplay, type PredictionResult } from '@/components/PredictionResultsDisplay';
import { projectService, trainingService, testResultService } from '@/services/supabase';
import { modelVersionService } from '@/services/modelVersionService';
import { trainingSimulation } from '@/utils/helpers';
import { exportTestResultsPDF } from '@/utils/pdfExport';
import { toast } from 'sonner';
import type { Project, TrainingSession, ModelVersion } from '@/types/types';

const workflowSteps = [
  { id: 'describe', title: 'Describe',     description: 'Define your ML project goals',   icon: FileText      },
  { id: 'data',     title: 'Input Data',   description: 'Upload or select training data', icon: Database      },
  { id: 'learn',    title: 'Learn',        description: 'Understand ML concepts',         icon: GraduationCap },
  { id: 'train',    title: 'Train Model',  description: 'Train your AI model',            icon: Zap           },
  { id: 'debug',    title: 'Test & Debug', description: 'Evaluate and refine',            icon: Bug           },
  { id: 'deploy',   title: 'Deploy',       description: 'Share your model',               icon: Share2        },
];

export default function TestingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project,         setProject]         = useState<Project | null>(null);
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);

  // ── Version selector ───────────────────────────────────────────────────────
  const [versions,        setVersions]        = useState<ModelVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ModelVersion | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // ── Single prediction ──────────────────────────────────────────────────────
  const [testInput,     setTestInput]     = useState('');
  const [prediction,    setPrediction]    = useState<{ prediction: string; confidence: number } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile,     setImageFile]     = useState<File | null>(null);

  // ── Batch testing ──────────────────────────────────────────────────────────
  const [batchResults,  setBatchResults]  = useState<PredictionResult[]>([]);
  const [csvFile,       setCsvFile]       = useState<File | null>(null);
  const [isProcessing,  setIsProcessing]  = useState(false);

  // ── Confusion matrix ───────────────────────────────────────────────────────
  const [confusionMatrix, setConfusionMatrix] = useState<number[][] | null>(null);
  const [testLabels,      setTestLabels]      = useState<string[]>([]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(false);
  const [activeTab,  setActiveTab]  = useState<'single' | 'batch'>('single');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    const projectData = await projectService.getById(projectId);
    if (projectData) {
      setProject(projectData);

      const session = await trainingService.getByProjectId(projectId);
      if (session) {
        setTrainingSession(session);

        if (
          projectData.model_type === 'image_classification' ||
          projectData.model_type === 'text_classification'
        ) {
          const labels = ['Class A', 'Class B', 'Class C'];
          setTestLabels(labels);
          setConfusionMatrix(
            trainingSimulation.generateConfusionMatrix(labels, session.accuracy || 0.85)
          );
        }
      }

      // Load versions
      setVersionsLoading(true);
      const versionList = await modelVersionService.getVersions(projectId);
      setVersions(versionList);
      if (versionList.length > 0) {
        const active = versionList.find(v => v.is_active) ?? versionList[0];
        setSelectedVersion(active);
      }
      setVersionsLoading(false);
    }
  };

  // ── Derived accuracy from selected version or session ─────────────────────
  const activeAccuracy =
    selectedVersion?.accuracy ?? trainingSession?.accuracy ?? 0.85;

  // ── Image upload ───────────────────────────────────────────────────────────
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Image size must be less than 5MB'); return; }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setTestInput(file.name);
    };
    reader.readAsDataURL(file);
    toast.success('Image uploaded successfully');
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    setTestInput('');
    setPrediction(null);
  };

  // ── Single prediction ──────────────────────────────────────────────────────
  const handleTest = async () => {
    if (project?.model_type === 'image_classification' && !selectedImage && !testInput.trim()) {
      toast.error('Please upload an image or enter an image URL'); return;
    }
    if (project?.model_type !== 'image_classification' && !testInput.trim()) {
      toast.error('Please provide test input'); return;
    }
    if (!trainingSession) { toast.error('No training session found'); return; }

    setLoading(true);
    try {
      const result = trainingSimulation.generatePrediction(
        project?.model_type || 'image_classification',
        activeAccuracy
      );
      setPrediction(result);

      await testResultService.create({
        training_session_id: trainingSession.id,
        test_data: {
          input:       testInput,
          hasImage:    !!selectedImage,
          fileName:    imageFile?.name,
          version_id:  selectedVersion?.id,
          version_number: selectedVersion?.version_number,
        },
        predictions: result,
        accuracy:    activeAccuracy,
      });

      toast.success('Prediction generated');
    } catch (error) {
      toast.error('Failed to generate prediction');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── CSV upload ─────────────────────────────────────────────────────────────
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv'))     { toast.error('Please select a valid CSV file'); return; }
    if (file.size > 10 * 1024 * 1024)   { toast.error('File size must be less than 10MB'); return; }
    setCsvFile(file);
    toast.success('CSV file uploaded successfully');
  };

  // ── Batch test ─────────────────────────────────────────────────────────────
  const handleBatchTest = async () => {
    if (!csvFile)          { toast.error('Please upload a CSV file'); return; }
    if (!trainingSession)  { toast.error('No training session found'); return; }

    setIsProcessing(true);
    try {
      const text  = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        toast.error('CSV file must contain at least a header row and one data row');
        setIsProcessing(false);
        return;
      }

      const dataRows = lines.slice(1);
      const results: PredictionResult[] = [];

      for (let i = 0; i < Math.min(dataRows.length, 100); i++) {
        const row = dataRows[i].split(',').map(c => c.trim());

        const input: string | number[] =
          project?.model_type === 'text_classification'
            ? row[0]
            : row.map(val => parseFloat(val) || 0);

        const pred = trainingSimulation.generatePrediction(
          project?.model_type || 'text_classification',
          activeAccuracy
        );

        const actualLabel = row.length > 1 ? row[row.length - 1] : undefined;

        results.push({
          input,
          actualLabel,
          predictedLabel: pred.prediction,
          confidence:     pred.confidence,
          isCorrect:      actualLabel ? pred.prediction === actualLabel : undefined,
        });
      }

      setBatchResults(results);

      await testResultService.create({
        training_session_id: trainingSession.id,
        test_data: {
          fileName:       csvFile.name,
          rowCount:       results.length,
          isBatch:        true,
          version_id:     selectedVersion?.id,
          version_number: selectedVersion?.version_number,
        },
        predictions: { batchSize: results.length },
        accuracy:    activeAccuracy,
      });

      toast.success(`Processed ${results.length} predictions`);
      setActiveTab('batch');
    } catch (error) {
      toast.error('Failed to process CSV file');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── PDF export ─────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (!project || (batchResults.length === 0 && !prediction)) {
      toast.error('No test results to export'); return;
    }
    try {
      const predictions: PredictionResult[] =
        batchResults.length > 0
          ? batchResults
          : prediction
          ? [{ input: testInput, predictedLabel: prediction.prediction, confidence: prediction.confidence }]
          : [];

      exportTestResultsPDF(
        project.title,
        project.model_type || 'Unknown',
        {
          predictions,
          confusionMatrix: confusionMatrix || undefined,
          labels:          testLabels.length > 0 ? testLabels : undefined,
          accuracy:        activeAccuracy,
        },
        { author: 'Student' }
      );
      toast.success('Test results exported as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleContinueToExport = async () => {
    if (!projectId) return;
    await projectService.update(projectId, { status: 'completed' });
    navigate(`/project/${projectId}/export`);
  };

  if (!project || !trainingSession) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Workflow progress */}
        <Card className="border-none shadow-none bg-muted/30">
          <CardContent className="pt-6 pb-6">
            <MLWorkflowVisualizer steps={workflowSteps} currentStep={4} />
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Step 5: Test & Debug</h1>
          <p className="text-muted-foreground">{project.title}</p>
        </div>

        {/* ── Version selector ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4" />
              Model Version
            </CardTitle>
            <CardDescription>
              Select which trained version to test against
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versionsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Loading versions…
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved versions found. Train the model first.</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Select
                  value={selectedVersion?.id ?? ''}
                  onValueChange={(id) => {
                    const v = versions.find(v => v.id === id) ?? null;
                    setSelectedVersion(v);
                    setPrediction(null);
                    setBatchResults([]);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue placeholder="Select a version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center gap-2">
                          <span>v{v.version_number}</span>
                          {v.version_name && (
                            <span className="text-muted-foreground">— {v.version_name}</span>
                          )}
                          {v.is_active && (
                            <Badge variant="secondary" className="text-xs ml-1">active</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedVersion && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {selectedVersion.accuracy != null && (
                      <Badge variant="outline">
                        Accuracy: {(selectedVersion.accuracy * 100).toFixed(1)}%
                      </Badge>
                    )}
                    {selectedVersion.loss != null && (
                      <Badge variant="outline">
                        Loss: {selectedVersion.loss.toFixed(4)}
                      </Badge>
                    )}
                    {selectedVersion.epochs != null && (
                      <Badge variant="outline">
                        Epochs: {selectedVersion.epochs}
                      </Badge>
                    )}
                    {selectedVersion.created_at && (
                      <Badge variant="outline">
                        {new Date(selectedVersion.created_at).toLocaleDateString()}
                      </Badge>
                    )}
                    {selectedVersion.notes && (
                      <p className="text-muted-foreground w-full">{selectedVersion.notes}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {activeAccuracy ? `${(activeAccuracy * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Final Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {(selectedVersion?.loss ?? trainingSession.loss)?.toFixed(4) ?? 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Epochs Trained</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {selectedVersion?.epochs ?? trainingSession.current_epoch}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Test Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {batchResults.length > 0 ? batchResults.length : prediction ? 1 : 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Testing interface */}
        <Card>
          <CardHeader>
            <CardTitle>Test Your Model</CardTitle>
            <CardDescription>
              Run single predictions or batch test with CSV data
              {selectedVersion && ` — using v${selectedVersion.version_number}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'single' | 'batch')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="single">
                  <Play className="h-4 w-4 mr-2" />
                  Single Prediction
                </TabsTrigger>
                <TabsTrigger value="batch">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Batch Testing
                </TabsTrigger>
              </TabsList>

              {/* Single prediction */}
              <TabsContent value="single" className="space-y-6">
                {project.model_type === 'text_classification' || project.model_type === 'regression' ? (
                  <div className="space-y-4">
                    <Textarea
                      placeholder={
                        project.model_type === 'text_classification'
                          ? 'Enter text to classify…'
                          : 'Enter values (comma-separated)…'
                      }
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <Button onClick={handleTest} disabled={loading} className="w-full" size="lg">
                      <Play className="h-5 w-5 mr-2" />
                      Run Prediction
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      id="image-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {!selectedImage ? (
                      <div
                        className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById('image-upload-input')?.click()}
                      >
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm font-medium mb-2">Click to upload an image</p>
                        <p className="text-xs text-muted-foreground">Supports JPG, PNG, GIF (max 5MB)</p>
                      </div>
                    ) : (
                      <div className="relative border-2 rounded-lg p-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="space-y-3">
                          <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                            <img src={selectedImage} alt="Uploaded preview" className="max-h-64 object-contain" />
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="font-medium truncate">{imageFile?.name}</span>
                            <span className="text-muted-foreground">
                              ({((imageFile?.size || 0) / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or enter image URL</span>
                      </div>
                    </div>

                    <Input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={selectedImage ? '' : testInput}
                      onChange={(e) => {
                        setTestInput(e.target.value);
                        if (selectedImage) handleRemoveImage();
                      }}
                      disabled={!!selectedImage}
                    />

                    <Button onClick={handleTest} disabled={loading} className="w-full" size="lg">
                      <Play className="h-5 w-5 mr-2" />
                      Run Prediction
                    </Button>
                  </div>
                )}

                {prediction && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Prediction: {prediction.prediction}</p>
                        <p className="text-sm">Confidence: {(prediction.confidence * 100).toFixed(1)}%</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Batch testing */}
              <TabsContent value="batch" className="space-y-6">
                <div className="space-y-4">
                  <input
                    id="csv-upload-input"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />

                  {!csvFile ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                      onClick={() => document.getElementById('csv-upload-input')?.click()}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium mb-2">Click to upload CSV file</p>
                      <p className="text-xs text-muted-foreground">
                        CSV format: each row is a test sample (max 10MB, 100 rows)
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">{csvFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(csvFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setCsvFile(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleBatchTest}
                    disabled={!csvFile || isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Run Batch Test
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Batch results */}
        {batchResults.length > 0 && (
          <PredictionResultsDisplay
            results={batchResults}
            showActual={batchResults.some(r => r.actualLabel !== undefined)}
          />
        )}

        {/* Confusion matrix */}
        {confusionMatrix && testLabels.length > 0 && (
          <ConfusionMatrixDisplay
            matrix={confusionMatrix}
            labels={testLabels}
            accuracy={activeAccuracy}
          />
        )}

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Test Results</p>
                  <p className="text-sm text-muted-foreground">Download detailed test report as PDF</p>
                </div>
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  size="lg"
                  disabled={batchResults.length === 0 && !prediction}
                >
                  <FileDown className="h-5 w-5 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to Share</p>
                  <p className="text-sm text-muted-foreground">Export your model and create a shareable demo</p>
                </div>
                <Button onClick={handleContinueToExport} size="lg">
                  Export & Share
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {projectId && (
        <div className="mt-6">
          <CollaborationPanel projectId={projectId} />
        </div>
      )}
    </AppLayout>
  );
}