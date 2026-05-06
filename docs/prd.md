# Requirements Document

## 1. Application Overview

### 1.1 Application Name
ModelMentor

### 1.2 Application Description
A no-code machine learning training platform designed for students to build, train, and deploy AI models through plain language descriptions and guided workflows. Users can create various types of ML models including image classification, text classification, and regression models by describing their project goals, uploading data, training models with visual feedback, and deploying results as web demos. The platform emphasizes educational depth by teaching the full ML lifecycle with interactive learning elements including AI-generated visuals, AI-powered personalized quiz questions, simulations, guided tours with pre-loaded sample content, and a debugging sandbox for experimenting with model failure modes. The AI-powered question generator creates personalized quiz questions based on each student's learning history and current understanding level, dynamically analyzing past performance to identify knowledge gaps, generating targeted questions focusing on weak areas, creating variations of missed questions, and ensuring diverse question types. Questions are context-aware and reference students' own trained models and datasets, asking about specific accuracy results from their projects and generating scenarios based on their actual ML experiments. The system adjusts question difficulty in real-time based on answer patterns, identifies prerequisite knowledge for advanced topics, and allows teachers to describe desired questions in plain English for automatic generation. Students can save and share debugging sandbox configurations to bookmark interesting failure modes, and teachers can create assignments with specific configurations for students to analyze. Teachers can also create and save custom failure scenarios beyond the four pre-loaded options, with a scenario builder interface for selecting specific hyperparameter combinations, naming custom scenarios with descriptive labels, sharing custom scenarios with students via unique links, and displaying custom scenarios alongside pre-loaded scenarios in the debugging sandbox. The platform provides classroom-ready materials and lesson plan language to support teachers in delivering structured ML education. Registered students earn shareable badges upon completing all examples for a certain level. Teachers and administrators can access a comprehensive dashboard to manage students, track progress in real-time, identify at-risk learners, and generate automated reports with comprehensive export functionality for data-driven instruction. All student activities are automatically tracked and recorded to provide real-time data for dashboard analytics. Teachers can mark saved configurations as assignments with specific instructions, students can view assigned configurations in a dedicated My Assignments section, teachers can track which students have loaded and analyzed each assignment configuration, and generate reports on assignment completion rates. Super administrators have elevated privileges to manage institutions, colleges, and groups with full CRUD operations for organizational hierarchy management.

## 2. Users and Use Cases

### 2.1 Target Users
  - High school and early college students learning machine learning concepts
  - Teachers creating ML lessons and educational content
  - Administrators monitoring class performance and student progress
  - Super administrators managing institutions, colleges, and groups
  - Hackathon participants demonstrating AI literacy projects

### 2.2 Core Use Cases
  - Students describe an ML project in natural language and receive step-by-step guidance
  - Follow guided tours with pre-loaded sample datasets when no custom data is available
  - Upload custom datasets or select from sample datasets for training
  - Train models with real-time visualization of training metrics
  - Engage with AI-powered personalized quiz questions that adapt to individual learning needs
  - Answer context-aware questions referencing their own trained models and datasets
  - Receive dynamically adjusted question difficulty based on performance patterns
  - Experience progressive question chains that build understanding from foundational to advanced topics
  - Teachers describe desired quiz questions in plain English for automatic generation
  - Teachers review and approve AI-generated questions before student use
  - Access debugging sandbox to intentionally break models and observe failure modes in real time
  - Click pre-loaded failure scenario buttons to automatically configure model with common problematic settings
  - Use failure scenario buttons for quick demonstrations of No Normalization, Learning Rate Too High, Tiny Batch Size, and Insufficient Epochs
  - Teachers create custom failure scenarios using scenario builder interface
  - Teachers select specific hyperparameter combinations for custom scenarios
  - Teachers name custom scenarios with descriptive labels
  - Teachers save custom scenarios to personal library
  - Teachers share custom scenarios with students via unique links
  - Students view and use custom scenarios created by teachers alongside pre-loaded scenarios
  - Save debugging sandbox configurations with custom names and descriptions for future reference
  - Share saved configurations via unique shareable links with classmates or teachers
  - Browse and load saved configurations created by self or shared by others
  - Teachers mark saved configurations as assignments with specific instructions
  - Teachers share assignment configurations with students via unique assignment links
  - Students view assigned configurations in dedicated My Assignments section
  - Students load and analyze assignment configurations to complete assignments
  - Teachers track which students have loaded and analyzed each assignment configuration
  - Teachers generate reports on assignment completion rates
  - Test trained models and evaluate performance with visual feedback
  - Deploy trained models as shareable web demos
  - Register after completing 10 tries or exercises to continue using the platform
  - Verify email address by clicking confirmation link sent to inbox during registration
  - Resend verification email if initial email not received
  - Request password reset via email when unable to sign in
  - Receive secure password reset link and set new password with visual strength feedback
  - Registered students complete all examples for a certain level to earn badges
  - Share earned badges on LinkedIn
  - Teachers access and download classroom-ready lesson plans and teaching materials
  - Teachers customize lesson plans based on curriculum requirements
  - Teachers and administrators view real-time student progress on ML concepts based on automatically tracked activity data
  - Teachers and administrators receive alerts for at-risk students based on tracked performance metrics
  - Teachers and administrators switch between class overview and individual student views
  - Teachers and administrators generate automated reports on concept understanding and performance using real activity data
  - Teachers export reports as PDF or CSV files with customizable date ranges and filtering options
  - Teachers schedule automated weekly or monthly report delivery via email with reports sent as attachments
  - Teachers use error pattern analysis to guide lesson planning
  - Super administrators create, view, update, and delete institutions
  - Super administrators create, view, update, and delete colleges within institutions
  - Super administrators create, view, update, and delete groups within colleges
  - Super administrators assign administrators to institutions, colleges, or groups
  - Super administrators view organizational hierarchy and manage relationships between entities

## 3. Page Structure and Functionality

### 3.1 Page Structure
```
- Project Creation Page
- Data Collection Page
- Interactive Learning Module
  - AI-Powered Quiz Interface
  - Teacher Question Generator Interface
- Model Training Page
- Debugging Sandbox Page
  - Configuration Save Dialog
  - Saved Configurations Library
  - Configuration Share Page
  - Assignment Creation Dialog
  - My Assignments Page
  - Custom Failure Scenario Builder
  - Custom Scenario Library
  - Custom Scenario Share Page
- Testing & Evaluation Page
- Export & Share Page
- Registration Page
- Email Verification Page
- Password Reset Request Page
- Password Reset Page
- Teacher Resources Page
- Badge & Achievement Page
- Teacher & Admin Dashboard
  - Class Overview View
  - Individual Student View
  - At-Risk Alerts View
  - Reports Generation View
  - Assignment Tracking View
- Super Admin Dashboard
  - Institution Management View
  - College Management View
  - Group Management View
  - Organizational Hierarchy View
```

### 3.2 Project Creation Page
**Functionality:**
  - Text input field for users to describe their ML project in plain language
  - Submit button to process the description and proceed to next step
  - Display parsed project information including task type (image classification, text classification, regression) and suggested approach
  - Option to start guided tour for first-time users or those without custom data
  - For teachers: Display corresponding lesson plan objectives and learning outcomes for the selected project type
  - Automatically track and record project creation activity including timestamp, student ID, project type, and project description

**UI/UX Requirements:**
  - Clean, minimalist interface with clear visual hierarchy
  - Large, prominent text input area with placeholder text providing examples
  - Visual feedback during description processing with loading indicator
  - Clear call-to-action buttons with intuitive labels
  - Helpful tooltips and contextual hints for first-time users

### 3.3 Data Collection Page
**Functionality:**
  - For image classification: Option to upload custom images from local device
  - For text classification: Option to upload text files or input text samples directly
  - For regression: Option to upload CSV files with numerical data
  - Option to select from pre-loaded sample datasets for all model types
  - Guided tour mode that automatically selects appropriate sample dataset based on project description
  - Display uploaded data in appropriate format (grid view for images, table for text/numerical data)
  - Show current dataset statistics including total samples and class distribution or data range
  - Navigation button to proceed to interactive learning module once minimum data requirements are met
  - For teachers: Display lesson plan section explaining data collection concepts and classroom discussion prompts
  - Automatically track and record data collection activity including timestamp, student ID, data type, data source (custom or sample), and number of samples uploaded

**UI/UX Requirements:**
  - Drag-and-drop upload interface with clear visual feedback
  - Preview thumbnails for uploaded content
  - Progress indicators for upload status
  - Sample dataset cards with clear descriptions and preview images
  - Real-time dataset statistics displayed in easy-to-read format
  - Color-coded status indicators for data requirements
  - Smooth transitions between upload modes

### 3.4 Interactive Learning Module
**Functionality:**
  - Display AI-generated visuals explaining ML concepts relevant to the user project and model type
  - Present AI-powered personalized quiz questions that adapt to individual student learning needs
  - Generate quiz questions dynamically based on student learning history and current understanding level
  - Analyze student past performance to identify knowledge gaps and weak areas
  - Create targeted questions focusing on identified weak areas with appropriate difficulty
  - Generate variations of previously missed questions to reinforce learning
  - Ensure diverse question types to maintain engagement
  - Present context-aware questions that reference student own trained models and datasets
  - Ask questions about specific accuracy results from student projects
  - Generate scenarios based on student actual ML experiments
  - Connect quiz content to hands-on work for deeper understanding
  - Adjust question difficulty in real-time based on answer patterns
  - Increase question complexity after consecutive correct answers
  - Simplify questions when student struggles with multiple incorrect attempts
  - Maintain optimal challenge level to prevent frustration or boredom
  - Identify prerequisite knowledge for advanced topics
  - Generate foundational questions before presenting complex ones
  - Create question chains that build understanding progressively
  - Ensure solid mastery of basics before advancing to advanced concepts
  - Provide simulations demonstrating scenarios such as training with bad data or insufficient samples
  - Show educational feedback based on quiz responses
  - Navigation button to proceed to training page after completing learning activities
  - For teachers: Display lesson plan section with teaching notes, key vocabulary terms, and suggested classroom activities
  - For teachers: Provide natural language question input interface for describing desired questions
  - For teachers: Automatically generate multiple question variations from plain English descriptions
  - For teachers: Suggest answer options and explanations for generated questions
  - For teachers: Allow review and approval of AI-generated questions before student use
  - Validate generated questions for accuracy and clarity
  - Ensure explanations are beginner-friendly and correct
  - Flag ambiguous or poorly worded questions for teacher review
  - Continuously improve question generation based on student feedback and performance data
  - Automatically track and record learning module activity including:
    + Timestamp when student enters and exits the module
    + Student ID
    + Concepts viewed with time spent on each concept
    + Quiz questions answered with correct/incorrect status for each question
    + Specific concepts associated with each quiz question
    + Question difficulty level for each quiz question
    + Number of question variations presented for each concept
    + Simulation interactions and completion status
    + Total time spent in the learning module

**UI/UX Requirements:**
  - Engaging visual design with animations and illustrations
  - Interactive elements with hover states and click feedback
  - Progress bar showing completion status
  - Clear visual distinction between different learning activities
  - Immediate feedback for quiz responses with explanations
  - Visual indicators showing question difficulty level
  - Smooth page transitions and animations
  - For teachers: Intuitive question generator interface with text input field
  - For teachers: Preview panel showing generated questions before approval
  - For teachers: Edit and refine options for generated questions

### 3.5 Model Training Page
**Functionality:**
  - Start training button to initiate model training process
  - Real-time visualization of training progress including:
    + Current epoch number
    + Training accuracy curve (for classification) or error metrics (for regression)
    + Loss curve
  - Pause and stop training controls
  - Display estimated time remaining
  - Navigation button to debugging sandbox page after training completion
  - Automatic navigation to testing page upon training completion if user skips debugging sandbox
  - For teachers: Display lesson plan section explaining training concepts and observation prompts for students
  - Automatically track and record training activity including timestamp, student ID, model type, training start time, training end time, training duration, final accuracy or error metrics, and training completion status

**UI/UX Requirements:**
  - Large, prominent start button with clear visual state
  - Real-time animated charts with smooth updates
  - Clear visual indicators for training status
  - Intuitive control buttons with icons and labels
  - Progress visualization with percentage and time estimates
  - Responsive layout adapting to different screen sizes
  - Success animation upon training completion

### 3.6 Debugging Sandbox Page
**Functionality:**
  - Display trained model configuration with adjustable hyperparameters including:
    + Learning rate slider with range from 0.0001 to 1.0
    + Data normalization toggle (enable/disable)
    + Batch size selector
    + Number of training epochs selector
  - Display pre-loaded failure scenario buttons for quick demonstrations:
    + No Normalization button: Automatically sets normalization to disabled while keeping other parameters at optimal values
    + Learning Rate Too High button: Automatically sets learning rate to 0.8 or higher while keeping other parameters at optimal values
    + Tiny Batch Size button: Automatically sets batch size to 1 or 2 while keeping other parameters at optimal values
    + Insufficient Epochs button: Automatically sets training epochs to very low value (e.g., 5) while keeping other parameters at optimal values
  - Display custom failure scenarios created by teachers alongside pre-loaded scenarios
  - Custom scenarios appear with teacher-defined names and descriptions
  - Custom scenarios apply teacher-specified hyperparameter combinations when clicked
  - For teachers: Display Create Custom Scenario button to access scenario builder interface
  - Each failure scenario button applies its specific problematic configuration with one click
  - Failure scenario buttons are clearly labeled and visually distinct from manual hyperparameter controls
  - Option to manually adjust hyperparameters to create custom problematic configurations
  - Retrain button to apply selected configuration and observe results
  - Real-time animated training curve visualizations during retraining showing:
    + Loss curves over epochs with separate lines for training loss and validation loss
    + Accuracy curves over epochs (for classification) with separate lines for training accuracy and validation accuracy
    + Error metric curves over epochs (for regression) with separate lines for training error and validation error
    + Smooth animated updates as each epoch completes
    + Visual indicators demonstrating overfitting patterns when training metrics improve but validation metrics degrade
    + Visual indicators demonstrating underfitting patterns when both training and validation metrics remain poor
  - Real-time visualization of failure modes including:
    + Diverging loss curves showing model failing to converge
    + Erratic accuracy fluctuations
    + Gradient explosion or vanishing indicators
    + Overfitting or underfitting patterns clearly visible through training vs validation curve separation
  - Side-by-side comparison view showing:
    + Original well-trained model performance metrics with training and validation curves
    + Broken model performance metrics with selected misconfiguration showing training and validation curves
  - Educational explanations for each failure mode including:
    + Why the misconfiguration causes the observed failure
    + Real-world scenarios where such issues occur
    + Best practices to avoid the problem
    + Specific interpretation of training vs validation curve patterns
  - Save Configuration button to save current hyperparameter settings with custom name and description
  - Saved Configurations button to access library of saved configurations
  - My Assignments button for students to access assigned configurations
  - Share Configuration button to generate shareable link for current configuration
  - For teachers: Mark as Assignment button to create assignment from saved configuration
  - Load Configuration option to apply saved or shared configuration settings
  - Reset button to restore original well-trained model configuration
  - Navigation button to proceed to testing page
  - Option to skip debugging sandbox and proceed directly to testing
  - For teachers: Display lesson plan section explaining debugging concepts, common pitfalls, failure scenario demonstrations, and discussion prompts
  - Automatically track and record debugging sandbox activity including:
    + Timestamp when student enters and exits the sandbox
    + Student ID
    + Hyperparameter configurations tested
    + Failure scenario buttons clicked (both pre-loaded and custom)
    + Custom scenario IDs used
    + Failure modes observed
    + Time spent experimenting with different configurations
    + Number of retraining attempts
    + Configurations saved with names and descriptions
    + Configurations shared with generated link IDs
    + Configurations loaded from saved library or shared links
    + Assignment configurations loaded with assignment IDs
    + Assignment completion timestamps

