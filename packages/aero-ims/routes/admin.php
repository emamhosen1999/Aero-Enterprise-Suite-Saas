<?php

use Illuminate\Support\Facades\Route;

Route::prefix('admin/ims')->name('admin.ims.')->middleware(['auth', 'admin'])->group(function () {});
