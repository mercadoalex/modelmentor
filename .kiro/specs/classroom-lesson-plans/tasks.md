# Implementation Plan: Classroom Lesson Plans

## Overview

This plan implements a full curriculum library system for ModelMentor's teacher tooling. It adds a filterable lesson plan library page, individual detail views, pre-authored lesson plan content in English and Spanish, PDF export, and integration with existing teacher navigation. The implementation uses TypeScript/React with the existing i18next, jsPDF, Radix UI, and Vitest/fast-check stack.

## Tasks

- [x] 1. Data model and types
  - [x] 1.1 Create `src/data/lessonPlans/types.ts` with all TypeScript interfaces
    - Define `GradeBand`, `ModelType`, `SubjectArea`, `Duration`, `PerformanceLevel` type aliases
    - Define `Standard`, `SEPAlignment`, `RubricCriterion`, `LessonPhase`, `DifferentiationStrategy`, `StudentHandout`, `TeacherNotes`, and `CurriculumLessonPlan` interfaces
    - _Requirements: 2.2, 3.1, 3.2, 4.2, 4.3, 5.1, 5.2, 7.1, 8.1_

  - [x] 1.2 Create `src/data/lessonPlans/index.ts` with plan registry and lookup helpers
    - Export an array of all plans and a `getPlanBySlug(slug: string)` lookup function
    - Export a `getAllPlans()` function returning the full plan list
    - _Requirements: 1.1, 2.1_

- [x] 2. Lesson plan content authoring
  - [x] 2.1 Create `src/data/lessonPlans/plans/image-classification-6-8.ts`
    - Author a complete `CurriculumLessonPlan` object for image classification targeting grades 6-8
    - Include all required fields: standards (CSTA + ISTE), rubric (4 levels), differentiation (3+ strategies per level), handout, teacher notes (3+ misconceptions, 5+ discussion prompts), 5-phase procedure
    - Duration: 45min (single period)
    - _Requirements: 9.1, 9.5, 9.6, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 8.1, 8.2, 8.3_

  - [x] 2.2 Create `src/data/lessonPlans/plans/image-classification-9-12.ts`
    - Author a complete `CurriculumLessonPlan` object for image classification targeting grades 9-12
    - Duration: 60min
    - _Requirements: 9.2, 9.5, 9.6_

  - [x] 2.3 Create `src/data/lessonPlans/plans/text-classification-9-12.ts`
    - Author a complete `CurriculumLessonPlan` object for text classification targeting grades 9-12
    - Duration: 90min (block period)
    - _Requirements: 9.3, 9.5, 9.6_

  - [x] 2.4 Create `src/data/lessonPlans/plans/regression-9-12.ts`
    - Author a complete `CurriculumLessonPlan` object for regression targeting grades 9-12
    - Duration: 90min (block period)
    - _Requirements: 9.4, 9.5, 9.6_

  - [x] 2.5 Add `lessonPlans` namespace to `src/i18n/locales/en.json`
    - Add UI labels (library title, filter labels, buttons, empty state message, export labels)
    - Add translated content for all 4 lesson plans (titles, overviews, objectives, procedure steps, rubric text, handout content, teacher notes, standards descriptions)
    - _Requirements: 10.1, 10.2_

  - [x] 2.6 Add `lessonPlans` namespace to `src/i18n/locales/es.json`
    - Translate all UI labels to Spanish
    - Translate all 4 lesson plan content strings to Spanish
    - Include SEP alignment labels (Pensamiento Computacional, Tecnología)
    - _Requirements: 10.1, 10.2, 3.5_

- [x] 3. Filter logic
  - [x] 3.1 Create `src/data/lessonPlans/filters.ts`
    - Define `LessonPlanFilters` interface with optional fields: `gradeBand`, `modelType`, `subjectArea`, `duration`, `standard`
    - Implement `filterLessonPlans(plans, filters)` function that returns plans matching ALL active criteria
    - _Requirements: 1.2, 1.3, 3.4_

  - [ ]* 3.2 Write property test for filter correctness
    - **Property 1: Filter correctness**
    - Generate random plan arrays and filter combinations with fast-check
    - Verify returned plans match all active criteria and no matching plans are excluded
    - Test file: `src/__tests__/lesson-plans/filters.property.test.ts`
    - **Validates: Requirements 1.3, 3.4**

