# Implementation Tasks: Learning Moments

## Task 1: Create Learning Moment Content Module

- [x] 1.1 Create `src/utils/learningMomentContent.ts` with TypeScript interfaces for content structure
  - Define `LearningMomentContent`, `ContentSection`, `LearningMomentQuiz` interfaces
  - Define `LearningMomentContentMap` type for model type × moment type combinations
  - Support dynamic placeholders: `{{sampleCount}}`, `{{labelCount}}`, `{{accuracy}}`, etc.

- [x] 1.2 Implement Learn: Data content for all model types
  - Image classification: image quality factors (resolution, lighting, diversity)
  - Text classification: text quality factors (length, vocabulary, balance)
  - Regression: numerical data quality (outliers, missing values, scaling)
  - Classification: tabular data quality (class balance, feature types)
  - Include quiz questions for each model type

- [x] 1.3 Implement Learn: Model content for all model types
  - Image classification: CNN concepts, feature maps, convolution
  - Text classification: embeddings, tokenization, classification layers
  - Regression: linear relationships, prediction intervals, R² score
  - Classification: decision boundaries, feature importance
  - Include quiz questions for each model type

- [x] 1.4 Implement Learn: Next Steps content for all model types
  - High accuracy path: optimization techniques, hyperparameter tuning
  - Low accuracy path: data improvement, debugging strategies
  - Links to ModelMentor workshops and advanced features
  - Include quiz questions for advanced concepts

- [x] 1.5 Add content helper functions
  - `getContentForMoment(modelType, momentType)` - returns appropriate content
  - `replacePlaceholders(content, contextData)` - replaces dynamic placeholders
  - `getConditionalContent(datasetStats, trainingMetrics)` - returns class imbalance, overfitting, underfitting content

## Task 2: Create Learning Moment Service

- [x] 2.1 Create `src/services/learningMomentService.ts` with core service class
  - Define `LearningMomentProgress`, `LearningMomentStatus`, `LearningMomentPreferences` interfaces
  - Implement singleton pattern for service instance

- [x] 2.2 Implement eligibility checking
  - `shouldShowMoment(projectId, momentType, isGuidedTour)` - checks if moment should display
  - Check completion status, don't show preferences, guided tour mode
  - Return boolean indicating whether to show

- [x] 2.3 Implement progress tracking
  - `recordCompletion(projectId, result)` - records moment completion
  - `getProgress(projectId)` - retrieves progress for a project
  - Store quiz scores, time spent, completion timestamps

- [x] 2.4 Implement preference management
  - `setDontShowPreference(momentType, dontShow)` - sets user preference
  - `getDontShowPreference(momentType)` - retrieves preference
  - Persist to localStorage for anonymous users

- [x] 2.5 Implement gamification integration
  - `awardPoints(userId, momentType, quizScore, quizTotal)` - awards points via gamificationService
  - Award 50 points for Learn: Data, 75 for Learn: Model, 100 for Learn: Next Steps
  - Award 25 bonus points for perfect quiz scores
  - Check and unlock "Complete Learner" achievement (all 3 moments for a project)
  - Check and unlock "Knowledge Seeker" achievement (5 moments total)

- [x] 2.6 Implement persistence layer
  - localStorage storage for anonymous users with key `modelmentor_learning_moments_{sessionId}`
  - Supabase integration for authenticated users (to be connected when tables exist)
  - Fallback from Supabase to localStorage on errors

## Task 3: Create Database Migration

- [ ] 3.1 Create Supabase migration file `supabase/migrations/YYYYMMDD_learning_moments.sql`
  - Create `learning_moment_progress` table with columns: id, project_id, user_id, session_id, moment_type, completed, completed_at, quiz_score, quiz_total, time_spent_seconds
  - Create `learning_moment_preferences` table with columns: id, user_id, session_id, dont_show_data, dont_show_model, dont_show_next_steps
  - Add foreign key constraints to projects and auth.users
  - Add unique constraints and indexes for performance

- [ ] 3.2 Add RLS policies for learning moment tables
  - Users can read/write their own progress
  - Users can read/write their own preferences
  - Anonymous users identified by session_id

## Task 4: Create LearningMomentModal Component

- [x] 4.1 Create `src/components/learning/LearningMomentModal.tsx` base component
  - Use shadcn/ui Dialog component for modal presentation
  - Implement props interface: momentType, project, contextData, isOpen, onClose, onComplete, isGuidedTour
  - Add responsive design with min 320px viewport support
  - Implement keyboard navigation (Escape to close, Tab navigation)
  - Prevent background scrolling when modal is open

- [x] 4.2 Implement three-step internal flow
  - Step 1: Content display with SimplifiedExplanation components
  - Step 2: Quiz using InteractiveQuiz component (adapted for modal)
  - Step 3: Summary with score, points earned, next steps
  - Add progress indicator showing current step

- [x] 4.3 Implement modal controls
  - Close button (X) in header
  - "Skip for now" button that dismisses without completing
  - "Don't show again" checkbox (hidden in guided tour mode)
  - "Continue" / "Next" buttons for step progression

- [x] 4.4 Implement content rendering
  - Render content sections with dynamic placeholder replacement
  - Display dataset statistics for Learn: Data
  - Display training metrics for Learn: Model
  - Display performance summary for Learn: Next Steps
  - Show conditional content (class imbalance, overfitting, underfitting warnings)

- [x] 4.5 Implement completion handling
  - Track time spent in modal
  - Collect quiz results
  - Call learningMomentService.recordCompletion on complete
  - Call learningMomentService.awardPoints for gamification
  - Show toast notifications for points and achievements

## Task 5: Create LearningMomentTrigger Component

