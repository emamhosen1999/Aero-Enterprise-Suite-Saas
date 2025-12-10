# Aero Module Integration - Production Implementation

## Overview

This document describes the production-grade implementation of the 4 Integration Pillars that enable Aero modules to work seamlessly in both **SaaS** and **Standalone** modes.

---

## 🏗️ Architecture Summary

```text
┌─────────────────────────────────────────────────────────────┐
│                    AERO MODULE SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐                      ┌──────────────┐     │
│  │  SaaS Mode   │                      │  Standalone  │     │
│  │              │                      │     Mode     │     │
│  │ • Composer   │                      │ • No Composer│     │
│  │ • Tenancy    │                      │ • ZIP Upload │     │
│  │ • Subdomains │                      │ • Root Domain│     │
│  └──────┬───────┘                      └──────┬───────┘     │
│         │                                     │              │
│         └───────────┬──────────────────┬──────┘              │
│                     ▼                  ▼                     │
│         ┌───────────────────────────────────────┐           │
│         │    SHARED MODULE CODE (Same Code!)    │           │
│         │                                        │           │
│         │  • AeroTenantable Trait               │           │
│         │  • ModuleRouteServiceProvider         │           │
│         │  • RuntimeLoader Service              │           │
│         │  • React Host & Guest Strategy        │           │
│         └───────────────────────────────────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Pillar 1: AeroTenantable Trait

### Purpose
Provides tenant isolation that works with or without `stancl/tenancy`.

### Location
```
packages/aero-core/src/Traits/AeroTenantable.php
```

### Key Features

1. **Safe Dependency Detection**: Uses `interface_exists()` and `class_exists()` to check for tenancy package
2. **Automatic Context Detection**: Determines SaaS vs Standalone mode
3. **Graceful Fallback**: Falls back to `where('tenant_id', 1)` in Standalone mode
4. **Global Scope**: Automatically applies tenant filtering to all queries

### Usage Example

```php
<?php

namespace Aero\Hrm\Models;

use Illuminate\Database\Eloquent\Model;
use Aero\Core\Traits\AeroTenantable;

class Employee extends Model
{
    use AeroTenantable;

    // No other changes needed!
    // The trait handles both SaaS and Standalone modes
}
```

### How It Works

**In SaaS Mode (with stancl/tenancy):**
```php
// Automatically uses stancl/tenancy scopes
Employee::all(); // SELECT * FROM employees WHERE tenant_id = <current_tenant>
```

**In Standalone Mode (without tenancy):**
```php
// Falls back to manual tenant_id filtering
Employee::all(); // SELECT * FROM employees WHERE tenant_id = 1
```

---

## 🛣️ Pillar 2: ModuleRouteServiceProvider

### Purpose
Registers module routes with correct middleware based on runtime environment.

### Location
```
packages/aero-core/src/Providers/ModuleRouteServiceProvider.php
```

### Key Features

1. **Auto-Discovery**: Automatically finds modules in `packages/` directory
2. **Context-Aware Routing**: Applies tenant middleware in SaaS, web middleware in Standalone
3. **Route File Support**: Handles `tenant.php`, `web.php`, `api.php`, `landlord.php`
4. **Namespace Management**: Automatically resolves controller namespaces

### Usage Example

```php
// In your AppServiceProvider or AeroCoreServiceProvider
public function register(): void
{
    $this->app->register(\Aero\Core\Providers\ModuleRouteServiceProvider::class);
}
```

### Route Files Structure

**SaaS Mode Routing:**
```php
// packages/aero-hrm/routes/tenant.php
Route::middleware(['web', 'tenant', 'auth'])->group(function () {
    Route::get('/hrm/employees', [EmployeeController::class, 'index']);
});
```

**Standalone Mode Routing:**
```php
// Same file, different middleware applied automatically!
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/hrm/employees', [EmployeeController::class, 'index']);
});
```

---

## 🔄 Pillar 3: RuntimeLoader Service

### Purpose
Dynamically loads modules uploaded as ZIP files in Standalone mode without Composer.

### Location
```
packages/aero-core/src/Services/RuntimeLoader.php
```

### Key Features

1. **Module Discovery**: Scans `modules/` directory for `module.json` files
2. **PSR-4 Registration**: Registers autoloading at runtime
3. **Conflict Prevention**: Checks `class_exists()` before loading
4. **Service Provider Registration**: Automatically registers module service providers
5. **Logging**: Comprehensive logging for debugging

### Module Structure for Standalone

```text
modules/
└── aero-crm/
    ├── module.json          ← Module metadata
    ├── src/                 ← PHP source files
    │   ├── Models/
    │   ├── Controllers/
    │   └── AeroCrmServiceProvider.php
    └── dist/                ← Compiled frontend assets
        ├── aero-crm.umd.js
        └── aero-crm.css
