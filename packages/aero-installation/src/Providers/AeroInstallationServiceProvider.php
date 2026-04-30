<?php

namespace Aero\Installation\Providers;

use Aero\Installation\Http\Middleware\HandleInertiaRequests;
use Illuminate\Support\ServiceProvider;

class AeroInstallationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../../config/installation.php',
            'installation'
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../../routes/installation.php');

        // Register Inertia middleware
        $router = $this->app['router'];
        $router->aliasMiddleware('inertia.installation', HandleInertiaRequests::class);

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../../config/installation.php' => config_path('installation.php'),
            ], 'aero-installation-config');
        }
    }
}
