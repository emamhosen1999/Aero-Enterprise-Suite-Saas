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

Route::middleware(['web', 'auth'])->prefix('assistant')->name('assistant.')->group(function () {
    // Main assistant page
    Route::get('/', [AssistantPageController::class, 'index'])->name('index');
});
