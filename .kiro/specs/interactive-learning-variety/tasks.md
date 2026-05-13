# Implementation Plan: Interactive Learning Variety

## Overview

This plan implements the dynamic interactive learning component system that replaces the fixed quiz step in the Learning Moment Modal. The implementation proceeds in phases: shared types and pure evaluation logic first, then content authoring, individual components, the selector/registry, modal integration, and finally testing. Each phase builds on the previous one, ensuring no orphaned code.

## Tasks

- [x] 1. Shared types and evaluation logic
  - [x] 1.1 Create shared types module at `src/components/learning/types.ts`
    - Define `LearningComponentType` union type ('quiz' | 'matching' | 'fill_blanks' | 'flash_cards' | 'sorting')
    - Define `ComponentResult` interface (componentType, score, total, timeSpentMs)
    - Define `LearningComponentProps` interface (content, onComplete callback)
    - Define `ComponentContentMap` type mapping each component type to its content interface
    - _Requirements: 1.2, 7.4_

  - [x] 1.2 Create pure evaluation functions at `src/components/learning/evaluators.ts`
    - Implement `evaluateMatching(correctPairs, userConnections)` returning `{ correct, incorrect }` arrays
    - Implement `evaluateFillBlanks(sentences, userPlacements)` with case-insensitive comparison
    - Implement `evaluateSorting(items, userPlacements)` returning `{ correct, incorrect }` arrays
    - Implement `evaluateAnswer(userAnswer, correctAnswer)` for quiz/flash card single-answer evaluation
    - All functions must be pure with no side effects
    - _Requirements: 2.2, 3.3, 4.4, 5.2, 6.4_

  - [ ]* 1.3 Write property tests for evaluation functions
    - **Property 3: Answer Evaluation Correctness** — evaluateAnswer returns true iff user answer equals correct answer
    - **Property 5: Match Evaluation Correctness** — evaluateMatching classifies pair as correct iff user connected concept to its definition
    - **Property 8: Fill-Blanks Evaluation Correctness** — evaluateFillBlanks classifies blank as correct iff placed word matches expected (case-insensitive)
    - **Property 9: Sorting Evaluation Correctness** — evaluateSorting classifies item as correct iff placed in correct category
    - Use `fast-check` with minimum 100 iterations per property
    - Install `fast-check` as a dev dependency
    - _Requirements: 2.2, 3.3, 4.4, 6.4_

- [x] 2. Content data structures and authoring
  - [x] 2.1 Extend content types in `src/utils/learningMomentContent.ts`
    - Add `MatchingContent` and `MatchingPair` interfaces
    - Add `FillBlanksContent` and `FillBlanksSentence` interfaces
    - Add `FlashCardContent` and `FlashCardStatement` interfaces
    - Add `SortingContent`, `SortingCategory`, and `SortingItem` interfaces
    - Add `InteractiveContent` aggregate interface
    - Extend `LearningMomentContent` with an `interactive?: InteractiveContent` field
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 2.2 Author interactive content for image_classification learning moments
    - Add matching content (3+ pairs) for data, model, and next_steps moments
    - Add fill-in-the-blanks content (2+ sentences with distractors) for each moment
    - Add flash card content (3+ statements) for each moment
    - Add sorting content (2+ categories, 4+ items) for each moment
    - _Requirements: 3.5, 4.6, 5.4, 6.6, 8.2_

  - [x] 2.3 Author interactive content for text_classification learning moments
    - Add matching, fill-in-the-blanks, flash card, and sorting content for data, model, and next_steps
    - Follow same minimum content thresholds as 2.2
    - _Requirements: 3.5, 4.6, 5.4, 6.6, 8.2_

  - [x] 2.4 Author interactive content for regression and classification learning moments
    - Add matching, fill-in-the-blanks, flash card, and sorting content for all moment types
    - Follow same minimum content thresholds as 2.2
    - _Requirements: 3.5, 4.6, 5.4, 6.6, 8.2_

  - [ ]* 2.5 Write property test for word bank completeness
    - **Property 7: Word Bank Completeness** — for any fill-in-the-blanks content, the word bank (correct answers + distractors) contains every correct answer word
    - **Validates: Requirements 4.2**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Individual learning components
  - [x] 4.1 Refactor existing quiz into standalone `QuizComponent` at `src/components/learning/QuizComponent.tsx`
    - Extract quiz logic from `LearningMomentModal.tsx` into a self-contained component
    - Accept `LearningComponentProps` with quiz content
    - Manage internal state: currentQuestionIndex, selectedAnswer, showFeedback, isCorrect, score
    - Call `onComplete` with `ComponentResult` when all questions are answered
    - Maintain existing UI and behavior (immediate feedback, hints, explanations)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Install `@dnd-kit/core` and `@dnd-kit/sortable` dependencies
    - Add `@dnd-kit/core` and `@dnd-kit/sortable` to project dependencies
    - _Requirements: 3.2, 6.3_

  - [x] 4.3 Create `MatchingComponent` at `src/components/learning/MatchingComponent.tsx`
    - Two-column layout: draggable concepts on left, droppable definition slots on right
    - Use `@dnd-kit/core` for drag-and-drop interactions
    - Implement keyboard alternative: Tab to select concept, Tab through definitions, Enter to connect
    - Randomize order of items in both columns
    - Evaluate all pairs on submission using `evaluateMatching`
    - Show correct/incorrect feedback with correct associations highlighted
    - Call `onComplete` with `ComponentResult`
    - Add ARIA live region announcements for match results
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.1, 9.5, 9.6_

  - [x] 4.4 Create `FillBlanksComponent` at `src/components/learning/FillBlanksComponent.tsx`
    - Render sentences with inline blank slots (styled as drop targets)
    - Display word bank below with draggable word chips
    - Support drag-from-bank-to-blank and keyboard navigation (Tab to blank, arrow keys through bank, Enter to place)
    - Allow changing selections before submission
    - Evaluate on submit using `evaluateFillBlanks`
    - Show correct/incorrect feedback per blank with correct words revealed
    - Call `onComplete` with `ComponentResult`
    - Add ARIA live region announcements
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.3, 9.5, 9.6_

  - [x] 4.5 Create `FlashCardComponent` at `src/components/learning/FlashCardComponent.tsx`
    - Display one statement at a time with True/False buttons
    - On selection, immediately show correct/incorrect with explanation
    - Advance to next card after feedback
    - Track score (correct evaluations / total statements)
    - Call `onComplete` with `ComponentResult` after all statements
    - Support keyboard selection (Tab to buttons, Enter/Space to select)
    - Add ARIA live region announcements
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 9.4, 9.5, 9.6_

  - [x] 4.6 Create `SortingComponent` at `src/components/learning/SortingComponent.tsx`
    - Display category buckets at top with clear labels
    - Display draggable concept items below in randomized order
    - Use `@dnd-kit/core` with `SortableContext` for each bucket
    - Implement keyboard alternative: Tab to item, arrow keys to select bucket, Enter to place
    - Evaluate on submission using `evaluateSorting`
    - Show correct/incorrect feedback with correct categories highlighted
    - Call `onComplete` with `ComponentResult`
    - Add ARIA live region announcements
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.2, 9.5, 9.6_

  - [ ]* 4.7 Write property test for randomization preserving elements
    - **Property 6: Randomization Preserves Elements** — shuffled output is a permutation of input (same elements, same multiplicity)
    - Test shuffle functions used by MatchingComponent and SortingComponent
    - **Validates: Requirements 3.6, 6.7**

  - [ ]* 4.8 Write property test for score tracking accuracy
    - **Property 4: Score Tracking Accuracy** — for any sequence of N answers where K are correct, final score equals K and total equals N
    - Test score accumulation logic across QuizComponent and FlashCardComponent
    - **Validates: Requirements 2.4, 5.5**

