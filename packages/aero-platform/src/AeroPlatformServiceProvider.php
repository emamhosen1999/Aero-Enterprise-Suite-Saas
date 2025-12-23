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
        // Disable Fortify's default routes - we define auth routes with proper domain restrictions
        // Admin subdomain uses Platform's AuthenticatedSessionController
        // Tenant subdomains use Core's AuthenticatedSessionController
        Fortify::ignoreRoutes();

        // Register global BootstrapGuard middleware FIRST
        // This runs before route matching and handles:
        // 1. Installation status check
        // 2. Cross-domain redirect to platform /install if not installed
        $kernel = $this->app->make(\Illuminate\Contracts\Http\Kernel::class);
        $kernel->pushMiddleware(\Aero\Platform\Http\Middleware\BootstrapGuard::class);

        // CRITICAL: Only register tenancy if installed AND in SaaS mode
        // This prevents tenancy from being enabled during installation
        // or in standalone mode
        if ($this->installed() && $this->isSaasMode()) {
            // Register the TenancyBootstrapServiceProvider
            // CRITICAL: This registers event listeners for TenancyInitialized which
            // runs the DatabaseTenancyBootstrapper to switch DB connections
            $this->app->register(\Aero\Platform\Providers\TenancyBootstrapServiceProvider::class);
        }

        // Override Core's migrator to ONLY use platform migrations on landlord database
        // Core, HRM, CRM and other module migrations are for TENANT databases only
        $this->overrideMigratorForLandlord();

        // Merge platform configs
        // Module definitions are in config/module.php and loaded by ModuleDiscoveryService
        $this->mergeConfigFrom(__DIR__.'/../config/tenancy.php', 'tenancy');
        $this->mergeConfigFrom(__DIR__.'/../config/platform.php', 'platform');

        // Override TenantScopeInterface binding (Core binds StandaloneTenantScope by default)
        // Platform provides the SaaS implementation using stancl/tenancy
        $this->app->singleton(TenantScopeInterface::class, SaaSTenantScope::class);

        // Register services as singletons (lazy-loaded to avoid DB access pre-install)
        $this->app->singleton(ModuleAccessService::class, function ($app) {
            return new ModuleAccessService;
        });

        $this->app->singleton(RoleModuleAccessService::class, function ($app) {
            return new RoleModuleAccessService;
        });

        $this->app->singleton(PlatformSettingService::class, function ($app) {
            return new PlatformSettingService;
        });

        $this->app->singleton(ErrorLogService::class);
        $this->app->singleton(SslCommerzService::class);

        // Register tenant lifecycle services
        $this->app->singleton(\Aero\Platform\Services\Tenant\TenantRetentionService::class);
        $this->app->singleton(\Aero\Platform\Services\Tenant\TenantPurgeService::class);

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
        // CacheTenancyBootstrapper disabled - file/database cache drivers don't support tagging
        Config::set('tenancy.bootstrappers', [
            \Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper::class,
            // \Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class, // Requires Redis/Memcached
            \Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper::class,
        ]);

        // Force HTTPS for all generated URLs when APP_URL uses https
        if (str_starts_with(config('app.url', ''), 'https://')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        // ONLY register platform routes, middleware, and features in SaaS mode
        // In standalone mode, the platform package might be installed but should not interfere
        if ($this->installed() && $this->isSaasMode()) {
            // Configure guest redirect for authentication middleware
            $this->configureGuestRedirect();

            // Register platform routes (admin + public platform routes)
            $this->registerRoutes();

            // Register platform middleware (HandleInertiaRequests, IdentifyDomainContext, etc.)
            $this->registerMiddleware();
        }

        // Load platform migrations for landlord database (always needed if package is installed)
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');

        // Always load installation wizard routes (needed during installation)
        $installationRoutes = __DIR__.'/../routes/installation.php';
        if (file_exists($installationRoutes)) {
            \Illuminate\Support\Facades\Route::middleware(['web', \Aero\Platform\Http\Middleware\ForceFileSessionForInstallation::class])
                ->group($installationRoutes);
        }

        // Register commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                \Aero\Platform\Console\Commands\PurgeExpiredTenants::class,
            ]);
        }

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
                \Aero\Platform\Console\Commands\CleanupFailedInstallation::class,
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

            // Note: BootstrapGuard is registered globally in register() method.
            // It handles installation checks before any routing occurs.

            // Register IdentifyDomainContext to set context for the request
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
        $router->aliasMiddleware('admin.domain', \Aero\Platform\Http\Middleware\EnsureAdminDomain::class);
        $router->aliasMiddleware('enforce.subscription', \Aero\Platform\Http\Middleware\EnforceSubscription::class);
        $router->aliasMiddleware('maintenance', \Aero\Platform\Http\Middleware\CheckMaintenanceMode::class);
        $router->aliasMiddleware('permission', \Aero\Platform\Http\Middleware\PermissionMiddleware::class);
        $router->aliasMiddleware('role', \Aero\Platform\Http\Middleware\EnsureUserHasRole::class);
        $router->aliasMiddleware('landlord', \Aero\Platform\Http\Middleware\EnsureLandlordGuard::class);
        $router->aliasMiddleware('tenant.active', \Aero\Platform\Http\Middleware\EnsureTenantIsActive::class);
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
     * 
     * Priority: .env DB_DATABASE > installation_db_config.json > fallback
     */
    protected function configureDatabase(): void
    {
        // Get the default mysql configuration as a base
        $mysqlConfig = config('database.connections.mysql', []);

        // Determine database name from multiple sources
        $database = $this->resolveDatabase();

        // Update the default mysql connection with resolved database
        Config::set('database.connections.mysql.database', $database);

        // Add 'central' connection (same as default, but explicit for landlord models)
        Config::set('database.connections.central', array_merge($mysqlConfig, [
            'database' => $database,
        ]));
    }

    /**
     * Resolve the database name from available sources.
     * 
     * Priority:
     * 1. .env DB_DATABASE (if set and non-empty)
     * 2. installation_db_config.json (installation wizard stored config)
     * 3. Fallback to 'eos365'
     */
    protected function resolveDatabase(): string
    {
        // Priority 1: Check .env
        $envDatabase = env('DB_DATABASE');
        if (!empty($envDatabase)) {
            return $envDatabase;
        }

        // Priority 2: Check installation config file
        $configPath = storage_path('installation_db_config.json');
        if (file_exists($configPath)) {
            try {
                $config = json_decode(file_get_contents($configPath), true);
                if (!empty($config['db_database'])) {
                    // Also update host/port/user/pass from installation config
                    $this->applyInstallationDbConfig($config);
                    return $config['db_database'];
                }
            } catch (\Throwable $e) {
                // Silently ignore parse errors
            }
        }

        // Priority 3: Fallback
        return 'eos365';
    }

    /**
     * Apply full database configuration from installation config file.
     */
    protected function applyInstallationDbConfig(array $config): void
    {
        $mysqlConfig = config('database.connections.mysql', []);

        if (!empty($config['db_host'])) {
            Config::set('database.connections.mysql.host', $config['db_host']);
        }
        if (!empty($config['db_port'])) {
            Config::set('database.connections.mysql.port', $config['db_port']);
        }
        if (!empty($config['db_username'])) {
            Config::set('database.connections.mysql.username', $config['db_username']);
        }
        if (isset($config['db_password'])) {
            $password = $config['db_password'];
            // Decrypt if encrypted
            if (!empty($config['db_password_encrypted']) && !empty($password)) {
                try {
                    $password = \Illuminate\Support\Facades\Crypt::decryptString($password);
                } catch (\Throwable $e) {
                    // Use as-is if decryption fails
                }
            }
            Config::set('database.connections.mysql.password', $password);
        }
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
     * Domain-based routing strategy:
     * - We DO NOT use Laravel's 'domain' constraint in Route::group()
     * - Instead, we rely on IdentifyDomainContext middleware to set context
     * - Route files themselves check context and return 404 if accessed from wrong domain
     * - This approach is more flexible and works without requiring .env configuration
     */
    protected function registerRoutes(): void
    {
        // Admin routes (for admin.domain.com - landlord guard)
        // These routes are always registered but will check domain context via middleware
        Route::group([
            'middleware' => ['web'],
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../routes/admin.php');
        });

        // Platform web routes (for domain.com ONLY - public pages, registration)
        Route::group([
            'middleware' => ['web'],
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        });

        // Platform API routes (for domain.com/api/* - public product catalog)
        // These endpoints expose available products/features for tenant applications
        Route::group([
            'middleware' => ['api'],
            'prefix' => 'api',
        ], function () {
            $this->loadRoutesFrom(__DIR__.'/../routes/api.php');
        });
    }

    /**
     * Get the main platform domain (e.g., aeos365.test).
     * AUTO-DETECTS from the current browser request or falls back to configured domain.
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

        // Fallback: Use configured PLATFORM_DOMAIN from .env
        // This is critical for proper route registration during boot
        $platformDomain = env('PLATFORM_DOMAIN');
        if ($platformDomain) {
            // Remove any protocol or trailing slashes
            $platformDomain = preg_replace('#^https?://|/$#', '', $platformDomain);
            return $platformDomain;
        }

        // Last resort fallback
        return 'localhost';
    }

    /**
     * Get the admin subdomain for routing (e.g., admin.aeos365.test).
     */
    protected function getAdminDomain(): string
    {
        // Try ADMIN_DOMAIN first (explicit configuration)
        $adminDomain = env('ADMIN_DOMAIN');
        if ($adminDomain) {
            // Remove any protocol or trailing slashes
            $adminDomain = preg_replace('#^https?://|/$#', '', $adminDomain);
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
                __DIR__.'/../config/platform.php' => config_path('platform.php'),
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
     * 
     * IMPORTANT: Do NOT set a global default guard with shouldUse().
     * The default guard should remain 'web' for tenant domains.
     * Admin routes explicitly use 'auth:landlord' middleware.
     */
    protected function configureGuestRedirect(): void
    {
        // REMOVED: $this->app['auth']->shouldUse('landlord');
        // This was causing issues - admin routes already use auth:landlord explicitly

        // Configure the Authenticate middleware to redirect to appropriate login based on domain
        $this->app->resolving(\Illuminate\Auth\Middleware\Authenticate::class, function ($middleware) {
            $middleware->redirectUsing(function ($request) {
                $host = $request->getHost();
                
                // Use the ParsesHostDomain trait for consistent domain detection
                $trait = new class {
                    use \Aero\Core\Traits\ParsesHostDomain;
                    public function isAdmin(string $host): bool {
                        return $this->isHostAdminDomain($host);
                    }
                    public function isPlatform(string $host): bool {
                        return $this->isHostPlatformDomain($host);
                    }
                };

                // Admin subdomain → admin.login
                if ($trait->isAdmin($host)) {
                    return route('admin.login');
                }

                // Platform domain (no subdomain) → redirect to registration page
                // Platform domain does NOT have a login route - it's for public pages and registration
                if ($trait->isPlatform($host)) {
                    return route('platform.register.index');
                }

                // Tenant subdomain → login
                return route('login');
            });
        });

        // Configure RedirectIfAuthenticated (guest middleware) to redirect authenticated users
        // This is called when an authenticated user tries to access login/register pages
        \Illuminate\Auth\Middleware\RedirectIfAuthenticated::redirectUsing(function ($request) {
            $host = $request->getHost();
            
            // Use the ParsesHostDomain trait for consistent domain detection
            $trait = new class {
                use \Aero\Core\Traits\ParsesHostDomain;
                public function isAdmin(string $host): bool {
                    return $this->isHostAdminDomain($host);
                }
                public function isPlatform(string $host): bool {
                    return $this->isHostPlatformDomain($host);
                }
            };

            // Admin subdomain: Check landlord guard and redirect if authenticated
            if ($trait->isAdmin($host)) {
                if (\Illuminate\Support\Facades\Auth::guard('landlord')->check()) {
                    return route('admin.dashboard');
                }
            }

            // Platform domain: Don't redirect authenticated users
            // They should be able to access public pages even if authenticated elsewhere
            if ($trait->isPlatform($host)) {
                return null;
            }

            // Tenant subdomain: Check web guard and redirect if authenticated
            if (\Illuminate\Support\Facades\Auth::guard('web')->check()) {
                // Try core.dashboard first, fallback to dashboard, then /dashboard
                if (\Illuminate\Support\Facades\Route::has('core.dashboard')) {
                    return route('core.dashboard');
                } elseif (\Illuminate\Support\Facades\Route::has('dashboard')) {
                    return route('dashboard');
                }
                return '/dashboard';
            }

            // No redirect - allow access to guest pages (not authenticated)
            return null;
        });
    }

    /**
     * Check if the system is installed using file-based detection.
     * 
     * @return bool
     */
    protected function installed(): bool
    {
        return file_exists(storage_path('app/aeos.installed'));
    }

    /**
     * Check if system is in SaaS mode using file-based detection.
     * Mode is set during installation and immutable at runtime.
     * 
     * @return bool
     */
    protected function isSaasMode(): bool
    {
        if (!file_exists(storage_path('app/aeos.mode'))) {
            return false;
        }
        
        return trim(file_get_contents(storage_path('app/aeos.mode'))) === 'saas';
    }
}
