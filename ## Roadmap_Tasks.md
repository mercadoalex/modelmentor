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

### 8. Backend Subscription Integration ✅
**Spec:** `.kiro/specs/backend-subscription-integration/`

- [x] **Phase 1:** Database & Services (migrations, types, utilities, 6 services)
- [x] **Phase 2:** Edge Functions (train-model, create-checkout, stripe-webhook, check-usage, migrate-local-data)
- [x] **Phase 3:** Frontend Contexts (AuthContext extended, SubscriptionContext, TrainingContext, MigrationPrompt, FeatureGate, UpgradePrompt)
- [x] **Phase 4:** Page Wiring (TrainingPage, DataCollectionPage, PricingPage, SettingsPage usage dashboard)

---

## 🔄 IN PROGRESS

### 9. Domain & Deployment ⏳

- [x] Domain registered on AWS Route 53 (`modelmentor.link`)
- [x] Cloudflare Pages project created
- [x] Registrar nameservers updated to Cloudflare (`meadow.ns.cloudflare.com`, `tanner.ns.cloudflare.com`)
- [x] Deleted orphaned Route 53 hosted zone
- [ ] **Waiting:** `.link` TLD registry propagation (AWS → Cloudflare NS update, typically 30-120 min)
- [ ] Cloudflare zone activation (auto-verifies once registry propagates)
- [ ] Add custom domain `modelmentor.link` in Cloudflare Pages
- [ ] Add custom domain `www.modelmentor.link` in Cloudflare Pages
- [ ] Verify site is live at `https://modelmentor.link`

**Verification command:**
```bash
dig modelmentor.link NS @ns10.trs-dns.info +short
# Should return: meadow.ns.cloudflare.com / tanner.ns.cloudflare.com
```

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
| Specs Completed | 8 ✅ |
| Domain | ⏳ Pending DNS propagation |

---

## 📁 SPEC DOCUMENTATION

All specs are documented in `.kiro/specs/`:
- `guided-tour-dataset-fix/` - Bugfix spec ✅
- `sample-dataset-generators/` - Feature spec ✅
- `feature-engineering-workshop/` - Feature spec (5 phases) ✅
- `typescript-errors-fix/` - Bugfix spec ✅
- `learning-moments/` - Feature spec ✅
- `model-comparison-enhancement/` - Feature spec ✅
- `backend-subscription-integration/` - Feature spec ✅
