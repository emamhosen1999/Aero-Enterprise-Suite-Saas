<?php

declare(strict_types=1);

namespace Aero\Cms\Providers;

use Illuminate\Support\ServiceProvider;

class CmsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register migrations
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');

        // Register routes
        $this->registerRoutes();
    }

    /**
     * Register CMS routes.
     */
    protected function registerRoutes(): void
    {
        // Public CMS routes (wrapped in web middleware group)
        if (!$this->app->routesAreCached()) {
            \Illuminate\Support\Facades\Route::middleware('web')
                ->group(__DIR__.'/../../routes/public.php');
        }
    }
}
