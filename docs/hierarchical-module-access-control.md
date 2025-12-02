# Hierarchical Module Access Control System

## Overview

The application now implements a comprehensive **4-level hierarchical module access control system** that combines subscription-based entitlements with role-based permissions (Hybrid RBAC).

**Access Formula:**
```
User Access = Plan Access (subscription) ∩ Permission Match (RBAC)
```

## Architecture

### 1. Configuration-Based Hierarchy

Modules are defined in `config/modules.php` as the **single source of truth**. The hierarchy has 4 levels:

```
Modules → Submodules → Components → Actions
```

**Example from config/modules.php:**
```php
[
    'code' => 'hrm',
    'name' => 'Human Resources',
    'default_required_permissions' => ['hr.access'],
    'submodules' => [
        [
            'code' => 'employees',
            'name' => 'Employee Management',
            'components' => [
                [
                    'code' => 'employee-list',
                    'name' => 'Employee List',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'default_required_permissions' => ['hr.employees.view']],
                        ['code' => 'create', 'name' => 'Create', 'default_required_permissions' => ['hr.employees.create']],
                        ['code' => 'update', 'name' => 'Update', 'default_required_permissions' => ['hr.employees.update']],
                        ['code' => 'delete', 'name' => 'Delete', 'default_required_permissions' => ['hr.employees.delete']],
                    ]
                ]
            ]
        ]
    ]
]
```

### 2. Database Schema

**Tables:**
- `modules` - Top level modules (HRM, CRM, Project, Finance, Core)
- `sub_modules` - Features within modules
- `module_components` - UI components within submodules
- `module_component_actions` - Granular actions within components
- `module_permissions` - Links all 4 levels to Spatie permissions
- `plan_module` - Pivot table linking subscription plans to modules

**Key Relationships:**
- Module → hasMany SubModules
- SubModule → hasMany Components
- Component → hasMany Actions
- Module → belongsToMany Plans (via plan_module pivot)
- All levels → morphMany ModulePermissions

### 3. Data Seeding

The `ModuleSeeder` reads from `config/modules.php` and:
1. Seeds all 4 hierarchy levels
2. Auto-creates Spatie permissions based on `default_required_permissions`
3. Links permissions to hierarchy levels via `module_permissions` table

**Current Data (as of 2025-12-02):**
- 5 modules (Core, HRM, CRM, Project, Finance)
- 34 submodules
- 23 components
- 78 actions
- 114 permission mappings

### 4. Access Control Service

`App\Services\Module\ModuleAccessService` provides centralized access checking:

**Methods:**
- `canAccessModule(User $user, string $moduleCode): array`
- `canAccessSubModule(User $user, string $moduleCode, string $subModuleCode): array`
- `canAccessComponent(User $user, string $moduleCode, string $subModuleCode, string $componentCode): array`
- `canPerformAction(User $user, string $moduleCode, string $subModuleCode, string $componentCode, string $actionCode): array`

**Each method returns:**
```php
[
    'allowed' => bool,      // true if access granted
    'reason' => string,     // 'success', 'plan_restriction', 'insufficient_permissions', 'not_found'
    'message' => string     // Human-readable message
]
```

**Access Validation Steps:**
1. **Plan Check**: Is the module/submodule/component/action in the tenant's subscription plan?
2. **Permission Check**: Does the user have at least ONE of the required permissions for that level?
3. **Hierarchical Validation**: For lower levels, validates parent levels first

### 5. Middleware Integration

`App\Http\Middleware\CheckModuleAccess` enforces access at route level.

**Usage Examples:**
```php
// Module level
Route::get('/hr', [HRController::class, 'index'])
    ->middleware('module:hrm');

// Submodule level
Route::get('/hr/employees', [EmployeeController::class, 'index'])
    ->middleware('module:hrm,employees');

// Component level
Route::get('/hr/employees/list', [EmployeeController::class, 'list'])
    ->middleware('module:hrm,employees,employee-list');

// Action level
Route::post('/hr/employees', [EmployeeController::class, 'store'])
    ->middleware('module:hrm,employees,employee-list,create');
```

**Response Codes:**
- `401` - Not authenticated or no tenant association
- `402` - Plan restriction (upgrade required)
- `403` - Insufficient permissions
- `404` - Module/submodule/component/action not found

### 6. Frontend Integration

#### 6.1 Inertia Props

`App\Http\Middleware\HandleInertiaRequests` shares hierarchy data with frontend:

