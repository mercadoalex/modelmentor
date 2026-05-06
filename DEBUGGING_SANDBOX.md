# Debugging Sandbox

## Overview
The Debugging Sandbox is an educational tool that allows students to intentionally misconfigure machine learning models and observe failure modes in real-time. By experimenting with problematic hyperparameter settings, students learn what causes common training failures and how to fix them.

## Purpose
- **Learn by Breaking**: Students understand ML concepts better by seeing what goes wrong
- **Safe Experimentation**: Risk-free environment to test extreme configurations
- **Immediate Feedback**: Real-time visualization of failure modes
- **Educational Explanations**: Clear descriptions of why failures occur and how to fix them
- **Practical Skills**: Develop debugging intuition for real-world ML projects
- **Quick Demonstrations**: Pre-loaded failure scenarios for instant classroom demonstrations

## Access
The Debugging Sandbox is accessible after completing model training:
- Optional step in the ML workflow
- Can be skipped to proceed directly to testing
- Accessible from the Training page after successful training completion

## Features

### Pre-loaded Failure Scenarios
Quick-access buttons that instantly apply common problematic configurations for demonstrations and guided learning.

#### 1. No Normalization
- **Icon**: Layers
- **Configuration**: Disables data normalization, keeps other parameters optimal
- **Settings Applied**:
  - Normalization: Disabled
  - Learning Rate: 0.001 (optimal)
  - Batch Size: 32 (optimal)
  - Epochs: 50 (optimal)
- **Observed Failure**: Poor convergence, slow learning, unstable training
- **Use Case**: Demonstrate importance of feature scaling
- **Classroom Demo**: Show how unnormalized data causes training instability

#### 2. Learning Rate Too High
- **Icon**: Trending Up
- **Configuration**: Sets learning rate to 0.8, keeps other parameters optimal
- **Settings Applied**:
  - Learning Rate: 0.8 (too high)
  - Normalization: Enabled (optimal)
  - Batch Size: 32 (optimal)
  - Epochs: 50 (optimal)
- **Observed Failure**: Gradient explosion, diverging loss, model fails to converge
- **Use Case**: Demonstrate gradient explosion and divergence
- **Classroom Demo**: Show dramatic loss curve divergence in real-time

#### 3. Tiny Batch Size
- **Icon**: Zap
- **Configuration**: Sets batch size to 1, keeps other parameters optimal
- **Settings Applied**:
  - Batch Size: 1 (too small)
  - Learning Rate: 0.001 (optimal)
  - Normalization: Enabled (optimal)
  - Epochs: 50 (optimal)
- **Observed Failure**: Erratic training, noisy loss curves, unstable gradients
- **Use Case**: Demonstrate effect of batch size on training stability
- **Classroom Demo**: Show noisy, oscillating training curves

#### 4. Insufficient Epochs
- **Icon**: Clock
- **Configuration**: Sets epochs to 5, keeps other parameters optimal
- **Settings Applied**:
  - Epochs: 5 (too few)
  - Learning Rate: 0.001 (optimal)
  - Normalization: Enabled (optimal)
  - Batch Size: 32 (optimal)
- **Observed Failure**: Underfitting, poor final accuracy, incomplete learning
- **Use Case**: Demonstrate underfitting due to insufficient training time
- **Classroom Demo**: Show model stopping before reaching good performance

#### How to Use Failure Scenario Buttons
1. **Hover over any button** to see detailed tooltip with:
   - Exact hyperparameter values that will be applied
   - Expected failure mode description
   - Estimated training time
2. Click any failure scenario button
3. Configuration is instantly applied to all hyperparameters
4. Model automatically retrains with the problematic configuration
5. Observe failure mode in real-time training curves
6. Compare broken model performance with original well-trained model
7. Read educational explanation of the failure mode
8. Click "Reset" to restore optimal configuration
9. Try another scenario or manually adjust parameters

#### Tooltip Information
Each failure scenario button displays a detailed tooltip on hover containing:

**Configuration Details Section**:
- Learning Rate: Exact value (e.g., 0.001, 0.8)
- Normalization: Enabled or Disabled status
- Batch Size: Exact value (e.g., 1, 32)
- Epochs: Exact value (e.g., 5, 50)
- **Bold values** indicate the problematic parameter

