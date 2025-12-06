<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BulkLeaveController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\EducationController;
use App\Http\Controllers\EmailController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExperienceController;
use App\Http\Controllers\FMSController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\IMSController;
use App\Http\Controllers\JurisdictionController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\LetterController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfileImageController;
use App\Http\Controllers\Settings\AttendanceSettingController;
use App\Http\Controllers\Settings\CustomDomainController;
use App\Http\Controllers\Settings\LeaveSettingController;
use App\Http\Controllers\Settings\SystemSettingController;
use App\Http\Controllers\Shared\Admin\ModuleController;
use App\Http\Controllers\Shared\Admin\RoleController;
use App\Http\Controllers\SystemMonitoringController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// NOTE: Authentication routes are NOT included here.
// - For central/platform domains: auth routes are loaded via routes/platform.php
// - For tenant domains: auth routes are loaded via routes/tenant.php with tenancy middleware
// This prevents route conflicts and ensures proper database context.

// Note: The landing page route '/' is defined in routes/platform.php
// This ensures it's loaded with the proper domain context middleware

// =========================================================================
// PUBLIC CAREER PAGES
// =========================================================================
Route::prefix('careers')->name('careers.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Public\CareersController::class, 'index'])->name('index');
    Route::get('/{id}', [\App\Http\Controllers\Public\CareersController::class, 'show'])->name('show');
    Route::get('/{id}/apply', [\App\Http\Controllers\Public\CareersController::class, 'apply'])->name('apply');
    Route::post('/{id}/apply', [\App\Http\Controllers\Public\CareersController::class, 'submit'])->name('submit');
});

Route::get('/session-check', function () {
    return response()->json(['authenticated' => auth()->check()]);
});

Route::get('/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

// Locale switching route (for dynamic translations) - client-side only, no server redirect
Route::post('/locale', function (\Illuminate\Http\Request $request) {
    $locale = $request->input('locale', 'en');
    $supportedLocales = ['en', 'bn', 'ar', 'es', 'fr', 'de', 'hi', 'zh-CN', 'zh-TW'];

    if (in_array($locale, $supportedLocales)) {
        session(['locale' => $locale]);
        app()->setLocale($locale);

        if (auth()->check()) {
            auth()->user()->update(['locale' => $locale]);
        }
    }

    // Return empty response - locale is handled client-side
    return response()->noContent();
})->name('locale.update');

// Team Invitation Acceptance Routes (public - no auth required)
// These routes use token-based security - the token is a secure UUID validated in the controller
Route::prefix('invitation')->group(function () {
    Route::get('/{token}', [\App\Http\Controllers\TeamMemberController::class, 'showAcceptForm'])
        ->name('team.invitation.accept');

    Route::post('/{token}', [\App\Http\Controllers\TeamMemberController::class, 'accept'])
        ->name('team.invitation.process');
});

// Device authentication is now handled globally via DeviceAuthMiddleware
// No need to apply it here - it runs on all requests automatically
$middlewareStack = ['auth', 'verified', 'require_tenant_onboarding'];

Route::middleware($middlewareStack)->group(function () {

    // =========================================================================
    // TENANT ONBOARDING WIZARD
    // =========================================================================
    // Multi-step setup wizard for new tenants (first-time login)
    Route::prefix('onboarding')->name('onboarding.')->withoutMiddleware('require_tenant_onboarding')->group(function () {
        Route::get('/', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'index'])->name('index');
        Route::post('/company', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'saveCompany'])->name('company');
        Route::post('/branding', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'saveBranding'])->name('branding');
        Route::post('/team', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'saveTeam'])->name('team');
        Route::post('/modules', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'saveModules'])->name('modules');
        Route::post('/complete', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'complete'])->name('complete');
        Route::post('/skip', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'skip'])->name('skip');
        Route::post('/step', [\App\Http\Controllers\Tenant\TenantOnboardingController::class, 'updateStep'])->name('step');
    });

    // =========================================================================
    // SUBSCRIPTION MANAGEMENT (TENANT-FACING)
    // =========================================================================
    // Self-service subscription, billing, and usage management for tenants
    Route::prefix('subscription')->name('tenant.subscription.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'index'])->name('index');
        Route::get('/plans', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'plans'])->name('plans');
        Route::post('/change-plan', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'changePlan'])->name('change-plan');
        Route::post('/cancel', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'cancel'])->name('cancel');
        Route::post('/resume', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'resume'])->name('resume');
        Route::get('/usage', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'usage'])->name('usage');
        Route::get('/invoices', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'invoices'])->name('invoices');
        Route::get('/invoices/{invoice}/download', [\App\Http\Controllers\Tenant\SubscriptionController::class, 'downloadInvoice'])->name('invoices.download');
    });

    // Dashboard routes - require dashboard permission
    Route::middleware(['module:core,dashboard'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    });

    // Security Dashboard route - available to authenticated users
    Route::get('/security/dashboard', function () {
        return inertia('Security/Dashboard');
    })->name('security.dashboard');

    // Module Hierarchy Demo - accessible to authenticated users
    Route::get('/administration/module-hierarchy', function () {
        return inertia('Tenant/Pages/Administration/ModuleHierarchyDemo');
    })->name('administration.module-hierarchy');

    // Updates route - require updates permission
    Route::middleware(['module:core,updates'])->get('/updates', [DashboardController::class, 'updates'])->name('updates');

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

    // Communications routes
    Route::middleware(['module:core,communications'])->get('/emails', [EmailController::class, 'index'])->name('emails');

    // Leave summary route
    Route::middleware(['module:hrm,time-off'])->get('/leave-summary', [LeaveController::class, 'summary'])->name('leave.summary');
});