**UI/UX Requirements:**
  - Clear layout with hyperparameter controls prominently displayed
  - Failure scenario buttons displayed in prominent section above or beside manual hyperparameter controls
  - Pre-loaded and custom failure scenario buttons displayed together in unified section
  - Each failure scenario button clearly labeled with descriptive name
  - Custom scenarios visually distinguished from pre-loaded scenarios with subtle styling differences
  - Failure scenario buttons use distinct visual styling (e.g., color-coded or icon-based) to differentiate from manual controls
  - Hover tooltips on failure scenario buttons explaining what configuration will be applied
  - Visual feedback when failure scenario button is clicked showing which parameters were changed
  - For teachers: Create Custom Scenario button prominently displayed with clear icon
  - For teachers: Mark as Assignment button prominently displayed with clear icon
  - For students: My Assignments button prominently displayed with clear icon and notification badge showing unviewed assignments
  - Interactive sliders and toggles with real-time value display for manual adjustments
  - Visual indicators for problematic configuration choices (e.g., warning icons for high learning rate)
  - Split-screen comparison view with synchronized scrolling
  - Animated charts showing real-time training progress during retraining with smooth curve updates
  - Separate color-coded lines for training curves (e.g., blue) and validation curves (e.g., orange)
  - Legend clearly identifying training vs validation curves
  - Visual highlighting when overfitting occurs (validation curve diverging upward from training curve for loss, or downward for accuracy)
  - Visual highlighting when underfitting occurs (both curves remaining flat or poor)
  - Color-coded performance metrics (green for good, red for poor)
  - Expandable educational explanation panels with clear typography
  - Prominent reset button to restore safe configuration
  - Smooth transitions between different configurations
  - Tooltips explaining each hyperparameter and its impact
  - Real-time epoch counter updating during retraining
  - Save Configuration button with clear icon and label
  - Share Configuration button with link icon
  - Saved Configurations button with library icon
  - Visual confirmation when configuration is saved or shared

### 3.7 Configuration Save Dialog
**Functionality:**
  - Display modal dialog when user clicks Save Configuration button
  - Text input field for configuration name (required)
  - Text area for configuration description (optional)
  - Display current hyperparameter values being saved
  - Save button to confirm and store configuration
  - Cancel button to close dialog without saving
  - Validate configuration name is not empty before saving
  - Store configuration in database with:
    + Configuration name
    + Configuration description
    + Hyperparameter values (learning rate, normalization, batch size, epochs)
    + Creator user ID
    + Creation timestamp
    + Associated model type
    + Assignment status (false by default)
  - Display success message after configuration is saved
  - Automatically track configuration save activity

**UI/UX Requirements:**
  - Modal dialog with clear title
  - Labeled input fields with placeholder text
  - Display summary of hyperparameter values being saved
  - Clear save and cancel buttons
  - Input validation with error messages
  - Success confirmation message
  - Smooth modal open and close animations

### 3.8 Saved Configurations Library
**Functionality:**
  - Display list of all configurations saved by current user
  - Display list of configurations shared by others that user has accessed
  - For teachers: Display configurations created for assignments with assignment indicator
  - Show configuration cards with:
    + Configuration name
    + Configuration description
    + Creator name
    + Creation date
    + Hyperparameter values summary
    + Model type
    + Assignment status indicator (for teachers)
  - Load button on each configuration card to apply settings to current sandbox
  - Share button on each configuration card to generate shareable link
  - For teachers: Mark as Assignment button on configurations created by teacher
  - For teachers: View Assignment Details button on assignment configurations showing student completion status
  - Delete button on configurations created by current user
  - Filter configurations by model type
  - Filter configurations by assignment status (for teachers)
  - Search configurations by name or description
  - Sort configurations by creation date or name
  - Display message when no saved configurations exist
  - Close button to return to debugging sandbox

**UI/UX Requirements:**
  - Grid or list layout for configuration cards
  - Clear visual hierarchy for configuration information
  - Assignment indicator badge on configuration cards marked as assignments
  - Hover states for interactive elements
  - Confirmation dialog before deleting configuration
  - Filter and search controls prominently displayed
  - Empty state message with helpful guidance
  - Smooth transitions when loading configurations

### 3.9 Configuration Share Page
**Functionality:**
  - Display when user clicks Share Configuration button
  - Generate unique shareable link for selected configuration
  - Display shareable link in copyable text field
  - Copy to clipboard button with visual confirmation
  - Display configuration details including:
    + Configuration name
    + Configuration description
    + Hyperparameter values
    + Creator name
  - QR code generation for easy mobile sharing
  - Close button to return to debugging sandbox
  - Track configuration sharing activity

**UI/UX Requirements:**
  - Clean layout with shareable link prominently displayed
  - One-click copy button with success animation
  - QR code displayed clearly for scanning
  - Configuration details shown in readable format
  - Success messages for completed actions

### 3.10 Assignment Creation Dialog
**Functionality:**
  - Display modal dialog when teacher clicks Mark as Assignment button on saved configuration
  - Display configuration details including name, description, and hyperparameter values
  - Text area for assignment instructions (required)
  - Text input field for assignment title (optional, defaults to configuration name)
  - Date picker for assignment due date (optional)
  - Checkbox to notify students via email when assignment is created
  - Save Assignment button to mark configuration as assignment and store assignment details
  - Cancel button to close dialog without creating assignment
  - Validate assignment instructions are not empty before saving
  - Update configuration in database with:
    + Assignment status set to true
    + Assignment instructions
    + Assignment title
    + Assignment due date
    + Assignment creation timestamp
    + Assignment creator teacher ID
  - Generate unique assignment link for sharing with students
  - Display success message with assignment link after assignment is created
  - Automatically track assignment creation activity

**UI/UX Requirements:**
  - Modal dialog with clear title
  - Display configuration summary at top of dialog
  - Labeled text area for assignment instructions with placeholder text
  - Labeled text input for assignment title with placeholder text
  - Date picker with calendar interface for due date selection
  - Checkbox with clear label for email notification option
  - Clear save and cancel buttons
  - Input validation with error messages
  - Success confirmation message with copyable assignment link
  - Smooth modal open and close animations

### 3.11 My Assignments Page
**Functionality:**
  - Display dedicated page for students to view all assigned configurations
  - Show assignment cards with:
    + Assignment title
    + Assignment instructions
    + Configuration name
    + Teacher name
    + Assignment creation date
    + Assignment due date (if set)
    + Completion status (Not Started, In Progress, Completed)
    + Hyperparameter values summary
  - Load Assignment button on each card to load configuration into debugging sandbox
  - Mark as Completed button on each card after student has analyzed the configuration
  - Filter assignments by completion status
  - Filter assignments by due date (upcoming, overdue, no due date)
  - Sort assignments by creation date, due date, or completion status
  - Display notification badge on My Assignments button showing number of unviewed assignments
  - Display message when no assignments exist
  - Close button to return to debugging sandbox
  - Automatically track assignment viewing and loading activity

**UI/UX Requirements:**
  - Grid or list layout for assignment cards
  - Clear visual hierarchy for assignment information
  - Color-coded completion status indicators (gray for Not Started, yellow for In Progress, green for Completed)
  - Overdue assignments highlighted with red border or indicator
  - Prominent Load Assignment button on each card
  - Mark as Completed button with confirmation dialog
  - Filter and sort controls prominently displayed
  - Empty state message with helpful guidance
  - Notification badge on My Assignments button with count of unviewed assignments
  - Smooth transitions when loading assignments

### 3.12 Custom Failure Scenario Builder
**Functionality:**
  - Display scenario builder interface when teacher clicks Create Custom Scenario button
  - Provide hyperparameter selection controls:
    + Learning rate slider with range from 0.0001 to 1.0
    + Data normalization toggle (enable/disable)
    + Batch size selector with available options
    + Training epochs selector with available options
  - Display real-time preview of selected hyperparameter combination
  - Text input field for custom scenario name (required)
  - Text area for custom scenario description (optional)
  - Save Custom Scenario button to store scenario in teacher library
  - Cancel button to close builder without saving
  - Validate scenario name is not empty before saving
  - Store custom scenario in database with:
    + Scenario name
    + Scenario description
    + Hyperparameter values (learning rate, normalization, batch size, epochs)
    + Creator teacher ID
    + Creation timestamp
    + Associated model type
  - Display success message after custom scenario is saved
  - Automatically track custom scenario creation activity

**UI/UX Requirements:**
  - Modal dialog or dedicated page with clear title
  - Intuitive hyperparameter selection controls matching debugging sandbox interface
  - Real-time preview showing selected values
  - Labeled input fields for scenario name and description with placeholder text
  - Clear visual distinction between required and optional fields
  - Save and cancel buttons with clear labels
  - Input validation with error messages
  - Success confirmation message
  - Smooth transitions and animations

### 3.13 Custom Scenario Library
**Functionality:**
  - Display list of all custom scenarios created by current teacher
  - Show custom scenario cards with:
    + Scenario name
    + Scenario description
    + Hyperparameter values summary
    + Creation date
    + Model type
    + Usage count (number of times used by students)
  - Edit button on each scenario card to modify scenario details
  - Share button on each scenario card to generate shareable link
  - Delete button on each scenario card to remove scenario
  - Filter scenarios by model type
  - Search scenarios by name or description
  - Sort scenarios by creation date, name, or usage count
  - Display message when no custom scenarios exist
  - Close button to return to debugging sandbox

**UI/UX Requirements:**
  - Grid or list layout for scenario cards
  - Clear visual hierarchy for scenario information
  - Hover states for interactive elements
  - Confirmation dialog before deleting scenario
  - Filter and search controls prominently displayed
  - Empty state message with helpful guidance and call-to-action to create first scenario
  - Smooth transitions when loading or editing scenarios

### 3.14 Custom Scenario Share Page
**Functionality:**
  - Display when teacher clicks Share button on custom scenario
  - Generate unique shareable link for selected custom scenario
  - Display shareable link in copyable text field
  - Copy to clipboard button with visual confirmation
  - Display custom scenario details including:
    + Scenario name
    + Scenario description
    + Hyperparameter values
    + Creator teacher name
  - QR code generation for easy mobile sharing
  - Close button to return to custom scenario library
  - Track custom scenario sharing activity

**UI/UX Requirements:**
  - Clean layout with shareable link prominently displayed
  - One-click copy button with success animation
  - QR code displayed clearly for scanning
  - Custom scenario details shown in readable format
  - Success messages for completed actions
  - Smooth transitions and animations

### 3.15 AI-Powered Quiz Interface
**Functionality:**
  - Display personalized quiz questions generated by AI system
  - Present questions with appropriate difficulty level based on student current understanding
  - Show context-aware questions referencing student own trained models and datasets
  - Display multiple choice, true/false, or short answer question formats
  - Provide immediate feedback for each answer with explanations
  - Track answer patterns to adjust subsequent question difficulty
  - Display progress indicator showing quiz completion status
  - Show visual indicators for question difficulty level
  - Allow students to skip questions and return later
  - Provide hints for challenging questions when student struggles
  - Display summary of quiz performance upon completion
  - Automatically track quiz activity including questions answered, correct/incorrect status, difficulty level, and time spent

**UI/UX Requirements:**
  - Clean question display with clear typography
  - Visual difficulty indicators using color coding or icons
  - Interactive answer selection with hover states
  - Immediate visual feedback for correct and incorrect answers
  - Expandable explanation panels with clear formatting
  - Progress bar showing quiz completion percentage
  - Skip and hint buttons clearly labeled
  - Summary screen with performance metrics and concept mastery indicators

### 3.16 Teacher Question Generator Interface
**Functionality:**
  - Display text input field for teachers to describe desired questions in plain English
  - Accept natural language descriptions such as \"Create a question about overfitting for intermediate students\"
  - Process teacher input and generate multiple question variations automatically
  - Display generated questions in preview panel with answer options and explanations
  - Allow teachers to edit question text, answer options, and explanations
  - Provide difficulty level selector for generated questions
  - Allow teachers to specify target concepts or topics for questions
  - Generate diverse question types including multiple choice, true/false, and scenario-based questions
  - Validate generated questions for accuracy and clarity
  - Flag ambiguous or poorly worded questions for teacher review
  - Allow teachers to approve or reject generated questions
  - Save approved questions to question bank for student use
  - Display question generation history with timestamps
  - Automatically track question generation activity

**UI/UX Requirements:**
  - Intuitive text input area with placeholder examples
  - Generate button with loading indicator during processing
  - Preview panel displaying generated questions in organized layout
  - Edit controls for modifying question components
  - Difficulty level dropdown with clear labels
  - Concept selector with searchable list
  - Approve and reject buttons with clear visual states
  - Question bank view showing saved questions
  - Generation history timeline with expandable entries
  - Success messages for approved questions

### 3.17 Testing & Evaluation Page
**Functionality:**
  - For image classification: Upload test images to evaluate model performance
  - For text classification: Input test text samples
  - For regression: Input test data points
  - Guided tour mode provides pre-loaded test samples matching the training dataset
  - Display prediction results with confidence scores (classification) or predicted values (regression)
  - Show confusion matrix visualization for classification tasks
  - Display overall accuracy metrics for classification or error metrics for regression
  - Option to return to training page for model refinement
  - Navigation button to export page
  - For teachers: Display lesson plan section with evaluation rubrics and assessment criteria
  - Automatically track and record testing activity including timestamp, student ID, number of test samples evaluated, evaluation metrics achieved, and time spent on testing

**UI/UX Requirements:**
  - Intuitive test input interface matching data type
  - Instant visual feedback for predictions
  - Clear, color-coded confidence scores
  - Interactive confusion matrix with tooltips
  - Summary cards displaying key metrics
  - Visual comparison between expected and predicted results
  - Easy-to-find navigation options

### 3.18 Export & Share Page
**Functionality:**
  - Generate shareable web demo link for the trained model
  - Display embed code for integration into other platforms
  - Preview the deployed model interface
  - Copy link and embed code buttons
  - For registered students: Display notification when completing all examples for a level
  - For teachers: Display lesson plan section with project presentation guidelines and reflection prompts
  - Automatically track and record export activity including timestamp, student ID, project completion status, and deployment link generated

**UI/UX Requirements:**
  - Clean layout with clear sections for different sharing options
  - One-click copy buttons with visual confirmation
  - Live preview of deployed model
  - QR code generation for easy mobile sharing
  - Social media sharing buttons
  - Clear instructions for embedding
  - Success messages for completed actions
  - Badge unlock notification with celebration animation

### 3.19 Registration Page
**Functionality:**
  - Display registration form when user reaches 10 tries or exercises limit
  - Collect user information including:
    + Email address
    + First name
    + Last name
    + Username
    + Password
  - Submit button to create account
  - Option to sign in if user already has an account
  - Send verification email to provided email address upon successful registration
  - Display message informing user to check inbox for verification email
  - Automatically track and record registration activity including timestamp and user ID

**UI/UX Requirements:**
  - Clear explanation of why registration is required
  - Simple form with clearly labeled required fields
  - Visual indicator showing number of tries remaining before registration required
  - Easy-to-complete registration process
  - Input validation for email format and password strength
  - Clear field labels for each input
  - Success message with instructions to verify email

### 3.20 Email Verification Page
**Functionality:**
  - Display verification status when user clicks confirmation link from email
  - Show success message when email is successfully verified
  - Show error message if verification link is invalid or expired
  - Provide button to resend verification email if link expired
  - Redirect to login page after successful verification
  - Display message if user attempts to access platform features before verifying email
  - Provide resend verification email option on restricted access pages
  - Track verification attempts and resend requests

**UI/UX Requirements:**
  - Clear status messages for verification success or failure
  - Prominent resend button with loading state during email sending
  - Visual confirmation when verification email is resent
  - Countdown timer before allowing another resend request
  - Clear instructions for checking spam folder if email not received
  - Friendly error messages with actionable guidance

### 3.21 Password Reset Request Page
**Functionality:**
  - Display password reset request form accessible from login page
  - Collect email address associated with user account
  - Submit button to request password reset
  - Validate email address format before submission
  - Send password reset email containing secure reset link to provided email address
  - Display confirmation message instructing user to check inbox for reset email
  - Password reset link valid for 1 hour from generation time
  - Track password reset requests including timestamp and email address

