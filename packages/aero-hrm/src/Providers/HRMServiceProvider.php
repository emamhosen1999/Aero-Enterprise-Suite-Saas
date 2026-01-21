<?php

namespace Aero\HRM\Providers;

use Aero\Core\Providers\AbstractModuleProvider;
use Aero\Core\Services\UserRelationshipRegistry;
use Aero\HRM\Jobs\CheckBirthdaysJob;
use Aero\HRM\Jobs\CheckExpiringContractsJob;
use Aero\HRM\Jobs\CheckExpiringDocumentsJob;
use Aero\HRM\Jobs\CheckProbationEndingJob;
use Aero\HRM\Jobs\CheckWorkAnniversariesJob;
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\AttendanceType;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\EmployeeEducation;
use Aero\HRM\Models\EmployeeWorkExperience;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Aero\HRM\Services\HrmNotificationChannelResolver;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Gate;

/**
 * HRM Module Provider
 *
 * Provides Human Resources Management functionality including employee management,
 * attendance tracking, leave management, payroll, performance reviews, and recruitment.
 *
 * All module metadata is read from config/module.php (single source of truth).
 * This provider only contains module-specific services, policies, and relationships.
 */
class HRMServiceProvider extends AbstractModuleProvider
{
    /**
     * Module code - the only required property.
     * All other metadata is read from config/module.php.
     */
    protected string $moduleCode = 'hrm';

    /**
     * Get the module path.
     */
    protected function getModulePath(string $path = ''): string
    {
        $basePath = dirname(__DIR__, 2);

        return $path ? $basePath.'/'.$path : $basePath;
    }

    /**
     * Override parent loadRoutes to prevent duplicate route registration.
     * Routes are registered by AeroHrmServiceProvider with proper middleware.
     */
    protected function loadRoutes(): void
    {
        // Do nothing - routes handled by AeroHrmServiceProvider
    }

    /**
     * Register module services.
     */
    protected function registerServices(): void
    {
        // Register HRM Event Service Provider
        $this->app->register(HrmEventServiceProvider::class);

        // Register HRM Notification Channel Resolver (HRM-specific, no core dependency)
        $this->app->singleton(HrmNotificationChannelResolver::class, function ($app) {
            return new HrmNotificationChannelResolver;
        });

        // Register EmployeeService - implements Core's EmployeeServiceContract
        // This enables cross-package employee data access without direct model coupling
        $this->app->singleton(\Aero\HRM\Services\EmployeeService::class, function ($app) {
            return new \Aero\HRM\Services\EmployeeService;
        });

        // Also bind to the Core contract interface
        $this->app->singleton(
            \Aero\Core\Contracts\EmployeeServiceContract::class,
            \Aero\HRM\Services\EmployeeService::class
        );

        // Register main HRM service
        $this->app->singleton('hrm', function ($app) {
            return new \Aero\HRM\Services\HRMetricsAggregatorService;
        });

        // Register specific services
        $this->app->singleton('hrm.leave', function ($app) {
            return new \Aero\HRM\Services\LeaveBalanceService;
        });

        $this->app->singleton('hrm.attendance', function ($app) {
            return new \Aero\HRM\Services\AttendanceCalculationService;
        });

        $this->app->singleton('hrm.payroll', function ($app) {
            return new \Aero\HRM\Services\PayrollCalculationService;
        });

        // Register AI Analytics Services
        $this->app->singleton(\Aero\HRM\Services\AIAnalytics\AttritionPredictionService::class);
        $this->app->singleton(\Aero\HRM\Services\AIAnalytics\BurnoutRiskService::class);
        $this->app->singleton(\Aero\HRM\Services\AIAnalytics\PerformancePredictionService::class);
        $this->app->singleton(\Aero\HRM\Services\AIAnalytics\RecruitmentAnalyticsService::class);
        $this->app->singleton(\Aero\HRM\Services\AIAnalytics\WorkforceAnalyticsService::class);

        // Merge HRM-specific configuration
        $hrmConfigPath = $this->getModulePath('config/hrm.php');
        if (file_exists($hrmConfigPath)) {
            $this->mergeConfigFrom($hrmConfigPath, 'hrm');
        }
    }

