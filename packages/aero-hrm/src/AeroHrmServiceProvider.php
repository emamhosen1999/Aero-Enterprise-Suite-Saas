<?php

namespace Aero\HRM;

use Aero\HRM\Providers\HRMServiceProvider as ModuleServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * AeroHrmServiceProvider
 * 
 * Main service provider for the HRM package.
 * Registers the module service provider which handles navigation, policies, etc.
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
        // Register the HRM module service provider
        $this->app->register(ModuleServiceProvider::class);
        
        // Register module configuration
        $this->mergeConfigFrom(
            __DIR__ . '/../config/hrm.php',
            'hrm'
        );
        
        // Module definitions are in config/module.php and loaded by ModuleDiscoveryService
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

        // Publish compiled module library (ES module for runtime loading)
        // Built to dist/ directory via npm run build
        $moduleLibrary = __DIR__ . '/../dist';
        if (is_dir($moduleLibrary)) {
            $this->publishes([
                $moduleLibrary => public_path('modules/aero-hrm'),
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
     * Route Architecture:
     * -------------------
     * aero-hrm has exactly 1 route file: web.php
     * Contains all HRM routes under /hrm prefix with hrm.* naming.
     *
     * Domain-based routing:
     * - In SaaS mode: Routes ONLY on tenant domains (tenant.domain.com/hrm/*)
     * - In Standalone mode: Routes on main domain (domain.com/hrm/*)
     *
     * @return void
     */
    protected function registerRoutes(): void
    {
        $routesPath = __DIR__ . '/../routes';

        // Check if aero-platform is active (SaaS mode)
        if ($this->isPlatformActive()) {
            // SaaS Mode: InitializeTenancyIfNotCentral initializes tenant context,
            // 'tenant' middleware ensures valid tenant context exists
            Route::middleware([
                'web',
                \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
                'tenant',
            ])
                ->prefix('hrm')
                ->name('hrm.')
                ->group($routesPath . '/web.php');
        } else {
            // Standalone Mode: Routes with standard web middleware on domain.com
            Route::middleware(['web'])
                ->prefix('hrm')
                ->name('hrm.')
                ->group($routesPath . '/web.php');
        }
    }

    /**
     * Check if aero-platform is active.
     *
     * @return bool
     */
    protected function isPlatformActive(): bool
    {
        return class_exists(\Aero\Platform\AeroPlatformServiceProvider::class);
    }

    /**
     * Check if running in SaaS mode.
     *
     * @return bool
     */
    protected function isSaaSMode(): bool
    {
        return is_saas_mode();
    }
}
