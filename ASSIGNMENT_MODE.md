# Assignment Mode for Debugging Sandbox Configurations

## Overview
Assignment Mode allows teachers to transform saved debugging sandbox configurations into structured learning assignments with specific instructions, due dates, and completion tracking. Students can view assigned configurations in a dedicated "My Assignments" section, and teachers can monitor which students have loaded and analyzed each assignment configuration with detailed completion reports.

## Purpose
- **Structured Learning**: Convert debugging sandbox experiments into formal assignments
- **Clear Instructions**: Provide specific guidance for students on what to observe and analyze
- **Progress Tracking**: Monitor student engagement and completion in real-time
- **Accountability**: Track when students view, load, and complete assignments
- **Data-Driven Insights**: Generate reports on assignment completion rates and student performance

## Key Features

### For Teachers

#### 1. Mark Configuration as Assignment
Teachers can convert any saved configuration into an assignment.

**How to Create an Assignment**:
1. Save a debugging sandbox configuration (if not already saved)
2. Open "My Configurations" library
3. Find the configuration you want to assign
4. Click "Mark as Assignment" button
5. Fill in assignment details:
   - **Assignment Title** (optional): Custom title for the assignment (defaults to configuration name)
   - **Assignment Instructions** (required): Specific guidance for students (max 2000 characters)
   - **Due Date** (optional): Set a deadline using date-time picker
   - **Notify Students** (optional): Send email notification when assignment is created
6. Click "Create Assignment"

**Assignment Instructions Best Practices**:
- Clearly state what students should observe
- Ask specific questions about the failure mode
- Guide students to compare training vs validation curves
- Prompt students to explain why the configuration causes problems
- Suggest what hyperparameter changes would fix the issue
- Include discussion prompts for class reflection

**Example Instructions**:
```
Load this configuration and observe the training curves carefully.

Tasks:
1. Run the retraining and watch how the loss curve behaves
2. Compare the training loss vs validation loss
3. Identify the specific failure mode (divergence, oscillation, poor convergence)
4. Explain WHY this learning rate causes the observed behavior
5. Suggest an optimal learning rate value and justify your choice

Submit your analysis in the class discussion forum by Friday.
```

#### 2. Assignment Tracking Dashboard
Teachers can monitor assignment completion from the Teacher & Admin Dashboard.

**Assignment Tracking View Features**:
- List of all assignments created by teacher
- Assignment cards showing:
  - Assignment title and configuration name
  - Creation date and due date
  - Number of students assigned
  - Number of students who viewed the assignment
  - Number of students who loaded the configuration
  - Number of students who completed the assignment
  - Completion rate percentage
- Click assignment card to view detailed student list
- Detailed view shows for each student:
  - Student name
  - Viewed status (Yes/No with timestamp)
  - Loaded status (Yes/No with timestamp)
  - Completed status (Yes/No with timestamp)
  - Time spent on assignment
- Filter assignments by completion status (All, High Completion, Low Completion, Overdue)
- Sort assignments by creation date, due date, or completion rate
- Export assignment completion data as CSV file
- Send reminder email to students who haven't completed assignment

**Completion Status Indicators**:
- **High Completion**: Green indicator (>75% completion rate)
- **Medium Completion**: Yellow indicator (50-75% completion rate)
- **Low Completion**: Red indicator (<50% completion rate)
- **Overdue**: Red border on assignment card if past due date

#### 3. Assignment Reports
Assignment completion data is automatically included in automated reports.

**Assignment Metrics in Reports**:
- Assignment completion rates by class or student
- Average time spent on assignments
- Assignment completion trends over time
- Most challenging assignments based on completion rates
- List of students who haven't completed assignments
- Comparison of completion rates across different assignments

**Report Filters**:
- Filter by specific assignment
- Filter by date range
- Filter by student or group of students
- Include or exclude assignment metrics in reports

### For Students

#### 1. My Assignments Section
Students access assignments through a dedicated "My Assignments" button in the debugging sandbox.

**My Assignments Features**:
- Dedicated dialog showing all assigned configurations
- Assignment cards display:
  - Assignment title
  - Assignment instructions
  - Configuration name
  - Teacher name
  - Creation date
  - Due date (if set)
  - Completion status (Not Started, In Progress, Completed)
  - Hyperparameter values summary
