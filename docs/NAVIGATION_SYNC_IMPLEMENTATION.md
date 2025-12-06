# Navigation Synchronization Implementation Guide

## Overview

This document tracks the synchronization of frontend navigation (`admin_pages.jsx` and `pages.jsx`) with the module definitions in `config/modules.php`.

## Status: Ready for Implementation

### Modules Requiring Updates

#### 1. DMS (Document Management System)
**Location**: `resources/js/Props/pages.jsx` (lines 1005-1020)  
**Current State**: Basic 6-item menu  
**Target State**: Complete 12-item menu matching config/modules.php  
**Priority**: High

**Current Submodules** (6):
- Overview
- Files
- Upload
- Categories
- Shared
- Analytics

**Required Submodules** (12):
1. Overview / Dashboard
2. Document Library (documents)
3. Version Control (versions)
4. Folder Management (folders)
5. Sharing & Permissions (sharing)
6. Document Workflows (workflows)
7. Document Templates (templates)
8. E-Signatures (e-signatures)
9. Document Audit Trail (audit-trail)
10. Document Search (search)
11. DMS Analytics (dms-analytics)
12. DMS Settings (dms-settings)

**Access Pattern**: `dms.{submodule}.view`

---

#### 2. Quality Management System
**Location**: `resources/js/Props/pages.jsx` (lines 1911-1922)  
**Current State**: Basic 4-item menu  
**Target State**: Complete 9-item menu matching config/modules.php  
**Priority**: High

**Current Submodules** (4):
- Inspections
- NCRs
- Calibrations
- Analytics

**Required Submodules** (9):
1. Quality Dashboard (dashboard)
2. Quality Inspections (inspections)
3. Non-Conformance Reports (ncr)
4. CAPA Management (capa)
5. Equipment Calibrations (calibrations)
6. Quality Audits (audits)
7. Quality Certifications (certifications)
8. Quality Analytics (quality-analytics)
9. Quality Settings (quality-settings)

**Access Pattern**: `quality.{submodule}.view`

---

#### 3. Compliance Management
**Location**: `resources/js/Props/pages.jsx` (lines 1897-1908)  
**Current State**: Basic 4-item menu  
**Target State**: Complete 9-item menu matching config/modules.php  
**Priority**: High

**Current Submodules** (4):
- Overview
- Policies
- Risks
- Audits

**Required Submodules** (9):
1. Compliance Dashboard (dashboard)
2. Company Policies (policies)
3. Risk Register (risks)
4. Compliance Audits (audits)
5. Regulatory Requirements (requirements)
6. Compliance Documents (documents)
7. Compliance Training (training)
8. Certifications & Licenses (certifications)
9. Compliance Reports (compliance-reports)

**Access Pattern**: `compliance.{submodule}.view`

---

#### 4. Platform Onboarding
**Location**: `resources/js/Props/admin_pages.jsx` (NEW - Insert after platform-support)  
**Current State**: Does not exist  
**Target State**: Complete 7-submodule menu matching config/modules.php  
**Priority**: High

**Required Submodules** (7):
1. Registration Dashboard (registration-dashboard)
2. Pending Registrations (pending-registrations)
3. Provisioning Queue (provisioning-queue)
4. Trial Management (trial-management)
5. Welcome Automation (welcome-automation)
6. Onboarding Analytics (onboarding-analytics)
7. Onboarding Settings (onboarding-settings)

**Access Pattern**: `platform-onboarding.{submodule}.view`  
**Priority**: 14 (after platform-support at priority 13)

---

## Implementation Checklist

### Phase 1: Tenant Navigation (pages.jsx)
- [ ] Update DMS module (expand from 6 to 12 submodules)
- [ ] Update Quality module (expand from 4 to 9 submodules)
- [ ] Update Compliance module (expand from 4 to 9 submodules)
- [ ] Verify icon imports are present
- [ ] Verify access patterns are correct

### Phase 2: Platform Admin Navigation (admin_pages.jsx)
- [ ] Add Platform Onboarding module (NEW, 7 submodules)
- [ ] Insert after platform-support module
- [ ] Verify icon imports (UserPlusIcon, ServerStackIcon)
- [ ] Verify access patterns are correct

### Phase 3: Backend Routes
- [ ] Verify DMS routes use correct middleware ✅ (Already correct)
- [ ] Verify Quality routes use correct middleware ✅ (Already correct)
- [ ] Verify Compliance routes use correct middleware ✅ (Already correct)
- [ ] Add Platform Onboarding routes to admin.php (Future work - controllers needed)

---

## Icon Requirements

### New Icons Needed for pages.jsx

**For DMS**:
- ClockIcon (Version Control) - ✅ Already imported
- ArrowPathIcon (Workflows) - ✅ Already imported
- PencilSquareIcon (E-Signatures) - ⚠️ Need to verify import
- WrenchIcon (Calibrations) - ⚠️ Need to verify import