**UI/UX Requirements:**
  - Simple form with single email input field
  - Clear instructions explaining password reset process
  - Input validation with error messages for invalid email format
  - Submit button with loading state during email sending
  - Success message with instructions to check email inbox and spam folder
  - Link to return to login page
  - Friendly and reassuring tone in all messaging

### 3.22 Password Reset Page
**Functionality:**
  - Display password reset form when user clicks reset link from email
  - Validate reset token from URL parameter
  - Show error message if reset token is invalid or expired
  - Collect new password with confirmation field
  - Display visual password strength meter showing weak, medium, or strong indicators
  - Password strength meter evaluates:
    + Password length (minimum 8 characters)
    + Presence of uppercase letters
    + Presence of lowercase letters
    + Presence of numbers
    + Presence of special characters
  - Provide real-time feedback as user types password
  - Update strength indicator dynamically based on password complexity
  - Validate password strength and match between password fields
  - Submit button to update password
  - Update user password in database upon successful submission
  - Display success message after password update
  - Redirect to login page after successful password reset
  - Provide option to request new reset link if token expired
  - Track password reset completions including timestamp and user ID

**UI/UX Requirements:**
  - Clear form with password and confirm password fields
  - Visual password strength meter with color-coded indicators:
    + Red for weak passwords
    + Yellow or orange for medium strength passwords
    + Green for strong passwords
  - Strength meter updates in real-time as user types
  - Display specific requirements being met or missing below strength meter
  - Show/hide password toggle for both fields
  - Real-time validation feedback for password match
  - Submit button with loading state during password update
  - Success message with automatic redirect countdown
  - Error messages for invalid or expired tokens with actionable guidance
  - Link to request new reset link if token expired

### 3.23 Teacher Resources Page
**Functionality:**
  - Display comprehensive lesson plans for each model type (image classification, text classification, regression)
  - Each lesson plan includes:
    + Learning objectives aligned with educational standards
    + Estimated class duration and recommended grade levels
    + Required materials and preparation steps
    + Step-by-step teaching instructions for each platform page
    + Key vocabulary and concept definitions
    + Classroom discussion prompts and guiding questions
    + Suggested group activities and individual exercises
    + Assessment rubrics and evaluation criteria
    + Extension activities for advanced learners
    + Troubleshooting tips for common student challenges
    + Debugging sandbox assignment ideas with suggested configurations
    + Guidance on using pre-loaded failure scenario buttons for classroom demonstrations
    + Guidance on creating and using custom failure scenarios for targeted learning objectives
    + Guidance on creating and managing assignments with saved configurations
    + Guidance on using AI-powered question generator for creating personalized quizzes
    + Examples of natural language prompts for generating effective quiz questions
  - Download button to export lesson plans as PDF files
  - Print-friendly formatting option
  - Filter lesson plans by model type, difficulty level, and class duration
  - Search functionality to find specific topics or activities
  - Automatically track and record teacher resource access including timestamp, teacher ID, lesson plan viewed, and download activity

**UI/UX Requirements:**
  - Organized layout with clear navigation between different lesson plans
  - Expandable sections for easy browsing
  - Preview mode before downloading
  - Clear visual hierarchy for lesson plan components
  - Printer-friendly styling
  - Responsive design for tablet viewing during class

### 3.24 Badge & Achievement Page
**Functionality:**
  - Display all earned badges with unlock dates
  - Show progress toward next badge including number of examples completed and remaining
  - Display badge details including level name and completion requirements
  - Share to LinkedIn button for each earned badge
  - Generate shareable badge image with student name and achievement details
  - Automatically track and record badge achievement activity including timestamp, student ID, badge earned, and sharing activity

**UI/UX Requirements:**
  - Visual badge gallery with locked and unlocked states
  - Progress bars showing completion status for each level
  - Clear visual distinction between earned and locked badges
  - One-click LinkedIn sharing with pre-filled post text
  - Celebration animations when viewing newly earned badges
  - Downloadable badge images for portfolio use

### 3.25 Teacher & Admin Dashboard

#### 3.25.1 Class Overview View
**Functionality:**
  - Display list of all classes with student count and overall performance summary
  - Show class-level mastery metrics for key ML concepts including gradient descent, overfitting, bias and variance, regularization, and model evaluation based on real tracked quiz performance and activity data
  - Display aggregate statistics including average time spent per concept, average quiz scores, and completion rates calculated from tracked activity data
  - Highlight top-performing and struggling concepts across the class based on real performance metrics
  - Show recent class activity timeline populated with actual tracked student activities
  - Filter and sort classes by performance metrics or activity date
  - Navigation to individual student view
  - Navigation to assignment tracking view
  - All data displayed is derived from automatically tracked student activities throughout the platform

**UI/UX Requirements:**
  - Dashboard layout with summary cards for key metrics
  - Color-coded performance indicators
  - Interactive charts showing concept mastery distribution
  - Quick-access buttons to drill down into specific classes or students
  - Quick-access button to view assignment tracking
  - Responsive grid layout for class cards

#### 3.25.2 Individual Student View
**Functionality:**
  - Display student profile with name, registration date, email verification status, and overall progress
  - Show detailed mastery status for each ML concept with percentage scores calculated from tracked quiz performance
  - Display timeline of student activities including projects completed, quizzes taken, debugging sandbox experiments, and time spent on each concept, all populated from tracked activity data
  - Show quiz performance breakdown by concept with correct and incorrect answers from tracked quiz responses
  - Display question difficulty progression showing how AI system adjusted difficulty based on student performance
  - Show number of question variations presented for each concept
  - Display error patterns and common mistakes for each concept based on tracked incorrect quiz answers
  - Show badges earned and progress toward next badge based on tracked project completions
  - Display training history including model types trained and performance metrics from tracked training activities
  - Show debugging sandbox activity including:
    + Hyperparameter configurations tested
    + Failure scenario buttons clicked (both pre-loaded and custom)
    + Custom scenario IDs used
    + Failure modes observed
    + Configurations saved by student
    + Configurations shared by student
    + Assignment configurations loaded and analyzed
  - Display assignment completion status with list of completed and pending assignments
  - Show assignment completion timestamps and time spent on each assignment
  - Navigation back to class overview
  - All data displayed is derived from automatically tracked student activities throughout the platform

**UI/UX Requirements:**
  - Clean profile layout with student information at top
  - Visual progress bars for concept mastery
  - Interactive timeline with expandable activity details
  - Color-coded error pattern visualization
  - Tabbed interface for different data views
  - Clear section for debugging sandbox activity
  - Clear section for assignment completion status
  - Clear section for AI-powered quiz performance with difficulty progression
  - Visual distinction between pre-loaded and custom scenario usage
  - Visual distinction between completed and pending assignments

#### 3.25.3 At-Risk Alerts View
**Functionality:**
  - Display list of students flagged as at-risk based on performance analytics calculated from tracked activity data
  - Show specific concepts each student is struggling with identified from tracked quiz performance and time spent data
  - Display alert criteria including low quiz scores, extended time on concepts without progress, repeated errors, or incomplete assignments, all determined from tracked activity metrics
  - Show recommended interventions for each at-risk student
  - Filter alerts by severity level, concept, or class
  - Mark alerts as addressed or resolved
  - Navigation to individual student view for detailed analysis
  - All alerts are generated automatically based on real tracked student performance data

**UI/UX Requirements:**
  - Alert cards with clear severity indicators
  - Color-coded priority levels
  - Quick-action buttons for common interventions
  - Sortable and filterable alert list
  - Visual indicators for unresolved alerts

#### 3.25.4 Reports Generation View
**Functionality:**
  - Generate automated reports on concept understanding across class or individual students using real tracked activity data
  - Display error pattern analysis showing common misconceptions calculated from tracked quiz responses (e.g., 60% of students confuse bias and variance)
  - Show time spent analysis by concept and student from tracked time data
  - Display improvement trends over time with before-and-after comparisons based on tracked performance metrics
  - Generate reports on quiz performance by concept using tracked quiz data
  - Include AI-powered quiz metrics showing:
    + Average question difficulty progression for each student
    + Number of question variations presented per concept
    + Effectiveness of adaptive difficulty adjustment
    + Correlation between question difficulty and student mastery
  - Show completion rates for projects and learning modules from tracked activity data
  - Include debugging sandbox activity metrics in reports showing:
    + Experimentation patterns
    + Failure scenario button usage (both pre-loaded and custom)
    + Custom scenario usage statistics
    + Failure mode understanding
    + Configuration saving and sharing activity
    + Assignment completion rates
  - Include assignment-specific metrics in reports showing:
    + Assignment completion rates by class or student
    + Average time spent on assignments
    + Assignment completion trends over time
    + Most challenging assignments based on completion rates
  - Export reports as PDF or CSV files with the following options:
    + Select export format: PDF with charts and graphs, or CSV with raw data
    + Customize date range using calendar date picker with start date and end date
    + Filter by specific student or group of students
    + Filter by specific ML concept or all concepts
    + Include or exclude charts and graphs in PDF export
    + Preview report before exporting
  - Schedule automated report generation and delivery:
    + Select delivery frequency: weekly or monthly
    + Choose delivery day for weekly reports (e.g., every Monday)
    + Choose delivery date for monthly reports (e.g., 1st of each month)
    + Enter recipient email addresses (support multiple recipients)
    + Select report format for automated delivery: PDF or CSV
    + Configure report filters for automated reports (date range, students, concepts)
    + Enable or disable scheduled reports
    + View list of active scheduled reports with edit and delete options
    + Customize email subject line and message body for scheduled report delivery
    + Receive delivery confirmation notifications when reports are successfully sent
    + Receive error notifications if report delivery fails, including failure reason
  - All report data is derived from automatically tracked student activities throughout the platform

**UI/UX Requirements:**
  - Report builder interface with customizable parameters organized in clear sections
  - Visual charts and graphs for data presentation in PDF reports
  - Preview mode before exporting with full report visualization
  - Clear data tables with sortable columns
  - Download buttons with format selection dropdown
  - Scheduled report management interface with list view of active schedules
  - Calendar date picker for date range selection
  - Multi-select dropdown for student and concept filtering
  - Toggle switches for including charts in PDF export
  - Email input field with validation for multiple recipients
  - Frequency selector with radio buttons for weekly or monthly options
  - Day/date selector based on chosen frequency
  - Text input fields for customizing email subject and message body
  - Success confirmation messages for scheduled report creation
  - Edit and delete buttons for managing scheduled reports
  - Notification indicators for delivery confirmations and errors

#### 3.25.5 Assignment Tracking View
**Functionality:**
  - Display list of all assignments created by teacher with assignment details
  - Show assignment cards with:
    + Assignment title
    + Configuration name
    + Assignment creation date
    + Assignment due date (if set)
    + Number of students assigned
    + Number of students who have viewed the assignment
    + Number of students who have loaded the configuration
    + Number of students who have completed the assignment
    + Completion rate percentage
  - Click on assignment card to view detailed student completion status
  - Detailed view shows list of all students with:
    + Student name
    + Viewed status (Yes/No with timestamp)
    + Loaded status (Yes/No with timestamp)
    + Completed status (Yes/No with timestamp)
    + Time spent on assignment
  - Filter assignments by completion status (All, High Completion, Low Completion, Overdue)
  - Sort assignments by creation date, due date, or completion rate
  - Export assignment completion data as CSV file
  - Send reminder email to students who have not completed assignment
  - Display message when no assignments exist
  - All data displayed is derived from automatically tracked assignment activity

**UI/UX Requirements:**
  - Grid or list layout for assignment cards
  - Clear visual hierarchy for assignment information
  - Color-coded completion rate indicators (green for high, yellow for medium, red for low)
  - Overdue assignments highlighted with red border or indicator
  - Expandable assignment cards showing detailed student list
  - Student list with sortable columns
  - Filter and sort controls prominently displayed
  - Export button with CSV icon
  - Send Reminder button with email icon
  - Empty state message with helpful guidance
  - Smooth transitions when expanding assignment details

### 3.26 Super Admin Dashboard

#### 3.26.1 Institution Management View
**Functionality:**
  - Display list of all institutions in the system
  - Show institution cards with:
    + Institution name
    + Institution description
    + Number of colleges within institution
    + Number of total users (students, teachers, administrators)
    + Creation date
    + Status (active/inactive)
  - Create Institution button to add new institution
  - Create institution form collects:
    + Institution name (required)
    + Institution description (optional)
    + Institution address (optional)
    + Institution contact email (optional)
    + Institution contact phone (optional)
  - Edit button on each institution card to modify institution details
  - Delete button on each institution card to remove institution
  - View Details button to see colleges and groups within institution
  - Filter institutions by status (active/inactive)
  - Search institutions by name or description
  - Sort institutions by name, creation date, or number of users
  - Display message when no institutions exist
  - Automatically track institution creation, update, and deletion activities

**UI/UX Requirements:**
  - Grid or list layout for institution cards
  - Clear visual hierarchy for institution information
  - Prominent Create Institution button with plus icon
  - Hover states for interactive elements
  - Confirmation dialog before deleting institution with warning about cascading effects
  - Filter and search controls prominently displayed
  - Empty state message with call-to-action to create first institution
  - Smooth transitions when loading or editing institutions
  - Status indicator badges (green for active, gray for inactive)

#### 3.26.2 College Management View
**Functionality:**
  - Display list of all colleges within selected institution
  - Show college cards with:
    + College name
    + College description
    + Parent institution name
    + Number of groups within college
    + Number of total users (students, teachers, administrators)
    + Creation date
    + Status (active/inactive)
  - Create College button to add new college within institution
  - Create college form collects:
    + College name (required)
    + College description (optional)
    + Parent institution (required, selected from dropdown)
    + College address (optional)
    + College contact email (optional)
    + College contact phone (optional)
  - Edit button on each college card to modify college details
  - Delete button on each college card to remove college
  - View Details button to see groups within college
  - Filter colleges by status (active/inactive) or parent institution
  - Search colleges by name or description
  - Sort colleges by name, creation date, or number of users
  - Display message when no colleges exist
  - Automatically track college creation, update, and deletion activities

**UI/UX Requirements:**
  - Grid or list layout for college cards
  - Clear visual hierarchy for college information
  - Breadcrumb navigation showing institution > colleges path
  - Prominent Create College button with plus icon
  - Hover states for interactive elements
  - Confirmation dialog before deleting college with warning about cascading effects
  - Filter and search controls prominently displayed
  - Empty state message with call-to-action to create first college
  - Smooth transitions when loading or editing colleges
  - Status indicator badges (green for active, gray for inactive)
  - Parent institution displayed clearly on each card

#### 3.26.3 Group Management View
**Functionality:**
  - Display list of all groups within selected college
  - Show group cards with:
    + Group name
    + Group description
    + Parent college name
    + Parent institution name
    + Number of students in group
    + Number of teachers assigned to group
    + Creation date
    + Status (active/inactive)
  - Create Group button to add new group within college
  - Create group form collects:
    + Group name (required)
    + Group description (optional)
    + Parent college (required, selected from dropdown)
    + Group type (class, cohort, study group, etc.)
    + Start date (optional)
    + End date (optional)
  - Edit button on each group card to modify group details
  - Delete button on each group card to remove group
  - View Members button to see students and teachers in group
  - Assign Users button to add students or teachers to group
  - Remove Users button to remove students or teachers from group
  - Filter groups by status (active/inactive), parent college, or group type
  - Search groups by name or description
  - Sort groups by name, creation date, or number of members
  - Display message when no groups exist
  - Automatically track group creation, update, deletion, and membership activities

**UI/UX Requirements:**
  - Grid or list layout for group cards
  - Clear visual hierarchy for group information
  - Breadcrumb navigation showing institution > college > groups path
  - Prominent Create Group button with plus icon
  - Hover states for interactive elements
  - Confirmation dialog before deleting group with warning about member removal
  - Filter and search controls prominently displayed
  - Empty state message with call-to-action to create first group
  - Smooth transitions when loading or editing groups
  - Status indicator badges (green for active, gray for inactive)
  - Parent college and institution displayed clearly on each card
  - Member count badges showing students and teachers separately

