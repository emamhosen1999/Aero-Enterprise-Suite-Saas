# Unified HRMAC Approach Documentation

## Overview

This document describes the **unified HRMAC (Hierarchical Role-Based Module Access Control)** approach used throughout the Aero Enterprise Suite. The system enforces access control through a single consistent pattern across both frontend and backend.

**Key Principle:** NO hardcoded role names. All authorization is determined by module/submodule/component/action access grants.

---

## Architecture Hierarchy

```
Module (e.g., 'hrm')
  └── SubModule (e.g., 'leaves')
        └── Component (e.g., 'leave-requests')
              └── Action (e.g., 'approve', 'view', 'create', 'update', 'delete')
```

**Access Inheritance:**
- Module access → grants access to ALL submodules
- SubModule access → grants access to ALL components  
- Component access → grants access to ALL actions
- Action access → grants access to ONLY that action

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `modules` | Top-level modules (HRM, CRM, Finance, etc.) |
| `sub_modules` | Sub-modules within each module |
| `module_components` | Components within sub-modules |
| `module_actions` | Actions within components |
| `role_module_access` | Maps role_id → module/submodule/component/action IDs |

---

## Backend Implementation

### 1. HRMAC Service (`aero-hrmac`)

**RoleModuleAccessService** provides:
```php
// Check access by IDs
canAccessModule($role, int $moduleId): bool
canAccessSubModule($role, int $subModuleId): bool
canAccessComponent($role, int $componentId): bool
canAccessAction($role, int $actionId): bool

// Check access by codes (user-level)
userCanAccessModule($user, string $moduleCode): bool
userCanAccessSubModule($user, string $moduleCode, string $subModuleCode): bool

// Get role's access tree (for frontend sharing)
getRoleAccessTree($role): array
// Returns: {modules: [id,...], sub_modules: [id,...], components: [id,...], actions: [{id, scope}]}

// Get users with specific access (for notifications)
getUsersWithSubModuleAccess(string $moduleCode, string $subModuleCode, ?string $actionCode): Collection
getUsersWithActionAccess(string $moduleCode, string $subModuleCode, string $componentCode, string $actionCode): Collection
```

### 2. Route Protection Middleware (`CheckRoleModuleAccess`)

**Usage in routes:**
```php
Route::middleware(['role.access:hrm,leaves'])->group(function () {
    Route::get('/leaves', [LeaveController::class, 'index']);
});

// With component level
Route::middleware(['role.access:hrm,leaves,leave-requests'])->group(function () {
    Route::post('/leaves', [LeaveController::class, 'store']);
});
```

### 3. Inertia Data Sharing

**HandleInertiaRequests** (Platform for SaaS, Core for Standalone) shares:
```php
$user = [
    // ... basic user data
    'module_access' => [
        'modules' => [1, 2, 5],           // Module IDs user can access
        'sub_modules' => [3, 7, 12],      // SubModule IDs
        'components' => [8, 15, 22],      // Component IDs
        'actions' => [                     // Actions with scope
            ['id' => 10, 'scope' => 'all'],
            ['id' => 15, 'scope' => 'department'],
        ],
    ],
    'accessible_modules' => [
        ['id' => 1, 'code' => 'hrm', 'name' => 'Human Resources'],
        ['id' => 2, 'code' => 'crm', 'name' => 'Customer Relations'],
    ],
    'modules_lookup' => [1 => 'hrm', 2 => 'crm'],  // id => code
    'sub_modules_lookup' => [3 => 'hrm.leaves', 7 => 'hrm.employees'],  // id => 'module.submodule'
];
```

---

## Frontend Implementation

### 1. moduleAccessUtils.js (Base Functions)

Located at: `packages/aero-ui/resources/js/utils/moduleAccessUtils.js`

