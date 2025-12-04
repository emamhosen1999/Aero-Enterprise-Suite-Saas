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

    /*
    |--------------------------------------------------------------------------
    | Platform Admin Module Hierarchy (10 Core Platform Modules)
    |--------------------------------------------------------------------------
    |
    | These modules are ONLY accessible by Platform Admins (landlord context).
    | They manage the entire SaaS platform infrastructure.
    |
    */
    'platform_hierarchy' => [
        /*
        |--------------------------------------------------------------------------
        | 1. Dashboard Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'platform-dashboard',
            'name' => 'Dashboard',
            'description' => 'Platform-wide analytics, tenant stats, system health monitoring',
            'icon' => 'HomeIcon',
            'route_prefix' => '/admin',
            'category' => 'platform_core',
            'priority' => 1,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['dashboard.view'],

            'submodules' => [
                [
                    'code' => 'overview',
                    'name' => 'Platform Overview',
                    'description' => 'Platform-wide statistics and KPIs',
                    'icon' => 'ChartBarIcon',
                    'route' => '/admin/dashboard',
                    'priority' => 1,
                    'default_required_permissions' => ['dashboard.view'],

                    'components' => [
                        [
                            'code' => 'stats-widget',
                            'name' => 'Platform Stats',
                            'type' => 'widget',
                            'route' => null,
                            'default_required_permissions' => ['dashboard.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Platform Stats', 'default_required_permissions' => ['dashboard.view']],
                            ],
                        ],
                        [
                            'code' => 'tenant-growth',
                            'name' => 'Tenant Growth Analytics',
                            'type' => 'widget',
                            'route' => null,
                            'default_required_permissions' => ['dashboard.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tenant Growth', 'default_required_permissions' => ['dashboard.view']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'system-health',
                    'name' => 'System Health',
                    'description' => 'Monitor system resources and performance',
                    'icon' => 'HeartIcon',
                    'route' => '/admin/system-health',
                    'priority' => 2,
                    'default_required_permissions' => ['system-health.view'],

                    'components' => [
                        [
                            'code' => 'health-monitor',
                            'name' => 'Health Monitor',
                            'type' => 'page',
                            'route' => '/admin/system-health',
                            'default_required_permissions' => ['system-health.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View System Health', 'default_required_permissions' => ['system-health.view']],
                                ['code' => 'restart-services', 'name' => 'Restart Services', 'default_required_permissions' => ['system-health.manage']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2. Tenant Management Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'tenants',
            'name' => 'Tenant Management',
            'description' => 'Create, suspend, delete tenants; manage domains and databases',
            'icon' => 'BuildingOffice2Icon',
            'route_prefix' => '/admin/tenants',
            'category' => 'platform_core',
            'priority' => 2,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['tenants.view'],

            'submodules' => [
                [
                    'code' => 'tenant-list',
                    'name' => 'All Tenants',
                    'description' => 'View and manage all tenants',
                    'icon' => 'BuildingOffice2Icon',
                    'route' => '/admin/tenants',
                    'priority' => 1,
                    'default_required_permissions' => ['tenants.view'],

                    'components' => [
                        [
                            'code' => 'tenant-management',
                            'name' => 'Tenant List',
                            'type' => 'page',
                            'route' => '/admin/tenants',
                            'default_required_permissions' => ['tenants.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Tenants', 'default_required_permissions' => ['tenants.view']],
                                ['code' => 'create', 'name' => 'Create Tenant', 'default_required_permissions' => ['tenants.create']],
                                ['code' => 'update', 'name' => 'Update Tenant', 'default_required_permissions' => ['tenants.update']],
                                ['code' => 'delete', 'name' => 'Delete Tenant', 'default_required_permissions' => ['tenants.delete']],
                                ['code' => 'suspend', 'name' => 'Suspend Tenant', 'default_required_permissions' => ['tenants.suspend']],
                                ['code' => 'impersonate', 'name' => 'Impersonate Tenant', 'default_required_permissions' => ['tenants.impersonate']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'domains',
                    'name' => 'Domain Management',
                    'description' => 'Manage tenant domains and subdomains',
                    'icon' => 'GlobeAltIcon',
                    'route' => '/admin/tenants/domains',
                    'priority' => 2,
                    'default_required_permissions' => ['domains.view'],

                    'components' => [
                        [
                            'code' => 'domain-list',
                            'name' => 'Domain List',
                            'type' => 'page',
                            'route' => '/admin/tenants/domains',
                            'default_required_permissions' => ['domains.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Domains', 'default_required_permissions' => ['domains.view']],
                                ['code' => 'create', 'name' => 'Add Domain', 'default_required_permissions' => ['domains.create']],
                                ['code' => 'update', 'name' => 'Update Domain', 'default_required_permissions' => ['domains.update']],
                                ['code' => 'delete', 'name' => 'Delete Domain', 'default_required_permissions' => ['domains.delete']],
                                ['code' => 'verify', 'name' => 'Verify Domain', 'default_required_permissions' => ['domains.verify']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'databases',
                    'name' => 'Database Management',
                    'description' => 'Manage tenant databases',
                    'icon' => 'CircleStackIcon',
                    'route' => '/admin/tenants/databases',
                    'priority' => 3,
                    'default_required_permissions' => ['databases.view'],

                    'components' => [
                        [
                            'code' => 'database-list',
                            'name' => 'Database List',
                            'type' => 'page',
                            'route' => '/admin/tenants/databases',
                            'default_required_permissions' => ['databases.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Databases', 'default_required_permissions' => ['databases.view']],
                                ['code' => 'backup', 'name' => 'Backup Database', 'default_required_permissions' => ['databases.backup']],
                                ['code' => 'restore', 'name' => 'Restore Database', 'default_required_permissions' => ['databases.restore']],
                                ['code' => 'migrate', 'name' => 'Run Migrations', 'default_required_permissions' => ['databases.migrate']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 3. Users & Authentication Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'platform-users',
            'name' => 'Users & Authentication',
            'description' => 'Manage platform administrators, SSO, MFA, and authentication settings',
            'icon' => 'UsersIcon',
            'route_prefix' => '/admin/users',
            'category' => 'platform_core',
            'priority' => 3,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['users.view'],

            'submodules' => [
                [
                    'code' => 'admin-users',
                    'name' => 'Platform Administrators',
                    'description' => 'Manage platform admin accounts',
                    'icon' => 'UsersIcon',
                    'route' => '/admin/users',
                    'priority' => 1,
                    'default_required_permissions' => ['users.view'],

                    'components' => [
                        [
                            'code' => 'user-list',
                            'name' => 'Admin User List',
                            'type' => 'page',
                            'route' => '/admin/users',
                            'default_required_permissions' => ['users.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Platform Users', 'default_required_permissions' => ['users.view']],
                                ['code' => 'create', 'name' => 'Create Platform User', 'default_required_permissions' => ['users.create']],
                                ['code' => 'update', 'name' => 'Update Platform User', 'default_required_permissions' => ['users.update']],
                                ['code' => 'delete', 'name' => 'Delete Platform User', 'default_required_permissions' => ['users.delete']],
                                ['code' => 'reset-password', 'name' => 'Reset Password', 'default_required_permissions' => ['users.reset-password']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'authentication',
                    'name' => 'Authentication Settings',
                    'description' => 'Configure SSO, SAML, MFA settings',
                    'icon' => 'KeyIcon',
                    'route' => '/admin/authentication',
                    'priority' => 2,
                    'default_required_permissions' => ['auth.view'],

                    'components' => [
                        [
                            'code' => 'sso-settings',
                            'name' => 'SSO Configuration',
                            'type' => 'page',
                            'route' => '/admin/authentication/sso',
                            'default_required_permissions' => ['auth.sso.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View SSO Settings', 'default_required_permissions' => ['auth.sso.view']],
                                ['code' => 'configure', 'name' => 'Configure SSO', 'default_required_permissions' => ['auth.sso.configure']],
                            ],
                        ],
                        [
                            'code' => 'mfa-settings',
                            'name' => 'MFA Configuration',
                            'type' => 'page',
                            'route' => '/admin/authentication/mfa',
                            'default_required_permissions' => ['auth.mfa.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View MFA Settings', 'default_required_permissions' => ['auth.mfa.view']],
                                ['code' => 'configure', 'name' => 'Configure MFA', 'default_required_permissions' => ['auth.mfa.configure']],
                                ['code' => 'enforce', 'name' => 'Enforce MFA Policy', 'default_required_permissions' => ['auth.mfa.enforce']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'sessions',
                    'name' => 'Active Sessions',
                    'description' => 'Monitor and manage active sessions',
                    'icon' => 'ComputerDesktopIcon',
                    'route' => '/admin/sessions',
                    'priority' => 3,
                    'default_required_permissions' => ['sessions.view'],

                    'components' => [
                        [
                            'code' => 'session-list',
                            'name' => 'Session List',
                            'type' => 'page',
                            'route' => '/admin/sessions',
                            'default_required_permissions' => ['sessions.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sessions', 'default_required_permissions' => ['sessions.view']],
                                ['code' => 'terminate', 'name' => 'Terminate Session', 'default_required_permissions' => ['sessions.terminate']],
                                ['code' => 'terminate-all', 'name' => 'Terminate All Sessions', 'default_required_permissions' => ['sessions.terminate-all']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 4. Roles & Permissions Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'platform-roles',
            'name' => 'Roles & Permissions',
            'description' => 'Manage platform roles, permissions, and access control',
            'icon' => 'ShieldCheckIcon',
            'route_prefix' => '/admin/roles',
            'category' => 'platform_core',
            'priority' => 4,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['roles.view'],

            'submodules' => [
                [
                    'code' => 'role-management',
                    'name' => 'Role Management',
                    'description' => 'Create and manage platform roles',
                    'icon' => 'ShieldCheckIcon',
                    'route' => '/admin/roles',
                    'priority' => 1,
                    'default_required_permissions' => ['roles.view'],

                    'components' => [
                        [
                            'code' => 'role-list',
                            'name' => 'Role List',
                            'type' => 'page',
                            'route' => '/admin/roles',
                            'default_required_permissions' => ['roles.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Roles', 'default_required_permissions' => ['roles.view']],
                                ['code' => 'create', 'name' => 'Create Role', 'default_required_permissions' => ['roles.create']],
                                ['code' => 'update', 'name' => 'Update Role', 'default_required_permissions' => ['roles.update']],
                                ['code' => 'delete', 'name' => 'Delete Role', 'default_required_permissions' => ['roles.delete']],
                                ['code' => 'assign', 'name' => 'Assign Role to User', 'default_required_permissions' => ['roles.assign']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'permission-management',
                    'name' => 'Permission Management',
                    'description' => 'View and manage permissions',
                    'icon' => 'LockClosedIcon',
                    'route' => '/admin/permissions',
                    'priority' => 2,
                    'default_required_permissions' => ['permissions.view'],

                    'components' => [
                        [
                            'code' => 'permission-list',
                            'name' => 'Permission List',
                            'type' => 'page',
                            'route' => '/admin/permissions',
                            'default_required_permissions' => ['permissions.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Permissions', 'default_required_permissions' => ['permissions.view']],
                                ['code' => 'create', 'name' => 'Create Permission', 'default_required_permissions' => ['permissions.create']],
                                ['code' => 'update', 'name' => 'Update Permission', 'default_required_permissions' => ['permissions.update']],
                                ['code' => 'delete', 'name' => 'Delete Permission', 'default_required_permissions' => ['permissions.delete']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'module-permissions',
                    'name' => 'Module Permissions',
                    'description' => 'Configure module access and required permissions',
                    'icon' => 'CubeIcon',
                    'route' => '/admin/modules',
                    'priority' => 3,
                    'default_required_permissions' => ['modules.view'],

                    'components' => [
                        [
                            'code' => 'module-list',
                            'name' => 'Module List',
                            'type' => 'page',
                            'route' => '/admin/modules',
                            'default_required_permissions' => ['modules.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Modules', 'default_required_permissions' => ['modules.view']],
                                ['code' => 'configure', 'name' => 'Configure Module Permissions', 'default_required_permissions' => ['modules.configure']],
                                ['code' => 'toggle', 'name' => 'Enable/Disable Module', 'default_required_permissions' => ['modules.toggle']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 5. Subscriptions & Billing Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'subscriptions',
            'name' => 'Subscriptions & Billing',
            'description' => 'Manage plans, subscriptions, invoices, and payment gateways',
            'icon' => 'CreditCardIcon',
            'route_prefix' => '/admin/billing',
            'category' => 'platform_core',
            'priority' => 5,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['billing.view'],

            'submodules' => [
                [
                    'code' => 'plans',
                    'name' => 'Plans',
                    'description' => 'Manage subscription plans',
                    'icon' => 'RectangleStackIcon',
                    'route' => '/admin/billing/plans',
                    'priority' => 1,
                    'default_required_permissions' => ['plans.view'],

                    'components' => [
                        [
                            'code' => 'plan-list',
                            'name' => 'Plan List',
                            'type' => 'page',
                            'route' => '/admin/billing/plans',
                            'default_required_permissions' => ['plans.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Plans', 'default_required_permissions' => ['plans.view']],
                                ['code' => 'create', 'name' => 'Create Plan', 'default_required_permissions' => ['plans.create']],
                                ['code' => 'update', 'name' => 'Update Plan', 'default_required_permissions' => ['plans.update']],
                                ['code' => 'delete', 'name' => 'Delete Plan', 'default_required_permissions' => ['plans.delete']],
                                ['code' => 'configure-modules', 'name' => 'Configure Plan Modules', 'default_required_permissions' => ['plans.configure']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'tenant-subscriptions',
                    'name' => 'Tenant Subscriptions',
                    'description' => 'View and manage tenant subscriptions',
                    'icon' => 'ArrowPathIcon',
                    'route' => '/admin/billing/subscriptions',
                    'priority' => 2,
                    'default_required_permissions' => ['subscriptions.view'],

                    'components' => [
                        [
                            'code' => 'subscription-list',
                            'name' => 'Subscription List',
                            'type' => 'page',
                            'route' => '/admin/billing/subscriptions',
                            'default_required_permissions' => ['subscriptions.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Subscriptions', 'default_required_permissions' => ['subscriptions.view']],
                                ['code' => 'upgrade', 'name' => 'Upgrade Subscription', 'default_required_permissions' => ['subscriptions.upgrade']],
                                ['code' => 'downgrade', 'name' => 'Downgrade Subscription', 'default_required_permissions' => ['subscriptions.downgrade']],
                                ['code' => 'cancel', 'name' => 'Cancel Subscription', 'default_required_permissions' => ['subscriptions.cancel']],
                                ['code' => 'extend', 'name' => 'Extend Trial', 'default_required_permissions' => ['subscriptions.extend']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'invoices',
                    'name' => 'Invoices',
                    'description' => 'View and manage platform invoices',
                    'icon' => 'DocumentTextIcon',
                    'route' => '/admin/billing/invoices',
                    'priority' => 3,
                    'default_required_permissions' => ['invoices.view'],

                    'components' => [
                        [
                            'code' => 'invoice-list',
                            'name' => 'Invoice List',
                            'type' => 'page',
                            'route' => '/admin/billing/invoices',
                            'default_required_permissions' => ['invoices.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Invoices', 'default_required_permissions' => ['invoices.view']],
                                ['code' => 'create', 'name' => 'Create Invoice', 'default_required_permissions' => ['invoices.create']],
                                ['code' => 'send', 'name' => 'Send Invoice', 'default_required_permissions' => ['invoices.send']],
                                ['code' => 'mark-paid', 'name' => 'Mark as Paid', 'default_required_permissions' => ['invoices.mark-paid']],
                                ['code' => 'refund', 'name' => 'Issue Refund', 'default_required_permissions' => ['invoices.refund']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'payment-gateways',
                    'name' => 'Payment Gateways',
                    'description' => 'Configure payment gateways',
                    'icon' => 'BanknotesIcon',
                    'route' => '/admin/billing/gateways',
                    'priority' => 4,
                    'default_required_permissions' => ['gateways.view'],

                    'components' => [
                        [
                            'code' => 'gateway-settings',
                            'name' => 'Gateway Settings',
                            'type' => 'page',
                            'route' => '/admin/billing/gateways',
                            'default_required_permissions' => ['gateways.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Gateways', 'default_required_permissions' => ['gateways.view']],
                                ['code' => 'configure', 'name' => 'Configure Gateway', 'default_required_permissions' => ['gateways.configure']],
                                ['code' => 'test', 'name' => 'Test Gateway', 'default_required_permissions' => ['gateways.test']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 6. Notifications Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'notifications',
            'name' => 'Notifications',
            'description' => 'Manage notification channels, templates, and broadcasts',
            'icon' => 'BellIcon',
            'route_prefix' => '/admin/notifications',
            'category' => 'platform_core',
            'priority' => 6,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['notifications.view'],

            'submodules' => [
                [
                    'code' => 'channels',
                    'name' => 'Notification Channels',
                    'description' => 'Configure email, SMS, push notification channels',
                    'icon' => 'MegaphoneIcon',
                    'route' => '/admin/notifications/channels',
                    'priority' => 1,
                    'default_required_permissions' => ['notifications.channels.view'],

                    'components' => [
                        [
                            'code' => 'channel-settings',
                            'name' => 'Channel Settings',
                            'type' => 'page',
                            'route' => '/admin/notifications/channels',
                            'default_required_permissions' => ['notifications.channels.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Channels', 'default_required_permissions' => ['notifications.channels.view']],
                                ['code' => 'configure', 'name' => 'Configure Channel', 'default_required_permissions' => ['notifications.channels.configure']],
                                ['code' => 'test', 'name' => 'Test Channel', 'default_required_permissions' => ['notifications.channels.test']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'templates',
                    'name' => 'Notification Templates',
                    'description' => 'Create and manage notification templates',
                    'icon' => 'DocumentDuplicateIcon',
                    'route' => '/admin/notifications/templates',
                    'priority' => 2,
                    'default_required_permissions' => ['notifications.templates.view'],

                    'components' => [
                        [
                            'code' => 'template-list',
                            'name' => 'Template List',
                            'type' => 'page',
                            'route' => '/admin/notifications/templates',
                            'default_required_permissions' => ['notifications.templates.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Templates', 'default_required_permissions' => ['notifications.templates.view']],
                                ['code' => 'create', 'name' => 'Create Template', 'default_required_permissions' => ['notifications.templates.create']],
                                ['code' => 'update', 'name' => 'Update Template', 'default_required_permissions' => ['notifications.templates.update']],
                                ['code' => 'delete', 'name' => 'Delete Template', 'default_required_permissions' => ['notifications.templates.delete']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'broadcasts',
                    'name' => 'Broadcast Messages',
                    'description' => 'Send platform-wide announcements',
                    'icon' => 'SpeakerWaveIcon',
                    'route' => '/admin/notifications/broadcasts',
                    'priority' => 3,
                    'default_required_permissions' => ['notifications.broadcasts.view'],

                    'components' => [
                        [
                            'code' => 'broadcast-list',
                            'name' => 'Broadcast List',
                            'type' => 'page',
                            'route' => '/admin/notifications/broadcasts',
                            'default_required_permissions' => ['notifications.broadcasts.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Broadcasts', 'default_required_permissions' => ['notifications.broadcasts.view']],
                                ['code' => 'create', 'name' => 'Create Broadcast', 'default_required_permissions' => ['notifications.broadcasts.create']],
                                ['code' => 'send', 'name' => 'Send Broadcast', 'default_required_permissions' => ['notifications.broadcasts.send']],
                                ['code' => 'schedule', 'name' => 'Schedule Broadcast', 'default_required_permissions' => ['notifications.broadcasts.schedule']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 7. File Manager Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'file-manager',
            'name' => 'File Manager',
            'description' => 'Manage file storage, quotas, and media library',
            'icon' => 'FolderOpenIcon',
            'route_prefix' => '/admin/files',
            'category' => 'platform_core',
            'priority' => 7,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['files.view'],

            'submodules' => [
                [
                    'code' => 'storage',
                    'name' => 'Storage Management',
                    'description' => 'Manage platform file storage',
                    'icon' => 'ServerIcon',
                    'route' => '/admin/files/storage',
                    'priority' => 1,
                    'default_required_permissions' => ['files.storage.view'],

                    'components' => [
                        [
                            'code' => 'storage-overview',
                            'name' => 'Storage Overview',
                            'type' => 'page',
                            'route' => '/admin/files/storage',
                            'default_required_permissions' => ['files.storage.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Storage', 'default_required_permissions' => ['files.storage.view']],
                                ['code' => 'configure', 'name' => 'Configure Storage', 'default_required_permissions' => ['files.storage.configure']],
                                ['code' => 'cleanup', 'name' => 'Cleanup Storage', 'default_required_permissions' => ['files.storage.cleanup']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'quotas',
                    'name' => 'Storage Quotas',
                    'description' => 'Manage tenant storage quotas',
                    'icon' => 'ChartPieIcon',
                    'route' => '/admin/files/quotas',
                    'priority' => 2,
                    'default_required_permissions' => ['files.quotas.view'],

                    'components' => [
                        [
                            'code' => 'quota-settings',
                            'name' => 'Quota Settings',
                            'type' => 'page',
                            'route' => '/admin/files/quotas',
                            'default_required_permissions' => ['files.quotas.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Quotas', 'default_required_permissions' => ['files.quotas.view']],
                                ['code' => 'update', 'name' => 'Update Quota', 'default_required_permissions' => ['files.quotas.update']],
                                ['code' => 'override', 'name' => 'Override Tenant Quota', 'default_required_permissions' => ['files.quotas.override']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'media-library',
                    'name' => 'Media Library',
                    'description' => 'Browse and manage platform media',
                    'icon' => 'PhotoIcon',
                    'route' => '/admin/files/media',
                    'priority' => 3,
                    'default_required_permissions' => ['files.media.view'],

                    'components' => [
                        [
                            'code' => 'media-browser',
                            'name' => 'Media Browser',
                            'type' => 'page',
                            'route' => '/admin/files/media',
                            'default_required_permissions' => ['files.media.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Media', 'default_required_permissions' => ['files.media.view']],
                                ['code' => 'upload', 'name' => 'Upload Media', 'default_required_permissions' => ['files.media.upload']],
                                ['code' => 'delete', 'name' => 'Delete Media', 'default_required_permissions' => ['files.media.delete']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 8. Audit & Activity Logs Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'audit-logs',
            'name' => 'Audit & Activity Logs',
            'description' => 'View system logs, user activity, and security events',
            'icon' => 'ClipboardDocumentListIcon',
            'route_prefix' => '/admin/logs',
            'category' => 'platform_core',
            'priority' => 8,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['logs.view'],

            'submodules' => [
                [
                    'code' => 'activity-logs',
                    'name' => 'Activity Logs',
                    'description' => 'View user and system activity',
                    'icon' => 'ClipboardDocumentListIcon',
                    'route' => '/admin/logs/activity',
                    'priority' => 1,
                    'default_required_permissions' => ['logs.activity.view'],

                    'components' => [
                        [
                            'code' => 'activity-list',
                            'name' => 'Activity Log List',
                            'type' => 'page',
                            'route' => '/admin/logs/activity',
                            'default_required_permissions' => ['logs.activity.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Activity Logs', 'default_required_permissions' => ['logs.activity.view']],
                                ['code' => 'export', 'name' => 'Export Activity Logs', 'default_required_permissions' => ['logs.activity.export']],
                                ['code' => 'filter', 'name' => 'Advanced Filtering', 'default_required_permissions' => ['logs.activity.view']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'security-logs',
                    'name' => 'Security Logs',
                    'description' => 'View security events and login attempts',
                    'icon' => 'ShieldExclamationIcon',
                    'route' => '/admin/logs/security',
                    'priority' => 2,
                    'default_required_permissions' => ['logs.security.view'],

                    'components' => [
                        [
                            'code' => 'security-list',
                            'name' => 'Security Log List',
                            'type' => 'page',
                            'route' => '/admin/logs/security',
                            'default_required_permissions' => ['logs.security.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Security Logs', 'default_required_permissions' => ['logs.security.view']],
                                ['code' => 'export', 'name' => 'Export Security Logs', 'default_required_permissions' => ['logs.security.export']],
                                ['code' => 'investigate', 'name' => 'Investigate Event', 'default_required_permissions' => ['logs.security.investigate']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'system-logs',
                    'name' => 'System Logs',
                    'description' => 'View application and error logs',
                    'icon' => 'CommandLineIcon',
                    'route' => '/admin/logs/system',
                    'priority' => 3,
                    'default_required_permissions' => ['logs.system.view'],

                    'components' => [
                        [
                            'code' => 'system-list',
                            'name' => 'System Log Viewer',
                            'type' => 'page',
                            'route' => '/admin/logs/system',
                            'default_required_permissions' => ['logs.system.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View System Logs', 'default_required_permissions' => ['logs.system.view']],
                                ['code' => 'download', 'name' => 'Download Logs', 'default_required_permissions' => ['logs.system.download']],
                                ['code' => 'clear', 'name' => 'Clear Logs', 'default_required_permissions' => ['logs.system.clear']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 9. System Settings Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'system-settings',
            'name' => 'System Settings',
            'description' => 'Configure platform settings, branding, localization, and integrations',
            'icon' => 'Cog8ToothIcon',
            'route_prefix' => '/admin/settings',
            'category' => 'platform_core',
            'priority' => 9,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['settings.view'],

            'submodules' => [
                [
                    'code' => 'general-settings',
                    'name' => 'General Settings',
                    'description' => 'Platform name, timezone, defaults',
                    'icon' => 'Cog6ToothIcon',
                    'route' => '/admin/settings/general',
                    'priority' => 1,
                    'default_required_permissions' => ['settings.general.view'],

                    'components' => [
                        [
                            'code' => 'general-form',
                            'name' => 'General Settings Form',
                            'type' => 'page',
                            'route' => '/admin/settings/general',
                            'default_required_permissions' => ['settings.general.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View General Settings', 'default_required_permissions' => ['settings.general.view']],
                                ['code' => 'update', 'name' => 'Update General Settings', 'default_required_permissions' => ['settings.general.update']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'branding',
                    'name' => 'Branding & Appearance',
                    'description' => 'Logo, colors, themes',
                    'icon' => 'PaintBrushIcon',
                    'route' => '/admin/settings/branding',
                    'priority' => 2,
                    'default_required_permissions' => ['settings.branding.view'],

                    'components' => [
                        [
                            'code' => 'branding-form',
                            'name' => 'Branding Settings',
                            'type' => 'page',
                            'route' => '/admin/settings/branding',
                            'default_required_permissions' => ['settings.branding.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Branding Settings', 'default_required_permissions' => ['settings.branding.view']],
                                ['code' => 'update', 'name' => 'Update Branding', 'default_required_permissions' => ['settings.branding.update']],
                                ['code' => 'preview', 'name' => 'Preview Changes', 'default_required_permissions' => ['settings.branding.view']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'localization',
                    'name' => 'Localization',
                    'description' => 'Languages, date formats, currencies',
                    'icon' => 'LanguageIcon',
                    'route' => '/admin/settings/localization',
                    'priority' => 3,
                    'default_required_permissions' => ['settings.localization.view'],

                    'components' => [
                        [
                            'code' => 'localization-form',
                            'name' => 'Localization Settings',
                            'type' => 'page',
                            'route' => '/admin/settings/localization',
                            'default_required_permissions' => ['settings.localization.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Localization Settings', 'default_required_permissions' => ['settings.localization.view']],
                                ['code' => 'update', 'name' => 'Update Localization', 'default_required_permissions' => ['settings.localization.update']],
                                ['code' => 'add-language', 'name' => 'Add Language', 'default_required_permissions' => ['settings.localization.add-language']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'email-settings',
                    'name' => 'Email Settings',
                    'description' => 'SMTP configuration and email defaults',
                    'icon' => 'EnvelopeIcon',
                    'route' => '/admin/settings/email',
                    'priority' => 4,
                    'default_required_permissions' => ['settings.email.view'],

                    'components' => [
                        [
                            'code' => 'email-form',
                            'name' => 'Email Settings Form',
                            'type' => 'page',
                            'route' => '/admin/settings/email',
                            'default_required_permissions' => ['settings.email.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Email Settings', 'default_required_permissions' => ['settings.email.view']],
                                ['code' => 'update', 'name' => 'Update Email Settings', 'default_required_permissions' => ['settings.email.update']],
                                ['code' => 'test', 'name' => 'Send Test Email', 'default_required_permissions' => ['settings.email.test']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'integrations',
                    'name' => 'Integrations',
                    'description' => 'Third-party service integrations',
                    'icon' => 'PuzzlePieceIcon',
                    'route' => '/admin/settings/integrations',
                    'priority' => 5,
                    'default_required_permissions' => ['settings.integrations.view'],

                    'components' => [
                        [
                            'code' => 'integration-list',
                            'name' => 'Integration List',
                            'type' => 'page',
                            'route' => '/admin/settings/integrations',
                            'default_required_permissions' => ['settings.integrations.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Integrations', 'default_required_permissions' => ['settings.integrations.view']],
                                ['code' => 'configure', 'name' => 'Configure Integration', 'default_required_permissions' => ['settings.integrations.configure']],
                                ['code' => 'enable', 'name' => 'Enable/Disable Integration', 'default_required_permissions' => ['settings.integrations.toggle']],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 10. Developer Tools Module
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'developer-tools',
            'name' => 'Developer Tools',
            'description' => 'API management, webhooks, debug tools, and developer resources',
            'icon' => 'CodeBracketIcon',
            'route_prefix' => '/admin/developer',
            'category' => 'platform_core',
            'priority' => 10,
            'is_core' => true,
            'is_active' => true,
            'default_required_permissions' => ['developer.view'],

            'submodules' => [
                [
                    'code' => 'api-management',
                    'name' => 'API Management',
                    'description' => 'Manage API tokens and keys',
                    'icon' => 'KeyIcon',
                    'route' => '/admin/developer/api',
                    'priority' => 1,
                    'default_required_permissions' => ['developer.api.view'],

                    'components' => [
                        [
                            'code' => 'api-tokens',
                            'name' => 'API Tokens',
                            'type' => 'page',
                            'route' => '/admin/developer/api',
                            'default_required_permissions' => ['developer.api.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View API Tokens', 'default_required_permissions' => ['developer.api.view']],
                                ['code' => 'create', 'name' => 'Create API Token', 'default_required_permissions' => ['developer.api.create']],
                                ['code' => 'revoke', 'name' => 'Revoke API Token', 'default_required_permissions' => ['developer.api.revoke']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'webhooks',
                    'name' => 'Webhooks',
                    'description' => 'Configure and manage webhooks',
                    'icon' => 'ArrowsPointingOutIcon',
                    'route' => '/admin/developer/webhooks',
                    'priority' => 2,
                    'default_required_permissions' => ['developer.webhooks.view'],

                    'components' => [
                        [
                            'code' => 'webhook-list',
                            'name' => 'Webhook List',
                            'type' => 'page',
                            'route' => '/admin/developer/webhooks',
                            'default_required_permissions' => ['developer.webhooks.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Webhooks', 'default_required_permissions' => ['developer.webhooks.view']],
                                ['code' => 'create', 'name' => 'Create Webhook', 'default_required_permissions' => ['developer.webhooks.create']],
                                ['code' => 'update', 'name' => 'Update Webhook', 'default_required_permissions' => ['developer.webhooks.update']],
                                ['code' => 'delete', 'name' => 'Delete Webhook', 'default_required_permissions' => ['developer.webhooks.delete']],
                                ['code' => 'test', 'name' => 'Test Webhook', 'default_required_permissions' => ['developer.webhooks.test']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'queue-management',
                    'name' => 'Queue Management',
                    'description' => 'Monitor and manage job queues',
                    'icon' => 'QueueListIcon',
                    'route' => '/admin/developer/queues',
                    'priority' => 3,
                    'default_required_permissions' => ['developer.queues.view'],

                    'components' => [
                        [
                            'code' => 'queue-dashboard',
                            'name' => 'Queue Dashboard',
                            'type' => 'page',
                            'route' => '/admin/developer/queues',
                            'default_required_permissions' => ['developer.queues.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Queues', 'default_required_permissions' => ['developer.queues.view']],
                                ['code' => 'retry', 'name' => 'Retry Failed Jobs', 'default_required_permissions' => ['developer.queues.retry']],
                                ['code' => 'flush', 'name' => 'Flush Queue', 'default_required_permissions' => ['developer.queues.flush']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'cache-management',
                    'name' => 'Cache Management',
                    'description' => 'View and clear application caches',
                    'icon' => 'BoltIcon',
                    'route' => '/admin/developer/cache',
                    'priority' => 4,
                    'default_required_permissions' => ['developer.cache.view'],

                    'components' => [
                        [
                            'code' => 'cache-dashboard',
                            'name' => 'Cache Dashboard',
                            'type' => 'page',
                            'route' => '/admin/developer/cache',
                            'default_required_permissions' => ['developer.cache.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Cache Status', 'default_required_permissions' => ['developer.cache.view']],
                                ['code' => 'clear', 'name' => 'Clear Cache', 'default_required_permissions' => ['developer.cache.clear']],
                                ['code' => 'warm', 'name' => 'Warm Cache', 'default_required_permissions' => ['developer.cache.warm']],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'maintenance',
                    'name' => 'Maintenance Mode',
                    'description' => 'Enable/disable maintenance mode',
                    'icon' => 'WrenchScrewdriverIcon',
                    'route' => '/admin/developer/maintenance',
                    'priority' => 5,
                    'default_required_permissions' => ['developer.maintenance.view'],

                    'components' => [
                        [
                            'code' => 'maintenance-controls',
                            'name' => 'Maintenance Controls',
                            'type' => 'page',
                            'route' => '/admin/developer/maintenance',
                            'default_required_permissions' => ['developer.maintenance.view'],
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Maintenance Status', 'default_required_permissions' => ['developer.maintenance.view']],
                                ['code' => 'enable', 'name' => 'Enable Maintenance Mode', 'default_required_permissions' => ['developer.maintenance.enable']],
                                ['code' => 'disable', 'name' => 'Disable Maintenance Mode', 'default_required_permissions' => ['developer.maintenance.disable']],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ],

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
