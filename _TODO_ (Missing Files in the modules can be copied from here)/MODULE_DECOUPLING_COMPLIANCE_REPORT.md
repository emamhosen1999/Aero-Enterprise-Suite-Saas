# Module Decoupling Compliance Report
**Date:** December 9, 2025  
**Scope:** aero-core ↔ aero-hrm module independence analysis

## Executive Summary

**Overall Status:** ⚠️ **PARTIALLY COMPLIANT** - Critical violations found that prevent aero-core from running standalone.

### Key Findings
- ✅ **Service Providers:** Properly decoupled using AbstractModuleProvider pattern
- ✅ **Frontend Pages:** Properly separated in respective module packages
- ✅ **Routes:** Properly isolated in separate packages
- ✅ **Backend Controllers:** Properly separated by namespace
- ⚠️ **Navigation (pages.jsx):** Centralized in main app (not in modules) - **NEEDS DECISION**
- ❌ **User Model:** **CRITICAL** - aero-core has hard dependencies on aero-hrm models
- ❌ **Main Routes:** Main web.php imports aero-hrm controllers directly

---

## Architecture Review

### ✅ What's Working Well

#### 1. Service Provider Architecture
**Status:** ✅ COMPLIANT

Both modules follow the correct pattern:

**aero-core:**
```php
// aero-core/src/Providers/AeroCoreServiceProvider.php
namespace Aero\Core\Providers;

class AeroCoreServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Registers ModuleRegistry singleton
        $this->app->singleton(ModuleRegistry::class);
        $this->app->singleton(ModuleAccessService::class);
    }
}

// aero-core/src/Providers/CoreModuleProvider.php
class CoreModuleProvider extends AbstractModuleProvider
{
    protected string $moduleCode = 'core';
    protected string $moduleName = 'Core';
    protected array $navigationItems = [/* Core nav */];
}
```

**aero-hrm:**
```php
// aero-hrm/src/Providers/HRMServiceProvider.php
namespace Aero\HRM\Providers;

class HRMServiceProvider extends AbstractModuleProvider
{
    protected string $moduleCode = 'hrm';
    protected string $moduleName = 'Human Resources';
    protected array $dependencies = ['core']; // Correct dependency declaration
    protected array $navigationItems = [/* HRM nav */];
}
```

✅ **Verdict:** Both use AbstractModuleProvider and properly register with ModuleRegistry.

---

#### 2. Frontend Pages Separation
**Status:** ✅ COMPLIANT

Frontend pages are properly separated:

