/**
 * ComparisonService - Centralized service for Model Comparison Dashboard data fetching
 * 
 * This service provides:
 * - Fetching model data from Supabase
 * - In-memory caching with 5-minute TTL
 * - Structured error handling
 * - Realtime subscription support
 */

import { supabase } from '@/db/supabase';
import type {
  ModelForComparison,
  TrainingCurveData,
  ConfusionMatrixData,
  PredictionData,
  PaginatedPredictions,
  EfficiencyMetrics,
  HyperparameterData,
  LineageData,
  ComparisonServiceResult,
  ComparisonServiceError,
  ComparisonErrorCode,
  ModelChangeEvent,
  CacheEntry,
  CACHE_TTL_MS,
} from '@/types/comparison';

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Cache Implementation
// ─────────────────────────────────────────────────────────────────────────────

class ComparisonCache {
  private models: Map<string, CacheEntry<ModelForComparison[]>> = new Map();
  private trainingCurves: Map<string, CacheEntry<TrainingCurveData>> = new Map();
  private confusionMatrices: Map<string, CacheEntry<ConfusionMatrixData>> = new Map();
  private predictions: Map<string, CacheEntry<PredictionData[]>> = new Map();
  private efficiency: Map<string, CacheEntry<EfficiencyMetrics>> = new Map();
  private hyperparameters: Map<string, CacheEntry<HyperparameterData>> = new Map();
  private lineage: Map<string, CacheEntry<LineageData>> = new Map();

  private isExpired<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  private createEntry<T>(data: T): CacheEntry<T> {
    const now = Date.now();
    return {
      data,
      timestamp: now,
      expiresAt: now + CACHE_TTL,
    };
  }

  // Models cache
  getModels(userId: string): ModelForComparison[] | null {
    const entry = this.models.get(userId);
    if (this.isExpired(entry)) {
      this.models.delete(userId);
      return null;
    }
    return entry?.data ?? null;
  }

  setModels(userId: string, data: ModelForComparison[]): void {
    this.models.set(userId, this.createEntry(data));
  }

  // Training curves cache
  getTrainingCurves(modelId: string): TrainingCurveData | null {
    const entry = this.trainingCurves.get(modelId);
    if (this.isExpired(entry)) {
      this.trainingCurves.delete(modelId);
      return null;
    }
    return entry?.data ?? null;
  }

  setTrainingCurves(modelId: string, data: TrainingCurveData): void {
    this.trainingCurves.set(modelId, this.createEntry(data));
  }

  // Confusion matrices cache
  getConfusionMatrix(modelId: string): ConfusionMatrixData | null {
    const entry = this.confusionMatrices.get(modelId);
    if (this.isExpired(entry)) {
      this.confusionMatrices.delete(modelId);
      return null;
    }
    return entry?.data ?? null;
  }

  setConfusionMatrix(modelId: string, data: ConfusionMatrixData): void {
    this.confusionMatrices.set(modelId, this.createEntry(data));
  }

  // Predictions cache
  getPredictions(modelId: string): PredictionData[] | null {
    const entry = this.predictions.get(modelId);
    if (this.isExpired(entry)) {
      this.predictions.delete(modelId);
      return null;
    }
    return entry?.data ?? null;
  }

  setPredictions(modelId: string, data: PredictionData[]): void {
    this.predictions.set(modelId, this.createEntry(data));
  }

  // Efficiency cache
  getEfficiency(modelId: string): EfficiencyMetrics | null {
    const entry = this.efficiency.get(modelId);
    if (this.isExpired(entry)) {
      this.efficiency.delete(modelId);
      return null;
    }
    return entry?.data ?? null;
  }

  setEfficiency(modelId: string, data: EfficiencyMetrics): void {
    this.efficiency.set(modelId, this.createEntry(data));
  }

  // Hyperparameters cache
  getHyperparameters(modelId: string): HyperparameterData | null {
    const entry = this.hyperparameters.get(modelId);
    if (this.isExpired(entry)) {
      this.hyperparameters.delete(modelId);
      return null;
    }
    return entry?.data ?? null;
  }

  setHyperparameters(modelId: string, data: HyperparameterData): void {
    this.hyperparameters.set(modelId, this.createEntry(data));
  }