// Administrative routes - require specific permissions
Route::middleware(['auth', 'verified'])->group(function () {

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
        Route::get('/employees', [\App\Http\Controllers\EmployeeController::class, 'index'])->name('employees');
        Route::get('/employees/paginate', [\App\Http\Controllers\EmployeeController::class, 'paginate'])->name('employees.paginate');
        Route::get('/employees/stats', [\App\Http\Controllers\EmployeeController::class, 'stats'])->name('employees.stats');
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

    Route::middleware(['module:hrm,organization'])->get('/jurisdiction', [JurisdictionController::class, 'index'])->name('jurisdiction');

    // Holiday management routes
    Route::middleware(['module:hrm,time-off,holidays,holiday-list,create'])->post('/holiday-add', [HolidayController::class, 'create'])->name('holiday-add');
    Route::middleware(['module:hrm,time-off,holidays,holiday-list,delete'])->delete('/holiday-delete', [HolidayController::class, 'delete'])->name('holiday-delete');

    // User management routes - CONSOLIDATED & REFACTORED
    Route::middleware(['module:core,user-management'])->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users');
        Route::get('/users/paginate', [UserController::class, 'paginate'])->name('users.paginate');
        Route::get('/users/stats', [UserController::class, 'stats'])->name('users.stats');

        // Profile search for admin usage (consistent with other modules)
        Route::get('/profiles/search', [ProfileController::class, 'search'])->name('profiles.search');
    });

    Route::middleware(['module:core,user-management,user-list,create'])->group(function () {
        Route::post('/users', [UserController::class, 'store'])
            ->middleware(['precognitive'])
            ->name('users.store');
        // Legacy route for backward compatibility
        Route::post('/users/legacy', [ProfileController::class, 'store'])->name('addUser');
    });

    Route::middleware(['module:core,user-management,user-list,update'])->group(function () {
        Route::put('/users/{id}', [UserController::class, 'update'])
            ->middleware(['precognitive'])
            ->name('users.update');
        Route::put('/users/{id}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggleStatus');
        Route::post('/users/{id}/roles', [UserController::class, 'updateUserRole'])->name('users.updateRole');
        // Employee-specific routes - now handled by EmployeeController
        Route::post('/users/{id}/attendance-type', [EmployeeController::class, 'updateAttendanceType'])->name('users.updateAttendanceType');
        Route::post('/users/{id}/report-to', [EmployeeController::class, 'updateReportTo'])->name('users.updateReportTo');

        // Legacy routes for backward compatibility
        Route::post('/user/{id}/update-department', [DepartmentController::class, 'updateUserDepartment'])->name('user.updateDepartment');
        Route::post('/user/{id}/update-designation', [DesignationController::class, 'updateUserDesignation'])->name('user.updateDesignation');
        Route::post('/user/{id}/update-role', [UserController::class, 'updateUserRole'])->name('user.updateRole');
        Route::put('/user/toggle-status/{id}', [UserController::class, 'toggleStatus'])->name('user.toggleStatus');
        Route::post('/user/{id}/update-attendance-type', [EmployeeController::class, 'updateAttendanceType'])->name('user.updateAttendanceType');
        Route::post('/user/{id}/update-report-to', [EmployeeController::class, 'updateReportTo'])->name('user.updateReportTo');
    });

    Route::middleware(['module:core,user-management,user-list,delete'])->group(function () {
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
        // Legacy route for backward compatibility
        Route::delete('/user/{id}', [EmployeeController::class, 'destroy'])->name('user.delete');
    });

    // SECURE DEVICE MANAGEMENT ROUTES (NEW SYSTEM)
    // User's own devices
    Route::get('/my-devices', [DeviceController::class, 'index'])->name('user.devices');
    Route::delete('/my-devices/{deviceId}', [DeviceController::class, 'deactivateDevice'])->name('user.devices.deactivate');

    // Admin device management
    Route::middleware(['module:core,user-management'])->group(function () {
        Route::get('/users/{userId}/devices', [DeviceController::class, 'getUserDevices'])->name('admin.users.devices');
    });

    Route::middleware(['module:core,user-management,user-list,update'])->group(function () {
        Route::post('/users/{userId}/devices/reset', [DeviceController::class, 'resetDevices'])->name('admin.users.devices.reset');
        Route::post('/users/{userId}/devices/toggle', [DeviceController::class, 'toggleSingleDeviceLogin'])->name('admin.users.devices.toggle');
        Route::delete('/users/{userId}/devices/{deviceId}', [DeviceController::class, 'adminDeactivateDevice'])->name('admin.users.devices.deactivate');
    });

    // System settings routes (tenant)
    Route::middleware(['module:core,settings,company-settings'])->group(function () {
        Route::get('/settings/system', [SystemSettingController::class, 'index'])->name('settings.system.index');
        Route::put('/settings/system', [SystemSettingController::class, 'update'])->name('settings.system.update');
        Route::post('/settings/system/test-email', [SystemSettingController::class, 'sendTestEmail'])->name('settings.system.test-email');
        Route::post('/settings/system/test-sms', [SystemSettingController::class, 'sendTestSms'])->name('settings.system.test-sms');

        // Legacy aliases for backward compatibility
        Route::get('/company-settings', [SystemSettingController::class, 'index'])->name('admin.settings.company');
        Route::put('/update-company-settings', [SystemSettingController::class, 'update'])->name('update-company-settings');

        // Domain management routes
        Route::get('/settings/domains', [CustomDomainController::class, 'index'])->name('settings.domains.index');
        Route::post('/settings/domains', [CustomDomainController::class, 'store'])->name('settings.domains.store');
        Route::post('/settings/domains/{domain}/verify', [CustomDomainController::class, 'verify'])->name('settings.domains.verify');
        Route::post('/settings/domains/{domain}/set-primary', [CustomDomainController::class, 'setPrimary'])->name('settings.domains.set-primary');
        Route::delete('/settings/domains/{domain}', [CustomDomainController::class, 'destroy'])->name('settings.domains.destroy');

        // Usage & Billing routes
        Route::prefix('settings/usage')->name('settings.usage.')->group(function () {
            Route::get('/', [\App\Http\Controllers\UsageController::class, 'index'])->name('index');
            Route::get('/summary', [\App\Http\Controllers\UsageController::class, 'summary'])->name('summary');
            Route::get('/trend/{metric}', [\App\Http\Controllers\UsageController::class, 'trend'])->name('trend');
            Route::get('/limits', [\App\Http\Controllers\UsageController::class, 'limits'])->name('limits');
            Route::get('/check/{metric}', [\App\Http\Controllers\UsageController::class, 'checkLimit'])->name('check');
        });
    });    // Legacy role routes (maintained for backward compatibility)
    Route::middleware(['module:core,roles-permissions'])->get('/roles-permissions', [RoleController::class, 'getRolesAndPermissions'])->name('roles-settings');

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
        Route::middleware(['module:hrm,settings,onboarding-settings'])->get('/onboarding', [\App\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.onboarding');
        Route::middleware(['module:hrm,settings,skills-settings'])->get('/skills', [\App\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.skills');
        Route::middleware(['module:hrm,settings,benefits-settings'])->get('/benefits', [\App\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.benefits');
        Route::middleware(['module:hrm,settings,safety-settings'])->get('/safety', [\App\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.safety');
        Route::middleware(['module:hrm,settings,documents-settings'])->get('/documents', [\App\Http\Controllers\Settings\HrmSettingController::class, 'index'])->name('settings.hr.documents');

        // Update routes
        Route::middleware(['module:hrm,settings,onboarding-settings,setting-list,update'])->post('/onboarding', [\App\Http\Controllers\Settings\HrmSettingController::class, 'updateOnboardingSettings'])->name('settings.hr.onboarding.update');
        Route::middleware(['module:hrm,settings,skills-settings,setting-list,update'])->post('/skills', [\App\Http\Controllers\Settings\HrmSettingController::class, 'updateSkillsSettings'])->name('settings.hr.skills.update');
        Route::middleware(['module:hrm,settings,benefits-settings,setting-list,update'])->post('/benefits', [\App\Http\Controllers\Settings\HrmSettingController::class, 'updateBenefitsSettings'])->name('settings.hr.benefits.update');
        Route::middleware(['module:hrm,settings,safety-settings,setting-list,update'])->post('/safety', [\App\Http\Controllers\Settings\HrmSettingController::class, 'updateSafetySettings'])->name('settings.hr.safety.update');
        Route::middleware(['module:hrm,settings,documents-settings,setting-list,update'])->post('/documents', [\App\Http\Controllers\Settings\HrmSettingController::class, 'updateDocumentSettings'])->name('settings.hr.documents.update');
    });

    // User Invitation Routes (integrated with User Management)
    Route::prefix('users')->group(function () {
        Route::post('/invite', [UserController::class, 'sendInvitation'])->name('users.invite');
        Route::get('/invitations/pending', [UserController::class, 'pendingInvitations'])->name('users.invitations.pending');
        Route::post('/invitations/{invitation}/resend', [UserController::class, 'resendInvitation'])->name('users.invitations.resend');
        Route::delete('/invitations/{invitation}', [UserController::class, 'cancelInvitation'])->name('users.invitations.cancel');
    });

    // Task management routes
    Route::middleware(['module:project-management,tasks'])->group(function () {
        Route::get('/tasks-all', [TaskController::class, 'allTasks'])->name('allTasks');
        Route::post('/tasks-filtered', [TaskController::class, 'filterTasks'])->name('filterTasks');
    });

    Route::middleware(['module:project-management,tasks,task-list,create'])->post('/task/add', [TaskController::class, 'addTask'])->name('addTask');

    // Jurisdiction/Work location routes
    Route::middleware(['module:hrm,organization'])->group(function () {
        Route::get('/work-location', [JurisdictionController::class, 'showWorkLocations'])->name('showWorkLocations');
        Route::get('/work-location_json', [JurisdictionController::class, 'allWorkLocations'])->name('allWorkLocations');
    });

});

// Enhanced Role Management Routes (with proper module-based access control)
Route::middleware(['auth', 'verified', 'module:core,roles-permissions', 'role_permission_sync'])->group(function () {
    // Role Management Interface
    Route::get('/admin/roles-management', [RoleController::class, 'index'])->name('admin.roles-management');
    Route::get('/admin/roles/audit', [RoleController::class, 'getEnhancedRoleAudit'])->name('admin.roles.audit');
    Route::get('/admin/roles/export', [RoleController::class, 'exportRoles'])->name('admin.roles.export');
    Route::get('/admin/roles/metrics', [RoleController::class, 'getRoleMetrics'])->name('admin.roles.metrics');
    Route::get('/admin/roles/snapshot', [RoleController::class, 'snapshot'])->name('admin.roles.snapshot');
});

Route::middleware(['auth', 'verified', 'module:core,roles-permissions,role-list,create'])->group(function () {
    Route::post('/admin/roles', [RoleController::class, 'storeRole'])->name('admin.roles.store');
    Route::post('/admin/roles/clone', [RoleController::class, 'cloneRole'])->name('admin.roles.clone');
});

Route::middleware(['auth', 'verified', 'module:core,roles-permissions,role-list,update'])->group(function () {
    Route::put('/admin/roles/{id}', [RoleController::class, 'updateRole'])->name('admin.roles.update');
    Route::post('/admin/roles/update-permission', [RoleController::class, 'updateRolePermission'])->name('admin.roles.update-permission');
    Route::post('/admin/roles/toggle-permission', [RoleController::class, 'togglePermission'])->name('admin.roles.toggle-permission');
    Route::post('/admin/roles/update-module', [RoleController::class, 'updateRoleModule'])->name('admin.roles.update-module');
    Route::post('/admin/roles/bulk-operation', [RoleController::class, 'bulkOperation'])->name('admin.roles.bulk-operation');
    Route::patch('/admin/roles/{role}/permissions', [RoleController::class, 'batchUpdatePermissions'])->name('admin.roles.batch-permissions');
});

Route::middleware(['auth', 'verified', 'module:core,roles-permissions,role-list,delete'])->group(function () {
    Route::delete('/admin/roles/{id}', [RoleController::class, 'deleteRole'])->name('admin.roles.delete');
});

// Super Administrator only routes
Route::middleware(['auth', 'verified', 'role:Super Administrator'])->group(function () {
    Route::post('/admin/roles/initialize-enterprise', [RoleController::class, 'initializeEnterpriseSystem'])->name('admin.roles.initialize-enterprise');
});

// Test route for role controller
Route::middleware(['auth', 'verified'])->get('/admin/roles-test', [RoleController::class, 'test'])->name('admin.roles.test');

// Module Permission Registry Management Routes (Tenant Super Admin Only)
Route::middleware(['auth', 'verified', 'tenant.super_admin'])->group(function () {
    // View operations
    Route::get('/admin/modules', [ModuleController::class, 'index'])->name('modules.index');
    Route::get('/admin/modules/api', [ModuleController::class, 'apiIndex'])->name('modules.api.index');
    Route::post('/admin/modules/check-access', [ModuleController::class, 'checkAccess'])->name('modules.check-access');
    Route::get('/admin/modules/{moduleCode}/requirements', [ModuleController::class, 'getModuleRequirements'])->name('modules.requirements');

    // Permission sync operations (tenant context only - permission requirements are per-tenant)
    Route::post('/admin/modules/{module}/sync-permissions', [ModuleController::class, 'syncModulePermissions'])->name('modules.sync-permissions');
    Route::post('/admin/modules/sub-modules/{subModule}/sync-permissions', [ModuleController::class, 'syncSubModulePermissions'])->name('modules.sub-modules.sync-permissions');
    Route::post('/admin/modules/components/{component}/sync-permissions', [ModuleController::class, 'syncComponentPermissions'])->name('modules.components.sync-permissions');
});



// System Monitoring Routes (Super Administrator only)
Route::middleware(['auth', 'verified', 'role:Super Administrator'])->group(function () {
    Route::get('/admin/system-monitoring', [SystemMonitoringController::class, 'index'])->name('admin.system-monitoring');
    Route::post('/admin/errors/{errorId}/resolve', [SystemMonitoringController::class, 'resolveError'])->name('admin.errors.resolve');
    Route::get('/admin/system-report', [SystemMonitoringController::class, 'exportReport'])->name('admin.system-report');
    Route::get('/admin/optimization-report', [SystemMonitoringController::class, 'getOptimizationReport'])->name('admin.optimization-report');
    // CRM Module routes
    Route::middleware(['module:crm'])->prefix('crm')->group(function () {
        Route::get('/', [App\Http\Controllers\CRMController::class, 'index'])->name('crm.index');
        Route::get('/leads', [App\Http\Controllers\CRMController::class, 'leads'])->name('crm.leads');
        Route::post('/leads', [App\Http\Controllers\CRMController::class, 'storeLeads'])->name('crm.leads.store')->middleware('module:crm,leads,lead-list,create');
        Route::get('/customers', [App\Http\Controllers\CRMController::class, 'customers'])->name('crm.customers')->middleware('module:crm,customers');
        Route::get('/opportunities', [App\Http\Controllers\CRMController::class, 'opportunities'])->name('crm.opportunities')->middleware('module:crm,opportunities');
        Route::get('/reports', [App\Http\Controllers\CRMController::class, 'reports'])->name('crm.reports')->middleware('module:crm,reports');
        Route::get('/settings', [App\Http\Controllers\CRMController::class, 'settings'])->name('crm.settings')->middleware('module:crm,settings');

        // Kanban Pipeline routes
        Route::middleware(['module:crm,sales-pipeline'])->prefix('pipeline')->group(function () {
            Route::get('/', [App\Http\Controllers\CRM\PipelineController::class, 'index'])->name('crm.pipeline');
            Route::get('/{pipeline}/data', [App\Http\Controllers\CRM\PipelineController::class, 'getData'])->name('crm.pipeline.data');
        });

        // Deal routes
        Route::middleware(['module:crm,deals'])->prefix('deals')->group(function () {
            Route::post('/', [App\Http\Controllers\CRM\DealController::class, 'store'])->name('crm.deals.store');
            Route::post('/{deal}/move', [App\Http\Controllers\CRM\DealController::class, 'move'])->name('crm.deals.move');
            Route::put('/{deal}', [App\Http\Controllers\CRM\DealController::class, 'update'])->name('crm.deals.update');
            Route::post('/{deal}/won', [App\Http\Controllers\CRM\DealController::class, 'markAsWon'])->name('crm.deals.won');
            Route::post('/{deal}/lost', [App\Http\Controllers\CRM\DealController::class, 'markAsLost'])->name('crm.deals.lost');
            Route::post('/{deal}/reopen', [App\Http\Controllers\CRM\DealController::class, 'reopen'])->name('crm.deals.reopen');
            Route::delete('/{deal}', [App\Http\Controllers\CRM\DealController::class, 'destroy'])->name('crm.deals.destroy');
        });
    });

    // FMS Module routes
    Route::middleware(['module:finance'])->prefix('fms')->group(function () {
        Route::get('/', [FMSController::class, 'index'])->name('fms.index');

        // Accounts Payable
        Route::get('/accounts-payable', [FMSController::class, 'accountsPayable'])->name('fms.accounts-payable')->middleware('module:finance,accounts-payable');
        Route::post('/accounts-payable', [FMSController::class, 'storeAccountsPayable'])->name('fms.accounts-payable.store')->middleware('module:finance,accounts-payable,payable-list,create');

        // Accounts Receivable
        Route::get('/accounts-receivable', [FMSController::class, 'accountsReceivable'])->name('fms.accounts-receivable')->middleware('module:finance,accounts-receivable');
        Route::post('/accounts-receivable', [FMSController::class, 'storeAccountsReceivable'])->name('fms.accounts-receivable.store')->middleware('module:finance,accounts-receivable,receivable-list,create');

        // General Ledger
        Route::get('/general-ledger', [FMSController::class, 'generalLedger'])->name('fms.general-ledger')->middleware('module:finance,general-ledger');
        Route::post('/general-ledger', [FMSController::class, 'storeLedgerEntry'])->name('fms.general-ledger.store')->middleware('module:finance,general-ledger,ledger-entry,create');

        // Reports
        Route::get('/reports', [FMSController::class, 'reports'])->name('fms.reports')->middleware('module:finance,reports');
        Route::post('/reports/generate', [FMSController::class, 'generateReport'])->name('fms.reports.generate')->middleware('module:finance,reports,report-list,create');

        // Budgets
        Route::get('/budgets', [FMSController::class, 'budgets'])->name('fms.budgets')->middleware('module:finance,budgeting');
        Route::post('/budgets', [FMSController::class, 'storeBudget'])->name('fms.budgets.store')->middleware('module:finance,budgeting,budget-list,create');

        // Expenses
        Route::get('/expenses', [FMSController::class, 'expenses'])->name('fms.expenses')->middleware('module:finance,expense-management');
        Route::post('/expenses', [FMSController::class, 'storeExpense'])->name('fms.expenses.store')->middleware('module:finance,expense-management,expense-list,create');

        // Invoices
        Route::get('/invoices', [FMSController::class, 'invoices'])->name('fms.invoices')->middleware('module:finance,invoicing');
        Route::post('/invoices', [FMSController::class, 'storeInvoice'])->name('fms.invoices.store')->middleware('module:finance,invoicing,invoice-list,create');

        // Settings
        Route::get('/settings', [FMSController::class, 'settings'])->name('fms.settings')->middleware('module:finance,settings');
        Route::put('/settings', [FMSController::class, 'updateSettings'])->name('fms.settings.update')->middleware('module:finance,settings,setting-list,update');
    });

    // POS Module routes
    Route::middleware(['module:ecommerce,point-of-sale'])->prefix('pos')->group(function () {
        Route::get('/', [POSController::class, 'index'])->name('pos.index');

        // POS Terminal
        Route::get('/terminal', [POSController::class, 'terminal'])->name('pos.terminal')->middleware('module:ecommerce,point-of-sale,pos-terminal');

        // Sales Management
        Route::get('/sales', [POSController::class, 'sales'])->name('pos.sales')->middleware('module:ecommerce,point-of-sale');
        Route::post('/sales/process', [POSController::class, 'processSale'])->name('pos.sales.process')->middleware('module:ecommerce,point-of-sale,pos-terminal,process');

        // Product Management
        Route::get('/products', [POSController::class, 'products'])->name('pos.products')->middleware('module:ecommerce,point-of-sale');
        Route::get('/products/barcode/{barcode}', [POSController::class, 'getProductByBarcode'])->name('pos.products.barcode')->middleware('module:ecommerce,point-of-sale');

        // Customer Management
        Route::get('/customers', [POSController::class, 'customers'])->name('pos.customers')->middleware('module:ecommerce,point-of-sale');

        // Payment Management
        Route::get('/payments', [POSController::class, 'payments'])->name('pos.payments')->middleware('module:ecommerce,point-of-sale');

        // Reports
        Route::get('/reports', [POSController::class, 'reports'])->name('pos.reports')->middleware('module:ecommerce,point-of-sale');

        // Settings
        Route::get('/settings', [POSController::class, 'settings'])->name('pos.settings')->middleware('module:ecommerce,point-of-sale,pos-settings');
        Route::put('/settings', [POSController::class, 'updateSettings'])->name('pos.settings.update')->middleware('module:ecommerce,point-of-sale,pos-settings,setting-list,update');
    });

    // IMS Module routes (Inventory Management System)
    Route::middleware(['module:inventory'])->prefix('ims')->group(function () {
        Route::get('/', [IMSController::class, 'index'])->name('ims.index');

        // Products Management
        Route::get('/products', [IMSController::class, 'products'])->name('ims.products')->middleware('module:inventory,products');
        Route::post('/products', [IMSController::class, 'storeProduct'])->name('ims.products.store')->middleware('module:inventory,products,product-list,create');

        // Warehouse Management
        Route::get('/warehouse', [IMSController::class, 'warehouse'])->name('ims.warehouse')->middleware('module:inventory,warehouses');
        Route::post('/warehouse', [IMSController::class, 'storeWarehouse'])->name('ims.warehouse.store')->middleware('module:inventory,warehouses,warehouse-list,create');

        // Stock Movements
        Route::get('/stock-movements', [IMSController::class, 'stockMovements'])->name('ims.stock-movements')->middleware('module:inventory,stock-movements');
        Route::post('/stock-movements', [IMSController::class, 'createMovement'])->name('ims.stock-movements.store')->middleware('module:inventory,stock-movements,movement-list,create');

        // Suppliers
        Route::get('/suppliers', [IMSController::class, 'suppliers'])->name('ims.suppliers')->middleware('module:inventory,suppliers');
        Route::post('/suppliers', [IMSController::class, 'storeSupplier'])->name('ims.suppliers.store')->middleware('module:inventory,suppliers,supplier-list,create');

        // Purchase Orders
        Route::get('/purchase-orders', [IMSController::class, 'purchaseOrders'])->name('ims.purchase-orders')->middleware('module:inventory,purchase-orders');
        Route::post('/purchase-orders', [IMSController::class, 'storePurchaseOrder'])->name('ims.purchase-orders.store')->middleware('module:inventory,purchase-orders,order-list,create');

        // Reports
        Route::get('/reports', [IMSController::class, 'reports'])->name('ims.reports')->middleware('module:inventory,reports');

        // Settings
        Route::get('/settings', [IMSController::class, 'settings'])->name('ims.settings')->middleware('module:inventory,settings');
        Route::put('/settings', [IMSController::class, 'updateSettings'])->name('ims.settings.update')->middleware('module:inventory,settings,setting-list,update');
    });

    // Designation Management
    Route::middleware(['module:hrm,organization,designations'])->group(function () {
        // Initial page render (Inertia)
        Route::get('/designations', [\App\Http\Controllers\DesignationController::class, 'index'])->name('designations.index');
        // API data fetch (JSON)
        Route::get('/designations/json', [\App\Http\Controllers\DesignationController::class, 'getDesignations'])->name('designations.json');
        // Stats endpoint for frontend analytics
        Route::get('/designations/stats', [\App\Http\Controllers\DesignationController::class, 'stats'])->name('designations.stats');
        Route::post('/designations', [\App\Http\Controllers\DesignationController::class, 'store'])->name('designations.store');
        Route::get('/designations/{id}', [\App\Http\Controllers\DesignationController::class, 'show'])->name('designations.show');
        Route::put('/designations/{id}', [\App\Http\Controllers\DesignationController::class, 'update'])->name('designations.update');
        Route::delete('/designations/{id}', [\App\Http\Controllers\DesignationController::class, 'destroy'])->name('designations.destroy');
        // For dropdowns and API
        Route::get('/designations/list', [\App\Http\Controllers\DesignationController::class, 'list'])->name('designations.list');
    });
});

// API routes for dropdown data
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/api/designations/list', function () {
        return response()->json(\App\Models\HRM\Designation::select('id', 'title as name')->get());
    })->name('api.designations.list');

    Route::get('/api/departments/list', function () {
        return response()->json(\App\Models\HRM\Department::select('id', 'name')->get());
    })->name('departments.list');

    Route::get('/api/users/managers/list', function () {
        return response()->json(\App\Models\User::whereHas('roles', function ($query) {
            $query->whereIn('name', [
                'Super Administrator',
                'Administrator',
                'HR Manager',
                'Project Manager',
                'Department Manager',
                'Team Lead',
            ]);
        })
            ->select('id', 'name')
            ->get());
    })->name('users.managers.list');
});

