# Custom Failure Scenarios

## Overview
Custom Failure Scenarios allow teachers to create and share personalized hyperparameter configurations beyond the four pre-loaded failure scenarios. Teachers can design specific problematic configurations for targeted learning objectives, save them to a personal library, and share them with students via unique links.

## Purpose
- **Personalized Learning**: Teachers create scenarios tailored to specific curriculum needs
- **Targeted Demonstrations**: Design configurations that highlight particular ML concepts
- **Assignment Creation**: Share scenarios with students for analysis and discussion
- **Reusable Content**: Build a library of scenarios for multiple classes and semesters
- **Flexible Teaching**: Adapt scenarios to different learning levels and objectives

## Access
- **Teachers Only**: Only users with teacher/admin role can create custom scenarios
- **Students**: Can view and use custom scenarios shared by their teachers
- **Visibility**: Custom scenarios appear alongside pre-loaded scenarios in debugging sandbox

## Features

### Custom Scenario Builder
Teachers can create custom failure scenarios using an intuitive builder interface.

#### Hyperparameter Selection
- **Learning Rate Slider**: Range from 0.0001 to 1.0 with precise control
- **Normalization Toggle**: Enable or disable data normalization
- **Batch Size Selector**: Choose from 1, 2, 4, 8, 16, 32, 64
- **Epochs Selector**: Choose from 5, 10, 20, 50, 100

#### Scenario Metadata
- **Name** (Required): Descriptive name for the scenario (max 100 characters)
- **Description** (Optional): Explanation of what the scenario demonstrates (max 500 characters)
- **Model Type**: Automatically associated with current model type

#### Real-Time Preview
- Configuration preview shows all selected hyperparameter values
- Two-column layout displays parameters clearly
- Helps teachers verify settings before saving

#### Validation
- Scenario name must not be empty
- Scenario name must be unique within teacher's library
- Duplicate names display error message

### Custom Scenario Library
Teachers can manage all their custom scenarios from a centralized library.

#### Scenario Cards Display
Each scenario card shows:
- **Scenario Name**: Teacher-defined name
- **Description**: Optional explanation of the scenario
- **Hyperparameter Values**: Learning rate, normalization, batch size, epochs
- **Creation Date**: When the scenario was created
- **Usage Count**: Number of times students have used the scenario
- **Model Type**: Associated model type

#### Library Features
- **Search**: Find scenarios by name or description
- **Filter**: Filter by model type
- **Sort**: Sort by creation date, name, or usage count
- **Empty State**: Helpful message when no scenarios exist

#### Scenario Actions
- **Load**: Apply scenario configuration to current debugging sandbox
- **Share**: Generate shareable link for students
- **Delete**: Remove scenario from library (with confirmation)

### Sharing Custom Scenarios
Teachers can share custom scenarios with students via unique shareable links.

#### Share Dialog Features
- **Scenario Details**: Display name, description, and hyperparameter values
- **Assignment Instructions**: Optional text area for assignment instructions (max 1000 characters)
- **Shareable Link**: Unique URL that includes scenario token
- **Copy to Clipboard**: One-click copy with visual confirmation
- **QR Code**: Generated QR code for easy mobile sharing

#### Assignment Instructions
- Teachers can add specific instructions for students
- Instructions appear in URL query parameter
- Students see instructions when loading the scenario
- Useful for guided analysis and discussion prompts

#### Share Link Format
- Base URL: `/debugging-sandbox/custom-scenario/{share_token}`
- With instructions: `?instructions={encoded_instructions}`
- Unique token ensures scenario identification
- Links remain valid even if scenario is deleted from library

### Using Custom Scenarios (Students)
Students can access and use custom scenarios shared by their teachers.

#### Accessing Scenarios
- Custom scenarios appear in debugging sandbox below pre-loaded scenarios
- Visually distinguished with dashed border styling
- Display teacher-defined names and descriptions
- Show usage count badge

#### Loading Scenarios
1. Click custom scenario button
2. Configuration automatically applies to all hyperparameters
3. Model automatically retrains with custom configuration
4. Observe failure mode in real-time training curves
5. Compare with original well-trained model

#### Scenario Tooltips
- Hover over custom scenario button to see tooltip
- Displays all hyperparameter values
- Shows scenario description if provided
- Same format as pre-loaded scenario tooltips

#### Usage Tracking
- Each time student clicks custom scenario button, usage count increments
- Teachers can view usage statistics in library
- Helps teachers understand which scenarios are most effective

## Database Schema

### custom_failure_scenarios Table
```sql
CREATE TABLE custom_failure_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  model_type text NOT NULL,
  learning_rate numeric NOT NULL,
  normalization boolean NOT NULL,
  batch_size integer NOT NULL,
  epochs integer NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_scenario_name_per_user UNIQUE (user_id, name)
);
```

