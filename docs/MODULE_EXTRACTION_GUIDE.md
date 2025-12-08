# Module Extraction Guide: Moving Modules to Separate Repositories

## Executive Summary

This guide provides a comprehensive strategy for extracting modules from the Aero Enterprise Suite SaaS monolithic architecture into separate repositories while maintaining seamless integration with the main platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Recommended Approach](#recommended-approach)
3. [Implementation Strategy](#implementation-strategy)
4. [Integration Patterns](#integration-patterns)
5. [Deployment & DevOps](#deployment--devops)
6. [Best Practices](#best-practices)

---

## Architecture Overview

### Current Monolithic Structure

```
Aero-Enterprise-Suite-Saas/
├── app/
│   ├── Http/Controllers/
│   │   ├── Admin/          # Platform admin
│   │   ├── Tenant/         # Tenant-scoped
│   │   └── Api/            # API endpoints
│   ├── Models/             # Eloquent models
│   ├── Services/           # Business logic
│   │   ├── Platform/       # Platform services
│   │   ├── Tenant/         # Tenant services
│   │   │   ├── HRM/        # HR module services
│   │   │   ├── CRM/        # CRM module services
│   │   │   ├── DMS/        # Document management
│   │   │   └── ...
│   │   └── Shared/         # Shared services
│   └── Policies/           # Authorization
├── config/
│   └── modules.php         # Module definitions
├── routes/
│   ├── tenant.php          # Main tenant routes
│   ├── hr.php              # HR module routes
│   ├── modules.php         # Module routes
│   └── ...
└── resources/
    └── js/
        ├── Tenant/Pages/   # Tenant UI pages
        └── Components/     # Reusable components
```

### Multi-Tenancy Architecture

- **Central Database (`eos365`)**: Platform-level data (tenants, plans, subscriptions)
- **Tenant Databases**: Isolated per-tenant databases (`tenant{id}`)
- **Domain Resolution**: Subdomain-based (`{tenant}.domain.com`)
- **Auth Guards**: `landlord` (platform) and `web` (tenant)

---

## Recommended Approach

After analyzing the codebase, we recommend **Package-Based Architecture** over complete microservices for the following reasons:

### Why Package-Based Architecture?

1. **Maintains Multi-Tenancy**: Preserves existing tenant isolation
2. **Shared Database Context**: Modules can leverage tenant database connections
3. **Easier Development**: No network latency, simpler debugging
4. **Gradual Migration**: Can be done incrementally
5. **Code Reusability**: Share models, middleware, and utilities

### Architecture Comparison

| Aspect | Package-Based | Microservices | Monolithic |
|--------|--------------|---------------|------------|
| **Deployment** | Single Laravel app | Multiple services | Single app |
| **Database** | Shared tenant DB | Separate DB per service | Shared |
| **Development Speed** | Fast | Moderate | Fast |
| **Scalability** | Good | Excellent | Limited |
| **Complexity** | Low | High | Very Low |
| **Network Overhead** | None | High | None |
| **Team Autonomy** | Moderate | High | Low |
| **Our Recommendation** | ✅ **Best Fit** | Future option | Current state |

---

## Implementation Strategy

### Option 1: Laravel Package (Recommended)

Create each module as a Laravel package that can be installed via Composer.

#### Package Structure

```
aero-hrm-module/
├── composer.json
├── src/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   └── Requests/
│   ├── Models/
│   ├── Services/
│   │   ├── LeaveService.php
│   │   ├── AttendanceService.php
│   │   └── PayrollService.php
│   ├── Policies/
│   ├── Events/
│   ├── Listeners/
│   ├── Jobs/
│   ├── Providers/
│   │   └── HRMServiceProvider.php
│   └── routes/
│       ├── web.php
│       └── api.php
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   │   ├── EmployeeList.jsx
│   │   │   ├── Attendance.jsx
│   │   │   └── Payroll.jsx
│   │   └── Components/
│   └── views/
├── database/
│   ├── migrations/
│   └── seeders/
├── tests/
│   ├── Feature/
│   └── Unit/
├── config/
│   └── hrm.php
└── README.md
```

#### composer.json Example

```json
{
    "name": "aero/hrm-module",
    "description": "Human Resource Management module for Aero Enterprise Suite",
    "type": "library",
    "license": "proprietary",
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0",
        "inertiajs/inertia-laravel": "2.x-dev",
        "stancl/tenancy": "^3.9"
    },
    "autoload": {
        "psr-4": {
            "Aero\\HRM\\": "src/"
        }
    },
    "extra": {
        "laravel": {
            "providers": [
                "Aero\\HRM\\Providers\\HRMServiceProvider"
            ]
        }
    }
}
```

#### Service Provider

```php
<?php

namespace Aero\HRM\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class HRMServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Register services
        $this->app->singleton('hrm', function ($app) {
            return new \Aero\HRM\Services\HRMService();
        });

        // Merge configuration
        $this->mergeConfigFrom(
            __DIR__.'/../../config/hrm.php', 'hrm'
        );
    }

    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');

        // Register routes
        $this->registerRoutes();

        // Publish assets
        $this->publishes([
            __DIR__.'/../../resources/js' => resource_path('js/Modules/HRM'),
        ], 'hrm-assets');

        // Publish config
        $this->publishes([
            __DIR__.'/../../config/hrm.php' => config_path('hrm.php'),
        ], 'hrm-config');
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth', 'tenant.setup'])
            ->prefix('hrm')
            ->group(__DIR__.'/../../routes/web.php');

        Route::middleware(['api', 'auth:sanctum'])
            ->prefix('api/hrm')
            ->group(__DIR__.'/../../routes/api.php');
    }
}
```

### Option 2: API-Based Microservice (Future Consideration)

For modules that need complete isolation or independent scaling.

#### Microservice Structure

```
aero-hrm-service/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── app/              # Laravel application
├── database/
│   └── migrations/
├── routes/
│   └── api.php       # REST API endpoints
└── README.md
```

#### API Contract Example

```php
// Main Platform → HRM Service
POST   /api/v1/hrm/employees
GET    /api/v1/hrm/employees/{id}
PUT    /api/v1/hrm/employees/{id}
DELETE /api/v1/hrm/employees/{id}

GET    /api/v1/hrm/attendance
POST   /api/v1/hrm/attendance/punch

GET    /api/v1/hrm/payroll
POST   /api/v1/hrm/payroll/generate
```

---

## Integration Patterns

### 1. Module Registration (Package Approach)

Update `config/modules.php` to support external packages:

```php
'external_packages' => [
    'hrm' => [
        'package' => 'aero/hrm-module',
        'enabled' => true,
        'version' => '^1.0',
        'config_path' => 'hrm',
        'service_provider' => 'Aero\\HRM\\Providers\\HRMServiceProvider',
    ],
    'crm' => [
        'package' => 'aero/crm-module',
        'enabled' => true,
        'version' => '^1.0',
        'config_path' => 'crm',
        'service_provider' => 'Aero\\CRM\\Providers\\CRMServiceProvider',
    ],
],
```

### 2. Frontend Integration (Inertia.js)

#### Main Platform Vite Config

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                // Module entry points
                'resources/js/Modules/HRM/index.jsx',
                'resources/js/Modules/CRM/index.jsx',
            ],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
            '@hrm': '/resources/js/Modules/HRM',
            '@crm': '/resources/js/Modules/CRM',
        },
    },
});
```

#### Module Page Registration

```jsx
// resources/js/app.jsx
import { createInertiaApp } from '@inertiajs/react';

