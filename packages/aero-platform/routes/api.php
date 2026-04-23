<?php

declare(strict_types=1);

use Aero\Platform\Http\Controllers\Api\ProductCatalogController;
use Aero\Platform\Http\Controllers\Api\RegistrationIdentityController;
use Aero\Platform\Http\Controllers\Api\ResumeRegistrationController;
use Aero\Platform\Http\Controllers\ErrorLogController;
use Aero\Platform\Http\Controllers\PlanController;
use Aero\Platform\Http\Controllers\Public\MarketingEventController;
use Aero\Platform\Http\Controllers\Public\SocialAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Platform API Routes
|--------------------------------------------------------------------------
|
| Public API endpoints for the platform (aeos365.com/api/*)
| These endpoints are accessible without authentication and expose
| platform information like available products/features.
|
| Technical "module" terminology is hidden from users.
| Use "products" and "features" instead.
|
*/

// =========================================================================
// PRODUCT CATALOG API (Public)
// =========================================================================

Route::prefix('products')->name('api.products.')->group(function () {
    // Get all available products
    // GET /api/products
    // Query params: ?category=operations|finance|sales|specialized&popular=true
    Route::get('/', [ProductCatalogController::class, 'index'])->name('index');

    // Get featured/popular products
    // GET /api/products/featured
    Route::get('/featured', [ProductCatalogController::class, 'featured'])->name('featured');

    // Get a specific product by code
    // GET /api/products/{code}
    Route::get('/{code}', [ProductCatalogController::class, 'show'])->name('show');
});

// =========================================================================
// PLATFORM PUBLIC API (no auth, no CSRF)
// =========================================================================

Route::prefix('platform/v1')->name('api.platform.v1.')->group(function () {
    // Error Reporting API - receives errors from standalone installations
    Route::post('/error-logs', [ErrorLogController::class, 'receiveRemoteError'])
        ->name('error-logs.receive')
        ->middleware('throttle:60,1');

    // Platform health check
    Route::get('/health', fn () => response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]))->name('health');

    // Public plans list (for registration page)
    Route::get('/plans', [PlanController::class, 'publicIndex'])
        ->name('plans.public');

    // Social auth provider discovery (registration/login UI)
    Route::get('/social/providers', [SocialAuthController::class, 'providers'])
        ->name('social.providers');

    // Public marketing CTA event ingestion
    Route::post('/marketing-events', [MarketingEventController::class, 'store'])
        ->middleware('throttle:120,1')
        ->name('marketing-events.store');

    // Legacy subdomain availability endpoint (kept for backward compatibility)
    Route::post('/check-subdomain', [RegistrationIdentityController::class, 'checkSubdomain'])
        ->middleware('throttle:30,1')
        ->name('check-subdomain');

    // Registration identity checks
    Route::prefix('registration')->name('registration.')->group(function () {
        Route::post('check-subdomain', [RegistrationIdentityController::class, 'checkSubdomain'])
            ->middleware('throttle:30,1')
            ->name('check-subdomain');

        Route::post('check-email', [RegistrationIdentityController::class, 'checkEmail'])
            ->middleware('throttle:30,1')
            ->name('check-email');
    });

    // Resume Registration API - save progress and send magic link
    Route::post('/registration/save-progress', [ResumeRegistrationController::class, 'saveProgress'])
        ->middleware('throttle:5,1')
        ->name('registration.save-progress');
});