**Expected Outcome Section**:
- Expected Failure: Description of what will go wrong
- Training Time: Estimated duration in seconds

**Tooltip Features**:
- **Smooth Animation**: Fade-in effect with 300ms delay
- **Proper Positioning**: Appears above button to avoid overlap
- **Minimal Design**: Clean typography, ample whitespace, subtle borders
- **Readable Layout**: Two-column format for parameter details
- **Clear Hierarchy**: Sections separated by subtle border

#### Benefits of Pre-loaded Scenarios
- **Instant Demonstrations**: No manual configuration needed
- **Detailed Preview**: Hover tooltips show exact configuration before clicking
- **Consistent Results**: Same failure mode every time
- **Time-Saving**: Perfect for classroom demonstrations
- **Guided Learning**: Students explore specific concepts systematically
- **Teacher-Friendly**: Easy to incorporate into lesson plans
- **Reproducible**: Share scenario configurations with students
- **Informed Decisions**: Students understand what will happen before clicking

### Adjustable Hyperparameters

#### 1. Learning Rate
- **Range**: 0.0001 to 1.0
- **Control**: Slider with real-time value display
- **Default**: 0.001 (optimal)
- **Problematic Values**:
  - > 0.5: Causes gradient explosion and divergence
  - > 0.1: Causes unstable oscillating training
  - < 0.0001: Causes extremely slow learning

#### 2. Data Normalization
- **Control**: Toggle switch (Enable/Disable)
- **Default**: Enabled (optimal)
- **Effect**: Scales features to similar ranges
- **Problematic Setting**: Disabled causes poor convergence

#### 3. Batch Size
- **Options**: 1, 2, 4, 8, 16, 32, 64
- **Control**: Dropdown selector
- **Default**: 32 (optimal)
- **Problematic Values**:
  - 1-2: Causes erratic, noisy training
  - 64+: May cause slower convergence (less problematic)

#### 4. Training Epochs
- **Options**: 5, 10, 20, 50, 100
- **Control**: Dropdown selector
- **Default**: 50 (optimal)
- **Problematic Values**:
  - < 10: Causes underfitting
  - > 100: May cause overfitting (not simulated)

### Warning System
Visual indicators alert students to problematic configurations:
- **Yellow Warning Banner**: Appears when any parameter is in problematic range
- **Parameter-Level Warnings**: Small warning icons next to specific problematic settings
- **Warning Messages**: Clear explanations of what's wrong

### Retrain Functionality
- **Retrain Button**: Applies current configuration and simulates training
- **Loading State**: Shows "Retraining..." with animated icon
- **Real-Time Animation**: Progressively displays training curves epoch by epoch
- **Duration**: Varies based on epoch count (faster for fewer epochs)
- **Results**: Displays new accuracy and loss metrics

### Animated Training Curves
Real-time visualization of training progress:

#### Loss Curve
- **X-Axis**: Epoch number (0 to selected epochs)
- **Y-Axis**: Loss value
- **Training Loss Line**: Blue line showing training data loss
- **Validation Loss Line**: Orange line showing validation data loss
- **Animation**: Smooth progression as each epoch completes
- **Updates**: Real-time updates during retraining

#### Accuracy Curve
- **X-Axis**: Epoch number (0 to selected epochs)
- **Y-Axis**: Accuracy percentage (0-100%)
- **Training Accuracy Line**: Blue line showing training data accuracy
- **Validation Accuracy Line**: Orange line showing validation data accuracy
- **Animation**: Smooth progression as each epoch completes
- **Updates**: Real-time updates during retraining

#### Visual Patterns by Failure Mode

**Divergence (Learning Rate Too High)**
- Loss curves: Exponential increase (exploding)
- Accuracy curves: Rapid decrease
- Both training and validation metrics degrade together
- Clear visual indication of catastrophic failure

**Oscillation (Learning Rate Moderately High)**
- Loss curves: Wild oscillations, no smooth convergence
- Accuracy curves: Erratic fluctuations
- Unstable training visible in jagged lines
- No clear improvement trend

**Poor Convergence (No Normalization)**
- Loss curves: Slow, gradual decrease
- Accuracy curves: Slow, gradual increase
- Both curves improve but remain suboptimal
- Final values below well-trained baseline

**Erratic Training (Small Batch Size)**
- Loss curves: Noisy, with random fluctuations
- Accuracy curves: Variable with high variance
- General improvement trend but with noise
- Jagged appearance throughout