- Filter assignments by completion status
- Filter assignments by due date (upcoming, overdue, no due date)
- Sort assignments by creation date, due date, or completion status
- Notification badge on "My Assignments" button showing unviewed assignments
- Overdue assignments highlighted with red border

**Completion Status Badges**:
- **Not Started**: Gray outline badge
- **In Progress**: Yellow badge with clock icon
- **Completed**: Green badge with checkmark icon
- **Overdue**: Red badge with alert icon (if past due date and not completed)

#### 2. Loading Assignments
Students load assignments to apply the configuration to their debugging sandbox.

**How to Load an Assignment**:
1. Click "My Assignments" button in debugging sandbox
2. Find the assignment you want to work on
3. Read the assignment instructions carefully
4. Click "Load Assignment" button
5. Assignment instructions appear as a toast notification
6. Configuration is automatically applied to debugging sandbox
7. Model automatically retrains with assignment configuration
8. Assignment status changes to "In Progress"

**What Happens When Loading**:
- All hyperparameter values are applied (learning rate, normalization, batch size, epochs)
- Model retrains automatically with the assigned configuration
- Assignment instructions display in a toast notification for 10 seconds
- System tracks the load timestamp
- Assignment status updates to "In Progress"

#### 3. Completing Assignments
Students mark assignments as completed after analyzing the configuration.

**How to Complete an Assignment**:
1. Load the assignment configuration
2. Observe the training curves and failure mode
3. Analyze the results according to assignment instructions
4. Complete any required analysis or documentation
5. Return to "My Assignments"
6. Click "Mark as Completed" button
7. Assignment status changes to "Completed"

**Completion Tracking**:
- System tracks completion timestamp
- System calculates time spent (from load to completion)
- Completed assignments show green badge with checkmark
- Teachers can view completion timestamp and time spent
- Completed assignments cannot be loaded again (button disabled)

## Database Schema

### Updated sandbox_configurations Table
```sql
ALTER TABLE sandbox_configurations
ADD COLUMN is_assignment boolean NOT NULL DEFAULT false,
ADD COLUMN assignment_title text,
ADD COLUMN assignment_instructions text,
ADD COLUMN assignment_due_date timestamptz,
ADD COLUMN notify_students boolean NOT NULL DEFAULT false;
```

**New Columns**:
- `is_assignment`: Boolean flag indicating if configuration is an assignment
- `assignment_title`: Custom title for assignment (optional, defaults to configuration name)
- `assignment_instructions`: Specific instructions for students (required for assignments)
- `assignment_due_date`: Optional deadline for assignment completion
- `notify_students`: Boolean flag for email notification when assignment is created

### assignment_completions Table
```sql
CREATE TABLE assignment_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES sandbox_configurations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz,
  loaded_at timestamptz,
  completed_at timestamptz,
  time_spent_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_assignment_per_student UNIQUE (configuration_id, student_id)
);
```

**Columns**:
- `id`: Unique identifier for completion record
- `configuration_id`: Reference to assignment configuration
- `student_id`: Reference to student user
- `viewed_at`: Timestamp when student viewed assignment in My Assignments
- `loaded_at`: Timestamp when student loaded assignment configuration
- `completed_at`: Timestamp when student marked assignment as completed
- `time_spent_seconds`: Calculated time from load to completion
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp

**Indexes**:
- `idx_assignment_completions_config_id`: Fast lookup by configuration
- `idx_assignment_completions_student_id`: Fast lookup by student
- `idx_assignment_completions_completed_at`: Sorting by completion date
- `idx_sandbox_configs_is_assignment`: Fast filtering of assignments

### Row Level Security (RLS)

**assignment_completions Policies**:
- **Students can view their own completions**: Students can SELECT their own completion records
- **Teachers can view completions for their assignments**: Teachers can SELECT completion records for assignments they created
- **Students can insert their own completions**: Students can INSERT completion records with their own student_id
- **Students can update their own completions**: Students can UPDATE only their own completion records

## User Interface

### Teacher UI Components

