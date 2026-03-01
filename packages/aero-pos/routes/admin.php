<?php

use Illuminate\Support\Facades\Route;

Route::prefix('admin/pos')->name('admin.pos.')->middleware(['auth', 'admin'])->group(function () {});
