# 🧾 Tenancy & Multi-Mode Compliance Audit - CRITICAL VIOLATIONS FOUND

**System:** Aero Enterprise Suite SaaS  
**Date:** 2025-12-23  
**Auditor:** Principal Laravel SaaS Architect & Compliance Agent  
**Phase:** Tenant Provisioning, Tenancy Bootstrapping, and Isolation

---

## ❌ CRITICAL VIOLATIONS (Must Fix Immediately)

### 1. Mode Detection Not File-Based
**Violation:** Mode is inferred from package presence (`class_exists`) and set via `Config::set()`, not from a persistent file.

**Why Critical:**
- Violates "mode must be file-based lock" requirement
- Mode changes if platform package is installed/uninstalled
- No immutable mode guarantee
- Can't persist user's mode selection from installer

**Current Implementation (WRONG):**
```php
// packages/aero-core/src/AeroCoreServiceProvider.php:476
protected function isPlatformActive(): bool
{
    return class_exists('Aero\Platform\AeroPlatformServiceProvider');
}

// packages/aero-platform/src/AeroPlatformServiceProvider.php:50
Config::set('aero.mode', 'saas');
```

**Required Implementation:**
```php
// MUST use file-based detection
protected function isSaasMode(): bool
{
    if (!file_exists(storage_path('app/aeos.mode'))) {
        return false; // Default to standalone if not set
    }
    
    return trim(file_get_contents(storage_path('app/aeos.mode'))) === 'saas';
}

// Installer MUST write mode file on completion
File::put(storage_path('app/aeos.mode'), $selectedMode); // 'saas' or 'standalone'
```

**Impact:**
- 🔴 Mode not immutable at runtime
- 🔴 Can't install in standalone mode with platform package present
- 🔴 Mode not persisted across requests
- 🔴 Installer can't set user-selected mode

**Files Affected:**
- `packages/aero-core/src/AeroCoreServiceProvider.php`
- `packages/aero-core/src/Http/Controllers/InstallationController.php`
- `packages/aero-platform/src/AeroPlatformServiceProvider.php`
- All files checking `config('aero.mode')`

---

### 2. Tenancy Enabled Without Installation Check
**Violation:** Platform registers tenancy service provider in `register()` without checking if installed.

**Why Critical:**
- Violates "no tenancy before installation" absolute rule
- Tenancy bootstrappers run before installation completes
- Can cause DB errors during first launch

**Current Implementation (WRONG):**
```php
// packages/aero-platform/src/AeroPlatformServiceProvider.php:38-41
public function register(): void
{
    // WRONG: No installation check!
    $this->app->register(\Aero\Platform\Providers\TenancyBootstrapServiceProvider::class);
    
    Fortify::ignoreRoutes();
    Config::set('aero.mode', 'saas'); // Also sets mode unconditionally
    //...
}
```

**Required Implementation:**
```php
public function register(): void
{
    // ONLY register tenancy if installed AND in SaaS mode
    if ($this->installed() && $this->isSaasMode()) {
        $this->app->register(\Aero\Platform\Providers\TenancyBootstrapServiceProvider::class);
    }
    
    // Don't set mode here - read from file
}
```

**Impact:**
- 🔴 Tenancy active during installation
- 🔴 Can't install platform (tenancy bootstrappers fail)
- 🔴 DB queries before install completes

---

### 3. Tenancy Enabled in Standalone Mode
**Violation:** Core loads `InitializeTenancyIfNotCentral` middleware even in standalone mode.

**Why Critical:**
- Violates "no tenancy in standalone mode" absolute rule
- Standalone installations don't need tenancy
- Loads unnecessary stancl/tenancy code
- Can cause errors if tenancy not configured

**Current Implementation (WRONG):**
```php
// packages/aero-core/src/AeroCoreServiceProvider.php:335-346
if ($this->isPlatformActive()) {
    // SaaS Mode: Core routes ONLY on tenant domains
    if (! $isCentralDomain) {
        Route::middleware([
            'web',
            \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
            'tenant',
        ])->group($routesPath.'/web.php');
    }
} else {
    // Standalone Mode: Routes with standard web middleware
    Route::middleware(['web'])
        ->group($routesPath.'/web.php');
}
```

**Problem:** `isPlatformActive()` checks `class_exists()` not actual mode. If platform package is present but mode is standalone, tenancy is still enabled.

