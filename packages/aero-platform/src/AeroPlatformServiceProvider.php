<?php

namespace Aero\Platform;

use Aero\Core\Contracts\TenantScopeInterface;
use Aero\Platform\Listeners\TenantCreatedListener;
use Aero\Platform\Models\LandlordUser;
use Aero\Platform\Services\Billing\SslCommerzService;
use Aero\Platform\Services\ModuleAccessService;
use Aero\Platform\Services\Monitoring\Tenant\ErrorLogService;
use Aero\Platform\Services\PlatformSettingService;
use Aero\Platform\Services\RoleModuleAccessService;
use Aero\Platform\Services\SaaSTenantScope;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;
use Stancl\Tenancy\Events\TenantCreated;

/**
 * Aero Platform Service Provider
 *
 * Registers all Aero Platform services, routes, middleware, and assets.
 * This package provides multi-tenancy orchestration, landlord authentication,
 * billing/subscriptions, and platform administration.
 *
 * All configuration is handled programmatically - the host app remains clean.
 */
class AeroPlatformServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Disable Fortify's default routes - we define auth routes with proper domain restrictions
        // Admin subdomain uses Platform's AuthenticatedSessionController
        // Tenant subdomains use Core's AuthenticatedSessionController
        Fortify::ignoreRoutes();

        // Set aero.mode to 'saas' - Platform is the SaaS orchestrator
        // This MUST be set before any module checks for mode
        Config::set('aero.mode', 'saas');

        // Override Core's migrator to ONLY use platform migrations on landlord database
        // Core, HRM, CRM and other module migrations are for TENANT databases only
        $this->overrideMigratorForLandlord();

        // Merge platform configs
        $this->mergeConfigFrom(__DIR__.'/../../config/modules.php', 'aero-platform.modules');
        $this->mergeConfigFrom(__DIR__.'/../../config/tenancy.php', 'tenancy');
        $this->mergeConfigFrom(__DIR__.'/../../config/platform.php', 'platform');

        // Override TenantScopeInterface binding (Core binds StandaloneTenantScope by default)
        // Platform provides the SaaS implementation using stancl/tenancy
        $this->app->singleton(TenantScopeInterface::class, SaaSTenantScope::class);

        // Register services as singletons
        $this->app->singleton(ModuleAccessService::class);
        $this->app->singleton(RoleModuleAccessService::class);
        $this->app->singleton(PlatformSettingService::class);
        $this->app->singleton(ErrorLogService::class);
        $this->app->singleton(SslCommerzService::class);

        // Configure auth guards and providers programmatically
        $this->configureAuth();

        // Configure database connections programmatically
        $this->configureDatabase();

        // Register event listeners for tenant lifecycle
        $this->registerEventListeners();
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load platform migrations for landlord database
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');

        // Register routes
        $this->registerRoutes();

        // Register middleware (including HandleInertiaRequests which intercepts "/")
        $this->registerMiddleware();

        // Publish assets
        $this->registerPublishing();

        // Register views (for email templates, etc.)
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'aero-platform');

        // Also add views to the main view paths so 'app' view works for Inertia
        $this->app['view']->addLocation(__DIR__.'/../../resources/views');

        // Register commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                // Add console commands here
            ]);
        }
    }

    /**
     * Register middleware aliases for the platform package.
     * Follows same pattern as Core - push HandleInertiaRequests to web group.
     */
    protected function registerMiddleware(): void
    {
        // Use the booted callback to ensure app is fully initialized (same as Core)
        $this->app->booted(function () {
            $router = $this->app->make('router');

            // Register HandleInertiaRequests middleware to web middleware group
            // This middleware intercepts "/" and renders the proper page
            $router->pushMiddlewareToGroup('web', \Aero\Platform\Http\Middleware\HandleInertiaRequests::class);
        });

        $router = $this->app['router'];

        // Core platform middleware aliases
        $router->aliasMiddleware('module', \Aero\Platform\Http\Middleware\ModuleAccessMiddleware::class);
        $router->aliasMiddleware('check.module', \Aero\Platform\Http\Middleware\CheckModuleAccess::class);
        $router->aliasMiddleware('platform.domain', \Aero\Platform\Http\Middleware\EnsurePlatformDomain::class);
        $router->aliasMiddleware('enforce.subscription', \Aero\Platform\Http\Middleware\EnforceSubscription::class);
        $router->aliasMiddleware('check.installation', \Aero\Platform\Http\Middleware\CheckInstallation::class);
        $router->aliasMiddleware('maintenance', \Aero\Platform\Http\Middleware\CheckMaintenanceMode::class);
        $router->aliasMiddleware('permission', \Aero\Platform\Http\Middleware\PermissionMiddleware::class);
        $router->aliasMiddleware('role', \Aero\Platform\Http\Middleware\EnsureUserHasRole::class);
        $router->aliasMiddleware('platform.super.admin', \Aero\Platform\Http\Middleware\PlatformSuperAdmin::class);
        $router->aliasMiddleware('tenant.super.admin', \Aero\Platform\Http\Middleware\TenantSuperAdmin::class);
        $router->aliasMiddleware('tenant.setup', \Aero\Platform\Http\Middleware\EnsureTenantIsSetup::class);
        $router->aliasMiddleware('tenant.onboarding', \Aero\Platform\Http\Middleware\RequireTenantOnboarding::class);
        $router->aliasMiddleware('set.locale', \Aero\Platform\Http\Middleware\SetLocale::class);
        $router->aliasMiddleware('check.subscription', \Aero\Platform\Http\Middleware\CheckModuleSubscription::class);

        // Optionally push CheckModuleSubscription to 'tenant' middleware group
        // This provides automatic route-based module gating for all tenant routes
        // Uncomment if using stancl/tenancy's 'tenant' middleware group:
        // $router->pushMiddlewareToGroup('tenant', \Aero\Platform\Http\Middleware\CheckModuleSubscription::class);
    }

    /**
     * Configure authentication guards and providers programmatically.
     * This keeps the host app's auth.php clean.
     */
    protected function configureAuth(): void
    {
        // Add landlord guard
        Config::set('auth.guards.landlord', [
            'driver' => 'session',
            'provider' => 'landlord_users',
        ]);

        // Add landlord_users provider
        Config::set('auth.providers.landlord_users', [
            'driver' => 'eloquent',
            'model' => LandlordUser::class,
        ]);

        // Add password reset for landlord users
        Config::set('auth.passwords.landlord_users', [
            'provider' => 'landlord_users',
            'table' => 'landlord_password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ]);
    }

    /**
     * Configure database connections programmatically.
     * Adds 'central' connection for landlord models.
     */
    protected function configureDatabase(): void
    {
        // Get the default mysql configuration as a base
        $mysqlConfig = config('database.connections.mysql', []);

        // Add 'central' connection (same as default, but explicit for landlord models)
        Config::set('database.connections.central', array_merge($mysqlConfig, [
            'database' => env('DB_DATABASE', 'eos365'),
        ]));
    }

    /**
     * Register package routes.
     *
     * Routes are loaded based on domain context:
     * - admin.* subdomain → admin.php (landlord routes)
     * - Main platform domain → platform.php (public registration, landing)
     * - Tenant subdomains → handled by aero-core (NOT loaded here)
     */
    protected function registerRoutes(): void
    {
        // Admin routes (for admin.* subdomain - landlord guard)
        Route::group([
            'middleware' => ['web'],
            'domain' => $this->getAdminDomain(),
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../../routes/admin.php');
        });

        // Public platform routes (MAIN DOMAIN ONLY - registration, landing)
        // CRITICAL: Must restrict to central domain to avoid conflicts with tenant routes
        Route::group([
            'middleware' => ['web'],
            'domain' => $this->getPlatformDomain(),
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../../routes/platform.php');
        });

        // API routes (public + authenticated)
        Route::group([
            'middleware' => ['api'],
            'prefix' => 'api/platform',
            'as' => 'api.platform.',
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../../routes/api.php');
        });
    }

    /**
     * Get the main platform domain (e.g., platform.com).
     * Used to restrict platform.php routes to central domain only.
     */
    protected function getPlatformDomain(): string
    {
        $baseDomain = config('tenancy.central_domains.0', config('app.url', 'localhost'));

        // Parse the base domain to get just the host
        $parsed = parse_url($baseDomain);

        return $parsed['host'] ?? $baseDomain;
    }

    /**
     * Get the admin subdomain for routing.
     */
    protected function getAdminDomain(): string
    {
        $baseDomain = config('tenancy.central_domains.0', config('app.url'));

        // Parse the base domain to get just the domain part
        $parsed = parse_url($baseDomain);
        $host = $parsed['host'] ?? $baseDomain;

        // Remove any existing subdomain and add 'admin'
        $parts = explode('.', $host);
        if (count($parts) >= 2) {
            // Take the last two parts as the base domain
            $basePart = implode('.', array_slice($parts, -2));

            return 'admin.'.$basePart;
        }

        return 'admin.'.$host;
    }

    /**
    /**
     * Register package's publishable assets.
     */
    protected function registerPublishing(): void
    {
        if ($this->app->runningInConsole()) {
            // Publish migrations
            $this->publishes([
                __DIR__.'/../../database/migrations' => database_path('migrations'),
            ], 'aero-platform-migrations');

            // Publish config
            $this->publishes([
                __DIR__.'/../../config/modules.php' => config_path('aero-platform-modules.php'),
            ], 'aero-platform-config');

            // Publish JS assets (Inertia components)
            $this->publishes([
                __DIR__.'/../../resources/js' => resource_path('js/vendor/aero-platform'),
            ], 'aero-platform-assets');

            // Publish views
            $this->publishes([
                __DIR__.'/../../resources/views' => resource_path('views/vendor/aero-platform'),
            ], 'aero-platform-views');

            // Publish Mail templates
            $this->publishes([
                __DIR__.'/../../Mail' => app_path('Mail/Platform'),
            ], 'aero-platform-mail');
        }
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            ModuleAccessService::class,
            RoleModuleAccessService::class,
            PlatformSettingService::class,
            ErrorLogService::class,
            SslCommerzService::class,
            TenantScopeInterface::class,
        ];
    }

    /**
     * Register event listeners for tenant lifecycle.
     *
     * - TenantCreated: Runs module migrations on newly created tenant databases
     */
    protected function registerEventListeners(): void
    {
        // Listen for TenantCreated event to run module migrations
        // This ensures all installed modules (HRM, CRM, etc.) are migrated
        Event::listen(TenantCreated::class, TenantCreatedListener::class);
    }

    /**
     * Override the migrator to ONLY use aero-platform migrations on the landlord database.
     *
     * In SaaS mode:
     * - Landlord database: ONLY aero-platform migrations (tenants, domains, plans, etc.)
     * - Tenant databases: aero-core + module migrations (users, employees, etc.)
     *
     * This overrides Core's migrator override which excludes app migrations.
     * Platform further restricts to ONLY platform migrations for landlord.
     */
    protected function overrideMigratorForLandlord(): void
    {
        $platformMigrationsPath = realpath(__DIR__.'/../../database/migrations');

        $this->app->extend('migrator', function ($migrator, $app) use ($platformMigrationsPath) {
            return new class($app['migration.repository'], $app['db'], $app['files'], $app['events'], $platformMigrationsPath) extends \Illuminate\Database\Migrations\Migrator
            {
                protected string $platformMigrationsPath;

                public function __construct($repository, $resolver, $files, $dispatcher, string $platformMigrationsPath)
                {
                    parent::__construct($repository, $resolver, $files, $dispatcher);
                    $this->platformMigrationsPath = $platformMigrationsPath;
                }

                public function getMigrationFiles($paths)
                {
                    // Get all migration files from all paths
                    $files = parent::getMigrationFiles($paths);

                    // ONLY allow migrations from aero-platform package
                    // All other packages (core, hrm, crm, etc.) are for tenant databases
                    return collect($files)->filter(function ($path, $name) {
                        // Normalize path for comparison (resolve ../ and convert slashes)
                        $normalizedPath = realpath($path) ?: $path;
                        
                        // Allow ONLY platform migrations
                        return str_starts_with($normalizedPath, $this->platformMigrationsPath);
                    })->all();
                }
            };
        });
    }
}
