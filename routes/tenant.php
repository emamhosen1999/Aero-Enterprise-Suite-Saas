<?php

declare(strict_types=1);

use App\Http\Middleware\IdentifyDomainContext;
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
*/

Route::middleware([
    IdentifyDomainContext::class,
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    // Root redirects to dashboard
    Route::get('/', function () {
        return redirect('/dashboard');
    })->middleware('auth');

    // Auth routes (login, logout, password reset - NO registration)
    require __DIR__.'/auth.php';

    // App routes (dashboard, profile, etc.)
    require __DIR__.'/web.php';

    // Module routes
    foreach (['hr', 'project-management', 'dms', 'quality', 'analytics', 'compliance', 'modules'] as $module) {
        if (file_exists(__DIR__."/{$module}.php")) {
            require __DIR__."/{$module}.php";
        }
    }
});
