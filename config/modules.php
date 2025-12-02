<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Module Hierarchy Configuration
    |--------------------------------------------------------------------------
    |
    | This file defines the complete module hierarchy for the application.
    | Structure: modules → submodules → components → actions
    |
    | Modules are hardcoded here, but the "required permissions" for each
    | level are dynamic and can be configured by:
    | - Platform Admin: Assigns default required permissions
    | - Tenant Admin: Can override/customize required permissions for their tenant
    |
    | Access Control Logic:
    | User Access = Plan Access (subscription) ∩ Permission Match (RBAC)
    |
    */

    'hierarchy' => [
        /*
        |--------------------------------------------------------------------------
        | Core Platform Module (Always Enabled)
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'core',
            'name' => 'Core Platform',
            'description' => 'Essential platform features including tenant management, authentication, and settings',
            'icon' => 'Cog6ToothIcon',
            'route_prefix' => '/tenant',
            'category' => 'core_system',
            'priority' => 1,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => [], // Core always accessible

            'submodules' => [
                [
                    'code' => 'dashboard',
                    'name' => 'Dashboard',
                    'description' => 'Main dashboard and overview',
                    'icon' => 'HomeIcon',
                    'route' => '/tenant/dashboard',
                    'priority' => 1,
                    'default_required_permissions' => [],

                    'components' => [
                        [
                            'code' => 'overview',
                            'name' => 'Overview Widget',
                            'description' => 'Dashboard overview statistics',
                            'type' => 'widget',
                            'route' => null,
                            'default_required_permissions' => [],

                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dashboard', 'default_required_permissions' => []],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'settings',
                    'name' => 'Settings',
                    'description' => 'Tenant configuration and settings',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/tenant/settings',
                    'priority' => 10,
                    'default_required_permissions' => ['tenant.settings.view'],

                    'components' => [
                        [
                            'code' => 'general',
                            'name' => 'General Settings',
                            'type' => 'page',
                            'route' => '/tenant/settings/general',
                            'default_required_permissions' => ['tenant.settings.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Settings', 'default_required_permissions' => ['tenant.settings.view']],
                                ['code' => 'update', 'name' => 'Update Settings', 'default_required_permissions' => ['tenant.settings.update']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'users',
                    'name' => 'User Management',
                    'description' => 'Manage tenant users',
                    'icon' => 'UsersIcon',
                    'route' => '/tenant/users',
                    'priority' => 20,
                    'default_required_permissions' => ['tenant.users.view'],

                    'components' => [
                        [
                            'code' => 'user-list',
                            'name' => 'User List',
                            'type' => 'page',
                            'route' => '/tenant/users',
                            'default_required_permissions' => ['tenant.users.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Users', 'default_required_permissions' => ['tenant.users.view']],
                                ['code' => 'create', 'name' => 'Create User', 'default_required_permissions' => ['tenant.users.create']],
                                ['code' => 'update', 'name' => 'Edit User', 'default_required_permissions' => ['tenant.users.update']],
                                ['code' => 'delete', 'name' => 'Delete User', 'default_required_permissions' => ['tenant.users.delete']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'roles',
                    'name' => 'Roles & Permissions',
                    'description' => 'Manage roles and permissions',
                    'icon' => 'ShieldCheckIcon',
                    'route' => '/tenant/roles',
                    'priority' => 30,
                    'default_required_permissions' => ['tenant.roles.view'],

                    'components' => [
                        [
                            'code' => 'role-management',
                            'name' => 'Role Management',
                            'type' => 'page',
                            'route' => '/tenant/roles',
                            'default_required_permissions' => ['tenant.roles.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Roles', 'default_required_permissions' => ['tenant.roles.view']],
                                ['code' => 'create', 'name' => 'Create Role', 'default_required_permissions' => ['tenant.roles.create']],
                                ['code' => 'update', 'name' => 'Edit Role', 'default_required_permissions' => ['tenant.roles.update']],
                                ['code' => 'delete', 'name' => 'Delete Role', 'default_required_permissions' => ['tenant.roles.delete']],
                                ['code' => 'assign', 'name' => 'Assign Permissions', 'default_required_permissions' => ['tenant.roles.update']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | Human Resources Management (HRM) Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'hrm',
            'name' => 'Human Resources',
            'description' => 'Complete HR management including employees, attendance, leave, and payroll',
            'icon' => 'UserGroupIcon',
            'route_prefix' => '/tenant/hr',
            'category' => 'human_resources',
            'priority' => 10,
            'is_core' => false,
            'is_active' => true,
            'default_required_permissions' => ['hr.access'],

            'submodules' => [
                [
                    'code' => 'employees',
                    'name' => 'Employee Information',
                    'description' => 'Employee profiles, departments, designations',
                    'icon' => 'UsersIcon',
                    'route' => '/tenant/hr/employees',
                    'priority' => 1,
                    'default_required_permissions' => ['hr.employees.view'],

                    'components' => [
                        [
                            'code' => 'employee-list',
                            'name' => 'Employee List',
                            'type' => 'page',
                            'route' => '/tenant/hr/employees',
                            'default_required_permissions' => ['hr.employees.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Employees', 'default_required_permissions' => ['hr.employees.view']],
                                ['code' => 'create', 'name' => 'Add Employee', 'default_required_permissions' => ['hr.employees.create']],
                                ['code' => 'update', 'name' => 'Edit Employee', 'default_required_permissions' => ['hr.employees.update']],
                                ['code' => 'delete', 'name' => 'Delete Employee', 'default_required_permissions' => ['hr.employees.delete']],
                                ['code' => 'export', 'name' => 'Export Employees', 'default_required_permissions' => ['hr.employees.export']],
                                ['code' => 'import', 'name' => 'Import Employees', 'default_required_permissions' => ['hr.employees.import']],
                            ],
                        ],
                        [
                            'code' => 'employee-profile',
                            'name' => 'Employee Profile',
                            'type' => 'page',
                            'route' => '/tenant/hr/employees/{id}',
                            'default_required_permissions' => ['hr.employees.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Profile', 'default_required_permissions' => ['hr.employees.view']],
                                ['code' => 'update', 'name' => 'Edit Profile', 'default_required_permissions' => ['hr.employees.update']],
                            ],
                        ],
                        [
                            'code' => 'departments',
                            'name' => 'Departments',
                            'type' => 'section',
                            'route' => '/tenant/hr/departments',
                            'default_required_permissions' => ['hr.departments.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Departments', 'default_required_permissions' => ['hr.departments.view']],
                                ['code' => 'manage', 'name' => 'Manage Departments', 'default_required_permissions' => ['hr.departments.manage']],
                            ],
                        ],
                        [
                            'code' => 'designations',
                            'name' => 'Designations',
                            'type' => 'section',
                            'route' => '/tenant/hr/designations',
                            'default_required_permissions' => ['hr.designations.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Designations', 'default_required_permissions' => ['hr.designations.view']],
                                ['code' => 'manage', 'name' => 'Manage Designations', 'default_required_permissions' => ['hr.designations.manage']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'attendance',
                    'name' => 'Attendance Management',
                    'description' => 'Track employee attendance and work hours',
                    'icon' => 'ClockIcon',
                    'route' => '/tenant/hr/attendance',
                    'priority' => 2,
                    'default_required_permissions' => ['hr.attendance.view'],

                    'components' => [
                        [
                            'code' => 'attendance-tracking',
                            'name' => 'Attendance Tracking',
                            'type' => 'page',
                            'route' => '/tenant/hr/attendance',
                            'default_required_permissions' => ['hr.attendance.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Attendance', 'default_required_permissions' => ['hr.attendance.view']],
                                ['code' => 'mark', 'name' => 'Mark Attendance', 'default_required_permissions' => ['hr.attendance.mark']],
                                ['code' => 'approve', 'name' => 'Approve Attendance', 'default_required_permissions' => ['hr.attendance.approve']],
                                ['code' => 'export', 'name' => 'Export Attendance', 'default_required_permissions' => ['hr.attendance.export']],
                            ],
                        ],
                        [
                            'code' => 'my-attendance',
                            'name' => 'My Attendance',
                            'type' => 'page',
                            'route' => '/tenant/hr/my-attendance',
                            'default_required_permissions' => [],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Own Attendance', 'default_required_permissions' => []],
                                ['code' => 'punch', 'name' => 'Punch In/Out', 'default_required_permissions' => []],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'leave',
                    'name' => 'Leave Management',
                    'description' => 'Manage leave requests and balances',
                    'icon' => 'CalendarIcon',
                    'route' => '/tenant/hr/leave',
                    'priority' => 3,
                    'default_required_permissions' => ['hr.leave.view'],

                    'components' => [
                        [
                            'code' => 'leave-requests',
                            'name' => 'Leave Requests',
                            'type' => 'page',
                            'route' => '/tenant/hr/leave/requests',
                            'default_required_permissions' => ['hr.leave.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Leave Requests', 'default_required_permissions' => ['hr.leave.view']],
                                ['code' => 'apply', 'name' => 'Apply Leave', 'default_required_permissions' => ['hr.leave.apply']],
                                ['code' => 'approve', 'name' => 'Approve Leave', 'default_required_permissions' => ['hr.leave.approve']],
                                ['code' => 'cancel', 'name' => 'Cancel Leave', 'default_required_permissions' => ['hr.leave.cancel']],
                            ],
                        ],
                        [
                            'code' => 'leave-balance',
                            'name' => 'Leave Balance',
                            'type' => 'widget',
                            'route' => null,
                            'default_required_permissions' => [],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Leave Balance', 'default_required_permissions' => []],
                                ['code' => 'manage', 'name' => 'Manage Leave Balance', 'default_required_permissions' => ['hr.leave.manage-balance']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'payroll',
                    'name' => 'Payroll Management',
                    'description' => 'Process payroll and manage salary structures',
                    'icon' => 'CurrencyDollarIcon',
                    'route' => '/tenant/hr/payroll',
                    'priority' => 4,
                    'default_required_permissions' => ['hr.payroll.view'],

                    'components' => [
                        [
                            'code' => 'payroll-processing',
                            'name' => 'Payroll Processing',
                            'type' => 'page',
                            'route' => '/tenant/hr/payroll',
                            'default_required_permissions' => ['hr.payroll.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Payroll', 'default_required_permissions' => ['hr.payroll.view']],
                                ['code' => 'process', 'name' => 'Process Payroll', 'default_required_permissions' => ['hr.payroll.process']],
                                ['code' => 'approve', 'name' => 'Approve Payroll', 'default_required_permissions' => ['hr.payroll.approve']],
                            ],
                        ],
                        [
                            'code' => 'salary-structures',
                            'name' => 'Salary Structures',
                            'type' => 'section',
                            'route' => '/tenant/hr/payroll/structures',
                            'default_required_permissions' => ['hr.salary-structures.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Salary Structures', 'default_required_permissions' => ['hr.salary-structures.view']],
                                ['code' => 'manage', 'name' => 'Manage Salary Structures', 'default_required_permissions' => ['hr.salary-structures.manage']],
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
        */
        [
            'code' => 'crm',
            'name' => 'Customer Relations',
            'description' => 'Manage leads, contacts, deals, and customer relationships',
            'icon' => 'UserGroupIcon',
            'route_prefix' => '/tenant/crm',
            'category' => 'customer_relations',
            'priority' => 20,
            'is_core' => false,
            'is_active' => true,
            'default_required_permissions' => ['crm.access'],

            'submodules' => [
                [
                    'code' => 'leads',
                    'name' => 'Leads',
                    'description' => 'Manage sales leads',
                    'icon' => 'UserPlusIcon',
                    'route' => '/tenant/crm/leads',
                    'priority' => 1,
                    'default_required_permissions' => ['crm.leads.view'],

                    'components' => [
                        [
                            'code' => 'lead-list',
                            'name' => 'Lead List',
                            'type' => 'page',
                            'route' => '/tenant/crm/leads',
                            'default_required_permissions' => ['crm.leads.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Leads', 'default_required_permissions' => ['crm.leads.view']],
                                ['code' => 'create', 'name' => 'Create Lead', 'default_required_permissions' => ['crm.leads.create']],
                                ['code' => 'update', 'name' => 'Update Lead', 'default_required_permissions' => ['crm.leads.update']],
                                ['code' => 'delete', 'name' => 'Delete Lead', 'default_required_permissions' => ['crm.leads.delete']],
                                ['code' => 'convert', 'name' => 'Convert to Contact', 'default_required_permissions' => ['crm.leads.convert']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'contacts',
                    'name' => 'Contacts',
                    'description' => 'Manage customer contacts',
                    'icon' => 'UsersIcon',
                    'route' => '/tenant/crm/contacts',
                    'priority' => 2,
                    'default_required_permissions' => ['crm.contacts.view'],

                    'components' => [
                        [
                            'code' => 'contact-list',
                            'name' => 'Contact List',
                            'type' => 'page',
                            'route' => '/tenant/crm/contacts',
                            'default_required_permissions' => ['crm.contacts.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Contacts', 'default_required_permissions' => ['crm.contacts.view']],
                                ['code' => 'create', 'name' => 'Create Contact', 'default_required_permissions' => ['crm.contacts.create']],
                                ['code' => 'update', 'name' => 'Update Contact', 'default_required_permissions' => ['crm.contacts.update']],
                                ['code' => 'delete', 'name' => 'Delete Contact', 'default_required_permissions' => ['crm.contacts.delete']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'deals',
                    'name' => 'Deals',
                    'description' => 'Manage sales opportunities',
                    'icon' => 'BanknotesIcon',
                    'route' => '/tenant/crm/deals',
                    'priority' => 3,
                    'default_required_permissions' => ['crm.deals.view'],

                    'components' => [
                        [
                            'code' => 'deal-pipeline',
                            'name' => 'Deal Pipeline',
                            'type' => 'page',
                            'route' => '/tenant/crm/deals',
                            'default_required_permissions' => ['crm.deals.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Deals', 'default_required_permissions' => ['crm.deals.view']],
                                ['code' => 'create', 'name' => 'Create Deal', 'default_required_permissions' => ['crm.deals.create']],
                                ['code' => 'update', 'name' => 'Update Deal', 'default_required_permissions' => ['crm.deals.update']],
                                ['code' => 'delete', 'name' => 'Delete Deal', 'default_required_permissions' => ['crm.deals.delete']],
                                ['code' => 'close', 'name' => 'Close Deal', 'default_required_permissions' => ['crm.deals.close']],
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
        */
        [
            'code' => 'project',
            'name' => 'Project Management',
            'description' => 'Plan, track, and collaborate on projects with teams',
            'icon' => 'BriefcaseIcon',
            'route_prefix' => '/tenant/projects',
            'category' => 'project_management',
            'priority' => 30,
            'is_core' => false,
            'is_active' => true,
            'default_required_permissions' => ['projects.access'],

            'submodules' => [
                [
                    'code' => 'projects',
                    'name' => 'Projects',
                    'description' => 'Project overview and management',
                    'icon' => 'FolderIcon',
                    'route' => '/tenant/projects',
                    'priority' => 1,
                    'default_required_permissions' => ['projects.view'],

                    'components' => [
                        [
                            'code' => 'project-list',
                            'name' => 'Project List',
                            'type' => 'page',
                            'route' => '/tenant/projects',
                            'default_required_permissions' => ['projects.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Projects', 'default_required_permissions' => ['projects.view']],
                                ['code' => 'create', 'name' => 'Create Project', 'default_required_permissions' => ['projects.create']],
                                ['code' => 'update', 'name' => 'Update Project', 'default_required_permissions' => ['projects.update']],
                                ['code' => 'delete', 'name' => 'Delete Project', 'default_required_permissions' => ['projects.delete']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'tasks',
                    'name' => 'Tasks',
                    'description' => 'Task management and tracking',
                    'icon' => 'CheckCircleIcon',
                    'route' => '/tenant/projects/tasks',
                    'priority' => 2,
                    'default_required_permissions' => ['projects.tasks.view'],

                    'components' => [
                        [
                            'code' => 'task-board',
                            'name' => 'Task Board',
                            'type' => 'page',
                            'route' => '/tenant/projects/tasks',
                            'default_required_permissions' => ['projects.tasks.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tasks', 'default_required_permissions' => ['projects.tasks.view']],
                                ['code' => 'create', 'name' => 'Create Task', 'default_required_permissions' => ['projects.tasks.create']],
                                ['code' => 'update', 'name' => 'Update Task', 'default_required_permissions' => ['projects.tasks.update']],
                                ['code' => 'delete', 'name' => 'Delete Task', 'default_required_permissions' => ['projects.tasks.delete']],
                                ['code' => 'assign', 'name' => 'Assign Task', 'default_required_permissions' => ['projects.tasks.assign']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'time-tracking',
                    'name' => 'Time Tracking',
                    'description' => 'Track time spent on tasks',
                    'icon' => 'ClockIcon',
                    'route' => '/tenant/projects/time',
                    'priority' => 3,
                    'default_required_permissions' => ['projects.time.view'],

                    'components' => [
                        [
                            'code' => 'time-entries',
                            'name' => 'Time Entries',
                            'type' => 'page',
                            'route' => '/tenant/projects/time',
                            'default_required_permissions' => ['projects.time.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Time Entries', 'default_required_permissions' => ['projects.time.view']],
                                ['code' => 'log', 'name' => 'Log Time', 'default_required_permissions' => ['projects.time.log']],
                                ['code' => 'approve', 'name' => 'Approve Time', 'default_required_permissions' => ['projects.time.approve']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | Finance & Accounting Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'finance',
            'name' => 'Finance & Accounting',
            'description' => 'Manage invoices, expenses, budgets, and financial reports',
            'icon' => 'CurrencyDollarIcon',
            'route_prefix' => '/tenant/finance',
            'category' => 'financial_management',
            'priority' => 40,
            'is_core' => false,
            'is_active' => true,
            'default_required_permissions' => ['finance.access'],

            'submodules' => [
                [
                    'code' => 'invoices',
                    'name' => 'Invoices',
                    'description' => 'Create and manage invoices',
                    'icon' => 'DocumentTextIcon',
                    'route' => '/tenant/finance/invoices',
                    'priority' => 1,
                    'default_required_permissions' => ['finance.invoices.view'],

                    'components' => [
                        [
                            'code' => 'invoice-list',
                            'name' => 'Invoice List',
                            'type' => 'page',
                            'route' => '/tenant/finance/invoices',
                            'default_required_permissions' => ['finance.invoices.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Invoices', 'default_required_permissions' => ['finance.invoices.view']],
                                ['code' => 'create', 'name' => 'Create Invoice', 'default_required_permissions' => ['finance.invoices.create']],
                                ['code' => 'update', 'name' => 'Update Invoice', 'default_required_permissions' => ['finance.invoices.update']],
                                ['code' => 'delete', 'name' => 'Delete Invoice', 'default_required_permissions' => ['finance.invoices.delete']],
                                ['code' => 'send', 'name' => 'Send Invoice', 'default_required_permissions' => ['finance.invoices.send']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'expenses',
                    'name' => 'Expenses',
                    'description' => 'Track and approve expenses',
                    'icon' => 'ReceiptPercentIcon',
                    'route' => '/tenant/finance/expenses',
                    'priority' => 2,
                    'default_required_permissions' => ['finance.expenses.view'],

                    'components' => [
                        [
                            'code' => 'expense-list',
                            'name' => 'Expense List',
                            'type' => 'page',
                            'route' => '/tenant/finance/expenses',
                            'default_required_permissions' => ['finance.expenses.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Expenses', 'default_required_permissions' => ['finance.expenses.view']],
                                ['code' => 'create', 'name' => 'Submit Expense', 'default_required_permissions' => ['finance.expenses.create']],
                                ['code' => 'approve', 'name' => 'Approve Expense', 'default_required_permissions' => ['finance.expenses.approve']],
                                ['code' => 'reject', 'name' => 'Reject Expense', 'default_required_permissions' => ['finance.expenses.approve']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'reports',
                    'name' => 'Financial Reports',
                    'description' => 'View financial reports and analytics',
                    'icon' => 'ChartBarIcon',
                    'route' => '/tenant/finance/reports',
                    'priority' => 3,
                    'default_required_permissions' => ['finance.reports.view'],

                    'components' => [
                        [
                            'code' => 'financial-reports',
                            'name' => 'Financial Reports',
                            'type' => 'page',
                            'route' => '/tenant/finance/reports',
                            'default_required_permissions' => ['finance.reports.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Reports', 'default_required_permissions' => ['finance.reports.view']],
                                ['code' => 'export', 'name' => 'Export Reports', 'default_required_permissions' => ['finance.reports.export']],
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
