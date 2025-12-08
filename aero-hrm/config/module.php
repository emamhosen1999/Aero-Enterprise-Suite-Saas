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
];
