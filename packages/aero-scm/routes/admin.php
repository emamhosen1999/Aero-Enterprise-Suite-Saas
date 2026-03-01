<?php

use Illuminate\Support\Facades\Route;

Route::prefix('admin/scm')->name('admin.scm.')->middleware(['auth', 'admin'])->group(function () {});
