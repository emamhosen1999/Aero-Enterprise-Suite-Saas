<?php

use App\Http\Controllers\Quality\CalibrationController;
use App\Http\Controllers\Quality\InspectionController;
use App\Http\Controllers\Quality\NCRController;
use Illuminate\Support\Facades\Route;

// Quality Routes
Route::middleware(['auth', 'verified'])->prefix('quality')->name('quality.')->group(function () {
    // Quality Dashboard
    Route::middleware(['permission:quality.dashboard.view'])->get('/dashboard', [InspectionController::class, 'dashboard'])->name('dashboard');

    // Inspections
    Route::middleware(['permission:quality.inspections.view'])->group(function () {
        Route::get('/inspections', [InspectionController::class, 'index'])->name('inspections.index');
        Route::get('/inspections/create', [InspectionController::class, 'create'])->name('inspections.create');
        Route::get('/inspections/{inspection}', [InspectionController::class, 'show'])->name('inspections.show');
        Route::get('/inspections/{inspection}/edit', [InspectionController::class, 'edit'])->name('inspections.edit');
    });

    Route::middleware(['permission:quality.inspections.create'])->post('/inspections', [InspectionController::class, 'store'])->name('inspections.store');
    Route::middleware(['permission:quality.inspections.update'])->put('/inspections/{inspection}', [InspectionController::class, 'update'])->name('inspections.update');
    Route::middleware(['permission:quality.inspections.delete'])->delete('/inspections/{inspection}', [InspectionController::class, 'destroy'])->name('inspections.destroy');

    // Non-Conformance Reports (NCRs)
    Route::middleware(['permission:quality.ncr.view'])->group(function () {
        Route::get('/ncrs', [NCRController::class, 'index'])->name('ncrs.index');
        Route::get('/ncrs/create', [NCRController::class, 'create'])->name('ncrs.create');
        Route::get('/ncrs/{ncr}', [NCRController::class, 'show'])->name('ncrs.show');
        Route::get('/ncrs/{ncr}/edit', [NCRController::class, 'edit'])->name('ncrs.edit');
    });

    Route::middleware(['permission:quality.ncr.create'])->post('/ncrs', [NCRController::class, 'store'])->name('ncrs.store');
    Route::middleware(['permission:quality.ncr.update'])->put('/ncrs/{ncr}', [NCRController::class, 'update'])->name('ncrs.update');
    Route::middleware(['permission:quality.ncr.delete'])->delete('/ncrs/{ncr}', [NCRController::class, 'destroy'])->name('ncrs.destroy');

    // Calibrations
    Route::middleware(['permission:quality.calibrations.view'])->group(function () {
        Route::get('/calibrations', [CalibrationController::class, 'index'])->name('calibrations.index');
        Route::get('/calibrations/create', [CalibrationController::class, 'create'])->name('calibrations.create');
        Route::get('/calibrations/{calibration}', [CalibrationController::class, 'show'])->name('calibrations.show');
        Route::get('/calibrations/{calibration}/edit', [CalibrationController::class, 'edit'])->name('calibrations.edit');
    });

    Route::middleware(['permission:quality.calibrations.create'])->post('/calibrations', [CalibrationController::class, 'store'])->name('calibrations.store');
    Route::middleware(['permission:quality.calibrations.update'])->put('/calibrations/{calibration}', [CalibrationController::class, 'update'])->name('calibrations.update');
    Route::middleware(['permission:quality.calibrations.delete'])->delete('/calibrations/{calibration}', [CalibrationController::class, 'destroy'])->name('calibrations.destroy');
});
