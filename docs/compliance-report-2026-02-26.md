# Deep Compliance Check Report
**Date:** 2026-02-26  
**Scope:** All three workspaces — aeos365 (SaaS host), dbedc-erp (ERP host), Aero-Enterprise-Suite-Saas (monorepo packages)  
**Checks:** PHP Pint, PHPUnit, Static Analysis (Pylance), Route Integrity, Frontend Build

---

## Executive Summary

| Check | aeos365 | dbedc-erp | Monorepo Packages |
|-------|---------|-----------|-------------------|
| PHP Pint | ✅ CLEAN | ✅ App code fixed | ⚠️ Tech Debt (1690 files) |
| PHPUnit | ✅ 2/2 | ⚠️ 39/50 (↑ from 28/50) | N/A |
| Static Analysis | ✅ (false positives only) | ✅ Syntax errors fixed | ✅ Syntax errors fixed |
| Routes | ✅ | ✅ | N/A |
| Frontend Build | ✅ | ✅ | N/A |

---

## 1. PHP Pint (Code Style)

### aeos365
- **Result: ✅ CLEAN** — 25 files checked, 0 violations

### dbedc-erp
- **Result: ✅ Fixed** — 7 violations in 6 files on initial check
- **Auto-fixed (3 files):**
  - `app/Providers/AppServiceProvider.php` — removed unused `URL` import, trailing whitespace
  - `tests/Feature/HRM/Notifications/ExpiryNotificationUatTest.php` — whitespace rules
  - `tests/Feature/NotificationFlowTest.php` — unused imports
- **Intentionally skipped (4 debug scripts not part of production code):**
  - `check_user_perm.php`
  - `test_dashboard_integration.php`
  - `verify_dashboards.php`
  - `public/test-dashboard.php`

### Monorepo Packages (Aero-Enterprise-Suite-Saas/packages)
- **Result: ⚠️ PRE-EXISTING TECH DEBT**
- **1690 PHP files** scanned; all need Pint formatting
- This is not a regression — Pint has never been systematically applied to the packages
- **Recommendation:** Add `vendor/bin/pint --dirty` to the CI pipeline and/or pre-commit hook; address incrementally per-feature-branch using `--dirty` flag

---

## 2. Static Analysis

### Issues Found & Fixed

**aero-scm Controllers — `$1` Regex Corruption (Both repos)**

4 controller files in both `Aero-Enterprise-Suite-Saas` and `dbedc-erp` had corrupted `use` statements from a previous bad regex find-replace operation:

| File | Corruption | Fix |
|------|-----------|-----|
| `ImportExportController.php` | `use App\Models\Tenant\SCM$1` (×2) | → `use Aero\Scm\Models\{TradeDocument,CustomsDeclaration}` |
| `ProcurementController.php` | Bare `$1` lines before class declaration | → `use Aero\Scm\Models\{ProcurementRequest,ProcurementRequestItem}` |
| `ProductionPlanController.php` | `use App\Models\Tenant\SCM$1` (×2) | → `use Aero\Ims\Models\InventoryItem; use Aero\Scm\Models\{ProductionPlan,ProductionPlanMaterial}` |
| `DemandForecastController.php` | `use App\Models\Tenant\SCM$1` (×1) | → `use Aero\Ims\Models\InventoryItem; use Aero\Scm\Models\DemandForecast` |

**aero-platform `CleanupDuplicatePermissions.php`**
- ~20 lines of orphaned dead code dangled after the class-closing `}`, causing a syntax error
- **Fixed:** Removed the orphaned code block; file now ends cleanly

### Remaining Static Analysis Items (False Positives — No Action Required)
- `aero-core/installation.php` and `UnifiedInstallationController.php` — Pylance cannot resolve Laravel facades (`Artisan::call`, etc.); these are valid at runtime

---

## 3. PHPUnit Tests

### aeos365
- **Result: ✅ 2/2 tests pass**

### dbedc-erp

| | Before Check | After Check |
|-|-------------|------------|
| **Passing** | 28/50 (56%) | 39/50 (78%) |
| **Failing** | 22/50 (44%) | 11/50 (22%) |
| **Improvement** | — | **+11 tests fixed** |

#### Tests Fixed During This Session

**`NotificationFlowTest` — 19/19 now pass (was 10 failing)**

| # | Root Cause | Fix Applied |
|---|-----------|------------|
| 1 | `'employment_status'` column doesn't exist | → `'status'` |
| 2 | `$event->createdBy` undefined property | → `$event->getActorEmployeeId()` |
| 3 | `$event->options['onboarding_enabled']` undefined | → `$event->getMetadata()['onboarding_enabled']` |
| 4 | `user_notification_preferences` table wrong schema (old `notification_type` / `email_enabled` columns) | → Rewrote test inserts to use correct `event_type` + `channel` + `enabled` schema |
| 5 | `LeaveCancelled($leave, User $object)` TypeError | → `LeaveCancelled($leave, $user->id)` (constructor expects `?int`) |

**`LeaveNotificationUatTest` — TypeErrors resolved**
- Fixed `new LeaveCancelled($leave, $this->employee)` → `new LeaveCancelled($leave, $this->employeeRecord->id)`
- Result: 6/8 pass (↑ from 5/8 before session)

**Shared Listener Fix — `SendEmployeeWelcomeNotification.php`**
- Both repos: `$event->metadata` → `$event->getMetadata()` (accessing protected property via public getter)

