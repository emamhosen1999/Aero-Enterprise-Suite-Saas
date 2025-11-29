<?php

declare(strict_types=1);

use App\Http\Controllers\Platform\RegistrationController;
use App\Http\Controllers\Platform\RegistrationPageController;
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
        Route::get('/', [RegistrationPageController::class, 'accountType'])->name('index');
        Route::get('/details', [RegistrationPageController::class, 'details'])->name('details');
        Route::get('/plan', [RegistrationPageController::class, 'plan'])->name('plan');
        Route::get('/payment', [RegistrationPageController::class, 'payment'])->name('payment');
        Route::get('/success', [RegistrationPageController::class, 'success'])->name('success');

        Route::post('/account-type', [RegistrationController::class, 'storeAccountType'])->name('account-type.store');
        Route::post('/details', [RegistrationController::class, 'storeDetails'])->name('details.store');
        Route::post('/plan', [RegistrationController::class, 'storePlan'])->name('plan.store');
        Route::post('/trial', [RegistrationController::class, 'activateTrial'])->name('trial.activate');
    });

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

    // Authentication routes for central/platform domain
    require __DIR__.'/auth.php';
});
