<?php

namespace Aero\HRM\Providers;

use Aero\Core\Providers\AbstractModuleProvider;
use Illuminate\Support\Facades\Gate;

/**
 * HRM Module Provider
 *
 * Provides Human Resources Management functionality including employee management,
 * attendance tracking, leave management, payroll, performance reviews, and recruitment.
 */
class HRMServiceProvider extends AbstractModuleProvider
{
    /**
     * Module code.
     */
    protected string $moduleCode = 'hrm';

    /**
     * Module display name.
     */
    protected string $moduleName = 'Human Resources';

    /**
     * Module description.
     */
    protected string $moduleDescription = 'Complete HR management system with employee records, attendance, leave, payroll, performance reviews, and recruitment';

    /**
     * Module version.
     */
    protected string $moduleVersion = '1.0.0';

    /**
     * Module category.
     */
    protected string $moduleCategory = 'business';

    /**
     * Module icon.
     */
    protected string $moduleIcon = 'UserGroupIcon';

    /**
     * Module priority.
     */
    protected int $modulePriority = 10;

    /**
     * Module is enabled by default.
     */
    protected bool $enabled = true;

    /**
     * Minimum plan required.
     */
    protected ?string $minimumPlan = 'professional';

    /**
     * Module dependencies.
     */
    protected array $dependencies = ['core'];

    /**
     * Navigation items for HRM module.
     */
    protected array $navigationItems = [
        [
            'code' => 'hrm_dashboard',
            'name' => 'HR Dashboard',
            'icon' => 'ChartBarIcon',
            'route' => 'hr.dashboard',
            'priority' => 1,
        ],
        [
            'code' => 'hrm_employees',
            'name' => 'Employees',
            'icon' => 'UserIcon',
            'route' => 'employees.index',
            'priority' => 2,
        ],
        [
            'code' => 'hrm_attendance',
            'name' => 'Attendance',
            'icon' => 'ClockIcon',
            'route' => 'attendance.index',
            'priority' => 3,
        ],
        [
            'code' => 'hrm_leaves',
            'name' => 'Leave Management',
            'icon' => 'CalendarIcon',
            'route' => 'leaves.index',
            'priority' => 4,
        ],
        [
            'code' => 'hrm_payroll',
            'name' => 'Payroll',
            'icon' => 'CurrencyDollarIcon',
            'route' => 'hr.payroll.index',
            'priority' => 5,
        ],
        [
            'code' => 'hrm_performance',
            'name' => 'Performance',
            'icon' => 'StarIcon',
            'route' => 'hr.performance.index',
            'priority' => 6,
        ],
        [
            'code' => 'hrm_recruitment',
            'name' => 'Recruitment',
            'icon' => 'BriefcaseIcon',
            'route' => 'hr.recruitment.index',
            'priority' => 7,
        ],
    ];

