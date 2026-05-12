# Guided Tour & Dataset Fix — Bugfix Design

## Overview

The ModelMentor application has five interconnected bugs affecting the Guided Tour and Example Dataset features. The InteractiveTour component references `[data-tour="..."]` CSS selectors that no component in the codebase actually renders, causing tour steps to never highlight their targets. The guided tour's auto-advance in DataCollectionPage depends on `sampleDatasetService.list()` returning data from Supabase, but silently stalls when the table is empty or the query fails. There is no error handling or retry mechanism when dataset operations fail during guided tour mode. Additionally, the DatasetTemplatesPanel's "Use This Dataset" button remains enabled for `image_classification` templates that cannot generate data, misleading users.

The fix strategy is:
1. Add `data-tour` attributes to all referenced UI components across pages
2. Add fallback logic when `sampleDatasetService.list()` returns empty or throws
3. Add error handling with retry capability in guided tour mode
4. Disable the "Use This Dataset" button for templates with `rows: 0`

## Glossary

- **Bug_Condition (C)**: The set of conditions that trigger the bugs — missing data-tour attributes, empty sample datasets in guided tour mode, unhandled errors, and enabled buttons for non-generatable templates
- **Property (P)**: The desired behavior — tour elements are found, fallback UI is shown, errors are caught with retry options, and non-generatable templates have disabled buttons
- **Preservation**: Existing non-guided-tour flows, manual CSV upload, template loading for generatable datasets, and tour skip/complete behavior must remain unchanged
- **InteractiveTour**: Component in `src/components/onboarding/InteractiveTour.tsx` that renders a step-by-step overlay tour using CSS selectors to find target elements
- **sampleDatasetService**: Service in `src/services/supabase.ts` that queries the `sample_datasets` Supabase table filtered by model type
- **DatasetTemplatesPanel**: Component in `src/components/data/DatasetTemplatesPanel.tsx` that renders synthetic dataset templates with a "Use This Dataset" button
- **DataCollectionPage**: Page in `src/pages/DataCollectionPage.tsx` that handles data upload, template loading, and guided tour auto-advance logic
- **Guided Tour Mode**: When `project.is_guided_tour === true`, the system auto-selects a sample dataset and auto-advances after 2 seconds

## Bug Details

### Bug Condition

The bugs manifest across five related scenarios in the guided tour and dataset template flows. The InteractiveTour component cannot find target elements because no components render `data-tour` attributes. The DataCollectionPage silently stalls when sample datasets are unavailable. Error handling is absent for guided tour operations. The DatasetTemplatesPanel enables buttons for templates that cannot generate data.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { context: 'tour_target' | 'guided_tour_dataset' | 'guided_tour_error' | 'template_button', step?: TourStep, project?: Project, samples?: SampleDataset[], template?: DatasetTemplate, error?: Error }
  OUTPUT: boolean

  IF input.context = 'tour_target' THEN
    RETURN document.querySelector(input.step.target) = NULL

  ELSE IF input.context = 'guided_tour_dataset' THEN
    RETURN input.project.is_guided_tour = true
           AND (input.samples.length = 0 OR input.samples = undefined)

  ELSE IF input.context = 'guided_tour_error' THEN
    RETURN input.project.is_guided_tour = true
           AND input.error != NULL
           AND noErrorHandlingExists(input.error)

  ELSE IF input.context = 'template_button' THEN
    RETURN input.template.rows = 0
           AND input.template.generateData() = []
           AND buttonIsEnabled(input.template)

  END IF
