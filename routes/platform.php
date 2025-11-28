<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Platform Routes
|--------------------------------------------------------------------------
|
| These routes are for the public platform at platform.com
| This includes the landing page, registration, and subscription flows.
|
*/

Route::middleware(['web'])->group(function () {
    // Public Landing Page
    Route::get('/', function () {
        return Inertia::render('Public/Landing');
    })->name('platform.landing');

    // Features & Info Pages
    Route::get('/product', function () {
        return Inertia::render('Public/Product');
    })->name('platform.product');

    Route::redirect('/features', '/product')->name('platform.features');
    Route::redirect('/modules', '/product')->name('platform.modules');

    Route::get('/pricing', function () {
        return Inertia::render('Public/Pricing');
    })->name('platform.pricing');

    Route::get('/about', function () {
        return Inertia::render('Public/About');
    })->name('platform.about');

    Route::get('/resources', function () {
        return Inertia::render('Public/Resources');
    })->name('platform.resources');

    Route::get('/support', function () {
        return Inertia::render('Public/Support');
    })->name('platform.support');

    Route::get('/demo', function () {
        return Inertia::render('Public/Demo');
    })->name('platform.demo');

    Route::get('/contact', function () {
        return Inertia::render('Public/Contact');
    })->name('platform.contact');

    // Legal Center
    Route::get('/legal', function () {
        return Inertia::render('Public/Legal/Index');
    })->name('platform.legal');

    Route::get('/terms', function () {
        return Inertia::render('Public/Legal/Terms');
    })->name('platform.terms');

    Route::get('/privacy', function () {
        return Inertia::render('Public/Legal/Privacy');
    })->name('platform.privacy');

    Route::get('/legal/security', function () {
        return Inertia::render('Public/Legal/Security');
    })->name('platform.legal.security');

    Route::get('/legal/cookies', function () {
        return Inertia::render('Public/Legal/Cookies');
    })->name('platform.legal.cookies');

    // Registration Flow
    Route::prefix('register')->name('platform.register.')->group(function () {
        // Step 1: Choose account type (company/individual)
        Route::get('/', function () {
            return Inertia::render('Public/Register/AccountType');
        })->name('index');

        // Step 2: Company/Individual information
        Route::get('/details', function () {
            return Inertia::render('Public/Register/Details');
        })->name('details');

        // Step 3: Select modules and plan
        Route::get('/plan', function () {
            return Inertia::render('Public/Register/SelectPlan');
        })->name('plan');

        // Step 4: Payment (or start trial)
        Route::get('/payment', function () {
            return Inertia::render('Public/Register/Payment');
        })->name('payment');

        // Step 5: Success/Confirmation
        Route::get('/success', function () {
            return Inertia::render('Public/Register/Success');
        })->name('success');
    });

    // Subscription Login (for existing tenants to manage billing from central platform)
    Route::get('/login', function () {
        return Inertia::render('Public/Login');
    })->name('platform.login');

    // Tenant Billing Portal (authenticated)
    Route::middleware(['auth'])->prefix('billing')->name('platform.billing.')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Public/Billing/Index');
        })->name('index');

        Route::get('/invoices', function () {
            return Inertia::render('Public/Billing/Invoices');
        })->name('invoices');

        Route::get('/subscription', function () {
            return Inertia::render('Public/Billing/Subscription');
        })->name('subscription');

        Route::get('/modules', function () {
            return Inertia::render('Public/Billing/Modules');
        })->name('modules');
    });

    // Webhook endpoints for payment gateways
    Route::prefix('webhooks')->name('platform.webhooks.')->group(function () {
        Route::post('/stripe', [App\Http\Controllers\Platform\WebhookController::class, 'stripe'])
            ->name('stripe')
            ->withoutMiddleware(['web']);

        Route::post('/paypal', [App\Http\Controllers\Platform\WebhookController::class, 'paypal'])
            ->name('paypal')
            ->withoutMiddleware(['web']);

        Route::post('/sslcommerz', [App\Http\Controllers\Platform\WebhookController::class, 'sslcommerz'])
            ->name('sslcommerz')
            ->withoutMiddleware(['web']);
    });
});