    /**
     * Module hierarchy.
     */
    protected array $moduleHierarchy = [
        'code' => 'hrm',
        'name' => 'Human Resources',
        'description' => 'Complete HR management system',
        'icon' => 'UserGroupIcon',
        'priority' => 10,
        'is_active' => true,
        'requires_subscription' => true,
        'route_prefix' => 'hr',
        'sub_modules' => [
            [
                'code' => 'employees',
                'name' => 'Employee Management',
                'description' => 'Manage employee information and records',
                'icon' => 'UserIcon',
                'priority' => 1,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'employee_list',
                        'name' => 'Employee List',
                        'description' => 'View and manage employees',
                        'route_name' => 'employees.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Employees', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Employee', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Employee', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Employee', 'is_active' => true],
                        ],
                    ],
                    [
                        'code' => 'employee_profile',
                        'name' => 'Employee Profile',
                        'description' => 'View employee profile details',
                        'route_name' => 'hr.profile.show',
                        'priority' => 2,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Profile', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Profile', 'is_active' => true],
                        ],
                    ],
                    [
                        'code' => 'departments',
                        'name' => 'Departments',
                        'description' => 'Manage departments',
                        'route_name' => 'departments.index',
                        'priority' => 3,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Departments', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Department', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Department', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Department', 'is_active' => true],
                        ],
                    ],
                    [
                        'code' => 'designations',
                        'name' => 'Designations',
                        'description' => 'Manage job designations',
                        'route_name' => 'designations.index',
                        'priority' => 4,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Designations', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Designation', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Designation', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Designation', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'attendance',
                'name' => 'Attendance Management',
                'description' => 'Track employee attendance and work hours',
                'icon' => 'ClockIcon',
                'priority' => 2,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'attendance_list',
                        'name' => 'Attendance Records',
                        'description' => 'View attendance records',
                        'route_name' => 'attendance.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Attendance', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Mark Attendance', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Attendance', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Attendance', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'leaves',
                'name' => 'Leave Management',
                'description' => 'Manage employee leave requests and balances',
                'icon' => 'CalendarIcon',
                'priority' => 3,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'leave_list',
                        'name' => 'Leave Requests',
                        'description' => 'View and manage leave requests',
                        'route_name' => 'leaves.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Leaves', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Apply Leave', 'is_active' => true],
                            ['code' => 'approve', 'name' => 'Approve Leave', 'is_active' => true],
                            ['code' => 'reject', 'name' => 'Reject Leave', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Leave', 'is_active' => true],
                        ],
                    ],
                    [
                        'code' => 'bulk_leave',
                        'name' => 'Bulk Leave',
                        'description' => 'Apply leave for multiple employees',
                        'route_name' => 'hr.bulkleave.index',
                        'priority' => 2,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Bulk Leave', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Bulk Leave', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'payroll',
                'name' => 'Payroll Management',
                'description' => 'Process employee payroll and salaries',
                'icon' => 'CurrencyDollarIcon',
                'priority' => 4,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'payroll_list',
                        'name' => 'Payroll Records',
                        'description' => 'View and manage payroll',
                        'route_name' => 'hr.payroll.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Payroll', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Payroll', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Payroll', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Payroll', 'is_active' => true],
                            ['code' => 'process', 'name' => 'Process Payroll', 'is_active' => true],
                        ],
                    ],
                    [
                        'code' => 'salary_structures',
                        'name' => 'Salary Structures',
                        'description' => 'Define salary structures',
                        'route_name' => 'hr.salarystructure.index',
                        'priority' => 2,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Salary Structures', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Salary Structure', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Salary Structure', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Salary Structure', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'performance',
                'name' => 'Performance Management',
                'description' => 'Manage employee performance reviews and KPIs',
                'icon' => 'StarIcon',
                'priority' => 5,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'performance_reviews',
                        'name' => 'Performance Reviews',
                        'description' => 'Conduct performance reviews',
                        'route_name' => 'hr.performance.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Reviews', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Review', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Review', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Review', 'is_active' => true],
                            ['code' => 'submit', 'name' => 'Submit Review', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'recruitment',
                'name' => 'Recruitment',
                'description' => 'Manage job postings and applicants',
                'icon' => 'BriefcaseIcon',
                'priority' => 6,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'job_postings',
                        'name' => 'Job Postings',
                        'description' => 'Manage job postings',
                        'route_name' => 'hr.recruitment.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Jobs', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Job', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Job', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Job', 'is_active' => true],
                            ['code' => 'publish', 'name' => 'Publish Job', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'onboarding',
                'name' => 'Onboarding',
                'description' => 'Manage employee onboarding process',
                'icon' => 'AcademicCapIcon',
                'priority' => 7,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'onboarding_list',
                        'name' => 'Onboarding Tasks',
                        'description' => 'Manage onboarding tasks',
                        'route_name' => 'hr.onboarding.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Onboarding', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Onboarding', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Onboarding', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Onboarding', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'training',
                'name' => 'Training & Development',
                'description' => 'Manage employee training programs',
                'icon' => 'BookOpenIcon',
                'priority' => 8,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'training_programs',
                        'name' => 'Training Programs',
                        'description' => 'Manage training programs',
                        'route_name' => 'hr.training.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Training', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Training', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Training', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Training', 'is_active' => true],
                            ['code' => 'enroll', 'name' => 'Enroll Employee', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'documents',
                'name' => 'Document Management',
                'description' => 'Manage HR documents',
                'icon' => 'DocumentTextIcon',
                'priority' => 9,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'hr_documents',
                        'name' => 'HR Documents',
                        'description' => 'Manage HR documents',
                        'route_name' => 'hr.documents.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Documents', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Upload Document', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Document', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Document', 'is_active' => true],
                            ['code' => 'download', 'name' => 'Download Document', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'analytics',
                'name' => 'HR Analytics',
                'description' => 'HR metrics and reporting',
                'icon' => 'ChartBarIcon',
                'priority' => 10,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'hr_analytics',
                        'name' => 'HR Analytics',
                        'description' => 'View HR metrics and analytics',
                        'route_name' => 'hr.analytics.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Analytics', 'is_active' => true],
                        ],
                    ],
                ],
            ],
        ],
    ];

    /**
     * Get the module path.
     */
    protected function getModulePath(string $path = ''): string
    {
        $basePath = dirname(__DIR__, 2);
        return $path ? $basePath . '/' . $path : $basePath;
    }

    /**
     * Register module services.
     */
    protected function registerServices(): void
    {
        // Register main HRM service
        $this->app->singleton('hrm', function ($app) {
            return new \Aero\HRM\Services\HRMetricsAggregatorService();
        });

        // Register specific services
        $this->app->singleton('hrm.leave', function ($app) {
            return new \Aero\HRM\Services\LeaveBalanceService();
        });

        $this->app->singleton('hrm.attendance', function ($app) {
            return new \Aero\HRM\Services\AttendanceCalculationService();
        });

        $this->app->singleton('hrm.payroll', function ($app) {
            return new \Aero\HRM\Services\PayrollCalculationService();
        });

        // Merge HRM-specific configuration
        $this->mergeConfigFrom(
            $this->getModulePath('config/hrm.php'),
            'hrm'
        );
    }

    /**
     * Boot HRM module.
     */
    protected function bootModule(): void
    {
        // Register policies
        $this->registerPolicies();
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