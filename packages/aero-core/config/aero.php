<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Application Mode
    |--------------------------------------------------------------------------
    |
    | Determines the operational mode of the application:
    | - 'saas': Multi-tenant mode with aero-platform
    | - 'standalone': Single-tenant mode without platform
    |
    */

    'mode' => env('AERO_MODE', 'standalone'),

    /*
    |--------------------------------------------------------------------------
    | Standalone Tenant ID
    |--------------------------------------------------------------------------
    |
    | The default tenant ID used in standalone mode for tenant isolation.
    | This ensures that models using AeroTenantable trait work correctly.
    |
    */

    'standalone_tenant_id' => env('AERO_STANDALONE_TENANT_ID', 1),

    /*
    |--------------------------------------------------------------------------
    | Runtime Module Loading
    |--------------------------------------------------------------------------
    |
    | Enable/disable runtime module loading for standalone mode.
    | When enabled, modules in the 'modules' directory are automatically
    | discovered and loaded without requiring Composer.
    |
    */

    'runtime_loading' => [
        'enabled' => env('AERO_RUNTIME_LOADING', true),
        'modules_path' => env('AERO_MODULES_PATH', base_path('modules')),
        'cache_enabled' => env('AERO_CACHE_MODULES', true),
        'cache_ttl' => env('AERO_CACHE_TTL', 3600), // 1 hour
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Auto-Discovery
    |--------------------------------------------------------------------------
    |
    | Automatically discover and register modules from the packages directory.
    | This is used in both SaaS and Standalone modes.
    |
    */

    'auto_discovery' => [
        'enabled' => env('AERO_AUTO_DISCOVERY', true),
        'packages_path' => base_path('packages'),
        'scan_patterns' => [
            'packages/aero-*/src/*ServiceProvider.php',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Registry
    |--------------------------------------------------------------------------
    |
    | List of installed modules. In SaaS mode, this is synced with Composer.
    | In Standalone mode, this is manually maintained or auto-discovered.
    |
    */

    'modules' => [
        'installed' => [
            // Core modules (always available)
            'core' => [
                'enabled' => true,
                'required' => true,
            ],

            // Platform module (SaaS only)
            'platform' => [
                'enabled' => env('AERO_PLATFORM_ENABLED', false),
                'required' => false,
            ],

            // Feature modules
            'hrm' => [
                'enabled' => env('AERO_HRM_ENABLED', true),
                'required' => false,
            ],
            'crm' => [
                'enabled' => env('AERO_CRM_ENABLED', false),
                'required' => false,
            ],
            'finance' => [
                'enabled' => env('AERO_FINANCE_ENABLED', false),
                'required' => false,
            ],
            'project' => [
                'enabled' => env('AERO_PROJECT_ENABLED', false),
                'required' => false,
            ],
            'pos' => [
                'enabled' => env('AERO_POS_ENABLED', false),
                'required' => false,
            ],
            'ims' => [
                'enabled' => env('AERO_IMS_ENABLED', false),
                'required' => false,
            ],
            'scm' => [
                'enabled' => env('AERO_SCM_ENABLED', false),
                'required' => false,
            ],
            'dms' => [
                'enabled' => env('AERO_DMS_ENABLED', false),
                'required' => false,
            ],
            'quality' => [
                'enabled' => env('AERO_QUALITY_ENABLED', false),
                'required' => false,
            ],
            'compliance' => [
                'enabled' => env('AERO_COMPLIANCE_ENABLED', false),
                'required' => false,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Asset Management
    |--------------------------------------------------------------------------
    |
    | Configuration for module asset handling in different modes.
    |
    */

    'assets' => [
        'saas' => [
            'path' => public_path('vendor'),
            'url' => '/vendor',
        ],
        'standalone' => [
            'path' => public_path('modules'),
            'url' => '/modules',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Configuration
    |--------------------------------------------------------------------------
    |
    | Module-specific database settings.
    |
    */

    'database' => [
        // Tenant isolation strategy
        'tenant_isolation' => [
            'strategy' => env('AERO_TENANT_STRATEGY', 'database'), // 'database' or 'column'
            'column_name' => 'tenant_id',
        ],

        // Migration settings
        'migrations' => [
            'auto_run' => env('AERO_AUTO_MIGRATE', false),
            'path' => 'database/migrations',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Frontend Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for React/Vite module system.
    |
    */

    'frontend' => [
        'build_mode' => env('AERO_BUILD_MODE', 'library'), // 'library' or 'bundle'
        'shared_dependencies' => [
            'react',
            'react-dom',
            '@inertiajs/react',
            '@heroui/react',
        ],
        'cdn' => [
            'enabled' => env('AERO_CDN_ENABLED', true),
            'react' => 'https://unpkg.com/react@18/umd/react.production.min.js',
            'react_dom' => 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security & Performance
    |--------------------------------------------------------------------------
    |
    | Security and performance-related settings.
    |
    */

    'security' => [
        'verify_module_signatures' => env('AERO_VERIFY_SIGNATURES', false),
        'allowed_module_sources' => env('AERO_ALLOWED_SOURCES', '*'),
    ],

    'performance' => [
        'lazy_load_modules' => env('AERO_LAZY_LOAD', true),
        'preload_modules' => env('AERO_PRELOAD_MODULES', ''),
    ],
];
