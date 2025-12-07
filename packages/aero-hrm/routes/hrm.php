<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| HRM Routes
|--------------------------------------------------------------------------
|
| Here are the routes for the HRM module. These routes are loaded by the
| HrmServiceProvider and are automatically assigned the appropriate
| middleware based on the detected environment mode.
|
*/

// Employee Routes
Route::prefix('employees')->name('employees.')->group(function () {
    Route::get('/', 'EmployeeController@index')->name('index');
    Route::get('/create', 'EmployeeController@create')->name('create');
    Route::post('/', 'EmployeeController@store')->name('store');
    Route::get('/{employee}', 'EmployeeController@show')->name('show');
    Route::get('/{employee}/edit', 'EmployeeController@edit')->name('edit');
    Route::put('/{employee}', 'EmployeeController@update')->name('update');
    Route::delete('/{employee}', 'EmployeeController@destroy')->name('destroy');
});

// Department Routes
Route::prefix('departments')->name('departments.')->group(function () {
    Route::get('/', 'DepartmentController@index')->name('index');
    Route::get('/create', 'DepartmentController@create')->name('create');
    Route::post('/', 'DepartmentController@store')->name('store');
    Route::get('/{department}', 'DepartmentController@show')->name('show');
    Route::get('/{department}/edit', 'DepartmentController@edit')->name('edit');
    Route::put('/{department}', 'DepartmentController@update')->name('update');
    Route::delete('/{department}', 'DepartmentController@destroy')->name('destroy');
});

// Designation Routes
Route::prefix('designations')->name('designations.')->group(function () {
    Route::get('/', 'DesignationController@index')->name('index');
    Route::get('/create', 'DesignationController@create')->name('create');
    Route::post('/', 'DesignationController@store')->name('store');
    Route::get('/{designation}', 'DesignationController@show')->name('show');
    Route::get('/{designation}/edit', 'DesignationController@edit')->name('edit');
    Route::put('/{designation}', 'DesignationController@update')->name('update');
    Route::delete('/{designation}', 'DesignationController@destroy')->name('destroy');
});

// Attendance Routes (if feature enabled)
if (config('aero-hrm.features.attendance', true)) {
    Route::prefix('attendance')->name('attendance.')->group(function () {
        Route::get('/', 'AttendanceController@index')->name('index');
        Route::post('/punch-in', 'AttendanceController@punchIn')->name('punch-in');
        Route::post('/punch-out', 'AttendanceController@punchOut')->name('punch-out');
        Route::get('/report', 'AttendanceController@report')->name('report');
    });
}

// Leave Routes (if feature enabled)
if (config('aero-hrm.features.leave', true)) {
    Route::prefix('leaves')->name('leaves.')->group(function () {
        Route::get('/', 'LeaveController@index')->name('index');
        Route::get('/create', 'LeaveController@create')->name('create');
        Route::post('/', 'LeaveController@store')->name('store');
        Route::get('/{leave}', 'LeaveController@show')->name('show');
        Route::post('/{leave}/approve', 'LeaveController@approve')->name('approve');
        Route::post('/{leave}/reject', 'LeaveController@reject')->name('reject');
    });
}

// Payroll Routes (if feature enabled)
if (config('aero-hrm.features.payroll', true)) {
    Route::prefix('payroll')->name('payroll.')->group(function () {
        Route::get('/', 'PayrollController@index')->name('index');
        Route::get('/generate', 'PayrollController@generate')->name('generate');
        Route::post('/process', 'PayrollController@process')->name('process');
    });
}
