# Requirements Document

## Introduction

This document specifies the requirements for enhancing the Model Comparison Dashboard feature. The dashboard currently exists with nine comparison components that use placeholder/mock data. This enhancement will integrate the dashboard with real backend data from Supabase, make all comparison components fully functional, and add missing comparison capabilities to provide a complete model comparison experience for machine learning practitioners.

## Glossary

- **Dashboard**: The Model Comparison Dashboard page (`ModelComparisonDashboard.tsx`) that orchestrates all comparison components
- **Model_Version**: A trained model instance stored in the `model_versions` table with associated metrics and metadata
- **Training_Session**: A record in the `training_sessions` table containing training progress, metrics, and epoch-by-epoch data
- **Test_Result**: A record in the `test_results` table containing predictions, confusion matrices, and test accuracy
- **Comparison_Service**: The service layer responsible for fetching and aggregating model data from Supabase
- **Training_Curve**: Time-series data showing loss and accuracy values across training epochs
- **Confusion_Matrix**: A matrix showing predicted vs actual class labels for classification models
- **Statistical_Test**: A significance test (t-test, McNemar) comparing performance between model pairs
- **Export_Service**: The service responsible for generating PDF, CSV, and chart image exports

## Requirements

### Requirement 1: Model Data Service Layer

**User Story:** As a developer, I want a centralized service layer for fetching model comparison data, so that all components can access real backend data consistently.

#### Acceptance Criteria

1. THE Comparison_Service SHALL provide a `fetchModels` function that retrieves all Model_Version records for the current user's projects from Supabase
2. THE Comparison_Service SHALL provide a `fetchTrainingCurves` function that retrieves epoch-by-epoch training metrics for specified model IDs
3. THE Comparison_Service SHALL provide a `fetchConfusionMatrices` function that retrieves Test_Result confusion matrix data for specified model IDs
4. THE Comparison_Service SHALL provide a `fetchPredictions` function that retrieves sample-level predictions from Test_Result records
5. THE Comparison_Service SHALL provide a `fetchEfficiencyMetrics` function that retrieves training time, inference time, and model size data
6. THE Comparison_Service SHALL provide a `fetchHyperparameters` function that retrieves training configuration (epochs, batch_size, learning_rate) for specified models
7. WHEN a fetch function encounters an error, THE Comparison_Service SHALL return a structured error object with error code and message
8. THE Comparison_Service SHALL cache fetched data in memory to avoid redundant API calls within the same session

### Requirement 2: Database Schema Extension

**User Story:** As a system administrator, I want the database schema to support all model comparison data, so that the dashboard can display comprehensive comparison information.

#### Acceptance Criteria

1. THE Database SHALL include a `training_curves` table storing epoch-by-epoch loss and accuracy values linked to Training_Session
2. THE Database SHALL include `training_time_seconds`, `inference_time_ms`, and `model_size_bytes` columns in the Model_Version table
3. THE Database SHALL include a `model_lineage` table storing parent-child relationships between Model_Version records
4. THE Database SHALL include an `experiment_id` column in the Model_Version table for experiment tracking
5. THE Database SHALL enforce referential integrity between Model_Version, Training_Session, and Test_Result tables
6. THE Database SHALL include appropriate indexes on foreign key columns for query performance

### Requirement 3: Model Selection Integration

**User Story:** As a user, I want to select models from my actual projects for comparison, so that I can analyze my real trained models.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL fetch all available Model_Version records for the current user from Supabase
2. THE Dashboard SHALL display model names, version numbers, and creation dates in the selection dropdown
3. WHEN no models are available, THE Dashboard SHALL display a message indicating no trained models exist with a link to the training page
4. WHEN the user selects models, THE Dashboard SHALL store selected model IDs in component state
5. THE Dashboard SHALL allow selection of 2 to 10 models for comparison
6. WHEN fewer than 2 models are selected, THE Dashboard SHALL disable the Compare button

### Requirement 4: Training Curves Overlay Integration

**User Story:** As a user, I want to see real training curves for my selected models, so that I can compare their learning progression.

#### Acceptance Criteria

