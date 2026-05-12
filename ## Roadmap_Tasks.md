## Roadmap Tasks

---

## ✅ COMPLETED SPECS

### 1. Guided Tour & Example Dataset Fix ✅
**Spec:** `.kiro/specs/guided-tour-dataset-fix/`

- [x] Added `data-tour` attributes to all pages
- [x] Fallback UI when no sample datasets available
- [x] Fixed "Use this Dataset" button for image templates
- [x] Added "Bundled" badge for templates with bundled images
- [x] Automated tests for bug conditions

### 2. Sample Dataset Generators ✅
**Spec:** `.kiro/specs/sample-dataset-generators/`

- [x] Created dataset generator utilities
- [x] Integrated with DatasetTemplatesPanel
- [x] Support for classification, regression, text datasets

### 3. Feature Engineering Workshop ✅
**Spec:** `.kiro/specs/feature-engineering-workshop/`

- [x] **Phase 1:** Core Workshop UI with transformation pipeline
- [x] **Phase 2:** Interactive visualizations (histograms, scatter plots)
- [x] **Phase 3:** Gamification (badges, achievements, progress tracking)
- [x] **Phase 4:** Educational content (tooltips, explanations, best practices)
- [x] **Phase 5:** Impact Simulator & Summary Reports

### 4. TypeScript Errors Fix ✅
**Spec:** `.kiro/specs/typescript-errors-fix/`

- [x] Fixed 15 TypeScript errors across 5 files
- [x] Added missing properties to `AssignmentCompletion` interface
- [x] Fixed AppLayout/Header component issues
- [x] Added null checks and type assertions
- [x] Installed `@types/react-modal`

### 5. Biome Lint Error Fix ✅
- [x] Fixed Button onClick handler in `ModelComparisonDashboard.tsx`
- [x] Added `isComparing` state for explicit comparison trigger
- [x] All lint checks passing

### 6. Learning Moments ✅
**Spec:** `.kiro/specs/learning-moments/`

- [x] Contextual educational content at 3 workflow points (Learn: Data, Learn: Model, Learn: Next Steps)
- [x] Three-step modal (Content → Quiz → Summary) with progress indicator
- [x] Gamification integration (50/75/100 points per moment)
- [x] Auto-open for guided tour, notification prompt for non-guided

### 7. Smart Dataset Matching ✅

- [x] Added Plant Diseases dataset for agricultural AI learning
- [x] Added Dog Breeds dataset for pet recognition projects
- [x] Added Facial Expressions dataset for emotion AI projects
- [x] Implemented smart template matching based on project description
- [x] "Best Match" badge for most relevant dataset per project
- [x] Templates sorted by relevance score, then difficulty

---

## 🔄 IN PROGRESS

### 8. Backend Subscription Integration 🚧
**Spec:** `.kiro/specs/backend-subscription-integration/`

Real backend integration with Supabase for dataset storage, authentication, ML model training, and subscription-based tiers.

#### Phase 1: Database & Services ✅
- [x] Database migrations (enum types, extended tables, RLS policies, storage buckets)
- [x] Extended subscription types with TierLimits, API interfaces
- [x] Shared utility functions (username validation, path construction, tier limits, trial calculations)
- [x] Subscription service (tier management, Stripe checkout, trial logic)
- [x] Extended usage tracking service (event-based tracking, daily rate limits, compute budget)
- [x] Dataset storage service (upload/download/delete with quota enforcement)
- [x] Training job service (job submission, validation, Realtime progress)
- [x] Migration service (offline-to-authenticated data migration)
- [x] Feature gating service (tier-based feature access control)

#### Phase 2: Edge Functions 🔜
- [ ] `train-model` — Server-side ML training with TensorFlow.js
- [ ] `create-checkout` — Stripe Checkout session creation
- [ ] `stripe-webhook` — Payment event handling (upgrade/downgrade/cancel)
- [ ] `check-usage` — Usage summary and limits API
- [ ] `migrate-local-data` — Offline project migration

#### Phase 3: Frontend Integration 🔜
- [ ] Extended AuthContext with profile management
- [ ] SubscriptionContext (tier, usage, limits, trial status)
- [ ] TrainingContext (active jobs, Realtime progress)
- [ ] Wire contexts into App shell
- [ ] Migration prompt UI (offline → authenticated)
- [ ] Feature gating UI components (FeatureGate, UpgradePrompt)

#### Phase 4: Page Wiring 🔜
- [ ] Connect training page to real backend
- [ ] Connect dataset upload to storage service
- [ ] Connect pricing page to Stripe checkout
- [ ] Add usage dashboard to settings page

---

## 🔄 SUGGESTED IMPROVEMENTS

### Code Quality & Testing
- [ ] **Increase Test Coverage** - Add more unit tests for components
- [ ] **E2E Testing** - Add Playwright/Cypress tests for critical user flows
- [ ] **Accessibility Audit** - Run axe-core and fix a11y issues

### Feature Enhancements
- [ ] **Assignment Submission** - Enable file uploads and grading

### Performance & UX
- [ ] **Code Splitting** - Lazy load heavy components (D3 visualizations)
- [ ] **Loading States** - Add skeleton loaders for async operations
- [ ] **Error Boundaries** - Wrap components with error boundaries
- [ ] **Mobile Responsiveness** - Improve mobile layout

### Documentation
- [ ] **Component Storybook** - Document UI components
- [ ] **API Documentation** - Document service layer
- [ ] **User Guide** - Create end-user documentation

---

## 📊 CURRENT STATUS

| Metric | Value |
|--------|-------|
| TypeScript Errors | 0 ✅ |
| Lint Errors | 0 ✅ |
| Tests Passing | 11/11 ✅ |
| Tests Skipped | 3 (intentional) |
| Tests Todo | 3 |
| Specs Completed | 7 ✅ |
| Specs In Progress | 1 🚧 |

---

## 📁 SPEC DOCUMENTATION

All specs are documented in `.kiro/specs/`:
- `guided-tour-dataset-fix/` - Bugfix spec ✅
- `sample-dataset-generators/` - Feature spec ✅
- `feature-engineering-workshop/` - Feature spec (5 phases) ✅
- `typescript-errors-fix/` - Bugfix spec ✅
- `learning-moments/` - Feature spec ✅
- `model-comparison-enhancement/` - Feature spec ✅
- `backend-subscription-integration/` - Feature spec 🚧 (Phase 1 complete)