#### Mark as Assignment Dialog
- **Trigger**: "Mark as Assignment" button in Saved Configurations Library
- **Layout**: Modal dialog with configuration summary at top
- **Fields**:
  - Assignment Title input (optional, placeholder shows configuration name)
  - Assignment Instructions textarea (required, 2000 char limit, character counter)
  - Due Date datetime-local input with calendar icon (optional)
  - Notify Students toggle switch with description
- **Actions**: Cancel button, Create Assignment button (disabled until instructions entered)
- **Validation**: Assignment instructions required, cannot be empty
- **Success**: Toast notification, dialog closes, library refreshes

#### Saved Configurations Library Updates
- **Assignment Badge**: Configurations marked as assignments show "Assignment" badge with clipboard icon
- **Mark as Assignment Button**: Only visible to teachers, only shown for non-assignment configurations
- **Button Placement**: Appears alongside Load, Share, and Delete buttons
- **Icon**: ClipboardList icon with "Mark as Assignment" label

#### Assignment Tracking View (Dashboard)
- **Location**: Teacher & Admin Dashboard → Assignment Tracking View
- **Layout**: Grid of assignment cards with expandable details
- **Card Content**:
  - Assignment title (bold, large text)
  - Configuration name (smaller, muted text)
  - Creation and due dates with calendar icons
  - Student counts (assigned, viewed, loaded, completed)
  - Completion rate percentage with color-coded indicator
  - Overdue indicator (red border) if past due date
- **Filters**: Dropdown for completion status, dropdown for due date filter
- **Sort**: Dropdown for sort order (creation date, due date, completion rate)
- **Actions**: Export CSV button, Send Reminder button
- **Detailed View**: Click card to expand and show student list with completion status

### Student UI Components

#### My Assignments Button
- **Location**: Debugging Sandbox page, alongside Save Configuration and My Configurations buttons
- **Icon**: ClipboardList icon
- **Label**: "My Assignments"
- **Notification Badge**: Red circular badge showing count of unviewed assignments (top-right corner)
- **Badge Behavior**: Count decreases when student views assignment in My Assignments dialog
- **Disabled State**: Disabled during retraining

#### My Assignments Dialog
- **Trigger**: Click "My Assignments" button
- **Layout**: Full-width dialog with filters at top, scrollable assignment list
- **Filters**:
  - Search input with magnifying glass icon (searches title and instructions)
  - Status filter dropdown (All Statuses, Not Started, In Progress, Completed)
  - Due date filter dropdown (All Due Dates, Upcoming, Overdue, No Due Date)
- **Assignment Cards**:
  - Title and configuration name
  - Status badge (color-coded with icon)
  - Overdue badge (red with alert icon) if applicable
  - Assignment instructions (full text)
  - Due date with calendar icon
  - Configuration details (learning rate, normalization, batch size, epochs)
  - Load Assignment button (primary, disabled if completed)
  - Mark as Completed button (outline, only shown if in progress)
- **Empty State**: Calendar icon with message "No assignments found"
- **Close Button**: Bottom-right corner

## Workflow Examples

### Example 1: Teacher Creates Assignment
**Scenario**: Teacher wants students to analyze a high learning rate configuration

**Steps**:
1. Teacher opens debugging sandbox
2. Sets learning rate to 0.8, keeps other parameters optimal
3. Clicks "Save Configuration"
4. Names it "High Learning Rate Experiment"
5. Adds description "Demonstrates learning rate divergence"
6. Saves configuration
7. Opens "My Configurations" library
8. Finds "High Learning Rate Experiment"
9. Clicks "Mark as Assignment"
10. Enters assignment title: "Learning Rate Analysis Assignment"
11. Enters instructions:
    ```
    Load this configuration and observe the training curves.
    
    Answer these questions:
    1. What happens to the loss curve? Does it converge or diverge?
    2. Why does a learning rate of 0.8 cause this behavior?
    3. What learning rate would you recommend instead?
    4. How would you know if the learning rate is too low?
    
    Submit your answers in the discussion forum by Friday 5 PM.
    ```
12. Sets due date to Friday 5 PM
13. Enables "Notify Students"
14. Clicks "Create Assignment"
15. Success notification appears
16. Assignment is now visible to all students