**For Quality**:
- ExclamationTriangleIcon (NCR) - ✅ Already imported
- WrenchScrewdriverIcon (CAPA) - ✅ Already imported
- WrenchIcon (Calibrations) - ⚠️ Need to verify import
- DocumentMagnifyingGlassIcon (Audits) - ⚠️ Need to add

**For Compliance**:
- ShieldExclamationIcon (Main) - ⚠️ Need to verify import
- DocumentCheckIcon (Requirements) - ⚠️ Need to verify import
- BadgeCheckIcon (Certifications) - ⚠️ Need to add
- DocumentChartBarIcon (Reports) - ⚠️ Need to verify import

### New Icons Needed for admin_pages.jsx

**For Platform Onboarding**:
- UserPlusIcon (Main) - ⚠️ Need to add
- ServerStackIcon (Provisioning Queue) - ⚠️ Need to verify import

---

## Route Patterns

### DMS Routes (Already Implemented)
```php
Route::middleware(['module:dms'])->group(function () {
    Route::get('/documents', [DMSController::class, 'documents'])->name('documents');
    Route::get('/documents/{document}', [DMSController::class, 'show'])->name('documents.show');
    // ... more routes
});
```

### Quality Routes (Already Implemented)
```php
Route::middleware(['module:quality,inspections'])->group(function () {
    Route::get('/inspections', [InspectionController::class, 'index'])->name('inspections.index');
    // ... more routes
});
```

### Compliance Routes (Already Implemented)
```php
Route::middleware(['module:compliance,documents'])->group(function () {
    Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
    // ... more routes
});
```

### Platform Onboarding Routes (To Be Implemented)
```php
// Recommended structure for routes/admin.php
Route::middleware(['auth:landlord', 'module:platform-onboarding'])
    ->prefix('onboarding')
    ->name('admin.onboarding.')
    ->group(function () {
        Route::get('/dashboard', [OnboardingController::class, 'dashboard'])->name('dashboard');
        Route::get('/pending', [OnboardingController::class, 'pending'])->name('pending');
        Route::get('/provisioning', [OnboardingController::class, 'provisioning'])->name('provisioning');
        Route::get('/trials', [OnboardingController::class, 'trials'])->name('trials');
        Route::get('/automation', [OnboardingController::class, 'automation'])->name('automation');
        Route::get('/analytics', [OnboardingController::class, 'analytics'])->name('analytics');
        Route::get('/settings', [OnboardingController::class, 'settings'])->name('settings');
    });
```

---

## Validation Checklist

After implementation, verify:

### Functional Checks
- [ ] All navigation items render correctly
- [ ] Access control works (items hidden without proper permissions)
- [ ] Routes match navigation expectations
- [ ] Icons display properly
- [ ] Priority ordering is logical

### Code Quality Checks
- [ ] No console errors when rendering navigation
- [ ] Consistent code formatting
- [ ] Comments explain structure clearly
- [ ] Access patterns match module hierarchy exactly

### Integration Checks
- [ ] Navigation items match config/modules.php exactly
- [ ] All submodules from config are represented
- [ ] Access paths follow `module.submodule.action` pattern
- [ ] Icons match config definitions

---

## Implementation Notes

### Backward Compatibility
- Legacy `can()` function wrapper maintained
- Checks both module access AND legacy permissions
- No breaking changes to existing access control logic

### Super Admin Behavior
- Super admins bypass all module access checks
- Use `isAuthSuperAdmin(auth)` helper consistently
- Platform super admin vs Tenant super admin distinction maintained

### Module Access Utils
- All access checks use `hasAccess()` from `@/utils/moduleAccessUtils`
- Combines plan-based access with RBAC permissions
- Supports both platform and tenant contexts

---

## Success Criteria

✅ **100% Module Coverage**: All submodules from config/modules.php have navigation entries  
✅ **Consistent Access Patterns**: All use `module.submodule.action` format  
✅ **Icon Consistency**: All icons match config definitions  
✅ **Route Alignment**: All navigation routes exist in backend  
✅ **Priority Ordering**: Logical menu ordering maintained  
✅ **No Regressions**: Existing functionality unaffected  

---

## Timeline

**Phase 1 (Tenant Navigation)**: 1-2 hours  
**Phase 2 (Platform Navigation)**: 30 minutes  
**Phase 3 (Route Verification)**: 30 minutes  
**Testing & Validation**: 1 hour  

**Total Estimated Time**: 3-4 hours

---

## References

- **Config**: `/config/modules.php`
- **Tenant Nav**: `/resources/js/Props/pages.jsx`
- **Platform Nav**: `/resources/js/Props/admin_pages.jsx`
- **DMS Routes**: `/routes/dms.php`
- **Quality Routes**: `/routes/quality.php`
- **Compliance Routes**: `/routes/compliance.php`
- **Admin Routes**: `/routes/admin.php`

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-05  
**Status**: Ready for Implementation