**Underfitting (Insufficient Epochs)**
- Loss curves: Flat, minimal improvement
- Accuracy curves: Flat, remain low
- Both training and validation curves stay close together
- No separation indicating learning hasn't occurred

**Well-Trained (Optimal Configuration)**
- Loss curves: Smooth exponential decrease
- Accuracy curves: Smooth increase toward 100%
- Training and validation curves close but validation slightly worse
- Clear convergence pattern

#### Overfitting Detection
When overfitting occurs (not in current failure modes but visible in curves):
- Training accuracy continues improving
- Validation accuracy plateaus or decreases
- Gap between training and validation curves widens
- Visual divergence between blue and orange lines

#### Chart Features
- **Responsive Design**: Adapts to screen size
- **Grid Lines**: Subtle grid for easier reading
- **Axis Labels**: Clear labels for epochs and metrics
- **Legend**: Color-coded legend identifying each line
- **Tooltips**: Hover to see exact values at each epoch
- **Smooth Animation**: Progressive reveal of data points
- **Color Coding**: Blue for training, orange for validation

### Performance Comparison
Side-by-side view comparing two models:

#### Original Model (Well-Trained)
- **Display**: Green background cards
- **Metrics**: Accuracy 92.5%, Loss 0.15
- **Purpose**: Baseline for comparison

#### Current Configuration
- **Display**: Green (success) or Red (failure) background
- **Metrics**: Simulated based on configuration
- **Color Coding**: Visual indication of success/failure

### Failure Modes

#### 1. Gradient Explosion (Divergence)
- **Trigger**: Learning rate > 0.5
- **Symptoms**:
  - Accuracy: Very low (0-20%)
  - Loss: Very high (5.0-15.0)
- **Explanation**: Learning rate too high causes overshooting
- **Fix**: Reduce learning rate to 0.001 or lower

#### 2. Unstable Training (Oscillation)
- **Trigger**: Learning rate 0.1-0.5
- **Symptoms**:
  - Accuracy: Moderate (60-80%)
  - Loss: Moderate (0.5-1.0)
- **Explanation**: Learning rate causes oscillation around optimal solution
- **Fix**: Reduce learning rate to 0.01 or lower

#### 3. Poor Convergence (No Normalization)
- **Trigger**: Normalization disabled
- **Symptoms**:
  - Accuracy: Below optimal (70-80%)
  - Loss: Higher than optimal (0.4-0.7)
- **Explanation**: Unnormalized data has uneven gradient updates
- **Fix**: Enable data normalization

#### 4. Erratic Training (Small Batch Size)
- **Trigger**: Batch size < 4
- **Symptoms**:
  - Accuracy: Variable (65-80%)
  - Loss: Variable (0.3-0.7)
- **Explanation**: Small batches provide poor gradient estimates
- **Fix**: Increase batch size to 16 or 32

#### 5. Underfitting (Insufficient Training)
- **Trigger**: Epochs < 10
- **Symptoms**:
  - Accuracy: Low (55-70%)
  - Loss: High (0.6-1.0)
- **Explanation**: Model hasn't trained long enough
- **Fix**: Increase epochs to 50 or more

### Educational Explanations
For each failure mode, the sandbox provides:

#### Title
Clear, descriptive name of the failure mode

#### Description
What's happening with the model training

#### Why This Happens
Technical explanation of the underlying cause

#### How to Fix It
Specific, actionable steps to resolve the issue

#### Real-World Context
When this problem occurs in practice

### Reset Functionality
- **Reset Button**: Restores all parameters to original optimal values
- **Confirmation**: Toast notification confirms reset
- **State**: Clears retrained results, returns to initial state

## User Interface

### Layout
- **Header**: Title and description
- **Warning Banner**: Conditional, appears for problematic configs
- **Two-Column Grid**:
  - Left: Configuration Panel
  - Right: Performance Comparison
- **Training Curves Section**: Two-column grid with loss and accuracy charts
- **Full-Width**: Educational Explanation Card
- **Footer**: Navigation buttons

### Design Principles
Following the Minimal aesthetic template:
- Ample whitespace for clarity
- Clear visual hierarchy
- Gentle contrast and readable typography
- Minimal shadows and decorations
- Color-coded feedback (green/yellow/red)

