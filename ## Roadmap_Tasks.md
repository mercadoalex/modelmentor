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

- [x] Contextual educational content at 3 workflow points
- [x] Three-step modal (Content → Quiz → Summary) with progress indicator
- [x] Gamification integration (50/75/100 points per moment)
- [x] Auto-open for guided tour, notification prompt for non-guided

### 7. Smart Dataset Matching ✅

- [x] Added Plant Diseases, Dog Breeds, Facial Expressions datasets
- [x] Smart template matching based on project description
- [x] "Best Match" badge for most relevant dataset per project
- [x] Templates sorted by relevance score, then difficulty

### 8. Backend Subscription Integration ✅
**Spec:** `.kiro/specs/backend-subscription-integration/`

- [x] **Phase 1:** Database & Services (migrations, types, utilities, 6 services)
- [x] **Phase 2:** Edge Functions (train-model, create-checkout, stripe-webhook, check-usage, migrate-local-data)
- [x] **Phase 3:** Frontend Contexts (AuthContext, SubscriptionContext, TrainingContext, MigrationPrompt, FeatureGate, UpgradePrompt)
- [x] **Phase 4:** Page Wiring (TrainingPage, DataCollectionPage, PricingPage, SettingsPage)

### 9. Guided Tour UX Fixes ✅

- [x] Fixed repeated "Failed to save dataset" toast (infinite loop bug)
- [x] Removed auto-advance — student clicks "Continue" when ready
- [x] Matched guided tour dataset to project description
- [x] Cleaned upload area (single CSV summary instead of 36 SVG files)
- [x] Fixed "Continue to Learning" button disabled for synthetic datasets
- [x] Auto-scroll to data preview after dataset loads
- [x] Fixed model type detection for "facial expressions" (facial ≠ face)
- [x] Fixed timing bug in autoSelectSyntheticTemplate (stale state)

### 10. Interactive Learning Variety ✅
**Spec:** `.kiro/specs/interactive-learning-variety/`

- [x] 5 interactive learning components (Quiz, Matching, Fill in Blanks, Flash Cards, Sorting)
- [x] Random component selection with content availability checks
- [x] Component registry with lazy loading and error boundary
- [x] Content authored for all 12 learning moments (4 model types × 3 stages)
- [x] Same gamification points regardless of component type
- [x] Click-to-select interaction (accessible, mobile-friendly)

### 11. Educational Enhancements ✅

- [x] Validation tab: "What does this score mean?" explanation (Excellent/Good/Fair/Poor)
- [x] Engineering tab: "Why this helps" explanation for each transformation type
- [x] Engineering tab: "What is Feature Engineering?" intro section
- [x] Training page: Immediate visual feedback with spinner + step-by-step logs

### 12. Production Bug Fixes ✅

- [x] Fixed Training page crash (`datasets.project_id` column missing in production)
- [x] Applied migration to production Supabase (`ALTER TABLE datasets ADD COLUMN project_id`)

---

## ✅ DEPLOYMENT

### 13. Domain & Deployment ✅

- [x] Domain registered on AWS Route 53 (`modelmentor.link`)
- [x] Cloudflare Pages project created and connected
- [x] Registrar nameservers updated to Cloudflare
- [x] Cloudflare zone activated
- [x] Custom domain `modelmentor.link` connected
- [x] All code merged to master and deployed

---

## 🔄 PENDING TASKS

### Production Database Migrations
The following migrations exist locally but haven't been fully applied to production Supabase yet:

- [ ] Run remaining parts of `00064_subscription_integration_schema.sql` (enum types, usage_events, platform_config, daily_compute_usage, training_sessions extensions)
- [ ] Run `00065_subscription_rls_policies.sql` (Row-Level Security)
- [ ] Run `00066_create_storage_buckets.sql` (user-datasets, model-artifacts buckets)
- [ ] Deploy Edge Functions to Supabase (train-model, create-checkout, stripe-webhook, check-usage, migrate-local-data)
- [ ] Configure Stripe API keys in Supabase Edge Function secrets
- [ ] Configure Stripe webhook endpoint URL

### Stripe Setup
- [ ] Create Stripe account and get API keys
- [ ] Create price IDs for Pro monthly/yearly and Enterprise yearly
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Supabase secrets

---

## 🔄 SUGGESTED IMPROVEMENTS

### Code Quality & Testing
- [ ] **Property-Based Tests** - Add fast-check tests for subscription utilities and learning evaluators
- [ ] **Increase Test Coverage** - Add more unit tests for components
- [ ] **E2E Testing** - Add Playwright/Cypress tests for critical user flows
- [ ] **Accessibility Audit** - Run axe-core and fix a11y issues

### Feature Enhancements
- [ ] **Assignment Submission** - Enable file uploads and grading
- [ ] **Real ML Training** - Deploy Edge Functions for actual server-side training
- [ ] **Collaboration Features** - Real-time project sharing between students

### Performance & UX
- [ ] **Code Splitting** - Lazy load heavy components (D3 visualizations)
- [ ] **Loading States** - Add skeleton loaders for async operations
- [ ] **Error Boundaries** - Wrap more components with error boundaries
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
| Specs Completed | 12 ✅ |
| Domain | modelmentor.link ✅ |
| Deployment | Cloudflare Pages ✅ |
| Production DB | Partially migrated ⚠️ |

---

## 📁 SPEC DOCUMENTATION

All specs documented in `.kiro/specs/`:
- `guided-tour-dataset-fix/` - Bugfix spec ✅
- `sample-dataset-generators/` - Feature spec ✅
- `feature-engineering-workshop/` - Feature spec (5 phases) ✅
- `typescript-errors-fix/` - Bugfix spec ✅
- `learning-moments/` - Feature spec ✅
- `model-comparison-enhancement/` - Feature spec ✅
- `backend-subscription-integration/` - Feature spec (4 phases) ✅
- `interactive-learning-variety/` - Feature spec ✅
