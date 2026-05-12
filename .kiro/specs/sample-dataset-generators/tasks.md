# Implementation Plan: Sample Dataset Generators

## Overview

This implementation plan creates a comprehensive synthetic dataset generation system for ModelMentor, ensuring guided tours can complete end-to-end without depending on external Supabase data. The implementation follows a bottom-up approach: first building the core generator service with deterministic seeding, then bundled images, then updating UI components, and finally integrating the fallback system.

**Implementation Language:** TypeScript (matching existing codebase patterns)

## Tasks

- [x] 1. Create core generator service infrastructure
  - [x] 1.1 Create `src/services/syntheticDatasetGeneratorService.ts` with types and SeededRandom class
    - Define `GeneratedDataset`, `GeneratorOptions`, `ImageDatasetRow`, `ImageGeneratedDataset` interfaces
    - Implement `SeededRandom` class with linear congruential generator algorithm
    - Export `UnsupportedModelTypeError` and `InvalidOptionsError` custom error classes
    - _Requirements: 6.1, 6.2, 6.5, 8.1, 8.2_

  - [ ]* 1.2 Write property test for deterministic seeding (Property 18)
    - **Property 18: Deterministic Seeding**
    - Test that same seed produces identical output for all generator types
    - Use fast-check with integer arbitrary for seed values
    - **Validates: Requirements 6.5**

  - [x] 1.3 Implement `generateTextClassification()` generator function
    - Generate datasets with `review_text` and `sentiment` columns
    - Include at least 50 unique positive and 50 unique negative phrase templates
    - Use SeededRandom for deterministic phrase selection and variation
    - Default to 100 rows with balanced class distribution
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.4 Write property tests for text classification generator (Properties 1-4)
    - **Property 1: Tabular Generators Produce Minimum Row Count** - verify >= 100 rows
    - **Property 2: Text Classification Structure Correctness** - verify 2 columns, non-empty text
    - **Property 3: Text Classification Balanced Class Distribution** - verify class counts differ by <= 10%
    - **Property 4: Text Classification Phrase Variety** - verify >= 20% unique text values
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

  - [x] 1.5 Implement `generateClassification()` generator function
    - Generate Iris-like datasets with numeric features and categorical output
    - Create class-separable data with distinct but overlapping feature distributions
    - Use SeededRandom for deterministic value generation within class-specific ranges
    - Default to 150 rows with 3 classes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 1.6 Write property tests for numeric classification generator (Properties 5-6)
    - **Property 5: Numeric Classification Structure Correctness** - verify numeric features, categorical output
    - **Property 6: Numeric Classification Class Separability** - verify distinct centroids with overlapping ranges
    - **Validates: Requirements 2.1, 2.4**

  - [x] 1.7 Implement `generateRegression()` generator function
    - Generate house-price-like datasets with numeric features and numeric target
    - Create linear relationships with configurable noise
    - Use SeededRandom for deterministic feature and noise generation
    - Default to 200 rows
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 1.8 Write property tests for regression generator (Properties 7-9)
    - **Property 7: Regression Structure Correctness** - verify all columns are numeric
    - **Property 8: Regression Feature-Target Correlation** - verify Pearson correlation > 0.3
    - **Property 9: Regression Noise Presence** - verify non-zero residual standard deviation
    - **Validates: Requirements 3.1, 3.3, 3.4**

- [x] 2. Checkpoint - Core generators complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create bundled images module and image classification generator
  - [x] 3.1 Create `src/data/bundledImages.ts` with base64-encoded shape images
    - Generate simple geometric shapes (circles, squares, triangles) as SVG converted to base64 PNG
    - Include at least 10 images per class (30 total minimum)
    - Each image must be under 50KB
    - Export `BUNDLED_IMAGES` record with `shapes` dataset
    - _Requirements: 4.3, 4.5, 4.6, 8.3_

  - [x] 3.2 Implement `generateImageClassification()` generator function
    - Return `ImageGeneratedDataset` with images from bundled images module
    - Use SeededRandom for deterministic image selection order
    - Default to 20 images (minimum 10 per class for 2 classes)
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

  - [ ]* 3.3 Write property tests for image classification generator (Properties 10-14)
    - **Property 10: Image Classification Structure Correctness** - verify valid data URI, non-empty label/filename
    - **Property 11: Image Classification Minimum Count** - verify >= 20 images
    - **Property 12: Image Classification Data URI Format** - verify base64 data URIs (not URLs)
    - **Property 13: Image Classification Size Constraint** - verify each image < 50KB
    - **Property 14: Image Classification Class Distribution** - verify >= 2 classes, >= 10 images per class
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6, 8.3**