### Interactive Elements
- **Sliders**: Smooth dragging with real-time value display
- **Toggles**: Clear on/off states
- **Dropdowns**: Descriptive option labels
- **Buttons**: Clear labels with icons
- **Failure Scenario Buttons**: Multi-line layout with icon, name, and brief description
- **Hover Tooltips**: Detailed information on hover with smooth fade-in animation
- **Cards**: Organized information sections
- **Animated Charts**: Real-time training curve visualization with smooth animations

### Tooltip Design
Following the Minimal aesthetic template, tooltips provide detailed information without visual clutter:

**Visual Characteristics**:
- **Smooth Animation**: 300ms delay before appearing, fade-in effect
- **Positioning**: Appears above button (top side) to avoid overlapping with content below
- **Max Width**: Constrained to maintain readability (max-w-xs)
- **Padding**: Generous spacing (p-3) for comfortable reading
- **Background**: Uses primary color with primary-foreground text for contrast
- **Border Radius**: Subtle rounded corners matching overall design

**Content Structure**:
- **Header**: "Configuration Details" in semibold font
- **Parameter List**: Two-column layout with labels and values
  - Labels: Muted foreground color for hierarchy
  - Values: Monospace font for technical precision
  - Problematic values: Bold font weight for emphasis
- **Divider**: Subtle border-top separating sections
- **Expected Outcome**: Failure description and training time
- **Typography**: Small text (text-xs) for compact information density

**Interaction Behavior**:
- Appears on hover after 300ms delay
- Remains visible while hovering over button or tooltip
- Disappears smoothly when mouse leaves
- Does not interfere with button click functionality
- Disabled buttons do not show tooltips

**Accessibility**:
- High contrast between background and text
- Clear visual hierarchy with font weights and colors
- Readable font sizes despite compact layout
- Proper spacing between information elements

### Color Coding
- **Green**: Optimal/successful configurations
- **Yellow**: Warnings and problematic settings
- **Red**: Failed training results
- **Blue**: Training data curves
- **Orange**: Validation data curves
- **Muted**: Neutral information

## Educational Value

### Learning Objectives
Students will:
1. Understand how hyperparameters affect model training
2. Recognize symptoms of common training failures
3. Develop debugging intuition for ML problems
4. Learn best practices for hyperparameter selection
5. Build confidence in troubleshooting ML models
6. Interpret training and validation curves
7. Identify overfitting and underfitting patterns visually
8. Understand the relationship between loss and accuracy over time

### Pedagogical Approach
- **Constructivist Learning**: Learn by doing and experimenting
- **Immediate Feedback**: See results instantly
- **Guided Discovery**: Warnings guide toward understanding
- **Contextual Learning**: Real-world examples provided
- **Safe Failure**: Encourage experimentation without consequences

### Classroom Integration
Teachers can use the sandbox for:
- **Quick Demonstrations**: Use pre-loaded failure scenario buttons for instant classroom demonstrations
- **Guided Exercises**: Walk students through specific scenarios using failure scenario buttons
- **Live Comparisons**: Show failure modes to entire class with real-time curve animations
- **Systematic Exploration**: Have students click through all four failure scenarios in sequence
- **Independent Discovery**: Let students experiment with manual adjustments after seeing scenarios
- **Discussion Prompts**: Use failures and curve shapes as teaching moments
- **Assessment**: Evaluate understanding of hyperparameters and curve interpretation
- **Lesson Planning**: Incorporate failure scenarios into structured lesson plans
- **Time Management**: Use scenario buttons to fit demonstrations into class time constraints

### Failure Scenario Teaching Strategies

#### Strategy 1: Sequential Exploration
1. Start with "No Normalization" scenario
2. Observe and discuss poor convergence
3. Move to "Learning Rate Too High" scenario
4. Compare divergence with previous failure
5. Continue through "Tiny Batch Size" and "Insufficient Epochs"
6. Summarize differences between failure modes

#### Strategy 2: Predict and Verify
1. Ask students to predict what will happen with each scenario
2. Click scenario button to verify predictions
3. Discuss why predictions were correct or incorrect
4. Reinforce understanding through observation

#### Strategy 3: Comparison Analysis
1. Click "Learning Rate Too High" scenario
2. Observe diverging loss curve
3. Reset and click "Tiny Batch Size" scenario
4. Compare erratic curves with divergence
5. Discuss different types of training instability

