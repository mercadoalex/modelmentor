# Implementation Plan: Backend Subscription Integration

## Overview

This plan implements backend-powered ML training, persistent dataset storage, user authentication enhancements, and a tiered subscription system for ModelMentor. Tasks are organized in logical phases that build incrementally: database schema first, then core services, edge functions, frontend contexts, and finally integration wiring. Each task references specific requirements for traceability.

## Tasks

- [x] 1. Database schema and storage setup
  - [x] 1.1 Create migration for enum types and extended tables
    - Create `supabase/migrations/00064_subscription_integration_schema.sql`
    - Define enum types: `subscription_tier`, `subscription_status`, `resource_type`, `training_status`, `model_type`
    - Alter `user_subscriptions` table to add `trial_ends_at`, `current_period_start`, `current_period_end`, `cancelled_at` columns and migrate `tier`/`status` to enum types
    - Create `usage_events` table (replacing `usage_tracking` for new event-based tracking) with index on `(user_id, resource_type, created_at)`
    - Extend `datasets` table with `file_size_bytes`, `file_format`, `row_count`, `user_id` columns
    - Extend `training_sessions` table with `user_id`, `dataset_id`, `config`, `current_epoch`, `precision_score`, `recall_score`, `f1_score`, `model_artifact_url`, `compute_minutes`, `error_message`, `started_at`, `completed_at` columns
    - Create `platform_config` table and seed with daily compute budget
    - Create `daily_compute_usage` table
    - _Requirements: 4.1, 5.4, 6.1, 6.2, 7.1, 7.6_

  - [x] 1.2 Create migration for Row-Level Security policies
    - Create `supabase/migrations/00065_subscription_rls_policies.sql`
    - Enable RLS on `user_subscriptions`, `usage_events`, `datasets`, `training_sessions`
    - Create policies: users read own subscription, users read own usage, users manage own datasets, users read own training sessions
    - Add service-role bypass policies for edge functions to insert usage events and update training sessions
    - _Requirements: 4.7, 7.1_

  - [x] 1.3 Create Supabase storage buckets configuration
    - Create `supabase/migrations/00066_create_storage_buckets.sql`
    - Create `user-datasets` bucket (private, RLS via user_id path prefix)
    - Create `model-artifacts` bucket (private, RLS via user_id path prefix)
    - Add storage policies: users can upload/read/delete files under their own `user_id/` prefix
    - _Requirements: 4.1, 4.7, 4.8, 5.7_

