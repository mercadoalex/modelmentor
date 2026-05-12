import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type {
  TransformationType,
  AppliedTransformation,
  WorkshopProgress,
  TransformationPipeline,
  FeatureType,
} from '@/types/workshop';
import {
  savePipeline,
  loadPipeline,
  exportPipeline,
  importPipeline,
} from '@/services/workshopEngineService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface WorkshopState {
  /** Currently selected feature for transformation */
  selectedFeature: string | null;
  /** Currently selected transformation type */
  selectedTransformation: TransformationType | null;
  /** List of applied transformations */
  appliedTransformations: AppliedTransformation[];
  /** Undo stack for reverting transformations */
  undoStack: AppliedTransformation[][];
  /** Redo stack for re-applying transformations */
  redoStack: AppliedTransformation[][];
  /** Current progress tracking */
  progress: WorkshopProgress;
  /** Saved pipelines */
  savedPipelines: TransformationPipeline[];
  /** Active tutorial ID (if any) */
  activeTutorialId: string | null;
  /** Current tutorial step */
  tutorialStep: number;
  /** Whether workshop is in preview mode */
  isPreviewMode: boolean;
  /** Session start time */
  sessionStartTime: Date;
}

interface WorkshopContextType extends WorkshopState {
  // Feature selection
  selectFeature: (featureName: string | null) => void;
  selectTransformation: (transformation: TransformationType | null) => void;
  
  // Transformation management
  applyTransformation: (transformation: AppliedTransformation) => void;
  removeTransformation: (transformationId: string) => void;
  clearAllTransformations: () => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Progress tracking
  updateProgress: (updates: Partial<WorkshopProgress>) => void;
  markFeatureTypeExplored: (featureType: FeatureType) => void;
  incrementTransformationCount: (featureType: FeatureType) => void;
  
  // Pipeline management
  savePipelineToState: (name: string) => TransformationPipeline;
  loadPipelineFromState: (pipelineId: string) => void;
  deletePipeline: (pipelineId: string) => void;
  exportPipelineToJson: (pipelineId: string) => string | null;
  importPipelineFromJson: (json: string) => boolean;
  
  // Tutorial management
  startTutorial: (tutorialId: string) => void;
  nextTutorialStep: () => void;
  previousTutorialStep: () => void;
  completeTutorial: () => void;
  exitTutorial: () => void;
  
  // Preview mode
  setPreviewMode: (enabled: boolean) => void;
  
  // Session management
  getSessionDuration: () => number;
  resetSession: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  PROGRESS: 'modelmentor_workshop_progress',
  PIPELINES: 'modelmentor_workshop_pipelines',
  TRANSFORMATIONS: 'modelmentor_workshop_transformations',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialProgress: WorkshopProgress = {
  totalTransformationsApplied: 0,
  transformationsByType: {},
  featureTypesExplored: [],
  tutorialsCompleted: [],
  badgesEarned: [],
  cumulativeImprovement: 0,
  mostImpactfulTransformation: null,
  sessionCount: 0,
  totalTimeSpent: 0,
};

const getInitialState = (): WorkshopState => {
  // Try to load persisted state
  let progress = initialProgress;
  let savedPipelines: TransformationPipeline[] = [];
  let appliedTransformations: AppliedTransformation[] = [];

  try {
    const storedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (storedProgress) {
      progress = { ...initialProgress, ...JSON.parse(storedProgress) };
    }

    const storedPipelines = localStorage.getItem(STORAGE_KEYS.PIPELINES);
    if (storedPipelines) {
      savedPipelines = JSON.parse(storedPipelines).map((p: TransformationPipeline) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
    }

    const storedTransformations = localStorage.getItem(STORAGE_KEYS.TRANSFORMATIONS);
    if (storedTransformations) {
      appliedTransformations = JSON.parse(storedTransformations).map((t: AppliedTransformation) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      }));
    }
  } catch (error) {
    console.warn('Failed to load workshop state from storage:', error);
  }

