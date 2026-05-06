import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { projectService, datasetService, sampleDatasetService, storageService } from '@/services/supabase';
import { dataValidationService } from '@/services/dataValidationService';
import type { DataValidationResult } from '@/services/dataValidationService';
import type { CleaningOperation } from '@/services/dataCleaningService';
import { contentModeration, imageCompression } from '@/utils/moderation';
import { toast } from 'sonner';
import type { Project, SampleDataset } from '@/types/types';

const workflowSteps = [
  { id: 'describe', title: 'Describe', description: 'Define your ML project goals', icon: FileText },
  { id: 'data', title: 'Input Data', description: 'Upload or select training data', icon: Database },
  { id: 'learn', title: 'Learn', description: 'Understand ML concepts', icon: GraduationCap },
  { id: 'train', title: 'Train Model', description: 'Train your AI model', icon: Zap },
  { id: 'debug', title: 'Test & Debug', description: 'Evaluate and refine', icon: Bug },
  { id: 'deploy', title: 'Deploy', description: 'Share your model', icon: Share2 }
];

export default function DataCollectionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [sampleDatasets, setSampleDatasets] = useState<SampleDataset[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [validation, setValidation] = useState<DataValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cleaningHistory, setCleaningHistory] = useState<CleaningOperation[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    
    const projectData = await projectService.getById(projectId);
    if (projectData) {
      setProject(projectData);
      
      const samples = await sampleDatasetService.list(projectData.model_type);
      setSampleDatasets(samples);
      
      if (projectData.is_guided_tour && samples.length > 0) {
        setSelectedSample(samples[0].id);
      }
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!project) return;
    
    const validFiles: File[] = [];
    
    for (const file of acceptedFiles) {
      if (project.model_type === 'image_classification') {
        const check = await contentModeration.checkImage(file);
        if (!check.isClean) {
          toast.error(`${file.name}: ${check.reason}`);
          continue;
        }
        
        if (file.size > 1024 * 1024) {
          try {
            const compressed = await imageCompression.compressImage(file);
            toast.success(`${file.name} compressed to ${(compressed.size / 1024).toFixed(0)}KB`);
            validFiles.push(compressed);
          } catch (error) {
            toast.error(`Failed to compress ${file.name}`);
          }
        } else {
          validFiles.push(file);
        }
      } else {
        // For CSV files, validate the data
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
          } catch (error) {
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
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDataCleaned = (cleanedData: string[][], operations: CleaningOperation[]) => {
    // Update the CSV data
    setCsvData(cleanedData);
    
    // Re-validate the cleaned data
    const newValidation = dataValidationService.validateData(cleanedData);
    setValidation(newValidation);
    
    // Track cleaning history
    setCleaningHistory(prev => [...prev, ...operations]);
    
    // Show success message with improved quality score
    if (validation && newValidation.qualityScore > validation.qualityScore) {
      toast.success(
        `Data quality improved from ${validation.qualityScore} to ${newValidation.qualityScore}!`
      );
    }
  };

  const handleFeaturesSelected = (features: string[], target: string) => {
    setSelectedFeatures(features);
    setTargetColumn(target);
    toast.success(`Selected ${features.length} features with target: ${target}`);
  };

  const handleFeaturesEngineered = (transformedData: string[][], newColumns: string[]) => {
    // Update the CSV data
    setCsvData(transformedData);
    
    // Re-validate the transformed data
    const newValidation = dataValidationService.validateData(transformedData);
    setValidation(newValidation);
    
    toast.success(`Created ${newColumns.length} new features. Dataset updated!`);
  };

  const handleContinue = async () => {
    if (!project || !projectId) return;
    
    if (!selectedSample && uploadedFiles.length === 0) {
      toast.error('Please upload files or select a sample dataset');
      return;
    }
    
    setLoading(true);
    
    try {
      let fileUrls: string[] = [];
      
      if (uploadedFiles.length > 0) {
        const userId = user?.id || 'anonymous';
        
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const url = await storageService.uploadImage(file, userId);
          fileUrls.push(url);
          setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
        }
      }
      
      await datasetService.create({
        project_id: projectId,
        sample_dataset_id: selectedSample,
        file_urls: fileUrls,
        labels: [],
        sample_count: selectedSample ? 
          sampleDatasets.find(s => s.id === selectedSample)?.sample_count || 0 : 
          uploadedFiles.length
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

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const minSamples = project.model_type === 'image_classification' ? 10 : 
                     project.model_type === 'text_classification' ? 20 : 50;
  const hasEnoughData = selectedSample || uploadedFiles.length >= minSamples;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Workflow Progress */}
        <Card className="border-none shadow-none bg-muted/30">
          <CardContent className="pt-6 pb-6">
            <MLWorkflowVisualizer steps={workflowSteps} currentStep={1} />
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Step 2: Input Data</h1>
            <p className="text-muted-foreground">{project.title}</p>
          </div>

          {project.is_guided_tour && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Guided Tour Mode: We've pre-selected a sample dataset for you. You can also upload your own data.
              </AlertDescription>
            </Alert>
          )}

        <div className="grid md:grid-cols-2 gap-6">
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
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                        <span className="truncate flex-1">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sample Datasets
              </CardTitle>
              <CardDescription>
                Use pre-loaded datasets to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sampleDatasets.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => setSelectedSample(sample.id === selectedSample ? null : sample.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedSample === sample.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{sample.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{sample.description}</p>
                        <Badge variant="secondary" className="mt-2">
                          {sample.sample_count} samples
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Preview and Validation */}
        {showPreview && csvData && validation && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Eye className="h-6 w-6" />
                Data Preview & Validation
              </h2>
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
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

              <TabsContent value="preview" className="space-y-4">
                <DataPreviewTable
                  headers={csvData[0]}
                  rows={csvData.slice(1)}
                  columnInfo={validation.columnInfo}
                  maxRows={10}
                />
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <DataValidationDisplay validation={validation} />
              </TabsContent>

              <TabsContent value="statistics" className="space-y-4">
                <ColumnStatistics columnInfo={validation.columnInfo} />
              </TabsContent>

              <TabsContent value="profiling" className="space-y-4">
                <DataProfilingPanel
                  data={csvData}
                  columnInfo={validation.columnInfo}
                />
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <FeatureImportancePanel
                  data={csvData}
                  columnInfo={validation.columnInfo}
                  onFeaturesSelected={handleFeaturesSelected}
                />
              </TabsContent>

              <TabsContent value="engineering" className="space-y-4">
                <FeatureEngineeringPanel
                  data={csvData}
                  columnInfo={validation.columnInfo}
                  targetColumn={targetColumn}
                  onFeaturesEngineered={handleFeaturesEngineered}
                />
              </TabsContent>

              <TabsContent value="workshop" className="space-y-4">
                <FeatureEngineeringWorkshop />
              </TabsContent>

              <TabsContent value="interactions" className="space-y-4">
                <AdvancedFeatureInteractionAnalysis />
              </TabsContent>

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
    </AppLayout>
  );
}