- [x] 5. Component selector and registry
  - [x] 5.1 Create component selector at `src/components/learning/componentSelector.ts`
    - Implement `selectComponent(options: ComponentSelectorOptions)` using uniform random distribution
    - Implement `getAvailableTypes(content: InteractiveContent)` that checks minimum content thresholds (quiz: 1+ questions, matching: 3+ pairs, fillBlanks: 2+ sentences, flashCards: 3+ statements, sorting: 4+ items)
    - Fall back to 'quiz' if no content available
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 5.2 Create component registry at `src/components/learning/ComponentRegistry.tsx`
    - Use `React.lazy` for code-splitting each component
    - Export `getComponentForType(type: LearningComponentType)` returning the lazy-loaded component
    - Map all five component types to their implementations
    - _Requirements: 1.1, 1.2_

  - [x] 5.3 Create error boundary at `src/components/learning/LearningComponentErrorBoundary.tsx`
    - Catch render errors from any learning component
    - Fall back to QuizComponent with fallback content
    - Display informational message about the fallback
    - _Requirements: 1.4 (graceful degradation)_

  - [ ]* 5.4 Write property tests for component selector
    - **Property 1: Component Selection Validity** — selectComponent returns only a type that has content available
    - **Property 2: Uniform Distribution of Selection** — over 1000+ selections, each type appears with frequency ~1/N (chi-squared test)
    - **Validates: Requirements 1.1, 1.3, 1.4**

- [x] 6. Modal integration
  - [x] 6.1 Update `LearningMomentModal.tsx` to use dynamic component selection
    - Replace hardcoded quiz step with ComponentSelector + ComponentRegistry
    - On entering Step 3: call `selectComponent` with available interactive content
    - Render selected component via `getComponentForType` wrapped in `Suspense` and error boundary
    - Pass appropriate content slice and `onComplete` callback to selected component
    - Update step indicator label from "Quiz" to "Activity"
    - _Requirements: 1.1, 1.4, 8.4_

  - [x] 6.2 Update `LearningMomentResult` type and service integration
    - Add `componentType: LearningComponentType` field to `LearningMomentResult`
    - Replace `quizScore`/`quizTotal` with `score`/`total` in the result interface
    - Update `learningMomentService.recordCompletion` to accept new result shape
    - Update `learningMomentService.awardPoints` to work with generic score/total
    - Ensure same base points and bonus logic regardless of component type
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 6.3 Write property test for gamification consistency
    - **Property 10: Gamification Consistency** — for any learning moment type and any two component types with same score ratio, identical base points and bonus points are awarded
    - **Validates: Requirements 7.1, 7.2**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Unit and integration tests
  - [ ]* 8.1 Write unit tests for individual components
    - Test QuizComponent renders questions and handles answer selection
    - Test MatchingComponent displays two columns and handles connections
    - Test FillBlanksComponent shows blanks and word bank
    - Test FlashCardComponent shows statement with True/False buttons
    - Test SortingComponent displays category buckets and items
    - Test keyboard navigation for all components
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 9.1-9.6_

  - [ ]* 8.2 Write integration tests for modal flow
    - Test full flow: Content → Component Selection → Activity → Summary
    - Test error boundary fallback when component fails
    - Test points awarded correctly after component completion
    - Test component type recorded in completion result
    - _Requirements: 1.1, 7.1, 7.3, 7.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- `@dnd-kit/core` must be installed before building Matching and Sorting components
- `fast-check` must be installed as a dev dependency before writing property tests
- The existing quiz UI/UX is preserved in the refactored QuizComponent
