---
description: "Upgrade the AEOS translation engine: consolidate backend locale handling, build proper JSON translation files per package, create a robust useT() hook, replace hardcoded strings with translation keys, and unify the language switcher across tenant and platform pages."
agent: "AEOS Frontend Engineer"
argument-hint: "Specify which module/package to translate first, or 'all' for full sweep"
---

# Translation Engine Upgrade — Full i18n for AEOS

## Objective

Transform the current translation system from a fragile Google-Translate-DOM-mutation hack into a **proper, professional i18n architecture** that:

1. Uses **static JSON translation files** per locale per package (not runtime Google Translate API calls)
2. Provides a **`t()` function** that components call explicitly (not MutationObserver DOM rewriting)
3. Consolidates the **3 duplicate locale-switching mechanisms** into one
4. Extends the backend to **load and merge package-level translation files**
5. Makes **every UI string** translatable with proper keys
6. Supports **RTL layouts** natively
7. Preserves the **BusinessGlossary** as a source-of-truth for domain terms (HR, ERP, etc.)

---

## Current State Analysis

### What Exists (Backend)

| Component | Location | Status |
|-----------|----------|--------|
| `SetLocale` middleware | `packages/aero-core/src/Http/Middleware/SetLocale.php` | ✅ Working — 9 locales, priority: query → session → cookie → user → browser → default |
| `SetLocale` middleware (duplicate) | `packages/aero-platform/src/Http/Middleware/SetLocale.php` | ⚠️ Duplicate — consolidate to aero-core |
| `SetLocale` middleware (CMS) | `packages/aero-cms/src/Http/Middleware/SetLocale.php` | ⚠️ Separate CMS version for public URL prefix routing |
| `LocaleController` | `packages/aero-core/src/Http/Controllers/Api/LocaleController.php` | ✅ Full API with `getAllTranslations()` — but references `App\Http\Middleware\SetLocale` (wrong namespace) |
| `LocaleController` (duplicate) | `packages/aero-platform/src/Http/Controllers/Api/LocaleController.php` | ⚠️ Exact copy — delete and use aero-core version |
| Inline locale route | `packages/aero-core/routes/web.php` (line ~296) | ⚠️ Inline closure duplicating LocaleController logic — extract to controller |
| `HandleInertiaRequests` | `packages/aero-core/src/Http/Middleware/HandleInertiaRequests.php` | ✅ Shares `locale` and `translations` props (JSON file loading) |
| `translatable.php` config | `aeos365/config/translatable.php` | ⚠️ Only `['en']` — needs all 9 locales |
| `app.php` config | `aeos365/config/app.php` | `locale` = 'en', `fallback_locale` = 'en' ✅ |

**Supported locales (defined in SetLocale):** `en`, `bn`, `ar`, `es`, `fr`, `de`, `hi`, `zh-CN`, `zh-TW`

### What Exists (Frontend)

| Component | Location | Lines | Status |
|-----------|----------|-------|--------|
| `TranslationContext.jsx` | `packages/aero-ui/resources/js/Context/TranslationContext.jsx` | 399 | ⚠️ Uses Google Translate API (`translate.googleapis.com`) for runtime translation. Works but fragile, slow, rate-limited, and produces inaccurate domain translations |
| `BusinessGlossary.js` | `packages/aero-ui/resources/js/Context/BusinessGlossary.js` | 1863 | ✅ Excellent curated domain translations for 9 locales — KEEP and extend |
| `GlobalAutoTranslator.jsx` | `packages/aero-ui/resources/js/Context/GlobalAutoTranslator.jsx` | ~200 | ⚠️ DOM MutationObserver that walks text nodes and translates them. Causes flicker, breaks React reconciliation, and translates things that shouldn't be translated |
| `LanguageSwitcher.jsx` | `packages/aero-ui/resources/js/Components/LanguageSwitcher.jsx` | ~290 | ✅ Tenant-side language switcher (Popover, flag icons, 9 locales) — but NOT used in any layout |
| `LanguageSelector.jsx` | `packages/aero-ui/resources/js/Components/Platform/LanguageSelector.jsx` | ~330 | ⚠️ Separate system for Platform pages (3 locales only, own context, hardcoded translations) — merge with main system |
| `App.jsx` layout | `packages/aero-ui/resources/js/Layouts/App.jsx` | — | ✅ Wraps with `<TranslationProvider>` + `<GlobalAutoTranslator>` |

### Critical Gaps

1. **No JSON translation files exist** — `lang/en.json`, `lang/bn.json`, etc. are completely missing. The `getTranslations()` in HandleInertiaRequests loads nothing.
2. **Zero pages use `t()` or `useTranslation()`** — Every page has hardcoded English strings. The only translation comes from GlobalAutoTranslator's DOM mutation.
3. **No package-level lang files** — `packages/aero-hrm/resources/lang/` doesn't exist for any package.
4. **LanguageSwitcher is not in any layout** — It exists as a component but is never rendered in Header or Sidebar.
5. **Platform pages use a separate `LanguageProvider`** with only 3 locales (en, es, fr) and its own hardcoded translation object.
6. **Google Translate API is called freely** — No API key, no rate limiting, relies on free `client=gtx` endpoint that can be blocked.
7. **Locale route duplicated 3 times** — Inline closure in `web.php`, `LocaleController` in aero-core, `LocaleController` in aero-platform.
8. **Backend controllers use hardcoded messages** — Most response messages are English strings like `'Success'`, `'Failed to fetch data'`, not `__('messages.success')`.