**aero-core/resources/js/Pages/**
```
├── Auth/           # Login, Register
├── Modules/        # Module management
├── Roles/          # Role & permission management
└── Users/          # User management
```

**aero-hrm/resources/js/Pages/**
```
├── Analytics/      # HR analytics
├── AttendanceAdmin.jsx
├── AttendanceEmployee.jsx
├── Dashboard.jsx
├── Departments.jsx
├── Designations.jsx
├── Holidays.jsx
├── LeavesAdmin.jsx
├── LeavesEmployee.jsx
├── Onboarding/
├── Payroll/
├── Performance/
├── Recruitment/
└── Training/
```

✅ **Verdict:** No cross-contamination. Each module owns its frontend pages.

---

#### 3. Routes Separation
**Status:** ✅ COMPLIANT

**aero-core/routes/web.php:**
```php
// Authentication, Dashboard, Profile, Users, Roles only
Route::get('login', [AuthenticatedSessionController::class, 'create']);
Route::resource('users', UserController::class);
Route::resource('roles', RoleController::class);
```

**aero-hrm/routes/tenant.php:**
```php
// All HRM routes (employees, attendance, leaves, payroll, etc.)
Route::prefix('hr')->name('hr.')->group(function () {
    Route::get('/dashboard', [PerformanceReviewController::class, 'dashboard']);
    Route::resource('employees', EmployeeController::class);
    Route::resource('attendance', AttendanceController::class);
    // ... etc
});
```

✅ **Verdict:** Routes properly separated by module scope.

---

### ⚠️ Design Decision Required

#### 4. Navigation Structure (pages.jsx)
**Status:** ⚠️ **ARCHITECTURAL DECISION NEEDED**

**Current State:**
- **Main pages.jsx location:** `resources/js/Props/pages.jsx` (in main app, NOT in aero-core)
- **Contains:** Both core AND HRM navigation items mixed together
- **No HRM-specific pages.jsx:** aero-hrm does NOT have its own pages.jsx

**File Structure:**
```javascript
// resources/js/Props/pages.jsx (Main App - NOT in aero-core or aero-hrm)
export const getPages = (roles, permissions, auth = null) => {
  const pages = [
    // Core navigation
    {
      name: 'Dashboards',
      icon: <HomeIcon />,
      module: 'core',
      access: 'core.dashboard',
      subMenu: [/* core items */]
    },
    
    // HRM navigation (mixed into same file!)
    {
      name: 'HRM',
      icon: <UserGroupIcon />,
      module: 'hrm',
      access: 'hrm',
      subMenu: [
        { name: 'Employees', route: 'employees', access: 'hrm.employees' },
        { name: 'Attendance', route: 'attendances', access: 'hrm.attendance' },
        // ... all HRM nav items
      ]
    },
    
    // More modules (Finance, Project, POS, etc.)
  ];
};
```

**Issue Analysis:**

**Option A: Current Centralized Approach (Main App Orchestration)**
- ✅ **Pro:** Single source of truth for navigation
- ✅ **Pro:** Easy to reorder modules globally
- ✅ **Pro:** Consistent navigation merging logic
- ❌ **Con:** Main app knows about all module routes
- ❌ **Con:** pages.jsx becomes massive with many modules
- ❌ **Con:** Can't distribute modules independently

**Option B: Distributed Approach (Module-Owned Navigation)**
- ✅ **Pro:** Each module owns its navigation
- ✅ **Pro:** True module independence
- ✅ **Pro:** Can distribute modules as packages
- ❌ **Con:** Need navigation registry/merging system
- ❌ **Con:** More complex to maintain ordering
- ❌ **Con:** Duplicate icon/helper imports

**Recommendation:** 

For a SaaS platform with modular packages, **Option B (Distributed)** is architecturally superior:

```javascript
// aero-core/resources/js/navigation/pages.jsx
export const getCoreNavigation = (auth) => [
  {
    name: 'Dashboards',
    icon: <HomeIcon />,
    module: 'core',
    access: 'core.dashboard',
    priority: 1,
    subMenu: [/* core items */]
  },
  {
    name: 'Users',
    icon: <UserGroupIcon />,
    module: 'core',
    access: 'core.users',
    priority: 2,
    subMenu: [/* user management */]
  }
];

// aero-hrm/resources/js/navigation/pages.jsx
export const getHRMNavigation = (auth) => [
  {
    name: 'HRM',
    icon: <UserGroupIcon />,
    module: 'hrm',
    access: 'hrm',
    priority: 10,
    subMenu: [/* all HRM nav */]
  }
];

// Main app: resources/js/Props/navigationRegistry.js
import { getCoreNavigation } from '@aero/core/navigation/pages';
import { getHRMNavigation } from '@aero/hrm/navigation/pages';

const navigationProviders = [
  getCoreNavigation,
  getHRMNavigation,
  // ... other modules
];

export const getPages = (roles, permissions, auth) => {
  const allNavItems = navigationProviders
    .map(provider => provider(auth))
    .flat()
    .sort((a, b) => a.priority - b.priority);
  
  return allNavItems;
};
```

⚠️ **Decision Required:** Choose architectural approach and implement accordingly.

---

### ❌ Critical Violations

#### 5. User Model Hard Dependencies on HRM
**Status:** ❌ **CRITICAL VIOLATION** - Prevents standalone operation

**File:** `aero-core/src/Models/User.php`

**Problem:** The User model in aero-core directly imports and uses HRM models:

```php
<?php
namespace Aero\Core\Models;

// CRITICAL: Hard dependencies on HRM models
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\AttendanceType;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;

