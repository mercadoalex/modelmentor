# Requirements Document

## Introduction

ModelMentor is a learning-focused ML education app built with React/TypeScript and Supabase. It currently operates in an offline-first mode with synthetic data for learning purposes. This feature adds backend integration for real dataset storage, user authentication, actual ML model training, and a subscription-based tier system — while preserving the existing free offline learning experience.

## Glossary

- **ModelMentor**: The React/TypeScript ML education application
- **Auth_Service**: The Supabase Authentication module responsible for user identity management
- **Dataset_Storage**: The Supabase Storage service for persisting user-uploaded datasets
- **Training_Engine**: The server-side component (Supabase Edge Function) that executes actual ML model training jobs
- **Subscription_Service**: The module that manages user subscription tiers, usage tracking, and access control
- **Free_Tier**: The subscription level providing limited access at no cost (3 projects, 10 training sessions/month, 100 MB storage)
- **Pro_Tier**: The paid subscription level providing expanded access ($12/month or $99/year)
- **Enterprise_Tier**: The institutional subscription level with unlimited resources
- **Usage_Tracker**: The component that records and enforces resource consumption against tier limits
- **Offline_Mode**: The existing learning experience using synthetic/local data without requiring authentication
- **Authenticated_Mode**: The state where a user has signed in and can access backend-persisted resources
- **Training_Job**: A discrete ML model training execution submitted to the Training_Engine
- **Dataset_Bucket**: The Supabase Storage bucket designated for user dataset files
- **Compute_Budget**: The platform-wide daily limit on total training compute minutes to cap infrastructure costs
- **Rate_Limit**: A per-user daily cap on training requests to prevent abuse and cost spikes

## Requirements

### Requirement 1: Preserve Offline Learning Experience

**User Story:** As a student, I want to use ModelMentor without creating an account, so that I can learn ML concepts without friction.

#### Acceptance Criteria

1. THE ModelMentor SHALL allow unauthenticated users to access the guided tour, dataset templates, feature engineering workshop, and learning moments without requiring sign-in
2. WHILE a user is in Offline_Mode, THE ModelMentor SHALL use synthetic data and client-side training simulation for all learning activities
3. WHEN an unauthenticated user attempts to access a backend-only feature, THE ModelMentor SHALL display a prompt to sign in or sign up with a clear explanation of the benefit

### Requirement 2: User Authentication

**User Story:** As a user, I want to create an account and sign in, so that my projects and datasets persist across sessions and devices.

#### Acceptance Criteria

1. THE Auth_Service SHALL support email/password registration with email verification
2. THE Auth_Service SHALL support username/password registration where the username is converted to an internal email format
3. WHEN a user submits valid credentials, THE Auth_Service SHALL create a session and return an access token within 3 seconds
4. WHEN a user submits invalid credentials, THE Auth_Service SHALL return a descriptive error message without revealing whether the email exists
5. THE Auth_Service SHALL support password reset via email with a secure time-limited token
6. WHEN a user signs out, THE Auth_Service SHALL invalidate the current session and clear local session data
7. WHILE a user session is active, THE Auth_Service SHALL automatically refresh the access token before expiration

### Requirement 3: User Profile Management

**User Story:** As an authenticated user, I want to manage my profile information, so that my identity is represented correctly in the application.

#### Acceptance Criteria

1. WHEN a new user registers, THE Auth_Service SHALL create a profile record with default values for username, role, and avatar
2. THE ModelMentor SHALL allow authenticated users to update their username, first name, last name, and avatar
3. WHEN a profile update is submitted, THE ModelMentor SHALL validate that the username contains only letters, digits, and underscores
4. THE ModelMentor SHALL display the user profile information in the navigation header when authenticated

### Requirement 4: Dataset Storage

**User Story:** As an authenticated user, I want to upload and persist my datasets in the cloud, so that I can access them across sessions and use them for real training.

#### Acceptance Criteria

1. WHEN an authenticated user uploads a dataset file, THE Dataset_Storage SHALL store the file in the Dataset_Bucket under a path scoped to the user ID
2. THE Dataset_Storage SHALL accept CSV, JSON, and image archive (ZIP) file formats for upload
3. THE Dataset_Storage SHALL enforce a maximum file size of 50 MB per individual upload for Free_Tier users and 500 MB for Pro_Tier users
4. WHEN a dataset upload completes, THE Dataset_Storage SHALL return a persistent URL that the user can reference in future training sessions
5. THE Dataset_Storage SHALL enforce storage quota limits based on the user subscription tier (100 MB for Free_Tier, 5 GB for Pro_Tier)
6. IF a dataset upload would exceed the user storage quota, THEN THE Dataset_Storage SHALL reject the upload and return a descriptive error indicating the remaining available space
7. WHEN an authenticated user requests their datasets, THE Dataset_Storage SHALL return only datasets belonging to that user
8. THE Dataset_Storage SHALL allow authenticated users to delete their own datasets and reclaim storage quota

### Requirement 5: ML Model Training

**User Story:** As an authenticated user, I want to train ML models on my real datasets using server-side compute, so that I get accurate model performance on actual data — within predictable cost boundaries.

#### Acceptance Criteria

