# Requirements Document

## Introduction

The Learning Moments feature integrates contextual educational content into the ModelMentor ML workflow at three key points: after data upload (Learn: Data), after model training (Learn: Model), and after deployment (Learn: Next Steps). This feature provides students with just-in-time learning opportunities that are relevant to their current project context, model type, and data characteristics. The system reuses existing learning infrastructure (SimplifiedExplanation, InteractiveQuiz, learning content) while adding new modal/dialog-based delivery mechanisms that are optional but encouraged, integrating with the existing gamification system for progress tracking and rewards.

## Glossary

- **Learning_Moment**: A contextual educational experience triggered at specific points in the ML workflow, consisting of content, quizzes, and interactive elements
- **Learning_Moment_Modal**: A dialog component that displays Learning Moment content without blocking the main workflow
- **Learning_Moment_Trigger**: The workflow event that initiates a Learning Moment (data upload complete, training complete, deployment complete)
- **Learning_Progress_Tracker**: A service that tracks completion status and progress across all Learning Moments for a user
- **Contextual_Content**: Educational content that adapts based on the user's model type (image_classification, text_classification, regression, classification) and data characteristics
- **Data_Quality_Insight**: Analysis of uploaded dataset characteristics used to personalize Learn: Data content
- **Model_Interpretability_Content**: Educational content explaining how the trained model works and makes predictions
- **Next_Steps_Recommendation**: Personalized suggestions for advanced topics based on completed project characteristics
- **Gamification_Integration**: Connection to the existing gamificationService for awarding points and achievements
- **Guided_Tour_Mode**: A special mode where Learning Moments may have different behavior or emphasis

## Requirements

### Requirement 1: Learning Moment Modal Component

**User Story:** As a student, I want Learning Moments to appear as non-blocking modals so that I can engage with educational content without losing my workflow progress.

#### Acceptance Criteria

1. THE Learning_Moment_Modal SHALL render as a dialog overlay that does not navigate away from the current page
2. THE Learning_Moment_Modal SHALL include a close button that allows users to dismiss the modal at any time
3. THE Learning_Moment_Modal SHALL include a "Skip for now" option that dismisses the modal and allows the user to continue the workflow
4. THE Learning_Moment_Modal SHALL include a "Don't show again" option that persists the user's preference
5. WHEN the Learning_Moment_Modal is open, THE System SHALL prevent background scrolling while maintaining modal scrollability
6. THE Learning_Moment_Modal SHALL be responsive and display correctly on mobile devices with viewport width >= 320px
7. THE Learning_Moment_Modal SHALL support keyboard navigation including Escape key to close

### Requirement 2: Learn: Data Trigger and Content

**User Story:** As a student, I want to learn about data quality after uploading my dataset so I understand why good data matters for my ML project.

#### Acceptance Criteria

1. WHEN a dataset upload completes successfully, THE System SHALL display the Learn: Data Learning_Moment_Modal
2. THE Learn: Data content SHALL include explanations of data quality concepts relevant to the uploaded dataset
3. THE Learn: Data content SHALL include explanations of feature selection appropriate to the model type
4. THE Learn: Data content SHALL include preprocessing recommendations based on the data characteristics
5. WHEN the model type is image_classification, THE Learn: Data content SHALL explain image data quality factors (resolution, lighting, diversity)
6. WHEN the model type is text_classification, THE Learn: Data content SHALL explain text data quality factors (length, vocabulary, balance)
7. WHEN the model type is regression, THE Learn: Data content SHALL explain numerical data quality factors (outliers, missing values, feature scaling)
8. WHEN the model type is classification, THE Learn: Data content SHALL explain tabular data quality factors (class balance, feature types, missing values)
9. THE Learn: Data content SHALL display dataset statistics including sample count, label distribution, and detected issues
10. THE Learn: Data content SHALL include at least one interactive quiz question about data quality concepts

### Requirement 3: Learn: Model Trigger and Content

**User Story:** As a student, I want to understand how my trained model works so I can explain it to others and improve my ML knowledge.

#### Acceptance Criteria

