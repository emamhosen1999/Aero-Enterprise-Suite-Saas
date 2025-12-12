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
    */

    'central_domains' => [
        env('PLATFORM_DOMAIN', 'localhost'),
        'admin.' . env('PLATFORM_DOMAIN', 'localhost'),
    ],

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
        'prefix' => 'tenant',
        'suffix' => '',

        // Template for tenant database connection
        'template_tenant_connection' => null,

        // Managers that handle tenant database creation/deletion
        'managers' => [
            'mysql' => \Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
        ],
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
        \Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
        \Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class,
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
            // Paths to tenant-specific migrations
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
