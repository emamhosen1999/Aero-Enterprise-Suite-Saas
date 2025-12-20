<?php

namespace Aero\Rfi;

use Aero\Rfi\Providers\RfiModuleProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * AeroRfiServiceProvider
 *
 * Main service provider for the RFI package.
 * Registers the module service provider which handles navigation, policies, etc.
 */
class AeroRfiServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register the RFI module service provider
        $this->app->register(RfiModuleProvider::class);

        // Register module configuration
        $this->mergeConfigFrom(
            __DIR__.'/../config/rfi.php',
            'rfi'
        );

        // Register module definitions
        $this->mergeConfigFrom(
            __DIR__.'/../config/module.php',
            'modules.rfi'
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        // Load views (if any)
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'rfi');

        // Register routes
        $this->registerRoutes();

        // Publish configuration
        $this->publishes([
            __DIR__.'/../config/rfi.php' => config_path('rfi.php'),
        ], 'aero-rfi-config');

        // Publish compiled module library (ES module for runtime loading)
        $moduleLibrary = __DIR__.'/../dist';
        if (is_dir($moduleLibrary)) {
            $this->publishes([
                $moduleLibrary => public_path('modules/aero-rfi'),
            ], 'aero-rfi-assets');
        }
    }

    /**
     * Register module routes.
     *
     * Route Architecture:
     * -------------------
     * aero-rfi has exactly 1 route file: web.php
     * Contains all RFI routes under /rfi prefix with rfi.* naming.
     *
     * Domain-based routing:
     * - In SaaS mode: Routes ONLY on tenant domains (tenant.domain.com/rfi/*)
     * - In Standalone mode: Routes on main domain (domain.com/rfi/*)
     */
    protected function registerRoutes(): void
    {
        $routesPath = __DIR__.'/../routes';

        // Check if aero-platform is active (SaaS mode)
        if ($this->isPlatformActive()) {
            // SaaS Mode: InitializeTenancyIfNotCentral initializes tenant context,
            // 'tenant' middleware ensures valid tenant context exists
            Route::middleware([
                'web',
                \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
                'tenant',
            ])
                ->prefix('rfi')
                ->name('rfi.')
                ->group($routesPath.'/web.php');
        } else {
            // Standalone Mode: Routes with standard web middleware on domain.com
            Route::middleware(['web'])
                ->prefix('rfi')
                ->name('rfi.')
                ->group($routesPath.'/web.php');
        }
    }

    /**
     * Check if aero-platform is active.
     */
    protected function isPlatformActive(): bool
    {
        return class_exists(\Aero\Platform\AeroPlatformServiceProvider::class);
    }
}
