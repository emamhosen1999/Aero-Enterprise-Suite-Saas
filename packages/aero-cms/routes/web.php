<?php

declare(strict_types=1);

use Aero\Cms\Http\Controllers\PublicPageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CMS Public Routes
|--------------------------------------------------------------------------
|
| These routes render CMS-managed pages on the platform domain.
|
| DOMAIN SCOPE:
| - These routes ONLY apply to the platform domain (e.g., aeos365.test)
| - They do NOT apply to admin subdomain (admin.aeos365.test)
| - They do NOT apply to tenant subdomains (tenant1.aeos365.test)
| - Domain filtering is enforced by 'platform.domain' middleware in CmsServiceProvider
|
| ROUTE FALLBACK:
| - Uses Route::fallback() instead of catch-all /{slug?}
| - This ensures ALL other routes are checked FIRST before CMS
| - Functional routes (registration, auth, webhooks) always take priority
| - Only requests that don't match ANY route reach the CMS
|
| CMS PAGES:
| - Managed at: admin.domain.com/admin/cms
| - Supports: Landing, Pricing, About, Features, Blog, Legal, etc.
| - Uses visual page builder with block components
|
*/

// Fallback route for CMS pages
// IMPORTANT: Route::fallback() only triggers when NO other route matches.
// This is the correct Laravel pattern for "catch-all" functionality.
// The slug is extracted from the request path in the controller.
Route::fallback([PublicPageController::class, 'show'])
    ->name('cms.page');