#### 3.26.4 Organizational Hierarchy View
**Functionality:**
  - Display visual tree structure showing institutions, colleges, and groups hierarchy
  - Show expandable/collapsible nodes for each level
  - Display summary information for each node:
    + Institution level: Name, number of colleges, total users
    + College level: Name, parent institution, number of groups, total users
    + Group level: Name, parent college, number of members
  - Click on any node to view detailed information and management options
  - Quick action buttons on each node:
    + Add child entity (add college to institution, add group to college)
    + Edit entity details
    + View entity details
  - Search functionality to find and highlight specific entities in tree
  - Filter tree by status (show only active entities)
  - Export organizational structure as PDF or CSV
  - Zoom and pan controls for large hierarchies
  - Display message when organizational structure is empty

**UI/UX Requirements:**
  - Interactive tree visualization with smooth expand/collapse animations
  - Clear visual distinction between hierarchy levels using colors or icons
  - Hover states showing quick action buttons
  - Breadcrumb trail showing current selection path
  - Search bar with real-time highlighting of matching nodes
  - Zoom controls (zoom in, zoom out, fit to screen)
  - Pan functionality with mouse drag or touch gestures
  - Legend explaining node types and status indicators
  - Export button with format selection
  - Responsive layout adapting to screen size
  - Loading indicators for large hierarchies

## 4. Business Rules and Logic

### 4.1 Data Requirements
  - Image classification: Minimum 10 images per class, supported formats JPG and PNG, maximum 10MB per file
  - Text classification: Minimum 20 text samples per class, supported formats TXT and CSV
  - Regression: Minimum 50 data points, supported format CSV

### 4.2 Registration Requirements
  - Users can complete up to 10 tries or exercises without registration
  - A try or exercise is counted as one complete workflow from project creation to model training
  - After 10 tries, users must register to continue using the platform
  - Registration prompt appears when user attempts to start an 11th project
  - Registration form collects email, first name, last name, username, and password
  - All registration fields are required
  - System sends verification email to provided email address immediately after registration
  - Users must verify email address before accessing platform features
  - Verification email contains unique confirmation link valid for 24 hours
  - Users can request resend of verification email if not received or link expired
  - Resend verification email option available with 60-second cooldown between requests
  - Unverified users are redirected to verification reminder page when attempting to access platform features
  - Registered and verified users have unlimited access to all platform features

### 4.3 Password Reset Requirements
  - Users can request password reset from login page by providing email address
  - System validates email address format before processing reset request
  - Password reset email sent to provided email address contains secure reset link
  - Reset link contains unique token valid for 1 hour from generation time
  - Reset token is single-use and becomes invalid after successful password reset
  - Users must provide new password meeting strength requirements on reset page
  - Password strength requirements:
    + Minimum 8 characters in length
    + At least one uppercase letter
    + At least one lowercase letter
    + At least one number
    + At least one special character
  - Password strength meter displays real-time feedback:
    + Weak: Password meets fewer than 3 requirements
    + Medium: Password meets 3-4 requirements
    + Strong: Password meets all 5 requirements
  - Password reset page validates token before allowing password update
  - Expired or invalid tokens display error message with option to request new reset link
  - Successful password reset redirects user to login page
  - System tracks all password reset requests and completions for security monitoring

### 4.4 Guided Tour
  - Guided tour automatically activates when user has no custom data to upload
  - Tour provides pre-loaded sample datasets for each model type:
    + Image classification: Fruit ripeness dataset, animal classification dataset
    + Text classification: Sentiment analysis dataset, spam detection dataset
    + Regression: House price prediction dataset, temperature forecasting dataset
  - Tour includes step-by-step instructions at each page
  - Users can exit guided tour at any point to upload custom data

### 4.5 Content Moderation
  - All uploaded images are automatically scanned for inappropriate content including nudity, violence, and explicit material
  - All text inputs are automatically checked for profanity, hate speech, racism, and offensive language
  - Content flagged as inappropriate is rejected with an error message
  - Users are notified when content violates platform guidelines

### 4.6 Interactive Learning Flow
  - Learning module is mandatory after data collection and before training
  - Quiz questions are dynamically generated by AI system based on student learning history and current understanding level
  - AI system analyzes student past performance to identify knowledge gaps and weak areas
  - Questions are targeted to focus on identified weak areas with appropriate difficulty
  - System generates variations of previously missed questions to reinforce learning
  - Question types are diversified to maintain student engagement
  - Questions are context-aware and reference student own trained models and datasets
  - Questions ask about specific accuracy results from student projects
  - Scenarios are generated based on student actual ML experiments
  - Question difficulty adjusts in real-time based on student answer patterns
  - Difficulty increases after consecutive correct answers
  - Difficulty decreases when student struggles with multiple incorrect attempts
  - System identifies prerequisite knowledge for advanced topics
  - Foundational questions are presented before complex ones
  - Question chains build understanding progressively
  - System ensures solid mastery of basics before advancing
  - Teachers can describe desired questions in plain English
  - System automatically generates multiple question variations from teacher descriptions
  - System suggests answer options and explanations for generated questions
  - Teachers review and approve AI-generated questions before student use
  - System validates generated questions for accuracy and clarity
  - System ensures explanations are beginner-friendly and correct
  - System flags ambiguous or poorly worded questions for teacher review
  - System continuously improves question generation based on student feedback and performance data
  - Simulations demonstrate consequences of common ML mistakes

### 4.7 Training Process
  - Training automatically stops when accuracy plateaus or maximum epochs reached
  - Model checkpoints saved at best performance point
  - Training can be paused and resumed

### 4.8 Debugging Sandbox Rules
  - Debugging sandbox is optional and can be accessed after model training completion
  - Users can skip debugging sandbox and proceed directly to testing page
  - Sandbox provides pre-loaded failure scenario buttons for quick demonstrations:
    + No Normalization: Sets normalization toggle to disabled, keeps learning rate at optimal value (e.g., 0.001), batch size at optimal value (e.g., 32), and epochs at optimal value (e.g., 50)
    + Learning Rate Too High: Sets learning rate to 0.8, keeps normalization enabled, batch size at optimal value (e.g., 32), and epochs at optimal value (e.g., 50)
    + Tiny Batch Size: Sets batch size to 1, keeps learning rate at optimal value (e.g., 0.001), normalization enabled, and epochs at optimal value (e.g., 50)
    + Insufficient Epochs: Sets epochs to 5, keeps learning rate at optimal value (e.g., 0.001), normalization enabled, and batch size at optimal value (e.g., 32)
  - Each failure scenario button applies its specific problematic configuration with one click
  - Clicking a failure scenario button automatically triggers retraining with the applied configuration
  - Teachers can create custom failure scenarios using scenario builder interface
  - Custom scenarios are displayed alongside pre-loaded scenarios in debugging sandbox
  - Custom scenarios apply teacher-specified hyperparameter combinations when clicked
  - Custom scenarios are visually distinguished from pre-loaded scenarios
  - Students can use both pre-loaded and custom scenarios created by their teachers
  - Users can also manually adjust the following hyperparameters:
    + Learning rate: Range from 0.0001 to 1.0
    + Data normalization: Enable or disable toggle
    + Batch size: Selectable values (e.g., 1, 2, 4, 8, 16, 32, 64)
    + Training epochs: Selectable values (e.g., 5, 10, 20, 50, 100)
  - Problematic configurations that demonstrate failure modes:
    + High learning rate: Values above 0.5 typically cause divergence
    + Disabled normalization: Often leads to poor convergence
    + Very small batch size: Can cause erratic training behavior
    + Insufficient epochs: Results in underfitting
  - Retraining with modified configuration uses the same training dataset as original model
  - During retraining, animated training curves display in real-time:
    + Loss curves show separate lines for training loss and validation loss
    + Accuracy curves (for classification) show separate lines for training accuracy and validation accuracy
    + Error metric curves (for regression) show separate lines for training error and validation error
    + Curves update smoothly as each epoch completes
    + Overfitting is visually demonstrated when training metrics improve but validation metrics degrade
    + Underfitting is visually demonstrated when both training and validation metrics remain poor
  - Sandbox displays side-by-side comparison of original model and broken model performance with training and validation curves for both
  - Educational explanations are provided for each observed failure mode including interpretation of training vs validation curve patterns
  - Users can reset to original configuration at any time
  - All sandbox experiments including failure scenario button clicks (both pre-loaded and custom) are tracked for educational analytics

### 4.9 Configuration Save and Share Rules
  - Users can save current debugging sandbox configuration at any time
  - Configuration name is required, description is optional
  - Each saved configuration stores:
    + Configuration name
    + Configuration description
    + All hyperparameter values (learning rate, normalization, batch size, epochs)
    + Creator user ID and name
    + Creation timestamp
    + Associated model type
    + Assignment status (false by default)
  - Saved configurations are stored in user personal library
  - Users can load any saved configuration to apply settings to current sandbox
  - Loading a configuration replaces current hyperparameter values
  - Users can share any saved configuration via unique shareable link
  - Shareable link contains configuration ID and can be accessed by anyone with the link
  - Shared configurations are read-only for recipients
  - Recipients can load shared configuration into their own sandbox
  - Recipients can save a copy of shared configuration to their own library
  - System tracks all configuration save, share, and load activities
  - Users can delete configurations they created
  - Deleting a configuration does not affect shared links already distributed
  - Configuration library displays configurations created by user and configurations accessed via shared links

### 4.10 Assignment Creation and Management Rules
  - Only teachers can create assignments from saved configurations
  - Teachers mark saved configurations as assignments using Mark as Assignment button
  - Assignment creation requires assignment instructions (required field)
  - Assignment title is optional and defaults to configuration name if not provided
  - Assignment due date is optional
  - Teachers can optionally notify students via email when assignment is created
  - Each assignment stores:
    + Configuration ID
    + Assignment title
    + Assignment instructions
    + Assignment due date (if set)
    + Assignment creation timestamp
    + Assignment creator teacher ID
    + Assignment status set to true
  - System generates unique assignment link for each assignment
  - Assignment link directs students to My Assignments page with assignment details
  - Students can view all assigned configurations in My Assignments page
  - Students can filter assignments by completion status (Not Started, In Progress, Completed)
  - Students can filter assignments by due date (upcoming, overdue, no due date)
  - Students can sort assignments by creation date, due date, or completion status
  - Loading an assignment configuration from My Assignments page automatically marks assignment as In Progress
  - Students can manually mark assignment as Completed after analyzing the configuration
  - System tracks assignment viewing, loading, and completion activities:
    + Timestamp when student views assignment in My Assignments page
    + Timestamp when student loads assignment configuration into debugging sandbox
    + Timestamp when student marks assignment as completed
    + Time spent on assignment calculated from load to completion timestamps
  - Teachers can view assignment completion status in Assignment Tracking View
  - Teachers can see which students have viewed, loaded, and completed each assignment
  - Teachers can send reminder emails to students who have not completed assignments
  - Teachers can export assignment completion data as CSV file
  - Assignment completion rates are included in automated reports
  - Deleting a configuration marked as assignment does not delete assignment data
  - Assignment remains accessible via assignment link even if configuration is deleted
  - Students receive notification badge on My Assignments button showing number of unviewed assignments
  - Notification badge count decreases when student views assignment in My Assignments page

### 4.11 Custom Failure Scenario Rules
  - Only teachers can create custom failure scenarios
  - Custom scenarios are created using scenario builder interface
  - Teachers select specific hyperparameter combinations for each custom scenario:
    + Learning rate value from 0.0001 to 1.0
    + Data normalization enabled or disabled
    + Batch size from available options
    + Training epochs from available options
  - Custom scenario name is required and must be unique within teacher library
  - Custom scenario description is optional
  - Each custom scenario stores:
    + Scenario name
    + Scenario description
    + All hyperparameter values (learning rate, normalization, batch size, epochs)
    + Creator teacher ID and name
    + Creation timestamp
    + Associated model type
    + Usage count (number of times used by students)
  - Custom scenarios are stored in teacher personal library
  - Teachers can edit custom scenarios after creation to modify name, description, or hyperparameter values
  - Teachers can delete custom scenarios from their library
  - Deleting a custom scenario does not affect shared links already distributed
  - Teachers can share custom scenarios with students via unique shareable links
  - Shareable link contains custom scenario ID and can be accessed by anyone with the link
  - Shared custom scenarios are read-only for students
  - Students can load shared custom scenarios into their debugging sandbox
  - Loading a custom scenario applies teacher-specified hyperparameter values
  - Custom scenarios appear alongside pre-loaded scenarios in debugging sandbox
  - Custom scenarios are visually distinguished from pre-loaded scenarios with subtle styling differences
  - Students can use custom scenarios created by their teachers in the same way as pre-loaded scenarios
  - Clicking a custom scenario button automatically applies configuration and triggers retraining
  - System tracks all custom scenario creation, edit, share, and usage activities
  - Custom scenario usage count increments each time a student clicks the scenario button
  - Teachers can view custom scenario usage statistics in their library
  - Custom scenarios can be filtered by model type in teacher library
  - Custom scenarios can be searched by name or description in teacher library
  - Custom scenarios can be sorted by creation date, name, or usage count in teacher library

### 4.12 AI-Powered Question Generation Rules
  - AI system generates quiz questions dynamically based on student learning history
  - System analyzes student past quiz performance to identify knowledge gaps
  - Questions target weak areas identified through performance analysis
  - System generates multiple variations of missed questions for reinforcement
  - Question types are diversified including multiple choice, true/false, and scenario-based
  - Questions reference student own trained models and datasets for context
  - Questions ask about specific results from student projects (e.g., accuracy scores, loss values)
  - Scenarios are generated based on student actual ML experiments
  - Question difficulty adjusts in real-time based on consecutive correct or incorrect answers
  - Difficulty increases after 3 consecutive correct answers
  - Difficulty decreases after 2 consecutive incorrect answers
  - System maintains optimal challenge level to keep student in flow zone
  - System identifies prerequisite concepts before presenting advanced topics
  - Foundational questions are always presented before complex questions on same topic
  - Question chains build understanding progressively from basic to advanced
  - System ensures minimum 70% mastery of foundational concepts before advancing
  - Teachers can input natural language descriptions to generate questions
  - System processes teacher descriptions and generates 3-5 question variations
  - System suggests answer options with one correct answer and plausible distractors
  - System generates explanations for correct and incorrect answers
  - Teachers review generated questions in preview panel before approval
  - Teachers can edit question text, answer options, and explanations
  - Only approved questions are added to student question pool
  - System validates questions for:
    + Factual accuracy of content
    + Clarity of question wording
    + Appropriateness of difficulty level
    + Quality of answer options and explanations
  - System flags questions with potential issues for teacher review
  - Flagging criteria include:
    + Ambiguous wording
    + Multiple potentially correct answers
    + Overly complex language for target level
    + Missing or unclear explanations
  - System learns from student performance data to improve future question generation
  - System tracks which questions are most effective at identifying knowledge gaps
  - System adjusts question generation algorithms based on effectiveness metrics
  - All question generation and student quiz activity is tracked for analytics

### 4.13 Model Deployment
  - Each deployed model receives a unique shareable URL
  - Deployed models remain accessible for testing and demonstration

### 4.14 Lesson Plan Content
  - Lesson plans are structured using standard educational terminology including learning objectives, instructional strategies, and assessment methods
  - Each lesson plan aligns with common core standards or relevant educational frameworks
  - Lesson plans include differentiation strategies for diverse learners
  - All lesson plans are classroom-ready and require minimal additional preparation
  - Lesson plans include debugging sandbox activities and discussion prompts
  - Lesson plans include suggested debugging sandbox assignment configurations with analysis questions
  - Lesson plans include guidance on using pre-loaded failure scenario buttons for classroom demonstrations and guided learning exercises
  - Lesson plans include guidance on creating and using custom failure scenarios for targeted learning objectives
  - Lesson plans include guidance on creating and managing assignments with saved configurations
  - Lesson plans include guidance on using AI-powered question generator for creating personalized quizzes
  - Lesson plans include examples of natural language prompts for generating effective quiz questions
  - Lesson plans include strategies for reviewing and refining AI-generated questions

