# Bugfix Requirements Document

## Introduction

The ModelMentor application has multiple interconnected bugs affecting the Guided Tour and Example Dataset features. The primary issues are: (1) the InteractiveTour component references `[data-tour="..."]` CSS selectors that don't exist in any component markup, causing tour steps to never highlight or position correctly; (2) the guided tour's auto-advance in DataCollectionPage depends on `sample_datasets` being available from Supabase, but silently fails with no user feedback when the table is empty or the query fails; (3) the DatasetTemplatesPanel's "Use This Dataset" button works for generated synthetic data but there is no equivalent reliable mechanism for the guided tour flow which relies on a separate `sampleDatasetService`; and (4) there is no error handling, loading states, or user feedback when dataset operations fail.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the InteractiveTour component renders and attempts to find target elements using `[data-tour="..."]` CSS selectors THEN the system fails to locate any elements because no components in the codebase have `data-tour` attributes, resulting in `targetPosition` being null and the tour tooltip rendering at a fallback center position with no element highlighted

1.2 WHEN a user clicks "Start Guided Tour" on the ProjectCreationPage and the project is created with `is_guided_tour: true`, and the DataCollectionPage loads and calls `sampleDatasetService.list(modelType)` which returns an empty array THEN the system silently does nothing — no sample is pre-selected, no auto-advance occurs, and no message is shown to the user explaining why the tour is stalled

1.3 WHEN the guided tour auto-advance logic in DataCollectionPage fires (`project.is_guided_tour && samples.length > 0`) but the `handleContinue` function fails (e.g., Supabase storage upload error or dataset creation error) THEN the system shows a generic "Failed to save dataset" toast but provides no guidance on how to recover or retry, leaving the user stuck

1.4 WHEN a user is in guided tour mode and the `sampleDatasetService.list()` call throws an error THEN the system does not catch the error at the component level (it propagates from `loadProject`), potentially leaving the page in a broken state with no project data loaded

1.5 WHEN the DatasetTemplatesPanel's "Use This Dataset" button is clicked for an `image_classification` template (which has `rows: 0` and `generateData` returns `[]`) THEN the system shows a toast message "For image classification, upload images organised by folder" but the button remains enabled and appears clickable, misleading users into thinking it should load data

### Expected Behavior (Correct)

2.1 WHEN the InteractiveTour component renders tour steps THEN the system SHALL find the target elements because all referenced UI components have the corresponding `data-tour` attributes in their markup, and the tour tooltip SHALL position correctly relative to the highlighted element

2.2 WHEN a user is in guided tour mode and `sampleDatasetService.list(modelType)` returns an empty array or no sample datasets are available THEN the system SHALL display a clear informational message explaining that no pre-made dataset is available for this project type, and SHALL fall back to showing the DatasetTemplatesPanel with a prompt to use a synthetic template dataset instead

2.3 WHEN the guided tour auto-advance logic fails during `handleContinue` THEN the system SHALL display a specific error message explaining what went wrong, provide a retry button, and keep the guided tour banner visible so the user understands they are still in tour mode

2.4 WHEN `sampleDatasetService.list()` throws an error during guided tour mode THEN the system SHALL catch the error gracefully, display a user-friendly error message, and fall back to allowing manual dataset selection or template usage

2.5 WHEN the DatasetTemplatesPanel renders a template that cannot generate data (e.g., `image_classification` with `rows: 0`) THEN the system SHALL disable the "Use This Dataset" button for that template and display a clear label indicating that manual upload is required for this project type

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user clicks "Start with My Data" (non-guided-tour mode) on the ProjectCreationPage THEN the system SHALL CONTINUE TO create the project with `is_guided_tour: false` and navigate to the DataCollectionPage without any auto-advance behavior

3.2 WHEN a user manually uploads a CSV file via drag-and-drop on the DataCollectionPage THEN the system SHALL CONTINUE TO parse, validate, and preview the data correctly regardless of whether guided tour mode is active

3.3 WHEN the DatasetTemplatesPanel's "Use This Dataset" button is clicked for a template with `rows > 0` (classification, regression, text_classification) THEN the system SHALL CONTINUE TO generate synthetic data, convert to CSV, call `onLoadDataset`, and show the success toast

3.4 WHEN the InteractiveTour's "Skip" or "X" button is clicked THEN the system SHALL CONTINUE TO call `onSkip` and dismiss the tour overlay

3.5 WHEN a user clicks "Continue to Learning" manually (not via auto-advance) with valid data selected THEN the system SHALL CONTINUE TO save the dataset, update project status, and navigate to the learning page

---

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition_TourTargets(step)
  INPUT: step of type TourStep
  OUTPUT: boolean
  
  // Returns true when the tour step's target selector cannot find an element in the DOM
  RETURN document.querySelector(step.target) = NULL
END FUNCTION
```

```pascal
FUNCTION isBugCondition_GuidedTourDataset(project, samples)
  INPUT: project of type Project, samples of type SampleDataset[]
  OUTPUT: boolean
  
  // Returns true when guided tour mode is active but no sample datasets are available
  RETURN project.is_guided_tour = true AND samples.length = 0
END FUNCTION
```

```pascal
FUNCTION isBugCondition_DatasetButtonDisabled(template)
  INPUT: template of type DatasetTemplate
  OUTPUT: boolean
  
  // Returns true when a template cannot generate data but the button appears enabled
  RETURN template.rows = 0 AND template.generateData() = []
END FUNCTION
```

### Property Specification — Fix Checking

```pascal
// Property: Tour Target Elements Exist
FOR ALL step WHERE isBugCondition_TourTargets(step) DO
  // After fix: all referenced data-tour attributes exist in component markup
  element ← document.querySelector(step.target)
  ASSERT element ≠ NULL
END FOR

// Property: Guided Tour Graceful Fallback
FOR ALL (project, samples) WHERE isBugCondition_GuidedTourDataset(project, samples) DO
  result ← renderDataCollectionPage(project, samples)
  ASSERT result.showsFallbackMessage = true
  ASSERT result.showsTemplatePanel = true
  ASSERT result.isNotStuck = true
END FOR

// Property: Disabled Button for Empty Templates
FOR ALL template WHERE isBugCondition_DatasetButtonDisabled(template) DO
  result ← renderDatasetTemplatesPanel(template)
  ASSERT result.buttonDisabled = true
  ASSERT result.showsUploadRequiredLabel = true
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking — Non-guided-tour flows unchanged
FOR ALL (project, samples) WHERE NOT isBugCondition_GuidedTourDataset(project, samples) DO
  ASSERT F(project, samples) = F'(project, samples)
END FOR

// Property: Preservation Checking — Templates with data still work
FOR ALL template WHERE NOT isBugCondition_DatasetButtonDisabled(template) DO
  ASSERT F(template) = F'(template)
END FOR
```
