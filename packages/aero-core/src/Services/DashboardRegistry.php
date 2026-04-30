<?php

declare(strict_types=1);

namespace Aero\Core\Services;

use Aero\Core\Models\User;
use Illuminate\Support\Facades\Route;

/**
 * Dashboard Registry Service
 *
 * Central registry for all available dashboards in the system.
 * Modules register their dashboards here, and the system uses this
 * to populate the Role form dropdown and validate dashboard routes.
 *
 * ARCHITECTURE:
 * -------------
 * 1. Core binds this as a Singleton in ServiceProvider
 * 2. Modules inject this and register dashboards in their boot() method
 * 3. Role form uses getDashboardOptions() to show available dashboards
 * 4. DashboardRedirectMiddleware uses this to validate and redirect
 *
 * EXAMPLE REGISTRATION (in HRM ServiceProvider):
 * ```php
 * public function boot(): void
 * {
 *     $registry = $this->app->make(DashboardRegistry::class);
 *     $registry->register('hrm.dashboard', 'HRM Dashboard', 'hrm', 'For HR Managers and Staff');
 *     $registry->register('employee.dashboard', 'Employee Dashboard', 'hrm', 'Personal employee portal');
 * }
 * ```
 */
class DashboardRegistry
{
    /**
     * Registered dashboards from all modules.
     *
     * @var array<string, array{route: string, label: string, module: string, description: string, icon: string|null, requiredPermission: string|null}>
     */
    protected array $dashboards = [];

    /**
     * Dashboard categories for grouping in UI.
     */
    protected array $categories = [
        'core' => 'System',
        'hrm' => 'Human Resources',
        'finance' => 'Finance & Accounting',
        'project' => 'Project Management',
        'crm' => 'Customer Relations',
        'ims' => 'Inventory',
        'pos' => 'Point of Sale',
        'scm' => 'Supply Chain',
    ];

    /**
     * Register a dashboard.
     *
     * @param  string  $routeName  The Laravel route name (e.g., 'hrm.dashboard')
     * @param  string  $label  Human-readable label for the dashboard
     * @param  string  $module  Module code that owns this dashboard
     * @param  string  $description  Brief description of the dashboard
     * @param  string|null  $icon  Optional icon class
     * @param  string|null  $requiredPermission  Permission required to access this dashboard
     */
    public function register(
        string $routeName,
        string $label,
        string $module,
        string $description = '',
        ?string $icon = null,
        ?string $requiredPermission = null
    ): self {
        $this->dashboards[$routeName] = [
            'route' => $routeName,
            'label' => $label,
            'module' => $module,
            'description' => $description,
            'icon' => $icon,
            'requiredPermission' => $requiredPermission,
        ];

        return $this;
    }

    /**
     * Register multiple dashboards at once.
     *
     * @param  array<array{route: string, label: string, module: string, description?: string, icon?: string, requiredPermission?: string}>  $dashboards
     */
    public function registerMany(array $dashboards): self
    {
        foreach ($dashboards as $dashboard) {
            $this->register(
                $dashboard['route'],
                $dashboard['label'],
                $dashboard['module'],
                $dashboard['description'] ?? '',
                $dashboard['icon'] ?? null,
                $dashboard['requiredPermission'] ?? null
            );
        }

        return $this;
    }

    /**
     * Check if a dashboard is registered.
     */
    public function has(string $routeName): bool
    {
        return isset($this->dashboards[$routeName]);
    }

    /**
     * Get a specific dashboard configuration.
     */
    public function get(string $routeName): ?array
    {
        return $this->dashboards[$routeName] ?? null;
    }

    /**
     * Get all registered dashboards.
     *
     * @return array<string, array>
     */
    public function all(): array
    {
        return $this->dashboards;
    }

    /**
     * Get dashboards grouped by module for UI display.
     *
     * @return array<string, array<array>>
     */
    public function getGroupedByModule(): array
    {
        $grouped = [];

        foreach ($this->dashboards as $routeName => $dashboard) {
            $module = $dashboard['module'];
            $categoryLabel = $this->categories[$module] ?? ucfirst($module);

            if (! isset($grouped[$categoryLabel])) {
                $grouped[$categoryLabel] = [];
            }

            $grouped[$categoryLabel][] = array_merge($dashboard, ['key' => $routeName]);
        }

        return $grouped;
    }

