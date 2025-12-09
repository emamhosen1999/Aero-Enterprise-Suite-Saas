<?php

namespace Aero\Core\Providers;

use Aero\Core\Http\Middleware\CoreInertiaMiddleware;
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
        $router->aliasMiddleware('aero.inertia', CoreInertiaMiddleware::class);

        // Push to web middleware group if Inertia is installed
        if (class_exists(\Inertia\Inertia::class)) {
            /** @var Kernel $kernel */
            $kernel = $this->app->make(Kernel::class);

            // Only add if not already added by the host app
            if (! $this->hasMiddleware($kernel, CoreInertiaMiddleware::class)) {
                $kernel->appendMiddlewareToGroup('web', CoreInertiaMiddleware::class);
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
     */
    protected function registerRoutes(): void
    {
        // Auth routes WITHOUT prefix (login, logout must be standard Laravel routes)
        Route::group([
            'middleware' => ['web'],
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../../routes/auth.php');
        });

        // Web routes with core. prefix
        Route::group([
            'middleware' => ['web'],
            'prefix' => config('aero.core.route_prefix', ''),
            'as' => 'core.',
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../../routes/web.php');
        });

        // API routes
        Route::group([
            'middleware' => ['api'],
            'prefix' => 'api/core',
            'as' => 'api.core.',
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
     */
    protected function registerCoreNavigation(): void
    {
        /** @var NavigationRegistry $registry */
        $registry = $this->app->make(NavigationRegistry::class);

        // Core navigation items with highest priority (10)
        $registry->register('core', [
            [
                'title' => 'Dashboard',
                'icon' => 'HomeIcon',
                'route' => 'core.dashboard',
                'permission' => null, // Everyone can see dashboard
                'order' => 1,
            ],
            [
                'title' => 'User Management',
                'icon' => 'UsersIcon',
                'route' => null,
                'permission' => 'users.view',
                'order' => 90,
                'children' => [
                    [
                        'title' => 'Users',
                        'icon' => 'UserIcon',
                        'route' => 'core.users.index',
                        'permission' => 'users.view',
                    ],
                    [
                        'title' => 'Roles',
                        'icon' => 'ShieldCheckIcon',
                        'route' => 'core.roles.index',
                        'permission' => 'roles.view',
                    ],
                ],
            ],
            [
                'title' => 'Settings',
                'icon' => 'CogIcon',
                'route' => 'core.settings.index',
                'permission' => 'settings.view',
                'order' => 100,
            ],
        ], 10); // Priority 10 = Core items appear first
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