**Required Implementation:**
```php
if ($this->installed() && $this->isSaasMode()) {
    // SaaS Mode: Enable tenancy
    if (! $isCentralDomain) {
        Route::middleware([
            'web',
            \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
            'tenant',
        ])->group($routesPath.'/web.php');
    }
} else {
    // Standalone Mode: NO tenancy
    Route::middleware(['web'])
        ->group($routesPath.'/web.php');
}
```

**Impact:**
- 🔴 Tenancy middleware loaded in standalone
- 🔴 Unnecessary tenancy resolution attempts
- 🔴 Potential "Tenant could not be identified" errors

---

### 4. Missing `tenancy()->end()` in Provisioning
**Violation:** `ProvisionTenant` job initializes tenancy but doesn't always call `tenancy()->end()` in all code paths.

**Why Critical:**
- Violates "missing tenancy teardown" security requirement
- Can cause context bleeding between tenants
- Database connection not reset after provisioning
- Memory leaks in long-running processes

**Current Implementation (WRONG):**
```php
// packages/aero-platform/src/Jobs/ProvisionTenant.php:573-585
protected function syncModuleHierarchy(): void
{
    tenancy()->initialize($this->tenant);
    
    try {
        Artisan::call('aero:sync-module', [
            '--prune' => true,
        ]);
    } finally {
        tenancy()->end(); // ✅ Has finally block
    }
}

// BUT - other methods don't guarantee cleanup:
protected function seedDefaultRoles(): void
{
    tenancy()->initialize($this->tenant);
    
    // ... seeding logic ...
    
    tenancy()->end(); // ⚠️ Can be skipped if exception thrown
}
```

**Required Implementation:**
```php
protected function seedDefaultRoles(): void
{
    try {
        tenancy()->initialize($this->tenant);
        
        // Seeding logic
        
    } finally {
        // ALWAYS cleanup, even on exception
        tenancy()->end();
    }
}
```

**Impact:**
- 🔴 Tenant context leaks between jobs
- 🔴 Database connection not reset
- 🔴 Potential cross-tenant data access

**Files Affected:**
- `packages/aero-platform/src/Jobs/ProvisionTenant.php` (multiple methods)

---

### 5. Tenant Resolution in Service Providers
**Violation:** Platform sets mode in `register()`, which can trigger tenant resolution if services are instantiated.

**Why Critical:**
- Violates "no tenant resolution in providers" absolute rule
- Service providers run before middleware
- Can cause "Tenant could not be identified" errors
- Mode detection happens too early

**Current Implementation (WRONG):**
```php
// packages/aero-platform/src/AeroPlatformServiceProvider.php:48-50
public function register(): void
{
    // ...
    
    // Set aero.mode to 'saas' - Platform is the SaaS orchestrator
    // This MUST be set before any module checks for mode
    Config::set('aero.mode', 'saas'); // ⚠️ Triggers mode-dependent logic too early
    
    //...
}
```

**Required Implementation:**
```php
public function register(): void
{
    // Don't set mode here - read from file only when needed
    // Mode is already set by installer in storage/app/aeos.mode
}
```

**Impact:**
- 🔴 Mode set before installation check
- 🔴 Services may try to resolve tenant
- 🔴 Can't defer tenancy until after middleware

---

### 6. Installer Doesn't Write Mode File
**Violation:** `InstallationController` doesn't write `storage/app/aeos.mode` file.

**Why Critical:**
- No way to persist user's mode selection
- Mode detection fails after installation
- System defaults to wrong mode

**Current Implementation (MISSING):**
```php
// packages/aero-core/src/Http/Controllers/InstallationController.php
private function markAsInstalled(): void
{
    $flagPath = storage_path('app/aeos.installed');
    File::put($flagPath, now()->toIso8601String());
    
    // ❌ MISSING: Mode file creation
}
```

**Required Implementation:**
```php
private function markAsInstalled(string $mode = 'standalone'): void
{
    // Installation flag
    $flagPath = storage_path('app/aeos.installed');
    File::put($flagPath, now()->toIso8601String());
    
    // Mode flag (REQUIRED)
    $modePath = storage_path('app/aeos.mode');
    File::put($modePath, $mode); // 'saas' or 'standalone'
    
    // ...
}
```

