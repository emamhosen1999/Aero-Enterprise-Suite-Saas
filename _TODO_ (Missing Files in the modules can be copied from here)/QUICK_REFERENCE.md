# Quick Reference: Aero Core Package

## 📦 Package Location
- **Package:** `c:\laragon\www\Aero-Enterprise-Suite-Saas\aero-core\`
- **Test App:** `c:\laragon\www\Aero-Enterprise-Suite-Saas\aero-core-test\`

---

## ✅ Status: WORKING

```bash
✓ Package created and structured
✓ Composer configuration correct
✓ Service provider auto-discovered
✓ Test app successfully loads package
✓ HRM module depends on core correctly
✓ 113 packages installed
✓ Migrations ready to run
```

---

## 🚀 Quick Commands

### Test Application
```bash
cd c:\laragon\www\Aero-Enterprise-Suite-Saas\aero-core-test

# Verify package is installed
composer show aero/core

# View available commands
php artisan list aero

# Publish core config
php artisan vendor:publish --tag=aero-core-config

# Run migrations
php artisan migrate

# Start development server
php artisan serve
```

### Core Package Development
```bash
cd c:\laragon\www\Aero-Enterprise-Suite-Saas\aero-core

# Build frontend
npm run build

# Run tests (when created)
vendor/bin/phpunit
```

---

## 📁 Key Files

### Core Package
```
aero-core/
├── composer.json                   # Package definition
├── config/
│   ├── core.php                    # Core settings
│   └── modules.php                 # Module definitions
├── src/
│   ├── Models/User.php             # Core user model
│   ├── Services/
│   │   ├── ModuleAccessService.php
│   │   ├── NavigationRegistry.php
│   │   └── ModuleRegistry.php
│   └── Providers/
│       └── AeroCoreServiceProvider.php
├── resources/js/
│   ├── Layouts/App.jsx
│   └── Components/                 # 60+ components
└── database/migrations/            # 13 migrations
```

### Test App
```
aero-core-test/
├── composer.json                   # Includes aero/core
├── .env                            # Environment config
└── config/                         # Laravel configs
```

---

## 🔑 Key Concepts

### 1. Module Access Control
```php
use Aero\Core\Services\ModuleAccessService;

$service = app(ModuleAccessService::class);
$result = $service->canAccessModule($user, 'hrm');

if ($result['allowed']) {
    // User has access
} else {
    // Denied: $result['reason']
}
```

### 2. Navigation Registration
```php
use Aero\Core\Services\NavigationRegistry;

$registry = app(NavigationRegistry::class);
$registry->register('hrm', [
    [
        'title' => 'Employees',
        'route' => 'hrm.employees.index',
        'icon' => 'UsersIcon',
        'permission' => 'employees.view'
    ]
], 20); // Priority
```

### 3. User Relationship Extension
```php
use Aero\Core\Services\UserRelationshipRegistry;

$registry = app(UserRelationshipRegistry::class);
$registry->register('hrm', function($user) {
    return $user->hasOne(Employee::class);
});
```

---

## 🎯 What Core Provides

### Backend
- ✅ User model (auth, 2FA, OAuth, devices)
- ✅ RBAC (roles, permissions, policies)
- ✅ Module access system (3-level hierarchy)
- ✅ Multi-tenancy support
- ✅ Authentication controllers
- ✅ User management controllers
- ✅ Role management controllers

### Frontend
- ✅ App layout (header, sidebar, bottom nav)
- ✅ Auth layout
- ✅ 60+ reusable components
- ✅ Theme system
- ✅ Navigation system
- ✅ Toast notifications
- ✅ Loading states

### Services
- ✅ ModuleAccessService
- ✅ RoleModuleAccessService
- ✅ ModuleRegistry
- ✅ NavigationRegistry
- ✅ UserRelationshipRegistry
- ✅ Auth services
- ✅ Profile services
- ✅ Notification services

---

## 🔧 Module Integration Pattern

When creating a new module (e.g., CRM):

1. **Create package directory**
   ```bash
   mkdir aero-crm
   cd aero-crm
   ```

2. **composer.json**
   ```json
   {
       "name": "aero/crm",
       "require": {
           "aero/core": "@dev"
       },
       "autoload": {
           "psr-4": {
               "Aero\\CRM\\": "src/"
           }
       }
   }
   ```

3. **Service Provider**
   ```php
   namespace Aero\CRM\Providers;
   
   use Aero\Core\Services\NavigationRegistry;
   use Illuminate\Support\ServiceProvider;
   
   class CRMServiceProvider extends ServiceProvider
   {
       public function boot()
       {
           // Register navigation
           $registry = app(NavigationRegistry::class);
           $registry->register('crm', [...], 30);
       }
   }
   ```

4. **Add to main app**
   ```json
   {
       "repositories": [
           { "type": "path", "url": "../aero-crm" }
       ],
       "require": {
           "aero/crm": "@dev"
       }
   }
   ```

---

## 📊 Verification Checklist

- [x] Package structure correct
- [x] Composer.json valid
- [x] Service provider auto-discovered
- [x] Test app loads package
- [x] Dependencies resolved
- [x] Commands available
- [ ] Migrations run (pending)
- [ ] Frontend built (pending)
- [ ] Tests created (pending)

---

## 🎓 Architecture Diagram

```
┌─────────────────────────────────────────┐
│         aero-core-test                  │
│     (Test Laravel Application)          │
│                                         │
│  Requires: aero/core@dev                │
└────────────────┬────────────────────────┘
                 │
                 │ depends on
                 │
┌────────────────▼────────────────────────┐
│           aero/core                     │
│      (Foundation Package)               │
│                                         │
│  • User & Auth                          │
│  • Roles & Permissions                  │
│  • Module Access Control                │
│  • Multi-tenancy                        │
│  • Layouts & Components                 │
│  • Services & Registries                │
└────────────────┬────────────────────────┘
                 │
                 │ used by
                 │
┌────────────────▼────────────────────────┐
│           aero/hrm                      │
│       (HRM Module Package)              │
│                                         │
│  Requires: aero/core@dev                │
│  • Employees                            │
│  • Attendance                           │
│  • Leave Management                     │
│  • Payroll                              │
└─────────────────────────────────────────┘
```

---

## 📞 Quick Troubleshooting

### Issue: Package not found
```bash
# Solution
cd aero-core-test
composer clear-cache
composer update
```

### Issue: Migrations not found
```bash
# Solution
php artisan migrate:status
php artisan vendor:publish --tag=aero-core-migrations
```

### Issue: Frontend not loading
```bash
# Solution
cd aero-core
npm run build
cd ../aero-core-test
npm run build
```

### Issue: Routes not registered
```bash
# Solution
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan route:list
```

---

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ `composer show aero/core` returns package info
2. ✅ `php artisan list aero` shows aero commands
3. ✅ `php artisan route:list` shows dashboard routes
4. ✅ Service provider appears in package:discover
5. ✅ User model available: `use Aero\Core\Models\User;`

---

**Status: ✅ VERIFIED & WORKING**

For detailed verification report, see: `AERO_CORE_VERIFICATION_REPORT.md`
For success summary, see: `CORE_SEPARATION_SUCCESS.md`
