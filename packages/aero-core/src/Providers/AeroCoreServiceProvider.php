<?php

namespace Aero\Core\Providers;

use Aero\Core\Http\Middleware\HandleInertiaRequests;
use Aero\Core\Services\ModuleAccessService;
use Aero\Core\Services\ModuleRegistry;
use Aero\Core\Services\NavigationRegistry;
use Aero\Core\Services\RoleModuleAccessService;
use Aero\Core\Services\UserRelationshipRegistry;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Aero Core Service Provider
 *
 * Registers all Aero Core services, routes, middleware, and assets.
 * Provides auto-discovery system for modules (navigation, routes, relationships).
 */
class AeroCoreServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Merge core config
        $this->mergeConfigFrom(__DIR__.'/../../config/modules.php', 'aero-core.modules');
        $this->mergeConfigFrom(__DIR__.'/../../config/core.php', 'aero.core');
        $this->mergeConfigFrom(__DIR__.'/../../config/permission.php', 'permission');

        // Register Core Singletons
        $this->app->singleton(ModuleRegistry::class);
        $this->app->singleton(NavigationRegistry::class);
        $this->app->singleton(UserRelationshipRegistry::class);

        // Register Module Access Services (with error handling for missing tables)
        $this->app->singleton(ModuleAccessService::class, function ($app) {
            try {
                return new ModuleAccessService();
            } catch (\Throwable $e) {
                // Return a mock service if tables don't exist
                return new class {
                    public function __call($method, $args) { return []; }
                };
            }
        });
        
        $this->app->singleton(RoleModuleAccessService::class, function ($app) {
            try {
                return new RoleModuleAccessService();
            } catch (\Throwable $e) {
                // Return a mock service if tables don't exist
                return new class {
                    public function __call($method, $args) { return []; }
                };
            }
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register middleware
        $this->registerMiddleware();

        // Load migrations
        $this->loadMigrationsFrom(__DIR__.'/../../database/migrations');

        // Register routes
        $this->registerRoutes();

        // Publish assets
        $this->registerPublishing();

        // Register views
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'aero-core');

        // Register commands
        $this->registerCommands();

        // Register core navigation
        $this->registerCoreNavigation();
    }

    /**
     * Register middleware.
     */
    protected function registerMiddleware(): void
    {
        /** @var Router $router */
        $router = $this->app->make(Router::class);

        // Register middleware aliases
        $router->aliasMiddleware('aero.inertia', HandleInertiaRequests::class);

        // Push to web middleware group if Inertia is installed
        if (class_exists(\Inertia\Inertia::class)) {
            /** @var Kernel $kernel */
            $kernel = $this->app->make(Kernel::class);

            // Only add if not already added by the host app
            if (! $this->hasMiddleware($kernel, HandleInertiaRequests::class)) {
                $kernel->appendMiddlewareToGroup('web', HandleInertiaRequests::class);
            }
        }
    }

    /**
     * Check if a middleware is already registered.
     */
    protected function hasMiddleware(Kernel $kernel, string $middleware): bool
    {
        try {
            $middlewareGroups = $kernel->getMiddlewareGroups();

            return in_array($middleware, $middlewareGroups['web'] ?? []);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Register package routes.
     * 
     * Loads both web and API routes.
     * Routes use standard names (no prefix) to match frontend expectations.
     */
    protected function registerRoutes(): void
    {
        // Web routes
        Route::group([
            'middleware' => ['web'],
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../../routes/web.php');
        });

        // API routes
        Route::group([
            'middleware' => ['api'],
            'prefix' => 'api',
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../../routes/api.php');
        });
    }

    /**
     * Register package's publishable assets.
     */
    protected function registerPublishing(): void
    {
        if ($this->app->runningInConsole()) {
            // Publish migrations
            $this->publishes([
                __DIR__.'/../../database/migrations' => database_path('migrations'),
            ], 'aero-core-migrations');

            // Publish config
            $this->publishes([
                __DIR__.'/../../config/modules.php' => config_path('aero-core-modules.php'),
            ], 'aero-core-config');

            // Publish JS assets (Inertia components)
            $this->publishes([
                __DIR__.'/../../resources/js' => resource_path('js/vendor/aero-core'),
            ], 'aero-core-assets');

            // Publish views
            $this->publishes([
                __DIR__.'/../../resources/views' => resource_path('views/vendor/aero-core'),
            ], 'aero-core-views');
        }
    }

    /**
     * Register console commands.
     */
    protected function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                \Aero\Core\Console\Commands\ModuleListCommand::class,
                \Aero\Core\Console\Commands\InstallCommand::class,
            ]);
        }
    }

    /**
     * Register core navigation items.
     * Navigation is derived from config/module.php submodules for consistency.
     */
    protected function registerCoreNavigation(): void
    {
        /** @var NavigationRegistry $registry */
        $registry = $this->app->make(NavigationRegistry::class);

        // Load core module config
        $configPath = __DIR__ . '/../../config/module.php';
        $config = file_exists($configPath) ? require $configPath : [];

        // Build navigation children from config submodules
        $children = [];
        foreach ($config['submodules'] ?? [] as $submodule) {
            // Skip authentication submodule from navigation (it's not a navigable section)
            if (($submodule['code'] ?? '') === 'authentication') {
                continue;
            }

            $children[] = [
                'name' => $submodule['name'] ?? ucfirst($submodule['code'] ?? ''),
                'icon' => $submodule['icon'] ?? 'FolderIcon',
                'path' => $submodule['route'] ?? null,
                'access' => 'core.' . ($submodule['code'] ?? ''),
                'priority' => $submodule['priority'] ?? 100,
            ];
        }

        // Sort children by priority
        usort($children, fn($a, $b) => ($a['priority'] ?? 100) <=> ($b['priority'] ?? 100));

        // Register core navigation with highest priority (1)
        $registry->register('core', [
            [
                'name' => $config['name'] ?? 'Core',
                'icon' => $config['icon'] ?? 'CubeIcon',
                'access' => 'core',
                'children' => $children,
            ],
        ], $config['priority'] ?? 1);
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            ModuleRegistry::class,
            NavigationRegistry::class,
            UserRelationshipRegistry::class,
            ModuleAccessService::class,
            RoleModuleAccessService::class,
        ];
    }
}
