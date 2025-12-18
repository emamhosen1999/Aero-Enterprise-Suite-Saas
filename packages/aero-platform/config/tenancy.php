<?php

declare(strict_types=1);

use Stancl\Tenancy\Database\Models\Domain;

return [

    /*
    |--------------------------------------------------------------------------
    | Tenant Model
    |--------------------------------------------------------------------------
    |
    | The tenant model used by the application.
    |
    */

    'tenant_model' => \Aero\Platform\Models\Tenant::class,

    /*
    |--------------------------------------------------------------------------
    | Central Domains
    |--------------------------------------------------------------------------
    |
    | Domains that should not be handled by tenancy (central app domains).
    | This includes the main platform domain and admin subdomain.
    |
    | AUTO-DETECTION: Automatically detects from the current HTTP request.
    | Extracts the root domain from the browser request (e.g., aeos365.test)
    | and automatically includes admin subdomain (admin.aeos365.test).
    |
    | NO MANUAL CONFIGURATION REQUIRED.
    |
    */

    'central_domains' => (function () {
        // Get current request domain from browser
        if (app()->runningInConsole() || !request()) {
            // In console, use fallback
            return [
                env('PLATFORM_DOMAIN', 'localhost'),
                'admin.'.env('PLATFORM_DOMAIN', 'localhost'),
            ];
        }

        $currentHost = request()->getHost();
        $hostWithoutPort = preg_replace('/:\d+$/', '', $currentHost);
        
        // Extract root domain (remove subdomain if present)
        $parts = explode('.', $hostWithoutPort);
        
        // If it's a subdomain (e.g., tenant.aeos365.test or admin.aeos365.test)
        // Extract the root domain (aeos365.test)
        if (count($parts) > 2) {
            // Remove first part (subdomain), keep domain.tld
            $rootDomain = implode('.', array_slice($parts, 1));
        } else {
            // Already a root domain (e.g., aeos365.test)
            $rootDomain = $hostWithoutPort;
        }
        
        return [
            $rootDomain,              // e.g., aeos365.test
            'admin.'.$rootDomain,     // e.g., admin.aeos365.test
            'localhost',              // Always include for local dev
            '127.0.0.1',              // IP address support
        ];
    })(),

    /*
    |--------------------------------------------------------------------------
    | Domain Model
    |--------------------------------------------------------------------------
    */

    'domain_model' => Domain::class,

    /*
    |--------------------------------------------------------------------------
    | Identification Middleware
    |--------------------------------------------------------------------------
    |
    | The middleware used to identify tenants based on the incoming request.
    |
    */

    'identification' => [
        'middleware' => \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
        'driver' => 'domain',
    ],

    /*
    |--------------------------------------------------------------------------
    | Database
    |--------------------------------------------------------------------------
    |
    | Database configuration for tenant databases.
    |
    */

    'database' => [
        // The connection to use when reverting to central database
        // This is the default connection before tenancy is initialized
        'central_connection' => env('DB_CONNECTION', 'mysql'),

        'prefix' => 'tenant',
        'suffix' => '',

        // Template for tenant database connection
        // Uses the default DB connection as the template for creating tenant databases
        'template_tenant_connection' => env('DB_CONNECTION', 'mysql'),

        // Managers that handle tenant database creation/deletion
        // Use 'cpanel' for shared hosting, 'mysql' for VPS/dedicated servers
        'managers' => [
            'mysql' => env('TENANCY_DATABASE_MANAGER', 'mysql') === 'cpanel'
                ? \Aero\Platform\TenantDatabaseManagers\CpanelDatabaseManager::class
                : \Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
            'mariadb' => env('TENANCY_DATABASE_MANAGER', 'mysql') === 'cpanel'
                ? \Aero\Platform\TenantDatabaseManagers\CpanelDatabaseManager::class
                : \Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | cPanel Configuration (for shared hosting)
    |--------------------------------------------------------------------------
    |
    | These settings are only used when TENANCY_DATABASE_MANAGER=cpanel
    |
    | To use cPanel mode:
    | 1. Set TENANCY_DATABASE_MANAGER=cpanel in .env
    | 2. Generate an API token in cPanel → Security → Manage API Tokens
    | 3. Configure the credentials below
    |
    */

    'cpanel' => [
        'host' => env('CPANEL_HOST'),           // e.g., 'aeos365.com' or 'cpanel.aeos365.com'
        'username' => env('CPANEL_USERNAME'),    // cPanel username (e.g., 'aeos365')
        'api_token' => env('CPANEL_API_TOKEN'),  // API token from cPanel
        'port' => env('CPANEL_PORT', 2083),      // cPanel HTTPS port (usually 2083)
        'db_user' => env('CPANEL_DB_USER'),      // Database user (defaults to username)
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | Tenant resolution caching configuration.
    |
    */

    'cache' => [
        'tag' => 'tenancy',
        'ttl' => 3600, // 1 hour
    ],

    /*
    |--------------------------------------------------------------------------
    | Bootstrappers
    |--------------------------------------------------------------------------
    |
    | The bootstrappers are executed when tenancy is initialized.
    | They configure the application for the specific tenant.
    |
    */

    'bootstrappers' => [
        \Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper::class,
        // \Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class, // Disabled - file/database cache drivers don't support tagging
        // \Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class, // Disabled - causing "Undefined array key 'local'" error
        \Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Features
    |--------------------------------------------------------------------------
    |
    | Enabled tenancy features.
    |
    */

    'features' => [
        \Stancl\Tenancy\Features\TenantConfig::class,
        \Stancl\Tenancy\Features\CrossDomainRedirect::class,
        \Stancl\Tenancy\Features\UserImpersonation::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Parameters
    |--------------------------------------------------------------------------
    |
    | Parameters passed to tenant migrations.
    |
    */

    'migration_parameters' => [
        '--force' => true,
        '--path' => [
            // Tenant migrations from packages (monorepo structure)
            // aero-core provides base tenant tables (users, roles, permissions, etc.)
            'vendor/aero/core/database/migrations',
            // aero-hrm provides HRM-specific tables
            'vendor/aero/hrm/database/migrations',
            // App-level tenant migrations (if any)
            database_path('migrations/tenant'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Seeder Parameters
    |--------------------------------------------------------------------------
    */

    'seeder_parameters' => [
        '--class' => 'Database\\Seeders\\TenantDatabaseSeeder',
    ],

];
