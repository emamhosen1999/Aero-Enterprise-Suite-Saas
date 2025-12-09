<?php

use Aero\Core\Http\Controllers\Admin\CoreRoleController;
use Aero\Core\Http\Controllers\Admin\CoreUserController;
use Aero\Core\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero Core Web Routes
|--------------------------------------------------------------------------
|
| Core user management, role management, and dashboard routes.
| These routes are registered with the 'core.' prefix.
|
| Authentication routes (login, logout) are in auth.php without prefix.
|
*/

// Health Check / Info Route
Route::get('/aero-core/health', function () {
    return response()->json([
        'status' => 'ok',
        'package' => 'aero/core',
        'services' => [
            'UserRelationshipRegistry' => app()->bound('Aero\Core\Services\UserRelationshipRegistry'),
            'NavigationRegistry' => app()->bound('Aero\Core\Services\NavigationRegistry'),
            'ModuleRegistry' => app()->bound('Aero\Core\Services\ModuleRegistry'),
            'ModuleAccessService' => app()->bound('Aero\Core\Services\ModuleAccessService'),
        ],
    ]);
})->name('health')->withoutMiddleware(['auth']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');

    /*
    |--------------------------------------------------------------------------
    | User Management Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [CoreUserController::class, 'index'])->name('index');
        Route::get('/create', [CoreUserController::class, 'create'])->name('create');
        Route::post('/', [CoreUserController::class, 'store'])->name('store');
        Route::get('/{user}', [CoreUserController::class, 'show'])->name('show');
        Route::get('/{user}/edit', [CoreUserController::class, 'edit'])->name('edit');
        Route::put('/{user}', [CoreUserController::class, 'update'])->name('update');
        Route::delete('/{user}', [CoreUserController::class, 'destroy'])->name('destroy');
        Route::post('/{user}/toggle-status', [CoreUserController::class, 'toggleStatus'])->name('toggle-status');
    });

    /*
    |--------------------------------------------------------------------------
    | Role Management Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('roles')->name('roles.')->group(function () {
        Route::get('/', [CoreRoleController::class, 'index'])->name('index');
        Route::get('/create', [CoreRoleController::class, 'create'])->name('create');
        Route::post('/', [CoreRoleController::class, 'store'])->name('store');
        Route::get('/permissions', [CoreRoleController::class, 'permissions'])->name('permissions');
        Route::get('/{role}', [CoreRoleController::class, 'show'])->name('show');
        Route::get('/{role}/edit', [CoreRoleController::class, 'edit'])->name('edit');
        Route::put('/{role}', [CoreRoleController::class, 'update'])->name('update');
        Route::delete('/{role}', [CoreRoleController::class, 'destroy'])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Profile Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', function () {
            return inertia('Profile/Index', [
                'title' => 'My Profile',
                'user' => auth()->user(),
            ]);
        })->name('index');
    });

    /*
    |--------------------------------------------------------------------------
    | Settings Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', function () {
            return inertia('Settings/Index', [
                'title' => 'Settings',
            ]);
        })->name('index');
    });

    /*
    |--------------------------------------------------------------------------
    | Module Management Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('modules')->name('modules.')->group(function () {
        Route::get('/', function () {
            $moduleRegistry = app(\Aero\Core\Services\ModuleRegistry::class);
            return inertia('Modules/Index', [
                'title' => 'Modules',
                'modules' => $moduleRegistry->all(),
            ]);
        })->name('index');
    });
});
