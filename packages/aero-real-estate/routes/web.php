<?php

use Aero\RealEstate\Http\Controllers\AgentController;
use Aero\RealEstate\Http\Controllers\LeaseController;
use Aero\RealEstate\Http\Controllers\ListingController;
use Aero\RealEstate\Http\Controllers\MaintenanceController;
use Aero\RealEstate\Http\Controllers\PropertyController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->prefix('real-estate')->name('real-estate.')->group(function () {

    // Property Management Routes
    Route::prefix('properties')->name('properties.')->group(function () {
        Route::get('/', [PropertyController::class, 'index'])->name('index');
        Route::get('/create', [PropertyController::class, 'create'])->name('create');
        Route::post('/', [PropertyController::class, 'store'])->name('store');
        Route::get('/{property}', [PropertyController::class, 'show'])->name('show');
        Route::get('/{property}/edit', [PropertyController::class, 'edit'])->name('edit');
        Route::put('/{property}', [PropertyController::class, 'update'])->name('update');
        Route::delete('/{property}', [PropertyController::class, 'destroy'])->name('destroy');

        // Property specific routes
        Route::post('/{property}/photos', [PropertyController::class, 'uploadPhotos'])->name('photos.upload');
        Route::delete('/{property}/photos/{photo}', [PropertyController::class, 'deletePhoto'])->name('photos.delete');
    });

    // Agent Management Routes
    Route::prefix('agents')->name('agents.')->group(function () {
        Route::get('/', [AgentController::class, 'index'])->name('index');
        Route::get('/create', [AgentController::class, 'create'])->name('create');
        Route::post('/', [AgentController::class, 'store'])->name('store');
        Route::get('/{agent}', [AgentController::class, 'show'])->name('show');
        Route::get('/{agent}/edit', [AgentController::class, 'edit'])->name('edit');
        Route::put('/{agent}', [AgentController::class, 'update'])->name('update');
        Route::delete('/{agent}', [AgentController::class, 'destroy'])->name('destroy');
    });

    // Listing Management Routes
    Route::prefix('listings')->name('listings.')->group(function () {
        Route::get('/', [ListingController::class, 'index'])->name('index');
        Route::get('/create', [ListingController::class, 'create'])->name('create');
        Route::post('/', [ListingController::class, 'store'])->name('store');
        Route::get('/{listing}', [ListingController::class, 'show'])->name('show');
        Route::get('/{listing}/edit', [ListingController::class, 'edit'])->name('edit');
        Route::put('/{listing}', [ListingController::class, 'update'])->name('update');
        Route::delete('/{listing}', [ListingController::class, 'destroy'])->name('destroy');

        // Listing specific routes
        Route::post('/{listing}/inquiries', [ListingController::class, 'createInquiry'])->name('inquiries.store');
        Route::post('/{listing}/showings', [ListingController::class, 'scheduleShowing'])->name('showings.store');
    });

    // Lease Management Routes
    Route::prefix('leases')->name('leases.')->group(function () {
        Route::get('/', [LeaseController::class, 'index'])->name('index');
        Route::get('/create', [LeaseController::class, 'create'])->name('create');
        Route::post('/', [LeaseController::class, 'store'])->name('store');
        Route::get('/{lease}', [LeaseController::class, 'show'])->name('show');
        Route::get('/{lease}/edit', [LeaseController::class, 'edit'])->name('edit');
        Route::put('/{lease}', [LeaseController::class, 'update'])->name('update');
        Route::delete('/{lease}', [LeaseController::class, 'destroy'])->name('destroy');

        // Lease specific routes
        Route::post('/{lease}/payments', [LeaseController::class, 'recordPayment'])->name('payments.store');
        Route::get('/{lease}/payments', [LeaseController::class, 'paymentHistory'])->name('payments.index');
    });

    // Maintenance Management Routes
    Route::prefix('maintenance')->name('maintenance.')->group(function () {
        Route::get('/', [MaintenanceController::class, 'index'])->name('index');
        Route::get('/create', [MaintenanceController::class, 'create'])->name('create');
        Route::post('/', [MaintenanceController::class, 'store'])->name('store');
        Route::get('/{request}', [MaintenanceController::class, 'show'])->name('show');
        Route::get('/{request}/edit', [MaintenanceController::class, 'edit'])->name('edit');
        Route::put('/{request}', [MaintenanceController::class, 'update'])->name('update');
        Route::delete('/{request}', [MaintenanceController::class, 'destroy'])->name('destroy');

        // Maintenance specific routes
        Route::post('/{request}/assign', [MaintenanceController::class, 'assignVendor'])->name('assign');
        Route::post('/{request}/complete', [MaintenanceController::class, 'markComplete'])->name('complete');
        Route::post('/{request}/photos', [MaintenanceController::class, 'uploadPhotos'])->name('photos.upload');
    });

    // Dashboard and Reports
    Route::get('/dashboard', [\Aero\RealEstate\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::get('/reports', [\Aero\RealEstate\Http\Controllers\ReportController::class, 'index'])->name('reports');
});
