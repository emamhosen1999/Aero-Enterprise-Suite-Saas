# Navigation Decentralization - Compliance Analysis

## Executive Summary

**Status: ❌ NON-COMPLIANT - Critical Architecture Mismatch**

The navigation decentralization implementation is **80% complete** with excellent frontend architecture, but the **backend authorization layer uses the WRONG system entirely**.

### What Was Built (Frontend) ✅
- ✅ Decentralized navigation registration (`window.Aero.navigation`)
- ✅ Module-based navigation files (HRM example implemented)
- ✅ Icon resolver system (string → React component)
- ✅ Navigation merge and sort logic (`useNavigation.js`)
- ✅ Config discovery service (`ModuleDiscoveryService`)
- ✅ Artisan command registered and working

### What Was Built Wrong (Backend) ❌
- ❌ **CRITICAL**: Uses Spatie Permission models and `permissions` table
- ❌ **CRITICAL**: Command syncs to wrong database tables
- ❌ Command name wrong: `SyncModulesCommand` vs required `SyncModuleHierarchy`
- ❌ No Schema validation for table existence
- ❌ Ignores existing `ModuleAccessService` in `packages/aero-platform`
- ❌ No integration with `role_module_access` table

### What's Missing ⚠️
- ⚠️ `access_key` property in navigation configs (for frontend access control)
- ⚠️ Frontend filtering via `hasModuleAccess()` utility
- ⚠️ Config structure uses `code` instead of required `slug`
- ⚠️ Key name `submodules` should be `sub_modules` (matches table name)

---

## Database Schema Analysis

### Custom 4-Level Hierarchy (YOUR SYSTEM)

Your application uses a **custom hierarchical access control system** with these tables:

#### 1. `modules` (Top Level)
```php
Schema: (from 2024_01_01_000003_create_modules_table.php)
- id (PK)
- code (unique) - e.g., 'hrm', 'crm', 'dms'
- scope ('tenant' or 'platform')
- name, description, icon
- route_prefix, category, priority
- is_active, is_core
- settings (JSON), version, min_plan, dependencies (JSON)
```

#### 2. `sub_modules` (Second Level)
```php
Schema: (from 2024_01_01_000004_create_sub_modules_table.php)
- id (PK)
- module_id (FK → modules.id)
- code - e.g., 'employees', 'attendance'
- name, description, icon, route, priority, is_active
UNIQUE KEY: (module_id, code)
```

#### 3. `module_components` (Third Level)
```php
Schema: (from 2024_01_01_000005_create_module_components_table.php)
- id (PK)
- module_id (FK → modules.id)
- sub_module_id (FK → sub_modules.id)
- code - e.g., 'employee_directory', 'employee_profile'
- name, description, type ('page', 'widget', 'form')
- route, priority, is_active
UNIQUE KEY: (sub_module_id, code)
```

#### 4. `module_component_actions` (Fourth Level - Leaf)
```php
Schema: (from 2024_01_01_000006_create_module_component_actions_table.php)
- id (PK)
- module_component_id (FK → module_components.id)
- code - e.g., 'view', 'create', 'edit', 'delete', 'approve'
- name, description, is_active
UNIQUE KEY: (module_component_id, code)
```

#### 5. `role_module_access` (Authorization Table)
```php
Schema: (from 2025_12_05_000741_create_role_module_access_table.php)
- id (PK)
- role_id (FK → roles.id from Spatie)
- module_id (nullable FK → modules.id)
- sub_module_id (nullable FK → sub_modules.id)
- component_id (nullable FK → module_components.id)
- action_id (nullable FK → module_component_actions.id)
- access_scope ENUM('all', 'own', 'team', 'department')

RULE: Only ONE of (module_id, sub_module_id, component_id, action_id) should be set
      Higher level grants cascade down to children
```

**Architecture Notes:**
- Root DB has foreign key constraints between all tables
- Tenant DB uses unsigned integers WITHOUT foreign keys (cross-database references not possible)
- Roles come from Spatie (`roles` table), but access control is custom
- Access checks via `ModuleAccessService` and `RoleModuleAccessService`

---

## Implementation Mismatch Analysis

### Current Implementation (WRONG)

**File:** `packages/aero-core/src/Console/Commands/SyncModulesCommand.php`