### Indexes
- `idx_custom_scenarios_user_id`: Fast lookup by user
- `idx_custom_scenarios_created_at`: Sorting by creation date
- `idx_custom_scenarios_share_token`: Fast lookup by share token
- `idx_custom_scenarios_usage_count`: Sorting by usage count

### Row Level Security (RLS)
- **View Own**: Users can view their own scenarios
- **View Public**: Users can view public scenarios
- **Insert**: Users can insert scenarios with their own user_id
- **Update**: Users can update only their own scenarios
- **Delete**: Users can delete only their own scenarios

## User Interface

### Teacher Controls
- **Create Button**: Opens custom scenario builder
  - Icon: Plus
  - Label: "Create"
  - Position: Top right of custom scenarios section
  
- **Manage Button**: Opens custom scenario library
  - Icon: Library
  - Label: "Manage"
  - Position: Top right of custom scenarios section

### Custom Scenario Buttons
- **Visual Style**: Outline variant with dashed border
- **Layout**: Multi-line with icon, name, and description
- **Icon**: TrendingUp (generic for all custom scenarios)
- **Truncation**: Name truncates if too long, description shows 2 lines max
- **Hover State**: Tooltip with full configuration details
- **Disabled State**: Disabled during retraining

### Empty State
- Displayed when teacher has no custom scenarios
- Dashed border box with centered message
- Encourages creating first scenario
- Only visible to teachers

### Minimal Design Principles
- **Ample Whitespace**: Generous padding and spacing
- **Clear Typography**: Font size hierarchy for readability
- **Subtle Borders**: Dashed borders for custom scenarios
- **Gentle Contrast**: Muted colors for secondary information
- **No Heavy Shadows**: Minimal elevation effects

## Workflow Examples

### Example 1: Creating Assignment Scenario
**Scenario**: Teacher creates scenario for homework assignment

**Steps**:
1. Teacher clicks "Create" button in debugging sandbox
2. Scenario builder opens
3. Teacher sets learning rate to 0.3 (moderately high)
4. Keeps normalization enabled, batch size 32, epochs 50
5. Names scenario "Moderate Learning Rate Oscillation"
6. Adds description: "Observe how moderately high learning rate causes oscillating but not diverging curves"
7. Clicks "Create Scenario"
8. Scenario appears in custom scenarios section
9. Teacher clicks "Manage" to open library
10. Clicks "Share" on the new scenario
11. Adds assignment instructions: "Load this scenario and observe the training curves. Explain why the loss oscillates but doesn't diverge. What learning rate would you recommend?"
12. Copies shareable link
13. Posts link in learning management system

**Learning Outcome**: Students analyze nuanced behavior between optimal and problematic settings

### Example 2: Building Scenario Library
**Scenario**: Teacher creates multiple scenarios for different concepts

**Steps**:
1. Teacher creates "Extreme Overfitting" scenario (LR=0.0001, Norm=On, Batch=64, Epochs=100)
2. Creates "Gradient Vanishing" scenario (LR=0.00001, Norm=Off, Batch=32, Epochs=50)
3. Creates "Mixed Problems" scenario (LR=0.5, Norm=Off, Batch=2, Epochs=10)
4. Creates "Subtle Underfitting" scenario (LR=0.001, Norm=On, Batch=32, Epochs=15)
5. Opens library to view all scenarios
6. Sorts by creation date to see newest first
7. Shares each scenario with different classes based on curriculum stage

**Learning Outcome**: Teacher builds reusable content library for multiple semesters

### Example 3: Student Using Custom Scenario
**Scenario**: Student completes teacher-assigned scenario analysis

**Steps**:
1. Student clicks shared link from assignment
2. Debugging sandbox opens with custom scenario loaded
3. Assignment instructions display in modal: "Analyze the training curves and identify the problem"
4. Student clicks custom scenario button
5. Model retrains with teacher-specified configuration
6. Student observes training curves
7. Student compares with original model
8. Student identifies the problem (e.g., oscillating loss)
9. Student writes analysis explaining the failure mode
10. Student submits analysis to teacher

**Learning Outcome**: Student develops debugging skills through guided analysis

### Example 4: Tracking Scenario Effectiveness
**Scenario**: Teacher reviews which scenarios students use most

**Steps**:
1. Teacher opens custom scenario library
2. Sorts scenarios by usage count (descending)
3. Sees "Moderate Learning Rate Oscillation" has 45 uses
4. Sees "Extreme Overfitting" has 12 uses
5. Concludes moderate scenarios are more popular
6. Creates more scenarios with subtle problems
7. Shares new scenarios with students
8. Monitors usage count over time

**Learning Outcome**: Teacher adapts content based on student engagement

## Best Practices

### For Teachers

