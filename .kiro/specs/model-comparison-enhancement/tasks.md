# Implementation Plan: Model Comparison Dashboard Enhancement

## Overview

This implementation plan transforms the Model Comparison Dashboard from using placeholder/mock data to fetching and displaying real model data from Supabase. The implementation is organized into phases: database schema extensions, service layer creation, component integration, and advanced features (export, recommendations, real-time sync).

## Tasks

- [x] 1. Database Schema Extensions
  - [x] 1.1 Create training_curves table migration
    - Create SQL migration file for `training_curves` table with columns: id, training_session_id, epoch, train_loss, val_loss, train_accuracy, val_accuracy, created_at
    - Add unique constraint on (training_session_id, epoch)
    - Add indexes on training_session_id and (training_session_id, epoch)
    - _Requirements: 2.1_

  - [x] 1.2 Extend model_versions table with efficiency columns
    - Create SQL migration to add columns: training_time_seconds, inference_time_ms, model_size_bytes, flops, experiment_id, optimizer
    - Add index on experiment_id column
    - _Requirements: 2.2, 2.4_

  - [x] 1.3 Create model_lineage table migration
    - Create SQL migration for `model_lineage` table with columns: id, model_version_id, parent_model_version_id, relationship_type, notes, created_at
    - Add unique constraint on model_version_id
    - Add indexes on model_version_id and parent_model_version_id
    - Add foreign key constraints with appropriate ON DELETE behavior
    - _Requirements: 2.3, 2.5_

  - [x] 1.4 Add test_results index for prediction queries
    - Create SQL migration to add index on test_results(training_session_id)
    - _Requirements: 2.6_

- [x] 2. TypeScript Type Definitions
  - [x] 2.1 Create comparison types file
    - Create `src/types/comparison.ts` with interfaces: TrainingCurve, ModelLineage, ExtendedModelVersion, PredictionSample, TestResultPredictions
    - Define ComparisonServiceError interface with error codes
    - Define ComparisonServiceResult<T> generic interface
    - _Requirements: 1.7_

  - [x] 2.2 Create service interface types
    - Define ModelForComparison, TrainingCurveData, ConfusionMatrixData, PredictionData interfaces
    - Define EfficiencyMetrics, HyperparameterData, LineageData interfaces
    - Define ModelChangeEvent interface for realtime subscriptions
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.3 Write property test for error response structure
    - **Property 2: Error Responses Have Consistent Structure**
    - **Validates: Requirements 1.7**

- [x] 3. Checkpoint - Database and Types
  - Ensure all migrations run successfully, ask the user if questions arise.

- [x] 4. ComparisonService Implementation
  - [x] 4.1 Create ComparisonService base structure
    - Create `src/services/comparisonService.ts` with class structure
    - Implement in-memory cache with CacheEntry<T> structure and 5-minute TTL
    - Implement cache helper methods: getFromCache, setInCache, clearCache, invalidateCache
    - _Requirements: 1.8_

  - [ ]* 4.2 Write property test for cache behavior
    - **Property 3: Cache Returns Identical Data on Subsequent Calls**
    - **Validates: Requirements 1.8**

  - [x] 4.3 Implement fetchModels function
    - Query model_versions table joined with projects for current user
    - Return ModelForComparison[] with id, projectId, projectTitle, versionNumber, versionName, accuracy, loss, createdAt, createdBy
    - Implement error handling with structured ComparisonServiceError
    - _Requirements: 1.1, 3.1_

  - [ ]* 4.4 Write property test for fetchModels
    - **Property 1: Fetch Operations Return Correct Data for Requested Model IDs**
    - **Validates: Requirements 1.1**

  - [x] 4.5 Implement fetchTrainingCurves function
    - Query training_curves table for specified model IDs via training_sessions
    - Aggregate epoch data into TrainingCurveData[] format
    - Handle missing data gracefully
    - _Requirements: 1.2_

  - [ ]* 4.6 Write property test for fetchTrainingCurves
    - **Property 1: Fetch Operations Return Correct Data for Requested Model IDs**
    - **Validates: Requirements 1.2**

  - [x] 4.7 Implement fetchConfusionMatrices function
    - Query test_results table for confusion matrix data
    - Parse JSONB confusion_matrix field into ConfusionMatrixData[]
    - _Requirements: 1.3_

  - [x] 4.8 Implement fetchPredictions function
    - Query test_results table for sample-level predictions
    - Parse JSONB predictions field into PredictionData[]
    - Implement pagination with page and pageSize parameters
    - _Requirements: 1.4_

  - [x] 4.9 Implement fetchEfficiencyMetrics function
    - Query model_versions table for efficiency columns
    - Return EfficiencyMetrics[] with training time, inference time, model size, flops
    - _Requirements: 1.5_

  - [x] 4.10 Implement fetchHyperparameters function
    - Query model_versions and training_sessions for hyperparameter data
    - Extract learning_rate, batch_size, epochs, optimizer from records
    - Parse custom hyperparameters from JSONB metadata
    - _Requirements: 1.6_

  - [x] 4.11 Implement fetchLineage function
    - Query model_lineage table joined with model_versions for parent info
    - Return LineageData[] with parent relationships and experiment tracking
    - _Requirements: 1.6_