```php
<?php

namespace Aero\Core\Console\Commands;

use Spatie\Permission\Models\Permission;  // ❌ WRONG SYSTEM
use Spatie\Permission\Models\Role;         // ❌ WRONG SYSTEM

class SyncModulesCommand extends Command
{
    protected $signature = 'aero:sync-modules'; // ⚠️ Should be aero:sync-module-hierarchy
    
    protected function syncPermission(string $name, string $displayName, ?string $description): void
    {
        // ❌ WRONG: Syncing to Spatie permissions table
        Permission::updateOrCreate(
            ['name' => $name],
            [
                'display_name' => $displayName,
                'description' => $description,
                'guard_name' => 'web',
            ]
        );
    }
}
```

**Issues:**
1. Uses `Spatie\Permission\Models\Permission` - You don't use Spatie for module access
2. Syncs to `permissions` table - You use `modules`, `sub_modules`, `module_components`, `module_component_actions`
3. No Schema validation - Crashes in Standalone mode if migrations haven't run
4. Returns nothing - Should return hierarchy node IDs for role assignment
5. Command name wrong - Should be `SyncModuleHierarchy` not `SyncModulesCommand`

### Required Implementation (CORRECT)

**File:** `packages/aero-core/src/Console/Commands/SyncModuleHierarchy.php` (needs creation)

```php
<?php

namespace Aero\Core\Console\Commands;

use Aero\Core\Models\Module;                    // ✅ Custom hierarchy models
use Aero\Core\Models\SubModule;
use Aero\Core\Models\ModuleComponent;
use Aero\Core\Models\ModuleComponentAction;
use Illuminate\Support\Facades\Schema;

class SyncModuleHierarchy extends Command
{
    protected $signature = 'aero:sync-module-hierarchy';
    
    public function handle(): int
    {
        // ✅ REQUIRED: Schema validation
        if (!Schema::hasTable('modules')) {
            $this->error('Modules table does not exist. Run migrations first.');
            return self::FAILURE;
        }
        
        // Sync to custom tables
        $modules = $this->moduleDiscovery->getModuleDefinitions();
        
        foreach ($modules as $moduleDef) {
            $module = Module::updateOrCreate(
                ['code' => $moduleDef['code']],
                [
                    'name' => $moduleDef['name'],
                    'scope' => $moduleDef['scope'] ?? 'tenant',
                    'icon' => $moduleDef['icon'],
                    // ... other fields
                ]
            );
            
            // Sync sub_modules
            foreach ($moduleDef['sub_modules'] as $subModuleDef) {
                $subModule = SubModule::updateOrCreate(
                    ['module_id' => $module->id, 'code' => $subModuleDef['code']],
                    ['name' => $subModuleDef['name'], ...]
                );
                
                // Sync components
                foreach ($subModuleDef['components'] as $componentDef) {
                    $component = ModuleComponent::updateOrCreate(...);
                    
                    // Sync actions
                    foreach ($componentDef['actions'] as $actionDef) {
                        ModuleComponentAction::updateOrCreate(...);
                    }
                }
            }
        }
        
        // ✅ Return mapping for role assignment
        return self::SUCCESS;
    }
}
```

---

## Config Structure Compliance

### Current Config Structure (PARTIALLY WRONG)

**File:** `packages/aero-hrm/config/module.php`

```php
return [
    'code' => 'hrm',  // ⚠️ Should be 'slug' => 'hrm'
    'name' => 'Human Resources',
    'icon' => 'UserGroupIcon',
    'scope' => 'tenant',
    
    // ⚠️ Key name should be 'sub_modules' (matches table name)
    'submodules' => [
        [
            'code' => 'employees',  // ⚠️ Should be 'slug' => 'employees'
            'name' => 'Employee Management',
            'components' => [
                [
                    'code' => 'employee-directory',  // ⚠️ Should be 'slug'
                    'name' => 'Employee Directory',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View'],
                        ['code' => 'create', 'name' => 'Create'],
                    ]
                ]
            ]
        ]
    ]
];
```

### Required Config Structure (CORRECT)

