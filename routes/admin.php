<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| These routes are for the central admin panel at admin.platform.com
| All routes here require authentication as a super admin.
|
*/

// Public admin routes (login, password reset, etc.)
Route::middleware(['web'])->group(function () {
    Route::get('/login', function () {
        return Inertia::render('Admin/Auth/Login');
    })->name('admin.login');
});

// Protected admin routes
Route::middleware(['web', 'auth'])->group(function () {
    // Admin Dashboard
    Route::get('/', function () {
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
