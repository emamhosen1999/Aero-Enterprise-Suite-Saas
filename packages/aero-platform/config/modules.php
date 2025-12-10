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
            'requires_subscription' => false,
            'route_prefix' => 'dashboard',
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
            'description' => 'User accounts and authentication',
            'icon' => 'UserGroupIcon',
            'priority' => 2,
            'is_active' => true,
            'requires_subscription' => false,
            'route_prefix' => 'users',
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
                                ['code' => 'invite', 'name' => 'Invite User', 'is_active' => true],
                                ['code' => 'reset_password', 'name' => 'Reset Password', 'is_active' => true],
                                ['code' => 'lock_account', 'name' => 'Lock Account', 'is_active' => true],
                                ['code' => 'unlock_account', 'name' => 'Unlock Account', 'is_active' => true],
                            ],
                        ],
                        [
                            'code' => 'user_profile',
                            'name' => 'User Profile',
                            'description' => 'User profile management',
                            'route_name' => 'profile.show',
                            'priority' => 2,
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
            ],
        ],

        // =====================================================================
        // ROLE & PERMISSION MODULE
        // =====================================================================
        [
            'code' => 'roles_permissions',
            'name' => 'Roles & Permissions',
            'description' => 'Role-based access control',
            'icon' => 'ShieldCheckIcon',
            'priority' => 3,
            'is_active' => true,
            'requires_subscription' => false,
            'route_prefix' => 'roles',
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
                                ['code' => 'assign_permissions', 'name' => 'Assign Permissions', 'is_active' => true],
                                ['code' => 'manage_module_access', 'name' => 'Manage Module Access', 'is_active' => true],
                            ],
                        ],
                    ],
                ],
                [
                    'code' => 'permissions',
                    'name' => 'Permissions',
                    'description' => 'Manage permissions',
                    'icon' => 'KeyIcon',
                    'priority' => 2,
                    'is_active' => true,
                    'components' => [
                        [
                            'code' => 'permission_list',
                            'name' => 'Permission List',
                            'description' => 'View and manage permissions',
                            'route_name' => 'permissions.index',
                            'priority' => 1,
                            'is_active' => true,
                            'actions' => [
                                ['code' => 'view', 'name' => 'View Permissions', 'is_active' => true],
                                ['code' => 'create', 'name' => 'Create Permission', 'is_active' => true],
                                ['code' => 'edit', 'name' => 'Edit Permission', 'is_active' => true],
                                ['code' => 'delete', 'name' => 'Delete Permission', 'is_active' => true],
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
            'icon' => 'CogIcon',
            'priority' => 99,
            'is_active' => true,
            'requires_subscription' => false,
            'route_prefix' => 'settings',
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