1. WHEN model training completes successfully, THE System SHALL display the Learn: Model Learning_Moment_Modal
2. THE Learn: Model content SHALL explain how the specific model type makes predictions
3. THE Learn: Model content SHALL include interpretability visualizations appropriate to the model type
4. THE Learn: Model content SHALL explain the training metrics (accuracy, loss, precision, recall, F1) in student-friendly terms
5. WHEN the model type is image_classification, THE Learn: Model content SHALL explain convolutional neural network concepts
6. WHEN the model type is text_classification, THE Learn: Model content SHALL explain text embedding and classification concepts
7. WHEN the model type is regression, THE Learn: Model content SHALL explain linear relationships and prediction intervals
8. WHEN the model type is classification, THE Learn: Model content SHALL explain decision boundaries and feature importance
9. THE Learn: Model content SHALL display the actual training results with contextual explanations
10. THE Learn: Model content SHALL include at least one interactive quiz question about model concepts

### Requirement 4: Learn: Next Steps Trigger and Content

**User Story:** As a student, I want to know what to learn next after deploying my model so I can continue my ML journey with relevant advanced topics.

#### Acceptance Criteria

1. WHEN model deployment completes successfully, THE System SHALL display the Learn: Next Steps Learning_Moment_Modal
2. THE Learn: Next Steps content SHALL recommend advanced topics based on the completed project's model type
3. THE Learn: Next Steps content SHALL suggest related workshops available in ModelMentor
4. THE Learn: Next Steps content SHALL explain concepts the student should explore next (hyperparameter tuning, cross-validation, ensemble methods)
5. WHEN the model achieved high accuracy (>= 90%), THE Learn: Next Steps content SHALL suggest advanced optimization techniques
6. WHEN the model achieved low accuracy (< 70%), THE Learn: Next Steps content SHALL suggest data improvement and debugging strategies
7. THE Learn: Next Steps content SHALL include links to relevant ModelMentor features (workshops, playgrounds, advanced tools)
8. THE Learn: Next Steps content SHALL include at least one interactive quiz question about advanced ML concepts
9. THE Learn: Next Steps content SHALL display a summary of the student's learning journey for this project

### Requirement 5: Progress Tracking and Persistence

**User Story:** As a student, I want my Learning Moment progress to be tracked so I can see what I've completed and earn rewards for my learning.

#### Acceptance Criteria

1. THE Learning_Progress_Tracker SHALL record completion status for each Learning Moment type (data, model, next_steps) per project
2. THE Learning_Progress_Tracker SHALL record quiz scores achieved within Learning Moments
3. THE Learning_Progress_Tracker SHALL persist progress data to the database for authenticated users
4. THE Learning_Progress_Tracker SHALL persist progress data to localStorage for anonymous users
5. WHEN a user completes a Learning Moment, THE System SHALL update the completion timestamp
6. THE System SHALL provide an API to query Learning Moment completion status for a given project
7. FOR ALL Learning Moment completions, storing then retrieving the completion status SHALL return the same completion data (round-trip property)

### Requirement 6: Gamification Integration

**User Story:** As a student, I want to earn points and achievements for completing Learning Moments so I feel rewarded for engaging with educational content.

#### Acceptance Criteria

1. WHEN a user completes a Learning Moment, THE Gamification_Integration SHALL award points via the gamificationService
2. THE System SHALL award 50 points for completing the Learn: Data Learning Moment
3. THE System SHALL award 75 points for completing the Learn: Model Learning Moment
4. THE System SHALL award 100 points for completing the Learn: Next Steps Learning Moment
5. WHEN a user achieves a perfect quiz score within a Learning Moment, THE System SHALL award 25 bonus points
6. WHEN a user completes all three Learning Moments for a single project, THE System SHALL unlock the "Complete Learner" achievement
7. WHEN a user completes 5 Learning Moments of any type, THE System SHALL unlock the "Knowledge Seeker" achievement
8. THE System SHALL display point awards and achievement unlocks via toast notifications

### Requirement 7: Contextual Content Adaptation

**User Story:** As a student, I want Learning Moment content to be relevant to my specific project so the information is immediately applicable.

#### Acceptance Criteria

