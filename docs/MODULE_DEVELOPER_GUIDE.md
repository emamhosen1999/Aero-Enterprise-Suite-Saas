# Module System Developer Guide

## Overview

The Aero Enterprise Suite SaaS uses a comprehensive hierarchical module system with four levels:

1. **Modules** - Top-level functional areas (e.g., HRM, CRM, Finance)
2. **Submodules** - Logical sections within modules (e.g., Employees, Attendance)
3. **Components** - Specific pages or features (e.g., Employee List, Attendance Dashboard)
4. **Actions** - Granular operations (e.g., view, create, update, delete)

## Architecture

### Module Structure

```
modules/
├── platform_hierarchy/    # Platform Admin modules (14 modules)
│   ├── platform-dashboard
│   ├── tenants
│   ├── subscriptions
│   └── ...
└── hierarchy/             # Tenant modules (14 modules)
    ├── core
    ├── hrm
    ├── crm
    └── ...
```

### Metadata Fields

Each module includes:

- `code` - Unique identifier (e.g., 'hrm', 'crm')
- `name` - Display name
- `description` - Module description
- `icon` - HeroIcon component name
- `route_prefix` - Base route path
- `category` - Module category
- `priority` - Display order
- `is_core` - Cannot be disabled if true
- `is_active` - Current status
- `version` - Semantic version (e.g., '1.0.0')
- `min_plan` - Minimum subscription plan required
- `license_type` - Classification: core, standard, addon
- `dependencies` - Array of required module codes
- `release_date` - Initial release date

## Adding a New Module

### 1. Define Module in Config

Edit `config/modules.php` and add your module to the appropriate hierarchy:

```php
// For tenant modules
'hierarchy' => [
    [
        'code' => 'inventory',
        'name' => 'Inventory Management',
        'description' => 'Complete inventory control',
        'icon' => 'ArchiveBoxIcon',
        'route_prefix' => '/tenant/inventory',
        'category' => 'supply_chain',
        'priority' => 50,
        'is_core' => false,
        'is_active' => true,
        'version' => '1.0.0',
        'min_plan' => 'business',
        'license_type' => 'standard',
        'dependencies' => ['core'],
        'release_date' => '2024-01-01',
        
        'submodules' => [
            [
                'code' => 'dashboard',
                'name' => 'Dashboard',
                'description' => 'Inventory overview',
                'icon' => 'ChartBarSquareIcon',
                'route' => '/tenant/inventory/dashboard',
                'priority' => 1,
                
                'components' => [
                    [
                        'code' => 'overview',
                        'name' => 'Inventory Overview',
                        'type' => 'page',
                        'route' => '/tenant/inventory/dashboard',
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Dashboard'],
                            ['code' => 'export', 'name' => 'Export Data'],
                        ],
                    ],
                ],
            ],
        ],
    ],
],
```

### 2. Run Module Seeder

```bash
php artisan db:seed --class=ModuleSeeder
```

This will populate the database with your module hierarchy.

### 3. Assign Module to Plans

Update `database/seeders/PlanModuleSeeder.php` to assign your module to appropriate plans:

```php
$plan->modules()->attach($module->id, [
    'limits' => [
        'max_warehouses' => 10,
        'max_products' => 1000,
    ],
    'is_enabled' => true,
]);
```

### 4. Create Routes

Create routes file `routes/inventory.php`:

```php
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:web', 'tenant'])->prefix('tenant/inventory')->group(function () {
    Route::get('/dashboard', [InventoryController::class, 'dashboard'])
        ->middleware('module:inventory,dashboard')
        ->name('tenant.inventory.dashboard');
});
```

### 5. Create Controllers

```php
namespace App\Http\Controllers\Tenant\Inventory;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('Tenant/Pages/Inventory/Dashboard', [
            'title' => 'Inventory Dashboard',
            // ... data
        ]);
    }
}
```

### 6. Create Frontend Pages

Create React component at `resources/js/Tenant/Pages/Inventory/Dashboard.jsx`:

```jsx
import { Head } from '@inertiajs/react';
import App from '@/Layouts/App';
import { Card, CardBody } from "@heroui/react";

export default function Dashboard({ title }) {
    return (
        <>
            <Head title={title} />
            <div className="py-6">
                <Card>
                    <CardBody>
                        <h1>Inventory Dashboard</h1>
                        {/* Dashboard content */}
                    </CardBody>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <App children={page} />;
```

## Access Control

### Module Middleware

Protect routes with the `module` middleware:

```php
// Check module access
->middleware('module:inventory')

// Check submodule access
->middleware('module:inventory,dashboard')

// Check component access  
->middleware('module:inventory,dashboard,overview')

// Check action access
->middleware('module:inventory,dashboard,overview,view')
```

### Access Logic

