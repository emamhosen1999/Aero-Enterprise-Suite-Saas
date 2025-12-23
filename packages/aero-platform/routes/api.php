<?php

declare(strict_types=1);

use Aero\Platform\Http\Controllers\Api\ProductCatalogController;
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
    Route::post('/error-logs', [\Aero\Platform\Http\Controllers\ErrorLogController::class, 'receiveRemoteError'])
        ->name('error-logs.receive')
        ->middleware('throttle:60,1');

    // Platform health check
    Route::get('/health', fn () => response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]))->name('health');

    // Public plans list (for registration page)
    Route::get('/plans', [\Aero\Platform\Http\Controllers\PlanController::class, 'publicIndex'])
        ->name('plans.public');

    // Check subdomain availability (registration flow)
    Route::post('/check-subdomain', [\Aero\Platform\Http\Controllers\TenantController::class, 'checkSubdomain'])
        ->middleware('throttle:30,1')
        ->name('check-subdomain');
});