1. THE Contextual_Content system SHALL select content based on the project's model_type
2. THE Contextual_Content system SHALL incorporate actual dataset statistics into Learn: Data explanations
3. THE Contextual_Content system SHALL incorporate actual training metrics into Learn: Model explanations
4. THE Contextual_Content system SHALL incorporate actual model performance into Learn: Next Steps recommendations
5. WHEN dataset has class imbalance (any class < 20% of total), THE Learn: Data content SHALL highlight class imbalance issues
6. WHEN training loss is not decreasing, THE Learn: Model content SHALL explain potential underfitting
7. WHEN validation accuracy is significantly lower than training accuracy (> 10% difference), THE Learn: Model content SHALL explain overfitting

### Requirement 8: Guided Tour Mode Integration

**User Story:** As a student in guided tour mode, I want Learning Moments to be emphasized so I get the full educational experience during my first project.

#### Acceptance Criteria

1. WHEN the project has is_guided_tour set to true, THE Learning_Moment_Modal SHALL auto-open without requiring user action
2. WHEN the project has is_guided_tour set to true, THE "Don't show again" option SHALL be hidden
3. WHEN the project has is_guided_tour set to false, THE Learning_Moment_Modal SHALL display as a notification prompt that the user can choose to open
4. THE System SHALL respect the user's "Don't show again" preference for non-guided-tour projects

### Requirement 9: Interactive Elements Integration

**User Story:** As a student, I want Learning Moments to include interactive quizzes and visualizations so I can actively engage with the content.

#### Acceptance Criteria

1. THE Learning_Moment_Modal SHALL integrate the existing InteractiveQuiz component for quiz functionality
2. THE Learning_Moment_Modal SHALL integrate the existing SimplifiedExplanation component for term explanations
3. THE Learning_Moment_Modal SHALL support embedding visualization components (charts, diagrams)
4. WHEN a quiz is completed within a Learning Moment, THE System SHALL display the score and explanation
5. THE System SHALL track quiz attempts and scores as part of Learning Moment progress
6. THE Learning_Moment_Modal SHALL display a progress indicator showing current step within the Learning Moment (content, quiz, summary)

### Requirement 10: Learning Moment Content Definition

**User Story:** As a developer, I want Learning Moment content to be defined in a structured format so content can be easily maintained and extended.

#### Acceptance Criteria

1. THE System SHALL define Learning Moment content in a TypeScript module following the existing learningContent pattern
2. THE content definition SHALL include separate content sets for each model type (image_classification, text_classification, regression, classification)
3. THE content definition SHALL include separate content sets for each Learning Moment type (data, model, next_steps)
4. THE content definition SHALL support dynamic placeholders for contextual data (dataset stats, training metrics)
5. THE content definition SHALL include quiz questions specific to each Learning Moment and model type combination
6. FOR ALL content definitions, parsing the content structure then serializing it back SHALL produce equivalent content (round-trip property)

### Requirement 11: Workflow Integration Points

**User Story:** As a student, I want Learning Moments to appear at the right time in my workflow so the content is relevant to what I just accomplished.

#### Acceptance Criteria

1. THE System SHALL trigger Learn: Data after successful dataset upload on the data collection page
2. THE System SHALL trigger Learn: Model after training completion on the training page
3. THE System SHALL trigger Learn: Next Steps after deployment completion on the deploy page
4. THE System SHALL not trigger a Learning Moment if the user has already completed it for the current project
5. THE System SHALL not trigger a Learning Moment if the user has selected "Don't show again" for that moment type
6. IF a Learning Moment trigger fails, THEN THE System SHALL log the error and allow the workflow to continue without blocking

### Requirement 12: MLWorkflowVisualizer Integration

**User Story:** As a student, I want to see Learning Moments represented in the workflow visualizer so I understand where learning opportunities exist.

#### Acceptance Criteria

1. THE MLWorkflowVisualizer SHALL display Learning Moment indicators at the three trigger points
2. THE MLWorkflowVisualizer SHALL show completion status for each Learning Moment (not started, in progress, completed)
3. WHEN a Learning Moment is available but not completed, THE MLWorkflowVisualizer SHALL display a visual indicator (badge, icon)
4. WHEN a user clicks a Learning Moment indicator in the visualizer, THE System SHALL open the corresponding Learning_Moment_Modal
5. THE MLWorkflowVisualizer SHALL use the existing isLearnStep styling for Learning Moment indicators