- [x] 4. Checkpoint - Verify data model and filter logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. UI components
  - [x] 5.1 Create `src/components/lesson-plans/FilterPanel.tsx`
    - Render Radix Select dropdowns for grade band, subject area, duration, model type, and standard code
    - Include "Clear filters" button
    - Responsive layout: horizontal on desktop, stacked on mobile
    - Accept `onFilterChange` callback and current filter state as props
    - _Requirements: 1.2, 3.4_

  - [x] 5.2 Create `src/components/lesson-plans/LessonPlanCard.tsx`
    - Render card with title, grade band badge, subject badge, duration badge, model type badge
    - Show truncated overview text (~100 chars)
    - Navigate to `/teacher/lesson-plans/:planId` on click
    - Use existing Card and Badge components
    - _Requirements: 1.1_

  - [x] 5.3 Create `src/components/lesson-plans/StandardsBadges.tsx`
    - Display CSTA and ISTE standard codes as badges
    - Expand on hover/click to show full standard description
    - Conditionally show SEP alignment when locale is Spanish
    - _Requirements: 3.3, 3.5_

  - [x] 5.4 Create `src/components/lesson-plans/RubricTable.tsx`
    - Render rubric as a table with criteria as rows and performance levels as columns
    - Use existing Table component from `src/components/ui/table.tsx`
    - Responsive with horizontal scroll on mobile
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 5.5 Create `src/components/lesson-plans/StudentHandoutView.tsx`
    - Render student handout content with guided prompts, reflection questions, and response space indicators
    - Reference ModelMentor workflow steps
    - Print-friendly styling
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 5.6 Create `src/components/lesson-plans/TeacherNotesCallout.tsx`
    - Visually distinct callout with colored border/background
    - Display misconceptions (with corrections), discussion prompts, and classroom tips
    - Use Alert component styling pattern
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 5.7 Create `src/components/lesson-plans/DifferentiationStrategies.tsx`
    - Three-column layout: Struggling / On-Level / Advanced
    - List strategies with ModelMentor feature references
    - Use Accordion for collapsible sections on mobile
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Pages
  - [x] 6.1 Create `src/pages/LessonPlanLibraryPage.tsx`
    - Use `AppLayout` for consistent page structure
    - Role-gate access to teacher, admin, super_admin (redirect non-teachers with access denied toast)
    - Render `FilterPanel` and grid of `LessonPlanCard` components
    - Implement client-side filtering using `filterLessonPlans`
    - Show empty state message when no plans match filters
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 6.2 Create `src/pages/LessonPlanDetailPage.tsx`
    - Use `AppLayout`
    - Read `planId` from URL params, look up plan via `getPlanBySlug`
    - Render tabbed sections using Radix Tabs (Overview, Procedure, Assessment, Differentiation, Handout, Teacher Notes)
    - Include PDF export button and print button in header
    - Show breadcrumb navigation back to library
    - Show 404 message with link back to library if plan not found
    - Display all required sections: title, grade band, subject, duration, objectives, standards, materials, procedure (5 phases with time allocations), assessment, differentiation, teacher notes, handout, rubric
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.3, 4.5, 5.3, 7.3, 8.4_

- [ ] 7. PDF export
  - [x] 7.1 Create `src/utils/lessonPlanPdfExport.ts`
    - Implement `exportLessonPlanPDF(plan, language)` function
    - Reuse helpers from `src/utils/pdfExport.ts` (initializePDF, addHeader, addSectionHeading, addParagraph, addTable, addFooter, checkPageBreak)
    - Include header with plan title, grade band, and ModelMentor branding on each page
    - Render all sections: objectives, standards, procedure phases, rubric table, differentiation, handout
    - Generate filename from plan title slug + ISO date + `.pdf`
    - Wrap in try/catch with toast error and browser print fallback suggestion
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 7.2 Implement `exportStudentHandoutPDF(plan, language)` function in same file
    - Render student handout as a standalone printable page within the PDF
    - Include guided prompts, reflection questions, and response space indicators
    - _Requirements: 6.4, 7.4_

- [ ] 8. Routing and navigation integration
  - [x] 8.1 Add lesson plan routes to `src/routes.tsx`
    - Add `/teacher/lesson-plans` route pointing to `LessonPlanLibraryPage` with `public: false`
    - Add `/teacher/lesson-plans/:planId` route pointing to `LessonPlanDetailPage` with `public: false`
    - _Requirements: 11.4, 1.5_

  - [x] 8.2 Add navigation links from `TeacherResourcesPage` and `TeacherDashboardPage`
    - Add a link/card to the lesson plan library from TeacherResourcesPage
    - Add a link/card to the lesson plan library from TeacherDashboardPage
    - _Requirements: 11.1, 11.2_

- [x] 9. Checkpoint - Verify full feature integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Property-based tests
  - [ ]* 10.1 Write property test for lesson plan data completeness
    - **Property 2: Lesson plan data completeness invariant**
    - Verify all pre-authored plans satisfy: CSTA + ISTE standards present, rubric non-empty with all 4 levels, differentiation has 3+ strategies for struggling/advanced with feature refs, handout has prompts + reflection questions + workflow steps, teacher notes has 3+ misconceptions, 5+ total discussion prompts
    - Test file: `src/__tests__/lesson-plans/data-completeness.property.test.ts`
    - **Validates: Requirements 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2, 5.4, 7.1, 7.2, 8.1, 8.2, 8.3**

  - [ ]* 10.2 Write property test for procedure structure invariant
    - **Property 3: Procedure structure invariant**
    - Verify all plans have exactly 5 phases in correct order with non-empty duration and steps
    - Test file: `src/__tests__/lesson-plans/procedure-structure.property.test.ts`
    - **Validates: Requirements 2.3, 2.4**

  - [ ]* 10.3 Write property test for role-based access control
    - **Property 6: Role-based access control**
    - Generate random user profiles with various roles, verify access logic grants access only to teacher/admin/super_admin
    - Test file: `src/__tests__/lesson-plans/access-control.property.test.ts`
    - **Validates: Requirements 1.5**

  - [ ]* 10.4 Write property test for PDF filename generation
    - **Property 8: PDF filename generation**
    - Generate random title strings, verify filename is a URL-safe slug with ISO date suffix and `.pdf` extension
    - Test file: `src/__tests__/lesson-plans/pdf-filename.property.test.ts`
    - **Validates: Requirements 6.6**

  - [ ]* 10.5 Write property test for i18n key resolution completeness
    - **Property 9: i18n key resolution completeness**
    - For each plan and each locale (en, es), verify all referenced i18n keys resolve to non-empty strings
    - Test file: `src/__tests__/lesson-plans/i18n-completeness.property.test.ts`
    - **Validates: Requirements 10.2**

- [x] 11. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The project already has `fast-check`, `vitest`, `jspdf`, `jspdf-autotable`, `i18next`, and Radix UI in dependencies
- All lesson plan content uses i18n keys — actual translated strings live in en.json and es.json
- PDF export reuses the existing `pdfExport.ts` helper pattern
