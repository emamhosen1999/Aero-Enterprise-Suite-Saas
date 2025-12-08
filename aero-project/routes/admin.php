<?php
use Illuminate\Support\Facades\Route;
Route::prefix('admin/projects')->name('admin.projects.')->middleware(['auth', 'admin'])->group(function () {});