class User extends Authenticatable
{
    // Hard-coded HRM relationships
    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    public function department(): HasOneThrough
    {
        return $this->hasOneThrough(Department::class, Employee::class, ...);
    }

    public function designation(): HasOneThrough
    {
        return $this->hasOneThrough(Designation::class, Employee::class, ...);
    }

    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class, 'user_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'user_id');
    }

    public function attendanceType()
    {
        return $this->belongsTo(AttendanceType::class, 'attendance_type_id');
    }

    // Query scopes with HRM relations
    public function scopeWithBasicRelations($query)
    {
        return $query->with([
            'employee.department:id,name',
            'employee.designation:id,title',
        ]);
    }

    public function scopeWithFullRelations($query)
    {
        return $query->with([
            'employee',
            'employee.department',
            'employee.designation',
            'attendanceType',
        ]);
    }
}
```

**Impact:**
- ❌ aero-core **CANNOT** run without aero-hrm installed
- ❌ Composer will fail if aero-hrm is not required
- ❌ Violates core principle: "aero-core is fully independent"

---

#### 6. Main Routes Import HRM Controllers
**Status:** ❌ **VIOLATION** - Main app has direct HRM dependencies

**File:** `routes/web.php` (main app)

```php
<?php
// Main application routes importing HRM controllers directly
use Aero\HRM\Controllers\Attendance\AttendanceController;
use Aero\HRM\Controllers\Employee\DepartmentController;
use Aero\HRM\Controllers\Employee\DesignationController;
use Aero\HRM\Controllers\Employee\EmployeeController;
use Aero\HRM\Controllers\Employee\LetterController;
use Aero\HRM\Controllers\Employee\ProfileController;
use Aero\HRM\Controllers\Leave\BulkLeaveController;
use Aero\HRM\Controllers\Leave\LeaveController;
// ... many more HRM imports

// Routes defined in main web.php instead of HRM module
Route::get('/employees', [EmployeeController::class, 'index']);
Route::get('/attendance', [AttendanceController::class, 'index']);
// ... etc
```

**Problem:**
- Main app `web.php` should NOT import HRM controllers
- HRM routes should be auto-registered by HRMServiceProvider
- Current setup couples main app to HRM module

**Expected:** HRM routes should be loaded via:
```php
// aero-hrm/src/Providers/HRMServiceProvider.php
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../../routes/tenant.php');
}
```

---

## Compliance Violations Summary

| Component | Status | Issue | Priority |
|-----------|--------|-------|----------|
| Service Providers | ✅ | Properly decoupled | - |
| Frontend Pages | ✅ | Separated correctly | - |
| Routes Files | ✅ | Module-specific | - |
| Navigation (pages.jsx) | ⚠️ | Centralized (needs decision) | Medium |
| User Model | ❌ | Hard HRM dependencies | **CRITICAL** |
| Main Routes | ❌ | Imports HRM controllers | High |

---

## Recommended Fixes

### 🔴 CRITICAL FIX 1: Remove HRM Dependencies from User Model

**Strategy:** Use dynamic relationship resolution (Macros/Service Container)

#### Step 1: Create Relationship Registry in aero-core

```php
// aero-core/src/Services/UserRelationshipRegistry.php
<?php
namespace Aero\Core\Services;

class UserRelationshipRegistry
{
    protected array $relationships = [];
    protected array $scopes = [];

    public function registerRelationship(string $name, \Closure $callback): void
    {
        $this->relationships[$name] = $callback;
    }

    public function registerScope(string $name, \Closure $callback): void
    {
        $this->scopes[$name] = $callback;
    }

    public function getRelationship(string $name): ?\Closure
    {
        return $this->relationships[$name] ?? null;
    }

    public function getScope(string $name): ?\Closure
    {
        return $this->scopes[$name] ?? null;
    }

