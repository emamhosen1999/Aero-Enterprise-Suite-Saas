# Aero Module Registry System

## Overview

The Module Registry System provides a dynamic, decentralized approach to module management in the Aero Enterprise Suite. It enables:

- **Dynamic Module Discovery**: Automatically discover and load modules at runtime
- **Dependency Management**: Validate module dependencies before loading
- **Navigation Generation**: Automatically build navigation menus from registered modules
- **Route Registration**: Dynamically register routes from module packages
- **Metadata Management**: Centralized access to module information and capabilities

## Architecture

### Core Components

1. **ModuleProviderInterface** - Contract that all modules must implement
2. **ModuleRegistry** - Central registry for module discovery and management
3. **AbstractModuleProvider** - Base class providing common functionality
4. **CoreModuleProvider** - Example implementation for the core tenant module

### Module Lifecycle

```
1. Module Service Provider registered in composer.json
   ↓
2. Laravel auto-discovers and registers the provider
   ↓
3. Module registers itself with ModuleRegistry in register()
   ↓
4. ModuleRegistry validates dependencies
   ↓
5. Module boots and loads routes, views, migrations in boot()
   ↓
6. Module is now available to the application
```

## Creating a Module

### Step 1: Create Module Structure

```
aero-{module}/
├── src/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   ├── Services/
│   ├── Policies/
│   └── Providers/
│       └── {Module}ServiceProvider.php
├── config/
│   └── module.php
├── routes/
│   ├── admin.php
│   ├── tenant.php
│   ├── web.php
│   └── api.php
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   ├── Components/
│   │   ├── pages.jsx
│   │   └── admin_pages.jsx
│   └── views/
├── tests/
├── composer.json
└── README.md
```

### Step 2: Create Module Provider

```php
<?php

namespace Aero\Hrm\Providers;

use Aero\Core\Providers\AbstractModuleProvider;

class HrmModuleProvider extends AbstractModuleProvider
{
    protected string $moduleCode = 'hrm';
    protected string $moduleName = 'Human Resources';
    protected string $moduleDescription = 'Complete HR management system';
    protected string $moduleVersion = '1.0.0';
    protected string $moduleCategory = 'business';
    protected string $moduleIcon = 'UserGroupIcon';
    protected int $modulePriority = 10;
    protected bool $enabled = true;
    protected ?string $minimumPlan = 'professional';
    protected array $dependencies = ['core'];

    protected array $navigationItems = [
        [
            'code' => 'employees',
            'name' => 'Employees',
            'icon' => 'UserIcon',
            'route' => 'hrm.employees.index',
            'priority' => 1,
        ],
        [
            'code' => 'attendance',
            'name' => 'Attendance',
            'icon' => 'ClockIcon',
            'route' => 'hrm.attendance.index',
            'priority' => 2,
        ],
        [
            'code' => 'leaves',
            'name' => 'Leave Management',
            'icon' => 'CalendarIcon',
            'route' => 'hrm.leaves.index',
            'priority' => 3,
        ],
    ];

    protected array $moduleHierarchy = [
        'code' => 'hrm',
        'name' => 'Human Resources',
        'sub_modules' => [
            [
                'code' => 'employees',
                'name' => 'Employee Management',
                'components' => [
                    [
                        'code' => 'employee_list',
                        'name' => 'Employee List',
                        'route_name' => 'hrm.employees.index',
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Employees'],
                            ['code' => 'create', 'name' => 'Create Employee'],
                            ['code' => 'edit', 'name' => 'Edit Employee'],
                            ['code' => 'delete', 'name' => 'Delete Employee'],
                        ],
                    ],
                ],
            ],
        ],
    ];

    protected function getModulePath(string $path = ''): string
    {
        $basePath = dirname(__DIR__, 2);
        return $path ? $basePath . '/' . $path : $basePath;
    }

    protected function registerServices(): void
    {
        // Register module-specific services
        $this->app->singleton(\Aero\Hrm\Services\EmployeeService::class);
        $this->app->singleton(\Aero\Hrm\Services\AttendanceService::class);
    }

    protected function bootModule(): void
    {
        // Register module middleware
        $router = $this->app['router'];
        $router->aliasMiddleware('hrm.access', \Aero\Hrm\Http\Middleware\CheckHrmAccess::class);
    }
}
```

### Step 3: Update composer.json

```json
{
    "name": "aero/hrm",
    "description": "Aero HRM Module",
    "type": "library",
    "require": {
        "php": "^8.2",
        "aero/core": "*"
    },
    "autoload": {
        "psr-4": {
            "Aero\\Hrm\\": "src/"
        }
    },
    "extra": {
        "laravel": {
            "providers": [
                "Aero\\Hrm\\Providers\\HrmModuleProvider"
            ]
        }
    }
}
```

### Step 4: Register Module

The module is automatically registered via Laravel's package auto-discovery. The provider's `register()` method should register the module with the ModuleRegistry:

```php
public function register(): void
{
    parent::register();
    
    // Register this module with the registry
    $registry = $this->app->make(\Aero\Core\Services\ModuleRegistry::class);
    $registry->register($this);
}
```

## Using the Module Registry

### In Controllers

