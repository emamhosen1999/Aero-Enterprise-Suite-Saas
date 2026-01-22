<?php

declare(strict_types=1);

use Aero\Cms\Http\Controllers\Admin\PageController;
use Aero\Cms\Http\Controllers\Admin\BlockController;
use Aero\Cms\Http\Controllers\Admin\MediaController;
use Aero\Cms\Http\Controllers\Admin\TemplateController;
use Aero\Cms\Http\Controllers\Admin\SettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CMS Admin Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the CmsServiceProvider within a route group
| with 'admin' prefix and 'landlord' auth middleware.
|
| Route name prefix: admin.cms.*
| HRMAC module: cms
|
*/

Route::middleware(['auth:landlord', 'verified'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Pages Management
    |--------------------------------------------------------------------------
    */
    Route::prefix('pages')->name('pages.')->group(function () {
        // List pages - requires cms.pages.list.index
        Route::get('/', [PageController::class, 'index'])
            ->middleware('hrmac:cms.pages.list.index')
            ->name('index');

        // Create page form - requires cms.pages.list.create
        Route::get('/create', [PageController::class, 'create'])
            ->middleware('hrmac:cms.pages.list.create')
            ->name('create');

        // Store new page - requires cms.pages.list.create
        Route::post('/', [PageController::class, 'store'])
            ->middleware('hrmac:cms.pages.list.create')
            ->name('store');

        // Edit page (page builder) - requires cms.pages.editor.edit
        Route::get('/{page}/edit', [PageController::class, 'edit'])
            ->middleware('hrmac:cms.pages.editor.edit')
            ->name('edit');

        // Update page - requires cms.pages.editor.edit
        Route::put('/{page}', [PageController::class, 'update'])
            ->middleware('hrmac:cms.pages.editor.edit')
            ->name('update');

        // Delete page - requires cms.pages.list.delete
        Route::delete('/{page}', [PageController::class, 'destroy'])
            ->middleware('hrmac:cms.pages.list.delete')
            ->name('destroy');

        // Duplicate page - requires cms.pages.list.duplicate
        Route::post('/{page}/duplicate', [PageController::class, 'duplicate'])
            ->middleware('hrmac:cms.pages.list.duplicate')
            ->name('duplicate');

        // Publish page - requires cms.pages.editor.publish
        Route::post('/{page}/publish', [PageController::class, 'publish'])
            ->middleware('hrmac:cms.pages.editor.publish')
            ->name('publish');

        // Unpublish page - requires cms.pages.editor.publish
        Route::post('/{page}/unpublish', [PageController::class, 'unpublish'])
            ->middleware('hrmac:cms.pages.editor.publish')
            ->name('unpublish');

        // Versions
        Route::prefix('{page}/versions')->name('versions.')->middleware('hrmac:cms.pages.versions.view')->group(function () {
            Route::get('/', [PageController::class, 'versions'])->name('index');
            Route::get('/{version}', [PageController::class, 'showVersion'])->name('show');
            Route::post('/{version}/restore', [PageController::class, 'restoreVersion'])
                ->middleware('hrmac:cms.pages.versions.restore')
                ->name('restore');
        });

        // Preview page
        Route::get('/{page}/preview', [PageController::class, 'preview'])
            ->middleware('hrmac:cms.pages.editor.preview')
            ->name('preview');
    });

    /*
    |--------------------------------------------------------------------------
    | Blocks API (for page builder)
    |--------------------------------------------------------------------------
    */
    Route::prefix('blocks')->name('blocks.')->group(function () {
        // Get available block types
        Route::get('/types', [BlockController::class, 'types'])
            ->middleware('hrmac:cms.blocks.library.view')
            ->name('types');

        // Get block schema
        Route::get('/schema/{type}', [BlockController::class, 'schema'])
            ->middleware('hrmac:cms.blocks.library.view')
            ->name('schema');

        // Page blocks management
        Route::prefix('page/{page}')->group(function () {
            // Get all blocks for a page
            Route::get('/', [BlockController::class, 'index'])
                ->middleware('hrmac:cms.pages.editor.edit')
                ->name('index');

            // Add block to page
            Route::post('/', [BlockController::class, 'store'])
                ->middleware('hrmac:cms.blocks.library.insert')
                ->name('store');

            // Update block
            Route::put('/{block}', [BlockController::class, 'update'])
                ->middleware('hrmac:cms.blocks.library.edit')
                ->name('update');

            // Delete block
            Route::delete('/{block}', [BlockController::class, 'destroy'])
                ->middleware('hrmac:cms.blocks.library.delete')
                ->name('destroy');

            // Reorder blocks
            Route::post('/reorder', [BlockController::class, 'reorder'])
                ->middleware('hrmac:cms.blocks.library.edit')
                ->name('reorder');

            // Duplicate block
            Route::post('/{block}/duplicate', [BlockController::class, 'duplicate'])
                ->middleware('hrmac:cms.blocks.library.insert')
                ->name('duplicate');
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Media Library
    |--------------------------------------------------------------------------
    */
    Route::prefix('media')->name('media.')->group(function () {
        // Browse media
        Route::get('/', [MediaController::class, 'index'])
            ->middleware('hrmac:cms.media.browser.view')
            ->name('index');

        // Upload media
        Route::post('/upload', [MediaController::class, 'upload'])
            ->middleware('hrmac:cms.media.browser.upload')
            ->name('upload');

        // Update media metadata
        Route::put('/{media}', [MediaController::class, 'update'])
            ->middleware('hrmac:cms.media.browser.edit')
            ->name('update');

        // Delete media
        Route::delete('/{media}', [MediaController::class, 'destroy'])
            ->middleware('hrmac:cms.media.browser.delete')
            ->name('destroy');

        // Folder management
        Route::prefix('folders')->name('folders.')->middleware('hrmac:cms.media.folders.manage')->group(function () {
            Route::get('/', [MediaController::class, 'folders'])->name('index');
            Route::post('/', [MediaController::class, 'createFolder'])->name('store');
            Route::delete('/{folder}', [MediaController::class, 'deleteFolder'])->name('destroy');
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Block Templates
    |--------------------------------------------------------------------------
    */
    Route::prefix('templates')->name('templates.')->group(function () {
        // List templates
        Route::get('/', [TemplateController::class, 'index'])
            ->middleware('hrmac:cms.templates.global.view')
            ->name('index');

        // Create template
        Route::post('/', [TemplateController::class, 'store'])
            ->middleware('hrmac:cms.templates.global.create')
            ->name('store');

        // Update template
        Route::put('/{template}', [TemplateController::class, 'update'])
            ->middleware('hrmac:cms.templates.global.edit')
            ->name('update');

        // Delete template
        Route::delete('/{template}', [TemplateController::class, 'destroy'])
            ->middleware('hrmac:cms.templates.global.delete')
            ->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | CMS Settings
    |--------------------------------------------------------------------------
    */
    Route::prefix('settings')->name('settings.')->middleware('hrmac:cms.settings.general.view')->group(function () {
        // View settings
        Route::get('/', [SettingsController::class, 'index'])->name('index');

        // Update settings
        Route::put('/', [SettingsController::class, 'update'])
            ->middleware('hrmac:cms.settings.general.update')
            ->name('update');

        // SEO settings
        Route::get('/seo', [SettingsController::class, 'seo'])
            ->middleware('hrmac:cms.settings.seo.view')
            ->name('seo');

        Route::put('/seo', [SettingsController::class, 'updateSeo'])
            ->middleware('hrmac:cms.settings.seo.update')
            ->name('seo.update');

        // Cache management
        Route::post('/cache/clear', [SettingsController::class, 'clearCache'])
            ->middleware('hrmac:cms.settings.cache.clear')
            ->name('cache.clear');
    });
});
