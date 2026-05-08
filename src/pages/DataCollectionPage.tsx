import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Database, ArrowRight, X, AlertCircle, FileText, GraduationCap, Zap, Bug, Share2, Eye } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { MLWorkflowVisualizer } from '@/components/MLWorkflowVisualizer';
import { DataPreviewTable } from '@/components/data/DataPreviewTable';
import { DataValidationDisplay } from '@/components/data/DataValidationDisplay';
import { ColumnStatistics } from '@/components/data/ColumnStatistics';
import { DataCleaningPanel } from '@/components/data/DataCleaningPanel';
import { DataProfilingPanel } from '@/components/data/DataProfilingPanel';
import { FeatureImportancePanel } from '@/components/data/FeatureImportancePanel';
import { FeatureEngineeringPanel } from '@/components/data/FeatureEngineeringPanel';
import { FeatureEngineeringWorkshop } from '@/components/data/FeatureEngineeringWorkshop';
import { AdvancedFeatureInteractionAnalysis } from '@/components/data/AdvancedFeatureInteractionAnalysis';
// Rich template panel — replaces the old plain "Sample Datasets" card
import { DatasetTemplatesPanel, type DatasetTemplate } from '@/components/data/DatasetTemplatesPanel';
import { projectService, datasetService, sampleDatasetService, storageService } from '@/services/supabase';
import { dataValidationService } from '@/services/dataValidationService';
import type { DataValidationResult } from '@/services/dataValidationService';
import type { CleaningOperation } from '@/services/dataCleaningService';
import { contentModeration, imageCompression } from '@/utils/moderation';
import { toast } from 'sonner';
import type { Project, SampleDataset } from '@/types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Workflow step definitions (used by MLWorkflowVisualizer at the top of page)
// ─────────────────────────────────────────────────────────────────────────────
const workflowSteps = [
  { id: 'describe', title: 'Describe',     description: 'Define your ML project goals',   icon: FileText     },
  { id: 'data',     title: 'Input Data',   description: 'Upload or select training data', icon: Database     },
  { id: 'learn',    title: 'Learn',        description: 'Understand ML concepts',         icon: GraduationCap },
  { id: 'train',    title: 'Train Model',  description: 'Train your AI model',            icon: Zap          },
  { id: 'debug',    title: 'Test & Debug', description: 'Evaluate and refine',            icon: Bug          },
  { id: 'deploy',   title: 'Deploy',       description: 'Share your model',               icon: Share2       },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function DataCollectionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [project, setProject] = useState<Project | null>(null);
  // Supabase-backed sample datasets (kept for save logic — template panel handles display)
  const [sampleDatasets, setSampleDatasets] = useState<SampleDataset[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Parsed CSV rows (first row = headers)
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [validation, setValidation] = useState<DataValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  // Feature selection state passed down to FeatureEngineeringPanel
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');

  // ── Load project on mount ──────────────────────────────────────────────────
  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    const projectData = await projectService.getById(projectId);
    if (projectData) {
      setProject(projectData);

      // Still fetch DB samples so guided-tour auto-select still works
      const samples = await sampleDatasetService.list(projectData.model_type);
      setSampleDatasets(samples);

      // Auto-select first sample in guided tour mode
      if (projectData.is_guided_tour && samples.length > 0) {
        setSelectedSample(samples[0].id);
      }
    }
  };

  // ── File drop handler ──────────────────────────────────────────────────────
  const onDrop = async (acceptedFiles: File[]) => {
    if (!project) return;

    const validFiles: File[] = [];

    for (const file of acceptedFiles) {
      if (project.model_type === 'image_classification') {
        // Moderate image content before accepting
        const check = await contentModeration.checkImage(file);
        if (!check.isClean) {
          toast.error(`${file.name}: ${check.reason}`);
          continue;
        }

        // Compress images larger than 1 MB to improve upload speed
        if (file.size > 1024 * 1024) {
          try {
            const compressed = await imageCompression.compressImage(file);
            toast.success(`${file.name} compressed to ${(compressed.size / 1024).toFixed(0)}KB`);
            validFiles.push(compressed);
          } catch {
            toast.error(`Failed to compress ${file.name}`);
          }
        } else {
          validFiles.push(file);
        }
      } else {
        // For CSV files: parse and validate immediately so preview appears
        if (file.name.endsWith('.csv')) {
          try {
            const text = await file.text();
            const parsedData = dataValidationService.parseCSV(text);
            const validationResult = dataValidationService.validateData(parsedData);

            setCsvData(parsedData);
            setValidation(validationResult);
            setShowPreview(true);

            if (validationResult.qualityScore >= 60) {
              toast.success(`${file.name} uploaded successfully! Quality score: ${validationResult.qualityScore}`);
            } else {
              toast.warning(`${file.name} uploaded with quality issues. Score: ${validationResult.qualityScore}`);
            }
          } catch {
            toast.error(`Failed to parse ${file.name}`);
            continue;
          }
        }
        validFiles.push(file);
      }
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: project?.model_type === 'image_classification'
      ? { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }
      : project?.model_type === 'text_classification'
      ? { 'text/*': ['.txt', '.csv'] }
      : { 'text/csv': ['.csv'] },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Template loader ────────────────────────────────────────────────────────
  /**
   * Called by DatasetTemplatesPanel when the user clicks "Use This Dataset".
   * Parses the generated CSV and injects it into the same state as a manual
   * upload — so all downstream tabs (preview, cleaning, features…) work
   * without any changes.
   */
  const handleLoadTemplate = (csvText: string, filename: string, template: DatasetTemplate) => {
    try {
      const parsedData = dataValidationService.parseCSV(csvText);
      const validationResult = dataValidationService.validateData(parsedData);

      setCsvData(parsedData);
      setValidation(validationResult);
      setShowPreview(true);

      // Wrap in a File so the existing handleContinue upload logic works unchanged
      const blob = new Blob([csvText], { type: 'text/csv' });
      const file = new File([blob], filename, { type: 'text/csv' });
      setUploadedFiles([file]);

      toast.success(`"${template.name}" loaded — scroll down to preview your data!`);
    } catch {
      toast.error('Failed to load template data');
    }
  };

  // ── Data cleaning callback ─────────────────────────────────────────────────
  /**
   * Called by DataCleaningPanel after operations are applied.
   * Re-validates the cleaned data and shows a quality improvement toast.
   */
  const handleDataCleaned = (cleanedData: string[][], operations: CleaningOperation[]) => {
    setCsvData(cleanedData);

    const newValidation = dataValidationService.validateData(cleanedData);
    setValidation(newValidation);

    // Log operations for debugging purposes
    console.debug('Cleaning operations applied:', operations);

    if (validation && newValidation.qualityScore > validation.qualityScore) {
      toast.success(
        `Data quality improved from ${validation.qualityScore} to ${newValidation.qualityScore}!`,
      );
    }
  };

  // ── Feature selection callback ─────────────────────────────────────────────
  const handleFeaturesSelected = (features: string[], target: string) => {
    setSelectedFeatures(features);
    setTargetColumn(target);
    toast.success(`Selected ${features.length} features with target: ${target}`);
  };

  // ── Feature engineering callback ───────────────────────────────────────────
  /**
   * Called when FeatureEngineeringPanel creates new derived columns.
   * Re-validates so the preview reflects the new schema.
   */
  const handleFeaturesEngineered = (transformedData: string[][], newColumns: string[]) => {
    setCsvData(transformedData);
    const newValidation = dataValidationService.validateData(transformedData);
    setValidation(newValidation);
    toast.success(`Created ${newColumns.length} new features. Dataset updated!`);
  };

  // ── Continue to next step ──────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!project || !projectId) return;

    if (!selectedSample && uploadedFiles.length === 0) {
      toast.error('Please upload files or select a sample dataset');
      return;
    }

    setLoading(true);

    try {
      let fileUrls: string[] = [];

      // Upload files to storage if any were provided
      if (uploadedFiles.length > 0) {
        const userId = user?.id || 'anonymous';

        for (let i = 0; i < uploadedFiles.length; i++) {
          const url = await storageService.uploadImage(uploadedFiles[i], userId);
          fileUrls.push(url);
          setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
        }
      }

      // Save dataset record to Supabase
      await datasetService.create({
        project_id: projectId,
        sample_dataset_id: selectedSample,
        file_urls: fileUrls,
        labels: [],
        sample_count: selectedSample
          ? sampleDatasets.find(s => s.id === selectedSample)?.sample_count || 0
          : uploadedFiles.length,
      });

      await projectService.update(projectId, { status: 'learning' });
      navigate(`/project/${projectId}/learning`);
    } catch (error) {
      toast.error('Failed to save dataset');
      console.error(error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // ── Loading / project-not-found state ─────────────────────────────────────
  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  // Minimum samples required varies by model type
  const minSamples = project.model_type === 'image_classification' ? 10
    : project.model_type === 'text_classification' ? 20
    : 50;

  const hasEnoughData = selectedSample || uploadedFiles.length >= minSamples;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Workflow progress bar ── */}
        <Card className="border-none shadow-none bg-muted/30">
          <CardContent className="pt-6 pb-6">
            <MLWorkflowVisualizer steps={workflowSteps} currentStep={1} />
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto space-y-8">

          {/* ── Page heading ── */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Step 2: Input Data</h1>
            <p className="text-muted-foreground">{project.title}</p>
          </div>

          {/* ── Guided tour banner ── */}
          {project.is_guided_tour && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Guided Tour Mode: We've pre-selected a sample dataset for you. You can also upload your own data.
              </AlertDescription>
            </Alert>
          )}

          {/* ── Upload + Template panel (side-by-side on md+) ── */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Left: manual file upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Your Data
                </CardTitle>
                <CardDescription>
                  {project.model_type === 'image_classification' && `Upload at least ${minSamples} images (JPG, PNG, GIF, WEBP)`}
                  {project.model_type === 'text_classification' && `Upload at least ${minSamples} text samples (TXT, CSV)`}
                  {project.model_type === 'regression' && `Upload at least ${minSamples} data points (CSV)`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Drop zone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
                  </p>
                </div>

                {/* Uploaded file list */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                          <span className="truncate flex-1">{file.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload progress bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Dataset Templates panel (replaces old "Sample Datasets" card) */}
            <DatasetTemplatesPanel
              modelType={project.model_type}
              onLoadDataset={handleLoadTemplate}
            />
          </div>

          {/* ── Data Preview & Validation tabs (shown after upload or template load) ── */}
          {showPreview && csvData && validation && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Eye className="h-6 w-6" />
                  Data Preview & Validation
                </h2>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Hide Preview
                </Button>
              </div>

              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full max-w-5xl grid-cols-9">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                  <TabsTrigger value="profiling">Profiling</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="engineering">Engineering</TabsTrigger>
                  <TabsTrigger value="workshop">Workshop</TabsTrigger>
                  <TabsTrigger value="interactions">Interactions</TabsTrigger>
                  <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
                </TabsList>

                {/* Raw data table — first 10 rows */}
                <TabsContent value="preview" className="space-y-4">
                  <DataPreviewTable
                    headers={csvData[0]}
                    rows={csvData.slice(1)}
                    columnInfo={validation.columnInfo}
                    maxRows={10}
                  />
                </TabsContent>

                {/* Quality score + issue list */}
                <TabsContent value="validation" className="space-y-4">
                  <DataValidationDisplay validation={validation} />
                </TabsContent>

                {/* Per-column stats (min/max/mean/nulls…) */}
                <TabsContent value="statistics" className="space-y-4">
                  <ColumnStatistics columnInfo={validation.columnInfo} />
                </TabsContent>

                {/* Distributions, correlations, outliers */}
                <TabsContent value="profiling" className="space-y-4">
                  <DataProfilingPanel data={csvData} columnInfo={validation.columnInfo} />
                </TabsContent>

                {/* Feature importance + target selection */}
                <TabsContent value="features" className="space-y-4">
                  <FeatureImportancePanel
                    data={csvData}
                    columnInfo={validation.columnInfo}
                    onFeaturesSelected={handleFeaturesSelected}
                  />
                </TabsContent>

                {/* Automated transformations (log, scale, encode…) */}
                <TabsContent value="engineering" className="space-y-4">
                  <FeatureEngineeringPanel
                    data={csvData}
                    columnInfo={validation.columnInfo}
                    targetColumn={targetColumn}
                    onFeaturesEngineered={handleFeaturesEngineered}
                  />
                </TabsContent>

                {/* Interactive feature engineering playground */}
                <TabsContent value="workshop" className="space-y-4">
                  <FeatureEngineeringWorkshop />
                </TabsContent>

                {/* Advanced interaction analysis */}
                <TabsContent value="interactions" className="space-y-4">
                  <AdvancedFeatureInteractionAnalysis />
                </TabsContent>

                {/* Imputation, deduplication, outlier removal */}
                <TabsContent value="cleaning" className="space-y-4">
                  <DataCleaningPanel
                    data={csvData}
                    columnInfo={validation.columnInfo}
                    onDataCleaned={handleDataCleaned}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* ── Dataset status + Continue button ── */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dataset Status</p>
                  <p className="text-sm text-muted-foreground">
                    {hasEnoughData
                      ? validation && !validation.isValid
                        ? 'Please fix critical data issues before proceeding'
                        : 'Ready to proceed to learning module'
                      : `Need at least ${minSamples} samples to continue`}
                  </p>
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={!hasEnoughData || loading || (validation !== null && !validation.isValid)}
                  size="lg"
                >
                  Continue to Learning
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Collaboration panel (fixed at bottom) ── */}
      {projectId && (
        <div className="mt-6">
          <CollaborationPanel projectId={projectId} />
        </div>
      )}
    </AppLayout>
  );
}