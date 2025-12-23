<?php

namespace Aero\Core\Providers;

/**
 * Core Module Provider
 *
 * Registers the core tenant module (Dashboard, Users, Roles, Settings).
 */
class CoreModuleProvider extends AbstractModuleProvider
{
    /**
     * Module code.
     */
    protected string $moduleCode = 'core';

    /**
     * Module display name.
     */
    protected string $moduleName = 'Core';

    /**
     * Module description.
     */
    protected string $moduleDescription = 'Core tenant functionality including dashboard, user management, roles, and settings';

    /**
     * Module version.
     */
    protected string $moduleVersion = '1.0.0';

    /**
     * Module category.
     */
    protected string $moduleCategory = 'foundation';

    /**
     * Module icon.
     */
    protected string $moduleIcon = 'HomeIcon';

    /**
     * Module priority.
     */
    protected int $modulePriority = 1;

    /**
     * Module is always enabled.
     */
    protected bool $enabled = true;

    /**
     * No subscription required for core.
     */
    protected ?string $minimumPlan = null;

    /**
     * Get the module hierarchy from config.
     */
    public function getModuleHierarchy(): array
    {
        return config('aero-core.modules.modules', []);
    }

    /**
     * Register the service provider.
     * 
     * This runs BEFORE boot() and before route matching.
     * We register the global bootstrap middleware here so it intercepts ALL requests first.
     */
    public function register(): void
    {
        parent::register();

        // In standalone mode, push the global BootstrapGuard middleware
        // This runs before route matching and handles:
        // 1. Installation status check
        // 2. Forcing file-based sessions during installation
        // 3. Redirecting to /install if not installed
        if (config('aero.mode') === 'standalone') {
            $kernel = $this->app->make(\Illuminate\Contracts\Http\Kernel::class);
            $kernel->pushMiddleware(\Aero\Core\Http\Middleware\BootstrapGuard::class);
        }
    }

    /**
     * Boot the service provider.
     * 
     * Conditionally load installation or app routes based on installation status.
     */
    public function boot(): void
    {
        // In standalone mode, load installation routes if not installed
        if (config('aero.mode') === 'standalone' && !file_exists(storage_path('app/aeos.installed'))) {
            // Load installation routes WITHOUT module prefix
            \Illuminate\Support\Facades\Route::middleware(['web'])
                ->group(__DIR__.'/../../routes/installation.php');
        }

        // Call parent boot - it loads views, migrations, and web.php (with module prefix)
        // The BootstrapGuard middleware will block access to these routes if not installed
        parent::boot();
    }

    /**
     * Get navigation items for the core module.
     */
    public function getNavigationItems(): array
    {
        return [
            [
                'code' => 'dashboard',
                'name' => 'Dashboard',
                'icon' => 'HomeIcon',
                'route' => 'dashboard.index',
                'priority' => 1,
            ],
            [
                'code' => 'users',
                'name' => 'Users',
                'icon' => 'UserGroupIcon',
                'route' => 'users.index',
                'priority' => 2,
            ],
            [
                'code' => 'roles',
                'name' => 'Roles & Permissions',
                'icon' => 'ShieldCheckIcon',
                'route' => 'roles.index',
                'priority' => 3,
            ],
            [
                'code' => 'settings',
                'name' => 'Settings',
                'icon' => 'CogIcon',
                'route' => 'settings.general',
                'priority' => 99,
            ],
        ];
    }

    /**
     * Get module routes.
     */
    public function getRoutes(): array
    {
        return [
            'admin' => $this->getModulePath('routes/admin.php'),
            'tenant' => $this->getModulePath('routes/tenant.php'),
            'web' => $this->getModulePath('routes/web.php'),
            'api' => $this->getModulePath('routes/api.php'),
        ];
    }

    /**
     * Get the module path.
     */
    protected function getModulePath(string $path = ''): string
    {
        $basePath = dirname(__DIR__, 2);
        return $path ? $basePath . '/' . $path : $basePath;
    }

    /**
     * Boot the core module.
     */
    protected function bootModule(): void
    {
        // Register middleware
        $this->registerMiddleware();
        
        // Register policies
        $this->registerPolicies();
        
        // Register commands
        $this->registerCommands();
    }

    /**
     * Register core commands.
     */
    protected function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                \Aero\Core\Console\Commands\SyncModuleHierarchy::class,
                \Aero\Core\Console\Commands\SeedCommand::class,
                \Aero\Core\Console\Commands\InstallCommand::class,
            ]);
        }
    }

    /**
     * Register core middleware.
     */
    protected function registerMiddleware(): void
    {
        $router = $this->app['router'];

        // Register route middleware aliases
        $router->aliasMiddleware('auth', \Aero\Core\Http\Middleware\Authenticate::class);
        $router->aliasMiddleware('module.access', \Aero\Core\Http\Middleware\ModuleAccessMiddleware::class);
        $router->aliasMiddleware('permission', \Aero\Core\Http\Middleware\PermissionMiddleware::class);
        $router->aliasMiddleware('role', \Aero\Core\Http\Middleware\EnsureUserHasRole::class);
        $router->aliasMiddleware('ensure.installed', \Aero\Core\Http\Middleware\EnsureInstalled::class);
        $router->aliasMiddleware('prevent.installed', \Aero\Core\Http\Middleware\PreventInstalledAccess::class);
        
        // Note: BootstrapGuard is already registered globally in register() method
        // for standalone mode, so we don't need to add EnsureInstalled to web group.
        // The alias is kept for explicit route usage if needed.
    }

    /**
     * Register core policies.
     */
    protected function registerPolicies(): void
    {
        // Register policies if AuthServiceProvider exists
        if (class_exists('\Illuminate\Support\Facades\Gate')) {
            \Illuminate\Support\Facades\Gate::policy(
                \Aero\Core\Models\User::class,
                \Aero\Core\Policies\UserPolicy::class
            );
            
            \Illuminate\Support\Facades\Gate::policy(
                \Aero\Core\Models\Role::class,
                \Aero\Core\Policies\RolePolicy::class
            );
        }
    }
}
