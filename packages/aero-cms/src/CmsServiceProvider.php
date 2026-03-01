<?php

declare(strict_types=1);

namespace Aero\Cms;

use Aero\Cms\Blocks\BlockRegistry;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class CmsServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/cms.php', 'cms');
        $this->mergeConfigFrom(__DIR__.'/../config/module.php', 'aero-cms-module');
        $this->mergeConfigFrom(__DIR__.'/../config/blocks.php', 'cms-blocks');

        // Register BlockRegistry as singleton
        $this->app->singleton(BlockRegistry::class, function ($app) {
            $registry = new BlockRegistry;
            $registry->registerFromConfig();

            return $registry;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        $this->registerRoutes();
        $this->registerPublishing();
    }

    /**
     * Register the package routes.
     */
    protected function registerRoutes(): void
    {
        // Platform admin routes (landlord scope)
        // Accessible at admin.domain.com/cms (e.g., admin.aeos365.test/cms)
        // Uses 'admin.domain' middleware to ensure only accessible from admin subdomain
        Route::middleware(['web', 'auth:landlord', 'admin.domain'])
            ->prefix('cms')
            ->name('admin.cms.')
            ->group(__DIR__.'/../routes/admin.php');

        // Public CMS page rendering routes
        // IMPORTANT: Uses 'platform.domain' middleware to only serve pages on the
        // platform domain (e.g., aeos365.test), NOT on tenant subdomains or admin domain.
        // This catch-all route is registered LAST to allow functional routes to take priority.
        Route::middleware(['web', 'platform.domain'])
            ->group(__DIR__.'/../routes/web.php');

        // API routes for page builder
        Route::middleware(['web', 'auth:landlord', 'admin.domain'])
            ->prefix('api/cms')
            ->name('api.admin.cms.')
            ->group(__DIR__.'/../routes/api.php');
    }

    /**
     * Register the package's publishable resources.
     */
    protected function registerPublishing(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/cms.php' => config_path('cms.php'),
            ], 'cms-config');

            $this->publishes([
                __DIR__.'/../database/migrations' => database_path('migrations'),
            ], 'cms-migrations');
        }
    }
}
