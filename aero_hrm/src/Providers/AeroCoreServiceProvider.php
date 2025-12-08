<?php

namespace Aero\Core\Providers;

use Aero\Core\Services\ModuleAccessService;
use Aero\Core\Services\RoleModuleAccessService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Aero Core Service Provider
 *
 * Registers all Aero Core services, routes, middleware, and assets.
 */
class AeroCoreServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Merge core config
        $this->mergeConfigFrom(__DIR__.'/../../config/modules.php', 'aero-core.modules');

        // Register services
        $this->app->singleton(ModuleAccessService::class);
        $this->app->singleton(RoleModuleAccessService::class);
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

        // Register views (if needed for email templates, etc.)
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'aero-core');
    }

    /**
     * Register package routes.
     */
    protected function registerRoutes(): void
    {
        Route::group([
            'middleware' => ['web', 'auth'],
            'prefix' => 'core',
            'as' => 'core.',
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../../routes/web.php');
        });

        // API routes
        Route::group([
            'middleware' => ['api', 'auth:sanctum'],
            'prefix' => 'api/core',
            'as' => 'api.core.',
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../../routes/api.php');
        });
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
            ], 'aero-core-migrations');

            // Publish config
            $this->publishes([
                __DIR__.'/../../config/modules.php' => config_path('aero-core-modules.php'),
            ], 'aero-core-config');

            // Publish JS assets (Inertia components)
            $this->publishes([
                __DIR__.'/../../resources/js' => resource_path('js/vendor/aero-core'),
            ], 'aero-core-assets');

            // Publish views
            $this->publishes([
                __DIR__.'/../../resources/views' => resource_path('views/vendor/aero-core'),
            ], 'aero-core-views');
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
        ];
    }
}
