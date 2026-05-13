import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { datasetStorageService } from '@/services/datasetStorageService';
import { AppLayout } from '@/components/layouts/AppLayout';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Database, ArrowRight, X, AlertCircle, FileText, GraduationCap, Zap, Bug, Share2, Eye, RefreshCw, Info, HardDrive } from 'lucide-react';
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
import { DatasetTemplatesPanel, type DatasetTemplate } from '@/components/data/DatasetTemplatesPanel';
import { DatasetUploadGuidance } from '@/components/data/DatasetUploadGuidance';
import { projectService, datasetService, sampleDatasetService, storageService } from '@/services/supabase';
import { dataValidationService } from '@/services/dataValidationService';
import type { DataValidationResult } from '@/services/dataValidationService';
import type { CleaningOperation } from '@/services/dataCleaningService';
import { contentModeration, imageCompression } from '@/utils/moderation';
import { toast } from 'sonner';
import type { Project, SampleDataset } from '@/types/types';
import { 
  generateForModelType, 
  type ImageDatasetRow, 
  type GeneratedDataset,
  type ImageGeneratedDataset 
} from '@/services/syntheticDatasetGeneratorService';

// ─────────────────────────────────────────────────────────────────────────────
// Workflow step definitions — drives the MLWorkflowVisualizer progress bar
// ─────────────────────────────────────────────────────────────────────────────
const workflowSteps = [
  { id: 'describe', title: 'Describe',     description: 'Define your ML project goals',   icon: FileText      },
  { id: 'data',     title: 'Input Data',   description: 'Upload or select training data', icon: Database      },
  { id: 'learn',    title: 'Learn',        description: 'Understand ML concepts',         icon: GraduationCap },
  { id: 'train',    title: 'Train Model',  description: 'Train your AI model',            icon: Zap           },
  { id: 'debug',    title: 'Test & Debug', description: 'Evaluate and refine',            icon: Bug           },
  { id: 'deploy',   title: 'Deploy',       description: 'Share your model',               icon: Share2        },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
export default function DataCollectionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, isAuthenticated } = useAuth();
  const { tier, limits } = useSubscription();
  const navigate      = useNavigate();

  // ── Storage quota state ────────────────────────────────────────────────────
  const [storageUsedMb, setStorageUsedMb] = useState<number>(0);
  const [storageRemainingMb, setStorageRemainingMb] = useState<number | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // ── Core state ─────────────────────────────────────────────────────────────
  const [project,          setProject]          = useState<Project | null>(null);
  const [sampleDatasets,   setSampleDatasets]   = useState<SampleDataset[]>([]);
  const [uploadedFiles,    setUploadedFiles]    = useState<File[]>([]);
  const [uploadProgress,   setUploadProgress]   = useState(0);
  const [selectedSample,   setSelectedSample]   = useState<string | null>(null);
  const [loading,          setLoading]          = useState(false);

  // ── Guided tour fallback state ─────────────────────────────────────────────
  const [sampleLoadError,  setSampleLoadError]  = useState<string | null>(null);
  const [sampleLoadEmpty,  setSampleLoadEmpty]  = useState(false);
  const [retryCount,       setRetryCount]       = useState(0);
  const [usingSyntheticFallback, setUsingSyntheticFallback] = useState(false);
  const [autoAdvanceFailed, setAutoAdvanceFailed] = useState(false);

  // ── Image dataset state (for image classification) ─────────────────────────
  const [imageDataset, setImageDataset] = useState<ImageDatasetRow[] | null>(null);

  // ── CSV / validation state ─────────────────────────────────────────────────
  const [csvData,          setCsvData]          = useState<string[][] | null>(null);
  const [validation,       setValidation]       = useState<DataValidationResult | null>(null);
  const [showPreview,      setShowPreview]      = useState(false);

  // ── Feature engineering state ──────────────────────────────────────────────
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn,     setTargetColumn]     = useState<string>('');

  // ── "Start with My Data" flow state ────────────────────────────────────────
  // When true, shows DatasetTemplatesPanel; when false, shows DatasetUploadGuidance
  // For guided tour: always show templates (auto-selects dataset)
  // For "Start with My Data": show guidance first, user can switch to templates
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(true);

  // ── Load project on mount ──────────────────────────────────────────────────
  useEffect(() => {
    loadProject();
  }, [projectId]);

  // ── Set initial panel state based on project mode ──────────────────────────
  // For "Start with My Data" (non-guided-tour), show guidance panel by default
  useEffect(() => {
    if (project && !project.is_guided_tour) {
      setShowTemplatesPanel(false);
    }
  }, [project?.is_guided_tour]);

  // ── Retry loading samples (for guided tour error recovery) ─────────────────
  const retryLoadSamples = () => {
    setSampleLoadError(null);
    setSampleLoadEmpty(false);
    setRetryCount(prev => prev + 1);
    loadProject();
  };

  // ── Fetch storage quota when authenticated ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchStorageQuota = async () => {
      try {
        const usedMb = await datasetStorageService.getStorageUsed(user.id);
        setStorageUsedMb(usedMb);

        const maxStorageMb = limits.max_storage_mb;
        if (maxStorageMb !== null) {
          setStorageRemainingMb(Math.max(0, maxStorageMb - usedMb));
        } else {
          setStorageRemainingMb(null); // unlimited
        }
      } catch (error) {
        console.error('Failed to fetch storage quota:', error);
      }
    };

    fetchStorageQuota();
  }, [isAuthenticated, user, limits.max_storage_mb]);

  /**
   * Auto-select a synthetic template based on the project's model type.
   * This is called when Supabase sample datasets are unavailable in guided tour mode.
   */
  const autoSelectSyntheticTemplate = useCallback((modelType: Project['model_type']) => {
    try {
      setUsingSyntheticFallback(true);
      
      const dataset = generateForModelType(modelType);
      
      if (modelType === 'image_classification') {
        // Handle image classification dataset
        const imageDataset = dataset as ImageGeneratedDataset;
        setImageDataset(imageDataset.images);
        
        // Create placeholder files for the image dataset
        const placeholderFiles = imageDataset.images.map((img, idx) => {
          // Convert data URI to blob
          const byteString = atob(img.imageDataUri.split(',')[1]);
          const mimeString = img.imageDataUri.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          return new File([blob], img.filename, { type: mimeString });
        });
        
        setUploadedFiles(placeholderFiles);
        toast.success(`✅ Loaded synthetic shapes dataset — ${imageDataset.images.length} images ready!`);
      } else {
        // Handle tabular datasets (text_classification, classification, regression)
        const tabularDataset = dataset as GeneratedDataset;
        
        // Convert to CSV format
        const csvRows = [tabularDataset.headers, ...tabularDataset.rows];
        const csvText = csvRows.map(row => row.map(v => `"${v}"`).join(',')).join('\n');
        
        // Parse and validate
        const parsedData = dataValidationService.parseCSV(csvText);
        const validationResult = dataValidationService.validateData(parsedData);
        
        setCsvData(parsedData);
        setValidation(validationResult);
        setShowPreview(true);
        
        // Create a File object for the upload flow
        const blob = new Blob([csvText], { type: 'text/csv' });
        const file = new File([blob], `synthetic-${modelType}-sample.csv`, { type: 'text/csv' });
        setUploadedFiles([file]);
        
        toast.success(`✅ Loaded synthetic dataset — ${tabularDataset.rows.length} rows ready!`);
      }
    } catch (error) {
      console.error('Failed to auto-select synthetic template:', error);
      toast.error('Failed to load synthetic dataset. Please select a template manually.');
    }
  }, []);

  const loadProject = async () => {
    if (!projectId) return;

    const projectData = await projectService.getById(projectId);
    if (projectData) {
      setProject(projectData);

      // Fetch sample datasets with error handling for guided tour mode
      try {
        const samples = await sampleDatasetService.list(projectData.model_type);
        setSampleDatasets(samples);
        setSampleLoadError(null);

        // Check if samples are empty in guided tour mode
        // For image_classification, always use synthetic fallback since we have bundled images
        // that work offline and provide a consistent learning experience
        if (projectData.is_guided_tour) {
          if (samples.length === 0 || projectData.model_type === 'image_classification') {
            setSampleLoadEmpty(true);
            // Auto-select synthetic template for guided tour fallback
            autoSelectSyntheticTemplate(projectData.model_type);
          } else {
            setSampleLoadEmpty(false);
            setUsingSyntheticFallback(false);
            // Guided tour: pre-select first available sample dataset
            setSelectedSample(samples[0].id);
          }
        } else {
          setSampleLoadEmpty(false);
          setUsingSyntheticFallback(false);
        }
      } catch (error) {
        console.error('Failed to load sample datasets:', error);
        // In guided tour mode, show error with retry option and auto-select synthetic
        if (projectData.is_guided_tour) {
          setSampleLoadError('Failed to load sample datasets. Using built-in synthetic data instead.');
          setSampleLoadEmpty(true);
          // Auto-select synthetic template as fallback
          autoSelectSyntheticTemplate(projectData.model_type);
        }
      }
    }
  };

  // ── Guided tour: auto-advance to Learning after sample is selected ─────────
  // Wrapping handleContinue in useCallback so it can safely be used in deps
  const handleContinue = useCallback(async () => {
    if (!project || !projectId) return;

    if (!selectedSample && uploadedFiles.length === 0) {
      toast.error('Please upload files or select a sample dataset');
      return;
    }

    setLoading(true);

    try {
      let fileUrls: string[] = [];

      // For synthetic fallback data in guided tour mode, skip actual file upload
      // The synthetic data is just for learning purposes and doesn't need to be stored
      if (usingSyntheticFallback && project.is_guided_tour) {
        // Use placeholder URLs for synthetic data
        fileUrls = uploadedFiles.map((file) => `synthetic://${project.model_type}/${file.name}`);

        // Skip Supabase dataset creation for synthetic data — just advance the project
        try {
          await projectService.update(projectId, { status: 'learning' });
        } catch {
          // If project update fails (e.g., Supabase unreachable), still navigate
          // The learning page will work with local data
        }
        navigate(`/project/${projectId}/learning`);
        return;
      }

      if (uploadedFiles.length > 0) {
        // Upload any manually-dropped files to Supabase storage
        const userId = user?.id || 'anonymous';

        for (let i = 0; i < uploadedFiles.length; i++) {
          if (isAuthenticated && user) {
            // Authenticated: use datasetStorageService for persistent cloud storage
            const { url } = await datasetStorageService.uploadDataset(uploadedFiles[i], user.id, projectId);
            fileUrls.push(url);
          } else {
            // Offline mode: use existing local storage service
            const url = await storageService.uploadImage(uploadedFiles[i], userId);
            fileUrls.push(url);
          }
          setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
        }
      }

      // Persist dataset record linking project → sample or uploaded files
      await datasetService.create({
        project_id:        projectId,
        sample_dataset_id: selectedSample,
        file_urls:         fileUrls,
        labels:            [],
        sample_count:      selectedSample
          ? sampleDatasets.find(s => s.id === selectedSample)?.sample_count || 0
          : uploadedFiles.length,
      });

      // Advance project status and navigate to the Learning step
      await projectService.update(projectId, { status: 'learning' });
      navigate(`/project/${projectId}/learning`);
    } catch (error) {
      // In guided tour mode, show more specific error with guidance
      if (project.is_guided_tour) {
        setAutoAdvanceFailed(true); // Prevent auto-advance from re-triggering
        toast.error('Failed to save dataset. Please try again or select a different template.', {
          action: {
            label: 'Retry',
            onClick: () => {
              setAutoAdvanceFailed(false);
              handleContinue();
            },
          },
        });
      } else {
        toast.error('Failed to save dataset');
      }
      console.error(error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }, [project, projectId, selectedSample, uploadedFiles, sampleDatasets, user, navigate, usingSyntheticFallback]);

  // Auto-advance guided tour 2 seconds after sample is auto-selected or synthetic data is loaded
  useEffect(() => {
    if (!project?.is_guided_tour || loading || autoAdvanceFailed) return;
    
    // Auto-advance if we have a selected sample OR synthetic fallback data
    const hasData = selectedSample || (usingSyntheticFallback && uploadedFiles.length > 0);
    if (!hasData) return;

    const timer = setTimeout(() => {
      handleContinue();
    }, 2000);

    return () => clearTimeout(timer);
  }, [project?.is_guided_tour, selectedSample, usingSyntheticFallback, uploadedFiles.length, loading, handleContinue, autoAdvanceFailed]);

  // ── File drop handler ──────────────────────────────────────────────────────
  const onDrop = async (acceptedFiles: File[]) => {
    if (!project) return;

    // Clear any previous storage error
    setStorageError(null);

    const validFiles: File[] = [];

    for (const file of acceptedFiles) {
      // ── Authenticated mode: validate via datasetStorageService ──────────────
      if (isAuthenticated && user) {
        // Validate file format and size against tier limits
        const uploadValidation = datasetStorageService.validateUpload(file, tier);
        if (!uploadValidation.valid) {
          toast.error(`${file.name}: ${uploadValidation.error}`);
          continue;
        }

        // Check storage quota
        const quotaCheck = await datasetStorageService.checkStorageQuota(user.id, tier, file.size);
        if (!quotaCheck.allowed) {
          const errorMsg = `Upload would exceed your storage quota. Remaining space: ${quotaCheck.remaining.toFixed(1)} MB.`;
          setStorageError(errorMsg);
          toast.error(`${file.name}: ${errorMsg}`);
          continue;
        }
      }

      if (project.model_type === 'image_classification') {
        // Moderate image content before accepting
        const check = await contentModeration.checkImage(file);
        if (!check.isClean) {
          toast.error(`${file.name}: ${check.reason}`);
          continue;
        }

        // Compress images > 1 MB to improve upload speed
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
        // CSV files: parse and validate immediately so preview appears
        if (file.name.endsWith('.csv')) {
          try {
            const text            = await file.text();
            const parsedData      = dataValidationService.parseCSV(text);
            const validationResult = dataValidationService.validateData(parsedData);

            setCsvData(parsedData);
            setValidation(validationResult);
            setShowPreview(true);

            validationResult.qualityScore >= 60
              ? toast.success(`${file.name} uploaded! Quality score: ${validationResult.qualityScore}`)
              : toast.warning(`${file.name} has quality issues. Score: ${validationResult.qualityScore}`);
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
   * upload so all downstream tabs (preview, cleaning, features…) work
   * without any changes.
   */
  const handleLoadTemplate = (csvText: string, filename: string, template: DatasetTemplate) => {
    try {
      const parsedData       = dataValidationService.parseCSV(csvText);
      const validationResult = dataValidationService.validateData(parsedData);

      setCsvData(parsedData);
      setValidation(validationResult);
      setShowPreview(true);

      // Wrap in a File so handleContinue upload logic works unchanged
      const blob = new Blob([csvText], { type: 'text/csv' });
      const file = new File([blob], filename, { type: 'text/csv' });
      setUploadedFiles([file]);

      toast.success(`"${template.name}" loaded — scroll down to preview your data!`);
    } catch {
      toast.error('Failed to load template data');
    }
  };

  /**
   * Called by DatasetTemplatesPanel when an image classification template is loaded.
   * Converts image data URIs to File objects for the upload flow.
   */
  const handleLoadImageDataset = (images: ImageDatasetRow[], template: DatasetTemplate) => {
    try {
      setImageDataset(images);
      
      // Convert data URIs to File objects
      const imageFiles = images.map((img) => {
        const byteString = atob(img.imageDataUri.split(',')[1]);
        const mimeString = img.imageDataUri.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        return new File([blob], img.filename, { type: mimeString });
      });
      
      setUploadedFiles(imageFiles);
      toast.success(`"${template.name}" loaded — ${images.length} images ready!`);
    } catch (error) {
      console.error('Failed to load image dataset:', error);
      toast.error('Failed to load image dataset');
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

  // ── Loading / project-not-found guard ─────────────────────────────────────
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

          {/* ── Guided tour banner — shown only in tour mode ── */}
          {project.is_guided_tour && (
            <>
              {/* Error state with retry */}
              {sampleLoadError && !usingSyntheticFallback && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      🎓 <strong>Guided Tour Mode:</strong> {sampleLoadError}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={retryLoadSamples}
                      className="ml-4"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Synthetic fallback state - using built-in data */}
              {usingSyntheticFallback && uploadedFiles.length > 0 && (
                <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                    🎓 <strong>Guided Tour Mode:</strong> Using built-in synthetic data for your learning experience.
                    {project.model_type === 'image_classification' 
                      ? ` Loaded ${uploadedFiles.length} shape images.`
                      : ` Loaded ${csvData ? csvData.length - 1 : 0} sample rows.`
                    }
                    {' '}Advancing to the next step automatically in a moment…
                  </AlertDescription>
                </Alert>
              )}

              {/* Fallback state when no sample datasets available and no synthetic loaded yet */}
              {sampleLoadEmpty && !sampleLoadError && !usingSyntheticFallback && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    🎓 <strong>Guided Tour Mode:</strong> No pre-made dataset is available for this project type.
                    Don't worry — select a template dataset below to continue your learning journey!
                  </AlertDescription>
                </Alert>
              )}

              {/* Normal guided tour state with auto-advance */}
              {!sampleLoadEmpty && !sampleLoadError && !usingSyntheticFallback && selectedSample && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    🎓 <strong>Guided Tour Mode:</strong> A sample dataset has been pre-selected for you.
                    Advancing to the next step automatically in a moment…
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* ── Upload + Template/Guidance panel (side-by-side on md+) ── */}
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
                  {project.model_type === 'regression'           && `Upload at least ${minSamples} data points (CSV)`}
                  {project.model_type === 'classification'       && `Upload at least ${minSamples} data points (CSV)`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Storage quota info (authenticated users only) */}
                {isAuthenticated && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                    <HardDrive className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1">
                      <span>
                        Storage: {storageUsedMb.toFixed(1)} MB used
                        {limits.max_storage_mb !== null
                          ? ` / ${limits.max_storage_mb} MB (${storageRemainingMb !== null ? storageRemainingMb.toFixed(1) : '—'} MB remaining)`
                          : ' (unlimited)'}
                      </span>
                      {limits.max_storage_mb !== null && (
                        <Progress
                          value={Math.min(100, (storageUsedMb / limits.max_storage_mb) * 100)}
                          className="mt-1 h-1.5"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Storage quota error */}
                {storageError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{storageError}</AlertDescription>
                  </Alert>
                )}

                {/* Drop zone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                  }`}
                  data-tour="upload-area"
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
                    <p className="text-sm text-muted-foreground">Uploading…</p>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Dataset Templates panel OR Upload Guidance panel */}
            {showTemplatesPanel ? (
              <DatasetTemplatesPanel
                modelType={project.model_type}
                projectDescription={project.description}
                onLoadDataset={handleLoadTemplate}
                onLoadImageDataset={handleLoadImageDataset}
              />
            ) : (
              <DatasetUploadGuidance
                modelType={project.model_type}
                onUsePremadeTemplate={() => setShowTemplatesPanel(true)}
              />
            )}
          </div>

          {/* ── Data Preview & Validation tabs (shown after upload or template load) ── */}
          {showPreview && csvData && validation && (
            <div className="space-y-6" data-tour="data-preview">
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
                <TabsContent value="preview">
                  <DataPreviewTable
                    headers={csvData[0]}
                    rows={csvData.slice(1)}
                    columnInfo={validation.columnInfo}
                    maxRows={10}
                  />
                </TabsContent>

                {/* Quality score + issue list */}
                <TabsContent value="validation">
                  <DataValidationDisplay validation={validation} />
                </TabsContent>

                {/* Per-column stats: min/max/mean/nulls */}
                <TabsContent value="statistics">
                  <ColumnStatistics columnInfo={validation.columnInfo} />
                </TabsContent>

                {/* Distributions, correlations, outliers */}
                <TabsContent value="profiling">
                  <DataProfilingPanel data={csvData} columnInfo={validation.columnInfo} />
                </TabsContent>

                {/* Feature importance + target selection */}
                <TabsContent value="features" data-tour="column-mapping">
                  <FeatureImportancePanel
                    data={csvData}
                    columnInfo={validation.columnInfo}
                    onFeaturesSelected={handleFeaturesSelected}
                  />
                </TabsContent>

                {/* Automated transformations: log, scale, encode */}
                <TabsContent value="engineering">
                  <FeatureEngineeringPanel
                    data={csvData}
                    columnInfo={validation.columnInfo}
                    targetColumn={targetColumn}
                    onFeaturesEngineered={handleFeaturesEngineered}
                  />
                </TabsContent>

                {/* Interactive feature engineering playground */}
                <TabsContent value="workshop">
                  <FeatureEngineeringWorkshop />
                </TabsContent>

                {/* Advanced interaction analysis */}
                <TabsContent value="interactions">
                  <AdvancedFeatureInteractionAnalysis />
                </TabsContent>

                {/* Imputation, deduplication, outlier removal */}
                <TabsContent value="cleaning">
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
                        : 'Ready to proceed to the learning module'
                      : `Need at least ${minSamples} samples to continue`}
                  </p>
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={!hasEnoughData || loading || (validation !== null && !validation.isValid)}
                  size="lg"
                  data-tour="continue-button"
                >
                  {loading ? 'Saving…' : 'Continue to Learning'}
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