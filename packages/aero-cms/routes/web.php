<?php

declare(strict_types=1);

use Aero\Cms\Http\Controllers\PublicPageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CMS Public Routes
|--------------------------------------------------------------------------
|
| These routes are for serving CMS pages to the public.
|
*/

// Catch-all route for CMS pages - should be registered LAST in the application
// to allow other routes to take precedence
Route::get('/{slug?}', [PublicPageController::class, 'show'])
    ->where('slug', '.*')
    ->name('cms.page');