### 4.15 Badge System
  - Each level consists of a defined set of example projects
  - Registered students must complete all examples within a level to earn the corresponding badge
  - Badge is automatically awarded upon completion of the final example in a level
  - Each badge includes level name, completion date, and student name
  - Badges can be shared directly to LinkedIn with one click
  - Badge sharing generates a formatted post with achievement details and platform link

### 4.16 Progress Tracking and Analytics
  - System tracks student mastery of key ML concepts including gradient descent, overfitting, bias and variance, regularization, and model evaluation
  - Mastery is calculated based on quiz performance, time spent, and error patterns from tracked activity data
  - Real-time updates to dashboard when students complete activities
  - Historical data retained for trend analysis
  - Debugging sandbox activity is tracked including:
    + Hyperparameter configurations tested
    + Failure scenario buttons clicked (both pre-loaded and custom)
    + Custom scenario IDs used
    + Failure modes observed
    + Configurations saved
    + Configurations shared
    + Configurations loaded from library or shared links
    + Assignment configurations loaded
    + Assignment completion timestamps
  - Custom scenario usage is tracked including:
    + Custom scenario ID
    + Student ID
    + Timestamp of usage
    + Model type
    + Hyperparameter values applied
  - Assignment activity is tracked including:
    + Assignment ID
    + Student ID
    + Timestamp when assignment is viewed
    + Timestamp when assignment configuration is loaded
    + Timestamp when assignment is marked as completed
    + Time spent on assignment
  - AI-powered quiz activity is tracked including:
    + Question ID and difficulty level
    + Student answer and correct/incorrect status
    + Time spent on each question
    + Number of question variations presented
    + Difficulty adjustments made during quiz session
    + Concepts associated with each question

### 4.17 At-Risk Student Identification
  - Students are flagged as at-risk based on tracked activity data:
    + Quiz scores below 60% on any concept
    + Time spent on a concept exceeding 2x the class average without progress
    + Repeated errors on the same concept across multiple attempts
    + No activity for more than 7 days
    + Incomplete assignments past due date
    + Consistently receiving lowest difficulty questions without improvement
  - Alert severity levels: Low, Medium, High based on number and type of criteria met
  - Teachers receive notifications for new at-risk alerts

### 4.18 Report Generation and Export
  - Reports are generated on-demand or scheduled for automatic delivery
  - Error pattern analysis identifies common misconceptions when 50% or more students make the same mistake based on tracked quiz data
  - Reports include actionable insights and recommended teaching strategies
  - All reports include date range, class or student scope, and data sources
  - All report data is derived from automatically tracked student activities
  - Reports include debugging sandbox activity metrics showing:
    + Experimentation patterns
    + Failure scenario button usage (both pre-loaded and custom)
    + Custom scenario usage statistics including most used scenarios and usage trends
    + Failure mode understanding
    + Configuration saving and sharing activity
    + Assignment completion rates
  - Reports include assignment-specific metrics showing:
    + Assignment completion rates by class or student
    + Average time spent on assignments
    + Assignment completion trends over time
    + Most challenging assignments based on completion rates
  - Reports include AI-powered quiz metrics showing:
    + Average question difficulty progression for each student
    + Number of question variations presented per concept
    + Effectiveness of adaptive difficulty adjustment
    + Correlation between question difficulty and student mastery
  - Report export formats:
    + PDF format includes visual charts, graphs, and formatted tables for presentation and sharing
    + CSV format includes raw data in tabular format for further analysis in spreadsheet applications
  - Date range customization:
    + Teachers can select any custom date range using start date and end date
    + Date range applies to all activity data included in the report
    + Default date range is current academic term or last 30 days
  - Filtering options:
    + Filter by individual student to generate single-student reports
    + Filter by multiple students to generate group reports
    + Filter by specific ML concept to focus on particular learning objectives
    + Filter by all concepts to generate comprehensive reports
    + Filters can be combined for precise report scope
  - Charts and graphs in PDF reports:
    + Include concept mastery distribution charts
    + Include time spent analysis graphs
    + Include quiz performance trend lines
    + Include error pattern visualizations
    + Include custom scenario usage charts
    + Include assignment completion rate charts
    + Include AI-powered quiz difficulty progression charts
    + Teachers can choose to include or exclude charts when exporting
  - Scheduled report delivery:
    + Weekly reports delivered on specified day of the week
    + Monthly reports delivered on specified date of the month
    + Reports automatically generated and sent via email to configured recipients
    + Multiple email recipients supported for each scheduled report
    + Scheduled reports use pre-configured filters and format settings
    + Teachers can enable, disable, edit, or delete scheduled reports at any time
    + System sends confirmation email when scheduled report is successfully delivered
    + System sends error notification if scheduled report delivery fails
  - Email delivery integration:
    + System integrates with email delivery service (Resend or SendGrid) for automated report sending
    + Generated reports are attached to emails as PDF or CSV files
    + Email subject line and message body are customizable by teachers when configuring scheduled reports
    + Default email template includes report summary, date range, and recipient instructions
    + Delivery confirmation notifications are sent to teachers when reports are successfully delivered
    + Error notifications are sent to teachers if email delivery fails, including failure reason
    + Email delivery service implements automatic retry logic for failed deliveries:
      * System retries failed email deliveries up to 3 times for temporary failures
      * Temporary failures include network errors, rate limiting, and service unavailability
      * Retry attempts use exponential backoff strategy with increasing delays between retries
      * First retry occurs after 1 minute, second retry after 5 minutes, third retry after 15 minutes
      * Final error notification is sent to teachers only after all 3 retry attempts are exhausted
      * Permanent failures such as invalid email addresses do not trigger retry logic
      * Each retry attempt is logged for audit and troubleshooting purposes
    + All email delivery activity is logged for audit and troubleshooting purposes

### 4.19 Activity Tracking System
  - System automatically tracks and records all student activities throughout the platform
  - Tracked activities include:
    + Project creation with timestamp, student ID, project type, and description
    + Data collection with timestamp, student ID, data type, source, and sample count
    + Concept viewing with timestamp, student ID, concept name, and time spent
    + Quiz attempts with timestamp, student ID, question ID, concept, answer, correct/incorrect status, and difficulty level
    + Training sessions with timestamp, student ID, model type, duration, and performance metrics
    + Debugging sandbox experiments with timestamp, student ID, hyperparameter configurations, failure scenario buttons clicked (both pre-loaded and custom), custom scenario IDs used, failure modes observed, and time spent
    + Configuration saves with timestamp, student ID, configuration name, description, and hyperparameter values
    + Configuration shares with timestamp, student ID, configuration ID, and generated link
    + Configuration loads with timestamp, student ID, configuration ID, and source (own library or shared link)
    + Custom scenario usage with timestamp, student ID, custom scenario ID, model type, and hyperparameter values applied
    + Assignment views with timestamp, student ID, and assignment ID
    + Assignment configuration loads with timestamp, student ID, and assignment ID
    + Assignment completions with timestamp, student ID, and assignment ID
    + Testing activities with timestamp, student ID, test sample count, and evaluation metrics
    + Project completions with timestamp, student ID, and deployment status
    + Badge achievements with timestamp, student ID, and badge details
    + AI-powered quiz interactions with timestamp, student ID, question ID, difficulty level, answer, and time spent
  - All tracked data is stored in backend database for real-time dashboard access
  - Activity data is used to calculate mastery metrics, identify at-risk students, and generate reports
  - Tracking occurs automatically without requiring manual input from students or teachers
  - Activity timestamps use server time to ensure consistency across users

### 4.20 Email Verification System
  - Verification email sent immediately upon successful registration
  - Email contains unique confirmation link with token valid for 24 hours
  - Clicking confirmation link verifies email address and activates account
  - Expired verification links display error message with resend option
  - Users can request resend of verification email from verification reminder page
  - Resend requests limited to once per 60 seconds to prevent abuse
  - System tracks verification attempts and resend requests for security monitoring
  - Unverified users cannot access platform features beyond registration
  - Verification status displayed in teacher dashboard for student accounts

### 4.21 Password Reset Email System
  - Password reset email sent immediately upon valid reset request
  - Email contains secure reset link with unique token valid for 1 hour
  - Reset link directs user to password reset page with token validation
  - Token is single-use and becomes invalid after successful password reset
  - Expired tokens display error message with option to request new reset link
  - System tracks all password reset requests including timestamp and email address
  - Password reset emails use same email delivery service as verification emails
  - Email template includes clear instructions and security information
  - System logs all password reset email delivery attempts for security monitoring

### 4.22 Super Admin Privileges and Organizational Management
  - Super administrators have elevated privileges to manage organizational hierarchy
  - Super admins can create, view, update, and delete institutions
  - Super admins can create, view, update, and delete colleges within institutions
  - Super admins can create, view, update, and delete groups within colleges
  - Each institution stores:
    + Institution name (required)
    + Institution description (optional)
    + Institution address (optional)
    + Institution contact email (optional)
    + Institution contact phone (optional)
    + Creation timestamp
    + Status (active/inactive)
  - Each college stores:
    + College name (required)
    + College description (optional)
    + Parent institution ID (required)
    + College address (optional)
    + College contact email (optional)
    + College contact phone (optional)
    + Creation timestamp
    + Status (active/inactive)
  - Each group stores:
    + Group name (required)
    + Group description (optional)
    + Parent college ID (required)
    + Group type (class, cohort, study group, etc.)
    + Start date (optional)
    + End date (optional)
    + Creation timestamp
    + Status (active/inactive)
  - Organizational hierarchy follows structure: Institution > College > Group
  - Deleting an institution cascades to delete all associated colleges and groups
  - Deleting a college cascades to delete all associated groups
  - Deleting a group removes all student and teacher memberships from that group
  - Super admins can assign administrators to manage specific institutions, colleges, or groups
  - Super admins can view complete organizational hierarchy in tree visualization
  - Super admins can search and filter entities across entire organizational structure
  - Super admins can export organizational structure as PDF or CSV
  - All organizational management activities are tracked with timestamp and super admin ID
  - System validates parent-child relationships when creating or updating entities
  - System prevents circular references in organizational hierarchy
  - System displays warning messages before cascading deletions
  - Users (students, teachers, administrators) can be assigned to groups for access control
  - Group membership determines which classes and resources users can access
  - Super admins can bulk assign or remove users from groups
  - System tracks all membership changes with timestamp and super admin ID

### 4.23 UI/UX Principles
  - Consistent design language across all pages
  - Responsive design supporting desktop and tablet devices
  - Accessible color contrast ratios meeting WCAG standards
  - Clear visual feedback for all user actions
  - Intuitive navigation with breadcrumbs and progress indicators
  - Error messages displayed in user-friendly language with actionable guidance

## 5. Exceptions and Edge Cases

