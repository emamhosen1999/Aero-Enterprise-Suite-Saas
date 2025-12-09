<?php

use Aero\Core\Http\Controllers\Auth\SimpleLoginController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero Core Authentication Routes
|--------------------------------------------------------------------------
|
| These routes are registered WITHOUT a prefix to maintain Laravel's
| standard auth route names (login, logout, etc.)
|
*/

// Guest Routes
Route::middleware('guest')->group(function () {
    Route::get('login', [SimpleLoginController::class, 'create'])->name('login');
    Route::post('login', [SimpleLoginController::class, 'store']);
});

// Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::post('logout', [SimpleLoginController::class, 'destroy'])->name('logout');
});

// Root redirect
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('core.dashboard');
    }
    return redirect()->route('login');
});
