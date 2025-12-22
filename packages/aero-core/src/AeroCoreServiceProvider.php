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

        // NOTE: No assets publishing - all frontend is handled by aero/ui package

        // Publish stubs for new installations (optional)
        $this->publishes([
            __DIR__.'/../resources/stubs/User.php.stub' => app_path('Models/User.php'),
            __DIR__.'/../resources/stubs/DatabaseSeeder.php.stub' => database_path('seeders/DatabaseSeeder.php'),
            __DIR__.'/../stubs/web.php.stub' => base_path('routes/web.php'),
        ], 'aero-core-stubs');

        $this->loadViewsFrom(__DIR__.'/../resources/views', 'aero-core');

        // Register routes
        $this->registerRoutes();

        // Register Inertia middleware - must be after routes
        $this->registerMiddleware();

        // Register exception handler for unified error reporting
        $this->registerExceptionHandler();

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
     * Route Architecture:
     * -------------------
     * aero-core has exactly 1 route file: web.php
     * Contains all routes including:
     * - Authentication (login, logout)
     * - Dashboard, User Management, Roles
     * - Settings, Profile
     * - API endpoints (under /api prefix within the file)
     *
     * Domain-based routing:
     * - In SaaS mode: Routes ONLY on tenant domains (tenant.domain.com)
     * - In Standalone mode: Routes on all domains (domain.com)
     * - Public API routes (/api/version/check, /api/error-log) on ALL domains
     */
    protected function registerRoutes(): void
    {
        $routesPath = __DIR__.'/../routes';

        // Always register public API routes on all domains (version check, error logging)
        $this->registerPublicApiRoutes();

        // Check if aero-platform is active (SaaS mode)
        if ($this->isPlatformActive()) {
            // SaaS Mode: Core routes ONLY on tenant domains (NOT on central/admin domains)
            // AUTO-DETECT from browser request - no .env configuration needed

            if (! request()) {
                // In console, load routes without domain restriction
                Route::middleware(['web'])->group($routesPath.'/web.php');

                return;
            }

            $currentHost = request()->getHost();

            // Check if we're on a central domain (auto-detected)
            $isCentralDomain = $this->isOnCentralDomain($currentHost);

            if (! $isCentralDomain) {
                // ONLY load core routes on tenant subdomains
                // InitializeTenancyIfNotCentral initializes tenant, 'tenant' ensures context exists
                Route::middleware([
                    'web',
                    \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
                    'tenant',
                ])->group($routesPath.'/web.php');
            }
            // On central domains: do NOT register core routes (platform owns those)
        } else {
            // Standalone Mode: Routes with standard web middleware on domain.com
            Route::middleware(['web'])
                ->group($routesPath.'/web.php');
        }
    }

    /**
     * Register public API routes that should be available on ALL domains.
     * These are domain-agnostic routes for version checking and error logging.
     */
    protected function registerPublicApiRoutes(): void
    {
        $reporter = \Aero\Core\Services\PlatformErrorReporter::class;

        // Version check API - available on all domains
        Route::post('/api/version/check', function (\Illuminate\Http\Request $request) {
            $clientVersion = $request->input('version', '1.0.0');
            $serverVersion = config('app.version', '1.0.0');

            return response()->json([
                'version_match' => $clientVersion === $serverVersion,
                'client_version' => $clientVersion,
                'server_version' => $serverVersion,
                'timestamp' => now()->toIso8601String(),
            ]);
        })->name('api.version.check')->middleware(['web', 'throttle:30,1']);

        // Error logging API - available on all domains
        Route::post('/api/error-log', function (\Illuminate\Http\Request $request) use ($reporter) {
            $reporterInstance = app($reporter);
            $traceId = $reporterInstance->reportFrontendError($request->all());

            return response()->json([
                'success' => true,
                'trace_id' => $traceId,
                'message' => 'Error reported successfully',
            ]);
        })->name('api.error-log')->middleware(['web', 'throttle:30,1']);

        // Health check API - available on all domains
        Route::get('/aero-core/health', function () {
            return response()->json([
                'status' => 'ok',
                'package' => 'aero/core',
                'version' => '1.0.0',
                'timestamp' => now()->toIso8601String(),
            ]);
        })->name('api.core.health')->middleware(['web']);
    }

    /**
     * Check if current domain is a central domain.
     * AUTO-DETECTS from browser request - no configuration needed.
     *
     * Logic:
     * - admin.domain.com → Central (admin subdomain)
     * - domain.com → Central (root domain)
     * - tenant.domain.com → Tenant (has subdomain that's not 'admin')
     */
    protected function isOnCentralDomain(string $host): bool
    {
        $hostWithoutPort = preg_replace('/:\d+$/', '', $host);

        // Check for admin subdomain (always central)
        if (str_starts_with($hostWithoutPort, 'admin.')) {
            return true;
        }

        // Check for localhost/127.0.0.1 (always central for local dev)
        if (in_array($hostWithoutPort, ['localhost', '127.0.0.1'], true)) {
            return true;
        }

        // Count dots to determine if it's a subdomain
        $parts = explode('.', $hostWithoutPort);
        $dotCount = count($parts) - 1;

        // For .test, .local, .localhost TLDs:
        // - 1 dot (domain.test) → Central (root domain)
        // - 2+ dots (tenant.domain.test) → Tenant (subdomain)
        if (preg_match('/\.(test|local|localhost)$/i', $hostWithoutPort)) {
            return $dotCount === 1; // Only 1 dot means root domain = central
        }

        // For production domains (e.g., .com, .net, .org):
        // - 1 dot (domain.com) → Central (root domain)
        // - 2+ dots (tenant.domain.com) → Tenant (subdomain)
        return $dotCount === 1; // Only 1 dot means root domain = central
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

            // Register 'tenant' middleware alias for tenant-only routes
            // This ensures requests have a valid tenant context (used after InitializeTenancyIfNotCentral)
            $router->aliasMiddleware('tenant', \Aero\Core\Http\Middleware\EnsureTenantContext::class);
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
     * Structure: Module → Submodules → Components
     * - Submodules become top-level menu items (flattened by NavigationRegistry)
     * - If submodule has only ONE component, that component becomes the menu item directly
     * - If submodule has multiple components, they become submenu items
     * - Icons are inherited from parent if not specified
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
            $components = $submodule['components'] ?? [];

            // If submodule has only ONE component, use it directly as the menu item
            if (count($components) === 1) {
                $component = $components[0];
                $submoduleNav[] = [
                    'name' => $submodule['name'] ?? ucfirst($submoduleCode),
                    'path' => $component['route'] ?? $submodule['route'] ?? null,
                    'icon' => $component['icon'] ?? $submoduleIcon,
                    'access' => 'core.'.$submoduleCode.'.'.($component['code'] ?? ''),
                    'priority' => $submodule['priority'] ?? 100,
                    'type' => $component['type'] ?? 'page',
                    // No children - single component becomes the page
                ];
            } else {
                // Multiple components - build children submenu
                $componentNav = [];
                foreach ($components as $component) {
                    $componentNav[] = [
                        'name' => $component['name'] ?? ucfirst($component['code'] ?? ''),
                        'path' => $component['route'] ?? null,
                        'icon' => $component['icon'] ?? $submoduleIcon, // Inherit parent icon
                        'access' => 'core.'.$submoduleCode.'.'.($component['code'] ?? ''),
                        'type' => $component['type'] ?? 'page',
                    ];
                }

                // Create submodule navigation item with component children
                $submoduleNav[] = [
                    'name' => $submodule['name'] ?? ucfirst($submoduleCode),
                    'path' => $submodule['route'] ?? null,
                    'icon' => $submoduleIcon,
                    'access' => 'core.'.$submoduleCode,
                    'priority' => $submodule['priority'] ?? 100,
                    'children' => $componentNav, // Include children for submenu
                ];
            }
        }

        // Sort submodules by priority
        usort($submoduleNav, fn ($a, $b) => ($a['priority'] ?? 100) <=> ($b['priority'] ?? 100));

        // Register core navigation with highest priority (1)
        // Core uses is_core=true so its children flatten to top level
        // Scope: 'tenant' - Core navigation is for tenant users
        $registry->register('core', [
            [
                'name' => $config['name'] ?? 'Core',
                'icon' => $config['icon'] ?? 'CubeIcon',
                'access' => 'core',
                'priority' => $config['priority'] ?? 1,
                'children' => $submoduleNav,
            ],
        ], $config['priority'] ?? 1, 'tenant');
    }

    /**
     * Register unified exception handler for error reporting to platform
     */
    protected function registerExceptionHandler(): void
    {
        $this->app->singleton(\Aero\Core\Services\PlatformErrorReporter::class);

        // Use Laravel 11's exception handler registration
        if (method_exists($this->app, 'terminating')) {
            // Register a reportable callback for all exceptions
            // This captures backend errors and reports them to the platform
            $this->app->singleton(
                \Illuminate\Contracts\Debug\ExceptionHandler::class,
                \Aero\Core\Exceptions\Handler::class
            );
        }
    }
}
