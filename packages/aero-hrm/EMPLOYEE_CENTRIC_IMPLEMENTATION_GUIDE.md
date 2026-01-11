# HRM Employee-Centric Domain: Implementation Guide

**Status**: Phase 1 Complete (Foundation + Critical Services)  
**Date**: January 11, 2026

---

## ✅ Completed Implementation

### Phase 1: Foundation Services (COMPLETED)

#### 1. Core Exception
- ✅ **Created**: `src/Exceptions/UserNotOnboardedException.php`
  - Custom exception for non-onboarded users
  - Provides structured error responses
  - HTTP 403 status code
  - Action hints for resolution

#### 2. Employee Resolution Service
- ✅ **Created**: `src/Services/EmployeeResolutionService.php`
  - Centralized User → Employee mapping
  - Cache-enabled resolution (5-minute TTL)
  - Bulk resolution support
  - Employee code lookup
  - Statistics aggregation
  - **NO direct Core User model usage in business logic**

#### 3. Authorization Service
- ✅ **Created**: `src/Services/HRMAuthorizationService.php`
  - Integrates with `RoleModuleAccessService`
  - **ZERO hardcoded role checks**
  - Module-based authorization:
    - Leave management/approval
    - Attendance management
    - Employee management
    - Department management
    - Performance reviews
    - Payroll operations
    - Reports/exports
    - Document verification
  - Helper methods for managers and department access

#### 4. Middleware
- ✅ **Created**: `src/Http/Middleware/EnsureUserIsEmployee.php`
  - Guards all HRM routes
  - Requires Employee existence
  - Blocks inactive employees
  - Attaches Employee to request
  - Provides actionable error messages
  - Comprehensive logging

#### 5. Service Refactoring
- ✅ **Refactored**: `src/Services/LeaveQueryService.php`
  - Removed hardcoded role check: `$user->hasRole(['admin', 'hr'])`
  - Now uses `HRMAuthorizationService::canViewAllLeaves()`
  - Operates on Employee model
  - Proper exception handling

### Phase 1: Testing (COMPLETED)

#### Test Coverage
- ✅ **Created**: `tests/Unit/Services/EmployeeResolutionServiceTest.php`
  - 13 test cases covering all resolution scenarios
  - Exception handling validation
  - Cache behavior verification
  - Bulk operations testing

- ✅ **Created**: `tests/Unit/Middleware/EnsureUserIsEmployeeTest.php`
  - 7 test cases for middleware behavior
  - Authentication flow validation
  - Employee status checks
  - Request attribute attachment

- ✅ **Created**: `tests/Unit/Services/HRMAuthorizationServiceTest.php`
  - 16 test cases for authorization
  - RoleModuleAccessService integration
  - **Meta-test ensuring NO hardcoded role checks**
  - Manager/department permission validation

---

## 📋 Remaining Implementation

### Phase 2: Service Layer Refactoring

#### High Priority Services
1. **LeaveApprovalService** ✅ COMPLETED
   - **Refactored**: Removed all `User` model references
   - **Changes**: 
     - Constructor injection: `EmployeeResolutionService`, `HRMAuthorizationService`
     - Method signatures updated: `approve(Employee $approver)`, `reject(Employee $approver)`
     - Approval chain now uses `approver_employee_id` instead of `approver_id`
     - HR Manager lookup changed from hardcoded role to `HRMAuthorizationService::canApproveLeave()`
     - All notifications route through `$employee->user`
   - **Lines Changed**: 25+ method updates
   - **Tests**: Pending creation

2. **LeaveBalanceService** ✅ COMPLETED
   - **Refactored**: Operates entirely on Employee model
   - **Changes**:
     - `initializeBalancesForEmployee()` instead of `initializeBalancesForUser()`
     - `getAllBalances(Employee $employee)` updated
     - `hasSufficientBalance(Employee $employee)` updated
     - All database queries use `employee_id` instead of `user_id`
     - Carry forward logic updated to use Employee
     - Summary reporting updated with `employee` relationship
   - **Lines Changed**: 15+ method updates
   - **Tests**: Pending creation

3. **BulkLeaveService** ❌ PENDING
   - Remove User model usage
   - Use Employee for approver context
   - Apply HRMAuthorizationService

2. **LeaveBalanceService** ❌
   - Operate on Employee
   - Remove User dependency

3. **BulkLeaveService** ❌
   - Bulk operations on Employees
   - Authorization per employee

4. **AttendanceCalculationService** ❌
   - Employee-centric attendance
   - Remove User imports

5. **PayrollCalculationService** ❌
   - Calculate for Employee
   - Remove User dependency

### Phase 3: Controller Refactoring

#### Critical Controllers
1. **ProfileController** ❌
   - Change signatures from `User $user` to `Employee $employee`
   - Lines: 43, 117, 172, 308
   
2. **EmployeeController** ❌
   - Update onboard() method
   - Remove User type hints
   - Lines: 63, 129, 222, 339, 908