Route::post('/update-fcm-token', [UserController::class, 'updateFcmToken'])->name('updateFcmToken');

// Service worker route for development
Route::get('/service-worker.js', function () {
    $filePath = public_path('service-worker.js');
    if (file_exists($filePath)) {
        return response()->file($filePath, [
            'Content-Type' => 'application/javascript',
            'Service-Worker-Allowed' => '/',
        ]);
    }
    abort(404);
})->name('service-worker');

// Temporary test route for debugging employee deletion authorization
Route::middleware(['auth', 'verified'])->get('/test-employee-auth', function () {
    $currentUser = \Illuminate\Support\Facades\Auth::user();
    $employee = \App\Models\User::where('id', '!=', $currentUser->id)->first();

    if (! $employee) {
        return response()->json(['error' => 'No other employee found for testing']);
    }

    $controller = new \App\Http\Controllers\EmployeeController;
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('canDeleteEmployee');
    $method->setAccessible(true);
    $canDelete = $method->invoke($controller, $currentUser, $employee);

    return response()->json([
        'current_user' => [
            'id' => $currentUser->id,
            'name' => $currentUser->name,
            'roles' => $currentUser->roles->pluck('name'),
            'has_users_delete_permission' => $currentUser->can('users.delete'),
            'has_super_admin_role' => $currentUser->hasRole('Super Administrator'),
            'has_hr_manager_role' => $currentUser->hasRole('HR Manager'),
            'has_administrator_role' => $currentUser->hasRole('Administrator'),
        ],
        'target_employee' => [
            'id' => $employee->id,
            'name' => $employee->name,
        ],
        'can_delete' => $canDelete,
        'authorization_result' => $canDelete ? 'AUTHORIZED' : 'UNAUTHORIZED',
    ]);
});

