<?php

namespace Aero\HRM\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Gate;

class HRMServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register main HRM service
        $this->app->singleton('hrm', function ($app) {
            return new \Aero\HRM\Services\HRMetricsAggregatorService();
        });

        // Register specific services
        $this->app->singleton('hrm.leave', function ($app) {
            return new \Aero\HRM\Services\LeaveBalanceService();
        });

        $this->app->singleton('hrm.attendance', function ($app) {
            return new \Aero\HRM\Services\AttendanceCalculationService();
        });

        $this->app->singleton('hrm.payroll', function ($app) {
            return new \Aero\HRM\Services\PayrollCalculationService();
        });

        // Merge configuration
        $this->mergeConfigFrom(
            __DIR__.'/../../config/hrm.php', 'hrm'
        );
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

        // Register views (if using Blade)
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'hrm');

        // Publish configuration
        $this->publishes([
            __DIR__.'/../../config/hrm.php' => config_path('hrm.php'),
        ], 'hrm-config');

        // Publish frontend assets
        $this->publishes([
            __DIR__.'/../../resources/js' => resource_path('js/Modules/HRM'),
        ], 'hrm-assets');

        // Publish migrations (optional - for customization)
        $this->publishes([
            __DIR__.'/../../database/migrations' => database_path('migrations'),
        ], 'hrm-migrations');

        // Register policies
        $this->registerPolicies();

        // Register events
        $this->registerEvents();
    }

    /**
     * Register routes.
     */
    protected function registerRoutes(): void
    {
        // Web routes
        Route::middleware(['web', 'auth', 'tenant.setup'])
            ->prefix('hrm')
            ->name('hrm.')
            ->group(__DIR__.'/../routes/web.php');

        // API routes
        if (file_exists(__DIR__.'/../routes/api.php')) {
            Route::middleware(['api', 'auth:sanctum', 'tenant.setup'])
                ->prefix('api/hrm')
                ->name('api.hrm.')
                ->group(__DIR__.'/../routes/api.php');
        }
    }

    /**
     * Register policies.
     */
    protected function registerPolicies(): void
    {
        // Register model policies if they exist
        $policies = [
            \Aero\HRM\Models\Employee::class => \Aero\HRM\Policies\EmployeePolicy::class,
            \Aero\HRM\Models\Leave::class => \Aero\HRM\Policies\LeavePolicy::class,
            \Aero\HRM\Models\Attendance::class => \Aero\HRM\Policies\AttendancePolicy::class,
        ];

        foreach ($policies as $model => $policy) {
            if (class_exists($policy)) {
                Gate::policy($model, $policy);
            }
        }
    }

    /**
     * Register events and listeners.
     */
    protected function registerEvents(): void
    {
        // Register event listeners if they exist
        $events = __DIR__.'/../Events';
        $listeners = __DIR__.'/../Listeners';

        if (is_dir($events) && is_dir($listeners)) {
            // Auto-discover events and listeners
            // Laravel will handle this if following conventions
        }
    }
}