```javascript
// Hierarchical checks
hasModuleAccess(moduleCode, auth)          // 'hrm'
hasSubModuleAccess(moduleCode, subModuleCode, auth)  // 'hrm', 'leaves'
hasComponentAccess(moduleCode, subModuleCode, componentCode, auth)
canPerformAction(moduleCode, subModuleCode, componentCode, actionCode, auth)

// Unified dot-notation check
hasAccess('hrm.leaves.leave-requests.approve', auth)

// Access scope
getActionScope('hrm.leaves.leave-requests.approve', auth)  // 'all', 'department', 'team', 'own'

// Super Admin check (bypasses all access checks)
isSuperAdmin(user)

// Navigation filtering
filterNavigationByAccess(navItems, auth)
```

### 2. useHRMAC Hook (React Integration)

Located at: `packages/aero-ui/resources/js/Hooks/useHRMAC.js`

```jsx
import { useHRMAC } from '@/Hooks/useHRMAC';

const MyComponent = () => {
    const { 
        hasAccess, 
        canCreate, 
        canUpdate, 
        canDelete,
        isSuperAdmin,
        getActionScope 
    } = useHRMAC();

    return (
        <>
            {hasAccess('hrm.leaves') && <LeavesList />}
            
            {canCreate('hrm.leaves.leave-requests') && (
                <Button>Request Leave</Button>
            )}
            
            {getActionScope('hrm.leaves.leave-requests.approve') === 'all' && (
                <ApproveAllButton />
            )}
        </>
    );
};
```

**Available methods:**
- `hasAccess(path)` - dot notation: 'hrm.leaves.leave-requests.create'
- `hasModuleAccess(moduleCode)`
- `hasSubModuleAccess(moduleCode, subModuleCode)`
- `hasComponentAccess(moduleCode, subModuleCode, componentCode)`
- `canPerformAction(moduleCode, subModuleCode, componentCode, actionCode)`
- `canCreate(basePath)` - shorthand for `hasAccess(basePath + '.create')`
- `canView(basePath)`, `canUpdate(basePath)`, `canDelete(basePath)`
- `canExport(basePath)`, `canImport(basePath)`
- `checkMultiple([paths])` - returns `{path: boolean, ...}`
- `hasAny([paths])`, `hasAll([paths])`
- `isSuperAdmin()`, `user`, `auth`, `isAuthenticated()`
- `getActionScope(actionPath)` - returns 'all', 'department', 'team', 'own'

### 3. useSaaSAccess Hook (SaaS + RBAC Combined)

Located at: `packages/aero-ui/resources/js/Hooks/useSaaSAccess.js`

For SaaS mode, combines subscription checking with RBAC:
```jsx
import { useSaaSAccess } from '@/Hooks/useSaaSAccess';

const { 
    hasAccess,           // Subscription + RBAC combined
    hasSubscription,     // Just subscription check
    isSaaSMode,
    filterNavigation,    // Applies both filters
} = useSaaSAccess();
```

---

## Domain Separation: User vs Employee

### Architectural Rule
- **Core package** deals with `User` (authentication, general system access)
- **HRM package** deals with `Employee` (HR-specific data and processes)
- **Events and services use `employee_id`** as the primary identifier

### Cross-Package Communication

**EmployeeServiceContract** (in aero-core, implemented by aero-hrm):
```php
interface EmployeeServiceContract
{
    public function getById(int $employeeId): ?array;
    public function getByUserId(int $userId): ?array;
    public function getUserId(int $employeeId): ?int;
    public function getEmployeeId(int $userId): ?int;
    public function getManagerEmployeeId(int $employeeId): ?int;
    public function getDepartmentId(int $employeeId): ?int;
    public function getDepartmentEmployeeIds(int $departmentId): Collection;
    public function getDirectReportEmployeeIds(int $managerEmployeeId): Collection;
    public function batchResolveUserIds(Collection $employeeIds): Collection;
}
```

### HRM Events Pattern

