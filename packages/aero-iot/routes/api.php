<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Aero\IoT\Http\Controllers\Api\DeviceApiController;
use Aero\IoT\Http\Controllers\Api\TelemetryApiController;
use Aero\IoT\Http\Controllers\Api\CommandApiController;
use Aero\IoT\Http\Controllers\Api\SensorApiController;
use Aero\IoT\Http\Controllers\Api\AlertApiController;

/*
|--------------------------------------------------------------------------
| IoT API Routes
|--------------------------------------------------------------------------
|
| Here are the API routes for the IoT module. These routes are loaded
| by the IoT service provider and assigned the "api" middleware group.
|
*/

Route::middleware('api')->prefix('api/iot')->name('api.iot.')->group(function () {
    
    // Device API endpoints
    Route::prefix('devices')->name('devices.')->group(function () {
        Route::get('/', [DeviceApiController::class, 'index'])->name('index');
        Route::post('/', [DeviceApiController::class, 'store'])->name('store');
        Route::get('/{device}', [DeviceApiController::class, 'show'])->name('show');
        Route::put('/{device}', [DeviceApiController::class, 'update'])->name('update');
        Route::delete('/{device}', [DeviceApiController::class, 'destroy'])->name('destroy');
        
        // Device status and heartbeat
        Route::post('/{device}/heartbeat', [DeviceApiController::class, 'heartbeat'])->name('heartbeat');
        Route::get('/{device}/status', [DeviceApiController::class, 'status'])->name('status');
        Route::post('/{device}/status', [DeviceApiController::class, 'updateStatus'])->name('status.update');
    });
    
    // Telemetry API endpoints
    Route::prefix('telemetry')->name('telemetry.')->group(function () {
        Route::post('/', [TelemetryApiController::class, 'store'])->name('store');
        Route::post('/batch', [TelemetryApiController::class, 'storeBatch'])->name('batch');
        Route::get('/device/{device}', [TelemetryApiController::class, 'device'])->name('device');
        Route::get('/sensor/{sensor}', [TelemetryApiController::class, 'sensor'])->name('sensor');
    });
    
    // Sensor data API endpoints
    Route::prefix('sensors')->name('sensors.')->group(function () {
        Route::get('/{sensor}/data', [SensorApiController::class, 'data'])->name('data');
        Route::post('/{sensor}/data', [SensorApiController::class, 'storeData'])->name('data.store');
        Route::post('/{sensor}/data/batch', [SensorApiController::class, 'storeBatchData'])->name('data.batch');
    });
    
    // Command API endpoints
    Route::prefix('commands')->name('commands.')->group(function () {
        Route::post('/', [CommandApiController::class, 'store'])->name('store');
        Route::get('/device/{device}', [CommandApiController::class, 'deviceCommands'])->name('device');
        Route::get('/{command}', [CommandApiController::class, 'show'])->name('show');
        Route::post('/{command}/acknowledge', [CommandApiController::class, 'acknowledge'])->name('acknowledge');
        Route::post('/{command}/complete', [CommandApiController::class, 'complete'])->name('complete');
        Route::post('/{command}/fail', [CommandApiController::class, 'fail'])->name('fail');
    });
    
    // Alert API endpoints
    Route::prefix('alerts')->name('alerts.')->group(function () {
        Route::get('/', [AlertApiController::class, 'index'])->name('index');
        Route::post('/', [AlertApiController::class, 'store'])->name('store');
        Route::get('/device/{device}', [AlertApiController::class, 'deviceAlerts'])->name('device');
        Route::get('/sensor/{sensor}', [AlertApiController::class, 'sensorAlerts'])->name('sensor');
    });
});

// Device authentication routes (for IoT devices)
Route::middleware('api')->prefix('api/iot/device-auth')->name('api.iot.auth.')->group(function () {
    Route::post('/register', [DeviceApiController::class, 'register'])->name('register');
    Route::post('/authenticate', [DeviceApiController::class, 'authenticate'])->name('authenticate');
    Route::post('/refresh', [DeviceApiController::class, 'refreshToken'])->name('refresh');
});

// Webhook endpoints for external IoT platforms
Route::middleware('api')->prefix('api/iot/webhooks')->name('api.iot.webhooks.')->group(function () {
    Route::post('/aws', [TelemetryApiController::class, 'awsWebhook'])->name('aws');
    Route::post('/azure', [TelemetryApiController::class, 'azureWebhook'])->name('azure');
    Route::post('/google', [TelemetryApiController::class, 'googleWebhook'])->name('google');
});