- [x] 5. Checkpoint - Service Layer
  - Ensure all service functions work correctly, ask the user if questions arise.

- [x] 6. StatisticalService Implementation
  - [x] 6.1 Create StatisticalService structure
    - Create `src/services/statisticalService.ts` with class structure
    - Define StatisticalTestResult interface
    - _Requirements: 9.1, 9.2_

  - [x] 6.2 Implement computePairedTTest function
    - Implement paired t-test calculation for accuracy differences
    - Return p-value, significance flag, confidence interval, effect size
    - _Requirements: 9.1, 9.3, 9.5_

  - [ ]* 6.3 Write property test for paired t-test significance threshold
    - **Property 23: Statistical Significance Threshold**
    - **Validates: Requirements 9.4**

  - [x] 6.4 Implement computeMcNemarTest function
    - Implement McNemar test for classification disagreement
    - Return p-value and significance flag
    - _Requirements: 9.2_

  - [x] 6.5 Implement computeAllPairwiseTests function
    - Compute tests for all unique model pairs (N*(N-1)/2 pairs)
    - Return array of StatisticalTestResult for all pairs
    - _Requirements: 9.1, 9.2_

  - [ ]* 6.6 Write property test for pairwise test count
    - **Property 22: Statistical Tests Computed for All Model Pairs**
    - **Validates: Requirements 9.1, 9.2**

- [x] 7. Dashboard State Management
  - [x] 7.1 Create dashboard state types
    - Define DashboardState interface with model selection, loading states, error states, data states
    - Create custom hook useComparisonDashboard for state management
    - _Requirements: 3.4, 13.1, 13.2_

  - [x] 7.2 Implement model fetching on dashboard load
    - Fetch available models when dashboard mounts
    - Store in availableModels state
    - Handle loading and error states
    - _Requirements: 3.1, 3.2_

  - [ ]* 7.3 Write property test for model selection state
    - **Property 5: Model Selection State Reflects User Actions**
    - **Validates: Requirements 3.4**

  - [x] 7.4 Implement model selection validation
    - Enforce minimum 2 models for comparison
    - Enforce maximum 10 models for comparison
    - Disable Compare button when validation fails
    - _Requirements: 3.5, 3.6_

  - [ ]* 7.5 Write property test for model selection count validation
    - **Property 6: Model Selection Count Validation**
    - **Validates: Requirements 3.5, 3.6**

  - [x] 7.6 Implement parallel data fetching on compare
    - Fetch all comparison data in parallel when Compare is clicked
    - Update individual loading states per component
    - _Requirements: 4.1, 5.1, 6.1, 7.1, 8.1, 10.1_

- [x] 8. Checkpoint - Dashboard State
  - Ensure dashboard state management works correctly, ask the user if questions arise.

