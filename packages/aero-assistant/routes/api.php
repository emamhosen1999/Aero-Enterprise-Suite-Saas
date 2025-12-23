<?php

use Aero\Assistant\Http\Controllers\AssistantController;
use Aero\Assistant\Http\Controllers\AssistantPageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Assistant API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded in the api middleware group.
|
*/

Route::middleware(['api', 'auth:sanctum'])->prefix('assistant')->name('assistant.api.')->group(function () {
    // Chat endpoints
    Route::post('/message', [AssistantController::class, 'sendMessage'])->name('send_message');
    Route::get('/conversations', [AssistantController::class, 'getConversations'])->name('conversations');
    Route::get('/conversations/{id}', [AssistantController::class, 'getConversation'])->name('conversation');
    Route::post('/conversations/{id}/archive', [AssistantController::class, 'archiveConversation'])->name('archive');
    Route::delete('/conversations/{id}', [AssistantController::class, 'deleteConversation'])->name('delete');

    // Admin endpoints
    Route::middleware(['can:assistant.admin'])->group(function () {
        Route::get('/stats', [AssistantPageController::class, 'stats'])->name('stats');
        Route::post('/reindex', [AssistantPageController::class, 'reindex'])->name('reindex');
    });
});
