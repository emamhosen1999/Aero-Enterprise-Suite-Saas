<?php

declare(strict_types=1);

use App\Http\Middleware\IdentifyDomainContext;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| These routes are loaded for tenant subdomains ({tenant}.platform.com).
| The tenancy is initialized by domain, switching to the tenant's database.
|
| All existing application routes will work here - they just operate
| on the tenant's database instead of the central database.
|
*/

Route::middleware([
    'web',
    IdentifyDomainContext::class,
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    // Tenant Dashboard
    Route::get('/', function () {
        return Inertia::render('Dashboard');
    })->middleware('auth')->name('tenant.dashboard');

    // Include all the existing application routes for tenants
    // These will use the tenant's database automatically

    // Authentication routes for tenant
    require __DIR__.'/auth.php';

    // HR Module routes (if tenant has access)
    if (file_exists(__DIR__.'/hr.php')) {
        require __DIR__.'/hr.php';
    }

    // Project Management routes
    if (file_exists(__DIR__.'/project-management.php')) {
        require __DIR__.'/project-management.php';
    }

    // DMS routes
    if (file_exists(__DIR__.'/dms.php')) {
        require __DIR__.'/dms.php';
    }

    // Quality routes
    if (file_exists(__DIR__.'/quality.php')) {
        require __DIR__.'/quality.php';
    }

    // Analytics routes
    if (file_exists(__DIR__.'/analytics.php')) {
        require __DIR__.'/analytics.php';
    }

    // Compliance routes
    if (file_exists(__DIR__.'/compliance.php')) {
        require __DIR__.'/compliance.php';
    }

    // Module routes
    if (file_exists(__DIR__.'/modules.php')) {
        require __DIR__.'/modules.php';
    }
});