1. WHEN comparison is initiated, THE TrainingCurvesOverlay SHALL fetch training curve data from Supabase via Comparison_Service
2. THE TrainingCurvesOverlay SHALL display training loss and validation loss curves for each selected model
3. THE TrainingCurvesOverlay SHALL display training accuracy and validation accuracy curves for each selected model
4. THE TrainingCurvesOverlay SHALL assign distinct colors to each model's curves for visual differentiation
5. WHEN a model has no training curve data, THE TrainingCurvesOverlay SHALL display a placeholder message for that model
6. THE TrainingCurvesOverlay SHALL support interactive legend toggling to show/hide individual model curves
7. WHILE data is loading, THE TrainingCurvesOverlay SHALL display a loading skeleton

### Requirement 5: Confusion Matrix Comparison Integration

**User Story:** As a user, I want to compare confusion matrices from my real test results, so that I can understand classification performance differences.

#### Acceptance Criteria

1. WHEN comparison is initiated, THE ConfusionMatrixComparison SHALL fetch confusion matrix data from Test_Result records via Comparison_Service
2. THE ConfusionMatrixComparison SHALL display side-by-side confusion matrices for each selected model
3. WHEN exactly two models are selected, THE ConfusionMatrixComparison SHALL display a difference heatmap showing cell-by-cell differences
4. THE ConfusionMatrixComparison SHALL use consistent class labels across all displayed matrices
5. WHEN a model has no confusion matrix data, THE ConfusionMatrixComparison SHALL display a message indicating no test results available
6. THE ConfusionMatrixComparison SHALL apply color intensity based on cell values for visual interpretation

### Requirement 6: Prediction Analysis Integration

**User Story:** As a user, I want to analyze individual predictions across models, so that I can identify where models disagree.

#### Acceptance Criteria

1. WHEN comparison is initiated, THE PredictionAnalysis SHALL fetch sample-level predictions from Test_Result records via Comparison_Service
2. THE PredictionAnalysis SHALL display a table showing sample ID, true label, and each model's prediction
3. THE PredictionAnalysis SHALL highlight rows where models disagree on predictions
4. THE PredictionAnalysis SHALL compute and display ensemble voting results using majority vote
5. THE PredictionAnalysis SHALL color-code predictions as correct (green), incorrect (red), or matching ensemble (blue)
6. THE PredictionAnalysis SHALL support pagination for datasets with more than 50 samples
7. WHEN no prediction data is available, THE PredictionAnalysis SHALL display a message indicating no test predictions exist

### Requirement 7: Model Efficiency Table Integration

**User Story:** As a user, I want to compare computational efficiency metrics, so that I can make deployment decisions based on resource constraints.

#### Acceptance Criteria

1. WHEN comparison is initiated, THE ModelEfficiencyTable SHALL fetch efficiency metrics from Model_Version records via Comparison_Service
2. THE ModelEfficiencyTable SHALL display training time in human-readable format (hours:minutes:seconds)
3. THE ModelEfficiencyTable SHALL display inference time in milliseconds
4. THE ModelEfficiencyTable SHALL display model size in appropriate units (KB, MB, GB)
5. THE ModelEfficiencyTable SHALL display FLOPs count if available in the model metadata
6. THE ModelEfficiencyTable SHALL highlight the best (lowest) value in each efficiency column
7. WHEN efficiency data is missing for a model, THE ModelEfficiencyTable SHALL display "N/A" for that cell

### Requirement 8: Hyperparameter Comparison Integration

**User Story:** As a user, I want to compare hyperparameters across models, so that I can understand configuration differences.

#### Acceptance Criteria

1. WHEN comparison is initiated, THE HyperparameterComparisonTable SHALL fetch hyperparameter data from Model_Version and Training_Session records
2. THE HyperparameterComparisonTable SHALL display learning rate, batch size, epochs, and optimizer for each model
3. THE HyperparameterComparisonTable SHALL highlight cells where values differ between models
4. THE HyperparameterComparisonTable SHALL support displaying custom hyperparameters stored in JSONB metadata
5. WHEN a hyperparameter is not set for a model, THE HyperparameterComparisonTable SHALL display "—" for that cell