    /**
     * Get dashboard options for a Select/Dropdown component.
     *
     * Uses HRMAC (Role Module Access) system for permission checks:
     * - Super Administrator bypasses all checks
     * - requiredPermission in 'module.submodule' format is checked via RoleModuleAccessService
     *
     * @param  User|null  $user  Optional user to filter by permissions
     * @return array<array{key: string, label: string, description: string, module: string}>
     */
    public function getDashboardOptions($user = null): array
    {
        $options = [];

        // Get HRMAC service if available
        $hrmacService = $this->getHrmacService();

        // Check if user is Super Administrator (bypasses all checks)
        $isSuperAdmin = $this->isSuperAdmin($user);

        foreach ($this->dashboards as $routeName => $dashboard) {
            // Check permission if user provided and dashboard has requirement
            // Super Administrator bypasses all permission checks
            if (! $isSuperAdmin && $user && $dashboard['requiredPermission']) {
                if (! $this->userCanAccessDashboard($user, $dashboard['requiredPermission'], $hrmacService)) {
                    continue;
                }
            }

            // Check if route exists
            if (! Route::has($routeName)) {
                continue;
            }

            $options[] = [
                'key' => $routeName,
                'label' => $dashboard['label'],
                'description' => $dashboard['description'],
                'module' => $dashboard['module'],
                'category' => $this->categories[$dashboard['module']] ?? ucfirst($dashboard['module']),
            ];
        }

        return $options;
    }

    /**
     * Check if user can access a dashboard based on requiredPermission.
     *
     * Uses HRMAC service if available, falls back to Spatie permission check.
     *
     * @param  mixed  $user  The user to check
     * @param  string  $requiredPermission  Permission in 'module.submodule' format
     * @param  mixed  $hrmacService  The HRMAC service instance (or null)
     */
    protected function userCanAccessDashboard($user, string $requiredPermission, $hrmacService): bool
    {
        // Parse the permission - format: 'module.submodule' (e.g., 'hrm.dashboard')
        $parts = explode('.', $requiredPermission, 2);

        if (count($parts) === 2 && $hrmacService) {
            // Use HRMAC service for module.submodule check
            $moduleCode = $parts[0];
            $subModuleCode = $parts[1];

            return $hrmacService->userCanAccessSubModule($user, $moduleCode, $subModuleCode);
        }

        // Fallback to Spatie permission check
        if (method_exists($user, 'can')) {
            return $user->can($requiredPermission);
        }

        return false;
    }

    /**
     * Get the HRMAC RoleModuleAccessService if available.
     *
     * @return mixed|null
     */
    protected function getHrmacService()
    {
        // Try to get the HRMAC interface
        $interfaceClass = 'Aero\\HRMAC\\Contracts\\RoleModuleAccessInterface';

        if (interface_exists($interfaceClass) && app()->bound($interfaceClass)) {
            return app($interfaceClass);
        }

        // Try the service class directly
        $serviceClass = 'Aero\\HRMAC\\Services\\RoleModuleAccessService';

        if (class_exists($serviceClass) && app()->bound($serviceClass)) {
            return app($serviceClass);
        }

        return null;
    }

    /**
     * Check if user is a Super Administrator.
     *
     * Super Administrator bypasses all permission checks.
     *
     * @param  mixed  $user
     */
    protected function isSuperAdmin($user): bool
    {
        if (! $user) {
            return false;
        }

        // Check if User model has isSuperAdmin method
        if (method_exists($user, 'isSuperAdmin')) {
            return $user->isSuperAdmin();
        }

        // Check hasRole method for super admin roles
        if (method_exists($user, 'hasRole')) {
            $superAdminRoles = config('hrmac.super_admin_roles', [
                'Super Administrator',
                'super-admin',
                'tenant_super_administrator',
            ]);

            return $user->hasRole($superAdminRoles);
        }

        return false;
    }

    /**
     * Get the URL for a dashboard route.
     */
    public function getUrl(string $routeName): ?string
    {
        if (! $this->has($routeName)) {
            return null;
        }

        if (! Route::has($routeName)) {
            return null;
        }

        try {
            return route($routeName);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Validate if a route name is a valid registered dashboard.
     */
    public function isValid(string $routeName): bool
    {
        return $this->has($routeName) && Route::has($routeName);
    }

    /**
     * Get the default fallback dashboard route.
     */
    public function getDefaultDashboard(): string
    {
        return 'dashboard';
    }

    /**
     * Add a category for grouping dashboards.
     */
    public function addCategory(string $code, string $label): self
    {
        $this->categories[$code] = $label;

        return $this;
    }
}
