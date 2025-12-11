<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Core Module Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration specific to the Core module that will
    | be merged into the main application's modules configuration.
    |
    */

    'code' => 'core',
    'scope' => 'tenant',
    'name' => 'Core Framework',
    'description' => 'Foundation framework including Dashboard, Users, Roles, Permissions, Authentication, Audit Logs, Notifications, File Manager, and Settings',
    'icon' => 'CubeIcon',
    'route_prefix' => '/tenant',
    'category' => 'core',
    'priority' => 1,
    'is_core' => true,
    'is_active' => true,
    'version' => '1.0.0',
    'min_plan' => null,
    'license_type' => 'standard',
    'dependencies' => [],
    'release_date' => '2024-01-01',
    'enabled' => true,
    'minimum_plan' => null,

    /*
    |--------------------------------------------------------------------------
    | Core Features
    |--------------------------------------------------------------------------
    */
    'features' => [
        'dashboard' => true,
        'user_management' => true,
        'roles_permissions' => true,
        'authentication' => true,
        'audit_logs' => true,
        'notifications' => true,
        'file_manager' => true,
        'settings' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Permission Structure
    |--------------------------------------------------------------------------
    |
    | Defines the hierarchical permission structure for the Core module.
    | Used by aero:sync-module command to populate the database.
    | Structure: Module → Submodules → Components → Actions
    |
    */
    'submodules' => [
        /*
        |--------------------------------------------------------------------------
        | 1.1 Dashboard
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'dashboard',
            'name' => 'Dashboard',
            'description' => 'Main dashboard and overview',
            'icon' => 'HomeIcon',
            'route' => '/tenant/dashboard',
            'priority' => 1,

            'components' => [
                [
                    'code' => 'overview',
                    'name' => 'Dashboard Overview',
                    'type' => 'page',
                    'route' => '/tenant/dashboard',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Dashboard'],
                    ],
                ],
                [
                    'code' => 'stats',
                    'name' => 'Statistics Widget',
                    'type' => 'widget',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Statistics'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 1.2 User Management
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'user_management',
            'name' => 'User Management',
            'description' => 'User accounts, authentication, and invitations',
            'icon' => 'UserGroupIcon',
            'route' => '/tenant/users',
            'priority' => 2,

            'components' => [
                [
                    'code' => 'users',
                    'name' => 'Users',
                    'type' => 'page',
                    'route' => '/tenant/users',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Users'],
                        ['code' => 'create', 'name' => 'Create User'],
                        ['code' => 'edit', 'name' => 'Edit User'],
                        ['code' => 'delete', 'name' => 'Delete User'],
                        ['code' => 'bulk_delete', 'name' => 'Bulk Delete Users'],
                        ['code' => 'activate', 'name' => 'Activate User'],
                        ['code' => 'deactivate', 'name' => 'Deactivate User'],
                        ['code' => 'bulk_toggle_status', 'name' => 'Bulk Toggle Status'],
                        ['code' => 'bulk_assign_roles', 'name' => 'Bulk Assign Roles'],
                        ['code' => 'reset_password', 'name' => 'Reset Password'],
                        ['code' => 'lock_account', 'name' => 'Lock Account'],
                        ['code' => 'unlock_account', 'name' => 'Unlock Account'],
                        ['code' => 'export', 'name' => 'Export Users'],
                        ['code' => 'import', 'name' => 'Import Users'],
                    ],
                ],
                [
                    'code' => 'user_invitations',
                    'name' => 'User Invitations',
                    'type' => 'page',
                    'route' => '/tenant/users/invitations',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Invitations'],
                        ['code' => 'invite', 'name' => 'Invite User'],
                        ['code' => 'resend', 'name' => 'Resend Invitation'],
                        ['code' => 'cancel', 'name' => 'Cancel Invitation'],
                    ],
                ],
                [
                    'code' => 'user_profile',
                    'name' => 'User Profile',
                    'type' => 'page',
                    'route' => '/tenant/profile',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Profile'],
                        ['code' => 'edit', 'name' => 'Edit Profile'],
                        ['code' => 'change_password', 'name' => 'Change Password'],
                        ['code' => 'upload_avatar', 'name' => 'Upload Avatar'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 1.3 Authentication
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'authentication',
            'name' => 'Authentication',
            'description' => 'Authentication and security settings',
            'icon' => 'KeyIcon',
            'route' => '/tenant/auth',
            'priority' => 3,

            'components' => [
                [
                    'code' => 'devices',
                    'name' => 'Device Management',
                    'type' => 'page',
                    'route' => '/tenant/devices',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Devices'],
                        ['code' => 'toggle', 'name' => 'Toggle Device Trust'],
                        ['code' => 'reset', 'name' => 'Reset Device'],
                        ['code' => 'deactivate', 'name' => 'Deactivate Device'],
                    ],
                ],
                [
                    'code' => 'two_factor',
                    'name' => 'Two-Factor Authentication',
                    'type' => 'feature',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View 2FA Settings'],
                        ['code' => 'enable', 'name' => 'Enable 2FA'],
                        ['code' => 'disable', 'name' => 'Disable 2FA'],
                        ['code' => 'reset', 'name' => 'Reset 2FA'],
                    ],
                ],
                [
                    'code' => 'sessions',
                    'name' => 'Session Management',
                    'type' => 'page',
                    'route' => '/tenant/sessions',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Sessions'],
                        ['code' => 'terminate', 'name' => 'Terminate Session'],
                        ['code' => 'terminate_all', 'name' => 'Terminate All Sessions'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 1.4 Roles & Permissions
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'roles_permissions',
            'name' => 'Roles & Module Access',
            'description' => 'Role-based access control and module permissions',
            'icon' => 'ShieldCheckIcon',
            'route' => '/tenant/roles',
            'priority' => 4,

            'components' => [
                [
                    'code' => 'roles',
                    'name' => 'Roles',
                    'type' => 'page',
                    'route' => '/tenant/roles',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Roles'],
                        ['code' => 'create', 'name' => 'Create Role'],
                        ['code' => 'edit', 'name' => 'Edit Role'],
                        ['code' => 'delete', 'name' => 'Delete Role'],
                        ['code' => 'assign', 'name' => 'Assign Role to Users'],
                    ],
                ],
                [
                    'code' => 'module_access',
                    'name' => 'Module Access',
                    'type' => 'page',
                    'route' => '/tenant/modules',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Modules'],
                        ['code' => 'configure', 'name' => 'Configure Module Access'],
                        ['code' => 'toggle', 'name' => 'Enable/Disable Module'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 1.5 Audit Logs
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'audit_logs',
            'name' => 'Audit & Activity Logs',
            'description' => 'View system activity, user actions, and security events',
            'icon' => 'ClipboardDocumentListIcon',
            'route' => '/tenant/audit',
            'priority' => 5,

            'components' => [
                [
                    'code' => 'activity_logs',
                    'name' => 'Activity Logs',
                    'type' => 'page',
                    'route' => '/tenant/audit/activity',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Activity Logs'],
                        ['code' => 'export', 'name' => 'Export Activity Logs'],
                        ['code' => 'filter', 'name' => 'Advanced Filtering'],
                    ],
                ],
                [
                    'code' => 'security_logs',
                    'name' => 'Security Logs',
                    'type' => 'page',
                    'route' => '/tenant/audit/security',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Security Logs'],
                        ['code' => 'export', 'name' => 'Export Security Logs'],
                        ['code' => 'investigate', 'name' => 'Investigate Event'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 1.6 Notifications
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'notifications',
            'name' => 'Notifications',
            'description' => 'Manage notification channels, templates, and broadcasts',
            'icon' => 'BellIcon',
            'route' => '/tenant/notifications',
            'priority' => 6,

            'components' => [
                [
                    'code' => 'channels',
                    'name' => 'Notification Channels',
                    'type' => 'page',
                    'route' => '/tenant/notifications/channels',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Channels'],
                        ['code' => 'configure', 'name' => 'Configure Channel'],
                        ['code' => 'test', 'name' => 'Test Channel'],
                    ],
                ],
                [
                    'code' => 'templates',
                    'name' => 'Notification Templates',
                    'type' => 'page',
                    'route' => '/tenant/notifications/templates',
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
        | 1.7 File Manager
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'file_manager',
            'name' => 'File Manager',
            'description' => 'Manage file storage and media library',
            'icon' => 'FolderOpenIcon',
            'route' => '/tenant/files',
            'priority' => 7,

            'components' => [
                [
                    'code' => 'storage',
                    'name' => 'Storage Management',
                    'type' => 'page',
                    'route' => '/tenant/files/storage',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Storage'],
                        ['code' => 'configure', 'name' => 'Configure Storage'],
                        ['code' => 'cleanup', 'name' => 'Cleanup Storage'],
                    ],
                ],
                [
                    'code' => 'media_library',
                    'name' => 'Media Library',
                    'type' => 'page',
                    'route' => '/tenant/files/media',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Media'],
                        ['code' => 'upload', 'name' => 'Upload Media'],
                        ['code' => 'delete', 'name' => 'Delete Media'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 1.8 Settings
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'settings',
            'name' => 'Settings',
            'description' => 'Application settings and preferences',
            'icon' => 'Cog8ToothIcon',
            'route' => '/tenant/settings',
            'priority' => 99,

            'components' => [
                [
                    'code' => 'general',
                    'name' => 'General Settings',
                    'type' => 'page',
                    'route' => '/tenant/settings/general',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Settings'],
                        ['code' => 'edit', 'name' => 'Edit Settings'],
                    ],
                ],
                [
                    'code' => 'security',
                    'name' => 'Security Settings',
                    'type' => 'page',
                    'route' => '/tenant/settings/security',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Settings'],
                        ['code' => 'edit', 'name' => 'Edit Settings'],
                        ['code' => 'enable_2fa', 'name' => 'Enable 2FA'],
                        ['code' => 'disable_2fa', 'name' => 'Disable 2FA'],
                    ],
                ],
                [
                    'code' => 'localization',
                    'name' => 'Localization',
                    'type' => 'page',
                    'route' => '/tenant/settings/localization',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Settings'],
                        ['code' => 'edit', 'name' => 'Edit Settings'],
                    ],
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Access Control Settings
    |--------------------------------------------------------------------------
    */
    'access_control' => [
        'super_admin_role' => 'super-admin',
        'cache_ttl' => 3600,
        'cache_tags' => ['module-access', 'role-access'],
    ],
];
