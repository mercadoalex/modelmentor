# Requirements Document

## Introduction

Browser Real Training (Level 2) differentiates ModelMentor from competitors who only show videos or slides by providing authenticated users with actual TensorFlow.js model training in the browser. Unauthenticated users continue to receive the Level 1 smart simulation, while signed-up users get real gradient descent, real loss curves, and a trained model they can use for predictions on the Test & Debug page. This feature runs entirely client-side with no server dependency, using dynamic imports to avoid penalizing initial page load.

## Glossary

- **Training_Orchestrator**: The client-side module that selects the appropriate training strategy (simulation vs. real TF.js) based on authentication state and dispatches training to the correct engine
- **TFEngine**: The TensorFlow.js-based training engine that performs real gradient descent in the browser using WebGL acceleration
- **Model_Registry**: An in-memory and IndexedDB-backed store that holds trained TensorFlow.js model artifacts so they can be used for inference on the Test & Debug page
- **Dynamic_Loader**: The module responsible for lazily importing the @tensorflow/tfjs package only when real training is requested, avoiding the ~1MB bundle cost for unauthenticated users
- **Device_Capability_Detector**: A utility that checks WebGL availability, estimated device memory, and connection type to determine if real training is safe to run on the current device
- **Training_Guard**: The authentication gate that routes training requests to either Level 1 simulation or Level 2 real training based on the user's authentication state
- **Epoch_Reporter**: The callback mechanism that reports real-time per-epoch metrics (loss, accuracy, val_loss, val_accuracy) from TensorFlow.js back to the existing TrainingPage UI
- **Classification_Model**: A dense neural network (Input → 64 → 32 → Output) for tabular classification tasks
- **Regression_Model**: A dense neural network (Input → 64 → 32 → 1) for tabular regression tasks
- **Text_Classification_Model**: An embedding-based network (Embedding → Dense → Output) for text classification tasks
- **Image_Classification_Model**: A MobileNet transfer learning model that freezes the base and trains only the final classification layer
- **Training_Session**: A single training run from start to completion, including all epoch metrics and the resulting model artifact

## Requirements

### Requirement 1: Authentication-Based Training Gate

**User Story:** As a product owner, I want unauthenticated users to receive simulation-only training and authenticated users to receive real TensorFlow.js training, so that real training is a clear incentive to sign up.

#### Acceptance Criteria

1. WHEN an unauthenticated user initiates training, THE Training_Guard SHALL route the request to the Level 1 Simulation_Engine and produce simulated metrics
2. WHEN an authenticated user initiates training, THE Training_Guard SHALL route the request to the TFEngine for real gradient descent training
3. THE Training_Guard SHALL read the authentication state from the existing AuthContext isAuthenticated flag without introducing additional authentication checks
4. WHEN the authentication state changes during an active Training_Session, THE Training_Guard SHALL allow the current session to complete with its original engine rather than switching mid-training
5. THE Training_Guard SHALL display a visible indicator to the user showing whether they are receiving simulated training or real training

### Requirement 2: Dynamic TensorFlow.js Loading

**User Story:** As a developer, I want TensorFlow.js to load only when an authenticated user starts training, so that the initial page load remains fast for all users.

#### Acceptance Criteria

1. THE Dynamic_Loader SHALL import the @tensorflow/tfjs package using dynamic import syntax only when real training is requested
2. THE Dynamic_Loader SHALL not include TensorFlow.js in the main application bundle
3. WHEN the dynamic import is in progress, THE Dynamic_Loader SHALL display a loading indicator to the user with an estimated download size
4. IF the dynamic import fails due to network error, THEN THE Dynamic_Loader SHALL fall back to Level 1 simulation and notify the user that real training is unavailable
5. WHEN TensorFlow.js has been loaded once during a browser session, THE Dynamic_Loader SHALL reuse the cached module for subsequent training requests without re-downloading

### Requirement 3: Tabular Classification Training

**User Story:** As a student, I want to train a real classification model on my tabular dataset, so that I can see actual gradient descent produce real accuracy improvements.

#### Acceptance Criteria