  // Lineage cache
  getLineage(modelId: string): LineageData | null {
    const entry = this.lineage.get(modelId);
    if (this.isExpired(entry)) {
      this.lineage.delete(modelId);
      return null;
    }
    return entry?.data ?? null;
  }

  setLineage(modelId: string, data: LineageData): void {
    this.lineage.set(modelId, this.createEntry(data));
  }

  // Cache management
  invalidate(modelId: string): void {
    this.trainingCurves.delete(modelId);
    this.confusionMatrices.delete(modelId);
    this.predictions.delete(modelId);
    this.efficiency.delete(modelId);
    this.hyperparameters.delete(modelId);
    this.lineage.delete(modelId);
  }

  clear(): void {
    this.models.clear();
    this.trainingCurves.clear();
    this.confusionMatrices.clear();
    this.predictions.clear();
    this.efficiency.clear();
    this.hyperparameters.clear();
    this.lineage.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────────────────────────────────────

function createError(
  code: ComparisonErrorCode,
  message: string,
  details?: Record<string, unknown>
): ComparisonServiceError {
  return { code, message, details };
}

function handleSupabaseError(error: unknown): ComparisonServiceError {
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string };
    
    if (supabaseError.code === 'PGRST116') {
      return createError('NOT_FOUND', 'Resource not found');
    }
    if (supabaseError.code === '42501' || supabaseError.code === 'PGRST301') {
      return createError('UNAUTHORIZED', 'Access denied');
    }
    if (supabaseError.code?.startsWith('22') || supabaseError.code?.startsWith('23')) {
      return createError('VALIDATION_ERROR', supabaseError.message);
    }
    
    return createError('UNKNOWN', supabaseError.message || 'An unexpected error occurred');
  }
  
  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createError('NETWORK_ERROR', 'Unable to connect to the server');
    }
    return createError('UNKNOWN', error.message);
  }
  
  return createError('UNKNOWN', 'An unexpected error occurred');
}

// ─────────────────────────────────────────────────────────────────────────────
// ComparisonService Class
// ─────────────────────────────────────────────────────────────────────────────

class ComparisonServiceImpl {
  private cache = new ComparisonCache();