    public function hasRelationship(string $name): bool
    {
        return isset($this->relationships[$name]);
    }
}
```

#### Step 2: Update User Model (aero-core)

```php
<?php
namespace Aero\Core\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $fillable = [
        'name', 'user_name', 'email', 'phone', 'password',
        'active', 'profile_image', 'about', 'locale',
        // Remove all HRM-specific fields from here
    ];

    /**
     * Dynamically handle relationships registered by modules.
     */
    public function __call($method, $parameters)
    {
        $registry = app(UserRelationshipRegistry::class);
        
        if ($registry->hasRelationship($method)) {
            $callback = $registry->getRelationship($method);
            return $callback($this);
        }

        return parent::__call($method, $parameters);
    }

    /**
     * Dynamic scope resolution.
     */
    public function scopeDynamic($query, $scopeName, ...$parameters)
    {
        $registry = app(UserRelationshipRegistry::class);
        
        if ($callback = $registry->getScope($scopeName)) {
            return $callback($query, ...$parameters);
        }

        return $query;
    }

    // Keep only core relationships (devices, roles, permissions)
    public function devices(): HasMany
    {
        return $this->hasMany(UserDevice::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'model_has_roles', 'model_id', 'role_id')
            ->where('model_type', self::class);
    }
}
```

#### Step 3: Register HRM Relationships (aero-hrm)

```php
<?php
// aero-hrm/src/Providers/HRMServiceProvider.php
namespace Aero\HRM\Providers;

use Aero\Core\Models\User;
use Aero\Core\Services\UserRelationshipRegistry;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\AttendanceType;

class HRMServiceProvider extends AbstractModuleProvider
{
    public function boot(): void
    {
        parent::boot();
        
        // Register HRM relationships with User model
        $this->registerUserRelationships();
    }

    protected function registerUserRelationships(): void
    {
        $registry = app(UserRelationshipRegistry::class);

        // Register employee relationship
        $registry->registerRelationship('employee', function ($user) {
            return $user->hasOne(Employee::class);
        });

        // Register department through employee
        $registry->registerRelationship('department', function ($user) {
            return $user->hasOneThrough(
                Department::class,
                Employee::class,
                'user_id',
                'id',
                'id',
                'department_id'
            );
        });

        // Register designation through employee
        $registry->registerRelationship('designation', function ($user) {
            return $user->hasOneThrough(
                Designation::class,
                Employee::class,
                'user_id',
                'id',
                'id',
                'designation_id'
            );
        });

        // Register leaves
        $registry->registerRelationship('leaves', function ($user) {
            return $user->hasMany(Leave::class, 'user_id');
        });

        // Register attendances
        $registry->registerRelationship('attendances', function ($user) {
            return $user->hasMany(Attendance::class, 'user_id');
        });

        // Register attendance type
        $registry->registerRelationship('attendanceType', function ($user) {
            return $user->belongsTo(AttendanceType::class, 'attendance_type_id');
        });

        // Register scopes
        $registry->registerScope('withBasicRelations', function ($query) {
            return $query->with([
                'roles:id,name',
                'employee:id,user_id,department_id,designation_id,status',
                'employee.department:id,name',
                'employee.designation:id,title',
            ]);
        });

        $registry->registerScope('withFullRelations', function ($query) {
            return $query->with([
                'roles',
                'employee',
                'employee.department',
                'employee.designation',
                'attendanceType',
            ]);
        });

        $registry->registerScope('employees', function ($query) {
            return $query->whereHas('employee');
        });

        $registry->registerScope('nonEmployees', function ($query) {
            return $query->whereDoesntHave('employee');
        });
    }
}
```

#### Step 4: Register Registry in Core

```php
<?php
// aero-core/src/Providers/AeroCoreServiceProvider.php
namespace Aero\Core\Providers;

use Aero\Core\Services\UserRelationshipRegistry;

class AeroCoreServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Register relationship registry
        $this->app->singleton(UserRelationshipRegistry::class);

        // Other registrations...
        $this->app->singleton(ModuleRegistry::class);
        $this->app->singleton(ModuleAccessService::class);
    }
}
```

#### Step 5: Usage Example

```php
// In any code - relationships work dynamically
$user = User::find(1);

// These work if HRM module is installed
$employee = $user->employee;  // Calls dynamic __call method
$department = $user->department;
$leaves = $user->leaves;

