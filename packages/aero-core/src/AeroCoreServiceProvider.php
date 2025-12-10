<?php

namespace Aero\Core;

use Illuminate\Support\ServiceProvider;
use Aero\Core\Services\RuntimeLoader;
use Aero\Core\Providers\ModuleRouteServiceProvider;

/**
 * AeroCoreServiceProvider
 * 
 * Main service provider for the Aero Core package.
 * Handles initialization, configuration, and service registration.
 */
class AeroCoreServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register(): void
    {
        // Merge configuration
        $this->mergeConfigFrom(
            __DIR__ . '/../config/aero.php',
            'aero'
        );

        // Register RuntimeLoader as singleton
        $this->app->singleton(RuntimeLoader::class, function ($app) {
            $modulesPath = config('aero.runtime_loading.modules_path', base_path('modules'));
            return new RuntimeLoader($modulesPath);
        });

        // Register ModuleRouteServiceProvider
        $this->app->register(ModuleRouteServiceProvider::class);

        // Register helper functions
        $this->registerHelpers();
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot(): void
    {
        // Publish configuration
        $this->publishes([
            __DIR__ . '/../config/aero.php' => config_path('aero.php'),
        ], 'aero-config');

        // Load runtime modules in standalone mode
        if ($this->shouldLoadRuntimeModules()) {
            $this->loadRuntimeModules();
        }

        // Register console commands
        if ($this->app->runningInConsole()) {
            $this->registerCommands();
        }
    }

    /**
     * Determine if runtime modules should be loaded.
     *
     * @return bool
     */
    protected function shouldLoadRuntimeModules(): bool
    {
        return config('aero.mode') === 'standalone' &&
               config('aero.runtime_loading.enabled', true);
    }

    /**
     * Load runtime modules.
     *
     * @return void
     */
    protected function loadRuntimeModules(): void
    {
        try {
            $loader = $this->app->make(RuntimeLoader::class);
            $modules = $loader->loadModules();

            if (count($modules) > 0) {
                $this->app['log']->info('Aero: Loaded ' . count($modules) . ' runtime modules', [
                    'modules' => array_keys($modules),
                ]);
            }
        } catch (\Throwable $e) {
            $this->app['log']->error('Aero: Failed to load runtime modules', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Register helper functions.
     *
     * @return void
     */
    protected function registerHelpers(): void
    {
        $helpersPath = __DIR__ . '/helpers.php';
        
        if (file_exists($helpersPath)) {
            require_once $helpersPath;
        }
    }

    /**
     * Register console commands.
     *
     * @return void
     */
    protected function registerCommands(): void
    {
        // Commands will be registered here when created
        // $this->commands([
        //     Commands\ModuleInstallCommand::class,
        //     Commands\ModuleBuildCommand::class,
        // ]);
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides(): array
    {
        return [
            RuntimeLoader::class,
        ];
    }
}
