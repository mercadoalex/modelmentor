# Scenario History Panel

## Overview
The Scenario History Panel is a session-based tracking feature in the Debugging Sandbox that records every failure scenario a student explores during their current session. It provides a visual timeline of experimentation, displays timestamps for each scenario, and allows students to quickly re-apply previously tried configurations without manually adjusting hyperparameters again.

## Purpose
- **Track Experimentation Journey**: Record all scenarios explored during the session
- **Visual Timeline**: Show chronological order of scenario exploration
- **Quick Re-application**: Re-apply previous configurations with one click
- **Learning Reflection**: Help students review their experimentation process
- **Time-Stamped Records**: Track when each scenario was explored

## Key Features

### Session-Based Tracking
- **Automatic Recording**: Every scenario click is automatically added to history
- **Session Scope**: History persists only during current browser session
- **No Database Storage**: History is stored in component state, not persisted
- **Fresh Start**: History clears when page is refreshed or closed
- **Privacy**: No permanent record of student experimentation

### Visual Timeline
- **Chronological Order**: Most recent scenarios appear at top
- **Timeline Dots**: Visual dots connected by lines show progression
- **Color-Coded Badges**: Pre-loaded scenarios (blue) vs Custom scenarios (gray)
- **Timestamp Display**: Absolute time (HH:MM:SS) and relative time (Xs ago)
- **Configuration Summary**: Each history item shows all hyperparameter values

### Scenario Types Tracked
- **Pre-loaded Scenarios**:
  - No Normalization
  - Learning Rate Too High
  - Tiny Batch Size
  - Insufficient Epochs
- **Custom Scenarios**:
  - Teacher-created custom failure scenarios
  - Loaded from Custom Scenario Library

### Quick Re-application
- **One-Click Re-apply**: Click "Re-apply" button to restore configuration
- **Automatic Retraining**: Model automatically retrains after re-applying
- **No Manual Entry**: No need to remember or manually enter hyperparameters
- **Instant Comparison**: Quickly compare different scenarios

### History Management
- **Clear History**: Remove all history items with one click
- **Confirmation Toast**: Success notification when history is cleared
- **Empty State**: Helpful message when no scenarios have been explored yet

## User Interface

### Panel Location
- **Position**: Right column of debugging sandbox, below Comparison View card
- **Visibility**: Always visible, shows empty state when no history
- **Responsive**: Adapts to different screen sizes

### Panel Header
- **Title**: "Scenario History" with history icon
- **Description**: "Track your experimentation journey"
- **Clear Button**: Trash icon button to clear all history (only visible when history exists)

### Empty State
- **Icon**: Large history icon (semi-transparent)
- **Primary Message**: "No scenarios explored yet"
- **Secondary Message**: "Click a failure scenario button to start tracking"
- **Purpose**: Guide students to start experimenting

### History Timeline
- **Scrollable Area**: Fixed height (400px) with vertical scrolling
- **Timeline Structure**:
  - Vertical line connecting all history items
  - Circular dots at each timeline point
  - Primary color for dots and connecting line
  - Last item has no connecting line below it

### History Item Card
Each history item displays:

**Header Section**:
- **Scenario Name**: Bold, truncated if too long
- **Type Badge**: "Pre-loaded" (blue) or "Custom" (gray)
- **Timestamp**: Absolute time (e.g., "02:45:30 PM")
- **Relative Time**: Time since exploration (e.g., "5m ago", "2h ago")
- **Re-apply Button**: Outline button with rotate icon

**Configuration Section**:
- **Grid Layout**: 2x2 grid showing all hyperparameters
- **Muted Background**: Subtle background color for visual separation
- **Abbreviated Labels**: LR (Learning Rate), Norm (Normalization), Batch, Epochs
- **Monospace Values**: Configuration values in monospace font
- **Compact Display**: Fits all details in small space

### Relative Time Display
- **Under 1 minute**: Shows seconds (e.g., "30s ago")
- **1-59 minutes**: Shows minutes (e.g., "15m ago")
- **1+ hours**: Shows hours (e.g., "2h ago")
- **Real-time Updates**: Time updates as user views history

## Workflow Examples

### Example 1: Student Explores Multiple Scenarios
**Scenario**: Student systematically tests different failure modes