// Scopes also work dynamically
$employees = User::dynamic('employees')->get();
$withRelations = User::dynamic('withBasicRelations')->get();
```

**Benefits:**
✅ aero-core has NO hard dependencies on aero-hrm  
✅ aero-core can run standalone  
✅ HRM relationships available when module installed  
✅ Clean separation of concerns  

---

### 🟠 HIGH PRIORITY FIX 2: Remove HRM Routes from Main web.php

**Current:** Main `routes/web.php` imports HRM controllers

**Solution:** Let HRM module auto-register its own routes

#### Step 1: Ensure HRMServiceProvider loads routes

```php
<?php
// aero-hrm/src/Providers/HRMServiceProvider.php
public function boot(): void
{
    parent::boot();

    // Load HRM routes with proper middleware
    $this->loadRoutesFrom(__DIR__.'/../../routes/tenant.php');
}
```

#### Step 2: Clean up main web.php

```php
<?php
// routes/web.php (Main App)

// Remove ALL HRM controller imports
// use Aero\HRM\Controllers\... ❌ DELETE

// Keep only core/platform routes
use App\Http\Controllers\Tenant\Dashboard\DashboardController;
use App\Http\Controllers\Settings\SystemSettingController;

Route::middleware(['auth', 'tenant'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/settings', [SystemSettingController::class, 'index'])->name('settings');
    // ... only core routes
});

// Module routes are auto-loaded by their service providers
```

#### Step 3: Verify HRM routes load correctly

```bash
# Check routes are registered
php artisan route:list --name=hr
```

---

### 🟡 MEDIUM PRIORITY FIX 3: Implement Distributed Navigation

**Current:** Centralized `resources/js/Props/pages.jsx` contains all module navigation

**Solution:** Each module provides its own navigation

#### Architecture

```javascript
// aero-core/resources/js/navigation/index.jsx
export const getCoreNavigation = (auth) => [
  {
    name: 'Dashboard',
    icon: <HomeIcon />,
    route: 'dashboard',
    module: 'core',
    access: 'core.dashboard',
    priority: 1
  },
  {
    name: 'Users',
    icon: <UserGroupIcon />,
    module: 'core',
    access: 'core.users',
    priority: 5,
    subMenu: [
      { name: 'All Users', route: 'users.index', access: 'core.users.view' },
      { name: 'Roles', route: 'roles.index', access: 'core.roles.view' }
    ]
  }
];

// aero-hrm/resources/js/navigation/index.jsx
export const getHRMNavigation = (auth) => [
  {
    name: 'HRM',
    icon: <UserGroupIcon />,
    module: 'hrm',
    access: 'hrm',
    priority: 10,
    subMenu: [
      { name: 'Employees', route: 'employees.index', access: 'hrm.employees.view' },
      { name: 'Attendance', route: 'attendance.index', access: 'hrm.attendance.view' },
      { name: 'Leaves', route: 'leaves.index', access: 'hrm.leaves.view' },
      // ... all HRM nav
    ]
  }
];

// Main app: resources/js/navigation/registry.js
import { getCoreNavigation } from '@aero/core';
import { getHRMNavigation } from '@aero/hrm';
import { getCRMNavigation } from '@aero/crm';
// ... dynamically import installed modules

class NavigationRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(moduleCode, navigationProvider) {
    this.providers.set(moduleCode, navigationProvider);
  }

  getNavigation(auth, roles, permissions) {
    const navItems = [];
    
    for (const [moduleCode, provider] of this.providers) {
      // Check if user has access to module
      if (hasAccess(moduleCode, auth)) {
        navItems.push(...provider(auth, roles, permissions));
      }
    }

    // Sort by priority
    return navItems.sort((a, b) => a.priority - b.priority);
  }
}

export const navigationRegistry = new NavigationRegistry();

// Auto-register modules (via Vite plugin or manual registration)
navigationRegistry.register('core', getCoreNavigation);
navigationRegistry.register('hrm', getHRMNavigation);
navigationRegistry.register('crm', getCRMNavigation);
```

#### Update Main App Layout

```javascript
// resources/js/Layouts/Sidebar.jsx
import { navigationRegistry } from '@/navigation/registry';

