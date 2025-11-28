<?php

use App\Http\Controllers\Analytics\DashboardController;
use App\Http\Controllers\Analytics\KPIController;
use App\Http\Controllers\Analytics\ReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Analytics Routes
|--------------------------------------------------------------------------
|
| Here is where you can register analytics routes for your application.
|
*/

Route::middleware(['auth', 'verified'])->prefix('analytics')->name('analytics.')->group(function () {
    // Reports routes
    Route::middleware(['permission:analytics.reports.view'])->group(function () {
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/create', [ReportController::class, 'create'])->name('reports.create');
        Route::get('/reports/{report}/edit', [ReportController::class, 'edit'])->name('reports.edit');
        Route::get('/reports/{report}', [ReportController::class, 'show'])->name('reports.show');
        Route::get('/reports/{report}/schedule', [ReportController::class, 'scheduleForm'])->name('reports.schedule.form');
        Route::get('/reports/{report}/export', [ReportController::class, 'export'])->name('reports.export');
    });

    Route::middleware(['permission:analytics.reports.create'])->post('/reports', [ReportController::class, 'store'])->name('reports.store');
    Route::middleware(['permission:analytics.reports.update'])->put('/reports/{report}', [ReportController::class, 'update'])->name('reports.update');
    Route::middleware(['permission:analytics.reports.delete'])->delete('/reports/{report}', [ReportController::class, 'destroy'])->name('reports.destroy');
    Route::middleware(['permission:analytics.reports.schedule'])->post('/reports/{report}/schedule', [ReportController::class, 'schedule'])->name('reports.schedule');

    // Dashboards routes
    Route::middleware(['permission:analytics.dashboards.view'])->group(function () {
        Route::get('/dashboards', [DashboardController::class, 'index'])->name('dashboards.index');
        Route::get('/dashboards/create', [DashboardController::class, 'create'])->name('dashboards.create');
        Route::get('/dashboards/{dashboard}/edit', [DashboardController::class, 'edit'])->name('dashboards.edit');
        Route::get('/dashboards/{dashboard}', [DashboardController::class, 'show'])->name('dashboards.show');
    });

    Route::middleware(['permission:analytics.dashboards.create'])->post('/dashboards', [DashboardController::class, 'store'])->name('dashboards.store');
    Route::middleware(['permission:analytics.dashboards.update'])->put('/dashboards/{dashboard}', [DashboardController::class, 'update'])->name('dashboards.update');
    Route::middleware(['permission:analytics.dashboards.delete'])->delete('/dashboards/{dashboard}', [DashboardController::class, 'destroy'])->name('dashboards.destroy');

    // KPI routes
    Route::middleware(['permission:analytics.kpi.view'])->group(function () {
        Route::get('/kpi', [KPIController::class, 'index'])->name('kpi.index');
        Route::get('/kpi/create', [KPIController::class, 'create'])->name('kpi.create');
        Route::get('/kpi/{kpi}/edit', [KPIController::class, 'edit'])->name('kpi.edit');
        Route::get('/kpi/{kpi}', [KPIController::class, 'show'])->name('kpi.show');
    });

    Route::middleware(['permission:analytics.kpi.create'])->post('/kpi', [KPIController::class, 'store'])->name('kpi.store');
    Route::middleware(['permission:analytics.kpi.update'])->put('/kpi/{kpi}', [KPIController::class, 'update'])->name('kpi.update');
    Route::middleware(['permission:analytics.kpi.delete'])->delete('/kpi/{kpi}', [KPIController::class, 'destroy'])->name('kpi.destroy');
    Route::middleware(['permission:analytics.kpi.log'])->post('/kpi/{kpi}/log-value', [KPIController::class, 'logValue'])->name('kpi.log-value');
});