---

## ⚠️ ARCHITECTURAL RISKS

### 1. Mode Inference from Package Presence
**Risk:** `isPlatformActive()` uses `class_exists()` to detect SaaS mode.

**Impact:** Medium  
**Current Behavior:**
```php
protected function isPlatformActive(): bool
{
    return class_exists('Aero\Platform\AeroPlatformServiceProvider');
}
```

**Problem:**
- If platform package is installed but mode is standalone, wrong behavior
- Can't have platform package for development without enabling SaaS
- Mode should be explicit, not inferred

**Recommendation:**
Replace with file-based mode check everywhere.

---

### 2. Config-Based Mode Detection
**Risk:** Code uses `config('aero.mode')` which is set via `Config::set()`.

**Impact:** Medium  
**Files Affected:**
- `packages/aero-core/src/Http/Middleware/CheckModuleAccess.php`
- `packages/aero-core/src/Http/Middleware/HandleInertiaRequests.php`
- `packages/aero-core/src/Services/PlatformErrorReporter.php`
- `packages/aero-core/src/Services/ModuleManager.php`
- `packages/aero-core/src/helpers.php`

**Problem:**
- Config can change at runtime
- Not persistent across requests
- No single source of truth

**Recommendation:**
Create `mode()` helper function that reads from file:
```php
function mode(): string
{
    static $mode = null;
    
    if ($mode === null) {
        $modePath = storage_path('app/aeos.mode');
        $mode = file_exists($modePath) 
            ? trim(file_get_contents($modePath)) 
            : 'standalone';
    }
    
    return $mode;
}
```

---

### 3. Missing Middleware Order Validation
**Risk:** No enforcement of `BootstrapGuard` before `InitializeTenancyByDomain`.

**Impact:** Low  
**Current State:** Implicit ordering via registration sequence.

**Recommendation:**
Document required middleware order in comments:
```php
// REQUIRED ORDER (SaaS mode):
// 1. BootstrapGuard (global, registered first)
// 2. InitializeTenancyByDomain (route-specific)
// 3. PreventAccessFromCentralDomains (route-specific)
```

---

### 4. Provisioning Transaction Scope
**Risk:** `ProvisionTenant` job uses `DB::transaction()` in one method but not consistently.

**Impact:** Medium  
**Current State:** Some operations outside transactions.

**Recommendation:**
Wrap entire `handle()` method in transaction:
```php
public function handle(): void
{
    DB::transaction(function () {
        // All provisioning steps
    });
}
```

---

## ✅ COMPLIANT IMPLEMENTATIONS

### 1. Installation-Gated Tenancy in Core Routes
**Status:** PARTIALLY COMPLIANT ⚠️

Core correctly gates route loading by installation status:
```php
// ✅ Good: Checks installation before loading routes
if (!$this->installed()) {
    Route::middleware(['web'])->group($routesPath.'/install.php');
    return;
}

// ⚠️ Issue: Uses isPlatformActive() not isSaasMode()
if ($this->isPlatformActive()) {
    // Load SaaS routes
}
```

**Fix Needed:** Replace `isPlatformActive()` with file-based `isSaasMode()`.

---

### 2. Global BootstrapGuard Middleware
**Status:** COMPLIANT ✅

BootstrapGuard correctly registered globally:
```php
// ✅ Correct: Registered in register() before routing
public function register(): void
{
    $kernel = $this->app->make(\Illuminate\Contracts\Http\Kernel::class);
    $kernel->pushMiddleware(\Aero\Core\Http\Middleware\BootstrapGuard::class);
}
```

This ensures installation check happens before tenancy.

---

### 3. Tenant Provisioning Transactional Safety
**Status:** PARTIALLY COMPLIANT ⚠️

Provisioning has rollback logic:
```php
// ✅ Good: Database rollback on failure
try {
    $this->createDatabase();
    $databaseCreated = true;
    // ... provisioning steps
} catch (Throwable $e) {
    if ($databaseCreated) {
        $this->rollbackDatabase();
    }
    throw $e;
}
```

**Issue:** Not all operations in DB transaction. Partial state possible.

---

### 4. Tenancy Lifecycle in Provisioning
**Status:** PARTIALLY COMPLIANT ⚠️

