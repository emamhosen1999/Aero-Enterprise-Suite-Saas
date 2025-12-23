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
use Aero\HRM\Http\Controllers\Performance\GoalController;
use Aero\HRM\Http\Controllers\Performance\SkillMatrixController;
use Aero\HRM\Http\Controllers\Recruitment\RecruitmentController;
use Aero\HRM\Http\Controllers\Settings\AttendanceSettingController;
use Aero\HRM\Http\Controllers\Settings\HrmSettingController;
use Aero\Core\Http\Controllers\Auth\UserController;
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
| - All paths automatically get /hrm prefix from service provider
| - Routes defined here should NOT add additional 'hr.' prefix
|
| Service Provider Configuration:
| - Prefix: 'hrm' (results in paths: /hrm/*)
| - Name: 'hrm.' (results in names: hrm.*)
| - Middleware: ['web', 'auth'] (standalone) or ['web', 'tenant', 'auth'] (SaaS)
|
| Examples:
| - Route defined as: Route::get('/dashboard', ...)->name('dashboard')
| - Actual route: /hrm/dashboard (name: hrm.dashboard)
|
| These routes are automatically registered by the AeroHrmServiceProvider.
|
*/

// ============================================================================
// PUBLIC/GLOBAL HRM ROUTES (No module prefix)
// ============================================================================

// Leave Summary Route - Accessible without hrm prefix (backward compatibility)
Route::middleware(['auth', 'verified', 'module:hrm,time-off'])
    ->get('/leave-summary', [LeaveController::class, 'summary'])
    ->name('leave.summary');

// Profile search for admin usage (cross-module functionality)
Route::middleware(['auth', 'verified', 'module:hrm,employees'])
    ->get('/profiles/search', [ProfileController::class, 'search'])
    ->name('profiles.search');

// ============================================================================
// AUTHENTICATED HRM ROUTES
// ============================================================================
// Note: Service provider adds 'hrm.' prefix and '/hrm' path automatically
Route::middleware(['auth', 'verified'])->group(function () {
    // HR Dashboard
    Route::middleware(['module:hrm,dashboard'])
        ->get('/dashboard', [PerformanceReviewController::class, 'dashboard'])
        ->name('dashboard');

    // Performance Management
    Route::middleware(['module:hrm,performance'])->group(function () {
        Route::get('/performance', [PerformanceReviewController::class, 'index'])->name('performance.index');
        Route::get('/performance/create', [PerformanceReviewController::class, 'create'])->name('performance.create');
        Route::post('/performance', [PerformanceReviewController::class, 'store'])->name('performance.store');
        Route::get('/performance/{id}', [PerformanceReviewController::class, 'show'])->name('performance.show');
        Route::get('/performance/{id}/edit', [PerformanceReviewController::class, 'edit'])->name('performance.edit');
        Route::put('/performance/{id}', [PerformanceReviewController::class, 'update'])->name('performance.update');
        Route::delete('/performance/{id}', [PerformanceReviewController::class, 'destroy'])->name('performance.destroy');

        // Performance Templates
        Route::get('/performance/templates', [PerformanceReviewController::class, 'templates'])->name('performance.templates.index');
        Route::get('/performance/templates/create', [PerformanceReviewController::class, 'createTemplate'])->name('performance.templates.create');
        Route::post('/performance/templates', [PerformanceReviewController::class, 'storeTemplate'])->name('performance.templates.store');
        Route::get('/performance/templates/{id}', [PerformanceReviewController::class, 'showTemplate'])->name('performance.templates.show');
        Route::get('/performance/templates/{id}/edit', [PerformanceReviewController::class, 'editTemplate'])->name('performance.templates.edit');
        Route::put('/performance/templates/{id}', [PerformanceReviewController::class, 'updateTemplate'])->name('performance.templates.update');
        Route::delete('/performance/templates/{id}', [PerformanceReviewController::class, 'destroyTemplate'])->name('performance.templates.destroy');

        // =====================================================================
        // GOALS (OKR) Management
        // =====================================================================
        Route::prefix('goals')->name('goals.')->group(function () {
            Route::get('/', [GoalController::class, 'index'])->name('index');
            Route::get('/create', [GoalController::class, 'create'])->name('create');
            Route::post('/', [GoalController::class, 'store'])->name('store');
            Route::get('/team', [GoalController::class, 'teamGoals'])->name('team');
            Route::get('/analytics', [GoalController::class, 'analytics'])->name('analytics');
            Route::get('/{goalId}', [GoalController::class, 'show'])->name('show');
            Route::put('/{goalId}', [GoalController::class, 'update'])->name('update');
            Route::delete('/{goalId}', [GoalController::class, 'destroy'])->name('destroy');
            Route::post('/{goalId}/check-in', [GoalController::class, 'checkIn'])->name('check-in');
            Route::put('/{goalId}/key-results/{keyResultId}', [GoalController::class, 'updateKeyResult'])->name('key-results.update');
        });

        // =====================================================================
        // COMPETENCIES & SKILL MATRIX
        // =====================================================================
        Route::prefix('competencies')->name('competencies.')->group(function () {
            Route::get('/', [SkillMatrixController::class, 'index'])->name('index');
            Route::post('/', [SkillMatrixController::class, 'store'])->name('store');
            Route::put('/{competencyId}', [SkillMatrixController::class, 'update'])->name('update');
            Route::delete('/{competencyId}', [SkillMatrixController::class, 'destroy'])->name('destroy');
            Route::get('/role-frameworks', [SkillMatrixController::class, 'roleFrameworks'])->name('role-frameworks');
            Route::post('/role-frameworks', [SkillMatrixController::class, 'createRoleFramework'])->name('role-frameworks.store');
            Route::get('/team-matrix', [SkillMatrixController::class, 'teamMatrix'])->name('team-matrix');
            Route::get('/analytics', [SkillMatrixController::class, 'analytics'])->name('analytics');
            Route::get('/employees/{employeeId}', [SkillMatrixController::class, 'employeeProfile'])->name('employee-profile');
            Route::post('/employees/{employeeId}/{competencyId}/assess', [SkillMatrixController::class, 'assessCompetency'])->name('assess');
            Route::get('/employees/{employeeId}/gap-analysis', [SkillMatrixController::class, 'gapAnalysis'])->name('gap-analysis');
            Route::post('/employees/{employeeId}/{competencyId}/endorse', [SkillMatrixController::class, 'endorse'])->name('endorse');
        });
    });

    // Training Management
    Route::middleware(['module:hrm,training'])->group(function () {
        Route::get('/training', [TrainingController::class, 'index'])->name('training.index');
        Route::get('/training/create', [TrainingController::class, 'create'])->name('training.create');
        Route::post('/training', [TrainingController::class, 'store'])->name('training.store');
        Route::get('/training/{id}', [TrainingController::class, 'show'])->name('training.show');
        Route::get('/training/{id}/edit', [TrainingController::class, 'edit'])->name('training.edit');
        Route::put('/training/{id}', [TrainingController::class, 'update'])->name('training.update');
        Route::delete('/training/{id}', [TrainingController::class, 'destroy'])->name('training.destroy');

        // Training Categories
        Route::get('/training/categories', [TrainingController::class, 'categories'])->name('training.categories.index');
        Route::post('/training/categories', [TrainingController::class, 'storeCategory'])->name('training.categories.store');
        Route::put('/training/categories/{id}', [TrainingController::class, 'updateCategory'])->name('training.categories.update');
        Route::delete('/training/categories/{id}', [TrainingController::class, 'destroyCategory'])->name('training.categories.destroy');

        // Training Materials
        Route::get('/training/{id}/materials', [TrainingController::class, 'materials'])->name('training.materials.index');
        Route::post('/training/{id}/materials', [TrainingController::class, 'storeMaterial'])->name('training.materials.store');
        Route::put('/training/{id}/materials/{materialId}', [TrainingController::class, 'updateMaterial'])->name('training.materials.update');
        Route::delete('/training/{id}/materials/{materialId}', [TrainingController::class, 'destroyMaterial'])->name('training.materials.destroy');

        // Training Enrollment
        Route::get('/training/{id}/enrollments', [TrainingController::class, 'enrollments'])->name('training.enrollments.index');
        Route::post('/training/{id}/enrollments', [TrainingController::class, 'storeEnrollment'])->name('training.enrollments.store');
        Route::put('/training/{id}/enrollments/{enrollmentId}', [TrainingController::class, 'updateEnrollment'])->name('training.enrollments.update');
        Route::delete('/training/{id}/enrollments/{enrollmentId}', [TrainingController::class, 'destroyEnrollment'])->name('training.enrollments.destroy');
    });

    // Recruitment Management
    Route::middleware(['module:hrm,recruitment'])->group(function () {
        Route::get('/recruitment', [RecruitmentController::class, 'index'])->name('recruitment.index');
        Route::post('/recruitment', [RecruitmentController::class, 'store'])->name('recruitment.store');
        Route::get('/recruitment/{id}', [RecruitmentController::class, 'show'])->name('recruitment.show');
        Route::get('/recruitment/{id}/edit', [RecruitmentController::class, 'edit'])->name('recruitment.edit');
        Route::put('/recruitment/{id}', [RecruitmentController::class, 'update'])->name('recruitment.update');
        Route::delete('/recruitment/{id}', [RecruitmentController::class, 'destroy'])->name('recruitment.destroy');

        // Kanban Board View
        Route::get('/recruitment/{id}/kanban', [RecruitmentController::class, 'kanban'])->name('recruitment.kanban');

        // AJAX API routes for modal operations
        Route::put('/recruitment/{id}/ajax', [RecruitmentController::class, 'updateAjax'])->name('recruitment.update.ajax');
        Route::post('/recruitment/ajax', [RecruitmentController::class, 'storeAjax'])->name('recruitment.store.ajax');

        // AJAX/Data Routes for SPA refreshes
        Route::get('/recruitment/data', [RecruitmentController::class, 'indexData'])->name('recruitment.data.index');
        Route::get('/recruitment/{id}/data', [RecruitmentController::class, 'showData'])->name('recruitment.data.show');
        Route::get('/recruitment/{id}/applications/data', [RecruitmentController::class, 'applicationsData'])->name('recruitment.data.applications');

        // Job status management
        Route::post('/recruitment/{id}/publish', [RecruitmentController::class, 'publish'])->name('recruitment.publish');
        Route::post('/recruitment/{id}/unpublish', [RecruitmentController::class, 'unpublish'])->name('recruitment.unpublish');
        Route::post('/recruitment/{id}/close', [RecruitmentController::class, 'close'])->name('recruitment.close');

        // Statistics and Reports
        Route::get('/recruitment/statistics', [RecruitmentController::class, 'getStatistics'])->name('recruitment.statistics');
        Route::get('/recruitment/{id}/report', [RecruitmentController::class, 'generateJobReport'])->name('recruitment.report');
        Route::get('/recruitment/{id}/applications/export', [RecruitmentController::class, 'exportApplications'])->name('recruitment.applications.export');

        // Job Applications
        Route::get('/recruitment/{id}/applications', [RecruitmentController::class, 'applications'])->name('recruitment.applications.index');
        Route::get('/recruitment/{id}/applications/create', [RecruitmentController::class, 'createApplication'])->name('recruitment.applications.create');
        Route::post('/recruitment/{id}/applications', [RecruitmentController::class, 'storeApplication'])->name('recruitment.applications.store');
        Route::get('/recruitment/{id}/applications/{applicationId}', [RecruitmentController::class, 'showApplication'])->name('recruitment.applications.show');
        Route::put('/recruitment/{id}/applications/{applicationId}', [RecruitmentController::class, 'updateApplication'])->name('recruitment.applications.update');
        Route::delete('/recruitment/{id}/applications/{applicationId}', [RecruitmentController::class, 'destroyApplication'])->name('recruitment.applications.destroy');

        // Application Stage Update (for Kanban drag & drop)
        Route::put('/recruitment/{id}/applications/{applicationId}/stage', [RecruitmentController::class, 'updateStage'])->name('recruitment.applications.update-stage');

        // Bulk Operations
        Route::patch('/recruitment/applications/bulk-update', [RecruitmentController::class, 'bulkUpdateApplications'])->name('recruitment.applications.bulk-update');

        // Interviews
        Route::get('/recruitment/{id}/applications/{applicationId}/interviews', [RecruitmentController::class, 'interviews'])->name('recruitment.interviews.index');
        Route::post('/recruitment/{id}/applications/{applicationId}/interviews', [RecruitmentController::class, 'storeInterview'])->name('recruitment.interviews.store');
        Route::put('/recruitment/{id}/applications/{applicationId}/interviews/{interviewId}', [RecruitmentController::class, 'updateInterview'])->name('recruitment.interviews.update');
        Route::delete('/recruitment/{id}/applications/{applicationId}/interviews/{interviewId}', [RecruitmentController::class, 'destroyInterview'])->name('recruitment.interviews.destroy');
    });

    // Employee Onboarding & Offboarding
    Route::middleware(['module:hrm,onboarding'])->group(function () {
        Route::get('/onboarding', [OnboardingController::class, 'index'])->name('onboarding.index');
        Route::get('/onboarding/create', [OnboardingController::class, 'create'])->name('onboarding.create');
        Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
        Route::get('/onboarding/{id}', [OnboardingController::class, 'show'])->name('onboarding.show');
        Route::get('/onboarding/{id}/edit', [OnboardingController::class, 'edit'])->name('onboarding.edit');
        Route::put('/onboarding/{id}', [OnboardingController::class, 'update'])->name('onboarding.update');
        Route::delete('/onboarding/{id}', [OnboardingController::class, 'destroy'])->name('onboarding.destroy');

        // Onboarding Wizard
        Route::get('/onboarding/wizard/{employee}', [OnboardingController::class, 'wizard'])->name('onboarding.wizard');
        Route::post('/onboarding/wizard/{employee}/personal', [OnboardingController::class, 'savePersonal'])->name('onboarding.save-personal');
        Route::post('/onboarding/wizard/{employee}/job', [OnboardingController::class, 'saveJob'])->name('onboarding.save-job');
        Route::post('/onboarding/wizard/{employee}/documents', [OnboardingController::class, 'saveDocuments'])->name('onboarding.save-documents');
        Route::post('/onboarding/wizard/{employee}/bank', [OnboardingController::class, 'saveBank'])->name('onboarding.save-bank');
        Route::post('/onboarding/wizard/{employee}/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');

        // Offboarding
        Route::get('/offboarding', [OnboardingController::class, 'offboardingIndex'])->name('offboarding.index');
        Route::get('/offboarding/create', [OnboardingController::class, 'createOffboarding'])->name('offboarding.create');
        Route::post('/offboarding', [OnboardingController::class, 'storeOffboarding'])->name('offboarding.store');
        Route::get('/offboarding/{id}', [OnboardingController::class, 'showOffboarding'])->name('offboarding.show');
        Route::put('/offboarding/{id}', [OnboardingController::class, 'updateOffboarding'])->name('offboarding.update');
        Route::delete('/offboarding/{id}', [OnboardingController::class, 'destroyOffboarding'])->name('offboarding.destroy');

        // Checklists
        Route::get('/checklists', [OnboardingController::class, 'checklists'])->name('checklists.index');
        Route::post('/checklists', [OnboardingController::class, 'storeChecklist'])->name('checklists.store');
        Route::put('/checklists/{id}', [OnboardingController::class, 'updateChecklist'])->name('checklists.update');
        Route::delete('/checklists/{id}', [OnboardingController::class, 'destroyChecklist'])->name('checklists.destroy');
    });

    // Skills & Competency Management
    Route::middleware(['module:hrm,employees,skills'])->group(function () {
        Route::get('/skills', [SkillsController::class, 'index'])->name('skills.index');
        Route::post('/skills', [SkillsController::class, 'store'])->name('skills.store');
        Route::put('/skills/{id}', [SkillsController::class, 'update'])->name('skills.update');
        Route::delete('/skills/{id}', [SkillsController::class, 'destroy'])->name('skills.destroy');

        // Competencies
        Route::get('/competencies', [SkillsController::class, 'competencies'])->name('competencies.index');
        Route::post('/competencies', [SkillsController::class, 'storeCompetency'])->name('competencies.store');
        Route::put('/competencies/{id}', [SkillsController::class, 'updateCompetency'])->name('competencies.update');
        Route::delete('/competencies/{id}', [SkillsController::class, 'destroyCompetency'])->name('competencies.destroy');

        // Employee Skills
        Route::get('/employee-skills/{employeeId}', [SkillsController::class, 'employeeSkills'])->name('employee.skills.index');
        Route::post('/employee-skills/{employeeId}', [SkillsController::class, 'storeEmployeeSkill'])->name('employee.skills.store');
        Route::put('/employee-skills/{employeeId}/{skillId}', [SkillsController::class, 'updateEmployeeSkill'])->name('employee.skills.update');
        Route::delete('/employee-skills/{employeeId}/{skillId}', [SkillsController::class, 'destroyEmployeeSkill'])->name('employee.skills.destroy');
    });

    // Time Off Management (Industry Standard)
    Route::middleware(['module:hrm,time-off'])->group(function () {
        // Time Off Dashboard
        Route::get('/time-off', [TimeOffManagementController::class, 'index'])->name('timeoff.index');
        Route::get('/time-off/dashboard', [TimeOffManagementController::class, 'index'])->name('timeoff.dashboard');

        // Company Holidays Management
        Route::get('/time-off/holidays', [TimeOffManagementController::class, 'holidays'])->name('timeoff.holidays');

        // Leave Requests Management
        Route::get('/time-off/leave-requests', [TimeOffManagementController::class, 'leaveRequests'])->name('timeoff.leave-requests');

        // Time Off Calendar
        Route::get('/time-off/calendar', [TimeOffManagementController::class, 'calendar'])->name('timeoff.calendar');

        // Leave Balances
        Route::get('/time-off/balances', [TimeOffManagementController::class, 'balances'])->name('timeoff.balances');

        // Time Off Reports
        Route::get('/time-off/reports', [TimeOffManagementController::class, 'reports'])->name('timeoff.reports');

        // Employee Self-Service Time Off
        Route::get('/time-off/employee-requests', [TimeOffManagementController::class, 'employeeRequests'])->name('timeoff.employee-requests');
    });

    // Legacy Time Off routes (for backward compatibility)
    Route::middleware(['module:hrm,time-off'])->group(function () {
        Route::get('/time-off-legacy', [TimeOffController::class, 'index'])->name('timeoff-legacy.index');
        Route::get('/time-off-legacy/calendar', [TimeOffController::class, 'calendar'])->name('timeoff-legacy.calendar');
        Route::get('/time-off-legacy/approvals', [TimeOffController::class, 'approvals'])->name('timeoff-legacy.approvals');
        Route::post('/time-off-legacy/{id}/approve', [TimeOffController::class, 'approve'])->name('timeoff-legacy.approve');
        Route::post('/time-off-legacy/{id}/reject', [TimeOffController::class, 'reject'])->name('timeoff-legacy.reject');
        Route::get('/time-off-legacy/reports', [TimeOffController::class, 'reports'])->name('timeoff-legacy.reports');
        Route::get('/time-off-legacy/settings', [TimeOffController::class, 'settings'])->name('timeoff-legacy.settings');
        Route::put('/time-off-legacy/settings', [TimeOffController::class, 'updateSettings'])->name('timeoff-legacy.settings.update');
    });

    // Employee Benefits Administration
    Route::middleware(['module:hrm,employees,benefits'])->group(function () {
        Route::get('/benefits', [BenefitsController::class, 'index'])->name('benefits.index');
        Route::get('/benefits/create', [BenefitsController::class, 'create'])->name('benefits.create');
        Route::post('/benefits', [BenefitsController::class, 'store'])->name('benefits.store');
        Route::get('/benefits/{id}', [BenefitsController::class, 'show'])->name('benefits.show');
        Route::get('/benefits/{id}/edit', [BenefitsController::class, 'edit'])->name('benefits.edit');
        Route::put('/benefits/{id}', [BenefitsController::class, 'update'])->name('benefits.update');
        Route::delete('/benefits/{id}', [BenefitsController::class, 'destroy'])->name('benefits.destroy');

        // Employee Benefits
        Route::get('/employee-benefits/{employeeId}', [BenefitsController::class, 'employeeBenefits'])->name('employee.benefits.index');
        Route::post('/employee-benefits/{employeeId}', [BenefitsController::class, 'assignBenefit'])->name('employee.benefits.assign');
        Route::put('/employee-benefits/{employeeId}/{benefitId}', [BenefitsController::class, 'updateEmployeeBenefit'])->name('employee.benefits.update');
        Route::delete('/employee-benefits/{employeeId}/{benefitId}', [BenefitsController::class, 'removeEmployeeBenefit'])->name('employee.benefits.remove');
    });

    // Enhanced Time-off Management
    Route::middleware(['module:hrm,time-off'])->group(function () {
        Route::get('/time-off', [TimeOffController::class, 'index'])->name('timeoff.index');
        Route::get('/time-off/calendar', [TimeOffController::class, 'calendar'])->name('timeoff.calendar');
        Route::get('/time-off/approvals', [TimeOffController::class, 'approvals'])->name('timeoff.approvals');
        Route::post('/time-off/approve/{id}', [TimeOffController::class, 'approve'])->name('timeoff.approve');
        Route::post('/time-off/reject/{id}', [TimeOffController::class, 'reject'])->name('timeoff.reject');
        Route::get('/time-off/reports', [TimeOffController::class, 'reports'])->name('timeoff.reports');
        Route::get('/time-off/settings', [TimeOffController::class, 'settings'])->name('timeoff.settings');
        Route::put('/time-off/settings', [TimeOffController::class, 'updateSettings'])->name('timeoff.settings.update');
    });

    // Workplace Health & Safety
    Route::middleware(['module:hrm,safety'])->group(function () {
        Route::get('/safety', [WorkplaceSafetyController::class, 'index'])->name('safety.index');
        Route::get('/safety/incidents', [WorkplaceSafetyController::class, 'incidents'])->name('safety.incidents.index');
        Route::get('/safety/incidents/create', [WorkplaceSafetyController::class, 'createIncident'])->name('safety.incidents.create');
        Route::post('/safety/incidents', [WorkplaceSafetyController::class, 'storeIncident'])->name('safety.incidents.store');
        Route::get('/safety/incidents/{id}', [WorkplaceSafetyController::class, 'showIncident'])->name('safety.incidents.show');
        Route::put('/safety/incidents/{id}', [WorkplaceSafetyController::class, 'updateIncident'])->name('safety.incidents.update');

        // Safety Inspections
        Route::get('/safety/inspections', [WorkplaceSafetyController::class, 'inspections'])->name('safety.inspections.index');
        Route::get('/safety/inspections/create', [WorkplaceSafetyController::class, 'createInspection'])->name('safety.inspections.create');
        Route::post('/safety/inspections', [WorkplaceSafetyController::class, 'storeInspection'])->name('safety.inspections.store');
        Route::get('/safety/inspections/{id}', [WorkplaceSafetyController::class, 'showInspection'])->name('safety.inspections.show');
        Route::put('/safety/inspections/{id}', [WorkplaceSafetyController::class, 'updateInspection'])->name('safety.inspections.update');

        // Safety Training
        Route::get('/safety/training', [WorkplaceSafetyController::class, 'training'])->name('safety.training.index');
        Route::get('/safety/training/create', [WorkplaceSafetyController::class, 'createTraining'])->name('safety.training.create');
        Route::post('/safety/training', [WorkplaceSafetyController::class, 'storeTraining'])->name('safety.training.store');
        Route::get('/safety/training/{id}', [WorkplaceSafetyController::class, 'showTraining'])->name('safety.training.show');
        Route::put('/safety/training/{id}', [WorkplaceSafetyController::class, 'updateTraining'])->name('safety.training.update');
    });

    // HR Analytics & Reporting
    Route::middleware(['module:hrm,hr-reports'])->group(function () {
        Route::get('/analytics', [HrAnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('/analytics/attendance', [HrAnalyticsController::class, 'attendanceAnalytics'])->name('analytics.attendance');
        Route::get('/analytics/performance', [HrAnalyticsController::class, 'performanceAnalytics'])->name('analytics.performance');
        Route::get('/analytics/recruitment', [HrAnalyticsController::class, 'recruitmentAnalytics'])->name('analytics.recruitment');
        Route::get('/analytics/turnover', [HrAnalyticsController::class, 'turnoverAnalytics'])->name('analytics.turnover');
        Route::get('/analytics/training', [HrAnalyticsController::class, 'trainingAnalytics'])->name('analytics.training');
        Route::get('/analytics/reports', [HrAnalyticsController::class, 'reports'])->name('analytics.reports');
        Route::post('/analytics/reports/generate', [HrAnalyticsController::class, 'generateReport'])->name('analytics.reports.generate');
    });

    // HR Document Management
    Route::middleware(['module:hrm,documents'])->group(function () {
        Route::get('/documents', [HrDocumentController::class, 'index'])->name('documents.index');
        Route::get('/documents/create', [HrDocumentController::class, 'create'])->name('documents.create');
        Route::post('/documents', [HrDocumentController::class, 'store'])->name('documents.store');
        Route::get('/documents/{id}', [HrDocumentController::class, 'show'])->name('documents.show');
        Route::put('/documents/{id}', [HrDocumentController::class, 'update'])->name('documents.update');
        Route::delete('/documents/{id}', [HrDocumentController::class, 'destroy'])->name('documents.destroy');

        // Document Categories
        Route::get('/document-categories', [HrDocumentController::class, 'categories'])->name('documents.categories.index');
        Route::post('/document-categories', [HrDocumentController::class, 'storeCategory'])->name('documents.categories.store');
        Route::put('/document-categories/{id}', [HrDocumentController::class, 'updateCategory'])->name('documents.categories.update');
        Route::delete('/document-categories/{id}', [HrDocumentController::class, 'destroyCategory'])->name('documents.categories.destroy');

        // Employee Documents
        Route::get('/employee-documents/{employeeId}', [HrDocumentController::class, 'employeeDocuments'])->name('employee.documents.index');
        Route::post('/employee-documents/{employeeId}', [HrDocumentController::class, 'storeEmployeeDocument'])->name('employee.documents.store');
        Route::get('/employee-documents/{employeeId}/{documentId}', [HrDocumentController::class, 'showEmployeeDocument'])->name('employee.documents.show');
        Route::delete('/employee-documents/{employeeId}/{documentId}', [HrDocumentController::class, 'destroyEmployeeDocument'])->name('employee.documents.destroy');
    });

    // Enhanced Employee Self-Service Portal
    Route::middleware(['module:hrm,employees,self-service'])->group(function () {
        Route::get('/self-service', [EmployeeSelfServiceController::class, 'index'])->name('selfservice.index');
        Route::get('/self-service/profile', [EmployeeSelfServiceController::class, 'profile'])->name('selfservice.profile');
        Route::put('/self-service/profile', [EmployeeSelfServiceController::class, 'updateProfile'])->name('selfservice.profile.update');
        Route::get('/self-service/documents', [EmployeeSelfServiceController::class, 'documents'])->name('selfservice.documents');
        Route::get('/self-service/benefits', [EmployeeSelfServiceController::class, 'benefits'])->name('selfservice.benefits');
        Route::get('/self-service/time-off', [EmployeeSelfServiceController::class, 'timeOff'])->name('selfservice.timeoff');
        Route::post('/self-service/time-off', [EmployeeSelfServiceController::class, 'requestTimeOff'])->name('selfservice.timeoff.request');
        Route::get('/self-service/trainings', [EmployeeSelfServiceController::class, 'trainings'])->name('selfservice.trainings');
        Route::get('/self-service/payslips', [EmployeeSelfServiceController::class, 'payslips'])->name('selfservice.payslips');
        Route::get('/self-service/performance', [EmployeeSelfServiceController::class, 'performance'])->name('selfservice.performance');
    });

    // Payroll Management System
    Route::middleware(['module:hrm,payroll'])->group(function () {
        Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');
        Route::get('/payroll/create', [PayrollController::class, 'create'])->name('payroll.create');
        Route::post('/payroll', [PayrollController::class, 'store'])->name('payroll.store');
        Route::get('/payroll/{id}', [PayrollController::class, 'show'])->name('payroll.show');
        Route::get('/payroll/{id}/edit', [PayrollController::class, 'edit'])->name('payroll.edit');
        Route::put('/payroll/{id}', [PayrollController::class, 'update'])->name('payroll.update');
        Route::delete('/payroll/{id}', [PayrollController::class, 'destroy'])->name('payroll.destroy');

        // Process Payroll
        Route::post('/payroll/{id}/process', [PayrollController::class, 'processPayroll'])->name('payroll.process');

        // Bulk Operations
        Route::post('/payroll/bulk/generate', [PayrollController::class, 'bulkGenerate'])->name('payroll.bulk.generate');
        Route::post('/payroll/bulk/process', [PayrollController::class, 'bulkProcess'])->name('payroll.bulk.process');

        // Payslips
        Route::get('/payroll/{id}/payslip', [PayrollController::class, 'viewPayslip'])->name('payroll.payslip.view');
        Route::post('/payroll/{id}/payslip/generate', [PayrollController::class, 'generatePayslip'])->name('payroll.payslip.generate');
        Route::post('/payroll/payslips/bulk-generate', [PayrollController::class, 'bulkGeneratePayslips'])->name('payroll.payslips.bulk.generate');
        Route::get('/payroll/{id}/payslip/download', [PayrollController::class, 'downloadPayslip'])->name('payroll.payslip.download');
        Route::post('/payroll/{id}/payslip/email', [PayrollController::class, 'sendPayslipEmail'])->name('payroll.payslip.email');

        // Reports
        Route::get('/payroll/reports', [PayrollController::class, 'reports'])->name('payroll.reports');
        Route::post('/payroll/reports/monthly-summary', [PayrollController::class, 'monthlySummaryReport'])->name('payroll.reports.monthly');
        Route::post('/payroll/reports/tax', [PayrollController::class, 'taxReport'])->name('payroll.reports.tax');
        Route::post('/payroll/reports/bank-transfer', [PayrollController::class, 'bankTransferReport'])->name('payroll.reports.bank');
        Route::post('/payroll/reports/statutory', [PayrollController::class, 'statutoryReport'])->name('payroll.reports.statutory');
    });

    // Employee Management - Core CRUD operations
    Route::middleware(['module:hrm,employees'])->group(function () {
        Route::get('/employees', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'index'])->name('employees.index');
        Route::get('/employees/paginate', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'paginate'])->name('employees.paginate');
        Route::get('/employees/stats', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'stats'])->name('employees.stats');
        Route::get('/employees/pending-onboarding', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'getPendingOnboarding'])->name('employees.pending-onboarding');
        Route::get('/employees/onboarding-analytics', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'getOnboardingAnalytics'])->name('employees.onboarding-analytics');
        Route::post('/employees', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'store'])->name('employees.store');
        Route::post('/employees/onboard', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'onboard'])->name('employees.onboard');
        Route::post('/employees/onboard-bulk', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'bulkOnboard'])->name('employees.onboard-bulk');
        Route::get('/employees/{id}', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'show'])->name('employees.show');
        Route::put('/employees/{id}', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{id}', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'destroy'])->name('employees.destroy');
        Route::post('/employees/{id}/restore', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'restore'])->name('employees.restore');
    });

    // Employee Profile Management (Bank Details, Emergency Contacts)
    Route::middleware(['module:hrm,employees'])->prefix('employees/{user}')->name('employees.')->group(function () {
        // Profile Overview
        Route::get('/profile', [\Aero\HRM\Http\Controllers\Employee\EmployeeProfileController::class, 'show'])->name('profile.show');
        Route::get('/profile/edit', [\Aero\HRM\Http\Controllers\Employee\EmployeeProfileController::class, 'edit'])->name('profile.edit');
        Route::put('/profile', [\Aero\HRM\Http\Controllers\Employee\EmployeeProfileController::class, 'update'])->name('profile.update');

        // Bank Details
        Route::get('/bank-details', [\Aero\HRM\Http\Controllers\Employee\EmployeeProfileController::class, 'getBankDetails'])->name('bank-details.show');
        Route::post('/bank-details/verify', [\Aero\HRM\Http\Controllers\Employee\EmployeeProfileController::class, 'verifyBankDetails'])
            ->middleware('module:hrm,employees,verify')
            ->name('bank-details.verify');

        // Emergency Contacts
        Route::get('/emergency-contacts', [\Aero\HRM\Http\Controllers\Employee\EmployeeProfileController::class, 'getEmergencyContacts'])->name('emergency-contacts.index');
        Route::post('/emergency-contacts', [\Aero\HRM\Http\Controllers\Employee\EmployeeProfileController::class, 'addEmergencyContact'])->name('emergency-contacts.store');
        Route::delete('/emergency-contacts/{contact}', [\Aero\HRM\Http\Controllers\Employee\EmployeeProfileController::class, 'deleteEmergencyContact'])->name('emergency-contacts.destroy');

        // Document Management
        Route::get('/documents', [\Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController::class, 'index'])->name('documents.index');
        Route::post('/documents', [\Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController::class, 'store'])->name('documents.store');
        Route::get('/documents/{document}', [\Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController::class, 'show'])->name('documents.show');
        Route::get('/documents/{document}/download', [\Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController::class, 'download'])->name('documents.download');
        Route::put('/documents/{document}', [\Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController::class, 'update'])->name('documents.update');
        Route::delete('/documents/{document}', [\Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController::class, 'destroy'])->name('documents.destroy');
        Route::post('/documents/{document}/verify', [\Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController::class, 'verify'])
            ->middleware('module:hrm,documents,verify')
            ->name('documents.verify');
    });

    // Document Expiry Dashboard (HR Admin)
    Route::middleware(['module:hrm,documents'])->group(function () {
        Route::get('/documents/expiring', [\Aero\HRM\Http\Controllers\Employee\EmployeeDocumentController::class, 'expiring'])->name('documents.expiring');
    });

    // Salary Structure Management
    Route::middleware(['module:hrm,payroll'])->prefix('salary-structure')->name('salary-structure.')->group(function () {
        Route::get('/', [\Aero\HRM\Http\Controllers\Employee\SalaryStructureController::class, 'index'])->name('index');
        Route::post('/', [\Aero\HRM\Http\Controllers\Employee\SalaryStructureController::class, 'store'])->name('store');
        Route::put('/{id}', [\Aero\HRM\Http\Controllers\Employee\SalaryStructureController::class, 'update'])->name('update');
        Route::delete('/{id}', [\Aero\HRM\Http\Controllers\Employee\SalaryStructureController::class, 'destroy'])->name('destroy');

        // Employee Salary Management
        Route::get('/employee/{employeeId}', [\Aero\HRM\Http\Controllers\Employee\SalaryStructureController::class, 'employeeSalary'])->name('employee.salary');
        Route::post('/assign', [\Aero\HRM\Http\Controllers\Employee\SalaryStructureController::class, 'assignToEmployee'])->name('assign');
        Route::post('/calculate-preview', [\Aero\HRM\Http\Controllers\Employee\SalaryStructureController::class, 'calculatePreview'])->name('calculate-preview');
    });

    // Managers for dropdowns
    Route::get('/managers', [\Aero\HRM\Http\Controllers\Employee\ManagersController::class, 'index'])->name('managers.list');

    // Employee self-service routes
    Route::middleware(['module:hrm,time-off,own-leave'])->group(function () {
        Route::get('/leaves-employee', [LeaveController::class, 'index1'])->name('leaves-employee');
        Route::post('/leave-add', [LeaveController::class, 'create'])->name('leave-add');
        Route::post('/leave-update', [LeaveController::class, 'update'])->name('leave-update');
        Route::delete('/leave-delete', [LeaveController::class, 'delete'])->name('leave-delete');
        Route::get('/leaves-paginate', [LeaveController::class, 'paginate'])->name('leaves.paginate');
        Route::get('/leaves-stats', [LeaveController::class, 'stats'])->name('leaves.stats');
        Route::get('/leaves/balances', [LeaveController::class, 'getBalances'])->name('leaves.balances');
    });

    // Attendance self-service routes
    Route::middleware(['module:hrm,attendance,own-attendance'])->group(function () {
        Route::get('/attendance-employee', [AttendanceController::class, 'index2'])->name('attendance-employee');
        Route::get('/attendance/attendance-today', [AttendanceController::class, 'getCurrentUserPunch'])->name('attendance.current-user-punch');
        Route::get('/get-current-user-attendance-for-date', [AttendanceController::class, 'getCurrentUserAttendanceForDate'])->name('getCurrentUserAttendanceForDate');
        Route::get('/attendance/calendar-data', [AttendanceController::class, 'getCalendarData'])->name('attendance.calendar-data');
    });

    // Punch routes - require punch permission
    Route::middleware(['module:hrm,attendance,own-attendance,punch'])->group(function () {
        Route::post('/punchIn', [AttendanceController::class, 'punchIn'])->name('punchIn');
        Route::post('/punchOut', [AttendanceController::class, 'punchOut'])->name('punchOut');
        Route::post('/attendance/punch', [AttendanceController::class, 'punch'])->name('attendance.punch');
    });

    // General access routes (available to all authenticated users)
    Route::get('/attendance/export/excel', [AttendanceController::class, 'exportExcel'])->name('attendance.exportExcel');
    Route::get('/admin/attendance/export/excel', [AttendanceController::class, 'exportAdminExcel'])->name('attendance.exportAdminExcel');
    Route::get('/admin/attendance/export/pdf', [AttendanceController::class, 'exportAdminPdf'])->name('attendance.exportAdminPdf');
    Route::get('/attendance/export/pdf', [AttendanceController::class, 'exportPdf'])->name('attendance.exportPdf');
    Route::get('/get-all-users-attendance-for-date', [AttendanceController::class, 'getAllUsersAttendanceForDate'])->name('getAllUsersAttendanceForDate');
    Route::get('/get-present-users-for-date', [AttendanceController::class, 'getPresentUsersForDate'])->name('getPresentUsersForDate');
    Route::get('/get-absent-users-for-date', [AttendanceController::class, 'getAbsentUsersForDate'])->name('getAbsentUsersForDate');
    Route::get('/get-client-ip', [AttendanceController::class, 'getClientIp'])->name('getClientIp');

    // Holiday routes (Legacy - redirects to Time Off Management)
    Route::middleware(['module:hrm,time-off,holidays'])->group(function () {
        Route::get('/holidays', [HolidayController::class, 'index'])->name('holidays');
        Route::post('/holidays-add', [HolidayController::class, 'create'])->name('holidays-add');
        Route::delete('/holidays-delete', [HolidayController::class, 'delete'])->name('holidays-delete');

        // Legacy redirect for old holiday routes
        Route::get('/holidays-legacy', [HolidayController::class, 'index'])->name('holidays-legacy');
    });

    // Profile Routes - own profile access
    Route::middleware(['module:core,my-profile'])->group(function () {
        Route::get('/profile/{user}', [ProfileController::class, 'index'])->name('profile');
        Route::post('/profile/update', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile/delete', [ProfileController::class, 'delete'])->name('profile.delete');

        // Profile Image Routes - dedicated endpoints for profile image management
        Route::post('/profile/image/upload', [ProfileImageController::class, 'upload'])->name('profile.image.upload');
        Route::delete('/profile/image/remove', [ProfileImageController::class, 'remove'])->name('profile.image.remove');

        // New API endpoints for enhanced profile functionality (consistent with other modules)
        Route::get('/profile/{user}/stats', [ProfileController::class, 'stats'])->name('profile.stats');
        Route::get('/profile/{user}/export', [ProfileController::class, 'export'])->name('profile.export');
        Route::post('/profile/{user}/track-view', [ProfileController::class, 'trackView'])->name('profile.trackView');

        // Education Routes:
        Route::post('/education/update', [EducationController::class, 'update'])->name('education.update');
        Route::delete('/education/delete', [EducationController::class, 'delete'])->name('education.delete');

        // Experience Routes:
        Route::post('/experience/update', [ExperienceController::class, 'update'])->name('experience.update');
        Route::delete('/experience/delete', [ExperienceController::class, 'delete'])->name('experience.delete');
    });

    // Document management routes
    Route::middleware(['module:hrm,documents'])->group(function () {
        Route::get('/letters', [LetterController::class, 'index'])->name('letters');
        Route::get('/letters-paginate', [LetterController::class, 'paginate'])->name('letters.paginate');
    });

    Route::middleware(['module:hrm,documents,document-list,update'])->put('/letters-update', [LetterController::class, 'update'])->name('letters.update');    // Leave management routes
    Route::middleware(['module:hrm,time-off'])->group(function () {
        Route::get('/leaves', [LeaveController::class, 'index2'])->name('leaves');
        Route::get('/leave-summary', [LeaveController::class, 'leaveSummary'])->name('leave-summary');
        Route::post('/leave-update-status', [LeaveController::class, 'updateStatus'])->name('leave-update-status');

        // Leave summary export routes
        Route::get('/leave-summary/export/excel', [LeaveController::class, 'exportExcel'])->name('leave.summary.exportExcel');
        Route::get('/leave-summary/export/pdf', [LeaveController::class, 'exportPdf'])->name('leave.summary.exportPdf');

        // Leave analytics
        Route::get('/leaves/analytics', [LeaveController::class, 'getAnalytics'])->name('leaves.analytics');

        // Approval workflow
        Route::get('/leaves/pending-approvals', [LeaveController::class, 'pendingApprovals'])->name('leaves.pending-approvals');
    });

    // Leave bulk operations (admin only)
    Route::middleware(['module:hrm,time-off,leave-management,approve'])->group(function () {
        Route::post('/leaves/bulk-approve', [LeaveController::class, 'bulkApprove'])->name('leaves.bulk-approve');
        Route::post('/leaves/bulk-reject', [LeaveController::class, 'bulkReject'])->name('leaves.bulk-reject');

        // Approval workflow actions
        Route::post('/leaves/{id}/approve', [LeaveController::class, 'approveLeave'])->name('leaves.approve');
        Route::post('/leaves/{id}/reject', [LeaveController::class, 'rejectLeave'])->name('leaves.reject');
    });

    // Bulk leave creation routes
    Route::middleware(['module:hrm,time-off,leave-management,create'])->group(function () {
        Route::post('/leaves/bulk/validate', [BulkLeaveController::class, 'validateDates'])->name('leaves.bulk.validate');
        Route::post('/leaves/bulk', [BulkLeaveController::class, 'store'])->name('leaves.bulk.store');
        Route::get('/leaves/bulk/leave-types', [BulkLeaveController::class, 'getLeaveTypes'])->name('leaves.bulk.leave-types');
        Route::get('/leaves/bulk/calendar-data', [BulkLeaveController::class, 'getCalendarData'])->name('leaves.bulk.calendar-data');
    });

    // Bulk leave deletion route
    Route::middleware(['module:hrm,time-off,leave-management,delete'])->group(function () {
        Route::delete('/leaves/bulk', [BulkLeaveController::class, 'bulkDelete'])->name('leaves.bulk.delete');
    });

    // Leave settings routes
    Route::middleware(['module:hrm,time-off,leave-settings'])->group(function () {
        Route::get('/leave-settings', [LeaveSettingController::class, 'index'])->name('leave-settings');
        Route::post('/add-leave-type', [LeaveSettingController::class, 'store'])->name('add-leave-type');
        Route::put('/update-leave-type/{id}', [LeaveSettingController::class, 'update'])->name('update-leave-type');
        Route::delete('/delete-leave-type/{id}', [LeaveSettingController::class, 'destroy'])->name('delete-leave-type');
    });

    // HR Management routes
    Route::middleware(['module:hrm,employees'])->group(function () {
        Route::get('/employees', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'index'])->name('employees');
        Route::get('/employees/paginate', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'paginate'])->name('employees.paginate');
        Route::get('/employees/stats', [\Aero\HRM\Http\Controllers\Employee\EmployeeController::class, 'stats'])->name('employees.stats');
    });

    // Department management routes
    Route::middleware(['module:hrm,organization,departments'])->get('/departments', [DepartmentController::class, 'index'])->name('departments');
    Route::middleware(['module:hrm,organization,departments'])->get('/api/departments', [DepartmentController::class, 'getDepartments'])->name('api.departments');
    Route::middleware(['module:hrm,organization,departments'])->get('/departments/stats', [DepartmentController::class, 'getStats'])->name('departments.stats');
    Route::middleware(['module:hrm,organization,departments,department-list,create'])->post('/departments', [DepartmentController::class, 'store'])->name('departments.store');
    Route::middleware(['module:hrm,organization,departments'])->get('/departments/{id}', [DepartmentController::class, 'show'])->name('departments.show');
    Route::middleware(['module:hrm,organization,departments,department-list,update'])->put('/departments/{id}', [DepartmentController::class, 'update'])->name('departments.update');
    Route::middleware(['module:hrm,organization,departments,department-list,delete'])->delete('/departments/{id}', [DepartmentController::class, 'destroy'])->name('departments.delete');
    Route::middleware(['module:hrm,organization,departments,department-list,update'])->put('/users/{id}/department', [DepartmentController::class, 'updateUserDepartment'])->name('users.update-department');

    // Route::middleware(['module:hrm,organization'])->get('/jurisdiction', [JurisdictionController::class, 'index'])->name('jurisdiction'); // TODO: Move to compliance package

    // Holiday management routes
    Route::middleware(['module:hrm,time-off,holidays,holiday-list,create'])->post('/holiday-add', [HolidayController::class, 'create'])->name('holiday-add');
    Route::middleware(['module:hrm,time-off,holidays,holiday-list,delete'])->delete('/holiday-delete', [HolidayController::class, 'delete'])->name('holiday-delete');

    // Document management routes
    Route::middleware(['module:hrm,documents'])->get('/letters', [LetterController::class, 'index'])->name('letters');    // Attendance management routes
    Route::middleware(['module:hrm,attendance'])->group(function () {
        Route::get('/attendances', [AttendanceController::class, 'index1'])->name('attendances');
        Route::get('/timesheet', [AttendanceController::class, 'index3'])->name('timesheet'); // New TimeSheet page route
        Route::get('/attendances-admin-paginate', [AttendanceController::class, 'paginate'])->name('attendancesAdmin.paginate');
        Route::get('/attendance/locations-today', [AttendanceController::class, 'getUserLocationsForDate'])->name('getUserLocationsForDate');
        Route::get('/admin/get-present-users-for-date', [AttendanceController::class, 'getPresentUsersForDate'])->name('admin.getPresentUsersForDate');
        Route::get('/admin/get-absent-users-for-date', [AttendanceController::class, 'getAbsentUsersForDate'])->name('admin.getAbsentUsersForDate');
        Route::get('/attendance/monthly-stats', [AttendanceController::class, 'getMonthlyAttendanceStats'])->name('attendance.monthlyStats');
        // Location and timesheet update check routes
        Route::get('check-user-locations-updates/{date}', [AttendanceController::class, 'checkForLocationUpdates'])
            ->name('check-user-locations-updates');
        Route::get('check-timesheet-updates/{date}/{month?}', [AttendanceController::class, 'checkTimesheetUpdates'])
            ->name('check-timesheet-updates');
    });

    // Attendance management routes (admin actions)
    Route::middleware(['module:hrm,attendance,attendance-list,manage'])->group(function () {
        Route::post('/attendance/mark-as-present', [AttendanceController::class, 'markAsPresent'])->name('attendance.mark-as-present');
        Route::post('/attendance/bulk-mark-as-present', [AttendanceController::class, 'bulkMarkAsPresent'])->name('attendance.bulk-mark-as-present');
    });

    // Employee attendance stats route
    Route::middleware(['module:hrm,attendance,own-attendance'])->group(function () {
        Route::get('/attendance/my-monthly-stats', [AttendanceController::class, 'getMonthlyAttendanceStats'])->name('attendance.myMonthlyStats');
    });

    Route::middleware(['module:hrm,attendance,attendance-settings'])->group(function () {
        Route::get('/settings/attendance', [AttendanceSettingController::class, 'index'])->name('attendance-settings.index');
        Route::post('/settings/attendance', [AttendanceSettingController::class, 'updateSettings'])->name('attendance-settings.update');
        Route::post('settings/attendance-type', [AttendanceSettingController::class, 'storeType'])->name('attendance-types.store');
        Route::put('settings/attendance-type/{id}', [AttendanceSettingController::class, 'updateType'])->name('attendance-types.update');
        Route::delete('settings/attendance-type/{id}', [AttendanceSettingController::class, 'destroyType'])->name('attendance-types.destroy');

        // Multi-config management routes
        Route::post('settings/attendance-type/{id}/add-item', [AttendanceSettingController::class, 'addConfigItem'])->name('attendance-types.addItem');
        Route::delete('settings/attendance-type/{id}/remove-item', [AttendanceSettingController::class, 'removeConfigItem'])->name('attendance-types.removeItem');
        Route::post('settings/attendance-type/{id}/generate-qr', [AttendanceSettingController::class, 'generateQrCode'])->name('attendance-types.generateQr');
    });

    // HR Module Settings
    Route::prefix('settings/hr')->middleware(['auth', 'verified'])->group(function () {
        Route::middleware(['module:hrm,settings,onboarding-settings'])->get('/onboarding', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.onboarding');
        Route::middleware(['module:hrm,settings,skills-settings'])->get('/skills', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.skills');
        Route::middleware(['module:hrm,settings,benefits-settings'])->get('/benefits', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.benefits');
        Route::middleware(['module:hrm,settings,safety-settings'])->get('/safety', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.safety');
        Route::middleware(['module:hrm,settings,documents-settings'])->get('/documents', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.documents');

        // Update routes
        Route::middleware(['module:hrm,settings,onboarding-settings,setting-list,update'])->post('/onboarding', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'updateOnboardingSettings'])->name('settings.hr.onboarding.update');
        Route::middleware(['module:hrm,settings,skills-settings,setting-list,update'])->post('/skills', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'updateSkillsSettings'])->name('settings.hr.skills.update');
        Route::middleware(['module:hrm,settings,benefits-settings,setting-list,update'])->post('/benefits', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'updateBenefitsSettings'])->name('settings.hr.benefits.update');
        Route::middleware(['module:hrm,settings,safety-settings,setting-list,update'])->post('/safety', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'updateSafetySettings'])->name('settings.hr.safety.update');
        Route::middleware(['module:hrm,settings,documents-settings,setting-list,update'])->post('/documents', [\Aero\HRM\Http\Controllers\Settings\HrmSettingController::class, 'updateDocumentSettings'])->name('settings.hr.documents.update');
    });

    // Designation Management
    Route::middleware(['module:hrm,organization,designations'])->group(function () {
        // Initial page render (Inertia)
        Route::get('/designations', [\Aero\HRM\Http\Controllers\Employee\DesignationController::class, 'index'])->name('designations.index');
        // API data fetch (JSON)
        Route::get('/designations/json', [\Aero\HRM\Http\Controllers\Employee\DesignationController::class, 'getDesignations'])->name('designations.json');
        // Stats endpoint for frontend analytics
        Route::get('/designations/stats', [\Aero\HRM\Http\Controllers\Employee\DesignationController::class, 'stats'])->name('designations.stats');
        Route::post('/designations', [\Aero\HRM\Http\Controllers\Employee\DesignationController::class, 'store'])->name('designations.store');
        Route::get('/designations/{id}', [\Aero\HRM\Http\Controllers\Employee\DesignationController::class, 'show'])->name('designations.show');
        Route::put('/designations/{id}', [\Aero\HRM\Http\Controllers\Employee\DesignationController::class, 'update'])->name('designations.update');
        Route::delete('/designations/{id}', [\Aero\HRM\Http\Controllers\Employee\DesignationController::class, 'destroy'])->name('designations.destroy');
        // For dropdowns and API
        Route::get('/designations/list', [\Aero\HRM\Http\Controllers\Employee\DesignationController::class, 'list'])->name('designations.list');
    });

    Route::get('/api/designations/list', function () {
        return response()->json(\Aero\HRM\Models\Designation::select('id', 'title as name')->get());
    })->name('api.designations.list');

    Route::get('/api/departments/list', function () {
        return response()->json(\Aero\HRM\Models\Department::select('id', 'name')->get());
    })->name('departments.list');
});