```

### Module.json Format

```json
{
  "name": "aero-crm",
  "namespace": "Aero\\Crm",
  "providers": [
    "Aero\\Crm\\AeroCrmServiceProvider"
  ],
  "assets": {
    "js": "dist/aero-crm.umd.js",
    "css": "dist/aero-crm.css"
  }
}
```

### Usage Example

```php
// In AppServiceProvider::boot()
if (config('aero.mode') === 'standalone') {
    $loader = app(\Aero\Core\Services\RuntimeLoader::class);
    $loader->loadModules();
}
```

---

## ⚛️ Pillar 4: React Host & Guest Strategy

### Purpose
Enables frontend modules to work with or without Composer builds.

### Components

#### A. Module Vite Config (Library Mode)

**Location:** `packages/aero-hrm/vite.config.js`

**Key Settings:**
- **Library Mode**: Builds as UMD for standalone loading
- **Externalized Dependencies**: React, Inertia shared between host and modules
- **Output Format**: UMD + ES modules

```bash
# Build module for standalone mode
cd packages/aero-hrm
npm run build
# Output: dist/aero-hrm.umd.js, dist/aero-hrm.css
```

#### B. React Host Resolver

**Location:** `resources/js/app.jsx`

**Resolution Priority:**
1. **Runtime Modules**: Check `window.Aero.modules` (Standalone)
2. **Lazy Imports**: Import from `packages/` (SaaS)
3. **Fallback**: Dynamic import with error handling

**How It Works:**

```javascript
// User navigates to /hrm/employees

// 1. Inertia calls: resolvePageComponent('Hrm/Employees/Index')

// 2. Resolver checks:
if (window.Aero.modules['Hrm']) {
  // Standalone: Use injected module
  return window.Aero.modules.Hrm.Pages.Employees.Index;
}

// 3. Otherwise:
return import('../../packages/aero-hrm/resources/js/Pages/Employees/Index');
// SaaS: Lazy import from Composer package
```

#### C. Blade Injector

**Location:** `resources/views/app.blade.php`

**What It Does:**
- Scans `modules/` directory for built modules
- Injects `<script>` and `<link>` tags for each module
- Registers modules with `window.Aero.registerModule()`

---

## 🚀 Implementation Steps

### Step 1: Install Core Package

```bash
# Add to both SaaS and Standalone hosts
composer require aero/core
```

### Step 2: Register Service Providers

```php
// config/app.php or bootstrap/providers.php
return [
    'providers' => [
        // ...
        Aero\Core\AeroCoreServiceProvider::class,
        Aero\Core\Providers\ModuleRouteServiceProvider::class,
    ],
];
```

### Step 3: Publish Configuration

```bash
php artisan vendor:publish --tag=aero-config
```

### Step 4: Configure Environment

**For SaaS Mode:**
```env
AERO_MODE=saas
AERO_PLATFORM_ENABLED=true
```

**For Standalone Mode:**
```env
AERO_MODE=standalone
AERO_RUNTIME_LOADING=true
AERO_STANDALONE_TENANT_ID=1
```

### Step 5: Use Traits in Models

```php
use Aero\Core\Traits\AeroTenantable;