---

## Implementation Phases

### Phase 1 — Backend: Consolidate Locale Infrastructure

**Goal:** Single source of truth for locale switching, translation loading, and configuration.

#### 1A — Fix `translatable.php` config

```php
// aeos365/config/translatable.php  (OR packages/aero-core/config/translatable.php)
'locales' => ['en', 'bn', 'ar', 'es', 'fr', 'de', 'hi', 'zh-CN', 'zh-TW'],
```

#### 1B — Delete duplicate LocaleController

- **DELETE** `packages/aero-platform/src/Http/Controllers/Api/LocaleController.php`
- **KEEP** `packages/aero-core/src/Http/Controllers/Api/LocaleController.php`
- **FIX** the import: change `use App\Http\Middleware\SetLocale;` → `use Aero\Core\Http\Middleware\SetLocale;`

#### 1C — Remove inline locale route from `web.php`

Delete the inline closure at `packages/aero-core/routes/web.php` lines ~295-310 and replace with a proper controller route:

```php
// Replace inline closure with:
Route::post('/locale', [\Aero\Core\Http\Controllers\Api\LocaleController::class, 'update'])
    ->name('core.locale.update');
```

#### 1D — Delete duplicate SetLocale middleware

- **DELETE** `packages/aero-platform/src/Http/Middleware/SetLocale.php`
- **KEEP** `packages/aero-core/src/Http/Middleware/SetLocale.php` (the complete one with 9 locales)
- **KEEP** `packages/aero-cms/src/Http/Middleware/SetLocale.php` only if it has CMS-specific URL prefix logic; otherwise delete and reuse core

#### 1E — Create a locale config file in aero-core

```php
// packages/aero-core/config/locales.php
<?php

return [
    'supported' => ['en', 'bn', 'ar', 'es', 'fr', 'de', 'hi', 'zh-CN', 'zh-TW'],

    'default' => 'en',
    'fallback' => 'en',

    'rtl' => ['ar', 'he', 'fa', 'ur'],

    'names' => [
        'en' => ['name' => 'English', 'native' => 'English', 'flag' => 'us'],
        'bn' => ['name' => 'Bengali', 'native' => 'বাংলা', 'flag' => 'bd'],
        'ar' => ['name' => 'Arabic', 'native' => 'العربية', 'flag' => 'sa'],
        'es' => ['name' => 'Spanish', 'native' => 'Español', 'flag' => 'es'],
        'fr' => ['name' => 'French', 'native' => 'Français', 'flag' => 'fr'],
        'de' => ['name' => 'German', 'native' => 'Deutsch', 'flag' => 'de'],
        'hi' => ['name' => 'Hindi', 'native' => 'हिन्दी', 'flag' => 'in'],
        'zh-CN' => ['name' => 'Chinese (Simplified)', 'native' => '简体中文', 'flag' => 'cn'],
        'zh-TW' => ['name' => 'Chinese (Traditional)', 'native' => '繁體中文', 'flag' => 'tw'],
    ],
];
```

Update `SetLocale` middleware and `LocaleController` to read from `config('locales.supported')` instead of hardcoding the array.

#### 1F — Upgrade `HandleInertiaRequests` translation loading

The current `getTranslations()` only loads JSON from `lang_path()`. Upgrade to **merge translations from all registered packages**:

```php
protected function getTranslations(): array
{
    $locale = App::getLocale();
    $translations = [];

    // 1. Load global JSON translations (lang/{locale}.json)
    $jsonPath = lang_path("{$locale}.json");
    if (file_exists($jsonPath)) {
        $jsonTranslations = json_decode(file_get_contents($jsonPath), true);
        if ($jsonTranslations) {
            $translations = array_merge($translations, $jsonTranslations);
        }
    }

    // 2. Load package-level translations
    $packages = ['aero-core', 'aero-hrm', 'aero-crm', 'aero-finance', 'aero-project',
                 'aero-ims', 'aero-pos', 'aero-scm', 'aero-platform', 'aero-cms',
                 'aero-dms', 'aero-compliance', 'aero-quality'];

    foreach ($packages as $package) {
        $packageLangPath = base_path("vendor/aero/" . str_replace('aero-', '', $package) . "/resources/lang/{$locale}.json");

        // Also check monorepo path
        if (!file_exists($packageLangPath)) {
            $packageLangPath = base_path("packages/{$package}/resources/lang/{$locale}.json");
        }

        if (file_exists($packageLangPath)) {
            $packageTranslations = json_decode(file_get_contents($packageLangPath), true);
            if ($packageTranslations) {
                $translations = array_merge($translations, $packageTranslations);
            }
        }
    }

    // 3. Load PHP translation files (lang/{locale}/*.php)
    $phpLangPath = lang_path($locale);
    if (is_dir($phpLangPath)) {
        foreach (glob("{$phpLangPath}/*.php") as $file) {
            $namespace = basename($file, '.php');
            $translations[$namespace] = require $file;
        }
    }

    return $translations;
}
```

