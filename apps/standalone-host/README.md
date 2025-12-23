# Aero Enterprise Suite - Standalone Host

This is the **standalone host application** for Aero Enterprise Suite. It serves as a thin container for the package-driven architecture, providing minimal configuration while delegating all functionality to packages.

## 🏗️ Package-Driven Architecture

### Core Principle

**The host application remains unmodified.** All routing, bootstrapping, middleware registration, and lifecycle control originates from packages. This architecture ensures:

1. ✅ **Clean separation of concerns** - Host app is just a container
2. ✅ **First launch without database** - Installation works before DB exists
3. ✅ **Package-driven routing** - All routes come from packages
4. ✅ **Easy updates** - Update packages without touching host app
5. ✅ **Reusable components** - Same packages work in different hosts

### What the Host Contains

The host application should ONLY contain:

```
apps/standalone-host/
├── .env                    # Environment-specific configuration
├── .env.example            # Environment template
├── composer.json           # Package dependencies with path repositories
├── vite.config.js          # Build configuration
├── package.json            # Frontend dependencies
├── phpunit.xml             # Test configuration
├── bootstrap/
│   ├── app.php             # Minimal bootstrap (delegates to packages)
│   └── providers.php       # Empty provider list
├── config/                 # Laravel default configs (unmodified)
├── public/                 # Web root with compiled assets
├── database/
│   └── database.sqlite     # SQLite database file (if using SQLite)
├── routes/
│   ├── web.php             # Empty (routes from packages)
│   ├── api.php             # Empty (routes from packages)
│   └── console.php         # Minimal console routes
├── storage/                # Storage directory
└── app/
    ├── Http/Controllers/
    │   └── Controller.php  # Base controller (empty)
    └── Providers/
        └── AppServiceProvider.php  # Empty service provider
```

### What the Host DOES NOT Contain

❌ Models (use `Aero\Core\Models\User`)  
❌ Middleware (use `Aero\Core\Http\Middleware\*`)  
❌ Routes (loaded from packages automatically)  
❌ Controllers (loaded from packages)  
❌ Business logic (in package services)  
❌ Frontend components (in `aero-ui` package)

## 📦 Package Architecture

### Core Packages

| Package | Purpose | Auto-loaded |
|---------|---------|-------------|
| **aero/core** | Authentication, users, roles, dashboard, settings | ✅ Yes |
| **aero/ui** | Frontend components, layouts, themes | ✅ Yes |
| **aero/hrm** | Human Resource Management | ✅ Optional |
| **aero/crm** | Customer Relationship Management | Optional |
| **aero/finance** | Finance & Accounting | Optional |
| **aero/project** | Project Management | Optional |

### How Packages Work

1. **Service Providers**: Each package has a service provider that:
   - Registers routes automatically
   - Registers middleware
   - Loads migrations
   - Provides services

2. **Route Loading**: Packages register their own routes via `AbstractModuleProvider`:
   ```php
   // In package's ModuleProvider
   protected function loadRoutes(): void {
       Route::middleware(['web'])->group($routesPath . '/web.php');
   }
   ```

3. **Middleware Registration**: Middleware is registered by packages:
   ```php
   // In AeroCoreServiceProvider::boot()
   $router->pushMiddlewareToGroup('web', HandleInertiaRequests::class);
   ```

## 🚀 First Launch Experience

### Installation Flow (No Database Required)

The application works correctly on first launch WITHOUT any database, sessions, or cache:

1. **BootstrapGuard Middleware** (from `aero/core`):
   - Detects if app is installed (checks `storage/installed` file)
   - Forces file-based sessions during installation
   - Redirects all requests to `/install`

2. **Installation Routes** (from `aero/core`):
   - Loaded automatically when not installed
   - Guide user through setup:
     - License validation
     - System requirements check
     - Database configuration
     - Admin user creation
   - Creates `storage/installed` marker file when complete

3. **Post-Installation**:
   - BootstrapGuard allows normal app routes
   - Sessions switch to configured driver (database/redis)
   - Full application functionality available

### How It Works

```php
// packages/aero-core/src/Providers/CoreModuleProvider.php

public function register(): void
{
    // Register BootstrapGuard BEFORE route matching
    if (config('aero.mode') === 'standalone') {
        $kernel = $this->app->make(Kernel::class);
        $kernel->pushMiddleware(BootstrapGuard::class);
    }
}

public function boot(): void
{
    // Load installation routes if not installed
    if (config('aero.mode') === 'standalone' && !file_exists(storage_path('installed'))) {
        Route::middleware(['web'])->group(__DIR__.'/../../routes/installation.php');
    }
    
    // Load normal app routes (blocked by BootstrapGuard until installed)
    parent::boot();
}
```

## ⚙️ Configuration

### Environment Variables

```env
# Application mode (required)
AERO_MODE=standalone

# Standalone tenant ID (default: 1)
AERO_STANDALONE_TENANT_ID=1

# Database configuration
DB_CONNECTION=sqlite  # or mysql, pgsql

# Session/Cache (automatically switched to 'file' during installation)
SESSION_DRIVER=database
CACHE_STORE=database
```

## 🔧 Development Workflow

### Initial Setup

```bash
# 1. Install dependencies
composer install
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Generate application key
php artisan key:generate

# 4. Build frontend assets
npm run build

# 5. Start the application (NO MIGRATION NEEDED - installer handles this)
php artisan serve
```

Visit `http://localhost:8000` - you'll be redirected to `/install` automatically.

### Adding New Modules

To add a new module, simply require it in `composer.json`:

```bash
# Add the package
composer require aero/crm:@dev

# That's it! The package auto-registers itself via Laravel package discovery
```

No need to:
- ❌ Register service providers (auto-discovered)
- ❌ Add routes (package registers its own)
- ❌ Configure middleware (package handles it)
- ❌ Modify host app code

### Package Development

When developing packages in the monorepo:

```bash
# All changes go in packages/aero-*/ directories
cd /path/to/monorepo
vim packages/aero-hrm/src/...

# Host app remains untouched
```

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific package tests
php artisan test --filter CoreModuleProviderTest
```

## 📚 Further Reading

- [Architecture Overview](../../docs/ARCHITECTURAL_AUDIT_REPORT.md)
- [Module System Guide](../../docs/MODULE_DECENTRALIZATION_REPORT.md)
- [Package Development Guide](../../packages/README.md)

## 🤝 Contributing

When contributing:

1. **Never modify host app code** - all changes go in packages
2. **Follow package structure** - use `AbstractModuleProvider` pattern
3. **Test first launch** - ensure app works without database
4. **Document changes** - update package README if adding features

## 📄 License

Proprietary - Aero Enterprise Suite