**Steps**:
1. Student opens debugging sandbox
2. Scenario History Panel shows empty state
3. Student clicks "Learning Rate Too High" button
4. Scenario applies, model retrains
5. History panel shows first item:
   - "Learning Rate Too High" (Pre-loaded badge)
   - Timestamp: "02:30:15 PM" / "0s ago"
   - Configuration: LR: 0.8000, Norm: On, Batch: 32, Epochs: 50
6. Student observes diverging loss curve
7. Student clicks "No Normalization" button
8. Scenario applies, model retrains
9. History panel now shows two items:
   - "No Normalization" (Pre-loaded badge) - at top
   - "Learning Rate Too High" (Pre-loaded badge) - below
10. Student continues exploring scenarios
11. History grows chronologically from top to bottom

**Learning Outcome**: Student can see their experimentation path and reflect on different failure modes

### Example 2: Student Re-applies Previous Configuration
**Scenario**: Student wants to compare current results with earlier experiment

**Steps**:
1. Student has explored 5 different scenarios
2. History panel shows all 5 scenarios in timeline
3. Student currently has "Tiny Batch Size" applied
4. Student wants to compare with "Learning Rate Too High" from earlier
5. Student scrolls history to find "Learning Rate Too High" item
6. Student clicks "Re-apply" button on that history item
7. Configuration instantly changes:
   - Learning Rate: 0.8
   - Normalization: On
   - Batch Size: 32
   - Epochs: 50
8. Model automatically retrains with re-applied configuration
9. Toast notification: "Re-applied 'Learning Rate Too High' from history"
10. Student compares new training curves with previous results
11. Student can quickly switch between any previous configurations

**Learning Outcome**: Student efficiently compares different scenarios without manual re-entry

### Example 3: Student Uses Custom Scenarios
**Scenario**: Teacher created custom scenarios, student explores them

**Steps**:
1. Teacher created "Moderate Overfitting" custom scenario
2. Student opens debugging sandbox
3. Student clicks "Moderate Overfitting" in Custom Scenarios section
4. Scenario applies, model retrains
5. History panel shows:
   - "Moderate Overfitting" (Custom badge)
   - Timestamp and relative time
   - Configuration details
6. Student explores pre-loaded scenarios
7. History shows mix of Pre-loaded and Custom badges
8. Student can distinguish between teacher-created and built-in scenarios
9. Student re-applies custom scenario from history
10. Custom scenario configuration restored instantly

**Learning Outcome**: Student understands both built-in and teacher-created failure modes

### Example 4: Student Clears History
**Scenario**: Student wants to start fresh experimentation

**Steps**:
1. Student has explored 10 scenarios
2. History panel is full of items
3. Student wants to start a new focused experiment
4. Student clicks "Clear" button in panel header
5. Confirmation toast: "Scenario history cleared"
6. History panel shows empty state again
7. Student begins new experimentation session
8. New history starts building from scratch

**Learning Outcome**: Student can organize experimentation into focused sessions

### Example 5: Student Reviews Experimentation Timeline
**Scenario**: Student reflects on learning process before submitting assignment

**Steps**:
1. Student has completed assignment exploring failure modes
2. Student scrolls through Scenario History Panel
3. Student sees complete timeline of exploration:
   - Started with "No Normalization" (10m ago)
   - Tried "Learning Rate Too High" (8m ago)
   - Explored "Tiny Batch Size" (6m ago)
   - Tested "Insufficient Epochs" (4m ago)
   - Re-applied "Learning Rate Too High" (2m ago)
4. Student uses timeline to write reflection:
   - "I first explored normalization effects..."
   - "Then I tested learning rate impact..."
   - "I went back to high learning rate to confirm..."
5. Student includes timeline insights in assignment submission

**Learning Outcome**: Student develops metacognitive awareness of learning process

## Technical Implementation

### Data Structure
```typescript
interface ScenarioHistoryItem {
  id: string;                    // Unique identifier (timestamp + random)
  timestamp: Date;               // When scenario was applied
  scenarioName: string;          // Display name of scenario
  scenarioType: 'pre-loaded' | 'custom';  // Type of scenario
  configuration: {
    learningRate: number;        // Learning rate value
    normalization: boolean;      // Normalization enabled/disabled
    batchSize: string;           // Batch size value
    epochs: string;              // Number of epochs
  };
}
```

