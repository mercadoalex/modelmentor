# Configuration Save and Share Feature

## Overview
The Debugging Sandbox now includes comprehensive save and share functionality, allowing students to bookmark interesting failure modes, teachers to create assignments with specific configurations, and students to share their discoveries with classmates for discussion and collaborative learning.

## Features

### 1. Save Configuration
Students can save their current hyperparameter configuration for future reference.

#### How to Save
1. Adjust hyperparameters in the debugging sandbox (learning rate, normalization, batch size, epochs)
2. Click "Save Configuration" button
3. Enter a descriptive name (required)
4. Optionally add a description explaining what the configuration demonstrates
5. Review the current settings summary
6. Click "Save Configuration" to store

#### What Gets Saved
- Configuration name
- Configuration description (optional)
- Learning rate value
- Normalization setting (enabled/disabled)
- Batch size
- Number of epochs
- Failure mode (automatically detected)
- Model type
- Creator user ID
- Creation timestamp

#### Use Cases
- **Bookmark Interesting Failures**: Save configurations that produce interesting failure modes for later analysis
- **Document Learning**: Create a personal library of configurations demonstrating different ML concepts
- **Prepare for Discussions**: Save configurations to share with classmates or teachers
- **Track Experiments**: Keep a record of different hyperparameter combinations tested

### 2. My Configurations Library
Access and manage all saved configurations in one place.

#### How to Access
1. Click "My Configurations" button in the debugging sandbox
2. Browse all saved configurations
3. Use search to find specific configurations by name or description
4. Sort by creation date or name

#### Configuration Cards
Each saved configuration displays:
- **Name**: Descriptive title
- **Description**: Optional explanation
- **Creation Date**: When the configuration was saved
- **Settings Summary**: Quick view of all hyperparameters
  - Learning rate
  - Normalization (On/Off)
  - Batch size
  - Epochs

#### Actions Available
- **Load**: Apply the configuration to current sandbox
- **Share**: Generate a shareable link
- **Delete**: Remove from library

#### Search and Filter
- **Search**: Find configurations by name or description
- **Real-time Results**: Search updates as you type
- **Empty State**: Helpful message when no configurations exist

### 3. Load Configuration
Apply a saved configuration to the current debugging sandbox.

#### How to Load
1. Open "My Configurations" library
2. Find the configuration you want to load
3. Click "Load" button
4. Configuration is applied immediately
5. Library closes automatically
6. Success message confirms loading

#### What Happens When Loading
- All hyperparameter values are replaced with saved values
- Learning rate slider updates
- Normalization toggle updates
- Batch size selector updates
- Epochs selector updates
- Any previous retraining results are cleared
- Training curves are reset
- Ready to retrain with loaded configuration

#### Use Cases
- **Reproduce Results**: Load a configuration to see the same failure mode again
- **Compare Configurations**: Load different configurations to compare their effects
- **Continue Experiments**: Resume work on a previously saved configuration
- **Analyze Shared Configurations**: Load configurations shared by classmates or teachers

### 4. Share Configuration
Generate a unique shareable link for any saved configuration.

#### How to Share
1. Open "My Configurations" library
2. Find the configuration to share
3. Click "Share" button
4. Share dialog opens with unique link
5. Copy link to clipboard
6. Share via email, messaging, or LMS

#### Share Dialog Contents
- **Configuration Details**: Name and description
- **Shareable Link**: Unique URL that never expires
- **Copy Button**: One-click copy to clipboard with visual confirmation
- **QR Code**: Scannable code for mobile devices

#### Share Link Features
- **Unique Token**: Each configuration gets a unique share token
- **Permanent**: Links don't expire
- **Read-Only**: Recipients can view and load but not modify original
- **Accessible**: Anyone with the link can access (no login required for viewing)

#### Use Cases
- **Classroom Discussion**: Share interesting failure modes with classmates
- **Ask for Help**: Share problematic configurations with teachers
- **Collaborative Learning**: Exchange configurations with study groups
- **Demonstrate Concepts**: Teachers share example configurations with students

### 5. QR Code Sharing
Every shared configuration includes a QR code for easy mobile access.

