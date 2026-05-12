# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - TypeScript Compilation Errors Exist
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the TypeScript errors exist
  - **Scoped PBT Approach**: Run `npm run lint` and verify exactly 14 TypeScript errors across 5 files
  - Test that the following errors are reported:
    - MyAssignments.tsx: 6 errors for missing grade, feedback, file_url properties on AssignmentCompletion
    - AppLayout.tsx: 2 errors for invalid children prop on Header and userId prop on NotificationBell
    - ModelRecommendation.tsx: 1 error for possibly undefined bestModel.accuracy
    - ConceptsVisualizerPage.tsx: 4 errors for missing x/y properties on node types
    - SuperAdminDashboardPage.tsx: 1 error for missing react-modal type declarations
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (lint reports errors - this proves the bugs exist)
  - Document counterexamples found (specific error messages and line numbers)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Runtime Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Run existing test suite on UNFIXED code and record passing tests
  - Observe: Verify MyAssignments component renders correctly with completion data
  - Observe: Verify Header component renders with NotificationBell for authenticated users
  - Observe: Verify ModelRecommendation displays recommendations when data is valid
  - Observe: Verify ConceptsVisualizerPage renders force graph with nodes and links
  - Observe: Verify SuperAdminDashboardPage modal opens and closes correctly
  - Write property-based test: for all runtime behaviors not involving TypeScript type system, behavior is unchanged
  - Run `npm run test` on UNFIXED code to establish baseline
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are run and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 3. Fix TypeScript errors across all 5 files

  - [x] 3.1 Add missing properties to AssignmentCompletion type
    - Open `src/types/types.ts`
    - Add `grade: string | null` to AssignmentCompletion interface
    - Add `feedback: string | null` to AssignmentCompletion interface
    - Add `file_url: string | null` to AssignmentCompletion interface
    - _Bug_Condition: isBugCondition(code) where code.accessesProperty('grade'|'feedback'|'file_url') AND NOT property.existsInTypeDefinition()_
    - _Expected_Behavior: TypeScript compiler accepts code accessing grade, feedback, file_url on AssignmentCompletion_
    - _Preservation: MyAssignments continues to display completion data correctly_
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

  - [x] 3.2 Fix AppLayout component props
    - Open `src/components/layouts/AppLayout.tsx`
    - Remove children from Header component usage (change `<Header>{...}</Header>` to `<Header />`)
    - Remove NotificationBell rendering from AppLayout (Header already renders it internally)
    - _Bug_Condition: isBugCondition(code) where code.passesProps('children') to Header AND NOT Header.acceptsChildren()_
    - _Expected_Behavior: TypeScript compiler accepts Header without children prop_
    - _Preservation: Header continues to render navigation bar with NotificationBell for authenticated users_
    - _Requirements: 1.5, 1.6, 2.5, 2.6, 3.3, 3.4_

  - [x] 3.3 Add null check for bestModel in ModelRecommendation
    - Open `src/components/model-comparison/ModelRecommendation.tsx`
    - Add null/undefined check before accessing `recommendation?.bestModel.accuracy`
    - Use optional chaining: `recommendation?.bestModel?.accuracy` or explicit null guards
    - _Bug_Condition: isBugCondition(code) where code.accessesProperty('accuracy') on possibly undefined bestModel_
    - _Expected_Behavior: TypeScript compiler accepts code with proper null guards_
    - _Preservation: ModelRecommendation continues to display recommendations when data is valid_
    - _Requirements: 1.7, 2.7, 3.5_

  - [x] 3.4 Define extended node type with D3 properties in ConceptsVisualizerPage
    - Open `src/pages/ConceptsVisualizerPage.tsx`
    - Create extended node type with D3 force simulation properties: `x?: number`, `y?: number`, `vx?: number`, `vy?: number`
    - Apply extended type to `nodeCanvasObject` callback
    - Apply proper typing for link source/target nodes in `linkCanvasObject` callback
    - _Bug_Condition: isBugCondition(code) where code.accessesProperty('x'|'y') AND NOT property.existsInNodeType()_
    - _Expected_Behavior: TypeScript compiler accepts code accessing x, y on nodes_
    - _Preservation: ForceGraph2D continues to render nodes at calculated positions with progress rings and labels_
    - _Requirements: 1.8, 1.9, 1.10, 2.8, 2.9, 3.6, 3.7_

  - [x] 3.5 Install @types/react-modal for SuperAdminDashboardPage
    - Run `npm install --save-dev @types/react-modal`
    - Verify package.json includes @types/react-modal in devDependencies
    - _Bug_Condition: isBugCondition(code) where code.importsModule('react-modal') AND NOT module.hasTypeDeclaration()_
    - _Expected_Behavior: TypeScript compiler accepts react-modal import with type definitions_
    - _Preservation: SuperAdminDashboardPage continues to display ReactModal with all existing functionality_
    - _Requirements: 1.11, 2.10, 3.8_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - TypeScript Compilation Succeeds
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run `npm run lint` on fixed code
    - **EXPECTED OUTCOME**: Test PASSES (0 TypeScript errors - confirms bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Runtime Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run `npm run test` on fixed code
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run `npm run lint` to verify 0 TypeScript errors
  - Run `npm run test` to verify all tests pass
  - Manually verify UI components render correctly if needed
  - Ensure all tests pass, ask the user if questions arise
