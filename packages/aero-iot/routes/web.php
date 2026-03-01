<?php

use Aero\IoT\Http\Controllers\AlertController;
use Aero\IoT\Http\Controllers\DeviceController;
use Aero\IoT\Http\Controllers\GatewayController;
use Aero\IoT\Http\Controllers\MaintenanceController;
use Aero\IoT\Http\Controllers\SensorController;
use Aero\IoT\Http\Controllers\TelemetryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| IoT Web Routes
|--------------------------------------------------------------------------
|
| Here are the web routes for the IoT module. These routes are loaded
| by the IoT service provider and assigned the "web" middleware group.
|
*/

Route::middleware(['web', 'auth'])->prefix('iot')->name('iot.')->group(function () {

    // Dashboard
    Route::get('/', function () {
        return inertia('IoT/Dashboard');
    })->name('dashboard');

    // Device Management
    Route::prefix('devices')->name('devices.')->group(function () {
        Route::get('/', [DeviceController::class, 'index'])->name('index');
        Route::get('/create', [DeviceController::class, 'create'])->name('create');
        Route::post('/', [DeviceController::class, 'store'])->name('store');
        Route::get('/{device}', [DeviceController::class, 'show'])->name('show');
        Route::get('/{device}/edit', [DeviceController::class, 'edit'])->name('edit');
        Route::put('/{device}', [DeviceController::class, 'update'])->name('update');
        Route::delete('/{device}', [DeviceController::class, 'destroy'])->name('destroy');

        // Device Actions
        Route::post('/{device}/command', [DeviceController::class, 'sendCommand'])->name('command');
        Route::post('/{device}/restart', [DeviceController::class, 'restart'])->name('restart');
        Route::get('/{device}/telemetry', [DeviceController::class, 'telemetry'])->name('telemetry');
        Route::get('/{device}/alerts', [DeviceController::class, 'alerts'])->name('alerts');
    });

    // Sensor Management
    Route::prefix('sensors')->name('sensors.')->group(function () {
        Route::get('/', [SensorController::class, 'index'])->name('index');
        Route::post('/', [SensorController::class, 'store'])->name('store');
        Route::get('/{sensor}', [SensorController::class, 'show'])->name('show');
        Route::put('/{sensor}', [SensorController::class, 'update'])->name('update');
        Route::delete('/{sensor}', [SensorController::class, 'destroy'])->name('destroy');

        // Sensor Actions
        Route::post('/{sensor}/calibrate', [SensorController::class, 'calibrate'])->name('calibrate');
        Route::get('/{sensor}/data', [SensorController::class, 'data'])->name('data');
    });

    // Telemetry
    Route::prefix('telemetry')->name('telemetry.')->group(function () {
        Route::get('/', [TelemetryController::class, 'index'])->name('index');
        Route::get('/device/{device}', [TelemetryController::class, 'device'])->name('device');
        Route::get('/export', [TelemetryController::class, 'export'])->name('export');
    });

    // Alerts
    Route::prefix('alerts')->name('alerts.')->group(function () {
        Route::get('/', [AlertController::class, 'index'])->name('index');
        Route::get('/{alert}', [AlertController::class, 'show'])->name('show');
        Route::post('/{alert}/acknowledge', [AlertController::class, 'acknowledge'])->name('acknowledge');
        Route::post('/{alert}/resolve', [AlertController::class, 'resolve'])->name('resolve');
        Route::post('/{alert}/suppress', [AlertController::class, 'suppress'])->name('suppress');
    });

    // Gateways
    Route::prefix('gateways')->name('gateways.')->group(function () {
        Route::get('/', [GatewayController::class, 'index'])->name('index');
        Route::get('/create', [GatewayController::class, 'create'])->name('create');
        Route::post('/', [GatewayController::class, 'store'])->name('store');
        Route::get('/{gateway}', [GatewayController::class, 'show'])->name('show');
        Route::get('/{gateway}/edit', [GatewayController::class, 'edit'])->name('edit');
        Route::put('/{gateway}', [GatewayController::class, 'update'])->name('update');
        Route::delete('/{gateway}', [GatewayController::class, 'destroy'])->name('destroy');
    });

    // Maintenance
    Route::prefix('maintenance')->name('maintenance.')->group(function () {
        Route::get('/', [MaintenanceController::class, 'index'])->name('index');
        Route::get('/create', [MaintenanceController::class, 'create'])->name('create');
        Route::post('/', [MaintenanceController::class, 'store'])->name('store');
        Route::get('/{maintenance}', [MaintenanceController::class, 'show'])->name('show');
        Route::get('/{maintenance}/edit', [MaintenanceController::class, 'edit'])->name('edit');
        Route::put('/{maintenance}', [MaintenanceController::class, 'update'])->name('update');
        Route::delete('/{maintenance}', [MaintenanceController::class, 'destroy'])->name('destroy');

        // Maintenance Actions
        Route::post('/{maintenance}/start', [MaintenanceController::class, 'start'])->name('start');
        Route::post('/{maintenance}/complete', [MaintenanceController::class, 'complete'])->name('complete');
        Route::post('/{maintenance}/cancel', [MaintenanceController::class, 'cancel'])->name('cancel');
    });
});