---

### Phase 2 — Create JSON Translation Files Per Package

**Goal:** Every package has a `resources/lang/{locale}.json` file with all UI strings.

#### Translation File Structure

Each package gets its own namespaced translation keys:

```
packages/aero-core/resources/lang/
├── en.json          # English (source of truth)
├── bn.json          # Bengali
├── ar.json          # Arabic
├── es.json          # Spanish
├── fr.json          # French
├── de.json          # German
├── hi.json          # Hindi
├── zh-CN.json       # Chinese Simplified
└── zh-TW.json       # Chinese Traditional
```

#### Key Naming Convention

Use **dot-separated, module-prefixed keys**:

```
{module}.{section}.{element}
```

Examples:
```json
// packages/aero-core/resources/lang/en.json
{
  "core.nav.dashboard": "Dashboard",
  "core.nav.settings": "Settings",
  "core.nav.profile": "Profile",
  "core.nav.logout": "Logout",
  "core.auth.login": "Login",
  "core.auth.register": "Register",
  "core.auth.forgot_password": "Forgot Password",
  "core.auth.reset_password": "Reset Password",
  "core.common.save": "Save",
  "core.common.cancel": "Cancel",
  "core.common.delete": "Delete",
  "core.common.edit": "Edit",
  "core.common.create": "Create",
  "core.common.search": "Search",
  "core.common.filter": "Filter",
  "core.common.export": "Export",
  "core.common.import": "Import",
  "core.common.loading": "Loading...",
  "core.common.no_data": "No data found",
  "core.common.confirm_delete": "Are you sure you want to delete this?",
  "core.common.success": "Operation successful",
  "core.common.error": "An error occurred",
  "core.common.actions": "Actions",
  "core.common.status": "Status",
  "core.common.active": "Active",
  "core.common.inactive": "Inactive",
  "core.common.pending": "Pending",
  "core.common.approved": "Approved",
  "core.common.rejected": "Rejected",
  "core.common.all": "All",
  "core.common.total": "Total",
  "core.common.per_page": "Per Page",
  "core.common.showing": "Showing :from to :to of :total results",
  "core.users.title": "Users",
  "core.users.add_user": "Add User",
  "core.users.edit_user": "Edit User",
  "core.users.invite_user": "Invite User",
  "core.users.name": "Name",
  "core.users.email": "Email",
  "core.users.role": "Role",
  "core.users.department": "Department",
  "core.users.designation": "Designation",
  "core.users.phone": "Phone",
  "core.users.status": "Status",
  "core.settings.title": "Settings",
  "core.settings.general": "General",
  "core.settings.appearance": "Appearance",
  "core.settings.notifications": "Notifications",
  "core.settings.security": "Security",
  "core.settings.language": "Language",
  "core.settings.timezone": "Timezone"
}
```

```json
// packages/aero-hrm/resources/lang/en.json
{
  "hrm.nav.employees": "Employees",
  "hrm.nav.departments": "Departments",
  "hrm.nav.designations": "Designations",
  "hrm.nav.leaves": "Leaves",
  "hrm.nav.attendance": "Attendance",
  "hrm.nav.payroll": "Payroll",
  "hrm.nav.timesheet": "Timesheet",
  "hrm.employees.title": "Employee Management",
  "hrm.employees.add": "Add Employee",
  "hrm.employees.edit": "Edit Employee",
  "hrm.employees.employee_id": "Employee ID",
  "hrm.employees.joining_date": "Joining Date",
  "hrm.employees.basic_salary": "Basic Salary",
  "hrm.leaves.title": "Leave Management",
  "hrm.leaves.apply": "Apply for Leave",
  "hrm.leaves.approve": "Approve",
  "hrm.leaves.reject": "Reject",
  "hrm.leaves.leave_type": "Leave Type",
  "hrm.leaves.from_date": "From Date",
  "hrm.leaves.to_date": "To Date",
  "hrm.leaves.reason": "Reason",
  "hrm.leaves.balance": "Leave Balance",
  "hrm.leaves.total_allocated": "Total Allocated",
  "hrm.leaves.total_used": "Total Used",
  "hrm.leaves.remaining": "Remaining",
  "hrm.attendance.title": "Attendance Management",
  "hrm.attendance.clock_in": "Clock In",
  "hrm.attendance.clock_out": "Clock Out",
  "hrm.attendance.present": "Present",
  "hrm.attendance.absent": "Absent",
  "hrm.attendance.late": "Late",
  "hrm.departments.title": "Departments",
  "hrm.departments.add": "Add Department",
  "hrm.departments.edit": "Edit Department",
  "hrm.departments.head": "Department Head",
  "hrm.payroll.title": "Payroll",
  "hrm.payroll.generate": "Generate Payroll",
  "hrm.payroll.net_salary": "Net Salary",
  "hrm.payroll.gross_salary": "Gross Salary",
  "hrm.payroll.deductions": "Deductions",
  "hrm.payroll.allowances": "Allowances",
  "hrm.timesheet.title": "Timesheet",
  "hrm.timesheet.daily": "Daily Timesheet",
  "hrm.timesheet.hours_worked": "Hours Worked",
  "hrm.timesheet.overtime": "Overtime"
}
```

