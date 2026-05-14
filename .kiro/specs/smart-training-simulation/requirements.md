# Requirements Document

## Introduction

The Smart Training Simulation feature replaces ModelMentor's current naive metric generation (simple exponential decay + random noise) with a physics-informed simulation engine that produces realistic training curves responsive to student choices. The simulation remains 100% client-side with zero ML compute cost, but the generated metrics now reflect the actual consequences of hyperparameter, dataset, and architecture decisions — teaching students to recognize good vs. bad training behavior through experience.

## Glossary

- **Simulation_Engine**: The client-side TypeScript module that computes epoch-by-epoch training metrics based on input parameters (hyperparameters, dataset properties, model architecture)
- **Training_Curve**: A sequence of per-epoch metric values (loss, accuracy, validation loss, validation accuracy) rendered as a chart
- **Learning_Rate**: The step size used by the optimizer during gradient descent; controls how much model weights change per update
- **Convergence**: The state where training loss stabilizes near a minimum value
- **Divergence**: The state where training loss increases without bound due to an excessively high learning rate
- **Oscillation**: Repeated fluctuation in loss values around a minimum without settling, caused by a moderately high learning rate
- **Overfitting**: The condition where training accuracy continues to improve while validation accuracy plateaus or degrades
- **Underfitting**: The condition where both training and validation accuracy remain low due to insufficient model capacity or training duration
- **Class_Imbalance_Ratio**: The ratio of majority class samples to minority class samples in a dataset
- **Data_Quality_Score**: A normalized 0–1 score representing the proportion of clean, complete, outlier-free samples in a dataset
- **Model_Complexity**: A categorical measure (low, medium, high) representing the number of parameters and layers in the chosen architecture
- **Batch_Size**: The number of training samples processed before updating model weights
- **Epoch**: One complete pass through the entire training dataset
- **Noise_Floor**: The minimum achievable loss given dataset quality and class balance constraints

## Requirements

### Requirement 1: Learning Rate Sensitivity

**User Story:** As a student, I want the training simulation to respond realistically to my learning rate choice, so that I learn to identify the consequences of too-high, too-low, and optimal learning rates.

#### Acceptance Criteria

1. WHEN the student sets a learning rate above the divergence threshold for the selected optimizer, THE Simulation_Engine SHALL produce a loss curve that increases monotonically after the first few epochs
2. WHEN the student sets a learning rate in the oscillation range (moderately above optimal), THE Simulation_Engine SHALL produce a loss curve with amplitude fluctuations that do not converge within the configured epoch count
3. WHEN the student sets a learning rate below 10% of the optimal value, THE Simulation_Engine SHALL produce a loss curve that decreases at less than 20% of the optimal convergence rate
4. WHEN the student sets a learning rate within the optimal range, THE Simulation_Engine SHALL produce a smooth, monotonically decreasing loss curve that converges within 60% of the configured epochs
5. THE Simulation_Engine SHALL determine the optimal learning rate range based on the selected model complexity and optimizer type

### Requirement 2: Dataset Size Effect

**User Story:** As a student, I want the simulation to show how dataset size affects model performance, so that I understand the relationship between data quantity and generalization.

#### Acceptance Criteria

1. WHEN the dataset contains fewer than 100 samples, THE Simulation_Engine SHALL cap the maximum achievable validation accuracy at 70% regardless of other parameters
2. WHEN the dataset size increases, THE Simulation_Engine SHALL increase the maximum achievable validation accuracy logarithmically up to the architecture ceiling
3. WHEN the dataset contains fewer samples than 10x the number of model parameters, THE Simulation_Engine SHALL produce an overfitting pattern where training accuracy exceeds validation accuracy by at least 15 percentage points
4. THE Simulation_Engine SHALL compute a data sufficiency ratio (samples / model parameters) and use it as a scaling factor for the generalization gap

### Requirement 3: Class Imbalance Effect

**User Story:** As a student, I want the simulation to demonstrate how class imbalance affects metrics, so that I learn why accuracy alone is misleading for imbalanced datasets.

#### Acceptance Criteria

1. WHEN the Class_Imbalance_Ratio exceeds 5:1, THE Simulation_Engine SHALL produce an overall accuracy above 80% while keeping minority class recall below 40%
2. WHEN the Class_Imbalance_Ratio exceeds 10:1, THE Simulation_Engine SHALL produce a minority class precision below 50% and minority class recall below 25%
3. WHEN the dataset is balanced (Class_Imbalance_Ratio below 2:1), THE Simulation_Engine SHALL produce per-class metrics within 10 percentage points of overall accuracy
4. THE Simulation_Engine SHALL expose per-class precision and recall alongside overall accuracy so students can observe the discrepancy