3. **EmployeeDocumentController** ❌
   - All methods accept Employee
   - Lines: 31, 54, 136, 155, 177, 210, 262

4. **EmployeeProfileController** ❌
   - Update all CRUD methods
   - Lines: 32, 54, 82, 145, 171, 233, 247, 261

5. **AttendanceController** ❌
   - Remove hardcoded role checks
   - Lines: 1654, 1769

6. **ProfileImageController** ❌
   - Remove role string checks
   - Line: 239

### Phase 4: Policy Refactoring

All policies currently use `User $user` parameter. Need to:
- ❌ Update to use Employee
- ❌ Integrate HRMAuthorizationService
- ❌ Remove direct User model imports

**Files**:
- `src/Policies/AttendancePolicy.php`
- `src/Policies/CompetencyPolicy.php`
- `src/Policies/DepartmentPolicy.php`
- `src/Policies/DesignationPolicy.php`
- `src/Policies/OffboardingStepPolicy.php`
- `src/Policies/SkillPolicy.php`
- `src/Policies/TaskTemplatePolicy.php`
- `src/Policies/RecruitmentPolicy.php`

### Phase 5: Events & Notifications

#### Events to Refactor
1. **EmployeeCreated** ❌
   - Remove User from payload
   - Keep only Employee
   - Line 5: `use Aero\Core\Models\User`

2. **LeaveCancelled** ❌
   - Remove User dependency
   - Line 5: `use Aero\Core\Models\User`

#### Listeners to Refactor (12+ files)
1. **SendBirthdayNotifications** ❌
   - Line 96: Remove hardcoded role array

2. **SendDocumentExpiryNotifications** ❌
   - Line 53: Remove hardcoded role strings

3. **SendContractExpiryNotifications** ❌
   - Line 57: Remove hardcoded role strings

4. **NotifySafetyTeam** ❌
   - Line 32: Remove `User::role()` query

5. **SendOffboardingNotification** ❌
   - Remove User dependency

6. **NotifyManagerOfNewEmployee** ❌
   - Remove User dependency

7. **NotifyHROfResignation** ❌
   - Remove User dependency

8. **SendLateArrivalNotification** ❌
   - Remove User dependency

**Pattern to Apply**:
```php
// ❌ OLD (WRONG)
$hrUsers = User::role(['hr', 'hr_manager'])->get();

// ✅ NEW (CORRECT)
$hrEmployees = Employee::whereHas('user', function($q) use ($authService) {
    // Use HRMAuthorizationService to find eligible employees
})->get();
```

### Phase 6: Exports & Jobs

#### Exports
- ❌ `src/Exports/AttendanceAdminExport.php`
- ❌ `src/Exports/AttendanceExport.php`

#### Jobs
- ❌ `src/Jobs/SendAttendanceReminder.php`

### Phase 7: Factories & Tests

#### Factories
- ❌ `database/factories/EmployeeFactory.php`
- ❌ `database/factories/EmployeePersonalDocumentFactory.php`

#### Test Files
- ❌ `tests/Feature/Notifications/*Test.php`
- ❌ `tests/Unit/Services/Leave/LeaveBalanceServiceTest.php`
- ❌ `tests/Unit/Services/Attendance/AttendanceCalculationServiceTest.php`

---

## 🔧 Quick Start: Applying Changes

### 1. Register Services

Add to `src/AeroHRMServiceProvider.php`:

```php
public function register(): void
{
    // Register services as singletons
    $this->app->singleton(EmployeeResolutionService::class);
    $this->app->singleton(HRMAuthorizationService::class);
}
```

### 2. Register Middleware

In `src/AeroHRMServiceProvider.php` or route files:

```php
use Aero\HRM\Http\Middleware\EnsureUserIsEmployee;

// In boot() method
$router = $this->app->make('router');
$router->aliasMiddleware('employee', EnsureUserIsEmployee::class);
```

### 3. Apply Middleware to Routes

In `routes/tenant.php`:

```php
// Protect all HRM routes except onboarding
Route::middleware(['auth', 'employee'])->group(function () {
    Route::prefix('hrm')->name('hrm.')->group(function () {
        // All HRM routes here
    });
});

// Onboarding route (exempt from employee middleware)
Route::middleware(['auth'])->group(function () {
    Route::post('/hrm/onboard', [EmployeeController::class, 'onboard'])
        ->name('hrm.employee.onboard');
});
```

### 4. Using Employee in Controllers

**Before**:
```php
public function index(Request $request)
{
    $user = Auth::user();
    if ($user->hasRole('admin')) {
        // ...
    }
}
```

**After**:
```php
public function index(Request $request)
{
    // Employee is automatically attached by middleware
    $employee = $request->employee();
    
    // Use authorization service
    $authService = app(HRMAuthorizationService::class);
    if ($authService->canManageLeaves($employee)) {
        // ...
    }
}
```

### 5. Using Authorization Service

