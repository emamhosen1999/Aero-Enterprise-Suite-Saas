<?php

declare(strict_types=1);

use Aero\Auth\Http\Controllers\Auth\AuthenticatedSessionController;
use Aero\Auth\Http\Controllers\Auth\ImpersonationController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Auth Routes — loaded by AeroAuthServiceProvider
|--------------------------------------------------------------------------
|
| These routes handle landlord/platform-admin authentication.
| They are prefixed and grouped by the admin domain middleware defined in
| AeroPlatformServiceProvider.
|
| The active AuthContext (LandlordAuthContext) drives the guard ('landlord')
| and Inertia view path ('Platform/Admin/Auth/Login').
|
*/

Route::middleware('admin.domain')->group(function () {

    // =========================================================================
    // LANDLORD GUEST ROUTES
    // =========================================================================
    Route::middleware('guest:landlord')->group(function () {
        Route::get('/login', [AuthenticatedSessionController::class, 'create'])
            ->name('admin.login');

        Route::post('/login', [AuthenticatedSessionController::class, 'store'])
            ->name('admin.login.store');
    });

    // Logout
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
        ->middleware('auth:landlord')
        ->name('admin.logout');

    // Root redirect based on landlord auth state
    Route::get('/', function () {
        if (Auth::guard('landlord')->check()) {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('admin.login');
    })->name('admin.root');

    // Session check for admin domain
    Route::get('/session-check', function () {
        return response()->json([
            'authenticated' => Auth::guard('landlord')->check(),
            'user_id' => Auth::guard('landlord')->id(),
        ]);
    })->name('admin.session-check');

    // =========================================================================
    // AUTHENTICATED ADMIN AUTH ROUTES
    // =========================================================================
    Route::middleware(['auth:landlord'])->group(function () {

        // Admin Impersonation (admin → tenant user)
        Route::post('/users/{id}/impersonate', [ImpersonationController::class, 'startImpersonation'])
            ->name('admin.users.impersonate');
        Route::post('/impersonation/stop', [ImpersonationController::class, 'stopAdminImpersonation'])
            ->name('admin.impersonation.stop');
    });
});