### Requirement 9: Statistical Tests Integration

**User Story:** As a user, I want to see statistical significance tests between model pairs, so that I can determine if performance differences are meaningful.

#### Acceptance Criteria

1. WHEN comparison is initiated with 2 or more models, THE StatisticalTests SHALL compute paired t-tests for accuracy differences
2. THE StatisticalTests SHALL compute McNemar tests for classification disagreement between model pairs
3. THE StatisticalTests SHALL display p-values with 3 decimal precision
4. THE StatisticalTests SHALL indicate statistical significance when p-value is less than 0.05
5. THE StatisticalTests SHALL display 95% confidence intervals for accuracy differences where applicable
6. WHEN insufficient data exists for statistical testing, THE StatisticalTests SHALL display a message explaining the data requirements

### Requirement 10: Model Lineage Integration

**User Story:** As a user, I want to see model lineage and experiment tracking information, so that I can understand model evolution.

#### Acceptance Criteria

1. WHEN comparison is initiated, THE ModelLineage SHALL fetch lineage data from the model_lineage table via Comparison_Service
2. THE ModelLineage SHALL display parent model relationships for each selected model
3. THE ModelLineage SHALL display experiment ID, creation timestamp, and creator information
4. THE ModelLineage SHALL display notes and change descriptions from previous versions
5. WHEN a model has no parent, THE ModelLineage SHALL display "—" in the parent column
6. THE ModelLineage SHALL format timestamps in the user's local timezone

### Requirement 11: Model Recommendation Engine

**User Story:** As a user, I want intelligent recommendations for model selection, so that I can choose the best model for my use case.

#### Acceptance Criteria

1. WHEN comparison is initiated, THE ModelRecommendation SHALL analyze all selected models' metrics
2. THE ModelRecommendation SHALL identify the best overall model based on accuracy, then inference time, then model size
3. THE ModelRecommendation SHALL identify the best model for edge/mobile deployment based on model size and inference time
4. THE ModelRecommendation SHALL identify the best model for accuracy-critical applications
5. THE ModelRecommendation SHALL display tradeoff explanations for each recommendation
6. THE ModelRecommendation SHALL update recommendations when model selection changes

### Requirement 12: Export Functionality

**User Story:** As a user, I want to export comparison reports, so that I can share findings with stakeholders.

#### Acceptance Criteria

1. WHEN the user clicks Export PDF, THE Export_Service SHALL generate a PDF document containing all comparison tables and charts
2. WHEN the user clicks Export CSV, THE Export_Service SHALL generate CSV files for metrics tables, hyperparameters, and predictions
3. WHEN the user clicks Export Charts, THE Export_Service SHALL generate PNG images of all chart components
4. THE Export_Service SHALL include model names, comparison date, and user information in exported documents
5. WHILE export is in progress, THE ModelComparisonExport SHALL display a loading indicator and disable export buttons
6. WHEN export fails, THE ModelComparisonExport SHALL display an error message with retry option

### Requirement 13: Error Handling and Loading States

**User Story:** As a user, I want clear feedback during data loading and errors, so that I understand the system state.

#### Acceptance Criteria

1. WHILE data is being fetched, THE Dashboard SHALL display skeleton loaders in each comparison component
2. WHEN a component fails to load data, THE Dashboard SHALL display an error message with a retry button
3. WHEN the Supabase connection fails, THE Dashboard SHALL display a connection error message
4. THE Dashboard SHALL implement error boundaries to prevent component failures from crashing the entire page
5. WHEN retrying after an error, THE Dashboard SHALL clear the previous error state before fetching

### Requirement 14: Real-time Data Synchronization

**User Story:** As a user, I want the dashboard to reflect the latest model data, so that I see up-to-date comparisons.

#### Acceptance Criteria

1. WHEN a new model version is created in another tab, THE Dashboard SHALL detect the change via Supabase realtime subscription
2. WHEN new model data is detected, THE Dashboard SHALL display a notification offering to refresh the model list
3. THE Dashboard SHALL provide a manual refresh button to reload all model data
4. WHEN the user refreshes, THE Dashboard SHALL maintain the current model selection if those models still exist
