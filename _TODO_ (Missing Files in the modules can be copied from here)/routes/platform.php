<?php

use Aero\Platform\Http\Controllers\RegistrationController;
use Aero\Platform\Http\Controllers\RegistrationPageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Platform Routes (aero-enterprise-suite-saas.com)
|--------------------------------------------------------------------------
|
| Public landing page and tenant registration flow.
| NO login here - users login on admin.platform.com or tenant.platform.com
|
*/

// Landing page
Route::get('/', fn () => Inertia::render('Public/Landing'))->name('landing');

// Redirect /login to /register (no login on platform domain)
Route::redirect('login', '/register', 302);

// Multi-step Tenant Registration Flow
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
    Route::delete('/cancel', [RegistrationController::class, 'cancelRegistration'])
        ->name('cancel');

    Route::post('/plan', [RegistrationController::class, 'storePlan'])->name('plan.store');
    Route::post('/trial', [RegistrationController::class, 'activateTrial'])
        ->middleware('throttle:10,60') // 10 registration attempts per hour per IP
        ->name('trial.activate');
});

// Public info pages (navigation)
Route::get('/product', fn () => Inertia::render('Public/Product'))->name('product');
Route::get('/pricing', fn () => Inertia::render('Public/Pricing'))->name('pricing');
Route::get('/about', fn () => Inertia::render('Public/About'))->name('about');
Route::get('/resources', fn () => Inertia::render('Public/Resources'))->name('resources');
Route::get('/support', fn () => Inertia::render('Public/Support'))->name('support');
Route::get('/demo', fn () => Inertia::render('Public/Demo'))->name('demo');
Route::get('/contact', fn () => Inertia::render('Public/Contact'))->name('contact');
Route::get('/features', fn () => Inertia::render('Public/Features'))->name('features');
Route::get('/careers', fn () => Inertia::render('Public/Careers'))->name('careers');
Route::get('/blog', fn () => Inertia::render('Public/Blog'))->name('blog');
Route::get('/docs', fn () => Inertia::render('Public/Docs'))->name('docs');

// Legal pages
Route::get('/legal', fn () => Inertia::render('Public/Legal/Index'))->name('legal');
Route::get('/legal/privacy', fn () => Inertia::render('Public/Legal/Privacy'))->name('legal.privacy');
Route::get('/legal/terms', fn () => Inertia::render('Public/Legal/Terms'))->name('legal.terms');
Route::get('/legal/cookies', fn () => Inertia::render('Public/Legal/Cookies'))->name('legal.cookies');
Route::get('/legal/security', fn () => Inertia::render('Public/Legal/Security'))->name('legal.security');
Route::get('/privacy', fn () => redirect('/legal/privacy'));
Route::get('/terms', fn () => redirect('/legal/terms'));

// Stripe Webhook (must be outside any auth middleware)
Route::post('/stripe/webhook', [\Aero\Platform\Http\Controllers\Webhooks\StripeWebhookController::class, 'handleWebhook'])
    ->name('stripe.webhook');

// SSLCOMMERZ Payment Gateway Routes (IPN callbacks - must be outside CSRF protection)
Route::prefix('sslcommerz')->name('sslcommerz.')->group(function () {
    // IPN (Instant Payment Notification) - server-to-server callback
    Route::post('/ipn', [\App\Http\Controllers\Webhooks\SslCommerzWebhookController::class, 'ipn'])
        ->name('ipn');

    // Customer redirect callbacks
    Route::post('/success', [\App\Http\Controllers\Webhooks\SslCommerzWebhookController::class, 'success'])
        ->name('success');
    Route::post('/fail', [\App\Http\Controllers\Webhooks\SslCommerzWebhookController::class, 'fail'])
        ->name('fail');
    Route::post('/cancel', [\App\Http\Controllers\Webhooks\SslCommerzWebhookController::class, 'cancel'])
        ->name('cancel');
});

// Checkout routes (called from registration flow)
Route::post('/checkout/{plan}', [\Aero\Platform\Http\Controllers\Billing\BillingController::class, 'checkout'])
    ->name('platform.checkout');
