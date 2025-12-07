<?php

declare(strict_types=1);

use App\Http\Controllers\Shared\Auth\ImpersonationController;
use App\Http\Controllers\Tenant\AdminSetupController;
use App\Http\Middleware\IdentifyDomainContext;
use App\Http\Middleware\OptimizeTenantCache;
use App\Http\Middleware\SetTenant;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Routes for tenant subdomains ({tenant}.platform.com).
| Tenancy middleware switches to tenant's database.
|
| Middleware chain:
| 1. IdentifyDomainContext - Determines if request is for tenant
| 2. InitializeTenancyByDomain - Stancl's tenancy initialization
| 3. PreventAccessFromCentralDomains - Blocks central domain access
| 4. SetTenant - Custom tenant validation & config overrides
| 5. OptimizeTenantCache - Tenant-scoped cache optimization
|
*/

Route::middleware([
    IdentifyDomainContext::class,
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
    SetTenant::class,
    OptimizeTenantCache::class,
])->group(function () {
    // =========================================================================
    // ADMIN SETUP ROUTES (No auth required - for newly provisioned tenants)
    // =========================================================================
    // These routes are for creating the initial admin user after provisioning
    Route::get('/admin-setup', [AdminSetupController::class, 'show'])
        ->name('admin.setup');
    Route::post('/admin-setup', [AdminSetupController::class, 'store'])
        ->name('admin.setup.store');

    // =========================================================================
    // IMPERSONATION ROUTES (No auth required - token-based)
    // =========================================================================
    Route::get('/impersonate/{token}', [ImpersonationController::class, 'handle'])
        ->name('impersonate.handle');

    Route::post('/impersonate/end', [ImpersonationController::class, 'endImpersonation'])
        ->middleware('auth')
        ->name('impersonate.end');

    // Root redirects to dashboard
    Route::get('/', function () {
        return redirect('/dashboard');
    })->middleware(['auth', 'tenant.setup']);

    // Auth routes (login, logout, password reset - NO registration)
    require __DIR__.'/auth.php';

    // App routes (dashboard, profile, etc.) - protected by tenant.setup middleware
    Route::middleware(['auth', 'tenant.setup'])->group(function () {
        require __DIR__.'/web.php';
        
        // Module routes
        foreach (['hr', 'project-management', 'dms', 'quality', 'analytics', 'compliance', 'modules', 'support', 'finance', 'integrations'] as $module) {
            if (file_exists(__DIR__."/{$module}.php")) {
                require __DIR__."/{$module}.php";
            }
        }
    });
});