#### Priority order for creating translation files:

1. `packages/aero-core/resources/lang/` — Common UI strings, navigation, auth, settings
2. `packages/aero-hrm/resources/lang/` — Largest module with most UI pages
3. `packages/aero-platform/resources/lang/` — Registration, pricing, plans, billing
4. `packages/aero-crm/resources/lang/` — Contacts, deals, pipeline
5. `packages/aero-finance/resources/lang/` — Invoices, payments, accounts
6. `packages/aero-project/resources/lang/` — Projects, tasks, milestones
7. Remaining packages as needed

#### Generating non-English files

Use the **BusinessGlossary** as the primary source for domain-specific terms. For general UI strings, translate manually or use a batch script that calls Google Translate API once and saves the results to JSON files (NOT at runtime).

Create a helper Artisan command:

```php
// packages/aero-core/src/Console/Commands/GenerateTranslations.php
php artisan aero:generate-translations --source=en --target=bn,ar,es,fr,de,hi,zh-CN,zh-TW --package=aero-hrm
```

This command should:
1. Read `en.json` from the specified package
2. Check BusinessGlossary for each value — use glossary translation if available
3. For remaining strings, use Google Translate API (one-time batch, NOT runtime)
4. Save to `{target}.json`
5. Output a report of strings that need human review

---

### Phase 3 — Frontend: Upgrade TranslationContext

**Goal:** Replace the Google-Translate-at-runtime approach with a proper static-translations-first system.

#### 3A — Rewrite `TranslationContext.jsx`

The new context should:

1. **Load translations from Inertia shared props** (`usePage().props.translations`) — these come from `HandleInertiaRequests`
2. **Merge with BusinessGlossary** for domain terms that may not be in JSON files yet
3. **Provide `t()` function** that does key lookup (not Google Translate)
4. **Support interpolation** — `t('core.common.showing', { from: 1, to: 10, total: 100 })` → `"Showing 1 to 10 of 100 results"`
5. **Support pluralization** — `t('hrm.leaves.count', { count: 5 })` uses `{count}` rules
6. **Fall back gracefully** — key not found → try BusinessGlossary → return key name (never call external API at runtime)
7. **Keep RTL support** — set `document.documentElement.dir` based on locale
8. **Keep `setLocale()` function** — POST to `/locale` endpoint + update React state