// Event Management Public Routes (no authentication required)
Route::prefix('events')->group(function () {
    Route::get('/', [\App\Http\Controllers\PublicEventController::class, 'index'])->name('public.events.index');
    Route::get('/{slug}', [\App\Http\Controllers\PublicEventController::class, 'show'])->name('public.events.show');
    Route::post('/{slug}/register', [\App\Http\Controllers\PublicEventController::class, 'register'])->name('public.events.register');
    Route::get('/{slug}/registration-success/{token}', [\App\Http\Controllers\PublicEventController::class, 'registrationSuccess'])->name('public.events.registration-success');
    Route::get('/check-registration', [\App\Http\Controllers\PublicEventController::class, 'checkRegistration'])->name('public.events.check-registration');
    Route::get('/token/{token}/download', [\App\Http\Controllers\PublicEventController::class, 'downloadToken'])->name('public.events.download-token');
});

// Event Management Admin Routes (require authentication and permissions)
Route::middleware(['auth', 'verified'])->prefix('admin/events')->group(function () {
    // Create route must come before {event} routes to avoid matching "create" as an event ID
    Route::middleware(['module:event-management,events,event-list,create'])->group(function () {
        Route::get('/create', [\App\Http\Controllers\EventController::class, 'create'])->name('events.create');
        Route::post('/', [\App\Http\Controllers\EventController::class, 'store'])->name('events.store');
    });

    // Event CRUD - View routes
    Route::middleware(['module:event-management,events'])->group(function () {
        Route::get('/', [\App\Http\Controllers\EventController::class, 'index'])->name('events.index');
        Route::get('/{event}/analytics', [\App\Http\Controllers\EventController::class, 'analytics'])->name('events.analytics');
        Route::get('/{event}', [\App\Http\Controllers\EventController::class, 'show'])->name('events.show');
    });

    Route::middleware(['module:event-management,events,event-list,create'])->group(function () {
        Route::post('/{event}/duplicate', [\App\Http\Controllers\EventController::class, 'duplicate'])->name('events.duplicate');
    });

    Route::middleware(['module:event-management,events,event-list,update'])->group(function () {
        Route::get('/{event}/edit', [\App\Http\Controllers\EventController::class, 'edit'])->name('events.edit');
        Route::put('/{event}', [\App\Http\Controllers\EventController::class, 'update'])->name('events.update');
        Route::post('/{event}/toggle-publish', [\App\Http\Controllers\EventController::class, 'togglePublish'])->name('events.toggle-publish');
    });

    Route::middleware(['module:event-management,events,event-list,delete'])->group(function () {
        Route::delete('/{event}', [\App\Http\Controllers\EventController::class, 'destroy'])->name('events.destroy');
    });

    // Sub-Events Management
    Route::middleware(['module:event-management,events,event-list,update'])->group(function () {
        Route::post('/{event}/sub-events', [\App\Http\Controllers\SubEventController::class, 'store'])->name('sub-events.store');
        Route::put('/{event}/sub-events/{subEvent}', [\App\Http\Controllers\SubEventController::class, 'update'])->name('sub-events.update');
        Route::delete('/{event}/sub-events/{subEvent}', [\App\Http\Controllers\SubEventController::class, 'destroy'])->name('sub-events.destroy');
        Route::post('/{event}/sub-events/reorder', [\App\Http\Controllers\SubEventController::class, 'reorder'])->name('sub-events.reorder');
        Route::post('/{event}/sub-events/{subEvent}/toggle-active', [\App\Http\Controllers\SubEventController::class, 'toggleActive'])->name('sub-events.toggle-active');
    });

    // Registration Management
    Route::middleware(['module:event-management,registrations'])->group(function () {
        Route::get('/{event}/registrations', [\App\Http\Controllers\EventRegistrationController::class, 'index'])->name('events.registrations.index');
        Route::get('/{event}/registrations/{registration}', [\App\Http\Controllers\EventRegistrationController::class, 'show'])->name('events.registrations.show');
        Route::post('/{event}/registrations/{registration}/approve', [\App\Http\Controllers\EventRegistrationController::class, 'approve'])->name('events.registrations.approve');
        Route::post('/{event}/registrations/{registration}/reject', [\App\Http\Controllers\EventRegistrationController::class, 'reject'])->name('events.registrations.reject');
        Route::post('/{event}/registrations/{registration}/cancel', [\App\Http\Controllers\EventRegistrationController::class, 'cancel'])->name('events.registrations.cancel');
        Route::post('/{event}/registrations/{registration}/verify-payment', [\App\Http\Controllers\EventRegistrationController::class, 'verifyPayment'])->name('events.registrations.verify-payment');
        Route::post('/{event}/registrations/bulk-approve', [\App\Http\Controllers\EventRegistrationController::class, 'bulkApprove'])->name('events.registrations.bulk-approve');
        Route::post('/{event}/registrations/bulk-reject', [\App\Http\Controllers\EventRegistrationController::class, 'bulkReject'])->name('events.registrations.bulk-reject');
        Route::get('/{event}/registrations/export/csv', [\App\Http\Controllers\EventRegistrationController::class, 'exportCsv'])->name('events.registrations.export-csv');
        Route::get('/{event}/registrations/export/pdf', [\App\Http\Controllers\EventRegistrationController::class, 'exportPdf'])->name('events.registrations.export-pdf');
        Route::get('/{event}/registrations/{registration}/print-token', [\App\Http\Controllers\EventRegistrationController::class, 'printToken'])->name('events.registrations.print-token');
    });
});

// Include all module routes
require __DIR__.'/modules.php';
require __DIR__.'/compliance.php';
require __DIR__.'/quality.php';
require __DIR__.'/analytics.php';
require __DIR__.'/project-management.php';
require __DIR__.'/hr.php';
require __DIR__.'/dms.php';
require __DIR__.'/support.php';

// NOTE: Auth routes are loaded via platform.php (central) and tenant.php (tenants)
// to ensure proper database context. Do not include auth.php here.