- [x] 9. Component Props Enhancement
  - [x] 9.1 Update TrainingCurvesOverlay props interface
    - Add data, loading, error, onRetry props
    - Update component to accept data via props instead of internal fetch
    - _Requirements: 4.1, 4.7_

  - [x] 9.2 Update ConfusionMatrixComparison props interface
    - Add data, loading, error, onRetry props
    - Update component to accept data via props
    - _Requirements: 5.1, 5.5_

  - [x] 9.3 Update PredictionAnalysis props interface
    - Add data, loading, error, onRetry, onPageChange props
    - Update component to accept paginated data via props
    - _Requirements: 6.1, 6.6, 6.7_

  - [x] 9.4 Update ModelEfficiencyTable props interface
    - Add data, loading, error, onRetry props
    - Update component to accept data via props
    - _Requirements: 7.1, 7.7_

  - [x] 9.5 Update HyperparameterComparisonTable props interface
    - Add data, loading, error, onRetry props
    - Update component to accept data via props
    - _Requirements: 8.1, 8.5_

  - [x] 9.6 Update StatisticalTests props interface
    - Add results, loading, error, onRetry props
    - Update component to accept computed results via props
    - _Requirements: 9.1, 9.6_

  - [x] 9.7 Update ModelLineage props interface
    - Add data, loading, error, onRetry props
    - Update component to accept data via props
    - _Requirements: 10.1, 10.5_

  - [x] 9.8 Update ModelRecommendation props interface
    - Add efficiencyData, accuracyData, loading props
    - Update component to accept data via props
    - _Requirements: 11.1_

- [x] 10. TrainingCurvesOverlay Integration
  - [x] 10.1 Implement training curves chart rendering
    - Render Recharts LineChart with training curve data
    - Display train loss, val loss, train accuracy, val accuracy per model
    - _Requirements: 4.2, 4.3_

  - [ ]* 10.2 Write property test for curve dataset count
    - **Property 7: Training Curves Render All Metrics for All Models**
    - **Validates: Requirements 4.2, 4.3**

  - [x] 10.3 Implement distinct color assignment per model
    - Assign unique colors to each model's curves
    - Ensure no two models share the same color
    - _Requirements: 4.4_

  - [ ]* 10.4 Write property test for distinct model colors
    - **Property 8: Model Curves Have Distinct Colors**
    - **Validates: Requirements 4.4**

  - [x] 10.5 Implement interactive legend toggling
    - Add legend with clickable items to show/hide model curves
    - _Requirements: 4.6_

  - [x] 10.6 Implement loading skeleton and error state
    - Display skeleton loader while loading
    - Display error message with retry button on error
    - Display placeholder message for models without data
    - _Requirements: 4.5, 4.7, 13.1, 13.2_

- [x] 11. ConfusionMatrixComparison Integration
  - [x] 11.1 Implement confusion matrix grid rendering
    - Render side-by-side confusion matrices for each model
    - Apply color intensity based on cell values
    - _Requirements: 5.2, 5.6_

  - [ ]* 11.2 Write property test for matrix count
    - **Property 9: Confusion Matrices Render for All Models**
    - **Validates: Requirements 5.2**

  - [x] 11.3 Implement consistent label ordering
    - Unify class labels across all matrices
    - Sort labels consistently for visual comparison
    - _Requirements: 5.4_

  - [ ]* 11.4 Write property test for label consistency
    - **Property 10: Confusion Matrix Labels Are Consistent**
    - **Validates: Requirements 5.4**

  - [ ]* 11.5 Write property test for color intensity correlation
    - **Property 11: Confusion Matrix Color Intensity Correlates with Value**
    - **Validates: Requirements 5.6**

  - [x] 11.6 Implement difference heatmap for two models
    - When exactly 2 models selected, show cell-by-cell difference heatmap
    - _Requirements: 5.3_

  - [x] 11.7 Implement loading skeleton and error state
    - Display skeleton loader while loading
    - Display error message with retry button on error
    - _Requirements: 5.5, 13.1, 13.2_

