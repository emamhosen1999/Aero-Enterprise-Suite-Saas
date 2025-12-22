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
