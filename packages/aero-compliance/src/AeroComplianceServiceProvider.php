<?php

namespace Aero\Compliance;

use Aero\Compliance\Providers\ComplianceModuleProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * AeroComplianceServiceProvider
 *
 * Main service provider for the Compliance package.
 * Registers migrations, module provider, and routes.
 */
class AeroComplianceServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register the Compliance module service provider
        $this->app->register(ComplianceModuleProvider::class);

        // Register module configuration
        $this->mergeConfigFrom(
            __DIR__.'/../config/module.php',
            'modules.compliance'
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
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'compliance');

        // Register routes
        $this->registerRoutes();

        // Register dashboards
        $this->registerDashboards();

        // Register dashboard widgets
        $this->registerDashboardWidgets();

        // Publish configuration
        $this->publishes([
            __DIR__.'/../config/module.php' => config_path('modules/compliance.php'),
        ], 'compliance-config');

        // Publish migrations
        $this->publishes([
            __DIR__.'/../database/migrations' => database_path('migrations'),
        ], 'compliance-migrations');
    }

    /**
     * Register routes.
     */
    protected function registerRoutes(): void
    {
        // API routes
        if (file_exists(__DIR__.'/../routes/api.php')) {
            Route::middleware(['api'])
                ->prefix('api/compliance')
                ->name('api.compliance.')
                ->group(__DIR__.'/../routes/api.php');
        }

        // Web routes (tenant-scoped)
        if (file_exists(__DIR__.'/../routes/tenant.php')) {
            Route::middleware(['web'])
                ->prefix('compliance')
                ->name('compliance.')
                ->group(__DIR__.'/../routes/tenant.php');
        }

        // Admin routes (landlord)
        if (file_exists(__DIR__.'/../routes/admin.php')) {
            Route::middleware(['web'])
                ->prefix('admin/compliance')
                ->name('admin.compliance.')
                ->group(__DIR__.'/../routes/admin.php');
        }
    }

    /**
     * Register Compliance dashboards with DashboardRegistry.
     */
    protected function registerDashboards(): void
    {
        if (! $this->app->bound(\Aero\Core\Services\DashboardRegistry::class)) {
            return;
        }

        $registry = $this->app->make(\Aero\Core\Services\DashboardRegistry::class);

        $registry->register(
            'compliance.dashboard',
            'Compliance Dashboard',
            'compliance',
            'Regulatory compliance and HSE tracking',
            'ShieldCheckIcon',
            'compliance.dashboard.view'
        );
    }

    /**
     * Register dashboard widgets for Core Dashboard.
     */
    protected function registerDashboardWidgets(): void
    {
        if (! $this->app->bound(\Aero\Core\Services\DashboardWidgetRegistry::class)) {
            return;
        }

        $registry = $this->app->make(\Aero\Core\Services\DashboardWidgetRegistry::class);

        $registry->registerMany([
            new \Aero\Compliance\Widgets\PendingComplianceActionsWidget,
            new \Aero\Compliance\Widgets\ComplianceScoreWidget,
            new \Aero\Compliance\Widgets\UpcomingComplianceAuditsWidget,
        ]);
    }
}