- [x] 12. PredictionAnalysis Integration
  - [x] 12.1 Implement prediction table rendering
    - Render table with sample ID, true label, model predictions, ensemble vote columns
    - _Requirements: 6.2_

  - [ ]* 12.2 Write property test for table column count
    - **Property 12: Prediction Table Contains Required Columns**
    - **Validates: Requirements 6.2**

  - [x] 12.3 Implement ensemble voting calculation
    - Calculate majority vote for each sample
    - Handle ties deterministically (alphabetically first)
    - _Requirements: 6.4_

  - [ ]* 12.4 Write property test for ensemble vote calculation
    - **Property 14: Ensemble Vote Equals Majority Prediction**
    - **Validates: Requirements 6.4**

  - [x] 12.5 Implement disagreement highlighting and color coding
    - Highlight rows where models disagree
    - Color predictions: green (correct), red (incorrect), blue (matches ensemble)
    - _Requirements: 6.3, 6.5_

  - [ ]* 12.6 Write property test for disagreement highlighting
    - **Property 13: Prediction Disagreement and Color Coding**
    - **Validates: Requirements 6.3, 6.5**

  - [x] 12.7 Implement pagination for large datasets
    - Add pagination controls for datasets > 50 samples
    - Display 50 samples per page
    - _Requirements: 6.6_

  - [ ]* 12.8 Write property test for pagination activation
    - **Property 15: Pagination Activates for Large Datasets**
    - **Validates: Requirements 6.6**

  - [x] 12.9 Implement loading skeleton and error state
    - Display skeleton loader while loading
    - Display error message with retry button on error
    - _Requirements: 6.7, 13.1, 13.2_

- [x] 13. Checkpoint - Core Components
  - Ensure TrainingCurves, ConfusionMatrix, and PredictionAnalysis work correctly, ask the user if questions arise.

- [x] 14. ModelEfficiencyTable Integration
  - [x] 14.1 Implement efficiency metrics table rendering
    - Render table with training time, inference time, model size, FLOPs columns
    - _Requirements: 7.1_

  - [x] 14.2 Implement training time formatting
    - Format training time as H:MM:SS
    - _Requirements: 7.2_

  - [ ]* 14.3 Write property test for training time formatting
    - **Property 16: Training Time Formatting**
    - **Validates: Requirements 7.2**

  - [x] 14.4 Implement model size unit selection
    - Display size in appropriate units (bytes, KB, MB, GB)
    - _Requirements: 7.4_

  - [ ]* 14.5 Write property test for model size unit selection
    - **Property 17: Model Size Unit Selection**
    - **Validates: Requirements 7.4**

  - [x] 14.6 Implement best value highlighting
    - Highlight lowest (best) value in each efficiency column
    - Handle ties by highlighting all best values
    - _Requirements: 7.6_

  - [ ]* 14.7 Write property test for best value highlighting
    - **Property 18: Best Efficiency Value Highlighting**
    - **Validates: Requirements 7.6**

  - [x] 14.8 Implement N/A display for missing data
    - Display "N/A" for missing efficiency metrics
    - _Requirements: 7.7_

  - [x] 14.9 Implement loading skeleton and error state
    - Display skeleton loader while loading
    - Display error message with retry button on error
    - _Requirements: 13.1, 13.2_

- [x] 15. HyperparameterComparisonTable Integration
  - [x] 15.1 Implement hyperparameter table rendering
    - Render table with learning rate, batch size, epochs, optimizer rows
    - One column per model
    - _Requirements: 8.2_

  - [ ]* 15.2 Write property test for required hyperparameter fields
    - **Property 19: Hyperparameter Table Displays Required Fields**
    - **Validates: Requirements 8.2**

  - [x] 15.3 Implement difference highlighting
    - Highlight cells in rows where values differ between models
    - _Requirements: 8.3_

  - [ ]* 15.4 Write property test for difference highlighting
    - **Property 20: Hyperparameter Difference Highlighting**
    - **Validates: Requirements 8.3**

  - [x] 15.5 Implement custom hyperparameters display
    - Parse JSONB metadata for custom hyperparameters
    - Add additional rows for each unique custom parameter
    - _Requirements: 8.4_

  - [ ]* 15.6 Write property test for custom hyperparameters
    - **Property 21: Custom Hyperparameters Display**
    - **Validates: Requirements 8.4**

  - [x] 15.7 Implement dash display for missing values
    - Display "—" for hyperparameters not set
    - _Requirements: 8.5_

  - [x] 15.8 Implement loading skeleton and error state
    - Display skeleton loader while loading
    - Display error message with retry button on error
    - _Requirements: 13.1, 13.2_

