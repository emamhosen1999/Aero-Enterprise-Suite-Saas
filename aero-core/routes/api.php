<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero Core API Routes
|--------------------------------------------------------------------------
|
| API routes for Aero Core functionality.
| Full API controllers are available when the host app configures Sanctum.
|
*/

// Core API Health Check
Route::get('/aero-core/health', function () {
    return response()->json([
        'status' => 'ok',
        'package' => 'aero/core',
        'timestamp' => now()->toIso8601String(),
    ]);
})->name('aero-core.api.health');
