<?php

declare(strict_types=1);

use Aero\Platform\Http\Controllers\Billing\BillingController;
use Aero\Platform\Http\Controllers\ErrorLogController;
use Aero\Platform\Http\Controllers\InstallationController;
use Aero\Platform\Http\Controllers\PlanController;
use Aero\Platform\Http\Controllers\RegistrationController;
use Aero\Platform\Http\Controllers\RegistrationPageController;
use Aero\Platform\Http\Controllers\TenantController;
use Aero\Platform\Http\Controllers\Webhooks\SslCommerzWebhookController;
use Aero\Platform\Http\Controllers\Webhooks\StripeWebhookController;
use Aero\Platform\Http\Middleware\EnsureInstallationVerified;
use Aero\Platform\Http\Middleware\IdentifyDomainContext;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Aero Platform Web Routes
|--------------------------------------------------------------------------
|
| Public platform routes for domain.com (central/platform domain):
| - Landing page & public information
| - Tenant registration flow
| - Installation wizard
| - Payment webhooks
| - Public API endpoints
|
| These routes are ONLY registered on the platform domain (domain.com).
| Admin routes are in admin.php (for admin.domain.com).
| Tenant routes are handled by aero-core and modules (for tenant.domain.com).
|
| Domain Context Check:
| - These routes should ONLY be accessible from platform root domain (domain.com)
| - Domain restriction is enforced by middleware, not at route registration time
| - Routes are registered unconditionally, then filtered by request context
|
*/

// NOTE: Domain context check moved to middleware layer!
// WRONG: Checking domain_context at route registration time - middleware hasn't run yet.
// RIGHT: Register all routes, let middleware filter by domain at request time.
// IdentifyDomainContext sets context on each request; controllers/middleware enforce domain.