- [x] 16. StatisticalTests Integration
  - [x] 16.1 Implement statistical tests results display
    - Render table with test name, model pair, p-value, significance columns
    - Display both paired t-test and McNemar test results
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 16.2 Implement significance indicator
    - Mark results as significant when p-value < 0.05
    - Display visual indicator (icon or color) for significance
    - _Requirements: 9.4_

  - [x] 16.3 Implement confidence interval display
    - Display 95% confidence intervals where applicable
    - _Requirements: 9.5_

  - [x] 16.4 Implement insufficient data message
    - Display message when insufficient data for statistical testing
    - _Requirements: 9.6_

  - [x] 16.5 Implement loading skeleton and error state
    - Display skeleton loader while loading
    - Display error message with retry button on error
    - _Requirements: 13.1, 13.2_

- [x] 17. ModelLineage Integration
  - [x] 17.1 Implement lineage display rendering
    - Render table/tree with parent model, experiment ID, timestamp, creator, notes
    - _Requirements: 10.2, 10.3, 10.4_

  - [ ]* 17.2 Write property test for lineage required information
    - **Property 24: Lineage Display Shows Required Information**
    - **Validates: Requirements 10.2, 10.3**

  - [x] 17.3 Implement dash display for no parent
    - Display "—" when model has no parent
    - _Requirements: 10.5_

  - [x] 17.4 Implement timezone conversion for timestamps
    - Convert UTC timestamps to user's local timezone
    - _Requirements: 10.6_

  - [ ]* 17.5 Write property test for timezone conversion
    - **Property 25: Timestamp Timezone Conversion**
    - **Validates: Requirements 10.6**

  - [x] 17.6 Implement loading skeleton and error state
    - Display skeleton loader while loading
    - Display error message with retry button on error
    - _Requirements: 13.1, 13.2_

- [x] 18. Checkpoint - Efficiency and Metadata Components
  - Ensure ModelEfficiencyTable, HyperparameterComparisonTable, StatisticalTests, and ModelLineage work correctly, ask the user if questions arise.

- [x] 19. ModelRecommendation Integration
  - [x] 19.1 Implement recommendation engine logic
    - Analyze all selected models' metrics
    - _Requirements: 11.1_

  - [x] 19.2 Implement best overall model recommendation
    - Rank by accuracy, then inference time, then model size
    - _Requirements: 11.2_

  - [ ]* 19.3 Write property test for best overall recommendation
    - **Property 26: Best Overall Model Recommendation**
    - **Validates: Requirements 11.2**

  - [x] 19.4 Implement edge/mobile deployment recommendation
    - Rank by model size, then inference time
    - _Requirements: 11.3_

  - [ ]* 19.5 Write property test for edge/mobile recommendation
    - **Property 27: Edge/Mobile Deployment Recommendation**
    - **Validates: Requirements 11.3**

  - [x] 19.6 Implement accuracy-critical recommendation
    - Rank by highest accuracy
    - _Requirements: 11.4_

  - [ ]* 19.7 Write property test for accuracy-critical recommendation
    - **Property 28: Accuracy-Critical Recommendation**
    - **Validates: Requirements 11.4**

  - [x] 19.8 Implement tradeoff explanations display
    - Display explanations for each recommendation
    - _Requirements: 11.5_

  - [x] 19.9 Implement recommendation updates on selection change
    - Update recommendations when model selection changes
    - _Requirements: 11.6_

- [x] 20. ExportService Implementation
  - [x] 20.1 Create ExportService structure
    - Create `src/services/exportService.ts` with class structure
    - Define ExportOptions and ExportResult interfaces
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 20.2 Implement exportToPDF function
    - Generate PDF document with all comparison tables and charts
    - Include model names, comparison date, user information
    - _Requirements: 12.1, 12.4_

  - [ ]* 20.3 Write property test for export metadata inclusion
    - **Property 29: Export Metadata Inclusion**
    - **Validates: Requirements 12.4**

  - [x] 20.4 Implement exportToCSV function
    - Generate CSV files for metrics, hyperparameters, predictions
    - Use headers matching table column names
    - _Requirements: 12.2_

  - [ ]* 20.5 Write property test for CSV export structure
    - **Property 30: CSV Export Structure**
    - **Validates: Requirements 12.2**

  - [x] 20.6 Implement exportCharts function
    - Generate PNG images of all chart components
    - _Requirements: 12.3_