| Scenario | Handling |
|----------|----------|
| User uploads unsupported file format | Display error message and reject upload |
| Insufficient training data | Disable training button and show minimum requirement message |
| User has no custom data | Automatically suggest guided tour with sample datasets |
| User uploads inappropriate images | Block upload and display content policy violation message |
| User inputs offensive text | Reject input and display content policy violation message |
| User skips quiz questions | Require completion before proceeding to training |
| Training fails or crashes | Display error notification and allow user to restart |
| Test data prediction fails | Show error message and allow retry |
| Simulation fails to load | Display fallback text explanation |
| CSV file has missing or invalid values | Display error message indicating data quality issues |
| User exits guided tour mid-way | Save progress and allow resume or switch to custom data upload |
| User reaches 10 tries limit | Display registration prompt and block further access until registration completed |
| User attempts to bypass registration | Enforce registration requirement and prevent access to new projects |
| User submits registration form with missing fields | Display validation error indicating all fields are required |
| User submits registration form with invalid email format | Display validation error for email field |
| User submits registration form with weak password | Display validation error with password requirements |
| Username already exists | Display error message and prompt user to choose different username |
| Email already registered | Display error message and provide option to sign in instead |
| Verification email not received | Display instructions to check spam folder and provide resend option |
| User clicks expired verification link | Display error message and provide resend verification email button |
| User attempts to resend verification email multiple times rapidly | Enforce 60-second cooldown and display countdown timer |
| Verification email delivery fails | Log error and display message to contact support |
| User attempts to access platform features without verifying email | Redirect to verification reminder page with resend option |
| User verifies email after link expiration | Display error and provide resend option |
| Verification token is invalid or tampered | Display error message indicating invalid link |
| User clicks verification link multiple times | Display already verified message if email already verified |
| User submits password reset request with unregistered email | Display generic success message to prevent email enumeration |
| User submits password reset request with invalid email format | Display validation error for email format |
| Password reset email not received | Display instructions to check spam folder and provide option to request new reset link |
| User clicks expired password reset link | Display error message and provide button to request new reset link |
| User clicks invalid or tampered password reset link | Display error message indicating invalid reset link |
| User submits new password not meeting strength requirements | Display validation error with password requirements and update strength meter to show weak status |
| User submits mismatched password and confirm password | Display validation error indicating passwords must match |
| Password reset token used multiple times | Display error message indicating token already used |
| User requests multiple password resets in short time | Allow requests but invalidate previous tokens when new token generated |
| Password reset email delivery fails | Log error and display generic success message to user |
| User successfully resets password | Display success message and redirect to login page |
| User types password that meets only length requirement | Display weak strength indicator in red with specific missing requirements |
| User types password that meets 3-4 requirements | Display medium strength indicator in yellow or orange with remaining requirements |
| User types password that meets all 5 requirements | Display strong strength indicator in green |
| Password strength meter fails to update | Display static requirements list and validate on submission |
| Teacher downloads lesson plan while offline | Display error message and prompt to check internet connection |
| Lesson plan PDF generation fails | Display error notification and allow retry |
| LinkedIn sharing fails | Display error message and provide alternative option to download badge image |
| User completes level but badge not awarded | Display error notification and allow manual badge claim |
| Unregistered user attempts to access badge page | Redirect to registration page with explanation |
| Dashboard data fails to load | Display error message and provide refresh option |
| No students flagged as at-risk | Display message indicating all students are on track |
| Report generation fails | Display error notification and allow retry |
| Teacher attempts to access student data without permission | Display access denied message |
| Real-time updates fail to sync | Display warning indicator and provide manual refresh option |
| Export report while offline | Display error message and prompt to check internet connection |
| Activity tracking fails to record data | Log error silently and attempt retry, display warning to admin if persistent |
| Database connection lost during activity tracking | Queue activity data locally and sync when connection restored |
| Tracked activity data contains invalid values | Validate data before storage and log errors for admin review |
| Teacher selects invalid date range for report | Display error message indicating start date must be before end date |
| Teacher attempts to schedule report without selecting recipients | Display validation error requiring at least one email address |
| Scheduled report delivery fails due to invalid email | Send error notification to teacher and mark scheduled report as failed |
| Teacher exports report with no data in selected date range | Display warning message and generate empty report with explanation |
| PDF report generation exceeds size limit | Display error message and suggest narrowing date range or filtering options |
| CSV export contains special characters | Properly escape characters to ensure CSV format integrity |
| Multiple teachers schedule reports with same parameters | Allow duplicate schedules and deliver reports independently |
| Teacher deletes scheduled report while delivery is in progress | Cancel current delivery and remove from schedule |
| System time zone differs from teacher time zone | Use teacher account time zone for scheduled report delivery times |
| Email delivery service API is unavailable | Queue email for retry with exponential backoff and send error notification to teacher only after all retry attempts exhausted |
| Report attachment exceeds email size limit | Display error message and suggest alternative delivery method or smaller date range |
| Email delivery service rate limit exceeded | Retry email delivery up to 3 times with exponential backoff, send final error notification only after all retries exhausted |
| Invalid email address format in recipient list | Display validation error and highlight invalid addresses |
| Email delivery service authentication fails | Log error and send notification to system administrator |
| Teacher customizes email template with invalid formatting | Display preview with formatting errors highlighted |
| Delivery confirmation notification fails to send | Log delivery success but mark notification as failed |
| Multiple scheduled reports trigger simultaneously | Process reports sequentially to avoid resource contention |
| Network error during email delivery | Retry delivery up to 3 times with exponential backoff (1 min, 5 min, 15 min), send error notification only after final retry fails |
| Temporary email service unavailability | Retry delivery up to 3 times with exponential backoff, send error notification only after final retry fails |
| Permanent email delivery failure (invalid address) | Do not retry, send immediate error notification to teacher |
| Email delivery retry logic exhausted | Send final error notification to teacher with failure details and all retry attempt information |
| User clicks failure scenario button in debugging sandbox | Automatically apply corresponding problematic configuration and trigger retraining |
| User clicks multiple failure scenario buttons rapidly | Apply most recent button configuration and cancel previous retraining if in progress |
| Failure scenario button fails to apply configuration | Display error message and allow manual configuration adjustment |
| User clicks failure scenario button while retraining in progress | Cancel current retraining and start new retraining with failure scenario configuration |
| Failure scenario configuration values are invalid | Use fallback default problematic values and log error for admin review |
| User manually adjusts hyperparameters after clicking failure scenario button | Allow manual adjustments and override failure scenario configuration |
| Failure scenario button tooltip fails to display | Display button label only without tooltip |
| User saves configuration created by failure scenario button | Save configuration with all applied hyperparameter values |
| Teacher creates assignment using failure scenario configuration | Allow assignment creation and track failure scenario button used |
| Student loads assignment with failure scenario configuration | Display assignment instructions and applied configuration details |
| Dashboard fails to display failure scenario button usage data | Display error message in failure scenario metrics section |
| Report generation includes failure scenario button usage | Include failure scenario button click counts and patterns in report |
| User selects extremely high learning rate in debugging sandbox | Display warning indicator and proceed with retraining to demonstrate divergence |
| User disables normalization in debugging sandbox | Proceed with retraining and show poor convergence in comparison view |
| Debugging sandbox retraining fails | Display error message and allow user to reset configuration or try different settings |
| User attempts to access debugging sandbox before completing training | Redirect to training page with message indicating training must be completed first |
| Debugging sandbox visualization fails to render | Display error message and show text-based performance metrics as fallback |
| User resets debugging sandbox configuration multiple times | Allow unlimited resets and track each reset for analytics |
| Debugging sandbox comparison view fails to load | Display error message and show individual model metrics separately |
| User skips debugging sandbox | Proceed directly to testing page without tracking sandbox activity |
| Educational explanations fail to load in debugging sandbox | Display generic error message and provide link to external documentation |
| Animated training curves fail to render during retraining | Display static final metrics and allow retry |
| Training and validation curves overlap completely | Display message indicating potential data leakage or insufficient validation split |
| Curve animation lags or stutters during retraining | Reduce animation frame rate and continue displaying updates |
| User rapidly switches between configurations during retraining | Cancel current retraining and start new retraining with latest configuration |
| User attempts to save configuration without name | Display validation error requiring configuration name |
| Configuration name exceeds character limit | Display validation error and truncate name to maximum length |
| User saves configuration with duplicate name | Allow duplicate names and append timestamp to distinguish |
| Database fails during configuration save | Display error message and allow retry |
| User attempts to load configuration while retraining in progress | Cancel current retraining and load new configuration |
| Shared configuration link is invalid or expired | Display error message indicating link is invalid |
| User attempts to access shared configuration without permission | Display access denied message |
| User deletes configuration that has been shared | Configuration remains accessible via shared link but marked as deleted in library |
| Shared configuration fails to load | Display error message and provide option to contact creator |
| User attempts to share configuration before saving | Display message prompting user to save configuration first |
| Share link generation fails | Display error message and allow retry |
| User copies share link but clipboard access denied | Display link in text field for manual copying |
| Teacher creates assignment without instructions | Display validation error requiring assignment instructions |
| Teacher creates assignment without title | Use configuration name as default assignment title |
| Student loads assignment configuration | Display assignment instructions in modal dialog before applying configuration |
| Assignment link is invalid | Display error message indicating invalid assignment link |
| Student completes assignment but tracking fails | Log error and allow manual completion recording by teacher |
| Configuration library fails to load | Display error message and provide refresh option |
| User has no saved configurations | Display empty state message with instructions to save first configuration |
| Filter or search returns no results in configuration library | Display message indicating no matching configurations found |
| User attempts to delete configuration while it is being loaded by another user | Allow deletion and mark configuration as unavailable for future loads |
| QR code generation fails for share link | Display error message and provide text link as fallback |
| Teacher clicks Create Custom Scenario button | Open custom failure scenario builder interface |
| Teacher attempts to save custom scenario without name | Display validation error requiring scenario name |
| Teacher saves custom scenario with duplicate name | Display validation error and prompt for unique name |
| Custom scenario name exceeds character limit | Display validation error and truncate name to maximum length |
| Database fails during custom scenario save | Display error message and allow retry |
| Teacher attempts to edit custom scenario | Open scenario builder with current values pre-filled |
| Teacher attempts to delete custom scenario | Display confirmation dialog before deletion |
| Teacher deletes custom scenario that has been shared | Scenario remains accessible via shared link but marked as deleted in library |
| Custom scenario library fails to load | Display error message and provide refresh option |
| Teacher has no custom scenarios | Display empty state message with call-to-action to create first scenario |
| Filter or search returns no results in custom scenario library | Display message indicating no matching scenarios found |
| Custom scenario share link generation fails | Display error message and allow retry |
| Student clicks custom scenario button | Automatically apply teacher-specified configuration and trigger retraining |
| Student clicks custom scenario button while retraining in progress | Cancel current retraining and start new retraining with custom scenario configuration |
| Custom scenario configuration values are invalid | Use fallback default values and log error for admin review |
| Custom scenario fails to load for student | Display error message and allow retry |
| Student attempts to access custom scenario without permission | Display access denied message |
| Custom scenario usage tracking fails | Log error silently and attempt retry |
| Dashboard fails to display custom scenario usage data | Display error message in custom scenario metrics section |
| Report generation includes custom scenario usage | Include custom scenario usage statistics and trends in report |
| Teacher views custom scenario usage count | Display accurate count based on tracked student usage |
| Custom scenario usage count fails to increment | Log error and update count asynchronously |
| Multiple students use same custom scenario simultaneously | Track each usage independently with separate timestamps |
| Teacher edits custom scenario after students have used it | Allow edit and track version history, existing shared links use original version |
| Custom scenario builder fails to load | Display error message and provide retry option |
| Teacher selects invalid hyperparameter combination in builder | Display warning but allow save for educational purposes |
| Custom scenario preview fails to render | Display text-based summary of selected values |
| Teacher attempts to create custom scenario for unsupported model type | Display error message indicating model type not supported |
| Custom scenario library displays incorrect usage statistics | Refresh data and log error for admin review |
| Teacher sorts custom scenarios by usage count | Display scenarios in descending order of usage |
| Custom scenario tooltip fails to display | Display scenario name only without tooltip |
| Student loads custom scenario with assignment instructions | Display instructions in modal dialog before applying configuration |
| Custom scenario assignment link is invalid | Display error message indicating invalid assignment link |
| Teacher shares custom scenario via QR code | Generate QR code for custom scenario link |
| QR code generation fails for custom scenario | Display error message and provide text link as fallback |
| Teacher marks configuration as assignment without saving first | Display message prompting teacher to save configuration before creating assignment |
| Teacher attempts to create assignment with empty instructions | Display validation error requiring assignment instructions |
| Assignment creation dialog fails to open | Display error message and allow retry |
| Assignment link generation fails | Display error message and allow retry |
| Student has no assignments | Display empty state message in My Assignments page |
| My Assignments page fails to load | Display error message and provide refresh option |
| Student clicks Load Assignment button | Load configuration into debugging sandbox and display assignment instructions |
| Student attempts to mark assignment as completed before loading | Display message indicating assignment must be loaded first |
| Student marks assignment as completed | Update assignment status and track completion timestamp |
| Assignment completion tracking fails | Log error and allow manual completion recording by teacher |
| Notification badge fails to update | Display static badge and refresh on page reload |
| Filter or sort returns no results in My Assignments page | Display message indicating no matching assignments found |
| Assignment due date has passed | Highlight assignment as overdue with red indicator |
| Teacher views assignment tracking with no assignments | Display empty state message with guidance to create first assignment |
| Assignment Tracking View fails to load | Display error message and provide refresh option |
| Teacher clicks on assignment card to view details | Display detailed student completion status list |
| Teacher sends reminder email to students | Send email to students who have not completed assignment |
| Reminder email delivery fails | Display error message and allow retry |
| Teacher exports assignment completion data | Generate CSV file with student completion details |
| CSV export fails | Display error message and allow retry |
| Multiple teachers create assignments with same configuration | Allow duplicate assignments and track independently |
| Teacher deletes configuration marked as assignment | Assignment data remains accessible, configuration marked as deleted |
| Student loads assignment after configuration is deleted | Display assignment instructions and configuration details from assignment data |
| Assignment completion rate calculation fails | Display error message and log for admin review |
| Report includes assignment metrics with no assignment data | Display message indicating no assignment data available for selected date range |
| Teacher filters assignments by completion status | Display assignments matching selected status |
| Teacher sorts assignments by due date | Display assignments in chronological order by due date |
| Assignment notification email fails to send | Log error and display message to teacher |
| Student receives assignment notification email | Email contains assignment title, instructions, and link to My Assignments page |
| Teacher views individual student assignment completion | Display list of assignments with completion status for selected student |
| At-risk alerts include incomplete assignments | Flag students with overdue assignments as at-risk |
| AI question generation fails | Display error message and allow teacher to retry or create question manually |
| Generated questions contain factual errors | Flag questions for teacher review before adding to question pool |
| Generated questions are too easy or too difficult | System adjusts difficulty based on student performance feedback |
| Student answers all questions correctly | System increases difficulty for next question set |
| Student answers all questions incorrectly | System decreases difficulty and presents foundational questions |
| Question difficulty adjustment fails | Maintain current difficulty level and log error for review |
| Teacher natural language input is unclear | Display message asking teacher to rephrase or provide more details |
| Teacher approves question with errors | Question is added to pool, system tracks student performance to identify issues |
| Teacher rejects all generated questions | Allow teacher to regenerate with modified description or create manually |
| Question generation takes too long | Display loading indicator and allow teacher to cancel and retry |
| Student skips too many questions | Require completion of minimum number of questions before proceeding |
| Quiz performance tracking fails | Log error and attempt to sync data when connection restored |
| Student learning history is incomplete | Generate questions based on available data and default difficulty |
| Context-aware question references non-existent model | Fall back to generic question on same concept |
| Question explanation fails to load | Display generic explanation or link to external resource |
| Multiple students receive identical questions | System generates variations to maintain uniqueness |
| Question bank becomes depleted | System generates new questions automatically based on concept coverage |
| Teacher edits approved question | Update question in pool and track version history |
| Student reports question as unclear | Flag question for teacher review and track feedback |
| Question validation flags false positive | Allow teacher to override validation and approve question |
| AI system identifies no knowledge gaps | Present review questions covering all concepts at current difficulty |
| Student performance data is inconsistent | Use most recent reliable data for question generation |
| Question generation algorithm update | Gradually roll out new algorithm and compare effectiveness |
| Teacher question generator interface fails to load | Display error message and provide fallback manual question creation option |
| Generated question variations are too similar | System regenerates with increased variation parameters |
| Question difficulty progression is too steep | System adjusts progression rate based on student success rate |
| Student completes quiz but mastery not updated | Recalculate mastery from stored quiz data and update dashboard |
| Dashboard displays incorrect quiz metrics | Refresh data from database and log discrepancy for review |
| Report includes AI quiz metrics with no quiz data | Display message indicating no quiz data available for selected date range |
| Teacher views student quiz history | Display chronological list of quizzes with performance metrics |
| At-risk alerts include low quiz performance | Flag students with consistently low quiz scores across multiple concepts |
| Super admin attempts to create institution without name | Display validation error requiring institution name |
| Super admin creates institution with duplicate name | Allow duplicate names and append identifier to distinguish |
| Institution name exceeds character limit | Display validation error and truncate name to maximum length |
| Database fails during institution creation | Display error message and allow retry |
| Super admin attempts to delete institution with colleges | Display confirmation dialog warning about cascading deletion of colleges and groups |
| Super admin deletes institution | Cascade delete all associated colleges and groups, remove all user memberships |
| Institution deletion fails | Display error message and log for admin review |
| Super admin attempts to create college without parent institution | Display validation error requiring parent institution selection |
| Super admin creates college with duplicate name within same institution | Allow duplicate names and append identifier to distinguish |
| College name exceeds character limit | Display validation error and truncate name to maximum length |
| Database fails during college creation | Display error message and allow retry |
| Super admin attempts to delete college with groups | Display confirmation dialog warning about cascading deletion of groups |
| Super admin deletes college | Cascade delete all associated groups, remove all user memberships |
| College deletion fails | Display error message and log for admin review |
| Super admin attempts to create group without parent college | Display validation error requiring parent college selection |
| Super admin creates group with duplicate name within same college | Allow duplicate names and append identifier to distinguish |
| Group name exceeds character limit | Display validation error and truncate name to maximum length |
| Database fails during group creation | Display error message and allow retry |
| Super admin attempts to delete group with members | Display confirmation dialog warning about member removal |
| Super admin deletes group | Remove all student and teacher memberships from group |
| Group deletion fails | Display error message and log for admin review |
| Super admin attempts to create circular reference in hierarchy | Validate parent-child relationships and display error preventing circular reference |
| Organizational hierarchy view fails to load | Display error message and provide refresh option |
| Organizational hierarchy tree is too large to display | Implement pagination or lazy loading for large hierarchies |
| Super admin searches for non-existent entity | Display message indicating no matching entities found |
| Super admin exports organizational structure while offline | Display error message and prompt to check internet connection |
| Organizational structure export fails | Display error notification and allow retry |
| Super admin assigns user to non-existent group | Display validation error indicating group does not exist |
| Super admin assigns user already in group | Display message indicating user is already a member |
| Bulk user assignment fails partially | Display summary of successful and failed assignments with error details |
| Super admin removes user from group they are not in | Display message indicating user is not a member of group |
| User membership tracking fails | Log error and attempt retry, display warning to super admin if persistent |
| Super admin views empty organizational hierarchy | Display empty state message with call-to-action to create first institution |
| Super admin filters hierarchy by status | Display only entities matching selected status |
| Zoom controls fail in hierarchy view | Display error message and provide alternative navigation options |
| QR code generation fails for organizational export | Display error message and provide text-based export as fallback |

## 6. Acceptance Criteria

