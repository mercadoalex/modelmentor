# Guided Tour & Dataset Fix — Implementation Tasks

## Task 1: Bug Condition Exploration Tests

Write exploratory tests to confirm the bug conditions exist on unfixed code. These tests should FAIL on the current codebase, demonstrating the bugs are real.

- [x] 1.1 Create test file `src/__tests__/guided-tour-bugs.test.tsx` with test setup and imports
- [x] 1.2 Write test: "Tour target selectors return null" — render ProjectCreationPage and verify `[data-tour="create-project-button"]` returns null
- [x] 1.3 Write test: "Guided tour stalls on empty samples" — mock `sampleDatasetService.list()` returning `[]` with `is_guided_tour: true`, verify no fallback UI shown
- [x] 1.4 Write test: "Template button enabled for non-generatable templates" — render DatasetTemplatesPanel with `image_classification`, verify button is NOT disabled
- [x] 1.5 Run tests and document counterexamples confirming bug conditions

**Validates**: Bug Condition Derivation (bugfix.md), Exploratory Bug Condition Checking (design.md)

---

## Task 2: Add data-tour Attributes to ProjectCreationPage

Add the missing `data-tour` attributes to ProjectCreationPage so the tour can find its targets.

- [x] 2.1 Read `src/data/tutorials.ts` to identify all tour selectors referencing ProjectCreationPage elements
- [x] 2.2 Add `data-tour="project-title"` to the project title input/textarea
- [x] 2.3 Add `data-tour="model-type"` to the model type selection/display section
- [x] 2.4 Add `data-tour="project-description"` to the description textarea
- [x] 2.5 Add `data-tour="create-project-button"` to the "Start Guided Tour" button
- [x] 2.6 Add `data-tour="create-button"` to the "Start with My Data" button if referenced

**Validates**: Property 1 (Tour Targets Exist in DOM), Requirement 2.1

---

## Task 3: Add data-tour Attributes to DataCollectionPage

Add the missing `data-tour` attributes to DataCollectionPage elements.

- [x] 3.1 Add `data-tour="upload-area"` to the dropzone/file upload container
- [x] 3.2 Add `data-tour="data-preview"` to the data preview table section
- [x] 3.3 Add `data-tour="column-mapping"` to the feature/target column selection area
- [x] 3.4 Add `data-tour="continue-button"` to the "Continue to Learning" button

**Validates**: Property 1 (Tour Targets Exist in DOM), Requirement 2.1

---

## Task 4: Add Fallback Logic for Empty Sample Datasets

Implement fallback UI when guided tour mode is active but no sample datasets are available.

- [x] 4.1 Add state variables: `sampleLoadError: string | null`, `sampleLoadEmpty: boolean`
- [x] 4.2 Wrap `sampleDatasetService.list()` call in try/catch in `loadProject()`
- [x] 4.3 Set `sampleLoadEmpty = true` when samples array is empty in guided tour mode
- [x] 4.4 Create fallback UI component showing "No pre-made dataset available for this project type"
- [x] 4.5 Show DatasetTemplatesPanel prominently when fallback is active
- [x] 4.6 Update guided tour banner text to reflect fallback state (e.g., "Select a template dataset below")

**Validates**: Property 2 (Guided Tour Fallback on Empty Datasets), Requirements 2.2, 2.4

---

## Task 5: Add Error Handling and Retry Mechanism

Implement error handling with retry capability for guided tour operations.

- [x] 5.1 Add state variable: `retryCount: number` initialized to 0
- [x] 5.2 Catch errors from `sampleDatasetService.list()` and set `sampleLoadError` with user-friendly message
- [x] 5.3 Create `retryLoadSamples()` function that clears error state and re-invokes `loadProject()`
- [x] 5.4 Show retry button in error UI when in guided tour mode
- [x] 5.5 Update `handleContinue` catch block to show specific error with retry option in guided tour mode
- [x] 5.6 Keep guided tour banner visible after errors (don't hide it on failure)

**Validates**: Property 3 (Error Handling with Retry), Requirements 2.3, 2.4

---

## Task 6: Disable "Use This Dataset" Button for Non-Generatable Templates

Fix DatasetTemplatesPanel to disable the button for templates that cannot generate data.

- [x] 6.1 Read `src/components/data/DatasetTemplatesPanel.tsx` to understand current button logic
- [x] 6.2 Add `disabled` condition: `isLoading || template.rows === 0`
- [x] 6.3 Add "Upload Required" badge/label for templates with `rows === 0`
- [x] 6.4 Keep existing toast as secondary feedback (button disabled is primary indicator)
- [x] 6.5 Update button styling to show disabled state clearly

**Validates**: Property 4 (Template Button Disabled for Non-Generatable Templates), Requirement 2.5

---

## Task 7: Add data-tour Attributes to Remaining Pages

Add `data-tour` attributes to Dashboard, Training, and Testing pages for complete tour coverage.

- [x] 7.1 Read `src/data/tutorials.ts` to identify all remaining tour selectors
- [x] 7.2 Add attributes to Dashboard: `projects-list`, `stats-cards`, `recent-activity`, `help-menu`
- [x] 7.3 Add attributes to Training page: `training-config`, `start-training`, `training-metrics`, `training-logs`, `training-chart`
- [x] 7.4 Add attributes to Testing page: `test-tabs`, `test-input`, `prediction-results`, `confusion-matrix`, `export-results`

**Validates**: Property 1 (Tour Targets Exist in DOM), Requirement 2.1

---

## Task 8: Fix Verification Tests

Write tests to verify the fixes work correctly for all bug conditions.

- [x] 8.1 Write test: "Tour targets exist after fix" — render each page and verify all `[data-tour="..."]` selectors return non-null elements
- [x] 8.2 Write test: "Fallback UI shown for empty samples in guided tour" — verify fallback message and template panel appear
- [x] 8.3 Write test: "Error handling shows retry button" — mock service error, verify error message and retry button appear
- [x] 8.4 Write test: "Template button disabled for rows === 0" — verify button is disabled and "Upload Required" label shown
- [x] 8.5 Write test: "Retry mechanism works" — click retry, verify service is called again

**Validates**: Fix Checking (design.md), All Properties

---

## Task 9: Preservation Tests

Write tests to ensure existing functionality is not broken by the fixes.

- [x] 9.1 Write test: "Non-guided-tour flow unchanged" — create project with `is_guided_tour: false`, verify no auto-advance or fallback UI
- [x] 9.2 Write test: "Manual CSV upload still works" — drag-and-drop CSV, verify parsing and preview work correctly
- [x] 9.3 Write test: "Template generation for rows > 0 still works" — click "Use This Dataset" for classification template, verify data generated
- [x] 9.4 Write test: "Tour skip/close still works" — click Skip button, verify tour dismissed
- [x] 9.5 Write test: "Manual continue still works" — click "Continue to Learning" with valid data, verify navigation

**Validates**: Property 5 (Preservation), Requirements 3.1-3.5

---

## Task 10: Integration Testing and Cleanup

End-to-end testing and final cleanup.

- [x] 10.1 Manual test: Complete guided tour flow with fallback (no sample datasets)
- [x] 10.2 Manual test: Complete guided tour flow with error recovery (simulate network error)
- [x] 10.3 Manual test: Verify tour highlighting works on all pages with data-tour attributes
- [x] 10.4 Manual test: Verify "Use This Dataset" button states for all template types
- [x] 10.5 Run full test suite and verify no regressions
- [x] 10.6 Update `## Roadmap_Tasks.md` to mark items as complete
