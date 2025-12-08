<?php

use Aero\Core\Http\Controllers\Auth\AuthenticatedSessionController;
use Aero\Core\Http\Controllers\Auth\RegisteredUserController;
use Aero\Core\Http\Controllers\ProfileController;
use Aero\Core\Http\Controllers\UserController;
use Aero\Core\Http\Controllers\RoleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero Core Web Routes
|--------------------------------------------------------------------------
|
| Core authentication and user management routes.
| These routes are automatically registered with 'core' prefix.
|
*/

// Authentication Routes (public)
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('register', [RegisteredUserController::class, 'store']);
});

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', function () {
        return inertia('Dashboard/Index');
    })->name('dashboard');

    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Profile Management
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'show'])->name('show');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
        Route::post('avatar', [ProfileController::class, 'uploadAvatar'])->name('avatar.upload');
    });

    // User Management (requires module access)
    Route::middleware('module.access:user_management,users,user_list')->group(function () {
        Route::resource('users', UserController::class);
        Route::post('users/{user}/invite', [UserController::class, 'invite'])->name('users.invite');
        Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
        Route::post('users/{user}/lock', [UserController::class, 'lock'])->name('users.lock');
        Route::post('users/{user}/unlock', [UserController::class, 'unlock'])->name('users.unlock');
    });

    // Role Management (requires module access)
    Route::middleware('module.access:roles_permissions,roles,role_list')->group(function () {
        Route::resource('roles', RoleController::class);
        Route::post('roles/{role}/sync-module-access', [RoleController::class, 'syncModuleAccess'])->name('roles.sync-module-access');
    });
});