1. Users can input project descriptions for image classification, text classification, or regression tasks and receive appropriate guidance
2. Users without custom data can access guided tour with pre-loaded sample datasets
3. Guided tour provides step-by-step instructions at each stage
4. Users can upload appropriate data types based on selected model type
5. System automatically detects and blocks inappropriate images including nudity and violence
6. System automatically detects and blocks offensive text including profanity, hate speech, and racism
7. Interactive learning module displays AI-generated visuals and quizzes relevant to user project and model type
8. AI system generates personalized quiz questions based on student learning history
9. AI system analyzes student past performance to identify knowledge gaps
10. Questions target weak areas with appropriate difficulty level
11. System generates variations of missed questions for reinforcement
12. Question types are diversified to maintain engagement
13. Questions reference student own trained models and datasets
14. Questions ask about specific results from student projects
15. Question difficulty adjusts in real-time based on answer patterns
16. Difficulty increases after consecutive correct answers
17. Difficulty decreases when student struggles with multiple incorrect attempts
18. System identifies prerequisite knowledge for advanced topics
19. Foundational questions are presented before complex ones
20. Question chains build understanding progressively
21. Teachers can describe desired questions in plain English
22. System generates multiple question variations from teacher descriptions
23. System suggests answer options and explanations
24. Teachers can review and approve generated questions
25. System validates questions for accuracy and clarity
26. System flags ambiguous or poorly worded questions
27. System continuously improves based on student feedback
28. Simulations demonstrate ML concepts such as impact of bad training data
29. Training page displays real-time performance metrics appropriate to model type
30. Users can access debugging sandbox after training completion
31. Debugging sandbox displays pre-loaded failure scenario buttons including No Normalization, Learning Rate Too High, Tiny Batch Size, and Insufficient Epochs
32. Each pre-loaded failure scenario button is clearly labeled and visually distinct
33. Clicking a pre-loaded failure scenario button automatically applies corresponding problematic configuration
34. No Normalization button disables normalization while keeping other parameters optimal
35. Learning Rate Too High button sets learning rate to 0.8 while keeping other parameters optimal
36. Tiny Batch Size button sets batch size to 1 while keeping other parameters optimal
37. Insufficient Epochs button sets epochs to 5 while keeping other parameters optimal
38. Clicking pre-loaded failure scenario button automatically triggers retraining with applied configuration
39. Pre-loaded failure scenario buttons display hover tooltips explaining configuration to be applied
40. Visual feedback is provided when pre-loaded failure scenario button is clicked showing which parameters changed
41. Teachers can access Create Custom Scenario button in debugging sandbox
42. Create Custom Scenario button opens custom failure scenario builder interface
43. Scenario builder displays hyperparameter selection controls for learning rate, normalization, batch size, and epochs
44. Scenario builder provides real-time preview of selected hyperparameter combination
45. Scenario builder includes text input field for custom scenario name (required)
46. Scenario builder includes text area for custom scenario description (optional)
47. Scenario builder validates scenario name is not empty before saving
48. Scenario builder validates scenario name is unique within teacher library
49. Save Custom Scenario button stores scenario in teacher library with all required fields
50. Success message displays after custom scenario is saved
51. Teachers can access custom scenario library from debugging sandbox
52. Custom scenario library displays all scenarios created by current teacher
53. Custom scenario cards show name, description, hyperparameter values, creation date, model type, and usage count
54. Teachers can edit custom scenarios from library
55. Teachers can delete custom scenarios from library
56. Teachers can share custom scenarios via unique shareable links
57. Custom scenario share page displays shareable link in copyable text field
58. Custom scenario share page generates QR code for easy sharing
59. Custom scenarios appear alongside pre-loaded scenarios in debugging sandbox
60. Custom scenarios are visually distinguished from pre-loaded scenarios
61. Custom scenario buttons display teacher-defined names
62. Custom scenario buttons display hover tooltips with descriptions
63. Clicking custom scenario button automatically applies teacher-specified configuration
64. Clicking custom scenario button automatically triggers retraining
65. Students can use custom scenarios created by their teachers
66. Custom scenario usage is tracked with timestamp, student ID, and scenario ID
67. Custom scenario usage count increments each time student clicks scenario button
68. Teachers can view custom scenario usage statistics in library
69. Custom scenario library supports filtering by model type
70. Custom scenario library supports searching by name or description
71. Custom scenario library supports sorting by creation date, name, or usage count
72. Empty state message displays when teacher has no custom scenarios
73. Deleting custom scenario does not affect shared links already distributed
74. System tracks all custom scenario creation, edit, share, and usage activities
75. Individual Student View displays custom scenario usage in debugging sandbox activity section
76. Reports include custom scenario usage statistics
77. Reports include most used custom scenarios and usage trends
78. Lesson plans include guidance on creating and using custom failure scenarios
79. Debugging sandbox hyperparameter controls are clearly displayed and functional
80. Learning rate slider allows selection from 0.0001 to 1.0
81. Normalization toggle switches between enabled and disabled states
82. Batch size selector provides appropriate options
83. Epochs selector provides appropriate options
84. Warning indicators appear for problematic configuration choices
85. Retrain button initiates retraining with selected configuration
86. Real-time animated training curves display during retraining
87. Training curves show separate color-coded lines for training and validation data
88. Loss curves display training loss and validation loss separately
89. Accuracy curves (for classification) display training accuracy and validation accuracy separately
90. Error metric curves (for regression) display training error and validation error separately
91. Curves update smoothly with animated transitions as each epoch completes
92. Legend clearly identifies training vs validation curves
93. Overfitting is visually highlighted when validation curve diverges from training curve
94. Underfitting is visually highlighted when both curves remain flat or poor
95. Side-by-side comparison view shows both models simultaneously with training and validation curves for both
96. Comparison view displays performance metrics for both models
97. Educational explanations are displayed for observed failure modes
98. Explanations include interpretation of training vs validation curve patterns
99. Reset button restores original model configuration
100. Users can navigate to testing page from debugging sandbox
101. Debugging sandbox activity is tracked and recorded in database
102. Teachers can view debugging sandbox activity in individual student view
103. Reports include debugging sandbox metrics when applicable
104. Animated curves render smoothly without lag or stuttering
105. Epoch counter updates in real-time during retraining
106. Curve visualization handles edge cases such as overlapping curves or extreme values
107. Save Configuration button is prominently displayed in debugging sandbox
108. Configuration save dialog opens when Save Configuration button is clicked
109. Configuration name field is required and validated
110. Configuration description field is optional
111. Current hyperparameter values are displayed in save dialog
112. Save button stores configuration in database with all required fields
113. Success message displays after configuration is saved
114. Saved Configurations button opens configuration library
115. Configuration library displays all saved configurations with details
116. Configuration cards show name, description, creator, date, and hyperparameter summary
117. Load button on configuration card applies settings to current sandbox
118. Share button on configuration card generates shareable link
119. Delete button removes configuration from library
120. Configuration library supports filtering by model type
121. Configuration library supports searching by name or description
122. Configuration library supports sorting by creation date or name
123. Empty state message displays when no configurations exist
124. Share Configuration button generates unique shareable link
125. Shareable link is displayed in copyable text field
126. Copy to clipboard button provides visual confirmation
127. QR code is generated for shared configuration link
128. Configuration details are displayed on share page
129. Shared configurations are accessible via link to anyone
130. Recipients can load shared configuration into their sandbox
131. Recipients can save copy of shared configuration to their library
132. Configuration tracking records all save, share, and load activities
133. Individual Student View displays configuration activity metrics
134. Reports include configuration saving and sharing statistics
135. Lesson plans include debugging sandbox assignment suggestions
136. All configuration functionality works across different model types
137. Configuration library handles large numbers of saved configurations efficiently
138. Pre-loaded failure scenario buttons are displayed prominently in debugging sandbox
139. Each pre-loaded failure scenario button has distinct visual styling
140. Pre-loaded failure scenario buttons are positioned above or beside manual hyperparameter controls
141. Clicking pre-loaded failure scenario button provides visual feedback
142. System tracks which pre-loaded failure scenario button was clicked
143. Pre-loaded failure scenario button usage is included in student activity reports
144. Teachers can view pre-loaded failure scenario button usage in individual student view
145. Lesson plans include specific guidance on pre-loaded failure scenario button demonstrations
146. Pre-loaded failure scenario buttons work consistently across all model types
147. Multiple pre-loaded failure scenario buttons can be used sequentially
148. Pre-loaded failure scenario button configuration can be saved and shared
149. System accurately tracks number of tries or exercises completed by each user
150. Registration prompt appears after 10 tries and prevents further access until registration completed
151. Registration form collects email, first name, last name, username, and password
152. All registration form fields are required and validated
153. System validates email format and displays error for invalid emails
154. System validates password strength and displays requirements
155. System checks for duplicate usernames and emails and displays appropriate errors
156. System sends verification email immediately after successful registration
157. Verification email contains unique confirmation link valid for 24 hours
158. User can click confirmation link to verify email address
159. System displays success message after successful email verification
160. System displays error message for expired or invalid verification links
161. User can request resend of verification email from verification reminder page
162. Resend verification email option enforces 60-second cooldown between requests
163. System displays countdown timer during resend cooldown period
164. Unverified users are redirected to verification reminder page when attempting to access platform features
165. Verification status is displayed in teacher dashboard for student accounts
166. System tracks verification attempts and resend requests for security monitoring
167. Registered and verified users can access unlimited projects without restrictions
168. Password reset request page is accessible from login page
169. User can submit email address to request password reset
170. System validates email format before processing reset request
171. System sends password reset email with secure reset link to provided email address
172. Password reset email contains unique token valid for 1 hour
173. User can click reset link to access password reset page
174. Password reset page validates token and displays error for invalid or expired tokens
175. User can enter new password with confirmation on reset page
176. Password reset page displays visual password strength meter
177. Password strength meter shows weak indicator in red when password meets fewer than 3 requirements
178. Password strength meter shows medium indicator in yellow or orange when password meets 3-4 requirements
179. Password strength meter shows strong indicator in green when password meets all 5 requirements
180. Password strength meter updates in real-time as user types
181. Password strength meter evaluates length, uppercase, lowercase, numbers, and special characters
182. System displays specific requirements being met or missing below strength meter
183. System validates password strength and match between password fields
184. System updates user password upon successful submission
185. System displays success message and redirects to login page after password reset
186. User can request new reset link if token expired
187. System tracks all password reset requests and completions
188. Password reset token becomes invalid after successful use
189. System displays generic success message for reset requests to prevent email enumeration
190. Teacher Resources Page displays comprehensive lesson plans for all model types
191. Lesson plans include all required components: learning objectives, teaching instructions, vocabulary, discussion prompts, activities, assessment rubrics, and extension activities
192. Lesson plans include debugging sandbox activities and discussion prompts
193. Lesson plans include suggested debugging sandbox assignment configurations with analysis questions
194. Lesson plans include guidance on using pre-loaded failure scenario buttons for classroom demonstrations
195. Lesson plans include guidance on creating and using custom failure scenarios for targeted learning objectives
196. Lesson plans include guidance on creating and managing assignments with saved configurations
197. Lesson plans include guidance on using AI-powered question generator
198. Lesson plans include examples of natural language prompts for generating questions
199. Lesson plans can be downloaded as PDF files with proper formatting
200. Lesson plans use standard educational terminology and align with educational frameworks
201. Each platform page displays relevant lesson plan sections for teachers during student activities
202. Lesson plan content is contextually integrated throughout the student workflow
203. Print-friendly formatting maintains readability and structure
204. System accurately tracks completion of all examples within each level for registered students
205. Badge is automatically awarded when registered student completes all examples for a level
206. Badge & Achievement Page displays all earned badges with unlock dates and progress toward next badges
207. Each badge can be shared to LinkedIn with one click
208. LinkedIn sharing generates properly formatted post with badge image and achievement details
209. Badge images can be downloaded for portfolio use
210. Celebration animation displays when student earns a new badge
211. Teacher & Admin Dashboard displays real-time student progress on ML concepts based on automatically tracked activity data
212. Dashboard shows mastery metrics for gradient descent, overfitting, bias and variance, regularization, and model evaluation calculated from tracked quiz performance
213. Class Overview View displays aggregate statistics and performance summaries for all classes using real tracked activity data
214. Individual Student View shows detailed progress, quiz performance, debugging sandbox experiments, and error patterns for each student from tracked activity data
215. Individual Student View displays debugging sandbox activity including configurations tested, failure scenario buttons clicked (both pre-loaded and custom), custom scenario IDs used, saved, shared, and loaded
216. Individual Student View displays assignment completion status with list of completed and pending assignments
217. Individual Student View shows assignment completion timestamps and time spent on each assignment
218. Individual Student View displays AI-powered quiz performance with difficulty progression
219. Individual Student View shows number of question variations presented
220. At-Risk Alerts View flags students struggling with specific concepts based on performance analytics calculated from tracked activity data
221. Alert criteria include low quiz scores, extended time without progress, repeated errors, incomplete assignments, and consistently low difficulty questions, all determined from tracked metrics
222. Teachers can mark alerts as addressed or resolved
223. Reports Generation View produces automated reports on concept understanding and error patterns using real tracked activity data
224. Error pattern analysis identifies common misconceptions with percentage of students affected based on tracked quiz responses
225. Reports include time spent analysis and improvement trends calculated from tracked activity data
226. Reports include debugging sandbox activity metrics showing experimentation patterns, failure scenario button usage (both pre-loaded and custom), custom scenario usage statistics, configuration saving and sharing activity, and assignment completion rates
227. Reports include assignment-specific metrics showing completion rates, average time spent, completion trends, and most challenging assignments
228. Reports include AI-powered quiz metrics showing difficulty progression, question variations, adaptive adjustment effectiveness, and correlation with mastery
229. Reports can be exported as PDF files with charts and graphs or CSV files with raw data
230. Teachers can customize report date range using calendar date picker with start and end dates
231. Teachers can filter reports by specific student or group of students
232. Teachers can filter reports by specific ML concept or all concepts
233. Teachers can choose to include or exclude charts and graphs in PDF exports
234. Teachers can preview reports before exporting
235. Teachers can schedule automated weekly report delivery on specified day of week
236. Teachers can schedule automated monthly report delivery on specified date of month
237. Teachers can configure multiple email recipients for scheduled reports
238. Teachers can select report format (PDF or CSV) for automated delivery
239. Teachers can configure filters for scheduled reports including date range, students, and concepts
240. Teachers can enable, disable, edit, or delete scheduled reports
241. Teachers can customize email subject line and message body for scheduled report delivery
242. System integrates with email delivery service (Resend or SendGrid) to send scheduled reports
243. Generated reports are automatically attached to emails as PDF or CSV files
244. System sends delivery confirmation notification to teachers when reports are successfully sent
245. System sends error notification to teachers if scheduled report delivery fails with failure reason
246. Email delivery service handles retry logic for temporary delivery failures
247. All email delivery activity is logged for audit and troubleshooting
248. Scheduled reports are generated automatically at configured frequency without manual intervention
249. Dashboard updates in real-time when students complete activities
250. All dashboard views provide navigation between class overview and individual student details
251. Dashboard interface is intuitive and easy to use for teachers and administrators
252. System automatically tracks project creation activities including timestamp, student ID, project type, and description
253. System automatically tracks data collection activities including timestamp, student ID, data type, source, and sample count
254. System automatically tracks concept viewing activities including timestamp, student ID, concept name, and time spent
255. System automatically tracks quiz attempts including timestamp, student ID, question ID, concept, answer, correct/incorrect status, and difficulty level
256. System automatically tracks training sessions including timestamp, student ID, model type, duration, and performance metrics
257. System automatically tracks debugging sandbox experiments including timestamp, student ID, hyperparameter configurations, failure scenario buttons clicked (both pre-loaded and custom), custom scenario IDs used, failure modes observed, and time spent
258. System automatically tracks configuration saves including timestamp, student ID, configuration name, description, and hyperparameter values
259. System automatically tracks configuration shares including timestamp, student ID, configuration ID, and generated link
260. System automatically tracks configuration loads including timestamp, student ID, configuration ID, and source
261. System automatically tracks custom scenario usage including timestamp, student ID, custom scenario ID, model type, and hyperparameter values applied
262. System automatically tracks assignment views including timestamp, student ID, and assignment ID
263. System automatically tracks assignment configuration loads including timestamp, student ID, and assignment ID
264. System automatically tracks assignment completions including timestamp, student ID, and assignment ID
265. System automatically tracks testing activities including timestamp, student ID, test sample count, and evaluation metrics
266. System automatically tracks project completions including timestamp, student ID, and deployment status
267. System automatically tracks badge achievements including timestamp, student ID, and badge details
268. System automatically tracks AI-powered quiz interactions including timestamp, student ID, question ID, difficulty level, answer, and time spent
269. All tracked activity data is stored in backend database and accessible for dashboard queries
270. Activity tracking occurs automatically without manual input from students or teachers
271. Dashboard displays real data from tracked activities instead of mock or placeholder data
272. Mastery metrics are calculated from real tracked quiz performance and time spent data
273. At-risk student identification uses real tracked activity metrics to determine alert criteria
274. Reports are generated using real tracked activity data for all metrics and analytics
275. Activity tracking system handles errors gracefully and logs failures for admin review
276. Activity data syncs in real-time to dashboard for immediate visibility
277. Report export validates date range and displays error if start date is after end date
278. Report scheduling validates email addresses and requires at least one recipient
279. CSV exports properly escape special characters to maintain format integrity
280. PDF reports display charts and graphs with clear labels and legends
281. System handles time zone differences correctly for scheduled report delivery
282. Teachers can cancel scheduled reports while delivery is in progress
283. System displays warning when exporting report with no data in selected date range
284. Email delivery service API integration is properly configured and authenticated
285. System queues emails for retry when delivery service is temporarily unavailable
286. System displays error when report attachment exceeds email size limit
287. Email delivery implements automatic retry logic with exponential backoff for temporary failures
288. System retries failed email deliveries up to 3 times before sending final error notification
289. First retry occurs after 1 minute, second after 5 minutes, third after 15 minutes
290. Permanent email failures such as invalid addresses do not trigger retry logic
291. Final error notification is sent to teachers only after all 3 retry attempts are exhausted
292. Each retry attempt is logged with timestamp and failure reason for audit purposes
293. System validates email address format and highlights invalid addresses
294. System logs email delivery service authentication failures and notifies administrators
295. Teachers can preview customized email templates before scheduling reports
296. Password reset request form validates email format and displays errors
297. Password reset email is sent immediately upon valid request
298. Password reset link contains secure token valid for 1 hour
299. Password reset page validates token before allowing password update
300. Password reset page displays error for expired or invalid tokens
301. User can request new reset link from error page if token expired
302. New password must meet strength requirements and match confirmation field
303. System displays success message and redirects to login after successful password reset
304. Password reset token is single-use and becomes invalid after successful reset
305. System tracks all password reset requests and completions for security monitoring
306. Password reset emails use same delivery service as verification emails
307. System logs all password reset email delivery attempts
308. Password strength meter displays correctly on password reset page
309. Strength meter color changes based on password complexity
310. Strength meter provides clear visual distinction between weak, medium, and strong passwords
311. Teachers can access Mark as Assignment button in saved configurations library
312. Mark as Assignment button opens assignment creation dialog
313. Assignment creation dialog displays configuration details
314. Assignment creation dialog includes text area for assignment instructions (required)
315. Assignment creation dialog includes text input for assignment title (optional)
316. Assignment creation dialog includes date picker for assignment due date (optional)
317. Assignment creation dialog includes checkbox to notify students via email
318. Assignment creation dialog validates instructions are not empty before saving
319. Save Assignment button marks configuration as assignment and stores assignment details
320. System generates unique assignment link after assignment is created
321. Success message displays assignment link after assignment creation
322. System tracks assignment creation activity
323. Students can access My Assignments page from debugging sandbox
324. My Assignments button displays notification badge showing number of unviewed assignments
325. My Assignments page displays all assigned configurations for current student
326. Assignment cards show title, instructions, configuration name, teacher name, creation date, due date, completion status, and hyperparameter summary
327. Students can filter assignments by completion status (Not Started, In Progress, Completed)
328. Students can filter assignments by due date (upcoming, overdue, no due date)
329. Students can sort assignments by creation date, due date, or completion status
330. Load Assignment button loads configuration into debugging sandbox
331. Loading assignment displays assignment instructions in modal dialog
332. Loading assignment automatically marks assignment as In Progress
333. Mark as Completed button allows student to mark assignment as completed
334. System tracks assignment viewing, loading, and completion activities
335. System calculates time spent on assignment from load to completion timestamps
336. Empty state message displays when student has no assignments
337. Overdue assignments are highlighted with red border or indicator
338. Notification badge count decreases when student views assignment
339. Teachers can access Assignment Tracking View from dashboard
340. Assignment Tracking View displays all assignments created by teacher
341. Assignment cards show title, configuration name, creation date, due date, number of students assigned, viewed, loaded, completed, and completion rate
342. Teachers can click assignment card to view detailed student completion status
343. Detailed view shows list of all students with viewed, loaded, completed status and timestamps
344. Detailed view shows time spent on assignment for each student
345. Teachers can filter assignments by completion status (All, High Completion, Low Completion, Overdue)
346. Teachers can sort assignments by creation date, due date, or completion rate
347. Teachers can export assignment completion data as CSV file
348. Teachers can send reminder email to students who have not completed assignment
349. Empty state message displays when teacher has no assignments
350. Color-coded completion rate indicators display on assignment cards
351. System tracks all assignment activity for dashboard and reports
352. Individual Student View displays assignment completion status
353. At-Risk Alerts include students with incomplete assignments past due date
354. Reports include assignment-specific metrics
355. Lesson plans include guidance on creating and managing assignments
356. Assignment functionality works across all model types
357. System handles large numbers of assignments efficiently
358. Assignment notification emails are sent when teacher enables notification option
359. Assignment notification email contains title, instructions, and link to My Assignments page
360. Reminder emails are sent to students who have not completed assignments
361. All assignment-related emails use configured email delivery service
362. Assignment data remains accessible even if configuration is deleted
363. Teachers can view assignment completion trends over time in reports
364. Reports identify most challenging assignments based on completion rates
365. Assignment completion rates are calculated accurately from tracked activity data
366. System validates assignment instructions are not empty before creation
367. AI-powered quiz interface displays personalized questions
368. Questions adapt to student current understanding level
369. Context-aware questions reference student own models and datasets
370. Question difficulty adjusts in real-time based on performance
371. System presents foundational questions before advanced topics
372. Teacher question generator interface accepts natural language input
373. System generates multiple question variations from teacher descriptions
374. Teachers can review and approve generated questions
375. System validates questions for accuracy and clarity
376. System flags problematic questions for review
377. Approved questions are added to student question pool
378. System tracks all quiz activity including difficulty progression
379. Individual Student View displays quiz performance with difficulty metrics
380. Reports include AI-powered quiz analytics
381. At-risk alerts include students with consistently low quiz performance
382. Lesson plans include guidance on using question generator
383. System continuously improves question generation based on feedback
384. Quiz interface provides immediate feedback with explanations
385. Students can view quiz performance summary upon completion
386. System ensures diverse question types for engagement
387. Question generation handles edge cases gracefully
388. Teachers can edit generated questions before approval
389. System tracks question effectiveness metrics
390. Dashboard displays quiz performance trends over time
391. Super Admin Dashboard is accessible only to users with super admin privileges
392. Super admins can create new institutions with required name field
393. Institution creation form collects name, description, address, contact email, and contact phone
394. System validates institution name is not empty before creation
395. System stores institution with all provided fields and creation timestamp
396. Institution Management View displays all institutions with summary information
397. Institution cards show name, description, number of colleges, number of users, creation date, and status
398. Super admins can edit institution details from institution card
399. Super admins can delete institutions with confirmation dialog
400. Deleting institution cascades to delete all associated colleges and groups
401. System displays warning about cascading effects before institution deletion
402. Super admins can filter institutions by status (active/inactive)
403. Super admins can search institutions by name or description
404. Super admins can sort institutions by name, creation date, or number of users
405. Empty state message displays when no institutions exist
406. Super admins can create new colleges within selected institution
407. College creation form collects name, description, parent institution, address, contact email, and contact phone
408. System validates college name and parent institution are not empty before creation
409. System stores college with all provided fields and creation timestamp
410. College Management View displays all colleges within selected institution
411. College cards show name, description, parent institution, number of groups, number of users, creation date, and status
412. Breadcrumb navigation shows institution > colleges path
413. Super admins can edit college details from college card
414. Super admins can delete colleges with confirmation dialog
415. Deleting college cascades to delete all associated groups
416. System displays warning about cascading effects before college deletion
417. Super admins can filter colleges by status or parent institution
418. Super admins can search colleges by name or description
419. Super admins can sort colleges by name, creation date, or number of users
420. Empty state message displays when no colleges exist
421. Super admins can create new groups within selected college
422. Group creation form collects name, description, parent college, group type, start date, and end date
423. System validates group name and parent college are not empty before creation
424. System stores group with all provided fields and creation timestamp
425. Group Management View displays all groups within selected college
426. Group cards show name, description, parent college, parent institution, number of students, number of teachers, creation date, and status
427. Breadcrumb navigation shows institution > college > groups path
428. Super admins can edit group details from group card
429. Super admins can delete groups with confirmation dialog
430. Deleting group removes all student and teacher memberships
431. System displays warning about member removal before group deletion
432. Super admins can filter groups by status, parent college, or group type
433. Super admins can search groups by name or description
434. Super admins can sort groups by name, creation date, or number of members
435. Empty state message displays when no groups exist
436. Super admins can assign users to groups using Assign Users button
437. Super admins can remove users from groups using Remove Users button
438. System tracks all user membership changes with timestamp and super admin ID
439. Organizational Hierarchy View displays visual tree structure of institutions, colleges, and groups
440. Tree structure shows expandable/collapsible nodes for each level
441. Each node displays summary information appropriate to its level
442. Super admins can click on any node to view detailed information
443. Quick action buttons appear on each node for add, edit, and view operations
444. Super admins can search for specific entities in tree with real-time highlighting
445. Super admins can filter tree by status to show only active entities
446. Super admins can export organizational structure as PDF or CSV
447. Zoom and pan controls are available for large hierarchies
448. Empty state message displays when organizational structure is empty
449. System validates parent-child relationships to prevent circular references
450. System tracks all organizational management activities with timestamp and super admin ID
451. All CRUD operations on institutions, colleges, and groups are logged for audit purposes
452. Super admin privileges are enforced at backend to prevent unauthorized access
453. Non-super admin users cannot access Super Admin Dashboard
454. System displays access denied message when non-super admin attempts to access super admin features
455. Organizational hierarchy handles large numbers of entities efficiently
456. Tree visualization provides smooth expand/collapse animations
457. Breadcrumb navigation updates correctly when navigating between hierarchy levels
458. Status indicators clearly distinguish between active and inactive entities
459. Confirmation dialogs prevent accidental deletions of entities with children
460. System handles database failures gracefully during organizational management operations

