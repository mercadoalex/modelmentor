/**
 * useComparisonDashboard - Custom hook for Model Comparison Dashboard state management
 * 
 * This hook provides:
 * - Model selection state
 * - Loading and error states per component
 * - Data fetching orchestration
 * - Realtime subscription management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { comparisonService } from '@/services/comparisonService';
import { statisticalService } from '@/services/statisticalService';
import type {
  ModelForComparison,
  TrainingCurveData,
  ConfusionMatrixData,
  PaginatedPredictions,
  EfficiencyMetrics,
  HyperparameterData,
  LineageData,
  StatisticalTestResult,
  ComparisonServiceError,
  DashboardLoadingStates,
  DashboardErrorStates,
} from '@/types/comparison';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UseComparisonDashboardOptions {
  userId?: string;
  autoFetchModels?: boolean;
  enableRealtime?: boolean;
}

interface UseComparisonDashboardReturn {
  // Model selection
  availableModels: ModelForComparison[];
  selectedModelIds: string[];
  isComparing: boolean;
  
  // Loading states
  loadingStates: DashboardLoadingStates;
  
  // Error states
  errorStates: DashboardErrorStates;
  
  // Data
  trainingCurves: TrainingCurveData[];
  confusionMatrices: ConfusionMatrixData[];
  predictions: PaginatedPredictions;
  efficiency: EfficiencyMetrics[];
  hyperparameters: HyperparameterData[];
  statisticalTests: StatisticalTestResult[];
  lineage: LineageData[];
  
  // Realtime
  hasNewModelData: boolean;
  
  // Actions
  selectModels: (modelIds: string[]) => void;
  startComparison: () => Promise<void>;
  stopComparison: () => void;
  refreshModels: () => Promise<void>;
  retryComponent: (component: keyof DashboardLoadingStates) => Promise<void>;
  changePredictionPage: (page: number) => Promise<void>;
  dismissNewDataNotification: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial States
// ─────────────────────────────────────────────────────────────────────────────

const initialLoadingStates: DashboardLoadingStates = {
  models: false,
  trainingCurves: false,
  confusionMatrices: false,
  predictions: false,
  efficiency: false,
  hyperparameters: false,
  statisticalTests: false,
  lineage: false,
};

const initialErrorStates: DashboardErrorStates = {
  models: null,
  trainingCurves: null,
  confusionMatrices: null,
  predictions: null,
  efficiency: null,
  hyperparameters: null,
  statisticalTests: null,
  lineage: null,
};

const initialPredictions: PaginatedPredictions = {
  predictions: [],
  total: 0,
  page: 1,
  pageSize: 50,
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook Implementation
// ─────────────────────────────────────────────────────────────────────────────

export function useComparisonDashboard(
  options: UseComparisonDashboardOptions = {}
): UseComparisonDashboardReturn {
  const { userId = '', autoFetchModels = true, enableRealtime = true } = options;

  // Model selection state
  const [availableModels, setAvailableModels] = useState<ModelForComparison[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Loading states
  const [loadingStates, setLoadingStates] = useState<DashboardLoadingStates>(initialLoadingStates);

  // Error states
  const [errorStates, setErrorStates] = useState<DashboardErrorStates>(initialErrorStates);

  // Data states
  const [trainingCurves, setTrainingCurves] = useState<TrainingCurveData[]>([]);
  const [confusionMatrices, setConfusionMatrices] = useState<ConfusionMatrixData[]>([]);
  const [predictions, setPredictions] = useState<PaginatedPredictions>(initialPredictions);
  const [efficiency, setEfficiency] = useState<EfficiencyMetrics[]>([]);
  const [hyperparameters, setHyperparameters] = useState<HyperparameterData[]>([]);
  const [statisticalTests, setStatisticalTests] = useState<StatisticalTestResult[]>([]);
  const [lineage, setLineage] = useState<LineageData[]>([]);

  // Realtime state
  const [hasNewModelData, setHasNewModelData] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Helper Functions
  // ─────────────────────────────────────────────────────────────────────────

  const setLoading = useCallback((component: keyof DashboardLoadingStates, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [component]: loading }));
  }, []);

  const setError = useCallback((component: keyof DashboardErrorStates, error: ComparisonServiceError | null) => {
    setErrorStates(prev => ({ ...prev, [component]: error }));
  }, []);

  const clearError = useCallback((component: keyof DashboardErrorStates) => {
    setErrorStates(prev => ({ ...prev, [component]: null }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Functions
  // ─────────────────────────────────────────────────────────────────────────

  const fetchModels = useCallback(async () => {
    setLoading('models', true);
    clearError('models');

    const result = await comparisonService.fetchModels(userId);

    if (result.error) {
      setError('models', result.error);
    } else {
      setAvailableModels(result.data || []);
    }

    setLoading('models', false);
  }, [userId, setLoading, setError, clearError]);

  const fetchTrainingCurves = useCallback(async (modelIds: string[]) => {
    setLoading('trainingCurves', true);
    clearError('trainingCurves');

    const result = await comparisonService.fetchTrainingCurves(modelIds);

    if (result.error) {
      setError('trainingCurves', result.error);
    } else {
      setTrainingCurves(result.data || []);
    }

    setLoading('trainingCurves', false);
  }, [setLoading, setError, clearError]);

  const fetchConfusionMatrices = useCallback(async (modelIds: string[]) => {
    setLoading('confusionMatrices', true);
    clearError('confusionMatrices');

    const result = await comparisonService.fetchConfusionMatrices(modelIds);

    if (result.error) {
      setError('confusionMatrices', result.error);
    } else {
      setConfusionMatrices(result.data || []);
    }

    setLoading('confusionMatrices', false);
  }, [setLoading, setError, clearError]);

  const fetchPredictions = useCallback(async (modelIds: string[], page = 1) => {
    setLoading('predictions', true);
    clearError('predictions');

    const result = await comparisonService.fetchPredictions(modelIds, page);

    if (result.error) {
      setError('predictions', result.error);
    } else {
      setPredictions(result.data || initialPredictions);
    }

    setLoading('predictions', false);
    return result.data;
  }, [setLoading, setError, clearError]);

  const fetchEfficiency = useCallback(async (modelIds: string[]) => {
    setLoading('efficiency', true);
    clearError('efficiency');

    const result = await comparisonService.fetchEfficiencyMetrics(modelIds);

    if (result.error) {
      setError('efficiency', result.error);
    } else {
      setEfficiency(result.data || []);
    }

    setLoading('efficiency', false);
  }, [setLoading, setError, clearError]);

  const fetchHyperparameters = useCallback(async (modelIds: string[]) => {
    setLoading('hyperparameters', true);
    clearError('hyperparameters');

    const result = await comparisonService.fetchHyperparameters(modelIds);

    if (result.error) {
      setError('hyperparameters', result.error);
    } else {
      setHyperparameters(result.data || []);
    }

    setLoading('hyperparameters', false);
  }, [setLoading, setError, clearError]);

  const fetchLineage = useCallback(async (modelIds: string[]) => {
    setLoading('lineage', true);
    clearError('lineage');

    const result = await comparisonService.fetchLineage(modelIds);

    if (result.error) {
      setError('lineage', result.error);
    } else {
      setLineage(result.data || []);
    }

    setLoading('lineage', false);
  }, [setLoading, setError, clearError]);

  const computeStatisticalTests = useCallback(async (modelIds: string[], predictionsData: PaginatedPredictions | null) => {
    setLoading('statisticalTests', true);
    clearError('statisticalTests');

    try {
      if (!predictionsData || predictionsData.predictions.length === 0) {
        setStatisticalTests([]);
        setLoading('statisticalTests', false);
        return;
      }

      // Build model names map
      const modelNames = new Map<string, string>();
      for (const model of availableModels) {
        modelNames.set(model.id, model.versionName || `v${model.versionNumber}`);
      }

      const results = await statisticalService.computeAllPairwiseTests(
        modelIds,
        modelNames,
        predictionsData.predictions
      );

      setStatisticalTests(results);
    } catch (err) {
      setError('statisticalTests', {
        code: 'UNKNOWN',
        message: err instanceof Error ? err.message : 'Failed to compute statistical tests',
      });
    }

    setLoading('statisticalTests', false);
  }, [availableModels, setLoading, setError, clearError]);

  // ─────────────────────────────────────────────────────────────────────────
  // Public Actions
  // ─────────────────────────────────────────────────────────────────────────

  const selectModels = useCallback((modelIds: string[]) => {
    // Enforce maximum 10 models
    const limitedIds = modelIds.slice(0, 10);
    setSelectedModelIds(limitedIds);
    
    // Reset comparison when selection changes
    if (isComparing) {
      setIsComparing(false);
    }
  }, [isComparing]);

  const startComparison = useCallback(async () => {
    if (selectedModelIds.length < 2) {
      return;
    }

    setIsComparing(true);

    // Fetch all data in parallel
    const [predictionsResult] = await Promise.all([
      fetchPredictions(selectedModelIds),
      fetchTrainingCurves(selectedModelIds),
      fetchConfusionMatrices(selectedModelIds),
      fetchEfficiency(selectedModelIds),
      fetchHyperparameters(selectedModelIds),
      fetchLineage(selectedModelIds),
    ]);

    // Compute statistical tests after predictions are loaded
    await computeStatisticalTests(selectedModelIds, predictionsResult || null);
  }, [
    selectedModelIds,
    fetchTrainingCurves,
    fetchConfusionMatrices,
    fetchPredictions,
    fetchEfficiency,
    fetchHyperparameters,
    fetchLineage,
    computeStatisticalTests,
  ]);

  const stopComparison = useCallback(() => {
    setIsComparing(false);
  }, []);

  const refreshModels = useCallback(async () => {
    // Clear cache and refetch
    comparisonService.clearCache();
    await fetchModels();
    
    // Maintain selection for models that still exist
    setSelectedModelIds(prev => {
      const existingIds = new Set(availableModels.map(m => m.id));
      return prev.filter(id => existingIds.has(id));
    });
    
    setHasNewModelData(false);
  }, [fetchModels, availableModels]);

  const retryComponent = useCallback(async (component: keyof DashboardLoadingStates) => {
    clearError(component);

    switch (component) {
      case 'models':
        await fetchModels();
        break;
      case 'trainingCurves':
        await fetchTrainingCurves(selectedModelIds);
        break;
      case 'confusionMatrices':
        await fetchConfusionMatrices(selectedModelIds);
        break;
      case 'predictions':
        await fetchPredictions(selectedModelIds);
        break;
      case 'efficiency':
        await fetchEfficiency(selectedModelIds);
        break;
      case 'hyperparameters':
        await fetchHyperparameters(selectedModelIds);
        break;
      case 'lineage':
        await fetchLineage(selectedModelIds);
        break;
      case 'statisticalTests':
        await computeStatisticalTests(selectedModelIds, predictions);
        break;
    }
  }, [
    selectedModelIds,
    predictions,
    clearError,
    fetchModels,
    fetchTrainingCurves,
    fetchConfusionMatrices,
    fetchPredictions,
    fetchEfficiency,
    fetchHyperparameters,
    fetchLineage,
    computeStatisticalTests,
  ]);

  const changePredictionPage = useCallback(async (page: number) => {
    await fetchPredictions(selectedModelIds, page);
  }, [selectedModelIds, fetchPredictions]);

  const dismissNewDataNotification = useCallback(() => {
    setHasNewModelData(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // Auto-fetch models on mount
  useEffect(() => {
    if (autoFetchModels) {
      fetchModels();
    }
  }, [autoFetchModels, fetchModels]);

  // Setup realtime subscription
  useEffect(() => {
    if (!enableRealtime || !userId) {
      return;
    }

    unsubscribeRef.current = comparisonService.subscribeToModelChanges(userId, (change) => {
      setHasNewModelData(true);
      
      // Invalidate cache for changed model
      comparisonService.invalidateCache(change.modelId);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enableRealtime, userId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // Model selection
    availableModels,
    selectedModelIds,
    isComparing,
    
    // Loading states
    loadingStates,
    
    // Error states
    errorStates,
    
    // Data
    trainingCurves,
    confusionMatrices,
    predictions,
    efficiency,
    hyperparameters,
    statisticalTests,
    lineage,
    
    // Realtime
    hasNewModelData,
    
    // Actions
    selectModels,
    startComparison,
    stopComparison,
    refreshModels,
    retryComponent,
    changePredictionPage,
    dismissNewDataNotification,
  };
}