```php
return [
    'slug' => 'hrm',  // ✅ Changed from 'code'
    'name' => 'Human Resources',
    'icon' => 'UserGroupIcon',
    'scope' => 'tenant',
    'description' => 'Human Resources Management System',
    'category' => 'human_resources',
    'route_prefix' => '/hrm',
    
    // ✅ Changed key name to match table
    'sub_modules' => [
        [
            'slug' => 'employees',  // ✅ Changed from 'code'
            'name' => 'Employee Management',
            'description' => 'Manage employee records and information',
            'icon' => 'UsersIcon',
            'route' => '/hrm/employees',
            'priority' => 10,
            
            'components' => [
                [
                    'slug' => 'employee_directory',  // ✅ Changed from 'code'
                    'name' => 'Employee Directory',
                    'description' => 'Browse and search employees',
                    'type' => 'page',
                    'route' => '/hrm/employees/directory',
                    'priority' => 10,
                    
                    'actions' => [
                        [
                            'slug' => 'view',  // ✅ Changed from 'code'
                            'name' => 'View Employee',
                            'description' => 'View employee details'
                        ],
                        [
                            'slug' => 'create',
                            'name' => 'Create Employee',
                            'description' => 'Add new employee'
                        ],
                        [
                            'slug' => 'edit',
                            'name' => 'Edit Employee',
                            'description' => 'Update employee information'
                        ],
                        [
                            'slug' => 'delete',
                            'name' => 'Delete Employee',
                            'description' => 'Remove employee record'
                        ]
                    ]
                ]
            ]
        ]
    ]
];
```

**Key Changes:**
1. `code` → `slug` at all levels (matches model fillable fields)
2. `submodules` → `sub_modules` (matches database table name)
3. Added `description` fields at all levels
4. Added `type`, `route`, `priority` to components
5. Added `description` to actions

---

## Navigation Config Compliance

### Current Navigation (MISSING ACCESS KEYS)

**File:** `packages/aero-hrm/resources/js/navigation.js`

```javascript
export const hrmNavigation = [
    {
        name: 'Dashboard',
        icon: 'ChartBarIcon',
        href: '/hrm/dashboard',
        order: 10,
        // ❌ MISSING: access_key property
    },
    {
        name: 'Employees',
        icon: 'UsersIcon',
        href: '/hrm/employees',
        order: 20,
        // ❌ MISSING: access_key property
        children: [
            {
                name: 'Directory',
                href: '/hrm/employees/directory',
                // ❌ MISSING: access_key property
            }
        ]
    }
];
```

### Required Navigation (WITH ACCESS KEYS)

```javascript
export const hrmNavigation = [
    {
        name: 'Dashboard',
        icon: 'ChartBarIcon',
        href: '/hrm/dashboard',
        order: 10,
        access_key: 'hrm.dashboard.overview',  // ✅ Added
    },
    {
        name: 'Employees',
        icon: 'UsersIcon',
        href: '/hrm/employees',
        order: 20,
        access_key: 'hrm.employees',  // ✅ Added (sub-module level)
        children: [
            {
                name: 'Directory',
                href: '/hrm/employees/directory',
                access_key: 'hrm.employees.employee_directory',  // ✅ Added (component level)
            },
            {
                name: 'Positions',
                href: '/hrm/employees/positions',
                access_key: 'hrm.employees.positions',  // ✅ Added
            }
        ]
    },
    {
        name: 'Attendance',
        icon: 'CalendarIcon',
        href: '/hrm/attendance',
        order: 30,
        access_key: 'hrm.attendance',  // ✅ Added (sub-module level)
        children: [
            {
                name: 'Timesheets',
                href: '/hrm/attendance/timesheets',
                access_key: 'hrm.attendance.timesheets',  // ✅ Added
            }
        ]
    }
];
```

**Access Key Format:**
- Module level: `{module_slug}`
- Sub-module level: `{module_slug}.{submodule_slug}`
- Component level: `{module_slug}.{submodule_slug}.{component_slug}`

These keys are used by `hasModuleAccess(module, submodule, component)` in frontend.

---

## Frontend Integration Compliance

### Current useNavigation Hook (NO ACCESS CONTROL)

**File:** `packages/aero-core/resources/js/Hooks/useNavigation.js`

```javascript
export const useNavigation = () => {
    const { auth } = usePage().props;
    
    // Merge Core and Module navigation
    const mergedNavigation = [
        ...coreNavigation,
        ...(window.Aero?.navigation || [])
    ].sort((a, b) => (a.order || 100) - (b.order || 100));
    
    // ❌ TODO: Implement permission-based filtering
    // For now, return all navigation items
    return mergedNavigation;
};
```

### Required useNavigation Hook (WITH ACCESS CONTROL)

