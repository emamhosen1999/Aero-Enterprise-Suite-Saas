# HRM Package Audit Report
**Date:** January 11, 2026
**Scope:** Employee-centric Domain Rules & Package Isolation

## Executive Summary
- **Total Violations Found:** 47
- **Critical Issues:** 12
- **Package Boundary Violations:** 23
- **Hardcoded Role Checks:** 24

---

## 1. Core Rule Violations: User Model Usage in HRM

### Services Directly Using Core User Model (CRITICAL)
❌ **HRMetricsAggregatorService.php**
- Uses `User::whereNotNull()`, `User::selectRaw()`, `User::onlyTrashed()` 
- Should query via Employee aggregate

❌ **LeaveApprovalService.php**
- Lines 74, 327: `User::whereHas()`, `User::find()`
- Should resolve Employee first

❌ **LeaveBalanceService.php**
- Line 53: `User::where('is_active', true)->get()`
- Should use Employee with user relationship

❌ **LeaveSummaryService.php**
- Line 25: `User::with(['department', 'designation'])`
- Should use Employee as primary entity

❌ **PayrollCalculationService.php**
- Line 334: `User::find($employeeId)`
- Parameter name mismatched with entity type

❌ **BulkLeaveService.php**
- Direct User model import

---

## 2. Authorization Violations: Hardcoded Role Checks

### Listeners with Hardcoded Role Strings

❌ **NotifyManagerOfLeaveRequest.php**
```php
$hrUsers = User::role(['HR Admin', 'HR Manager', 'hr_admin', 'hr_manager'])->get();
```

❌ **SendDocumentExpiryNotifications.php**
```php
$hrRoleNames = ['HR Admin', 'HR Manager', 'hr', 'hr_manager', 'hr-manager', 'human_resources'];
$hrUsers = \Aero\Core\Models\User::role($hrRoleNames)->get();
```

❌ **SendProbationEndingNotifications.php**
```php
$hrRoleNames = ['HR Admin', 'HR Manager', 'hr', 'hr_manager', 'hr-manager', 'human_resources'];
```

❌ **SendWorkAnniversaryNotifications.php**
```php
$hrUsers = \Aero\Core\Models\User::role($hrRoleNames)->get();
```

❌ **SendOffboardingNotification.php**
```php
$hrUsers = User::role(['HR Manager', 'HR Admin'])->get();
```

❌ **NotifyHROfResignation.php**
```php
$hrUsers = User::role(['HR Manager', 'HR Admin'])->get();
```

❌ **NotifyRecruiterOfApplication.php**
```php
$recruiters = \Aero\Core\Models\User::role(['Recruiter', 'HR Manager'])->get();
```

❌ **NotifyManagerOfNewEmployee.php**
```php
$hrUsers = User::role(['HR Manager', 'HR Admin'])->get();
```

### Controllers & Policies
*(Requires separate audit)*

---

## 3. Package Boundary Violations

### Direct Core Model Imports (23 violations)
- All listeners import `use Aero\Core\Models\User;`
- Services import Core User model
- No abstraction layer or contract usage

### Missing Contracts/Interfaces
- No `UserRepositoryInterface` or `EmployeeRepositoryInterface`
- Direct Eloquent queries throughout
- Tight coupling to Core package

---

## 4. Events & Notifications Context

### Events Referencing User Instead of Employee
✅ **LeaveRequested**, **LeaveApproved**, etc. - Reference Leave entity (OK, Leave belongs to Employee)
⚠️  **Notification Recipients** - Resolved via Employee->user relationship (acceptable pattern)

---

## 5. Onboarding Flow Analysis

### Current State
- No explicit onboarding guard middleware
- Controllers don't validate Employee existence before HRM operations
- Missing `EnsureEmployeeOnboarded` middleware

### Required Implementations
1. `EnsureEmployeeExists` middleware
2. Onboarding event: `EmployeeOnboarded`
3. Validation layer in controllers

---

## 6. Relationship Constraints

### Database Constraints (Needs Verification)
- ✅ Employee has `user_id` foreign key
- ⚠️  Missing unique constraint on `employees.user_id`?
- ❌ No cascade rules for Employee deletion

---

## 7. Authorization Service Usage

### Current HRMAC Integration
✅ **NotifyManagerOfLeaveRequest.php** - Uses HRMAC with fallback
❌ Other listeners - Still use hardcoded roles

### Required Refactoring
All listeners should use:
```php
$usersWithAccess = $hrmacService->getUsersWithSubModuleAccess('hrm', $submodule, $action);
```

---

## Recommended Fixes Priority

### P0 - Critical (Immediate)
1. Refactor all listeners to use HRMAC instead of hardcoded roles
2. Remove Core User model usage from Services
3. Add Employee existence guards

### P1 - High (This Sprint)
4. Create EmployeeRepository abstraction
5. Implement onboarding middleware
6. Add database constraints

### P2 - Medium (Next Sprint)
7. Audit controllers and policies
8. Frontend authorization guards
9. API middleware consistency

---

## Compliance Status
- ✅ Employee-centric domain: **42% compliant**
- ❌ Package isolation: **15% compliant**
- ❌ Authorization (no hardcoded roles): **4% compliant**
- ⚠️  Onboarding enforcement: **Not implemented**

**Overall Compliance:** **20% / 100%**
