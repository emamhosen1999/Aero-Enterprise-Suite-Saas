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
     * Routing Strategy (same as Core):
     * --------------------------------
     * In SaaS mode (aero-platform active):
     * - HRM routes use InitializeTenancyIfNotCentral middleware which:
     *   1. Checks if request is on a central domain (platform, admin)
     *   2. Returns 404 on central domains (routes don't exist there)
     *   3. Initializes tenancy on tenant subdomains
     *
     * In Standalone mode:
     * - HRM routes run on all domains with standard web middleware
     *
     * @return void
     */
    protected function registerRoutes(): void
    {
        $routesPath = __DIR__ . '/../routes';

        // Check if aero-platform is active (SaaS mode)
        if ($this->isPlatformActive()) {
            // SaaS Mode: InitializeTenancyIfNotCentral MUST come BEFORE 'tenant'
            // to gracefully return 404 on central domains instead of crashing
            Route::middleware([
                'web',
                \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
                'tenant',
            ])
                ->prefix('hrm')
                ->name('hrm.')
                ->group($routesPath . '/web.php');

            // API routes for SaaS mode
            if (file_exists($routesPath . '/api.php')) {
                Route::middleware([
                    'api',
                    \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
                    'tenant',
                ])
                    ->prefix('api/hrm')
                    ->name('api.hrm.')
                    ->group($routesPath . '/api.php');
            }
        } else {
            // Standalone Mode: Routes with standard web middleware
            Route::middleware(['web'])
                ->prefix('hrm')
                ->name('hrm.')
                ->group($routesPath . '/web.php');

            // API routes for Standalone mode
            if (file_exists($routesPath . '/api.php')) {
                Route::middleware(['api'])
                    ->prefix('api/hrm')
                    ->name('api.hrm.')
                    ->group($routesPath . '/api.php');
            }
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
        return config('aero.mode') === 'saas';
    }
}
