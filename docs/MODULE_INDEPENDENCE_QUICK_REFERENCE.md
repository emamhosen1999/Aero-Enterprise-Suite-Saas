# Module Independence Architecture - Quick Reference Guide

**Last Updated:** 2025-12-07  
**Related:** `MODULE_INDEPENDENCE_ARCHITECTURE_IMPROVEMENTS.md`

---

## 🎯 Quick Decision Matrix

### Should I extract this module?

| Criterion | Yes | No |
|-----------|-----|-----|
| **Standalone Value** | Can be sold separately | Tightly coupled to platform |
| **Update Frequency** | Needs frequent updates | Rarely changes |
| **Team Size** | Multiple teams working on it | Single team |
| **Customer Demand** | High demand for standalone | Platform-only feature |
| **Complexity** | Self-contained logic | Heavy dependencies |

**Example:**
- ✅ HRM Module - High standalone value, frequent updates
- ❌ Core Auth - Tightly coupled, low standalone value

---

## 📦 Package Structure Template

```
packages/aero-{module}/
├── composer.json              # Package definition
├── README.md                  # Standalone docs
├── LICENSE                    # License file
├── CHANGELOG.md               # Version history
│
├── src/
│   ├── {Module}ServiceProvider.php  # Auto-registration
│   ├── Facades/                     # Convenience facades
│   ├── Models/                      # Eloquent models
│   ├── Http/
│   │   ├── Controllers/             # Module controllers
│   │   ├── Middleware/              # Custom middleware
│   │   └── Requests/                # Form requests
│   ├── Services/                    # Business logic
│   ├── Events/                      # Event classes
│   ├── Listeners/                   # Event listeners
│   └── Console/                     # Artisan commands
│
├── database/
│   ├── migrations/                  # Database migrations
│   ├── seeders/                     # Seed data
│   └── factories/                   # Model factories
│
├── routes/
│   ├── web.php                      # Web routes
│   └── api.php                      # API routes
│
├── resources/
│   ├── js/
│   │   ├── Components/              # React components
│   │   ├── Pages/                   # Inertia pages
│   │   └── index.js                 # Entry point
│   ├── css/                         # Module styles
│   └── views/                       # Blade views (optional)
│
├── config/
│   └── aero-{module}.php            # Module config
│
├── tests/
│   ├── Feature/                     # Feature tests
│   ├── Unit/                        # Unit tests
│   └── TestCase.php                 # Base test case
│
└── docs/
    ├── installation.md              # Install guide
    ├── configuration.md             # Config guide
    └── api.md                       # API reference
```

---

## 🔧 Essential Commands Checklist

### For Module Developers

```bash
# 1. Create new module package
composer create-project aero/module-template packages/aero-{module}

# 2. Install dependencies
cd packages/aero-{module}
composer install

# 3. Run tests
./vendor/bin/phpunit

# 4. Build frontend assets
npm run build

# 5. Tag release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0

# 6. Publish to registry
composer publish aero-modules/{module}
```

### For Platform Admins

```bash
# 1. Install module
composer require aero-modules/{module}

# 2. Publish configuration
php artisan vendor:publish --tag=aero-{module}-config

# 3. Run migrations
php artisan migrate

# 4. Publish assets
php artisan vendor:publish --tag=aero-{module}-assets

# 5. Build frontend
npm run build

# 6. Clear cache
php artisan cache:clear
php artisan config:clear
```

### For Tenant Admins

```bash
# 1. Enable module for tenant
php artisan tenant:enable-module {tenant-id} {module-code}

# 2. Run tenant migrations
php artisan tenants:run "migrate --path=vendor/aero-modules/{module}/database/migrations"

# 3. Seed module data
php artisan tenants:run "db:seed --class=\\AeroModules\\{Module}\\Database\\Seeders\\{Module}Seeder"

# 4. Verify installation
php artisan tenant:verify-module {tenant-id} {module-code}
```

---

## 🚦 Module Lifecycle States

```
┌─────────────┐
│  Available  │ → Module exists in registry
└──────┬──────┘
       ↓
┌─────────────┐
│  Installed  │ → Composer installed, not active
└──────┬──────┘
       ↓
┌─────────────┐
│   Enabled   │ → Active in plan/tenant
└──────┬──────┘
       ↓
┌─────────────┐
│   Active    │ → Users can access
└──────┬──────┘
       ↓
┌─────────────┐
│  Disabled   │ → Temporarily turned off
└──────┬──────┘
       ↓
┌─────────────┐
│  Archived   │ → Data preserved, not accessible
└──────┬──────┘
       ↓
┌─────────────┐
│ Uninstalled │ → Removed from platform
└─────────────┘
```

