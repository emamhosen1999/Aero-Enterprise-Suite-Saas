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
     * Note: All routes are consolidated in web.php. The service provider applies:
     * - Route prefix: 'hrm' (paths: /hrm/*)
     * - Route name prefix: 'hrm.' (names: hrm.*)
     *
     * @return void
     */
    protected function registerRoutes(): void
    {
        $routesPath = __DIR__ . '/../routes';

        // Check if aero-platform is active (SaaS mode)
        if ($this->isPlatformActive()) {
            // SaaS Mode: Routes with tenant middleware
            Route::middleware(['web', 'tenant'])
                ->prefix('hrm')
                ->name('hrm.')
                ->group($routesPath . '/web.php');
        } else {
            // Standalone Mode: Routes with standard web middleware
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
