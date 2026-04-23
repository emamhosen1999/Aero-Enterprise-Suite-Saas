<?php

return [
    'code'         => 'hrm',
    'scope'        => 'tenant',
    'name'         => 'Human Resources',
    'description'  => 'Complete HR management including employees, attendance, leave, payroll, benefits, recruitment, performance, training, compliance, analytics, workforce scheduling, EHS, and EAM-aligned workforce features',
    'icon'         => 'UserGroupIcon',
    'route_prefix' => '/hrm',
    'category'     => 'human_resources',
    'priority'     => 10,
    'is_core'      => false,
    'is_active'    => true,
    'enabled'      => true,
    'version'      => '2.1.0',
    'min_plan'     => 'basic',
    'minimum_plan' => 'basic',
    'license_type' => 'standard',
    'dependencies' => ['core'],
    'release_date' => '2024-01-01',

    /*
    |--------------------------------------------------------------------------
    | High-Level Feature Flags
    |--------------------------------------------------------------------------
    | Used by tenant module-access UI / plan gating. Mirrors the submodules
    | but allows quick on/off without removing config entries.
    */
    'features' => [
        'dashboard'                  => true,
        'employee_self_service'      => true,
        'employee_management'        => true,
        'onboarding_offboarding'     => true,
        'attendance_time'            => true,
        'leave_management'           => true,
        'payroll'                    => true,
        'benefits_administration'    => true,
        'expenses_claims'            => true,
        'assets_management'          => true, // EAM: workforce-allocated assets, PPE, tools
        'recruitment'                => true,
        'performance_management'     => true,
        'skills_competency'          => true, // EAM: technician skill matrix
        'training_lms'               => true, // EAM: certification + compliance training
        'disciplinary_er'            => true,
        'talent_development'         => true,
        'compensation_planning'      => true,
        'workforce_planning'         => true,
        'workforce_scheduling'       => true, // EAM: technician/crew scheduling
        'engagement_wellbeing'       => true,
        'workplace_safety'           => true, // EAM: EHS, PPE, permit-to-work, LOTO
        'policies_compliance'        => true,
        'hr_documents'               => true,
        'helpdesk'                   => true,
        'travel_management'          => true,
        'visitor_management'         => true,
        'hr_analytics'               => true,
        'ai_analytics'               => true,
        'integrations'               => true,
        'audit_logs'                 => true,
        'settings'                   => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Self-Service Navigation Items
    |--------------------------------------------------------------------------
    | Employee-facing "My *" pages aggregated by NavigationRegistry into
    | the unified "My Workspace" menu. show_in_nav is handled externally.
    */
    'self_service' => [
        ['code' => 'my-dashboard',            'name' => 'My Dashboard',            'icon' => 'HomeIcon',                  'route' => '/hrm/employee/dashboard',                'priority' => 1],
        ['code' => 'my-self-service-home',    'name' => 'My Workspace Home',       'icon' => 'Squares2X2Icon',            'route' => '/hrm/self-service',                      'priority' => 2],
        ['code' => 'my-attendance',           'name' => 'My Attendance',           'icon' => 'ClockIcon',                 'route' => '/hrm/attendance-employee',               'priority' => 3],
        ['code' => 'my-leaves',               'name' => 'My Leaves',               'icon' => 'CalendarIcon',              'route' => '/hrm/leaves-employee',                   'priority' => 4],
        ['code' => 'my-time-off',             'name' => 'My Time-Off',             'icon' => 'ArrowRightOnRectangleIcon', 'route' => '/hrm/self-service/time-off',             'priority' => 5],
        ['code' => 'my-payslips',             'name' => 'My Payslips',             'icon' => 'BanknotesIcon',             'route' => '/hrm/self-service/payslips',             'priority' => 6],
        ['code' => 'my-expenses',             'name' => 'My Expenses',             'icon' => 'ReceiptPercentIcon',        'route' => '/hrm/my-expenses',                       'priority' => 7],
        ['code' => 'my-documents',            'name' => 'My Documents',            'icon' => 'DocumentTextIcon',          'route' => '/hrm/self-service/documents',            'priority' => 8],
        ['code' => 'my-benefits',             'name' => 'My Benefits',             'icon' => 'GiftIcon',                  'route' => '/hrm/self-service/benefits',             'priority' => 9],
        ['code' => 'my-trainings',            'name' => 'My Trainings',            'icon' => 'AcademicCapIcon',           'route' => '/hrm/self-service/trainings',            'priority' => 10],
        ['code' => 'my-performance',          'name' => 'My Performance',          'icon' => 'ChartBarSquareIcon',        'route' => '/hrm/self-service/performance',          'priority' => 11],
        ['code' => 'my-personal-information', 'name' => 'My Personal Information', 'icon' => 'IdentificationIcon',       'route' => '/hrm/self-service/personal-information', 'priority' => 12],
        ['code' => 'my-bank-information',     'name' => 'My Bank Information',     'icon' => 'BuildingLibraryIcon',       'route' => '/hrm/self-service/bank-information',     'priority' => 13],
        ['code' => 'my-goals',                'name' => 'My Goals',                'icon' => 'FlagIcon',                  'route' => '/hrm/goals',                             'priority' => 14],
        ['code' => 'my-career-path',          'name' => 'My Career Path',          'icon' => 'ArrowTrendingUpIcon',       'route' => '/hrm/self-service/career-path',          'priority' => 15],
        ['code' => 'my-feedback',             'name' => 'My 360° Feedback',        'icon' => 'ArrowPathIcon',             'route' => '/hrm/feedback-360',                      'priority' => 16],
        ['code' => 'my-assets',               'name' => 'My Assets',               'icon' => 'ComputerDesktopIcon',       'route' => '/hrm/self-service/my-assets',            'priority' => 17],
        ['code' => 'my-tax-declarations',     'name' => 'My Tax Declarations',     'icon' => 'DocumentCheckIcon',         'route' => '/hrm/self-service/tax-declarations',     'priority' => 18],
        ['code' => 'my-help-tickets',         'name' => 'My HR Tickets',           'icon' => 'LifebuoyIcon',              'route' => '/hrm/helpdesk/my-tickets',               'priority' => 19],
        ['code' => 'my-policies',             'name' => 'My Policies',             'icon' => 'ClipboardDocumentListIcon', 'route' => '/hrm/self-service/policies',             'priority' => 20],
    ],

    'submodules' => [

        /*
        |------------------------------------------------------------------
        | GROUP 1 — DASHBOARD
        |------------------------------------------------------------------
        */
        [
            'code'        => 'dashboard',
            'name'        => 'HR Dashboard',
            'description' => 'HR management dashboard with key metrics and insights',
            'icon'        => 'HomeIcon',
            'route'       => '/hrm/dashboard',
            'priority'    => 0,
            'show_in_nav' => false,
            'components'  => [
                [
                    'code'    => 'hr-dashboard',
                    'name'    => 'HR Dashboard',
                    'type'    => 'page',
                    'route'   => '/hrm/dashboard',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View HR Dashboard'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 2 — SELF SERVICE (Employee Workspace)
        |------------------------------------------------------------------
        */
        [
            'code'        => 'employee-self-service',
            'name'        => 'Self Service',
            'description' => 'Employee self-service portal — My Workspace HRM items',
            'icon'        => 'UserCircleIcon',
            'route'       => '/hrm/employee/dashboard',
            'priority'    => 1,
            'show_in_nav' => false,
            'components'  => [
                ['code' => 'my-dashboard',            'name' => 'My Dashboard',            'type' => 'page', 'route' => '/hrm/employee/dashboard',
                    'actions' => [['code' => 'view', 'name' => 'View Dashboard']]],
                ['code' => 'my-self-service-home',    'name' => 'My Workspace Home',       'type' => 'page', 'route' => '/hrm/self-service',
                    'actions' => [['code' => 'view', 'name' => 'View Self Service Home']]],
                ['code' => 'my-attendance',           'name' => 'My Attendance',           'type' => 'page', 'route' => '/hrm/attendance-employee',
                    'actions' => [['code' => 'view', 'name' => 'View Attendance'], ['code' => 'clock-in-out', 'name' => 'Clock In/Out']]],
                ['code' => 'my-leaves',               'name' => 'My Leaves',               'type' => 'page', 'route' => '/hrm/leaves-employee',
                    'actions' => [['code' => 'view', 'name' => 'View Leaves'], ['code' => 'apply', 'name' => 'Apply Leave']]],
                ['code' => 'my-time-off',             'name' => 'My Time-Off',             'type' => 'page', 'route' => '/hrm/self-service/time-off',
                    'actions' => [['code' => 'view', 'name' => 'View Time-Off'], ['code' => 'request', 'name' => 'Request Time-Off']]],
                ['code' => 'my-timesheets',           'name' => 'My Timesheets',           'type' => 'page', 'route' => '/hrm/self-service/timesheets',
                    'actions' => [['code' => 'view', 'name' => 'View Timesheets'], ['code' => 'submit', 'name' => 'Submit Timesheet']]],
                ['code' => 'my-payslips',             'name' => 'My Payslips',             'type' => 'page', 'route' => '/hrm/self-service/payslips',
                    'actions' => [['code' => 'view', 'name' => 'View Payslips'], ['code' => 'download', 'name' => 'Download Payslip']]],
                ['code' => 'my-tax-declarations',     'name' => 'My Tax Declarations',     'type' => 'page', 'route' => '/hrm/self-service/tax-declarations',
                    'actions' => [['code' => 'view', 'name' => 'View Declarations'], ['code' => 'submit', 'name' => 'Submit Declaration']]],
                ['code' => 'my-expenses',             'name' => 'My Expenses',             'type' => 'page', 'route' => '/hrm/my-expenses',
                    'actions' => [['code' => 'view', 'name' => 'View Expenses'], ['code' => 'submit', 'name' => 'Submit Expense']]],
                ['code' => 'my-documents',            'name' => 'My Documents',            'type' => 'page', 'route' => '/hrm/self-service/documents',
                    'actions' => [['code' => 'view', 'name' => 'View Documents'], ['code' => 'upload', 'name' => 'Upload Document']]],
                ['code' => 'my-benefits',             'name' => 'My Benefits',             'type' => 'page', 'route' => '/hrm/self-service/benefits',
                    'actions' => [['code' => 'view', 'name' => 'View Benefits']]],
                ['code' => 'my-benefits-open-enrollment', 'name' => 'My Open Enrollment', 'type' => 'page', 'route' => '/hrm/self-service/benefits/open-enrollment',
                    'actions' => [['code' => 'view', 'name' => 'View Open Enrollment'], ['code' => 'enroll', 'name' => 'Submit Enrollment']]],
                ['code' => 'my-trainings',            'name' => 'My Trainings',            'type' => 'page', 'route' => '/hrm/self-service/trainings',
                    'actions' => [['code' => 'view', 'name' => 'View Trainings'], ['code' => 'enroll', 'name' => 'Enroll Training']]],
                ['code' => 'my-performance',          'name' => 'My Performance',          'type' => 'page', 'route' => '/hrm/self-service/performance',
                    'actions' => [['code' => 'view', 'name' => 'View Performance']]],
                ['code' => 'my-profile',              'name' => 'My Profile',              'type' => 'page', 'route' => '/hrm/self-service/profile',
                    'actions' => [['code' => 'view', 'name' => 'View Profile'], ['code' => 'update', 'name' => 'Update Profile']]],
                ['code' => 'my-personal-information', 'name' => 'My Personal Information', 'type' => 'page', 'route' => '/hrm/self-service/personal-information',
                    'actions' => [['code' => 'view', 'name' => 'View Personal Information'], ['code' => 'update', 'name' => 'Update Personal Information']]],
                ['code' => 'my-bank-information',     'name' => 'My Bank Information',     'type' => 'page', 'route' => '/hrm/self-service/bank-information',
                    'actions' => [['code' => 'view', 'name' => 'View Bank Information'], ['code' => 'update', 'name' => 'Update Bank Information']]],
                ['code' => 'my-assets',               'name' => 'My Assets',               'type' => 'page', 'route' => '/hrm/self-service/my-assets',
                    'actions' => [['code' => 'view', 'name' => 'View My Assets']]],
                ['code' => 'my-goals',                'name' => 'My Goals',                'type' => 'page', 'route' => '/hrm/goals',
                    'actions' => [['code' => 'view', 'name' => 'View Goals'], ['code' => 'update', 'name' => 'Update Goals']]],
                ['code' => 'my-career-path',          'name' => 'My Career Path',          'type' => 'page', 'route' => '/hrm/self-service/career-path',
                    'actions' => [['code' => 'view', 'name' => 'View Career Path']]],
                ['code' => 'my-feedback',             'name' => 'My 360° Feedback',        'type' => 'page', 'route' => '/hrm/feedback-360',
                    'actions' => [['code' => 'view', 'name' => 'View Feedback'], ['code' => 'submit', 'name' => 'Submit Feedback']]],
                ['code' => 'my-help-tickets',         'name' => 'My HR Tickets',           'type' => 'page', 'route' => '/hrm/helpdesk/my-tickets',
                    'actions' => [['code' => 'view', 'name' => 'View My Tickets'], ['code' => 'create', 'name' => 'Raise Ticket']]],
                ['code' => 'my-policies',             'name' => 'My Policies',             'type' => 'page', 'route' => '/hrm/self-service/policies',
                    'actions' => [['code' => 'view', 'name' => 'View Policies'], ['code' => 'acknowledge', 'name' => 'Acknowledge Policy']]],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 3 — EMPLOYEE MANAGEMENT
        |------------------------------------------------------------------
        */
        [
            'code'        => 'employees',
            'name'        => 'Employees',
            'description' => 'Employee directory, profiles, departments, positions, designations, and lifecycle management',
            'icon'        => 'UsersIcon',
            'route'       => '/hrm/employees',
            'priority'    => 2,
            'components'  => [
                [
                    'code'    => 'employee-directory',
                    'name'    => 'Employee Directory',
                    'type'    => 'page',
                    'route'   => '/hrm/employees',
                    'actions' => [
                        ['code' => 'view',          'name' => 'View Employees'],
                        ['code' => 'create',        'name' => 'Create Employee'],
                        ['code' => 'update',        'name' => 'Update Employee'],
                        ['code' => 'delete',        'name' => 'Delete Employee'],
                        ['code' => 'export',        'name' => 'Export Employees'],
                        ['code' => 'import',        'name' => 'Import Employees'],
                        ['code' => 'change-status', 'name' => 'Change Employee Status'],
                    ],
                ],
                [
                    'code'    => 'employee-profile',
                    'name'    => 'Employee Profile',
                    'type'    => 'page',
                    'route'   => '/hrm/employees/{id}',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Profile'],
                        ['code' => 'update', 'name' => 'Update Profile'],
                    ],
                ],
                [
                    'code'    => 'org-chart',
                    'name'    => 'Organization Chart',
                    'type'    => 'page',
                    'route'   => '/hrm/org-chart',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Org Chart'],
                        ['code' => 'export', 'name' => 'Export Org Chart'],
                    ],
                ],
                [
                    'code'    => 'departments',
                    'name'    => 'Departments',
                    'type'    => 'page',
                    'route'   => '/hrm/departments',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Departments'],
                        ['code' => 'create', 'name' => 'Create Department'],
                        ['code' => 'update', 'name' => 'Update Department'],
                        ['code' => 'delete', 'name' => 'Delete Department'],
                    ],
                ],
                [
                    'code'    => 'designations',
                    'name'    => 'Designations',
                    'type'    => 'page',
                    'route'   => '/hrm/designations',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Designations'],
                        ['code' => 'create', 'name' => 'Create Designation'],
                        ['code' => 'update', 'name' => 'Update Designation'],
                        ['code' => 'delete', 'name' => 'Delete Designation'],
                    ],
                ],
                [
                    'code'    => 'positions',
                    'name'    => 'Position Management',
                    'type'    => 'page',
                    'route'   => '/hrm/positions',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Positions'],
                        ['code' => 'create', 'name' => 'Create Position'],
                        ['code' => 'update', 'name' => 'Update Position'],
                        ['code' => 'delete', 'name' => 'Delete Position'],
                        ['code' => 'assign', 'name' => 'Assign Employee to Position'],
                    ],
                ],
                [
                    'code'    => 'employment-types',
                    'name'    => 'Employment Types',
                    'type'    => 'page',
                    'route'   => '/hrm/employment-types',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Employment Types'],
                        ['code' => 'manage', 'name' => 'Manage Employment Types'],
                    ],
                ],
                [
                    'code'    => 'employee-documents',
                    'name'    => 'Employee Documents',
                    'type'    => 'page',
                    'route'   => '/hrm/employees/{id}/documents',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Documents'],
                        ['code' => 'manage', 'name' => 'Manage Documents'],
                        ['code' => 'verify', 'name' => 'Verify Documents'],
                    ],
                ],
                [
                    'code'    => 'custom-fields',
                    'name'    => 'Custom Fields',
                    'type'    => 'page',
                    'route'   => '/hrm/employees/custom-fields',
                    'actions' => [
                        ['code' => 'manage', 'name' => 'Manage Custom Fields'],
                    ],
                ],
                [
                    'code'    => 'employee-relations',
                    'name'    => 'Employee Relations (Dependants & Emergency)',
                    'type'    => 'page',
                    'route'   => '/hrm/employees/{id}/relations',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Relations'],
                        ['code' => 'manage', 'name' => 'Manage Relations'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 4 — ONBOARDING & OFFBOARDING
        |------------------------------------------------------------------
        */
        [
            'code'        => 'onboarding',
            'name'        => 'Onboarding & Offboarding',
            'description' => 'Employee onboarding wizards, checklists, FnF settlement, and rehire management',
            'icon'        => 'UserPlusIcon',
            'route'       => '/hrm/onboarding',
            'priority'    => 3,
            'components'  => [
                [
                    'code'    => 'onboarding-list',
                    'name'    => 'Onboarding',
                    'type'    => 'page',
                    'route'   => '/hrm/onboarding',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Onboarding'],
                        ['code' => 'create', 'name' => 'Create Onboarding'],
                        ['code' => 'update', 'name' => 'Update Onboarding'],
                        ['code' => 'delete', 'name' => 'Delete Onboarding'],
                    ],
                ],
                [
                    'code'    => 'onboarding-wizard',
                    'name'    => 'Onboarding Wizard',
                    'type'    => 'page',
                    'route'   => '/hrm/onboarding/wizard',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Wizard'],
                        ['code' => 'onboard', 'name' => 'Onboard Employee'],
                    ],
                ],
                [
                    'code'    => 'checklists',
                    'name'    => 'Onboarding Checklists',
                    'type'    => 'page',
                    'route'   => '/hrm/checklists',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Checklists'],
                        ['code' => 'manage', 'name' => 'Manage Checklists'],
                    ],
                ],
                [
                    'code'    => 'offboarding-list',
                    'name'    => 'Offboarding',
                    'type'    => 'page',
                    'route'   => '/hrm/offboarding',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Offboarding'],
                        ['code' => 'create', 'name' => 'Create Offboarding'],
                        ['code' => 'update', 'name' => 'Update Offboarding'],
                        ['code' => 'delete', 'name' => 'Delete Offboarding'],
                    ],
                ],
                [
                    'code'    => 'exit-termination',
                    'name'    => 'Exit / Termination',
                    'type'    => 'page',
                    'route'   => '/hrm/offboarding/exit',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Exit Records'],
                        ['code' => 'offboard', 'name' => 'Offboard Employee'],
                        ['code' => 'approve',  'name' => 'Approve Resignation'],
                    ],
                ],
                [
                    'code'    => 'fnf-settlement',
                    'name'    => 'Full & Final Settlement',
                    'type'    => 'page',
                    'route'   => '/hrm/offboarding/fnf-settlement',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View FnF Settlements'],
                        ['code' => 'create',   'name' => 'Create FnF Settlement'],
                        ['code' => 'update',   'name' => 'Update FnF Settlement'],
                        ['code' => 'approve',  'name' => 'Approve FnF Settlement'],
                        ['code' => 'generate', 'name' => 'Generate FnF Report'],
                    ],
                ],
                [
                    'code'    => 'clearance-workflow',
                    'name'    => 'Clearance Workflow',
                    'type'    => 'page',
                    'route'   => '/hrm/offboarding/clearance',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Clearances'],
                        ['code' => 'initiate', 'name' => 'Initiate Clearance'],
                        ['code' => 'approve',  'name' => 'Approve Clearance Step'],
                    ],
                ],
                [
                    'code'    => 'rehire-management',
                    'name'    => 'Rehire Management',
                    'type'    => 'page',
                    'route'   => '/hrm/offboarding/rehire',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Rehire Records'],
                        ['code' => 'manage', 'name' => 'Manage Rehire Eligibility'],
                    ],
                ],
                [
                    'code'    => 'exit-interviews',
                    'name'    => 'Exit Interviews',
                    'type'    => 'page',
                    'route'   => '/hrm/exit-interviews',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Exit Interviews'],
                        ['code' => 'create',  'name' => 'Schedule Exit Interview'],
                        ['code' => 'update',  'name' => 'Update Exit Interview'],
                        ['code' => 'delete',  'name' => 'Delete Exit Interview'],
                        ['code' => 'analyze', 'name' => 'Analyze Trends'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 5 — ATTENDANCE & TIME
        |------------------------------------------------------------------
        */
        [
            'code'        => 'attendance',
            'name'        => 'Attendance & Time',
            'description' => 'Daily attendance, shifts, timesheets, overtime, and attendance adjustments',
            'icon'        => 'ClockIcon',
            'route'       => '/hrm/attendance',
            'priority'    => 4,
            'components'  => [
                [
                    'code'    => 'daily-attendance',
                    'name'    => 'Daily Attendance',
                    'type'    => 'page',
                    'route'   => '/hrm/attendance',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Attendance'],
                        ['code' => 'mark',   'name' => 'Mark Attendance'],
                        ['code' => 'update', 'name' => 'Update Attendance'],
                        ['code' => 'delete', 'name' => 'Delete Attendance'],
                        ['code' => 'export', 'name' => 'Export Attendance'],
                    ],
                ],
                [
                    'code'    => 'monthly-calendar',
                    'name'    => 'Monthly Attendance Calendar',
                    'type'    => 'page',
                    'route'   => '/hrm/attendance/calendar',
                    'actions' => [['code' => 'view', 'name' => 'View Calendar']],
                ],
                [
                    'code'    => 'attendance-logs',
                    'name'    => 'Attendance Logs',
                    'type'    => 'page',
                    'route'   => '/hrm/attendance/logs',
                    'actions' => [['code' => 'view', 'name' => 'View Attendance Logs']],
                ],
                [
                    'code'    => 'shift-scheduling',
                    'name'    => 'Shift Scheduling',
                    'type'    => 'page',
                    'route'   => '/hrm/shifts',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Shifts'],
                        ['code' => 'create', 'name' => 'Create Shift'],
                        ['code' => 'update', 'name' => 'Update Shift'],
                        ['code' => 'delete', 'name' => 'Delete Shift'],
                        ['code' => 'assign', 'name' => 'Assign Employee to Shift'],
                    ],
                ],
                [
                    'code'    => 'shift-marketplace',
                    'name'    => 'Shift Marketplace',
                    'type'    => 'page',
                    'route'   => '/hrm/attendance/shift-marketplace',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Marketplace'],
                        ['code' => 'create',  'name' => 'Create Swap Request'],
                        ['code' => 'approve', 'name' => 'Approve Swap'],
                        ['code' => 'reject',  'name' => 'Reject Swap'],
                    ],
                ],
                [
                    'code'    => 'adjustment-requests',
                    'name'    => 'Attendance Adjustment Requests',
                    'type'    => 'page',
                    'route'   => '/hrm/attendance/adjustments',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Adjustment Requests'],
                        ['code' => 'approve', 'name' => 'Approve Adjustment'],
                        ['code' => 'reject',  'name' => 'Reject Adjustment'],
                    ],
                ],
                [
                    'code'    => 'device-rules',
                    'name'    => 'Attendance Device / IP / Geo Rules',
                    'type'    => 'page',
                    'route'   => '/hrm/attendance/device-rules',
                    'actions' => [['code' => 'manage', 'name' => 'Manage Attendance Rules']],
                ],
                [
                    'code'    => 'timesheets',
                    'name'    => 'Timesheets',
                    'type'    => 'page',
                    'route'   => '/hrm/timesheets',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Timesheets'],
                        ['code' => 'create',   'name' => 'Create Timesheet'],
                        ['code' => 'update',   'name' => 'Update Timesheet'],
                        ['code' => 'approve',  'name' => 'Approve Timesheet'],
                        ['code' => 'reject',   'name' => 'Reject Timesheet'],
                        ['code' => 'export',   'name' => 'Export Timesheets'],
                    ],
                ],
                [
                    'code'    => 'overtime-management',
                    'name'    => 'Overtime Management',
                    'type'    => 'page',
                    'route'   => '/hrm/overtime',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Overtime Records'],
                        ['code' => 'create',  'name' => 'Create Overtime Record'],
                        ['code' => 'update',  'name' => 'Update Overtime Record'],
                        ['code' => 'delete',  'name' => 'Delete Overtime Record'],
                        ['code' => 'approve', 'name' => 'Approve Overtime'],
                        ['code' => 'reject',  'name' => 'Reject Overtime'],
                    ],
                ],
                [
                    'code'    => 'overtime-rules',
                    'name'    => 'Overtime Rules',
                    'type'    => 'page',
                    'route'   => '/hrm/overtime/rules',
                    'actions' => [['code' => 'manage', 'name' => 'Manage Overtime Rules']],
                ],
                [
                    'code'    => 'my-attendance',
                    'name'    => 'My Attendance',
                    'type'    => 'page',
                    'route'   => '/hrm/my-attendance',
                    'actions' => [
                        ['code' => 'view',  'name' => 'View Own Attendance'],
                        ['code' => 'punch', 'name' => 'Punch In/Out'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 6 — LEAVE MANAGEMENT
        |------------------------------------------------------------------
        */
        [
            'code'        => 'leaves',
            'name'        => 'Leave Management',
            'description' => 'Leave types, requests, balances, accrual, holidays, conflict detection, and policies',
            'icon'        => 'CalendarIcon',
            'route'       => '/hrm/leaves',
            'priority'    => 5,
            'components'  => [
                [
                    'code'    => 'leave-types',
                    'name'    => 'Leave Types',
                    'type'    => 'page',
                    'route'   => '/hrm/leaves/types',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Leave Types'],
                        ['code' => 'create', 'name' => 'Create Leave Type'],
                        ['code' => 'update', 'name' => 'Update Leave Type'],
                        ['code' => 'delete', 'name' => 'Delete Leave Type'],
                    ],
                ],
                [
                    'code'    => 'leave-requests',
                    'name'    => 'Leave Requests',
                    'type'    => 'page',
                    'route'   => '/hrm/leaves',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Leave Requests'],
                        ['code' => 'create',  'name' => 'Create Leave Request'],
                        ['code' => 'update',  'name' => 'Update Leave Request'],
                        ['code' => 'delete',  'name' => 'Delete Leave Request'],
                        ['code' => 'approve', 'name' => 'Approve Leave Request'],
                        ['code' => 'reject',  'name' => 'Reject Leave Request'],
                        ['code' => 'export',  'name' => 'Export Leave Requests'],
                    ],
                ],
                [
                    'code'    => 'leave-balances',
                    'name'    => 'Leave Balances',
                    'type'    => 'page',
                    'route'   => '/hrm/leaves/balances',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Leave Balances'],
                        ['code' => 'update', 'name' => 'Update Leave Balance'],
                        ['code' => 'export', 'name' => 'Export Leave Balances'],
                    ],
                ],
                [
                    'code'    => 'leave-accrual',
                    'name'    => 'Leave Accrual Engine',
                    'type'    => 'page',
                    'route'   => '/hrm/leaves/accrual',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Accrual Rules'],
                        ['code' => 'create', 'name' => 'Create Accrual Rule'],
                        ['code' => 'update', 'name' => 'Update Accrual Rule'],
                        ['code' => 'delete', 'name' => 'Delete Accrual Rule'],
                        ['code' => 'run',    'name' => 'Run Leave Accrual'],
                    ],
                ],
                [
                    'code'    => 'conflict-checker',
                    'name'    => 'Conflict Checker',
                    'type'    => 'feature',
                    'route'   => null,
                    'actions' => [['code' => 'view', 'name' => 'Check Conflicts']],
                ],
                [
                    'code'    => 'holiday-calendar',
                    'name'    => 'Holiday Calendar',
                    'type'    => 'page',
                    'route'   => '/hrm/holidays',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Holidays'],
                        ['code' => 'create', 'name' => 'Create Holiday'],
                        ['code' => 'update', 'name' => 'Update Holiday'],
                        ['code' => 'delete', 'name' => 'Delete Holiday'],
                        ['code' => 'import', 'name' => 'Import Holiday Calendar'],
                    ],
                ],
                [
                    'code'    => 'leave-policies',
                    'name'    => 'Leave Policies',
                    'type'    => 'page',
                    'route'   => '/hrm/leaves/policies',
                    'actions' => [['code' => 'manage', 'name' => 'Manage Leave Policies']],
                ],
                [
                    'code'    => 'leave-summary',
                    'name'    => 'Leave Summary',
                    'type'    => 'page',
                    'route'   => '/hrm/leave-summary',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Leave Summary'],
                        ['code' => 'export', 'name' => 'Export Leave Summary'],
                    ],
                ],
                [
                    'code'    => 'leave-settings',
                    'name'    => 'Leave Settings',
                    'type'    => 'page',
                    'route'   => '/hrm/leave-settings',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Leave Settings'],
                        ['code' => 'update', 'name' => 'Update Leave Settings'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 7 — PAYROLL
        |------------------------------------------------------------------
        */
        [
            'code'        => 'payroll',
            'name'        => 'Payroll',
            'description' => 'Salary structures, payroll processing, payslips, tax, statutory compliance, loans, and bank file generation',
            'icon'        => 'CurrencyDollarIcon',
            'route'       => '/hrm/payroll',
            'priority'    => 6,
            'components'  => [
                [
                    'code'    => 'salary-structures',
                    'name'    => 'Salary Structures',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/salary-structures',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Salary Structures'],
                        ['code' => 'create', 'name' => 'Create Salary Structure'],
                        ['code' => 'update', 'name' => 'Update Salary Structure'],
                        ['code' => 'delete', 'name' => 'Delete Salary Structure'],
                    ],
                ],
                [
                    'code'    => 'salary-components',
                    'name'    => 'Salary Components',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/salary-components',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Salary Components'],
                        ['code' => 'create', 'name' => 'Create Salary Component'],
                        ['code' => 'update', 'name' => 'Update Salary Component'],
                        ['code' => 'delete', 'name' => 'Delete Salary Component'],
                    ],
                ],
                [
                    'code'    => 'payroll-run',
                    'name'    => 'Payroll Run',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/run',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Payroll Runs'],
                        ['code' => 'execute',  'name' => 'Execute Payroll Run'],
                        ['code' => 'lock',     'name' => 'Lock Payroll Run'],
                        ['code' => 'rollback', 'name' => 'Rollback Payroll Run'],
                        ['code' => 'export',   'name' => 'Export Payroll Run'],
                    ],
                ],
                [
                    'code'    => 'payslips',
                    'name'    => 'Payslips',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/payslips',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Payslips'],
                        ['code' => 'download', 'name' => 'Download Payslip'],
                        ['code' => 'send',     'name' => 'Send Payslip'],
                        ['code' => 'bulk-send','name' => 'Bulk Send Payslips'],
                    ],
                ],
                [
                    'code'    => 'tax-setup',
                    'name'    => 'Tax Setup',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/tax-setup',
                    'actions' => [['code' => 'manage', 'name' => 'Manage Tax Rules']],
                ],
                [
                    'code'    => 'tax-declarations',
                    'name'    => 'IT / Tax Declarations',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/tax-declarations',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Declarations'],
                        ['code' => 'verify', 'name' => 'Verify Proofs'],
                        ['code' => 'export', 'name' => 'Export Declarations'],
                    ],
                ],
                [
                    'code'    => 'statutory-compliance',
                    'name'    => 'Statutory Compliance',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/statutory',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Compliance Records'],
                        ['code' => 'manage',   'name' => 'Manage PF / ESI / Gratuity Rules'],
                        ['code' => 'generate', 'name' => 'Generate Statutory Reports'],
                        ['code' => 'export',   'name' => 'Export Compliance Data'],
                    ],
                ],
                [
                    'code'    => 'loans',
                    'name'    => 'Loan & Advance Management',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/loans',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Loans'],
                        ['code' => 'create',  'name' => 'Create Loan'],
                        ['code' => 'update',  'name' => 'Update Loan'],
                        ['code' => 'delete',  'name' => 'Delete Loan'],
                        ['code' => 'approve', 'name' => 'Approve Loan'],
                        ['code' => 'reject',  'name' => 'Reject Loan'],
                    ],
                ],
                [
                    'code'    => 'bank-file',
                    'name'    => 'Bank File Generator',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/bank-file',
                    'actions' => [['code' => 'generate', 'name' => 'Generate Bank File']],
                ],
                [
                    'code'    => 'multi-entity-payroll',
                    'name'    => 'Multi-Entity Payroll',
                    'type'    => 'page',
                    'route'   => '/hrm/payroll/multi-entity',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Multi-Entity Payrolls'],
                        ['code' => 'manage', 'name' => 'Manage Multi-Entity Configuration'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 8 — BENEFITS ADMINISTRATION
        |------------------------------------------------------------------
        */
        [
            'code'        => 'benefits',
            'name'        => 'Benefits Administration',
            'description' => 'Manage benefit plans, open enrollment, life events, COBRA, and beneficiary records',
            'icon'        => 'GiftIcon',
            'route'       => '/hrm/benefits',
            'priority'    => 7,
            'components'  => [
                [
                    'code'    => 'benefit-plans',
                    'name'    => 'Benefit Plans',
                    'type'    => 'page',
                    'route'   => '/hrm/benefits/plans',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Benefit Plans'],
                        ['code' => 'create', 'name' => 'Create Benefit Plan'],
                        ['code' => 'update', 'name' => 'Update Benefit Plan'],
                        ['code' => 'delete', 'name' => 'Delete Benefit Plan'],
                    ],
                ],
                [
                    'code'    => 'open-enrollment',
                    'name'    => 'Open Enrollment',
                    'type'    => 'page',
                    'route'   => '/hrm/benefits/open-enrollment',
                    'actions' => [
                        ['code' => 'view',      'name' => 'View Enrollment Windows'],
                        ['code' => 'create',    'name' => 'Create Enrollment Window'],
                        ['code' => 'update',    'name' => 'Update Enrollment Window'],
                        ['code' => 'delete',    'name' => 'Delete Enrollment Window'],
                        ['code' => 'configure', 'name' => 'Configure Eligibility Rules'],
                    ],
                ],
                [
                    'code'    => 'life-events',
                    'name'    => 'Life Events',
                    'type'    => 'page',
                    'route'   => '/hrm/benefits/life-events',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Life Events'],
                        ['code' => 'approve', 'name' => 'Approve Life Event'],
                        ['code' => 'reject',  'name' => 'Reject Life Event'],
                    ],
                ],
                [
                    'code'    => 'beneficiary-management',
                    'name'    => 'Beneficiary Management',
                    'type'    => 'page',
                    'route'   => '/hrm/benefits/beneficiaries',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Beneficiaries'],
                        ['code' => 'manage', 'name' => 'Manage Beneficiaries'],
                    ],
                ],
                [
                    'code'    => 'cobra-management',
                    'name'    => 'COBRA Management',
                    'type'    => 'page',
                    'route'   => '/hrm/benefits/cobra',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View COBRA Records'],
                        ['code' => 'manage',  'name' => 'Manage COBRA Continuations'],
                        ['code' => 'notify',  'name' => 'Send COBRA Notices'],
                    ],
                ],
                [
                    'code'    => 'employee-benefits',
                    'name'    => 'Employee Benefit Enrollments',
                    'type'    => 'page',
                    'route'   => '/hrm/benefits/enrollments',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Enrollments'],
                        ['code' => 'update', 'name' => 'Update Enrollment'],
                        ['code' => 'export', 'name' => 'Export Enrollments'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 9 — EXPENSES & CLAIMS
        |------------------------------------------------------------------
        */
        [
            'code'        => 'expenses',
            'name'        => 'Expenses & Claims',
            'description' => 'Employee expense claims with approval workflow',
            'icon'        => 'ReceiptPercentIcon',
            'route'       => '/hrm/expenses',
            'priority'    => 8,
            'components'  => [
                [
                    'code'    => 'expense-claims',
                    'name'    => 'Expense Claims',
                    'type'    => 'page',
                    'route'   => '/hrm/expenses',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Claims'],
                        ['code' => 'create',  'name' => 'Create Claim'],
                        ['code' => 'update',  'name' => 'Update Claim'],
                        ['code' => 'delete',  'name' => 'Delete Claim'],
                        ['code' => 'approve', 'name' => 'Approve Claims'],
                        ['code' => 'reject',  'name' => 'Reject Claims'],
                        ['code' => 'export',  'name' => 'Export Claims'],
                    ],
                ],
                [
                    'code'    => 'my-expense-claims',
                    'name'    => 'My Expense Claims',
                    'type'    => 'page',
                    'route'   => '/hrm/my-expenses',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View My Claims'],
                        ['code' => 'create', 'name' => 'Submit Claim'],
                    ],
                ],
                [
                    'code'    => 'expense-categories',
                    'name'    => 'Expense Categories',
                    'type'    => 'page',
                    'route'   => '/hrm/expenses/categories',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Categories'],
                        ['code' => 'manage', 'name' => 'Manage Categories'],
                    ],
                ],
                [
                    'code'    => 'expense-policies',
                    'name'    => 'Expense Policies',
                    'type'    => 'page',
                    'route'   => '/hrm/expenses/policies',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Expense Policies'],
                        ['code' => 'manage', 'name' => 'Manage Expense Policies'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 10 — ASSETS MANAGEMENT (HRM-side / Workforce Allocation)
        |------------------------------------------------------------------
        | EAM scope: workforce-allocated assets — laptops, phones, tools,
        | vehicles, PPE, uniforms. Cross-references aero-finance for
        | depreciation, aero-ims for spares, aero-iot for telemetry.
        */
        [
            'code'        => 'assets',
            'name'        => 'Assets Management',
            'description' => 'Track, allocate, return, audit, and maintain company assets assigned to employees (IT, tools, vehicles, PPE)',
            'icon'        => 'ComputerDesktopIcon',
            'route'       => '/hrm/assets',
            'priority'    => 9,
            'components'  => [
                [
                    'code'    => 'asset-inventory',
                    'name'    => 'Asset Inventory',
                    'type'    => 'page',
                    'route'   => '/hrm/assets',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Assets'],
                        ['code' => 'create',   'name' => 'Add Asset'],
                        ['code' => 'update',   'name' => 'Update Asset'],
                        ['code' => 'delete',   'name' => 'Delete Asset'],
                        ['code' => 'allocate', 'name' => 'Allocate Asset'],
                        ['code' => 'return',   'name' => 'Return Asset'],
                        ['code' => 'export',   'name' => 'Export Asset Inventory'],
                        ['code' => 'import',   'name' => 'Import Assets'],
                        ['code' => 'tag',      'name' => 'Print Asset Tag / QR'],
                    ],
                ],
                [
                    'code'    => 'asset-allocations',
                    'name'    => 'Asset Allocations',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/allocations',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Allocations'],
                        ['code' => 'assign', 'name' => 'Assign Asset'],
                        ['code' => 'return', 'name' => 'Return Asset'],
                        ['code' => 'history','name' => 'View Allocation History'],
                    ],
                ],
                [
                    'code'    => 'asset-categories',
                    'name'    => 'Asset Categories',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/categories',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Categories'],
                        ['code' => 'manage', 'name' => 'Manage Categories'],
                    ],
                ],
                [
                    'code'    => 'asset-maintenance',
                    'name'    => 'Asset Maintenance',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/maintenance',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Maintenance Records'],
                        ['code' => 'create', 'name' => 'Create Maintenance Record'],
                        ['code' => 'update', 'name' => 'Update Maintenance Record'],
                        ['code' => 'schedule','name' => 'Schedule Preventive Maintenance'],
                    ],
                ],
                /* * EAM: tools & equipment register (separate from IT/IS) */
                [
                    'code'    => 'tools-equipment',
                    'name'    => 'Tools & Equipment Register',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/tools',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Tools/Equipment'],
                        ['code' => 'create',   'name' => 'Add Tool/Equipment'],
                        ['code' => 'checkout', 'name' => 'Check-Out Tool'],
                        ['code' => 'checkin',  'name' => 'Check-In Tool'],
                        ['code' => 'inspect',  'name' => 'Inspect Tool'],
                        ['code' => 'calibrate','name' => 'Send for Calibration'],
                    ],
                ],
                /* * EAM: vehicle & fleet register (HRM-side allocation, fuel, mileage) */
                [
                    'code'    => 'vehicles-fleet',
                    'name'    => 'Vehicles & Fleet (HRM Allocation)',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/vehicles',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Vehicles'],
                        ['code' => 'create',   'name' => 'Add Vehicle'],
                        ['code' => 'allocate', 'name' => 'Allocate Vehicle'],
                        ['code' => 'fuel-log', 'name' => 'Log Fuel'],
                        ['code' => 'mileage',  'name' => 'Log Mileage'],
                        ['code' => 'service',  'name' => 'Log Service'],
                    ],
                ],
                /* * EAM: uniform / clothing issuance */
                [
                    'code'    => 'uniforms',
                    'name'    => 'Uniforms & Clothing Issuance',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/uniforms',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Uniform Issues'],
                        ['code' => 'issue',   'name' => 'Issue Uniform'],
                        ['code' => 'return',  'name' => 'Return Uniform'],
                        ['code' => 'replace', 'name' => 'Replace Uniform'],
                    ],
                ],
                /* * EAM: asset transfers between employees / locations */
                [
                    'code'    => 'asset-transfers',
                    'name'    => 'Asset Transfers',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/transfers',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Transfers'],
                        ['code' => 'create',  'name' => 'Initiate Transfer'],
                        ['code' => 'approve', 'name' => 'Approve Transfer'],
                        ['code' => 'reject',  'name' => 'Reject Transfer'],
                        ['code' => 'receive', 'name' => 'Acknowledge Receipt'],
                    ],
                ],
                /* * EAM: physical asset audits */
                [
                    'code'    => 'asset-audits',
                    'name'    => 'Asset Audits & Verification',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/audits',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Audits'],
                        ['code' => 'schedule', 'name' => 'Schedule Audit'],
                        ['code' => 'conduct',  'name' => 'Conduct Audit (Scan)'],
                        ['code' => 'reconcile','name' => 'Reconcile Discrepancies'],
                        ['code' => 'export',   'name' => 'Export Audit Report'],
                    ],
                ],
                /* * EAM: asset disposal / write-off */
                [
                    'code'    => 'asset-disposal',
                    'name'    => 'Asset Disposal / Write-Off',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/disposal',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Disposals'],
                        ['code' => 'request', 'name' => 'Request Disposal'],
                        ['code' => 'approve', 'name' => 'Approve Disposal'],
                        ['code' => 'execute', 'name' => 'Execute Disposal'],
                        ['code' => 'export',  'name' => 'Export Disposal Records'],
                    ],
                ],
                /* * EAM: depreciation view (cross-reference aero-finance) */
                [
                    'code'    => 'asset-depreciation',
                    'name'    => 'Asset Depreciation (Read-Only View)',
                    'type'    => 'page',
                    'route'   => '/hrm/assets/depreciation',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Depreciation Schedule'],
                        ['code' => 'export', 'name' => 'Export Depreciation Report'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 11 — RECRUITMENT
        |------------------------------------------------------------------
        */
        [
            'code'        => 'recruitment',
            'name'        => 'Recruitment',
            'description' => 'Job openings, applicant tracking pipeline, interviews, evaluations, and offer letters',
            'icon'        => 'BriefcaseIcon',
            'route'       => '/hrm/recruitment',
            'priority'    => 10,
            'components'  => [
                [
                    'code'    => 'job-openings',
                    'name'    => 'Job Openings',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/jobs',
                    'actions' => [
                        ['code' => 'view',      'name' => 'View Job Openings'],
                        ['code' => 'create',    'name' => 'Create Job Opening'],
                        ['code' => 'update',    'name' => 'Update Job Opening'],
                        ['code' => 'delete',    'name' => 'Delete Job Opening'],
                        ['code' => 'publish',   'name' => 'Publish Job Opening'],
                        ['code' => 'unpublish', 'name' => 'Unpublish Job Opening'],
                    ],
                ],
                [
                    'code'    => 'applicants',
                    'name'    => 'Applicants',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/applicants',
                    'actions' => [
                        ['code' => 'view',       'name' => 'View Applicants'],
                        ['code' => 'create',     'name' => 'Create Applicant'],
                        ['code' => 'update',     'name' => 'Update Applicant'],
                        ['code' => 'delete',     'name' => 'Delete Applicant'],
                        ['code' => 'move-stage', 'name' => 'Move Pipeline Stage'],
                        ['code' => 'export',     'name' => 'Export Applicants'],
                        ['code' => 'send-email', 'name' => 'Send Email to Applicant'],
                    ],
                ],
                [
                    'code'    => 'candidate-pipeline',
                    'name'    => 'Candidate Pipeline',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/pipeline',
                    'actions' => [
                        ['code' => 'view',      'name' => 'View Pipeline'],
                        ['code' => 'configure', 'name' => 'Configure Pipeline Stages'],
                    ],
                ],
                [
                    'code'    => 'interview-scheduling',
                    'name'    => 'Interview Scheduling',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/interviews',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Interview Schedules'],
                        ['code' => 'create', 'name' => 'Create Interview Schedule'],
                        ['code' => 'update', 'name' => 'Update Interview Schedule'],
                        ['code' => 'delete', 'name' => 'Delete Interview Schedule'],
                    ],
                ],
                [
                    'code'    => 'evaluation-scores',
                    'name'    => 'Evaluation Scores',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/evaluations',
                    'actions' => [['code' => 'manage', 'name' => 'Manage Evaluation Scores']],
                ],
                [
                    'code'    => 'offer-letters',
                    'name'    => 'Offer Letters',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/offer-letters',
                    'actions' => [
                        ['code' => 'create',  'name' => 'Create Offer Letter'],
                        ['code' => 'send',    'name' => 'Send Offer Letter'],
                        ['code' => 'approve', 'name' => 'Approve Offer Letter'],
                        ['code' => 'revoke',  'name' => 'Revoke Offer Letter'],
                    ],
                ],
                [
                    'code'    => 'portal-settings',
                    'name'    => 'Public Job Portal Settings',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/portal-settings',
                    'actions' => [['code' => 'configure', 'name' => 'Configure Job Portal']],
                ],
                [
                    'code'    => 'referral-program',
                    'name'    => 'Employee Referral Program',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/referrals',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Referrals'],
                        ['code' => 'manage', 'name' => 'Manage Referral Program'],
                        ['code' => 'reward', 'name' => 'Process Referral Reward'],
                    ],
                ],
                [
                    'code'    => 'requisition-approval',
                    'name'    => 'Job Requisition Approval',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/requisitions',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Requisitions'],
                        ['code' => 'create',  'name' => 'Create Requisition'],
                        ['code' => 'approve', 'name' => 'Approve Requisition'],
                        ['code' => 'reject',  'name' => 'Reject Requisition'],
                    ],
                ],
                [
                    'code'    => 'talent-pool',
                    'name'    => 'Talent Pool / Candidate CRM',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/talent-pool',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Talent Pool'],
                        ['code' => 'add',    'name' => 'Add to Talent Pool'],
                        ['code' => 'tag',    'name' => 'Tag Candidate'],
                        ['code' => 'nurture','name' => 'Send Nurture Campaign'],
                        ['code' => 'export', 'name' => 'Export Talent Pool'],
                    ],
                ],
                [
                    'code'    => 'sourcing-channels',
                    'name'    => 'Sourcing Channels & Job Boards',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/sourcing',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Channels'],
                        ['code' => 'configure','name' => 'Configure Job Board'],
                        ['code' => 'sync',     'name' => 'Sync Job Posting'],
                        ['code' => 'analytics','name' => 'View Channel Analytics'],
                    ],
                ],
                [
                    'code'    => 'background-verification',
                    'name'    => 'Background Verification',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/background-verification',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View BGV Records'],
                        ['code' => 'initiate','name' => 'Initiate Background Check'],
                        ['code' => 'update',  'name' => 'Update BGV Status'],
                        ['code' => 'verify',  'name' => 'Verify Result'],
                        ['code' => 'export',  'name' => 'Export BGV Report'],
                    ],
                ],
                [
                    'code'    => 'pre-boarding',
                    'name'    => 'Pre-Boarding (Pre-Day-1)',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/pre-boarding',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Pre-Boarding'],
                        ['code' => 'send-kit', 'name' => 'Send Welcome Kit'],
                        ['code' => 'collect',  'name' => 'Collect Documents'],
                        ['code' => 'assign',   'name' => 'Assign Buddy/Mentor'],
                    ],
                ],
                [
                    'code'    => 'recruitment-agencies',
                    'name'    => 'Recruitment Agencies / Vendors',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/agencies',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Agencies'],
                        ['code' => 'manage', 'name' => 'Manage Agencies'],
                        ['code' => 'rate',   'name' => 'Rate Agency Performance'],
                    ],
                ],
                [
                    'code'    => 'campus-recruitment',
                    'name'    => 'Campus / University Recruitment',
                    'type'    => 'page',
                    'route'   => '/hrm/recruitment/campus',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Campus Drives'],
                        ['code' => 'create', 'name' => 'Create Campus Drive'],
                        ['code' => 'manage', 'name' => 'Manage Drive Pipeline'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 12 — PERFORMANCE MANAGEMENT
        |------------------------------------------------------------------
        */
        [
            'code'        => 'performance',
            'name'        => 'Performance Management',
            'description' => 'KPIs, appraisals, 360° reviews, calibration, PIPs, and promotion recommendations',
            'icon'        => 'ChartBarSquareIcon',
            'route'       => '/hrm/performance',
            'priority'    => 11,
            'components'  => [
                [
                    'code'    => 'kpi-setup',
                    'name'    => 'KPI Setup',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/kpis',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View KPIs'],
                        ['code' => 'create', 'name' => 'Create KPI'],
                        ['code' => 'update', 'name' => 'Update KPI'],
                        ['code' => 'delete', 'name' => 'Delete KPI'],
                    ],
                ],
                [
                    'code'    => 'appraisal-cycles',
                    'name'    => 'Appraisal Cycles',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/appraisals',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Appraisal Cycles'],
                        ['code' => 'create', 'name' => 'Create Appraisal Cycle'],
                        ['code' => 'update', 'name' => 'Update Appraisal Cycle'],
                        ['code' => 'delete', 'name' => 'Delete Appraisal Cycle'],
                        ['code' => 'launch', 'name' => 'Launch Appraisal Cycle'],
                    ],
                ],
                [
                    'code'    => 'reviews-360',
                    'name'    => '360° Reviews',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/360-reviews',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View 360 Reviews'],
                        ['code' => 'submit',  'name' => 'Submit Review'],
                        ['code' => 'approve', 'name' => 'Approve Review'],
                        ['code' => 'reject',  'name' => 'Reject Review'],
                    ],
                ],
                [
                    'code'    => 'goals',
                    'name'    => 'Goal Management (OKR)',
                    'type'    => 'page',
                    'route'   => '/hrm/goals',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Goals'],
                        ['code' => 'create', 'name' => 'Create Goal'],
                        ['code' => 'update', 'name' => 'Update Goal'],
                        ['code' => 'delete', 'name' => 'Delete Goal'],
                        ['code' => 'align',  'name' => 'Align Goals to Company OKRs'],
                    ],
                ],
                [
                    'code'    => 'score-aggregation',
                    'name'    => 'Score Aggregation',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/scores',
                    'actions' => [['code' => 'view', 'name' => 'View Aggregated Scores']],
                ],
                [
                    'code'    => 'calibration',
                    'name'    => 'Performance Calibration',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/calibration',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Calibration'],
                        ['code' => 'manage', 'name' => 'Manage Calibration Sessions'],
                    ],
                ],
                [
                    'code'    => 'improvement-plans',
                    'name'    => 'Performance Improvement Plans (PIP)',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/improvement-plans',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Improvement Plans'],
                        ['code' => 'create', 'name' => 'Create Improvement Plan'],
                        ['code' => 'update', 'name' => 'Update Improvement Plan'],
                        ['code' => 'delete', 'name' => 'Delete Improvement Plan'],
                    ],
                ],
                [
                    'code'    => 'promotion-recommendations',
                    'name'    => 'Promotion Recommendations',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/promotions',
                    'actions' => [['code' => 'state-change', 'name' => 'Change Promotion State']],
                ],
                [
                    'code'    => 'continuous-feedback',
                    'name'    => 'Continuous Feedback',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/continuous-feedback',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Feedback'],
                        ['code' => 'give',    'name' => 'Give Feedback'],
                        ['code' => 'request', 'name' => 'Request Feedback'],
                        ['code' => 'reply',   'name' => 'Reply to Feedback'],
                    ],
                ],
                [
                    'code'    => 'one-on-ones',
                    'name'    => '1-on-1 Meetings',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/one-on-ones',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View 1-on-1s'],
                        ['code' => 'schedule', 'name' => 'Schedule 1-on-1'],
                        ['code' => 'agenda',   'name' => 'Set Agenda'],
                        ['code' => 'notes',    'name' => 'Capture Notes'],
                        ['code' => 'action',   'name' => 'Track Action Items'],
                    ],
                ],
                [
                    'code'    => 'check-ins',
                    'name'    => 'Periodic Check-Ins',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/check-ins',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Check-Ins'],
                        ['code' => 'submit', 'name' => 'Submit Check-In'],
                    ],
                ],
                [
                    'code'    => 'nine-box-grid',
                    'name'    => '9-Box Talent Grid',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/nine-box',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View 9-Box Grid'],
                        ['code' => 'place',  'name' => 'Place Employee'],
                        ['code' => 'export', 'name' => 'Export 9-Box'],
                    ],
                ],
                [
                    'code'    => 'performance-reports',
                    'name'    => 'Performance Reports',
                    'type'    => 'page',
                    'route'   => '/hrm/performance/reports',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Performance Reports'],
                        ['code' => 'export', 'name' => 'Export Performance Reports'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 13 — SKILLS & COMPETENCY
        |------------------------------------------------------------------
        */
        [
            'code'        => 'skills-competency',
            'name'        => 'Skills & Competency',
            'description' => 'Define competency frameworks, skill matrices, and employee skill profiles',
            'icon'        => 'AcademicCapIcon',
            'route'       => '/hrm/skills',
            'priority'    => 12,
            'components'  => [
                [
                    'code'    => 'competency-framework',
                    'name'    => 'Competency Framework',
                    'type'    => 'page',
                    'route'   => '/hrm/skills/competency-framework',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Competency Framework'],
                        ['code' => 'create', 'name' => 'Create Competency'],
                        ['code' => 'update', 'name' => 'Update Competency'],
                        ['code' => 'delete', 'name' => 'Delete Competency'],
                    ],
                ],
                [
                    'code'    => 'skill-catalog',
                    'name'    => 'Skill Catalog',
                    'type'    => 'page',
                    'route'   => '/hrm/skills/catalog',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Skill Catalog'],
                        ['code' => 'create', 'name' => 'Add Skill'],
                        ['code' => 'update', 'name' => 'Update Skill'],
                        ['code' => 'delete', 'name' => 'Delete Skill'],
                    ],
                ],
                [
                    'code'    => 'skill-matrix',
                    'name'    => 'Skill Matrix',
                    'type'    => 'page',
                    'route'   => '/hrm/skills/matrix',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Skill Matrix'],
                        ['code' => 'export', 'name' => 'Export Skill Matrix'],
                    ],
                ],
                [
                    'code'    => 'employee-skills',
                    'name'    => 'Employee Skill Profiles',
                    'type'    => 'page',
                    'route'   => '/hrm/skills/employee-profiles',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Employee Skills'],
                        ['code' => 'assess', 'name' => 'Assess Skill Levels'],
                        ['code' => 'update', 'name' => 'Update Skill Profile'],
                    ],
                ],
                [
                    'code'    => 'skill-gap-analysis',
                    'name'    => 'Skill Gap Analysis',
                    'type'    => 'page',
                    'route'   => '/hrm/skills/gap-analysis',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Skill Gaps'],
                        ['code' => 'run',    'name' => 'Run Gap Analysis'],
                        ['code' => 'export', 'name' => 'Export Gap Report'],
                    ],
                ],
                /* * EAM-critical: technician certifications & licenses with expiry alerts */
                [
                    'code'    => 'certifications-licenses',
                    'name'    => 'Certifications & Licenses',
                    'type'    => 'page',
                    'route'   => '/hrm/skills/certifications',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Certifications'],
                        ['code' => 'create',   'name' => 'Add Certification'],
                        ['code' => 'update',   'name' => 'Update Certification'],
                        ['code' => 'delete',   'name' => 'Delete Certification'],
                        ['code' => 'verify',   'name' => 'Verify Certification'],
                        ['code' => 'renew',    'name' => 'Renew Certification'],
                        ['code' => 'expire',   'name' => 'Mark Expired'],
                        ['code' => 'remind',   'name' => 'Send Expiry Reminder'],
                        ['code' => 'export',   'name' => 'Export Certification Register'],
                    ],
                ],
                /* * EAM: technician trade/craft register & competency authorization for work-orders */
                [
                    'code'    => 'trade-competency-authorization',
                    'name'    => 'Trade & Work Authorization',
                    'type'    => 'page',
                    'route'   => '/hrm/skills/trade-authorization',
                    'actions' => [
                        ['code' => 'view',      'name' => 'View Trade Authorizations'],
                        ['code' => 'authorize', 'name' => 'Authorize Trade/Task'],
                        ['code' => 'revoke',    'name' => 'Revoke Authorization'],
                        ['code' => 'audit',     'name' => 'Audit Authorizations'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 14 — TRAINING & LMS
        |------------------------------------------------------------------
        */
        [
            'code'        => 'training',
            'name'        => 'Training & LMS',
            'description' => 'Training programs, sessions, trainers, certifications, and learning paths',
            'icon'        => 'AcademicCapIcon',
            'route'       => '/hrm/training',
            'priority'    => 13,
            'components'  => [
                [
                    'code'    => 'training-programs',
                    'name'    => 'Training Programs',
                    'type'    => 'page',
                    'route'   => '/hrm/training/programs',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Training Programs'],
                        ['code' => 'create', 'name' => 'Create Training Program'],
                        ['code' => 'update', 'name' => 'Update Training Program'],
                        ['code' => 'delete', 'name' => 'Delete Training Program'],
                    ],
                ],
                [
                    'code'    => 'training-sessions',
                    'name'    => 'Training Sessions',
                    'type'    => 'page',
                    'route'   => '/hrm/training/sessions',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Training Sessions'],
                        ['code' => 'create', 'name' => 'Create Training Session'],
                        ['code' => 'update', 'name' => 'Update Training Session'],
                        ['code' => 'delete', 'name' => 'Delete Training Session'],
                    ],
                ],
                [
                    'code'    => 'learning-paths',
                    'name'    => 'Learning Paths',
                    'type'    => 'page',
                    'route'   => '/hrm/training/learning-paths',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Learning Paths'],
                        ['code' => 'create', 'name' => 'Create Learning Path'],
                        ['code' => 'update', 'name' => 'Update Learning Path'],
                        ['code' => 'assign', 'name' => 'Assign Learning Path'],
                    ],
                ],
                [
                    'code'    => 'trainers',
                    'name'    => 'Trainers',
                    'type'    => 'page',
                    'route'   => '/hrm/training/trainers',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Trainers'],
                        ['code' => 'create', 'name' => 'Create Trainer'],
                        ['code' => 'update', 'name' => 'Update Trainer'],
                        ['code' => 'delete', 'name' => 'Delete Trainer'],
                    ],
                ],
                [
                    'code'    => 'enrollment',
                    'name'    => 'Enrollment',
                    'type'    => 'page',
                    'route'   => '/hrm/training/enrollment',
                    'actions' => [['code' => 'manage', 'name' => 'Manage Training Enrollment']],
                ],
                [
                    'code'    => 'training-attendance',
                    'name'    => 'Attendance Tracking',
                    'type'    => 'page',
                    'route'   => '/hrm/training/attendance',
                    'actions' => [['code' => 'mark', 'name' => 'Mark Training Attendance']],
                ],
                [
                    'code'    => 'certifications',
                    'name'    => 'Certification Issuance',
                    'type'    => 'page',
                    'route'   => '/hrm/training/certifications',
                    'actions' => [
                        ['code' => 'generate', 'name' => 'Generate Certificate'],
                        ['code' => 'download', 'name' => 'Download Certificate'],
                        ['code' => 'manage',   'name' => 'Manage Expiry Reminders'],
                    ],
                ],
                [
                    'code'    => 'training-needs-analysis',
                    'name'    => 'Training Needs Analysis (TNA)',
                    'type'    => 'page',
                    'route'   => '/hrm/training/tna',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View TNA Reports'],
                        ['code' => 'conduct', 'name' => 'Conduct TNA'],
                        ['code' => 'export',  'name' => 'Export TNA'],
                    ],
                ],
                [
                    'code'    => 'course-library',
                    'name'    => 'Course Library (SCORM / xAPI)',
                    'type'    => 'page',
                    'route'   => '/hrm/training/course-library',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Courses'],
                        ['code' => 'upload', 'name' => 'Upload Course (SCORM/xAPI)'],
                        ['code' => 'update', 'name' => 'Update Course'],
                        ['code' => 'delete', 'name' => 'Delete Course'],
                        ['code' => 'assign', 'name' => 'Assign Course'],
                    ],
                ],
                [
                    'code'    => 'quizzes-assessments',
                    'name'    => 'Quizzes & Assessments',
                    'type'    => 'page',
                    'route'   => '/hrm/training/quizzes',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Quizzes'],
                        ['code' => 'create', 'name' => 'Create Quiz'],
                        ['code' => 'update', 'name' => 'Update Quiz'],
                        ['code' => 'delete', 'name' => 'Delete Quiz'],
                        ['code' => 'grade',  'name' => 'Grade Quiz'],
                    ],
                ],
                [
                    'code'    => 'external-training',
                    'name'    => 'External Training Tracking',
                    'type'    => 'page',
                    'route'   => '/hrm/training/external',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View External Trainings'],
                        ['code' => 'create', 'name' => 'Log External Training'],
                        ['code' => 'verify', 'name' => 'Verify Completion'],
                        ['code' => 'export', 'name' => 'Export External Trainings'],
                    ],
                ],
                /* * EAM-critical: regulatory/compliance training with mandatory tracking */
                [
                    'code'    => 'compliance-training',
                    'name'    => 'Compliance / Mandatory Training',
                    'type'    => 'page',
                    'route'   => '/hrm/training/compliance',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Compliance Training'],
                        ['code' => 'assign', 'name' => 'Assign Mandatory Training'],
                        ['code' => 'track',  'name' => 'Track Completion'],
                        ['code' => 'remind', 'name' => 'Send Reminder'],
                        ['code' => 'export', 'name' => 'Export Compliance Report'],
                    ],
                ],
                [
                    'code'    => 'training-budget',
                    'name'    => 'Training Budget',
                    'type'    => 'page',
                    'route'   => '/hrm/training/budget',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Training Budget'],
                        ['code' => 'manage', 'name' => 'Manage Training Budget'],
                        ['code' => 'export', 'name' => 'Export Budget Report'],
                    ],
                ],
                [
                    'code'    => 'training-feedback',
                    'name'    => 'Training Feedback (Kirkpatrick)',
                    'type'    => 'page',
                    'route'   => '/hrm/training/feedback',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Training Feedback'],
                        ['code' => 'submit', 'name' => 'Submit Feedback'],
                        ['code' => 'export', 'name' => 'Export Feedback Report'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 15 — DISCIPLINARY & ER CASES
        |------------------------------------------------------------------
        */
        [
            'code'        => 'disciplinary',
            'name'        => 'Disciplinary & Employee Relations',
            'description' => 'Manage disciplinary cases, investigations, warnings, grievances, and ER workflows',
            'icon'        => 'ExclamationTriangleIcon',
            'route'       => '/hrm/cases',
            'priority'    => 14,
            'components'  => [
                [
                    'code'    => 'disciplinary-cases',
                    'name'    => 'Disciplinary Cases',
                    'type'    => 'page',
                    'route'   => '/hrm/cases',
                    'actions' => [
                        ['code' => 'view',         'name' => 'View Cases'],
                        ['code' => 'create',       'name' => 'Create Case'],
                        ['code' => 'update',       'name' => 'Update Case'],
                        ['code' => 'delete',       'name' => 'Delete Case'],
                        ['code' => 'investigate',  'name' => 'Start Investigation'],
                        ['code' => 'take-action',  'name' => 'Take Action'],
                        ['code' => 'close',        'name' => 'Close Case'],
                        ['code' => 'appeal',       'name' => 'File Appeal'],
                    ],
                ],
                [
                    'code'    => 'warnings',
                    'name'    => 'Warnings',
                    'type'    => 'page',
                    'route'   => '/hrm/warnings',
                    'actions' => [
                        ['code' => 'view',  'name' => 'View Warnings'],
                        ['code' => 'issue', 'name' => 'Issue Warning'],
                    ],
                ],
                [
                    'code'    => 'action-types',
                    'name'    => 'Action Types',
                    'type'    => 'page',
                    'route'   => '/hrm/action-types',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Action Types'],
                        ['code' => 'manage', 'name' => 'Manage Action Types'],
                    ],
                ],
                [
                    'code'    => 'grievances',
                    'name'    => 'Grievances & Complaints',
                    'type'    => 'page',
                    'route'   => '/hrm/grievances',
                    'actions' => [
                        ['code' => 'view',        'name' => 'View Grievances'],
                        ['code' => 'create',      'name' => 'Submit Grievance'],
                        ['code' => 'update',      'name' => 'Update Grievance'],
                        ['code' => 'delete',      'name' => 'Delete Grievance'],
                        ['code' => 'investigate', 'name' => 'Investigate Grievance'],
                        ['code' => 'resolve',     'name' => 'Resolve Grievance'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 16 — SUCCESSION & CAREER DEVELOPMENT
        |------------------------------------------------------------------
        */
        [
            'code'        => 'talent-development',
            'name'        => 'Talent & Career Development',
            'description' => 'Succession planning, career pathing, 360° feedback, and individual development plans',
            'icon'        => 'ArrowTrendingUpIcon',
            'route'       => '/hrm/talent-development',
            'priority'    => 15,
            'components'  => [
                [
                    'code'    => 'succession-plans',
                    'name'    => 'Succession Plans',
                    'type'    => 'page',
                    'route'   => '/hrm/succession-planning',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Succession Plans'],
                        ['code' => 'create', 'name' => 'Create Succession Plan'],
                        ['code' => 'update', 'name' => 'Update Succession Plan'],
                        ['code' => 'delete', 'name' => 'Delete Succession Plan'],
                    ],
                ],
                [
                    'code'    => 'succession-candidates',
                    'name'    => 'Succession Candidates',
                    'type'    => 'page',
                    'route'   => '/hrm/succession-planning/candidates',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Candidates'],
                        ['code' => 'manage', 'name' => 'Manage Candidates'],
                    ],
                ],
                [
                    'code'    => 'career-paths',
                    'name'    => 'Career Paths',
                    'type'    => 'page',
                    'route'   => '/hrm/career-paths',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Career Paths'],
                        ['code' => 'create', 'name' => 'Create Career Path'],
                        ['code' => 'update', 'name' => 'Update Career Path'],
                        ['code' => 'delete', 'name' => 'Delete Career Path'],
                    ],
                ],
                [
                    'code'    => 'career-milestones',
                    'name'    => 'Career Milestones',
                    'type'    => 'page',
                    'route'   => '/hrm/career-paths/milestones',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Milestones'],
                        ['code' => 'manage', 'name' => 'Manage Milestones'],
                    ],
                ],
                [
                    'code'    => 'employee-progressions',
                    'name'    => 'Employee Progressions',
                    'type'    => 'page',
                    'route'   => '/hrm/career-paths/progressions',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Progressions'],
                        ['code' => 'assign', 'name' => 'Assign Career Path'],
                        ['code' => 'update', 'name' => 'Update Progression'],
                    ],
                ],
                [
                    'code'    => 'feedback-reviews',
                    'name'    => '360° Feedback Reviews',
                    'type'    => 'page',
                    'route'   => '/hrm/feedback-360',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View 360° Reviews'],
                        ['code' => 'create', 'name' => 'Create 360° Review'],
                        ['code' => 'update', 'name' => 'Update 360° Review'],
                        ['code' => 'delete', 'name' => 'Delete 360° Review'],
                        ['code' => 'launch', 'name' => 'Launch 360° Review'],
                    ],
                ],
                [
                    'code'    => 'feedback-responses',
                    'name'    => 'Feedback Responses',
                    'type'    => 'page',
                    'route'   => '/hrm/feedback-360/responses',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Responses'],
                        ['code' => 'submit', 'name' => 'Submit Feedback'],
                    ],
                ],
                [
                    'code'    => 'individual-development-plans',
                    'name'    => 'Individual Development Plans (IDP)',
                    'type'    => 'page',
                    'route'   => '/hrm/talent-development/idp',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View IDPs'],
                        ['code' => 'create', 'name' => 'Create IDP'],
                        ['code' => 'update', 'name' => 'Update IDP'],
                        ['code' => 'delete', 'name' => 'Delete IDP'],
                    ],
                ],
                [
                    'code'    => 'mentorship',
                    'name'    => 'Mentorship Programs',
                    'type'    => 'page',
                    'route'   => '/hrm/talent-development/mentorship',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Mentorship Programs'],
                        ['code' => 'create', 'name' => 'Create Mentorship Program'],
                        ['code' => 'pair',   'name' => 'Pair Mentor & Mentee'],
                        ['code' => 'track',  'name' => 'Track Mentorship Progress'],
                    ],
                ],
                [
                    'code'    => 'coaching',
                    'name'    => 'Coaching Programs',
                    'type'    => 'page',
                    'route'   => '/hrm/talent-development/coaching',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Coaching Programs'],
                        ['code' => 'create',   'name' => 'Create Coaching Engagement'],
                        ['code' => 'assign',   'name' => 'Assign Coach'],
                        ['code' => 'session',  'name' => 'Log Coaching Session'],
                        ['code' => 'evaluate', 'name' => 'Evaluate Outcomes'],
                    ],
                ],
                [
                    'code'    => 'high-potential-program',
                    'name'    => 'High-Potential (HiPo) Program',
                    'type'    => 'page',
                    'route'   => '/hrm/talent-development/hipo',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View HiPo Program'],
                        ['code' => 'identify', 'name' => 'Identify HiPo'],
                        ['code' => 'manage',   'name' => 'Manage Development Track'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 17 — COMPENSATION & WORKFORCE PLANNING
        |------------------------------------------------------------------
        */
        [
            'code'        => 'compensation-workforce',
            'name'        => 'Compensation & Workforce Planning',
            'description' => 'Salary reviews, adjustments, DEI analytics, headcount forecasting, and internal talent marketplace',
            'icon'        => 'BanknotesIcon',
            'route'       => '/hrm/compensation-planning',
            'priority'    => 16,
            'components'  => [
                [
                    'code'    => 'compensation-reviews',
                    'name'    => 'Compensation Review Cycles',
                    'type'    => 'page',
                    'route'   => '/hrm/compensation-planning/cycles',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Compensation Reviews'],
                        ['code' => 'create', 'name' => 'Create Compensation Review'],
                        ['code' => 'update', 'name' => 'Update Compensation Review'],
                        ['code' => 'delete', 'name' => 'Delete Compensation Review'],
                    ],
                ],
                [
                    'code'    => 'compensation-adjustments',
                    'name'    => 'Salary Adjustments',
                    'type'    => 'page',
                    'route'   => '/hrm/compensation-planning/adjustments',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Adjustments'],
                        ['code' => 'create',  'name' => 'Create Adjustment'],
                        ['code' => 'approve', 'name' => 'Approve Adjustment'],
                        ['code' => 'reject',  'name' => 'Reject Adjustment'],
                    ],
                ],
                [
                    'code'    => 'salary-benchmarking',
                    'name'    => 'Salary Benchmarking',
                    'type'    => 'page',
                    'route'   => '/hrm/compensation-planning/benchmarking',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Benchmarks'],
                        ['code' => 'import', 'name' => 'Import Market Data'],
                        ['code' => 'export', 'name' => 'Export Benchmark Report'],
                    ],
                ],
                [
                    'code'    => 'compensation-analytics',
                    'name'    => 'Compensation Analytics',
                    'type'    => 'page',
                    'route'   => '/hrm/compensation-planning/analytics',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Compensation Analytics'],
                        ['code' => 'export', 'name' => 'Export Compensation Data'],
                    ],
                ],
                [
                    'code'    => 'workforce-plans',
                    'name'    => 'Workforce Plans',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-planning',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Workforce Plans'],
                        ['code' => 'create',  'name' => 'Create Workforce Plan'],
                        ['code' => 'update',  'name' => 'Update Workforce Plan'],
                        ['code' => 'delete',  'name' => 'Delete Workforce Plan'],
                        ['code' => 'approve', 'name' => 'Approve Workforce Plan'],
                    ],
                ],
                [
                    'code'    => 'planned-positions',
                    'name'    => 'Planned Positions',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-planning/positions',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Planned Positions'],
                        ['code' => 'manage', 'name' => 'Manage Positions'],
                    ],
                ],
                [
                    'code'    => 'workforce-forecast',
                    'name'    => 'Workforce Forecast',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-planning/forecast',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Workforce Forecast'],
                        ['code' => 'generate', 'name' => 'Generate Forecast'],
                    ],
                ],
                [
                    'code'    => 'talent-marketplace',
                    'name'    => 'Internal Talent Marketplace',
                    'type'    => 'page',
                    'route'   => '/hrm/talent-marketplace',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Marketplace'],
                        ['code' => 'apply',  'name' => 'Apply to Opportunity'],
                        ['code' => 'manage', 'name' => 'Manage Opportunities'],
                    ],
                ],
                [
                    'code'    => 'dei-analytics',
                    'name'    => 'DEI Analytics',
                    'type'    => 'page',
                    'route'   => '/hrm/dei-analytics',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View DEI Analytics'],
                        ['code' => 'manage', 'name' => 'Manage DEI Analytics'],
                        ['code' => 'export', 'name' => 'Export DEI Report'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 18 — ENGAGEMENT & WELLBEING
        |------------------------------------------------------------------
        */
        [
            'code'        => 'engagement',
            'name'        => 'Employee Engagement & Wellbeing',
            'description' => 'Pulse surveys, eNPS, announcements, recognition, and wellbeing monitoring',
            'icon'        => 'HeartIcon',
            'route'       => '/hrm/engagement',
            'priority'    => 17,
            'components'  => [
                [
                    'code'    => 'pulse-surveys',
                    'name'    => 'Pulse Surveys',
                    'type'    => 'page',
                    'route'   => '/hrm/pulse-surveys',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Surveys'],
                        ['code' => 'create',  'name' => 'Create Survey'],
                        ['code' => 'update',  'name' => 'Update Survey'],
                        ['code' => 'delete',  'name' => 'Delete Survey'],
                        ['code' => 'publish', 'name' => 'Publish Survey'],
                        ['code' => 'analyze', 'name' => 'Analyze Results'],
                    ],
                ],
                [
                    'code'    => 'enps-dashboard',
                    'name'    => 'eNPS Dashboard',
                    'type'    => 'page',
                    'route'   => '/hrm/engagement/enps',
                    'actions' => [['code' => 'view', 'name' => 'View eNPS Dashboard']],
                ],
                [
                    'code'    => 'recognition',
                    'name'    => 'Employee Recognition & Awards',
                    'type'    => 'page',
                    'route'   => '/hrm/engagement/recognition',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Recognitions'],
                        ['code' => 'create',  'name' => 'Create Recognition'],
                        ['code' => 'nominate','name' => 'Nominate Employee'],
                        ['code' => 'approve', 'name' => 'Approve Recognition'],
                    ],
                ],
                [
                    'code'    => 'announcements',
                    'name'    => 'Announcements & Notice Board',
                    'type'    => 'page',
                    'route'   => '/hrm/announcements',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Announcements'],
                        ['code' => 'create',  'name' => 'Create Announcement'],
                        ['code' => 'update',  'name' => 'Update Announcement'],
                        ['code' => 'delete',  'name' => 'Delete Announcement'],
                        ['code' => 'publish', 'name' => 'Publish Announcement'],
                    ],
                ],
                [
                    'code'    => 'wellbeing-monitor',
                    'name'    => 'Wellbeing & Burnout Monitor',
                    'type'    => 'page',
                    'route'   => '/hrm/wellbeing',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Wellbeing Dashboard'],
                        ['code' => 'manage', 'name' => 'Manage Interventions'],
                    ],
                ],
                [
                    'code'    => 'engagement-surveys',
                    'name'    => 'Engagement Surveys',
                    'type'    => 'page',
                    'route'   => '/hrm/engagement/surveys',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Surveys'],
                        ['code' => 'create',  'name' => 'Create Survey'],
                        ['code' => 'launch',  'name' => 'Launch Survey'],
                        ['code' => 'analyze', 'name' => 'Analyze Results'],
                        ['code' => 'export',  'name' => 'Export Results'],
                    ],
                ],
                [
                    'code'    => 'peer-kudos',
                    'name'    => 'Peer Kudos / Shout-Outs',
                    'type'    => 'page',
                    'route'   => '/hrm/engagement/kudos',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Kudos Wall'],
                        ['code' => 'give', 'name' => 'Give Kudos'],
                        ['code' => 'react','name' => 'React to Kudos'],
                    ],
                ],
                [
                    'code'    => 'celebrations',
                    'name'    => 'Birthdays & Work Anniversaries',
                    'type'    => 'page',
                    'route'   => '/hrm/engagement/celebrations',
                    'actions' => [
                        ['code' => 'view',      'name' => 'View Upcoming Celebrations'],
                        ['code' => 'configure', 'name' => 'Configure Auto-Greetings'],
                    ],
                ],
                [
                    'code'    => 'eap',
                    'name'    => 'Employee Assistance Program (EAP)',
                    'type'    => 'page',
                    'route'   => '/hrm/wellbeing/eap',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View EAP Resources'],
                        ['code' => 'manage',  'name' => 'Manage EAP Providers'],
                        ['code' => 'request', 'name' => 'Request EAP Support'],
                    ],
                ],
                [
                    'code'    => 'mental-health-resources',
                    'name'    => 'Mental Health Resources',
                    'type'    => 'page',
                    'route'   => '/hrm/wellbeing/mental-health',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Resources'],
                        ['code' => 'manage', 'name' => 'Manage Resources'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 19 — WORKPLACE SAFETY
        |------------------------------------------------------------------
        */
        [
            'code'        => 'safety',
            'name'        => 'Workplace Safety',
            'description' => 'Workplace health & safety incidents, inspections, and safety training',
            'icon'        => 'ShieldCheckIcon',
            'route'       => '/hrm/safety',
            'priority'    => 18,
            'components'  => [
                [
                    'code'    => 'safety-incidents',
                    'name'    => 'Safety Incidents',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/incidents',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Incidents'],
                        ['code' => 'create',  'name' => 'Report Incident'],
                        ['code' => 'update',  'name' => 'Update Incident'],
                        ['code' => 'delete',  'name' => 'Delete Incident'],
                        ['code' => 'resolve', 'name' => 'Resolve Incident'],
                        ['code' => 'export',  'name' => 'Export Incident Reports'],
                    ],
                ],
                [
                    'code'    => 'safety-inspections',
                    'name'    => 'Safety Inspections',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/inspections',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Inspections'],
                        ['code' => 'create', 'name' => 'Create Inspection'],
                        ['code' => 'update', 'name' => 'Update Inspection'],
                        ['code' => 'delete', 'name' => 'Delete Inspection'],
                    ],
                ],
                [
                    'code'    => 'safety-training',
                    'name'    => 'Safety Training',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/training',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Safety Training'],
                        ['code' => 'create', 'name' => 'Create Safety Training'],
                        ['code' => 'update', 'name' => 'Update Safety Training'],
                    ],
                ],
                [
                    'code'    => 'safety-compliance',
                    'name'    => 'Safety Compliance Tracking',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/compliance',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Compliance Status'],
                        ['code' => 'manage', 'name' => 'Manage Compliance Rules'],
                        ['code' => 'export', 'name' => 'Export Compliance Report'],
                    ],
                ],
                /* * EAM-critical: near-miss reporting */
                [
                    'code'    => 'near-miss',
                    'name'    => 'Near-Miss Reporting',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/near-miss',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Near-Miss Reports'],
                        ['code' => 'create',  'name' => 'Report Near-Miss'],
                        ['code' => 'review',  'name' => 'Review Near-Miss'],
                        ['code' => 'analyze', 'name' => 'Analyze Trends'],
                    ],
                ],
                /* * EAM-critical: hazard register & job hazard analysis */
                [
                    'code'    => 'hazard-register',
                    'name'    => 'Hazard Register',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/hazards',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Hazards'],
                        ['code' => 'create', 'name' => 'Add Hazard'],
                        ['code' => 'update', 'name' => 'Update Hazard'],
                        ['code' => 'delete', 'name' => 'Delete Hazard'],
                        ['code' => 'rate',   'name' => 'Rate Risk Level'],
                    ],
                ],
                /* * EAM-critical: risk assessment / JSA / JHA */
                [
                    'code'    => 'risk-assessment',
                    'name'    => 'Risk Assessment (JSA / JHA)',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/risk-assessment',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Risk Assessments'],
                        ['code' => 'create',   'name' => 'Create Assessment'],
                        ['code' => 'update',   'name' => 'Update Assessment'],
                        ['code' => 'delete',   'name' => 'Delete Assessment'],
                        ['code' => 'approve',  'name' => 'Approve Assessment'],
                        ['code' => 'export',   'name' => 'Export Assessment'],
                    ],
                ],
                /* * EAM-critical: permit-to-work */
                [
                    'code'    => 'permit-to-work',
                    'name'    => 'Permit-to-Work (PTW)',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/permits',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Permits'],
                        ['code' => 'request', 'name' => 'Request Permit'],
                        ['code' => 'approve', 'name' => 'Approve Permit'],
                        ['code' => 'reject',  'name' => 'Reject Permit'],
                        ['code' => 'close',   'name' => 'Close Permit'],
                        ['code' => 'audit',   'name' => 'Audit Permits'],
                    ],
                ],
                /* * EAM-critical: lockout-tagout */
                [
                    'code'    => 'loto',
                    'name'    => 'Lockout / Tagout (LOTO)',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/loto',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View LOTO Records'],
                        ['code' => 'lockout',  'name' => 'Apply Lockout'],
                        ['code' => 'tagout',   'name' => 'Apply Tagout'],
                        ['code' => 'release',  'name' => 'Release LOTO'],
                        ['code' => 'audit',    'name' => 'Audit LOTO'],
                    ],
                ],
                /* * EAM-critical: PPE issuance & tracking */
                [
                    'code'    => 'ppe-management',
                    'name'    => 'PPE Issuance & Tracking',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/ppe',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View PPE Inventory'],
                        ['code' => 'issue',   'name' => 'Issue PPE'],
                        ['code' => 'return',  'name' => 'Return PPE'],
                        ['code' => 'replace', 'name' => 'Replace PPE'],
                        ['code' => 'inspect', 'name' => 'Inspect PPE'],
                        ['code' => 'export',  'name' => 'Export PPE Register'],
                    ],
                ],
                /* * EAM/HSE: toolbox talks & safety briefings */
                [
                    'code'    => 'toolbox-talks',
                    'name'    => 'Toolbox Talks & Safety Briefings',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/toolbox-talks',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Toolbox Talks'],
                        ['code' => 'schedule', 'name' => 'Schedule Talk'],
                        ['code' => 'conduct',  'name' => 'Record Conducted Talk'],
                        ['code' => 'attest',   'name' => 'Capture Attendance'],
                    ],
                ],
                /* * Workplace investigations beyond incidents */
                [
                    'code'    => 'investigations',
                    'name'    => 'Safety Investigations & Root Cause',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/investigations',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Investigations'],
                        ['code' => 'create',  'name' => 'Open Investigation'],
                        ['code' => 'analyze', 'name' => 'Run Root Cause Analysis'],
                        ['code' => 'close',   'name' => 'Close Investigation'],
                    ],
                ],
                /* * Drug & Alcohol Testing */
                [
                    'code'    => 'drug-alcohol-testing',
                    'name'    => 'Drug & Alcohol Testing',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/drug-alcohol',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Tests'],
                        ['code' => 'schedule','name' => 'Schedule Test'],
                        ['code' => 'record',  'name' => 'Record Result'],
                        ['code' => 'export',  'name' => 'Export Test Records'],
                    ],
                ],
                /* * Workers Compensation tracking */
                [
                    'code'    => 'workers-comp',
                    'name'    => 'Workers Compensation Claims',
                    'type'    => 'page',
                    'route'   => '/hrm/safety/workers-comp',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Claims'],
                        ['code' => 'create', 'name' => 'File Claim'],
                        ['code' => 'update', 'name' => 'Update Claim'],
                        ['code' => 'close',  'name' => 'Close Claim'],
                        ['code' => 'export', 'name' => 'Export Claims'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 20 — POLICIES & COMPLIANCE
        |------------------------------------------------------------------
        */
        [
            'code'        => 'compliance',
            'name'        => 'Policies & Compliance',
            'description' => 'HR policy management, employee acknowledgments, and regulatory compliance tracking',
            'icon'        => 'ClipboardDocumentListIcon',
            'route'       => '/hrm/compliance',
            'priority'    => 19,
            'components'  => [
                [
                    'code'    => 'policy-management',
                    'name'    => 'Policy Management',
                    'type'    => 'page',
                    'route'   => '/hrm/compliance/policies',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Policies'],
                        ['code' => 'create',  'name' => 'Create Policy'],
                        ['code' => 'update',  'name' => 'Update Policy'],
                        ['code' => 'delete',  'name' => 'Delete Policy'],
                        ['code' => 'publish', 'name' => 'Publish Policy'],
                        ['code' => 'archive', 'name' => 'Archive Policy'],
                    ],
                ],
                [
                    'code'    => 'policy-acknowledgments',
                    'name'    => 'Policy Acknowledgments',
                    'type'    => 'page',
                    'route'   => '/hrm/compliance/acknowledgments',
                    'actions' => [
                        ['code' => 'view',        'name' => 'View Acknowledgments'],
                        ['code' => 'send',        'name' => 'Send Acknowledgment Request'],
                        ['code' => 'track',       'name' => 'Track Acknowledgment Status'],
                        ['code' => 'export',      'name' => 'Export Acknowledgment Report'],
                    ],
                ],
                [
                    'code'    => 'labor-compliance',
                    'name'    => 'Labor Law Compliance',
                    'type'    => 'page',
                    'route'   => '/hrm/compliance/labor-law',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Compliance Checklist'],
                        ['code' => 'manage', 'name' => 'Manage Compliance Obligations'],
                        ['code' => 'export', 'name' => 'Export Compliance Report'],
                    ],
                ],
                [
                    'code'    => 'data-privacy',
                    'name'    => 'Data Privacy & GDPR',
                    'type'    => 'page',
                    'route'   => '/hrm/compliance/data-privacy',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Data Privacy Settings'],
                        ['code' => 'manage',  'name' => 'Manage Retention Policies'],
                        ['code' => 'request', 'name' => 'Handle Data Subject Requests'],
                        ['code' => 'export',  'name' => 'Export Consent Records'],
                    ],
                ],
                [
                    'code'    => 'recurring-background-checks',
                    'name'    => 'Recurring Background / Sanction Checks',
                    'type'    => 'page',
                    'route'   => '/hrm/compliance/background-checks',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Recurring Checks'],
                        ['code' => 'schedule', 'name' => 'Schedule Recurring Check'],
                        ['code' => 'run',      'name' => 'Run Check'],
                        ['code' => 'review',   'name' => 'Review Result'],
                    ],
                ],
                [
                    'code'    => 'posh-anti-harassment',
                    'name'    => 'POSH / Anti-Harassment',
                    'type'    => 'page',
                    'route'   => '/hrm/compliance/posh',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View POSH Cases'],
                        ['code' => 'report',  'name' => 'File POSH Complaint'],
                        ['code' => 'investigate','name' => 'Investigate Case'],
                        ['code' => 'resolve', 'name' => 'Resolve Case'],
                        ['code' => 'report-statutory', 'name' => 'Generate Annual POSH Report'],
                    ],
                ],
                [
                    'code'    => 'whistleblower',
                    'name'    => 'Whistleblower Hotline',
                    'type'    => 'page',
                    'route'   => '/hrm/compliance/whistleblower',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Reports'],
                        ['code' => 'report',  'name' => 'Submit Report (Anonymous)'],
                        ['code' => 'triage',  'name' => 'Triage Report'],
                        ['code' => 'resolve', 'name' => 'Resolve Report'],
                    ],
                ],
                [
                    'code'    => 'consent-management',
                    'name'    => 'Consent Management',
                    'type'    => 'page',
                    'route'   => '/hrm/compliance/consent',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Consent Records'],
                        ['code' => 'request','name' => 'Request Consent'],
                        ['code' => 'revoke', 'name' => 'Revoke Consent'],
                        ['code' => 'export', 'name' => 'Export Consent Log'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 21 — HR DOCUMENTS
        |------------------------------------------------------------------
        */
        [
            'code'        => 'documents',
            'name'        => 'HR Documents',
            'description' => 'Company-wide HR document management, templates, and employee document tracking',
            'icon'        => 'DocumentTextIcon',
            'route'       => '/hrm/documents',
            'priority'    => 20,
            'components'  => [
                [
                    'code'    => 'document-list',
                    'name'    => 'HR Documents',
                    'type'    => 'page',
                    'route'   => '/hrm/documents',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Documents'],
                        ['code' => 'create', 'name' => 'Create Document'],
                        ['code' => 'update', 'name' => 'Update Document'],
                        ['code' => 'delete', 'name' => 'Delete Document'],
                        ['code' => 'verify', 'name' => 'Verify Document'],
                        ['code' => 'export', 'name' => 'Export Documents'],
                    ],
                ],
                [
                    'code'    => 'document-templates',
                    'name'    => 'Document Templates',
                    'type'    => 'page',
                    'route'   => '/hrm/documents/templates',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Templates'],
                        ['code' => 'create', 'name' => 'Create Template'],
                        ['code' => 'update', 'name' => 'Update Template'],
                        ['code' => 'delete', 'name' => 'Delete Template'],
                        ['code' => 'use',    'name' => 'Generate Document from Template'],
                    ],
                ],
                [
                    'code'    => 'document-categories',
                    'name'    => 'Document Categories',
                    'type'    => 'page',
                    'route'   => '/hrm/document-categories',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Categories'],
                        ['code' => 'manage', 'name' => 'Manage Categories'],
                    ],
                ],
                [
                    'code'    => 'esignature',
                    'name'    => 'E-Signature',
                    'type'    => 'feature',
                    'route'   => null,
                    'actions' => [
                        ['code' => 'send',     'name' => 'Send for E-Signature'],
                        ['code' => 'track',    'name' => 'Track Signature Status'],
                        ['code' => 'reminder', 'name' => 'Send Signing Reminder'],
                        ['code' => 'cancel',   'name' => 'Cancel Signing Request'],
                    ],
                ],
                [
                    'code'    => 'bulk-letter-generation',
                    'name'    => 'Bulk Letter Generation',
                    'type'    => 'page',
                    'route'   => '/hrm/documents/bulk-generate',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Bulk Jobs'],
                        ['code' => 'generate', 'name' => 'Generate Bulk Letters'],
                        ['code' => 'download', 'name' => 'Download Bulk Letters'],
                        ['code' => 'send',     'name' => 'Send Bulk via Email'],
                    ],
                ],
                [
                    'code'    => 'letters-issued',
                    'name'    => 'Letters Issued (Offer / Employment / Relieving / Experience)',
                    'type'    => 'page',
                    'route'   => '/hrm/documents/letters',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Letters'],
                        ['code' => 'create', 'name' => 'Create Letter'],
                        ['code' => 'send',   'name' => 'Send Letter'],
                        ['code' => 'export', 'name' => 'Export Letters Register'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 22 — HR HELPDESK
        |------------------------------------------------------------------
        */
        [
            'code'        => 'helpdesk',
            'name'        => 'HR Help Desk',
            'description' => 'Employee query ticketing, SLA management, and HR service catalog',
            'icon'        => 'LifebuoyIcon',
            'route'       => '/hrm/helpdesk',
            'priority'    => 21,
            'components'  => [
                [
                    'code'    => 'ticket-list',
                    'name'    => 'HR Tickets',
                    'type'    => 'page',
                    'route'   => '/hrm/helpdesk/tickets',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View All Tickets'],
                        ['code' => 'create',  'name' => 'Create Ticket'],
                        ['code' => 'update',  'name' => 'Update Ticket'],
                        ['code' => 'assign',  'name' => 'Assign Ticket'],
                        ['code' => 'resolve', 'name' => 'Resolve Ticket'],
                        ['code' => 'close',   'name' => 'Close Ticket'],
                        ['code' => 'export',  'name' => 'Export Tickets'],
                    ],
                ],
                [
                    'code'    => 'ticket-categories',
                    'name'    => 'Ticket Categories',
                    'type'    => 'page',
                    'route'   => '/hrm/helpdesk/categories',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Categories'],
                        ['code' => 'manage', 'name' => 'Manage Categories'],
                    ],
                ],
                [
                    'code'    => 'sla-management',
                    'name'    => 'SLA Management',
                    'type'    => 'page',
                    'route'   => '/hrm/helpdesk/sla',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View SLA Rules'],
                        ['code' => 'manage', 'name' => 'Manage SLA Rules'],
                    ],
                ],
                [
                    'code'    => 'service-catalog',
                    'name'    => 'HR Service Catalog',
                    'type'    => 'page',
                    'route'   => '/hrm/helpdesk/service-catalog',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Service Catalog'],
                        ['code' => 'manage', 'name' => 'Manage Service Catalog'],
                    ],
                ],
                [
                    'code'    => 'faq-knowledge-base',
                    'name'    => 'FAQ & Knowledge Base',
                    'type'    => 'page',
                    'route'   => '/hrm/helpdesk/knowledge-base',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Knowledge Base'],
                        ['code' => 'create', 'name' => 'Create Article'],
                        ['code' => 'update', 'name' => 'Update Article'],
                        ['code' => 'delete', 'name' => 'Delete Article'],
                    ],
                ],
                [
                    'code'    => 'live-chat-bot',
                    'name'    => 'Live Chat / HR Chatbot',
                    'type'    => 'page',
                    'route'   => '/hrm/helpdesk/chat',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Chats'],
                        ['code' => 'reply',  'name' => 'Reply to Chat'],
                        ['code' => 'manage', 'name' => 'Manage Chatbot Intents'],
                    ],
                ],
                [
                    'code'    => 'csat-feedback',
                    'name'    => 'CSAT / Ticket Feedback',
                    'type'    => 'page',
                    'route'   => '/hrm/helpdesk/csat',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View CSAT Scores'],
                        ['code' => 'export', 'name' => 'Export CSAT Report'],
                    ],
                ],
                [
                    'code'    => 'escalation-matrix',
                    'name'    => 'Escalation Matrix',
                    'type'    => 'page',
                    'route'   => '/hrm/helpdesk/escalation',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Escalation Matrix'],
                        ['code' => 'manage', 'name' => 'Manage Escalation Rules'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 23 — HR ANALYTICS
        |------------------------------------------------------------------
        */
        [
            'code'        => 'hr-analytics',
            'name'        => 'HR Analytics',
            'description' => 'Workforce analytics, turnover, attendance insights, payroll cost, and custom reports',
            'icon'        => 'ChartPieIcon',
            'route'       => '/hrm/analytics',
            'priority'    => 22,
            'components'  => [
                [
                    'code'    => 'workforce-overview',
                    'name'    => 'Workforce Overview',
                    'type'    => 'page',
                    'route'   => '/hrm/analytics',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Workforce Overview'],
                        ['code' => 'export', 'name' => 'Export Workforce Data'],
                    ],
                ],
                [
                    'code'    => 'turnover-analytics',
                    'name'    => 'Turnover Analytics',
                    'type'    => 'page',
                    'route'   => '/hrm/analytics/turnover',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Turnover Analytics'],
                        ['code' => 'export', 'name' => 'Export Turnover Data'],
                    ],
                ],
                [
                    'code'    => 'attendance-insights',
                    'name'    => 'Attendance Insights',
                    'type'    => 'page',
                    'route'   => '/hrm/analytics/attendance',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Attendance Insights'],
                        ['code' => 'export', 'name' => 'Export Attendance Data'],
                    ],
                ],
                [
                    'code'    => 'payroll-cost-analysis',
                    'name'    => 'Payroll Cost Analysis',
                    'type'    => 'page',
                    'route'   => '/hrm/analytics/payroll',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Payroll Analysis'],
                        ['code' => 'export', 'name' => 'Export Payroll Data'],
                    ],
                ],
                [
                    'code'    => 'recruitment-funnel',
                    'name'    => 'Recruitment Funnel Analytics',
                    'type'    => 'page',
                    'route'   => '/hrm/analytics/recruitment',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Recruitment Funnel'],
                        ['code' => 'export', 'name' => 'Export Recruitment Data'],
                    ],
                ],
                [
                    'code'    => 'performance-insights',
                    'name'    => 'Performance Insights',
                    'type'    => 'page',
                    'route'   => '/hrm/analytics/performance',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Performance Insights'],
                        ['code' => 'export', 'name' => 'Export Performance Data'],
                    ],
                ],
                [
                    'code'    => 'training-insights',
                    'name'    => 'Training Insights',
                    'type'    => 'page',
                    'route'   => '/hrm/analytics/training',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Training Insights'],
                        ['code' => 'export', 'name' => 'Export Training Data'],
                    ],
                ],
                [
                    'code'    => 'custom-reports',
                    'name'    => 'Custom Reports Builder',
                    'type'    => 'page',
                    'route'   => '/hrm/analytics/custom-reports',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Reports'],
                        ['code' => 'create',  'name' => 'Create Custom Report'],
                        ['code' => 'update',  'name' => 'Update Report'],
                        ['code' => 'delete',  'name' => 'Delete Report'],
                        ['code' => 'export',  'name' => 'Export Report'],
                        ['code' => 'schedule','name' => 'Schedule Report Delivery'],
                    ],
                ],
                [
                    'code'    => 'analytics-reports',
                    'name'    => 'Analytics Reports',
                    'type'    => 'page',
                    'route'   => '/hrm/analytics/reports',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Analytics Reports'],
                        ['code' => 'export', 'name' => 'Export Analytics Reports'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 24 — AI ANALYTICS
        |------------------------------------------------------------------
        */
        [
            'code'        => 'ai-analytics',
            'name'        => 'AI Analytics',
            'description' => 'AI-powered predictive HR analytics: attrition, burnout, anomaly detection, and talent insights',
            'icon'        => 'SparklesIcon',
            'route'       => '/hrm/ai-analytics',
            'priority'    => 23,
            'components'  => [
                [
                    'code'    => 'ai-dashboard',
                    'name'    => 'AI Analytics Dashboard',
                    'type'    => 'page',
                    'route'   => '/hrm/ai-analytics',
                    'actions' => [['code' => 'view', 'name' => 'View AI Dashboard']],
                ],
                [
                    'code'    => 'attrition-predictions',
                    'name'    => 'Attrition Predictions',
                    'type'    => 'page',
                    'route'   => '/hrm/ai-analytics/attrition',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Attrition Predictions'],
                        ['code' => 'run',  'name' => 'Run Predictions'],
                    ],
                ],
                [
                    'code'    => 'burnout-analysis',
                    'name'    => 'Burnout Risk Analysis',
                    'type'    => 'page',
                    'route'   => '/hrm/ai-analytics/burnout',
                    'actions' => [['code' => 'view', 'name' => 'View Burnout Risks']],
                ],
                [
                    'code'    => 'talent-mobility',
                    'name'    => 'Talent Mobility Predictions',
                    'type'    => 'page',
                    'route'   => '/hrm/ai-analytics/talent-mobility',
                    'actions' => [['code' => 'view', 'name' => 'View Talent Mobility']],
                ],
                [
                    'code'    => 'anomaly-detection',
                    'name'    => 'Anomaly Detection',
                    'type'    => 'page',
                    'route'   => '/hrm/anomalies',
                    'actions' => [['code' => 'view', 'name' => 'View Anomalies']],
                ],
                [
                    'code'    => 'engagement-sentiment',
                    'name'    => 'Engagement Sentiment Analysis',
                    'type'    => 'page',
                    'route'   => '/hrm/engagement/sentiment',
                    'actions' => [['code' => 'view', 'name' => 'View Sentiment Analysis']],
                ],
                [
                    'code'    => 'ai-insights',
                    'name'    => 'AI Insights',
                    'type'    => 'page',
                    'route'   => '/hrm/insights',
                    'actions' => [['code' => 'view', 'name' => 'View AI Insights']],
                ],
                [
                    'code'    => 'hiring-intelligence',
                    'name'    => 'Hiring Intelligence',
                    'type'    => 'page',
                    'route'   => '/hrm/ai-analytics/hiring',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Hiring Intelligence'],
                        ['code' => 'run',  'name' => 'Run Candidate Scoring'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 25 — INTEGRATIONS HUB
        |------------------------------------------------------------------
        */
        [
            'code'        => 'integrations',
            'name'        => 'Integrations Hub',
            'description' => 'Manage third-party integrations, webhooks, biometric device sync, and API keys',
            'icon'        => 'ArrowsRightLeftIcon',
            'route'       => '/hrm/integrations',
            'priority'    => 24,
            'components'  => [
                [
                    'code'    => 'integration-catalog',
                    'name'    => 'Integration Catalog',
                    'type'    => 'page',
                    'route'   => '/hrm/integrations',
                    'actions' => [
                        ['code' => 'view',      'name' => 'View Integrations'],
                        ['code' => 'configure', 'name' => 'Configure Integration'],
                        ['code' => 'enable',    'name' => 'Enable Integration'],
                        ['code' => 'disable',   'name' => 'Disable Integration'],
                    ],
                ],
                [
                    'code'    => 'webhooks',
                    'name'    => 'Webhooks',
                    'type'    => 'page',
                    'route'   => '/hrm/integrations/webhooks',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Webhooks'],
                        ['code' => 'create', 'name' => 'Create Webhook'],
                        ['code' => 'update', 'name' => 'Update Webhook'],
                        ['code' => 'delete', 'name' => 'Delete Webhook'],
                        ['code' => 'test',   'name' => 'Test Webhook'],
                    ],
                ],
                [
                    'code'    => 'biometric-sync',
                    'name'    => 'Biometric Device Sync',
                    'type'    => 'page',
                    'route'   => '/hrm/integrations/biometric',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Device Sync Logs'],
                        ['code' => 'manage', 'name' => 'Manage Biometric Devices'],
                        ['code' => 'sync',   'name' => 'Trigger Manual Sync'],
                    ],
                ],
                [
                    'code'    => 'api-keys',
                    'name'    => 'API Keys',
                    'type'    => 'page',
                    'route'   => '/hrm/integrations/api-keys',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View API Keys'],
                        ['code' => 'create', 'name' => 'Create API Key'],
                        ['code' => 'delete', 'name' => 'Revoke API Key'],
                    ],
                ],
                [
                    'code'    => 'import-export',
                    'name'    => 'Bulk Import / Export',
                    'type'    => 'page',
                    'route'   => '/hrm/integrations/bulk',
                    'actions' => [
                        ['code' => 'import', 'name' => 'Import Data'],
                        ['code' => 'export', 'name' => 'Export Data'],
                        ['code' => 'view',   'name' => 'View Import/Export Logs'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 26 — AUDIT LOGS
        |------------------------------------------------------------------
        */
        [
            'code'        => 'audit',
            'name'        => 'Audit Logs',
            'description' => 'System-wide HR activity audit trail and change history',
            'icon'        => 'MagnifyingGlassCircleIcon',
            'route'       => '/hrm/audit',
            'priority'    => 25,
            'components'  => [
                [
                    'code'    => 'audit-logs',
                    'name'    => 'Audit Logs',
                    'type'    => 'page',
                    'route'   => '/hrm/audit',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Audit Logs'],
                        ['code' => 'export', 'name' => 'Export Audit Logs'],
                        ['code' => 'filter', 'name' => 'Filter Audit Logs'],
                    ],
                ],
                [
                    'code'    => 'change-history',
                    'name'    => 'Employee Change History',
                    'type'    => 'page',
                    'route'   => '/hrm/audit/change-history',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Change History'],
                        ['code' => 'export', 'name' => 'Export Change History'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 27 — HR SETTINGS
        |------------------------------------------------------------------
        */
        [
            'code'        => 'settings',
            'name'        => 'HR Settings',
            'description' => 'Configuration for all HR module features, policies, and system preferences',
            'icon'        => 'CogIcon',
            'route'       => '/hrm/settings',
            'priority'    => 99,
            'components'  => [
                ['code' => 'attendance-settings',         'name' => 'Attendance Settings',          'type' => 'page', 'route' => '/hrm/settings/attendance',
                    'actions' => [['code' => 'view', 'name' => 'View Settings'], ['code' => 'update', 'name' => 'Update Settings']]],
                ['code' => 'leave-settings',              'name' => 'Leave Settings',               'type' => 'page', 'route' => '/hrm/leave-settings',
                    'actions' => [['code' => 'view', 'name' => 'View Settings'], ['code' => 'update', 'name' => 'Update Settings']]],
                ['code' => 'payroll-settings',            'name' => 'Payroll Settings',             'type' => 'page', 'route' => '/hrm/settings/payroll',
                    'actions' => [['code' => 'view', 'name' => 'View Settings'], ['code' => 'update', 'name' => 'Update Settings']]],
                ['code' => 'onboarding-checklist-settings','name' => 'Onboarding Checklist Settings','type' => 'page', 'route' => '/hrm/checklists',
                    'actions' => [['code' => 'view', 'name' => 'View Settings'], ['code' => 'update', 'name' => 'Update Settings']]],
                ['code' => 'document-categories-settings','name' => 'Document Categories Settings', 'type' => 'page', 'route' => '/hrm/document-categories',
                    'actions' => [['code' => 'view', 'name' => 'View Settings'], ['code' => 'update', 'name' => 'Update Settings']]],
                ['code' => 'designation-settings',        'name' => 'Designation Settings',        'type' => 'page', 'route' => '/hrm/designations',
                    'actions' => [['code' => 'view', 'name' => 'View Settings'], ['code' => 'update', 'name' => 'Update Settings']]],
                ['code' => 'notification-settings',       'name' => 'Notification Settings',       'type' => 'page', 'route' => '/hrm/settings/notifications',
                    'actions' => [['code' => 'view', 'name' => 'View Settings'], ['code' => 'update', 'name' => 'Update Settings']]],
                ['code' => 'approval-workflow-settings',  'name' => 'Approval Workflow Settings',  'type' => 'page', 'route' => '/hrm/settings/approval-workflows',
                    'actions' => [['code' => 'view', 'name' => 'View Workflows'], ['code' => 'manage', 'name' => 'Manage Workflows']]],
                ['code' => 'email-template-settings',     'name' => 'Email Template Settings',     'type' => 'page', 'route' => '/hrm/settings/email-templates',
                    'actions' => [['code' => 'view', 'name' => 'View Templates'], ['code' => 'manage', 'name' => 'Manage Templates']]],
                ['code' => 'helpdesk-settings',           'name' => 'Help Desk Settings',          'type' => 'page', 'route' => '/hrm/settings/helpdesk',
                    'actions' => [['code' => 'view', 'name' => 'View Settings'], ['code' => 'update', 'name' => 'Update Settings']]],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 28 — TRAVEL & EXPENSE MANAGEMENT
        |------------------------------------------------------------------
        */
        [
            'code'        => 'travel',
            'name'        => 'Travel Management',
            'description' => 'Business travel requests, bookings, per-diems, advances, and travel expenses',
            'icon'        => 'PaperAirplaneIcon',
            'route'       => '/hrm/travel',
            'priority'    => 26,
            'components'  => [
                [
                    'code'    => 'travel-requests',
                    'name'    => 'Travel Requests',
                    'type'    => 'page',
                    'route'   => '/hrm/travel/requests',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View Travel Requests'],
                        ['code' => 'create',  'name' => 'Submit Travel Request'],
                        ['code' => 'update',  'name' => 'Update Travel Request'],
                        ['code' => 'approve', 'name' => 'Approve Travel Request'],
                        ['code' => 'reject',  'name' => 'Reject Travel Request'],
                        ['code' => 'cancel',  'name' => 'Cancel Travel Request'],
                    ],
                ],
                [
                    'code'    => 'travel-bookings',
                    'name'    => 'Travel Bookings (Flights / Hotels / Transport)',
                    'type'    => 'page',
                    'route'   => '/hrm/travel/bookings',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Bookings'],
                        ['code' => 'create', 'name' => 'Create Booking'],
                        ['code' => 'update', 'name' => 'Update Booking'],
                        ['code' => 'cancel', 'name' => 'Cancel Booking'],
                    ],
                ],
                [
                    'code'    => 'per-diem',
                    'name'    => 'Per-Diem & Travel Allowance',
                    'type'    => 'page',
                    'route'   => '/hrm/travel/per-diem',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Per-Diem Rates'],
                        ['code' => 'manage', 'name' => 'Manage Per-Diem Rates'],
                    ],
                ],
                [
                    'code'    => 'travel-advances',
                    'name'    => 'Travel Advances',
                    'type'    => 'page',
                    'route'   => '/hrm/travel/advances',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Advances'],
                        ['code' => 'request',  'name' => 'Request Advance'],
                        ['code' => 'approve',  'name' => 'Approve Advance'],
                        ['code' => 'settle',   'name' => 'Settle Advance'],
                    ],
                ],
                [
                    'code'    => 'travel-policies',
                    'name'    => 'Travel Policies',
                    'type'    => 'page',
                    'route'   => '/hrm/travel/policies',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Travel Policies'],
                        ['code' => 'manage', 'name' => 'Manage Travel Policies'],
                    ],
                ],
                [
                    'code'    => 'visa-passport',
                    'name'    => 'Visa & Passport Tracking',
                    'type'    => 'page',
                    'route'   => '/hrm/travel/visa-passport',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Visa/Passport Records'],
                        ['code' => 'manage', 'name' => 'Manage Records'],
                        ['code' => 'remind', 'name' => 'Send Expiry Reminders'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 29 — VISITOR MANAGEMENT
        |------------------------------------------------------------------
        | Office/site visitor check-in, badges, NDAs, host notification.
        | EAM-relevant: contractor sign-in tied to permit-to-work.
        */
        [
            'code'        => 'visitors',
            'name'        => 'Visitor Management',
            'description' => 'Visitor pre-registration, check-in/out, badges, NDA capture, and host notifications',
            'icon'        => 'IdentificationIcon',
            'route'       => '/hrm/visitors',
            'priority'    => 27,
            'components'  => [
                [
                    'code'    => 'visitor-log',
                    'name'    => 'Visitor Log',
                    'type'    => 'page',
                    'route'   => '/hrm/visitors',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Visitor Log'],
                        ['code' => 'check-in', 'name' => 'Check In Visitor'],
                        ['code' => 'check-out','name' => 'Check Out Visitor'],
                        ['code' => 'export',   'name' => 'Export Visitor Log'],
                    ],
                ],
                [
                    'code'    => 'pre-registration',
                    'name'    => 'Visitor Pre-Registration',
                    'type'    => 'page',
                    'route'   => '/hrm/visitors/pre-registration',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Pre-Registrations'],
                        ['code' => 'create', 'name' => 'Pre-Register Visitor'],
                        ['code' => 'invite', 'name' => 'Send Visitor Invite'],
                    ],
                ],
                [
                    'code'    => 'badges-passes',
                    'name'    => 'Badges & Passes',
                    'type'    => 'page',
                    'route'   => '/hrm/visitors/badges',
                    'actions' => [
                        ['code' => 'view',  'name' => 'View Badges'],
                        ['code' => 'print', 'name' => 'Print Badge'],
                        ['code' => 'void',  'name' => 'Void Badge'],
                    ],
                ],
                /* * EAM: contractor sign-in tied to permits */
                [
                    'code'    => 'contractor-sign-in',
                    'name'    => 'Contractor Sign-In (Permit-Linked)',
                    'type'    => 'page',
                    'route'   => '/hrm/visitors/contractors',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Contractor Sign-Ins'],
                        ['code' => 'check-in', 'name' => 'Check In Contractor'],
                        ['code' => 'verify-permit', 'name' => 'Verify Active Permit'],
                        ['code' => 'check-out','name' => 'Check Out Contractor'],
                    ],
                ],
                [
                    'code'    => 'visitor-nda',
                    'name'    => 'NDA & Safety Briefing Capture',
                    'type'    => 'page',
                    'route'   => '/hrm/visitors/nda',
                    'actions' => [
                        ['code' => 'view',    'name' => 'View NDAs'],
                        ['code' => 'capture', 'name' => 'Capture Signature'],
                    ],
                ],
            ],
        ],

        /*
        |------------------------------------------------------------------
        | GROUP 30 — WORKFORCE SCHEDULING (EAM-CRITICAL)
        |------------------------------------------------------------------
        | Crew/technician scheduling distinct from generic shift scheduling.
        | Skill-based, location-aware, work-order-aware. Feeds field-service
        | dispatch, EAM work orders, and project resource plans.
        */
        [
            'code'        => 'workforce-scheduling',
            'name'        => 'Workforce Scheduling',
            'description' => 'Skill-based crew/technician scheduling, dispatching, and resource availability for EAM, field service, and projects',
            'icon'        => 'CalendarDaysIcon',
            'route'       => '/hrm/workforce-scheduling',
            'priority'    => 28,
            'components'  => [
                [
                    'code'    => 'schedule-board',
                    'name'    => 'Schedule Board (Gantt)',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-scheduling/board',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Schedule Board'],
                        ['code' => 'assign', 'name' => 'Assign Resource'],
                        ['code' => 'reassign','name' => 'Reassign Resource'],
                        ['code' => 'unassign','name' => 'Unassign Resource'],
                        ['code' => 'export', 'name' => 'Export Schedule'],
                    ],
                ],
                [
                    'code'    => 'crew-management',
                    'name'    => 'Crews & Teams',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-scheduling/crews',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Crews'],
                        ['code' => 'create', 'name' => 'Create Crew'],
                        ['code' => 'update', 'name' => 'Update Crew'],
                        ['code' => 'delete', 'name' => 'Delete Crew'],
                    ],
                ],
                [
                    'code'    => 'availability',
                    'name'    => 'Resource Availability',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-scheduling/availability',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Availability'],
                        ['code' => 'update', 'name' => 'Update Availability'],
                    ],
                ],
                [
                    'code'    => 'on-call-roster',
                    'name'    => 'On-Call Roster',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-scheduling/on-call',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View On-Call Roster'],
                        ['code' => 'manage', 'name' => 'Manage On-Call Roster'],
                        ['code' => 'swap',   'name' => 'Swap On-Call Slot'],
                    ],
                ],
                [
                    'code'    => 'capacity-planning',
                    'name'    => 'Capacity Planning',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-scheduling/capacity',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Capacity'],
                        ['code' => 'forecast','name' => 'Forecast Capacity'],
                    ],
                ],
                [
                    'code'    => 'skill-based-dispatch',
                    'name'    => 'Skill-Based Dispatch',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-scheduling/dispatch',
                    'actions' => [
                        ['code' => 'view',     'name' => 'View Dispatch'],
                        ['code' => 'auto',     'name' => 'Auto-Assign by Skill'],
                        ['code' => 'manual',   'name' => 'Manual Dispatch'],
                        ['code' => 'override', 'name' => 'Override Assignment'],
                    ],
                ],
                [
                    'code'    => 'time-off-coverage',
                    'name'    => 'Time-Off Coverage',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-scheduling/coverage',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Coverage Gaps'],
                        ['code' => 'fill',   'name' => 'Fill Coverage Gap'],
                    ],
                ],
                [
                    'code'    => 'labor-cost-forecast',
                    'name'    => 'Labor Cost Forecast',
                    'type'    => 'page',
                    'route'   => '/hrm/workforce-scheduling/labor-cost',
                    'actions' => [
                        ['code' => 'view',   'name' => 'View Labor Cost'],
                        ['code' => 'export', 'name' => 'Export Labor Cost Report'],
                    ],
                ],
            ],
        ],

    ], // end submodules

    /*
    |--------------------------------------------------------------------------
    | EAM Integration Map
    |--------------------------------------------------------------------------
    | Declares which HRM submodules participate in cross-package EAM flows.
    | Consumed by aero-eam/aero-platform orchestrators (when present) to
    | discover capability without hard-coupling.
    */
    'eam_integration' => [
        'provides' => [
            'workforce.technicians'        => 'employees',
            'workforce.skills'             => 'skills-competency',
            'workforce.certifications'     => 'skills-competency.certifications-licenses',
            'workforce.authorizations'     => 'skills-competency.trade-competency-authorization',
            'workforce.scheduling'         => 'workforce-scheduling',
            'workforce.dispatch'           => 'workforce-scheduling.skill-based-dispatch',
            'workforce.timesheets'         => 'attendance.timesheets',
            'workforce.training'           => 'training',
            'workforce.compliance_training'=> 'training.compliance-training',
            'safety.incidents'             => 'safety.safety-incidents',
            'safety.near_miss'             => 'safety.near-miss',
            'safety.hazards'               => 'safety.hazard-register',
            'safety.risk_assessments'      => 'safety.risk-assessment',
            'safety.permit_to_work'        => 'safety.permit-to-work',
            'safety.loto'                  => 'safety.loto',
            'safety.ppe'                   => 'safety.ppe-management',
            'safety.toolbox_talks'         => 'safety.toolbox-talks',
            'assets.workforce_allocation'  => 'assets',
            'assets.tools_equipment'       => 'assets.tools-equipment',
            'assets.vehicles'              => 'assets.vehicles-fleet',
            'assets.transfers'             => 'assets.asset-transfers',
            'assets.audits'                => 'assets.asset-audits',
            'visitor.contractor_sign_in'   => 'visitors.contractor-sign-in',
        ],
        'consumes' => [
            'finance.depreciation_schedule' => 'aero-finance',
            'ims.spares_inventory'          => 'aero-ims',
            'iot.asset_telemetry'           => 'aero-iot',
            'eam.work_orders'               => 'aero-eam',
            'eam.maintenance_schedule'      => 'aero-eam',
            'field_service.dispatch'        => 'aero-field-service',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Access Control
    |--------------------------------------------------------------------------
    */
    'access_control' => [
        'super_admin_role' => 'super-admin',
        'hr_admin_role'    => 'hr-admin',
        'cache_ttl'        => 3600,
        'cache_tags'       => ['module-access', 'role-access', 'hrm-access'],
    ],

];