**Learning Outcome**: Students learn to identify and explain learning rate divergence

### Example 2: Student Completes Assignment
**Scenario**: Student receives assignment and completes analysis

**Steps**:
1. Student logs into platform
2. Navigates to debugging sandbox
3. Sees notification badge "1" on "My Assignments" button
4. Clicks "My Assignments"
5. Sees "Learning Rate Analysis Assignment" card
6. Reads assignment instructions
7. Notes due date is Friday 5 PM (2 days away)
8. Clicks "Load Assignment"
9. Assignment instructions appear as toast notification
10. Configuration applies automatically (learning rate 0.8)
11. Model retrains with high learning rate
12. Student observes loss curve diverging
13. Student takes notes on observations
14. Student compares with original model
15. Student writes answers to questions
16. Student submits answers in discussion forum
17. Student returns to "My Assignments"
18. Clicks "Mark as Completed"
19. Assignment status changes to "Completed" with green checkmark
20. Teacher can now see completion timestamp and time spent

**Learning Outcome**: Student understands learning rate impact through hands-on experimentation

### Example 3: Teacher Tracks Assignment Completion
**Scenario**: Teacher monitors which students have completed the assignment

**Steps**:
1. Teacher opens Teacher & Admin Dashboard
2. Navigates to Assignment Tracking View
3. Sees "Learning Rate Analysis Assignment" card
4. Card shows:
   - 25 students assigned
   - 23 students viewed (92%)
   - 20 students loaded (80%)
   - 15 students completed (60%)
   - Completion rate: 60% (yellow indicator)
5. Teacher clicks on assignment card to expand
6. Detailed view shows list of all 25 students
7. Teacher sees:
   - 15 students marked as "Completed" with green checkmark and timestamps
   - 5 students marked as "In Progress" with yellow clock icon
   - 5 students marked as "Not Started" with gray outline
8. Teacher identifies students who haven't started
9. Teacher clicks "Send Reminder" button
10. Reminder email sent to 5 students who haven't started
11. Teacher exports completion data as CSV for grading
12. Teacher uses data to identify students needing extra support

**Learning Outcome**: Teacher gains insights into student engagement and can intervene early

### Example 4: Overdue Assignment Handling
**Scenario**: Student has overdue assignment and teacher follows up

**Steps**:
1. Due date passes (Friday 5 PM)
2. Student logs in on Monday
3. Opens "My Assignments"
4. Sees assignment with red "Overdue" badge
5. Assignment card has red border
6. Student realizes assignment is late
7. Student loads assignment anyway
8. Student completes analysis
9. Student marks as completed
10. Teacher sees completion timestamp shows Monday (late)
11. Teacher can apply late penalty based on timestamp
12. Teacher discusses time management with student

**Learning Outcome**: Students learn accountability and time management

## Best Practices

### For Teachers

#### Creating Effective Assignments
- **Clear Objectives**: State exactly what students should learn
- **Specific Instructions**: Provide step-by-step guidance
- **Measurable Outcomes**: Ask questions that require specific answers
- **Realistic Deadlines**: Allow sufficient time for analysis
- **Contextual Learning**: Connect to real-world ML scenarios

#### Monitoring Completion
- **Regular Check-ins**: Review completion rates weekly
- **Early Intervention**: Send reminders before due dates
- **Identify Patterns**: Look for students consistently not completing
- **Adjust Difficulty**: If completion rates are low, simplify instructions
- **Celebrate Success**: Acknowledge students who complete on time

#### Using Completion Data
- **Grading**: Use completion timestamps for participation grades
- **Discussion**: Use completion data to guide class discussions
- **Support**: Identify students needing extra help
- **Improvement**: Analyze which assignments are most effective
- **Reporting**: Include assignment data in parent/admin reports

### For Students

#### Managing Assignments
- **Check Regularly**: Look for new assignments daily
- **Read Carefully**: Understand instructions before loading
- **Plan Ahead**: Don't wait until due date
- **Take Notes**: Document observations while experimenting
- **Ask Questions**: Clarify instructions with teacher if unclear