#### Features
- **Automatic Generation**: QR code created when share dialog opens
- **Mobile-Friendly**: Scan with phone camera to open link
- **High Contrast**: Clear black and white for reliable scanning
- **Proper Size**: 200x200 pixels for optimal scanning distance

#### Use Cases
- **In-Class Sharing**: Display QR code on projector for students to scan
- **Printed Materials**: Include QR codes in handouts or worksheets
- **Quick Access**: Scan from one device to open on another
- **Offline Sharing**: Share without typing long URLs

## Database Schema

### sandbox_configurations Table
Stores all saved configurations.

```sql
CREATE TABLE sandbox_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  model_type text NOT NULL,
  learning_rate numeric NOT NULL,
  normalization boolean NOT NULL,
  batch_size integer NOT NULL,
  epochs integer NOT NULL,
  failure_mode text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Indexes**:
- `idx_sandbox_configurations_user_id`: Fast lookup by user
- `idx_sandbox_configurations_created_at`: Sorted by creation date

### shared_configurations Table
Tracks shared configuration links.

```sql
CREATE TABLE shared_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES sandbox_configurations(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_assignment boolean NOT NULL DEFAULT false,
  assignment_instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Indexes**:
- `idx_shared_configurations_token`: Fast lookup by share token
- `idx_shared_configurations_config_id`: Fast lookup by configuration

## Security and Privacy

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies.

#### sandbox_configurations Policies
- **View**: Users can only view their own configurations
- **Insert**: Users can only create configurations for themselves
- **Update**: Users can only update their own configurations
- **Delete**: Users can only delete their own configurations

#### shared_configurations Policies
- **View**: Anyone (authenticated) can view shared configurations
- **Insert**: Only configuration owners can create shares
- **Update**: Only configuration owners can update shares
- **Delete**: Only configuration owners can delete shares

### Data Ownership
- Each configuration is tied to the creator's user ID
- Only the creator can modify or delete their configurations
- Shared links are read-only for recipients
- Deleting a configuration cascades to its shares

### Authentication Requirements
- **Save Configuration**: Must be logged in
- **View Own Configurations**: Must be logged in
- **Load Configuration**: Must be logged in
- **Share Configuration**: Must be logged in and own the configuration
- **Access Shared Link**: No login required (future feature)

## User Interface

### Save Configuration Dialog
**Components**:
- Modal dialog overlay
- Configuration name input (required, max 100 characters)
- Description textarea (optional, max 500 characters)
- Current settings summary (read-only display)
- Save and Cancel buttons

**Validation**:
- Name cannot be empty
- Name trimmed of whitespace
- Description trimmed of whitespace
- Duplicate names allowed (distinguished by timestamp)

**User Feedback**:
- Loading state during save
- Success toast notification
- Error toast if save fails
- Dialog closes on successful save

### Saved Configurations Library
**Components**:
- Modal dialog with scrollable content
- Search input with icon
- Configuration cards in grid layout
- Empty state message
- Close button

**Configuration Card Layout**:
- Header: Name and creation date
- Description (if provided)
- Settings grid: 2x2 layout showing all hyperparameters
- Action buttons: Load, Share, Delete

**Interactions**:
- Search filters in real-time
- Load closes dialog and applies configuration
- Share opens share dialog
- Delete shows confirmation (future enhancement)
- Scroll for many configurations

### Share Configuration Dialog
**Components**:
- Modal dialog overlay
- Configuration details display
- Shareable link input (read-only)
- Copy button with icon
- QR code display
- Close and Copy Link buttons

**User Feedback**:
- Copy button changes to checkmark when clicked
- Success toast on copy
- Error toast if copy fails
- Loading state while generating link

### Debugging Sandbox Integration
**New Buttons**:
- "Save Configuration" button (outline variant)
- "My Configurations" button (outline variant)
- Both buttons in a row below Retrain/Reset buttons
- Separated by border-top for visual grouping
- Disabled during retraining

**Button Icons**:
- Save: Floppy disk icon
- My Configurations: Folder icon
- Share: Share icon

## Technical Implementation

### Component Architecture
```
DebuggingSandboxPage
├── SaveConfigurationDialog
├── SavedConfigurationsLibrary
└── ShareConfigurationDialog
```

### State Management
**DebuggingSandboxPage State**:
- `showSaveDialog`: Boolean for save dialog visibility
- `showLibrary`: Boolean for library dialog visibility
- `showShareDialog`: Boolean for share dialog visibility
- `configToShare`: Configuration object to share

**Dialog State**:
- Each dialog manages its own internal state
- Dialogs receive callbacks for actions
- Parent component controls dialog visibility

### Data Flow
1. **Save Flow**:
   - User clicks "Save Configuration"
   - Dialog opens with current hyperparameter values
   - User enters name and description
   - Dialog calls Supabase to insert configuration
   - Success toast and dialog closes
   - Optional callback to refresh library

2. **Load Flow**:
   - User clicks "My Configurations"
   - Library fetches configurations from Supabase
   - User clicks "Load" on a configuration
   - Parent component receives configuration object
   - Parent updates all hyperparameter states
   - Library closes
   - Success toast confirms loading

3. **Share Flow**:
   - User clicks "Share" on a configuration
   - Share dialog opens
   - Dialog checks for existing share or creates new one
   - Unique share token generated
   - Share link constructed with token
   - QR code generated from link
   - User copies link to clipboard

### Supabase Integration
**Client Initialization**:
```typescript
import { supabase } from '@/db/supabase';
```

**Insert Configuration**:
```typescript
const { error } = await supabase
  .from('sandbox_configurations')
  .insert({
    user_id: user.id,
    name: name.trim(),
    description: description.trim() || null,
    model_type: 'image_classification',
    learning_rate: configuration.learningRate,
    normalization: configuration.normalization,
    batch_size: parseInt(configuration.batchSize),
    epochs: parseInt(configuration.epochs),
    failure_mode: configuration.failureMode
  });
```

**Fetch Configurations**:
```typescript
const { data, error } = await supabase
  .from('sandbox_configurations')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

**Create Share**:
```typescript
const { data, error } = await supabase
  .from('shared_configurations')
  .insert({
    configuration_id: configuration.id,
    is_assignment: false
  })
  .select('share_token')
  .single();
```

### Error Handling
**Common Errors**:
- User not authenticated
- Database connection failure
- Invalid configuration data
- Duplicate share token (extremely rare)
- Clipboard access denied

**Error Handling Strategy**:
- Try-catch blocks around all async operations
- User-friendly error messages via toast
- Console logging for debugging
- Graceful degradation (e.g., show link if clipboard fails)

## Educational Value

### For Students
- **Personal Library**: Build a collection of configurations demonstrating different concepts
- **Experimentation**: Save configurations before and after modifications to compare
- **Collaboration**: Share discoveries with peers for discussion
- **Documentation**: Use descriptions to document learning insights
- **Reproducibility**: Load configurations to reproduce results exactly

### For Teachers
- **Assignment Creation**: Save specific configurations for students to analyze
- **Demonstration**: Share example configurations during lectures
- **Assessment**: Create configuration-based assignments with specific failure modes
- **Differentiation**: Provide different configurations for different skill levels
- **Discussion Prompts**: Share configurations as starting points for class discussions

### Learning Outcomes
Students will:
1. Develop systematic approach to hyperparameter experimentation
2. Learn to document and organize ML experiments
3. Practice collaborative learning through configuration sharing
4. Build intuition for hyperparameter effects through repeated loading
5. Understand importance of reproducibility in ML research

## Usage Examples

### Example 1: Student Discovers Interesting Failure
```
1. Student adjusts learning rate to 0.8
2. Retrains and observes divergence
3. Clicks "Save Configuration"
4. Names it "Gradient Explosion Example"
5. Describes: "Learning rate too high causes loss to explode"
6. Saves configuration
7. Shares link with study group
8. Group members load and discuss
```

### Example 2: Teacher Creates Assignment
```
1. Teacher creates configuration with disabled normalization
2. Names it "Assignment 3: Normalization Impact"
3. Describes: "Analyze why this configuration performs poorly"
4. Saves configuration
5. Clicks "Share"
6. Copies link
7. Posts link in LMS
8. Students load configuration and analyze
9. Teacher reviews student insights
```

### Example 3: Student Compares Configurations
```
1. Student saves "High Learning Rate" configuration
2. Student saves "Low Learning Rate" configuration
3. Opens "My Configurations"
4. Loads "High Learning Rate"
5. Retrains and observes results
6. Loads "Low Learning Rate"
7. Retrains and compares curves
8. Documents differences in notebook
```

## Best Practices

### Naming Conventions
- **Be Descriptive**: Use names that explain what the configuration demonstrates
- **Include Key Parameters**: Mention the main hyperparameter being tested
- **Use Consistent Format**: Establish a naming pattern for your library
- **Examples**:
  - ✅ "High LR (0.8) - Divergence"
  - ✅ "No Normalization - Poor Convergence"
  - ✅ "Tiny Batch (1) - Erratic Training"
  - ❌ "Config 1"
  - ❌ "Test"

### Description Guidelines
- **Explain the Purpose**: Why did you save this configuration?
- **Document Observations**: What failure mode or pattern did you observe?
- **Note Insights**: What did you learn from this configuration?
- **Include Context**: When or why might this configuration occur in real projects?

### Library Organization
- **Regular Cleanup**: Delete configurations you no longer need
- **Categorize**: Use naming prefixes to group related configurations
- **Document**: Add descriptions to all important configurations
- **Review**: Periodically review and update descriptions with new insights

### Sharing Etiquette
- **Provide Context**: When sharing, explain what the configuration demonstrates
- **Ask Questions**: Use shared configurations as discussion starters
- **Give Credit**: Acknowledge when you load someone else's configuration
- **Be Helpful**: Share configurations that helped you understand concepts

## Troubleshooting

### Configuration Won't Save
**Symptoms**: Error message when clicking Save

**Possible Causes**:
- Not logged in
- Database connection issue
- Invalid hyperparameter values

**Solutions**:
- Verify you're logged in
- Check internet connection
- Try again in a few moments
- Contact support if persists

### Library Shows No Configurations
**Symptoms**: Empty state message despite having saved configurations

**Possible Causes**:
- Not logged in
- Viewing from different account
- Database query error

**Solutions**:
- Verify you're logged in to correct account
- Refresh the page
- Try closing and reopening library
- Check browser console for errors

### Share Link Doesn't Work
**Symptoms**: Recipients can't access shared configuration

**Possible Causes**:
- Link copied incorrectly
- Configuration was deleted
- Database issue

**Solutions**:
- Copy link again carefully
- Verify configuration still exists in your library
- Try generating new share link
- Send QR code as alternative

### Can't Copy Link to Clipboard
**Symptoms**: Copy button doesn't work

**Possible Causes**:
- Browser doesn't support clipboard API
- Clipboard permission denied
- Browser security settings

**Solutions**:
- Manually select and copy link from input field
- Try different browser
- Check browser permissions
- Use QR code instead

## Future Enhancements

### Planned Features
- **Configuration Tags**: Add tags for better organization
- **Favorites**: Mark frequently used configurations as favorites
- **Duplicate**: Create a copy of existing configuration with modifications
- **Export/Import**: Download configurations as JSON files
- **Assignment Mode**: Teachers can mark configurations as assignments
- **Assignment Instructions**: Add specific instructions for student analysis
- **View Shared By Others**: Browse configurations shared by classmates
- **Configuration Comments**: Add notes to configurations over time
- **Version History**: Track changes to configurations
- **Bulk Operations**: Select multiple configurations for batch actions

### Considerations
- Balance features with simplicity
- Maintain fast performance with many configurations
- Ensure mobile responsiveness
- Preserve educational focus
- Gather user feedback for prioritization

## Summary
The Configuration Save and Share feature transforms the Debugging Sandbox from a single-session experimentation tool into a collaborative learning platform. Students can build personal libraries of configurations, share discoveries with peers, and learn from each other's experiments. Teachers can create targeted assignments and demonstrations. The feature emphasizes reproducibility, documentation, and collaborative learning while maintaining a simple, intuitive interface that doesn't distract from the core educational goals.
