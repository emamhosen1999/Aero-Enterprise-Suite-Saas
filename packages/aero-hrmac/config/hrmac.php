<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Super Admin Roles
    |--------------------------------------------------------------------------
    |
    | Users with these roles bypass all module access checks.
    | They have full access to all modules, sub-modules, components, and actions.
    |
    */

    'super_admin_roles' => [
        'Super Administrator',
        'super-admin',
        'tenant_super_administrator',
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    |
    | Caching configuration for role module access checks.
    | Role access is cached per-role, user access is cached per-user.
    |
    */

    'cache' => [
        // Enable or disable caching (recommended: true in production)
        'enabled' => env('HRMAC_CACHE_ENABLED', true),

        // Cache TTL in seconds (default: 1 hour)
        'ttl' => env('HRMAC_CACHE_TTL', 3600),

        // Cache key prefix
        'prefix' => 'hrmac',
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Landing Routes
    |--------------------------------------------------------------------------
    |
    | These routes are used for smart landing redirects when a user logs in
    | or accesses the root URL. The first accessible route is used.
    |
    | The 'module' and 'sub_module' define what access is required.
    | The 'route' defines where to redirect if access is granted.
    |
    */

    'landing_routes' => [
        // Primary: Dashboard (Core module, Dashboard sub-module)
        [
            'module' => 'core',
            'sub_module' => 'dashboard',
            'route' => 'tenant.dashboard',
            'priority' => 1,
        ],

        // Fallback to HRM Employee Dashboard (if HRM access)
        [
            'module' => 'hrm',
            'sub_module' => null, // Any HRM access
            'route' => 'tenant.hrm.index',
            'priority' => 2,
        ],

        // Generic module landing pages
        // These are checked dynamically based on sub-modules table
    ],

    /*
    |--------------------------------------------------------------------------
    | Access Inheritance
    |--------------------------------------------------------------------------
    |
    | Define how access cascades down the hierarchy.
    |
    | When enabled:
    | - Module access grants access to all sub-modules (unless explicitly denied)
    | - Sub-module access grants access to all components within it
    | - Component access grants access to all actions within it
    |
    */

    'inheritance' => [
        // If a role has module access, does it automatically get sub-module access?
        'module_grants_sub_modules' => true,

        // If a role has sub-module access, does it automatically get component access?
        'sub_module_grants_components' => true,

        // If a role has component access, does it automatically get action access?
        'component_grants_actions' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging
    |--------------------------------------------------------------------------
    |
    | Configure access denial logging for security auditing.
    |
    */

    'logging' => [
        // Log when access is denied
        'log_denials' => env('HRMAC_LOG_DENIALS', true),

        // Log channel to use (null = default)
        'channel' => env('HRMAC_LOG_CHANNEL', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Middleware Aliases
    |--------------------------------------------------------------------------
    |
    | Define middleware aliases registered by the package.
    |
    */

    'middleware' => [
        'role.access' => \Aero\HRMAC\Http\Middleware\CheckRoleModuleAccess::class,
        'smart.landing' => \Aero\HRMAC\Http\Middleware\SmartLandingRedirect::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Discovery Configuration
    |--------------------------------------------------------------------------
    |
    | Configure paths for module discovery. The ModuleDiscoveryService
    | scans these paths for config/module.php files.
    |
    */

    'discovery' => [
        // Paths to scan for module.php config files
        // {path} is relative to application base path
        'paths' => [
            'vendor/aero/*/config/module.php',
            'modules/*/config/module.php',
        ],

        // Whether to validate module configs during discovery
        'validate' => true,

        // Required fields in module.php config
        'required_fields' => ['module_key', 'label', 'scope'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Tables
    |--------------------------------------------------------------------------
    |
    | The database table names used by HRMAC models.
    |
    */

    'tables' => [
        'modules' => 'modules',
        'sub_modules' => 'sub_modules',
        'components' => 'module_components',
        'actions' => 'module_component_actions',
        'role_module_access' => 'role_module_access',
    ],
];
