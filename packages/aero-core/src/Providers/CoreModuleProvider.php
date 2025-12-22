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
    }

    /**
     * Register core middleware.
     */
    protected function registerMiddleware(): void
    {
        $router = $this->app['router'];

        // Register route middleware
        $router->aliasMiddleware('auth', \Aero\Core\Http\Middleware\Authenticate::class);
        $router->aliasMiddleware('module.access', \Aero\Core\Http\Middleware\ModuleAccessMiddleware::class);
        $router->aliasMiddleware('permission', \Aero\Core\Http\Middleware\PermissionMiddleware::class);
        $router->aliasMiddleware('role', \Aero\Core\Http\Middleware\EnsureUserHasRole::class);
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
