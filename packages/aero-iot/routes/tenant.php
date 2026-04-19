<?php

declare(strict_types=1);

use Aero\IoT\Http\Controllers\Tenant\TenantAlertController;
use Aero\IoT\Http\Controllers\Tenant\TenantDeviceController;
use Aero\IoT\Http\Controllers\Tenant\TenantGatewayController;
use Aero\IoT\Http\Controllers\Tenant\TenantSensorController;
use Aero\IoT\Http\Controllers\Tenant\TenantTelemetryController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant IoT Routes
|--------------------------------------------------------------------------
|
| Here we register routes for tenant-specific IoT functionality.
| These routes are accessible within tenant subdomains.
|
*/

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
    'auth',
    'hrmac:iot',
])->prefix('iot')->name('tenant.iot.')->group(function () {

    // IoT Dashboard
    Route::get('/', function () {
        return inertia('IoT/Dashboard', [
            'title' => 'IoT Dashboard',
        ]);
    })->name('dashboard');

    // Device Management
    Route::prefix('devices')->name('devices.')->group(function () {
        Route::get('/', [TenantDeviceController::class, 'index'])->name('index');
        Route::get('/create', [TenantDeviceController::class, 'create'])->name('create');
        Route::post('/', [TenantDeviceController::class, 'store'])->name('store');
        Route::get('/{device}', [TenantDeviceController::class, 'show'])->name('show');
        Route::get('/{device}/edit', [TenantDeviceController::class, 'edit'])->name('edit');
        Route::put('/{device}', [TenantDeviceController::class, 'update'])->name('update');
        Route::delete('/{device}', [TenantDeviceController::class, 'destroy'])->name('destroy');

        // Device Actions
        Route::post('/{device}/command', [TenantDeviceController::class, 'sendCommand'])->name('command');
        Route::post('/{device}/restart', [TenantDeviceController::class, 'restart'])->name('restart');
        Route::post('/{device}/shutdown', [TenantDeviceController::class, 'shutdown'])->name('shutdown');
        Route::get('/{device}/telemetry', [TenantDeviceController::class, 'telemetry'])->name('telemetry');
        Route::get('/{device}/alerts', [TenantDeviceController::class, 'alerts'])->name('alerts');
        Route::get('/{device}/maintenance', [TenantDeviceController::class, 'maintenance'])->name('maintenance');

        // Bulk operations
        Route::post('/bulk-command', [TenantDeviceController::class, 'bulkCommand'])->name('bulk.command');
        Route::post('/bulk-update', [TenantDeviceController::class, 'bulkUpdate'])->name('bulk.update');
        Route::post('/bulk-delete', [TenantDeviceController::class, 'bulkDelete'])->name('bulk.delete');
    });

    // Sensor Management
    Route::prefix('sensors')->name('sensors.')->group(function () {
        Route::get('/', [TenantSensorController::class, 'index'])->name('index');
        Route::post('/', [TenantSensorController::class, 'store'])->name('store');
        Route::get('/{sensor}', [TenantSensorController::class, 'show'])->name('show');
        Route::put('/{sensor}', [TenantSensorController::class, 'update'])->name('update');
        Route::delete('/{sensor}', [TenantSensorController::class, 'destroy'])->name('destroy');

        // Sensor Actions
        Route::post('/{sensor}/calibrate', [TenantSensorController::class, 'calibrate'])->name('calibrate');
        Route::get('/{sensor}/data', [TenantSensorController::class, 'data'])->name('data');
        Route::post('/{sensor}/threshold', [TenantSensorController::class, 'setThreshold'])->name('threshold');

        // Data export
        Route::get('/{sensor}/export', [TenantSensorController::class, 'export'])->name('export');
    });

    // Telemetry Management
    Route::prefix('telemetry')->name('telemetry.')->group(function () {
        Route::get('/', [TenantTelemetryController::class, 'index'])->name('index');
        Route::get('/device/{device}', [TenantTelemetryController::class, 'device'])->name('device');
        Route::get('/sensor/{sensor}', [TenantTelemetryController::class, 'sensor'])->name('sensor');
        Route::get('/export', [TenantTelemetryController::class, 'export'])->name('export');
        Route::get('/analytics', [TenantTelemetryController::class, 'analytics'])->name('analytics');
        Route::post('/purge-old', [TenantTelemetryController::class, 'purgeOld'])->name('purge');
    });

    // Alert Management
    Route::prefix('alerts')->name('alerts.')->group(function () {
        Route::get('/', [TenantAlertController::class, 'index'])->name('index');
        Route::get('/{alert}', [TenantAlertController::class, 'show'])->name('show');
        Route::post('/{alert}/acknowledge', [TenantAlertController::class, 'acknowledge'])->name('acknowledge');
        Route::post('/{alert}/resolve', [TenantAlertController::class, 'resolve'])->name('resolve');
        Route::post('/{alert}/suppress', [TenantAlertController::class, 'suppress'])->name('suppress');
        Route::post('/{alert}/escalate', [TenantAlertController::class, 'escalate'])->name('escalate');

        // Bulk alert operations
        Route::post('/bulk-acknowledge', [TenantAlertController::class, 'bulkAcknowledge'])->name('bulk.acknowledge');
        Route::post('/bulk-resolve', [TenantAlertController::class, 'bulkResolve'])->name('bulk.resolve');

        // Alert rules
        Route::get('/rules', [TenantAlertController::class, 'rules'])->name('rules');
        Route::post('/rules', [TenantAlertController::class, 'storeRule'])->name('rules.store');
        Route::put('/rules/{rule}', [TenantAlertController::class, 'updateRule'])->name('rules.update');
        Route::delete('/rules/{rule}', [TenantAlertController::class, 'destroyRule'])->name('rules.destroy');
    });

    // Gateway Management
    Route::prefix('gateways')->name('gateways.')->group(function () {
        Route::get('/', [TenantGatewayController::class, 'index'])->name('index');
        Route::get('/create', [TenantGatewayController::class, 'create'])->name('create');
        Route::post('/', [TenantGatewayController::class, 'store'])->name('store');
        Route::get('/{gateway}', [TenantGatewayController::class, 'show'])->name('show');
        Route::get('/{gateway}/edit', [TenantGatewayController::class, 'edit'])->name('edit');
        Route::put('/{gateway}', [TenantGatewayController::class, 'update'])->name('update');
        Route::delete('/{gateway}', [TenantGatewayController::class, 'destroy'])->name('destroy');

        // Gateway Actions
        Route::post('/{gateway}/restart', [TenantGatewayController::class, 'restart'])->name('restart');
        Route::get('/{gateway}/devices', [TenantGatewayController::class, 'devices'])->name('devices');
        Route::get('/{gateway}/health', [TenantGatewayController::class, 'health'])->name('health');
    });

    // Network Management
    Route::prefix('networks')->name('networks.')->group(function () {
        Route::get('/', [TenantGatewayController::class, 'networks'])->name('index');
        Route::post('/', [TenantGatewayController::class, 'storeNetwork'])->name('store');
        Route::get('/{network}', [TenantGatewayController::class, 'showNetwork'])->name('show');
        Route::put('/{network}', [TenantGatewayController::class, 'updateNetwork'])->name('update');
        Route::delete('/{network}', [TenantGatewayController::class, 'destroyNetwork'])->name('destroy');
    });

    // Device Types Management
    Route::prefix('device-types')->name('device-types.')->group(function () {
        Route::get('/', [TenantDeviceController::class, 'types'])->name('index');
        Route::post('/', [TenantDeviceController::class, 'storeType'])->name('store');
        Route::get('/{type}', [TenantDeviceController::class, 'showType'])->name('show');
        Route::put('/{type}', [TenantDeviceController::class, 'updateType'])->name('update');
        Route::delete('/{type}', [TenantDeviceController::class, 'destroyType'])->name('destroy');
    });

    // Reports and Analytics
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [TenantTelemetryController::class, 'reports'])->name('index');
        Route::get('/device-usage', [TenantTelemetryController::class, 'deviceUsage'])->name('device-usage');
        Route::get('/sensor-performance', [TenantTelemetryController::class, 'sensorPerformance'])->name('sensor-performance');
        Route::get('/alert-summary', [TenantAlertController::class, 'summary'])->name('alert-summary');
        Route::get('/maintenance-schedule', [TenantDeviceController::class, 'maintenanceSchedule'])->name('maintenance-schedule');
    });

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [TenantDeviceController::class, 'settings'])->name('index');
        Route::post('/', [TenantDeviceController::class, 'updateSettings'])->name('update');
        Route::get('/notifications', [TenantAlertController::class, 'notificationSettings'])->name('notifications');
        Route::post('/notifications', [TenantAlertController::class, 'updateNotificationSettings'])->name('notifications.update');
    });
});

