<?php
use Illuminate\Support\Facades\Route;
Route::prefix('admin/compliance')->name('admin.compliance.')->middleware(['auth', 'admin'])->group(function () {});