- [x] 21. ModelComparisonExport Integration
  - [x] 21.1 Implement export UI with buttons
    - Add Export PDF, Export CSV, Export Charts buttons
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 21.2 Implement loading indicator during export
    - Display loading indicator while export in progress
    - Disable export buttons during export
    - _Requirements: 12.5_

  - [x] 21.3 Implement export error handling
    - Display error message on export failure
    - Provide retry option
    - _Requirements: 12.6_

- [x] 22. Checkpoint - Recommendations and Export
  - Ensure ModelRecommendation and Export functionality work correctly, ask the user if questions arise.

- [x] 23. Error Handling Infrastructure
  - [x] 23.1 Create ComparisonErrorBoundary component
    - Create error boundary wrapper for comparison components
    - Catch errors in child components
    - Display fallback UI with error message and retry option
    - _Requirements: 13.4_

  - [ ]* 23.2 Write property test for error boundary isolation
    - **Property 33: Error Boundary Isolation**
    - **Validates: Requirements 13.4**

  - [x] 23.3 Implement retry logic with exponential backoff
    - Create withRetry utility function
    - Implement exponential backoff with max 3 retries
    - _Requirements: 13.2, 13.5_

  - [x] 23.4 Create skeleton loader components
    - Create reusable skeleton loaders for each component type
    - _Requirements: 13.1_

  - [ ]* 23.5 Write property test for loading state skeleton display
    - **Property 31: Loading State Skeleton Display**
    - **Validates: Requirements 13.1**

  - [ ]* 23.6 Write property test for error state with retry
    - **Property 32: Error State Display with Retry**
    - **Validates: Requirements 13.2**

  - [x] 23.7 Wrap all comparison components with error boundaries
    - Apply ComparisonErrorBoundary to each component in dashboard
    - _Requirements: 13.4_

- [x] 24. Real-time Data Synchronization
  - [x] 24.1 Implement Supabase realtime subscription
    - Subscribe to model_versions table changes for current user
    - Detect INSERT, UPDATE, DELETE events
    - _Requirements: 14.1_

  - [x] 24.2 Implement new data notification
    - Display notification when new model data detected
    - Offer option to refresh model list
    - _Requirements: 14.2_

  - [x] 24.3 Implement manual refresh button
    - Add refresh button to reload all model data
    - _Requirements: 14.3_

  - [x] 24.4 Implement selection persistence on refresh
    - Maintain selected models after refresh if they still exist
    - Remove non-existent models from selection
    - _Requirements: 14.4_

  - [ ]* 24.5 Write property test for selection persistence
    - **Property 34: Model Selection Persistence Across Refresh**
    - **Validates: Requirements 14.4**

- [x] 25. Dashboard Integration
  - [x] 25.1 Update ModelComparisonDashboard to use ComparisonService
    - Replace mock data with real Supabase queries
    - Wire up all components with data from service
    - _Requirements: 3.1, 3.2_

  - [x] 25.2 Implement empty state for no models
    - Display message when no trained models exist
    - Add link to training page
    - _Requirements: 3.3_

  - [ ]* 25.3 Write property test for model dropdown display
    - **Property 4: Model Selection Dropdown Displays Required Fields**
    - **Validates: Requirements 3.2**

  - [x] 25.4 Connect all comparison components to dashboard state
    - Pass data, loading, error, onRetry props to all components
    - _Requirements: 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1_

  - [x] 25.5 Implement connection error handling
    - Display connection error message when Supabase connection fails
    - _Requirements: 13.3_

- [x] 26. Final Checkpoint - Complete Integration
  - Ensure all components work together, all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with React and Supabase
- fast-check library is used for property-based testing
