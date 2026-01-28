<?php

namespace Aero\RealEstate\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class RealEstateServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/real-estate.php', 'real-estate');
    }

    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
        $this->loadRoutesFrom(__DIR__ . '/../../routes/web.php');
        
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../config/real-estate.php' => config_path('real-estate.php'),
            ], 'real-estate-config');

            $this->publishes([
                __DIR__ . '/../../database/migrations' => database_path('migrations'),
            ], 'real-estate-migrations');
        }
    }
}