User access is granted when:

1. **Super Admin Bypass**: Platform/Tenant super admins bypass all checks
2. **Plan Access**: Module is included in tenant's subscription plan
3. **Role Access**: User's role has been granted access to the module hierarchy level

Formula: `User Access = Super Admin Bypass OR (Plan Access ∩ Role Module Access)`

### Programmatic Access Checks

```php
use App\Services\Module\ModuleAccessService;

public function someMethod(ModuleAccessService $moduleAccess)
{
    $user = auth()->user();
    
    // Check module access
    $result = $moduleAccess->canAccessModule($user, 'inventory');
    if (!$result['allowed']) {
        abort(403, $result['message']);
    }
    
    // Check action access
    $result = $moduleAccess->canPerformAction(
        $user, 
        'inventory', 
        'dashboard', 
        'overview', 
        'view'
    );
}
```

### Frontend Access Checks

Use the `RequireModule` component:

```jsx
import RequireModule from '@/Components/RequireModule';

export default function SomePage() {
    return (
        <RequireModule 
            module="inventory" 
            submodule="dashboard"
            fallback={<p>Access Denied</p>}
        >
            {/* Protected content */}
        </RequireModule>
    );
}
```

## License Types

- **core**: Essential modules available in all plans (e.g., core, platform-dashboard)
- **standard**: Business features (e.g., hrm, crm, project)
- **addon**: Premium features (e.g., dms, quality, compliance)

## Dependencies

Specify required modules in the `dependencies` array:

```php
'dependencies' => ['core', 'hrm'],
```

The system will validate dependencies during:
- Module activation
- Plan configuration
- Tenant provisioning

## Best Practices

1. **Follow Naming Conventions**
   - Module codes: lowercase with hyphens (e.g., 'document-management')
   - Submodule codes: descriptive, lowercase (e.g., 'employee-list')
   - Component codes: noun-action format (e.g., 'employee-list', 'payroll-generate')
   - Action codes: verb format (e.g., 'view', 'create', 'update', 'delete')

2. **Keep Hierarchy Organized**
   - Max 15 submodules per module
   - Max 10 components per submodule
   - Max 10 actions per component

3. **Use Appropriate Icons**
   - Use @heroicons/react/24/outline icons
   - Keep icons consistent within module category

4. **Set Proper Priorities**
   - Lower numbers appear first
   - Core modules: 1-10
   - Standard modules: 20-70
   - Addon modules: 80-99

5. **Version Your Modules**
   - Use semantic versioning (MAJOR.MINOR.PATCH)
   - Increment version on breaking changes

6. **Document Dependencies**
   - Always list required modules
   - Keep dependency chains shallow
   - Avoid circular dependencies

## Testing

### Unit Tests

```php
use Tests\TestCase;
use App\Services\Module\ModuleAccessService;

class ModuleAccessTest extends TestCase
{
    public function test_user_can_access_module_with_plan()
    {
        $user = User::factory()->create();
        $service = app(ModuleAccessService::class);
        
        $result = $service->canAccessModule($user, 'hrm');
        
        $this->assertTrue($result['allowed']);
    }
}
```

### Feature Tests

```php
public function test_inventory_dashboard_requires_module_access()
{
    $user = User::factory()->create();
    
    $response = $this->actingAs($user)
        ->get(route('tenant.inventory.dashboard'));
    
    $response->assertStatus(403);
}
```

## Troubleshooting

### Module Not Appearing

1. Check if module is seeded: `SELECT * FROM modules WHERE code = 'your-module'`
2. Verify `is_active = 1`
3. Clear cache: `php artisan cache:clear`
4. Re-seed: `php artisan db:seed --class=ModuleSeeder`

### Access Denied

1. Check user's plan includes module
2. Verify role has module access assigned
3. Check module dependencies are satisfied
4. Review middleware configuration

### Dependency Issues

1. Ensure required modules exist
2. Check dependency chain is valid
3. Verify no circular dependencies

## API Reference

### ModuleAccessService Methods

- `canAccessModule(User $user, string $moduleCode): array`
- `canAccessSubModule(User $user, string $moduleCode, string $subModuleCode): array`
- `canAccessComponent(User $user, string $moduleCode, string $subModuleCode, string $componentCode): array`
- `canPerformAction(User $user, string $moduleCode, string $subModuleCode, string $componentCode, string $actionCode): array`

### Module Model Methods

- `Module::active()` - Scope for active modules
- `Module::ordered()` - Scope for priority ordering
- `Module::getCompleteHierarchy()` - Get full cached hierarchy
- `Module::clearCache()` - Clear module cache

## Further Reading

- [Access Control Documentation](./access-control.md)
- [Plan Management Guide](./plan-management.md)
- [Tenant Provisioning](./tenant-provisioning.md)