#### Strategy 4: Assignment Creation
1. Save a failure scenario configuration
2. Share configuration link with students
3. Ask students to identify the problem
4. Have students explain why the failure occurs
5. Request students to suggest fixes
- **Comparative Analysis**: Have students compare different configurations side-by-side

## Technical Implementation

### Charting Library
Uses Recharts for React-based chart visualization:
- Responsive container adapts to screen size
- LineChart component for time-series data
- Smooth animations with configurable duration
- Customizable colors and styling
- Built-in tooltips and legends

### Training Curve Generation
```typescript
const generateTrainingCurve = (mode: string, totalEpochs: number) => {
  const data = [];
  
  for (let epoch = 0; epoch <= totalEpochs; epoch++) {
    const progress = epoch / totalEpochs;
    let trainLoss, valLoss, trainAcc, valAcc;

    if (mode === 'divergence') {
      // Loss explodes exponentially
      trainLoss = 2.0 * Math.exp(progress * 3);
      valLoss = 2.0 * Math.exp(progress * 3.2);
      trainAcc = Math.max(10, 50 - progress * 40);
      valAcc = Math.max(5, 45 - progress * 40);
    }
    // ... other modes

    data.push({
      epoch,
      trainLoss: Math.max(0, trainLoss),
      valLoss: Math.max(0, valLoss),
      trainAcc: Math.min(100, Math.max(0, trainAcc)),
      valAcc: Math.min(100, Math.max(0, valAcc))
    });
  }

  return data;
};
```

### Animation Logic
```typescript
const handleRetrain = () => {
  const mode = getFailureMode();
  const totalEpochs = parseInt(epochs);
  const fullData = generateTrainingCurve(mode, totalEpochs);

  // Animate epochs progressively
  let currentEpochIndex = 0;
  const intervalDuration = Math.max(50, 2000 / totalEpochs);

  const interval = setInterval(() => {
    if (currentEpochIndex <= totalEpochs) {
      setCurrentEpoch(currentEpochIndex);
      setTrainingData(fullData.slice(0, currentEpochIndex + 1));
      currentEpochIndex++;
    } else {
      clearInterval(interval);
      // Complete training
    }
  }, intervalDuration);
};
```

### Simulation Logic
The sandbox simulates training results based on configuration:

```typescript
// Different curve patterns for each failure mode
if (mode === 'divergence') {
  trainLoss = 2.0 * Math.exp(progress * 3);  // Exponential growth
  valLoss = 2.0 * Math.exp(progress * 3.2);
} else if (mode === 'oscillation') {
  trainLoss = 1.0 + Math.sin(progress * 20) * 0.5;  // Sinusoidal
  valLoss = 1.2 + Math.sin(progress * 18) * 0.6;
} else if (mode === 'poor_convergence') {
  trainLoss = 0.8 - progress * 0.3;  // Slow linear decrease
  valLoss = 0.9 - progress * 0.25;
}
// ... other modes
```

### Failure Mode Detection
```typescript
const getFailureMode = () => {
  if (learningRate > 0.5) return 'divergence';
  if (learningRate > 0.1) return 'oscillation';
  if (!normalization) return 'poor_convergence';
  if (parseInt(batchSize) < 4) return 'erratic';
  if (parseInt(epochs) < 10) return 'underfitting';
  return 'none';
};
```

### State Management
- React hooks for local state
- No backend calls (fully client-side simulation)
- Instant feedback without network latency
- Training data stored as array of epoch objects
- Progressive data updates for animation effect
- useEffect for cleanup of animation intervals

## Activity Tracking
The sandbox tracks student experimentation:
- Timestamp when entering/exiting sandbox
- Student ID
- Hyperparameter configurations tested
- Failure modes observed
- Time spent experimenting
- Number of retraining attempts

This data appears in:
- Teacher dashboard (individual student view)
- Generated reports (debugging sandbox metrics)
- Analytics for understanding student learning patterns

## Navigation Flow

### Entry Points
- From Training Page after successful training
- Optional step (can be skipped)

### Exit Points
- "Continue to Testing" button → Testing Page
- "Back to Training" button → Training Page
- Skip sandbox entirely from Training Page

## Usage Examples with Failure Scenarios