```php
// Shared with all Inertia pages (lazy-loaded)
'tenant.activeModules' => fn () => $this->getTenantActiveModules(),  // Modules in subscription
'modules' => fn () => $this->getAllModules(),                         // All active modules
'moduleHierarchy' => fn () => $this->getModuleHierarchy()            // Complete 4-level tree
```

**moduleHierarchy Structure:**
```javascript
[
    {
        id: 1,
        code: 'hrm',
        name: 'Human Resources',
        icon: 'users',
        route_prefix: 'hr',
        submodules: [
            {
                id: 1,
                code: 'employees',
                name: 'Employee Management',
                components: [
                    {
                        id: 1,
                        code: 'employee-list',
                        name: 'Employee List',
                        actions: [
                            { id: 1, code: 'view', name: 'View' },
                            { id: 2, code: 'create', name: 'Create' },
                            // ...
                        ]
                    }
                ]
            }
        ]
    }
]
```

#### 6.2 Error Pages

`resources/js/Tenant/Pages/Errors/Forbidden.jsx` handles access denials:

**Features:**
- Distinguishes between plan restrictions (402) and permission issues (403)
- Shows hierarchical access path (module > submodule > component > action)
- Provides action buttons:
  - Plan restriction → "View Plans" (links to subscription page)
  - Permission issue → "Go to Dashboard" + "Go Back"
- Animated UI with gradient styling

### 7. Caching Strategy

**Multi-layer caching for performance:**

| Cache Key | TTL | Purpose |
|-----------|-----|---------|
| `tenant_modules_access:{tenant_id}` | 5 min | Active modules in tenant's subscription |
| `frontend_module_hierarchy` | 10 min | Complete 4-level hierarchy for frontend |
| `tenant_active_modules:{tenant_id}` | 5 min | Active modules with structure |
| `all_active_modules` | 1 hour | All active modules (flat) |
| `user_accessible_modules:{user_id}` | 5 min | User's accessible modules |

**Cache Clearing:**
- `Module::clearCache()` - Clears all module-related caches
- `ModuleAccessService::clearUserCache(User $user)` - Clears user-specific caches

## Usage Guide

### For Developers

#### 1. Adding a New Module

Edit `config/modules.php`:
```php
[
    'code' => 'new-module',
    'name' => 'New Module',
    'icon' => 'icon-name',
    'route_prefix' => 'new',
    'default_required_permissions' => ['new-module.access'],
    'submodules' => [
        // Add submodules...
    ]
]
```

Then run:
```bash
php artisan db:seed --class=ModuleSeeder
```

#### 2. Protecting Routes

```php
Route::middleware(['auth', 'module:hrm,employees,employee-list,view'])
    ->get('/hr/employees', [EmployeeController::class, 'index']);
```

#### 3. Checking Access Programmatically

```php
use App\Services\Module\ModuleAccessService;

$accessService = app(ModuleAccessService::class);

// Check module access
$result = $accessService->canAccessModule($user, 'hrm');
if ($result['allowed']) {
    // Grant access
} else {
    // Deny: $result['reason'], $result['message']
}

// Check action access
$result = $accessService->canPerformAction($user, 'hrm', 'employees', 'employee-list', 'delete');
```

#### 4. Frontend Permission Checks

```jsx
import { usePage } from '@inertiajs/react';

export default function EmployeeList() {
    const { moduleHierarchy } = usePage().props;
    
    // Find HRM module
    const hrmModule = moduleHierarchy.find(m => m.code === 'hrm');
    
    // Check if user can create employees
    const canCreate = hrmModule?.submodules
        .find(s => s.code === 'employees')?.components
        .find(c => c.code === 'employee-list')?.actions
        .some(a => a.code === 'create');
        
    return (
        <div>
            {canCreate && <button>Create Employee</button>}
        </div>
    );
}
```

### For Platform Admins

#### 1. Linking Modules to Plans

```php
// In PlanModuleSeeder or admin panel
$plan = Plan::find($planId);
$module = Module::where('code', 'hrm')->first();

$plan->modules()->attach($module->id, [
    'is_enabled' => true,
    'limits' => json_encode(['max_employees' => 100])
]);
```

#### 2. Customizing Required Permissions

The `default_required_permissions` in config can be overridden at the database level by updating the `module_permissions` table's `is_required` field.

### For Tenant Admins