## 7. Out of Scope for Current Release

- Support for audio and video data types
- Advanced model architecture customization beyond debugging sandbox hyperparameters, pre-loaded failure scenario buttons, and custom failure scenarios
- Batch prediction for multiple test samples
- Model performance comparison tools beyond debugging sandbox
- Collaborative project sharing between users
- Mobile app version
- Integration with Scratch platform
- Adaptive learning paths based on user performance
- Multilingual support for educational content
- Time series forecasting models
- Clustering and unsupervised learning models
- Customizable guided tour paths
- User-contributed sample datasets
- Dark mode theme option
- Advanced data visualization customization
- Social login options
- Lesson plan customization tools for teachers beyond custom failure scenarios
- Integration with learning management systems
- Parent access portals
- Curriculum mapping tools
- Badge customization by teachers
- Leaderboards or competitive features
- Sharing badges to platforms other than LinkedIn
- Badge verification system for employers
- Predictive analytics for student outcomes
- Automated intervention recommendations
- Student self-assessment tools
- Peer review features
- Video tutorials for dashboard usage
- Custom alert threshold configuration
- Bulk student data import
- API access for third-party integrations
- Manual activity data entry or editing by teachers
- Historical activity data export for external analysis
- Activity tracking for anonymous or guest users
- Real-time collaborative report editing
- Report templates with pre-configured filters
- Automated report insights using AI analysis
- SMS delivery for scheduled reports
- Report versioning and change tracking
- Custom branding for exported reports
- Advanced email template editor with rich formatting
- Email delivery analytics dashboard
- A/B testing for email templates
- Integration with multiple email delivery services simultaneously
- Two-factor authentication for login
- Account recovery via security questions
- Password history tracking to prevent reuse
- Advanced debugging sandbox features such as custom loss functions or optimizer selection
- Debugging sandbox for unsupported model types
- Automated debugging recommendations based on failure patterns
- Debugging sandbox collaboration features for group learning beyond configuration sharing, custom scenarios, and assignments
- 3D visualization of training curves
- Exportable training curve data for external analysis
- Customizable curve colors or styles
- Comparison of more than two model configurations simultaneously
- Version control for saved configurations or custom scenarios
- Configuration or custom scenario comments or annotations
- Configuration or custom scenario tagging or categorization beyond model type
- Bulk configuration or custom scenario import or export
- Configuration or custom scenario templates provided by platform beyond pre-loaded failure scenario buttons
- Public configuration or custom scenario gallery or marketplace
- Configuration or custom scenario rating or review system
- Collaborative editing of shared configurations or custom scenarios
- Configuration or custom scenario change history or audit log
- Advanced configuration or custom scenario search with filters beyond name and description
- Configuration or custom scenario recommendations based on user activity
- Integration of configuration or custom scenario sharing with external platforms
- Customizable failure scenario buttons beyond teacher-created custom scenarios
- Advanced failure mode analysis beyond provided educational explanations
- Automated failure mode detection and alerts during training
- Failure scenario button or custom scenario usage analytics dashboard for teachers beyond existing reports
- Gamification of failure scenario exploration
- Failure scenario challenges or competitions
- Student-created custom failure scenarios
- Peer sharing of custom failure scenarios between teachers
- Custom scenario versioning or rollback functionality
- Custom scenario duplication or cloning across model types
- Bulk custom scenario creation or editing
- Custom scenario effectiveness analytics comparing learning outcomes
- Assignment grading or scoring system
- Assignment rubrics or evaluation criteria customization
- Assignment feedback or comments from teachers to students
- Assignment resubmission or revision workflow
- Assignment peer review features
- Assignment group work or collaboration features
- Assignment plagiarism detection
- Assignment analytics comparing student performance across assignments
- Assignment templates or pre-built assignment library
- Assignment versioning or change history
- Assignment duplication or cloning
- Bulk assignment creation or editing
- Assignment scheduling for future release dates
- Assignment visibility controls or draft mode
- Assignment categories or tags for organization
- Assignment search or advanced filtering beyond current filters
- Assignment recommendations based on student performance
- Integration of assignments with external learning management systems
- Assignment completion certificates or badges
- Assignment leaderboards or rankings
- Assignment time limits or timed assessments
- Assignment randomization of questions or configurations
- Assignment adaptive difficulty based on student performance
- Manual question creation interface for teachers beyond AI generator
- Question bank management system with advanced organization
- Question versioning or change history
- Question difficulty calibration based on large-scale student data
- Question recommendation engine for optimal learning paths
- Collaborative question creation between teachers
- Question marketplace or sharing platform
- Question analytics dashboard showing effectiveness metrics
- Question tagging or categorization beyond concepts
- Advanced question types such as drag-and-drop or interactive simulations
- Question randomization or shuffling for assessments
- Question pools for generating unique quizzes per student
- Timed quiz mode with countdown timer
- Quiz retake functionality with different questions
- Quiz review mode showing all questions and answers
- Quiz comparison between students
- Quiz leaderboards or rankings
- Quiz certificates or completion badges
- Integration of quiz results with external grading systems
- Adaptive quiz length based on student performance
- Quiz scheduling or assignment of specific quizzes
- Quiz templates or pre-built quiz libraries
- Question import from external sources
- Question export for use in other platforms
- Advanced natural language processing for teacher question descriptions
- Multi-language support for question generation
- Voice input for teacher question descriptions
- Image-based questions or visual question types
- Video-based questions or multimedia question types
- Real-time collaborative quiz taking
- Peer-generated questions or student question contributions
- Question difficulty prediction before student attempts
- Automated question generation without teacher input
- Question generation based on external educational standards
- Integration with external question banks or repositories
- Multi-level organizational hierarchy beyond institution > college > group
- Automated organizational structure recommendations
- Organizational analytics dashboard for super admins
- Bulk import of organizational structure from external systems
- Organizational structure templates or presets
- Cross-institution reporting or analytics
- Organizational structure versioning or change history
- Role-based access control customization for organizational entities
- Delegation of super admin privileges to sub-administrators
- Organizational structure visualization customization options
- Integration with external identity management systems for organizational hierarchy
- Automated user provisioning based on organizational structure
- Organizational structure export to external systems
- Advanced organizational search with complex filters
- Organizational structure comparison or diff tools
- Organizational structure cloning or duplication
- Organizational structure archiving for historical records
- Organizational structure audit logs with detailed change tracking
- Organizational structure permissions management at granular level
- Custom organizational entity types beyond institution, college, and group
- Organizational structure workflow approvals for changes