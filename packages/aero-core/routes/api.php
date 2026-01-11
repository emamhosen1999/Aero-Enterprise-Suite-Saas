<?php

use Aero\Core\Http\Controllers\Notification\NotificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the CoreServiceProvider and are assigned
| the "api" middleware group with the "api" prefix.
|
*/

Route::middleware(['auth:sanctum'])->group(function () {
    // ========================================================================
    // NOTIFICATIONS API
    // ========================================================================
    Route::prefix('notifications')->name('api.notifications.')->group(function () {
        // Get notifications list (for dropdown)
        Route::get('/', [NotificationController::class, 'apiList'])->name('list');

        // Mark notification as read
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead'])->name('read');

        // Mark all notifications as read
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');

        // Delete a notification
        Route::delete('/{id}', [NotificationController::class, 'destroy'])->name('destroy');

        // Get unread count
        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
    });
});