---

## 📝 composer.json Template

```json
{
    "name": "aero-modules/hrm",
    "description": "Human Resource Management module for Aero Enterprise Suite",
    "type": "library",
    "license": "proprietary",
    "authors": [
        {
            "name": "Aero Development Team",
            "email": "dev@aero-enterprise.com"
        }
    ],
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0",
        "aero-modules/core": "^1.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0",
        "orchestra/testbench": "^8.0"
    },
    "autoload": {
        "psr-4": {
            "AeroModules\\HRM\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "AeroModules\\HRM\\Tests\\": "tests/"
        }
    },
    "extra": {
        "laravel": {
            "providers": [
                "AeroModules\\HRM\\HrmServiceProvider"
            ],
            "aliases": {
                "HRM": "AeroModules\\HRM\\Facades\\Hrm"
            }
        },
        "aero": {
            "code": "hrm",
            "category": "human_resources",
            "min_plan": "professional",
            "dependencies": ["core"],
            "version": "1.0.0"
        }
    },
    "minimum-stability": "dev",
    "prefer-stable": true
}
```

---

## 🔑 Service Provider Template

```php
<?php

namespace AeroModules\HRM;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class HrmServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Merge configuration
        $this->mergeConfigFrom(__DIR__.'/../config/aero-hrm.php', 'aero-hrm');
        
        // Register services
        $this->app->singleton('hrm', function ($app) {
            return new HrmManager($app);
        });
        
        // Register with platform (if exists)
        if (class_exists(\App\Services\Module\ModuleRegistry::class)) {
            $this->app->make(\App\Services\Module\ModuleRegistry::class)
                ->register('hrm', [
                    'name' => 'Human Resource Management',
                    'version' => '1.0.0',
                    'provider' => self::class,
                ]);
        }
    }
    
    public function boot()
    {
        // Detect environment
        $mode = $this->detectMode();
        
        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        
        // Load routes
        $this->registerRoutes($mode);
        
        // Load views
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'aero-hrm');
        
        // Publish configuration
        $this->publishes([
            __DIR__.'/../config/aero-hrm.php' => config_path('aero-hrm.php'),
        ], 'aero-hrm-config');
        
        // Publish migrations
        $this->publishes([
            __DIR__.'/../database/migrations' => database_path('migrations'),
        ], 'aero-hrm-migrations');
        
        // Publish assets
        $this->publishes([
            __DIR__.'/../resources/js' => resource_path('js/vendor/aero-hrm'),
        ], 'aero-hrm-assets');
        
        // Register commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                Console\InstallCommand::class,
                Console\PublishAssetsCommand::class,
            ]);
        }
    }
    
    protected function detectMode(): string
    {
        // Check if Tenancy package exists
        if (class_exists(\Stancl\Tenancy\Tenancy::class)) {
            // Check if in tenant context
            if (function_exists('tenant') && tenant() !== null) {
                return 'tenant';
            }
            return 'platform';
        }
        
        return 'standalone';
    }
    
    protected function registerRoutes(string $mode): void
    {
        $middleware = ['web', 'auth'];
        
        // Add tenant middleware if needed
        if ($mode === 'tenant') {
            $middleware[] = \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class;
        }
        
        Route::middleware($middleware)
            ->prefix(config('aero-hrm.routes.prefix', 'hrm'))
            ->group(__DIR__.'/../routes/web.php');
        
        Route::middleware(['api', 'auth:sanctum'])
            ->prefix('api/'.config('aero-hrm.routes.prefix', 'hrm'))
            ->group(__DIR__.'/../routes/api.php');
    }
}
```

---

## 🛡️ Security Checklist

### Before Publishing Module

- [ ] Run security audit: `composer audit`
- [ ] Check for exposed secrets: `git secrets --scan`
- [ ] Validate license headers on all files
- [ ] Test with minimum dependencies
- [ ] Run static analysis: `./vendor/bin/phpstan analyse`
- [ ] Check OWASP Top 10 vulnerabilities
- [ ] Validate input sanitization
- [ ] Test SQL injection protection
- [ ] Verify CSRF protection
- [ ] Test XSS protection

### License Validation Implementation

```php
// In ServiceProvider::boot()
if (config('aero-hrm.license_check_enabled', true)) {
    $validator = app(\AeroModules\Core\LicenseValidator::class);
    
    $status = $validator->validateLicense('hrm');
    
    if (!$status->isValid()) {
        throw new \Exception("HRM module license invalid: {$status->message}");
    }
}
```

