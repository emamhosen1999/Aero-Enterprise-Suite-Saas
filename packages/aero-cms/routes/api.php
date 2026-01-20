<?php

declare(strict_types=1);

use Aero\Cms\Http\Controllers\Api\PageBuilderController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CMS API Routes
|--------------------------------------------------------------------------
|
| API routes for the page builder (autosave, etc.)
|
*/

Route::middleware(['auth:landlord', 'verified'])->prefix('cms')->name('cms.api.')->group(function () {

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
});