#### Completing Assignments
- **Follow Instructions**: Complete all required tasks
- **Observe Carefully**: Watch training curves closely
- **Compare Results**: Use comparison view to understand differences
- **Explain Reasoning**: Don't just state observations, explain why
- **Mark Completed**: Remember to mark as completed when done

## Technical Implementation

### Component Architecture
- **MarkAsAssignmentDialog**: Dialog for creating assignments from configurations
- **MyAssignments**: Dialog for students to view and manage assignments
- **SavedConfigurationsLibrary**: Updated to show assignment badge and Mark as Assignment button
- **DebuggingSandboxPage**: Integrated with My Assignments button and assignment loading

### State Management
- **Assignment States**: showMarkAsAssignment, configToMark, showMyAssignments, unviewedAssignmentsCount
- **Assignment Tracking**: Separate state for viewed, loaded, and completed timestamps
- **Notification Badge**: Real-time count of unviewed assignments

### Database Operations
- **Create Assignment**: UPDATE sandbox_configurations SET is_assignment=true with assignment fields
- **Track Viewing**: INSERT or UPDATE assignment_completions with viewed_at timestamp
- **Track Loading**: UPDATE assignment_completions with loaded_at timestamp
- **Track Completion**: UPDATE assignment_completions with completed_at and time_spent_seconds
- **Query Assignments**: SELECT configurations WHERE is_assignment=true with completion JOIN

### Security
- **RLS Policies**: Students can only view/update their own completions, teachers can view completions for their assignments
- **Input Validation**: Assignment instructions required, character limits enforced
- **SQL Injection Prevention**: Parameterized queries prevent injection
- **Access Control**: Only teachers can mark configurations as assignments

## Troubleshooting

### Common Issues

#### Assignment Not Appearing for Students
- **Check Model Type**: Assignments are filtered by model type
- **Verify is_assignment Flag**: Ensure configuration has is_assignment=true
- **Check RLS Policies**: Verify students have SELECT permission

#### Cannot Mark Configuration as Assignment
- **Check User Role**: Only teachers (admin role) can mark as assignments
- **Check Login Status**: Must be logged in
- **Check Configuration Ownership**: Must own the configuration

#### Completion Not Tracking
- **Check Load First**: Student must load assignment before marking completed
- **Check Database Connection**: Ensure database connection is active
- **Check RLS Policies**: Verify students have INSERT/UPDATE permission

#### Notification Badge Not Updating
- **Refresh Page**: Reload page to fetch latest assignment count
- **Check Viewed Timestamp**: Ensure viewed_at is being set when opening My Assignments
- **Check Query**: Verify query correctly counts unviewed assignments

## Future Enhancements

### Potential Features
- **Assignment Templates**: Pre-built assignment templates for common concepts
- **Rubrics**: Customizable grading rubrics for assignments
- **Feedback**: Teachers can provide feedback on completed assignments
- **Resubmission**: Allow students to resubmit assignments
- **Group Assignments**: Assign configurations to specific student groups
- **Assignment Analytics**: Detailed analytics on assignment effectiveness
- **Peer Review**: Students review each other's assignment analyses
- **Auto-Grading**: Automatic grading based on configuration analysis
- **Assignment Versioning**: Track changes to assignment instructions
- **Assignment Duplication**: Duplicate assignments for different classes

### Integration Opportunities
- **Learning Management Systems**: Direct integration with Canvas, Blackboard, Moodle
- **Grade Export**: Export assignment grades to LMS gradebook
- **Calendar Integration**: Sync due dates with student calendars
- **Email Reminders**: Automated reminder emails before due dates
- **Mobile Notifications**: Push notifications for new assignments

## Related Documentation
- [Debugging Sandbox](./DEBUGGING_SANDBOX.md) - Main debugging sandbox documentation
- [Configuration Save/Share](./CONFIGURATION_SAVE_SHARE.md) - Configuration management
- [Custom Failure Scenarios](./CUSTOM_FAILURE_SCENARIOS.md) - Custom scenario creation
- [Teacher Dashboard](./TEACHER_DASHBOARD.md) - Dashboard and reporting features
- [Teacher Resources](./TEACHER_RESOURCES.md) - Lesson plans and teaching materials
