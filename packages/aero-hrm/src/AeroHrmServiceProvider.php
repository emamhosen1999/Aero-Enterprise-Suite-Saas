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
        
        // Register module definitions
        $this->mergeConfigFrom(
            __DIR__ . '/../config/modules.php',
            'modules'
        );
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

        // Load views (if any - for email templates, PDFs, etc.)
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'hrm');

        // Register routes
        $this->registerRoutes();

        // Publish configuration
        $this->publishes([
            __DIR__ . '/../config/hrm.php' => config_path('hrm.php'),
        ], 'aero-hrm-config');

        // NOTE: Frontend is handled by aero/ui package
        // This package is backend-only (controllers, models, services)
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
        // Use global helper function for consistency
        if (function_exists('is_saas_mode') && is_saas_mode()) {
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
     * @deprecated Use global isPlatformActive() or is_saas_mode() helper instead
     * @return bool
     */
    protected function isPlatformActive(): bool
    {
        // Use global helper if available
        if (function_exists('isPlatformActive')) {
            return isPlatformActive();
        }

        return class_exists(\Aero\Platform\AeroPlatformServiceProvider::class);
    }

    /**
     * Check if running in SaaS mode.
     *
     * @deprecated Use global is_saas_mode() helper instead
     * @return bool
     */
    protected function isSaaSMode(): bool
    {
        if (function_exists('is_saas_mode')) {
            return is_saas_mode();
        }

        return config('aero.mode') === 'saas';
    }
}
