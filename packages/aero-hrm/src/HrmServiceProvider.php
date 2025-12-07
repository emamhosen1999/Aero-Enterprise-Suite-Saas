<?php

namespace AeroModules\Hrm;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

/**
 * HRM Service Provider
 * 
 * Smart service provider that automatically detects the environment:
 * - Standalone: Regular Laravel application
 * - Platform: Multi-tenant platform (landlord context)
 * - Tenant: Multi-tenant platform (tenant context)
 */
class HrmServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Merge configuration
        $this->mergeConfigFrom(__DIR__.'/../config/aero-hrm.php', 'aero-hrm');
        
        // Register the main class to use with the facade
        $this->app->singleton('hrm', function ($app) {
            return new HrmManager($app);
        });
        
        // Register with platform module registry (if exists)
        if (class_exists(\App\Services\Shared\Module\ModuleRegistry::class)) {
            $this->app->make(\App\Services\Shared\Module\ModuleRegistry::class)
                ->register('hrm', [
                    'name' => 'Human Resource Management',
                    'version' => '1.0.0',
                    'provider' => self::class,
                ]);
        }
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Detect environment mode
        $mode = $this->detectMode();
        
        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        
        // Load routes based on mode
        $this->registerRoutes($mode);
        
        // Load views (if any)
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'aero-hrm');
        
        // Register publishable resources
        if ($this->app->runningInConsole()) {
            $this->registerPublishables();
            $this->registerCommands();
        }
    }

    /**
     * Detect the current mode (standalone, platform, or tenant)
     */
    protected function detectMode(): string
    {
        // Check if Tenancy package exists
        if (class_exists(\Stancl\Tenancy\Tenancy::class)) {
            // Check if in tenant context
            if (function_exists('tenant') && tenant() !== null) {
                return 'tenant';
            }
            // In platform/landlord context
            return 'platform';
        }
        
        // Standalone Laravel application
        return 'standalone';
    }

    /**
     * Register routes based on mode
     */
    protected function registerRoutes(string $mode): void
    {
        $middleware = $this->getRouteMiddleware($mode);
        $prefix = config('aero-hrm.routes.prefix', 'hrm');

        Route::middleware($middleware)
            ->prefix($prefix)
            ->name('hrm.')
            ->group(__DIR__.'/../routes/hrm.php');
    }

    /**
     * Get middleware based on mode
     */
    protected function getRouteMiddleware(string $mode): array
    {
        $middleware = ['web', 'auth'];
        
        // Add tenant middleware if in tenant mode
        if ($mode === 'tenant') {
            $middleware[] = \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class;
        }
        
        // Add any custom HRM middleware
        if (config('aero-hrm.routes.middleware')) {
            $middleware = array_merge($middleware, config('aero-hrm.routes.middleware'));
        }
        
        return $middleware;
    }

    /**
     * Register publishable resources
     */
    protected function registerPublishables(): void
    {
        // Publish configuration
        $this->publishes([
            __DIR__.'/../config/aero-hrm.php' => config_path('aero-hrm.php'),
        ], 'aero-hrm-config');
        
        // Publish migrations
        $this->publishes([
            __DIR__.'/../database/migrations' => database_path('migrations'),
        ], 'aero-hrm-migrations');
        
        // Publish frontend assets
        $this->publishes([
            __DIR__.'/../resources/js' => resource_path('js/vendor/aero-hrm'),
        ], 'aero-hrm-assets');
        
        // Publish views
        $this->publishes([
            __DIR__.'/../resources/views' => resource_path('views/vendor/aero-hrm'),
        ], 'aero-hrm-views');
        
        // Publish everything
        $this->publishes([
            __DIR__.'/../config/aero-hrm.php' => config_path('aero-hrm.php'),
            __DIR__.'/../database/migrations' => database_path('migrations'),
            __DIR__.'/../resources/js' => resource_path('js/vendor/aero-hrm'),
            __DIR__.'/../resources/views' => resource_path('views/vendor/aero-hrm'),
        ], 'aero-hrm');
    }

    /**
     * Register console commands
     */
    protected function registerCommands(): void
    {
        // Register any console commands here
        // $this->commands([
        //     Console\InstallCommand::class,
        //     Console\PublishAssetsCommand::class,
        // ]);
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return ['hrm'];
    }
}