All HRM events extend `BaseHrmEvent` and use `employee_id`:
```php
class LeaveRequested extends BaseHrmEvent
{
    public function __construct(
        public readonly int $leaveId,
        public readonly int $employeeId,        // Who requested leave
        public readonly int $actorEmployeeId,   // Who triggered the event
        // ...
    ) {}
    
    // Returns module path for HRMAC routing
    public function getModuleCode(): string { return 'hrm'; }
    public function getSubModuleCode(): string { return 'leaves'; }
    public function getComponentCode(): ?string { return 'leave-requests'; }
    public function getActionCode(): ?string { return 'create'; }
}
```

---

## Notification Routing

**HrmacNotificationRoutingService** resolves recipients via HRMAC:
```php
$recipients = $notificationService->getRecipients(
    moduleCode: 'hrm',
    subModuleCode: 'leaves',
    componentCode: 'leave-requests',
    actionCode: 'approve',
    context: [
        'employee_id' => $leave->employee_id,
        'manager_employee_id' => $leave->employee->manager_employee_id,
        'department_id' => $leave->employee->department_id,
        'actor_employee_id' => $approverEmployeeId,
    ]
);
```

**Flow:**
1. Gets all users with HRMAC access to `hrm.leaves.leave-requests.approve`
2. Applies context filtering (always includes direct manager)
3. Excludes the actor (they don't need to be notified of their own action)
4. Returns user models for Laravel notification dispatch

---

## Access Scope

Actions can have scopes that limit what data the user can access:

| Scope | Meaning |
|-------|---------|
| `all` | Access to all records |
| `department` | Access to records in user's department |
| `team` | Access to direct reports only |
| `own` | Access to own records only |

**Frontend usage:**
```jsx
const scope = getActionScope('hrm.employees.employee-directory.view');

if (scope === 'all') {
    // Show all employees
} else if (scope === 'department') {
    // Filter by current user's department
} else if (scope === 'team') {
    // Filter by direct reports
} else if (scope === 'own') {
    // Show only own record
}
```

**Backend usage:**
The action scope is stored in `role_module_access.access_scope` and returned in the access tree.

---

## Best Practices

### ✅ DO
- Use `useHRMAC()` hook for all access checks in React components
- Use `hasAccess('module.submodule.component.action')` dot notation
- Use `CheckRoleModuleAccess` middleware for route protection
- Use `employee_id` in HRM events and services
- Let HRMAC determine notification recipients

### ❌ DON'T
- Hardcode role names: `if (user.role === 'HR Manager')`
- Use if/else role checks: `if (user.hasRole('admin'))`
- Import User model in HRM package (use EmployeeServiceContract)
- Check permissions directly: `if (user.can('approve-leave'))`

---

## File Locations

| File | Purpose |
|------|---------|
| `aero-hrmac/src/Services/RoleModuleAccessService.php` | Backend HRMAC service |
| `aero-hrmac/src/Http/Middleware/CheckRoleModuleAccess.php` | Route protection middleware |
| `aero-hrmac/src/Contracts/RoleModuleAccessInterface.php` | Service interface |
| `aero-core/src/Http/Middleware/HandleInertiaRequests.php` | Standalone mode data sharing |
| `aero-platform/src/Http/Middleware/HandleInertiaRequests.php` | SaaS mode data sharing |
| `aero-core/src/Contracts/EmployeeServiceContract.php` | Cross-package employee access |
| `aero-core/src/Contracts/NotificationRoutingContract.php` | HRMAC-aware notification routing |
| `aero-core/src/Services/HrmacNotificationRoutingService.php` | Notification routing implementation |
| `aero-ui/resources/js/utils/moduleAccessUtils.js` | Frontend access utilities |
| `aero-ui/resources/js/Hooks/useHRMAC.js` | React HRMAC hook |
| `aero-ui/resources/js/Hooks/useSaaSAccess.js` | SaaS + RBAC combined hook |
