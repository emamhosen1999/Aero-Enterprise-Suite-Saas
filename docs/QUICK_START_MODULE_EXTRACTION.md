# Quick Start: Module Extraction

This is a quick reference guide for developers to extract modules from the monolithic application.

## TL;DR

```bash
# 1. Extract module
./tools/extract-module.sh <module-name> <MODULE_PATH>

# 2. Review and test
cd ../extracted-modules/aero-<module-name>-module
composer install && npm install
vendor/bin/phpunit

# 3. Push to repository
git remote add origin <repo-url>
git push -u origin main

# 4. Install in main platform
cd /path/to/main-platform
composer require aero/<module-name>-module
php artisan vendor:publish --tag=<module-name>-assets
php artisan migrate
```

## Module Extraction Checklist

### Before Extraction

- [ ] Review module dependencies
- [ ] Identify shared code (move to core package if needed)
- [ ] Ensure module has clear boundaries
- [ ] Check for circular dependencies
- [ ] Document current functionality

### During Extraction

- [ ] Run extraction script
- [ ] Review copied files
- [ ] Update namespaces
- [ ] Fix imports
- [ ] Update routes
- [ ] Update Inertia render calls
- [ ] Create/update service provider
- [ ] Update configuration
- [ ] Add tests

### After Extraction

- [ ] Run all tests
- [ ] Check code coverage
- [ ] Update documentation
- [ ] Create CHANGELOG entry
- [ ] Tag release (v1.0.0)
- [ ] Push to repository
- [ ] Test integration with main platform
- [ ] Update main platform documentation

## Common Commands

### Module Development

```bash
# Install dependencies
composer install
npm install

# Run tests
vendor/bin/phpunit
vendor/bin/phpunit --filter=FeatureName

# Run linters
vendor/bin/pint
npm run lint

# Build frontend
npm run build
npm run dev
```

### Main Platform Integration

```bash
# For development (using path repository)
{
    "repositories": [{"type": "path", "url": "../aero-<module>-module"}],
    "require": {"aero/<module>-module": "@dev"}
}

# For production (using VCS repository)
{
    "repositories": [{"type": "vcs", "url": "https://github.com/..."}],
    "require": {"aero/<module>-module": "^1.0"}
}

# Install and publish
composer require aero/<module>-module
php artisan vendor:publish --tag=<module>-assets
php artisan vendor:publish --tag=<module>-config
php artisan migrate
```

## File Structure Template

```
aero-<module>-module/
├── composer.json              # PHP dependencies and autoload
├── package.json               # JS dependencies
├── .gitignore
├── README.md                  # Installation and usage
├── CHANGELOG.md               # Version history
├── phpunit.xml
│
├── src/
│   ├── Http/
│   │   ├── Controllers/       # Module controllers
│   │   ├── Middleware/        # Module middleware
│   │   └── Requests/          # Form requests
│   ├── Models/                # Eloquent models
│   ├── Services/              # Business logic
│   ├── Policies/              # Authorization policies
│   ├── Events/                # Domain events
│   ├── Listeners/             # Event listeners
│   ├── Jobs/                  # Queued jobs
│   ├── Providers/
│   │   └── <Module>ServiceProvider.php
│   └── routes/
│       ├── web.php            # Web routes
│       └── api.php            # API routes (if needed)
│
├── resources/
│   ├── js/
│   │   ├── Pages/             # Inertia pages
│   │   ├── Components/        # React components
│   │   ├── Tables/            # Table components
│   │   └── Forms/             # Form components
│   └── views/                 # Blade views (if any)
│
├── database/
│   ├── migrations/            # Tenant-scoped migrations
│   ├── seeders/               # Seeders
│   └── factories/             # Model factories
│
├── tests/
│   ├── Feature/               # Feature tests
│   ├── Unit/                  # Unit tests
│   └── TestCase.php           # Base test case
│
└── config/
    └── <module>.php           # Module configuration
```

## Namespace Patterns

### Before (Monolithic)
```php
namespace App\Http\Controllers\Tenant\HRM;
namespace App\Models;
namespace App\Services\Tenant\HRM;
namespace App\Policies;

use App\Http\Controllers\Tenant\HRM\EmployeeController;
use App\Models\Employee;
use App\Services\Tenant\HRM\LeaveService;
```

### After (Package)
```php
namespace Aero\HRM\Http\Controllers;
namespace Aero\HRM\Models;
namespace Aero\HRM\Services;
namespace Aero\HRM\Policies;

use Aero\HRM\Http\Controllers\EmployeeController;
use Aero\HRM\Models\Employee;
use Aero\HRM\Services\LeaveService;
```

### Keep Main App References
```php
use App\Models\User;                    # User model
use App\Http\Controllers\Controller;    # Base controller
use Illuminate\Support\Facades\Auth;    # Laravel facades
```

## Frontend Integration

### Inertia Render Calls

```php
// Before (Monolithic)
return Inertia::render('Tenant/Pages/HRM/EmployeeList', $data);

// After (Package) - Use namespace separator
return Inertia::render('HRM::EmployeeList', $data);
```

### Vite Configuration

```javascript
// Main platform vite.config.js
export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                'resources/js/Modules/HRM/index.jsx',  // Module entry
            ],
        }),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
            '@hrm': '/resources/js/Modules/HRM',  // Module alias
        },
    },
});
```

### Component Imports

```jsx
// Before
import EmployeeTable from '@/Tenant/Components/EmployeeTable';

// After
import EmployeeTable from '@hrm/Components/EmployeeTable';
```

## Testing

### Module Tests

```php
<?php

namespace Aero\HRM\Tests\Feature;

use Tests\TestCase;
use Aero\HRM\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_employee()
    {
        $response = $this->post(route('hrm.employees.store'), [
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

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x): Breaking changes
- **MINOR** (x.1.x): New features (backward compatible)
- **PATCH** (x.x.1): Bug fixes

```bash
# Tag a release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0

# Update version in composer.json
{
    "version": "1.0.0"
}
```

## Troubleshooting

### Issue: Class not found

**Cause:** Namespace not updated or autoload not refreshed

**Solution:**
```bash
# In module
composer dump-autoload

# In main platform
composer dump-autoload
php artisan clear-compiled
php artisan optimize
```

### Issue: Routes not working

**Cause:** Service provider not loaded or routes not registered

**Solution:**
```bash
# Check if provider is in composer.json extra.laravel.providers
# Clear route cache
php artisan route:clear
php artisan route:cache
```

### Issue: Frontend assets not loading

**Cause:** Assets not published or build not run

**Solution:**
```bash
# Publish assets
php artisan vendor:publish --tag=<module>-assets --force

# Rebuild
npm run build
```

### Issue: Migrations not running

**Cause:** Migration path not loaded

**Solution:**
```php
// In ServiceProvider boot() method
$this->loadMigrationsFrom(__DIR__.'/../../database/migrations');
```

## Resources

- [Full Documentation](./MODULE_EXTRACTION_GUIDE.md)
- [Detailed Example](./MODULE_EXTRACTION_EXAMPLE.md)
- [Executive Summary](./MODULE_EXTRACTION_SUMMARY.md)
- [Laravel Package Development](https://laravel.com/docs/11.x/packages)
- [Semantic Versioning](https://semver.org/)

## Support

For questions or issues:
1. Check the comprehensive guides in `docs/`
2. Review the example extraction in `docs/MODULE_EXTRACTION_EXAMPLE.md`
3. Contact the development team

---

**Last Updated:** 2024-12-08  
**Version:** 1.0
