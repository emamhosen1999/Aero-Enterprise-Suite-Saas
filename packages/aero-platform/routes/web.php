<?php

declare(strict_types=1);

use Aero\Platform\Http\Controllers\Billing\BillingController;
use Aero\Platform\Http\Controllers\RegistrationController;
use Aero\Platform\Http\Controllers\RegistrationPageController;
use Aero\Platform\Http\Controllers\Webhooks\SslCommerzWebhookController;
use Aero\Platform\Http\Controllers\Webhooks\StripeWebhookController;
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
        Route::post('/provisioning/{tenant}/retry', [RegistrationController::class, 'retryProvisioning'])
            ->middleware('throttle:3,10')  // 3 retries per 10 minutes
            ->name('provisioning.retry');

        // Step submissions (in order) - rate limited to prevent abuse
        Route::post('/account-type', [RegistrationController::class, 'storeAccountType'])
            ->middleware('throttle:30,1')  // 30 requests per minute
            ->name('account-type.store');
        Route::post('/details', [RegistrationController::class, 'storeDetails'])
            ->middleware('throttle:20,1')  // 20 requests per minute
            ->name('details.store');

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
            ->middleware('throttle:10,1')  // 10 requests per minute
            ->name('cancel');
        // =========================================================================
        Route::post('/plan', [RegistrationController::class, 'storePlan'])
            ->middleware('throttle:20,1')  // 20 requests per minute
            ->name('plan.store');
        Route::post('/trial', [RegistrationController::class, 'activateTrial'])
            ->middleware('throttle:5,60')  // 5 trial activations per hour (stricter)
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
    // NOTE: Installation routes are now defined in routes/installation.php
    // and use the unified UnifiedInstallationController from aero-core.
    // This provides a consistent UI between SaaS and Standalone modes.
    // See: packages/aero-platform/routes/installation.php

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

    // =========================================================================
    // NEWSLETTER SUBSCRIPTION (Public)
    // =========================================================================
    Route::prefix('newsletter')->name('newsletter.')->group(function () {
        Route::post('/subscribe', [\Aero\Platform\Http\Controllers\Public\NewsletterController::class, 'subscribe'])
            ->middleware('throttle:10,1')
            ->name('subscribe');
        Route::get('/confirm/{token}', [\Aero\Platform\Http\Controllers\Public\NewsletterController::class, 'confirm'])
            ->name('confirm');
        Route::get('/unsubscribe/{token}', [\Aero\Platform\Http\Controllers\Public\NewsletterController::class, 'unsubscribe'])
            ->name('unsubscribe');
        Route::post('/unsubscribe/{token}', [\Aero\Platform\Http\Controllers\Public\NewsletterController::class, 'processUnsubscribe'])
            ->name('unsubscribe.process');
    });

    // =========================================================================
    // AFFILIATE PROGRAM (Public)
    // =========================================================================
    Route::get('/ref/{code}', [\Aero\Platform\Http\Controllers\Public\AffiliateController::class, 'trackReferral'])
        ->name('affiliate.referral');
    Route::get('/affiliates', [\Aero\Platform\Http\Controllers\Public\AffiliateController::class, 'landing'])
        ->name('affiliate.landing');
    Route::get('/affiliates/apply', [\Aero\Platform\Http\Controllers\Public\AffiliateController::class, 'showApplication'])
        ->name('affiliate.apply');
    Route::post('/affiliates/apply', [\Aero\Platform\Http\Controllers\Public\AffiliateController::class, 'submitApplication'])
        ->middleware('throttle:5,60')
        ->name('affiliate.apply.submit');

    // =========================================================================
    // SOCIAL AUTHENTICATION (Public OAuth Flow)
    // =========================================================================
    Route::prefix('auth')->name('social.')->group(function () {
        Route::get('/{provider}', [\Aero\Platform\Http\Controllers\Public\SocialAuthController::class, 'redirect'])
            ->name('redirect');
        Route::get('/{provider}/callback', [\Aero\Platform\Http\Controllers\Public\SocialAuthController::class, 'callback'])
            ->name('callback');
    });

    // =========================================================================
    // LEAD CAPTURE FORMS (Public)
    // =========================================================================
    Route::prefix('leads')->name('leads.')->middleware('throttle:10,1')->group(function () {
        Route::post('/contact', [\Aero\Platform\Http\Controllers\Public\LeadController::class, 'contact'])
            ->name('contact');
        Route::post('/demo', [\Aero\Platform\Http\Controllers\Public\LeadController::class, 'demoRequest'])
            ->name('demo');
        Route::post('/pricing', [\Aero\Platform\Http\Controllers\Public\LeadController::class, 'pricingInquiry'])
            ->name('pricing');
        Route::post('/capture', [\Aero\Platform\Http\Controllers\Public\LeadController::class, 'genericCapture'])
            ->name('capture');
    });

});