Some methods use proper lifecycle:
```php
// ✅ Good: Uses finally block
protected function syncModuleHierarchy(): void
{
    tenancy()->initialize($this->tenant);
    
    try {
        Artisan::call('aero:sync-module', ['--prune' => true]);
    } finally {
        tenancy()->end();
    }
}
```

**Issue:** Not all methods use finally blocks consistently.

---

### 5. Domain-Based Tenant Resolution
**Status:** COMPLIANT ✅

Tenant resolution correctly uses domain:
```php
// ✅ Correct: InitializeTenancyByDomain resolves by subdomain
Route::middleware([
    'web',
    \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
    'tenant',
])->group($routesPath.'/web.php');
```

`InitializeTenancyIfNotCentral` correctly skips central domains.

---

## 🔧 CONCRETE FIXES REQUIRED

### Fix 1: Implement File-Based Mode Detection

**File:** `packages/aero-core/src/AeroCoreServiceProvider.php`

**Add method:**
```php
/**
 * Check if system is in SaaS mode using file-based detection.
 * Mode is set during installation and immutable at runtime.
 * 
 * @return bool
 */
protected function isSaasMode(): bool
{
    if (!file_exists(storage_path('app/aeos.mode'))) {
        return false; // Default to standalone
    }
    
    return trim(file_get_contents(storage_path('app/aeos.mode'))) === 'saas';
}
```

**Replace all instances of:**
```php
// WRONG:
if ($this->isPlatformActive()) { ... }
if (config('aero.mode') === 'saas') { ... }

// CORRECT:
if ($this->installed() && $this->isSaasMode()) { ... }
```

---

### Fix 2: Guard Platform Tenancy Registration

**File:** `packages/aero-platform/src/AeroPlatformServiceProvider.php`

**Change from:**
```php
public function register(): void
{
    $this->app->register(\Aero\Platform\Providers\TenancyBootstrapServiceProvider::class);
    Fortify::ignoreRoutes();
    Config::set('aero.mode', 'saas');
    //...
}
```

**Change to:**
```php
public function register(): void
{
    Fortify::ignoreRoutes();
    
    // ONLY register tenancy if installed AND in SaaS mode
    if ($this->installed() && $this->isSaasMode()) {
        $this->app->register(\Aero\Platform\Providers\TenancyBootstrapServiceProvider::class);
    }
    
    // Don't set config mode - read from file
    //...
}

protected function installed(): bool
{
    return file_exists(storage_path('app/aeos.installed'));
}

protected function isSaasMode(): bool
{
    if (!file_exists(storage_path('app/aeos.mode'))) {
        return false;
    }
    return trim(file_get_contents(storage_path('app/aeos.mode'))) === 'saas';
}
```

---

### Fix 3: Write Mode File in Installer

**File:** `packages/aero-core/src/Http/Controllers/InstallationController.php`

**Update installer to accept mode selection:**
```php
// Add mode selection step
public function selectMode()
{
    return Inertia::render('Installation/Mode', [
        'title' => 'Installation Mode',
    ]);
}

public function saveMode(Request $request)
{
    $validated = $request->validate([
        'mode' => 'required|in:saas,standalone',
    ]);
    
    Session::put('installation.mode', $validated['mode']);
    
    return response()->json([
        'success' => true,
        'message' => 'Mode selected successfully',
    ]);
}

// Update markAsInstalled
private function markAsInstalled(): void
{
    // Installation flag
    $flagPath = storage_path('app/aeos.installed');
    File::ensureDirectoryExists(dirname($flagPath));
    File::put($flagPath, now()->toIso8601String());
    
    // Mode flag (REQUIRED)
    $mode = Session::get('installation.mode', 'standalone');
    $modePath = storage_path('app/aeos.mode');
    File::ensureDirectoryExists(dirname($modePath));
    File::put($modePath, $mode);
    
    // System settings
    SystemSetting::updateOrCreate(
        ['key' => 'installation_completed'],
        ['value' => now()->toDateTimeString(), 'type' => 'system']
    );
}
```

---

### Fix 4: Ensure tenancy()->end() Always Runs

**File:** `packages/aero-platform/src/Jobs/ProvisionTenant.php`