### Requirement 4: Epoch Count Effect

**User Story:** As a student, I want the simulation to show underfitting with too few epochs and overfitting with too many, so that I learn to choose an appropriate training duration.

#### Acceptance Criteria

1. WHEN the epoch count is below the convergence threshold for the given configuration, THE Simulation_Engine SHALL produce final training loss above 50% of the initial loss value
2. WHEN the epoch count exceeds the overfitting onset point, THE Simulation_Engine SHALL produce a validation accuracy curve that peaks and then decreases while training accuracy continues to rise
3. WHEN the epoch count is within the optimal range, THE Simulation_Engine SHALL produce converging training and validation curves with a gap of less than 5 percentage points
4. THE Simulation_Engine SHALL calculate the overfitting onset point based on model complexity and dataset size

### Requirement 5: Model Architecture Effect

**User Story:** As a student, I want the simulation to show how model complexity affects convergence speed and final accuracy, so that I learn to match architecture to problem difficulty.

#### Acceptance Criteria

1. WHEN a low-complexity model is selected, THE Simulation_Engine SHALL produce a training curve that converges within 30% of total epochs but plateaus at a lower maximum accuracy than high-complexity models
2. WHEN a high-complexity model is selected, THE Simulation_Engine SHALL produce a training curve that takes at least 60% of total epochs to converge but reaches a higher maximum accuracy
3. WHEN a high-complexity model is trained on a small dataset, THE Simulation_Engine SHALL produce severe overfitting (training-validation gap exceeding 20 percentage points)
4. WHEN a low-complexity model is applied to a complex problem, THE Simulation_Engine SHALL produce underfitting where both training and validation accuracy plateau below 75%

### Requirement 6: Batch Size Effect

**User Story:** As a student, I want the simulation to show how batch size affects training stability and convergence, so that I learn the tradeoffs between large and small batches.

#### Acceptance Criteria

1. WHEN the batch size is less than 8, THE Simulation_Engine SHALL produce a loss curve with high epoch-to-epoch variance (noise amplitude above 15% of current loss value)
2. WHEN the batch size exceeds 256, THE Simulation_Engine SHALL produce a loss curve with low variance but slower convergence rate (at least 40% more epochs to reach the same loss as batch size 32)
3. WHEN the batch size is between 16 and 64, THE Simulation_Engine SHALL produce a loss curve with moderate variance and near-optimal convergence rate
4. THE Simulation_Engine SHALL scale the per-epoch noise inversely with the square root of the batch size

### Requirement 7: Data Quality Effect

**User Story:** As a student, I want the simulation to show how data quality (missing values, outliers, noise) affects training outcomes, so that I learn the importance of data preprocessing.

#### Acceptance Criteria

1. WHEN the Data_Quality_Score is below 0.5, THE Simulation_Engine SHALL reduce the maximum achievable accuracy by at least 20 percentage points compared to a perfect-quality dataset
2. WHEN the Data_Quality_Score is below 0.5, THE Simulation_Engine SHALL increase the epoch-to-epoch noise in the loss curve by a factor proportional to (1 - Data_Quality_Score)
3. WHEN the Data_Quality_Score is above 0.9, THE Simulation_Engine SHALL produce training curves indistinguishable from a perfect-quality dataset
4. THE Simulation_Engine SHALL compute the Data_Quality_Score from the proportion of missing values, detected outliers, and label noise in the dataset configuration

### Requirement 8: Deterministic Reproducibility

**User Story:** As a student, I want to get the same training curves when I re-run with identical parameters, so that I can compare results meaningfully and isolate the effect of individual changes.

#### Acceptance Criteria

1. THE Simulation_Engine SHALL accept an optional random seed parameter
2. WHEN the same seed and identical configuration are provided, THE Simulation_Engine SHALL produce identical metric sequences across runs
3. WHEN no seed is provided, THE Simulation_Engine SHALL generate a random seed and expose it in the training results so the student can reproduce the run

### Requirement 9: Combined Parameter Interactions

**User Story:** As a student, I want the simulation to model realistic interactions between parameters (e.g., high learning rate + small batch = extra instability), so that I learn how choices compound.

#### Acceptance Criteria

1. WHEN a high learning rate is combined with a small batch size, THE Simulation_Engine SHALL amplify oscillation amplitude beyond what either parameter alone would produce
2. WHEN a large dataset is combined with a high-complexity model, THE Simulation_Engine SHALL reduce the overfitting gap compared to the same model on a small dataset
3. WHEN low data quality is combined with high model complexity, THE Simulation_Engine SHALL produce a higher noise floor than either factor alone would produce
4. THE Simulation_Engine SHALL compute final metrics by composing individual parameter effects multiplicatively rather than additively to model realistic interactions
