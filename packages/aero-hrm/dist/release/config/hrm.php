<?php

return [
    /*
    |--------------------------------------------------------------------------
    | HRM Module Configuration
    |--------------------------------------------------------------------------
    */

    'enabled' => env('HRM_MODULE_ENABLED', true),

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
        'max_consecutive_days' => env('HRM_LEAVE_MAX_CONSECUTIVE_DAYS', 30),
        'advance_notice_days' => env('HRM_LEAVE_ADVANCE_NOTICE_DAYS', 3),
        'allow_weekend_counting' => env('HRM_LEAVE_COUNT_WEEKENDS', false),
        'allow_holiday_counting' => env('HRM_LEAVE_COUNT_HOLIDAYS', false),

        // Default leave allocations (per year)
        'default_allocations' => [
            'annual' => env('HRM_LEAVE_ANNUAL', 15),
            'sick' => env('HRM_LEAVE_SICK', 10),
            'casual' => env('HRM_LEAVE_CASUAL', 7),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Payroll Settings
    |--------------------------------------------------------------------------
    */
    'payroll' => [
        'currency' => env('HRM_PAYROLL_CURRENCY', 'USD'),
        'pay_frequency' => env('HRM_PAYROLL_FREQUENCY', 'monthly'), // monthly, bi-weekly, weekly
        'payment_day' => env('HRM_PAYROLL_PAYMENT_DAY', 1), // day of month

        // Tax settings
        'enable_tax' => env('HRM_PAYROLL_ENABLE_TAX', true),
        'tax_method' => env('HRM_PAYROLL_TAX_METHOD', 'progressive'), // flat, progressive

        // Deductions
        'enable_pf' => env('HRM_PAYROLL_ENABLE_PF', true), // Provident Fund
        'enable_esi' => env('HRM_PAYROLL_ENABLE_ESI', true), // Employee State Insurance

        // Default components
        'components' => [
            'basic_percentage' => 40, // % of gross salary
            'hra_percentage' => 30,   // % of gross salary
            'transport_allowance' => 1600,
            'special_allowance' => 'remaining', // auto-calculated
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Management
    |--------------------------------------------------------------------------
    */
    'documents' => [
        'max_size' => env('HRM_DOCUMENT_MAX_SIZE', 10), // MB
        'allowed_types' => ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
        'categories' => [
            'identity',
            'education',
            'certification',
            'contract',
            'other',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Management
    |--------------------------------------------------------------------------
    */
    'performance' => [
        'enabled' => env('HRM_PERFORMANCE_ENABLED', true),
        'review_frequency' => env('HRM_PERFORMANCE_REVIEW_FREQUENCY', 'yearly'), // yearly, half-yearly, quarterly
        'rating_scale' => 5, // 1-5 rating
    ],

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */
    'notifications' => [
        'employee_created' => env('HRM_NOTIFY_EMPLOYEE_CREATED', true),
        'leave_requested' => env('HRM_NOTIFY_LEAVE_REQUESTED', true),
        'leave_approved' => env('HRM_NOTIFY_LEAVE_APPROVED', true),
        'attendance_marked' => env('HRM_NOTIFY_ATTENDANCE_MARKED', false),
        'payroll_generated' => env('HRM_NOTIFY_PAYROLL_GENERATED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Integration Settings
    |--------------------------------------------------------------------------
    */
    'integrations' => [
        'biometric' => env('HRM_INTEGRATION_BIOMETRIC', false),
        'google_calendar' => env('HRM_INTEGRATION_GOOGLE_CALENDAR', false),
        'slack' => env('HRM_INTEGRATION_SLACK', false),
    ],
];
