<?php

namespace Aero\HRM\Providers;

use Aero\Core\Providers\AbstractModuleProvider;
use Aero\Core\Services\NavigationRegistry;
use Aero\Core\Services\UserRelationshipRegistry;
use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\AttendanceType;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
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
     * Register HRM navigation items with NavigationRegistry.
     * Navigation is derived from config/module.php submodules for consistency.
     *
     * Structure: Module → Submodules → Components (3 levels)
     */
    protected function registerNavigation(): void
    {
        if (! $this->app->bound(NavigationRegistry::class)) {
            return;
        }

        $navRegistry = $this->app->make(NavigationRegistry::class);
        $config = $this->getModuleConfig();
        $modulePriority = $this->getModulePriority();

        // Build navigation children from config submodules
        $submoduleNav = [];
        foreach ($config['submodules'] ?? [] as $submodule) {
            $submoduleCode = $submodule['code'] ?? '';
            $submoduleIcon = $submodule['icon'] ?? null;

            // Build component children for this submodule
            $componentNav = [];
            foreach ($submodule['components'] ?? [] as $component) {
                $componentNav[] = [
                    'name' => $component['name'] ?? ucfirst($component['code'] ?? ''),
                    'path' => $component['route'] ?? '',
                    'icon' => $component['icon'] ?? $submoduleIcon, // Inherit submodule icon if not set
                    'access' => $this->moduleCode.'.'.$submoduleCode.'.'.($component['code'] ?? ''),
                    'type' => $component['type'] ?? 'page',
                ];
            }

            $submoduleNav[] = [
                'name' => $submodule['name'] ?? ucfirst($submoduleCode),
                'path' => $submodule['route'] ?? '',
                'icon' => $submoduleIcon,
                'access' => $this->moduleCode.'.'.$submoduleCode,
                'priority' => $submodule['priority'] ?? 100,
                'children' => $componentNav,
            ];
        }

        // Sort submodules by priority
        usort($submoduleNav, fn ($a, $b) => ($a['priority'] ?? 100) <=> ($b['priority'] ?? 100));

        // Register main HRM navigation with module as parent wrapper
        // Scope: 'tenant' - HRM is for tenant users only
        $navRegistry->register($this->moduleCode, [
            [
                'name' => $config['name'] ?? 'Human Resources',
                'icon' => $config['icon'] ?? 'UserGroupIcon',
                'access' => $this->moduleCode,
                'priority' => $modulePriority,
                'children' => $submoduleNav,
            ],
        ], $modulePriority, 'tenant');
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
