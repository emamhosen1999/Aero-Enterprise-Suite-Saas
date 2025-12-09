<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Aero Core Modules Configuration
    |--------------------------------------------------------------------------
    |
    | This file defines the core modules available in Aero Core package.
    | These are fundamental modules required by all Aero applications.
    |
    | Hierarchy: Module → SubModule → Component → Action
    |
    */

    'modules' => [
        // =====================================================================
        // DASHBOARD MODULE
        // =====================================================================
        [
            'code' => 'dashboard',
            'name' => 'Dashboard',
            'description' => 'Main dashboard and overview',
            'icon' => 'HomeIcon',
            'priority' => 1,
            'is_active' => true,
            'is_core' => true,
            'requires_subscription' => false,
            'route_prefix' => 'dashboard',
            'category' => 'core',
            'version' => '1.0.0',
            'sub_modules' => [
                [
                    'code' => 'overview',
                    'name' => 'Overview',
                    'description' => 'Dashboard overview and statistics',
                    'icon' => 'ChartBarIcon',
                    'priority' => 1,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'dashboard_view',
                            'name' => 'Dashboard View',
                            'description' => 'Main dashboard view',
                            'route_name' => 'dashboard.index',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Dashboard', 'is_active' => true],
                            ],
                        ],
                        [
                            'code' => 'stats_widget',
                            'name' => 'Statistics Widget',
                            'description' => 'Dashboard statistics and KPIs',
                            'type' => 'widget',
                            'priority' => 2,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Statistics', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // USER MANAGEMENT MODULE
        // =====================================================================
        [
            'code' => 'user_management',
            'name' => 'User Management',
            'description' => 'User accounts, authentication, and invitations',
            'icon' => 'UserGroupIcon',
            'priority' => 2,
            'is_active' => true,
            'is_core' => true,
            'requires_subscription' => false,
            'route_prefix' => 'users',
            'category' => 'core',
            'version' => '1.0.0',
            'sub_modules' => [
                [
                    'code' => 'users',
                    'name' => 'Users',
                    'description' => 'Manage user accounts',
                    'icon' => 'UserIcon',
                    'priority' => 1,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'user_list',
                            'name' => 'User List',
                            'description' => 'View and manage users',
                            'route_name' => 'users.index',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Users', 'is_active' => true],
                                ['code' => 'create', 'name' => 'Create User', 'is_active' => true],
                                ['code' => 'edit', 'name' => 'Edit User', 'is_active' => true],
                                ['code' => 'delete', 'name' => 'Delete User', 'is_active' => true],
                                ['code' => 'bulk_delete', 'name' => 'Bulk Delete Users', 'is_active' => true],
                                ['code' => 'activate', 'name' => 'Activate User', 'is_active' => true],
                                ['code' => 'deactivate', 'name' => 'Deactivate User', 'is_active' => true],
                                ['code' => 'bulk_toggle_status', 'name' => 'Bulk Toggle Status', 'is_active' => true],
                                ['code' => 'bulk_assign_roles', 'name' => 'Bulk Assign Roles', 'is_active' => true],
                                ['code' => 'reset_password', 'name' => 'Reset Password', 'is_active' => true],
                                ['code' => 'lock_account', 'name' => 'Lock Account', 'is_active' => true],
                                ['code' => 'unlock_account', 'name' => 'Unlock Account', 'is_active' => true],
                                ['code' => 'export', 'name' => 'Export Users', 'is_active' => true],
                                ['code' => 'import', 'name' => 'Import Users', 'is_active' => true],
                            ],
                        ],
                        [
                            'code' => 'user_invitations',
                            'name' => 'User Invitations',
                            'description' => 'Invite and manage user invitations',
                            'route_name' => 'users.invitations.pending',
                            'priority' => 2,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Invitations', 'is_active' => true],
                                ['code' => 'invite', 'name' => 'Invite User', 'is_active' => true],
                                ['code' => 'resend', 'name' => 'Resend Invitation', 'is_active' => true],
                                ['code' => 'cancel', 'name' => 'Cancel Invitation', 'is_active' => true],
                            ],
                        ],
                        [
                            'code' => 'user_profile',
                            'name' => 'User Profile',
                            'description' => 'User profile management',
                            'route_name' => 'profile.show',
                            'priority' => 3,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Profile', 'is_active' => true],
                                ['code' => 'edit', 'name' => 'Edit Profile', 'is_active' => true],
                                ['code' => 'change_password', 'name' => 'Change Password', 'is_active' => true],
                                ['code' => 'upload_avatar', 'name' => 'Upload Avatar', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'authentication',
                    'name' => 'Authentication',
                    'description' => 'Authentication and security settings',
                    'icon' => 'KeyIcon',
                    'priority' => 2,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'devices',
                            'name' => 'Device Management',
                            'description' => 'Manage trusted devices',
                            'route_name' => 'devices.admin.list',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Devices', 'is_active' => true],
                                ['code' => 'toggle', 'name' => 'Toggle Device Trust', 'is_active' => true],
                                ['code' => 'reset', 'name' => 'Reset Device', 'is_active' => true],
                                ['code' => 'deactivate', 'name' => 'Deactivate Device', 'is_active' => true],
                            ],
                        ],
                        [
                            'code' => 'two_factor',
                            'name' => 'Two-Factor Authentication',
                            'description' => '2FA configuration',
                            'priority' => 2,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View 2FA Settings', 'is_active' => true],
                                ['code' => 'enable', 'name' => 'Enable 2FA', 'is_active' => true],
                                ['code' => 'disable', 'name' => 'Disable 2FA', 'is_active' => true],
                                ['code' => 'reset', 'name' => 'Reset 2FA', 'is_active' => true],
                            ],
                        ],
                        [
                            'code' => 'sessions',
                            'name' => 'Session Management',
                            'description' => 'View and manage user sessions',
                            'priority' => 3,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Sessions', 'is_active' => true],
                                ['code' => 'terminate', 'name' => 'Terminate Session', 'is_active' => true],
                                ['code' => 'terminate_all', 'name' => 'Terminate All Sessions', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // ROLE & MODULE ACCESS MODULE
        // =====================================================================
        [
            'code' => 'roles_permissions',
            'name' => 'Roles & Module Access',
            'description' => 'Role-based access control and module permissions',
            'icon' => 'ShieldCheckIcon',
            'priority' => 3,
            'is_active' => true,
            'is_core' => true,
            'requires_subscription' => false,
            'route_prefix' => 'roles',
            'category' => 'core',
            'version' => '1.0.0',
            'sub_modules' => [
                [
                    'code' => 'roles',
                    'name' => 'Roles',
                    'description' => 'Manage user roles',
                    'icon' => 'ShieldCheckIcon',
                    'priority' => 1,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'role_list',
                            'name' => 'Role List',
                            'description' => 'View and manage roles',
                            'route_name' => 'roles.index',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Roles', 'is_active' => true],
                                ['code' => 'create', 'name' => 'Create Role', 'is_active' => true],
                                ['code' => 'edit', 'name' => 'Edit Role', 'is_active' => true],
                                ['code' => 'delete', 'name' => 'Delete Role', 'is_active' => true],
                                ['code' => 'assign', 'name' => 'Assign Role to Users', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'module_access',
                    'name' => 'Module Access',
                    'description' => 'Configure role-based module access',
                    'icon' => 'CubeIcon',
                    'priority' => 2,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'module_list',
                            'name' => 'Module Management',
                            'description' => 'Configure module access for roles',
                            'route_name' => 'modules.index',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Modules', 'is_active' => true],
                                ['code' => 'configure', 'name' => 'Configure Module Access', 'is_active' => true],
                                ['code' => 'toggle', 'name' => 'Enable/Disable Module', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // AUDIT LOGS MODULE
        // =====================================================================
        [
            'code' => 'audit_logs',
            'name' => 'Audit & Activity Logs',
            'description' => 'View system activity, user actions, and security events',
            'icon' => 'ClipboardDocumentListIcon',
            'priority' => 4,
            'is_active' => true,
            'is_core' => true,
            'requires_subscription' => false,
            'route_prefix' => 'audit',
            'category' => 'core',
            'version' => '1.0.0',
            'sub_modules' => [
                [
                    'code' => 'activity_logs',
                    'name' => 'Activity Logs',
                    'description' => 'View user and system activity',
                    'icon' => 'ClipboardDocumentListIcon',
                    'priority' => 1,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'activity_list',
                            'name' => 'Activity Log List',
                            'description' => 'View all activity logs',
                            'route_name' => 'audit.activity',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Activity Logs', 'is_active' => true],
                                ['code' => 'export', 'name' => 'Export Activity Logs', 'is_active' => true],
                                ['code' => 'filter', 'name' => 'Advanced Filtering', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'security_logs',
                    'name' => 'Security Logs',
                    'description' => 'View security events and login attempts',
                    'icon' => 'ShieldExclamationIcon',
                    'priority' => 2,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'security_list',
                            'name' => 'Security Log List',
                            'description' => 'View security events',
                            'route_name' => 'audit.security',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Security Logs', 'is_active' => true],
                                ['code' => 'export', 'name' => 'Export Security Logs', 'is_active' => true],
                                ['code' => 'investigate', 'name' => 'Investigate Event', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // NOTIFICATIONS MODULE
        // =====================================================================
        [
            'code' => 'notifications',
            'name' => 'Notifications',
            'description' => 'Manage notification channels, templates, and broadcasts',
            'icon' => 'BellIcon',
            'priority' => 5,
            'is_active' => true,
            'is_core' => true,
            'requires_subscription' => false,
            'route_prefix' => 'notifications',
            'category' => 'core',
            'version' => '1.0.0',
            'sub_modules' => [
                [
                    'code' => 'channels',
                    'name' => 'Notification Channels',
                    'description' => 'Configure email, SMS, push notification channels',
                    'icon' => 'MegaphoneIcon',
                    'priority' => 1,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'channel_settings',
                            'name' => 'Channel Settings',
                            'description' => 'Configure notification channels',
                            'route_name' => 'notifications.channels',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Channels', 'is_active' => true],
                                ['code' => 'configure', 'name' => 'Configure Channel', 'is_active' => true],
                                ['code' => 'test', 'name' => 'Test Channel', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'templates',
                    'name' => 'Notification Templates',
                    'description' => 'Create and manage notification templates',
                    'icon' => 'DocumentDuplicateIcon',
                    'priority' => 2,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'template_list',
                            'name' => 'Template List',
                            'description' => 'Manage notification templates',
                            'route_name' => 'notifications.templates',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Templates', 'is_active' => true],
                                ['code' => 'create', 'name' => 'Create Template', 'is_active' => true],
                                ['code' => 'edit', 'name' => 'Edit Template', 'is_active' => true],
                                ['code' => 'delete', 'name' => 'Delete Template', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // FILE MANAGER MODULE
        // =====================================================================
        [
            'code' => 'file_manager',
            'name' => 'File Manager',
            'description' => 'Manage file storage and media library',
            'icon' => 'FolderOpenIcon',
            'priority' => 6,
            'is_active' => true,
            'is_core' => true,
            'requires_subscription' => false,
            'route_prefix' => 'files',
            'category' => 'core',
            'version' => '1.0.0',
            'sub_modules' => [
                [
                    'code' => 'storage',
                    'name' => 'Storage Management',
                    'description' => 'Manage file storage',
                    'icon' => 'ServerIcon',
                    'priority' => 1,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'storage_overview',
                            'name' => 'Storage Overview',
                            'description' => 'View storage usage and statistics',
                            'route_name' => 'files.storage',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Storage', 'is_active' => true],
                                ['code' => 'configure', 'name' => 'Configure Storage', 'is_active' => true],
                                ['code' => 'cleanup', 'name' => 'Cleanup Storage', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'media_library',
                    'name' => 'Media Library',
                    'description' => 'Browse and manage media files',
                    'icon' => 'PhotoIcon',
                    'priority' => 2,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'media_browser',
                            'name' => 'Media Browser',
                            'description' => 'Browse media files',
                            'route_name' => 'files.media',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Media', 'is_active' => true],
                                ['code' => 'upload', 'name' => 'Upload Media', 'is_active' => true],
                                ['code' => 'delete', 'name' => 'Delete Media', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // SETTINGS MODULE
        // =====================================================================
        [
            'code' => 'settings',
            'name' => 'Settings',
            'description' => 'Application settings and preferences',
            'icon' => 'Cog8ToothIcon',
            'priority' => 99,
            'is_active' => true,
            'is_core' => true,
            'requires_subscription' => false,
            'route_prefix' => 'settings',
            'category' => 'core',
            'version' => '1.0.0',
            'sub_modules' => [
                [
                    'code' => 'general',
                    'name' => 'General Settings',
                    'description' => 'General application settings',
                    'icon' => 'CogIcon',
                    'priority' => 1,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'general_settings',
                            'name' => 'General Settings',
                            'description' => 'Manage general settings',
                            'route_name' => 'settings.general',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Settings', 'is_active' => true],
                                ['code' => 'edit', 'name' => 'Edit Settings', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'security',
                    'name' => 'Security Settings',
                    'description' => 'Security and authentication settings',
                    'icon' => 'LockClosedIcon',
                    'priority' => 2,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'security_settings',
                            'name' => 'Security Settings',
                            'description' => 'Manage security settings',
                            'route_name' => 'settings.security',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Settings', 'is_active' => true],
                                ['code' => 'edit', 'name' => 'Edit Settings', 'is_active' => true],
                                ['code' => 'enable_2fa', 'name' => 'Enable 2FA', 'is_active' => true],
                                ['code' => 'disable_2fa', 'name' => 'Disable 2FA', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'localization',
                    'name' => 'Localization',
                    'description' => 'Language and timezone settings',
                    'icon' => 'LanguageIcon',
                    'priority' => 3,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'localization_settings',
                            'name' => 'Localization Settings',
                            'description' => 'Manage language and timezone',
                            'route_name' => 'settings.localization',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Settings', 'is_active' => true],
                                ['code' => 'edit', 'name' => 'Edit Settings', 'is_active' => true],
                            ],
                        ],
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
        // Super admin role (bypasses all module checks)
        'super_admin_role' => 'super-admin',

        // Cache TTL in seconds (1 hour)
        'cache_ttl' => 3600,

        // Cache tags
        'cache_tags' => ['module-access', 'role-access'],
    ],
];
