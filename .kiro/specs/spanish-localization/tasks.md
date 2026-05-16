# Implementation Plan: Spanish Localization (Phase 1)

## Overview

Set up the react-i18next infrastructure, create English and Spanish translation files, build the language toggle component, implement the locale formatting hook, and translate the five Phase 1 pages (Project Creation, Pricing, Training, Data Collection, Testing). Property-based tests validate translation correctness properties using fast-check.

## Tasks

- [x] 1. Infrastructure setup
  - [x] 1.1 Install i18n dependencies
    - Install `i18next` and `react-i18next` as production dependencies
    - Install `fast-check` as a dev dependency for property-based testing
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create i18n configuration file
    - Create `src/i18n/config.ts` with i18next initialization
    - Implement `detectLanguage()` function that checks localStorage first, then `navigator.language`
    - Configure fallback language as English
    - Set up `languageChanged` event listener to persist to localStorage under key `modelmentor-language`
    - Disable `escapeValue` in interpolation (React handles escaping)
    - _Requirements: 1.1, 1.3, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 1.3 Create English translation file
    - Create `src/i18n/locales/en.json` with the full key structure
    - Include namespaces: `common` (nav, actions, messages), `pages` (projectCreation, pricing, training, dataCollection, testing), `datasets`, `errors`, `learning`
    - Extract all hardcoded English strings from the five Phase 1 pages into translation keys
    - Use `{{variable}}` interpolation syntax for dynamic values
    - _Requirements: 1.2, 1.3, 10.1, 10.3, 10.4_

  - [x] 1.4 Create Spanish translation file
    - Create `src/i18n/locales/es.json` with identical key structure to `en.json`
    - Provide Spanish translations for all keys
    - Ensure key parity with the English file (no missing or extra keys)
    - _Requirements: 1.2, 10.2, 10.5_

  - [x] 1.5 Import i18n config in application entry point
    - Add side-effect import `import './i18n/config'` to `src/main.tsx` before the app renders
    - _Requirements: 1.4_

- [x] 2. Language toggle component and header integration
  - [x] 2.1 Create LanguageToggle component
    - Create `src/components/LanguageToggle.tsx`
    - Use `useTranslation` hook to access `i18n` instance
    - Render a ghost button with Globe icon and current language code (EN/ES)
    - On click, toggle between `'en'` and `'es'` via `i18n.changeLanguage()`
    - Include appropriate `aria-label` that changes based on active language
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 2.2 Integrate LanguageToggle into Header
    - Modify `src/components/layouts/Header.tsx` to import and render `<LanguageToggle />` next to `<ThemeToggle />`
    - _Requirements: 3.1_

- [x] 3. Locale formatting hook
  - [x] 3.1 Create useLocaleFormat hook
    - Create `src/hooks/useLocaleFormat.ts`
    - Implement `formatCurrency(amount, currency?)` using `Intl.NumberFormat` with locale `'en-US'` or `'es-ES'`
    - Implement `formatNumber(value, options?)` using `Intl.NumberFormat`
    - Implement `formatDate(date, options?)` using `Intl.DateTimeFormat`
    - Handle edge cases: NaN values return `'—'`, invalid dates return localized fallback string
    - Memoize formatters with `useMemo` keyed on locale
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 4. Checkpoint — Verify infrastructure
  - Ensure all tests pass, ask the user if questions arise.
  - Verify that the app builds successfully with the new i18n imports
  - Verify LanguageToggle renders and switches language in the header

- [x] 5. Page translations — Project Creation
  - [x] 5.1 Translate ProjectCreationPage
    - Modify `src/pages/ProjectCreationPage.tsx` to use `useTranslation` hook
    - Replace all hardcoded strings with `t('pages.projectCreation.*')` calls
    - Replace dataset template names/descriptions with `t('datasets.templates.*')` calls
    - Use `useLocaleFormat` for any numeric displays
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 4.1, 4.2, 4.4_

- [x] 6. Page translations — Pricing
  - [x] 6.1 Translate PricingPage
    - Modify `src/pages/PricingPage.tsx` to use `useTranslation` hook
    - Replace plan names, descriptions, CTAs, and feature lists with `t()` calls
    - Replace FAQ questions and answers with `t()` calls
    - Replace billing toggle labels with `t()` calls
    - Use `useLocaleFormat.formatCurrency()` for pricing amounts
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 4.2_

