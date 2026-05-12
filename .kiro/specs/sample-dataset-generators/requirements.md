# Requirements Document

## Introduction

This feature provides synthetic sample dataset generators for all model types in the ModelMentor application, ensuring that guided tours can complete end-to-end without depending on external Supabase data. Currently, the `DatasetTemplatesPanel` has generators for some model types, but `image_classification` templates have `rows: 0` because images cannot be easily generated. The guided tour auto-advance depends on `sampleDatasetService.list()` returning data, which may be empty or unavailable. This feature creates a complete fallback system with built-in synthetic data generators for all model types.

## Glossary

- **Generator_Service**: A service module that provides synthetic dataset generation functions for all supported model types, operating entirely client-side without network calls.
- **Sample_Dataset**: A pre-defined dataset template containing synthetic data that can be used for training ML models in guided tours.
- **Guided_Tour**: An interactive walkthrough mode that guides users through the ML workflow steps, requiring sample data to function.
- **Model_Type**: One of the four supported ML project types: `text_classification`, `classification`, `regression`, or `image_classification`.
- **Fallback_System**: The mechanism that detects when Supabase sample datasets are unavailable and automatically provides synthetic alternatives.
- **Bundled_Image**: A small image encoded as base64 or referenced via public URL that is included directly in the application bundle for offline availability.
- **Data_Collection_Page**: The page component (`DataCollectionPage.tsx`) that handles dataset upload and selection during the ML workflow.
- **Dataset_Templates_Panel**: The UI component (`DatasetTemplatesPanel.tsx`) that displays available dataset templates and generates synthetic data.

## Requirements

### Requirement 1: Text Classification Generator

**User Story:** As a learner using a guided tour, I want synthetic text classification datasets to be available, so that I can complete the sentiment analysis or spam detection tutorial without needing external data.

#### Acceptance Criteria

1. THE Generator_Service SHALL provide a text classification generator that produces datasets with text input and category output columns
2. WHEN the text classification generator is invoked, THE Generator_Service SHALL return at least 100 rows of synthetic data
3. THE Generator_Service SHALL generate text classification data with balanced class distribution (approximately equal samples per class)
4. THE Generator_Service SHALL produce educational, realistic-looking text samples that demonstrate clear patterns for each category
5. WHEN generating sentiment analysis data, THE Generator_Service SHALL include varied positive and negative review phrases that avoid exact repetition

### Requirement 2: Numeric Classification Generator

**User Story:** As a learner using a guided tour, I want synthetic numeric classification datasets to be available, so that I can complete classification tutorials like Iris or Titanic without needing external data.

#### Acceptance Criteria

1. THE Generator_Service SHALL provide a numeric classification generator that produces datasets with numeric feature columns and a category output column
2. WHEN the numeric classification generator is invoked, THE Generator_Service SHALL return at least 100 rows of synthetic data
3. THE Generator_Service SHALL generate numeric features with realistic value ranges appropriate to the dataset domain
4. THE Generator_Service SHALL create class-separable data where different classes have distinct but overlapping feature distributions
5. FOR ALL generated numeric classification datasets, THE Generator_Service SHALL include correlation between features and target labels that enables model learning

### Requirement 3: Regression Generator

**User Story:** As a learner using a guided tour, I want synthetic regression datasets to be available, so that I can complete regression tutorials like house price prediction without needing external data.

#### Acceptance Criteria

1. THE Generator_Service SHALL provide a regression generator that produces datasets with numeric feature columns and a numeric output column
2. WHEN the regression generator is invoked, THE Generator_Service SHALL return at least 100 rows of synthetic data
3. THE Generator_Service SHALL generate regression data with realistic linear or polynomial relationships between features and target
4. THE Generator_Service SHALL include controlled noise in the target variable to simulate real-world data variance
5. FOR ALL generated regression datasets, THE Generator_Service SHALL produce features with realistic value ranges and units appropriate to the domain

### Requirement 4: Image Classification Generator

**User Story:** As a learner using a guided tour, I want image classification datasets to be available, so that I can complete image classification tutorials without needing to upload my own images.

#### Acceptance Criteria

