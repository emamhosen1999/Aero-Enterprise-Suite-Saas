<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\PlatformSettingController;
use App\Http\Controllers\Landlord\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Admin Routes (admin.platform.com)
|--------------------------------------------------------------------------
|
| Uses central/platform database with LANDLORD GUARD.
| These routes are for super admins managing the multi-tenant platform.
|
| IMPORTANT: All routes use 'auth:landlord' middleware, NOT 'auth'.
| This ensures authentication is checked against the landlord_users table
| in the central database, not the tenant users table.
|
*/

// =========================================================================
// LANDLORD AUTHENTICATION ROUTES
// =========================================================================

Route::middleware('guest:landlord')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])
        ->name('admin.login');

    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:landlord')
    ->name('admin.logout');

// Root redirects to dashboard (or login if not authenticated)
Route::get('/', function () {
    return redirect('/dashboard');
})->middleware('auth:landlord');

// =========================================================================
// PROTECTED ADMIN ROUTES (Require Landlord Authentication)
// =========================================================================

Route::middleware(['auth:landlord'])->group(function () {
    // Admin Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('admin.dashboard');

    // Tenant Management
    Route::prefix('tenants')->name('admin.tenants.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Tenants/Index');
        })->name('index');

        Route::get('/create', function () {
            return Inertia::render('Admin/Tenants/Create');
        })->name('create');

        Route::get('/{tenant}', function ($tenant) {
            return Inertia::render('Admin/Tenants/Show', ['tenantId' => $tenant]);
        })->name('show');

        Route::get('/{tenant}/edit', function ($tenant) {
            return Inertia::render('Admin/Tenants/Edit', ['tenantId' => $tenant]);
        })->name('edit');
    });

    // Subscription Plans
    Route::prefix('plans')->name('admin.plans.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Plans/Index');
        })->name('index');

        Route::get('/create', function () {
            return Inertia::render('Admin/Plans/Create');
        })->name('create');
    });

    // Modules Management
    Route::prefix('modules')->name('admin.modules.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Modules/Index');
        })->name('index');
    });

    // Billing & Invoices
    Route::prefix('billing')->name('admin.billing.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Billing/Index');
        })->name('index');

        Route::get('/invoices', function () {
            return Inertia::render('Admin/Billing/Invoices');
        })->name('invoices');
    });

    // System Settings
    Route::prefix('settings')->name('admin.settings.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Settings/Index');
        })->name('index');

        Route::get('/payment-gateways', function () {
            return Inertia::render('Admin/Settings/PaymentGateways');
        })->name('payment-gateways');

        Route::get('/email', function () {
            return Inertia::render('Admin/Settings/Email');
        })->name('email');

        Route::get('/platform', [PlatformSettingController::class, 'index'])->name('platform.index');
        Route::put('/platform', [PlatformSettingController::class, 'update'])->name('platform.update');
    });

    // Analytics & Reports
    Route::prefix('analytics')->name('admin.analytics.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Analytics/Index');
        })->name('index');

        Route::get('/revenue', function () {
            return Inertia::render('Admin/Analytics/Revenue');
        })->name('revenue');

        Route::get('/usage', function () {
            return Inertia::render('Admin/Analytics/Usage');
        })->name('usage');
    });

    // Support & Tickets
    Route::prefix('support')->name('admin.support.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Support/Index');
        })->name('index');

        Route::get('/{ticket}', function ($ticket) {
            return Inertia::render('Admin/Support/Show', ['ticketId' => $ticket]);
        })->name('show');
    });
});
