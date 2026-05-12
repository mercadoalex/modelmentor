/**
 * Learning Components Index
 * 
 * Exports all learning-related components for easy importing
 */

// Existing components
export { SimplifiedExplanation, mlExplanations } from './SimplifiedExplanation';

// Learning Moments components
export { 
  LearningMomentModal,
  type LearningMomentModalProps,
  type LearningMomentResult
} from './LearningMomentModal';

export {
  LearningMomentTrigger,
  useLearningMoment,
  type LearningMomentTriggerProps,
  type UseLearningMomentOptions,
  type UseLearningMomentReturn
} from './LearningMomentTrigger';
