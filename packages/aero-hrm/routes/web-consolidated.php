<?php

use Aero\HRM\Http\Controllers\Attendance\AttendanceController;
use Aero\HRM\Http\Controllers\Employee\BenefitsController;
use Aero\HRM\Http\Controllers\Employee\DepartmentController;
use Aero\HRM\Http\Controllers\Employee\DesignationController;
use Aero\HRM\Http\Controllers\Employee\EducationController;
use Aero\HRM\Http\Controllers\Employee\EmployeeController;
use Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController;
use Aero\HRM\Http\Controllers\Employee\EmployeeProfileController;
use Aero\HRM\Http\Controllers\Employee\EmployeeSelfServiceController;
use Aero\HRM\Http\Controllers\Employee\ExperienceController;
use Aero\HRM\Http\Controllers\Employee\HrAnalyticsController;
use Aero\HRM\Http\Controllers\Employee\HrDocumentController;
use Aero\HRM\Http\Controllers\Employee\LetterController;
use Aero\HRM\Http\Controllers\Employee\OnboardingController;
use Aero\HRM\Http\Controllers\Employee\PayrollController;
use Aero\HRM\Http\Controllers\Employee\PerformanceController;
use Aero\HRM\Http\Controllers\Employee\ProfileController;
use Aero\HRM\Http\Controllers\Employee\ProfileImageController;
use Aero\HRM\Http\Controllers\Employee\SkillsController;
use Aero\HRM\Http\Controllers\Employee\TimeOffController;
use Aero\HRM\Http\Controllers\Employee\TimeOffLegacyController;
use Aero\HRM\Http\Controllers\Employee\TimeOffManagementController;
use Aero\HRM\Http\Controllers\Employee\TrainingController;
use Aero\HRM\Http\Controllers\Employee\WorkplaceSafetyController;
use Aero\HRM\Http\Controllers\Employee\HolidayController;
use Aero\HRM\Http\Controllers\Leave\BulkLeaveController;
use Aero\HRM\Http\Controllers\Leave\LeaveController;
use Aero\HRM\Http\Controllers\Settings\LeaveSettingController;
use Aero\HRM\Http\Controllers\Performance\PerformanceReviewController;
use Aero\HRM\Http\Controllers\Recruitment\RecruitmentController;
use Aero\HRM\Http\Controllers\Settings\AttendanceSettingController;
use Aero\HRM\Http\Controllers\Settings\HrmSettingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Aero HRM Routes
|--------------------------------------------------------------------------
|
| All routes for the Aero HRM package including:
| - Employee Management
| - Attendance & Leave
| - Payroll & Performance
| - Recruitment & Training
|
| Route Naming Convention:
| - All route names automatically get 'hrm.' prefix from service provider
| - Paths automatically get /hrm prefix from service provider
| - Routes here should NOT add additional prefixes
|
| Service Provider Configuration:
| - Prefix: 'hrm' (path: /hrm/*)
| - Name: 'hrm.' (names: hrm.*)
| - Middleware: ['web', 'auth'] (standalone) or ['web', 'tenant', 'auth'] (SaaS)
|
| These routes are automatically registered by the AeroHrmServiceProvider.
|
*/

// ============================================================================
// PUBLIC/GLOBAL HRM ROUTES (Outside main group)
// ============================================================================

// Leave Summary - Accessible without hrm prefix
Route::middleware(['auth', 'verified', 'module:hrm,time-off'])
    ->get('/leave-summary', [LeaveController::class, 'summary'])
    ->name('leave.summary');

// Profile Search - For admin/cross-module usage
Route::middleware(['auth', 'verified', 'module:hrm,employees'])
    ->get('/profiles/search', [ProfileController::class, 'search'])
    ->name('profiles.search');

// ============================================================================
// AUTHENTICATED HRM ROUTES
// ============================================================================
// Note: Service provider adds 'hrm.' prefix to all names automatically
Route::middleware(['auth', 'verified'])->group(function () {
    
    // ========================================================================
    // HR DASHBOARD
    // ========================================================================
    Route::middleware(['module:hrm,dashboard'])
        ->get('/dashboard', [PerformanceReviewController::class, 'dashboard'])
        ->name('dashboard');