```jsx
// packages/aero-ui/resources/js/Context/TranslationContext.jsx (REWRITTEN)

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { getGlossaryTranslation } from './BusinessGlossary';

const TranslationContext = createContext(null);

const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

/**
 * Interpolate :placeholders in a translation string
 * "Showing :from to :to of :total results" + { from: 1, to: 10, total: 100 }
 * → "Showing 1 to 10 of 100 results"
 */
function interpolate(template, params = {}) {
    if (!params || typeof template !== 'string') return template;
    return Object.entries(params).reduce(
        (str, [key, value]) => str.replace(new RegExp(`:${key}`, 'g'), String(value)),
        template
    );
}

function InnerTranslationProvider({ children }) {
    const { props } = usePage();

    const [locale, setLocaleState] = useState(() => {
        return props.locale || localStorage.getItem('locale') || 'en';
    });

    const [translations, setTranslations] = useState(() => props.translations || {});

    const supportedLocales = useMemo(
        () => props.supportedLocales || ['en', 'bn', 'ar', 'es', 'fr', 'de', 'hi', 'zh-CN', 'zh-TW'],
        [props.supportedLocales]
    );

    const isRTL = useMemo(() => RTL_LOCALES.includes(locale), [locale]);

    // Update when Inertia props change (e.g., after locale switch + page reload)
    useEffect(() => {
        if (props.translations) {
            setTranslations(props.translations);
        }
    }, [props.translations]);

    // Apply document direction and lang attribute
    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = locale;
    }, [isRTL, locale]);

    /**
     * Translate a key with optional interpolation params.
     *
     * Lookup order:
     * 1. Static translations from JSON files (via Inertia props)
     * 2. BusinessGlossary (for domain-specific terms)
     * 3. Return key as fallback (in dev, log missing key)
     */
    const t = useCallback((key, params = {}) => {
        if (!key || typeof key !== 'string') return key || '';

        // If locale is English, the key value IS the English text when using JSON translations
        // But for dot-notation keys, we still look up the value
        const value = translations[key];
        if (value && typeof value === 'string') {
            return interpolate(value, params);
        }

        // For nested key lookup (e.g., 'auth.login')
        const parts = key.split('.');
        let nested = translations;
        for (const part of parts) {
            if (nested && typeof nested === 'object' && part in nested) {
                nested = nested[part];
            } else {
                nested = undefined;
                break;
            }
        }
        if (typeof nested === 'string') {
            return interpolate(nested, params);
        }

        // Try BusinessGlossary (for raw English text passed as key)
        if (locale !== 'en') {
            const glossary = getGlossaryTranslation(key, locale);
            if (glossary) return interpolate(glossary, params);
        }

        // Fallback: return the key itself
        if (process.env.NODE_ENV === 'development' && locale !== 'en') {
            console.debug(`[i18n] Missing: "${key}" for locale "${locale}"`);
        }

        return interpolate(key, params);
    }, [translations, locale]);

    /**
     * Switch locale — sends to backend + triggers Inertia reload
     */
    const setLocale = useCallback((newLocale) => {
        if (newLocale === locale || !supportedLocales.includes(newLocale)) return;

        localStorage.setItem('locale', newLocale);
        setLocaleState(newLocale);

        // Notify server and reload to get new translations
        axios.post(route('core.locale.update'), { locale: newLocale })
            .then(() => {
                // Inertia reload to get updated translations from HandleInertiaRequests
                router.reload({ only: ['translations', 'locale'] });
            })
            .catch(() => {
                // Reload anyway to apply locale
                router.reload();
            });
    }, [locale, supportedLocales]);

    /**
     * Clear translation cache
     */
    const clearCache = useCallback(() => {
        localStorage.removeItem('locale');
        setTranslations(props.translations || {});
    }, [props.translations]);

    const value = useMemo(() => ({
        locale,
        t,
        setLocale,
        supportedLocales,
        isRTL,
        isTranslating: false,  // kept for backward compat, always false now
        clearCache,
        translations,
    }), [locale, t, setLocale, supportedLocales, isRTL, clearCache, translations]);

    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    );
}

export function TranslationProvider({ children }) {
    try {
        return <InnerTranslationProvider>{children}</InnerTranslationProvider>;
    } catch (error) {
        const fallback = {
            locale: 'en',
            t: (text) => text,
            setLocale: () => {},
            supportedLocales: ['en'],
            isRTL: false,
            isTranslating: false,
            clearCache: () => {},
            translations: {},
        };
        return (
            <TranslationContext.Provider value={fallback}>
                {children}
            </TranslationContext.Provider>
        );
    }
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within TranslationProvider');
    }
    return context;
}

/**
 * Shorthand hook — returns just the `t` function for simple components.
 */
export function useT() {
    const { t } = useTranslation();
    return t;
}

export default TranslationContext;
```

#### 3B — Remove `GlobalAutoTranslator` from App.jsx

The DOM mutation approach is being replaced by explicit `t()` calls:

```jsx
// In App.jsx — REMOVE these lines:
// import { GlobalAutoTranslator } from '@/Context/GlobalAutoTranslator';
// <GlobalAutoTranslator> ... </GlobalAutoTranslator>

// Keep TranslationProvider wrapping. The GlobalAutoTranslator file can remain
// for a transitional period but should NOT be imported in App.jsx.
```

**IMPORTANT:** Do NOT delete `GlobalAutoTranslator.jsx` immediately. Keep it as an optional import that can be re-enabled per-page during the migration period. Once all pages are migrated, delete it.

#### 3C — Merge `LanguageSelector` into `LanguageSwitcher`

Delete the separate `Components/Platform/LanguageSelector.jsx` system and update Platform pages to use the main `LanguageSwitcher` component. The `LanguageProvider` context from LanguageSelector is redundant since `TranslationProvider` already handles everything.

Update Platform registration pages to:
```jsx
// BEFORE (separate system):
import { useLanguage } from '@/Components/Platform/LanguageSelector';
const { t, language } = useLanguage();

// AFTER (unified system):
import { useTranslation } from '@/Context/TranslationContext';
const { t, locale } = useTranslation();
```

#### 3D — Add `LanguageSwitcher` to Header/Navbar

The component exists but isn't rendered anywhere. Add it to the application header:

```jsx
// In packages/aero-ui/resources/js/Layouts/Header.jsx (or equivalent)
import LanguageSwitcher from '@/Components/LanguageSwitcher';

// In the header action buttons area (near user profile dropdown):
<LanguageSwitcher variant="minimal" size="sm" />
```

#### 3E — Share `supportedLocales` from backend

Add to `HandleInertiaRequests`:
```php
'supportedLocales' => config('locales.supported', ['en']),
'localeConfig' => config('locales.names', []),
```

Then `LanguageSwitcher` reads locale config from Inertia props instead of hardcoding:
```jsx
const { supportedLocales, localeConfig } = usePage().props;
```

---

### Phase 4 — Migrate Pages to Use `t()`

