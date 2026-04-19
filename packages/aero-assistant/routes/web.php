<?php

use Aero\Assistant\Http\Controllers\AssistantPageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Assistant Web Routes
|--------------------------------------------------------------------------
|
| These routes are loaded in the web middleware group.
|
*/

Route::middleware(['auth', 'hrmac:assistant'])->group(function () {
    // Main assistant page
    Route::get('/', [AssistantPageController::class, 'index'])->name('index');
});