---

## 🔍 Debugging Guide

### Common Issues & Solutions

#### 1. Module Not Loading

**Symptoms:**
- Routes not registered
- Views not found
- Migrations not running

**Debug Steps:**
```bash
# Check if service provider is registered
php artisan optimize:clear
php artisan package:discover

# Verify autoload
composer dump-autoload

# Check Laravel logs
tail -f storage/logs/laravel.log
```

#### 2. Tenant Context Issues

**Symptoms:**
- Wrong database connection
- Tenant data not isolated
- Cross-tenant data leakage

**Debug Steps:**
```php
// In your controller
dd([
    'tenant' => tenant(),
    'connection' => DB::connection()->getName(),
    'database' => DB::connection()->getDatabaseName(),
]);
```

#### 3. Frontend Assets Not Loading

**Symptoms:**
- 404 on JS/CSS files
- Components not rendering
- White screen

**Debug Steps:**
```bash
# Check Vite manifest
cat public/build/manifest.json

# Rebuild assets
npm run build

# Check browser console
# Open DevTools → Console tab
```

---

## 📊 Metrics to Track

### Module Health Dashboard

```yaml
Module: HRM v1.2.0
Status: ✅ Healthy

Metrics:
  - Installations: 1,234
  - Active Tenants: 987
  - Update Rate: 95%
  - Error Rate: 0.02%
  - Avg Response Time: 45ms
  - Cache Hit Rate: 98%
  - License Compliance: 100%

Recent Activity:
  - Last deployed: 2 days ago
  - Last incident: None
  - Support tickets: 3 open, 45 resolved
```

### Key Performance Indicators

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Installation Time | < 2 min | 1.5 min | ✅ |
| Update Success Rate | > 99% | 99.5% | ✅ |
| API Response Time | < 100ms | 45ms | ✅ |
| Test Coverage | > 80% | 85% | ✅ |
| Security Vulnerabilities | 0 | 0 | ✅ |

---

## 🎓 Best Practices Summary

### DO ✅

1. **Version Everything**
   - Use semantic versioning
   - Tag every release
   - Maintain CHANGELOG.md

2. **Test Thoroughly**
   - Write unit tests
   - Write integration tests
   - Test upgrade paths

3. **Document Everything**
   - Installation guide
   - Configuration guide
   - API documentation
   - Troubleshooting guide

4. **Follow Standards**
   - PSR-12 for PHP
   - ESLint for JavaScript
   - Commit message conventions

5. **Communicate Changes**
   - Breaking changes in MAJOR versions
   - Deprecation warnings
   - Migration guides

### DON'T ❌

1. **Break Backward Compatibility**
   - Without major version bump
   - Without migration guide
   - Without deprecation period

2. **Skip Testing**
   - Deploying without tests
   - Skipping edge cases
   - Ignoring upgrade paths

3. **Hardcode Values**
   - Database credentials
   - API keys
   - Environment-specific paths

4. **Neglect Security**
   - Skip vulnerability scanning
   - Expose sensitive data
   - Ignore security updates

5. **Forget Documentation**
   - Undocumented features
   - Missing API docs
   - No troubleshooting guide

---

## 🚀 Getting Started (New Module)

### 5-Minute Module Setup

```bash
# 1. Create from template (< 1 min)
composer create-project aero/module-template packages/aero-mymodule

# 2. Configure (< 1 min)
cd packages/aero-mymodule
# Edit composer.json (name, description, namespace)
# Edit config/aero-mymodule.php

# 3. Generate boilerplate (< 1 min)
php artisan module:scaffold MyModule

# 4. Install dependencies (< 1 min)
composer install
npm install

# 5. Test (< 1 min)
./vendor/bin/phpunit
npm test
```

**Result:** Working module skeleton ready for development!

---

## 📞 Support & Resources

- **Documentation:** [https://docs.aero-enterprise.com/modules](https://docs.aero-enterprise.com/modules)
- **GitHub Issues:** [https://github.com/aero-modules/hrm/issues](https://github.com/aero-modules/hrm/issues)
- **Community Forum:** [https://forum.aero-enterprise.com](https://forum.aero-enterprise.com)
- **Discord:** [https://discord.gg/aero-enterprise](https://discord.gg/aero-enterprise)
- **Email Support:** support@aero-enterprise.com

---

**Last Updated:** 2025-12-07  
**Version:** 1.0  
**Maintainer:** Aero Development Team
