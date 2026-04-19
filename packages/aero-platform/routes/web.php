<?php

declare(strict_types=1);

use Aero\Platform\Http\Controllers\Billing\BillingController;
use Aero\Platform\Http\Controllers\RegistrationController;
use Aero\Platform\Http\Controllers\RegistrationPageController;
use Aero\Platform\Http\Controllers\Webhooks\SslCommerzWebhookController;
use Aero\Platform\Http\Controllers\Webhooks\StripeWebhookController;
use Aero\Platform\Http\Middleware\IdentifyDomainContext;
use Illuminate\Support\Facades\Route;

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
    // STATIC LANDING PAGES
    // =========================================================================
    // All pages are static Inertia pages - no CMS or dynamic content management
    
    Route::get('/', function () {
        return \Inertia\Inertia::render('Platform/Public/Landing', [
            'title' => 'Home',
        ]);
    })->name('platform.home');
    
    Route::get('/pricing', function () {
        return \Inertia\Inertia::render('Platform/Public/Pricing', [
            'title' => 'Pricing',
        ]);
    })->name('platform.pricing');
    
    Route::get('/features', function () {
        return \Inertia\Inertia::render('Platform/Public/Features', [
            'title' => 'Features',
        ]);
    })->name('platform.features');

    Route::get('/standalone', function () {
        return \Inertia\Inertia::render('Platform/Public/Standalone', [
            'title' => 'Standalone / On-Premise',
        ]);
    })->name('platform.standalone');
    
    Route::get('/about', function () {
        return \Inertia\Inertia::render('Platform/Public/About', [
            'title' => 'About',
        ]);
    })->name('platform.about');
    
    Route::get('/support', function () {
        return \Inertia\Inertia::render('Platform/Public/Support', [
            'title' => 'Support',
        ]);
    })->name('platform.support');
    
    Route::get('/resources', function () {
        return \Inertia\Inertia::render('Platform/Public/Resources', [
            'title' => 'Resources',
        ]);
    })->name('platform.resources');
    
    Route::get('/status', function () {
        return \Inertia\Inertia::render('Platform/Public/Status', [
            'title' => 'Status',
        ]);
    })->name('platform.status');

    // Redirect /login to /signup (no login on platform domain - login is on tenant/admin domains)
    Route::redirect('login', '/signup', 302);

    // =========================================================================
    // MULTI-STEP TENANT REGISTRATION FLOW
    // =========================================================================
    // Flow: Account → Details → Verify Email → Verify Phone → Plan → Payment/Trial → Provisioning
    // Admin user setup happens on tenant domain AFTER provisioning completes

    Route::prefix('signup')->name('platform.register.')->group(function () {
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

        // Resume registration from magic link
        Route::get('/resume/{token}', [\Aero\Platform\Http\Controllers\Api\ResumeRegistrationController::class, 'resume'])
            ->middleware('throttle:10,1')
            ->name('resume');
    });

    // =========================================================================
    // INSTALLATION WIZARD
    // =========================================================================
    // NOTE: Installation routes are now defined in routes/installation.php
    // and use the unified UnifiedInstallationController from aero-core.
    // This provides a consistent UI between SaaS and Standalone modes.
    // See: packages/aero-platform/routes/installation.php

    // =========================================================================
    // STATIC LEGAL PAGES
    // =========================================================================
    Route::get('/legal/privacy', function () {
        return \Inertia\Inertia::render('Platform/Public/Legal/Privacy', [
            'title' => 'Privacy Policy',
        ]);
    })->name('platform.legal.privacy');

    Route::get('/legal/terms', function () {
        return \Inertia\Inertia::render('Platform/Public/Legal/Terms', [
            'title' => 'Terms of Service',
        ]);
    })->name('platform.legal.terms');

    Route::get('/legal/cookies', function () {
        return \Inertia\Inertia::render('Platform/Public/Legal/Cookies', [
            'title' => 'Cookie Policy',
        ]);
    })->name('platform.legal.cookies');

    // =========================================================================
    // STATIC CONTENT PAGES
    // =========================================================================
    Route::get('/contact', function () {
        return \Inertia\Inertia::render('Platform/Public/Contact', [
            'title' => 'Contact Us',
        ]);
    })->name('platform.contact');

    Route::get('/demo', function () {
        return \Inertia\Inertia::render('Platform/Public/Demo', [
            'title' => 'Demo',
        ]);
    })->name('platform.demo');

    Route::get('/blog', function () {
        return \Inertia\Inertia::render('Platform/Public/Blog', [
            'title' => 'Blog',
        ]);
    })->name('platform.blog');

    Route::get('/docs', function () {
        return \Inertia\Inertia::render('Platform/Public/Docs', [
            'title' => 'Documentation',
        ]);
    })->name('platform.docs');

    Route::get('/careers', function () {
        return \Inertia\Inertia::render('Platform/Public/Careers', [
            'title' => 'Careers',
        ]);
    })->name('platform.careers');

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

    Route::prefix('api')->middleware('api')->group(function () {
        require __DIR__.'/api.php';
    });

});
