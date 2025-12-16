<?php

return [
   

  
    /*
    |--------------------------------------------------------------------------
    | Tenant Module Hierarchy (Tenant Context)
    |--------------------------------------------------------------------------
    |
    | These modules are accessible by Tenant Users within their tenant context.
    | Access is controlled by: Plan Access (subscription) ∩ Permission Match (RBAC)
    |
    */
    'hierarchy' => [
    
        /*
        |--------------------------------------------------------------------------
        | Human Resources Management (HRM) Module
        |--------------------------------------------------------------------------
        | Section 2 - HRM (Human Resource Management)
        | 8 Submodules: Employees, Attendance, Leaves, Payroll, Recruitment,
        |               Performance, Training, HR Analytics
        */
        [
            'code' => 'hrm',
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
        ],

        /*
        |--------------------------------------------------------------------------
        | Customer Relationship Management (CRM) Module
        |--------------------------------------------------------------------------
        | Section 3 - CRM (Customer Relationship Management)
        | 10 Submodules: Leads, Contacts, Deals, Activities, Campaigns,
        |                Support Desk, Knowledge Base, Live Chat, CRM Settings, CRM Analytics
        */
        [
            'code' => 'crm',
            'name' => 'Customer Relations',
            'description' => 'Complete CRM including leads, contacts, deals, campaigns, support, and analytics',
            'icon' => 'UserGroupIcon',
            'route_prefix' => '/tenant/crm',
            'category' => 'customer_relations',
            'priority' => 20,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'basic',
            'license_type' => 'standard',
            'dependencies' => ['core'],
            'release_date' => '2024-01-01',

            'submodules' => [
                /*
                |--------------------------------------------------------------------------
                | 3.1 Leads
                |--------------------------------------------------------------------------
                | Submodules: Lead List, Lead Details, Lead Pipeline, Lead Assignment,
                | Lead Source Management, Lead Import/Export, Lead Scoring, Lead Notes
                */
                [
                    'code' => 'leads',
                    'name' => 'Leads',
                    'description' => 'Lead management, pipeline, scoring, and source tracking',
                    'icon' => 'UserPlusIcon',
                    'route' => '/tenant/crm/leads',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'lead-list',
                            'name' => 'Lead List',
                            'type' => 'page',
                            'route' => '/tenant/crm/leads',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Leads'],
                                ['code' => 'create', 'name' => 'Create Lead'],
                                ['code' => 'update', 'name' => 'Update Lead'],
                                ['code' => 'delete', 'name' => 'Delete Lead'],
                                ['code' => 'assign', 'name' => 'Assign Lead'],
                                ['code' => 'change-stage', 'name' => 'Change Lead Stage'],
                                ['code' => 'export', 'name' => 'Export Leads'],
                                ['code' => 'import', 'name' => 'Import Leads'],
                            ],
                        ],
                        [
                            'code' => 'lead-details',
                            'name' => 'Lead Details',
                            'type' => 'page',
                            'route' => '/tenant/crm/leads/{id}',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Lead Details'],
                                ['code' => 'update', 'name' => 'Update Lead Details'],
                            ],
                        ],
                        [
                            'code' => 'lead-pipeline',
                            'name' => 'Lead Pipeline (Stages)',
                            'type' => 'page',
                            'route' => '/tenant/crm/leads/pipeline',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Lead Pipeline'],
                                ['code' => 'change-stage', 'name' => 'Change Stage'],
                            ],
                        ],
                        [
                            'code' => 'lead-scoring',
                            'name' => 'Lead Scoring',
                            'type' => 'page',
                            'route' => '/tenant/crm/leads/scoring',
                            'actions' => [
                                ['code' => 'update', 'name' => 'Update Lead Score'],
                            ],
                        ],
                        [
                            'code' => 'lead-notes',
                            'name' => 'Lead Notes & Activities',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'add-note', 'name' => 'Add Lead Note'],
                            ],
                        ],
                        [
                            'code' => 'lead-sources',
                            'name' => 'Lead Source Management',
                            'type' => 'page',
                            'route' => '/tenant/crm/leads/sources',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Lead Sources'],
                                ['code' => 'create', 'name' => 'Create Lead Source'],
                                ['code' => 'update', 'name' => 'Update Lead Source'],
                                ['code' => 'delete', 'name' => 'Delete Lead Source'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 3.2 Contacts & Accounts
                |--------------------------------------------------------------------------
                | Submodules: Contacts, Accounts, Contact Linking, Interaction History,
                | Contact Notes, Contact Tags, Contact Segmentation
                */
                [
                    'code' => 'contacts',
                    'name' => 'Contacts',
                    'description' => 'Individual contacts, accounts, and interaction tracking',
                    'icon' => 'UsersIcon',
                    'route' => '/tenant/crm/contacts',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'contact-list',
                            'name' => 'Contact List',
                            'type' => 'page',
                            'route' => '/tenant/crm/contacts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Contacts'],
                                ['code' => 'create', 'name' => 'Create Contact'],
                                ['code' => 'update', 'name' => 'Update Contact'],
                                ['code' => 'delete', 'name' => 'Delete Contact'],
                                ['code' => 'add-note', 'name' => 'Add Contact Note'],
                                ['code' => 'link-account', 'name' => 'Link Contact to Account'],
                                ['code' => 'export', 'name' => 'Export Contacts'],
                            ],
                        ],
                        [
                            'code' => 'accounts',
                            'name' => 'Accounts (Companies)',
                            'type' => 'page',
                            'route' => '/tenant/crm/accounts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Accounts'],
                                ['code' => 'create', 'name' => 'Create Account'],
                                ['code' => 'update', 'name' => 'Update Account'],
                                ['code' => 'delete', 'name' => 'Delete Account'],
                                ['code' => 'add-note', 'name' => 'Add Account Note'],
                                ['code' => 'export', 'name' => 'Export Accounts'],
                            ],
                        ],
                        [
                            'code' => 'interaction-history',
                            'name' => 'Interaction History',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Interaction History'],
                            ],
                        ],
                        [
                            'code' => 'contact-tags',
                            'name' => 'Contact Tags',
                            'type' => 'section',
                            'route' => '/tenant/crm/contacts/tags',
                            'actions' => [
                                ['code' => 'manage', 'name' => 'Manage Contact Tags'],
                            ],
                        ],
                        [
                            'code' => 'contact-segmentation',
                            'name' => 'Contact Segmentation',
                            'type' => 'page',
                            'route' => '/tenant/crm/contacts/segments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Segments'],
                                ['code' => 'manage', 'name' => 'Manage Segments'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 3.3 Deals & Sales Pipeline
                |--------------------------------------------------------------------------
                | Submodules: Deal List, Deal Board, Deal Stages, Deal Value & Probability,
                | Products/Items, Deal Activity Timeline, Forecasting Dashboard
                */
                [
                    'code' => 'deals',
                    'name' => 'Deals',
                    'description' => 'Sales pipeline, deal tracking, and revenue forecasting',
                    'icon' => 'BanknotesIcon',
                    'route' => '/tenant/crm/deals',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'deal-list',
                            'name' => 'Deal List',
                            'type' => 'page',
                            'route' => '/tenant/crm/deals',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Deals'],
                                ['code' => 'create', 'name' => 'Create Deal'],
                                ['code' => 'update', 'name' => 'Update Deal'],
                                ['code' => 'delete', 'name' => 'Delete Deal'],
                                ['code' => 'change-stage', 'name' => 'Change Deal Stage'],
                                ['code' => 'add-product', 'name' => 'Add Product to Deal'],
                                ['code' => 'add-note', 'name' => 'Add Deal Note'],
                                ['code' => 'update-probability', 'name' => 'Update Deal Probability'],
                                ['code' => 'export', 'name' => 'Export Deals'],
                            ],
                        ],
                        [
                            'code' => 'deal-board',
                            'name' => 'Deal Board (Kanban)',
                            'type' => 'page',
                            'route' => '/tenant/crm/deals/board',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Deal Board'],
                                ['code' => 'change-stage', 'name' => 'Drag & Drop Deals'],
                            ],
                        ],
                        [
                            'code' => 'pipeline-stages',
                            'name' => 'Deal Stages',
                            'type' => 'page',
                            'route' => '/tenant/crm/deals/stages',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Pipeline Stages'],
                                ['code' => 'create', 'name' => 'Create Pipeline Stage'],
                                ['code' => 'update', 'name' => 'Update Pipeline Stage'],
                                ['code' => 'delete', 'name' => 'Delete Pipeline Stage'],
                            ],
                        ],
                        [
                            'code' => 'forecasting',
                            'name' => 'Forecasting Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/crm/deals/forecast',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Forecast'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 3.4 Activities & Engagement
                |--------------------------------------------------------------------------
                | Submodules: Calls, Meetings, Tasks, Emails, Activity Timeline,
                | Reminders & Follow-ups, Activity Templates
                */
                [
                    'code' => 'activities',
                    'name' => 'Activities',
                    'description' => 'Calls, meetings, tasks, emails, and follow-ups',
                    'icon' => 'PhoneIcon',
                    'route' => '/tenant/crm/activities',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'activity-list',
                            'name' => 'Activity List',
                            'type' => 'page',
                            'route' => '/tenant/crm/activities',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Activities'],
                                ['code' => 'create', 'name' => 'Create Activity'],
                                ['code' => 'update', 'name' => 'Update Activity'],
                                ['code' => 'delete', 'name' => 'Delete Activity'],
                                ['code' => 'assign', 'name' => 'Assign Activity'],
                                ['code' => 'complete', 'name' => 'Mark Activity Complete'],
                            ],
                        ],
                        [
                            'code' => 'calls',
                            'name' => 'Calls',
                            'type' => 'page',
                            'route' => '/tenant/crm/activities/calls',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Calls'],
                                ['code' => 'log', 'name' => 'Log Call'],
                            ],
                        ],
                        [
                            'code' => 'meetings',
                            'name' => 'Meetings',
                            'type' => 'page',
                            'route' => '/tenant/crm/activities/meetings',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Meetings'],
                                ['code' => 'schedule', 'name' => 'Schedule Meeting'],
                            ],
                        ],
                        [
                            'code' => 'reminders',
                            'name' => 'Reminders & Follow-ups',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'set', 'name' => 'Set Reminder'],
                            ],
                        ],
                        [
                            'code' => 'activity-templates',
                            'name' => 'Activity Templates',
                            'type' => 'page',
                            'route' => '/tenant/crm/activities/templates',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Activity Templates'],
                                ['code' => 'create', 'name' => 'Create Activity Template'],
                                ['code' => 'update', 'name' => 'Update Activity Template'],
                                ['code' => 'delete', 'name' => 'Delete Activity Template'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 3.5 Email/SMS Campaigns
                |--------------------------------------------------------------------------
                | Submodules: Campaign List, Campaign Builder, Audience Segments,
                | Email Templates, SMS Templates, Campaign Analytics, Delivery Logs
                */
                [
                    'code' => 'campaigns',
                    'name' => 'Campaigns',
                    'description' => 'Email and SMS marketing campaigns',
                    'icon' => 'MegaphoneIcon',
                    'route' => '/tenant/crm/campaigns',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'campaign-list',
                            'name' => 'Campaign List',
                            'type' => 'page',
                            'route' => '/tenant/crm/campaigns',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Campaigns'],
                                ['code' => 'create', 'name' => 'Create Campaign'],
                                ['code' => 'update', 'name' => 'Update Campaign'],
                                ['code' => 'delete', 'name' => 'Delete Campaign'],
                                ['code' => 'launch', 'name' => 'Launch Campaign'],
                                ['code' => 'pause', 'name' => 'Pause Campaign'],
                                ['code' => 'clone', 'name' => 'Clone Campaign'],
                            ],
                        ],
                        [
                            'code' => 'campaign-builder',
                            'name' => 'Campaign Builder',
                            'type' => 'page',
                            'route' => '/tenant/crm/campaigns/builder',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Builder'],
                                ['code' => 'create', 'name' => 'Build Campaign'],
                            ],
                        ],
                        [
                            'code' => 'audience-segments',
                            'name' => 'Audience Segments',
                            'type' => 'page',
                            'route' => '/tenant/crm/campaigns/segments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Segments'],
                                ['code' => 'create', 'name' => 'Create Segment'],
                                ['code' => 'update', 'name' => 'Update Segment'],
                                ['code' => 'delete', 'name' => 'Delete Segment'],
                            ],
                        ],
                        [
                            'code' => 'email-templates',
                            'name' => 'Email Templates',
                            'type' => 'page',
                            'route' => '/tenant/crm/campaigns/email-templates',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Email Templates'],
                                ['code' => 'create', 'name' => 'Create Email Template'],
                                ['code' => 'update', 'name' => 'Update Email Template'],
                                ['code' => 'delete', 'name' => 'Delete Email Template'],
                            ],
                        ],
                        [
                            'code' => 'sms-templates',
                            'name' => 'SMS Templates',
                            'type' => 'page',
                            'route' => '/tenant/crm/campaigns/sms-templates',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SMS Templates'],
                                ['code' => 'create', 'name' => 'Create SMS Template'],
                                ['code' => 'update', 'name' => 'Update SMS Template'],
                                ['code' => 'delete', 'name' => 'Delete SMS Template'],
                            ],
                        ],
                        [
                            'code' => 'campaign-analytics',
                            'name' => 'Campaign Analytics',
                            'type' => 'page',
                            'route' => '/tenant/crm/campaigns/analytics',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Campaign Analytics'],
                            ],
                        ],
                        [
                            'code' => 'delivery-logs',
                            'name' => 'Delivery Logs',
                            'type' => 'page',
                            'route' => '/tenant/crm/campaigns/logs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Delivery Logs'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 3.6 Support Desk / Helpdesk
                |--------------------------------------------------------------------------
                | Submodules: Tickets, Ticket Categories, Priorities & SLAs, Ticket Assignment,
                | Replies & Notes, Customer Satisfaction, Automation Rules, Support Dashboard
                */
                [
                    'code' => 'support-desk',
                    'name' => 'Support Desk',
                    'description' => 'Ticket management, SLAs, and customer support',
                    'icon' => 'TicketIcon',
                    'route' => '/tenant/crm/support',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'ticket-list',
                            'name' => 'Tickets',
                            'type' => 'page',
                            'route' => '/tenant/crm/support/tickets',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tickets'],
                                ['code' => 'create', 'name' => 'Create Ticket'],
                                ['code' => 'update', 'name' => 'Update Ticket'],
                                ['code' => 'reply', 'name' => 'Reply to Ticket'],
                                ['code' => 'add-note', 'name' => 'Add Internal Note'],
                                ['code' => 'assign', 'name' => 'Assign Ticket'],
                                ['code' => 'change-status', 'name' => 'Change Ticket Status'],
                                ['code' => 'delete', 'name' => 'Delete Ticket'],
                                ['code' => 'export', 'name' => 'Export Tickets'],
                            ],
                        ],
                        [
                            'code' => 'ticket-categories',
                            'name' => 'Ticket Categories',
                            'type' => 'page',
                            'route' => '/tenant/crm/support/categories',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Ticket Categories'],
                                ['code' => 'create', 'name' => 'Create Ticket Category'],
                                ['code' => 'update', 'name' => 'Update Ticket Category'],
                                ['code' => 'delete', 'name' => 'Delete Ticket Category'],
                            ],
                        ],
                        [
                            'code' => 'sla-rules',
                            'name' => 'Priorities & SLAs',
                            'type' => 'page',
                            'route' => '/tenant/crm/support/sla',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SLA Rules'],
                                ['code' => 'create', 'name' => 'Create SLA Rule'],
                                ['code' => 'update', 'name' => 'Update SLA Rule'],
                                ['code' => 'delete', 'name' => 'Delete SLA Rule'],
                            ],
                        ],
                        [
                            'code' => 'support-automation',
                            'name' => 'Ticket Automation Rules',
                            'type' => 'page',
                            'route' => '/tenant/crm/support/automation',
                            'actions' => [
                                ['code' => 'manage', 'name' => 'Manage Support Automation'],
                            ],
                        ],
                        [
                            'code' => 'support-dashboard',
                            'name' => 'Support Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/crm/support/dashboard',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Support Dashboard'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 3.7 Knowledge Base (Optional)
                |--------------------------------------------------------------------------
                | Submodules: Articles, Categories, Tags, Public Article Settings, Article Feedback
                */
                [
                    'code' => 'knowledge-base',
                    'name' => 'Knowledge Base',
                    'description' => 'Help articles, documentation, and self-service support',
                    'icon' => 'BookOpenIcon',
                    'route' => '/tenant/crm/knowledge-base',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'kb-articles',
                            'name' => 'Articles',
                            'type' => 'page',
                            'route' => '/tenant/crm/knowledge-base/articles',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View KB Articles'],
                                ['code' => 'create', 'name' => 'Create KB Article'],
                                ['code' => 'update', 'name' => 'Update KB Article'],
                                ['code' => 'delete', 'name' => 'Delete KB Article'],
                            ],
                        ],
                        [
                            'code' => 'kb-categories',
                            'name' => 'KB Categories',
                            'type' => 'page',
                            'route' => '/tenant/crm/knowledge-base/categories',
                            'actions' => [
                                ['code' => 'manage', 'name' => 'Manage KB Categories'],
                            ],
                        ],
                        [
                            'code' => 'kb-tags',
                            'name' => 'KB Tags',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'manage', 'name' => 'Manage KB Tags'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 3.8 Live Chat (Widget)
                |--------------------------------------------------------------------------
                | Submodules: Chat Inbox, Visitor Tracking, Chatbot/Auto-Responder,
                | Chat Widget Settings, Chat Assignment Rules
                */
                [
                    'code' => 'live-chat',
                    'name' => 'Live Chat',
                    'description' => 'Real-time chat, visitor tracking, and chatbot',
                    'icon' => 'ChatBubbleLeftRightIcon',
                    'route' => '/tenant/crm/live-chat',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'chat-inbox',
                            'name' => 'Chat Inbox',
                            'type' => 'page',
                            'route' => '/tenant/crm/live-chat/inbox',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Chats'],
                                ['code' => 'reply', 'name' => 'Reply to Chat'],
                                ['code' => 'assign', 'name' => 'Assign Chat'],
                            ],
                        ],
                        [
                            'code' => 'visitor-tracking',
                            'name' => 'Visitor Tracking',
                            'type' => 'page',
                            'route' => '/tenant/crm/live-chat/visitors',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Visitors'],
                            ],
                        ],
                        [
                            'code' => 'chatbot',
                            'name' => 'Chatbot/Auto-Responder',
                            'type' => 'page',
                            'route' => '/tenant/crm/live-chat/chatbot',
                            'actions' => [
                                ['code' => 'manage', 'name' => 'Manage Chatbot'],
                            ],
                        ],
                        [
                            'code' => 'chat-widget',
                            'name' => 'Chat Widget Settings',
                            'type' => 'page',
                            'route' => '/tenant/crm/live-chat/widget',
                            'actions' => [
                                ['code' => 'configure', 'name' => 'Configure Chat Widget'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 3.9 CRM Settings
                |--------------------------------------------------------------------------
                | Submodules: Lead Stages, Deal Stages, Pipelines, Activity Types,
                | Contact Fields, Custom Fields, Integration Settings
                */
                [
                    'code' => 'crm-settings',
                    'name' => 'CRM Settings',
                    'description' => 'Configure CRM stages, pipelines, fields, and integrations',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/tenant/crm/settings',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'settings-general',
                            'name' => 'General CRM Settings',
                            'type' => 'page',
                            'route' => '/tenant/crm/settings',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View CRM Settings'],
                                ['code' => 'update', 'name' => 'Update CRM Settings'],
                                ['code' => 'delete', 'name' => 'Delete CRM Settings'],
                            ],
                        ],
                        [
                            'code' => 'pipelines',
                            'name' => 'Pipeline Management',
                            'type' => 'page',
                            'route' => '/tenant/crm/settings/pipelines',
                            'actions' => [
                                ['code' => 'manage', 'name' => 'Manage Pipelines'],
                            ],
                        ],
                        [
                            'code' => 'activity-types',
                            'name' => 'Activity Types',
                            'type' => 'page',
                            'route' => '/tenant/crm/settings/activity-types',
                            'actions' => [
                                ['code' => 'manage', 'name' => 'Manage Activity Types'],
                            ],
                        ],
                        [
                            'code' => 'custom-fields',
                            'name' => 'Custom Fields',
                            'type' => 'page',
                            'route' => '/tenant/crm/settings/custom-fields',
                            'actions' => [
                                ['code' => 'manage', 'name' => 'Manage Custom Fields'],
                            ],
                        ],
                        [
                            'code' => 'integrations',
                            'name' => 'Integration Settings',
                            'type' => 'page',
                            'route' => '/tenant/crm/settings/integrations',
                            'actions' => [
                                ['code' => 'configure', 'name' => 'Configure Integrations'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 3.10 CRM Analytics
                |--------------------------------------------------------------------------
                | Submodules: Lead Insights, Deal Forecast, Revenue Pipeline,
                | Campaign Analytics, Support Ticket Insights, Activity Productivity
                */
                [
                    'code' => 'crm-analytics',
                    'name' => 'CRM Analytics',
                    'description' => 'CRM insights, forecasts, and performance analytics',
                    'icon' => 'ChartPieIcon',
                    'route' => '/tenant/crm/analytics',
                    'priority' => 10,

                    'components' => [
                        [
                            'code' => 'lead-insights',
                            'name' => 'Lead Insights',
                            'type' => 'page',
                            'route' => '/tenant/crm/analytics/leads',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Lead Insights'],
                                ['code' => 'export', 'name' => 'Export Lead Analytics'],
                            ],
                        ],
                        [
                            'code' => 'deal-forecast',
                            'name' => 'Deal Forecast',
                            'type' => 'page',
                            'route' => '/tenant/crm/analytics/forecast',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Deal Forecast'],
                                ['code' => 'export', 'name' => 'Export Forecast'],
                            ],
                        ],
                        [
                            'code' => 'revenue-pipeline',
                            'name' => 'Revenue Pipeline',
                            'type' => 'page',
                            'route' => '/tenant/crm/analytics/revenue',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Revenue Pipeline'],
                                ['code' => 'export', 'name' => 'Export Revenue Data'],
                            ],
                        ],
                        [
                            'code' => 'campaign-performance',
                            'name' => 'Campaign Analytics',
                            'type' => 'page',
                            'route' => '/tenant/crm/analytics/campaigns',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Campaign Performance'],
                                ['code' => 'export', 'name' => 'Export Campaign Data'],
                            ],
                        ],
                        [
                            'code' => 'support-insights',
                            'name' => 'Support Ticket Insights',
                            'type' => 'page',
                            'route' => '/tenant/crm/analytics/support',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Support Insights'],
                                ['code' => 'export', 'name' => 'Export Support Data'],
                            ],
                        ],
                        [
                            'code' => 'activity-productivity',
                            'name' => 'Activity Productivity Analysis',
                            'type' => 'page',
                            'route' => '/tenant/crm/analytics/activity',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Activity Productivity'],
                                ['code' => 'export', 'name' => 'Export Activity Data'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | ERP Module (Enterprise Resource Planning)
        |--------------------------------------------------------------------------
        | Section 4 - ERP (Enterprise Resource Planning)
        | 8 Submodules: Procurement, Inventory & Warehouse, Finance & Accounting,
        |               Sales & Distribution, Manufacturing, Project & Job Costing,
        |               Asset Management, Supply Chain
        */
        [
            'code' => 'erp',
            'name' => 'ERP',
            'description' => 'Enterprise Resource Planning including procurement, inventory, finance, sales, manufacturing, and supply chain',
            'icon' => 'BuildingOffice2Icon',
            'route_prefix' => '/tenant/erp',
            'category' => 'enterprise_resource',
            'priority' => 25,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'professional',
            'license_type' => 'standard',
            'dependencies' => ['core'],
            'release_date' => '2024-01-01',

            'submodules' => [
                /*
                |--------------------------------------------------------------------------
                | 4.1 Procurement / Purchase Management
                |--------------------------------------------------------------------------
                | Menus: Purchase Requisitions, Purchase Orders, Supplier Management,
                |        Purchase Returns, GRN (Goods Receipt Note)
                */
                [
                    'code' => 'procurement',
                    'name' => 'Procurement',
                    'description' => 'Purchase requisitions, orders, suppliers, GRN, and returns',
                    'icon' => 'ShoppingCartIcon',
                    'route' => '/tenant/erp/procurement',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'purchase-requisitions',
                            'name' => 'Purchase Requisitions',
                            'type' => 'page',
                            'route' => '/tenant/erp/procurement/requisitions',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Requisitions'],
                                ['code' => 'create', 'name' => 'Create Requisition'],
                                ['code' => 'edit', 'name' => 'Edit Requisition'],
                                ['code' => 'approve', 'name' => 'Approve Requisition'],
                                ['code' => 'reject', 'name' => 'Reject Requisition'],
                                ['code' => 'cancel', 'name' => 'Cancel Requisition'],
                                ['code' => 'delete', 'name' => 'Delete Requisition'],
                            ],
                        ],
                        [
                            'code' => 'purchase-orders',
                            'name' => 'Purchase Orders',
                            'type' => 'page',
                            'route' => '/tenant/erp/procurement/orders',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Purchase Orders'],
                                ['code' => 'create', 'name' => 'Create Purchase Order'],
                                ['code' => 'edit', 'name' => 'Edit Purchase Order'],
                                ['code' => 'convert-from-pr', 'name' => 'Convert from PR'],
                                ['code' => 'approve', 'name' => 'Approve Purchase Order'],
                                ['code' => 'send-to-vendor', 'name' => 'Send to Vendor'],
                                ['code' => 'mark-received', 'name' => 'Mark as Received'],
                                ['code' => 'delete', 'name' => 'Delete Purchase Order'],
                            ],
                        ],
                        [
                            'code' => 'suppliers',
                            'name' => 'Supplier Management',
                            'type' => 'page',
                            'route' => '/tenant/erp/procurement/suppliers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Suppliers'],
                                ['code' => 'add', 'name' => 'Add Supplier'],
                                ['code' => 'edit', 'name' => 'Edit Supplier'],
                                ['code' => 'blacklist', 'name' => 'Blacklist Supplier'],
                                ['code' => 'rate', 'name' => 'Rate Supplier'],
                                ['code' => 'delete', 'name' => 'Delete Supplier'],
                            ],
                        ],
                        [
                            'code' => 'grn',
                            'name' => 'Goods Receipt Note (GRN)',
                            'type' => 'page',
                            'route' => '/tenant/erp/procurement/grn',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View GRN'],
                                ['code' => 'generate', 'name' => 'Generate GRN'],
                                ['code' => 'verify-items', 'name' => 'Verify Items'],
                                ['code' => 'approve', 'name' => 'Approve GRN'],
                                ['code' => 'reject', 'name' => 'Reject GRN'],
                                ['code' => 'print', 'name' => 'Print GRN'],
                            ],
                        ],
                        [
                            'code' => 'purchase-returns',
                            'name' => 'Purchase Returns',
                            'type' => 'page',
                            'route' => '/tenant/erp/procurement/returns',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Purchase Returns'],
                                ['code' => 'create', 'name' => 'Create Return'],
                                ['code' => 'return-to-supplier', 'name' => 'Return to Supplier'],
                                ['code' => 'delete', 'name' => 'Delete Return'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 4.2 Inventory & Warehouse Management
                |--------------------------------------------------------------------------
                | Menus: Warehouses, Stock Items, Stock Adjustment, Stock Transfers,
                |        Batches & Lots, Stock Reports
                */
                [
                    'code' => 'inventory',
                    'name' => 'Inventory & Warehouse',
                    'description' => 'Warehouse management, stock items, adjustments, transfers, and batches',
                    'icon' => 'ArchiveBoxIcon',
                    'route' => '/tenant/erp/inventory',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'warehouses',
                            'name' => 'Warehouses',
                            'type' => 'page',
                            'route' => '/tenant/erp/inventory/warehouses',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Warehouses'],
                                ['code' => 'create', 'name' => 'Create Warehouse'],
                                ['code' => 'edit', 'name' => 'Edit Warehouse'],
                                ['code' => 'assign-manager', 'name' => 'Assign Manager'],
                                ['code' => 'delete', 'name' => 'Delete Warehouse'],
                            ],
                        ],
                        [
                            'code' => 'stock-items',
                            'name' => 'Stock Items',
                            'type' => 'page',
                            'route' => '/tenant/erp/inventory/items',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stock Items'],
                                ['code' => 'create', 'name' => 'Create Item'],
                                ['code' => 'edit', 'name' => 'Edit Item'],
                                ['code' => 'categorize', 'name' => 'Categorize Item'],
                                ['code' => 'barcode-print', 'name' => 'Print Barcode/QR'],
                                ['code' => 'track-serial', 'name' => 'Track Serial'],
                                ['code' => 'delete', 'name' => 'Delete Item'],
                            ],
                        ],
                        [
                            'code' => 'stock-adjustment',
                            'name' => 'Stock Adjustment',
                            'type' => 'page',
                            'route' => '/tenant/erp/inventory/adjustments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Adjustments'],
                                ['code' => 'add', 'name' => 'Add Adjustment'],
                                ['code' => 'approve', 'name' => 'Approve Adjustment'],
                                ['code' => 'reject', 'name' => 'Reject Adjustment'],
                                ['code' => 'audit', 'name' => 'Audit Adjustment'],
                                ['code' => 'delete', 'name' => 'Delete Adjustment'],
                            ],
                        ],
                        [
                            'code' => 'stock-transfer',
                            'name' => 'Stock Transfer',
                            'type' => 'page',
                            'route' => '/tenant/erp/inventory/transfers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Transfers'],
                                ['code' => 'create', 'name' => 'Create Transfer'],
                                ['code' => 'pick-list', 'name' => 'Generate Pick List'],
                                ['code' => 'approve', 'name' => 'Approve Transfer'],
                                ['code' => 'mark-delivered', 'name' => 'Mark Delivered'],
                                ['code' => 'delete', 'name' => 'Delete Transfer'],
                            ],
                        ],
                        [
                            'code' => 'batches-lots',
                            'name' => 'Batches & Lots',
                            'type' => 'page',
                            'route' => '/tenant/erp/inventory/batches',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Batches'],
                                ['code' => 'add', 'name' => 'Add Batch'],
                                ['code' => 'track-expiry', 'name' => 'Track Expiry'],
                                ['code' => 'mark-obsolete', 'name' => 'Mark Obsolete'],
                                ['code' => 'delete', 'name' => 'Delete Batch'],
                            ],
                        ],
                        [
                            'code' => 'stock-reports',
                            'name' => 'Stock Reports',
                            'type' => 'page',
                            'route' => '/tenant/erp/inventory/reports',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stock Reports'],
                                ['code' => 'export-ledger', 'name' => 'Export Stock Ledger'],
                                ['code' => 'valuation-report', 'name' => 'Stock Valuation Report'],
                                ['code' => 'movement-report', 'name' => 'Fast/Slow Moving Report'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 4.3 Finance & Accounting
                |--------------------------------------------------------------------------
                | Menus: Chart of Accounts, General Ledger, Journals, Accounts Payable,
                |        Accounts Receivable, Tax Management, Financial Reports
                */
                [
                    'code' => 'finance-accounting',
                    'name' => 'Finance & Accounting',
                    'description' => 'Chart of accounts, journals, AP/AR, taxes, and financial reports',
                    'icon' => 'CalculatorIcon',
                    'route' => '/tenant/erp/finance',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'chart-of-accounts',
                            'name' => 'Chart of Accounts',
                            'type' => 'page',
                            'route' => '/tenant/erp/finance/coa',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Chart of Accounts'],
                                ['code' => 'add', 'name' => 'Add Account'],
                                ['code' => 'edit', 'name' => 'Edit Account'],
                                ['code' => 'disable', 'name' => 'Disable Account'],
                            ],
                        ],
                        [
                            'code' => 'general-ledger',
                            'name' => 'General Ledger',
                            'type' => 'page',
                            'route' => '/tenant/erp/finance/ledger',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View General Ledger'],
                            ],
                        ],
                        [
                            'code' => 'journals',
                            'name' => 'Journals',
                            'type' => 'page',
                            'route' => '/tenant/erp/finance/journals',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Journals'],
                                ['code' => 'create', 'name' => 'Create Journal Entry'],
                                ['code' => 'approve', 'name' => 'Approve Entry'],
                                ['code' => 'reverse', 'name' => 'Reverse Entry'],
                                ['code' => 'delete', 'name' => 'Delete Entry'],
                            ],
                        ],
                        [
                            'code' => 'accounts-payable',
                            'name' => 'Accounts Payable',
                            'type' => 'page',
                            'route' => '/tenant/erp/finance/payable',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Accounts Payable'],
                                ['code' => 'record-bill', 'name' => 'Record Bill'],
                                ['code' => 'approve', 'name' => 'Approve Bill'],
                                ['code' => 'pay', 'name' => 'Pay Bill'],
                                ['code' => 'partial-payment', 'name' => 'Partial Payment'],
                                ['code' => 'vendor-balance', 'name' => 'View Vendor Balance'],
                                ['code' => 'delete', 'name' => 'Delete Bill'],
                            ],
                        ],
                        [
                            'code' => 'accounts-receivable',
                            'name' => 'Accounts Receivable',
                            'type' => 'page',
                            'route' => '/tenant/erp/finance/receivable',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Accounts Receivable'],
                                ['code' => 'create-invoice', 'name' => 'Create Invoice'],
                                ['code' => 'receive-payment', 'name' => 'Receive Payment'],
                                ['code' => 'credit-note', 'name' => 'Issue Credit Note'],
                                ['code' => 'refund', 'name' => 'Process Refund'],
                                ['code' => 'customer-balance', 'name' => 'View Customer Balance'],
                            ],
                        ],
                        [
                            'code' => 'tax-management',
                            'name' => 'Tax Management',
                            'type' => 'page',
                            'route' => '/tenant/erp/finance/taxes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Taxes'],
                                ['code' => 'define-rules', 'name' => 'Define Tax Rules'],
                                ['code' => 'assign-groups', 'name' => 'Assign Tax Groups'],
                                ['code' => 'toggle', 'name' => 'Enable/Disable Taxes'],
                            ],
                        ],
                        [
                            'code' => 'financial-reports',
                            'name' => 'Financial Reports',
                            'type' => 'page',
                            'route' => '/tenant/erp/finance/reports',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Financial Reports'],
                                ['code' => 'trial-balance', 'name' => 'Export Trial Balance'],
                                ['code' => 'income-statement', 'name' => 'Income Statement'],
                                ['code' => 'balance-sheet', 'name' => 'Balance Sheet'],
                                ['code' => 'cash-flow', 'name' => 'Cash Flow Statement'],
                                ['code' => 'vat-report', 'name' => 'VAT Report'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 4.4 Sales & Distribution
                |--------------------------------------------------------------------------
                | Menus: Sales Orders, Quotations, Delivery Notes, Invoices, Sales Returns
                */
                [
                    'code' => 'sales-distribution',
                    'name' => 'Sales & Distribution',
                    'description' => 'Sales orders, quotations, delivery, invoicing, and returns',
                    'icon' => 'CurrencyDollarIcon',
                    'route' => '/tenant/erp/sales',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'quotations',
                            'name' => 'Quotations',
                            'type' => 'page',
                            'route' => '/tenant/erp/sales/quotations',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Quotations'],
                                ['code' => 'create', 'name' => 'Create Quotation'],
                                ['code' => 'convert-to-so', 'name' => 'Convert to Sales Order'],
                                ['code' => 'send-to-customer', 'name' => 'Send to Customer'],
                                ['code' => 'delete', 'name' => 'Delete Quotation'],
                            ],
                        ],
                        [
                            'code' => 'sales-orders',
                            'name' => 'Sales Orders',
                            'type' => 'page',
                            'route' => '/tenant/erp/sales/orders',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sales Orders'],
                                ['code' => 'create', 'name' => 'Create Sales Order'],
                                ['code' => 'edit', 'name' => 'Edit Sales Order'],
                                ['code' => 'approve', 'name' => 'Approve Sales Order'],
                                ['code' => 'assign-warehouse', 'name' => 'Assign Warehouse'],
                                ['code' => 'mark-delivered', 'name' => 'Mark Delivered'],
                                ['code' => 'cancel', 'name' => 'Cancel Sales Order'],
                            ],
                        ],
                        [
                            'code' => 'delivery-notes',
                            'name' => 'Delivery Notes',
                            'type' => 'page',
                            'route' => '/tenant/erp/sales/delivery',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Delivery Notes'],
                                ['code' => 'generate', 'name' => 'Generate Delivery Note'],
                                ['code' => 'dispatch', 'name' => 'Dispatch Delivery'],
                                ['code' => 'confirm', 'name' => 'Delivery Confirmation'],
                                ['code' => 'print', 'name' => 'Print Delivery Note'],
                            ],
                        ],
                        [
                            'code' => 'sales-invoices',
                            'name' => 'Invoices',
                            'type' => 'page',
                            'route' => '/tenant/erp/sales/invoices',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Invoices'],
                                ['code' => 'create', 'name' => 'Create Invoice'],
                                ['code' => 'edit', 'name' => 'Edit Invoice'],
                                ['code' => 'send-to-customer', 'name' => 'Send to Customer'],
                                ['code' => 'mark-paid', 'name' => 'Mark as Paid'],
                                ['code' => 'partial-payment', 'name' => 'Partial Payment'],
                                ['code' => 'delete', 'name' => 'Delete Invoice'],
                            ],
                        ],
                        [
                            'code' => 'sales-returns',
                            'name' => 'Sales Returns',
                            'type' => 'page',
                            'route' => '/tenant/erp/sales/returns',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sales Returns'],
                                ['code' => 'create', 'name' => 'Create Return'],
                                ['code' => 'approve', 'name' => 'Approve Return'],
                                ['code' => 'reintegrate-stock', 'name' => 'Reintegrate Stock'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 4.5 Manufacturing
                |--------------------------------------------------------------------------
                | Menus: Bill of Materials, Work Orders, Production Planning,
                |        Machine/Line Setup, Quality Checks
                */
                [
                    'code' => 'manufacturing',
                    'name' => 'Manufacturing',
                    'description' => 'Bill of materials, work orders, production planning, and quality control',
                    'icon' => 'WrenchScrewdriverIcon',
                    'route' => '/tenant/erp/manufacturing',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'bom',
                            'name' => 'Bill of Materials',
                            'type' => 'page',
                            'route' => '/tenant/erp/manufacturing/bom',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View BOM'],
                                ['code' => 'add', 'name' => 'Add BOM'],
                                ['code' => 'edit', 'name' => 'Edit BOM'],
                                ['code' => 'multi-level', 'name' => 'Multi-level BOM'],
                                ['code' => 'delete', 'name' => 'Delete BOM'],
                            ],
                        ],
                        [
                            'code' => 'work-orders',
                            'name' => 'Work Orders',
                            'type' => 'page',
                            'route' => '/tenant/erp/manufacturing/work-orders',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Work Orders'],
                                ['code' => 'create', 'name' => 'Create Work Order'],
                                ['code' => 'assign-machines', 'name' => 'Assign Machines'],
                                ['code' => 'start-stop', 'name' => 'Start/Stop Production'],
                                ['code' => 'qc-check', 'name' => 'QC Check'],
                                ['code' => 'mark-complete', 'name' => 'Mark Complete'],
                            ],
                        ],
                        [
                            'code' => 'production-planning',
                            'name' => 'Production Planning',
                            'type' => 'page',
                            'route' => '/tenant/erp/manufacturing/planning',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Production Planning'],
                                ['code' => 'mrp', 'name' => 'Material Requirement Planning'],
                                ['code' => 'capacity-planning', 'name' => 'Capacity Planning'],
                                ['code' => 'schedule-jobs', 'name' => 'Schedule Jobs'],
                            ],
                        ],
                        [
                            'code' => 'machine-setup',
                            'name' => 'Machine/Line Setup',
                            'type' => 'page',
                            'route' => '/tenant/erp/manufacturing/machines',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Machines'],
                                ['code' => 'add', 'name' => 'Add Machine'],
                                ['code' => 'edit', 'name' => 'Edit Machine'],
                                ['code' => 'assign-line', 'name' => 'Assign to Line'],
                                ['code' => 'delete', 'name' => 'Delete Machine'],
                            ],
                        ],
                        [
                            'code' => 'quality-control',
                            'name' => 'Quality Checks',
                            'type' => 'page',
                            'route' => '/tenant/erp/manufacturing/qc',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View QC Reports'],
                                ['code' => 'set-rules', 'name' => 'Set QC Rules'],
                                ['code' => 'approve-batches', 'name' => 'Approve Batches'],
                                ['code' => 'reject-return', 'name' => 'Reject & Return'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 4.6 Project & Job Costing
                |--------------------------------------------------------------------------
                | Menus: Projects, Milestones, Cost Centers, Time & Material Tracking,
                |        Budgeting
                */
                [
                    'code' => 'job-costing',
                    'name' => 'Project & Job Costing',
                    'description' => 'Project costing, cost centers, time tracking, and budgeting',
                    'icon' => 'BriefcaseIcon',
                    'route' => '/tenant/erp/job-costing',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'erp-projects',
                            'name' => 'Projects',
                            'type' => 'page',
                            'route' => '/tenant/erp/job-costing/projects',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Projects'],
                                ['code' => 'create', 'name' => 'Create Project'],
                                ['code' => 'assign-team', 'name' => 'Assign Team'],
                                ['code' => 'set-budget', 'name' => 'Set Budget'],
                                ['code' => 'timeline', 'name' => 'Manage Timeline'],
                                ['code' => 'archive', 'name' => 'Archive Project'],
                            ],
                        ],
                        [
                            'code' => 'milestones',
                            'name' => 'Milestones',
                            'type' => 'page',
                            'route' => '/tenant/erp/job-costing/milestones',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Milestones'],
                                ['code' => 'create', 'name' => 'Create Milestone'],
                                ['code' => 'edit', 'name' => 'Edit Milestone'],
                                ['code' => 'delete', 'name' => 'Delete Milestone'],
                            ],
                        ],
                        [
                            'code' => 'cost-centers',
                            'name' => 'Cost Centers',
                            'type' => 'page',
                            'route' => '/tenant/erp/job-costing/cost-centers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Cost Centers'],
                                ['code' => 'add', 'name' => 'Add Cost Center'],
                                ['code' => 'assign-expenses', 'name' => 'Assign Expenses'],
                                ['code' => 'track-utilization', 'name' => 'Track Utilization'],
                            ],
                        ],
                        [
                            'code' => 'time-material',
                            'name' => 'Time & Material Tracking',
                            'type' => 'page',
                            'route' => '/tenant/erp/job-costing/time-material',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Time & Material'],
                                ['code' => 'log-time', 'name' => 'Log Time'],
                                ['code' => 'log-material', 'name' => 'Log Material'],
                                ['code' => 'approve', 'name' => 'Approve Entries'],
                            ],
                        ],
                        [
                            'code' => 'budgeting',
                            'name' => 'Budgeting',
                            'type' => 'page',
                            'route' => '/tenant/erp/job-costing/budgets',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Budgets'],
                                ['code' => 'create', 'name' => 'Create Budget'],
                                ['code' => 'variance-analysis', 'name' => 'Variance Analysis'],
                                ['code' => 'audit', 'name' => 'Audit Budget'],
                                ['code' => 'export', 'name' => 'Export Budget'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 4.7 Asset Management
                |--------------------------------------------------------------------------
                | Menus: Fixed Assets, Depreciation, Maintenance Logs, Asset Transfer,
                |        Disposal
                */
                [
                    'code' => 'asset-management',
                    'name' => 'Asset Management',
                    'description' => 'Fixed assets, depreciation, maintenance, transfers, and disposal',
                    'icon' => 'BuildingOfficeIcon',
                    'route' => '/tenant/erp/assets',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'fixed-assets',
                            'name' => 'Fixed Assets',
                            'type' => 'page',
                            'route' => '/tenant/erp/assets/fixed',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Fixed Assets'],
                                ['code' => 'register', 'name' => 'Register Asset'],
                                ['code' => 'tag', 'name' => 'Tag Asset'],
                                ['code' => 'assign-user', 'name' => 'Assign User'],
                                ['code' => 'delete', 'name' => 'Delete Asset'],
                            ],
                        ],
                        [
                            'code' => 'depreciation',
                            'name' => 'Depreciation',
                            'type' => 'page',
                            'route' => '/tenant/erp/assets/depreciation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Depreciation'],
                                ['code' => 'run-schedule', 'name' => 'Run Depreciation Schedule'],
                                ['code' => 'auto-calculate', 'name' => 'Auto-calculation'],
                                ['code' => 'year-end-close', 'name' => 'Year-end Closing'],
                            ],
                        ],
                        [
                            'code' => 'maintenance-logs',
                            'name' => 'Maintenance Logs',
                            'type' => 'page',
                            'route' => '/tenant/erp/assets/maintenance',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Maintenance Logs'],
                                ['code' => 'add-entry', 'name' => 'Add Maintenance Entry'],
                                ['code' => 'preventive-schedule', 'name' => 'Preventive Schedule'],
                                ['code' => 'assign-vendor', 'name' => 'Assign Vendor'],
                            ],
                        ],
                        [
                            'code' => 'asset-transfer',
                            'name' => 'Asset Transfer',
                            'type' => 'page',
                            'route' => '/tenant/erp/assets/transfer',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Transfers'],
                                ['code' => 'transfer', 'name' => 'Transfer Between Departments'],
                                ['code' => 'approve', 'name' => 'Approve Transfer'],
                            ],
                        ],
                        [
                            'code' => 'asset-disposal',
                            'name' => 'Asset Disposal',
                            'type' => 'page',
                            'route' => '/tenant/erp/assets/disposal',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Disposals'],
                                ['code' => 'dispose', 'name' => 'Dispose Asset'],
                                ['code' => 'record-scrap', 'name' => 'Record Scrap Value'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 4.8 Supply Chain
                |--------------------------------------------------------------------------
                | Menus: Supplier Performance, Lead Time Analysis, Freight/Logistics,
                |        Shipment Tracking
                */
                [
                    'code' => 'supply-chain',
                    'name' => 'Supply Chain',
                    'description' => 'Supplier performance, logistics, freight, and shipment tracking',
                    'icon' => 'TruckIcon',
                    'route' => '/tenant/erp/supply-chain',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'supplier-performance',
                            'name' => 'Supplier Performance',
                            'type' => 'page',
                            'route' => '/tenant/erp/supply-chain/performance',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Supplier Performance'],
                                ['code' => 'rate', 'name' => 'Rate Suppliers'],
                                ['code' => 'quality-score', 'name' => 'Quality Score'],
                                ['code' => 'delivery-score', 'name' => 'Delivery Score'],
                            ],
                        ],
                        [
                            'code' => 'lead-time',
                            'name' => 'Lead Time Analysis',
                            'type' => 'page',
                            'route' => '/tenant/erp/supply-chain/lead-time',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Lead Time Analysis'],
                                ['code' => 'analyze', 'name' => 'Analyze Lead Times'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'freight-logistics',
                            'name' => 'Freight & Logistics',
                            'type' => 'page',
                            'route' => '/tenant/erp/supply-chain/freight',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Freight'],
                                ['code' => 'add', 'name' => 'Add Freight Entry'],
                                ['code' => 'manage-carriers', 'name' => 'Manage Carriers'],
                                ['code' => 'cost-analysis', 'name' => 'Cost Analysis'],
                            ],
                        ],
                        [
                            'code' => 'shipment-tracking',
                            'name' => 'Shipment Tracking',
                            'type' => 'page',
                            'route' => '/tenant/erp/supply-chain/shipments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Shipments'],
                                ['code' => 'assign', 'name' => 'Assign Shipment'],
                                ['code' => 'track', 'name' => 'Track Updates'],
                                ['code' => 'confirm-delivery', 'name' => 'Confirm Delivery'],
                                ['code' => 'import', 'name' => 'Import Data'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | Project Management Module
        |--------------------------------------------------------------------------
        | Section 5 - Project Management
        | 10 Submodules: Projects, Tasks & Work Items, Sprints & Agile Boards,
        |                Teams & Resources, Time Tracking, Documents & Files,
        |                Risks & Issues, Project Financials, Reports & Dashboards, Settings
        */
        [
            'code' => 'project',
            'name' => 'Project Management',
            'description' => 'Full-scale project management with tasks, sprints, resources, documents, risks, and reporting',
            'icon' => 'BriefcaseIcon',
            'route_prefix' => '/tenant/projects',
            'category' => 'project_management',
            'priority' => 30,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'business',
            'license_type' => 'standard',
            'dependencies' => ['core'],
            'release_date' => '2024-01-01',

            'submodules' => [
                /*
                |--------------------------------------------------------------------------
                | 5.2.1 Projects
                |--------------------------------------------------------------------------
                | Components: Project list, Project overview, Timeline (Gantt), Members & roles,
                |            Budget & cost summary, Activity feed
                */
                [
                    'code' => 'projects',
                    'name' => 'Projects',
                    'description' => 'Project overview, timeline, members, budget, and activity feed',
                    'icon' => 'FolderIcon',
                    'route' => '/tenant/projects',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'project-list',
                            'name' => 'Project List',
                            'type' => 'page',
                            'route' => '/tenant/projects',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Projects'],
                                ['code' => 'create', 'name' => 'Create Project'],
                                ['code' => 'edit', 'name' => 'Edit Project'],
                                ['code' => 'assign-members', 'name' => 'Assign Members'],
                                ['code' => 'add-budget', 'name' => 'Add Budget'],
                                ['code' => 'change-status', 'name' => 'Change Status'],
                                ['code' => 'archive', 'name' => 'Archive Project'],
                                ['code' => 'delete', 'name' => 'Delete Project'],
                                ['code' => 'duplicate', 'name' => 'Duplicate Project'],
                                ['code' => 'export', 'name' => 'Export Summary'],
                            ],
                        ],
                        [
                            'code' => 'project-overview',
                            'name' => 'Project Overview',
                            'type' => 'page',
                            'route' => '/tenant/projects/{id}',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Overview'],
                                ['code' => 'edit', 'name' => 'Edit Overview'],
                            ],
                        ],
                        [
                            'code' => 'timeline-gantt',
                            'name' => 'Timeline (Gantt)',
                            'type' => 'page',
                            'route' => '/tenant/projects/{id}/timeline',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Timeline'],
                                ['code' => 'edit', 'name' => 'Edit Timeline'],
                                ['code' => 'export', 'name' => 'Export Timeline'],
                            ],
                        ],
                        [
                            'code' => 'members-roles',
                            'name' => 'Members & Roles',
                            'type' => 'section',
                            'route' => '/tenant/projects/{id}/members',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Members'],
                                ['code' => 'add', 'name' => 'Add Member'],
                                ['code' => 'remove', 'name' => 'Remove Member'],
                                ['code' => 'change-role', 'name' => 'Change Role'],
                            ],
                        ],
                        [
                            'code' => 'budget-cost',
                            'name' => 'Budget & Cost Summary',
                            'type' => 'section',
                            'route' => '/tenant/projects/{id}/budget',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Budget'],
                                ['code' => 'edit', 'name' => 'Edit Budget'],
                            ],
                        ],
                        [
                            'code' => 'activity-feed',
                            'name' => 'Activity Feed',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Activity'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 5.2.2 Tasks & Work Items
                |--------------------------------------------------------------------------
                | Components: Task list/board, Kanban, Task detail, Subtasks, Comments,
                |            Attachments, Labels/tags, Priorities, Dependencies
                */
                [
                    'code' => 'tasks',
                    'name' => 'Tasks & Work Items',
                    'description' => 'Task management with Kanban, subtasks, comments, and dependencies',
                    'icon' => 'ClipboardDocumentCheckIcon',
                    'route' => '/tenant/projects/tasks',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'task-list',
                            'name' => 'Task List',
                            'type' => 'page',
                            'route' => '/tenant/projects/tasks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tasks'],
                                ['code' => 'create', 'name' => 'Create Task'],
                                ['code' => 'edit', 'name' => 'Edit Task'],
                                ['code' => 'assign', 'name' => 'Assign User'],
                                ['code' => 'set-due-date', 'name' => 'Set Due Date'],
                                ['code' => 'change-status', 'name' => 'Change Status'],
                                ['code' => 'delete', 'name' => 'Delete Task'],
                            ],
                        ],
                        [
                            'code' => 'kanban-board',
                            'name' => 'Kanban Board',
                            'type' => 'page',
                            'route' => '/tenant/projects/tasks/kanban',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Kanban'],
                                ['code' => 'move-card', 'name' => 'Move Card'],
                                ['code' => 'reorder', 'name' => 'Reorder Cards'],
                            ],
                        ],
                        [
                            'code' => 'task-detail',
                            'name' => 'Task Detail',
                            'type' => 'page',
                            'route' => '/tenant/projects/tasks/{id}',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Task Detail'],
                                ['code' => 'edit', 'name' => 'Edit Task'],
                            ],
                        ],
                        [
                            'code' => 'subtasks',
                            'name' => 'Subtasks',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'add', 'name' => 'Add Subtask'],
                                ['code' => 'edit', 'name' => 'Edit Subtask'],
                                ['code' => 'delete', 'name' => 'Delete Subtask'],
                            ],
                        ],
                        [
                            'code' => 'task-comments',
                            'name' => 'Comments',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'add', 'name' => 'Add Comment'],
                                ['code' => 'edit', 'name' => 'Edit Comment'],
                                ['code' => 'delete', 'name' => 'Delete Comment'],
                            ],
                        ],
                        [
                            'code' => 'task-attachments',
                            'name' => 'Attachments',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'attach', 'name' => 'Attach File'],
                                ['code' => 'download', 'name' => 'Download Attachment'],
                                ['code' => 'delete', 'name' => 'Delete Attachment'],
                            ],
                        ],
                        [
                            'code' => 'task-labels',
                            'name' => 'Labels & Tags',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'add-label', 'name' => 'Add Label'],
                                ['code' => 'remove-label', 'name' => 'Remove Label'],
                            ],
                        ],
                        [
                            'code' => 'task-dependencies',
                            'name' => 'Dependencies',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'add-dependency', 'name' => 'Add Dependency'],
                                ['code' => 'remove-dependency', 'name' => 'Remove Dependency'],
                            ],
                        ],
                        [
                            'code' => 'time-log',
                            'name' => 'Time Log',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'log-hours', 'name' => 'Log Hours'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 5.2.3 Sprints & Agile Boards (Scrum/Kanban)
                |--------------------------------------------------------------------------
                | Components: Sprint list, Sprint details, Backlog, Kanban board, Burndown chart
                */
                [
                    'code' => 'sprints',
                    'name' => 'Sprints & Agile Boards',
                    'description' => 'Sprint management, backlog, Kanban boards, and burndown charts',
                    'icon' => 'ArrowPathIcon',
                    'route' => '/tenant/projects/sprints',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'sprint-list',
                            'name' => 'Sprint List',
                            'type' => 'page',
                            'route' => '/tenant/projects/sprints',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sprints'],
                                ['code' => 'create', 'name' => 'Create Sprint'],
                                ['code' => 'edit', 'name' => 'Edit Sprint'],
                                ['code' => 'start', 'name' => 'Start Sprint'],
                                ['code' => 'close', 'name' => 'Close Sprint'],
                                ['code' => 'delete', 'name' => 'Delete Sprint'],
                            ],
                        ],
                        [
                            'code' => 'sprint-details',
                            'name' => 'Sprint Details',
                            'type' => 'page',
                            'route' => '/tenant/projects/sprints/{id}',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sprint Details'],
                                ['code' => 'add-tasks', 'name' => 'Add Tasks to Sprint'],
                                ['code' => 'remove-tasks', 'name' => 'Remove Tasks'],
                            ],
                        ],
                        [
                            'code' => 'backlog',
                            'name' => 'Backlog',
                            'type' => 'page',
                            'route' => '/tenant/projects/backlog',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Backlog'],
                                ['code' => 'reorder', 'name' => 'Reorder Backlog'],
                                ['code' => 'move-to-sprint', 'name' => 'Move to Sprint'],
                            ],
                        ],
                        [
                            'code' => 'sprint-board',
                            'name' => 'Sprint Kanban Board',
                            'type' => 'page',
                            'route' => '/tenant/projects/sprints/{id}/board',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Board'],
                                ['code' => 'change-column', 'name' => 'Change Column Status'],
                            ],
                        ],
                        [
                            'code' => 'burndown-chart',
                            'name' => 'Burndown Chart',
                            'type' => 'page',
                            'route' => '/tenant/projects/sprints/{id}/burndown',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Burndown'],
                                ['code' => 'export', 'name' => 'Export Chart'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 5.2.4 Teams & Resources
                |--------------------------------------------------------------------------
                | Components: Team list, Resource allocation chart, Availability calendar
                */
                [
                    'code' => 'teams-resources',
                    'name' => 'Teams & Resources',
                    'description' => 'Team management, resource allocation, and availability tracking',
                    'icon' => 'UserGroupIcon',
                    'route' => '/tenant/projects/teams',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'team-list',
                            'name' => 'Team List',
                            'type' => 'page',
                            'route' => '/tenant/projects/teams',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Teams'],
                                ['code' => 'add', 'name' => 'Add Team'],
                                ['code' => 'edit', 'name' => 'Edit Team'],
                                ['code' => 'add-member', 'name' => 'Add Member'],
                                ['code' => 'remove-member', 'name' => 'Remove Member'],
                                ['code' => 'change-roles', 'name' => 'Change Roles'],
                                ['code' => 'delete', 'name' => 'Delete Team'],
                            ],
                        ],
                        [
                            'code' => 'resource-allocation',
                            'name' => 'Resource Allocation',
                            'type' => 'page',
                            'route' => '/tenant/projects/resources/allocation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Allocation'],
                                ['code' => 'view-workload', 'name' => 'View Workload'],
                                ['code' => 'adjust', 'name' => 'Adjust Allocation'],
                                ['code' => 'lock', 'name' => 'Lock Resource'],
                            ],
                        ],
                        [
                            'code' => 'availability-calendar',
                            'name' => 'Availability Calendar',
                            'type' => 'page',
                            'route' => '/tenant/projects/resources/availability',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Availability'],
                                ['code' => 'update', 'name' => 'Update Availability'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 5.2.5 Time Tracking
                |--------------------------------------------------------------------------
                | Components: Timesheet, Time entry, Time approval, Billable vs non-billable
                */
                [
                    'code' => 'time-tracking',
                    'name' => 'Time Tracking',
                    'description' => 'Timesheet management, approvals, and billable tracking',
                    'icon' => 'ClockIcon',
                    'route' => '/tenant/projects/time',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'timesheet',
                            'name' => 'Timesheet',
                            'type' => 'page',
                            'route' => '/tenant/projects/time/timesheet',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Timesheet'],
                                ['code' => 'export', 'name' => 'Export Timesheet'],
                            ],
                        ],
                        [
                            'code' => 'time-entries',
                            'name' => 'Time Entries',
                            'type' => 'page',
                            'route' => '/tenant/projects/time/entries',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Time Entries'],
                                ['code' => 'add', 'name' => 'Add Time Entry'],
                                ['code' => 'edit', 'name' => 'Edit Time Entry'],
                                ['code' => 'delete', 'name' => 'Delete Time Entry'],
                            ],
                        ],
                        [
                            'code' => 'time-approval',
                            'name' => 'Time Approval',
                            'type' => 'page',
                            'route' => '/tenant/projects/time/approval',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Pending Approvals'],
                                ['code' => 'approve', 'name' => 'Approve Hours'],
                                ['code' => 'reject', 'name' => 'Reject Hours'],
                            ],
                        ],
                        [
                            'code' => 'billable-tracking',
                            'name' => 'Billable Tracking',
                            'type' => 'page',
                            'route' => '/tenant/projects/time/billable',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Billable Hours'],
                                ['code' => 'toggle-billable', 'name' => 'Toggle Billable'],
                                ['code' => 'generate-invoice', 'name' => 'Generate Invoice'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 5.2.6 Documents & Files
                |--------------------------------------------------------------------------
                | Components: Project file library, Versioning, Folder structure, File preview
                */
                [
                    'code' => 'documents',
                    'name' => 'Documents & Files',
                    'description' => 'Project file library with versioning, folders, and preview',
                    'icon' => 'DocumentIcon',
                    'route' => '/tenant/projects/documents',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'file-library',
                            'name' => 'File Library',
                            'type' => 'page',
                            'route' => '/tenant/projects/documents',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Files'],
                                ['code' => 'upload', 'name' => 'Upload File'],
                                ['code' => 'rename', 'name' => 'Rename File'],
                                ['code' => 'move', 'name' => 'Move File'],
                                ['code' => 'delete', 'name' => 'Delete File'],
                            ],
                        ],
                        [
                            'code' => 'folders',
                            'name' => 'Folder Structure',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'create-folder', 'name' => 'Create Folder'],
                                ['code' => 'rename-folder', 'name' => 'Rename Folder'],
                                ['code' => 'delete-folder', 'name' => 'Delete Folder'],
                            ],
                        ],
                        [
                            'code' => 'versioning',
                            'name' => 'Versioning',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view-versions', 'name' => 'View Versions'],
                                ['code' => 'upload-version', 'name' => 'Upload New Version'],
                                ['code' => 'restore-version', 'name' => 'Restore Version'],
                            ],
                        ],
                        [
                            'code' => 'file-preview',
                            'name' => 'File Preview',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'preview', 'name' => 'Preview File'],
                                ['code' => 'download', 'name' => 'Download File'],
                                ['code' => 'lock', 'name' => 'Lock File'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 5.2.7 Risks & Issues
                |--------------------------------------------------------------------------
                | Components: Risk register, Issue log, Severity & probability scoring,
                |            Mitigation plans, Risk matrix
                */
                [
                    'code' => 'risks-issues',
                    'name' => 'Risks & Issues',
                    'description' => 'Risk register, issue tracking, severity scoring, and mitigation plans',
                    'icon' => 'ExclamationTriangleIcon',
                    'route' => '/tenant/projects/risks',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'risk-register',
                            'name' => 'Risk Register',
                            'type' => 'page',
                            'route' => '/tenant/projects/risks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Risks'],
                                ['code' => 'add', 'name' => 'Add Risk'],
                                ['code' => 'edit', 'name' => 'Edit Risk'],
                                ['code' => 'assign-owner', 'name' => 'Assign Owner'],
                                ['code' => 'add-mitigation', 'name' => 'Add Mitigation'],
                                ['code' => 'change-severity', 'name' => 'Change Severity'],
                                ['code' => 'close', 'name' => 'Close Risk'],
                                ['code' => 'delete', 'name' => 'Delete Risk'],
                            ],
                        ],
                        [
                            'code' => 'issue-log',
                            'name' => 'Issue Log',
                            'type' => 'page',
                            'route' => '/tenant/projects/issues',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Issues'],
                                ['code' => 'add', 'name' => 'Add Issue'],
                                ['code' => 'edit', 'name' => 'Edit Issue'],
                                ['code' => 'assign', 'name' => 'Assign Issue'],
                                ['code' => 'change-status', 'name' => 'Change Status'],
                                ['code' => 'resolve', 'name' => 'Resolve Issue'],
                                ['code' => 'close', 'name' => 'Close Issue'],
                                ['code' => 'delete', 'name' => 'Delete Issue'],
                            ],
                        ],
                        [
                            'code' => 'risk-matrix',
                            'name' => 'Risk Matrix',
                            'type' => 'page',
                            'route' => '/tenant/projects/risks/matrix',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Risk Matrix'],
                                ['code' => 'export', 'name' => 'Export Matrix'],
                            ],
                        ],
                        [
                            'code' => 'mitigation-plans',
                            'name' => 'Mitigation Plans',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Mitigation Plans'],
                                ['code' => 'add', 'name' => 'Add Mitigation Plan'],
                                ['code' => 'edit', 'name' => 'Edit Plan'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 5.2.8 Project Financials
                |--------------------------------------------------------------------------
                | Components: Budget, Cost tracking, Expense list, Revenue, Profitability
                */
                [
                    'code' => 'project-financials',
                    'name' => 'Project Financials',
                    'description' => 'Budget, cost tracking, expenses, revenue, and profitability',
                    'icon' => 'BanknotesIcon',
                    'route' => '/tenant/projects/financials',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'budget',
                            'name' => 'Budget',
                            'type' => 'page',
                            'route' => '/tenant/projects/financials/budget',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Budget'],
                                ['code' => 'add-revision', 'name' => 'Add Budget Revision'],
                                ['code' => 'edit', 'name' => 'Edit Budget'],
                            ],
                        ],
                        [
                            'code' => 'cost-tracking',
                            'name' => 'Cost Tracking',
                            'type' => 'page',
                            'route' => '/tenant/projects/financials/costs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Costs'],
                                ['code' => 'add', 'name' => 'Add Cost'],
                                ['code' => 'edit', 'name' => 'Edit Cost'],
                                ['code' => 'approve', 'name' => 'Approve Cost'],
                                ['code' => 'reject', 'name' => 'Reject Cost'],
                            ],
                        ],
                        [
                            'code' => 'expense-list',
                            'name' => 'Expense List',
                            'type' => 'page',
                            'route' => '/tenant/projects/financials/expenses',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Expenses'],
                                ['code' => 'add', 'name' => 'Add Expense'],
                                ['code' => 'edit', 'name' => 'Edit Expense'],
                                ['code' => 'delete', 'name' => 'Delete Expense'],
                            ],
                        ],
                        [
                            'code' => 'revenue',
                            'name' => 'Revenue',
                            'type' => 'page',
                            'route' => '/tenant/projects/financials/revenue',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Revenue'],
                                ['code' => 'add', 'name' => 'Add Revenue Entry'],
                            ],
                        ],
                        [
                            'code' => 'profitability',
                            'name' => 'Profitability',
                            'type' => 'page',
                            'route' => '/tenant/projects/financials/profitability',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Profitability'],
                                ['code' => 'export', 'name' => 'Export Financial Report'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 5.2.9 Reports & Dashboards
                |--------------------------------------------------------------------------
                | Components: Progress reports, Task completion metrics, Team performance,
                |            Timeline reports, Sprint analytics, Risk heatmaps, Time spent charts
                */
                [
                    'code' => 'reports-dashboards',
                    'name' => 'Reports & Dashboards',
                    'description' => 'Progress reports, metrics, analytics, and data visualization',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/projects/reports',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'progress-reports',
                            'name' => 'Progress Reports',
                            'type' => 'page',
                            'route' => '/tenant/projects/reports/progress',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Progress Reports'],
                                ['code' => 'export-pdf', 'name' => 'Export PDF'],
                                ['code' => 'export-excel', 'name' => 'Export Excel'],
                                ['code' => 'schedule', 'name' => 'Schedule Reports'],
                                ['code' => 'send-email', 'name' => 'Send Email Report'],
                            ],
                        ],
                        [
                            'code' => 'task-metrics',
                            'name' => 'Task Completion Metrics',
                            'type' => 'page',
                            'route' => '/tenant/projects/reports/tasks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Task Metrics'],
                                ['code' => 'generate', 'name' => 'Generate On Demand'],
                            ],
                        ],
                        [
                            'code' => 'team-performance',
                            'name' => 'Team Performance',
                            'type' => 'page',
                            'route' => '/tenant/projects/reports/team',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Team Performance'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'timeline-reports',
                            'name' => 'Timeline Reports',
                            'type' => 'page',
                            'route' => '/tenant/projects/reports/timeline',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Timeline Reports'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'sprint-analytics',
                            'name' => 'Sprint Analytics',
                            'type' => 'page',
                            'route' => '/tenant/projects/reports/sprints',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sprint Analytics'],
                                ['code' => 'export', 'name' => 'Export Analytics'],
                            ],
                        ],
                        [
                            'code' => 'risk-heatmaps',
                            'name' => 'Risk Heatmaps',
                            'type' => 'page',
                            'route' => '/tenant/projects/reports/risks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Risk Heatmaps'],
                                ['code' => 'export', 'name' => 'Export Heatmap'],
                            ],
                        ],
                        [
                            'code' => 'time-charts',
                            'name' => 'Time Spent Charts',
                            'type' => 'page',
                            'route' => '/tenant/projects/reports/time',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Time Charts'],
                                ['code' => 'export', 'name' => 'Export Chart'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 5.2.10 Settings
                |--------------------------------------------------------------------------
                | Components: Task statuses, Priority levels, Labels, Custom fields,
                |            Automation rules, SLA/resolution times
                */
                [
                    'code' => 'pm-settings',
                    'name' => 'Settings',
                    'description' => 'Configure task statuses, priorities, labels, custom fields, and automation',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/tenant/projects/settings',
                    'priority' => 10,

                    'components' => [
                        [
                            'code' => 'task-statuses',
                            'name' => 'Task Statuses',
                            'type' => 'page',
                            'route' => '/tenant/projects/settings/statuses',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Statuses'],
                                ['code' => 'add', 'name' => 'Add Status'],
                                ['code' => 'edit', 'name' => 'Edit Status'],
                                ['code' => 'delete', 'name' => 'Delete Status'],
                            ],
                        ],
                        [
                            'code' => 'priority-levels',
                            'name' => 'Priority Levels',
                            'type' => 'page',
                            'route' => '/tenant/projects/settings/priorities',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Priorities'],
                                ['code' => 'add', 'name' => 'Add Priority'],
                                ['code' => 'edit', 'name' => 'Edit Priority'],
                                ['code' => 'delete', 'name' => 'Delete Priority'],
                            ],
                        ],
                        [
                            'code' => 'labels',
                            'name' => 'Labels',
                            'type' => 'page',
                            'route' => '/tenant/projects/settings/labels',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Labels'],
                                ['code' => 'add', 'name' => 'Add Label'],
                                ['code' => 'edit', 'name' => 'Edit Label'],
                                ['code' => 'delete', 'name' => 'Delete Label'],
                            ],
                        ],
                        [
                            'code' => 'custom-fields',
                            'name' => 'Custom Fields',
                            'type' => 'page',
                            'route' => '/tenant/projects/settings/custom-fields',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Custom Fields'],
                                ['code' => 'add', 'name' => 'Add Custom Field'],
                                ['code' => 'edit', 'name' => 'Edit Custom Field'],
                                ['code' => 'delete', 'name' => 'Delete Custom Field'],
                            ],
                        ],
                        [
                            'code' => 'automation-rules',
                            'name' => 'Automation Rules',
                            'type' => 'page',
                            'route' => '/tenant/projects/settings/automation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Automations'],
                                ['code' => 'add', 'name' => 'Add Automation'],
                                ['code' => 'edit', 'name' => 'Edit Automation'],
                                ['code' => 'deactivate', 'name' => 'Deactivate Automation'],
                                ['code' => 'delete', 'name' => 'Delete Automation'],
                            ],
                        ],
                        [
                            'code' => 'sla-settings',
                            'name' => 'SLA & Resolution Times',
                            'type' => 'page',
                            'route' => '/tenant/projects/settings/sla',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SLA Settings'],
                                ['code' => 'configure', 'name' => 'Configure Workflow'],
                                ['code' => 'edit', 'name' => 'Edit SLA'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | Accounting & Finance Module
        |--------------------------------------------------------------------------
        | Section 6 - Accounting & Finance
        | 14 Submodules: Dashboard, Chart of Accounts, General Ledger, Journals,
        |                Accounts Payable, Accounts Receivable, Banking, Cash Management,
        |                Budgeting, Fixed Assets, Tax Management, Financial Statements,
        |                Audit & Compliance, Settings
        */
        [
            'code' => 'finance',
            'name' => 'Accounting & Finance',
            'description' => 'Complete accounting with COA, GL, AP/AR, banking, budgeting, tax, and financial statements',
            'icon' => 'CurrencyDollarIcon',
            'route_prefix' => '/tenant/finance',
            'category' => 'financial_management',
            'priority' => 40,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'business',
            'license_type' => 'standard',
            'dependencies' => ['core'],
            'release_date' => '2024-01-01',

            'submodules' => [
                /*
                |--------------------------------------------------------------------------
                | 6.1 Accounting Dashboard
                |--------------------------------------------------------------------------
                | Components: Income/Expense summary, Profit trend, Receivables/Payables aging,
                |            Cashflow snapshot, Bank balances, Recent journal entries
                */
                [
                    'code' => 'accounting-dashboard',
                    'name' => 'Dashboard',
                    'description' => 'Accounting overview with income, expenses, cashflow, and aging reports',
                    'icon' => 'HomeIcon',
                    'route' => '/tenant/finance/dashboard',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'dashboard-overview',
                            'name' => 'Dashboard Overview',
                            'type' => 'page',
                            'route' => '/tenant/finance/dashboard',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dashboard'],
                                ['code' => 'export', 'name' => 'Export Dashboard'],
                                ['code' => 'filter', 'name' => 'Filter by Date/Branch'],
                                ['code' => 'download-pdf', 'name' => 'Download PDF'],
                            ],
                        ],
                        [
                            'code' => 'income-summary',
                            'name' => 'Income Summary',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Income Summary'],
                            ],
                        ],
                        [
                            'code' => 'expense-summary',
                            'name' => 'Expense Summary',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Expense Summary'],
                            ],
                        ],
                        [
                            'code' => 'receivables-aging',
                            'name' => 'Receivables Aging',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Receivables Aging'],
                            ],
                        ],
                        [
                            'code' => 'payables-aging',
                            'name' => 'Payables Aging',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Payables Aging'],
                            ],
                        ],
                        [
                            'code' => 'cashflow-snapshot',
                            'name' => 'Cashflow Snapshot',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Cashflow'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.2 Chart of Accounts (COA)
                |--------------------------------------------------------------------------
                | Components: Account list, Account types, Account hierarchy, Opening balances
                */
                [
                    'code' => 'chart-of-accounts',
                    'name' => 'Chart of Accounts',
                    'description' => 'Manage accounts, types, hierarchy, and opening balances',
                    'icon' => 'ClipboardDocumentListIcon',
                    'route' => '/tenant/finance/coa',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'account-list',
                            'name' => 'Account List',
                            'type' => 'page',
                            'route' => '/tenant/finance/coa',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Accounts'],
                                ['code' => 'create', 'name' => 'Create Account'],
                                ['code' => 'edit', 'name' => 'Edit Account'],
                                ['code' => 'archive', 'name' => 'Archive/Deactivate'],
                                ['code' => 'change-parent', 'name' => 'Change Parent Group'],
                                ['code' => 'set-opening-balance', 'name' => 'Set Opening Balance'],
                                ['code' => 'delete', 'name' => 'Delete Account'],
                            ],
                        ],
                        [
                            'code' => 'account-types',
                            'name' => 'Account Types',
                            'type' => 'page',
                            'route' => '/tenant/finance/coa/types',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Account Types'],
                                ['code' => 'manage', 'name' => 'Manage Types'],
                            ],
                        ],
                        [
                            'code' => 'account-hierarchy',
                            'name' => 'Account Hierarchy',
                            'type' => 'page',
                            'route' => '/tenant/finance/coa/hierarchy',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Hierarchy'],
                                ['code' => 'reorganize', 'name' => 'Reorganize'],
                            ],
                        ],
                        [
                            'code' => 'opening-balances',
                            'name' => 'Opening Balances',
                            'type' => 'page',
                            'route' => '/tenant/finance/coa/opening-balances',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Opening Balances'],
                                ['code' => 'set', 'name' => 'Set Opening Balance'],
                                ['code' => 'import', 'name' => 'Import Balances'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.3 General Ledger (GL)
                |--------------------------------------------------------------------------
                | Components: Ledger for each account, Debit-credit history, Drill-down, Reconciliation
                */
                [
                    'code' => 'general-ledger',
                    'name' => 'General Ledger',
                    'description' => 'View ledgers, debit-credit history, and reconciliation',
                    'icon' => 'BookOpenIcon',
                    'route' => '/tenant/finance/gl',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'ledger-list',
                            'name' => 'Ledger List',
                            'type' => 'page',
                            'route' => '/tenant/finance/gl',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Ledger'],
                                ['code' => 'export', 'name' => 'Export Ledger'],
                                ['code' => 'filter', 'name' => 'Filter Date'],
                                ['code' => 'print', 'name' => 'Print Ledger'],
                            ],
                        ],
                        [
                            'code' => 'ledger-detail',
                            'name' => 'Ledger Detail',
                            'type' => 'page',
                            'route' => '/tenant/finance/gl/{id}',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Ledger Detail'],
                                ['code' => 'drill-down', 'name' => 'Drill-down to Journal'],
                            ],
                        ],
                        [
                            'code' => 'ledger-reconciliation',
                            'name' => 'Ledger Reconciliation',
                            'type' => 'page',
                            'route' => '/tenant/finance/gl/reconciliation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Reconciliation'],
                                ['code' => 'reconcile', 'name' => 'Reconcile Entries'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.4 Journal Entries
                |--------------------------------------------------------------------------
                | Components: Manual journal, Recurring journals, Draft journals, Approval queue, Templates
                */
                [
                    'code' => 'journals',
                    'name' => 'Journal Entries',
                    'description' => 'Create, approve, and manage journal entries',
                    'icon' => 'DocumentPlusIcon',
                    'route' => '/tenant/finance/journals',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'journal-list',
                            'name' => 'Journal List',
                            'type' => 'page',
                            'route' => '/tenant/finance/journals',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Journals'],
                                ['code' => 'create', 'name' => 'Create Journal'],
                                ['code' => 'add-line', 'name' => 'Add Line Item'],
                                ['code' => 'attach', 'name' => 'Attach Supporting Files'],
                                ['code' => 'approve', 'name' => 'Approve Journal'],
                                ['code' => 'reject', 'name' => 'Reject Journal'],
                                ['code' => 'reverse', 'name' => 'Reverse Entry'],
                                ['code' => 'void', 'name' => 'Void Entry'],
                                ['code' => 'delete', 'name' => 'Delete Entry'],
                                ['code' => 'export', 'name' => 'Export Journals'],
                            ],
                        ],
                        [
                            'code' => 'recurring-journals',
                            'name' => 'Recurring Journals',
                            'type' => 'page',
                            'route' => '/tenant/finance/journals/recurring',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Recurring Journals'],
                                ['code' => 'create', 'name' => 'Create Recurring'],
                                ['code' => 'edit', 'name' => 'Edit Recurring'],
                                ['code' => 'pause', 'name' => 'Pause Recurring'],
                                ['code' => 'delete', 'name' => 'Delete Recurring'],
                            ],
                        ],
                        [
                            'code' => 'draft-journals',
                            'name' => 'Draft Journals',
                            'type' => 'page',
                            'route' => '/tenant/finance/journals/drafts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Drafts'],
                                ['code' => 'edit', 'name' => 'Edit Draft'],
                                ['code' => 'submit', 'name' => 'Submit for Approval'],
                                ['code' => 'delete', 'name' => 'Delete Draft'],
                            ],
                        ],
                        [
                            'code' => 'journal-approval',
                            'name' => 'Approval Queue',
                            'type' => 'page',
                            'route' => '/tenant/finance/journals/approval',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Pending Approvals'],
                                ['code' => 'approve', 'name' => 'Approve'],
                                ['code' => 'reject', 'name' => 'Reject'],
                            ],
                        ],
                        [
                            'code' => 'journal-templates',
                            'name' => 'Journal Templates',
                            'type' => 'page',
                            'route' => '/tenant/finance/journals/templates',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Templates'],
                                ['code' => 'create', 'name' => 'Create Template'],
                                ['code' => 'edit', 'name' => 'Edit Template'],
                                ['code' => 'delete', 'name' => 'Delete Template'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.5 Accounts Payable (AP)
                |--------------------------------------------------------------------------
                | Menus: Vendor Bills, Vendor Payments, Debit Notes, Vendor Management, AP Reports
                */
                [
                    'code' => 'accounts-payable',
                    'name' => 'Accounts Payable',
                    'description' => 'Vendor bills, payments, debit notes, and AP aging reports',
                    'icon' => 'ArrowUpTrayIcon',
                    'route' => '/tenant/finance/ap',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'vendor-bills',
                            'name' => 'Vendor Bills',
                            'type' => 'page',
                            'route' => '/tenant/finance/ap/bills',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Bills'],
                                ['code' => 'create', 'name' => 'Create Bill'],
                                ['code' => 'edit', 'name' => 'Edit Bill'],
                                ['code' => 'approve', 'name' => 'Approve Bill'],
                                ['code' => 'reject', 'name' => 'Reject Bill'],
                                ['code' => 'mark-paid', 'name' => 'Mark as Paid'],
                                ['code' => 'partial-payment', 'name' => 'Partial Payment'],
                                ['code' => 'attach', 'name' => 'Attach Invoice Image'],
                                ['code' => 'delete', 'name' => 'Delete Bill'],
                                ['code' => 'download', 'name' => 'Download Bill'],
                            ],
                        ],
                        [
                            'code' => 'vendor-payments',
                            'name' => 'Vendor Payments',
                            'type' => 'page',
                            'route' => '/tenant/finance/ap/payments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Payments'],
                                ['code' => 'record', 'name' => 'Record Payment'],
                                ['code' => 'choose-method', 'name' => 'Choose Payment Method'],
                                ['code' => 'add-reference', 'name' => 'Add Reference'],
                                ['code' => 'attach-receipt', 'name' => 'Attach Receipt'],
                            ],
                        ],
                        [
                            'code' => 'debit-notes',
                            'name' => 'Debit Notes',
                            'type' => 'page',
                            'route' => '/tenant/finance/ap/debit-notes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Debit Notes'],
                                ['code' => 'create', 'name' => 'Create Debit Note'],
                                ['code' => 'apply-to-bill', 'name' => 'Apply to Bill'],
                                ['code' => 'issue-to-vendor', 'name' => 'Issue to Vendor'],
                                ['code' => 'delete', 'name' => 'Delete Debit Note'],
                            ],
                        ],
                        [
                            'code' => 'vendor-management',
                            'name' => 'Vendor Management',
                            'type' => 'page',
                            'route' => '/tenant/finance/ap/vendors',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Vendors'],
                                ['code' => 'add', 'name' => 'Add Vendor'],
                                ['code' => 'edit', 'name' => 'Edit Vendor'],
                                ['code' => 'set-credit-limit', 'name' => 'Set Credit Limit'],
                                ['code' => 'disable', 'name' => 'Disable Vendor'],
                                ['code' => 'view-history', 'name' => 'View History'],
                            ],
                        ],
                        [
                            'code' => 'ap-reports',
                            'name' => 'AP Reports',
                            'type' => 'page',
                            'route' => '/tenant/finance/ap/reports',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View AP Reports'],
                                ['code' => 'export-aging', 'name' => 'Export Aging Report'],
                                ['code' => 'vendor-balance', 'name' => 'Vendor Balance Summary'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.6 Accounts Receivable (AR)
                |--------------------------------------------------------------------------
                | Menus: Sales Invoices, Customer Payments, Credit Notes, Customer Management, AR Reports
                */
                [
                    'code' => 'accounts-receivable',
                    'name' => 'Accounts Receivable',
                    'description' => 'Sales invoices, customer payments, credit notes, and AR aging',
                    'icon' => 'ArrowDownTrayIcon',
                    'route' => '/tenant/finance/ar',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'sales-invoices',
                            'name' => 'Sales Invoices',
                            'type' => 'page',
                            'route' => '/tenant/finance/ar/invoices',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Invoices'],
                                ['code' => 'create', 'name' => 'Create Invoice'],
                                ['code' => 'edit', 'name' => 'Edit Invoice'],
                                ['code' => 'send-email', 'name' => 'Send via Email'],
                                ['code' => 'mark-paid', 'name' => 'Mark as Paid'],
                                ['code' => 'partial-payment', 'name' => 'Partial Payment'],
                                ['code' => 'void', 'name' => 'Void Invoice'],
                                ['code' => 'delete', 'name' => 'Delete Invoice'],
                                ['code' => 'export-pdf', 'name' => 'Export PDF'],
                            ],
                        ],
                        [
                            'code' => 'customer-payments',
                            'name' => 'Customer Payments',
                            'type' => 'page',
                            'route' => '/tenant/finance/ar/payments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Payments'],
                                ['code' => 'record', 'name' => 'Record Payment'],
                                ['code' => 'match-invoices', 'name' => 'Match Against Invoices'],
                                ['code' => 'auto-apply', 'name' => 'Auto-apply Rules'],
                                ['code' => 'undo', 'name' => 'Undo Payment'],
                            ],
                        ],
                        [
                            'code' => 'credit-notes',
                            'name' => 'Credit Notes',
                            'type' => 'page',
                            'route' => '/tenant/finance/ar/credit-notes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Credit Notes'],
                                ['code' => 'create', 'name' => 'Create Credit Note'],
                                ['code' => 'apply-to-invoice', 'name' => 'Apply to Invoice'],
                                ['code' => 'refund', 'name' => 'Refund Customer'],
                                ['code' => 'delete', 'name' => 'Delete Credit Note'],
                            ],
                        ],
                        [
                            'code' => 'customer-management',
                            'name' => 'Customer Management',
                            'type' => 'page',
                            'route' => '/tenant/finance/ar/customers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Customers'],
                                ['code' => 'add', 'name' => 'Add Customer'],
                                ['code' => 'edit', 'name' => 'Edit Customer'],
                                ['code' => 'set-payment-terms', 'name' => 'Set Payment Terms'],
                                ['code' => 'block', 'name' => 'Block Customer'],
                                ['code' => 'view-history', 'name' => 'View History'],
                            ],
                        ],
                        [
                            'code' => 'ar-reports',
                            'name' => 'AR Reports',
                            'type' => 'page',
                            'route' => '/tenant/finance/ar/reports',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View AR Reports'],
                                ['code' => 'aging-report', 'name' => 'Aging Report'],
                                ['code' => 'outstanding', 'name' => 'Outstanding Invoices'],
                                ['code' => 'collections', 'name' => 'Collections Report'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.7 Banking
                |--------------------------------------------------------------------------
                | Components: Bank accounts, Bank feeds, Bank reconciliation, Bank statements
                */
                [
                    'code' => 'banking',
                    'name' => 'Banking',
                    'description' => 'Bank accounts, feeds, reconciliation, and statements',
                    'icon' => 'BuildingLibraryIcon',
                    'route' => '/tenant/finance/banking',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'bank-accounts',
                            'name' => 'Bank Accounts',
                            'type' => 'page',
                            'route' => '/tenant/finance/banking/accounts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Bank Accounts'],
                                ['code' => 'add', 'name' => 'Add Bank Account'],
                                ['code' => 'edit', 'name' => 'Edit Bank Account'],
                                ['code' => 'delete', 'name' => 'Delete Bank Account'],
                            ],
                        ],
                        [
                            'code' => 'bank-feeds',
                            'name' => 'Bank Feeds',
                            'type' => 'page',
                            'route' => '/tenant/finance/banking/feeds',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Bank Feeds'],
                                ['code' => 'import', 'name' => 'Import Transactions (CSV)'],
                                ['code' => 'match', 'name' => 'Match Transactions'],
                            ],
                        ],
                        [
                            'code' => 'bank-reconciliation',
                            'name' => 'Bank Reconciliation',
                            'type' => 'page',
                            'route' => '/tenant/finance/banking/reconciliation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Reconciliation'],
                                ['code' => 'reconcile', 'name' => 'Reconcile'],
                                ['code' => 'match-payments', 'name' => 'Match Payments'],
                                ['code' => 'create-clearing', 'name' => 'Create Clearing Entries'],
                            ],
                        ],
                        [
                            'code' => 'bank-statements',
                            'name' => 'Bank Statements',
                            'type' => 'page',
                            'route' => '/tenant/finance/banking/statements',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Statements'],
                                ['code' => 'export', 'name' => 'Export Bank Ledger'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.8 Cash Management
                |--------------------------------------------------------------------------
                | Components: Petty cash accounts, Cash transfers, Disbursements, Receipts
                */
                [
                    'code' => 'cash-management',
                    'name' => 'Cash Management',
                    'description' => 'Petty cash, transfers, disbursements, and receipts',
                    'icon' => 'BanknotesIcon',
                    'route' => '/tenant/finance/cash',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'petty-cash',
                            'name' => 'Petty Cash Accounts',
                            'type' => 'page',
                            'route' => '/tenant/finance/cash/petty',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Petty Cash'],
                                ['code' => 'add', 'name' => 'Add Account'],
                                ['code' => 'replenish', 'name' => 'Replenish Cash'],
                            ],
                        ],
                        [
                            'code' => 'cash-transfers',
                            'name' => 'Cash Transfers',
                            'type' => 'page',
                            'route' => '/tenant/finance/cash/transfers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Transfers'],
                                ['code' => 'add', 'name' => 'Add Transfer'],
                                ['code' => 'approve', 'name' => 'Approve Transfer'],
                            ],
                        ],
                        [
                            'code' => 'cash-disbursements',
                            'name' => 'Cash Disbursements',
                            'type' => 'page',
                            'route' => '/tenant/finance/cash/disbursements',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Disbursements'],
                                ['code' => 'add', 'name' => 'Add Disbursement'],
                                ['code' => 'approve', 'name' => 'Approve'],
                                ['code' => 'reject', 'name' => 'Reject'],
                            ],
                        ],
                        [
                            'code' => 'cash-receipts',
                            'name' => 'Cash Receipts',
                            'type' => 'page',
                            'route' => '/tenant/finance/cash/receipts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Receipts'],
                                ['code' => 'add', 'name' => 'Add Receipt'],
                                ['code' => 'export', 'name' => 'Export History'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.9 Budgeting
                |--------------------------------------------------------------------------
                | Components: Budget creation, Variance analysis, Multi-period, Budget vs actual
                */
                [
                    'code' => 'budgeting',
                    'name' => 'Budgeting',
                    'description' => 'Create budgets, variance analysis, and budget vs actual reporting',
                    'icon' => 'ScaleIcon',
                    'route' => '/tenant/finance/budgets',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'budget-list',
                            'name' => 'Budget List',
                            'type' => 'page',
                            'route' => '/tenant/finance/budgets',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Budgets'],
                                ['code' => 'create', 'name' => 'Create Budget'],
                                ['code' => 'add-lines', 'name' => 'Add Budget Lines'],
                                ['code' => 'edit', 'name' => 'Edit Budget'],
                                ['code' => 'lock', 'name' => 'Lock Budget'],
                                ['code' => 'export', 'name' => 'Export Budget'],
                            ],
                        ],
                        [
                            'code' => 'variance-analysis',
                            'name' => 'Variance Analysis',
                            'type' => 'page',
                            'route' => '/tenant/finance/budgets/variance',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Variance'],
                                ['code' => 'compare', 'name' => 'Compare with Actual'],
                                ['code' => 'export', 'name' => 'Export Analysis'],
                            ],
                        ],
                        [
                            'code' => 'multi-period-budgets',
                            'name' => 'Multi-period Budgets',
                            'type' => 'page',
                            'route' => '/tenant/finance/budgets/multi-period',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Multi-period'],
                                ['code' => 'create', 'name' => 'Create Multi-period Budget'],
                            ],
                        ],
                        [
                            'code' => 'budget-vs-actual',
                            'name' => 'Budget vs Actual Report',
                            'type' => 'page',
                            'route' => '/tenant/finance/budgets/vs-actual',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Report'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.10 Fixed Asset Management
                |--------------------------------------------------------------------------
                | Menus: Assets, Depreciation, Asset Transfer, Disposal, Asset Registers
                */
                [
                    'code' => 'fixed-assets',
                    'name' => 'Fixed Assets',
                    'description' => 'Asset management, depreciation, transfers, and disposal',
                    'icon' => 'BuildingOfficeIcon',
                    'route' => '/tenant/finance/assets',
                    'priority' => 10,

                    'components' => [
                        [
                            'code' => 'asset-list',
                            'name' => 'Fixed Assets',
                            'type' => 'page',
                            'route' => '/tenant/finance/assets',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Assets'],
                                ['code' => 'add', 'name' => 'Add Asset'],
                                ['code' => 'upload-docs', 'name' => 'Upload Documents'],
                                ['code' => 'assign-department', 'name' => 'Assign Department'],
                                ['code' => 'calculate-depreciation', 'name' => 'Calculate Depreciation'],
                                ['code' => 'revaluation', 'name' => 'Revaluation'],
                                ['code' => 'impairment', 'name' => 'Impairment'],
                                ['code' => 'delete', 'name' => 'Delete Asset'],
                            ],
                        ],
                        [
                            'code' => 'depreciation',
                            'name' => 'Depreciation',
                            'type' => 'page',
                            'route' => '/tenant/finance/assets/depreciation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Depreciation'],
                                ['code' => 'run-monthly', 'name' => 'Run Monthly Depreciation'],
                                ['code' => 'preview', 'name' => 'Preview Entries'],
                                ['code' => 'post-to-gl', 'name' => 'Post to GL'],
                            ],
                        ],
                        [
                            'code' => 'asset-transfer',
                            'name' => 'Asset Transfer',
                            'type' => 'page',
                            'route' => '/tenant/finance/assets/transfer',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Transfers'],
                                ['code' => 'transfer', 'name' => 'Transfer Asset'],
                                ['code' => 'approve', 'name' => 'Approve Transfer'],
                            ],
                        ],
                        [
                            'code' => 'asset-disposal',
                            'name' => 'Asset Disposal',
                            'type' => 'page',
                            'route' => '/tenant/finance/assets/disposal',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Disposals'],
                                ['code' => 'dispose', 'name' => 'Dispose Asset'],
                                ['code' => 'scrap-value', 'name' => 'Set Scrap Value'],
                                ['code' => 'post-gain-loss', 'name' => 'Post Gain/Loss'],
                            ],
                        ],
                        [
                            'code' => 'asset-register',
                            'name' => 'Asset Register',
                            'type' => 'page',
                            'route' => '/tenant/finance/assets/register',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Register'],
                                ['code' => 'export', 'name' => 'Export Register'],
                                ['code' => 'print', 'name' => 'Print Register'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.11 Tax Management
                |--------------------------------------------------------------------------
                | Components: Tax rules, Tax groups, Tax returns, Withholding tax, Audit trail
                */
                [
                    'code' => 'tax-management',
                    'name' => 'Tax Management',
                    'description' => 'Tax rules, groups, returns, withholding, and audit trail',
                    'icon' => 'ReceiptPercentIcon',
                    'route' => '/tenant/finance/tax',
                    'priority' => 11,

                    'components' => [
                        [
                            'code' => 'tax-rules',
                            'name' => 'Tax Rules',
                            'type' => 'page',
                            'route' => '/tenant/finance/tax/rules',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tax Rules'],
                                ['code' => 'add', 'name' => 'Add Tax Rule'],
                                ['code' => 'edit', 'name' => 'Edit Tax Rule'],
                                ['code' => 'apply', 'name' => 'Apply to Products/Services'],
                            ],
                        ],
                        [
                            'code' => 'tax-groups',
                            'name' => 'Tax Groups',
                            'type' => 'page',
                            'route' => '/tenant/finance/tax/groups',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tax Groups'],
                                ['code' => 'create', 'name' => 'Create Group'],
                                ['code' => 'edit', 'name' => 'Edit Group'],
                                ['code' => 'delete', 'name' => 'Delete Group'],
                            ],
                        ],
                        [
                            'code' => 'tax-returns',
                            'name' => 'Tax Returns',
                            'type' => 'page',
                            'route' => '/tenant/finance/tax/returns',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tax Returns'],
                                ['code' => 'generate', 'name' => 'Generate Tax Report'],
                                ['code' => 'export', 'name' => 'Export Return'],
                            ],
                        ],
                        [
                            'code' => 'withholding-tax',
                            'name' => 'Withholding Tax',
                            'type' => 'page',
                            'route' => '/tenant/finance/tax/withholding',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Withholding Tax'],
                                ['code' => 'configure', 'name' => 'Configure WHT'],
                                ['code' => 'report', 'name' => 'Generate Report'],
                            ],
                        ],
                        [
                            'code' => 'tax-audit-trail',
                            'name' => 'Tax Audit Trail',
                            'type' => 'page',
                            'route' => '/tenant/finance/tax/audit',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Audit Trail'],
                                ['code' => 'export', 'name' => 'Export Audit Trail'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.12 Financial Statements
                |--------------------------------------------------------------------------
                | Components: Trial Balance, P&L, Balance Sheet, Cash Flow, Equity, Custom
                */
                [
                    'code' => 'financial-statements',
                    'name' => 'Financial Statements',
                    'description' => 'Trial Balance, P&L, Balance Sheet, Cash Flow, and custom reports',
                    'icon' => 'DocumentChartBarIcon',
                    'route' => '/tenant/finance/statements',
                    'priority' => 12,

                    'components' => [
                        [
                            'code' => 'trial-balance',
                            'name' => 'Trial Balance',
                            'type' => 'page',
                            'route' => '/tenant/finance/statements/trial-balance',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Trial Balance'],
                                ['code' => 'generate', 'name' => 'Generate'],
                                ['code' => 'export-excel', 'name' => 'Export Excel'],
                                ['code' => 'export-pdf', 'name' => 'Export PDF'],
                                ['code' => 'print', 'name' => 'Print'],
                            ],
                        ],
                        [
                            'code' => 'profit-loss',
                            'name' => 'Profit & Loss',
                            'type' => 'page',
                            'route' => '/tenant/finance/statements/pnl',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View P&L'],
                                ['code' => 'generate', 'name' => 'Generate'],
                                ['code' => 'export-excel', 'name' => 'Export Excel'],
                                ['code' => 'export-pdf', 'name' => 'Export PDF'],
                                ['code' => 'schedule', 'name' => 'Schedule Report'],
                            ],
                        ],
                        [
                            'code' => 'balance-sheet',
                            'name' => 'Balance Sheet',
                            'type' => 'page',
                            'route' => '/tenant/finance/statements/balance-sheet',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Balance Sheet'],
                                ['code' => 'generate', 'name' => 'Generate'],
                                ['code' => 'export-excel', 'name' => 'Export Excel'],
                                ['code' => 'export-pdf', 'name' => 'Export PDF'],
                            ],
                        ],
                        [
                            'code' => 'cash-flow-statement',
                            'name' => 'Cash Flow Statement',
                            'type' => 'page',
                            'route' => '/tenant/finance/statements/cash-flow',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Cash Flow'],
                                ['code' => 'generate', 'name' => 'Generate'],
                                ['code' => 'export', 'name' => 'Export'],
                            ],
                        ],
                        [
                            'code' => 'equity-statement',
                            'name' => 'Equity Statement',
                            'type' => 'page',
                            'route' => '/tenant/finance/statements/equity',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Equity Statement'],
                                ['code' => 'generate', 'name' => 'Generate'],
                                ['code' => 'export', 'name' => 'Export'],
                            ],
                        ],
                        [
                            'code' => 'custom-reports',
                            'name' => 'Custom Financial Reports',
                            'type' => 'page',
                            'route' => '/tenant/finance/statements/custom',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Custom Reports'],
                                ['code' => 'create', 'name' => 'Create Custom Report'],
                                ['code' => 'edit', 'name' => 'Edit Report'],
                                ['code' => 'delete', 'name' => 'Delete Report'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.13 Audit & Compliance
                |--------------------------------------------------------------------------
                | Components: Audit log, Document attachments, Approval logs, Period/Year closing
                */
                [
                    'code' => 'audit-compliance',
                    'name' => 'Audit & Compliance',
                    'description' => 'Audit logs, approval tracking, and period/year-end closing',
                    'icon' => 'ShieldCheckIcon',
                    'route' => '/tenant/finance/audit',
                    'priority' => 13,

                    'components' => [
                        [
                            'code' => 'audit-log',
                            'name' => 'Audit Log',
                            'type' => 'page',
                            'route' => '/tenant/finance/audit/log',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Audit Log'],
                                ['code' => 'export', 'name' => 'Export Audit Logs'],
                            ],
                        ],
                        [
                            'code' => 'document-attachments',
                            'name' => 'Document Attachments',
                            'type' => 'page',
                            'route' => '/tenant/finance/audit/documents',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Attachments'],
                                ['code' => 'upload', 'name' => 'Upload Document'],
                                ['code' => 'download', 'name' => 'Download Document'],
                            ],
                        ],
                        [
                            'code' => 'approval-logs',
                            'name' => 'Approval Logs',
                            'type' => 'page',
                            'route' => '/tenant/finance/audit/approvals',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Approval Logs'],
                                ['code' => 'export', 'name' => 'Export Logs'],
                            ],
                        ],
                        [
                            'code' => 'period-closing',
                            'name' => 'Period Closing',
                            'type' => 'page',
                            'route' => '/tenant/finance/audit/period-close',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Period Status'],
                                ['code' => 'lock', 'name' => 'Lock Period'],
                                ['code' => 'unlock', 'name' => 'Unlock Period'],
                            ],
                        ],
                        [
                            'code' => 'year-end-closing',
                            'name' => 'Year-end Closing',
                            'type' => 'page',
                            'route' => '/tenant/finance/audit/year-close',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Year-end Status'],
                                ['code' => 'close', 'name' => 'Close Year'],
                                ['code' => 'download', 'name' => 'Download Closing Statements'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 6.14 Finance Settings
                |--------------------------------------------------------------------------
                | Components: Fiscal year, Payment terms, Currency, Exchange rates, COA presets,
                |            Tax config, Journal prefixes, Approval workflows
                */
                [
                    'code' => 'finance-settings',
                    'name' => 'Settings',
                    'description' => 'Configure fiscal year, currency, payment terms, and workflows',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/tenant/finance/settings',
                    'priority' => 14,

                    'components' => [
                        [
                            'code' => 'fiscal-year',
                            'name' => 'Fiscal Year',
                            'type' => 'page',
                            'route' => '/tenant/finance/settings/fiscal-year',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Fiscal Year'],
                                ['code' => 'configure', 'name' => 'Configure Fiscal Year'],
                            ],
                        ],
                        [
                            'code' => 'payment-terms',
                            'name' => 'Payment Terms',
                            'type' => 'page',
                            'route' => '/tenant/finance/settings/payment-terms',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Payment Terms'],
                                ['code' => 'add', 'name' => 'Add Term'],
                                ['code' => 'edit', 'name' => 'Edit Term'],
                                ['code' => 'delete', 'name' => 'Delete Term'],
                            ],
                        ],
                        [
                            'code' => 'currency-settings',
                            'name' => 'Currency',
                            'type' => 'page',
                            'route' => '/tenant/finance/settings/currency',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Currencies'],
                                ['code' => 'add', 'name' => 'Add Currency'],
                                ['code' => 'set-default', 'name' => 'Set Default Currency'],
                            ],
                        ],
                        [
                            'code' => 'exchange-rates',
                            'name' => 'Exchange Rates',
                            'type' => 'page',
                            'route' => '/tenant/finance/settings/exchange-rates',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Exchange Rates'],
                                ['code' => 'update', 'name' => 'Update Rates'],
                                ['code' => 'import', 'name' => 'Import Rates'],
                            ],
                        ],
                        [
                            'code' => 'coa-presets',
                            'name' => 'COA Presets',
                            'type' => 'page',
                            'route' => '/tenant/finance/settings/coa-presets',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Presets'],
                                ['code' => 'apply', 'name' => 'Apply Preset'],
                                ['code' => 'create', 'name' => 'Create Preset'],
                            ],
                        ],
                        [
                            'code' => 'tax-configuration',
                            'name' => 'Tax Configuration',
                            'type' => 'page',
                            'route' => '/tenant/finance/settings/tax',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tax Config'],
                                ['code' => 'configure', 'name' => 'Configure Tax'],
                            ],
                        ],
                        [
                            'code' => 'journal-prefixes',
                            'name' => 'Journal Prefixes',
                            'type' => 'page',
                            'route' => '/tenant/finance/settings/journal-prefixes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Prefixes'],
                                ['code' => 'edit', 'name' => 'Edit Prefix'],
                            ],
                        ],
                        [
                            'code' => 'approval-workflows',
                            'name' => 'Approval Workflows',
                            'type' => 'page',
                            'route' => '/tenant/finance/settings/workflows',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Workflows'],
                                ['code' => 'add', 'name' => 'Add Workflow'],
                                ['code' => 'edit', 'name' => 'Edit Workflow'],
                                ['code' => 'lock', 'name' => 'Lock Configuration'],
                                ['code' => 'restore', 'name' => 'Restore Default'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | Inventory Management Module
        |--------------------------------------------------------------------------
        | Section 7 - Inventory Management System
        | 15 Submodules: Dashboard, Items/Products, Categories, Warehouses,
        |                Stock In/Out, Stock Transfers, Stock Adjustments, Batches/Lots/Serials,
        |                Barcodes, Units of Measure, Vendors, Price Lists, Reorder Rules,
        |                Stock Reports, Settings
        */
        [
            'code' => 'inventory',
            'name' => 'Inventory Management',
            'description' => 'Complete inventory control with warehouses, stock movements, batches, barcodes, and reporting',
            'icon' => 'ArchiveBoxIcon',
            'route_prefix' => '/tenant/inventory',
            'category' => 'supply_chain',
            'priority' => 50,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'business',
            'license_type' => 'standard',
            'dependencies' => ['core'],
            'release_date' => '2024-01-01',

            'submodules' => [
                /*
                |--------------------------------------------------------------------------
                | 7.1 Inventory Dashboard
                |--------------------------------------------------------------------------
                | Components: Stock valuation, Low-stock items, Overstocked items, Fast/slow movers,
                |            Stock by warehouse, Incoming/outgoing, Recent transactions
                */
                [
                    'code' => 'dashboard',
                    'name' => 'Dashboard',
                    'description' => 'Inventory overview with stock valuation, alerts, and movement trends',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/inventory/dashboard',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'inventory-dashboard',
                            'name' => 'Inventory Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/inventory/dashboard',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dashboard'],
                                ['code' => 'filter', 'name' => 'Filter Data'],
                                ['code' => 'export', 'name' => 'Export Report'],
                                ['code' => 'print', 'name' => 'Print Report'],
                                ['code' => 'drill-down', 'name' => 'Drill Down'],
                            ],
                        ],
                        [
                            'code' => 'stock-valuation-widget',
                            'name' => 'Stock Valuation Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stock Valuation'],
                            ],
                        ],
                        [
                            'code' => 'low-stock-widget',
                            'name' => 'Low Stock Alert Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Low Stock Items'],
                            ],
                        ],
                        [
                            'code' => 'movement-trend-widget',
                            'name' => 'Stock Movement Trend Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Movement Trends'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.2 Items / Products
                |--------------------------------------------------------------------------
                | Components: Item list, Item detail, Variants, Attributes, Images,
                |            Purchase info, Sales info, Stock levels by warehouse
                */
                [
                    'code' => 'items',
                    'name' => 'Items / Products',
                    'description' => 'Manage inventory items with variants, attributes, and stock levels',
                    'icon' => 'CubeIcon',
                    'route' => '/tenant/inventory/items',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'item-list',
                            'name' => 'Item List',
                            'type' => 'page',
                            'route' => '/tenant/inventory/items',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Items'],
                                ['code' => 'create', 'name' => 'Create Item'],
                                ['code' => 'edit', 'name' => 'Edit Item'],
                                ['code' => 'archive', 'name' => 'Archive Item'],
                                ['code' => 'clone', 'name' => 'Clone Item'],
                                ['code' => 'delete', 'name' => 'Delete Item'],
                            ],
                        ],
                        [
                            'code' => 'item-detail',
                            'name' => 'Item Detail',
                            'type' => 'page',
                            'route' => '/tenant/inventory/items/{id}',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Item Details'],
                                ['code' => 'edit', 'name' => 'Edit Details'],
                            ],
                        ],
                        [
                            'code' => 'item-variants',
                            'name' => 'Item Variants',
                            'type' => 'section',
                            'route' => '/tenant/inventory/items/{id}/variants',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Variants'],
                                ['code' => 'add', 'name' => 'Add Variant'],
                                ['code' => 'edit', 'name' => 'Edit Variant'],
                                ['code' => 'delete', 'name' => 'Delete Variant'],
                            ],
                        ],
                        [
                            'code' => 'item-attributes',
                            'name' => 'Item Attributes',
                            'type' => 'section',
                            'route' => '/tenant/inventory/items/{id}/attributes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Attributes'],
                                ['code' => 'add', 'name' => 'Add Attribute'],
                                ['code' => 'edit', 'name' => 'Edit Attribute'],
                                ['code' => 'delete', 'name' => 'Delete Attribute'],
                            ],
                        ],
                        [
                            'code' => 'item-images',
                            'name' => 'Images & Attachments',
                            'type' => 'section',
                            'route' => '/tenant/inventory/items/{id}/images',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Images'],
                                ['code' => 'upload', 'name' => 'Upload Images'],
                                ['code' => 'delete', 'name' => 'Delete Image'],
                            ],
                        ],
                        [
                            'code' => 'item-reorder',
                            'name' => 'Reorder Level',
                            'type' => 'section',
                            'route' => '/tenant/inventory/items/{id}/reorder',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Reorder Level'],
                                ['code' => 'set', 'name' => 'Set Reorder Level'],
                            ],
                        ],
                        [
                            'code' => 'stock-by-warehouse',
                            'name' => 'Stock by Warehouse',
                            'type' => 'section',
                            'route' => '/tenant/inventory/items/{id}/stock',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stock Levels'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.3 Item Categories
                |--------------------------------------------------------------------------
                | Components: Category list, Parent-child hierarchy
                */
                [
                    'code' => 'categories',
                    'name' => 'Item Categories',
                    'description' => 'Organize items with hierarchical categories',
                    'icon' => 'FolderIcon',
                    'route' => '/tenant/inventory/categories',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'category-list',
                            'name' => 'Category List',
                            'type' => 'page',
                            'route' => '/tenant/inventory/categories',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Categories'],
                                ['code' => 'add', 'name' => 'Add Category'],
                                ['code' => 'edit', 'name' => 'Edit Category'],
                                ['code' => 'merge', 'name' => 'Merge Categories'],
                                ['code' => 'reorder', 'name' => 'Reorder Categories'],
                                ['code' => 'delete', 'name' => 'Delete Category'],
                            ],
                        ],
                        [
                            'code' => 'category-hierarchy',
                            'name' => 'Category Hierarchy',
                            'type' => 'section',
                            'route' => '/tenant/inventory/categories/hierarchy',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Hierarchy'],
                                ['code' => 'manage', 'name' => 'Manage Parent-Child'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.4 Warehouses / Locations
                |--------------------------------------------------------------------------
                | Components: Warehouse list, Bin locations, Managers, Stock capacity
                */
                [
                    'code' => 'warehouses',
                    'name' => 'Warehouses / Locations',
                    'description' => 'Manage warehouses, bin locations, and capacity',
                    'icon' => 'BuildingStorefrontIcon',
                    'route' => '/tenant/inventory/warehouses',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'warehouse-list',
                            'name' => 'Warehouse List',
                            'type' => 'page',
                            'route' => '/tenant/inventory/warehouses',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Warehouses'],
                                ['code' => 'create', 'name' => 'Create Warehouse'],
                                ['code' => 'edit', 'name' => 'Edit Warehouse'],
                                ['code' => 'archive', 'name' => 'Archive Warehouse'],
                                ['code' => 'delete', 'name' => 'Delete Warehouse'],
                            ],
                        ],
                        [
                            'code' => 'bin-locations',
                            'name' => 'Bin Locations / Shelves',
                            'type' => 'page',
                            'route' => '/tenant/inventory/warehouses/{id}/bins',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Bin Locations'],
                                ['code' => 'add', 'name' => 'Add Bin/Shelf'],
                                ['code' => 'edit', 'name' => 'Edit Bin/Shelf'],
                                ['code' => 'delete', 'name' => 'Delete Bin/Shelf'],
                            ],
                        ],
                        [
                            'code' => 'warehouse-managers',
                            'name' => 'Warehouse Managers',
                            'type' => 'section',
                            'route' => '/tenant/inventory/warehouses/{id}/managers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Managers'],
                                ['code' => 'assign', 'name' => 'Assign Manager'],
                                ['code' => 'remove', 'name' => 'Remove Manager'],
                            ],
                        ],
                        [
                            'code' => 'stock-capacity',
                            'name' => 'Stock Capacity & Map',
                            'type' => 'section',
                            'route' => '/tenant/inventory/warehouses/{id}/capacity',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Capacity'],
                                ['code' => 'configure', 'name' => 'Configure Capacity'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.5 Stock In / Stock Out
                |--------------------------------------------------------------------------
                | Stock In: GRN, Supplier reference, Item list, Quantity, Unit cost
                | Stock Out: Delivery order, Issue to production/department, Dispatch
                */
                [
                    'code' => 'stock-in-out',
                    'name' => 'Stock In / Stock Out',
                    'description' => 'Manage goods receipts, deliveries, and stock movements',
                    'icon' => 'ArrowsRightLeftIcon',
                    'route' => '/tenant/inventory/stock',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'grn-list',
                            'name' => 'Goods Receipt Notes (GRN)',
                            'type' => 'page',
                            'route' => '/tenant/inventory/stock/grn',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View GRNs'],
                                ['code' => 'create', 'name' => 'Create GRN'],
                                ['code' => 'approve', 'name' => 'Approve GRN'],
                                ['code' => 'reject', 'name' => 'Reject GRN'],
                                ['code' => 'print', 'name' => 'Print GRN'],
                                ['code' => 'delete', 'name' => 'Delete GRN'],
                            ],
                        ],
                        [
                            'code' => 'stock-out-list',
                            'name' => 'Stock Out / Deliveries',
                            'type' => 'page',
                            'route' => '/tenant/inventory/stock/out',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stock Out'],
                                ['code' => 'create', 'name' => 'Create Stock Out'],
                                ['code' => 'approve', 'name' => 'Approve Stock Out'],
                                ['code' => 'dispatch', 'name' => 'Mark Dispatched'],
                                ['code' => 'cancel', 'name' => 'Cancel Stock Out'],
                                ['code' => 'delete', 'name' => 'Delete Stock Out'],
                            ],
                        ],
                        [
                            'code' => 'delivery-orders',
                            'name' => 'Delivery Orders',
                            'type' => 'page',
                            'route' => '/tenant/inventory/stock/delivery-orders',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Delivery Orders'],
                                ['code' => 'create', 'name' => 'Create Delivery Order'],
                                ['code' => 'dispatch', 'name' => 'Dispatch'],
                                ['code' => 'cancel', 'name' => 'Cancel Order'],
                            ],
                        ],
                        [
                            'code' => 'issue-to-production',
                            'name' => 'Issue to Production',
                            'type' => 'page',
                            'route' => '/tenant/inventory/stock/production-issue',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Production Issues'],
                                ['code' => 'create', 'name' => 'Issue to Production'],
                                ['code' => 'approve', 'name' => 'Approve Issue'],
                            ],
                        ],
                        [
                            'code' => 'issue-to-department',
                            'name' => 'Issue to Department',
                            'type' => 'page',
                            'route' => '/tenant/inventory/stock/department-issue',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Department Issues'],
                                ['code' => 'create', 'name' => 'Issue to Department'],
                                ['code' => 'approve', 'name' => 'Approve Issue'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.6 Stock Transfers
                |--------------------------------------------------------------------------
                | Components: Transfer list, Source/destination, Pick list, Dispatch/receive
                */
                [
                    'code' => 'stock-transfers',
                    'name' => 'Stock Transfers',
                    'description' => 'Transfer stock between warehouses with pick lists',
                    'icon' => 'ArrowPathIcon',
                    'route' => '/tenant/inventory/transfers',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'transfer-list',
                            'name' => 'Transfer List',
                            'type' => 'page',
                            'route' => '/tenant/inventory/transfers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Transfers'],
                                ['code' => 'create', 'name' => 'Create Transfer'],
                                ['code' => 'approve', 'name' => 'Approve Transfer'],
                                ['code' => 'pick-items', 'name' => 'Pick Items'],
                                ['code' => 'dispatch', 'name' => 'Dispatch Transfer'],
                                ['code' => 'receive', 'name' => 'Receive Transfer'],
                                ['code' => 'cancel', 'name' => 'Cancel Transfer'],
                                ['code' => 'delete', 'name' => 'Delete Transfer'],
                            ],
                        ],
                        [
                            'code' => 'pick-list',
                            'name' => 'Pick List',
                            'type' => 'page',
                            'route' => '/tenant/inventory/transfers/{id}/pick-list',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Pick List'],
                                ['code' => 'print', 'name' => 'Print Pick List'],
                                ['code' => 'mark-picked', 'name' => 'Mark Items Picked'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.7 Stock Adjustments
                |--------------------------------------------------------------------------
                | Components: Adjustment list, Reasons, Approval workflow, Audit log
                */
                [
                    'code' => 'stock-adjustments',
                    'name' => 'Stock Adjustments',
                    'description' => 'Adjust stock for damage, loss, audit corrections, and excess',
                    'icon' => 'AdjustmentsHorizontalIcon',
                    'route' => '/tenant/inventory/adjustments',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'adjustment-list',
                            'name' => 'Adjustment List',
                            'type' => 'page',
                            'route' => '/tenant/inventory/adjustments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Adjustments'],
                                ['code' => 'create', 'name' => 'Create Adjustment'],
                                ['code' => 'add-items', 'name' => 'Add Items'],
                                ['code' => 'approve', 'name' => 'Approve Adjustment'],
                                ['code' => 'reject', 'name' => 'Reject Adjustment'],
                                ['code' => 'export', 'name' => 'Export Adjustments'],
                                ['code' => 'delete', 'name' => 'Delete Adjustment'],
                            ],
                        ],
                        [
                            'code' => 'adjustment-reasons',
                            'name' => 'Adjustment Reasons',
                            'type' => 'page',
                            'route' => '/tenant/inventory/adjustments/reasons',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Reasons'],
                                ['code' => 'add', 'name' => 'Add Reason'],
                                ['code' => 'edit', 'name' => 'Edit Reason'],
                                ['code' => 'delete', 'name' => 'Delete Reason'],
                            ],
                        ],
                        [
                            'code' => 'adjustment-audit-log',
                            'name' => 'Adjustment Audit Log',
                            'type' => 'page',
                            'route' => '/tenant/inventory/adjustments/audit',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Audit Log'],
                                ['code' => 'export', 'name' => 'Export Audit Log'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.8 Batches / Lots / Serial Numbers
                |--------------------------------------------------------------------------
                | Batches: Expiry date, MFG date, Supplier batch, QC status
                | Serials: Per-unit tracking for electronics, tools, equipment
                */
                [
                    'code' => 'batches-serials',
                    'name' => 'Batches / Lots / Serials',
                    'description' => 'Track batch/lot numbers, expiry dates, and serial numbers',
                    'icon' => 'QueueListIcon',
                    'route' => '/tenant/inventory/batches',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'batch-list',
                            'name' => 'Batches / Lots',
                            'type' => 'page',
                            'route' => '/tenant/inventory/batches',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Batches'],
                                ['code' => 'create', 'name' => 'Create Batch'],
                                ['code' => 'assign-item', 'name' => 'Assign to Item'],
                                ['code' => 'mark-expired', 'name' => 'Mark Expired'],
                                ['code' => 'qc-approve', 'name' => 'QC Approve'],
                                ['code' => 'qc-reject', 'name' => 'QC Reject'],
                                ['code' => 'delete', 'name' => 'Delete Batch'],
                            ],
                        ],
                        [
                            'code' => 'serial-list',
                            'name' => 'Serial Numbers',
                            'type' => 'page',
                            'route' => '/tenant/inventory/serials',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Serials'],
                                ['code' => 'add', 'name' => 'Add Serials'],
                                ['code' => 'assign-warehouse', 'name' => 'Assign to Warehouse'],
                                ['code' => 'transfer', 'name' => 'Transfer Serial'],
                                ['code' => 'mark-faulty', 'name' => 'Mark Faulty'],
                                ['code' => 'view-history', 'name' => 'View History'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.9 Barcodes
                |--------------------------------------------------------------------------
                | Components: Barcode generator, QR code support, Label printer, Multiple formats
                */
                [
                    'code' => 'barcodes',
                    'name' => 'Barcodes',
                    'description' => 'Generate barcodes and QR codes with label printing',
                    'icon' => 'QrCodeIcon',
                    'route' => '/tenant/inventory/barcodes',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'barcode-generator',
                            'name' => 'Barcode Generator',
                            'type' => 'page',
                            'route' => '/tenant/inventory/barcodes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Barcodes'],
                                ['code' => 'generate', 'name' => 'Generate Barcode'],
                                ['code' => 'print', 'name' => 'Print Barcode'],
                                ['code' => 'export', 'name' => 'Export PDF'],
                                ['code' => 'assign-item', 'name' => 'Assign to Item'],
                                ['code' => 'delete', 'name' => 'Delete Barcode'],
                            ],
                        ],
                        [
                            'code' => 'qr-code-generator',
                            'name' => 'QR Code Generator',
                            'type' => 'page',
                            'route' => '/tenant/inventory/barcodes/qr',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View QR Codes'],
                                ['code' => 'generate', 'name' => 'Generate QR Code'],
                                ['code' => 'print', 'name' => 'Print QR Code'],
                                ['code' => 'export', 'name' => 'Export PDF'],
                            ],
                        ],
                        [
                            'code' => 'label-printer',
                            'name' => 'Label Printer Settings',
                            'type' => 'page',
                            'route' => '/tenant/inventory/barcodes/printer',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Settings'],
                                ['code' => 'configure', 'name' => 'Configure Printer'],
                                ['code' => 'test', 'name' => 'Test Print'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.10 Units of Measure (UoM)
                |--------------------------------------------------------------------------
                | Components: UoM list, UoM conversions (box → piece → carton)
                */
                [
                    'code' => 'units-of-measure',
                    'name' => 'Units of Measure',
                    'description' => 'Define units of measure and conversion rules',
                    'icon' => 'ScaleIcon',
                    'route' => '/tenant/inventory/uom',
                    'priority' => 10,

                    'components' => [
                        [
                            'code' => 'uom-list',
                            'name' => 'UoM List',
                            'type' => 'page',
                            'route' => '/tenant/inventory/uom',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View UoMs'],
                                ['code' => 'add', 'name' => 'Add UoM'],
                                ['code' => 'edit', 'name' => 'Edit UoM'],
                                ['code' => 'delete', 'name' => 'Delete UoM'],
                            ],
                        ],
                        [
                            'code' => 'uom-conversions',
                            'name' => 'UoM Conversions',
                            'type' => 'page',
                            'route' => '/tenant/inventory/uom/conversions',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Conversions'],
                                ['code' => 'add', 'name' => 'Add Conversion Rule'],
                                ['code' => 'edit', 'name' => 'Edit Conversion'],
                                ['code' => 'delete', 'name' => 'Delete Conversion'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.11 Vendors / Supplier Directory
                |--------------------------------------------------------------------------
                | Components: Supplier details, Price lists, Rating, Purchase history
                */
                [
                    'code' => 'vendors',
                    'name' => 'Vendors / Suppliers',
                    'description' => 'Manage vendor directory with ratings and purchase history',
                    'icon' => 'TruckIcon',
                    'route' => '/tenant/inventory/vendors',
                    'priority' => 11,

                    'components' => [
                        [
                            'code' => 'vendor-list',
                            'name' => 'Vendor List',
                            'type' => 'page',
                            'route' => '/tenant/inventory/vendors',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Vendors'],
                                ['code' => 'add', 'name' => 'Add Vendor'],
                                ['code' => 'edit', 'name' => 'Edit Vendor'],
                                ['code' => 'blacklist', 'name' => 'Blacklist Vendor'],
                                ['code' => 'rate', 'name' => 'Rate Vendor'],
                                ['code' => 'delete', 'name' => 'Delete Vendor'],
                            ],
                        ],
                        [
                            'code' => 'vendor-price-lists',
                            'name' => 'Vendor Price Lists',
                            'type' => 'section',
                            'route' => '/tenant/inventory/vendors/{id}/prices',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Price Lists'],
                                ['code' => 'import', 'name' => 'Import Prices'],
                            ],
                        ],
                        [
                            'code' => 'vendor-purchase-history',
                            'name' => 'Vendor Purchase History',
                            'type' => 'section',
                            'route' => '/tenant/inventory/vendors/{id}/history',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Purchase History'],
                                ['code' => 'export', 'name' => 'Export History'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.12 Price Lists
                |--------------------------------------------------------------------------
                | Components: Purchase/Sales price lists, Customer/Supplier pricing, Discounts
                */
                [
                    'code' => 'price-lists',
                    'name' => 'Price Lists',
                    'description' => 'Manage purchase and sales price lists with discounts',
                    'icon' => 'CurrencyDollarIcon',
                    'route' => '/tenant/inventory/price-lists',
                    'priority' => 12,

                    'components' => [
                        [
                            'code' => 'price-list-list',
                            'name' => 'Price List Management',
                            'type' => 'page',
                            'route' => '/tenant/inventory/price-lists',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Price Lists'],
                                ['code' => 'add', 'name' => 'Add Price List'],
                                ['code' => 'edit', 'name' => 'Edit Price List'],
                                ['code' => 'assign-items', 'name' => 'Assign Items'],
                                ['code' => 'set-date-range', 'name' => 'Set Date Range'],
                                ['code' => 'publish', 'name' => 'Publish Price List'],
                                ['code' => 'delete', 'name' => 'Delete Price List'],
                            ],
                        ],
                        [
                            'code' => 'purchase-price-list',
                            'name' => 'Purchase Price Lists',
                            'type' => 'page',
                            'route' => '/tenant/inventory/price-lists/purchase',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Purchase Prices'],
                                ['code' => 'edit', 'name' => 'Edit Purchase Prices'],
                            ],
                        ],
                        [
                            'code' => 'sales-price-list',
                            'name' => 'Sales Price Lists',
                            'type' => 'page',
                            'route' => '/tenant/inventory/price-lists/sales',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sales Prices'],
                                ['code' => 'edit', 'name' => 'Edit Sales Prices'],
                            ],
                        ],
                        [
                            'code' => 'discount-levels',
                            'name' => 'Discount Levels',
                            'type' => 'page',
                            'route' => '/tenant/inventory/price-lists/discounts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Discounts'],
                                ['code' => 'add', 'name' => 'Add Discount Level'],
                                ['code' => 'edit', 'name' => 'Edit Discount'],
                                ['code' => 'delete', 'name' => 'Delete Discount'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.13 Reorder Rules
                |--------------------------------------------------------------------------
                | Components: Reorder point, Preferred supplier, MOQ, Auto-purchase suggestion
                */
                [
                    'code' => 'reorder-rules',
                    'name' => 'Reorder Rules',
                    'description' => 'Configure reorder points, MOQ, and auto-purchase suggestions',
                    'icon' => 'ArrowPathIcon',
                    'route' => '/tenant/inventory/reorder-rules',
                    'priority' => 13,

                    'components' => [
                        [
                            'code' => 'reorder-rules-list',
                            'name' => 'Reorder Rules List',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reorder-rules',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Reorder Rules'],
                                ['code' => 'set-level', 'name' => 'Set Reorder Level'],
                                ['code' => 'generate-recommendations', 'name' => 'Generate Purchase Recommendations'],
                                ['code' => 'export', 'name' => 'Export List'],
                            ],
                        ],
                        [
                            'code' => 'purchase-recommendations',
                            'name' => 'Purchase Recommendations',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reorder-rules/recommendations',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Recommendations'],
                                ['code' => 'create-po', 'name' => 'Create Purchase Order'],
                                ['code' => 'dismiss', 'name' => 'Dismiss Recommendation'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.14 Stock Reports
                |--------------------------------------------------------------------------
                | Components: Stock ledger, Item-wise/Warehouse-wise, Valuation, Fast/Slow/Dead,
                |            Expiry, Serial tracking, Cycle count, FIFO/LIFO
                */
                [
                    'code' => 'stock-reports',
                    'name' => 'Stock Reports',
                    'description' => 'Comprehensive stock reporting with valuation and analytics',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/inventory/reports',
                    'priority' => 14,

                    'components' => [
                        [
                            'code' => 'stock-ledger',
                            'name' => 'Stock Ledger',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/ledger',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stock Ledger'],
                                ['code' => 'export-excel', 'name' => 'Export Excel'],
                                ['code' => 'export-pdf', 'name' => 'Export PDF'],
                                ['code' => 'print', 'name' => 'Print Report'],
                            ],
                        ],
                        [
                            'code' => 'item-wise-stock',
                            'name' => 'Item-wise Stock Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/item-wise',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Item-wise Stock'],
                                ['code' => 'export', 'name' => 'Export Report'],
                                ['code' => 'print', 'name' => 'Print Report'],
                            ],
                        ],
                        [
                            'code' => 'warehouse-wise-stock',
                            'name' => 'Warehouse-wise Stock Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/warehouse-wise',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Warehouse-wise Stock'],
                                ['code' => 'export', 'name' => 'Export Report'],
                                ['code' => 'print', 'name' => 'Print Report'],
                            ],
                        ],
                        [
                            'code' => 'stock-valuation-report',
                            'name' => 'Stock Valuation Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/valuation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Valuation Report'],
                                ['code' => 'export', 'name' => 'Export Report'],
                                ['code' => 'print', 'name' => 'Print Report'],
                            ],
                        ],
                        [
                            'code' => 'fast-moving-report',
                            'name' => 'Fast-Moving Items Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/fast-moving',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Fast Movers'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'slow-moving-report',
                            'name' => 'Slow-Moving Items Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/slow-moving',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Slow Movers'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'dead-stock-report',
                            'name' => 'Dead Stock Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/dead-stock',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dead Stock'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'expiry-report',
                            'name' => 'Expiry Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/expiry',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Expiry Report'],
                                ['code' => 'export', 'name' => 'Export Report'],
                                ['code' => 'schedule', 'name' => 'Schedule Report'],
                            ],
                        ],
                        [
                            'code' => 'serial-tracking-report',
                            'name' => 'Serial Tracking Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/serial-tracking',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Serial Report'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'cycle-count-report',
                            'name' => 'Cycle Count Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/cycle-count',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Cycle Count'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'fifo-lifo-valuation',
                            'name' => 'FIFO/LIFO Valuation Report',
                            'type' => 'page',
                            'route' => '/tenant/inventory/reports/fifo-lifo',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View FIFO/LIFO Report'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 7.15 Inventory Settings
                |--------------------------------------------------------------------------
                | Components: Category settings, Warehouse settings, Valuation method,
                |            Stock aging, Default UoM, Auto codes, Barcode settings,
                |            Adjustment reasons, Integration settings
                */
                [
                    'code' => 'inventory-settings',
                    'name' => 'Settings',
                    'description' => 'Configure inventory valuation, aging, UoM, barcodes, and integrations',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/tenant/inventory/settings',
                    'priority' => 15,

                    'components' => [
                        [
                            'code' => 'category-settings',
                            'name' => 'Category Settings',
                            'type' => 'page',
                            'route' => '/tenant/inventory/settings/categories',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Category Settings'],
                                ['code' => 'configure', 'name' => 'Configure Categories'],
                                ['code' => 'save', 'name' => 'Save Settings'],
                            ],
                        ],
                        [
                            'code' => 'warehouse-settings',
                            'name' => 'Warehouse Settings',
                            'type' => 'page',
                            'route' => '/tenant/inventory/settings/warehouses',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Warehouse Settings'],
                                ['code' => 'configure', 'name' => 'Configure Warehouses'],
                                ['code' => 'save', 'name' => 'Save Settings'],
                            ],
                        ],
                        [
                            'code' => 'valuation-method',
                            'name' => 'Valuation Method',
                            'type' => 'page',
                            'route' => '/tenant/inventory/settings/valuation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Valuation Method'],
                                ['code' => 'change', 'name' => 'Change Valuation Method'],
                                ['code' => 'save', 'name' => 'Save Settings'],
                            ],
                        ],
                        [
                            'code' => 'stock-aging',
                            'name' => 'Stock Aging Thresholds',
                            'type' => 'page',
                            'route' => '/tenant/inventory/settings/aging',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Aging Thresholds'],
                                ['code' => 'configure', 'name' => 'Configure Thresholds'],
                                ['code' => 'save', 'name' => 'Save Settings'],
                            ],
                        ],
                        [
                            'code' => 'default-uom',
                            'name' => 'Default UoM',
                            'type' => 'page',
                            'route' => '/tenant/inventory/settings/default-uom',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Default UoM'],
                                ['code' => 'set', 'name' => 'Set Default UoM'],
                            ],
                        ],
                        [
                            'code' => 'auto-generated-codes',
                            'name' => 'Auto-Generated Codes',
                            'type' => 'page',
                            'route' => '/tenant/inventory/settings/auto-codes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Auto Codes'],
                                ['code' => 'configure', 'name' => 'Configure Auto Codes'],
                                ['code' => 'save', 'name' => 'Save Settings'],
                            ],
                        ],
                        [
                            'code' => 'barcode-settings',
                            'name' => 'Barcode Settings',
                            'type' => 'page',
                            'route' => '/tenant/inventory/settings/barcodes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Barcode Settings'],
                                ['code' => 'configure', 'name' => 'Configure Barcodes'],
                                ['code' => 'save', 'name' => 'Save Settings'],
                            ],
                        ],
                        [
                            'code' => 'adjustment-reason-settings',
                            'name' => 'Adjustment Reasons',
                            'type' => 'page',
                            'route' => '/tenant/inventory/settings/adjustment-reasons',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Adjustment Reasons'],
                                ['code' => 'add', 'name' => 'Add Reason'],
                                ['code' => 'edit', 'name' => 'Edit Reason'],
                                ['code' => 'delete', 'name' => 'Delete Reason'],
                            ],
                        ],
                        [
                            'code' => 'integration-settings',
                            'name' => 'Integration Settings',
                            'type' => 'page',
                            'route' => '/tenant/inventory/settings/integrations',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Integrations'],
                                ['code' => 'configure', 'name' => 'Configure Integration'],
                                ['code' => 'test', 'name' => 'Test Integration'],
                                ['code' => 'reset', 'name' => 'Reset Integration'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | E-commerce Module
        |--------------------------------------------------------------------------
        | Section 8 - E-commerce
        | 15 Submodules: Dashboard, Catalog, Orders, Customers, Cart & Checkout,
        |                Promotions & Discounts, Pricing & Price Lists, Shipping & Fulfillment,
        |                Payments, Inventory Integration, Returns & RMA, Reviews & Ratings,
        |                Storefront/CMS, Analytics & Reports, Settings & Integrations
        */
        [
            'code' => 'ecommerce',
            'name' => 'E-commerce',
            'description' => 'Complete e-commerce platform with catalog, orders, checkout, shipping, and storefront management',
            'icon' => 'ShoppingCartIcon',
            'route_prefix' => '/tenant/ecommerce',
            'category' => 'retail_sales',
            'priority' => 60,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'business',
            'license_type' => 'standard',
            'dependencies' => ['core', 'inventory'],
            'release_date' => '2024-01-01',

            'submodules' => [
                /*
                |--------------------------------------------------------------------------
                | 8.1 E-commerce Dashboard
                |--------------------------------------------------------------------------
                | Components: Sales summary, Orders by status, Top products, Conversion funnel,
                |            Low-stock alerts, Recent activity
                */
                [
                    'code' => 'dashboard',
                    'name' => 'Dashboard',
                    'description' => 'E-commerce overview with sales, orders, and conversion metrics',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/ecommerce/dashboard',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'ecommerce-dashboard',
                            'name' => 'E-commerce Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/dashboard',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dashboard'],
                                ['code' => 'export', 'name' => 'Export Dashboard Data'],
                            ],
                        ],
                        [
                            'code' => 'sales-summary-widget',
                            'name' => 'Sales Summary Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sales Summary'],
                            ],
                        ],
                        [
                            'code' => 'orders-status-widget',
                            'name' => 'Orders by Status Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Orders by Status'],
                            ],
                        ],
                        [
                            'code' => 'top-products-widget',
                            'name' => 'Top Products Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Top Products'],
                            ],
                        ],
                        [
                            'code' => 'conversion-funnel-widget',
                            'name' => 'Conversion Funnel Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Conversion Funnel'],
                            ],
                        ],
                        [
                            'code' => 'low-stock-alerts-widget',
                            'name' => 'Low Stock Alerts Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Low Stock Alerts'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.2 Catalog
                |--------------------------------------------------------------------------
                | Components: Products (SKUs), Product Variants, Collections/Categories,
                |            Attributes, Product Media, Bundles/Kits, Digital products, Templates
                */
                [
                    'code' => 'catalog',
                    'name' => 'Catalog',
                    'description' => 'Product catalog management with variants, categories, and media',
                    'icon' => 'CubeIcon',
                    'route' => '/tenant/ecommerce/catalog',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'product-list',
                            'name' => 'Products (SKUs)',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/catalog/products',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Products'],
                                ['code' => 'create', 'name' => 'Create Product'],
                                ['code' => 'update', 'name' => 'Update Product'],
                                ['code' => 'delete', 'name' => 'Delete Product'],
                                ['code' => 'clone', 'name' => 'Clone Product'],
                                ['code' => 'import', 'name' => 'Import Products'],
                                ['code' => 'export', 'name' => 'Export Products'],
                            ],
                        ],
                        [
                            'code' => 'product-variants',
                            'name' => 'Product Variants',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/catalog/products/{id}/variants',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Variants'],
                                ['code' => 'manage', 'name' => 'Manage Variants'],
                            ],
                        ],
                        [
                            'code' => 'collections',
                            'name' => 'Collections / Categories',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/catalog/collections',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Collections'],
                                ['code' => 'create', 'name' => 'Create Collection'],
                                ['code' => 'update', 'name' => 'Update Collection'],
                                ['code' => 'delete', 'name' => 'Delete Collection'],
                            ],
                        ],
                        [
                            'code' => 'attributes',
                            'name' => 'Attributes & Attribute Sets',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/catalog/attributes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Attributes'],
                                ['code' => 'manage', 'name' => 'Manage Attributes'],
                            ],
                        ],
                        [
                            'code' => 'product-media',
                            'name' => 'Product Media',
                            'type' => 'section',
                            'route' => '/tenant/ecommerce/catalog/products/{id}/media',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Media'],
                                ['code' => 'upload', 'name' => 'Upload Media'],
                                ['code' => 'delete', 'name' => 'Delete Media'],
                            ],
                        ],
                        [
                            'code' => 'product-bundles',
                            'name' => 'Product Bundles / Kits',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/catalog/bundles',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Bundles'],
                                ['code' => 'create', 'name' => 'Create Bundle'],
                                ['code' => 'update', 'name' => 'Update Bundle'],
                                ['code' => 'delete', 'name' => 'Delete Bundle'],
                            ],
                        ],
                        [
                            'code' => 'digital-products',
                            'name' => 'Digital Products',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/catalog/digital',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Digital Products'],
                                ['code' => 'create', 'name' => 'Create Digital Product'],
                                ['code' => 'manage-files', 'name' => 'Manage Download Files'],
                            ],
                        ],
                        [
                            'code' => 'product-templates',
                            'name' => 'Product Templates / Import',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/catalog/templates',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Templates'],
                                ['code' => 'create', 'name' => 'Create Template'],
                                ['code' => 'import', 'name' => 'Import from Template'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.3 Orders
                |--------------------------------------------------------------------------
                | Components: Order List, Order Detail, Order Edit/Split/Merge, Draft/Quote,
                |            Fulfillment/Picking/Packing, Order Hold/Release, Manual entry
                */
                [
                    'code' => 'orders',
                    'name' => 'Orders',
                    'description' => 'Order management with fulfillment, picking, packing, and shipping',
                    'icon' => 'ClipboardDocumentListIcon',
                    'route' => '/tenant/ecommerce/orders',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'order-list',
                            'name' => 'Order List',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/orders',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Orders'],
                                ['code' => 'create', 'name' => 'Create Order'],
                                ['code' => 'update', 'name' => 'Update Order'],
                                ['code' => 'cancel', 'name' => 'Cancel Order'],
                                ['code' => 'delete', 'name' => 'Delete Order'],
                            ],
                        ],
                        [
                            'code' => 'order-detail',
                            'name' => 'Order Detail',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/orders/{id}',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Order Detail'],
                                ['code' => 'edit', 'name' => 'Edit Order'],
                                ['code' => 'split', 'name' => 'Split Order'],
                                ['code' => 'merge', 'name' => 'Merge Orders'],
                            ],
                        ],
                        [
                            'code' => 'draft-orders',
                            'name' => 'Draft / Quote Orders',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/orders/drafts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Drafts'],
                                ['code' => 'create', 'name' => 'Create Draft'],
                                ['code' => 'convert', 'name' => 'Convert to Order'],
                            ],
                        ],
                        [
                            'code' => 'fulfillment',
                            'name' => 'Fulfillment',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/orders/fulfillment',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Fulfillment'],
                                ['code' => 'fulfill', 'name' => 'Fulfill Order'],
                                ['code' => 'pick', 'name' => 'Pick Items'],
                                ['code' => 'pack', 'name' => 'Pack Order'],
                                ['code' => 'ship', 'name' => 'Ship Order'],
                                ['code' => 'refund', 'name' => 'Refund Order'],
                            ],
                        ],
                        [
                            'code' => 'order-hold',
                            'name' => 'Order Hold / Release',
                            'type' => 'section',
                            'route' => '/tenant/ecommerce/orders/{id}/hold',
                            'actions' => [
                                ['code' => 'hold', 'name' => 'Hold Order'],
                                ['code' => 'release', 'name' => 'Release Order'],
                            ],
                        ],
                        [
                            'code' => 'manual-entry',
                            'name' => 'Manual Order Entry (POS)',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/orders/manual',
                            'actions' => [
                                ['code' => 'view', 'name' => 'Access Manual Entry'],
                                ['code' => 'create', 'name' => 'Create Manual Order'],
                            ],
                        ],
                        [
                            'code' => 'order-printing',
                            'name' => 'Order Printing',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'print-invoice', 'name' => 'Print Invoice'],
                                ['code' => 'print-packing-slip', 'name' => 'Print Packing Slip'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.4 Customers
                |--------------------------------------------------------------------------
                | Components: Customer Directory, Customer Groups, Addresses, Notes & Activity,
                |            Account management, Loyalty points
                */
                [
                    'code' => 'customers',
                    'name' => 'Customers',
                    'description' => 'Customer management with segments, addresses, and loyalty',
                    'icon' => 'UserGroupIcon',
                    'route' => '/tenant/ecommerce/customers',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'customer-list',
                            'name' => 'Customer Directory',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/customers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Customers'],
                                ['code' => 'create', 'name' => 'Create Customer'],
                                ['code' => 'update', 'name' => 'Update Customer'],
                                ['code' => 'delete', 'name' => 'Delete Customer'],
                                ['code' => 'block', 'name' => 'Block Customer'],
                            ],
                        ],
                        [
                            'code' => 'customer-groups',
                            'name' => 'Customer Groups / Segments',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/customers/groups',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Groups'],
                                ['code' => 'manage', 'name' => 'Manage Segments'],
                            ],
                        ],
                        [
                            'code' => 'customer-addresses',
                            'name' => 'Customer Addresses',
                            'type' => 'section',
                            'route' => '/tenant/ecommerce/customers/{id}/addresses',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Addresses'],
                                ['code' => 'add', 'name' => 'Add Address'],
                                ['code' => 'edit', 'name' => 'Edit Address'],
                                ['code' => 'delete', 'name' => 'Delete Address'],
                            ],
                        ],
                        [
                            'code' => 'customer-notes',
                            'name' => 'Customer Notes & Activity',
                            'type' => 'section',
                            'route' => '/tenant/ecommerce/customers/{id}/notes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Notes'],
                                ['code' => 'add', 'name' => 'Add Note'],
                            ],
                        ],
                        [
                            'code' => 'loyalty-points',
                            'name' => 'Loyalty Points',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/customers/loyalty',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Loyalty Points'],
                                ['code' => 'adjust', 'name' => 'Adjust Points'],
                                ['code' => 'configure', 'name' => 'Configure Loyalty Program'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.5 Cart & Checkout
                |--------------------------------------------------------------------------
                | Components: Cart session, Checkout steps, Address validation,
                |            Multi-shipping, Tax calculation, Order confirm
                */
                [
                    'code' => 'cart-checkout',
                    'name' => 'Cart & Checkout',
                    'description' => 'Shopping cart and checkout flow configuration',
                    'icon' => 'ShoppingCartIcon',
                    'route' => '/tenant/ecommerce/cart-checkout',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'cart-management',
                            'name' => 'Cart Session Management',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/cart-checkout/carts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Carts'],
                                ['code' => 'manage', 'name' => 'Manage Cart (Admin)'],
                            ],
                        ],
                        [
                            'code' => 'checkout-config',
                            'name' => 'Checkout Configuration',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/cart-checkout/config',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Checkout Config'],
                                ['code' => 'configure', 'name' => 'Configure Checkout'],
                            ],
                        ],
                        [
                            'code' => 'address-validation',
                            'name' => 'Address Validation',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/cart-checkout/address-validation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Address Settings'],
                                ['code' => 'configure', 'name' => 'Configure Validation'],
                            ],
                        ],
                        [
                            'code' => 'multi-shipping',
                            'name' => 'Multi-Shipping Support',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/cart-checkout/multi-shipping',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Multi-Shipping'],
                                ['code' => 'configure', 'name' => 'Configure Multi-Shipping'],
                            ],
                        ],
                        [
                            'code' => 'tax-hooks',
                            'name' => 'Tax Calculation Hooks',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/cart-checkout/tax',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tax Settings'],
                                ['code' => 'configure', 'name' => 'Configure Tax Hooks'],
                            ],
                        ],
                        [
                            'code' => 'checkout-place-order',
                            'name' => 'Place Order Flow',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'place-order', 'name' => 'Place Order'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.6 Promotions & Discounts
                |--------------------------------------------------------------------------
                | Components: Coupons, Automatic discounts, BOGO/Bundle, Campaign scheduling,
                |            Stacking rules
                */
                [
                    'code' => 'promotions',
                    'name' => 'Promotions & Discounts',
                    'description' => 'Coupons, automatic discounts, BOGO, and campaign management',
                    'icon' => 'GiftIcon',
                    'route' => '/tenant/ecommerce/promotions',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'coupon-list',
                            'name' => 'Coupons',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/promotions/coupons',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Coupons'],
                                ['code' => 'create', 'name' => 'Create Coupon'],
                                ['code' => 'update', 'name' => 'Update Coupon'],
                                ['code' => 'delete', 'name' => 'Delete Coupon'],
                                ['code' => 'publish', 'name' => 'Publish Coupon'],
                                ['code' => 'expire', 'name' => 'Expire Coupon'],
                            ],
                        ],
                        [
                            'code' => 'automatic-discounts',
                            'name' => 'Automatic Discounts',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/promotions/automatic',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Automatic Discounts'],
                                ['code' => 'create', 'name' => 'Create Automatic Discount'],
                                ['code' => 'update', 'name' => 'Update Discount'],
                                ['code' => 'delete', 'name' => 'Delete Discount'],
                            ],
                        ],
                        [
                            'code' => 'bogo-promotions',
                            'name' => 'BOGO / Bundle Promotions',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/promotions/bogo',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View BOGO Promotions'],
                                ['code' => 'create', 'name' => 'Create BOGO'],
                                ['code' => 'update', 'name' => 'Update BOGO'],
                                ['code' => 'delete', 'name' => 'Delete BOGO'],
                            ],
                        ],
                        [
                            'code' => 'campaign-scheduling',
                            'name' => 'Campaign Scheduling',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/promotions/campaigns',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Campaigns'],
                                ['code' => 'create', 'name' => 'Create Campaign'],
                                ['code' => 'schedule', 'name' => 'Schedule Campaign'],
                                ['code' => 'publish', 'name' => 'Publish Campaign'],
                            ],
                        ],
                        [
                            'code' => 'stacking-rules',
                            'name' => 'Stacking Rules / Priority',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/promotions/stacking',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stacking Rules'],
                                ['code' => 'configure', 'name' => 'Configure Rules'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.7 Pricing & Price Lists
                |--------------------------------------------------------------------------
                | Components: Base price/MSRP/Cost, Tiered pricing, Customer-specific,
                |            Multi-currency, Price history
                */
                [
                    'code' => 'pricing',
                    'name' => 'Pricing & Price Lists',
                    'description' => 'Manage product pricing, tiers, and customer-specific price lists',
                    'icon' => 'CurrencyDollarIcon',
                    'route' => '/tenant/ecommerce/pricing',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'base-pricing',
                            'name' => 'Base Price / MSRP / Cost',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/pricing/base',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Base Pricing'],
                                ['code' => 'manage', 'name' => 'Manage Pricing'],
                            ],
                        ],
                        [
                            'code' => 'tiered-pricing',
                            'name' => 'Tiered Pricing / Volume Discounts',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/pricing/tiered',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tiered Pricing'],
                                ['code' => 'create', 'name' => 'Create Tier'],
                                ['code' => 'update', 'name' => 'Update Tier'],
                                ['code' => 'delete', 'name' => 'Delete Tier'],
                            ],
                        ],
                        [
                            'code' => 'customer-price-lists',
                            'name' => 'Customer-Specific Price Lists',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/pricing/customer-lists',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Customer Price Lists'],
                                ['code' => 'create', 'name' => 'Create Price List'],
                                ['code' => 'assign', 'name' => 'Assign Price List'],
                                ['code' => 'delete', 'name' => 'Delete Price List'],
                            ],
                        ],
                        [
                            'code' => 'multi-currency',
                            'name' => 'Currency & Multi-Currency Pricing',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/pricing/currency',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Currency Settings'],
                                ['code' => 'configure', 'name' => 'Configure Currencies'],
                            ],
                        ],
                        [
                            'code' => 'price-history',
                            'name' => 'Price History',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/pricing/history',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Price History'],
                                ['code' => 'export', 'name' => 'Export History'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.8 Shipping & Fulfillment
                |--------------------------------------------------------------------------
                | Components: Shipping methods, Carrier integrations, Shipment creation,
                |            Rate calculator, Fulfillment centers
                */
                [
                    'code' => 'shipping',
                    'name' => 'Shipping & Fulfillment',
                    'description' => 'Shipping methods, carrier integrations, and fulfillment routing',
                    'icon' => 'TruckIcon',
                    'route' => '/tenant/ecommerce/shipping',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'shipping-methods',
                            'name' => 'Shipping Methods',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/shipping/methods',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Shipping Methods'],
                                ['code' => 'manage', 'name' => 'Manage Methods'],
                            ],
                        ],
                        [
                            'code' => 'carrier-integrations',
                            'name' => 'Carrier Integrations',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/shipping/carriers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Carriers'],
                                ['code' => 'configure', 'name' => 'Configure Carrier'],
                                ['code' => 'test', 'name' => 'Test Integration'],
                            ],
                        ],
                        [
                            'code' => 'shipment-creation',
                            'name' => 'Shipment Creation & Labels',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/shipping/shipments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Shipments'],
                                ['code' => 'create', 'name' => 'Create Shipment'],
                                ['code' => 'print-label', 'name' => 'Print Label'],
                                ['code' => 'track', 'name' => 'Track Shipment'],
                            ],
                        ],
                        [
                            'code' => 'rate-calculator',
                            'name' => 'Rate Calculator',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/shipping/rate-calculator',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Rate Calculator'],
                                ['code' => 'test', 'name' => 'Test Rates'],
                            ],
                        ],
                        [
                            'code' => 'fulfillment-centers',
                            'name' => 'Fulfillment Centers / Multi-Warehouse',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/shipping/fulfillment-centers',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Fulfillment Centers'],
                                ['code' => 'configure', 'name' => 'Configure Routing'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.9 Payments
                |--------------------------------------------------------------------------
                | Components: Payment gateways, Payment intents, Refunds, Fraud checks,
                |            Stored payment methods
                */
                [
                    'code' => 'payments',
                    'name' => 'Payments',
                    'description' => 'Payment gateway configuration, refunds, and fraud prevention',
                    'icon' => 'CreditCardIcon',
                    'route' => '/tenant/ecommerce/payments',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'payment-gateways',
                            'name' => 'Payment Gateways',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/payments/gateways',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Gateways'],
                                ['code' => 'configure', 'name' => 'Configure Gateway'],
                                ['code' => 'test', 'name' => 'Test Gateway'],
                            ],
                        ],
                        [
                            'code' => 'payment-transactions',
                            'name' => 'Payment Transactions',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/payments/transactions',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Transactions'],
                                ['code' => 'capture', 'name' => 'Capture Payment'],
                                ['code' => 'void', 'name' => 'Void Payment'],
                            ],
                        ],
                        [
                            'code' => 'refunds',
                            'name' => 'Refunds',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/payments/refunds',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Refunds'],
                                ['code' => 'refund', 'name' => 'Issue Refund'],
                                ['code' => 'partial-refund', 'name' => 'Partial Refund'],
                            ],
                        ],
                        [
                            'code' => 'fraud-checks',
                            'name' => 'Fraud Checks & 3D Secure',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/payments/fraud',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Fraud Settings'],
                                ['code' => 'configure', 'name' => 'Configure Fraud Rules'],
                            ],
                        ],
                        [
                            'code' => 'stored-payment-methods',
                            'name' => 'Stored Payment Methods / Wallets',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/payments/stored-methods',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stored Methods'],
                                ['code' => 'manage', 'name' => 'Manage Methods'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.10 Inventory Integration
                |--------------------------------------------------------------------------
                | Components: SKU sync, Backorder rules, Safety stock, Reserve inventory,
                |            Integration adapters
                */
                [
                    'code' => 'inventory-integration',
                    'name' => 'Inventory Integration',
                    'description' => 'Sync inventory with ERP, POS, and warehouse systems',
                    'icon' => 'ArrowsRightLeftIcon',
                    'route' => '/tenant/ecommerce/inventory-integration',
                    'priority' => 10,

                    'components' => [
                        [
                            'code' => 'sku-sync',
                            'name' => 'SKU → Inventory Sync',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/inventory-integration/sync',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sync Status'],
                                ['code' => 'sync', 'name' => 'Trigger Sync'],
                                ['code' => 'configure', 'name' => 'Configure Sync'],
                            ],
                        ],
                        [
                            'code' => 'backorder-rules',
                            'name' => 'Backorder Rules',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/inventory-integration/backorder',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Backorder Rules'],
                                ['code' => 'configure', 'name' => 'Configure Rules'],
                            ],
                        ],
                        [
                            'code' => 'safety-stock',
                            'name' => 'Safety Stock Logic',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/inventory-integration/safety-stock',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Safety Stock'],
                                ['code' => 'configure', 'name' => 'Configure Safety Stock'],
                            ],
                        ],
                        [
                            'code' => 'inventory-reserve',
                            'name' => 'Reserve Inventory',
                            'type' => 'section',
                            'route' => null,
                            'actions' => [
                                ['code' => 'reserve', 'name' => 'Reserve Inventory'],
                                ['code' => 'release', 'name' => 'Release Inventory'],
                                ['code' => 'adjust', 'name' => 'Adjust Inventory'],
                            ],
                        ],
                        [
                            'code' => 'integration-adapters',
                            'name' => 'Integration Adapters (ERP/POS/WMS)',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/inventory-integration/adapters',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Adapters'],
                                ['code' => 'configure', 'name' => 'Configure Adapter'],
                                ['code' => 'test', 'name' => 'Test Connection'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.11 Returns & RMA
                |--------------------------------------------------------------------------
                | Components: RMA request form, Return authorization, Return labels,
                |            Refund/Exchange, RMA audit trail
                */
                [
                    'code' => 'returns-rma',
                    'name' => 'Returns & RMA',
                    'description' => 'Return merchandise authorization and refund processing',
                    'icon' => 'ArrowUturnLeftIcon',
                    'route' => '/tenant/ecommerce/returns',
                    'priority' => 11,

                    'components' => [
                        [
                            'code' => 'rma-list',
                            'name' => 'RMA Requests',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/returns',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View RMA Requests'],
                                ['code' => 'request', 'name' => 'Create RMA Request'],
                                ['code' => 'approve', 'name' => 'Approve RMA'],
                                ['code' => 'reject', 'name' => 'Reject RMA'],
                            ],
                        ],
                        [
                            'code' => 'return-authorization',
                            'name' => 'Return Authorization Workflow',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/returns/authorization',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Authorization Workflow'],
                                ['code' => 'configure', 'name' => 'Configure Workflow'],
                            ],
                        ],
                        [
                            'code' => 'return-labels',
                            'name' => 'Return Shipping Labels',
                            'type' => 'section',
                            'route' => '/tenant/ecommerce/returns/{id}/label',
                            'actions' => [
                                ['code' => 'generate', 'name' => 'Generate Return Label'],
                                ['code' => 'print', 'name' => 'Print Label'],
                            ],
                        ],
                        [
                            'code' => 'refund-exchange',
                            'name' => 'Refund / Exchange Processing',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/returns/process',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Processing Queue'],
                                ['code' => 'process-refund', 'name' => 'Process Refund'],
                                ['code' => 'exchange', 'name' => 'Process Exchange'],
                            ],
                        ],
                        [
                            'code' => 'rma-audit',
                            'name' => 'RMA Audit Trail',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/returns/audit',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Audit Trail'],
                                ['code' => 'export', 'name' => 'Export Audit Log'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.12 Reviews & Ratings
                |--------------------------------------------------------------------------
                | Components: Moderation queue, Rating aggregation, Review responses, Widgets
                */
                [
                    'code' => 'reviews',
                    'name' => 'Reviews & Ratings',
                    'description' => 'Product review moderation and rating management',
                    'icon' => 'StarIcon',
                    'route' => '/tenant/ecommerce/reviews',
                    'priority' => 12,

                    'components' => [
                        [
                            'code' => 'review-list',
                            'name' => 'Reviews Moderation Queue',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/reviews',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Reviews'],
                                ['code' => 'approve', 'name' => 'Approve Review'],
                                ['code' => 'reject', 'name' => 'Reject Review'],
                                ['code' => 'respond', 'name' => 'Respond to Review'],
                            ],
                        ],
                        [
                            'code' => 'rating-aggregation',
                            'name' => 'Rating Aggregation',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/reviews/ratings',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Ratings'],
                                ['code' => 'recalculate', 'name' => 'Recalculate Ratings'],
                            ],
                        ],
                        [
                            'code' => 'review-widgets',
                            'name' => 'Review Widgets',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/reviews/widgets',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Widgets'],
                                ['code' => 'configure', 'name' => 'Configure Widgets'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.13 Storefront / CMS
                |--------------------------------------------------------------------------
                | Components: Pages, Static pages, Banners, SEO, Multi-store/language,
                |            Theme settings, Widgets & blocks
                */
                [
                    'code' => 'storefront',
                    'name' => 'Storefront / CMS',
                    'description' => 'Content management for storefront pages, SEO, and themes',
                    'icon' => 'ComputerDesktopIcon',
                    'route' => '/tenant/ecommerce/storefront',
                    'priority' => 13,

                    'components' => [
                        [
                            'code' => 'page-management',
                            'name' => 'Page Management',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/storefront/pages',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Pages'],
                                ['code' => 'manage', 'name' => 'Manage Pages'],
                            ],
                        ],
                        [
                            'code' => 'static-pages',
                            'name' => 'Static Pages (About, FAQ)',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/storefront/static',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Static Pages'],
                                ['code' => 'create', 'name' => 'Create Page'],
                                ['code' => 'edit', 'name' => 'Edit Page'],
                                ['code' => 'delete', 'name' => 'Delete Page'],
                            ],
                        ],
                        [
                            'code' => 'banners',
                            'name' => 'Banners & Promotions Placement',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/storefront/banners',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Banners'],
                                ['code' => 'create', 'name' => 'Create Banner'],
                                ['code' => 'edit', 'name' => 'Edit Banner'],
                                ['code' => 'delete', 'name' => 'Delete Banner'],
                            ],
                        ],
                        [
                            'code' => 'seo-management',
                            'name' => 'SEO Meta Fields',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/storefront/seo',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SEO Settings'],
                                ['code' => 'edit', 'name' => 'Edit SEO Meta'],
                            ],
                        ],
                        [
                            'code' => 'multi-store',
                            'name' => 'Multi-Store / Multi-Language',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/storefront/multi-store',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stores'],
                                ['code' => 'configure', 'name' => 'Configure Stores'],
                            ],
                        ],
                        [
                            'code' => 'theme-settings',
                            'name' => 'Theme Settings (Branding)',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/storefront/theme',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Theme'],
                                ['code' => 'manage', 'name' => 'Manage Theme'],
                            ],
                        ],
                        [
                            'code' => 'widgets-blocks',
                            'name' => 'Widgets & Blocks',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/storefront/widgets',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Widgets'],
                                ['code' => 'manage', 'name' => 'Manage Blocks'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.14 Analytics & Reports
                |--------------------------------------------------------------------------
                | Components: Sales reports, Customer LTV, Conversion funnel, Refunds,
                |            Tax reports
                */
                [
                    'code' => 'analytics',
                    'name' => 'Analytics & Reports',
                    'description' => 'E-commerce analytics with sales, conversion, and tax reports',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/ecommerce/analytics',
                    'priority' => 14,

                    'components' => [
                        [
                            'code' => 'sales-reports',
                            'name' => 'Sales Reports',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/analytics/sales',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sales Reports'],
                                ['code' => 'generate', 'name' => 'Generate Report'],
                                ['code' => 'schedule', 'name' => 'Schedule Report'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'customer-ltv',
                            'name' => 'Customer LTV / Cohort Analysis',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/analytics/ltv',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View LTV Report'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'conversion-funnel',
                            'name' => 'Conversion Funnel / Abandonment',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/analytics/conversion',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Conversion Funnel'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'refund-reports',
                            'name' => 'Refund & Returns Reports',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/analytics/refunds',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Refund Reports'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'tax-reports',
                            'name' => 'Tax Reports by Jurisdiction',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/analytics/tax',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tax Reports'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 8.15 Settings & Integrations
                |--------------------------------------------------------------------------
                | Components: Store settings, Currencies & tax zones, Webhooks & API keys,
                |            Channel management, GDPR, Analytics tracking, API docs
                */
                [
                    'code' => 'ecommerce-settings',
                    'name' => 'Settings & Integrations',
                    'description' => 'Store configuration, webhooks, channels, and API management',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/tenant/ecommerce/settings',
                    'priority' => 15,

                    'components' => [
                        [
                            'code' => 'store-settings',
                            'name' => 'Store Settings',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/settings/store',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Store Settings'],
                                ['code' => 'manage', 'name' => 'Manage Settings'],
                            ],
                        ],
                        [
                            'code' => 'currency-tax-zones',
                            'name' => 'Currencies & Tax Zones',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/settings/currency-tax',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Currency/Tax Settings'],
                                ['code' => 'configure', 'name' => 'Configure Zones'],
                            ],
                        ],
                        [
                            'code' => 'webhooks',
                            'name' => 'Webhooks & API Keys',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/settings/webhooks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Webhooks'],
                                ['code' => 'manage', 'name' => 'Manage Webhooks'],
                                ['code' => 'api-key-manage', 'name' => 'Manage API Keys'],
                            ],
                        ],
                        [
                            'code' => 'channel-management',
                            'name' => 'Channel Management (Marketplaces, POS)',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/settings/channels',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Channels'],
                                ['code' => 'add', 'name' => 'Add Channel'],
                                ['code' => 'configure', 'name' => 'Configure Channel'],
                            ],
                        ],
                        [
                            'code' => 'gdpr-privacy',
                            'name' => 'GDPR / Privacy Settings',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/settings/gdpr',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View GDPR Settings'],
                                ['code' => 'configure', 'name' => 'Configure Privacy'],
                            ],
                        ],
                        [
                            'code' => 'analytics-tracking',
                            'name' => 'Web Analytics & Tracking (Pixel)',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/settings/tracking',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tracking Settings'],
                                ['code' => 'configure', 'name' => 'Configure Tracking'],
                            ],
                        ],
                        [
                            'code' => 'api-docs',
                            'name' => 'Developer API Docs',
                            'type' => 'page',
                            'route' => '/tenant/ecommerce/settings/api-docs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View API Documentation'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | Analytics Module (Enterprise-Grade)
        |--------------------------------------------------------------------------
        | Section 9 - Analytics
        | 13 Submodules: Overview Dashboard, Acquisition, Behavior, Conversion,
        |                Revenue & Finance Analytics, Product Analytics, Customer Analytics,
        |                Operational Analytics, Custom Reports, Scheduled Reports,
        |                Data Explorer, Integrations, Settings
        */
        [
            'code' => 'analytics',
            'name' => 'Analytics',
            'description' => 'Enterprise-grade analytics with acquisition, behavior, conversion, revenue, and custom reporting',
            'icon' => 'ChartBarSquareIcon',
            'route_prefix' => '/tenant/analytics',
            'category' => 'system_administration',
            'priority' => 70,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'professional',
            'license_type' => 'standard',
            'dependencies' => ['core'],
            'release_date' => '2024-01-01',

            'submodules' => [
                /*
                |--------------------------------------------------------------------------
                | 9.1 Overview Dashboard
                |--------------------------------------------------------------------------
                | Components: Total users, Sessions, Conversion funnel, Revenue KPIs,
                |            Retention, Top products, Geo distribution, Real-time
                */
                [
                    'code' => 'dashboard',
                    'name' => 'Overview Dashboard',
                    'description' => 'Analytics overview with users, sessions, conversion, and revenue KPIs',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/analytics/dashboard',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'analytics-dashboard',
                            'name' => 'Analytics Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/analytics/dashboard',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dashboard'],
                                ['code' => 'export', 'name' => 'Export Dashboard'],
                                ['code' => 'filter', 'name' => 'Filter Data'],
                            ],
                        ],
                        [
                            'code' => 'users-widget',
                            'name' => 'Total/Active Users Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Users Widget'],
                            ],
                        ],
                        [
                            'code' => 'sessions-widget',
                            'name' => 'Sessions/Events Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sessions Widget'],
                            ],
                        ],
                        [
                            'code' => 'conversion-funnel-widget',
                            'name' => 'Conversion Funnel Summary Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Conversion Funnel'],
                            ],
                        ],
                        [
                            'code' => 'revenue-kpis-widget',
                            'name' => 'Revenue KPIs Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Revenue KPIs'],
                            ],
                        ],
                        [
                            'code' => 'geo-distribution-widget',
                            'name' => 'Geo Distribution Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Geo Distribution'],
                            ],
                        ],
                        [
                            'code' => 'realtime-widget',
                            'name' => 'Real-time Analytics Widget',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Real-time Analytics'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.2 Acquisition Analytics
                |--------------------------------------------------------------------------
                | Components: Traffic sources, Campaign performance, UTM tracking,
                |            New vs returning, Geo & device breakdown
                */
                [
                    'code' => 'acquisition',
                    'name' => 'Acquisition Analytics',
                    'description' => 'Traffic sources, campaigns, UTM tracking, and user acquisition metrics',
                    'icon' => 'ArrowTrendingUpIcon',
                    'route' => '/tenant/analytics/acquisition',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'traffic-sources',
                            'name' => 'Traffic Sources',
                            'type' => 'page',
                            'route' => '/tenant/analytics/acquisition/traffic',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Traffic Sources'],
                                ['code' => 'export', 'name' => 'Export Traffic Data'],
                            ],
                        ],
                        [
                            'code' => 'campaign-performance',
                            'name' => 'Campaign Performance',
                            'type' => 'page',
                            'route' => '/tenant/analytics/acquisition/campaigns',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Campaign Performance'],
                                ['code' => 'manage', 'name' => 'Manage Campaigns'],
                                ['code' => 'export', 'name' => 'Export Campaign Data'],
                            ],
                        ],
                        [
                            'code' => 'utm-tracking',
                            'name' => 'UTM Tracking',
                            'type' => 'page',
                            'route' => '/tenant/analytics/acquisition/utm',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View UTM Tracking'],
                                ['code' => 'configure', 'name' => 'Configure UTM'],
                            ],
                        ],
                        [
                            'code' => 'new-vs-returning',
                            'name' => 'New vs Returning Users',
                            'type' => 'page',
                            'route' => '/tenant/analytics/acquisition/users',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View User Comparison'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'geo-device-breakdown',
                            'name' => 'Geo & Device Breakdown',
                            'type' => 'page',
                            'route' => '/tenant/analytics/acquisition/geo-device',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Geo & Device Data'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.3 Behavior Analytics
                |--------------------------------------------------------------------------
                | Components: Page views, Heatmaps, Scroll/click tracking, Session recordings,
                |            Event stream, Event definitions, Event funnels
                */
                [
                    'code' => 'behavior',
                    'name' => 'Behavior Analytics',
                    'description' => 'User behavior with page views, events, heatmaps, and funnels',
                    'icon' => 'CursorArrowRaysIcon',
                    'route' => '/tenant/analytics/behavior',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'page-views',
                            'name' => 'Page Views',
                            'type' => 'page',
                            'route' => '/tenant/analytics/behavior/page-views',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Page Views'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'heatmaps',
                            'name' => 'Heatmaps',
                            'type' => 'page',
                            'route' => '/tenant/analytics/behavior/heatmaps',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Heatmaps'],
                                ['code' => 'configure', 'name' => 'Configure Heatmaps'],
                            ],
                        ],
                        [
                            'code' => 'scroll-click-tracking',
                            'name' => 'Scroll & Click Tracking',
                            'type' => 'page',
                            'route' => '/tenant/analytics/behavior/tracking',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tracking Data'],
                                ['code' => 'track', 'name' => 'Track Events'],
                            ],
                        ],
                        [
                            'code' => 'session-recordings',
                            'name' => 'Session Recordings',
                            'type' => 'page',
                            'route' => '/tenant/analytics/behavior/recordings',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Recordings'],
                                ['code' => 'configure', 'name' => 'Configure Recordings'],
                            ],
                        ],
                        [
                            'code' => 'event-stream',
                            'name' => 'Event Stream / Explorer',
                            'type' => 'page',
                            'route' => '/tenant/analytics/behavior/events',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Event Stream'],
                                ['code' => 'export', 'name' => 'Export Events'],
                            ],
                        ],
                        [
                            'code' => 'event-definitions',
                            'name' => 'Event Definitions',
                            'type' => 'page',
                            'route' => '/tenant/analytics/behavior/event-definitions',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Event Definitions'],
                                ['code' => 'define', 'name' => 'Define Event'],
                                ['code' => 'edit', 'name' => 'Edit Definition'],
                                ['code' => 'delete', 'name' => 'Delete Definition'],
                            ],
                        ],
                        [
                            'code' => 'event-funnels',
                            'name' => 'Event Funnels',
                            'type' => 'page',
                            'route' => '/tenant/analytics/behavior/funnels',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Funnels'],
                                ['code' => 'create', 'name' => 'Create Funnel'],
                                ['code' => 'edit', 'name' => 'Edit Funnel'],
                                ['code' => 'delete', 'name' => 'Delete Funnel'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.4 Conversion Analytics
                |--------------------------------------------------------------------------
                | Components: Multi-step funnel, Checkout conversion, Feature adoption,
                |            Drop-off analysis, A/B test results
                */
                [
                    'code' => 'conversion',
                    'name' => 'Conversion Analytics',
                    'description' => 'Conversion funnels, checkout, feature adoption, and A/B testing',
                    'icon' => 'FunnelIcon',
                    'route' => '/tenant/analytics/conversion',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'funnel-analysis',
                            'name' => 'Multi-step Funnel Analysis',
                            'type' => 'page',
                            'route' => '/tenant/analytics/conversion/funnels',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Funnel Analysis'],
                                ['code' => 'create', 'name' => 'Create Funnel'],
                                ['code' => 'export', 'name' => 'Export Funnel Data'],
                            ],
                        ],
                        [
                            'code' => 'checkout-conversion',
                            'name' => 'Checkout Conversion',
                            'type' => 'page',
                            'route' => '/tenant/analytics/conversion/checkout',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Checkout Conversion'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'feature-adoption',
                            'name' => 'Feature/Module Adoption',
                            'type' => 'page',
                            'route' => '/tenant/analytics/conversion/adoption',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Feature Adoption'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'dropoff-analysis',
                            'name' => 'Drop-off Analysis',
                            'type' => 'page',
                            'route' => '/tenant/analytics/conversion/dropoff',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Drop-off Analysis'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'ab-test-results',
                            'name' => 'A/B Test Results',
                            'type' => 'page',
                            'route' => '/tenant/analytics/conversion/ab-tests',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View A/B Test Results'],
                                ['code' => 'export', 'name' => 'Export Results'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.5 Revenue & Finance Analytics
                |--------------------------------------------------------------------------
                | Components: MRR, ARR, LTV, Cohort revenue, ARPU, Churn, Refunds, Tax, Profitability
                */
                [
                    'code' => 'revenue',
                    'name' => 'Revenue & Finance Analytics',
                    'description' => 'MRR, ARR, LTV, cohort analysis, churn, and profitability metrics',
                    'icon' => 'CurrencyDollarIcon',
                    'route' => '/tenant/analytics/revenue',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'mrr-arr',
                            'name' => 'MRR / ARR',
                            'type' => 'page',
                            'route' => '/tenant/analytics/revenue/mrr-arr',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View MRR/ARR'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'ltv',
                            'name' => 'Lifetime Value (LTV)',
                            'type' => 'page',
                            'route' => '/tenant/analytics/revenue/ltv',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View LTV'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'cohort-revenue',
                            'name' => 'Cohort Revenue Analysis',
                            'type' => 'page',
                            'route' => '/tenant/analytics/revenue/cohorts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Cohort Revenue'],
                                ['code' => 'configure', 'name' => 'Configure Cohorts'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'arpu',
                            'name' => 'ARPU (Average Revenue Per User)',
                            'type' => 'page',
                            'route' => '/tenant/analytics/revenue/arpu',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View ARPU'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'churn-retention',
                            'name' => 'Churn & Retention Revenue',
                            'type' => 'page',
                            'route' => '/tenant/analytics/revenue/churn',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Churn & Retention'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'refund-chargeback',
                            'name' => 'Refund & Chargeback Analytics',
                            'type' => 'page',
                            'route' => '/tenant/analytics/revenue/refunds',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Refund Analytics'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'tax-analytics',
                            'name' => 'Tax Analytics',
                            'type' => 'page',
                            'route' => '/tenant/analytics/revenue/tax',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tax Analytics'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'profitability',
                            'name' => 'Profitability Dashboards',
                            'type' => 'page',
                            'route' => '/tenant/analytics/revenue/profitability',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Profitability'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.6 Product Analytics
                |--------------------------------------------------------------------------
                | Components: Feature usage, Module adoption, Engagement time, Power users,
                |            Feature retention, Product stickiness
                */
                [
                    'code' => 'product',
                    'name' => 'Product Analytics',
                    'description' => 'Feature usage, engagement, power users, and product stickiness',
                    'icon' => 'CubeIcon',
                    'route' => '/tenant/analytics/product',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'feature-usage',
                            'name' => 'Feature Usage',
                            'type' => 'page',
                            'route' => '/tenant/analytics/product/feature-usage',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Feature Usage'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'module-adoption',
                            'name' => 'Module Adoption',
                            'type' => 'page',
                            'route' => '/tenant/analytics/product/module-adoption',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Module Adoption'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'engagement-time',
                            'name' => 'Engagement Time per Feature',
                            'type' => 'page',
                            'route' => '/tenant/analytics/product/engagement',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Engagement Time'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'power-users',
                            'name' => 'Power User Reports',
                            'type' => 'page',
                            'route' => '/tenant/analytics/product/power-users',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Power Users'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'feature-retention',
                            'name' => 'Feature Retention',
                            'type' => 'page',
                            'route' => '/tenant/analytics/product/retention',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Feature Retention'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'stickiness',
                            'name' => 'Product Stickiness (DAU/MAU)',
                            'type' => 'page',
                            'route' => '/tenant/analytics/product/stickiness',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Product Stickiness'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'feature-map',
                            'name' => 'Feature Map Management',
                            'type' => 'page',
                            'route' => '/tenant/analytics/product/feature-map',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Feature Map'],
                                ['code' => 'manage', 'name' => 'Manage Feature Map'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.7 Customer Analytics
                |--------------------------------------------------------------------------
                | Components: Customer segments, Cohorts, RFM Analysis, User journeys,
                |            Churn prediction, Inactive user reports
                */
                [
                    'code' => 'customers',
                    'name' => 'Customer Analytics',
                    'description' => 'Customer segments, cohorts, RFM analysis, and churn prediction',
                    'icon' => 'UserGroupIcon',
                    'route' => '/tenant/analytics/customers',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'customer-segments',
                            'name' => 'Customer Segments',
                            'type' => 'page',
                            'route' => '/tenant/analytics/customers/segments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Segments'],
                                ['code' => 'create', 'name' => 'Create Segment'],
                                ['code' => 'edit', 'name' => 'Edit Segment'],
                                ['code' => 'export', 'name' => 'Export Segments'],
                            ],
                        ],
                        [
                            'code' => 'customer-cohorts',
                            'name' => 'Customer Cohorts',
                            'type' => 'page',
                            'route' => '/tenant/analytics/customers/cohorts',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Cohorts'],
                                ['code' => 'create', 'name' => 'Create Cohort'],
                                ['code' => 'export', 'name' => 'Export Cohorts'],
                            ],
                        ],
                        [
                            'code' => 'rfm-analysis',
                            'name' => 'RFM Analysis',
                            'type' => 'page',
                            'route' => '/tenant/analytics/customers/rfm',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View RFM Analysis'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'user-journeys',
                            'name' => 'User Journeys',
                            'type' => 'page',
                            'route' => '/tenant/analytics/customers/journeys',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View User Journeys'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'churn-prediction',
                            'name' => 'Churn Prediction',
                            'type' => 'page',
                            'route' => '/tenant/analytics/customers/churn',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Churn Prediction'],
                                ['code' => 'configure', 'name' => 'Configure Model'],
                            ],
                        ],
                        [
                            'code' => 'inactive-users',
                            'name' => 'Inactive User Reports',
                            'type' => 'page',
                            'route' => '/tenant/analytics/customers/inactive',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Inactive Users'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.8 Operational Analytics
                |--------------------------------------------------------------------------
                | Components: SLA compliance, Support tickets, ERP KPIs, Fulfillment speed,
                |            HR analytics, Manufacturing KPIs
                */
                [
                    'code' => 'operations',
                    'name' => 'Operational Analytics',
                    'description' => 'SLA compliance, support performance, ERP and HR operational KPIs',
                    'icon' => 'WrenchScrewdriverIcon',
                    'route' => '/tenant/analytics/operations',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'sla-compliance',
                            'name' => 'SLA Compliance',
                            'type' => 'page',
                            'route' => '/tenant/analytics/operations/sla',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SLA Compliance'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'support-performance',
                            'name' => 'Support Ticket Performance',
                            'type' => 'page',
                            'route' => '/tenant/analytics/operations/support',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Support Performance'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'erp-kpis',
                            'name' => 'ERP/Inventory Operational KPIs',
                            'type' => 'page',
                            'route' => '/tenant/analytics/operations/erp',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View ERP KPIs'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'fulfillment-speed',
                            'name' => 'Fulfillment Speed',
                            'type' => 'page',
                            'route' => '/tenant/analytics/operations/fulfillment',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Fulfillment Speed'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'hr-analytics',
                            'name' => 'HR Analytics (Attendance, Productivity)',
                            'type' => 'page',
                            'route' => '/tenant/analytics/operations/hr',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View HR Analytics'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                        [
                            'code' => 'manufacturing-kpis',
                            'name' => 'Manufacturing KPIs',
                            'type' => 'page',
                            'route' => '/tenant/analytics/operations/manufacturing',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Manufacturing KPIs'],
                                ['code' => 'export', 'name' => 'Export Data'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.9 Custom Reports
                |--------------------------------------------------------------------------
                | Components: Visual report builder, Dimensions & metrics, Filters,
                |            Chart types, Save/Share/Export
                */
                [
                    'code' => 'custom-reports',
                    'name' => 'Custom Reports',
                    'description' => 'Visual report builder with drag-drop, charts, and sharing',
                    'icon' => 'DocumentChartBarIcon',
                    'route' => '/tenant/analytics/custom-reports',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'report-builder',
                            'name' => 'Report Builder',
                            'type' => 'page',
                            'route' => '/tenant/analytics/custom-reports/builder',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Report Builder'],
                                ['code' => 'create', 'name' => 'Create Report'],
                                ['code' => 'update', 'name' => 'Update Report'],
                                ['code' => 'delete', 'name' => 'Delete Report'],
                            ],
                        ],
                        [
                            'code' => 'saved-reports',
                            'name' => 'Saved Reports',
                            'type' => 'page',
                            'route' => '/tenant/analytics/custom-reports',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Saved Reports'],
                                ['code' => 'share', 'name' => 'Share Report'],
                                ['code' => 'export', 'name' => 'Export Report'],
                                ['code' => 'delete', 'name' => 'Delete Report'],
                            ],
                        ],
                        [
                            'code' => 'dimensions-metrics',
                            'name' => 'Dimensions & Metrics',
                            'type' => 'section',
                            'route' => '/tenant/analytics/custom-reports/dimensions',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dimensions & Metrics'],
                                ['code' => 'configure', 'name' => 'Configure'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.10 Scheduled Reports
                |--------------------------------------------------------------------------
                | Components: Report scheduling, Email reports, Slack/Telegram,
                |            Cron/queue triggers
                */
                [
                    'code' => 'scheduled-reports',
                    'name' => 'Scheduled Reports',
                    'description' => 'Schedule and automate report delivery via email, Slack, or Telegram',
                    'icon' => 'ClockIcon',
                    'route' => '/tenant/analytics/scheduled-reports',
                    'priority' => 10,

                    'components' => [
                        [
                            'code' => 'schedule-list',
                            'name' => 'Scheduled Reports List',
                            'type' => 'page',
                            'route' => '/tenant/analytics/scheduled-reports',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Scheduled Reports'],
                                ['code' => 'create', 'name' => 'Create Schedule'],
                                ['code' => 'update', 'name' => 'Update Schedule'],
                                ['code' => 'delete', 'name' => 'Delete Schedule'],
                                ['code' => 'run-now', 'name' => 'Run Now'],
                            ],
                        ],
                        [
                            'code' => 'email-reports',
                            'name' => 'Email Report Configuration',
                            'type' => 'page',
                            'route' => '/tenant/analytics/scheduled-reports/email',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Email Config'],
                                ['code' => 'configure', 'name' => 'Configure Email Reports'],
                            ],
                        ],
                        [
                            'code' => 'integrations-delivery',
                            'name' => 'Slack/Telegram Delivery',
                            'type' => 'page',
                            'route' => '/tenant/analytics/scheduled-reports/integrations',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Integration Delivery'],
                                ['code' => 'configure', 'name' => 'Configure Integrations'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.11 Data Explorer
                |--------------------------------------------------------------------------
                | Components: SQL query runner, Visual query builder, Dataset picker,
                |            Data preview, Saved queries
                */
                [
                    'code' => 'data-explorer',
                    'name' => 'Data Explorer',
                    'description' => 'SQL query runner and visual query builder for tenant-isolated data',
                    'icon' => 'MagnifyingGlassIcon',
                    'route' => '/tenant/analytics/data-explorer',
                    'priority' => 11,

                    'components' => [
                        [
                            'code' => 'sql-runner',
                            'name' => 'SQL Query Runner',
                            'type' => 'page',
                            'route' => '/tenant/analytics/data-explorer/sql',
                            'actions' => [
                                ['code' => 'query', 'name' => 'Execute Query'],
                                ['code' => 'save', 'name' => 'Save Query'],
                                ['code' => 'delete', 'name' => 'Delete Query'],
                                ['code' => 'export', 'name' => 'Export Results'],
                            ],
                        ],
                        [
                            'code' => 'visual-builder',
                            'name' => 'Visual Query Builder',
                            'type' => 'page',
                            'route' => '/tenant/analytics/data-explorer/visual',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Visual Builder'],
                                ['code' => 'build', 'name' => 'Build Query'],
                            ],
                        ],
                        [
                            'code' => 'datasets',
                            'name' => 'Dataset Picker',
                            'type' => 'page',
                            'route' => '/tenant/analytics/data-explorer/datasets',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Datasets'],
                                ['code' => 'preview', 'name' => 'Preview Data'],
                            ],
                        ],
                        [
                            'code' => 'saved-queries',
                            'name' => 'Saved Queries',
                            'type' => 'page',
                            'route' => '/tenant/analytics/data-explorer/saved',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Saved Queries'],
                                ['code' => 'run', 'name' => 'Run Query'],
                                ['code' => 'delete', 'name' => 'Delete Query'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.12 Integrations
                |--------------------------------------------------------------------------
                | Components: Google Analytics, Meta Pixel, Segment, Mixpanel, HubSpot,
                |            Stripe, Warehouse sync, Webhooks
                */
                [
                    'code' => 'integrations',
                    'name' => 'Integrations',
                    'description' => 'Connect with Google Analytics, Meta Pixel, Segment, and data warehouses',
                    'icon' => 'ArrowsRightLeftIcon',
                    'route' => '/tenant/analytics/integrations',
                    'priority' => 12,

                    'components' => [
                        [
                            'code' => 'integration-list',
                            'name' => 'Available Integrations',
                            'type' => 'page',
                            'route' => '/tenant/analytics/integrations',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Integrations'],
                                ['code' => 'connect', 'name' => 'Connect Integration'],
                                ['code' => 'disconnect', 'name' => 'Disconnect Integration'],
                                ['code' => 'sync-now', 'name' => 'Sync Now'],
                            ],
                        ],
                        [
                            'code' => 'google-analytics',
                            'name' => 'Google Analytics',
                            'type' => 'page',
                            'route' => '/tenant/analytics/integrations/google-analytics',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Settings'],
                                ['code' => 'configure', 'name' => 'Configure'],
                            ],
                        ],
                        [
                            'code' => 'meta-pixel',
                            'name' => 'Meta Pixel',
                            'type' => 'page',
                            'route' => '/tenant/analytics/integrations/meta-pixel',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Settings'],
                                ['code' => 'configure', 'name' => 'Configure'],
                            ],
                        ],
                        [
                            'code' => 'segment',
                            'name' => 'Segment',
                            'type' => 'page',
                            'route' => '/tenant/analytics/integrations/segment',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Settings'],
                                ['code' => 'configure', 'name' => 'Configure'],
                            ],
                        ],
                        [
                            'code' => 'warehouse-sync',
                            'name' => 'Warehouse Sync (BigQuery, Snowflake, etc.)',
                            'type' => 'page',
                            'route' => '/tenant/analytics/integrations/warehouse',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Warehouse Sync'],
                                ['code' => 'configure', 'name' => 'Configure Sync'],
                                ['code' => 'sync', 'name' => 'Trigger Sync'],
                            ],
                        ],
                        [
                            'code' => 'webhooks',
                            'name' => 'Webhooks',
                            'type' => 'page',
                            'route' => '/tenant/analytics/integrations/webhooks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Webhooks'],
                                ['code' => 'create', 'name' => 'Create Webhook'],
                                ['code' => 'delete', 'name' => 'Delete Webhook'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 9.13 Analytics Settings
                |--------------------------------------------------------------------------
                | Components: Event naming, Funnel definitions, Attribution windows,
                |            Data retention, Sampling, Anomaly detection
                */
                [
                    'code' => 'analytics-settings',
                    'name' => 'Settings',
                    'description' => 'Configure event naming, attribution, data retention, and anomaly detection',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/tenant/analytics/settings',
                    'priority' => 13,

                    'components' => [
                        [
                            'code' => 'event-naming',
                            'name' => 'Event Naming Conventions',
                            'type' => 'page',
                            'route' => '/tenant/analytics/settings/event-naming',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Event Naming'],
                                ['code' => 'manage', 'name' => 'Manage Conventions'],
                            ],
                        ],
                        [
                            'code' => 'funnel-definitions',
                            'name' => 'Funnel Definitions',
                            'type' => 'page',
                            'route' => '/tenant/analytics/settings/funnels',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Funnel Definitions'],
                                ['code' => 'manage', 'name' => 'Manage Funnels'],
                            ],
                        ],
                        [
                            'code' => 'attribution-windows',
                            'name' => 'Attribution Windows',
                            'type' => 'page',
                            'route' => '/tenant/analytics/settings/attribution',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Attribution Settings'],
                                ['code' => 'configure', 'name' => 'Configure Attribution'],
                            ],
                        ],
                        [
                            'code' => 'data-retention',
                            'name' => 'Data Retention Settings',
                            'type' => 'page',
                            'route' => '/tenant/analytics/settings/data-retention',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Retention Settings'],
                                ['code' => 'configure', 'name' => 'Configure Retention'],
                            ],
                        ],
                        [
                            'code' => 'sampling-rules',
                            'name' => 'Sampling Rules',
                            'type' => 'page',
                            'route' => '/tenant/analytics/settings/sampling',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sampling Rules'],
                                ['code' => 'configure', 'name' => 'Configure Sampling'],
                            ],
                        ],
                        [
                            'code' => 'anomaly-detection',
                            'name' => 'Anomaly Detection Settings',
                            'type' => 'page',
                            'route' => '/tenant/analytics/settings/anomaly',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Anomaly Settings'],
                                ['code' => 'configure', 'name' => 'Configure Detection'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | Integrations Module (Enterprise-Grade)
        |--------------------------------------------------------------------------
        | Section 10 - Integrations
        | Tenant-scoped integration connectors, sync engines, and API management.
        | 5 Submodules: Third-Party Connectors, Productivity Integrations,
        |               API & Webhooks, Data Sync Engines, Developer Tools
        */
        [
            'code' => 'integrations',
            'name' => 'Integrations',
            'description' => 'Third-party connectors, API management, data sync engines, and developer tools',
            'icon' => 'ArrowsRightLeftIcon',
            'route_prefix' => '/tenant/integrations',
            'category' => 'system_administration',
            'priority' => 80,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'business',
            'license_type' => 'standard',
            'dependencies' => ['core'],
            'release_date' => '2024-01-01',

            'submodules' => [
                /*
                |--------------------------------------------------------------------------
                | 10.1 Third-Party Connectors
                |--------------------------------------------------------------------------
                | Components: Payment Gateways (Stripe, PayPal, SSLCOMMERZ, bKash/Nagad),
                |            Communication (SMTP, SMS, WhatsApp), Cloud Storage (S3, GCS, etc.)
                */
                [
                    'code' => 'third-party-connectors',
                    'name' => 'Third-Party Connectors',
                    'description' => 'Payment gateways, communication providers, and cloud storage',
                    'icon' => 'LinkIcon',
                    'route' => '/tenant/integrations/connectors',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'connector-dashboard',
                            'name' => 'Connector Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Connectors'],
                            ],
                        ],
                        // Payment Gateways
                        [
                            'code' => 'payment-gateways',
                            'name' => 'Payment Gateways',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/payments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Payment Gateways'],
                                ['code' => 'configure', 'name' => 'Configure Gateway'],
                                ['code' => 'toggle-mode', 'name' => 'Toggle Test/Live Mode'],
                                ['code' => 'rotate-keys', 'name' => 'Rotate API Keys'],
                                ['code' => 'view-logs', 'name' => 'View Transaction Logs'],
                                ['code' => 'delete', 'name' => 'Delete Configuration'],
                            ],
                        ],
                        [
                            'code' => 'stripe-config',
                            'name' => 'Stripe Configuration',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/payments/stripe',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Stripe Settings'],
                                ['code' => 'configure', 'name' => 'Configure Stripe'],
                                ['code' => 'webhook-config', 'name' => 'Configure Webhooks'],
                            ],
                        ],
                        [
                            'code' => 'paypal-config',
                            'name' => 'PayPal Configuration',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/payments/paypal',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View PayPal Settings'],
                                ['code' => 'configure', 'name' => 'Configure PayPal'],
                            ],
                        ],
                        [
                            'code' => 'sslcommerz-config',
                            'name' => 'SSLCOMMERZ Configuration',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/payments/sslcommerz',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SSLCOMMERZ Settings'],
                                ['code' => 'configure', 'name' => 'Configure SSLCOMMERZ'],
                            ],
                        ],
                        [
                            'code' => 'bkash-nagad-config',
                            'name' => 'bKash/Nagad Configuration',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/payments/mobile-wallet',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Mobile Wallet Settings'],
                                ['code' => 'configure', 'name' => 'Configure Mobile Wallet'],
                            ],
                        ],
                        // Communication Providers
                        [
                            'code' => 'communication-providers',
                            'name' => 'Communication Providers',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/communication',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Providers'],
                                ['code' => 'add', 'name' => 'Add Provider'],
                                ['code' => 'edit', 'name' => 'Edit Credentials'],
                                ['code' => 'test', 'name' => 'Test Connection'],
                                ['code' => 'activate', 'name' => 'Activate Provider'],
                                ['code' => 'deactivate', 'name' => 'Deactivate Provider'],
                                ['code' => 'view-logs', 'name' => 'View Delivery Logs'],
                                ['code' => 'delete', 'name' => 'Delete Provider'],
                            ],
                        ],
                        [
                            'code' => 'smtp-email',
                            'name' => 'SMTP Email Configuration',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/communication/smtp',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SMTP Settings'],
                                ['code' => 'configure', 'name' => 'Configure SMTP'],
                                ['code' => 'test', 'name' => 'Send Test Email'],
                            ],
                        ],
                        [
                            'code' => 'sms-providers',
                            'name' => 'SMS Providers',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/communication/sms',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SMS Providers'],
                                ['code' => 'configure', 'name' => 'Configure Provider'],
                                ['code' => 'sender-id', 'name' => 'Setup Sender ID'],
                                ['code' => 'template-mapping', 'name' => 'Map Templates'],
                            ],
                        ],
                        [
                            'code' => 'whatsapp-config',
                            'name' => 'WhatsApp Cloud API',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/communication/whatsapp',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View WhatsApp Settings'],
                                ['code' => 'configure', 'name' => 'Configure WhatsApp'],
                                ['code' => 'template-mapping', 'name' => 'Map Templates'],
                            ],
                        ],
                        // Cloud Storage
                        [
                            'code' => 'cloud-storage',
                            'name' => 'Cloud Storage',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/storage',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Storage Providers'],
                                ['code' => 'configure', 'name' => 'Configure Storage'],
                                ['code' => 'validate', 'name' => 'Validate Bucket'],
                                ['code' => 'activate', 'name' => 'Activate Storage'],
                                ['code' => 'deactivate', 'name' => 'Deactivate Storage'],
                                ['code' => 'view-logs', 'name' => 'View Sync Logs'],
                            ],
                        ],
                        [
                            'code' => 'aws-s3-config',
                            'name' => 'AWS S3 Configuration',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/storage/s3',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View S3 Settings'],
                                ['code' => 'configure', 'name' => 'Configure S3'],
                                ['code' => 'test-sync', 'name' => 'Test File Sync'],
                            ],
                        ],
                        [
                            'code' => 'gcs-config',
                            'name' => 'Google Cloud Storage Configuration',
                            'type' => 'page',
                            'route' => '/tenant/integrations/connectors/storage/gcs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View GCS Settings'],
                                ['code' => 'configure', 'name' => 'Configure GCS'],
                            ],
                        ],
                        [
                            'code' => 'storage-usage',
                            'name' => 'Storage Usage Meter',
                            'type' => 'widget',
                            'route' => null,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Storage Usage'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 10.2 Productivity Integrations
                |--------------------------------------------------------------------------
                | Components: Google Workspace, Microsoft 365, Slack/Teams
                */
                [
                    'code' => 'productivity-integrations',
                    'name' => 'Productivity Integrations',
                    'description' => 'Google Workspace, Microsoft 365, Slack, and Teams integrations',
                    'icon' => 'CalendarDaysIcon',
                    'route' => '/tenant/integrations/productivity',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'productivity-dashboard',
                            'name' => 'Productivity Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/integrations/productivity',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Integrations'],
                            ],
                        ],
                        // Google Workspace
                        [
                            'code' => 'google-workspace',
                            'name' => 'Google Workspace',
                            'type' => 'page',
                            'route' => '/tenant/integrations/productivity/google',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Google Workspace'],
                                ['code' => 'connect', 'name' => 'Connect Workspace'],
                                ['code' => 'disconnect', 'name' => 'Disconnect Workspace'],
                                ['code' => 'sync-calendar', 'name' => 'Sync Calendar'],
                                ['code' => 'sync-contacts', 'name' => 'Sync Contacts'],
                                ['code' => 'drive-access', 'name' => 'Configure Drive Access'],
                                ['code' => 'view-logs', 'name' => 'View Sync Logs'],
                            ],
                        ],
                        [
                            'code' => 'google-oauth',
                            'name' => 'Google OAuth Setup',
                            'type' => 'section',
                            'route' => '/tenant/integrations/productivity/google/oauth',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View OAuth Settings'],
                                ['code' => 'configure', 'name' => 'Configure OAuth'],
                            ],
                        ],
                        // Microsoft 365
                        [
                            'code' => 'microsoft-365',
                            'name' => 'Microsoft 365',
                            'type' => 'page',
                            'route' => '/tenant/integrations/productivity/microsoft',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Microsoft 365'],
                                ['code' => 'connect', 'name' => 'Connect Microsoft Account'],
                                ['code' => 're-auth', 'name' => 'Re-authenticate'],
                                ['code' => 'sync-now', 'name' => 'Sync Now'],
                                ['code' => 'disconnect', 'name' => 'Remove Connection'],
                            ],
                        ],
                        [
                            'code' => 'outlook-calendar',
                            'name' => 'Outlook Calendar Sync',
                            'type' => 'section',
                            'route' => '/tenant/integrations/productivity/microsoft/calendar',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Calendar Sync'],
                                ['code' => 'configure', 'name' => 'Configure Sync'],
                            ],
                        ],
                        [
                            'code' => 'onedrive-sync',
                            'name' => 'OneDrive Sync',
                            'type' => 'section',
                            'route' => '/tenant/integrations/productivity/microsoft/onedrive',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View OneDrive Sync'],
                                ['code' => 'configure', 'name' => 'Configure Sync'],
                            ],
                        ],
                        // Slack & Teams
                        [
                            'code' => 'slack-integration',
                            'name' => 'Slack Integration',
                            'type' => 'page',
                            'route' => '/tenant/integrations/productivity/slack',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Slack Integration'],
                                ['code' => 'connect', 'name' => 'Connect Workspace'],
                                ['code' => 'map-channel', 'name' => 'Map Channel'],
                                ['code' => 'test-message', 'name' => 'Send Test Message'],
                                ['code' => 'disconnect', 'name' => 'Disconnect'],
                            ],
                        ],
                        [
                            'code' => 'slack-webhooks',
                            'name' => 'Slack Webhooks',
                            'type' => 'section',
                            'route' => '/tenant/integrations/productivity/slack/webhooks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Webhooks'],
                                ['code' => 'configure', 'name' => 'Configure Webhooks'],
                            ],
                        ],
                        [
                            'code' => 'teams-integration',
                            'name' => 'Microsoft Teams Integration',
                            'type' => 'page',
                            'route' => '/tenant/integrations/productivity/teams',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Teams Integration'],
                                ['code' => 'connect', 'name' => 'Connect Teams'],
                                ['code' => 'map-channel', 'name' => 'Map Channel'],
                                ['code' => 'test-message', 'name' => 'Send Test Message'],
                                ['code' => 'disconnect', 'name' => 'Disconnect'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 10.3 API & Webhook System
                |--------------------------------------------------------------------------
                | Components: API Keys Management, Outgoing Webhooks, Incoming Webhooks
                */
                [
                    'code' => 'api-webhooks',
                    'name' => 'API & Webhooks',
                    'description' => 'API key management, outgoing webhooks, and incoming data sources',
                    'icon' => 'KeyIcon',
                    'route' => '/tenant/integrations/api',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'api-dashboard',
                            'name' => 'API Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/integrations/api',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View API Dashboard'],
                            ],
                        ],
                        // API Keys
                        [
                            'code' => 'api-keys',
                            'name' => 'API Keys Management',
                            'type' => 'page',
                            'route' => '/tenant/integrations/api/keys',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View API Keys'],
                                ['code' => 'create', 'name' => 'Create API Key'],
                                ['code' => 'rotate', 'name' => 'Rotate Key'],
                                ['code' => 'disable', 'name' => 'Disable Key'],
                                ['code' => 'set-rate-limits', 'name' => 'Set Rate Limits'],
                                ['code' => 'set-expiry', 'name' => 'Set Key Expiry'],
                                ['code' => 'scope-selection', 'name' => 'Select Module Scopes'],
                                ['code' => 'delete', 'name' => 'Delete Key'],
                            ],
                        ],
                        [
                            'code' => 'api-key-scopes',
                            'name' => 'API Key Scopes',
                            'type' => 'section',
                            'route' => '/tenant/integrations/api/keys/scopes',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Scopes'],
                                ['code' => 'configure', 'name' => 'Configure Scopes'],
                            ],
                        ],
                        // Outgoing Webhooks
                        [
                            'code' => 'outgoing-webhooks',
                            'name' => 'Outgoing Webhooks',
                            'type' => 'page',
                            'route' => '/tenant/integrations/api/webhooks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Webhooks'],
                                ['code' => 'create', 'name' => 'Create Webhook'],
                                ['code' => 'edit', 'name' => 'Edit Endpoint'],
                                ['code' => 'pause', 'name' => 'Pause Webhook'],
                                ['code' => 'resume', 'name' => 'Resume Webhook'],
                                ['code' => 'retry', 'name' => 'Retry Delivery'],
                                ['code' => 'delete', 'name' => 'Delete Webhook'],
                            ],
                        ],
                        [
                            'code' => 'webhook-events',
                            'name' => 'Webhook Event Topics',
                            'type' => 'section',
                            'route' => '/tenant/integrations/api/webhooks/events',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Event Topics'],
                                ['code' => 'subscribe', 'name' => 'Subscribe to Events'],
                            ],
                        ],
                        [
                            'code' => 'webhook-delivery-logs',
                            'name' => 'Webhook Delivery Logs',
                            'type' => 'page',
                            'route' => '/tenant/integrations/api/webhooks/logs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Delivery Logs'],
                                ['code' => 'retry-failed', 'name' => 'Retry Failed Events'],
                            ],
                        ],
                        // Incoming Webhooks
                        [
                            'code' => 'incoming-webhooks',
                            'name' => 'Incoming Webhooks (Data Sources)',
                            'type' => 'page',
                            'route' => '/tenant/integrations/api/incoming',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Incoming Hooks'],
                                ['code' => 'create', 'name' => 'Create Incoming Hook'],
                                ['code' => 'validate', 'name' => 'Validate Payload'],
                                ['code' => 'map-fields', 'name' => 'Map Fields'],
                                ['code' => 'view-logs', 'name' => 'View Event Logs'],
                                ['code' => 'delete', 'name' => 'Delete Mapping'],
                            ],
                        ],
                        [
                            'code' => 'incoming-auth',
                            'name' => 'Incoming Webhook Authentication',
                            'type' => 'section',
                            'route' => '/tenant/integrations/api/incoming/auth',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Auth Settings'],
                                ['code' => 'configure', 'name' => 'Configure Token Auth'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 10.4 Data Sync Engines
                |--------------------------------------------------------------------------
                | Components: CRM Sync (HubSpot, Zoho, Salesforce),
                |            E-commerce Sync (Shopify, WooCommerce, Magento),
                |            Accounting Sync (QuickBooks, Xero)
                */
                [
                    'code' => 'data-sync',
                    'name' => 'Data Sync Engines',
                    'description' => 'CRM, E-commerce, and Accounting sync engines',
                    'icon' => 'ArrowPathIcon',
                    'route' => '/tenant/integrations/sync',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'sync-dashboard',
                            'name' => 'Sync Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sync Dashboard'],
                            ],
                        ],
                        // CRM Sync
                        [
                            'code' => 'crm-sync',
                            'name' => 'CRM Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/crm',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View CRM Sync'],
                                ['code' => 'connect', 'name' => 'Connect CRM'],
                                ['code' => 'sync-contacts', 'name' => 'Sync Contacts'],
                                ['code' => 'sync-leads', 'name' => 'Sync Leads'],
                                ['code' => 'sync-pipeline', 'name' => 'Sync Pipeline'],
                                ['code' => 'set-direction', 'name' => 'Set Sync Direction'],
                                ['code' => 'conflict-policy', 'name' => 'Set Conflict Policy'],
                                ['code' => 'disconnect', 'name' => 'Disconnect CRM'],
                                ['code' => 'view-logs', 'name' => 'View Sync Logs'],
                            ],
                        ],
                        [
                            'code' => 'hubspot-sync',
                            'name' => 'HubSpot Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/crm/hubspot',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View HubSpot Settings'],
                                ['code' => 'configure', 'name' => 'Configure HubSpot'],
                            ],
                        ],
                        [
                            'code' => 'zoho-sync',
                            'name' => 'Zoho CRM Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/crm/zoho',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Zoho Settings'],
                                ['code' => 'configure', 'name' => 'Configure Zoho'],
                            ],
                        ],
                        [
                            'code' => 'salesforce-sync',
                            'name' => 'Salesforce Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/crm/salesforce',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Salesforce Settings'],
                                ['code' => 'configure', 'name' => 'Configure Salesforce'],
                            ],
                        ],
                        // E-commerce Sync
                        [
                            'code' => 'ecommerce-sync',
                            'name' => 'E-commerce Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/ecommerce',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View E-commerce Sync'],
                                ['code' => 'connect', 'name' => 'Connect Store'],
                                ['code' => 'sync-products', 'name' => 'Sync Products'],
                                ['code' => 'pull-orders', 'name' => 'Pull Orders'],
                                ['code' => 'update-inventory', 'name' => 'Update Inventory'],
                                ['code' => 'price-mapping', 'name' => 'Map Prices'],
                                ['code' => 'disconnect', 'name' => 'Disconnect Store'],
                            ],
                        ],
                        [
                            'code' => 'shopify-sync',
                            'name' => 'Shopify Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/ecommerce/shopify',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Shopify Settings'],
                                ['code' => 'configure', 'name' => 'Configure Shopify'],
                            ],
                        ],
                        [
                            'code' => 'woocommerce-sync',
                            'name' => 'WooCommerce Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/ecommerce/woocommerce',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View WooCommerce Settings'],
                                ['code' => 'configure', 'name' => 'Configure WooCommerce'],
                            ],
                        ],
                        [
                            'code' => 'magento-sync',
                            'name' => 'Magento Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/ecommerce/magento',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Magento Settings'],
                                ['code' => 'configure', 'name' => 'Configure Magento'],
                            ],
                        ],
                        // Accounting Sync
                        [
                            'code' => 'accounting-sync',
                            'name' => 'Accounting Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/accounting',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Accounting Sync'],
                                ['code' => 'connect', 'name' => 'Connect Accounting App'],
                                ['code' => 'map-accounts', 'name' => 'Map Chart of Accounts'],
                                ['code' => 'sync-invoices', 'name' => 'Sync Invoices'],
                                ['code' => 'sync-payments', 'name' => 'Sync Payments'],
                                ['code' => 'tax-rules', 'name' => 'Map Tax Rules'],
                                ['code' => 'disconnect', 'name' => 'Disconnect'],
                                ['code' => 'view-logs', 'name' => 'View Sync Logs'],
                            ],
                        ],
                        [
                            'code' => 'quickbooks-sync',
                            'name' => 'QuickBooks Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/accounting/quickbooks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View QuickBooks Settings'],
                                ['code' => 'configure', 'name' => 'Configure QuickBooks'],
                            ],
                        ],
                        [
                            'code' => 'xero-sync',
                            'name' => 'Xero Sync',
                            'type' => 'page',
                            'route' => '/tenant/integrations/sync/accounting/xero',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Xero Settings'],
                                ['code' => 'configure', 'name' => 'Configure Xero'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 10.5 Developer Tools
                |--------------------------------------------------------------------------
                | Components: Webhook Tester, API Playground, Integration Logs
                */
                [
                    'code' => 'developer-tools',
                    'name' => 'Developer Tools',
                    'description' => 'Webhook tester, API playground, and integration logs',
                    'icon' => 'WrenchScrewdriverIcon',
                    'route' => '/tenant/integrations/developer',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'dev-dashboard',
                            'name' => 'Developer Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/integrations/developer',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Developer Tools'],
                            ],
                        ],
                        // Webhook Tester
                        [
                            'code' => 'webhook-tester',
                            'name' => 'Webhook Tester',
                            'type' => 'page',
                            'route' => '/tenant/integrations/developer/webhook-tester',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Webhook Tester'],
                                ['code' => 'preview-payload', 'name' => 'Preview Payload'],
                                ['code' => 'retry-send', 'name' => 'Retry Send'],
                                ['code' => 'validate-signature', 'name' => 'Validate Signature'],
                            ],
                        ],
                        // API Playground
                        [
                            'code' => 'api-playground',
                            'name' => 'API Playground',
                            'type' => 'page',
                            'route' => '/tenant/integrations/developer/api-playground',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View API Playground'],
                                ['code' => 'test-endpoint', 'name' => 'Test Endpoint'],
                                ['code' => 'view-rate-limits', 'name' => 'View Rate Limits'],
                            ],
                        ],
                        [
                            'code' => 'api-docs-viewer',
                            'name' => 'API Documentation (Swagger/Redoc)',
                            'type' => 'page',
                            'route' => '/tenant/integrations/developer/docs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View API Docs'],
                            ],
                        ],
                        // Integration Logs
                        [
                            'code' => 'integration-logs',
                            'name' => 'Integration Logs',
                            'type' => 'page',
                            'route' => '/tenant/integrations/developer/logs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Logs'],
                                ['code' => 'filter', 'name' => 'Filter Logs'],
                                ['code' => 'export', 'name' => 'Export Logs'],
                                ['code' => 'clear', 'name' => 'Clear Logs'],
                            ],
                        ],
                        [
                            'code' => 'success-logs',
                            'name' => 'Success Logs',
                            'type' => 'section',
                            'route' => '/tenant/integrations/developer/logs/success',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Success Logs'],
                            ],
                        ],
                        [
                            'code' => 'error-logs',
                            'name' => 'Error Logs',
                            'type' => 'section',
                            'route' => '/tenant/integrations/developer/logs/errors',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Error Logs'],
                            ],
                        ],
                        [
                            'code' => 'retry-logs',
                            'name' => 'Retry Logs',
                            'type' => 'section',
                            'route' => '/tenant/integrations/developer/logs/retries',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Retry Logs'],
                            ],
                        ],
                        [
                            'code' => 'request-inspector',
                            'name' => 'Request/Response Inspector',
                            'type' => 'page',
                            'route' => '/tenant/integrations/developer/inspector',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Request Inspector'],
                                ['code' => 'inspect', 'name' => 'Inspect Request/Response'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | Section 11 - Support & Ticketing
        |--------------------------------------------------------------------------
        | Tenant-scoped support and ticketing system with multi-channel support,
        | knowledge base, SLA management, and customer feedback.
        | 9 Submodules: Ticket Management, Departments, Routing & SLA, Knowledge Base,
        |               Canned Responses, Analytics, Feedback, Multi-Channel, Admin Tools
        */
        [
            'code' => 'support',
            'name' => 'Customer Support',
            'description' => 'Customer service help desk - Tenants provide support TO their customers (product questions, order issues, service requests)',
            'icon' => 'LifebuoyIcon',
            'route_prefix' => '/tenant/support',
            'category' => 'customer_relations',
            'priority' => 85,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'professional',
            'license_type' => 'standard',
            'dependencies' => ['core', 'crm'],
            'release_date' => '2024-01-01',

            'submodules' => [
                /*
                |--------------------------------------------------------------------------
                | 11.1 Ticket Management
                |--------------------------------------------------------------------------
                | Components: All Tickets, My Tickets, Assigned Tickets, SLA Violations,
                |            Ticket Categories, Ticket Priorities
                */
                [
                    'code' => 'ticket-management',
                    'name' => 'Ticket Management',
                    'description' => 'Manage support tickets, assignments, and SLA tracking',
                    'icon' => 'TicketIcon',
                    'route' => '/tenant/support/tickets',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'all-tickets',
                            'name' => 'All Tickets',
                            'type' => 'page',
                            'route' => '/tenant/support/tickets',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View All Tickets'],
                                ['code' => 'create', 'name' => 'Create Ticket'],
                                ['code' => 'reply', 'name' => 'Reply to Ticket'],
                                ['code' => 'add-internal-note', 'name' => 'Add Internal Note'],
                                ['code' => 'assign', 'name' => 'Assign Ticket'],
                                ['code' => 'change-status', 'name' => 'Change Status'],
                                ['code' => 'change-priority', 'name' => 'Change Priority'],
                                ['code' => 'add-tags', 'name' => 'Add Tags'],
                                ['code' => 'upload-attachment', 'name' => 'Upload Attachment'],
                                ['code' => 'merge', 'name' => 'Merge Tickets'],
                                ['code' => 'delete', 'name' => 'Delete Ticket'],
                                ['code' => 'close', 'name' => 'Close Ticket'],
                            ],
                        ],
                        [
                            'code' => 'my-tickets',
                            'name' => 'My Tickets',
                            'type' => 'page',
                            'route' => '/tenant/support/tickets/my',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View My Tickets'],
                            ],
                        ],
                        [
                            'code' => 'assigned-tickets',
                            'name' => 'Assigned Tickets',
                            'type' => 'page',
                            'route' => '/tenant/support/tickets/assigned',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Assigned Tickets'],
                            ],
                        ],
                        [
                            'code' => 'ticket-detail',
                            'name' => 'Ticket Detail',
                            'type' => 'page',
                            'route' => '/tenant/support/tickets/{id}',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Ticket Detail'],
                            ],
                        ],
                        [
                            'code' => 'sla-violations',
                            'name' => 'SLA Violations',
                            'type' => 'page',
                            'route' => '/tenant/support/tickets/sla-violations',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SLA Violations'],
                            ],
                        ],
                        [
                            'code' => 'ticket-categories',
                            'name' => 'Ticket Categories',
                            'type' => 'page',
                            'route' => '/tenant/support/tickets/categories',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Categories'],
                                ['code' => 'create', 'name' => 'Create Category'],
                                ['code' => 'update', 'name' => 'Update Category'],
                                ['code' => 'delete', 'name' => 'Delete Category'],
                            ],
                        ],
                        [
                            'code' => 'ticket-priorities',
                            'name' => 'Ticket Priorities',
                            'type' => 'page',
                            'route' => '/tenant/support/tickets/priorities',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Priorities'],
                                ['code' => 'create', 'name' => 'Create Priority'],
                                ['code' => 'update', 'name' => 'Update Priority'],
                                ['code' => 'delete', 'name' => 'Delete Priority'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 11.2 Department & Agent Management
                |--------------------------------------------------------------------------
                | Components: Departments, Agents, Agent Roles, Working Hours,
                |            Escalation Paths, Load Balancing
                */
                [
                    'code' => 'department-agent',
                    'name' => 'Department & Agent Management',
                    'description' => 'Manage support departments, agents, and assignments',
                    'icon' => 'UserGroupIcon',
                    'route' => '/tenant/support/departments',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'departments',
                            'name' => 'Departments',
                            'type' => 'page',
                            'route' => '/tenant/support/departments',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Departments'],
                                ['code' => 'create', 'name' => 'Create Department'],
                                ['code' => 'update', 'name' => 'Update Department'],
                                ['code' => 'delete', 'name' => 'Delete Department'],
                            ],
                        ],
                        [
                            'code' => 'agents',
                            'name' => 'Support Agents',
                            'type' => 'page',
                            'route' => '/tenant/support/agents',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Agents'],
                                ['code' => 'add', 'name' => 'Add Agent'],
                                ['code' => 'remove', 'name' => 'Remove Agent'],
                                ['code' => 'set-availability', 'name' => 'Set Agent Availability'],
                                ['code' => 'assign-department', 'name' => 'Assign to Department'],
                            ],
                        ],
                        [
                            'code' => 'agent-roles',
                            'name' => 'Agent Roles',
                            'type' => 'page',
                            'route' => '/tenant/support/agent-roles',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Agent Roles'],
                                ['code' => 'create', 'name' => 'Create Agent Role'],
                                ['code' => 'update', 'name' => 'Update Agent Role'],
                                ['code' => 'delete', 'name' => 'Delete Agent Role'],
                            ],
                        ],
                        [
                            'code' => 'schedules',
                            'name' => 'Working Hours & Schedules',
                            'type' => 'page',
                            'route' => '/tenant/support/schedules',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Schedules'],
                                ['code' => 'update', 'name' => 'Update Schedule'],
                            ],
                        ],
                        [
                            'code' => 'auto-assign',
                            'name' => 'Auto-Assign Rules',
                            'type' => 'page',
                            'route' => '/tenant/support/auto-assign',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Auto-Assign Rules'],
                                ['code' => 'configure', 'name' => 'Configure Auto-Assign'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 11.3 Ticket Routing & SLA
                |--------------------------------------------------------------------------
                | Components: SLA Policies, Auto-Assign Rules, Escalation Rules,
                |            Priority-based SLA, Department-based Routing
                */
                [
                    'code' => 'routing-sla',
                    'name' => 'Routing & SLA',
                    'description' => 'SLA policies, routing rules, and escalation management',
                    'icon' => 'ClockIcon',
                    'route' => '/tenant/support/sla',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'sla-policies',
                            'name' => 'SLA Policies',
                            'type' => 'page',
                            'route' => '/tenant/support/sla/policies',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SLA Policies'],
                                ['code' => 'create', 'name' => 'Create SLA Policy'],
                                ['code' => 'update', 'name' => 'Update SLA Policy'],
                                ['code' => 'delete', 'name' => 'Delete SLA Policy'],
                                ['code' => 'assign', 'name' => 'Assign SLA to Category/Priority'],
                            ],
                        ],
                        [
                            'code' => 'routing-rules',
                            'name' => 'Routing Rules',
                            'type' => 'page',
                            'route' => '/tenant/support/sla/routing',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Routing Rules'],
                                ['code' => 'create', 'name' => 'Create Routing Rule'],
                                ['code' => 'update', 'name' => 'Update Routing Rule'],
                                ['code' => 'delete', 'name' => 'Delete Routing Rule'],
                            ],
                        ],
                        [
                            'code' => 'escalation-rules',
                            'name' => 'Escalation Rules',
                            'type' => 'page',
                            'route' => '/tenant/support/sla/escalation',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Escalation Rules'],
                                ['code' => 'create', 'name' => 'Create Escalation Rule'],
                                ['code' => 'update', 'name' => 'Update Escalation Rule'],
                                ['code' => 'delete', 'name' => 'Delete Escalation Rule'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 11.4 Knowledge Base
                |--------------------------------------------------------------------------
                | Components: KB Categories, KB Articles, Article Templates,
                |            Versioning, Article Analytics, Visibility Control
                */
                [
                    'code' => 'knowledge-base',
                    'name' => 'Knowledge Base',
                    'description' => 'Self-service knowledge base with articles and categories',
                    'icon' => 'BookOpenIcon',
                    'route' => '/tenant/support/kb',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'kb-categories',
                            'name' => 'KB Categories',
                            'type' => 'page',
                            'route' => '/tenant/support/kb/categories',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Categories'],
                                ['code' => 'create', 'name' => 'Create Category'],
                                ['code' => 'update', 'name' => 'Update Category'],
                                ['code' => 'delete', 'name' => 'Delete Category'],
                            ],
                        ],
                        [
                            'code' => 'kb-articles',
                            'name' => 'KB Articles',
                            'type' => 'page',
                            'route' => '/tenant/support/kb/articles',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Articles'],
                                ['code' => 'create', 'name' => 'Create Article'],
                                ['code' => 'update', 'name' => 'Update Article'],
                                ['code' => 'publish', 'name' => 'Publish Article'],
                                ['code' => 'unpublish', 'name' => 'Unpublish Article'],
                                ['code' => 'delete', 'name' => 'Delete Article'],
                            ],
                        ],
                        [
                            'code' => 'article-templates',
                            'name' => 'Article Templates',
                            'type' => 'page',
                            'route' => '/tenant/support/kb/templates',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Templates'],
                                ['code' => 'create', 'name' => 'Create Template'],
                                ['code' => 'update', 'name' => 'Update Template'],
                                ['code' => 'delete', 'name' => 'Delete Template'],
                            ],
                        ],
                        [
                            'code' => 'article-analytics',
                            'name' => 'Article Analytics',
                            'type' => 'page',
                            'route' => '/tenant/support/kb/analytics',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Article Analytics'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 11.5 Canned Responses (Macros)
                |--------------------------------------------------------------------------
                | Components: Response Templates, Macro Categories,
                |            Placeholder Variables, Visibility Control
                */
                [
                    'code' => 'canned-responses',
                    'name' => 'Canned Responses',
                    'description' => 'Pre-defined response templates and macros',
                    'icon' => 'DocumentDuplicateIcon',
                    'route' => '/tenant/support/canned',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'response-templates',
                            'name' => 'Response Templates',
                            'type' => 'page',
                            'route' => '/tenant/support/canned/templates',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Templates'],
                                ['code' => 'create', 'name' => 'Create Template'],
                                ['code' => 'update', 'name' => 'Update Template'],
                                ['code' => 'delete', 'name' => 'Delete Template'],
                                ['code' => 'categorize', 'name' => 'Categorize Templates'],
                            ],
                        ],
                        [
                            'code' => 'macro-categories',
                            'name' => 'Macro Categories',
                            'type' => 'page',
                            'route' => '/tenant/support/canned/categories',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Categories'],
                                ['code' => 'create', 'name' => 'Create Category'],
                                ['code' => 'update', 'name' => 'Update Category'],
                                ['code' => 'delete', 'name' => 'Delete Category'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 11.6 Reporting & Analytics
                |--------------------------------------------------------------------------
                | Components: Ticket Volume Dashboard, Agent Performance,
                |            SLA Compliance, Customer Satisfaction (CSAT)
                */
                [
                    'code' => 'support-analytics',
                    'name' => 'Reporting & Analytics',
                    'description' => 'Support metrics, performance reports, and SLA compliance',
                    'icon' => 'ChartBarIcon',
                    'route' => '/tenant/support/analytics',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'ticket-volume',
                            'name' => 'Ticket Volume Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/support/analytics/volume',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Ticket Volume'],
                                ['code' => 'export', 'name' => 'Export Report'],
                                ['code' => 'download', 'name' => 'Download Report'],
                            ],
                        ],
                        [
                            'code' => 'agent-performance',
                            'name' => 'Agent Performance',
                            'type' => 'page',
                            'route' => '/tenant/support/analytics/agents',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Agent Performance'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'sla-compliance',
                            'name' => 'SLA Compliance',
                            'type' => 'page',
                            'route' => '/tenant/support/analytics/sla',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SLA Compliance'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                        [
                            'code' => 'csat-reports',
                            'name' => 'Customer Satisfaction',
                            'type' => 'page',
                            'route' => '/tenant/support/analytics/csat',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View CSAT Reports'],
                                ['code' => 'export', 'name' => 'Export Report'],
                                ['code' => 'share', 'name' => 'Share Report'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 11.7 Customer Feedback
                |--------------------------------------------------------------------------
                | Components: CSAT Rating, Feedback Forms, Satisfaction Logs
                */
                [
                    'code' => 'customer-feedback',
                    'name' => 'Customer Feedback',
                    'description' => 'CSAT ratings, feedback forms, and satisfaction tracking',
                    'icon' => 'StarIcon',
                    'route' => '/tenant/support/feedback',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'csat-ratings',
                            'name' => 'CSAT Ratings',
                            'type' => 'page',
                            'route' => '/tenant/support/feedback/ratings',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Ratings'],
                                ['code' => 'export', 'name' => 'Export Feedback'],
                                ['code' => 'mark-resolved', 'name' => 'Mark as Resolved'],
                            ],
                        ],
                        [
                            'code' => 'feedback-forms',
                            'name' => 'Feedback Forms',
                            'type' => 'page',
                            'route' => '/tenant/support/feedback/forms',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Forms'],
                                ['code' => 'create', 'name' => 'Create Form'],
                                ['code' => 'update', 'name' => 'Update Form'],
                                ['code' => 'delete', 'name' => 'Delete Form'],
                            ],
                        ],
                        [
                            'code' => 'satisfaction-logs',
                            'name' => 'Satisfaction Logs',
                            'type' => 'page',
                            'route' => '/tenant/support/feedback/logs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Satisfaction Logs'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 11.8 Multi-Channel Support
                |--------------------------------------------------------------------------
                | Components: Email-to-Ticket, Chat Widget, WhatsApp Support,
                |            SMS Support, Channel Mapping
                */
                [
                    'code' => 'multi-channel',
                    'name' => 'Multi-Channel Support',
                    'description' => 'Email, chat, WhatsApp, and SMS support channels',
                    'icon' => 'ChatBubbleLeftRightIcon',
                    'route' => '/tenant/support/channels',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'email-channel',
                            'name' => 'Email-to-Ticket',
                            'type' => 'page',
                            'route' => '/tenant/support/channels/email',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Email Channel'],
                                ['code' => 'configure', 'name' => 'Configure Email Channel'],
                                ['code' => 'disable', 'name' => 'Disable Channel'],
                            ],
                        ],
                        [
                            'code' => 'chat-widget',
                            'name' => 'Chat Widget',
                            'type' => 'page',
                            'route' => '/tenant/support/channels/chat',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Chat Widget'],
                                ['code' => 'configure', 'name' => 'Configure Chat Widget'],
                                ['code' => 'disable', 'name' => 'Disable Widget'],
                            ],
                        ],
                        [
                            'code' => 'whatsapp-channel',
                            'name' => 'WhatsApp Support',
                            'type' => 'page',
                            'route' => '/tenant/support/channels/whatsapp',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View WhatsApp Channel'],
                                ['code' => 'connect', 'name' => 'Connect WhatsApp'],
                                ['code' => 'configure', 'name' => 'Configure WhatsApp'],
                                ['code' => 'disable', 'name' => 'Disable Channel'],
                            ],
                        ],
                        [
                            'code' => 'sms-channel',
                            'name' => 'SMS Support',
                            'type' => 'page',
                            'route' => '/tenant/support/channels/sms',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SMS Channel'],
                                ['code' => 'configure', 'name' => 'Configure SMS'],
                                ['code' => 'disable', 'name' => 'Disable Channel'],
                            ],
                        ],
                        [
                            'code' => 'channel-logs',
                            'name' => 'Channel Logs',
                            'type' => 'page',
                            'route' => '/tenant/support/channels/logs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Channel Logs'],
                            ],
                        ],
                    ],
                ],

                /*
                |--------------------------------------------------------------------------
                | 11.9 Admin Tools
                |--------------------------------------------------------------------------
                | Components: Ticket Tags, Custom Fields, Ticket Forms (Dynamic),
                |            Form-level Validation, Category-specific Forms
                */
                [
                    'code' => 'support-admin-tools',
                    'name' => 'Admin Tools',
                    'description' => 'Ticket customization, tags, custom fields, and dynamic forms',
                    'icon' => 'WrenchScrewdriverIcon',
                    'route' => '/tenant/support/tools',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'ticket-tags',
                            'name' => 'Ticket Tags',
                            'type' => 'page',
                            'route' => '/tenant/support/tools/tags',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tags'],
                                ['code' => 'create', 'name' => 'Create Tag'],
                                ['code' => 'update', 'name' => 'Update Tag'],
                                ['code' => 'delete', 'name' => 'Delete Tag'],
                            ],
                        ],
                        [
                            'code' => 'custom-fields',
                            'name' => 'Custom Fields',
                            'type' => 'page',
                            'route' => '/tenant/support/tools/fields',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Fields'],
                                ['code' => 'create', 'name' => 'Create Field'],
                                ['code' => 'update', 'name' => 'Update Field'],
                                ['code' => 'delete', 'name' => 'Delete Field'],
                            ],
                        ],
                        [
                            'code' => 'ticket-forms',
                            'name' => 'Ticket Forms',
                            'type' => 'page',
                            'route' => '/tenant/support/tools/forms',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Forms'],
                                ['code' => 'create', 'name' => 'Create Form'],
                                ['code' => 'update', 'name' => 'Update Form'],
                                ['code' => 'delete', 'name' => 'Delete Form'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 12. Document Management System (DMS)
        |--------------------------------------------------------------------------
        | Purpose: Document storage, version control, sharing, and e-signatures
        | Category: document_management
        | Route: /tenant/dms
        */
        [
            'code' => 'dms',
            'name' => 'Document Management',
            'description' => 'Document storage, version control, workflows, and e-signatures',
            'icon' => 'FolderOpenIcon',
            'route_prefix' => '/tenant/dms',
            'category' => 'document_management',
            'priority' => 90,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'professional',
            'license_type' => 'addon',
            'dependencies' => [],
            'release_date' => '2025-12-05',

            'submodules' => [
                // 12.1 Documents
                [
                    'code' => 'documents',
                    'name' => 'Document Library',
                    'description' => 'Manage documents, folders, and file organization',
                    'icon' => 'DocumentTextIcon',
                    'route' => '/tenant/dms/documents',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'document-list',
                            'name' => 'Document List',
                            'type' => 'page',
                            'route' => '/tenant/dms/documents',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Documents'],
                                ['code' => 'create', 'name' => 'Upload Document'],
                                ['code' => 'update', 'name' => 'Update Document'],
                                ['code' => 'delete', 'name' => 'Delete Document'],
                                ['code' => 'download', 'name' => 'Download Document'],
                                ['code' => 'share', 'name' => 'Share Document'],
                                ['code' => 'move', 'name' => 'Move Document'],
                            ],
                        ],
                    ],
                ],

                // 12.2 Version Control
                [
                    'code' => 'versions',
                    'name' => 'Version Control',
                    'description' => 'Document version history and rollback',
                    'icon' => 'ClockIcon',
                    'route' => '/tenant/dms/versions',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'version-history',
                            'name' => 'Version History',
                            'type' => 'page',
                            'route' => '/tenant/dms/documents/{document}/versions',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Versions'],
                                ['code' => 'create', 'name' => 'Upload New Version'],
                                ['code' => 'download', 'name' => 'Download Version'],
                                ['code' => 'rollback', 'name' => 'Rollback to Version'],
                                ['code' => 'compare', 'name' => 'Compare Versions'],
                            ],
                        ],
                    ],
                ],

                // 12.3 Folders & Organization
                [
                    'code' => 'folders',
                    'name' => 'Folder Management',
                    'description' => 'Create and organize folder hierarchy',
                    'icon' => 'FolderIcon',
                    'route' => '/tenant/dms/folders',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'folder-list',
                            'name' => 'Folder Structure',
                            'type' => 'page',
                            'route' => '/tenant/dms/folders',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Folders'],
                                ['code' => 'create', 'name' => 'Create Folder'],
                                ['code' => 'update', 'name' => 'Update Folder'],
                                ['code' => 'delete', 'name' => 'Delete Folder'],
                                ['code' => 'move', 'name' => 'Move Folder'],
                            ],
                        ],
                    ],
                ],

                // 12.4 Sharing & Permissions
                [
                    'code' => 'sharing',
                    'name' => 'Sharing & Permissions',
                    'description' => 'Share documents with users and external parties',
                    'icon' => 'ShareIcon',
                    'route' => '/tenant/dms/shared',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'shared-documents',
                            'name' => 'Shared With Me',
                            'type' => 'page',
                            'route' => '/tenant/dms/shared',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Shared Documents'],
                                ['code' => 'share', 'name' => 'Share Document'],
                                ['code' => 'revoke', 'name' => 'Revoke Access'],
                            ],
                        ],
                    ],
                ],

                // 12.5 Workflows & Approvals
                [
                    'code' => 'workflows',
                    'name' => 'Document Workflows',
                    'description' => 'Approval workflows for document review',
                    'icon' => 'ArrowPathIcon',
                    'route' => '/tenant/dms/workflows',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'workflow-list',
                            'name' => 'Workflows',
                            'type' => 'page',
                            'route' => '/tenant/dms/workflows',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Workflows'],
                                ['code' => 'create', 'name' => 'Create Workflow'],
                                ['code' => 'update', 'name' => 'Update Workflow'],
                                ['code' => 'delete', 'name' => 'Delete Workflow'],
                                ['code' => 'approve', 'name' => 'Approve Document'],
                                ['code' => 'reject', 'name' => 'Reject Document'],
                            ],
                        ],
                    ],
                ],

                // 12.6 Templates
                [
                    'code' => 'templates',
                    'name' => 'Document Templates',
                    'description' => 'Reusable document templates',
                    'icon' => 'DocumentDuplicateIcon',
                    'route' => '/tenant/dms/templates',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'template-list',
                            'name' => 'Template Library',
                            'type' => 'page',
                            'route' => '/tenant/dms/templates',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Templates'],
                                ['code' => 'create', 'name' => 'Create Template'],
                                ['code' => 'update', 'name' => 'Update Template'],
                                ['code' => 'delete', 'name' => 'Delete Template'],
                                ['code' => 'use', 'name' => 'Use Template'],
                            ],
                        ],
                    ],
                ],

                // 12.7 E-Signatures
                [
                    'code' => 'e-signatures',
                    'name' => 'E-Signatures',
                    'description' => 'Electronic signature requests and tracking',
                    'icon' => 'PencilSquareIcon',
                    'route' => '/tenant/dms/signatures',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'signature-requests',
                            'name' => 'Signature Requests',
                            'type' => 'page',
                            'route' => '/tenant/dms/signatures',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Requests'],
                                ['code' => 'create', 'name' => 'Request Signature'],
                                ['code' => 'sign', 'name' => 'Sign Document'],
                                ['code' => 'cancel', 'name' => 'Cancel Request'],
                            ],
                        ],
                    ],
                ],

                // 12.8 Audit Trail
                [
                    'code' => 'audit-trail',
                    'name' => 'Document Audit Trail',
                    'description' => 'Track all document access and modifications',
                    'icon' => 'ClipboardDocumentCheckIcon',
                    'route' => '/tenant/dms/audit',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'audit-logs',
                            'name' => 'Audit Logs',
                            'type' => 'page',
                            'route' => '/tenant/dms/audit',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Audit Logs'],
                                ['code' => 'export', 'name' => 'Export Logs'],
                            ],
                        ],
                    ],
                ],

                // 12.9 Search & Discovery
                [
                    'code' => 'search',
                    'name' => 'Document Search',
                    'description' => 'Full-text search across all documents',
                    'icon' => 'MagnifyingGlassIcon',
                    'route' => '/tenant/dms/search',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'search-engine',
                            'name' => 'Search',
                            'type' => 'page',
                            'route' => '/tenant/dms/search',
                            'actions' => [
                                ['code' => 'search', 'name' => 'Search Documents'],
                                ['code' => 'advanced-search', 'name' => 'Advanced Search'],
                            ],
                        ],
                    ],
                ],

                // 12.10 Analytics
                [
                    'code' => 'dms-analytics',
                    'name' => 'DMS Analytics',
                    'description' => 'Document usage analytics and insights',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/dms/analytics',
                    'priority' => 10,

                    'components' => [
                        [
                            'code' => 'analytics-dashboard',
                            'name' => 'Analytics Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/dms/analytics',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Analytics'],
                            ],
                        ],
                    ],
                ],

                // 12.11 Settings
                [
                    'code' => 'dms-settings',
                    'name' => 'DMS Settings',
                    'description' => 'Document management system configuration',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/tenant/dms/settings',
                    'priority' => 11,

                    'components' => [
                        [
                            'code' => 'retention-policies',
                            'name' => 'Retention Policies',
                            'type' => 'page',
                            'route' => '/tenant/dms/settings/retention',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Policies'],
                                ['code' => 'create', 'name' => 'Create Policy'],
                                ['code' => 'update', 'name' => 'Update Policy'],
                                ['code' => 'delete', 'name' => 'Delete Policy'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 13. Quality Management System (QMS)
        |--------------------------------------------------------------------------
        | Purpose: Quality control, inspections, NCRs, calibrations, and audits
        | Category: quality_compliance
        | Route: /tenant/quality
        */
        [
            'code' => 'quality',
            'name' => 'Quality Management',
            'description' => 'Quality control, inspections, non-conformance reports, and calibrations',
            'icon' => 'ShieldCheckIcon',
            'route_prefix' => '/tenant/quality',
            'category' => 'quality_compliance',
            'priority' => 91,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'professional',
            'license_type' => 'addon',
            'dependencies' => [],
            'release_date' => '2025-12-05',

            'submodules' => [
                // 13.1 Dashboard
                [
                    'code' => 'dashboard',
                    'name' => 'Quality Dashboard',
                    'description' => 'Overview of quality metrics and KPIs',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/quality/dashboard',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'dashboard-overview',
                            'name' => 'Dashboard Overview',
                            'type' => 'page',
                            'route' => '/tenant/quality/dashboard',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dashboard'],
                            ],
                        ],
                    ],
                ],

                // 13.2 Inspections
                [
                    'code' => 'inspections',
                    'name' => 'Quality Inspections',
                    'description' => 'Conduct and track quality inspections',
                    'icon' => 'ClipboardDocumentCheckIcon',
                    'route' => '/tenant/quality/inspections',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'inspection-list',
                            'name' => 'Inspection List',
                            'type' => 'page',
                            'route' => '/tenant/quality/inspections',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Inspections'],
                                ['code' => 'create', 'name' => 'Create Inspection'],
                                ['code' => 'update', 'name' => 'Update Inspection'],
                                ['code' => 'delete', 'name' => 'Delete Inspection'],
                                ['code' => 'complete', 'name' => 'Complete Inspection'],
                            ],
                        ],
                    ],
                ],

                // 13.3 Non-Conformance Reports (NCR)
                [
                    'code' => 'ncr',
                    'name' => 'Non-Conformance Reports',
                    'description' => 'Track and manage non-conformance issues',
                    'icon' => 'ExclamationTriangleIcon',
                    'route' => '/tenant/quality/ncrs',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'ncr-list',
                            'name' => 'NCR List',
                            'type' => 'page',
                            'route' => '/tenant/quality/ncrs',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View NCRs'],
                                ['code' => 'create', 'name' => 'Create NCR'],
                                ['code' => 'update', 'name' => 'Update NCR'],
                                ['code' => 'delete', 'name' => 'Delete NCR'],
                                ['code' => 'close', 'name' => 'Close NCR'],
                            ],
                        ],
                    ],
                ],

                // 13.4 CAPA (Corrective & Preventive Actions)
                [
                    'code' => 'capa',
                    'name' => 'CAPA Management',
                    'description' => 'Corrective and preventive action management',
                    'icon' => 'WrenchScrewdriverIcon',
                    'route' => '/tenant/quality/capa',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'capa-list',
                            'name' => 'CAPA List',
                            'type' => 'page',
                            'route' => '/tenant/quality/capa',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View CAPA'],
                                ['code' => 'create', 'name' => 'Create CAPA'],
                                ['code' => 'update', 'name' => 'Update CAPA'],
                                ['code' => 'delete', 'name' => 'Delete CAPA'],
                                ['code' => 'implement', 'name' => 'Implement Action'],
                                ['code' => 'verify', 'name' => 'Verify Effectiveness'],
                            ],
                        ],
                    ],
                ],

                // 13.5 Calibrations
                [
                    'code' => 'calibrations',
                    'name' => 'Equipment Calibrations',
                    'description' => 'Track equipment calibration schedules',
                    'icon' => 'WrenchIcon',
                    'route' => '/tenant/quality/calibrations',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'calibration-list',
                            'name' => 'Calibration Records',
                            'type' => 'page',
                            'route' => '/tenant/quality/calibrations',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Calibrations'],
                                ['code' => 'create', 'name' => 'Record Calibration'],
                                ['code' => 'update', 'name' => 'Update Calibration'],
                                ['code' => 'delete', 'name' => 'Delete Calibration'],
                            ],
                        ],
                    ],
                ],

                // 13.6 Quality Audits
                [
                    'code' => 'audits',
                    'name' => 'Quality Audits',
                    'description' => 'Internal and external quality audits',
                    'icon' => 'DocumentMagnifyingGlassIcon',
                    'route' => '/tenant/quality/audits',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'audit-list',
                            'name' => 'Audit List',
                            'type' => 'page',
                            'route' => '/tenant/quality/audits',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Audits'],
                                ['code' => 'create', 'name' => 'Schedule Audit'],
                                ['code' => 'update', 'name' => 'Update Audit'],
                                ['code' => 'delete', 'name' => 'Delete Audit'],
                                ['code' => 'conduct', 'name' => 'Conduct Audit'],
                            ],
                        ],
                    ],
                ],

                // 13.7 Certifications
                [
                    'code' => 'certifications',
                    'name' => 'Quality Certifications',
                    'description' => 'Track ISO and other quality certifications',
                    'icon' => 'AcademicCapIcon',
                    'route' => '/tenant/quality/certifications',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'certification-list',
                            'name' => 'Certifications',
                            'type' => 'page',
                            'route' => '/tenant/quality/certifications',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Certifications'],
                                ['code' => 'create', 'name' => 'Add Certification'],
                                ['code' => 'update', 'name' => 'Update Certification'],
                                ['code' => 'delete', 'name' => 'Delete Certification'],
                            ],
                        ],
                    ],
                ],

                // 13.8 Quality Analytics
                [
                    'code' => 'quality-analytics',
                    'name' => 'Quality Analytics',
                    'description' => 'Quality metrics and trend analysis',
                    'icon' => 'ChartPieIcon',
                    'route' => '/tenant/quality/analytics',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'analytics-dashboard',
                            'name' => 'Analytics',
                            'type' => 'page',
                            'route' => '/tenant/quality/analytics',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Analytics'],
                                ['code' => 'export', 'name' => 'Export Reports'],
                            ],
                        ],
                    ],
                ],

                // 13.9 Quality Settings
                [
                    'code' => 'quality-settings',
                    'name' => 'Quality Settings',
                    'description' => 'Configure quality standards and parameters',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/tenant/quality/settings',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'standards',
                            'name' => 'Quality Standards',
                            'type' => 'page',
                            'route' => '/tenant/quality/settings',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Standards'],
                                ['code' => 'update', 'name' => 'Update Standards'],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 14. Compliance Management System
        |--------------------------------------------------------------------------
        | Purpose: Regulatory compliance, policies, audits, and requirements tracking
        | Category: quality_compliance
        | Route: /tenant/compliance
        */
        [
            'code' => 'compliance',
            'name' => 'Compliance Management',
            'description' => 'Regulatory compliance, policies, risk management, and audit trails',
            'icon' => 'ShieldExclamationIcon',
            'route_prefix' => '/tenant/compliance',
            'category' => 'quality_compliance',
            'priority' => 92,
            'is_core' => false,
            'is_active' => true,
            'version' => '1.0.0',
            'min_plan' => 'professional',
            'license_type' => 'addon',
            'dependencies' => [],
            'release_date' => '2025-12-05',

            'submodules' => [
                // 14.1 Dashboard
                [
                    'code' => 'dashboard',
                    'name' => 'Compliance Dashboard',
                    'description' => 'Overview of compliance status and upcoming deadlines',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/compliance/dashboard',
                    'priority' => 1,

                    'components' => [
                        [
                            'code' => 'dashboard-overview',
                            'name' => 'Dashboard',
                            'type' => 'page',
                            'route' => '/tenant/compliance/dashboard',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dashboard'],
                            ],
                        ],
                    ],
                ],

                // 14.2 Policies
                [
                    'code' => 'policies',
                    'name' => 'Company Policies',
                    'description' => 'Manage organizational policies and procedures',
                    'icon' => 'DocumentTextIcon',
                    'route' => '/tenant/compliance/policies',
                    'priority' => 2,

                    'components' => [
                        [
                            'code' => 'policy-list',
                            'name' => 'Policy Library',
                            'type' => 'page',
                            'route' => '/tenant/compliance/policies',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Policies'],
                                ['code' => 'create', 'name' => 'Create Policy'],
                                ['code' => 'update', 'name' => 'Update Policy'],
                                ['code' => 'delete', 'name' => 'Delete Policy'],
                                ['code' => 'publish', 'name' => 'Publish Policy'],
                                ['code' => 'archive', 'name' => 'Archive Policy'],
                            ],
                        ],
                    ],
                ],

                // 14.3 Risks
                [
                    'code' => 'risks',
                    'name' => 'Risk Register',
                    'description' => 'Identify and manage compliance risks',
                    'icon' => 'ExclamationTriangleIcon',
                    'route' => '/tenant/compliance/risks',
                    'priority' => 3,

                    'components' => [
                        [
                            'code' => 'risk-list',
                            'name' => 'Risk Register',
                            'type' => 'page',
                            'route' => '/tenant/compliance/risks',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Risks'],
                                ['code' => 'create', 'name' => 'Create Risk'],
                                ['code' => 'update', 'name' => 'Update Risk'],
                                ['code' => 'delete', 'name' => 'Delete Risk'],
                                ['code' => 'assess', 'name' => 'Risk Assessment'],
                                ['code' => 'mitigate', 'name' => 'Add Mitigation'],
                            ],
                        ],
                    ],
                ],

                // 14.4 Audits
                [
                    'code' => 'audits',
                    'name' => 'Compliance Audits',
                    'description' => 'Track internal and external compliance audits',
                    'icon' => 'ClipboardDocumentCheckIcon',
                    'route' => '/tenant/compliance/audits',
                    'priority' => 4,

                    'components' => [
                        [
                            'code' => 'audit-list',
                            'name' => 'Audit Schedule',
                            'type' => 'page',
                            'route' => '/tenant/compliance/audits',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Audits'],
                                ['code' => 'create', 'name' => 'Schedule Audit'],
                                ['code' => 'update', 'name' => 'Update Audit'],
                                ['code' => 'delete', 'name' => 'Delete Audit'],
                                ['code' => 'add-finding', 'name' => 'Add Finding'],
                            ],
                        ],
                    ],
                ],

                // 14.5 Requirements
                [
                    'code' => 'requirements',
                    'name' => 'Regulatory Requirements',
                    'description' => 'Track regulatory and compliance requirements',
                    'icon' => 'DocumentCheckIcon',
                    'route' => '/tenant/compliance/requirements',
                    'priority' => 5,

                    'components' => [
                        [
                            'code' => 'requirement-list',
                            'name' => 'Requirements',
                            'type' => 'page',
                            'route' => '/tenant/compliance/requirements',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Requirements'],
                                ['code' => 'create', 'name' => 'Add Requirement'],
                                ['code' => 'update', 'name' => 'Update Requirement'],
                                ['code' => 'delete', 'name' => 'Delete Requirement'],
                                ['code' => 'assess', 'name' => 'Assess Compliance'],
                            ],
                        ],
                    ],
                ],

                // 14.6 Documents
                [
                    'code' => 'documents',
                    'name' => 'Compliance Documents',
                    'description' => 'Store and manage compliance-related documents',
                    'icon' => 'FolderIcon',
                    'route' => '/tenant/compliance/documents',
                    'priority' => 6,

                    'components' => [
                        [
                            'code' => 'document-list',
                            'name' => 'Document Library',
                            'type' => 'page',
                            'route' => '/tenant/compliance/documents',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Documents'],
                                ['code' => 'create', 'name' => 'Upload Document'],
                                ['code' => 'update', 'name' => 'Update Document'],
                                ['code' => 'delete', 'name' => 'Delete Document'],
                                ['code' => 'download', 'name' => 'Download Document'],
                            ],
                        ],
                    ],
                ],

                // 14.7 Training
                [
                    'code' => 'training',
                    'name' => 'Compliance Training',
                    'description' => 'Track mandatory compliance training',
                    'icon' => 'AcademicCapIcon',
                    'route' => '/tenant/compliance/training',
                    'priority' => 7,

                    'components' => [
                        [
                            'code' => 'training-list',
                            'name' => 'Training Programs',
                            'type' => 'page',
                            'route' => '/tenant/compliance/training',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Training'],
                                ['code' => 'create', 'name' => 'Create Training'],
                                ['code' => 'update', 'name' => 'Update Training'],
                                ['code' => 'delete', 'name' => 'Delete Training'],
                                ['code' => 'assign', 'name' => 'Assign Training'],
                                ['code' => 'complete', 'name' => 'Mark Complete'],
                            ],
                        ],
                    ],
                ],

                // 14.8 Certifications
                [
                    'code' => 'certifications',
                    'name' => 'Industry Certifications',
                    'description' => 'Manage industry-specific certifications and licenses',
                    'icon' => 'ShieldCheckIcon',
                    'route' => '/tenant/compliance/certifications',
                    'priority' => 8,

                    'components' => [
                        [
                            'code' => 'certification-list',
                            'name' => 'Certifications',
                            'type' => 'page',
                            'route' => '/tenant/compliance/certifications',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Certifications'],
                                ['code' => 'create', 'name' => 'Add Certification'],
                                ['code' => 'update', 'name' => 'Update Certification'],
                                ['code' => 'delete', 'name' => 'Delete Certification'],
                            ],
                        ],
                    ],
                ],

                // 14.9 Reports
                [
                    'code' => 'reports',
                    'name' => 'Compliance Reports',
                    'description' => 'Generate compliance reports and analytics',
                    'icon' => 'ChartBarSquareIcon',
                    'route' => '/tenant/compliance/reports',
                    'priority' => 9,

                    'components' => [
                        [
                            'code' => 'report-list',
                            'name' => 'Reports',
                            'type' => 'page',
                            'route' => '/tenant/compliance/reports',
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Reports'],
                                ['code' => 'generate', 'name' => 'Generate Report'],
                                ['code' => 'export', 'name' => 'Export Report'],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Category Definitions
    |--------------------------------------------------------------------------
    */
    'categories' => [
        'core_system' => 'Core System',
        'self_service' => 'Self Service',
        'human_resources' => 'Human Resources',
        'project_management' => 'Project Management',
        'document_management' => 'Document Management',
        'customer_relations' => 'Customer Relations',
        'supply_chain' => 'Supply Chain',
        'retail_sales' => 'Retail & Sales',
        'financial_management' => 'Financial Management',
        'system_administration' => 'System Administration',
        'support_ticketing' => 'Support & Ticketing',
        'quality_compliance' => 'Quality & Compliance',
    ],

    /*
    |--------------------------------------------------------------------------
    | Component Types
    |--------------------------------------------------------------------------
    */
    'component_types' => [
        'page' => 'Page',
        'section' => 'Section',
        'widget' => 'Widget',
        'action' => 'Action',
        'api' => 'API Endpoint',
    ],
];