**Goal:** Replace every hardcoded English string in JSX pages with `t('key')` calls.

#### Migration Pattern

For each page component:

1. Import the hook:
```jsx
import { useTranslation } from '@/Context/TranslationContext';

// Inside component:
const { t } = useTranslation();
```

2. Replace hardcoded strings:
```jsx
// BEFORE:
<h4 className="text-2xl font-bold">Leave Management</h4>
<p className="text-sm text-default-500">Manage employee leaves and time-off requests</p>
<Button>Add New</Button>
<Input placeholder="Search..." label="Search" />
<TableColumn>Name</TableColumn>
<Chip>Approved</Chip>

// AFTER:
<h4 className="text-2xl font-bold">{t('hrm.leaves.title')}</h4>
<p className="text-sm text-default-500">{t('hrm.leaves.description')}</p>
<Button>{t('core.common.add_new')}</Button>
<Input placeholder={t('core.common.search')} label={t('core.common.search')} />
<TableColumn>{t('core.users.name')}</TableColumn>
<Chip>{t('core.common.approved')}</Chip>
```

3. Handle interpolation:
```jsx
// BEFORE:
<p>Showing 1 to 10 of 100 results</p>

// AFTER:
<p>{t('core.common.showing', { from: 1, to: 10, total: 100 })}</p>
```

#### Page Migration Priority

Migrate in this order (highest traffic first):

| Priority | Pages | Package | Est. Strings |
|----------|-------|---------|--------------|
| 1 | Dashboard, Sidebar navigation, Header | aero-core / aero-ui | ~80 |
| 2 | LeavesAdmin, LeaveList, LeaveForm | aero-hrm | ~60 |
| 3 | EmployeeList, EmployeeForm, EmployeeDashboard | aero-hrm | ~100 |
| 4 | UsersList, AddEditUserForm, InviteUserForm | aero-core | ~50 |
| 5 | AttendanceDashboard, TimeSheetTable | aero-hrm | ~40 |
| 6 | DepartmentList, DesignationList | aero-hrm | ~30 |
| 7 | PayrollAdmin, PayslipView | aero-hrm | ~40 |
| 8 | Registration flow (ModernSignUp, etc.) | aero-platform | ~60 |
| 9 | Landing, Pricing, Features (public pages) | aero-platform | ~80 |
| 10 | Events, Announcements, Communications | aero-hrm | ~30 |
| 11 | CRM pages (Contacts, Deals, Pipeline) | aero-crm | ~60 |
| 12 | Finance pages (Invoices, Payments) | aero-finance | ~50 |
| 13 | Project pages (Tasks, Milestones) | aero-project | ~40 |
| 14 | Remaining modules | various | ~100+ |

**Total estimated: ~800+ unique strings across all modules**

#### Strings That Should NOT Be Translated

Add `data-no-translate` attribute or skip in `t()`:
- User names, emails, phone numbers
- Company/tenant names
- Dates (use `Intl.DateTimeFormat` with locale instead)
- Currency amounts (use `Intl.NumberFormat` with locale instead)
- Code identifiers (employee IDs, invoice numbers)
- URLs and routes

---

### Phase 5 — Date, Number, and Currency Localization

**Goal:** Ensure all formatted values respect the current locale.

#### 5A — Create a `useLocaleFormatters()` hook

```jsx
// packages/aero-ui/resources/js/Hooks/useLocaleFormatters.js

import { useMemo } from 'react';
import { useTranslation } from '@/Context/TranslationContext';

const LOCALE_MAP = {
    'en': 'en-US',
    'bn': 'bn-BD',
    'ar': 'ar-SA',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'hi': 'hi-IN',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
};

export function useLocaleFormatters() {
    const { locale } = useTranslation();

    const intlLocale = LOCALE_MAP[locale] || 'en-US';

    const formatDate = useMemo(() => {
        const fmt = new Intl.DateTimeFormat(intlLocale, {
            year: 'numeric', month: 'short', day: 'numeric',
        });
        return (date) => {
            if (!date) return '';
            return fmt.format(date instanceof Date ? date : new Date(date));
        };
    }, [intlLocale]);

    const formatDateTime = useMemo(() => {
        const fmt = new Intl.DateTimeFormat(intlLocale, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
        return (date) => {
            if (!date) return '';
            return fmt.format(date instanceof Date ? date : new Date(date));
        };
    }, [intlLocale]);

    const formatCurrency = useMemo(() => {
        return (amount, currency = 'USD') => {
            if (amount == null) return '';
            return new Intl.NumberFormat(intlLocale, {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(amount);
        };
    }, [intlLocale]);

    const formatNumber = useMemo(() => {
        const fmt = new Intl.NumberFormat(intlLocale);
        return (num) => {
            if (num == null) return '';
            return fmt.format(num);
        };
    }, [intlLocale]);

    const formatPercent = useMemo(() => {
        const fmt = new Intl.NumberFormat(intlLocale, {
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        });
        return (num) => {
            if (num == null) return '';
            return fmt.format(num / 100);
        };
    }, [intlLocale]);

    const formatRelativeTime = useMemo(() => {
        const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });
        return (date) => {
            if (!date) return '';
            const d = date instanceof Date ? date : new Date(date);
            const diffMs = d - new Date();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            if (Math.abs(diffDays) < 1) {
                const diffHours = Math.round(diffMs / (1000 * 60 * 60));
                return rtf.format(diffHours, 'hour');
            }
            if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');
            const diffMonths = Math.round(diffDays / 30);
            return rtf.format(diffMonths, 'month');
        };
    }, [intlLocale]);

    return {
        locale: intlLocale,
        formatDate,
        formatDateTime,
        formatCurrency,
        formatNumber,
        formatPercent,
        formatRelativeTime,
    };
}
```

