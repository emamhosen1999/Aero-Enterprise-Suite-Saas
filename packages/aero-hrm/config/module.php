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
    'scope' => 'tenant',
    'name' => 'Human Resources',
    'description' => 'Complete HR management including employees, attendance, leave, payroll, recruitment, performance, training, and analytics',
    'icon' => 'UserGroupIcon',
    'route_prefix' => '/tenant/hr',
    'category' => 'human_resources',
    'priority' => 10,
    'is_core' => false,
    'is_active' => true,
    'version' => '1.0.0',
    'min_plan' => 'basic',
    'license_type' => 'standard',
    'dependencies' => ['core'],
    'release_date' => '2024-01-01',
    'enabled' => env('HRM_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',

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
        /*
        |--------------------------------------------------------------------------
        | 2.1 Employees
        |--------------------------------------------------------------------------
        | Submodules: Employee Directory, Employee Profile, Departments,
        | Designations, Employee Documents, Onboarding Wizard, Exit/Termination,
        | Custom Fields
        */
        [
            'code' => 'employees',
            'name' => 'Employees',
            'description' => 'Employee directory, profiles, departments, designations, and lifecycle management',
            'icon' => 'UsersIcon',
            'route' => '/tenant/hr/employees',
            'priority' => 1,

            'components' => [
                [
                    'code' => 'employee-directory',
                    'name' => 'Employee Directory',
                    'type' => 'page',
                    'route' => '/tenant/hr/employees',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Employees'],
                        ['code' => 'create', 'name' => 'Create Employee'],
                        ['code' => 'update', 'name' => 'Update Employee'],
                        ['code' => 'delete', 'name' => 'Delete Employee'],
                        ['code' => 'export', 'name' => 'Export Employees'],
                        ['code' => 'change-status', 'name' => 'Change Employee Status'],
                    ],
                ],
                [
                    'code' => 'employee-profile',
                    'name' => 'Employee Profile',
                    'type' => 'page',
                    'route' => '/tenant/hr/employees/{id}',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Profile'],
                        ['code' => 'update', 'name' => 'Update Profile'],
                    ],
                ],
                [
                    'code' => 'departments',
                    'name' => 'Departments',
                    'type' => 'page',
                    'route' => '/tenant/hr/departments',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Departments'],
                        ['code' => 'create', 'name' => 'Create Department'],
                        ['code' => 'update', 'name' => 'Update Department'],
                        ['code' => 'delete', 'name' => 'Delete Department'],
                    ],
                ],
                [
                    'code' => 'designations',
                    'name' => 'Designations',
                    'type' => 'page',
                    'route' => '/tenant/hr/designations',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Designations'],
                        ['code' => 'create', 'name' => 'Create Designation'],
                        ['code' => 'update', 'name' => 'Update Designation'],
                        ['code' => 'delete', 'name' => 'Delete Designation'],
                    ],
                ],
                [
                    'code' => 'employee-documents',
                    'name' => 'Employee Documents',
                    'type' => 'page',
                    'route' => '/tenant/hr/employees/{id}/documents',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Documents'],
                        ['code' => 'manage', 'name' => 'Manage Documents'],
                    ],
                ],
                [
                    'code' => 'onboarding-wizard',
                    'name' => 'Employee Onboarding Wizard',
                    'type' => 'page',
                    'route' => '/tenant/hr/onboarding',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Onboarding'],
                        ['code' => 'onboard', 'name' => 'Onboard Employee'],
                    ],
                ],
                [
                    'code' => 'exit-termination',
                    'name' => 'Employee Exit/Termination',
                    'type' => 'page',
                    'route' => '/tenant/hr/offboarding',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Offboarding'],
                        ['code' => 'offboard', 'name' => 'Offboard Employee'],
                    ],
                ],
                [
                    'code' => 'custom-fields',
                    'name' => 'Custom Fields',
                    'type' => 'page',
                    'route' => '/tenant/hr/employees/custom-fields',
                    'actions' => [
                        ['code' => 'manage', 'name' => 'Manage Custom Fields'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2.2 Attendance
        |--------------------------------------------------------------------------
        | Submodules: Daily Attendance, Monthly Attendance Calendar, Attendance Logs,
        | Shift Scheduling, Attendance Adjustment Requests, Device/IP/Geo Rules,
        | Overtime Rules
        */
        [
            'code' => 'attendance',
            'name' => 'Attendance',
            'description' => 'Daily attendance, shifts, overtime, and attendance adjustments',
            'icon' => 'ClockIcon',
            'route' => '/tenant/hr/attendance',
            'priority' => 2,

            'components' => [
                [
                    'code' => 'daily-attendance',
                    'name' => 'Daily Attendance',
                    'type' => 'page',
                    'route' => '/tenant/hr/attendance/daily',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Attendance'],
                        ['code' => 'mark', 'name' => 'Mark Attendance'],
                        ['code' => 'update', 'name' => 'Update Attendance'],
                        ['code' => 'delete', 'name' => 'Delete Attendance'],
                        ['code' => 'export', 'name' => 'Export Attendance'],
                    ],
                ],
                [
                    'code' => 'monthly-calendar',
                    'name' => 'Monthly Attendance Calendar',
                    'type' => 'page',
                    'route' => '/tenant/hr/attendance/calendar',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Calendar'],
                    ],
                ],
                [
                    'code' => 'attendance-logs',
                    'name' => 'Attendance Logs',
                    'type' => 'page',
                    'route' => '/tenant/hr/attendance/logs',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Attendance Logs'],
                    ],
                ],
                [
                    'code' => 'shift-scheduling',
                    'name' => 'Shift Scheduling',
                    'type' => 'page',
                    'route' => '/tenant/hr/shifts',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Shifts'],
                        ['code' => 'create', 'name' => 'Create Shift'],
                        ['code' => 'update', 'name' => 'Update Shift'],
                        ['code' => 'delete', 'name' => 'Delete Shift'],
                    ],
                ],
                [
                    'code' => 'adjustment-requests',
                    'name' => 'Attendance Adjustment Requests',
                    'type' => 'page',
                    'route' => '/tenant/hr/attendance/adjustments',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Adjustment Requests'],
                        ['code' => 'approve', 'name' => 'Approve Adjustment'],
                        ['code' => 'reject', 'name' => 'Reject Adjustment'],
                    ],
                ],
                [
                    'code' => 'device-rules',
                    'name' => 'Attendance Device/IP/Geo Rules',
                    'type' => 'page',
                    'route' => '/tenant/hr/attendance/rules',
                    'actions' => [
                        ['code' => 'manage', 'name' => 'Manage Attendance Rules'],
                    ],
                ],
                [
                    'code' => 'overtime-rules',
                    'name' => 'Overtime Rules',
                    'type' => 'page',
                    'route' => '/tenant/hr/overtime/rules',
                    'actions' => [
                        ['code' => 'manage', 'name' => 'Manage Overtime Rules'],
                    ],
                ],
                [
                    'code' => 'my-attendance',
                    'name' => 'My Attendance',
                    'type' => 'page',
                    'route' => '/tenant/hr/my-attendance',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Own Attendance'],
                        ['code' => 'punch', 'name' => 'Punch In/Out'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2.3 Leave Management
        |--------------------------------------------------------------------------
        | Submodules: Leave Types, Leave Balances, Leave Requests, Holiday Calendar,
        | Leave Policies, Leave Accrual Engine, Conflict Checker
        */
        [
            'code' => 'leaves',
            'name' => 'Leaves',
            'description' => 'Leave types, requests, balances, holidays, and policies',
            'icon' => 'CalendarIcon',
            'route' => '/tenant/hr/leaves',
            'priority' => 3,

            'components' => [
                [
                    'code' => 'leave-types',
                    'name' => 'Leave Types',
                    'type' => 'page',
                    'route' => '/tenant/hr/leaves/types',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Leave Types'],
                        ['code' => 'create', 'name' => 'Create Leave Type'],
                        ['code' => 'update', 'name' => 'Update Leave Type'],
                        ['code' => 'delete', 'name' => 'Delete Leave Type'],
                    ],
                ],
                [
                    'code' => 'leave-balances',
                    'name' => 'Leave Balances',
                    'type' => 'page',
                    'route' => '/tenant/hr/leaves/balances',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Leave Balances'],
                        ['code' => 'update', 'name' => 'Update Leave Balance'],
                    ],
                ],
                [
                    'code' => 'leave-requests',
                    'name' => 'Leave Requests',
                    'type' => 'page',
                    'route' => '/tenant/hr/leaves/requests',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Leave Requests'],
                        ['code' => 'create', 'name' => 'Create Leave Request'],
                        ['code' => 'update', 'name' => 'Update Leave Request'],
                        ['code' => 'delete', 'name' => 'Delete Leave Request'],
                        ['code' => 'approve', 'name' => 'Approve Leave Request'],
                        ['code' => 'reject', 'name' => 'Reject Leave Request'],
                        ['code' => 'export', 'name' => 'Export Leave Requests'],
                    ],
                ],
                [
                    'code' => 'holiday-calendar',
                    'name' => 'Holiday Calendar',
                    'type' => 'page',
                    'route' => '/tenant/hr/holidays',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Holidays'],
                        ['code' => 'create', 'name' => 'Create Holiday'],
                        ['code' => 'update', 'name' => 'Update Holiday'],
                        ['code' => 'delete', 'name' => 'Delete Holiday'],
                    ],
                ],
                [
                    'code' => 'leave-policies',
                    'name' => 'Leave Policies',
                    'type' => 'page',
                    'route' => '/tenant/hr/leaves/policies',
                    'actions' => [
                        ['code' => 'manage', 'name' => 'Manage Leave Policies'],
                    ],
                ],
                [
                    'code' => 'leave-accrual',
                    'name' => 'Leave Accrual Engine',
                    'type' => 'page',
                    'route' => '/tenant/hr/leaves/accrual',
                    'actions' => [
                        ['code' => 'run', 'name' => 'Run Leave Accrual'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2.4 Payroll
        |--------------------------------------------------------------------------
        | Submodules: Salary Structures, Salary Components, Payroll Run, Payslips,
        | Tax Setup, Overtime Integration, Loan & Advance Management, Bank File Generator
        */
        [
            'code' => 'payroll',
            'name' => 'Payroll',
            'description' => 'Salary structures, payroll processing, payslips, tax, and loans',
            'icon' => 'CurrencyDollarIcon',
            'route' => '/tenant/hr/payroll',
            'priority' => 4,

            'components' => [
                [
                    'code' => 'salary-structures',
                    'name' => 'Salary Structures',
                    'type' => 'page',
                    'route' => '/tenant/hr/payroll/structures',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Salary Structures'],
                        ['code' => 'create', 'name' => 'Create Salary Structure'],
                        ['code' => 'update', 'name' => 'Update Salary Structure'],
                        ['code' => 'delete', 'name' => 'Delete Salary Structure'],
                    ],
                ],
                [
                    'code' => 'salary-components',
                    'name' => 'Salary Components',
                    'type' => 'page',
                    'route' => '/tenant/hr/payroll/components',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Salary Components'],
                        ['code' => 'create', 'name' => 'Create Salary Component'],
                        ['code' => 'update', 'name' => 'Update Salary Component'],
                        ['code' => 'delete', 'name' => 'Delete Salary Component'],
                    ],
                ],
                [
                    'code' => 'payroll-run',
                    'name' => 'Payroll Run',
                    'type' => 'page',
                    'route' => '/tenant/hr/payroll/run',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Payroll Runs'],
                        ['code' => 'execute', 'name' => 'Execute Payroll Run'],
                        ['code' => 'lock', 'name' => 'Lock Payroll Run'],
                        ['code' => 'rollback', 'name' => 'Rollback Payroll Run'],
                        ['code' => 'export', 'name' => 'Export Payroll Run'],
                    ],
                ],
                [
                    'code' => 'payslips',
                    'name' => 'Payslips',
                    'type' => 'page',
                    'route' => '/tenant/hr/payroll/payslips',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Payslips'],
                        ['code' => 'download', 'name' => 'Download Payslip'],
                        ['code' => 'send', 'name' => 'Send Payslip'],
                    ],
                ],
                [
                    'code' => 'tax-setup',
                    'name' => 'Tax Setup',
                    'type' => 'page',
                    'route' => '/tenant/hr/payroll/tax',
                    'actions' => [
                        ['code' => 'manage', 'name' => 'Manage Tax Rules'],
                    ],
                ],
                [
                    'code' => 'loans',
                    'name' => 'Loan & Advance Management',
                    'type' => 'page',
                    'route' => '/tenant/hr/payroll/loans',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Loans'],
                        ['code' => 'create', 'name' => 'Create Loan'],
                        ['code' => 'update', 'name' => 'Update Loan'],
                        ['code' => 'delete', 'name' => 'Delete Loan'],
                    ],
                ],
                [
                    'code' => 'bank-file',
                    'name' => 'Bank File Generator',
                    'type' => 'page',
                    'route' => '/tenant/hr/payroll/bank-file',
                    'actions' => [
                        ['code' => 'generate', 'name' => 'Generate Bank File'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2.5 Recruitment
        |--------------------------------------------------------------------------
        | Submodules: Job Openings, Applicants, Candidate Pipelines, Interview Scheduling,
        | Evaluation Scores, Offer Letters, Public Job Portal Settings
        */
        [
            'code' => 'recruitment',
            'name' => 'Recruitment',
            'description' => 'Job openings, applicants, interviews, evaluations, and offer letters',
            'icon' => 'BriefcaseIcon',
            'route' => '/tenant/hr/recruitment',
            'priority' => 5,

            'components' => [
                [
                    'code' => 'job-openings',
                    'name' => 'Job Openings',
                    'type' => 'page',
                    'route' => '/tenant/hr/recruitment/jobs',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Job Openings'],
                        ['code' => 'create', 'name' => 'Create Job Opening'],
                        ['code' => 'update', 'name' => 'Update Job Opening'],
                        ['code' => 'delete', 'name' => 'Delete Job Opening'],
                    ],
                ],
                [
                    'code' => 'applicants',
                    'name' => 'Applicants',
                    'type' => 'page',
                    'route' => '/tenant/hr/recruitment/applicants',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Applicants'],
                        ['code' => 'create', 'name' => 'Create Applicant'],
                        ['code' => 'update', 'name' => 'Update Applicant'],
                        ['code' => 'delete', 'name' => 'Delete Applicant'],
                        ['code' => 'move-stage', 'name' => 'Move Pipeline Stage'],
                        ['code' => 'export', 'name' => 'Export Applicants'],
                        ['code' => 'send-email', 'name' => 'Send Email to Applicant'],
                    ],
                ],
                [
                    'code' => 'candidate-pipeline',
                    'name' => 'Candidate Pipelines',
                    'type' => 'page',
                    'route' => '/tenant/hr/recruitment/pipeline',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Pipeline'],
                        ['code' => 'configure', 'name' => 'Configure Pipeline Stages'],
                    ],
                ],
                [
                    'code' => 'interview-scheduling',
                    'name' => 'Interview Scheduling',
                    'type' => 'page',
                    'route' => '/tenant/hr/recruitment/interviews',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Interview Schedules'],
                        ['code' => 'create', 'name' => 'Create Interview Schedule'],
                        ['code' => 'update', 'name' => 'Update Interview Schedule'],
                        ['code' => 'delete', 'name' => 'Delete Interview Schedule'],
                    ],
                ],
                [
                    'code' => 'evaluation-scores',
                    'name' => 'Evaluation Scores',
                    'type' => 'page',
                    'route' => '/tenant/hr/recruitment/evaluations',
                    'actions' => [
                        ['code' => 'manage', 'name' => 'Manage Evaluation Scores'],
                    ],
                ],
                [
                    'code' => 'offer-letters',
                    'name' => 'Offer Letters',
                    'type' => 'page',
                    'route' => '/tenant/hr/recruitment/offers',
                    'actions' => [
                        ['code' => 'create', 'name' => 'Create Offer Letter'],
                        ['code' => 'send', 'name' => 'Send Offer Letter'],
                    ],
                ],
                [
                    'code' => 'portal-settings',
                    'name' => 'Public Job Portal Settings',
                    'type' => 'page',
                    'route' => '/tenant/hr/recruitment/portal',
                    'actions' => [
                        ['code' => 'configure', 'name' => 'Configure Job Portal'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2.6 Performance Management
        |--------------------------------------------------------------------------
        | Submodules: KPI Setup, Appraisal Cycles, 360° Reviews, Score Aggregation,
        | Promotion Recommendations, Performance Reports
        */
        [
            'code' => 'performance',
            'name' => 'Performance',
            'description' => 'KPIs, appraisals, 360° reviews, and performance tracking',
            'icon' => 'ChartBarSquareIcon',
            'route' => '/tenant/hr/performance',
            'priority' => 6,

            'components' => [
                [
                    'code' => 'kpi-setup',
                    'name' => 'KPI Setup',
                    'type' => 'page',
                    'route' => '/tenant/hr/performance/kpis',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View KPIs'],
                        ['code' => 'create', 'name' => 'Create KPI'],
                        ['code' => 'update', 'name' => 'Update KPI'],
                        ['code' => 'delete', 'name' => 'Delete KPI'],
                    ],
                ],
                [
                    'code' => 'appraisal-cycles',
                    'name' => 'Appraisal Cycles',
                    'type' => 'page',
                    'route' => '/tenant/hr/performance/appraisals',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Appraisal Cycles'],
                        ['code' => 'create', 'name' => 'Create Appraisal Cycle'],
                        ['code' => 'update', 'name' => 'Update Appraisal Cycle'],
                        ['code' => 'delete', 'name' => 'Delete Appraisal Cycle'],
                    ],
                ],
                [
                    'code' => 'reviews-360',
                    'name' => '360° Reviews',
                    'type' => 'page',
                    'route' => '/tenant/hr/performance/360-reviews',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View 360 Reviews'],
                        ['code' => 'submit', 'name' => 'Submit Review'],
                        ['code' => 'approve', 'name' => 'Approve Review'],
                        ['code' => 'reject', 'name' => 'Reject Review'],
                    ],
                ],
                [
                    'code' => 'score-aggregation',
                    'name' => 'Score Aggregation',
                    'type' => 'page',
                    'route' => '/tenant/hr/performance/scores',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Aggregated Scores'],
                    ],
                ],
                [
                    'code' => 'promotion-recommendations',
                    'name' => 'Promotion Recommendations',
                    'type' => 'page',
                    'route' => '/tenant/hr/performance/promotions',
                    'actions' => [
                        ['code' => 'state-change', 'name' => 'Change Promotion State'],
                    ],
                ],
                [
                    'code' => 'performance-reports',
                    'name' => 'Performance Reports',
                    'type' => 'page',
                    'route' => '/tenant/hr/performance/reports',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Performance Reports'],
                        ['code' => 'export', 'name' => 'Export Performance Reports'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2.7 Training & Development
        |--------------------------------------------------------------------------
        | Submodules: Training Programs, Training Sessions, Trainers, Enrollment,
        | Attendance Tracking (Training), Certification Issuance
        */
        [
            'code' => 'training',
            'name' => 'Training',
            'description' => 'Training programs, sessions, trainers, and certifications',
            'icon' => 'AcademicCapIcon',
            'route' => '/tenant/hr/training',
            'priority' => 7,

            'components' => [
                [
                    'code' => 'training-programs',
                    'name' => 'Training Programs',
                    'type' => 'page',
                    'route' => '/tenant/hr/training/programs',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Training Programs'],
                        ['code' => 'create', 'name' => 'Create Training Program'],
                        ['code' => 'update', 'name' => 'Update Training Program'],
                        ['code' => 'delete', 'name' => 'Delete Training Program'],
                    ],
                ],
                [
                    'code' => 'training-sessions',
                    'name' => 'Training Sessions',
                    'type' => 'page',
                    'route' => '/tenant/hr/training/sessions',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Training Sessions'],
                        ['code' => 'create', 'name' => 'Create Training Session'],
                        ['code' => 'update', 'name' => 'Update Training Session'],
                        ['code' => 'delete', 'name' => 'Delete Training Session'],
                    ],
                ],
                [
                    'code' => 'trainers',
                    'name' => 'Trainers',
                    'type' => 'page',
                    'route' => '/tenant/hr/training/trainers',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Trainers'],
                        ['code' => 'create', 'name' => 'Create Trainer'],
                        ['code' => 'update', 'name' => 'Update Trainer'],
                        ['code' => 'delete', 'name' => 'Delete Trainer'],
                    ],
                ],
                [
                    'code' => 'enrollment',
                    'name' => 'Enrollment',
                    'type' => 'page',
                    'route' => '/tenant/hr/training/enrollment',
                    'actions' => [
                        ['code' => 'manage', 'name' => 'Manage Training Enrollment'],
                    ],
                ],
                [
                    'code' => 'training-attendance',
                    'name' => 'Attendance Tracking (Training)',
                    'type' => 'page',
                    'route' => '/tenant/hr/training/attendance',
                    'actions' => [
                        ['code' => 'mark', 'name' => 'Mark Training Attendance'],
                    ],
                ],
                [
                    'code' => 'certifications',
                    'name' => 'Certification Issuance',
                    'type' => 'page',
                    'route' => '/tenant/hr/training/certifications',
                    'actions' => [
                        ['code' => 'generate', 'name' => 'Generate Certificate'],
                        ['code' => 'download', 'name' => 'Download Certificate'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2.8 HR Analytics
        |--------------------------------------------------------------------------
        | Submodules: Workforce Overview, Turnover Analytics, Attendance Insights,
        | Payroll Cost Analysis, Recruitment Funnel Analytics, Performance Insights
        */
        [
            'code' => 'hr-analytics',
            'name' => 'HR Analytics',
            'description' => 'Workforce analytics, turnover, attendance insights, and reports',
            'icon' => 'ChartPieIcon',
            'route' => '/tenant/hr/analytics',
            'priority' => 8,

            'components' => [
                [
                    'code' => 'workforce-overview',
                    'name' => 'Workforce Overview',
                    'type' => 'page',
                    'route' => '/tenant/hr/analytics/workforce',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Workforce Overview'],
                        ['code' => 'export', 'name' => 'Export Workforce Data'],
                    ],
                ],
                [
                    'code' => 'turnover-analytics',
                    'name' => 'Turnover Analytics',
                    'type' => 'page',
                    'route' => '/tenant/hr/analytics/turnover',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Turnover Analytics'],
                        ['code' => 'export', 'name' => 'Export Turnover Data'],
                    ],
                ],
                [
                    'code' => 'attendance-insights',
                    'name' => 'Attendance Insights',
                    'type' => 'page',
                    'route' => '/tenant/hr/analytics/attendance',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Attendance Insights'],
                        ['code' => 'export', 'name' => 'Export Attendance Data'],
                    ],
                ],
                [
                    'code' => 'payroll-cost-analysis',
                    'name' => 'Payroll Cost Analysis',
                    'type' => 'page',
                    'route' => '/tenant/hr/analytics/payroll',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Payroll Analysis'],
                        ['code' => 'export', 'name' => 'Export Payroll Data'],
                    ],
                ],
                [
                    'code' => 'recruitment-funnel',
                    'name' => 'Recruitment Funnel Analytics',
                    'type' => 'page',
                    'route' => '/tenant/hr/analytics/recruitment',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Recruitment Funnel'],
                        ['code' => 'export', 'name' => 'Export Recruitment Data'],
                    ],
                ],
                [
                    'code' => 'performance-insights',
                    'name' => 'Performance Insights',
                    'type' => 'page',
                    'route' => '/tenant/hr/analytics/performance',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Performance Insights'],
                        ['code' => 'export', 'name' => 'Export Performance Data'],
                    ],
                ],
            ],
        ],
    ],
];