- [x] 7. Page translations — Training
  - [x] 7.1 Translate TrainingPage
    - Modify `src/pages/TrainingPage.tsx` to use `useTranslation` hook
    - Replace configuration panel labels, tooltips, and descriptions with `t()` calls
    - Replace training stage indicators and progress messages with `t()` calls
    - Replace metric labels (accuracy, loss, epochs) with `t()` calls
    - Replace training log messages with `t()` calls
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 4.2_

- [x] 8. Page translations — Data Collection
  - [x] 8.1 Translate DataCollectionPage
    - Modify `src/pages/DataCollectionPage.tsx` to use `useTranslation` hook
    - Replace headings, instructions, and helper text with `t()` calls
    - Replace validation messages and warnings with `t('errors.*')` calls
    - Replace dataset column labels with `t('datasets.columns.*')` calls
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 4.2, 4.4, 4.5_

- [x] 9. Page translations — Testing
  - [x] 9.1 Translate TestingPage
    - Modify `src/pages/TestingPage.tsx` to use `useTranslation` hook
    - Replace headings, instructions, and evaluation metric labels with `t()` calls
    - Replace confusion matrix labels and prediction result descriptions with `t()` calls
    - _Requirements: 9.1, 9.2, 9.3, 4.2_

- [x] 10. Checkpoint — Verify page translations
  - Ensure all tests pass, ask the user if questions arise.
  - Verify that switching language updates all translated pages
  - Verify no hardcoded English strings remain on the five Phase 1 pages

- [ ] 11. Property-based tests
  - [ ]* 11.1 Write property test for missing key fallback
    - **Property 1: Missing key fallback**
    - For any key present in en.json but absent from a mock es.json, `t(key)` with Spanish active returns the English value
    - Use fast-check to generate random key paths from the English file and verify fallback behavior
    - **Validates: Requirements 1.5**

  - [ ]* 11.2 Write property test for language detection from navigator.language
    - **Property 2: Language detection from navigator.language**
    - For any random string, `detectLanguage()` returns `'es'` if it starts with `'es'`, otherwise `'en'`
    - Use fast-check `fc.string()` to generate arbitrary navigator.language values
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 11.3 Write property test for localStorage override
    - **Property 3: localStorage overrides browser detection**
    - For any valid stored preference (`'en'` or `'es'`) and any navigator.language value, the stored preference wins
    - **Validates: Requirements 2.4**

  - [ ]* 11.4 Write property test for language change persistence
    - **Property 4: Language change persistence**
    - For any language switch, localStorage is updated to the new language code after the change
    - **Validates: Requirements 2.5, 3.4**

  - [ ]* 11.5 Write property test for interpolation substitution
    - **Property 5: Interpolation substitution**
    - For any translation string with `{{variable}}` placeholders and any set of replacement values, the output contains each value and no remaining `{{...}}` syntax
    - **Validates: Requirements 4.6**

  - [ ]* 11.6 Write property test for translation key parity
    - **Property 6: Translation key parity**
    - The set of all leaf key paths in en.json equals the set in es.json
    - **Validates: Requirements 10.2, 10.5**

  - [ ]* 11.7 Write property test for no HTML in translation values
    - **Property 7: No HTML in translation values**
    - For any leaf value in either translation file, no HTML tag patterns (`<tag>`, `</tag>`, `<tag />`) are present
    - **Validates: Requirements 10.4**

  - [ ]* 11.8 Write property test for locale-aware formatting
    - **Property 8: Locale-aware formatting correctness**
    - For any numeric value, `formatCurrency`, `formatNumber`, and `formatDate` produce output matching direct `Intl` API calls for the active locale
    - **Validates: Requirements 11.1, 11.2, 11.3, 6.4**

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the complete i18n flow: detection → rendering → switching → persistence

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` and validate universal correctness properties from the design
- The implementation language is TypeScript (React) as specified in the design
- Translation files are statically imported (no lazy loading) since Phase 1 scope is small
