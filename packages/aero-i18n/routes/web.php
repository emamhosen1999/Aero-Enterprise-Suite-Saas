<?php

use Aero\I18n\Http\Controllers\LocaleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| I18n Routes
|--------------------------------------------------------------------------
|
| Locale switching endpoint. Registered inside the web middleware group
| by AeroI18nServiceProvider so session and CSRF are available.
|
*/

Route::post('/locale', [LocaleController::class, 'update'])
    ->name('i18n.locale.update');

Route::get('/locale', [LocaleController::class, 'index'])
    ->name('i18n.locale.index');

Route::get('/translations/{namespace?}', [LocaleController::class, 'translations'])
    ->name('i18n.translations');
