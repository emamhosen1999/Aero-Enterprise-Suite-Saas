<?php

declare(strict_types=1);

use Aero\Cms\Http\Controllers\Api\PageBuilderController;
use Aero\Cms\Http\Controllers\Api\CmsBlockTypeController;
use Aero\Cms\Http\Controllers\Api\CmsBlockPublishingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CMS API Routes
|--------------------------------------------------------------------------
|
| API routes for the page builder (autosave, etc.)
|
*/

Route::middleware(['auth:landlord', 'verified'])->name('api.')->group(function () {

    // Page builder API
    Route::prefix('builder')->name('builder.')->group(function () {
        // Autosave page content
        Route::post('/pages/{page}/autosave', [PageBuilderController::class, 'autosave'])
            ->middleware('hrmac:cms.pages.editor.edit')
            ->name('autosave');

        // Upload inline image
        Route::post('/upload-image', [PageBuilderController::class, 'uploadImage'])
            ->middleware('hrmac:cms.media.browser.upload')
            ->name('upload-image');

        // Get block defaults
        Route::get('/blocks/{type}/defaults', [PageBuilderController::class, 'blockDefaults'])
            ->middleware('hrmac:cms.blocks.library.view')
            ->name('block-defaults');

        // Validate block content
        Route::post('/blocks/{type}/validate', [PageBuilderController::class, 'validateBlock'])
            ->middleware('hrmac:cms.blocks.library.view')
            ->name('validate-block');
    });

    // Block types API
    Route::prefix('block-types')->name('block-types.')->group(function () {
        // Get all block types grouped by category
        Route::get('/', [CmsBlockTypeController::class, 'index'])
            ->middleware('hrmac:cms.blocks.library.view')
            ->name('index');

        // Get advanced block types only
        Route::get('/advanced', [CmsBlockTypeController::class, 'advanced'])
            ->middleware('hrmac:cms.blocks.library.view')
            ->name('advanced');

        // Get single block type by slug
        Route::get('/{slug}', [CmsBlockTypeController::class, 'show'])
            ->middleware('hrmac:cms.blocks.library.view')
            ->name('show');

        // Get schema for block type (for form generation)
        Route::get('/{slug}/schema', [CmsBlockTypeController::class, 'schema'])
            ->middleware('hrmac:cms.blocks.library.view')
            ->name('schema');

        // Create new block type (admin only)
        Route::post('/', [CmsBlockTypeController::class, 'store'])
            ->middleware('hrmac:cms.blocks.library.create')
            ->name('store');

        // Update block type (admin only)
        Route::put('/{slug}', [CmsBlockTypeController::class, 'update'])
            ->middleware('hrmac:cms.blocks.library.edit')
            ->name('update');

        // Delete block type (admin only)
        Route::delete('/{slug}', [CmsBlockTypeController::class, 'destroy'])
            ->middleware('hrmac:cms.blocks.library.delete')
            ->name('destroy');
    });

    // Block publishing & versioning API
    Route::prefix('blocks')->name('blocks.')->group(function () {
        // Get publishing status
        Route::get('/{block}/publishing', [CmsBlockPublishingController::class, 'show'])
            ->middleware('hrmac:cms.blocks.publishing.view')
            ->name('publishing.show');

        // Publish block immediately
        Route::post('/{block}/publish', [CmsBlockPublishingController::class, 'publish'])
            ->middleware('hrmac:cms.blocks.publishing.publish')
            ->name('publish');

        // Schedule block for future publication
        Route::post('/{block}/schedule', [CmsBlockPublishingController::class, 'schedule'])
            ->middleware('hrmac:cms.blocks.publishing.schedule')
            ->name('schedule');

        // Archive (unpublish) block
        Route::post('/{block}/archive', [CmsBlockPublishingController::class, 'archive'])
            ->middleware('hrmac:cms.blocks.publishing.archive')
            ->name('archive');

        // Restore archived block
        Route::post('/{block}/restore', [CmsBlockPublishingController::class, 'restore'])
            ->middleware('hrmac:cms.blocks.publishing.restore')
            ->name('restore');

        // Get version history
        Route::get('/{block}/versions', [CmsBlockPublishingController::class, 'getVersions'])
            ->middleware('hrmac:cms.blocks.publishing.versions.view')
            ->name('versions');

        // Get revision history
        Route::get('/{block}/revisions', [CmsBlockPublishingController::class, 'getRevisions'])
            ->middleware('hrmac:cms.blocks.publishing.revisions.view')
            ->name('revisions');

        // Compare two versions
        Route::post('/{block}/compare-versions', [CmsBlockPublishingController::class, 'compareVersions'])
            ->middleware('hrmac:cms.blocks.publishing.versions.view')
            ->name('compare-versions');

        // Revert to previous version
        Route::post('/{block}/revert-version', [CmsBlockPublishingController::class, 'revertVersion'])
            ->middleware('hrmac:cms.blocks.publishing.revert')
            ->name('revert-version');
    });
});