const pages = import.meta.glob([
    './Tenant/Pages/**/*.jsx',
    './Modules/*/Pages/**/*.jsx', // Auto-import module pages
]);

createInertiaApp({
    resolve: (name) => {
        // Support module namespacing
        // e.g., "HRM::EmployeeList" → "./Modules/HRM/Pages/EmployeeList.jsx"
        const [module, page] = name.includes('::') 
            ? name.split('::') 
            : [null, name];
        
        const path = module 
            ? `./Modules/${module}/Pages/${page}.jsx`
            : `./Tenant/Pages/${name}.jsx`;
        
        return pages[path]();
    },
    // ...
});
```

### 3. Shared Dependencies

Create a core package for shared functionality:

```
aero-core/
├── src/
│   ├── Contracts/           # Interfaces
│   ├── Traits/              # Reusable traits
│   ├── Middleware/          # Shared middleware
│   ├── Exceptions/          # Custom exceptions
│   └── Services/
│       ├── TenantService.php
│       ├── ModuleAccessService.php
│       └── NotificationService.php
└── composer.json
```

#### Core Package Usage

```php
// In HRM Module
use Aero\Core\Services\TenantService;
use Aero\Core\Traits\HasTenantScope;
use Aero\Core\Contracts\ModuleInterface;

class HRMService implements ModuleInterface
{
    use HasTenantScope;

