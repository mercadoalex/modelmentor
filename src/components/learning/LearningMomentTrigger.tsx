/**
 * Learning Moment Trigger Component
 * 
 * A wrapper component that handles trigger logic and eligibility checking
 * for Learning Moments. Wraps workflow content and shows the modal when
 * trigger conditions are met.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';
import { LearningMomentModal, type LearningMomentResult } from './LearningMomentModal';
import { learningMomentService } from '@/services/learningMomentService';
import type { LearningMomentType, LearningMomentContextData } from '@/utils/learningMomentContent';
import type { ModelType } from '@/types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  model_type: ModelType;
  is_guided_tour?: boolean;
}

export interface LearningMomentTriggerProps {
  /** Type of learning moment to trigger */
  momentType: LearningMomentType;
  /** Project context */
  project: Project;
  /** Whether the trigger condition is met */
  triggerCondition: boolean;
  /** Additional context data for the learning moment */
  contextData?: LearningMomentContextData;
  /** Children to render (the workflow content) */
  children: React.ReactNode;
  /** Callback when learning moment is completed */
  onComplete?: (result: LearningMomentResult) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function LearningMomentTrigger({
  momentType,
  project,
  triggerCondition,
  contextData,
  children,
  onComplete
}: LearningMomentTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const toastIdRef = useRef<string | number | null>(null);
  
  const isGuidedTour = project.is_guided_tour ?? false;

  // Get moment display name
  const getMomentDisplayName = useCallback(() => {
    switch (momentType) {
      case 'data':
        return 'Data Quality';
      case 'model':
        return 'How Your Model Works';
      case 'next_steps':
        return 'Next Steps';
    }
  }, [momentType]);

  // Handle trigger condition change
  useEffect(() => {
    const checkAndTrigger = async () => {
      // Only trigger once per session
      if (hasTriggered || !triggerCondition) {
        return;
      }

      // Check eligibility
      const shouldShow = await learningMomentService.shouldShowMoment(
        project.id,
        momentType,
        isGuidedTour
      );

      if (!shouldShow) {
        setHasTriggered(true);
        return;
      }

      setHasTriggered(true);

      if (isGuidedTour) {
        // In guided tour mode, auto-open the modal
        setIsModalOpen(true);
      } else {
        // In non-guided tour mode, show a notification prompt
        showNotificationPrompt();
      }
    };

    checkAndTrigger();
  }, [triggerCondition, hasTriggered, project.id, momentType, isGuidedTour]);

  // Show notification prompt for non-guided tour
  const showNotificationPrompt = useCallback(() => {
    // Dismiss any existing toast
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    toastIdRef.current = toast(
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
          <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Learning Moment Available</p>
          <p className="text-xs text-muted-foreground">
            Learn about {getMomentDisplayName()}
          </p>
        </div>
      </div>,
      {
        duration: 10000, // 10 seconds
        action: {
          label: 'Learn Now',
          onClick: () => {
            setIsModalOpen(true);
          }
        },
        onDismiss: () => {
          toastIdRef.current = null;
        }
      }
    );
  }, [getMomentDisplayName]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Handle completion
  const handleComplete = useCallback((result: LearningMomentResult) => {
    onComplete?.(result);
  }, [onComplete]);

  // Cleanup toast on unmount
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);

  return (
    <>
      {children}
      
      <LearningMomentModal
        momentType={momentType}
        project={project}
        contextData={contextData}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onComplete={handleComplete}
        isGuidedTour={isGuidedTour}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook for manual trigger
// ─────────────────────────────────────────────────────────────────────────────

export interface UseLearningMomentOptions {
  momentType: LearningMomentType;
  project: Project;
  contextData?: LearningMomentContextData;
  onComplete?: (result: LearningMomentResult) => void;
}

export interface UseLearningMomentReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  isCompleted: boolean;
  checkEligibility: () => Promise<boolean>;
  LearningMomentModalComponent: React.FC;
}

/**
 * Hook for manually controlling a Learning Moment modal
 * Useful when you need more control over when the modal appears
 */
export function useLearningMoment({
  momentType,
  project,
  contextData,
  onComplete
}: UseLearningMomentOptions): UseLearningMomentReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Check completion status on mount
  useEffect(() => {
    const checkCompletion = async () => {
      const progress = await learningMomentService.getProgress(project.id);
      setIsCompleted(progress.moments[momentType].completed);
    };
    checkCompletion();
  }, [project.id, momentType]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const checkEligibility = useCallback(async () => {
    return learningMomentService.shouldShowMoment(
      project.id,
      momentType,
      project.is_guided_tour ?? false
    );
  }, [project.id, momentType, project.is_guided_tour]);

  const handleComplete = useCallback((result: LearningMomentResult) => {
    setIsCompleted(true);
    onComplete?.(result);
  }, [onComplete]);

  const LearningMomentModalComponent: React.FC = useCallback(() => (
    <LearningMomentModal
      momentType={momentType}
      project={project}
      contextData={contextData}
      isOpen={isOpen}
      onClose={close}
      onComplete={handleComplete}
      isGuidedTour={project.is_guided_tour}
    />
  ), [momentType, project, contextData, isOpen, close, handleComplete]);

  return {
    isOpen,
    open,
    close,
    isCompleted,
    checkEligibility,
    LearningMomentModalComponent
  };
}
