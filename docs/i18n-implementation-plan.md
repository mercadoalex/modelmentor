# Internationalization (i18n) Implementation Plan

## Overview
This document outlines the plan for implementing multi-language support (English, Spanish, Chinese) across the ModelMentor application.

## Status
**FUTURE ENHANCEMENT** - Not yet implemented

## Requirements
- Support for 3 languages: English (default), Spanish, Chinese
- Language switcher component in application header
- Persistent language preference (localStorage)
- Complete translation of all UI text, messages, and content
- Language-specific date/time formatting
- Language-specific number formatting

## Technical Approach

### Recommended Library
**react-i18next** (most popular React i18n solution)
- Built on i18next framework
- React hooks support (useTranslation)
- Namespace support for organizing translations
- Lazy loading of translation files
- TypeScript support

### Installation
```bash
pnpm add react-i18next i18next
```

## Implementation Steps

### Phase 1: Setup Infrastructure (Estimated: 5-8 actions)
1. Install i18next and react-i18next packages
2. Create i18n configuration file (`src/i18n/config.ts`)
3. Create translation file structure:
   ```
   src/i18n/
   ├── config.ts
   ├── locales/
   │   ├── en/
   │   │   ├── common.json
   │   │   ├── auth.json
   │   │   ├── dashboard.json
   │   │   ├── groups.json
   │   │   ├── projects.json
   │   │   └── ...
   │   ├── es/
   │   │   └── (same structure)
   │   └── zh/
   │       └── (same structure)
   ```
4. Initialize i18n in main.tsx
5. Create LanguageSwitcher component
6. Add LanguageSwitcher to AppLayout header

### Phase 2: Extract and Translate Content (Estimated: 40-60 actions)

#### Pages to Translate (20 pages)
- [ ] LoginPage
- [ ] EmailVerificationPage
- [ ] VerifyEmailReminderPage
- [ ] ForgotPasswordPage
- [ ] ResetPasswordPage
- [ ] ProjectCreationPage
- [ ] DataCollectionPage
- [ ] InteractiveLearningPage
- [ ] TrainingPage
- [ ] DebuggingSandboxPage
- [ ] TestingPage
- [ ] ExportPage
- [ ] TeacherResourcesPage
- [ ] BadgesPage
- [ ] TeacherDashboardPage
- [ ] StudentDetailPage
- [ ] AtRiskAlertsPage
- [ ] ReportsPage
- [ ] SchoolAdminPage
- [ ] JoinOrganizationPage

#### Components to Translate (15+ components)
- [ ] AppLayout (navigation, header, footer)
- [ ] GroupMemberManager
- [ ] ActivityLogTab
- [ ] InvitationManager
- [ ] JoinRequestManager
- [ ] All form components
- [ ] All dialog components
- [ ] All table components
- [ ] All card components

#### Content Categories
1. **Navigation & Menu Items**
   - Main navigation links
   - Dropdown menus
   - Breadcrumbs

2. **Authentication**
   - Login/signup forms
   - Password reset
   - Email verification
   - Error messages

3. **Dashboard & Overview**
   - Statistics cards
   - Chart labels
   - Action buttons

4. **Group Management**
   - Group creation/editing
   - Member management
   - Activity log
   - Invitations

5. **Project Workflow**
   - Project creation
   - Data collection
   - Training
   - Testing
   - Export

6. **Forms & Validation**
   - Field labels
   - Placeholders
   - Validation messages
   - Help text

7. **Notifications & Feedback**
   - Toast messages
   - Success messages
   - Error messages
   - Confirmation dialogs

8. **Tables & Lists**
   - Column headers
   - Empty states
   - Pagination text

9. **Dates & Times**
   - Relative timestamps ("2 hours ago")
   - Date formatting
   - Time formatting

### Phase 3: Language-Specific Formatting (Estimated: 5-10 actions)
1. Implement date formatting utilities
2. Implement number formatting utilities
3. Update all date displays to use i18n formatting
4. Update all number displays to use i18n formatting
5. Test formatting across all languages

### Phase 4: Testing & Quality Assurance (Estimated: 10-15 actions)
1. Test language switching across all pages
2. Verify all text is translated (no hardcoded strings)
3. Test language persistence
4. Verify layout doesn't break with longer translations
5. Test special characters in Chinese
6. Verify RTL support if needed
7. Test date/number formatting
8. Fix any layout issues
9. Fix any missing translations
10. Performance testing

