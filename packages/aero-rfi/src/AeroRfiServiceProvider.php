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

        // Load views (if any - for email templates, PDFs, etc.)
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'rfi');

        // Register routes
        $this->registerRoutes();

        // Register dashboard widgets for Core Dashboard
        $this->registerDashboardWidgets();

        // Publish configuration
        $this->publishes([
            __DIR__.'/../config/rfi.php' => config_path('rfi.php'),
        ], 'aero-rfi-config');

        // NOTE: Frontend is handled by aero/ui package
        // This package is backend-only (controllers, models, services)
    }

    /**
     * Register RFI widgets for the Core Dashboard.
     *
     * These are ACTION/ALERT/SUMMARY widgets only.
     * Full analytics stay on RFI Dashboard (/rfi/dashboard).
     */
    protected function registerDashboardWidgets(): void
    {
        // Only register if the registry is available
        if (!$this->app->bound(\Aero\Core\Services\DashboardWidgetRegistry::class)) {
            return;
        }

        $registry = $this->app->make(\Aero\Core\Services\DashboardWidgetRegistry::class);

        // Register RFI widgets for Core Dashboard
        $registry->registerMany([
            new \Aero\Rfi\Widgets\MyRfiStatusWidget(),
            new \Aero\Rfi\Widgets\PendingInspectionsWidget(),
            new \Aero\Rfi\Widgets\OverdueRfisWidget(),
        ]);
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
        // Use global helper function for consistency
        if (function_exists('is_saas_mode') && is_saas_mode()) {
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

        // ========================================================================
        // PATENTABLE CORE IP - API Routes for GPS & Layer Continuity Validation
        // ========================================================================
        $this->registerApiRoutes();
    }

    /**
     * Register API routes for patentable features.
     *
     * These routes provide:
     * - GPS validation for anti-fraud location verification
     * - Layer continuity validation for construction sequence enforcement
     * - AI-powered work location suggestions
     */
    protected function registerApiRoutes(): void
    {
        $apiRoutesPath = __DIR__.'/../routes/api.php';

        if (!file_exists($apiRoutesPath)) {
            return;
        }

        // API routes use sanctum auth and work in both SaaS and Standalone modes
        if (function_exists('is_saas_mode') && is_saas_mode()) {
            // SaaS Mode: Include tenancy middleware
            Route::middleware([
                'api',
                \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
                'tenant',
            ])->group($apiRoutesPath);
        } else {
            // Standalone Mode: Standard API middleware
            Route::middleware(['api'])
                ->group($apiRoutesPath);
        }
    }

    /**
     * Check if aero-platform is active.
     *
     * @deprecated Use global isPlatformActive() or is_saas_mode() helper instead
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
     */
    protected function isSaaSMode(): bool
    {
        if (function_exists('is_saas_mode')) {
            return is_saas_mode();
        }

        return is_saas_mode();
    }
}