**`AttendanceFactory` — `dbedc-erp` copy missing `newFactory()` override**
- Added `protected static function newFactory()` pointing to `Aero\HRM\Database\Factories\AttendanceFactory`

**`User::prefersNotificationChannel()` — `dbedc-erp` always returned `true`**
- Implemented actual DB query against `user_notification_preferences` table

#### Remaining Failures (11 tests)

**1. `ExampleTest` (1 test) — Expected Behavior, Not a Bug**
- Root `/` route redirects unauthenticated users to login (302), test asserts 200
- This is the correct behavior; test should be updated to assert 302 or test as authenticated

**2. `ExpiryNotificationUatTest` (8 tests) — Business Logic Gap**
- Only 30-day document expiry notifications are dispatched by `DocumentExpiryJob`
- Missing: 7-day urgent, expired-document, probation-ending (14-day & urgent), contract-expiry (30-day & urgent), contract-expired escalation
- **Root cause:** `DocumentExpiryJob` likely has incomplete threshold/type branching logic
- **Files to investigate:** `packages/aero-hrm/src/Jobs/DocumentExpiryJob.php`

**3. `LeaveNotificationUatTest` (2 tests) — Business Logic Gap**
- `LeaveCancelledNotification` not being dispatched to the expected recipient
- Tests: `it_sends_leave_cancelled_notification_to_manager` and `it_sends_leave_cancelled_notification_to_employee`
- **Files to investigate:** `packages/aero-hrm/src/Listeners/Leave/` (listener for `LeaveCancelled` event)

---

## 4. Route Integrity

| App | Result |
|-----|--------|
| aeos365 | ✅ No route registration errors |
| dbedc-erp | ✅ No route registration errors |

---

## 5. Frontend

| App | ESLint | Vite Build | Last Built |
|-----|--------|------------|------------|
| aeos365 | ⚠️ Not configured | ✅ 1.2 MB | 2026-01-12 |
| dbedc-erp | ⚠️ Not configured | ✅ 1.5 MB | 2026-02-24 |

- No frontend code was modified during this session; builds remain valid
- **Recommendation:** Add ESLint (+ react/recommended, hooks plugin) to both apps

---

## 6. Files Modified During This Session

### Monorepo (Aero-Enterprise-Suite-Saas)
- `packages/aero-scm/src/Http/Controllers/ImportExportController.php` — fixed use statements
- `packages/aero-scm/src/Http/Controllers/ProcurementController.php` — fixed use statements
- `packages/aero-scm/src/Http/Controllers/ProductionPlanController.php` — fixed use statements
- `packages/aero-scm/src/Http/Controllers/DemandForecastController.php` — fixed use statement
- `packages/aero-platform/src/Console/Commands/CleanupDuplicatePermissions.php` — removed orphaned dead code
- `packages/aero-hrm/src/Listeners/Employee/SendEmployeeWelcomeNotification.php` — `$event->metadata` → `$event->getMetadata()`

### dbedc-erp
- `packages/aero-scm/src/Http/Controllers/ImportExportController.php` — same fix
- `packages/aero-scm/src/Http/Controllers/ProcurementController.php` — same fix
- `packages/aero-scm/src/Http/Controllers/ProductionPlanController.php` — same fix
- `packages/aero-scm/src/Http/Controllers/DemandForecastController.php` — same fix
- `packages/aero-hrm/src/Models/Attendance.php` — added `newFactory()` override
- `packages/aero-hrm/src/Listeners/Employee/SendEmployeeWelcomeNotification.php` — `$event->metadata` → `$event->getMetadata()`
- `packages/aero-core/src/Models/User.php` — implemented `prefersNotificationChannel()` with actual DB query
- `app/Providers/AppServiceProvider.php` — Pint auto-fix (unused import)
- `tests/Feature/HRM/Notifications/ExpiryNotificationUatTest.php` — Pint auto-fix (whitespace)
- `tests/Feature/NotificationFlowTest.php` — Multiple test assertion fixes + Pint auto-fix
- `tests/Feature/HRM/Notifications/LeaveNotificationUatTest.php` — Fixed `LeaveCancelled` constructor calls

---

## 7. Technical Debt Register (Action Required)

| Priority | Item | Location | Effort |
|----------|------|----------|--------|
| 🔴 High | `DocumentExpiryJob` only handles 30-day threshold; 7-day/urgent/expired/probation/contract unimplemented | `packages/aero-hrm/src/Jobs/DocumentExpiryJob.php` | Medium |
| 🔴 High | `LeaveCancelled` listener not routing notifications correctly | `packages/aero-hrm/src/Listeners/Leave/` | Small |
| 🟡 Medium | `ExampleTest` asserts 200 for unauthenticated root route | `tests/Feature/ExampleTest.php` | Trivial |
| 🟡 Medium | Monorepo packages have zero Pint compliance (1690 files) | `Aero-Enterprise-Suite-Saas/packages/**` | Large (batch job) |
| 🟡 Medium | No ESLint in either host app | Both `package.json` files | Small |
| 🟢 Low | 4 debug scripts with Pint violations remain (non-production) | `dbedc-erp/check_user_perm.php` etc. | Trivial |
| 🟢 Low | PHPUnit deprecation warnings: metadata in doc-comment (PHPUnit 12) | Multiple test files in dbedc-erp | Small |
