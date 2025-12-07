<?php

use App\Http\Controllers\Platform\Integrations\ApiKeyController;
use App\Http\Controllers\Platform\Integrations\ConnectorController;
use App\Http\Controllers\Platform\Integrations\IntegrationDashboardController;
use App\Http\Controllers\Platform\Integrations\WebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Integrations Module Routes
|--------------------------------------------------------------------------
|
| Routes for the Integrations module including:
| - Integration Dashboard
| - Third-party Connectors
| - Webhooks
| - API Keys
|
*/

Route::middleware(['auth', 'verified'])->prefix('integrations')->name('integrations.')->group(function () {

    // Dashboard
    Route::middleware(['module:integrations'])->group(function () {
        Route::get('/', [IntegrationDashboardController::class, 'index'])->name('dashboard');
    });

    // Connectors
    Route::middleware(['module:integrations,connectors'])->group(function () {
        Route::get('/connectors', [ConnectorController::class, 'index'])->name('connectors.index');
        Route::post('/connectors', [ConnectorController::class, 'store'])->name('connectors.store');
        Route::put('/connectors/{id}', [ConnectorController::class, 'update'])->name('connectors.update');
        Route::delete('/connectors/{id}', [ConnectorController::class, 'destroy'])->name('connectors.destroy');
        Route::post('/connectors/{id}/test', [ConnectorController::class, 'test'])->name('connectors.test');
    });

    // Webhooks
    Route::middleware(['module:integrations,webhooks'])->group(function () {
        Route::get('/webhooks', [WebhookController::class, 'index'])->name('webhooks.index');
        Route::post('/webhooks', [WebhookController::class, 'store'])->name('webhooks.store');
        Route::put('/webhooks/{id}', [WebhookController::class, 'update'])->name('webhooks.update');
        Route::delete('/webhooks/{id}', [WebhookController::class, 'destroy'])->name('webhooks.destroy');
        Route::post('/webhooks/{id}/test', [WebhookController::class, 'test'])->name('webhooks.test');
        Route::get('/webhooks/{id}/logs', [WebhookController::class, 'logs'])->name('webhooks.logs');
    });

    // API Keys
    Route::middleware(['module:integrations,api-keys'])->group(function () {
        Route::get('/api-keys', [ApiKeyController::class, 'index'])->name('api-keys.index');
        Route::post('/api-keys', [ApiKeyController::class, 'store'])->name('api-keys.store');
        Route::delete('/api-keys/{id}', [ApiKeyController::class, 'destroy'])->name('api-keys.destroy');
        Route::put('/api-keys/{id}/scopes', [ApiKeyController::class, 'updateScopes'])->name('api-keys.scopes');
    });
});