### Example 1: Classroom Demonstration - Learning Rate Effects
**Scenario**: Teacher demonstrates gradient explosion during lecture

**Steps**:
1. Teacher opens debugging sandbox on projector
2. Clicks "Learning Rate Too High" button
3. Model automatically retrains with LR = 0.8
4. Class observes loss curve diverging exponentially in real-time
5. Teacher explains gradient explosion concept
6. Clicks "Reset" to restore optimal configuration
7. Shows comparison between divergent and optimal training

**Learning Outcome**: Students visually understand gradient explosion

### Example 2: Guided Exercise - Comparing Failure Modes
**Scenario**: Students systematically explore all four failure scenarios

**Steps**:
1. Student clicks "No Normalization" button
2. Observes poor convergence and slow learning
3. Takes notes on curve patterns
4. Clicks "Learning Rate Too High" button
5. Observes dramatic divergence
6. Compares with previous failure mode
7. Continues through "Tiny Batch Size" and "Insufficient Epochs"
8. Completes comparison chart of all four failures

**Learning Outcome**: Students differentiate between failure types

### Example 3: Assignment - Identify the Problem
**Scenario**: Teacher creates debugging assignment for homework

**Steps**:
1. Teacher clicks "Tiny Batch Size" button
2. Clicks "Save Configuration"
3. Names it "Mystery Configuration #1"
4. Clicks "Share" to generate link
5. Posts link in learning management system
6. Students load configuration and analyze
7. Students identify batch size as the problem
8. Students explain why tiny batches cause erratic training

**Learning Outcome**: Students develop debugging skills

### Example 4: Independent Exploration - Beyond Scenarios
**Scenario**: Student explores variations after trying scenarios

**Steps**:
1. Student clicks all four failure scenario buttons
2. Observes each failure mode
3. Wonders: "What if learning rate is moderately high?"
4. Manually adjusts learning rate to 0.3
5. Observes oscillating but not diverging curves
6. Saves configuration as "Moderate LR Oscillation"
7. Shares with classmates for discussion

**Learning Outcome**: Student discovers nuanced behavior

### Example 5: Class Discussion - Predict and Verify
**Scenario**: Teacher uses scenarios for interactive discussion

**Steps**:
1. Teacher asks: "What will happen with no normalization?"
2. Students make predictions
3. Teacher clicks "No Normalization" button
4. Class observes actual results
5. Teacher asks: "Why did this happen?"
6. Students discuss feature scaling importance
7. Repeat for other three scenarios
8. Class summarizes key takeaways

**Learning Outcome**: Active learning through prediction

### Example 6: Using Tooltips for Informed Decisions
**Scenario**: Student uses tooltips to understand scenarios before clicking

**Steps**:
1. Student hovers over "No Normalization" button
2. Tooltip appears showing all hyperparameter values
3. Student reads: "Normalization: Disabled" (bold)
4. Sees expected failure: "Poor convergence, slow learning"
5. Notes training time: "~30 seconds"
6. Hovers over "High Learning Rate" button
7. Compares: "Learning Rate: 0.8" (bold)
8. Sees expected failure: "Gradient explosion, divergence"
9. Decides to try "High Learning Rate" first for dramatic effect
10. Clicks button with full understanding of what will happen

**Learning Outcome**: Students make informed experimental choices

### Example 7: Assessment - Scenario Identification
**Scenario**: Teacher assesses student understanding

**Steps**:
1. Teacher shows training curve with divergence
2. Asks students: "Which scenario caused this?"
3. Students identify "Learning Rate Too High"
4. Teacher shows erratic noisy curves
5. Students identify "Tiny Batch Size"
6. Teacher shows flat underfitting curves
7. Students identify "Insufficient Epochs"
8. Teacher evaluates understanding

**Learning Outcome**: Students demonstrate mastery

## Best Practices

### For Students
- **Start with Failure Scenarios**: Click pre-loaded scenario buttons before manual adjustments
- **Observe Systematically**: Try all four failure scenarios to compare different failure modes
- **Compare Results**: Always compare broken model with original well-trained model
- **Read Explanations**: Study educational explanations for each failure mode
- **Experiment Further**: After scenarios, try manual adjustments to explore variations
- **Save Discoveries**: Save interesting configurations for future reference
- **Share Findings**: Share configurations with classmates for discussion
- **Use Reset**: Click reset button to return to baseline between experiments
- **Take Notes**: Document observations about each failure mode