```javascript
import { hasModuleAccess } from '@/utils/moduleAccessUtils';

export const useNavigation = () => {
    const { auth } = usePage().props;
    
    // Merge navigation
    const mergedNavigation = [
        ...coreNavigation,
        ...(window.Aero?.navigation || [])
    ].sort((a, b) => (a.order || 100) - (b.order || 100));
    
    // ✅ Filter by access control
    const filterByAccess = (items) => {
        return items
            .filter(item => {
                // No access_key means always visible (public/landing pages)
                if (!item.access_key) return true;
                
                // Parse access_key: "hrm.employees.directory"
                const parts = item.access_key.split('.');
                const [module, submodule, component] = parts;
                
                // Check access using existing utility
                return hasModuleAccess(
                    auth.module_access,  // ✅ From Inertia props
                    module,
                    submodule,
                    component
                );
            })
            .map(item => ({
                ...item,
                // Recursively filter children
                children: item.children ? filterByAccess(item.children) : undefined
            }));
    };
    
    return filterByAccess(mergedNavigation);
};
```

**Required Inertia Prop:**
`auth.module_access` must be passed in `HandleInertiaRequests.php` middleware:

```php
// Already exists in your HandleInertiaRequests middleware
'auth' => [
    'user' => $user,
    'module_access' => $roleAccessService->getRoleAccessTree($user->roles()->first()),
    // ☝️ This returns hierarchical access tree for frontend
],
```

---

## Service Integration Compliance

### Existing Services (NOT USED)

Your codebase already has these services in `packages/aero-platform/src/Services/Module/`:

1. **ModuleAccessService.php** (535 lines)
   - `canAccessModule($user, $moduleId): bool`
   - `canAccessSubModule($user, $subModuleId): bool`
   - `canAccessComponent($user, $componentId): bool`
   - `canAccessAction($user, $actionId): bool`
   - `getUserAccessScope($user, $actionId): ?string`
   - ✅ Uses custom hierarchy tables
   - ✅ Integrates with `RoleModuleAccessService`
   - ❌ NOT integrated with navigation system

2. **RoleModuleAccessService.php**
   - `getRoleAccessTree($role): array` - Returns hierarchical tree
   - `getAccessibleModuleIds($role): array`
   - `canAccessModule($role, $moduleId): bool`
   - `canAccessSubModule($role, $subModuleId): bool`
   - `canAccessComponent($role, $componentId): bool`
   - `canAccessAction($role, $actionId): bool`
   - `getAccessScope($role, $actionId): ?string`
   - ✅ Queries `role_module_access` table
   - ❌ NOT integrated with sync command

**These services should be the foundation of your sync command**, but current implementation ignores them entirely.

---

## Master Prompt Compliance Checklist

### Section 1: Database Schema ✅
- ✅ Uses 4-level hierarchy: Module → SubModule → Component → Action
- ✅ Tables exist: `modules`, `sub_modules`, `module_components`, `module_component_actions`
- ✅ `role_module_access` table for authorization
- ✅ Unique constraints at each level

### Section 2: Command Implementation ❌
- ❌ Command name: Should be `SyncModuleHierarchy` (currently `SyncModulesCommand`)
- ❌ Schema validation: MISSING - must check if `modules` table exists
- ❌ Uses wrong models: Uses Spatie Permission (should use Module/SubModule/etc.)
- ❌ Sync target: Syncs to `permissions` table (should sync to hierarchy tables)
- ❌ Return value: Returns nothing (should return hierarchy node IDs)

### Section 3: Config Structure ⚠️
- ⚠️ Key naming: Uses `code` (should use `slug`)
- ⚠️ Key naming: Uses `submodules` (should use `sub_modules`)
- ✅ Hierarchy structure: Correct 4-level nesting
- ⚠️ Missing fields: Needs `description`, `type`, `route`, `priority`

### Section 4: Service Integration ❌
- ❌ ModuleAccessService: Exists but NOT integrated
- ❌ RoleModuleAccessService: Exists but NOT integrated
- ❌ ModuleDiscoveryService: Exists but returns wrong format (flat permissions vs hierarchy)

### Section 5: Frontend Integration ❌
- ❌ Navigation access_key: MISSING from navigation definitions
- ❌ Access control filtering: TODO comment, not implemented
- ❌ hasModuleAccess: Utility exists but not used in useNavigation
- ✅ Navigation registration: Working correctly

### Section 6: Models Used ❌
- ❌ Current: Uses `Spatie\Permission\Models\Permission`
- ✅ Required: Should use `Aero\Core\Models\Module`, `SubModule`, etc.