Route::middleware('platform.domain')->group(function () {
    // =========================================================================
    // LANDING & ROOT ROUTES
    // =========================================================================

    Route::get('/', fn () => Inertia::render('Platform/Public/Landing'))->name('landing');

    // Redirect /login to /register (no login on platform domain - login is on tenant/admin domains)
    Route::redirect('login', '/register', 302);

// =========================================================================
// MULTI-STEP TENANT REGISTRATION FLOW
// =========================================================================
// Flow: Account → Details → Verify Email → Verify Phone → Plan → Payment/Trial → Provisioning
// Admin user setup happens on tenant domain AFTER provisioning completes

Route::prefix('register')->name('platform.register.')->group(function () {
    // Step pages (in order)
    Route::get('/', [RegistrationPageController::class, 'accountType'])->name('index');
    Route::get('/details', [RegistrationPageController::class, 'details'])->name('details');
    Route::get('/verify-email', [RegistrationPageController::class, 'verifyEmail'])->name('verify-email');
    Route::get('/verify-phone', [RegistrationPageController::class, 'verifyPhone'])->name('verify-phone');
    Route::get('/plan', [RegistrationPageController::class, 'plan'])->name('plan');
    Route::get('/payment', [RegistrationPageController::class, 'payment'])->name('payment');
    Route::get('/success', [RegistrationPageController::class, 'success'])->name('success');

    // Provisioning waiting room
    Route::get('/provisioning/{tenant}', [RegistrationPageController::class, 'provisioning'])->name('provisioning');
    Route::get('/provisioning/{tenant}/status', [RegistrationPageController::class, 'provisioningStatus'])->name('provisioning.status');
    Route::post('/provisioning/{tenant}/retry', [RegistrationController::class, 'retryProvisioning'])->name('provisioning.retry');

    // Step submissions (in order)
    Route::post('/account-type', [RegistrationController::class, 'storeAccountType'])->name('account-type.store');
    Route::post('/details', [RegistrationController::class, 'storeDetails'])->name('details.store');

    // Email and Phone Verification Routes (during registration)
    Route::post('/verify-email/send', [RegistrationController::class, 'sendEmailVerification'])
        ->middleware('throttle:10,1')
        ->name('verify-email.send');
    Route::post('/verify-email', [RegistrationController::class, 'verifyEmail'])
        ->middleware('throttle:20,1')
        ->name('verify-email.verify');
    Route::post('/verify-phone/send', [RegistrationController::class, 'sendPhoneVerification'])
        ->middleware('throttle:10,1')
        ->name('verify-phone.send');
    Route::post('/verify-phone', [RegistrationController::class, 'verifyPhone'])
        ->middleware('throttle:20,1')
        ->name('verify-phone.verify');

    // Cancel registration and cleanup pending tenant
    Route::post('/cancel', [RegistrationController::class, 'cancelRegistration'])
        ->name('cancel');
    // =========================================================================
    Route::post('/plan', [RegistrationController::class, 'storePlan'])->name('plan.store');
    Route::post('/trial', [RegistrationController::class, 'activateTrial'])
        ->middleware('throttle:10,60')
        ->name('trial.activate');
});

// =========================================================================
// PUBLIC INFORMATION PAGES
// =========================================================================

Route::get('/product', fn () => Inertia::render('Platform/Public/Product'))->name('product');
Route::get('/pricing', fn () => Inertia::render('Platform/Public/Pricing'))->name('pricing');
Route::get('/about', fn () => Inertia::render('Platform/Public/About'))->name('about');
Route::get('/resources', fn () => Inertia::render('Platform/Public/Resources'))->name('resources');
Route::get('/support', fn () => Inertia::render('Platform/Public/Support'))->name('support');
Route::get('/status', fn () => Inertia::render('Platform/Public/Status'))->name('status');
Route::get('/demo', fn () => Inertia::render('Platform/Public/Demo'))->name('demo');
Route::get('/contact', fn () => Inertia::render('Platform/Public/Contact'))->name('contact');
Route::get('/features', fn () => Inertia::render('Platform/Public/Features'))->name('features');
Route::get('/careers', fn () => Inertia::render('Platform/Public/Careers'))->name('careers');
Route::get('/blog', fn () => Inertia::render('Platform/Public/Blog'))->name('blog');
Route::get('/docs', fn () => Inertia::render('Platform/Public/Docs'))->name('docs');

// =========================================================================
// LEGAL PAGES
// =========================================================================

Route::get('/legal', fn () => Inertia::render('Platform/Public/Legal/Index'))->name('legal');
Route::get('/legal/privacy', fn () => Inertia::render('Platform/Public/Legal/Privacy'))->name('legal.privacy');
Route::get('/legal/terms', fn () => Inertia::render('Platform/Public/Legal/Terms'))->name('legal.terms');
Route::get('/legal/cookies', fn () => Inertia::render('Platform/Public/Legal/Cookies'))->name('legal.cookies');
Route::get('/legal/security', fn () => Inertia::render('Platform/Public/Legal/Security'))->name('legal.security');
Route::get('/privacy', fn () => redirect('/legal/privacy'));
Route::get('/terms', fn () => redirect('/legal/terms'));

// =========================================================================
// INSTALLATION WIZARD
// =========================================================================

$isInstalled = file_exists(storage_path('app/aeos.installed'));

// Complete route (always available - works after installation)
Route::get('/install/complete', [InstallationController::class, 'complete'])->name('installation.complete');

Route::prefix('install')->name('installation.')->group(function () use ($isInstalled) {
    if ($isInstalled) {
        // Already installed - redirect to landing
        Route::get('/', fn () => redirect()->route('landing'))->name('index');
        Route::get('/{any}', fn () => Inertia::render('Platform/Installation/AlreadyInstalled'))
            ->where('any', '^(?!complete).*$');

        return;
    }

    // Step 1: Welcome page
    Route::get('/', [InstallationController::class, 'index'])->name('index');

    // Step 2: Secret code verification
    Route::get('/secret', [InstallationController::class, 'showSecretVerification'])->name('secret');
    Route::post('/verify-secret', [InstallationController::class, 'verifySecret'])->name('verify-secret');

    // Protected installation steps (require verified secret)
    Route::middleware([EnsureInstallationVerified::class])->group(function () {
        Route::get('/requirements', [InstallationController::class, 'showRequirements'])->name('requirements');
        Route::get('/database', [InstallationController::class, 'showDatabase'])->name('database');
        Route::post('/test-server', [InstallationController::class, 'testServerConnection'])->name('test-server');
        Route::post('/create-database', [InstallationController::class, 'createDatabase'])->name('create-database');
        Route::post('/test-database', [InstallationController::class, 'testDatabase'])->name('test-database');
        Route::get('/platform', [InstallationController::class, 'showPlatform'])->name('platform');
        Route::post('/save-platform', [InstallationController::class, 'savePlatform'])->name('save-platform');
        Route::post('/test-email', [InstallationController::class, 'testEmail'])->name('test-email');
        Route::post('/test-sms', [InstallationController::class, 'testSms'])->name('test-sms');
        Route::get('/admin', [InstallationController::class, 'showAdmin'])->name('admin');
        Route::post('/save-admin', [InstallationController::class, 'saveAdmin'])->name('save-admin');
        Route::get('/review', [InstallationController::class, 'showReview'])->name('review');
        Route::post('/install', [InstallationController::class, 'install'])->name('install');
        Route::get('/progress', [InstallationController::class, 'getInstallationProgress'])->name('progress');
    });
});

// =========================================================================
// PAYMENT WEBHOOKS (outside CSRF protection - handled by service provider)
// =========================================================================

Route::post('/stripe/webhook', [StripeWebhookController::class, 'handleWebhook'])
    ->name('stripe.webhook');

Route::prefix('sslcommerz')->name('sslcommerz.')->group(function () {
    Route::post('/ipn', [SslCommerzWebhookController::class, 'ipn'])->name('ipn');
    Route::post('/success', [SslCommerzWebhookController::class, 'success'])->name('success');
    Route::post('/fail', [SslCommerzWebhookController::class, 'fail'])->name('fail');
    Route::post('/cancel', [SslCommerzWebhookController::class, 'cancel'])->name('cancel');
});

Route::post('/checkout/{plan}', [BillingController::class, 'checkout'])
    ->name('platform.checkout');

});