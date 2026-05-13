# Requirements Document

## Introduction

The Interactive Learning Variety feature enhances the "Step 3 - Learn" phase of the Learning Moments modal by introducing multiple interactive learning components beyond the existing multiple-choice quiz. Instead of always presenting a quiz, the system randomly selects from a pool of interactive components (Quiz, Drag & Drop Matching, Fill in the Blanks, True/False Flash Cards, Concept Sorting) each time a learning moment is triggered. This keeps the learning experience fresh, engaging, and pedagogically diverse while maintaining the same gamification point structure.

## Glossary

- **Learning_Component**: An interactive educational activity presented during Step 3 of the Learning Moment modal flow. Each component type tests knowledge differently but awards the same points.
- **Component_Selector**: The subsystem responsible for randomly choosing which Learning_Component to present for a given learning moment session.
- **Quiz_Component**: The existing multiple-choice question component that presents questions with selectable answer options.
- **Matching_Component**: A drag-and-drop component where learners match ML concepts to their definitions by pairing items from two columns.
- **FillBlanks_Component**: A component that presents sentences about ML concepts with missing words that the learner must complete from a word bank.
- **FlashCard_Component**: A component that presents ML statements one at a time for the learner to evaluate as True or False.
- **Sorting_Component**: A component where learners drag ML concepts into correct categories (e.g., "Supervised Learning" vs "Unsupervised Learning").
- **Learning_Moment_Modal**: The three-step dialog overlay (Content → Interactive Activity → Summary) that delivers contextual education.
- **Gamification_Service**: The service that tracks points, achievements, and levels for user engagement.

## Requirements

### Requirement 1: Random Component Selection

**User Story:** As a learner, I want to encounter different types of interactive activities each time I reach the learning step, so that my learning experience stays fresh and engaging.

#### Acceptance Criteria

1. WHEN a Learning Moment reaches Step 3, THE Component_Selector SHALL randomly select one Learning_Component from the available pool of components.
2. THE Component_Selector SHALL support a minimum of five component types: Quiz, Matching, Fill in the Blanks, Flash Cards, and Concept Sorting.
3. WHEN selecting a component, THE Component_Selector SHALL use a uniform random distribution across all available component types.
4. WHEN content data is not available for a specific component type for the current learning moment, THE Component_Selector SHALL exclude that component type from the selection pool.
5. THE Component_Selector SHALL select from at least two available component types before falling back to a single type.

### Requirement 2: Quiz Component (Existing)

**User Story:** As a learner, I want to answer multiple-choice questions about ML concepts, so that I can test my recall of specific facts.

#### Acceptance Criteria

1. WHEN the Quiz_Component is selected, THE Learning_Moment_Modal SHALL present multiple-choice questions with selectable answer options.
2. WHEN the learner submits an answer, THE Quiz_Component SHALL indicate whether the answer is correct or incorrect.
3. WHEN the learner answers incorrectly, THE Quiz_Component SHALL display the correct answer and an explanation.
4. THE Quiz_Component SHALL track the number of correct answers out of total questions.

### Requirement 3: Drag and Drop Matching Component

**User Story:** As a learner, I want to match ML concepts to their definitions by dragging items, so that I can build associations between terms and meanings.

#### Acceptance Criteria

1. WHEN the Matching_Component is selected, THE Learning_Moment_Modal SHALL display two columns: one with ML concepts and one with definitions.
2. THE Matching_Component SHALL allow the learner to connect items from the concept column to items in the definition column.
3. WHEN all pairs are connected, THE Matching_Component SHALL evaluate the matches and indicate correct and incorrect pairings.
4. IF a match is incorrect, THEN THE Matching_Component SHALL highlight the incorrect pairing and show the correct association.
5. THE Matching_Component SHALL present a minimum of three concept-definition pairs per session.
6. THE Matching_Component SHALL randomize the order of items in both columns to prevent positional memorization.

### Requirement 4: Fill in the Blanks Component

**User Story:** As a learner, I want to complete sentences about ML concepts by filling in missing words, so that I can practice active recall of terminology.

#### Acceptance Criteria