    public function __construct(
        protected TenantService $tenantService
    ) {}
}
```

### 4. Event-Driven Communication

Use Laravel Events for inter-module communication:

```php
// In HRM Module
use Aero\Core\Events\ModuleEvent;

// Emit event
event(new ModuleEvent('hrm.employee.created', [
    'employee_id' => $employee->id,
    'tenant_id' => tenant('id'),
]));

// In CRM Module - Listen to events
class EmployeeCreatedListener
{
    public function handle(ModuleEvent $event)
    {
        if ($event->module === 'hrm' && $event->action === 'employee.created') {
            // Create CRM contact from employee
            $this->createContact($event->data);
        }
    }
}
```

---

## Deployment & DevOps

### Package Installation

#### Using Private Composer Repository

```bash
# Add private repository to composer.json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/your-org/aero-hrm-module"
        }
    ]
}

# Install module
composer require aero/hrm-module

# Publish assets
php artisan vendor:publish --tag=hrm-assets --tag=hrm-config

# Run migrations
php artisan migrate
```

#### Using Git Submodules (Development)

```bash
# Add module as submodule
git submodule add https://github.com/your-org/aero-hrm-module packages/hrm-module

# Update composer.json
{
    "repositories": [
        {
            "type": "path",
            "url": "./packages/hrm-module"
        }
    ],
    "require": {
        "aero/hrm-module": "@dev"
    }
}

# Install
composer update aero/hrm-module
```

### CI/CD Pipeline

#### Module Repository (.github/workflows/test.yml)

```yaml
name: Module Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_DATABASE: testing
          MYSQL_ROOT_PASSWORD: password
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, pdo, pdo_mysql
      
      - name: Install Dependencies
        run: composer install --no-interaction --prefer-dist
      
      - name: Run Tests
        run: vendor/bin/phpunit
        env:
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: testing
          DB_USERNAME: root
          DB_PASSWORD: password
```

#### Main Platform Build

```yaml
# .github/workflows/deploy.yml
name: Deploy Platform

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Composer Dependencies
        run: composer install --optimize-autoloader --no-dev
      
      - name: Install NPM Dependencies
        run: npm ci
      
      - name: Build Frontend Assets
        run: npm run build
      
      - name: Deploy to Production
        # Your deployment steps
```

### Docker Configuration

#### Module Package (Development)

```dockerfile
# packages/hrm-module/Dockerfile
FROM php:8.2-fpm-alpine

# Install dependencies
RUN apk add --no-cache \
    mysql-client \
    nodejs \
    npm

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www/module

COPY . .

RUN composer install --no-dev --optimize-autoloader
RUN npm ci && npm run build

CMD ["php-fpm"]
```

### Environment Management

#### Module-Specific Configuration

```env
# .env (Main Platform)

# HRM Module Settings
HRM_ENABLED=true
HRM_MAX_EMPLOYEES=500
HRM_LEAVE_APPROVAL_LEVELS=2