#### Creating Effective Scenarios
- **Clear Names**: Use descriptive names that hint at the problem
- **Detailed Descriptions**: Explain what students should observe
- **Targeted Problems**: Focus on one concept per scenario
- **Varied Difficulty**: Create scenarios for different learning levels
- **Real-World Context**: Relate scenarios to practical ML problems

#### Sharing Scenarios
- **Assignment Instructions**: Always include clear instructions
- **Learning Objectives**: State what students should learn
- **Discussion Prompts**: Ask specific questions for analysis
- **Expected Observations**: Guide students on what to look for
- **Follow-Up**: Discuss scenario results in class

#### Managing Library
- **Organize by Concept**: Create scenarios for each ML concept
- **Update Regularly**: Refine scenarios based on student feedback
- **Track Usage**: Monitor which scenarios are most effective
- **Share Best Practices**: Collaborate with other teachers
- **Archive Old Scenarios**: Remove outdated or ineffective scenarios

### For Students

#### Using Custom Scenarios
- **Read Instructions**: Always read assignment instructions before clicking
- **Observe Carefully**: Watch training curves closely during retraining
- **Compare Results**: Compare custom scenario with original model
- **Take Notes**: Document observations about failure modes
- **Ask Questions**: Discuss confusing results with teacher or classmates

#### Learning from Scenarios
- **Predict First**: Try to predict what will happen before clicking
- **Analyze Patterns**: Look for patterns in training vs validation curves
- **Connect Concepts**: Relate scenario to ML concepts learned in class
- **Experiment Further**: Try manual adjustments after using scenario
- **Reflect**: Think about real-world situations where this problem occurs

## Technical Implementation

### Component Architecture
- **CustomScenarioBuilder**: Dialog component for creating scenarios
- **CustomScenarioLibrary**: Dialog component for managing scenarios
- **ShareCustomScenarioDialog**: Dialog component for sharing scenarios
- **DebuggingSandboxPage**: Main page integrating all components

### State Management
- **Custom Scenarios**: Loaded from database on page mount
- **User Role**: Checked to determine teacher status
- **Dialog States**: Separate state for each dialog (builder, library, share)
- **Scenario to Share**: Tracks which scenario is being shared

### Database Operations
- **Create**: Insert new scenario with user_id and unique share_token
- **Read**: Query scenarios by user_id and model_type
- **Update**: Increment usage_count when student uses scenario
- **Delete**: Remove scenario from database (soft delete via RLS)

### Security
- **RLS Policies**: Ensure users can only modify their own scenarios
- **Unique Tokens**: Share tokens are cryptographically random
- **Input Validation**: Scenario names and descriptions are validated
- **SQL Injection Prevention**: Parameterized queries prevent injection

## Troubleshooting

### Common Issues

#### Scenario Not Appearing
- **Check Model Type**: Scenarios are filtered by model type
- **Verify Creation**: Ensure scenario was saved successfully
- **Refresh Page**: Reload page to fetch latest scenarios

#### Cannot Create Scenario
- **Check Login**: Must be logged in as teacher
- **Unique Name**: Scenario name must be unique in your library
- **Required Fields**: Scenario name is required

#### Share Link Not Working
- **Check URL**: Ensure full URL is copied including token
- **Verify Token**: Share token must be valid
- **Check Permissions**: Scenario must exist in database

#### Usage Count Not Updating
- **Database Connection**: Ensure database connection is active
- **RLS Policies**: Verify RLS policies allow updates
- **Async Operation**: Usage count updates asynchronously

## Future Enhancements

### Potential Features
- **Scenario Templates**: Pre-defined templates for common problems
- **Scenario Duplication**: Clone existing scenarios for variations
- **Scenario Versioning**: Track changes to scenarios over time
- **Scenario Categories**: Organize scenarios by concept or difficulty
- **Scenario Ratings**: Students rate scenario effectiveness
- **Scenario Comments**: Students add comments on scenarios
- **Bulk Sharing**: Share multiple scenarios at once
- **Scenario Analytics**: Detailed analytics on scenario usage
- **Scenario Recommendations**: Suggest scenarios based on student performance
- **Collaborative Scenarios**: Teachers collaborate on scenario creation

### Integration Opportunities
- **Learning Management Systems**: Direct integration with LMS
- **Student Dashboard**: Show assigned scenarios in student dashboard
- **Teacher Dashboard**: Scenario usage metrics in teacher dashboard
- **Reports**: Include scenario usage in automated reports
- **Badges**: Award badges for completing scenario assignments

## Related Documentation
- [Debugging Sandbox](./DEBUGGING_SANDBOX.md) - Main debugging sandbox documentation
- [Configuration Save/Share](./CONFIGURATION_SAVE_SHARE.md) - Configuration management
- [Pre-loaded Failure Scenarios](./DEBUGGING_SANDBOX.md#pre-loaded-failure-scenarios) - Built-in scenarios
- [Teacher Resources](./TEACHER_RESOURCES.md) - Lesson plans and teaching materials