- [x] 5.1 Create `src/components/learning/LearningMomentTrigger.tsx` wrapper component
  - Implement props interface: momentType, project, triggerCondition, contextData, children
  - Manage modal open/close state
  - Render children (workflow content) always

- [x] 5.2 Implement trigger logic
  - Check eligibility via learningMomentService.shouldShowMoment
  - For guided tour: auto-open modal when triggerCondition becomes true
  - For non-guided tour: show notification prompt (toast with action button)
  - Track if trigger has already fired for this session

- [x] 5.3 Implement notification prompt for non-guided tour
  - Use toast with action button: "Learn about [topic]"
  - Clicking action opens the LearningMomentModal
  - Toast auto-dismisses after 10 seconds if not clicked

## Task 6: Integrate Learning Moments into Workflow Pages

- [ ] 6.1 Integrate Learn: Data trigger into DataCollectionPage
  - Wrap data upload success handler with LearningMomentTrigger
  - Pass dataset statistics as context data
  - Trigger after successful dataset upload/generation

- [ ] 6.2 Integrate Learn: Model trigger into TrainingPage
  - Wrap training completion handler with LearningMomentTrigger
  - Pass training metrics as context data
  - Trigger after training completes successfully

- [ ] 6.3 Integrate Learn: Next Steps trigger into deploy page
  - Wrap deployment completion handler with LearningMomentTrigger
  - Pass model performance as context data
  - Trigger after deployment completes successfully

## Task 7: Update MLWorkflowVisualizer

- [x] 7.1 Add completion status tracking to learning moment indicators
  - Accept learningMomentProgress prop
  - Show visual indicator for completion status (not started, in progress, completed)
  - Use checkmark icon for completed moments
  - Use badge/dot for available but not completed moments

- [x] 7.2 Make learning moment indicators clickable
  - Add onClick handler to learning moment cards
  - Open corresponding LearningMomentModal when clicked
  - Pass current project context to modal

- [x] 7.3 Update styling for interactive states
  - Add hover effect to learning moment cards
  - Add cursor pointer for clickable cards
  - Add focus styles for keyboard navigation

## Task 8: Add Property-Based Tests

- [ ] 8.1 Set up fast-check testing infrastructure
  - Install fast-check if not already present
  - Create test file `src/utils/__tests__/learningMomentContent.property.test.ts`
  - Create test file `src/services/__tests__/learningMomentService.property.test.ts`

- [ ] 8.2 Implement content selection property tests
  - Property 1: Content selection returns correct content for model type × moment type
  - Property 16: All content definitions include quiz questions and support placeholders

- [ ] 8.3 Implement data incorporation property tests
  - Property 2: Dataset stats appear in rendered Learn: Data content
  - Property 3: Training metrics appear in rendered Learn: Model content
  - Property 4: Model performance affects Learn: Next Steps recommendations

- [ ] 8.4 Implement persistence round-trip property tests
  - Property 5: Progress data round-trip (store then retrieve returns equivalent data)
  - Property 6: Preference round-trip (store then retrieve returns same value)
  - Property 7: Content definition round-trip (serialize/deserialize equivalence)

- [ ] 8.5 Implement achievement property tests
  - Property 8: Perfect quiz score awards exactly 25 bonus points
  - Property 9: Completing all 3 moments unlocks "Complete Learner"
  - Property 10: Completing 5 moments unlocks "Knowledge Seeker"

- [ ] 8.6 Implement conditional content property tests
  - Property 11: Class imbalance (<20%) triggers imbalance content
  - Property 12: Non-decreasing loss triggers underfitting content
  - Property 13: >10% accuracy gap triggers overfitting content

- [ ] 8.7 Implement trigger prevention property tests
  - Property 14: "Don't show again" prevents trigger (non-guided tour)
  - Property 15: Completed moments don't trigger again

## Task 9: Add Unit and Integration Tests

- [ ] 9.1 Create unit tests for LearningMomentModal
  - Test rendering for each moment type
  - Test close button dismisses modal
  - Test skip button dismisses modal
  - Test don't show again checkbox
  - Test progress indicator updates
  - Test keyboard navigation (Escape closes)
  - Test responsive layout at 320px

- [ ] 9.2 Create unit tests for LearningMomentTrigger
  - Test modal opens when trigger condition met (guided tour)
  - Test notification shows when trigger condition met (non-guided tour)
  - Test respects don't show preferences
  - Test handles missing context data gracefully

- [ ] 9.3 Create unit tests for learningMomentService
  - Test recordCompletion stores data correctly
  - Test getProgress retrieves data correctly
  - Test point awards for each moment type
  - Test bonus points for perfect quiz
  - Test achievement unlocks at correct thresholds

- [ ] 9.4 Create integration tests for workflow integration
  - Test data upload triggers Learn: Data modal
  - Test training completion triggers Learn: Model modal
  - Test deployment completion triggers Learn: Next Steps modal
  - Test gamification points are awarded
  - Test progress persists across page reloads

## Task 10: Documentation and Final Polish

- [ ] 10.1 Add JSDoc comments to all exported functions and components
  - Document props interfaces
  - Document service methods
  - Document content structure

- [ ] 10.2 Update existing learning infrastructure documentation
  - Add Learning Moments to README or docs
  - Document how to add new content
  - Document how to customize for new model types

- [ ] 10.3 Accessibility review and fixes
  - Verify ARIA labels on modal
  - Verify focus management
  - Verify screen reader compatibility
  - Verify color contrast

- [ ] 10.4 Performance optimization
  - Lazy load modal content
  - Memoize content selection
  - Optimize re-renders in workflow pages