# CRM Module Settings
CRM_ENABLED=true
CRM_PIPELINE_STAGES=5
```

---

## Best Practices

### 1. Versioning Strategy

- Use **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`
- Main platform defines minimum module versions
- Modules declare compatibility with platform versions

```json
// Module composer.json
{
    "require": {
        "aero/core": "^2.0",
        "laravel/framework": "^11.0"
    },
    "extra": {
        "aero": {
            "platform-compatibility": "^2.0"
        }
    }
}
```

### 2. Database Migrations

- Each module manages its own migrations
- Use tenant-aware migrations
- Prefix tables with module code

```php
// packages/hrm-module/database/migrations/2024_01_01_create_hrm_employees_table.php
public function up()
{
    Schema::create('hrm_employees', function (Blueprint $table) {
        $table->id();
        $table->string('employee_code')->unique();
        $table->string('first_name');
        $table->string('last_name');
        // ... tenant-scoped automatically
        $table->timestamps();
    });
}
```

### 3. Testing Strategy

#### Module Tests

```php
// packages/hrm-module/tests/Feature/EmployeeTest.php
namespace Aero\HRM\Tests\Feature;

use Tests\TestCase;
use Aero\HRM\Models\Employee;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_employee()
    {
        $response = $this->post('/hrm/employees', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('hrm_employees', [
            'email' => 'john@example.com'
        ]);
    }
}
```

### 4. Documentation

Each module should include:

- `README.md` - Installation and usage
- `CHANGELOG.md` - Version history
- `UPGRADE.md` - Migration guides
- API documentation (if applicable)
- Integration examples

### 5. Security Considerations

- **Authentication**: Leverage main platform's auth
- **Authorization**: Use platform's permission system
- **Data Isolation**: Respect tenant boundaries
- **Input Validation**: Module-specific form requests
- **API Security**: Use Sanctum tokens from main platform

```php
// Module controller
use Aero\Core\Http\Controllers\TenantController;

class EmployeeController extends TenantController
{
    public function __construct()
    {
        // Inherits tenant context and auth
        parent::__construct();
        
        // Module-specific permissions
        $this->middleware('permission:hrm.employees.view')->only('index');
        $this->middleware('permission:hrm.employees.create')->only(['create', 'store']);
    }
}
```

### 6. Performance Optimization

- **Lazy Loading**: Load modules only when needed
- **Caching**: Use tenant-scoped cache
- **Asset Optimization**: Code-split module bundles
- **Database Queries**: Eager load relationships

```javascript
// Lazy load module pages
const HRMPages = {
    EmployeeList: lazy(() => import('@hrm/Pages/EmployeeList')),
    Attendance: lazy(() => import('@hrm/Pages/Attendance')),
    Payroll: lazy(() => import('@hrm/Pages/Payroll')),
};
```

---

## Migration Roadmap

### Phase 1: Preparation (Week 1-2)

- [ ] Create core package repository
- [ ] Set up private Composer repository
- [ ] Define module interfaces and contracts
- [ ] Update main platform to support external packages
- [ ] Create migration scripts

### Phase 2: Extract First Module (Week 3-4)

- [ ] Choose least coupled module (e.g., DMS)
- [ ] Create package structure
- [ ] Move code to package repository
- [ ] Implement service provider
- [ ] Update tests
- [ ] Test integration with main platform

### Phase 3: Extract Additional Modules (Week 5-8)

- [ ] Extract HRM module
- [ ] Extract CRM module
- [ ] Extract additional modules iteratively
- [ ] Update documentation

### Phase 4: Optimization (Week 9-10)

- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation review
- [ ] Developer training

---

## Example: Extracting HRM Module

### Step-by-Step Guide

#### 1. Create Package Repository