END FUNCTION
```

### Examples

- **Tour target missing**: The `dashboard-tour` step targets `[data-tour="create-project-button"]` but no element in the Dashboard or ProjectCreationPage has this attribute. The tooltip renders at center-screen with no element highlighted.
- **Empty sample datasets**: A new user starts a guided tour for an `image_classification` project. `sampleDatasetService.list('image_classification')` returns `[]` because no sample datasets exist for that type. The page shows the guided tour banner saying "Advancing automatically…" but nothing happens.
- **Service error**: Supabase is temporarily unavailable. `sampleDatasetService.list()` throws an error. The `loadProject()` function propagates the error, potentially leaving `project` as `null` and rendering the loading spinner indefinitely.
- **Template button enabled**: The `image-guide` template has `rows: 0` and `generateData()` returns `[]`. The "Use This Dataset" button appears clickable. Clicking it shows a toast but the button state is misleading.
- **Auto-advance failure**: During guided tour, `handleContinue()` fails on `storageService.uploadImage()`. A generic "Failed to save dataset" toast appears with no retry option, and the user is stuck.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Non-guided-tour project creation (`is_guided_tour: false`) must continue to work without auto-advance
- Manual CSV file upload via drag-and-drop must continue to parse, validate, and preview correctly
- DatasetTemplatesPanel "Use This Dataset" for templates with `rows > 0` must continue to generate data and call `onLoadDataset`
- InteractiveTour "Skip" and "X" buttons must continue to call `onSkip` and dismiss the overlay
- Manual "Continue to Learning" button click with valid data must continue to save and navigate
- Tour step navigation (Next/Back/Finish) must continue to work when targets are found

**Scope:**
All inputs that do NOT involve guided tour mode with missing data, missing tour targets, or zero-row templates should be completely unaffected by this fix. This includes:
- Standard project creation and data collection flows
- Template usage for classification, regression, and text_classification types
- Manual file uploads and data validation
- Non-tour page interactions

## Hypothesized Root Cause

Based on the bug analysis, the root causes are:

1. **Missing data-tour Attributes**: The tour step definitions in `src/data/tutorials.ts` reference selectors like `[data-tour="create-project-button"]`, `[data-tour="upload-area"]`, etc., but no component in the codebase renders these attributes. The tutorials data was written assuming components would be annotated, but the annotation step was never completed.

2. **No Fallback for Empty Sample Datasets**: `DataCollectionPage.loadProject()` calls `sampleDatasetService.list(modelType)` and only auto-selects if `samples.length > 0`. When samples are empty, no fallback UI is shown — the guided tour banner still displays "Advancing automatically…" but nothing happens, creating a dead end.

3. **Unhandled Service Errors**: `sampleDatasetService.list()` throws on Supabase errors (`if (error) throw error`). The `loadProject()` function in DataCollectionPage has no try/catch around this call, so errors propagate and can leave the page in a broken state with `project` remaining `null`.

4. **Missing Button Disabled State**: `DatasetTemplatesPanel.handleLoad()` checks `template.modelType === 'image_classification'` and shows a toast, but the button itself is never disabled. The `disabled` prop only checks `isLoading`, not whether the template can generate data.

5. **No Retry Mechanism**: The `handleContinue` catch block shows a generic toast and sets `loading = false`, but provides no retry button or specific guidance. In guided tour mode, the auto-advance timer has already fired and won't re-trigger.

## Correctness Properties

Property 1: Bug Condition - Tour Targets Exist in DOM

_For any_ tour step where the target selector references a `[data-tour="..."]` attribute, the corresponding component SHALL render that `data-tour` attribute on the appropriate DOM element, so that `document.querySelector(step.target)` returns a non-null element when the component is mounted.

**Validates: Requirements 2.1**

Property 2: Bug Condition - Guided Tour Fallback on Empty Datasets

_For any_ project in guided tour mode where `sampleDatasetService.list(modelType)` returns an empty array, the DataCollectionPage SHALL display a fallback message explaining no pre-made dataset is available and SHALL show the DatasetTemplatesPanel as an alternative, rather than silently stalling.

**Validates: Requirements 2.2, 2.4**

Property 3: Bug Condition - Error Handling with Retry

_For any_ error thrown during guided tour dataset operations (either from `sampleDatasetService.list()` or `handleContinue()`), the system SHALL catch the error, display a user-friendly message, and provide a retry mechanism, keeping the user informed of their guided tour status.

**Validates: Requirements 2.3, 2.4**

Property 4: Bug Condition - Template Button Disabled for Non-Generatable Templates

_For any_ dataset template where `rows === 0` and `generateData()` returns an empty array, the "Use This Dataset" button SHALL be disabled and a label SHALL indicate that manual upload is required.

**Validates: Requirements 2.5**

Property 5: Preservation - Non-Guided-Tour Flows Unchanged

_For any_ project where `is_guided_tour === false`, or any template where `rows > 0`, the fixed code SHALL produce exactly the same behavior as the original code, preserving manual upload flows, template data generation, and standard navigation.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/pages/ProjectCreationPage.tsx`

**Change 1: Add data-tour attributes to project creation elements**
- Add `data-tour="project-title"` to the project title/textarea area
- Add `data-tour="model-type"` to the model type display section
- Add `data-tour="project-description"` to the description textarea
- Add `data-tour="create-button"` to the create project buttons (Start Guided Tour / Start with My Data)
- Add `data-tour="create-project-button"` to the main CTA if applicable

**File**: `src/pages/DataCollectionPage.tsx`

**Change 2: Add data-tour attributes to data collection elements**
- Add `data-tour="upload-area"` to the dropzone container
- Add `data-tour="data-preview"` to the data preview section
- Add `data-tour="column-mapping"` to the feature selection area
- Add `data-tour="continue-button"` to the Continue to Learning button

**Change 3: Add fallback logic for empty sample datasets in guided tour mode**
- Wrap `sampleDatasetService.list()` call in try/catch
- Add state for `sampleLoadError` and `sampleLoadEmpty`
- When samples are empty in guided tour mode, show informational alert and display DatasetTemplatesPanel prominently
- Update the guided tour banner to reflect the fallback state

**Change 4: Add error handling and retry for guided tour operations**
- Add try/catch around `sampleDatasetService.list()` in `loadProject()`
- Add a `retryLoadSamples()` function
- In `handleContinue` catch block, show specific error message with retry button when in guided tour mode
- Keep guided tour banner visible after errors

**File**: `src/components/data/DatasetTemplatesPanel.tsx`

**Change 5: Disable button for non-generatable templates**
- Add `disabled` condition: `isLoading || template.rows === 0`
- Show "Upload Required" label/badge for templates with `rows === 0`
- Remove or keep the toast as secondary feedback (button disabled is primary)