- [x] 2. Core types and tier configuration
  - [x] 2.1 Extend subscription types and tier limits
    - Update `src/types/subscription.ts` to add `trial_ends_at`, `current_period_start`, `current_period_end`, `cancelled_at` to `UserSubscription`
    - Add `'past_due'` to `SubscriptionStatus` type
    - Add new interfaces: `UsageEvent`, `TrainingConfig`, `TrainModelRequest`, `TrainModelResponse`, `CheckUsageResponse`, `ApiError`
    - Replace `DEFAULT_LIMITS` with the expanded `TIER_LIMITS` configuration from the design (including `max_file_size_mb`, `max_training_duration_seconds`, `max_dataset_rows`, `max_epochs`, `max_concurrent_jobs`, `max_daily_training_requests`)
    - _Requirements: 5.6, 5.8, 5.9, 5.10, 6.2, 7.8, 8.1_

  - [x] 2.2 Create shared utility functions
    - Create `src/utils/subscriptionUtils.ts`
    - Implement `usernameToEmail(username: string): string` — converts username to internal email format
    - Implement `emailToUsername(email: string): string` — extracts username from internal email
    - Implement `validateUsername(username: string): boolean` — validates against `^[a-zA-Z0-9_]+$`
    - Implement `buildUserScopedPath(userId: string, resourceId: string, extension?: string): string` — constructs storage paths
    - Implement `validateFileFormat(fileName: string): boolean` — checks csv/json/zip extensions
    - Implement `checkTierLimit(tier, resourceType, currentUsage, requestedAmount): { allowed, remaining }`
    - Implement `calculateTrialDaysRemaining(trialEndsAt: string): number`
    - Implement `shouldShowWarning(currentUsage, tierLimit): boolean` — returns true at ≥80%
    - Implement `isComputeBudgetExhausted(dailyConsumption, dailyBudgetLimit): boolean`
    - _Requirements: 2.2, 3.3, 4.1, 4.2, 4.3, 5.7, 6.7, 7.5, 7.6_

  - [ ]* 2.3 Write property tests for username utilities
    - **Property 1: Username-to-email round trip**
    - **Property 2: Username validation correctness**
    - **Validates: Requirements 2.2, 3.3**

  - [ ]* 2.4 Write property tests for path construction and file validation
    - **Property 3: User-scoped path construction**
    - **Property 4: File format validation**
    - **Validates: Requirements 4.1, 4.2, 5.7**

  - [ ]* 2.5 Write property tests for tier limit enforcement
    - **Property 5: Tier-based limit enforcement**
    - **Validates: Requirements 4.3, 4.5, 5.6, 5.8, 5.9, 5.10**

  - [ ]* 2.6 Write property tests for trial duration and warning threshold
    - **Property 8: Trial duration arithmetic**
    - **Property 11: Warning threshold at 80%**
    - **Validates: Requirements 6.6, 6.7, 7.5**

  - [ ]* 2.7 Write property test for compute budget enforcement
    - **Property 12: Platform compute budget enforcement**
    - **Validates: Requirements 7.6**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Backend services
  - [x] 4.1 Create subscription service
    - Create `src/services/subscriptionService.ts`
    - Implement `getSubscription(userId): Promise<UserSubscription | null>` — fetches current subscription including trial status
    - Implement `getTier(userId): Promise<SubscriptionTier>` — returns tier with trial awareness
    - Implement `getTrialStatus(userId): Promise<{ isOnTrial, daysRemaining }>` — checks trial_ends_at
    - Implement `createCheckoutSession(tier, billingPeriod, successUrl, cancelUrl): Promise<{ checkoutUrl, sessionId }>` — calls create-checkout edge function
    - Implement `handleSubscriptionChange(userId, newTier, stripeData): Promise<void>` — updates subscription record
    - Implement `cancelSubscription(userId): Promise<void>` — marks subscription as cancelled, sets tier to free
    - Implement `startTrial(userId): Promise<void>` — sets trial_ends_at to 14 days from now
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 4.2 Extend usage tracking service
    - Update `src/services/usageTrackingService.ts`
    - Add `trackEvent(userId, resourceType, amount, computeMinutes?, metadata?): Promise<void>` — inserts into `usage_events`
    - Add `getMonthlyUsageSummary(userId): Promise<UsageSummary>` — aggregates from `usage_events` for current month only
    - Add `getDailyTrainingCount(userId): Promise<number>` — counts today's training events for rate limiting
    - Add `checkDailyRateLimit(userId, tier): Promise<{ allowed, reason? }>` — enforces 5/day for free tier
    - Add `getComputeBudgetStatus(): Promise<{ available, consumedMinutes, limitMinutes }>` — reads `daily_compute_usage` and `platform_config`
    - Update `canPerformAction` to use new `usage_events` table and include daily rate limit checks
    - Add `getWarnings(userId): Promise<Array<{ resource, percentUsed }>>` — returns resources at ≥80%
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ]* 4.3 Write property tests for usage tracking logic
    - **Property 9: Usage event completeness**
    - **Property 10: Monthly usage scoping**
    - **Property 13: Daily rate limiting for free tier**
    - **Validates: Requirements 7.1, 7.3, 7.7, 7.8**

  - [x] 4.4 Create dataset storage service
    - Create `src/services/datasetStorageService.ts`
    - Implement `uploadDataset(file, userId, projectId?): Promise<{ url, datasetId }>` — validates format/size, uploads to `user-datasets` bucket, inserts dataset record
    - Implement `validateUpload(file, tier): { valid, error? }` — checks file format, size against tier limit
    - Implement `getStorageUsed(userId): Promise<number>` — sums `file_size_bytes` from datasets table
    - Implement `checkStorageQuota(userId, tier, newFileSize): { allowed, remaining }` — enforces tier storage limits
    - Implement `listDatasets(userId): Promise<Dataset[]>` — returns user's datasets
    - Implement `deleteDataset(datasetId, userId): Promise<void>` — removes file from storage and record from DB
    - Implement `getDatasetUrl(datasetId, userId): Promise<string>` — returns signed URL for dataset access
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 4.5 Create training job service
    - Create `src/services/trainingJobService.ts`
    - Implement `submitTrainingJob(request: TrainModelRequest, userId): Promise<TrainModelResponse>` — validates quota, calls train-model edge function
    - Implement `validateTrainingRequest(request, userId, tier): { valid, errors }` — checks epochs, dataset rows, concurrent jobs against tier limits
    - Implement `getTrainingSession(sessionId): Promise<TrainingSession>` — fetches session with metrics
    - Implement `listTrainingSessions(userId, projectId?): Promise<TrainingSession[]>` — lists user's sessions
    - Implement `subscribeToProgress(sessionId, callback): () => void` — subscribes to Realtime channel `training:{sessionId}`
    - Implement `pollTrainingStatus(sessionId): Promise<TrainingSession>` — fallback polling when Realtime disconnects
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.8, 5.9, 5.10_

  - [ ]* 4.6 Write property test for failed training quota preservation
    - **Property 6: Failed training jobs do not consume quota**
    - **Validates: Requirements 5.5**

  - [x] 4.7 Create migration service
    - Create `src/services/migrationService.ts`
    - Implement `migrateLocalData(projects, userId): Promise<MigrateLocalDataResponse>` — calls migrate-local-data edge function
    - Implement `getLocalProjects(): Project[]` — reads projects from localStorage/IndexedDB
    - Implement `clearLocalData(): void` — removes migrated data from local storage
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 4.8 Write property tests for migration
    - **Property 15: Migration preserves all projects**
    - **Property 16: Migration failure isolation**
    - **Validates: Requirements 9.2, 9.3**

  - [x] 4.9 Create feature gating service
    - Create `src/services/featureGatingService.ts`
    - Implement `hasFeatureAccess(tier, featureName): boolean` — checks tier's feature configuration map
    - Implement `getGatedFeatures(tier): string[]` — returns list of features not available on current tier
    - Implement `getUpgradePrompt(featureName): { title, description, suggestedTier }` — returns contextual upgrade messaging
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 4.10 Write property test for feature gating
    - **Property 14: Feature gating by tier**
    - **Validates: Requirements 8.1**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Supabase Edge Functions
  - [x] 6.1 Implement train-model edge function
    - Create `supabase/functions/train-model/index.ts`
    - Authenticate user from Authorization header
    - Validate request body (dataset_id, model_type, config)
    - Check user tier and usage quota (monthly sessions, concurrent jobs, daily rate limit)
    - Check platform compute budget from `daily_compute_usage`
    - If budget exhausted, return 503 with queue status
    - Fetch dataset from storage, validate row count against tier limit
    - Validate epochs against tier limit
    - Insert `training_sessions` record with status 'running'
    - Execute lightweight training loop (TensorFlow.js or simple algorithms)
    - Broadcast progress via Realtime channel at each epoch
    - On completion: persist metrics, upload model artifact, update session status, increment usage
    - On failure: update session with error, do NOT increment usage counter
    - On timeout: terminate, return partial results, update session with 'timeout' status
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 7.6_

  - [x] 6.2 Implement create-checkout edge function
    - Create `supabase/functions/create-checkout/index.ts`
    - Authenticate user from Authorization header
    - Accept tier ('pro' | 'enterprise') and billing_period ('monthly' | 'yearly')
    - Look up or create Stripe customer for user
    - Create Stripe Checkout Session with appropriate price ID
    - Return checkout URL and session ID
    - _Requirements: 6.3_

  - [x] 6.3 Implement stripe-webhook edge function
    - Create `supabase/functions/stripe-webhook/index.ts`
    - Verify Stripe webhook signature using endpoint secret
    - Handle events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
    - On successful payment: upgrade user tier, set period dates, store stripe IDs
    - On cancellation/deletion: downgrade to free tier, preserve data
    - On payment failure: set status to 'past_due'
    - Implement idempotency via event ID deduplication
    - _Requirements: 6.4, 6.5_

  - [ ]* 6.4 Write property test for subscription state transitions
    - **Property 7: Subscription state transitions**
    - **Validates: Requirements 6.4, 6.5**

  - [x] 6.5 Implement check-usage edge function
    - Create `supabase/functions/check-usage/index.ts`
    - Authenticate user from Authorization header
    - Query user subscription (tier, status, trial info)
    - Aggregate monthly usage from `usage_events`
    - Fetch compute budget status from `daily_compute_usage` and `platform_config`
    - Return `CheckUsageResponse` with tier, usage, limits, compute budget, trial days remaining
    - _Requirements: 7.1, 7.4, 7.6, 7.7_

  - [x] 6.6 Implement migrate-local-data edge function
    - Create `supabase/functions/migrate-local-data/index.ts`
    - Authenticate user from Authorization header
    - Accept array of projects with optional dataset content (base64)
    - For each project: create project record, upload dataset if present, associate with user
    - Track successes and failures independently (partial failure allowed)
    - Return `MigrateLocalDataResponse` with migrated count and failure details
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend contexts and integration
  - [x] 8.1 Extend AuthContext with profile management
    - Update `src/contexts/AuthContext.tsx`
    - Add `updateProfile(updates: Partial<Profile>): Promise<void>` method
    - Add `isAuthenticated: boolean` computed property
    - Add `isOfflineMode: boolean` computed property (true when no session)
    - Ensure `signUp` creates a default subscription record (free tier) via database trigger or post-signup call
    - Add username validation using `validateUsername` utility before signup
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.6, 2.7, 3.1, 3.2, 3.3, 9.4_

  - [x] 8.2 Create SubscriptionContext
    - Create `src/contexts/SubscriptionContext.tsx`
    - Provide: `tier`, `status`, `isOnTrial`, `trialDaysRemaining`, `usage`, `limits`, `warnings`
    - Fetch subscription and usage data on mount and after relevant actions
    - Implement `checkCanPerform(resourceType): { allowed, reason }` for UI-level gating
    - Implement `initiateCheckout(tier, billingPeriod): Promise<void>` — redirects to Stripe
    - Implement `refreshUsage(): Promise<void>` — re-fetches usage summary
    - Show warning notifications when resources hit 80% threshold
    - _Requirements: 6.1, 6.2, 6.6, 6.7, 7.2, 7.4, 7.5, 8.2_

  - [x] 8.3 Create TrainingContext
    - Create `src/contexts/TrainingContext.tsx`
    - Provide: `activeJobs`, `jobHistory`, `currentProgress`
    - Implement `startTraining(request): Promise<TrainModelResponse>` — submits job via trainingJobService
    - Subscribe to Realtime progress updates for active jobs
    - Implement fallback polling when Realtime disconnects
    - Track job completion and update history
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.11_

  - [x] 8.4 Wire contexts into App shell
    - Update `src/App.tsx` to wrap with `SubscriptionProvider` and `TrainingProvider` (inside `AuthProvider`)
    - Ensure contexts are only active when user is authenticated
    - Add graceful degradation: if Supabase unreachable, fall back to offline mode with banner
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 8.5 Implement offline-to-authenticated migration flow
    - Create `src/components/MigrationPrompt.tsx`
    - Show migration prompt when user signs up and local projects exist
    - Call `migrationService.migrateLocalData()` on acceptance
    - Display per-item success/failure results
    - Retain local data for failed items
    - Clear local data for successfully migrated items
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 8.6 Implement feature gating UI components
    - Create `src/components/common/FeatureGate.tsx` — wrapper component that checks tier access
    - Create `src/components/common/UpgradePrompt.tsx` — contextual upgrade dialog
    - Add gated feature badge/icon to navigation items and feature cards
    - Show read-only preview of gated feature descriptions for free tier
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Integration wiring and final validation
  - [ ] 10.1 Connect training page to real backend
    - Update `src/pages/TrainingPage.tsx` to use `TrainingContext` when authenticated
    - Show real-time progress from Realtime subscription
    - Display actual metrics on completion
    - Fall back to simulated training in offline mode
    - Show quota/limit errors with upgrade prompts
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.11, 1.2_

  - [ ] 10.2 Connect dataset upload to storage service
    - Update dataset upload components to use `datasetStorageService` when authenticated
    - Validate file format and size before upload
    - Show storage quota usage and remaining space
    - Display error with remaining space when quota exceeded
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 10.3 Connect pricing page to Stripe checkout
    - Update `src/pages/PricingPage.tsx` to use `SubscriptionContext.initiateCheckout()`
    - Display current tier, trial status, and usage summary
    - Show trial days remaining when on trial
    - Handle checkout success/cancel redirects
    - _Requirements: 6.3, 6.6, 6.7_

  - [ ] 10.4 Add usage dashboard to settings
    - Update `src/pages/SettingsPage.tsx` to display current usage vs tier limits
    - Show progress bars for each resource type
    - Highlight resources at ≥80% with warning styling
    - Include upgrade CTA when limits are approached
    - _Requirements: 7.2, 7.4, 7.5_

  - [ ]* 10.5 Write integration tests for auth and subscription flow
    - Test signup → profile creation → subscription assignment → signout
    - Test trial start → trial expiry → downgrade
    - Test checkout → webhook → tier upgrade
    - _Requirements: 2.1, 2.6, 6.1, 6.3, 6.4, 6.5_

  - [ ]* 10.6 Write integration tests for training and storage
    - Test dataset upload → quota check → training submission → progress → completion
    - Test quota exceeded scenarios return proper errors
    - Test failed training does not consume quota
    - _Requirements: 4.1, 4.5, 5.1, 5.4, 5.5_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses Vitest for testing; `fast-check` should be installed for property-based tests (`npm install -D fast-check`)
- Edge functions use Deno runtime with `jsr:@supabase/supabase-js@2` import pattern (matching existing functions)
- All database changes are additive migrations that preserve existing data