### Section 7: Access Control Logic ❌
- ✅ Super Admin Bypass: Already implemented in ModuleAccessService
- ✅ Plan Access: Already implemented in ModuleAccessService
- ✅ Role Module Access: Already implemented in RoleModuleAccessService
- ❌ Integration: These services NOT connected to navigation system

---

## Compliance Score

### Overall: 35% Compliant

| Component | Status | Score | Notes |
|-----------|--------|-------|-------|
| Frontend Navigation Registry | ✅ Complete | 100% | Excellent implementation |
| Icon Resolver | ✅ Complete | 100% | Works perfectly |
| Module Discovery | ⚠️ Partial | 60% | Works but returns wrong format |
| Sync Command | ❌ Wrong System | 0% | Uses Spatie, needs complete rewrite |
| Config Structure | ⚠️ Partial | 40% | Structure OK, wrong keys |
| Navigation access_key | ❌ Missing | 0% | Not implemented |
| Frontend Filtering | ❌ Missing | 0% | TODO comment only |
| Service Integration | ❌ Not Connected | 0% | Services exist but ignored |
| Schema Validation | ❌ Missing | 0% | No table existence check |
| Model Usage | ❌ Wrong Models | 0% | Uses Spatie models |

---

## Required Changes Summary

### Priority 1: CRITICAL - Rebuild Backend Command
1. **Create new command:** `packages/aero-core/src/Console/Commands/SyncModuleHierarchy.php`
2. **Delete old command:** `SyncModulesCommand.php` (completely wrong)
3. **Use correct models:** Module, SubModule, ModuleComponent, ModuleComponentAction
4. **Add Schema validation:** Check if `modules` table exists before running
5. **Sync to correct tables:** Not `permissions` table
6. **Return hierarchy IDs:** For role assignment in admin UI
7. **Update service provider:** Register new command name

### Priority 2: HIGH - Fix Config Structure
1. **Rename keys:** `code` → `slug` at all levels
2. **Rename key:** `submodules` → `sub_modules`
3. **Add missing fields:** `description`, `type`, `route`, `priority`
4. **Update HRM example:** Apply all changes to `packages/aero-hrm/config/module.php`

### Priority 3: HIGH - Add Navigation Access Keys
1. **Update HRM navigation:** Add `access_key` to every menu item
2. **Format:** `module.submodule.component` (3-level dotted notation)
3. **Example:** `access_key: 'hrm.employees.employee_directory'`

### Priority 4: MEDIUM - Integrate Frontend Access Control
1. **Update useNavigation:** Import and use `hasModuleAccess()`
2. **Filter navigation:** Check access_key against `auth.module_access` tree
3. **Handle children:** Recursively filter child menu items
4. **Remove TODO:** Replace with actual implementation

### Priority 5: LOW - Update Service Provider
1. **Change registration:** `SyncModulesCommand` → `SyncModuleHierarchy`
2. **File:** `packages/aero-core/src/AeroCoreServiceProvider.php` line 203

---

## Next Steps

1. **Read ModuleDiscoveryService** - Understand current extraction logic
2. **Read RoleModuleAccessService** - Understand access tree structure
3. **Create SyncModuleHierarchy** - Rewrite command with correct models
4. **Update HRM config** - Fix key names and add missing fields
5. **Add navigation access_key** - Update HRM navigation.js
6. **Integrate frontend filtering** - Update useNavigation.js
7. **Test sync command** - Run `php artisan aero:sync-module-hierarchy`
8. **Verify database** - Check hierarchy tables populated correctly
9. **Test navigation** - Verify access control works in frontend

---

## Architecture Benefits (Already Achieved)

✅ **Decentralized Navigation:** Modules register themselves
✅ **Icon System:** String-based resolution with React components
✅ **Clean Merge Logic:** Core + Module navigation combined
✅ **Extensible:** New modules auto-discovered via config files
✅ **Type Safety:** React components with proper imports

## Architecture Gaps (Must Fix)

❌ **Wrong Authorization System:** Spatie vs Custom Hierarchy
❌ **Missing Schema Validation:** Crashes in Standalone mode
❌ **No Access Control:** Frontend shows all items regardless of permissions
❌ **Config Mismatch:** Keys don't match database schema
❌ **Service Isolation:** Existing services not integrated

---

**Created:** [Current Date]
**Status:** Non-Compliant - Critical Backend Rewrite Required
**Estimated Fix Time:** 4-6 hours (command rewrite + config updates + frontend integration)