```bash
# Create new repository
mkdir aero-hrm-module
cd aero-hrm-module

# Initialize composer package
composer init \
    --name="aero/hrm-module" \
    --description="Human Resource Management Module" \
    --type="library" \
    --require="php:^8.2" \
    --require="laravel/framework:^11.0" \
    --require="stancl/tenancy:^3.9"

# Create directory structure
mkdir -p src/{Http/{Controllers,Middleware,Requests},Models,Services,Policies,Providers,routes}
mkdir -p resources/{js/{Pages,Components},views}
mkdir -p database/{migrations,seeders}
mkdir -p tests/{Feature,Unit}
mkdir -p config
```

#### 2. Move Files from Main Repository

```bash
# In main repository
cd /path/to/Aero-Enterprise-Suite-Saas

# Copy services
cp -r app/Services/Tenant/HRM/* ../aero-hrm-module/src/Services/

# Copy controllers
cp -r app/Http/Controllers/Tenant/HR/* ../aero-hrm-module/src/Http/Controllers/

# Copy models (if module-specific)
cp app/Models/Employee.php ../aero-hrm-module/src/Models/
cp app/Models/Attendance.php ../aero-hrm-module/src/Models/
# ... etc

# Copy frontend
cp -r resources/js/Tenant/Pages/Employees ../aero-hrm-module/resources/js/Pages/
cp -r resources/js/Tenant/Pages/Attendance ../aero-hrm-module/resources/js/Pages/

# Copy routes
cp routes/hr.php ../aero-hrm-module/src/routes/web.php

# Copy migrations
cp database/migrations/tenant/*_hrm_* ../aero-hrm-module/database/migrations/
```

#### 3. Update Namespaces

```php
// Before (in main repository)
namespace App\Services\Tenant\HRM;

// After (in package)
namespace Aero\HRM\Services;
```

#### 4. Create Service Provider

See example above in "Service Provider" section.

#### 5. Install in Main Platform

```bash
# In main repository
cd /path/to/Aero-Enterprise-Suite-Saas

# Add to composer.json
{
    "repositories": [
        {
            "type": "path",
            "url": "../aero-hrm-module"
        }
    ],
    "require": {
        "aero/hrm-module": "@dev"
    }
}

# Install
composer require aero/hrm-module

# Publish assets
php artisan vendor:publish --tag=hrm-assets
```

#### 6. Update Imports

```php
// Before
use App\Services\Tenant\HRM\LeaveService;

// After
use Aero\HRM\Services\LeaveService;
```

#### 7. Test Integration

```bash
# Run tests
php artisan test --filter=HRM

# Test in browser
php artisan serve
# Navigate to http://localhost:8000/hrm
```

---

## Troubleshooting

### Common Issues

#### Issue: Module routes not loading

**Solution**: Ensure service provider is registered in `composer.json`'s `extra.laravel.providers`.

#### Issue: Frontend assets not found

**Solution**: Run `php artisan vendor:publish --tag=hrm-assets` and rebuild with `npm run build`.

#### Issue: Database migrations not running

**Solution**: Check that migrations are in the correct path and use `$this->loadMigrationsFrom()` in service provider.

#### Issue: Permission errors

**Solution**: Ensure module uses the same permission system and guards as main platform.

---

## Conclusion

The **Package-Based Architecture** is the recommended approach for extracting modules from the Aero Enterprise Suite SaaS platform. This approach:

✅ Maintains multi-tenancy architecture  
✅ Enables independent module development  
✅ Allows gradual migration  
✅ Preserves existing functionality  
✅ Simplifies deployment  

For modules requiring complete isolation or independent scaling, the **Microservice Architecture** can be considered as a future enhancement.

---

## Additional Resources

- [Laravel Package Development](https://laravel.com/docs/11.x/packages)
- [Stancl Tenancy Documentation](https://tenancyforlaravel.com/docs/v3/)
- [Inertia.js Code Splitting](https://inertiajs.com/code-splitting)
- [Composer Private Packages](https://getcomposer.org/doc/articles/handling-private-packages.md)

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-08  
**Maintainer**: Development Team
