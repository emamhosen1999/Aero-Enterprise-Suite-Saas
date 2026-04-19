<?php

use Aero\Assistant\Http\Controllers\AssistantController;
use Aero\Assistant\Http\Controllers\AssistantPageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Assistant Tenant Routes
|--------------------------------------------------------------------------
|
| These routes are tenant-scoped for SaaS mode.
|
*/

Route::middleware(['web', 'auth', 'hrmac:assistant'])->prefix('assistant')->name('assistant.')->group(function () {
    // Main assistant page
    Route::get('/', [AssistantPageController::class, 'index'])->name('index');

    // API endpoints (accessible via web middleware for tenant-scoped requests)
    Route::post('/message', [AssistantController::class, 'sendMessage'])->name('send_message');
    Route::get('/conversations', [AssistantController::class, 'getConversations'])->name('conversations');
    Route::get('/conversations/{id}', [AssistantController::class, 'getConversation'])->name('conversation');
    Route::post('/conversations/{id}/archive', [AssistantController::class, 'archiveConversation'])->name('archive');
    Route::delete('/conversations/{id}', [AssistantController::class, 'deleteConversation'])->name('delete');
});
