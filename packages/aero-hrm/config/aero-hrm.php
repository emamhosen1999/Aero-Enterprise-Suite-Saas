<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Route Configuration
    |--------------------------------------------------------------------------
    |
    | Configure routing for the HRM module.
    |
    */
    'routes' => [
        'prefix' => env('HRM_ROUTE_PREFIX', 'hrm'),
        'middleware' => ['web', 'auth'],
        'name_prefix' => 'hrm.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Configuration
    |--------------------------------------------------------------------------
    |
    | Configure which user model to use for authentication.
    |
    */
    'auth' => [
        'user_model' => env('HRM_USER_MODEL', \App\Models\User::class),
        'guard' => env('HRM_AUTH_GUARD', 'web'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | Enable or disable specific HRM features.
    |
    */
    'features' => [
        'attendance' => env('HRM_ATTENDANCE_ENABLED', true),
        'payroll' => env('HRM_PAYROLL_ENABLED', true),
        'leave' => env('HRM_LEAVE_ENABLED', true),
        'recruitment' => env('HRM_RECRUITMENT_ENABLED', false),
        'performance' => env('HRM_PERFORMANCE_ENABLED', false),
        'training' => env('HRM_TRAINING_ENABLED', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Employee Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for employee management.
    |
    */
    'employee' => [
        // Employee ID generation
        'id_prefix' => env('HRM_EMPLOYEE_ID_PREFIX', 'EMP'),
        'id_padding' => env('HRM_EMPLOYEE_ID_PADDING', 5),
        'id_start_from' => env('HRM_EMPLOYEE_ID_START', 1),
        
        // Employee status
        'statuses' => ['active', 'inactive', 'terminated', 'resigned', 'suspended'],
        'default_status' => 'active',
        
        // Employment types
        'employment_types' => ['full_time', 'part_time', 'contract', 'intern', 'consultant'],
        'default_employment_type' => 'full_time',
        
        // Profile photo
        'photo_disk' => env('HRM_PHOTO_DISK', 'public'),
        'photo_path' => 'employees/photos',
        'max_photo_size' => 2048, // KB
        
        // Document storage
        'document_disk' => env('HRM_DOCUMENT_DISK', 'private'),
        'document_path' => 'employees/documents',
        'max_document_size' => 5120, // KB
    ],

    /*
    |--------------------------------------------------------------------------
    | Department Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for department management.
    |
    */
    'department' => [
        'allow_nested' => env('HRM_DEPARTMENT_NESTED', true),
        'max_depth' => env('HRM_DEPARTMENT_MAX_DEPTH', 5),
        'require_manager' => env('HRM_DEPARTMENT_REQUIRE_MANAGER', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Designation Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for designation/position management.
    |
    */
    'designation' => [
        'allow_levels' => env('HRM_DESIGNATION_LEVELS', true),
        'max_level' => env('HRM_DESIGNATION_MAX_LEVEL', 10),
        'require_department' => env('HRM_DESIGNATION_REQUIRE_DEPARTMENT', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Attendance Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for attendance tracking.
    |
    */
    'attendance' => [
        'work_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        'work_hours_per_day' => env('HRM_WORK_HOURS_PER_DAY', 8),
        'work_start_time' => env('HRM_WORK_START_TIME', '09:00'),
        'work_end_time' => env('HRM_WORK_END_TIME', '17:00'),
        'break_duration' => env('HRM_BREAK_DURATION', 60), // minutes
        'grace_period' => env('HRM_GRACE_PERIOD', 15), // minutes
        'overtime_enabled' => env('HRM_OVERTIME_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Leave Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for leave management.
    |
    */
    'leave' => [
        'types' => [
            'annual' => [
                'name' => 'Annual Leave',
                'days_per_year' => env('HRM_ANNUAL_LEAVE_DAYS', 20),
                'carry_forward' => env('HRM_ANNUAL_LEAVE_CARRY_FORWARD', true),
                'max_carry_forward' => env('HRM_ANNUAL_LEAVE_MAX_CARRY_FORWARD', 5),
            ],
            'sick' => [
                'name' => 'Sick Leave',
                'days_per_year' => env('HRM_SICK_LEAVE_DAYS', 10),
                'carry_forward' => false,
                'requires_medical_certificate' => env('HRM_SICK_LEAVE_REQUIRE_CERT', 3), // days
            ],
            'casual' => [
                'name' => 'Casual Leave',
                'days_per_year' => env('HRM_CASUAL_LEAVE_DAYS', 7),
                'carry_forward' => false,
            ],
            'maternity' => [
                'name' => 'Maternity Leave',
                'days_per_year' => env('HRM_MATERNITY_LEAVE_DAYS', 90),
                'carry_forward' => false,
            ],
            'paternity' => [
                'name' => 'Paternity Leave',
                'days_per_year' => env('HRM_PATERNITY_LEAVE_DAYS', 7),
                'carry_forward' => false,
            ],
        ],
        'approval_required' => env('HRM_LEAVE_APPROVAL_REQUIRED', true),
        'advance_notice_days' => env('HRM_LEAVE_ADVANCE_NOTICE', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | Payroll Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for payroll integration.
    |
    */
    'payroll' => [
        'currency' => env('HRM_PAYROLL_CURRENCY', 'USD'),
        'currency_symbol' => env('HRM_PAYROLL_CURRENCY_SYMBOL', '$'),
        'pay_frequency' => env('HRM_PAY_FREQUENCY', 'monthly'), // weekly, bi-weekly, monthly
        'pay_day' => env('HRM_PAY_DAY', 'last'), // day of month or 'last'
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    |
    | Default pagination settings for HRM lists.
    |
    */
    'pagination' => [
        'per_page' => env('HRM_PER_PAGE', 15),
        'max_per_page' => env('HRM_MAX_PER_PAGE', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | Cache configuration for HRM data.
    |
    */
    'cache' => [
        'enabled' => env('HRM_CACHE_ENABLED', true),
        'ttl' => env('HRM_CACHE_TTL', 3600), // seconds
        'prefix' => 'hrm_',
    ],

    /*
    |--------------------------------------------------------------------------
    | Multi-Tenancy
    |--------------------------------------------------------------------------
    |
    | Configuration for multi-tenant mode.
    |
    */
    'multi_tenancy' => [
        'enabled' => env('HRM_MULTI_TENANCY', false),
        'tenant_model' => env('HRM_TENANT_MODEL', \App\Models\Tenant::class),
    ],
];