**Wrap all tenancy->initialize() calls:**
```php
protected function seedDefaultRoles(): void
{
    try {
        tenancy()->initialize($this->tenant);
        
        // Seeding logic here
        
    } finally {
        // ALWAYS cleanup
        tenancy()->end();
    }
}

protected function verifyProvisioning(): void
{
    try {
        tenancy()->initialize($this->tenant);
        
        // Verification logic
        
    } finally {
        tenancy()->end();
    }
}
```

Apply to ALL methods that use `tenancy()->initialize()`.

---

### Fix 5: Create Mode Helper Function

**File:** `packages/aero-core/src/helpers.php`

**Add helper:**
```php
if (!function_exists('aero_mode')) {
    /**
     * Get the current Aero mode (saas or standalone).
     * Mode is file-based and immutable at runtime.
     * 
     * @return string 'saas' or 'standalone'
     */
    function aero_mode(): string
    {
        static $mode = null;
        
        if ($mode === null) {
            $modePath = storage_path('app/aeros.mode');
            
            if (!file_exists($modePath)) {
                $mode = 'standalone'; // Default
            } else {
                $mode = trim(file_get_contents($modePath));
                
                // Validate
                if (!in_array($mode, ['saas', 'standalone'])) {
                    $mode = 'standalone';
                }
            }
        }
        
        return $mode;
    }
}

if (!function_exists('is_saas_mode')) {
    /**
     * Check if running in SaaS mode.
     * 
     * @return bool
     */
    function is_saas_mode(): bool
    {
        return aero_mode() === 'saas';
    }
}
```

**Replace all config('aero.mode') calls with:**
```php
// WRONG:
if (config('aero.mode') === 'saas') { ... }

// CORRECT:
if (is_saas_mode()) { ... }
```

---

## 📊 Compliance Scorecard

| Requirement | Status | Notes |
|-------------|--------|-------|
| File-based mode detection | ❌ FAIL | Uses class_exists() and Config::set() |
| No tenancy before install | ❌ FAIL | Platform registers tenancy in register() |
| No tenancy in standalone | ❌ FAIL | Mode inferred from package presence |
| Tenancy lifecycle cleanup | ⚠️ PARTIAL | Some methods missing finally blocks |
| No tenant resolution in providers | ❌ FAIL | Mode set in register() can trigger logic |
| Installer writes mode file | ❌ FAIL | Mode file not created |
| Transactional provisioning | ⚠️ PARTIAL | Rollback exists but not full transaction |
| Middleware order | ✅ PASS | BootstrapGuard before tenancy |
| Domain-based resolution | ✅ PASS | Uses InitializeTenancyByDomain |

**Overall Compliance:** **3/9 FAIL** ❌

---

## 🎯 Priority Fixes (In Order)

1. **CRITICAL:** Implement file-based mode detection
2. **CRITICAL:** Guard platform tenancy registration with install + mode check
3. **CRITICAL:** Write mode file in installer
4. **HIGH:** Add tenancy()->end() finally blocks everywhere
5. **HIGH:** Replace all config('aero.mode') with helper
6. **MEDIUM:** Remove Config::set('aero.mode') from platform
7. **LOW:** Document middleware order requirements

---

## 🔒 Security Impact

**Cross-Tenant Data Leakage Risk:** HIGH 🔴
- Missing `tenancy()->end()` can cause context bleeding
- Tenant data accessible from wrong tenant/landlord

**Unauthorized Access Risk:** MEDIUM 🟡
- Wrong mode enables tenancy in standalone
- Can expose multi-tenant features unintentionally

**Installation Failure Risk:** HIGH 🔴
- Tenancy active during install causes DB errors
- Can't complete installation in SaaS mode

---

## 📝 Conclusion

The system has **6 CRITICAL violations** in tenancy and multi-mode support that **MUST** be fixed before production:

1. ❌ Mode is not file-based
2. ❌ Tenancy enabled before installation
3. ❌ Tenancy enabled in standalone mode
4. ❌ Missing tenancy cleanup in provisioning
5. ❌ Tenant resolution can happen in providers
6. ❌ Installer doesn't write mode file

**Production Readiness:** ❌ **NOT READY**

System requires **immediate fixes** to meet architectural requirements for package-driven, multi-mode SaaS platform.

---

**Audit Completed:** 2025-12-23  
**Status:** ❌ **CRITICAL VIOLATIONS - REQUIRES IMMEDIATE ACTION**  
**Next Review:** After mode detection and tenancy gating fixes
