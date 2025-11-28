<?php

use App\Http\Controllers\HR\BenefitsController;
use App\Http\Controllers\HR\EmployeeSelfServiceController;
use App\Http\Controllers\HR\HrAnalyticsController;
use App\Http\Controllers\HR\HrDocumentController;
use App\Http\Controllers\HR\OnboardingController;
use App\Http\Controllers\HR\PayrollController;
use App\Http\Controllers\HR\PerformanceReviewController;
use App\Http\Controllers\HR\RecruitmentController;
use App\Http\Controllers\HR\SkillsController;
use App\Http\Controllers\HR\TimeOffController;
use App\Http\Controllers\HR\TimeOffManagementController;
use App\Http\Controllers\HR\TrainingController;
use App\Http\Controllers\HR\WorkplaceSafetyController;
use Illuminate\Support\Facades\Route;

// Human Resources Module Routes
Route::middleware(['auth', 'verified'])->prefix('hr')->name('hr.')->group(function () {
    // HR Dashboard
    Route::middleware(['permission:hr.dashboard.view'])->get('/dashboard', [PerformanceReviewController::class, 'dashboard'])->name('dashboard');

    // Performance Management
    Route::middleware(['permission:hr.performance.view'])->group(function () {
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
    });

    // Training Management
    Route::middleware(['permission:hr.training.view'])->group(function () {
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
    Route::middleware(['permission:hr.recruitment.view'])->group(function () {
        Route::get('/recruitment', [RecruitmentController::class, 'index'])->name('recruitment.index');
        Route::post('/recruitment', [RecruitmentController::class, 'store'])->name('recruitment.store');
        Route::get('/recruitment/{id}', [RecruitmentController::class, 'show'])->name('recruitment.show');
        Route::get('/recruitment/{id}/edit', [RecruitmentController::class, 'edit'])->name('recruitment.edit');
        Route::put('/recruitment/{id}', [RecruitmentController::class, 'update'])->name('recruitment.update');
        Route::delete('/recruitment/{id}', [RecruitmentController::class, 'destroy'])->name('recruitment.destroy');

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

        // Bulk Operations
        Route::patch('/recruitment/applications/bulk-update', [RecruitmentController::class, 'bulkUpdateApplications'])->name('recruitment.applications.bulk-update');

        // Interviews
        Route::get('/recruitment/{id}/applications/{applicationId}/interviews', [RecruitmentController::class, 'interviews'])->name('recruitment.interviews.index');
        Route::post('/recruitment/{id}/applications/{applicationId}/interviews', [RecruitmentController::class, 'storeInterview'])->name('recruitment.interviews.store');
        Route::put('/recruitment/{id}/applications/{applicationId}/interviews/{interviewId}', [RecruitmentController::class, 'updateInterview'])->name('recruitment.interviews.update');
        Route::delete('/recruitment/{id}/applications/{applicationId}/interviews/{interviewId}', [RecruitmentController::class, 'destroyInterview'])->name('recruitment.interviews.destroy');
    });

    // Employee Onboarding & Offboarding
    Route::middleware(['permission:hr.onboarding.view'])->group(function () {
        Route::get('/onboarding', [OnboardingController::class, 'index'])->name('onboarding.index');
        Route::get('/onboarding/create', [OnboardingController::class, 'create'])->name('onboarding.create');
        Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
        Route::get('/onboarding/{id}', [OnboardingController::class, 'show'])->name('onboarding.show');
        Route::get('/onboarding/{id}/edit', [OnboardingController::class, 'edit'])->name('onboarding.edit');
        Route::put('/onboarding/{id}', [OnboardingController::class, 'update'])->name('onboarding.update');
        Route::delete('/onboarding/{id}', [OnboardingController::class, 'destroy'])->name('onboarding.destroy');

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
    Route::middleware(['permission:hr.skills.view'])->group(function () {
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
    Route::middleware(['permission:hr.timeoff.view'])->group(function () {
        // Time Off Dashboard
        Route::get('/time-off', [TimeOffManagementController::class, 'index'])->name('hr.timeoff.index');
        Route::get('/time-off/dashboard', [TimeOffManagementController::class, 'index'])->name('hr.timeoff.dashboard');

        // Company Holidays Management
        Route::get('/time-off/holidays', [TimeOffManagementController::class, 'holidays'])->name('hr.timeoff.holidays');

        // Leave Requests Management
        Route::get('/time-off/leave-requests', [TimeOffManagementController::class, 'leaveRequests'])->name('hr.timeoff.leave-requests');

        // Time Off Calendar
        Route::get('/time-off/calendar', [TimeOffManagementController::class, 'calendar'])->name('hr.timeoff.calendar');

        // Leave Balances
        Route::get('/time-off/balances', [TimeOffManagementController::class, 'balances'])->name('hr.timeoff.balances');

        // Time Off Reports
        Route::get('/time-off/reports', [TimeOffManagementController::class, 'reports'])->name('timeoff.reports');

        // Employee Self-Service Time Off
        Route::get('/time-off/employee-requests', [TimeOffManagementController::class, 'employeeRequests'])->name('timeoff.employee-requests');
    });

    // Legacy Time Off routes (for backward compatibility)
    Route::middleware(['permission:hr.timeoff.view'])->group(function () {
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
    Route::middleware(['permission:hr.benefits.view'])->group(function () {
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
    Route::middleware(['permission:hr.timeoff.view'])->group(function () {
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
    Route::middleware(['permission:hr.safety.view'])->group(function () {
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
    Route::middleware(['permission:hr.analytics.view'])->group(function () {
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
    Route::middleware(['permission:hr.documents.view'])->group(function () {
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
    Route::middleware(['permission:hr.selfservice.view'])->group(function () {
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
    Route::middleware(['permission:hr.payroll.view'])->group(function () {
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
    Route::middleware(['permission:hr.employees.view'])->group(function () {
        Route::get('/employees', [\App\Http\Controllers\EmployeeController::class, 'index'])->name('employees.index');
        Route::get('/employees/paginate', [\App\Http\Controllers\EmployeeController::class, 'paginate'])->name('employees.paginate');
        Route::get('/employees/stats', [\App\Http\Controllers\EmployeeController::class, 'stats'])->name('employees.stats');
        Route::post('/employees', [\App\Http\Controllers\EmployeeController::class, 'store'])->name('employees.store');
        Route::get('/employees/{id}', [\App\Http\Controllers\EmployeeController::class, 'show'])->name('employees.show');
        Route::put('/employees/{id}', [\App\Http\Controllers\EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{id}', [\App\Http\Controllers\EmployeeController::class, 'destroy'])->name('employees.destroy');
        Route::post('/employees/{id}/restore', [\App\Http\Controllers\EmployeeController::class, 'restore'])->name('employees.restore');
    });

    // Managers for dropdowns
    Route::get('/managers', [\App\Http\Controllers\HR\ManagersController::class, 'index'])->name('managers.list');

});
