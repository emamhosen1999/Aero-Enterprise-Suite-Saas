<?php

declare(strict_types=1);

namespace Aero\Cms;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class CmsServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/cms.php', 'cms');
        $this->mergeConfigFrom(__DIR__ . '/../config/module.php', 'aero-cms-module');
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        $this->registerRoutes();
        $this->registerPublishing();
    }

    /**
     * Register the package routes.
     */
    protected function registerRoutes(): void
    {
        // Platform admin routes (landlord scope)
        Route::middleware(['web', 'auth:landlord', 'admin'])
            ->prefix('admin/cms')
            ->name('admin.cms.')
            ->group(__DIR__ . '/../routes/admin.php');

        // Public CMS page rendering routes
        Route::middleware(['web'])
            ->group(__DIR__ . '/../routes/web.php');

        // API routes for page builder
        Route::middleware(['web', 'auth:landlord', 'admin'])
            ->prefix('api/admin/cms')
            ->name('api.admin.cms.')
            ->group(__DIR__ . '/../routes/api.php');
    }

    /**
     * Register the package's publishable resources.
     */
    protected function registerPublishing(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../config/cms.php' => config_path('cms.php'),
            ], 'cms-config');

            $this->publishes([
                __DIR__ . '/../database/migrations' => database_path('migrations'),
            ], 'cms-migrations');
        }
    }
}
