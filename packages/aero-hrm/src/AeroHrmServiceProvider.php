<?php

namespace Aero\Hrm;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

/**
 * AeroHrmServiceProvider
 * 
 * Example service provider demonstrating how to build a module
 * that works in both SaaS and Standalone modes using the 4 Integration Pillars.
 */
class AeroHrmServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register(): void
    {
        // Register module configuration
        $this->mergeConfigFrom(
            __DIR__ . '/../config/hrm.php',
            'hrm'
        );

        // Register module services
        $this->app->singleton('aero.hrm', function ($app) {
            return new \Aero\Hrm\Services\HrmService();
        });
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        // Load views (if any)
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'hrm');

        // Register routes
        $this->registerRoutes();

        // Publish assets in SaaS mode
        if ($this->isSaaSMode()) {
            $this->publishes([
                __DIR__ . '/../public' => public_path('vendor/aero-hrm'),
            ], 'aero-hrm-assets');
        }

        // Publish configuration
        $this->publishes([
            __DIR__ . '/../config/hrm.php' => config_path('hrm.php'),
        ], 'aero-hrm-config');
    }

    /**
     * Register module routes.
     * 
     * Note: The ModuleRouteServiceProvider will handle this automatically,
     * but you can also register routes manually if needed.
     *
     * @return void
     */
    protected function registerRoutes(): void
    {
        $routesPath = __DIR__ . '/../routes';

        // Check if aero-platform is active (SaaS mode)
        if ($this->isPlatformActive()) {
            // SaaS Mode: Routes with tenant middleware
            Route::middleware(['web', 'tenant', 'auth'])
                ->namespace('Aero\Hrm\Http\Controllers')
                ->prefix('hrm')
                ->name('hrm.')
                ->group($routesPath . '/tenant.php');

            // API routes
            Route::middleware(['api', 'tenant', 'auth:sanctum'])
                ->prefix('api/hrm')
                ->name('api.hrm.')
                ->namespace('Aero\Hrm\Http\Controllers\Api')
                ->group($routesPath . '/api.php');
        } else {
            // Standalone Mode: Routes with standard web middleware
            Route::middleware(['web', 'auth'])
                ->namespace('Aero\Hrm\Http\Controllers')
                ->prefix('hrm')
                ->name('hrm.')
                ->group($routesPath . '/tenant.php');

            // API routes
            Route::middleware(['api', 'auth:sanctum'])
                ->prefix('api/hrm')
                ->name('api.hrm.')
                ->namespace('Aero\Hrm\Http\Controllers\Api')
                ->group($routesPath . '/api.php');
        }
    }

    /**
     * Check if aero-platform is active.
     *
     * @return bool
     */
    protected function isPlatformActive(): bool
    {
        return function_exists('isPlatformActive') && isPlatformActive();
    }

    /**
     * Check if running in SaaS mode.
     *
     * @return bool
     */
    protected function isSaaSMode(): bool
    {
        return config('aero.mode') === 'saas';
    }
}
