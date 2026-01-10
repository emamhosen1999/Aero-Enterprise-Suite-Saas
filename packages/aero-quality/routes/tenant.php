<?php

use Illuminate\Support\Facades\Route;
use Aero\Quality\Http\Controllers\QualityController;
use Aero\Quality\Http\Controllers\InspectionController;
use Aero\Quality\Http\Controllers\NCRController;
use Aero\Quality\Http\Controllers\LabController;

/*
|--------------------------------------------------------------------------
| Quality Management Tenant Routes
|--------------------------------------------------------------------------
| These routes are automatically wrapped by AbstractModuleProvider with:
| - Middleware: web, InitializeTenancyIfNotCentral, tenant (SaaS mode)
| - Prefix: /quality
| - Name prefix: quality.
|
| HRMAC Integration: All routes use 'module:quality,{submodule}' middleware
| Sub-modules defined in config/module.php: inspections, material-lab, ncr-management
*/

// Dashboard - module level access only (auth required)
Route::middleware(['auth', 'module:quality'])->group(function () {
    Route::get('/dashboard', [QualityController::class, 'dashboard'])->name('dashboard');
    Route::get('/', [QualityController::class, 'index'])->name('index');
});

// Inspections - maps to 'inspections' sub-module
Route::middleware(['auth', 'module:quality,inspections'])->group(function () {
    // Named routes for sidebar menu items (must be defined before resource routes)
    Route::get('inspections/wir', [InspectionController::class, 'index'])->name('inspections.wir');
    Route::get('inspections/checklists', [InspectionController::class, 'checklists'])->name('inspections.checklists');
    
    // Resource routes
    Route::resource('inspections', InspectionController::class);
});

// Material Testing Lab - maps to 'material-lab' sub-module
Route::middleware(['auth', 'module:quality,material-lab'])->group(function () {
    Route::get('lab/concrete', [LabController::class, 'concrete'])->name('lab.concrete');
    Route::get('lab/soil', [LabController::class, 'soil'])->name('lab.soil');
    Route::get('lab/materials', [LabController::class, 'materials'])->name('lab.materials');
});

// Non-Conformance Reports - maps to 'ncr-management' sub-module
Route::middleware(['auth', 'module:quality,ncr-management'])->group(function () {
    Route::resource('ncrs', NCRController::class);
});