    /**
     * Boot HRM module.
     */
    protected function bootModule(): void
    {
        // Register policies
        $this->registerPolicies();

        // Register User model relationships dynamically
        $this->registerUserRelationships();

        // Register navigation items for auto-discovery
        $this->registerNavigation();

        // Register console commands
        $this->registerCommands();

        // Register scheduled jobs
        $this->registerScheduledJobs();

        // Register dashboard widgets for Core Dashboard
        $this->registerDashboardWidgets();

        // Register HRM dashboards with DashboardRegistry
        $this->registerDashboards();
    }

    /**
     * Register HRM scheduled jobs.
     *
     * These jobs run daily to check for employee-related events:
     * - Birthdays and work anniversaries
     * - Expiring documents, probation periods, and contracts
     */
    protected function registerScheduledJobs(): void
    {
        $this->callAfterResolving(Schedule::class, function (Schedule $schedule) {
            // Birthday and Anniversary checks - run at 8:00 AM
            $schedule->job(new CheckBirthdaysJob)
                ->dailyAt('08:00')
                ->name('hrm:check-birthdays')
                ->withoutOverlapping()
                ->onOneServer();

            $schedule->job(new CheckWorkAnniversariesJob)
                ->dailyAt('08:00')
                ->name('hrm:check-work-anniversaries')
                ->withoutOverlapping()
                ->onOneServer();

            // Document and Contract expiry checks - run at 9:00 AM
            $schedule->job(new CheckExpiringDocumentsJob)
                ->dailyAt('09:00')
                ->name('hrm:check-expiring-documents')
                ->withoutOverlapping()
                ->onOneServer();

            $schedule->job(new CheckProbationEndingJob)
                ->dailyAt('09:00')
                ->name('hrm:check-probation-ending')
                ->withoutOverlapping()
                ->onOneServer();

            $schedule->job(new CheckExpiringContractsJob)
                ->dailyAt('09:00')
                ->name('hrm:check-expiring-contracts')
                ->withoutOverlapping()
                ->onOneServer();
        });
    }

    /**
     * Register HRM dashboards with the DashboardRegistry.
     *
     * This allows roles to be assigned to specific HRM dashboards:
     * - hrm.dashboard: For HR Managers and Staff (full analytics)
     * - hrm.employee.dashboard: For regular employees (personal view)
     */
    protected function registerDashboards(): void
    {
        // Only register if the registry is available
        if (! $this->app->bound(\Aero\Core\Services\DashboardRegistry::class)) {
            return;
        }

        $registry = $this->app->make(\Aero\Core\Services\DashboardRegistry::class);

        $registry->registerMany([
            [
                'route' => 'hrm.dashboard',
                'label' => 'HRM Dashboard',
                'module' => 'hrm',
                'description' => 'Full HR analytics for HR Managers and Staff',
                'icon' => 'UserGroupIcon',
                'requiredPermission' => 'hrm.dashboard',
            ],
            [
                'route' => 'hrm.employee.dashboard',
                'label' => 'Employee Dashboard',
                'module' => 'hrm',
                'description' => 'Personal dashboard for employees (leaves, attendance, payslips)',
                'icon' => 'UserIcon',
                'requiredPermission' => 'hrm.employee-self-service',
            ],
        ]);
    }

    /**
     * Register HRM widgets for the Core Dashboard.
     *
     * These are ACTION/ALERT/SUMMARY widgets only.
     * Full analytics stay on HRM Dashboard (/hrm/dashboard).
     */
    protected function registerDashboardWidgets(): void
    {
        // Only register if the registry is available
        if (! $this->app->bound(\Aero\Core\Services\DashboardWidgetRegistry::class)) {
            return;
        }

        $registry = $this->app->make(\Aero\Core\Services\DashboardWidgetRegistry::class);

        // Register HRM widgets for Core Dashboard
        $registry->registerMany([
            // Leave & Attendance widgets
            new \Aero\HRM\Widgets\PunchStatusWidget,
            new \Aero\HRM\Widgets\MyLeaveBalanceWidget,
            new \Aero\HRM\Widgets\PendingLeaveApprovalsWidget,
            new \Aero\HRM\Widgets\UpcomingHolidaysWidget,
            new \Aero\HRM\Widgets\OrganizationInfoWidget,
            // Performance Management widgets
            new \Aero\HRM\Widgets\MyGoalsWidget,
            new \Aero\HRM\Widgets\PendingReviewsWidget,
            // Manager widgets
            new \Aero\HRM\Widgets\TeamAttendanceWidget,
            new \Aero\HRM\Widgets\PayrollSummaryWidget,
        ]);
    }