#### 1. Creating Custom Roles

```php
use Spatie\Permission\Models\Role;

$role = Role::create(['name' => 'HR Manager']);
$role->givePermissionTo([
    'hr.access',
    'hr.employees.view',
    'hr.employees.create',
    'hr.employees.update'
]);
```

#### 2. Assigning Roles to Users

```php
$user->assignRole('HR Manager');
```

## Testing

### Unit Tests

Located at `tests/Feature/Module/HierarchicalAccessControlTest.php`

**Test Coverage:**
- Module access without subscription (should deny)
- Module access without permission (should deny)
- Module access with both (should allow)
- Submodule, component, and action access validation
- Hierarchical validation (parent level failure blocks child access)

**To run tests:**
```bash
# Note: Enable sqlite test database in phpunit.xml first
php artisan test --filter=HierarchicalAccessControlTest
```

### Manual Testing Checklist

- [ ] Verify module hierarchy loads in frontend
- [ ] Test route protection at all 4 levels
- [ ] Verify 402 response for plan restrictions
- [ ] Verify 403 response for permission denials
- [ ] Check error page displays correct information
- [ ] Verify cache invalidation works
- [ ] Test with multiple tenants and subscriptions
- [ ] Verify permission inheritance works correctly

## Performance Considerations

1. **Eager Loading**: Service methods use eager loading to prevent N+1 queries
2. **Caching**: Multi-layer caching with appropriate TTLs
3. **Lazy Props**: Frontend data is lazy-loaded via Inertia to reduce initial payload
4. **Database Indexes**: Ensure indexes on:
   - `modules.code`
   - `sub_modules.code`
   - `module_components.code`
   - `module_component_actions.code`
   - `module_permissions.module_id`, `permission_id`
   - `plan_module.plan_id`, `module_id`

## Future Enhancements

### Phase 2 (Recommended)
- [ ] Create Platform Admin UI for plan-module configuration
- [ ] Update `ModuleManagement.jsx` to render 4-level tree
- [ ] Update `RoleManagement.jsx` to show permissions grouped by hierarchy
- [ ] Add helper Blade components for permission checks
- [ ] Create Artisan command to sync config → database
- [ ] Add module usage analytics

### Phase 3 (Advanced)
- [ ] Sub-module/component level restrictions in `plan_module` pivot
- [ ] Dynamic permission creation via UI
- [ ] Module versioning and upgrades
- [ ] API rate limiting per module
- [ ] Module-specific feature flags
- [ ] Audit logging for access attempts

## Troubleshooting

### Cache Issues
```bash
php artisan cache:clear
Module::clearCache();
```

### Permission Not Working
1. Check if permission exists: `php artisan permission:show`
2. Verify user has role: `$user->roles`
3. Check module_permissions links: Query `module_permissions` table
4. Clear user cache: `ModuleAccessService::clearUserCache($user)`

### Module Not Appearing
1. Verify seeded: Query `modules` table
2. Check `is_active` flag
3. Verify in subscription plan: Query `plan_module` table
4. Clear module cache

## Related Files

**Backend:**
- `config/modules.php` - Module hierarchy definition
- `app/Services/Module/ModuleAccessService.php` - Access control service
- `app/Http/Middleware/CheckModuleAccess.php` - Route protection middleware
- `app/Http/Middleware/HandleInertiaRequests.php` - Frontend data sharing
- `database/seeders/ModuleSeeder.php` - Hierarchy seeder
- `app/Models/Module.php`, `SubModule.php`, `ModuleComponent.php`, `ModuleComponentAction.php`

**Frontend:**
- `resources/js/Tenant/Pages/Errors/Forbidden.jsx` - Access denial page
- `resources/js/Tenant/Pages/Administration/ModuleManagement.jsx` - Module admin UI (to be updated)
- `resources/js/Tenant/Pages/Administration/RoleManagement.jsx` - Role admin UI (to be updated)

**Tests:**
- `tests/Feature/Module/HierarchicalAccessControlTest.php` - Access control tests

## Conclusion

The hierarchical module access control system provides:
- ✅ Config-driven module definition
- ✅ 4-level granular access control
- ✅ Hybrid RBAC (subscription + permissions)
- ✅ Tenant-scoped permissions
- ✅ Performance-optimized with caching
- ✅ Frontend integration via Inertia
- ✅ Comprehensive error handling

The system is now ready for integration with UI components and further customization based on business requirements.