#### 5B — Replace hardcoded `Intl.NumberFormat('en-US')` calls

Search for all `new Intl.NumberFormat(` and `toLocaleString(` calls and replace with the hook:

```jsx
// BEFORE (in ~15+ files):
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// AFTER:
const { formatCurrency } = useLocaleFormatters();
```

---

### Phase 6 — RTL Layout Support

**Goal:** Ensure the full UI flips correctly for Arabic and other RTL locales.

#### 6A — Tailwind RTL utilities

Tailwind v4 supports logical properties natively. Replace physical properties where needed:

```jsx
// BEFORE (breaks in RTL):
<div className="ml-4 pl-3 text-left border-l">

// AFTER (works in both LTR and RTL):
<div className="ms-4 ps-3 text-start border-s">
```

Key replacements:
| Physical | Logical (RTL-safe) |
|----------|-------------------|
| `ml-*` | `ms-*` |
| `mr-*` | `me-*` |
| `pl-*` | `ps-*` |
| `pr-*` | `pe-*` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `border-l` | `border-s` |
| `border-r` | `border-e` |
| `left-*` | `start-*` |
| `right-*` | `end-*` |
| `rounded-l-*` | `rounded-s-*` |
| `rounded-r-*` | `rounded-e-*` |

#### 6B — Sidebar direction

The sidebar slides from the left in LTR mode. In RTL mode it should be on the right:

```jsx
// In Sidebar.jsx
const { isRTL } = useTranslation();

<aside className={`${isRTL ? 'right-0' : 'left-0'} fixed top-0 h-full`}>
```

Or better, use logical properties:
```jsx
<aside className="fixed top-0 start-0 h-full">
```

#### 6C — Icons that imply direction

Arrows and chevrons need to flip in RTL:
```jsx
const { isRTL } = useTranslation();

<ChevronRightIcon className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
```

---

### Phase 7 — Backend Message Translation

**Goal:** Ensure backend error messages, flash messages, and API responses are translated.

#### 7A — Use `__()` in all controller responses

```php
// BEFORE:
return response()->json([
    'message' => 'Leave request created successfully'
]);

// AFTER:
return response()->json([
    'message' => __('hrm.leaves.created_successfully')
]);
```

#### 7B — Create PHP translation files for backend messages

```
packages/aero-core/resources/lang/en/messages.php
packages/aero-core/resources/lang/bn/messages.php
packages/aero-hrm/resources/lang/en/hrm.php
packages/aero-hrm/resources/lang/bn/hrm.php
```

```php
// packages/aero-hrm/resources/lang/en/hrm.php
return [
    'leaves' => [
        'created_successfully' => 'Leave request created successfully',
        'updated_successfully' => 'Leave request updated successfully',
        'deleted_successfully' => 'Leave request deleted successfully',
        'approved_successfully' => 'Leave request approved',
        'rejected_successfully' => 'Leave request rejected',
        'insufficient_balance' => 'Insufficient leave balance',
    ],
    'employees' => [
        'created_successfully' => 'Employee created successfully',
        'updated_successfully' => 'Employee updated successfully',
        'deleted_successfully' => 'Employee deleted successfully',
    ],
    // ...
];
```

#### 7C — Register package translation paths in service providers

Each package service provider must register its lang directory:

```php
// In each package's ServiceProvider boot() method:
public function boot(): void
{
    $this->loadTranslationsFrom(__DIR__ . '/../../resources/lang', 'aero-hrm');
    $this->loadJsonTranslationsFrom(__DIR__ . '/../../resources/lang');

    // Publishable translations
    $this->publishes([
        __DIR__ . '/../../resources/lang' => lang_path('vendor/aero-hrm'),
    ], 'aero-hrm-lang');
}
```

Then backend code uses:
```php
__('aero-hrm::hrm.leaves.created_successfully')
// Or for JSON translations:
__('hrm.leaves.title')
```

---

### Phase 8 — Language Switcher Upgrade

**Goal:** Make the language switcher polished and accessible from everywhere.

#### 8A — Header integration

Add to `Header.jsx` in the top-right action bar:

```jsx
import LanguageSwitcher from '@/Components/LanguageSwitcher';

// In the header actions section (near notifications bell and profile):
<div className="flex items-center gap-2">
    <LanguageSwitcher variant="minimal" size="sm" />
    <NotificationBell />
    <ProfileDropdown />
</div>
```