### State Management
- **State Variable**: `scenarioHistory` - array of ScenarioHistoryItem
- **State Hook**: `useState<ScenarioHistoryItem[]>([])` in DebuggingSandboxPage
- **Update Method**: `setScenarioHistory((prev) => [newItem, ...prev])` - prepend new items
- **Clear Method**: `setScenarioHistory([])` - reset to empty array

### History Recording
**When Scenarios Are Added**:
- Pre-loaded scenario button clicked (No Normalization, High Learning Rate, etc.)
- Custom scenario button clicked from Custom Scenarios section
- Configuration loaded from Saved Configurations Library
- Assignment loaded from My Assignments

**What Gets Recorded**:
- Scenario name (display name)
- Scenario type (pre-loaded or custom)
- Complete configuration (all 4 hyperparameters)
- Exact timestamp of application
- Unique ID for React key

**Recording Function**:
```typescript
const addToHistory = (
  scenarioName: string,
  scenarioType: 'pre-loaded' | 'custom',
  config: {
    learningRate: number;
    normalization: boolean;
    batchSize: string;
    epochs: string;
  }
) => {
  const historyItem: ScenarioHistoryItem = {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    scenarioName,
    scenarioType,
    configuration: config,
  };

  setScenarioHistory((prev) => [historyItem, ...prev]);
};
```

### Re-application Logic
**Re-apply Handler**:
```typescript
const handleReapplyFromHistory = (item: ScenarioHistoryItem) => {
  // Apply all configuration values
  setLearningRate(item.configuration.learningRate);
  setNormalization(item.configuration.normalization);
  setBatchSize(item.configuration.batchSize);
  setEpochs(item.configuration.epochs);
  
  // Show success notification
  toast.success(`Re-applied "${item.scenarioName}" from history`);
  
  // Automatically trigger retraining
  setTimeout(() => {
    handleRetrain();
  }, 500);
};
```