- [x] 4. Implement unified service interface
  - [x] 4.1 Implement `generateForModelType()` method
    - Route to appropriate generator based on ModelType
    - Pass through GeneratorOptions to individual generators
    - Throw `UnsupportedModelTypeError` for unknown model types
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 4.2 Implement `getGeneratorForModelType()` method
    - Return the appropriate generator function for a model type
    - Throw `UnsupportedModelTypeError` for unknown model types
    - _Requirements: 6.3, 6.4_

  - [x] 4.3 Implement `isModelTypeSupported()` method
    - Return true for text_classification, classification, regression, image_classification
    - Return false for any other model type
    - _Requirements: 6.4_

  - [ ]* 4.4 Write property tests for unified interface (Properties 16-17, 21)
    - **Property 16: Unified Interface Consistency** - verify tabular generators return `{ headers, rows }` structure
    - **Property 17: getGeneratorForModelType Returns Correct Generator** - verify returned function produces correct dataset type
    - **Property 21: Synchronous Generation** - verify return value is not a Promise
    - **Validates: Requirements 6.1, 6.2, 6.3, 8.2**

- [x] 5. Checkpoint - Generator service complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update DatasetTemplatesPanel for image classification support
  - [x] 6.1 Add `ImageDatasetTemplate` interface and image template handling
    - Extend `DatasetTemplate` interface with optional `bundledImages` flag
    - Add `onLoadImageDataset` optional prop to `DatasetTemplatesPanelProps`
    - Import bundled images from `src/data/bundledImages.ts`
    - _Requirements: 7.2, 7.3_

  - [x] 6.2 Add image classification templates with bundled images
    - Create "Shapes Classification" template using bundled geometric shapes
    - Set `rows` to actual image count (not 0)
    - Add `bundledImages: true` flag to distinguish from external data
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 6.3 Update `handleLoad` to support image datasets
    - Detect image classification templates by modelType
    - Call `onLoadImageDataset` callback with `ImageDatasetRow[]` for image templates
    - Show success toast with image count
    - _Requirements: 7.4, 7.5_

  - [x] 6.4 Add visual indicators for bundled vs external data sources
    - Add "Bundled" badge for templates with `bundledImages: true`
    - Add "Network Required" badge for templates that need connectivity
    - Update "Upload Required" badge to only show for templates without bundled images
    - _Requirements: 7.3, 8.5_

  - [ ]* 6.5 Write property tests for DatasetTemplatesPanel (Properties 19-20)
    - **Property 19: Templates Exist for All Model Types** - verify at least one template with rows > 0 per model type
    - **Property 20: Button Enabled for Valid Templates** - verify "Use This Dataset" enabled when rows > 0 or bundled images exist
    - **Validates: Requirements 7.1, 7.4**

- [x] 7. Update DataCollectionPage for fallback integration
  - [x] 7.1 Add synthetic fallback state and detection logic
    - Add `usingSyntheticFallback` state variable
    - Detect fallback condition when `sampleLoadError` or `sampleLoadEmpty` in guided tour mode
    - Set fallback state when conditions are met
    - _Requirements: 5.1, 5.2_

  - [x] 7.2 Implement `autoSelectSyntheticTemplate()` function
    - Import generator service
    - Generate appropriate dataset based on project's model type
    - Inject generated data into component state (csvData, validation, uploadedFiles)
    - _Requirements: 5.4, 5.5_

  - [x] 7.3 Add `onLoadImageDataset` handler for image classification
    - Accept `ImageDatasetRow[]` from DatasetTemplatesPanel
    - Convert to format compatible with existing image upload flow
    - Update state to reflect loaded images
    - _Requirements: 4.4, 7.2_

  - [x] 7.4 Update fallback UI messaging
    - Show informational alert when using synthetic fallback
    - Explain that built-in sample data is being used
    - Maintain auto-advance behavior (2 second delay) after auto-selection
    - _Requirements: 5.3, 5.5_

  - [ ]* 7.5 Write property test for fallback auto-selection (Property 15)
    - **Property 15: Fallback Auto-Selection Model Type Match** - verify auto-selected template matches project model type
    - **Validates: Requirements 5.4**

- [x] 8. Checkpoint - UI integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Integration testing and error handling
  - [x] 9.1 Add error handling for generator failures
    - Wrap generator calls in try-catch in DataCollectionPage
    - Show user-friendly toast messages on failure
    - Log errors to console for debugging
    - _Requirements: 5.2, 5.6_

  - [x] 9.2 Verify offline capability
    - Ensure no network calls in generator service
    - Verify bundled images work without network
    - Test DatasetTemplatesPanel renders correctly when offline
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ]* 9.3 Write integration tests for full guided tour flow
    - Test complete flow: load page → fallback triggered → synthetic data loaded → auto-advance
    - Test each model type completes guided tour with synthetic data
    - Verify no network calls during synthetic data generation
    - _Requirements: 5.6, 8.1_

- [x] 10. Final checkpoint - All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from design.md
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript throughout, matching the existing codebase
- fast-check library should be used for property-based testing (add as dev dependency if not present)