```php
use Aero\HRM\Services\HRMAuthorizationService;

class LeaveController extends Controller
{
    public function __construct(
        private HRMAuthorizationService $authService
    ) {}
    
    public function approve(Request $request, Leave $leave)
    {
        $employee = $request->employee();
        
        // ❌ OLD: if ($user->hasRole('admin') || $user->can('approve leaves'))
        
        // ✅ NEW:
        if (!$this->authService->canApproveLeave($employee)) {
            abort(403, 'You do not have permission to approve leaves');
        }
        
        // Process approval...
    }
}
```

---

## 📊 Progress Tracker

| Phase | Task | Files | Status |
|-------|------|-------|--------|
| **1** | **Foundation** | 4 | ✅ COMPLETE |
| | Exception | 1 | ✅ |
| | EmployeeResolutionService | 1 | ✅ |
| | HRMAuthorizationService | 1 | ✅ |
| | EnsureUserIsEmployee Middleware | 1 | ✅ |
| **1** | **Critical Service** | 1 | ✅ COMPLETE |
| | LeaveQueryService | 1 | ✅ |
| **1** | **Tests** | 3 | ✅ COMPLETE |
| | EmployeeResolutionServiceTest | 1 | ✅ |
| | EnsureUserIsEmployeeTest | 1 | ✅ |
| | HRMAuthorizationServiceTest | 1 | ✅ |
| **2** | **Services** | 5 | ❌ PENDING |
| **3** | **Controllers** | 6 | ❌ PENDING |
| **4** | **Policies** | 8 | ❌ PENDING |
| **5** | **Events/Listeners** | 10 | ❌ PENDING |
| **6** | **Exports/Jobs** | 3 | ❌ PENDING |
| **7** | **Factories/Tests** | 6 | ❌ PENDING |
| **TOTAL** | | **60+** | **20% COMPLETE** |

---

## 🎯 Next Steps

### Immediate Actions (Day 1-2)
1. ✅ Review and test foundation services
2. ✅ Run unit tests to validate
3. ⏳ Register services in service provider
4. ⏳ Apply middleware to routes
5. ⏳ Update one controller as proof of concept

### Week 1 Goals
- Complete Phase 2 (remaining services)
- Start Phase 3 (critical controllers)
- Achieve 40% completion

### Week 2-3 Goals
- Complete Phase 3 & 4 (controllers + policies)
- Complete Phase 5 (events/notifications)
- Achieve 80% completion

### Week 4 Goals
- Complete Phase 6 & 7 (cleanup)
- Full test suite passing
- 100% completion

---

## 🚨 Critical Rules

### DO
✅ Always resolve Employee first  
✅ Use HRMAuthorizationService for all permissions  
✅ Throw UserNotOnboardedException for non-employees  
✅ Operate on Employee as aggregate root  
✅ Use RoleModuleAccessService via HRMAuthorizationService  

### DON'T
❌ Never import `Aero\Core\Models\User` in HRM logic  
❌ Never use `$user->hasRole('role_string')`  
❌ Never use hardcoded role strings  
❌ Never bypass Employee resolution  
❌ Never query users directly for HRM operations  

---

## 📚 Architecture Reference

### Request Flow
```
HTTP Request
    ↓
Auth Middleware (validates user login)
    ↓
EnsureUserIsEmployee Middleware
    ├─→ resolveFromRequest()
    ├─→ Check employee status
    └─→ Attach employee to request
    ↓
Controller
    ├─→ $employee = $request->employee()
    └─→ Use HRMAuthorizationService
    ↓
Service Layer
    ├─→ Operate on Employee
    └─→ Query via Employee relationships
    ↓
Response
```

### Authorization Flow
```
Controller needs permission check
    ↓
HRMAuthorizationService::can{Action}($employee)
    ↓
RoleModuleAccessService::userCanAccessAction($employee->user, 'hrm', 'submodule', 'action')
    ↓
role_module_access table lookup
    ↓
Boolean result
```

### Domain Model
```
User (Core Package)
    ↓ one-to-one
Employee (HRM Package) ← Aggregate Root
    ↓ relationships
    ├─→ Department
    ├─→ Designation
    ├─→ Manager (Employee)
    ├─→ Leaves
    ├─→ Attendance
    ├─→ Performance Reviews
    └─→ Documents
```

---

## 📝 Validation Checklist

Before marking implementation complete, verify:

- [ ] No `use Aero\Core\Models\User` in HRM services/controllers
- [ ] No `hasRole()` calls in HRM package
- [ ] No hardcoded role strings ('admin', 'hr', etc.)
- [ ] All routes protected by `employee` middleware
- [ ] All controllers accept Employee, not User
- [ ] All authorization via HRMAuthorizationService
- [ ] All tests updated and passing
- [ ] PHPStan/Psalm clean
- [ ] Laravel Pint formatting applied

---

**Implementation Lead**: GitHub Copilot  
**Review Required**: Development Team  
**Target Completion**: Week 4 (January 2026)