export default function Sidebar({ auth }) {
  const pages = navigationRegistry.getNavigation(auth, auth.roles, auth.permissions);
  
  return (
    <aside>
      {pages.map(page => (
        <NavItem key={page.name} item={page} />
      ))}
    </aside>
  );
}
```

---

## Test Plan

### Unit Tests

```php
// tests/Unit/UserModelIndependenceTest.php
class UserModelIndependenceTest extends TestCase
{
    public function test_user_model_works_without_hrm_module()
    {
        // Ensure User model doesn't crash when HRM models don't exist
        $user = User::factory()->create();
        
        $this->assertNotNull($user->id);
        $this->assertNotNull($user->email);
    }

    public function test_user_relationships_available_when_hrm_installed()
    {
        if (!class_exists('Aero\\HRM\\Models\\Employee')) {
            $this->markTestSkipped('HRM module not installed');
        }

        $user = User::factory()->create();
        
        // These should work dynamically
        $this->assertInstanceOf(Relation::class, $user->employee());
        $this->assertInstanceOf(Relation::class, $user->leaves());
    }
}
```

### Integration Tests

```bash
# Test 1: Install only aero-core
composer require aero/core
php artisan migrate
php artisan test --filter=CoreStandalone

# Test 2: Install aero-core + aero-hrm
composer require aero/core aero/hrm
php artisan migrate
php artisan test --filter=CoreWithHRM
```

---

## Implementation Checklist

### Phase 1: Critical Fixes (Week 1)
- [ ] Create `UserRelationshipRegistry` service in aero-core
- [ ] Update `User` model to use dynamic relationships
- [ ] Update `HRMServiceProvider` to register relationships
- [ ] Remove HRM imports from User model
- [ ] Test User model works without HRM
- [ ] Test User model works with HRM installed

### Phase 2: Routes Cleanup (Week 1)
- [ ] Verify HRMServiceProvider loads routes correctly
- [ ] Remove HRM controller imports from main `routes/web.php`
- [ ] Test all HRM routes still work
- [ ] Update route documentation

### Phase 3: Navigation Refactor (Week 2)
- [ ] Create `NavigationRegistry` service
- [ ] Create `aero-core/resources/js/navigation/index.jsx`
- [ ] Create `aero-hrm/resources/js/navigation/index.jsx`
- [ ] Update main app to use NavigationRegistry
- [ ] Test navigation rendering
- [ ] Apply pattern to other modules (CRM, Finance, etc.)

### Phase 4: Testing & Documentation (Week 2)
- [ ] Write unit tests for UserRelationshipRegistry
- [ ] Write integration tests for standalone core
- [ ] Test all module combinations
- [ ] Update developer documentation
- [ ] Update deployment guide

---

## Success Criteria

✅ **Independence Test:**
```bash
# Should pass without errors
composer create-project --prefer-dist laravel/laravel test-app
cd test-app
composer require aero/core
php artisan migrate
php artisan serve
# Navigate to /login - should work perfectly
```

✅ **Extension Test:**
```bash
# After core is working
composer require aero/hrm
php artisan migrate
php artisan serve
# Navigate to /hr/employees - should work perfectly
# HRM navigation should appear in sidebar
# User relationships (employee, leaves) should work
```

---

## Conclusion

**Current State:** Module decoupling is **partially complete**. Service providers, routes, and frontend pages are properly separated, but critical dependencies prevent true independence.

**Required Actions:**
1. **CRITICAL:** Remove HRM dependencies from User model using dynamic relationship registry
2. **HIGH:** Remove HRM controller imports from main routes
3. **MEDIUM:** Implement distributed navigation system

**Timeline:** 2 weeks to full compliance

**Blocker:** User model hard dependencies must be resolved before aero-core can be considered truly standalone.

---

**Report Generated:** December 9, 2025  
**Reviewed By:** AI Development Agent  
**Next Review:** After Phase 1 completion