1. WHEN an authenticated user initiates a training job, THE Training_Engine SHALL validate the dataset, model configuration, and user quota before starting
2. THE Training_Engine SHALL support training for classification, regression, image classification, and text classification model types
3. WHILE a Training_Job is executing, THE Training_Engine SHALL report progress updates including current epoch, loss, and accuracy at each epoch boundary
4. WHEN a Training_Job completes, THE Training_Engine SHALL persist the trained model metrics (accuracy, loss, precision, recall, F1 score) to the training_sessions table
5. IF a Training_Job fails due to invalid data or configuration, THEN THE Training_Engine SHALL return a descriptive error and not count the attempt against the user usage quota
6. THE Training_Engine SHALL enforce a maximum training duration of 2 minutes per job for Free_Tier users and 10 minutes for Pro_Tier users
7. WHEN a Training_Job completes, THE Training_Engine SHALL store the resulting model artifact in a user-scoped storage path
8. THE Training_Engine SHALL limit concurrent training jobs to 1 for Free_Tier users and 2 for Pro_Tier users
9. THE Training_Engine SHALL enforce a maximum dataset size of 10,000 rows for Free_Tier users and 100,000 rows for Pro_Tier users to bound compute cost
10. THE Training_Engine SHALL enforce a maximum of 50 epochs per training job for Free_Tier users and 200 epochs for Pro_Tier users
11. IF a Training_Job exceeds its maximum duration, THEN THE Training_Engine SHALL terminate the job, return partial results if available, and notify the user with the reason for termination
12. THE Training_Engine SHALL use lightweight model architectures (shallow networks, small tree ensembles) to minimize compute cost per job

### Requirement 6: Subscription Tier Management

**User Story:** As a user, I want to choose a subscription plan that matches my needs, so that I can access the appropriate level of features and resources.

#### Acceptance Criteria

1. WHEN a new user registers, THE Subscription_Service SHALL assign the Free_Tier subscription by default
2. THE Subscription_Service SHALL support three tiers: Free_Tier, Pro_Tier, and Enterprise_Tier
3. WHEN a user selects a paid plan, THE Subscription_Service SHALL initiate a Stripe checkout session and redirect the user to complete payment
4. WHEN a Stripe payment succeeds, THE Subscription_Service SHALL upgrade the user subscription tier and record the Stripe subscription ID
5. WHEN a subscription expires or is cancelled, THE Subscription_Service SHALL downgrade the user to Free_Tier while preserving existing data
6. THE Subscription_Service SHALL provide a 14-day free trial for Pro_Tier without requiring a credit card
7. WHILE a user is on a trial, THE Subscription_Service SHALL display the remaining trial days in the application interface

### Requirement 7: Usage Tracking and Enforcement

**User Story:** As a platform operator, I want to track and enforce resource usage per user, so that the system remains sustainable and costs stay predictable.

#### Acceptance Criteria

1. THE Usage_Tracker SHALL record each resource consumption event (project creation, training session, storage upload, API call) with a timestamp, user ID, and estimated compute cost
2. WHEN a user attempts an action that would exceed their tier limit, THE Usage_Tracker SHALL block the action and display a message indicating the limit and suggesting an upgrade
3. THE Usage_Tracker SHALL reset monthly counters (training sessions, API calls) on the first day of each calendar month
4. THE ModelMentor SHALL display current usage against tier limits in the user settings or dashboard
5. WHEN a user reaches 80% of any resource limit, THE Usage_Tracker SHALL display a warning notification
6. THE Usage_Tracker SHALL enforce a platform-wide daily compute budget; IF the daily budget is exhausted, THEN THE Training_Engine SHALL queue new training jobs and notify users of the estimated wait time
7. THE Usage_Tracker SHALL log total compute minutes consumed per user per month for cost monitoring
8. WHEN a Free_Tier user exceeds 5 training sessions in a single day, THE Usage_Tracker SHALL rate-limit further training requests until the next calendar day

### Requirement 8: Subscription-Gated Feature Access

**User Story:** As a user, I want to understand which features require a paid subscription, so that I can make informed decisions about upgrading.

#### Acceptance Criteria

1. THE ModelMentor SHALL gate the following features behind Pro_Tier or higher: Kaggle dataset integration, collaboration tools, advanced visualizations, model deployment, and PDF report exports
2. WHEN an unauthenticated or Free_Tier user attempts to access a gated feature, THE ModelMentor SHALL display a contextual upgrade prompt explaining the feature benefit
3. THE ModelMentor SHALL visually indicate gated features with a badge or icon in navigation and feature cards
4. WHILE a user is on Free_Tier, THE ModelMentor SHALL allow read-only preview of gated feature descriptions

### Requirement 9: Transition Between Offline and Authenticated Modes

**User Story:** As a user who started in offline mode, I want to sign up and have my local progress preserved, so that I do not lose my learning work.

#### Acceptance Criteria

1. WHEN a user in Offline_Mode creates an account, THE ModelMentor SHALL offer to migrate locally-stored projects and datasets to the authenticated user account
2. WHEN migration is accepted, THE ModelMentor SHALL upload local datasets to Dataset_Storage and associate local projects with the new user ID
3. IF migration fails for any item, THEN THE ModelMentor SHALL report the specific failure and retain the local data intact
4. WHEN a user signs out, THE ModelMentor SHALL revert to Offline_Mode and allow continued use of local-only features