  return {
    selectedFeature: null,
    selectedTransformation: null,
    appliedTransformations,
    undoStack: [],
    redoStack: [],
    progress: {
      ...progress,
      sessionCount: progress.sessionCount + 1,
    },
    savedPipelines,
    activeTutorialId: null,
    tutorialStep: 0,
    isPreviewMode: false,
    sessionStartTime: new Date(),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkshopState>(getInitialState);

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(state.progress));
      localStorage.setItem(STORAGE_KEYS.PIPELINES, JSON.stringify(state.savedPipelines));
      localStorage.setItem(STORAGE_KEYS.TRANSFORMATIONS, JSON.stringify(state.appliedTransformations));
    } catch (error) {
      console.warn('Failed to persist workshop state:', error);
    }
  }, [state.progress, state.savedPipelines, state.appliedTransformations]);

  // Track session time
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          totalTimeSpent: prev.progress.totalTimeSpent + 1,
        },
      }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Feature selection
  const selectFeature = useCallback((featureName: string | null) => {
    setState(prev => ({ ...prev, selectedFeature: featureName }));
  }, []);

  const selectTransformation = useCallback((transformation: TransformationType | null) => {
    setState(prev => ({ ...prev, selectedTransformation: transformation }));
  }, []);

  // Transformation management
  const applyTransformation = useCallback((transformation: AppliedTransformation) => {
    setState(prev => {
      const newTransformations = [...prev.appliedTransformations, transformation];
      const newUndoStack = [...prev.undoStack, prev.appliedTransformations];
      
      // Update progress
      const transformationType = transformation.type;
      const newProgress: WorkshopProgress = {
        ...prev.progress,
        totalTransformationsApplied: prev.progress.totalTransformationsApplied + 1,
        transformationsByType: {
          ...prev.progress.transformationsByType,
          [transformationType]: (prev.progress.transformationsByType[transformationType] || 0) + 1,
        },
        cumulativeImprovement: prev.progress.cumulativeImprovement + transformation.performanceImpact,
      };

      // Track most impactful transformation
      if (
        !prev.progress.mostImpactfulTransformation ||
        transformation.performanceImpact > prev.progress.mostImpactfulTransformation.performanceImpact
      ) {
        newProgress.mostImpactfulTransformation = transformation;
      }

      return {
        ...prev,
        appliedTransformations: newTransformations,
        undoStack: newUndoStack,
        redoStack: [], // Clear redo stack on new action
        progress: newProgress,
      };
    });
  }, []);

  const removeTransformation = useCallback((transformationId: string) => {
    setState(prev => {
      const newTransformations = prev.appliedTransformations.filter(t => t.id !== transformationId);
      const newUndoStack = [...prev.undoStack, prev.appliedTransformations];
      
      return {
        ...prev,
        appliedTransformations: newTransformations,
        undoStack: newUndoStack,
        redoStack: [],
      };
    });
  }, []);

  const clearAllTransformations = useCallback(() => {
    setState(prev => ({
      ...prev,
      appliedTransformations: [],
      undoStack: [...prev.undoStack, prev.appliedTransformations],
      redoStack: [],
    }));
  }, []);

  // Undo/Redo
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.undoStack.length === 0) return prev;
      
      const newUndoStack = [...prev.undoStack];
      const previousState = newUndoStack.pop()!;
      
      return {
        ...prev,
        appliedTransformations: previousState,
        undoStack: newUndoStack,
        redoStack: [...prev.redoStack, prev.appliedTransformations],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.redoStack.length === 0) return prev;
      
      const newRedoStack = [...prev.redoStack];
      const nextState = newRedoStack.pop()!;
      
      return {
        ...prev,
        appliedTransformations: nextState,
        undoStack: [...prev.undoStack, prev.appliedTransformations],
        redoStack: newRedoStack,
      };
    });
  }, []);

  // Progress tracking
  const updateProgress = useCallback((updates: Partial<WorkshopProgress>) => {
    setState(prev => ({
      ...prev,
      progress: { ...prev.progress, ...updates },
    }));
  }, []);

  const markFeatureTypeExplored = useCallback((featureType: FeatureType) => {
    setState(prev => {
      if (prev.progress.featureTypesExplored.includes(featureType)) {
        return prev;
      }
      return {
        ...prev,
        progress: {
          ...prev.progress,
          featureTypesExplored: [...prev.progress.featureTypesExplored, featureType],
        },
      };
    });
  }, []);

  const incrementTransformationCount = useCallback((featureType: FeatureType) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        transformationsByType: {
          ...prev.progress.transformationsByType,
          [featureType]: (prev.progress.transformationsByType[featureType] || 0) + 1,
        },
      },
    }));
  }, []);

  // Pipeline management
  const savePipelineToState = useCallback((name: string): TransformationPipeline => {
    const pipeline = savePipeline(
      name,
      state.appliedTransformations,
      state.appliedTransformations.map(t => t.feature)
    );
    
    setState(prev => ({
      ...prev,
      savedPipelines: [...prev.savedPipelines, pipeline],
    }));
    
    return pipeline;
  }, [state.appliedTransformations]);

  const loadPipelineFromState = useCallback((pipelineId: string) => {
    const pipeline = state.savedPipelines.find(p => p.id === pipelineId);
    if (!pipeline) return;
    
    const transformations = loadPipeline(pipeline);
    setState(prev => ({
      ...prev,
      appliedTransformations: transformations,
      undoStack: [...prev.undoStack, prev.appliedTransformations],
      redoStack: [],
    }));
  }, [state.savedPipelines]);

  const deletePipeline = useCallback((pipelineId: string) => {
    setState(prev => ({
      ...prev,
      savedPipelines: prev.savedPipelines.filter(p => p.id !== pipelineId),
    }));
  }, []);

  const exportPipelineToJson = useCallback((pipelineId: string): string | null => {
    const pipeline = state.savedPipelines.find(p => p.id === pipelineId);
    if (!pipeline) return null;
    return exportPipeline(pipeline);
  }, [state.savedPipelines]);

  const importPipelineFromJson = useCallback((json: string): boolean => {
    const pipeline = importPipeline(json);
    if (!pipeline) return false;
    
    setState(prev => ({
      ...prev,
      savedPipelines: [...prev.savedPipelines, pipeline],
    }));
    return true;
  }, []);

  // Tutorial management
  const startTutorial = useCallback((tutorialId: string) => {
    setState(prev => ({
      ...prev,
      activeTutorialId: tutorialId,
      tutorialStep: 0,
    }));
  }, []);

  const nextTutorialStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      tutorialStep: prev.tutorialStep + 1,
    }));
  }, []);

  const previousTutorialStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      tutorialStep: Math.max(0, prev.tutorialStep - 1),
    }));
  }, []);

  const completeTutorial = useCallback(() => {
    setState(prev => {
      if (!prev.activeTutorialId) return prev;
      
      const tutorialsCompleted = prev.progress.tutorialsCompleted.includes(prev.activeTutorialId)
        ? prev.progress.tutorialsCompleted
        : [...prev.progress.tutorialsCompleted, prev.activeTutorialId];
      
      return {
        ...prev,
        activeTutorialId: null,
        tutorialStep: 0,
        progress: {
          ...prev.progress,
          tutorialsCompleted,
        },
      };
    });
  }, []);

  const exitTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeTutorialId: null,
      tutorialStep: 0,
    }));
  }, []);

  // Preview mode
  const setPreviewMode = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, isPreviewMode: enabled }));
  }, []);

  // Session management
  const getSessionDuration = useCallback((): number => {
    return Math.floor((Date.now() - state.sessionStartTime.getTime()) / 1000);
  }, [state.sessionStartTime]);

  const resetSession = useCallback(() => {
    setState({
      ...getInitialState(),
      progress: initialProgress,
      savedPipelines: [],
    });
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.PIPELINES);
    localStorage.removeItem(STORAGE_KEYS.TRANSFORMATIONS);
  }, []);

  const value: WorkshopContextType = {
    ...state,
    selectFeature,
    selectTransformation,
    applyTransformation,
    removeTransformation,
    clearAllTransformations,
    undo,
    redo,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    updateProgress,
    markFeatureTypeExplored,
    incrementTransformationCount,
    savePipelineToState,
    loadPipelineFromState,
    deletePipeline,
    exportPipelineToJson,
    importPipelineFromJson,
    startTutorial,
    nextTutorialStep,
    previousTutorialStep,
    completeTutorial,
    exitTutorial,
    setPreviewMode,
    getSessionDuration,
    resetSession,
  };

  return (
    <WorkshopContext.Provider value={value}>
      {children}
    </WorkshopContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useWorkshop() {
  const context = useContext(WorkshopContext);
  if (context === undefined) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Selector Hooks (for performance optimization)
// ─────────────────────────────────────────────────────────────────────────────

export function useWorkshopProgress() {
  const { progress } = useWorkshop();
  return progress;
}

export function useWorkshopTransformations() {
  const { appliedTransformations, applyTransformation, removeTransformation, clearAllTransformations } = useWorkshop();
  return { appliedTransformations, applyTransformation, removeTransformation, clearAllTransformations };
}

export function useWorkshopTutorial() {
  const { 
    activeTutorialId, 
    tutorialStep, 
    startTutorial, 
    nextTutorialStep, 
    previousTutorialStep, 
    completeTutorial, 
    exitTutorial 
  } = useWorkshop();
  return { 
    activeTutorialId, 
    tutorialStep, 
    startTutorial, 
    nextTutorialStep, 
    previousTutorialStep, 
    completeTutorial, 
    exitTutorial 
  };
}

export function useWorkshopPipelines() {
  const { 
    savedPipelines, 
    savePipelineToState, 
    loadPipelineFromState, 
    deletePipeline, 
    exportPipelineToJson, 
    importPipelineFromJson 
  } = useWorkshop();
  return { 
    savedPipelines, 
    savePipelineToState, 
    loadPipelineFromState, 
    deletePipeline, 
    exportPipelineToJson, 
    importPipelineFromJson 
  };
}
