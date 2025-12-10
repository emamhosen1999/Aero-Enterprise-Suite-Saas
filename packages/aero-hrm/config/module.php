<?php

return [
    /*
    |--------------------------------------------------------------------------
    | HRM Module Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration specific to the HRM module that will
    | be merged into the main application's modules configuration.
    |
    */

    'code' => 'hrm',
    'name' => 'Human Resources',
    'description' => 'Complete HR management system with employee records, attendance, leave, payroll, performance reviews, and recruitment',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'UserGroupIcon',
    'priority' => 10,
    'enabled' => env('HRM_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core'],

    /*
    |--------------------------------------------------------------------------
    | Module Features
    |--------------------------------------------------------------------------
    |
    | Enable or disable specific features within the HRM module.
    |
    */
    'features' => [
        'employees' => true,
        'attendance' => true,
        'leave_management' => true,
        'payroll' => true,
        'performance_reviews' => true,
        'recruitment' => true,
        'onboarding' => true,
        'training' => true,
        'documents' => true,
        'analytics' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Employee Settings
    |--------------------------------------------------------------------------
    */
    'employee' => [
        'code_prefix' => env('HRM_EMPLOYEE_CODE_PREFIX', 'EMP'),
        'code_length' => env('HRM_EMPLOYEE_CODE_LENGTH', 6),
        'probation_period' => env('HRM_PROBATION_PERIOD', 90), // days
        'default_department' => env('HRM_DEFAULT_DEPARTMENT', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Attendance Settings
    |--------------------------------------------------------------------------
    */
    'attendance' => [
        'methods' => [
            'manual' => env('HRM_ATTENDANCE_MANUAL', true),
            'qr_code' => env('HRM_ATTENDANCE_QR', true),
            'gps' => env('HRM_ATTENDANCE_GPS', true),
            'ip' => env('HRM_ATTENDANCE_IP', true),
            'route' => env('HRM_ATTENDANCE_ROUTE', true),
        ],
        'grace_period' => env('HRM_ATTENDANCE_GRACE_PERIOD', 15), // minutes
        'half_day_hours' => env('HRM_ATTENDANCE_HALF_DAY_HOURS', 4),
        'full_day_hours' => env('HRM_ATTENDANCE_FULL_DAY_HOURS', 8),
        'overtime_threshold' => env('HRM_ATTENDANCE_OVERTIME_THRESHOLD', 8), // hours
    ],

    /*
    |--------------------------------------------------------------------------
    | Leave Settings
    |--------------------------------------------------------------------------
    */
    'leave' => [
        'require_approval' => env('HRM_LEAVE_REQUIRE_APPROVAL', true),
        'approval_levels' => env('HRM_LEAVE_APPROVAL_LEVELS', 1),
        'default_allocations' => [
            'annual' => env('HRM_LEAVE_ANNUAL', 15),
            'sick' => env('HRM_LEAVE_SICK', 10),
            'casual' => env('HRM_LEAVE_CASUAL', 7),
        ],
        'allow_negative_balance' => env('HRM_LEAVE_ALLOW_NEGATIVE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Payroll Settings
    |--------------------------------------------------------------------------
    */
    'payroll' => [
        'currency' => env('HRM_PAYROLL_CURRENCY', 'USD'),
        'pay_frequency' => env('HRM_PAYROLL_FREQUENCY', 'monthly'),
        'enable_tax' => env('HRM_PAYROLL_ENABLE_TAX', true),
        'payroll_day' => env('HRM_PAYROLL_DAY', 1), // Day of month
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Review Settings
    |--------------------------------------------------------------------------
    */
    'performance' => [
        'review_cycle' => env('HRM_REVIEW_CYCLE', 'annual'),
        'rating_scale' => env('HRM_RATING_SCALE', 5),
        'self_review_enabled' => env('HRM_SELF_REVIEW_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Recruitment Settings
    |--------------------------------------------------------------------------
    */
    'recruitment' => [
        'public_job_board' => env('HRM_PUBLIC_JOB_BOARD', true),
        'applicant_tracking' => env('HRM_APPLICANT_TRACKING', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Permission Structure
    |--------------------------------------------------------------------------
    |
    | Defines the hierarchical permission structure for the HRM module.
    | Used by aero:sync-modules command to populate the database.
    | Structure: Module → Submodules → Components → Actions
    |
    */
    'submodules' => [
        // Employee Management
        [
            'code' => 'employees',
            'name' => 'Employee Management',
            'description' => 'Manage employee records, departments, and organizational structure',
            'icon' => 'UsersIcon',
            'route' => '/tenant/hr/employees',
            'priority' => 1,
            'components' => [
                [
                    'code' => 'employee-directory',
                    'name' => 'Employee Directory',
                    'description' => 'Employee listing and profiles',
                    'type' => 'page',
                    'route' => '/tenant/hr/employees',
                    'priority' => 1,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Employees', 'description' => 'View employee list and details'],
                        ['code' => 'create', 'name' => 'Create Employee', 'description' => 'Add new employee records'],
                        ['code' => 'edit', 'name' => 'Edit Employee', 'description' => 'Update employee information'],
                        ['code' => 'delete', 'name' => 'Delete Employee', 'description' => 'Remove employee records'],
                        ['code' => 'export', 'name' => 'Export Employee Data', 'description' => 'Export employee data to CSV/Excel'],
                    ],
                ],
                [
                    'code' => 'departments',
                    'name' => 'Departments',
                    'description' => 'Manage organizational departments',
                    'type' => 'page',
                    'route' => '/tenant/hr/departments',
                    'priority' => 2,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Departments', 'description' => 'View department list'],
                        ['code' => 'create', 'name' => 'Create Department', 'description' => 'Add new departments'],
                        ['code' => 'edit', 'name' => 'Edit Department', 'description' => 'Update department details'],
                        ['code' => 'delete', 'name' => 'Delete Department', 'description' => 'Remove departments'],
                    ],
                ],
                [
                    'code' => 'designations',
                    'name' => 'Designations',
                    'description' => 'Manage job titles and positions',
                    'type' => 'page',
                    'route' => '/tenant/hr/designations',
                    'priority' => 3,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Designations', 'description' => 'View designation list'],
                        ['code' => 'create', 'name' => 'Create Designation', 'description' => 'Add new designations'],
                        ['code' => 'edit', 'name' => 'Edit Designation', 'description' => 'Update designation details'],
                        ['code' => 'delete', 'name' => 'Delete Designation', 'description' => 'Remove designations'],
                    ],
                ],
            ],
        ],
        // Attendance Management
        [
            'code' => 'attendance',
            'name' => 'Attendance Management',
            'description' => 'Track and manage employee attendance',
            'icon' => 'ClockIcon',
            'route' => '/tenant/hr/attendance',
            'priority' => 2,
            'components' => [
                [
                    'code' => 'tracking',
                    'name' => 'Attendance Tracking',
                    'description' => 'Daily attendance tracking and records',
                    'type' => 'page',
                    'route' => '/tenant/hr/attendance/tracking',
                    'priority' => 1,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Attendance', 'description' => 'View attendance records'],
                        ['code' => 'mark', 'name' => 'Mark Attendance', 'description' => 'Mark employee attendance'],
                        ['code' => 'edit', 'name' => 'Edit Attendance', 'description' => 'Update attendance records'],
                        ['code' => 'export', 'name' => 'Export Attendance', 'description' => 'Export attendance reports'],
                    ],
                ],
            ],
        ],
        // Leave Management
        [
            'code' => 'leaves',
            'name' => 'Leave Management',
            'description' => 'Manage employee leave requests and balances',
            'icon' => 'CalendarDaysIcon',
            'route' => '/tenant/hr/leaves',
            'priority' => 3,
            'components' => [
                [
                    'code' => 'requests',
                    'name' => 'Leave Requests',
                    'description' => 'Employee leave requests and approvals',
                    'type' => 'page',
                    'route' => '/tenant/hr/leaves/requests',
                    'priority' => 1,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Leave Requests', 'description' => 'View all leave requests'],
                        ['code' => 'create', 'name' => 'Create Leave Request', 'description' => 'Submit new leave request'],
                        ['code' => 'approve', 'name' => 'Approve Leave', 'description' => 'Approve leave requests'],
                        ['code' => 'reject', 'name' => 'Reject Leave', 'description' => 'Reject leave requests'],
                        ['code' => 'delete', 'name' => 'Delete Leave Request', 'description' => 'Delete leave requests'],
                    ],
                ],
            ],
        ],
        // Payroll Management
        [
            'code' => 'payroll',
            'name' => 'Payroll Management',
            'description' => 'Process and manage employee payroll',
            'icon' => 'CurrencyDollarIcon',
            'route' => '/tenant/hr/payroll',
            'priority' => 4,
            'components' => [
                [
                    'code' => 'processing',
                    'name' => 'Salary Processing',
                    'description' => 'Monthly salary processing and payslips',
                    'type' => 'page',
                    'route' => '/tenant/hr/payroll/processing',
                    'priority' => 1,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Payroll', 'description' => 'View payroll records'],
                        ['code' => 'process', 'name' => 'Process Payroll', 'description' => 'Generate monthly payroll'],
                        ['code' => 'approve', 'name' => 'Approve Payroll', 'description' => 'Approve payroll processing'],
                        ['code' => 'export', 'name' => 'Export Payroll', 'description' => 'Export payroll reports'],
                    ],
                ],
            ],
        ],
        // Performance Management
        [
            'code' => 'performance',
            'name' => 'Performance Management',
            'description' => 'Employee performance reviews and KPIs',
            'icon' => 'ChartBarIcon',
            'route' => '/tenant/hr/performance',
            'priority' => 5,
            'components' => [
                [
                    'code' => 'reviews',
                    'name' => 'Performance Reviews',
                    'description' => 'Annual and periodic performance reviews',
                    'type' => 'page',
                    'route' => '/tenant/hr/performance/reviews',
                    'priority' => 1,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Reviews', 'description' => 'View performance reviews'],
                        ['code' => 'create', 'name' => 'Create Review', 'description' => 'Create new review'],
                        ['code' => 'submit', 'name' => 'Submit Review', 'description' => 'Submit completed review'],
                        ['code' => 'approve', 'name' => 'Approve Review', 'description' => 'Approve review submissions'],
                    ],
                ],
            ],
        ],
    ],
];