```php
use Aero\Core\Facades\ModuleRegistry;

class DashboardController extends Controller
{
    public function index()
    {
        // Get all enabled modules
        $modules = ModuleRegistry::enabled();
        
        // Get navigation items
        $navigation = ModuleRegistry::getNavigationItems();
        
        // Check if a module is enabled
        if (ModuleRegistry::isEnabled('hrm')) {
            // HRM module is available
        }
        
        return Inertia::render('Dashboard', [
            'modules' => ModuleRegistry::getAllMetadata(),
            'navigation' => $navigation,
        ]);
    }
}
```

### In Views/Inertia

```jsx
// Access module navigation
const { navigation } = usePage().props;

// Render navigation menu
<nav>
    {navigation.map((item) => (
        <Link key={item.code} href={route(item.route)}>
            <Icon name={item.icon} />
            <span>{item.name}</span>
        </Link>
    ))}
</nav>
```

### In Service Providers

```php
use Aero\Core\Services\ModuleRegistry;

public function boot(ModuleRegistry $registry)
{
    // Get module metadata
    $hrmMetadata = $registry->getMetadata('hrm');
    
    // Validate dependencies
    $registry->validateDependencies('finance');
    
    // Boot all registered modules
    $registry->bootAll();
}
```

## CLI Commands

### List Modules

```bash
# List all registered modules
php artisan module:list

# List only enabled modules
php artisan module:list --enabled

# Filter by category
php artisan module:list --category=business
```

Output:
```
+----------+------------------+---------+----------+----------+---------+--------------+----------+
| Code     | Name             | Version | Category | Priority | Enabled | Dependencies | Min Plan |
+----------+------------------+---------+----------+----------+---------+--------------+----------+
| core     | Core             | 1.0.0   | foundation| 1       | ✓       | -            | -        |
| hrm      | Human Resources  | 1.0.0   | business | 10      | ✓       | core         | professional |
| crm      | CRM              | 1.0.0   | business | 11      | ✓       | core         | professional |
+----------+------------------+---------+----------+----------+---------+--------------+----------+

Total modules: 3
Enabled modules: 3
```

## Module Hierarchy

Modules follow a 4-level hierarchy:

1. **Module** - Top-level business domain (e.g., HRM, CRM)
2. **Sub-Module** - Functional area within module (e.g., Employees, Attendance)
3. **Component** - Specific feature or page (e.g., Employee List, Add Employee)
4. **Action** - User permission (e.g., View, Create, Edit, Delete)

This hierarchy is used for:
- Permission management (RBAC)
- Navigation generation
- Module access control
- Feature discovery

## Best Practices

### 1. Module Independence
- Modules should be self-contained
- Avoid tight coupling between modules
- Use events for inter-module communication
- Define clear interfaces for module services

### 2. Dependency Management
- Declare all module dependencies explicitly
- Validate dependencies before module boot
- Use semantic versioning for module versions

### 3. Configuration
- Store module-specific config in `config/module.php`
- Use environment variables for sensitive data
- Provide sensible defaults

### 4. Database Migrations
- Prefix table names with module code (e.g., `hrm_employees`)
- Include rollback logic in all migrations
- Version migrations appropriately

### 5. Frontend Assets
- Namespace components to avoid conflicts
- Use module-specific route prefixes
- Follow consistent naming conventions

### 6. Testing
- Write unit tests for module services
- Include feature tests for critical paths
- Test module integration scenarios

## Advanced Topics

### Dynamic Module Loading

Modules can be loaded conditionally based on:
- User subscription plan
- Tenant configuration
- Feature flags
- User permissions

### Module Events

Use Laravel events for inter-module communication:

```php
// In HRM module
event(new EmployeeCreated($employee));

// In another module
Event::listen(EmployeeCreated::class, function ($event) {
    // Respond to employee creation
});
```

### Module APIs

Expose module functionality via APIs:

```php
// routes/api.php
Route::prefix('api/hrm')->group(function () {
    Route::get('employees', [EmployeeController::class, 'index']);
    Route::post('employees', [EmployeeController::class, 'store']);
});
```

### Module Caching

The ModuleRegistry caches:
- Navigation items (1 hour TTL)
- Module hierarchy (1 hour TTL)

Clear cache after module changes:

```php
ModuleRegistry::clearCache();
```

## Troubleshooting

### Module Not Appearing

1. Check if module provider is in composer.json `extra.laravel.providers`
2. Run `composer dump-autoload`
3. Clear Laravel cache: `php artisan config:clear`
4. Verify module is registered: `php artisan module:list`

### Dependency Errors

If you see dependency errors:
1. Check module dependencies array
2. Ensure required modules are installed
3. Verify module load order in composer.json

### Route Conflicts

If routes conflict:
1. Use unique route prefixes per module
2. Namespace controllers properly
3. Use route names with module prefix (e.g., `hrm.employees.index`)

## Migration from Central Config

To migrate from centralized `config/modules.php`:

1. Create module package directory
2. Move controllers, models, services to package
3. Create module provider extending `AbstractModuleProvider`
4. Define module metadata in provider
5. Move routes to module's `routes/` directory
6. Update namespace imports
7. Test module independently
8. Remove from central config

See `MODULE_DECENTRALIZATION_REPORT.md` for detailed migration steps.

## Support

For questions or issues:
- Check documentation: `/docs/modules`
- Review examples in `aero-core/src/Providers/CoreModuleProvider.php`
- Open issue on GitHub
