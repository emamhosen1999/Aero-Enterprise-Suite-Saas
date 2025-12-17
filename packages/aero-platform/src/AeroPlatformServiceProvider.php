<?php

namespace Aero\Platform;

use Aero\Core\Contracts\TenantScopeInterface;
use Aero\Core\Services\NavigationRegistry;
use Aero\Platform\Listeners\TenantCreatedListener;
use Aero\Platform\Models\LandlordUser;
use Aero\Platform\Services\Billing\SslCommerzService;
use Aero\Platform\Services\ModuleAccessService;
use Aero\Platform\Services\Monitoring\Tenant\ErrorLogService;
use Aero\Platform\Services\PlatformSettingService;
use Aero\Platform\Services\RoleModuleAccessService;
use Aero\Platform\Services\SaaSTenantScope;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;
use Stancl\Tenancy\Events\TenantCreated;

/**
 * Aero Platform Service Provider
 *
 * Registers all Aero Platform services, routes, middleware, and assets.
 * This package provides multi-tenancy orchestration, landlord authentication,
 * billing/subscriptions, and platform administration.
 *
 * All configuration is handled programmatically - the host app remains clean.
 */
class AeroPlatformServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register the TenancyBootstrapServiceProvider FIRST
        // CRITICAL: This registers event listeners for TenancyInitialized which
        // runs the DatabaseTenancyBootstrapper to switch DB connections
        $this->app->register(\Aero\Platform\Providers\TenancyBootstrapServiceProvider::class);

        // Disable Fortify's default routes - we define auth routes with proper domain restrictions
        // Admin subdomain uses Platform's AuthenticatedSessionController
        // Tenant subdomains use Core's AuthenticatedSessionController
        Fortify::ignoreRoutes();

        // Set aero.mode to 'saas' - Platform is the SaaS orchestrator
        // This MUST be set before any module checks for mode
        Config::set('aero.mode', 'saas');

        // Override Core's migrator to ONLY use platform migrations on landlord database
        // Core, HRM, CRM and other module migrations are for TENANT databases only
        $this->overrideMigratorForLandlord();

        // Merge platform configs
        $this->mergeConfigFrom(__DIR__.'/../config/modules.php', 'aero-platform.modules');
        $this->mergeConfigFrom(__DIR__.'/../config/tenancy.php', 'tenancy');
        $this->mergeConfigFrom(__DIR__.'/../config/platform.php', 'platform');

        // Override TenantScopeInterface binding (Core binds StandaloneTenantScope by default)
        // Platform provides the SaaS implementation using stancl/tenancy
        $this->app->singleton(TenantScopeInterface::class, SaaSTenantScope::class);

        // Register services as singletons
        $this->app->singleton(ModuleAccessService::class);
        $this->app->singleton(RoleModuleAccessService::class);
        $this->app->singleton(PlatformSettingService::class);
        $this->app->singleton(ErrorLogService::class);
        $this->app->singleton(SslCommerzService::class);

        // Configure auth guards and providers programmatically
        $this->configureAuth();

        // Configure database connections programmatically
        $this->configureDatabase();

        // Register event listeners for tenant lifecycle
        $this->registerEventListeners();
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Override tenancy bootstrappers after all providers registered
        // FilesystemTenancyBootstrapper disabled - causes "Undefined array key 'local'" error
        Config::set('tenancy.bootstrappers', [
            \Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper::class,
            \Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
            \Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper::class,
        ]);

        // Force HTTPS for all generated URLs when APP_URL uses https
        if (str_starts_with(config('app.url', ''), 'https://')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        // Configure guest redirect for authentication middleware
        $this->configureGuestRedirect();

        // Load platform migrations for landlord database
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        // Register routes

        // Always load installation wizard routes
        // (routes file handles redirect logic internally, but /install/complete must be accessible post-install)
        $installationRoutes = __DIR__.'/../routes/installation.php';
        if (file_exists($installationRoutes)) {
            \Illuminate\Support\Facades\Route::middleware(['web', \Aero\Platform\Http\Middleware\ForceFileSessionForInstallation::class])
                ->group($installationRoutes);
        }

        // Also register main platform routes
        $this->registerRoutes();

        // Register middleware (including HandleInertiaRequests which intercepts "/")
        $this->registerMiddleware();

        // Publish assets
        $this->registerPublishing();

        // Register views (for email templates, etc.)
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'aero-platform');

        // NOTE: Vite configuration is handled by aero/ui package
        // All frontend code lives in aero/ui - this package is backend-only

        // Register commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                \Aero\Platform\Console\Commands\TenantCreate::class,
                \Aero\Platform\Console\Commands\TenantMigrate::class,
                \Aero\Platform\Console\Commands\TenantFlush::class,
                \Aero\Platform\Console\Commands\TenantHealth::class,
                \Aero\Platform\Console\Commands\EnsureSuperAdmin::class,
                \Aero\Platform\Console\Commands\SetupApplication::class,
            ]);
        }

        // Register platform navigation with NavigationRegistry
        // This allows HandleInertiaRequests to share navigation via Inertia props
        $this->registerPlatformNavigation();
    }

    /**
     * Register platform navigation items from config/module.php.
     *
     * Structure: Module → Submodules → Components
     * - Submodules become top-level menu items (flattened by NavigationRegistry)
     * - If submodule has only ONE component, that component becomes the menu item directly
     * - If submodule has multiple components, they become submenu items
     * - Icons are inherited from parent if not specified
     */
    protected function registerPlatformNavigation(): void
    {
        // Only register if NavigationRegistry is bound (Core is loaded)
        if (! $this->app->bound(NavigationRegistry::class)) {
            return;
        }

        $registry = $this->app->make(NavigationRegistry::class);

        // Load platform module config
        $configPath = __DIR__.'/../config/module.php';
        $config = file_exists($configPath) ? require $configPath : [];

        // Build navigation from config submodules
        $submoduleNav = [];
        foreach ($config['submodules'] ?? [] as $submodule) {
            $submoduleCode = $submodule['code'] ?? '';

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
                    'access' => 'platform.'.$submoduleCode.'.'.($component['code'] ?? ''),
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
                        'access' => 'platform.'.$submoduleCode.'.'.($component['code'] ?? ''),
                        'type' => $component['type'] ?? 'page',
                    ];
                }

                // Create submodule navigation item with component children
                $submoduleNav[] = [
                    'name' => $submodule['name'] ?? ucfirst($submoduleCode),
                    'path' => $submodule['route'] ?? null,
                    'icon' => $submoduleIcon,
                    'access' => 'platform.'.$submoduleCode,
                    'priority' => $submodule['priority'] ?? 100,
                    'children' => $componentNav, // Include children for submenu
                ];
            }
        }

        // Sort submodules by priority
        usort($submoduleNav, fn ($a, $b) => ($a['priority'] ?? 100) <=> ($b['priority'] ?? 100));

        // Register platform navigation with highest priority (0)
        // Platform is is_core=true so its children flatten to top level in admin context
        // Scope: 'platform' - Platform navigation is for admin/landlord users only
        $registry->register('platform', [
            [
                'name' => $config['name'] ?? 'Platform Administration',
                'icon' => $config['icon'] ?? 'BuildingOffice2Icon',
                'access' => 'platform',
                'priority' => $config['priority'] ?? 0,
                'children' => $submoduleNav,
            ],
        ], $config['priority'] ?? 0, 'platform');
    }

    /**
     * Register middleware aliases for the platform package.
     * Follows same pattern as Core - push HandleInertiaRequests to web group.
     */
    protected function registerMiddleware(): void
    {
        // Use the booted callback to ensure app is fully initialized (same as Core)
        $this->app->booted(function () {
            $router = $this->app->make('router');

            // CRITICAL: Register Database Firewall middleware FIRST (before sessions)
            // This ensures correct database connection for session storage on central domains
            $router->prependMiddlewareToGroup('web', \Aero\Platform\Http\Middleware\SetDatabaseConnectionFromDomain::class);

            // Force file-based sessions/cache for installation routes BEFORE StartSession
            // so the installer can run without database-backed sessions/tables.
            $router->prependMiddlewareToGroup('web', \Aero\Platform\Http\Middleware\ForceFileSessionForInstallation::class);

            // Check installation status and redirect to /install if not installed
            // IMPORTANT: Must run BEFORE session middleware to avoid DB errors when not installed
            $router->prependMiddlewareToGroup('web', \Aero\Platform\Http\Middleware\CheckInstallation::class);

            // Register IdentifyDomainContext to set context for the request
            // and ensure it runs BEFORE CheckInstallation so it has access to domain_context
            $router->prependMiddlewareToGroup('web', \Aero\Platform\Http\Middleware\IdentifyDomainContext::class);

            // Register HandleInertiaRequests middleware AFTER session starts
            // Using pushMiddlewareToGroup so it runs AFTER StartSession
            // This ensures auth is available when sharing props
            $router->pushMiddlewareToGroup('web', \Aero\Platform\Http\Middleware\HandleInertiaRequests::class);
        });

        $router = $this->app['router'];

        // Register domain middleware aliases for manual use in routes
        $router->aliasMiddleware('identify.domain', \Aero\Platform\Http\Middleware\IdentifyDomainContext::class);
        $router->aliasMiddleware('set.database.from.domain', \Aero\Platform\Http\Middleware\SetDatabaseConnectionFromDomain::class);

        // Core platform middleware aliases
        $router->aliasMiddleware('module', \Aero\Platform\Http\Middleware\ModuleAccessMiddleware::class);
        $router->aliasMiddleware('check.module', \Aero\Platform\Http\Middleware\CheckModuleAccess::class);
        $router->aliasMiddleware('platform.domain', \Aero\Platform\Http\Middleware\EnsurePlatformDomain::class);
        $router->aliasMiddleware('enforce.subscription', \Aero\Platform\Http\Middleware\EnforceSubscription::class);
        $router->aliasMiddleware('check.installation', \Aero\Platform\Http\Middleware\CheckInstallation::class);
        $router->aliasMiddleware('maintenance', \Aero\Platform\Http\Middleware\CheckMaintenanceMode::class);
        $router->aliasMiddleware('permission', \Aero\Platform\Http\Middleware\PermissionMiddleware::class);
        $router->aliasMiddleware('role', \Aero\Platform\Http\Middleware\EnsureUserHasRole::class);
        $router->aliasMiddleware('platform.super.admin', \Aero\Platform\Http\Middleware\PlatformSuperAdmin::class);
        $router->aliasMiddleware('tenant.super.admin', \Aero\Platform\Http\Middleware\TenantSuperAdmin::class);
        $router->aliasMiddleware('tenant.setup', \Aero\Platform\Http\Middleware\EnsureTenantIsSetup::class);
        $router->aliasMiddleware('tenant.onboarding', \Aero\Platform\Http\Middleware\RequireTenantOnboarding::class);
        $router->aliasMiddleware('set.locale', \Aero\Platform\Http\Middleware\SetLocale::class);
        $router->aliasMiddleware('check.subscription', \Aero\Platform\Http\Middleware\CheckModuleSubscription::class);

        // Optionally push CheckModuleSubscription to 'tenant' middleware group
        // This provides automatic route-based module gating for all tenant routes
        // Uncomment if using stancl/tenancy's 'tenant' middleware group:
        // $router->pushMiddlewareToGroup('tenant', \Aero\Platform\Http\Middleware\CheckModuleSubscription::class);
    }

    /**
     * Configure authentication guards and providers programmatically.
     * This keeps the host app's auth.php clean.
     */
    protected function configureAuth(): void
    {
        // Add landlord guard
        Config::set('auth.guards.landlord', [
            'driver' => 'session',
            'provider' => 'landlord_users',
        ]);

        // Add landlord_users provider
        Config::set('auth.providers.landlord_users', [
            'driver' => 'eloquent',
            'model' => LandlordUser::class,
        ]);

        // Add password reset for landlord users
        Config::set('auth.passwords.landlord_users', [
            'provider' => 'landlord_users',
            'table' => 'landlord_password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ]);
    }

    /**
     * Configure database connections programmatically.
     * Adds 'central' connection for landlord models.
     */
    protected function configureDatabase(): void
    {
        // Get the default mysql configuration as a base
        $mysqlConfig = config('database.connections.mysql', []);

        // Add 'central' connection (same as default, but explicit for landlord models)
        Config::set('database.connections.central', array_merge($mysqlConfig, [
            'database' => env('DB_DATABASE', 'eos365'),
        ]));
    }

    /**
     * Register package routes.
     *
     * Route Architecture:
     * -------------------
     * aero-platform has exactly 2 route files:
     * 1. web.php - Platform domain (domain.com): Landing, registration, public pages, installation
     * 2. admin.php - Admin domain (admin.domain.com): Landlord management, tenant admin
     *
     * Domain-based routing prevents conflicts:
     * - domain.com → web.php (public platform routes)
     * - admin.domain.com → admin.php (landlord/admin routes)
     * - tenant.domain.com → handled by aero-core and modules (NOT loaded here)
     */
    protected function registerRoutes(): void
    {
        // Admin routes (for admin.domain.com - landlord guard)
        Route::group([
            'middleware' => ['web'],
            'domain' => $this->getAdminDomain(),
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../routes/admin.php');
        });

        // Platform web routes (for domain.com ONLY - public pages, registration)
        // CRITICAL: Domain restriction prevents conflicts with tenant routes
        Route::group([
            'middleware' => ['web'],
            'domain' => $this->getPlatformDomain(),
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        });
    }

    /**
     * Get the main platform domain (e.g., aeos365.test).
     * AUTO-DETECTS from the current browser request.
     * Used to restrict platform.php routes to central domain only.
     */
    protected function getPlatformDomain(): string
    {
        // Runtime detection from browser request
        if (request() && request()->getHost()) {
            $currentHost = request()->getHost();
            $hostWithoutPort = preg_replace('/:\d+$/', '', $currentHost);

            // Extract root domain (remove subdomain if present)
            $parts = explode('.', $hostWithoutPort);

            // If it's a subdomain (e.g., tenant.aeos365.test or admin.aeos365.test)
            // Extract the root domain (aeos365.test)
            if (count($parts) > 2) {
                // Remove first part (subdomain), keep domain.tld
                return implode('.', array_slice($parts, 1));
            }

            // Already a root domain (e.g., aeos365.test)
            return $hostWithoutPort;
        }

        // Fallback for console commands
        return env('PLATFORM_DOMAIN', 'localhost');
    }

    /**
     * Get the admin subdomain for routing (e.g., admin.aeos365.test).
     */
    protected function getAdminDomain(): string
    {
        // Try ADMIN_DOMAIN first (explicit configuration)
        $adminDomain = env('ADMIN_DOMAIN');
        if ($adminDomain) {
            return $adminDomain;
        }

        // Fallback: admin. + platform domain
        return 'admin.'.$this->getPlatformDomain();
    }

    /**
     * Register package's publishable assets.
     */
    protected function registerPublishing(): void
    {
        if ($this->app->runningInConsole()) {
            // Publish migrations
            $this->publishes([
                __DIR__.'/../database/migrations' => database_path('migrations'),
            ], 'aero-platform-migrations');

            // Publish config
            $this->publishes([
                __DIR__.'/../config/modules.php' => config_path('aero-platform-modules.php'),
            ], 'aero-platform-config');

            // NOTE: No assets publishing - all frontend is handled by aero/ui package

            // Publish views
            $this->publishes([
                __DIR__.'/../resources/views' => resource_path('views/vendor/aero-platform'),
            ], 'aero-platform-views');

            // Publish Mail templates
            $this->publishes([
                __DIR__.'/../Mail' => app_path('Mail/Platform'),
            ], 'aero-platform-mail');
        }
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            ModuleAccessService::class,
            RoleModuleAccessService::class,
            PlatformSettingService::class,
            ErrorLogService::class,
            SslCommerzService::class,
            TenantScopeInterface::class,
        ];
    }

    /**
     * Register event listeners for tenant lifecycle.
     *
     * - TenantCreated: Runs module migrations on newly created tenant databases
     */
    protected function registerEventListeners(): void
    {
        // Listen for TenantCreated event to run module migrations
        // This ensures all installed modules (HRM, CRM, etc.) are migrated
        Event::listen(TenantCreated::class, TenantCreatedListener::class);
    }

    /**
     * Override the migrator to ONLY use aero-platform migrations on the landlord database.
     *
     * In SaaS mode:
     * - Landlord database: ONLY aero-platform migrations (tenants, domains, plans, etc.)
     * - Tenant databases: aero-core + module migrations (users, employees, etc.)
     *
     * This overrides Core's migrator override which excludes app migrations.
     * Platform further restricts to ONLY platform migrations for landlord.
     */
    protected function overrideMigratorForLandlord(): void
    {
        $platformMigrationsPath = realpath(__DIR__.'/../database/migrations');

        $this->app->extend('migrator', function ($migrator, $app) use ($platformMigrationsPath) {
            return new class($app['migration.repository'], $app['db'], $app['files'], $app['events'], $platformMigrationsPath) extends \Illuminate\Database\Migrations\Migrator
            {
                protected string $platformMigrationsPath;

                public function __construct($repository, $resolver, $files, $dispatcher, string $platformMigrationsPath)
                {
                    parent::__construct($repository, $resolver, $files, $dispatcher);
                    $this->platformMigrationsPath = $platformMigrationsPath;
                }

                public function getMigrationFiles($paths)
                {
                    // Get all migration files from all paths
                    $files = parent::getMigrationFiles($paths);

                    // ONLY allow migrations from aero-platform package
                    // All other packages (core, hrm, crm, etc.) are for tenant databases
                    return collect($files)->filter(function ($path, $name) {
                        // Normalize path for comparison (resolve ../ and convert slashes)
                        $normalizedPath = realpath($path) ?: $path;

                        // Allow ONLY platform migrations
                        return str_starts_with($normalizedPath, $this->platformMigrationsPath);
                    })->all();
                }
            };
        });
    }

    /**
     * Configure guest redirect for authentication middleware.
     *
     * Redirects unauthenticated users to the appropriate login page
     * based on domain context (admin vs tenant).
     */
    protected function configureGuestRedirect(): void
    {
        $this->app['auth']->shouldUse('landlord');

        // Configure the Authenticate middleware to redirect to admin.login for landlord guard
        $this->app->resolving(\Illuminate\Auth\Middleware\Authenticate::class, function ($middleware) {
            $middleware->redirectUsing(function ($request) {
                $host = $request->getHost();

                // Admin subdomain uses admin.login
                if (str_starts_with($host, 'admin.')) {
                    return route('admin.login');
                }

                // Tenant subdomain uses tenant login (if exists)
                if (Route::has('tenant.login')) {
                    return route('tenant.login');
                }

                // Fallback to admin.login
                return route('admin.login');
            });
        });
    }
}