1. WHEN the FillBlanks_Component is selected, THE Learning_Moment_Modal SHALL display sentences with one or more missing words represented as blank spaces.
2. THE FillBlanks_Component SHALL provide a word bank containing the correct answers and distractor words.
3. WHEN the learner places a word in a blank, THE FillBlanks_Component SHALL allow the learner to change their selection before submitting.
4. WHEN the learner submits their answers, THE FillBlanks_Component SHALL evaluate each blank and indicate correct and incorrect placements.
5. IF a blank is filled incorrectly, THEN THE FillBlanks_Component SHALL display the correct word for that blank.
6. THE FillBlanks_Component SHALL present a minimum of two sentences per session.

### Requirement 5: True/False Flash Cards Component

**User Story:** As a learner, I want to evaluate ML statements as true or false, so that I can quickly test my understanding of concepts.

#### Acceptance Criteria

1. WHEN the FlashCard_Component is selected, THE Learning_Moment_Modal SHALL present one ML statement at a time with True and False response options.
2. WHEN the learner selects True or False, THE FlashCard_Component SHALL immediately reveal whether the answer is correct.
3. WHEN the answer is revealed, THE FlashCard_Component SHALL display an explanation of why the statement is true or false.
4. THE FlashCard_Component SHALL present a minimum of three statements per session.
5. THE FlashCard_Component SHALL track the number of correct evaluations out of total statements.
6. WHEN all statements are evaluated, THE FlashCard_Component SHALL proceed to the summary step.

### Requirement 6: Concept Sorting Component

**User Story:** As a learner, I want to sort ML concepts into correct categories, so that I can understand how different techniques and ideas are grouped.

#### Acceptance Criteria

1. WHEN the Sorting_Component is selected, THE Learning_Moment_Modal SHALL display category buckets and a list of ML concepts to sort.
2. THE Sorting_Component SHALL present two or more category buckets with clear labels (e.g., "Supervised Learning" vs "Unsupervised Learning").
3. THE Sorting_Component SHALL allow the learner to drag concepts into category buckets.
4. WHEN all concepts are placed, THE Sorting_Component SHALL evaluate the sorting and indicate correct and incorrect placements.
5. IF a concept is placed in the wrong category, THEN THE Sorting_Component SHALL highlight the error and show the correct category.
6. THE Sorting_Component SHALL present a minimum of four concepts to sort per session.
7. THE Sorting_Component SHALL randomize the order of concepts presented to prevent positional memorization.

### Requirement 7: Consistent Gamification Across Components

**User Story:** As a learner, I want to earn the same points regardless of which interactive component is shown, so that the randomization feels fair.

#### Acceptance Criteria

1. THE Gamification_Service SHALL award the same base points for completing any Learning_Component type within a given learning moment.
2. THE Gamification_Service SHALL award bonus points for a perfect score regardless of which Learning_Component type was presented.
3. WHEN a Learning_Component is completed, THE Learning_Moment_Modal SHALL display the points earned and any achievements unlocked in the summary step.
4. THE Gamification_Service SHALL record the component type used alongside the completion result for progress tracking.

### Requirement 8: Component Content Authoring

**User Story:** As a content author, I want a structured format for defining content for each component type, so that I can create varied learning activities for each learning moment.

#### Acceptance Criteria

1. THE Learning_Moment_Modal SHALL support content definitions for all five component types per learning moment topic.
2. WHEN content is defined for a learning moment, THE content structure SHALL include component-specific data (pairs for matching, sentences for fill-in-the-blanks, statements for flash cards, categories and items for sorting).
3. THE content structure SHALL be co-located with existing learning moment content in the content module.
4. IF a learning moment topic has content defined for fewer than two component types, THEN THE Component_Selector SHALL fall back to the available component type.

### Requirement 9: Accessible Interaction Patterns

**User Story:** As a learner using assistive technology, I want all interactive components to be keyboard-navigable and screen-reader compatible, so that I can participate fully regardless of how I interact with the interface.

#### Acceptance Criteria

1. THE Matching_Component SHALL support keyboard-based pairing as an alternative to drag-and-drop.
2. THE Sorting_Component SHALL support keyboard-based sorting as an alternative to drag-and-drop.
3. THE FillBlanks_Component SHALL support keyboard navigation between blanks and word bank selection.
4. THE FlashCard_Component SHALL support keyboard selection of True and False options.
5. WHEN a learner completes an action, THE Learning_Component SHALL announce the result to screen readers using ARIA live regions.
6. THE Learning_Component SHALL maintain visible focus indicators during keyboard navigation.