1. WHEN an authenticated user starts training with a classification task and tabular data, THE TFEngine SHALL construct a Classification_Model with architecture Input → Dense(64, ReLU) → Dense(32, ReLU) → Dense(numClasses, Softmax)
2. THE TFEngine SHALL preprocess the student's CSV data by normalizing numeric features to zero mean and unit variance
3. THE TFEngine SHALL encode categorical labels using one-hot encoding for multi-class or binary encoding for two-class problems
4. WHEN training begins, THE TFEngine SHALL split the dataset into training and validation sets using the configured validation split ratio
5. THE TFEngine SHALL compile the Classification_Model with the optimizer and learning rate specified in the training configuration panel

### Requirement 4: Tabular Regression Training

**User Story:** As a student, I want to train a real regression model on my tabular dataset, so that I can observe how loss decreases as the model learns to predict continuous values.

#### Acceptance Criteria

1. WHEN an authenticated user starts training with a regression task and tabular data, THE TFEngine SHALL construct a Regression_Model with architecture Input → Dense(64, ReLU) → Dense(32, ReLU) → Dense(1, Linear)
2. THE TFEngine SHALL normalize both input features and target values before training
3. THE TFEngine SHALL use mean squared error as the loss function for regression tasks
4. THE TFEngine SHALL report a pseudo-accuracy metric derived from (1 - normalized_MSE) so the existing UI charts remain consistent across task types
5. THE TFEngine SHALL store normalization parameters (mean, standard deviation) alongside the trained model so predictions can be denormalized correctly

### Requirement 5: Text Classification Training

**User Story:** As a student, I want to train a real text classification model, so that I can understand how embeddings and dense layers work together on natural language data.

#### Acceptance Criteria

1. WHEN an authenticated user starts training with a text classification task, THE TFEngine SHALL construct a Text_Classification_Model with architecture Embedding(vocabSize, 32) → GlobalAveragePooling → Dense(16, ReLU) → Dense(numClasses, Softmax)
2. THE TFEngine SHALL tokenize input text by splitting on whitespace and mapping words to integer indices using a vocabulary built from the training data
3. THE TFEngine SHALL pad or truncate all text sequences to a maximum length of 100 tokens
4. THE TFEngine SHALL limit vocabulary size to 1000 words to keep the embedding layer small enough for browser training
5. IF the dataset contains fewer than 10 unique text samples, THEN THE TFEngine SHALL warn the user that results may be unreliable due to insufficient data

### Requirement 6: Image Classification with Transfer Learning

**User Story:** As a student, I want to train an image classifier using MobileNet transfer learning, so that I can see how pre-trained models accelerate learning on small datasets.

#### Acceptance Criteria

1. WHEN an authenticated user starts training with an image classification task, THE TFEngine SHALL load a pre-trained MobileNet base model and freeze all base layers
2. THE TFEngine SHALL add a trainable classification head (GlobalAveragePooling → Dense(numClasses, Softmax)) on top of the frozen MobileNet base
3. THE TFEngine SHALL resize all input images to 224×224 pixels and normalize pixel values to the range [0, 1]
4. THE TFEngine SHALL train only the classification head parameters while keeping MobileNet weights frozen
5. IF the MobileNet base model fails to load due to network unavailability, THEN THE TFEngine SHALL fall back to a simple convolutional model (Conv2D → MaxPool → Flatten → Dense) that trains from scratch
6. THE TFEngine SHALL display a message explaining that transfer learning is being used and only the final layer is being trained

### Requirement 7: Real-Time Epoch Progress Reporting

**User Story:** As a student, I want to see real-time loss and accuracy updates after each epoch, so that I can observe the training process as it happens.

#### Acceptance Criteria

1. WHEN an epoch completes during real training, THE Epoch_Reporter SHALL invoke the existing onEpochEnd callback with loss, accuracy, val_loss, and val_accuracy values
2. THE Epoch_Reporter SHALL report metrics in the same format as the Level 1 simulation (loss, acc, val_loss, val_acc keys) so the existing chart and log components render correctly
3. THE Epoch_Reporter SHALL update the progress bar, elapsed time, and estimated time remaining after each epoch
4. WHEN training completes all configured epochs, THE Epoch_Reporter SHALL invoke the onComplete callback with final aggregated metrics
5. THE Epoch_Reporter SHALL ensure metric values are finite numbers and replace NaN or Infinity with 0 before reporting to prevent chart rendering errors