#### 8B — Settings page integration

In the Settings page, add a full Language section:

```jsx
<div className="space-y-4">
    <h3 className="text-lg font-semibold">{t('core.settings.language')}</h3>
    <p className="text-sm text-default-500">{t('core.settings.language_description')}</p>
    
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {supportedLocales.map((code) => {
            const config = localeConfig[code];
            if (!config) return null;
            
            return (
                <button
                    key={code}
                    onClick={() => setLocale(code)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        locale === code
                            ? 'border-primary bg-primary/10'
                            : 'border-divider hover:border-default-300'
                    }`}
                >
                    <FlagIcon code={code} className="w-8 h-8" />
                    <div className="text-left">
                        <p className="text-sm font-medium">{config.native}</p>
                        <p className="text-xs text-default-400">{config.name}</p>
                    </div>
                    {locale === code && <CheckIcon className="w-4 h-4 text-primary ml-auto" />}
                </button>
            );
        })}
    </div>
</div>
```

#### 8C — Public/Platform pages

Replace `LanguageSelector.jsx` usage with the main `LanguageSwitcher`:

```jsx
// In Platform layout (registration, pricing, landing pages):
import LanguageSwitcher from '@/Components/LanguageSwitcher';

// In the public navigation bar:
<LanguageSwitcher variant="minimal" size="sm" showFlag={true} />
```

---

### Phase 9 — Tenant-Level Locale Configuration (Advanced)

**Goal:** Allow each tenant to configure their default locale and available locales.

#### 9A — Migration: Add locale columns to tenant settings

```php
Schema::table('tenant_settings', function (Blueprint $table) {
    $table->string('default_locale', 10)->default('en');
    $table->json('available_locales')->nullable(); // null = all supported
});
```

#### 9B — Share tenant locale in Inertia props

```php
// In HandleInertiaRequests:
'tenantLocaleConfig' => [
    'default' => $tenant->settings->default_locale ?? 'en',
    'available' => $tenant->settings->available_locales ?? config('locales.supported'),
],
```

#### 9C — Admin settings UI for locale management

In the admin Settings page, add a section where admins can:
- Set the default locale for their organization
- Enable/disable specific locales for their users
- Upload custom translation overrides (e.g., rename "Department" → "Division")

---

## Validation Checklist

After all changes, verify:

- [ ] **Locale switches correctly** — Changing language in LanguageSwitcher updates all visible text without page reload flicker
- [ ] **Inertia props include translations** — `usePage().props.translations` contains merged JSON keys from all packages
- [ ] **`t()` works for all keys** — Every translation key resolves to the correct text in all 9 locales
- [ ] **No runtime Google Translate calls** — Zero requests to `translate.googleapis.com` in network tab during normal usage
- [ ] **RTL layout works** — Arabic locale flips sidebar, text alignment, margins/padding, icons
- [ ] **Dates/numbers localized** — Date/currency/number displays use `Intl` with correct locale
- [ ] **Backend messages translated** — API error messages and flash messages respect locale
- [ ] **Public pages translated** — Landing, Pricing, Registration pages work in all locales
- [ ] **BusinessGlossary preserved** — Domain terms (Leave, Payroll, Department, etc.) use curated translations
- [ ] **No duplicate locale code** — Single LocaleController, single SetLocale middleware, single locale route
- [ ] **LanguageSwitcher visible** — Present in Header for tenant pages and in public nav for platform pages
- [ ] **Fallback works** — Missing translation key shows the key itself (not blank, not error)
- [ ] **`data-no-translate` respected** — Names, emails, IDs are never translated
- [ ] **Settings page has language selector** — Full-page locale picker in user settings
- [ ] **Build passes** — `npm run build` completes with zero errors
- [ ] **No visual regressions** — Pages look correct in all locales, no layout breaks

---

## Rules

1. **All changes in `packages/`** — Never modify host app files directly
2. **JSON translation files are the source of truth** — Not runtime API calls
3. **BusinessGlossary has highest priority** — Domain terms from glossary override JSON file values
4. **Never translate user-generated content** — Names, emails, company names, IDs stay as-is
5. **Use `Intl.*` APIs for dates/numbers/currency** — Never manually format with locale-specific strings
6. **Keep backward compatibility** — `useTranslation()` must still export the same API shape (locale, t, setLocale, supportedLocales, isRTL)
7. **English is the fallback** — If a key is missing in `bn.json`, the English value from `en.json` is returned
8. **One `t()` call per string** — Don't concatenate translated fragments; translate the full sentence
9. **RTL support uses logical properties** — `ms-*` not `ml-*`, `start-*` not `left-*`
10. **Translation keys are stable** — Once a key is created, don't rename it without a migration
11. **GlobalAutoTranslator removal is gradual** — Remove from App.jsx first, keep the file until all pages are migrated
12. **Package translations are publishable** — Host apps can override package translations via `vendor/aero-{module}/lang/`