// Tenant API routes for IoT devices
Route::middleware([
    'api',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->prefix('api/iot')->name('tenant.api.iot.')->group(function () {

    // Device registration and authentication
    Route::post('/device/register', [TenantDeviceController::class, 'registerDevice'])->name('device.register');
    Route::post('/device/authenticate', [TenantDeviceController::class, 'authenticateDevice'])->name('device.authenticate');

    // Device data endpoints
    Route::middleware(['iot.device.auth'])->group(function () {
        Route::post('/telemetry', [TenantTelemetryController::class, 'storeTelemetry'])->name('telemetry.store');
        Route::post('/telemetry/batch', [TenantTelemetryController::class, 'storeBatchTelemetry'])->name('telemetry.batch');
        Route::post('/sensor-data', [TenantSensorController::class, 'storeData'])->name('sensor.data.store');
        Route::post('/alerts', [TenantAlertController::class, 'storeAlert'])->name('alerts.store');
        Route::post('/heartbeat', [TenantDeviceController::class, 'heartbeat'])->name('device.heartbeat');

        // Command polling
        Route::get('/commands/pending', [TenantDeviceController::class, 'pendingCommands'])->name('commands.pending');
        Route::post('/commands/{command}/acknowledge', [TenantDeviceController::class, 'acknowledgeCommand'])->name('commands.acknowledge');
        Route::post('/commands/{command}/complete', [TenantDeviceController::class, 'completeCommand'])->name('commands.complete');
        Route::post('/commands/{command}/fail', [TenantDeviceController::class, 'failCommand'])->name('commands.fail');
    });
});
