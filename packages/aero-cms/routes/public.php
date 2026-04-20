<?php

use Aero\Cms\Http\Controllers\PublicCmsController;
use Aero\I18n\Http\Middleware\SetLocale;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public CMS Routes
|--------------------------------------------------------------------------
|
| Routes for displaying published CMS pages publicly
|
*/

// Default routes (without locale prefix)
Route::group(['middleware' => ['web']], function () {
    // CMS Pages - Public display
    Route::get('/cms/page/{slug}', [PublicCmsController::class, 'show'])->name('cms.page.show');
    Route::get('/cms/page-id/{id}', [PublicCmsController::class, 'showById'])->name('cms.page.by-id');
    
    // CMS Category - Browse pages by category
    Route::get('/cms/category/{slug}', [PublicCmsController::class, 'category'])->name('cms.category');
    
    // CMS Search - Search pages
    Route::get('/cms/search', [PublicCmsController::class, 'search'])->name('cms.search');
    
    // SEO - Sitemap and robots
    Route::get('/sitemap.xml', [PublicCmsController::class, 'sitemap'])->name('sitemap');
    Route::get('/robots.txt', [PublicCmsController::class, 'robots'])->name('robots');
});

// Localized routes with locale prefix ({locale}/cms/...)
Route::group(['prefix' => '{locale}', 'middleware' => ['web', SetLocale::class]], function () {
    // CMS Pages - Public display (localized)
    Route::get('/cms/page/{slug}', [PublicCmsController::class, 'show'])->name('cms.page.show.localized');
    Route::get('/cms/page-id/{id}', [PublicCmsController::class, 'showById'])->name('cms.page.by-id.localized');
    
    // CMS Category - Browse pages by category (localized)
    Route::get('/cms/category/{slug}', [PublicCmsController::class, 'category'])->name('cms.category.localized');
    
    // CMS Search - Search pages (localized)
    Route::get('/cms/search', [PublicCmsController::class, 'search'])->name('cms.search.localized');
    
    // SEO - Sitemap and robots (localized)
    Route::get('/sitemap.xml', [PublicCmsController::class, 'sitemap'])->name('sitemap.localized');
    Route::get('/robots.txt', [PublicCmsController::class, 'robots'])->name('robots.localized');
});

