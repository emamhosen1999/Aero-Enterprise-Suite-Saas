<?php

namespace Aero\Core;

use Aero\Core\Contracts\TenantScopeInterface;
use Aero\Core\Providers\ModuleRouteServiceProvider;
use Aero\Core\Services\ModuleAccessService;
use Aero\Core\Services\ModuleManager;
use Aero\Core\Services\ModuleRegistry;
use Aero\Core\Services\NavigationRegistry;
use Aero\Core\Services\RoleModuleAccessService;
use Aero\Core\Services\RuntimeLoader;
use Aero\Core\Services\StandaloneTenantScope;
use Aero\Core\Services\UserRelationshipRegistry;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

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
     */
    public function register(): void
    {
        try {
            // Override the Migrator to exclude app's migration directory
            // Core and module packages provide all necessary migrations
            $this->app->extend('migrator', function ($migrator, $app) {
                return new class($app['migration.repository'], $app['db'], $app['files'], $app['events']) extends \Illuminate\Database\Migrations\Migrator
                {
                    public function getMigrationFiles($paths)
                    {
                        // Get all migration files from all paths
                        $files = parent::getMigrationFiles($paths);

                        // Filter out files from app's database/migrations directory
                        $appMigrationPath = database_path('migrations');

                        return collect($files)->reject(function ($path, $name) use ($appMigrationPath) {
                            return str_starts_with($path, $appMigrationPath);
                        })->all();
                    }
                };
            });

            // Merge configuration
            $this->mergeConfigFrom(__DIR__.'/../config/aero.php', 'aero');
            $this->mergeConfigFrom(__DIR__.'/../config/marketplace.php', 'marketplace');
            $this->mergeConfigFrom(__DIR__.'/../config/modules.php', 'aero-core.modules');
            $this->mergeConfigFrom(__DIR__.'/../config/core.php', 'aero.core');
            $this->mergeConfigFrom(__DIR__.'/../config/permission.php', 'permission');

            // Configure auth to use Core's User model
            config(['auth.providers.users.model' => \Aero\Core\Models\User::class]);

            // Register Core Singletons
            $this->app->singleton(ModuleRegistry::class);
            $this->app->singleton(NavigationRegistry::class);
            $this->app->singleton(UserRelationshipRegistry::class);

            // Register Module Access Services (with error handling for missing tables)
            $this->app->singleton(ModuleAccessService::class, function ($app) {
                try {
                    return new ModuleAccessService;
                } catch (\Throwable $e) {
                    return new class
                    {
                        public function __call($method, $args)
                        {
                            return [];
                        }
                    };
                }
            });

            $this->app->singleton(RoleModuleAccessService::class, function ($app) {
                try {
                    return new RoleModuleAccessService;
                } catch (\Throwable $e) {
                    return new class
                    {
                        public function __call($method, $args)
                        {
                            return [];
                        }
                    };
                }
            });

            // Bind TenantScopeInterface to StandaloneTenantScope as default
            // This can be overridden by aero-platform for SaaS mode
            $this->app->singleton(TenantScopeInterface::class, StandaloneTenantScope::class);

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
     */
    public function boot(): void
    {
        // Configure Vite to use Core package's build directory
        $this->app->booted(function () {
            \Illuminate\Support\Facades\Vite::useBuildDirectory('build');
            \Illuminate\Support\Facades\Vite::useManifestFilename('manifest.json');

            // Use Laravel defaults for auth redirects and notification URLs
        });

        // Load migrations from Core package (takes priority)
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        // Load seeders from Core package
        $this->publishes([
            __DIR__.'/../database/seeders' => database_path('seeders/Aero/Core'),
        ], 'aero-seeders');

        // Publish configuration
        $this->publishes([
            __DIR__.'/../config/aero.php' => config_path('aero.php'),
        ], 'aero-config');

        $this->publishes([
            __DIR__.'/../config/marketplace.php' => config_path('marketplace.php'),
        ], 'marketplace-config');

        // Publish frontend assets
        $this->publishes([
            __DIR__.'/../resources/js' => resource_path('js'),
            __DIR__.'/../resources/css' => resource_path('css'),
            __DIR__.'/../resources/stubs/vite.config.js.stub' => base_path('vite.config.js'),
            __DIR__.'/../resources/stubs/package.json.stub' => base_path('package.json'),
            __DIR__.'/../resources/stubs/User.php.stub' => app_path('Models/User.php'),
            __DIR__.'/../resources/stubs/DatabaseSeeder.php.stub' => database_path('seeders/DatabaseSeeder.php'),
            __DIR__.'/../stubs/web.php.stub' => base_path('routes/web.php'),
            __DIR__.'/../hero.ts' => base_path('hero.ts'),
        ], 'aero-core-assets');

        $this->loadViewsFrom(__DIR__.'/../resources/views', 'aero-core');

        // Register routes
        $this->registerRoutes();

        // Register Inertia middleware - must be after routes
        $this->registerMiddleware();

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

            // Register core navigation from config/module.php
            $this->registerCoreNavigation();
        } catch (\Throwable $e) {
            // Ignore errors during early boot/package discovery
            // These will be called again when the app is fully booted
        }
    }

    /**
     * Register Core routes.
     *
     * Routing Strategy:
     * -----------------
     * In SaaS mode (aero-platform active):
     * - Core routes use InitializeTenancyIfNotCentral middleware which:
     *   1. Checks if request is on a central domain (platform, admin)
     *   2. Returns 404 on central domains (routes don't exist there)
     *   3. Initializes tenancy on tenant subdomains
     *
     * In Standalone mode:
     * - Core routes run on all domains with standard web middleware
     * - No tenancy middleware is applied
     */
    protected function registerRoutes(): void
    {
        $routesPath = __DIR__.'/../routes';

        // Check if aero-platform is active (SaaS mode)
        if ($this->isPlatformActive()) {
            // SaaS Mode: Use InitializeTenancyIfNotCentral which handles
            // the check internally and returns 404 on central domains
            Route::middleware([
                'web',
                \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
            ])->group($routesPath.'/web.php');
        } else {
            // Standalone Mode: Routes with standard web middleware
            Route::middleware(['web'])
                ->group($routesPath.'/web.php');
        }
    }

    /**
     * Register Core middleware.
     */
    protected function registerMiddleware(): void
    {
        // Use the booted callback to ensure app is fully initialized
        $this->app->booted(function () {
            $router = $this->app->make('router');

            // Register HandleInertiaRequests middleware to web middleware group
            $router->pushMiddlewareToGroup('web', \Aero\Core\Http\Middleware\HandleInertiaRequests::class);

            // Register middleware aliases
            $router->aliasMiddleware('module', \Aero\Core\Http\Middleware\CheckModuleAccess::class);
        });
    }

    /**
     * Check if aero-platform is active.
     */
    protected function isPlatformActive(): bool
    {
        return class_exists('Aero\Platform\AeroPlatformServiceProvider');
    }

    /**
     * Determine if runtime modules should be loaded.
     */
    protected function shouldLoadRuntimeModules(): bool
    {
        // Guard against early execution before config is loaded
        if (! $this->app->configurationIsCached() && ! file_exists(config_path('aero.php'))) {
            return false;
        }

        return config('aero.mode', 'saas') === 'standalone' &&
               config('aero.runtime_loading.enabled', false);
    }

    /**
     * Ensure modules directory is symlinked to public for asset access.
     */
    protected function ensureModulesSymlink(): void
    {
        $modulesPath = base_path('modules');
        $publicModulesPath = public_path('modules');

        // Only create symlink if modules directory exists and symlink doesn't
        if (file_exists($modulesPath) && ! file_exists($publicModulesPath)) {
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
                        'Aero: Cannot create symlink - function not available. '.
                        'Manually copy modules to public/modules or enable symlink support.'
                    );
                }
            } catch (\Throwable $e) {
                $this->app['log']->warning('Aero: Failed to create modules symlink', [
                    'error' => $e->getMessage(),
                    'hint' => 'You may need to manually copy the modules directory or enable symlink support',
                ]);
            }
        }
    }

    /**
     * Load runtime modules.
     */
    protected function loadRuntimeModules(): void
    {
        try {
            $loader = $this->app->make(RuntimeLoader::class);
            $modules = $loader->loadModules();

            if (count($modules) > 0) {
                $this->app['log']->info('Aero: Loaded '.count($modules).' runtime modules', [
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
     */
    protected function registerHelpers(): void
    {
        $helpersPath = __DIR__.'/helpers.php';

        if (file_exists($helpersPath)) {
            require_once $helpersPath;
        }
    }

    /**
     * Register console commands.
     */
    protected function registerCommands(): void
    {
        $this->commands([
            Console\Commands\InstallCommand::class,
            Console\Commands\SyncModuleHierarchy::class,
            Console\Commands\SeedCommand::class,
        ]);
    }

    /**
     * Register hook to automatically call Core seeders when db:seed runs.
     */
    protected function registerSeederHook(): void
    {
        // Hook into the command starting event to inject our seeders
        $this->app['events']->listen('Illuminate\Console\Events\CommandStarting', function ($event) {
            if ($event->command === 'db:seed') {
                // Get the DatabaseSeeder class from the application
                $seederClass = $event->input->getOption('class') ?: 'Database\\Seeders\\DatabaseSeeder';

                // If it's the default DatabaseSeeder and no specific class is requested,
                // we'll call our Core seeder first
                if ($seederClass === 'Database\\Seeders\\DatabaseSeeder') {
                    // Schedule Core seeder to run before the app's seeder
                    $this->app['events']->listen('Illuminate\Database\Events\SeedingDatabase', function () use ($event) {
                        static $coreSeederExecuted = false;

                        // Only execute once per db:seed command
                        if (! $coreSeederExecuted) {
                            $this->callCoreSeeder($event);
                            $coreSeederExecuted = true;
                        }
                    });
                }
            }
        });
    }

    /**
     * Call the Core database seeder.
     *
     * @param  mixed  $event  Command event
     */
    protected function callCoreSeeder($event): void
    {
        try {
            $seeder = new \Aero\Core\Database\Seeders\CoreDatabaseSeeder;
            $seeder->setContainer($this->app);
            $seeder->setCommand($event->output);
            $seeder->run();

            if ($this->app->runningInConsole()) {
                $event->output->info('Aero Core seeders executed successfully');
            }
        } catch (\Throwable $e) {
            if ($this->app->runningInConsole()) {
                $event->output->error('Failed to run Aero Core seeders: '.$e->getMessage());
                $this->app['log']->error('Aero Core Seeder Error: '.$e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            RuntimeLoader::class,
            ModuleRegistry::class,
            NavigationRegistry::class,
            UserRelationshipRegistry::class,
            ModuleAccessService::class,
            RoleModuleAccessService::class,
        ];
    }

    /**
     * Register core navigation items from config/module.php.
     * 
     * Structure: Module → Submodules → Components (3 levels, matching HRM pattern)
     * All items are included regardless of whether routes exist (for debugging).
     */
    protected function registerCoreNavigation(): void
    {
        /** @var NavigationRegistry $registry */
        $registry = $this->app->make(NavigationRegistry::class);

        // Load core module config
        $configPath = __DIR__.'/../config/module.php';
        $config = file_exists($configPath) ? require $configPath : [];

        // Build navigation from config submodules
        $submoduleNav = [];
        foreach ($config['submodules'] ?? [] as $submodule) {
            $submoduleCode = $submodule['code'] ?? '';
            
            // Skip authentication submodule from navigation (it's internal)
            if ($submoduleCode === 'authentication') {
                continue;
            }

            // Get submodule icon for fallback
            $submoduleIcon = $submodule['icon'] ?? 'FolderIcon';

            // Build component children for this submodule
            $componentNav = [];
            foreach ($submodule['components'] ?? [] as $component) {
                $componentNav[] = [
                    'name' => $component['name'] ?? ucfirst($component['code'] ?? ''),
                    'path' => $component['route'] ?? null,
                    'icon' => $component['icon'] ?? $submoduleIcon, // Inherit parent icon
                    'access' => 'core.' . $submoduleCode . '.' . ($component['code'] ?? ''),
                    'type' => $component['type'] ?? 'page',
                ];
            }

            // Create submodule navigation item with all component children
            $submoduleNav[] = [
                'name' => $submodule['name'] ?? ucfirst($submoduleCode),
                'path' => $submodule['route'] ?? null,
                'icon' => $submoduleIcon,
                'access' => 'core.' . $submoduleCode,
                'priority' => $submodule['priority'] ?? 100,
                'children' => $componentNav, // Always include children
            ];
        }

        // Sort submodules by priority
        usort($submoduleNav, fn ($a, $b) => ($a['priority'] ?? 100) <=> ($b['priority'] ?? 100));

        // Register core navigation with highest priority (1)
        // Core uses is_core=true so its children flatten to top level
        $registry->register('core', [
            [
                'name' => $config['name'] ?? 'Core',
                'icon' => $config['icon'] ?? 'CubeIcon',
                'access' => 'core',
                'priority' => $config['priority'] ?? 1,
                'children' => $submoduleNav,
            ],
        ], $config['priority'] ?? 1);
    }
}