### Requirement 8: Trained Model Persistence

**User Story:** As a student, I want my trained model to remain available after training completes, so that I can make predictions on the Test & Debug page without retraining.

#### Acceptance Criteria

1. WHEN training completes successfully, THE Model_Registry SHALL store the trained TensorFlow.js model in memory for immediate use
2. THE Model_Registry SHALL persist the trained model to IndexedDB so it survives page navigation within the same browser session
3. THE Model_Registry SHALL store preprocessing metadata (normalization parameters, vocabulary, label mappings) alongside the model so predictions can be made correctly
4. WHEN the Test & Debug page loads, THE Model_Registry SHALL retrieve the most recently trained model for the current project
5. IF no trained model exists in the Model_Registry for the current project, THEN THE Model_Registry SHALL return null and the Test page SHALL display a message directing the user to train first
6. THE Model_Registry SHALL use a key format of "modelmentor-{projectId}" for IndexedDB storage to avoid collisions between projects

### Requirement 9: Device Capability Detection and Safety

**User Story:** As a student on a mobile device, I want the system to warn me if my device may struggle with real training, so that I can choose to proceed or fall back to simulation.

#### Acceptance Criteria

1. WHEN real training is requested, THE Device_Capability_Detector SHALL check for WebGL availability using the TensorFlow.js backend detection API
2. IF WebGL is not available, THEN THE Device_Capability_Detector SHALL fall back to the CPU backend and warn the user that training will be slower
3. WHEN the estimated device memory is below 2GB, THE Device_Capability_Detector SHALL display a warning that training may be slow and offer the option to use simulation instead
4. THE Device_Capability_Detector SHALL limit model size to a maximum of 50,000 trainable parameters when running on devices with limited memory
5. THE Device_Capability_Detector SHALL limit dataset size to a maximum of 500 samples for in-browser training to prevent out-of-memory errors

### Requirement 10: Training Cancellation and Cleanup

**User Story:** As a student, I want to be able to stop training at any time and have resources properly cleaned up, so that my browser does not become unresponsive.

#### Acceptance Criteria

1. WHEN the user clicks the stop button during real training, THE TFEngine SHALL abort the current training loop after the current epoch completes
2. WHEN training is cancelled, THE TFEngine SHALL dispose all TensorFlow.js tensors and intermediate computation graphs to free GPU and CPU memory
3. IF the browser tab is closed or navigated away during training, THEN THE TFEngine SHALL abort training and dispose resources via a beforeunload or cleanup handler
4. WHEN training is cancelled before completion, THE Model_Registry SHALL not persist a partially trained model to IndexedDB
5. THE TFEngine SHALL set a cancellation flag that is checked between epochs to ensure training stops within one epoch duration

### Requirement 11: Training Performance Constraints

**User Story:** As a student, I want training to complete within a reasonable time, so that I stay engaged and do not abandon the learning exercise.

#### Acceptance Criteria

1. THE TFEngine SHALL complete training within 30 seconds for datasets containing 40 to 200 samples with the default architecture
2. WHEN training duration exceeds 30 seconds, THE TFEngine SHALL display a progress message indicating estimated remaining time
3. THE TFEngine SHALL use WebGL backend by default for GPU-accelerated matrix operations
4. IF a training epoch takes longer than 5 seconds, THEN THE TFEngine SHALL log a performance warning suggesting the user reduce epochs or dataset size
5. THE TFEngine SHALL batch dataset processing to avoid blocking the main thread for more than 100ms at a time

### Requirement 12: Offline Operation

**User Story:** As a student, I want real training to work without an internet connection after the initial TensorFlow.js load, so that I can practice ML on the go.

#### Acceptance Criteria

1. WHEN TensorFlow.js has been loaded and cached by the browser, THE TFEngine SHALL perform all training computations locally without network requests
2. THE TFEngine SHALL not require any server-side API calls during the training loop
3. WHEN the MobileNet base model has been previously loaded and cached, THE TFEngine SHALL use the cached version for subsequent image classification training sessions
4. IF the user is offline and TensorFlow.js has not been previously cached, THEN THE Dynamic_Loader SHALL fall back to Level 1 simulation and inform the user that real training requires an initial internet connection to download the library