### For Teachers
- **Use Scenario Buttons for Demos**: Click failure scenario buttons during lectures for instant demonstrations
- **Plan Lesson Sequences**: Incorporate all four scenarios into structured lesson plans
- **Time Management**: Use scenario buttons to fit demonstrations into class periods
- **Create Assignments**: Save scenario configurations and share links with students for homework
- **Facilitate Discussions**: Use scenario results as discussion prompts
- **Assess Understanding**: Ask students to predict scenario outcomes before clicking
- **Encourage Exploration**: Have students try manual adjustments after seeing scenarios
- **Track Progress**: Monitor which scenarios students have explored in dashboard
- **Provide Context**: Explain real-world situations where each failure occurs
- Demonstrate one failure mode to entire class
- Have students predict results before retraining
- Discuss why certain configurations fail
- Connect to real-world ML debugging scenarios
- Use as formative assessment tool
- Encourage peer discussion of observations

## Common Scenarios

### Scenario 1: Learning Rate Too High
1. Set learning rate to 0.8
2. Click "Retrain Model"
3. Watch loss curves explode exponentially upward
4. Observe accuracy curves plummet downward
5. See both training and validation curves diverge together
6. Read explanation about gradient explosion
7. Reset and try moderate learning rate (0.01)
8. Compare smooth convergence curves

### Scenario 2: No Normalization
1. Disable normalization toggle
2. Keep other parameters optimal
3. Click "Retrain Model"
4. Watch curves improve slowly and plateau early
5. Observe final values remain suboptimal
6. Compare curve shapes with normalized version
7. Read explanation about uneven gradients
8. Enable normalization and retrain
9. See faster, smoother convergence

### Scenario 3: Small Batch Size
1. Set batch size to 1
2. Click "Retrain Model"
3. Observe noisy, jagged curves with high variance
4. Notice erratic fluctuations throughout training
5. See general improvement trend despite noise
6. Read explanation about gradient variance
7. Increase batch size to 32
8. Compare smooth, stable curves

## Troubleshooting

### Retrain Button Not Working
**Cause**: Already retraining or network issue

**Solution**: Wait for current retraining to complete

### Results Not Changing
**Cause**: Configuration hasn't changed from previous retrain

**Solution**: Adjust parameters before retraining

### Warning Not Appearing
**Cause**: Configuration is within acceptable ranges

**Solution**: This is correct - no warning needed for good configs

### Comparison View Empty
**Cause**: Haven't retrained yet

**Solution**: Click "Retrain Model" to see comparison

### Charts Not Displaying
**Cause**: Haven't started retraining yet

**Solution**: Click "Retrain Model" to see animated training curves

### Charts Appear Choppy or Laggy
**Cause**: Too many epochs causing rapid updates

**Solution**: Animation automatically adjusts speed; wait for completion

### Curves Look Identical
**Cause**: Configuration is optimal, training and validation perform similarly

**Solution**: This is expected for well-configured models; try problematic settings to see divergence

## Future Enhancements

### Potential Features
- Multiple model comparison (3+ configurations simultaneously)
- Zoom and pan controls for detailed curve inspection
- Export training curves as images for reports
- Downloadable curve data as CSV
- Customizable curve colors and line styles
- 3D visualization showing loss landscape
- Gradient magnitude visualization
- Learning rate scheduling demonstration
- Early stopping indicator
- Checkpoint markers on curves
- Annotation tools for marking interesting points
- Slow-motion replay of training animation

### Considerations
- Balance realism with educational clarity
- Keep interface simple and uncluttered
- Maintain fast feedback loop
- Ensure explanations are accessible to students
- Provide enough variety without overwhelming
- Optimize animation performance for all devices

## Related Documentation
- [TRAINING.md](./TRAINING.md) - Model training process
- [INTERACTIVE_LEARNING.md](./INTERACTIVE_LEARNING.md) - Learning modules
- [TEACHER_DASHBOARD.md](./TEACHER_DASHBOARD.md) - Analytics and tracking

## Summary
The Debugging Sandbox transforms potential frustration with ML failures into valuable learning experiences. By providing a safe space to experiment with problematic configurations, students develop deep understanding of hyperparameters and build practical debugging skills that transfer to real-world ML projects.