    /**
     * Register User model relationships via UserRelationshipRegistry.
     * This allows the core User model to be extended without hard dependencies.
     */
    protected function registerUserRelationships(): void
    {
        if (! $this->app->bound(UserRelationshipRegistry::class)) {
            return;
        }

        $registry = $this->app->make(UserRelationshipRegistry::class);

        // Register employee relationship
        $registry->registerRelationship('employee', function ($user) {
            return $user->hasOne(Employee::class);
        });

        // Register department through employee
        $registry->registerRelationship('department', function ($user) {
            return $user->hasOneThrough(
                Department::class,
                Employee::class,
                'user_id',
                'id',
                'id',
                'department_id'
            );
        });

        // Register designation through employee
        $registry->registerRelationship('designation', function ($user) {
            return $user->hasOneThrough(
                Designation::class,
                Employee::class,
                'user_id',
                'id',
                'id',
                'designation_id'
            );
        });

        // Register leaves relationship
        $registry->registerRelationship('leaves', function ($user) {
            return $user->hasMany(Leave::class, 'user_id');
        });

        // Register attendances relationship
        $registry->registerRelationship('attendances', function ($user) {
            return $user->hasMany(Attendance::class, 'user_id');
        });

        // Register attendance type relationship
        $registry->registerRelationship('attendanceType', function ($user) {
            return $user->belongsTo(AttendanceType::class, 'attendance_type_id');
        });
        $registry->registerRelationship('educations', function ($user) {
            return $user->hasMany(EmployeeEducation::class, 'user_id');
        });
        $registry->registerRelationship('experiences', function ($user) {
            return $user->hasMany(EmployeeWorkExperience::class, 'user_id');
        });

        // Register scopes for user queries
        $registry->registerScope('employees', function ($query) {
            return $query->whereHas('employee');
        });

        $registry->registerScope('nonEmployees', function ($query) {
            return $query->whereDoesntHave('employee');
        });

        $registry->registerScope('withBasicRelations', function ($query) {
            return $query->with(['employee', 'employee.department', 'employee.designation']);
        });

        $registry->registerScope('withFullRelations', function ($query) {
            return $query->with([
                'employee',
                'employee.department',
                'employee.designation',
                'leaves',
                'attendances',
            ]);
        });

        // Register computed accessors
        $registry->registerAccessor('is_employee', function ($user) {
            return $user->employee !== null;
        });

        $registry->registerAccessor('employee_id', function ($user) {
            return $user->employee?->id;
        });

        $registry->registerAccessor('department_name', function ($user) {
            return $user->employee?->department?->name;
        });

        $registry->registerAccessor('designation_name', function ($user) {
            return $user->employee?->designation?->name;
        });
    }

    /**
     * Register policies.
     */
    protected function registerPolicies(): void
    {
        // Register model policies if they exist
        $policies = [
            \Aero\HRM\Models\Employee::class => \Aero\HRM\Policies\EmployeePolicy::class,
            \Aero\HRM\Models\Leave::class => \Aero\HRM\Policies\LeavePolicy::class,
            \Aero\HRM\Models\Attendance::class => \Aero\HRM\Policies\AttendancePolicy::class,
        ];

        foreach ($policies as $model => $policy) {
            if (class_exists($policy)) {
                Gate::policy($model, $policy);
            }
        }
    }

    /**
     * Register console commands.
     */
    protected function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                \Aero\HRM\Console\Commands\SendOnboardingRemindersCommand::class,
            ]);
        }
    }

    /**
     * Register this module with the ModuleRegistry.
     */
    public function register(): void
    {
        parent::register();

        // Register this module with the registry
        $registry = $this->app->make(\Aero\Core\Services\ModuleRegistry::class);
        $registry->register($this);
    }
}