  /**
   * Fetch all available models for the current user
   */
  async fetchModels(userId: string): Promise<ComparisonServiceResult<ModelForComparison[]>> {
    try {
      // Check cache first
      const cached = this.cache.getModels(userId);
      if (cached) {
        return { data: cached, error: null };
      }

      const { data, error } = await supabase
        .from('model_versions')
        .select(`
          id,
          project_id,
          version_number,
          version_name,
          accuracy,
          loss,
          created_at,
          created_by,
          projects!inner (
            id,
            title,
            user_id,
            session_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: handleSupabaseError(error) };
      }

      const models: ModelForComparison[] = (data || []).map((row: any) => ({
        id: row.id,
        projectId: row.project_id,
        projectTitle: row.projects?.title || 'Unknown Project',
        versionNumber: row.version_number,
        versionName: row.version_name,
        accuracy: row.accuracy,
        loss: row.loss,
        createdAt: row.created_at,
        createdBy: row.created_by,
      }));

      this.cache.setModels(userId, models);
      return { data: models, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err) };
    }
  }

  /**
   * Fetch training curves for specified model IDs
   */
  async fetchTrainingCurves(modelIds: string[]): Promise<ComparisonServiceResult<TrainingCurveData[]>> {
    try {
      const results: TrainingCurveData[] = [];
      const uncachedIds: string[] = [];

      // Check cache for each model
      for (const modelId of modelIds) {
        const cached = this.cache.getTrainingCurves(modelId);
        if (cached) {
          results.push(cached);
        } else {
          uncachedIds.push(modelId);
        }
      }

      if (uncachedIds.length === 0) {
        return { data: results, error: null };
      }

      // Fetch model versions to get training session IDs and names
      const { data: modelData, error: modelError } = await supabase
        .from('model_versions')
        .select('id, version_name, version_number, training_session_id')
        .in('id', uncachedIds);

      if (modelError) {
        return { data: null, error: handleSupabaseError(modelError) };
      }

      const sessionToModel = new Map<string, { id: string; name: string }>();
      for (const model of modelData || []) {
        if (model.training_session_id) {
          sessionToModel.set(model.training_session_id, {
            id: model.id,
            name: model.version_name || `v${model.version_number}`,
          });
        }
      }

      const sessionIds = Array.from(sessionToModel.keys());
      if (sessionIds.length === 0) {
        // No training sessions, return empty data for uncached models
        for (const modelId of uncachedIds) {
          const model = modelData?.find(m => m.id === modelId);
          const emptyData: TrainingCurveData = {
            modelId,
            modelName: model?.version_name || `v${model?.version_number || 0}`,
            epochs: [],
            trainLoss: [],
            valLoss: [],
            trainAcc: [],
            valAcc: [],
          };
          results.push(emptyData);
          this.cache.setTrainingCurves(modelId, emptyData);
        }
        return { data: results, error: null };
      }

      // Fetch training curves
      const { data: curveData, error: curveError } = await supabase
        .from('training_curves')
        .select('*')
        .in('training_session_id', sessionIds)
        .order('epoch', { ascending: true });

      if (curveError) {
        return { data: null, error: handleSupabaseError(curveError) };
      }

      // Group curves by model
      const curvesBySession = new Map<string, typeof curveData>();
      for (const curve of curveData || []) {
        const existing = curvesBySession.get(curve.training_session_id) || [];
        existing.push(curve);
        curvesBySession.set(curve.training_session_id, existing);
      }

      // Build TrainingCurveData for each model
      for (const [sessionId, modelInfo] of sessionToModel) {
        const curves = curvesBySession.get(sessionId) || [];
        const curveData: TrainingCurveData = {
          modelId: modelInfo.id,
          modelName: modelInfo.name,
          epochs: curves.map(c => c.epoch),
          trainLoss: curves.map(c => c.train_loss ?? 0),
          valLoss: curves.map(c => c.val_loss ?? 0),
          trainAcc: curves.map(c => c.train_accuracy ?? 0),
          valAcc: curves.map(c => c.val_accuracy ?? 0),
        };
        results.push(curveData);
        this.cache.setTrainingCurves(modelInfo.id, curveData);
      }

      return { data: results, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err) };
    }
  }

  /**
   * Fetch confusion matrices for specified model IDs
   */
  async fetchConfusionMatrices(modelIds: string[]): Promise<ComparisonServiceResult<ConfusionMatrixData[]>> {
    try {
      const results: ConfusionMatrixData[] = [];
      const uncachedIds: string[] = [];

      // Check cache
      for (const modelId of modelIds) {
        const cached = this.cache.getConfusionMatrix(modelId);
        if (cached) {
          results.push(cached);
        } else {
          uncachedIds.push(modelId);
        }
      }

      if (uncachedIds.length === 0) {
        return { data: results, error: null };
      }

      // Fetch model versions to get training session IDs
      const { data: modelData, error: modelError } = await supabase
        .from('model_versions')
        .select('id, version_name, version_number, training_session_id, class_labels')
        .in('id', uncachedIds);

      if (modelError) {
        return { data: null, error: handleSupabaseError(modelError) };
      }

      const sessionToModel = new Map<string, { id: string; name: string; labels: string[] }>();
      for (const model of modelData || []) {
        if (model.training_session_id) {
          sessionToModel.set(model.training_session_id, {
            id: model.id,
            name: model.version_name || `v${model.version_number}`,
            labels: model.class_labels || [],
          });
        }
      }

      const sessionIds = Array.from(sessionToModel.keys());
      if (sessionIds.length === 0) {
        return { data: results, error: null };
      }

      // Fetch test results with confusion matrices
      const { data: testData, error: testError } = await supabase
        .from('test_results')
        .select('training_session_id, confusion_matrix')
        .in('training_session_id', sessionIds);

      if (testError) {
        return { data: null, error: handleSupabaseError(testError) };
      }

      // Build ConfusionMatrixData for each model
      for (const test of testData || []) {
        const modelInfo = sessionToModel.get(test.training_session_id);
        if (!modelInfo) continue;

        const confusionMatrix = test.confusion_matrix as { labels?: string[]; matrix?: number[][] } | null;
        const matrixData: ConfusionMatrixData = {
          modelId: modelInfo.id,
          modelName: modelInfo.name,
          labels: confusionMatrix?.labels || modelInfo.labels,
          matrix: confusionMatrix?.matrix || [],
        };
        results.push(matrixData);
        this.cache.setConfusionMatrix(modelInfo.id, matrixData);
      }

      return { data: results, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err) };
    }
  }

  /**
   * Fetch sample-level predictions for specified model IDs
   */
  async fetchPredictions(
    modelIds: string[],
    page = 1,
    pageSize = 50
  ): Promise<ComparisonServiceResult<PaginatedPredictions>> {
    try {
      // Fetch model versions to get training session IDs
      const { data: modelData, error: modelError } = await supabase
        .from('model_versions')
        .select('id, version_name, version_number, training_session_id')
        .in('id', modelIds);

      if (modelError) {
        return { data: null, error: handleSupabaseError(modelError) };
      }

      const sessionToModel = new Map<string, { id: string; name: string }>();
      for (const model of modelData || []) {
        if (model.training_session_id) {
          sessionToModel.set(model.training_session_id, {
            id: model.id,
            name: model.version_name || `v${model.version_number}`,
          });
        }
      }

      const sessionIds = Array.from(sessionToModel.keys());
      if (sessionIds.length === 0) {
        return {
          data: { predictions: [], total: 0, page, pageSize },
          error: null,
        };
      }

      // Fetch test results with predictions
      const { data: testData, error: testError } = await supabase
        .from('test_results')
        .select('training_session_id, predictions')
        .in('training_session_id', sessionIds);

      if (testError) {
        return { data: null, error: handleSupabaseError(testError) };
      }

      // Aggregate predictions across models
      const predictionMap = new Map<string, PredictionData>();

      for (const test of testData || []) {
        const modelInfo = sessionToModel.get(test.training_session_id);
        if (!modelInfo) continue;

        const predictions = test.predictions as { samples?: Array<{ id: string; true_label: string; predicted_label: string; confidence?: number }> } | null;
        const samples = predictions?.samples || [];

        for (const sample of samples) {
          const existing = predictionMap.get(sample.id) || {
            sampleId: sample.id,
            trueLabel: sample.true_label,
            predictions: {},
            confidence: {},
          };
          existing.predictions[modelInfo.id] = sample.predicted_label;
          if (sample.confidence !== undefined) {
            existing.confidence = existing.confidence || {};
            existing.confidence[modelInfo.id] = sample.confidence;
          }
          predictionMap.set(sample.id, existing);
        }
      }

      const allPredictions = Array.from(predictionMap.values());
      const total = allPredictions.length;
      const start = (page - 1) * pageSize;
      const paginatedPredictions = allPredictions.slice(start, start + pageSize);

      return {
        data: {
          predictions: paginatedPredictions,
          total,
          page,
          pageSize,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err) };
    }
  }

  /**
   * Fetch efficiency metrics for specified model IDs
   */
  async fetchEfficiencyMetrics(modelIds: string[]): Promise<ComparisonServiceResult<EfficiencyMetrics[]>> {
    try {
      const results: EfficiencyMetrics[] = [];
      const uncachedIds: string[] = [];

      // Check cache
      for (const modelId of modelIds) {
        const cached = this.cache.getEfficiency(modelId);
        if (cached) {
          results.push(cached);
        } else {
          uncachedIds.push(modelId);
        }
      }

      if (uncachedIds.length === 0) {
        return { data: results, error: null };
      }

      const { data, error } = await supabase
        .from('model_versions')
        .select('id, version_name, version_number, training_time_seconds, inference_time_ms, model_size_bytes, flops')
        .in('id', uncachedIds);

      if (error) {
        return { data: null, error: handleSupabaseError(error) };
      }

      for (const model of data || []) {
        const metrics: EfficiencyMetrics = {
          modelId: model.id,
          modelName: model.version_name || `v${model.version_number}`,
          trainingTimeSeconds: model.training_time_seconds,
          inferenceTimeMs: model.inference_time_ms,
          modelSizeBytes: model.model_size_bytes,
          flops: model.flops,
        };
        results.push(metrics);
        this.cache.setEfficiency(model.id, metrics);
      }

      return { data: results, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err) };
    }
  }

  /**
   * Fetch hyperparameters for specified model IDs
   */
  async fetchHyperparameters(modelIds: string[]): Promise<ComparisonServiceResult<HyperparameterData[]>> {
    try {
      const results: HyperparameterData[] = [];
      const uncachedIds: string[] = [];

      // Check cache
      for (const modelId of modelIds) {
        const cached = this.cache.getHyperparameters(modelId);
        if (cached) {
          results.push(cached);
        } else {
          uncachedIds.push(modelId);
        }
      }

      if (uncachedIds.length === 0) {
        return { data: results, error: null };
      }

      const { data, error } = await supabase
        .from('model_versions')
        .select('id, version_name, version_number, learning_rate, batch_size, epochs, optimizer, changes_from_previous')
        .in('id', uncachedIds);

      if (error) {
        return { data: null, error: handleSupabaseError(error) };
      }

      for (const model of data || []) {
        const customParams = (model.changes_from_previous as Record<string, unknown>)?.hyperparameters || {};
        const hyperparams: HyperparameterData = {
          modelId: model.id,
          modelName: model.version_name || `v${model.version_number}`,
          learningRate: model.learning_rate,
          batchSize: model.batch_size,
          epochs: model.epochs,
          optimizer: model.optimizer,
          customParams: customParams as Record<string, unknown>,
        };
        results.push(hyperparams);
        this.cache.setHyperparameters(model.id, hyperparams);
      }

      return { data: results, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err) };
    }
  }

  /**
   * Fetch lineage data for specified model IDs
   */
  async fetchLineage(modelIds: string[]): Promise<ComparisonServiceResult<LineageData[]>> {
    try {
      const results: LineageData[] = [];
      const uncachedIds: string[] = [];

      // Check cache
      for (const modelId of modelIds) {
        const cached = this.cache.getLineage(modelId);
        if (cached) {
          results.push(cached);
        } else {
          uncachedIds.push(modelId);
        }
      }

      if (uncachedIds.length === 0) {
        return { data: results, error: null };
      }

      // Fetch model versions with lineage
      const { data: modelData, error: modelError } = await supabase
        .from('model_versions')
        .select(`
          id,
          version_name,
          version_number,
          experiment_id,
          created_at,
          created_by,
          model_lineage (
            parent_model_version_id,
            notes
          )
        `)
        .in('id', uncachedIds);

      if (modelError) {
        return { data: null, error: handleSupabaseError(modelError) };
      }

      // Get parent model names
      const parentIds = (modelData || [])
        .map((m: any) => m.model_lineage?.[0]?.parent_model_version_id)
        .filter(Boolean);

      let parentNames = new Map<string, string>();
      if (parentIds.length > 0) {
        const { data: parentData } = await supabase
          .from('model_versions')
          .select('id, version_name, version_number')
          .in('id', parentIds);

        for (const parent of parentData || []) {
          parentNames.set(parent.id, parent.version_name || `v${parent.version_number}`);
        }
      }

      for (const model of modelData || []) {
        const lineageRecord = (model as any).model_lineage?.[0];
        const lineage: LineageData = {
          modelId: model.id,
          modelName: model.version_name || `v${model.version_number}`,
          parentModelId: lineageRecord?.parent_model_version_id || null,
          parentModelName: lineageRecord?.parent_model_version_id
            ? parentNames.get(lineageRecord.parent_model_version_id) || null
            : null,
          experimentId: model.experiment_id,
          createdAt: model.created_at,
          createdBy: model.created_by,
          notes: lineageRecord?.notes || null,
        };
        results.push(lineage);
        this.cache.setLineage(model.id, lineage);
      }

      return { data: results, error: null };
    } catch (err) {
      return { data: null, error: handleSupabaseError(err) };
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache for a specific model
   */
  invalidateCache(modelId: string): void {
    this.cache.invalidate(modelId);
  }

  /**
   * Subscribe to model version changes for realtime updates
   */
  subscribeToModelChanges(
    userId: string,
    callback: (change: ModelChangeEvent) => void
  ): () => void {
    const channel = supabase
      .channel('model_versions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'model_versions',
        },
        (payload) => {
          const eventType = payload.eventType.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE';
          const record = (payload.new || payload.old) as { id?: string; project_id?: string } | null;
          
          if (record && record.id) {
            callback({
              type: eventType,
              modelId: record.id,
              projectId: record.project_id || '',
            });
            
            // Invalidate cache for this model
            this.cache.invalidate(record.id);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }
}

// Export singleton instance
export const comparisonService = new ComparisonServiceImpl();