**File**: Various pages referenced by tour steps (Dashboard, Training, Testing pages)

**Change 6: Add data-tour attributes to remaining referenced elements**
- Add `data-tour="projects-list"` to the projects list container
- Add `data-tour="stats-cards"` to the stats cards section
- Add `data-tour="recent-activity"` to the activity feed
- Add `data-tour="help-menu"` to the help menu trigger
- Add `data-tour="training-config"` to training configuration section
- Add `data-tour="start-training"` to the start training button
- Add `data-tour="training-metrics"` to the metrics display
- Add `data-tour="training-logs"` to the logs panel
- Add `data-tour="training-chart"` to the performance chart
- Add `data-tour="test-tabs"` to the testing tabs
- Add `data-tour="test-input"` to the test input area
- Add `data-tour="prediction-results"` to the prediction results
- Add `data-tour="confusion-matrix"` to the confusion matrix
- Add `data-tour="export-results"` to the export button/section

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that render components and check for data-tour attributes, simulate guided tour mode with empty datasets, trigger errors in service calls, and verify button states for zero-row templates. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Tour Target Test**: Render ProjectCreationPage and query for `[data-tour="create-project-button"]` — expect null on unfixed code (will fail on unfixed code)
2. **Empty Dataset Guided Tour Test**: Render DataCollectionPage with `is_guided_tour: true` and mock `sampleDatasetService.list()` returning `[]` — expect no fallback message shown (will fail on unfixed code)
3. **Service Error Test**: Render DataCollectionPage with `sampleDatasetService.list()` throwing an error — expect unhandled error propagation (will fail on unfixed code)
4. **Template Button State Test**: Render DatasetTemplatesPanel with `image_classification` model type — expect button enabled for image-guide template (will fail on unfixed code)

**Expected Counterexamples**:
- `document.querySelector('[data-tour="create-project-button"]')` returns null
- No fallback UI rendered when samples array is empty in guided tour mode
- Error propagates from `loadProject()` without being caught
- "Use This Dataset" button is not disabled for `rows: 0` templates

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL step IN tourSteps WHERE step.target matches '[data-tour="..."]' DO
  renderPage(step.pageContext)
  element := document.querySelector(step.target)
  ASSERT element ≠ NULL
END FOR

FOR ALL (project, samples) WHERE project.is_guided_tour = true AND samples = [] DO
  result := renderDataCollectionPage(project, samples)
  ASSERT result.showsFallbackMessage = true
  ASSERT result.showsTemplatePanel = true
END FOR

FOR ALL template WHERE template.rows = 0 DO
  result := renderDatasetTemplatesPanel(template)
  ASSERT result.buttonDisabled = true
  ASSERT result.showsUploadRequiredLabel = true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL (project, samples) WHERE NOT project.is_guided_tour DO
  ASSERT renderDataCollectionPage_original(project, samples) = renderDataCollectionPage_fixed(project, samples)
END FOR

FOR ALL template WHERE template.rows > 0 DO
  ASSERT handleLoad_original(template) = handleLoad_fixed(template)
END FOR

FOR ALL tourStep WHERE document.querySelector(tourStep.target) ≠ NULL DO
  ASSERT tourBehavior_original(tourStep) = tourBehavior_fixed(tourStep)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (various model types, template configurations, project states)
- It catches edge cases that manual unit tests might miss (e.g., unusual model type + guided tour combinations)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-guided-tour flows and generatable templates, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Non-Guided-Tour Preservation**: Verify that creating a project with `is_guided_tour: false` and navigating to DataCollectionPage works identically before and after fix
2. **Template Generation Preservation**: Verify that clicking "Use This Dataset" for templates with `rows > 0` generates data and calls `onLoadDataset` identically
3. **Manual Upload Preservation**: Verify that drag-and-drop CSV upload, parsing, and validation work identically
4. **Tour Navigation Preservation**: Verify that Skip/Back/Next/Finish buttons work identically when tour targets are found

### Unit Tests

- Test that all referenced `data-tour` selectors exist in rendered component output
- Test DataCollectionPage renders fallback UI when samples are empty in guided tour mode
- Test DataCollectionPage catches errors from `sampleDatasetService.list()` gracefully
- Test DatasetTemplatesPanel disables button for templates with `rows === 0`
- Test retry mechanism re-invokes `sampleDatasetService.list()` on user action
- Test guided tour banner remains visible after errors

### Property-Based Tests

- Generate random combinations of model types and guided tour states, verify fallback behavior is shown only when `is_guided_tour && samples.length === 0`
- Generate random template configurations, verify button is disabled if and only if `rows === 0`
- Generate random project states with `is_guided_tour: false`, verify no auto-advance or fallback UI appears
- Generate random error scenarios, verify errors are always caught and user-friendly messages are shown

### Integration Tests

- Test full guided tour flow: create project → navigate to DataCollectionPage → verify fallback when no samples → use template → continue
- Test error recovery flow: simulate Supabase error → verify error message → click retry → verify recovery
- Test tour step highlighting: render page with data-tour attributes → activate tour → verify tooltip positions correctly
- Test template button states across all model types: verify disabled only for `image_classification` guide template