class YourModel extends Model
{
    use AeroTenantable;
}
```

### Step 6: Build Modules for Standalone

```bash
cd packages/aero-hrm
npm install
npm run build

# Copy dist/ to standalone host's modules/ directory
cp -r dist/ ../../apps/standalone-host/public/modules/aero-hrm/
```

---

## 🧪 Testing

### Test Tenant Isolation

```php
// Test in both modes
use Tests\TestCase;
use Aero\Hrm\Models\Employee;

class TenantIsolationTest extends TestCase
{
    public function test_tenant_scope_works()
    {
        // Create employees for different tenants
        Employee::create(['name' => 'Tenant 1 Employee', 'tenant_id' => 1]);
        Employee::create(['name' => 'Tenant 2 Employee', 'tenant_id' => 2]);

        // Set current tenant
        // (In SaaS: via tenancy middleware, in Standalone: via config)
        
        $employees = Employee::all();
        
        $this->assertCount(1, $employees);
        $this->assertEquals('Tenant 1 Employee', $employees->first()->name);
    }
}
```

### Test Module Loading

```php
use Aero\Core\Services\RuntimeLoader;

public function test_runtime_loader_discovers_modules()
{
    $loader = app(RuntimeLoader::class);
    $modules = $loader->loadModules();
    
    $this->assertArrayHasKey('aero-crm', $modules);
    $this->assertTrue(class_exists('Aero\Crm\Models\Customer'));
}
```

---

## 📋 Checklist

### For Module Developers

- [ ] Use `AeroTenantable` trait in all tenant-scoped models
- [ ] Create `module.json` with namespace and providers
- [ ] Configure Vite for library mode with externalized deps
- [ ] Export all pages in `resources/js/index.jsx`
- [ ] Test module in both SaaS and Standalone modes

### For Host Application

- [ ] Register `ModuleRouteServiceProvider`
- [ ] Enable RuntimeLoader in Standalone mode
- [ ] Update `app.jsx` with module resolver
- [ ] Update `app.blade.php` with injection loop
- [ ] Configure `.env` with correct `AERO_MODE`

---

## 🔧 Troubleshooting

### Issue: "Cannot redeclare class" error

**Cause:** Module loaded via both Composer and RuntimeLoader

**Solution:** RuntimeLoader checks `class_exists()` first - ensure this check is working:

```php
if (class_exists($provider, false)) {
    return; // Skip loading
}
```

### Issue: "Component not found" in React

**Cause:** Module not registered with `window.Aero.modules`

**Solution:** Check browser console for registration logs:

```javascript
console.log(window.Aero.modules); // Should show registered modules
```

### Issue: Tenant scope not working in Standalone

**Cause:** `tenant_id` column missing or config not set

**Solution:**
1. Ensure migration creates `tenant_id` column
2. Set `AERO_STANDALONE_TENANT_ID=1` in `.env`

---

## 📚 Additional Resources

- [Module Extraction Guide](../docs/MODULE_EXTRACTION_GUIDE.md)
- [Tenancy Documentation](https://tenancyforlaravel.com/)
- [Vite Library Mode](https://vitejs.dev/guide/build.html#library-mode)
- [Inertia.js Docs](https://inertiajs.com/)

---

## 🎯 Summary

With these 4 pillars implemented:

1. ✅ **Database queries** work in both modes (AeroTenantable)
2. ✅ **Routes** register correctly based on context (ModuleRouteServiceProvider)
3. ✅ **Modules** load dynamically without Composer (RuntimeLoader)
4. ✅ **Frontend** resolves components from host or guests (React Resolver)

**Result:** Write module code once, deploy in both SaaS and Standalone! 🚀