1. THE Generator_Service SHALL provide an image classification generator that produces datasets with image references and category labels
2. WHEN the image classification generator is invoked, THE Generator_Service SHALL return at least 20 sample images across multiple classes
3. THE Generator_Service SHALL use bundled images that are immediately available without network calls
4. THE Generator_Service SHALL provide images in a format compatible with the existing image classification training pipeline
5. WHERE bundled images are used, THE Generator_Service SHALL include images that are small in file size (under 50KB each) to minimize bundle impact
6. THE Generator_Service SHALL provide at least 2 distinct classes with at least 10 images per class for meaningful training

### Requirement 5: Guided Tour Fallback Integration

**User Story:** As a learner in guided tour mode, I want the system to automatically use synthetic datasets when Supabase sample datasets are unavailable, so that my learning experience is never blocked by data availability issues.

#### Acceptance Criteria

1. WHEN the Data_Collection_Page loads in guided tour mode and `sampleDatasetService.list()` returns an empty array, THE Fallback_System SHALL automatically display synthetic dataset options from the Dataset_Templates_Panel
2. WHEN the Data_Collection_Page loads in guided tour mode and `sampleDatasetService.list()` throws an error, THE Fallback_System SHALL catch the error and display synthetic dataset options instead
3. WHEN synthetic datasets are used as fallback, THE Data_Collection_Page SHALL display an informational message explaining that built-in sample data is being used
4. THE Fallback_System SHALL auto-select an appropriate synthetic dataset based on the project's model type
5. WHEN a synthetic dataset is auto-selected in guided tour mode, THE Data_Collection_Page SHALL auto-advance to the next step after a brief delay (2 seconds)
6. IF the Fallback_System provides synthetic data, THEN THE guided tour SHALL be able to complete all subsequent steps (learning, training, testing) without additional fallback requirements

### Requirement 6: Generator API Consistency

**User Story:** As a developer, I want all generators to follow a consistent API, so that I can easily add new generators or modify existing ones.

#### Acceptance Criteria

1. THE Generator_Service SHALL expose a unified interface where each generator accepts a row count parameter and returns a consistent data structure
2. FOR ALL generators, THE Generator_Service SHALL return data in the format `{ headers: string[], rows: string[][] }` compatible with CSV parsing
3. THE Generator_Service SHALL provide a `getGeneratorForModelType(modelType: ModelType)` function that returns the appropriate generator
4. WHEN an unsupported model type is requested, THE Generator_Service SHALL throw a descriptive error indicating the model type is not supported
5. FOR ALL generators, THE Generator_Service SHALL be deterministic when given the same random seed (optional parameter for testing)

### Requirement 7: Dataset Template Enhancement

**User Story:** As a learner, I want the Dataset Templates Panel to show working templates for all model types, so that I can always find a suitable sample dataset regardless of my project type.

#### Acceptance Criteria

1. THE Dataset_Templates_Panel SHALL display at least one working template with `rows > 0` for each supported model type
2. WHEN an image classification template is selected, THE Dataset_Templates_Panel SHALL load bundled images instead of showing "Upload Required"
3. THE Dataset_Templates_Panel SHALL indicate which templates use bundled/synthetic data versus external data sources
4. FOR ALL templates with `rows > 0`, THE Dataset_Templates_Panel SHALL enable the "Use This Dataset" button
5. WHEN a template is loaded, THE Dataset_Templates_Panel SHALL display a success toast with the template name and row count

### Requirement 8: Offline Capability

**User Story:** As a learner with unreliable internet, I want sample datasets to work without network connectivity, so that I can continue learning even when offline.

#### Acceptance Criteria

1. THE Generator_Service SHALL operate entirely client-side without requiring any network calls
2. FOR ALL model types, THE Generator_Service SHALL generate data synchronously without async operations that could fail
3. WHERE bundled images are used for image classification, THE images SHALL be embedded in the application bundle or use data URIs
4. WHEN the application is offline, THE Dataset_Templates_Panel SHALL still display and load all synthetic dataset templates
5. IF a template requires network access, THEN THE Dataset_Templates_Panel SHALL clearly indicate this with a network-required badge