## Translation File Structure

### Example: common.json
```json
{
  "app": {
    "name": "ModelMentor",
    "tagline": "No-Code ML Trainer"
  },
  "navigation": {
    "home": "Home",
    "dashboard": "Dashboard",
    "projects": "Projects",
    "groups": "Groups",
    "settings": "Settings"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "submit": "Submit",
    "back": "Back",
    "next": "Next"
  },
  "messages": {
    "success": "Operation completed successfully",
    "error": "An error occurred",
    "loading": "Loading...",
    "noData": "No data available"
  }
}
```

### Example: auth.json
```json
{
  "login": {
    "title": "Sign In",
    "email": "Email",
    "password": "Password",
    "submit": "Sign In",
    "forgotPassword": "Forgot password?",
    "noAccount": "Don't have an account?",
    "signUp": "Sign up"
  },
  "signup": {
    "title": "Create Account",
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "Email",
    "password": "Password",
    "role": "Role",
    "submit": "Create Account",
    "hasAccount": "Already have an account?",
    "signIn": "Sign in"
  }
}
```

## LanguageSwitcher Component Design

### Features
- Dropdown menu with language options
- Flag icons for each language (optional)
- Current language indicator
- Minimal design matching app aesthetic
- Positioned in header (top-right)

### Implementation
```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' }
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const currentLanguage = languages.find(
    (lang) => lang.code === i18n.language
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Globe className="h-4 w-4 mr-2" />
          {currentLanguage?.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Usage Example

### Before (Hardcoded)
```tsx
<Button>Save Changes</Button>
<p>No data available</p>
```

### After (Translated)
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <>
      <Button>{t('actions.save')}</Button>
      <p>{t('messages.noData')}</p>
    </>
  );
}
```

## Best Practices

1. **Use Namespaces**: Organize translations by feature/page
2. **Consistent Keys**: Use dot notation (e.g., `auth.login.title`)
3. **Avoid Concatenation**: Use interpolation instead
   ```tsx
   // Bad
   t('welcome') + ' ' + userName
   
   // Good
   t('welcome', { name: userName })
   ```
4. **Handle Plurals**: Use i18next plural support
   ```json
   {
     "items": "{{count}} item",
     "items_plural": "{{count}} items"
   }
   ```
5. **Context Support**: Use context for gender/formality
6. **Lazy Loading**: Load translations on demand for better performance
7. **Fallback Language**: Always have English as fallback
8. **Type Safety**: Use TypeScript for translation keys

## Estimated Effort

### Total Actions: 60-90 actions
- Phase 1 (Setup): 5-8 actions
- Phase 2 (Translation): 40-60 actions
- Phase 3 (Formatting): 5-10 actions
- Phase 4 (Testing): 10-15 actions

### Timeline Estimate
- With focused effort: 2-3 dedicated sessions
- Spread out: 1-2 weeks

## Translation Services

For professional translations, consider:
- **Google Translate API** (automated, needs review)
- **DeepL API** (higher quality automated)
- **Professional translators** (highest quality)
- **Crowdin/Lokalise** (translation management platforms)

## Testing Checklist

- [ ] All pages display correctly in all languages
- [ ] No hardcoded strings remain
- [ ] Language preference persists across sessions
- [ ] Date/time formatting works correctly
- [ ] Number formatting works correctly
- [ ] Layout doesn't break with long translations
- [ ] Special characters display correctly (Chinese)
- [ ] Language switcher is accessible
- [ ] Performance is acceptable
- [ ] All error messages are translated
- [ ] All validation messages are translated
- [ ] All toast notifications are translated

## Future Enhancements

- Add more languages (French, German, Japanese, etc.)
- Implement RTL support for Arabic/Hebrew
- Add language detection based on browser settings
- Implement translation management system
- Add translation coverage reporting
- Implement A/B testing for translations

## Notes

- This is a **major feature** requiring dedicated time and resources
- Recommend implementing during a dedicated sprint/phase
- Consider starting with most-used pages first
- Plan for ongoing translation maintenance
- Budget for professional translation services if needed

## References

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [React i18n Best Practices](https://react.i18next.com/latest/using-with-hooks)
