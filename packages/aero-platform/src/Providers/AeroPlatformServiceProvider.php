<?php

namespace Aero\Platform\Providers;

use Aero\Platform\Models\LandlordUser;
use Aero\Platform\Services\Billing\SslCommerzService;
use Aero\Platform\Services\ModuleAccessService;
use Aero\Platform\Services\Monitoring\Tenant\ErrorLogService;
use Aero\Platform\Services\PlatformSettingService;
use Aero\Platform\Services\RoleModuleAccessService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Aero Platform Service Provider
 *
 * Registers all Aero Platform services, routes, middleware, and assets.
 * This package provides multi-tenancy orchestration, landlord authentication,
 * billing/subscriptions, and platform administration.
 *
 * All configuration is handled programmatically - the host app remains clean.
 *
 * @package Aero\Platform
 */
class AeroPlatformServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Merge platform configs
        $this->mergeConfigFrom(__DIR__.'/../../config/modules.php', 'aero-platform.modules');
        $this->mergeConfigFrom(__DIR__.'/../../config/tenancy.php', 'tenancy');
        $this->mergeConfigFrom(__DIR__.'/../../config/platform.php', 'platform');

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
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');

        // Register routes
        $this->registerRoutes();

        // Publish assets
        $this->registerPublishing();

        // Register views (for email templates, etc.)
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'aero-platform');

        // Register commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                // Add console commands here
            ]);
        }
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
     * - Main domain → platform.php (public registration, landing)
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

        // Public platform routes (main domain - registration, landing)
        Route::group([
            'middleware' => ['web'],
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
            return 'admin.' . $basePart;
        }

        return 'admin.' . $host;
    }

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
        ];
    }
}
