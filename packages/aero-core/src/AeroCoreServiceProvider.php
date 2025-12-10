<?php

namespace Aero\Core;

use Illuminate\Support\ServiceProvider;
use Aero\Core\Services\RuntimeLoader;
use Aero\Core\Services\ModuleManager;
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
        try {
            // Merge configuration
            $this->mergeConfigFrom(
                __DIR__ . '/../config/aero.php',
                'aero'
            );

            // Register RuntimeLoader as singleton (lazy-loaded)
            $this->app->singleton(RuntimeLoader::class, function ($app) {
                try {
                    $modulesPath = config('aero.runtime_loading.modules_path', base_path('modules'));
                } catch (\Throwable $e) {
                    $modulesPath = base_path('modules');
                }
                return new RuntimeLoader($modulesPath);
            });

            // Register ModuleManager as singleton (lazy-loaded)
            $this->app->singleton('aero.module', function ($app) {
                // Support monorepo structure where packages are in parent directory
                $packagesPath = base_path('packages');
                if (! file_exists($packagesPath)) {
                    // Try monorepo structure: apps/standalone-host -> ../../packages
                    $packagesPath = base_path('../../packages');
                }
                
                return new ModuleManager(
                    base_path('modules'), // Runtime modules (optional)
                    $packagesPath // Composer packages
                );
            });

            // Register ModuleRouteServiceProvider
            $this->app->register(ModuleRouteServiceProvider::class);

            // Register helper functions
            $this->registerHelpers();
        } catch (\Throwable $e) {
            // Silently fail during package discovery
            // Services will be registered when app fully boots
        }
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

        $this->loadViewsFrom(__DIR__.'/../resources/views', 'aero-core');

        // Guard against early boot before app is fully initialized
        try {
            // Auto-create modules symlink for Standalone mode
            $this->ensureModulesSymlink();

            // Load runtime modules in standalone mode
            if ($this->shouldLoadRuntimeModules()) {
                $this->loadRuntimeModules();
            }

            // Register console commands
            if ($this->app->runningInConsole()) {
                $this->registerCommands();
            }
        } catch (\Throwable $e) {
            // Ignore errors during early boot/package discovery
            // These will be called again when the app is fully booted
        }
    }

    /**
     * Determine if runtime modules should be loaded.
     *
     * @return bool
     */
    protected function shouldLoadRuntimeModules(): bool
    {
        // Guard against early execution before config is loaded
        if (!$this->app->configurationIsCached() && !file_exists(config_path('aero.php'))) {
            return false;
        }
        
        return config('aero.mode', 'saas') === 'standalone' &&
               config('aero.runtime_loading.enabled', false);
    }

    /**
     * Ensure modules directory is symlinked to public for asset access.
     *
     * @return void
     */
    protected function ensureModulesSymlink(): void
    {
        $modulesPath = base_path('modules');
        $publicModulesPath = public_path('modules');

        // Only create symlink if modules directory exists and symlink doesn't
        if (file_exists($modulesPath) && !file_exists($publicModulesPath)) {
            try {
                // Try to create symlink
                if (function_exists('symlink')) {
                    @symlink($modulesPath, $publicModulesPath);
                    
                    if (file_exists($publicModulesPath)) {
                        $this->app['log']->info('Aero: Created modules symlink successfully');
                    }
                } else {
                    // Symlinks not available, log warning
                    $this->app['log']->warning(
                        'Aero: Cannot create symlink - function not available. ' .
                        'Manually copy modules to public/modules or enable symlink support.'
                    );
                }
            } catch (\Throwable $e) {
                $this->app['log']->warning('Aero: Failed to create modules symlink', [
                    'error' => $e->getMessage(),
                    'hint' => 'You may need to manually copy the modules directory or enable symlink support'
                ]);
            }
        }
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
        $this->commands([
            Console\Commands\SyncModuleHierarchy::class,
        ]);
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