**Key Behaviors**:
- All hyperparameters restored exactly as recorded
- Success toast notification shows scenario name
- Model automatically retrains after 500ms delay
- No new history item added (re-applying doesn't create duplicate)

### Clear History Logic
**Clear Handler**:
```typescript
const handleClearHistory = () => {
  setScenarioHistory([]);
  toast.success('Scenario history cleared');
};
```

**Key Behaviors**:
- Empties history array completely
- Success toast notification confirms action
- Panel shows empty state immediately
- No confirmation dialog (action is easily reversible by exploring scenarios again)

### Component Integration
**ScenarioHistoryPanel Component**:
- Receives `history` prop (array of history items)
- Receives `onReapply` prop (callback for re-applying scenario)
- Receives `onClear` prop (callback for clearing history)
- Renders timeline visualization
- Handles time formatting (absolute and relative)
- Manages scrollable area for long histories

**DebuggingSandboxPage Integration**:
- Imports ScenarioHistoryPanel component
- Maintains scenarioHistory state
- Passes history, onReapply, onClear props
- Positioned in right column below Comparison View
- Always visible (not conditional)

### Time Formatting
**Absolute Time**:
```typescript
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
```

**Relative Time**:
```typescript
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffMins === 0) {
    return `${diffSecs}s ago`;
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  }
};
```

### Styling and Design
**Minimal Aesthetic**:
- Ample whitespace between history items
- Clean timeline with subtle connecting lines
- Muted background for configuration details
- Clear typography hierarchy (scenario name > timestamp > configuration)
- No shadows or heavy decorations
- Gentle contrast for comfortable reading

**Timeline Visualization**:
- 2px vertical line connecting items
- 24px circular dots at each point
- Primary color for active elements
- Border color for connecting lines
- Last item has no line below it

**Responsive Design**:
- Fixed height with scrolling for long histories
- Flexible layout adapts to container width
- Buttons and badges wrap appropriately
- Text truncates to prevent overflow

## Best Practices

### For Students

#### Using History Effectively
- **Review Before Submitting**: Check history before completing assignments
- **Compare Systematically**: Use re-apply to compare scenarios side-by-side
- **Track Learning Path**: Use timeline to understand your learning progression
- **Clear When Needed**: Start fresh for focused experiments
- **Reflect on Patterns**: Notice which scenarios you explore most

#### Experimentation Strategy
- **Explore Methodically**: Try scenarios in logical order
- **Document Observations**: Take notes as you explore
- **Use Re-apply**: Don't manually re-enter configurations
- **Review Timeline**: Reflect on experimentation journey
- **Learn from History**: Identify patterns in your exploration

### For Teachers

#### Teaching with History
- **Encourage Reflection**: Ask students to review their history
- **Discussion Prompts**: "What pattern do you see in your exploration?"
- **Assignment Requirements**: "Include timeline of scenarios explored"
- **Metacognition**: Help students understand their learning process
- **Systematic Exploration**: Guide students to explore methodically

#### Lesson Integration
- **Guided Exploration**: Provide sequence of scenarios to explore
- **Comparison Exercises**: "Re-apply and compare these two scenarios"
- **Timeline Analysis**: "What does your history tell you about learning?"
- **Reflection Questions**: "Why did you explore scenarios in this order?"
- **Learning Strategies**: Teach systematic experimentation

## Limitations and Considerations

### Session-Based Only
- **No Persistence**: History clears on page refresh
- **No Cross-Session**: Cannot view history from previous sessions
- **No Database**: History not stored permanently
- **Privacy Trade-off**: No permanent record, but also no long-term tracking

### Memory Considerations
- **Unlimited Growth**: History grows indefinitely during session
- **Memory Usage**: Long sessions with many scenarios may use more memory
- **Performance**: Very long histories (100+ items) may slow scrolling
- **Recommendation**: Clear history periodically during long sessions

### Re-application Behavior
- **No Duplicate Prevention**: Re-applying doesn't add to history
- **Automatic Retraining**: Always triggers retraining (cannot disable)
- **No Undo**: Cannot undo re-application (but can re-apply another item)

## Future Enhancements

### Potential Features
- **Session Persistence**: Save history to localStorage for page refresh survival
- **Export History**: Export timeline as JSON or CSV for analysis
- **History Search**: Search history by scenario name or configuration
- **History Filtering**: Filter by scenario type (pre-loaded vs custom)
- **History Comparison**: Select multiple history items to compare
- **History Notes**: Add notes to history items for reflection
- **History Sharing**: Share experimentation timeline with teacher
- **History Analytics**: Show statistics (most explored scenario, average time between explorations)
- **History Visualization**: Graph showing exploration patterns
- **History Replay**: Automatically replay entire experimentation sequence

### Integration Opportunities
- **Assignment Submission**: Include history timeline in assignment submissions
- **Teacher Dashboard**: Teachers view student exploration patterns
- **Learning Analytics**: Analyze common exploration paths across students
- **Adaptive Learning**: Suggest next scenarios based on history
- **Peer Comparison**: Compare exploration patterns with classmates

## Related Documentation
- [Debugging Sandbox](./DEBUGGING_SANDBOX.md) - Main debugging sandbox documentation
- [Custom Failure Scenarios](./CUSTOM_FAILURE_SCENARIOS.md) - Custom scenario creation
- [Configuration Save/Share](./CONFIGURATION_SAVE_SHARE.md) - Configuration management
- [Assignment Mode](./ASSIGNMENT_MODE.md) - Assignment features
- [Teacher Resources](./TEACHER_RESOURCES.md) - Teaching materials

## Troubleshooting

### History Not Recording
**Problem**: Clicking scenarios doesn't add to history

**Solutions**:
- Check that ScenarioHistoryPanel is rendered in page
- Verify addToHistory function is called in applyFailureScenario
- Check browser console for JavaScript errors
- Ensure scenarioHistory state is initialized

### Re-apply Not Working
**Problem**: Clicking re-apply button doesn't restore configuration

**Solutions**:
- Check that handleReapplyFromHistory is passed as prop
- Verify configuration values are valid
- Check that retraining is not disabled
- Ensure handleRetrain function is working

### Timeline Not Displaying
**Problem**: History items exist but timeline doesn't show

**Solutions**:
- Check ScrollArea component is rendering
- Verify history array has items
- Check CSS for timeline elements
- Ensure timeline dots and lines have proper styling

### Relative Time Not Updating
**Problem**: "Xs ago" time doesn't update

**Solutions**:
- Relative time is calculated on render, not real-time
- Re-opening panel or scrolling may trigger re-render
- Consider adding interval for real-time updates (future enhancement)
- Current behavior is intentional for performance

### Clear Button Not Visible
**Problem**: Cannot find clear history button

**Solutions**:
- Clear button only visible when history has items
- Check that history.length > 0
- Button is in panel header, top-right corner
- Look for trash icon button
