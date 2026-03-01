<?php

namespace Aero\Core\Services;

use Aero\Core\Support\TenantCache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

/**
 * Navigation Registry Service
 *
 * Central registry for module navigation items.
 * Modules register their navigation, and core aggregates them.
 *
 * Dashboard Navigation:
 * - Dynamically builds dashboard menu from DashboardRegistry
 * - Single dashboard: Shows as "Dashboard" (no dropdown)
 * - Multiple dashboards: Shows as "Dashboards" with children
 *
 * Usage:
 *   $registry = app(NavigationRegistry::class);
 *   $registry->register('hrm', [...navigation items...]);
 *   $allNav = $registry->all();
 */
class NavigationRegistry
{
    /**
     * Registered navigation items by module.
     *
     * @var array<string, array>
     */
    protected array $navigationItems = [];

    /**
     * Registered self-service navigation items by module.
     * These are employee-facing "My *" pages aggregated under a single menu.
     *
     * @var array<string, array>
     */
    protected array $selfServiceItems = [];

    /**
     * Cache key prefix.
     */
    protected const CACHE_KEY = 'aero.navigation';

    /**
     * Cache TTL in seconds (1 hour).
     */
    protected const CACHE_TTL = 3600;

    /**
     * Register navigation items for a module.
     *
     * @param  string  $moduleCode  Module identifier
     * @param  array  $items  Navigation items array
     * @param  int  $priority  Module priority for ordering
     * @param  string  $scope  Module scope: 'platform' for admin, 'tenant' for tenant users
     */
    public function register(string $moduleCode, array $items, int $priority = 100, string $scope = 'tenant'): void
    {
        $this->navigationItems[$moduleCode] = [
            'module' => $moduleCode,
            'priority' => $priority,
            'scope' => $scope,
            'items' => $items,
        ];

        // Clear cache when navigation changes
        $this->clearCache();
    }

    /**
     * Register self-service navigation items for a module.
     *
     * Self-service items are employee-facing pages like "My Attendance", "My Leaves", etc.
     * They are aggregated under a single "My Workspace" menu item.
     *
     * @param  string  $moduleCode  Module identifier
     * @param  array  $items  Self-service navigation items
     * @param  int  $priority  Priority within self-service menu
     */
    public function registerSelfService(string $moduleCode, array $items, int $priority = 100): void
    {
        $this->selfServiceItems[$moduleCode] = [
            'module' => $moduleCode,
            'priority' => $priority,
            'items' => $items,
        ];

        // Clear cache when navigation changes
        $this->clearCache();
    }

    /**
     * Get aggregated self-service navigation.
     *
     * Returns a single "My Workspace" menu item containing all self-service
     * items from all modules, sorted by priority.
     *
     * @return array|null Self-service navigation item or null if no items
     */
    public function getSelfServiceNavigation(): ?array
    {
        if (empty($this->selfServiceItems)) {
            return null;
        }

        // Aggregate all self-service items from all modules
        $allItems = collect($this->selfServiceItems)
            ->sortBy('priority')
            ->flatMap(function ($moduleData) {
                return collect($moduleData['items'])->map(function ($item) use ($moduleData) {
                    // Add module context to each item
                    return array_merge($item, [
                        'module' => $moduleData['module'],
                    ]);
                });
            })
            ->sortBy('priority')
            ->values()
            ->toArray();

        if (empty($allItems)) {
            return null;
        }

        return [
            'name' => 'My Workspace',
            'icon' => 'UserIcon',
            'priority' => 2, // After Dashboard (1), before module menus
            'access' => 'self-service',
            'children' => $allItems,
        ];
    }

    /**
     * Get self-service items for a specific module.
     */
    public function getSelfServiceForModule(string $moduleCode): array
    {
        return $this->selfServiceItems[$moduleCode]['items'] ?? [];
    }

    /**
     * Check if a module has registered self-service items.
     */
    public function hasSelfService(string $moduleCode): bool
    {
        return isset($this->selfServiceItems[$moduleCode]) && ! empty($this->selfServiceItems[$moduleCode]['items']);
    }

    /**
     * Get all navigation items sorted by priority.
     */
    public function all(): array
    {
        return collect($this->navigationItems)
            ->sortBy('priority')
            ->pluck('items')
            ->flatten(1)
            ->values()
            ->toArray();
    }

    /**
     * Get navigation items for a specific module.
     */
    public function forModule(string $moduleCode): array
    {
        return $this->navigationItems[$moduleCode]['items'] ?? [];
    }

    /**
     * Check if a module has registered navigation.
     */
    public function hasModule(string $moduleCode): bool
    {
        return isset($this->navigationItems[$moduleCode]);
    }

    /**
     * Get registered module codes.
     */
    public function getModuleCodes(): array
    {
        return array_keys($this->navigationItems);
    }

    /**
     * Get navigation items ready for frontend.
     *
     * Dashboard navigation is dynamically built from DashboardRegistry:
     * - Single dashboard: Shows as "Dashboard" (no children)
     * - Multiple dashboards: Shows as "Dashboards" parent with children
     *
     * Core/Platform modules: submodules are promoted to top level (Users, Roles, Settings)
     * Other modules: wrapped under module name (Human Resources → Employees, Attendance, etc.)
     *
     * @param  string|null  $scope  Filter by scope: 'platform' for admin, 'tenant' for tenant users, null for all
     * @param  \Aero\Core\Models\User|null  $user  Optional user to filter dashboards by permissions
     */
    public function toFrontend(?string $scope = null, $user = null): array
    {
        $navigationItems = [];

        // 1. Add dynamic dashboard navigation first (priority 1)
        $dashboardNav = $this->getDashboardNavigation($user);
        if ($dashboardNav) {
            $navigationItems[] = $dashboardNav;
        }

        // 2. Add self-service navigation (priority 2) - "My Workspace" menu
        $selfServiceNav = $this->getSelfServiceNavigation();
        if ($selfServiceNav) {
            $navigationItems[] = $selfServiceNav;
        }

        $sortedModules = collect($this->navigationItems)->sortBy('priority');

        foreach ($sortedModules as $moduleCode => $moduleData) {
            // Filter by scope if specified
            $moduleScope = $moduleData['scope'] ?? 'tenant';
            if ($scope !== null && $moduleScope !== $scope) {
                continue;
            }

            foreach ($moduleData['items'] as $item) {
                // Core/Platform modules: flatten children (submodules) to top level
                // BUT skip Dashboard submodule - it's handled dynamically above
                if ($moduleCode === 'core' || $moduleCode === 'platform') {
                    if (! empty($item['children'])) {
                        foreach ($item['children'] as $child) {
                            // Skip dashboard items - they come from DashboardRegistry
                            if ($this->isDashboardItem($child)) {
                                continue;
                            }
                            $navigationItems[] = $child;
                        }
                    } else {
                        // Skip dashboard items
                        if ($this->isDashboardItem($item)) {
                            continue;
                        }
                        $navigationItems[] = $item;
                    }
                } else {
                    // Non-core modules: keep as parent with children (submodules)
                    // This creates "Human Resources" with Employees, Attendance, etc. as children
                    $navigationItems[] = $item;
                }
            }
        }

        // Sort by priority
        usort($navigationItems, fn ($a, $b) => ($a['priority'] ?? 999) <=> ($b['priority'] ?? 999));

        return $navigationItems;
    }

    /**
     * Check if a navigation item is a dashboard item.
     *
     * Dashboard items should be excluded from regular navigation
     * as they are dynamically built from DashboardRegistry.
     */
    protected function isDashboardItem(array $item): bool
    {
        $name = strtolower($item['name'] ?? '');
        $path = strtolower($item['path'] ?? '');
        $access = strtolower($item['access'] ?? '');

        // Check if it's a dashboard item by name, path, or access code
        if (str_contains($name, 'dashboard')) {
            return true;
        }

        // Check if path is exactly /dashboard or ends with /dashboard
        if ($path === '/dashboard' || preg_match('#/dashboard$#', $path)) {
            return true;
        }

        // Check access code for dashboard
        if (str_contains($access, '.dashboard') || $access === 'core.dashboard') {
            return true;
        }

        return false;
    }

    /**
     * Get dynamic dashboard navigation from DashboardRegistry.
     *
     * - If user has access to only 1 dashboard: Returns single "Dashboard" item
     * - If user has access to 2+ dashboards: Returns "Dashboards" parent with children
     *
     * @param  \Aero\Core\Models\User|null  $user  User to filter by permissions
     * @return array|null Navigation item or null if no dashboards available
     */
    public function getDashboardNavigation($user = null): ?array
    {
        // Check if DashboardRegistry is available
        if (! app()->bound(DashboardRegistry::class)) {
            // Fallback to a simple dashboard link if registry not available
            return [
                'name' => 'Dashboard',
                'path' => '/dashboard',
                'icon' => 'HomeIcon',
                'priority' => 1,
                'children' => [],
            ];
        }

        $dashboardRegistry = app(DashboardRegistry::class);
        $user = $user ?? Auth::user();

        // Get all available dashboards filtered by user permissions
        $availableDashboards = $dashboardRegistry->getDashboardOptions($user);

        // Filter to only include dashboards with valid routes
        $validDashboards = array_filter($availableDashboards, function ($dashboard) {
            return Route::has($dashboard['key']);
        });

        if (empty($validDashboards)) {
            // No valid dashboards - show default
            return [
                'name' => 'Dashboard',
                'path' => '/dashboard',
                'icon' => 'HomeIcon',
                'priority' => 1,
                'children' => [],
            ];
        }

        $dashboardCount = count($validDashboards);

        if ($dashboardCount === 1) {
            // Single dashboard - show as "Dashboard" without children
            $dashboard = reset($validDashboards);

            return [
                'name' => 'Dashboard',
                'path' => $this->getRouteUrl($dashboard['key']),
                'icon' => 'HomeIcon',
                'priority' => 1,
                'access' => $dashboard['key'],
                'children' => [],
            ];
        }

        // Multiple dashboards - show as "Dashboards" with children
        $children = [];
        foreach ($validDashboards as $dashboard) {
            $children[] = [
                'name' => $dashboard['label'],
                'path' => $this->getRouteUrl($dashboard['key']),
                'icon' => $this->getDashboardIcon($dashboard['module']),
                'access' => $dashboard['key'],
                'module' => $dashboard['module'],
            ];
        }

        return [
            'name' => 'Dashboards',
            'path' => '/dashboard', // Default path for parent
            'icon' => 'HomeIcon',
            'priority' => 1,
            'children' => $children,
        ];
    }

    /**
     * Get URL for a route name.
     */
    protected function getRouteUrl(string $routeName): string
    {
        try {
            return route($routeName, [], false); // Get relative URL
        } catch (\Exception $e) {
            return '/dashboard'; // Fallback
        }
    }

    /**
     * Get icon for a dashboard based on module.
     */
    protected function getDashboardIcon(string $module): string
    {
        return match ($module) {
            'core' => 'HomeIcon',
            'hrm' => 'UserGroupIcon',
            'finance' => 'BanknotesIcon',
            'project' => 'ClipboardDocumentListIcon',
            'dms' => 'DocumentDuplicateIcon',
            'quality' => 'BeakerIcon',
            'rfi' => 'ClipboardDocumentCheckIcon',
            'compliance' => 'ShieldCheckIcon',
            'crm' => 'UsersIcon',
            'ims' => 'CubeIcon',
            'pos' => 'ShoppingCartIcon',
            'scm' => 'TruckIcon',
            default => 'Squares2X2Icon',
        };
    }

    /**
     * Clear navigation cache.
     */
    public function clearCache(): void
    {
        try {
            TenantCache::forget(self::CACHE_KEY);
            TenantCache::forget(self::CACHE_KEY.'.frontend');
        } catch (\Throwable $e) {
            // Cache not available (e.g., outside Laravel context)
        }
    }

    /**
     * Get cached navigation for frontend.
     *
     * Note: Dashboard navigation is user-specific (based on permissions),
     * so we cache per-user using their ID as part of the cache key.
     *
     * @param  \Aero\Core\Models\User|null  $user  User for permission-based filtering
     */
    public function getCachedFrontend($user = null): array
    {
        $user = $user ?? Auth::user();
        $userId = $user?->id ?? 'guest';
        $cacheKey = self::CACHE_KEY.'.frontend.'.$userId;

        try {
            return TenantCache::remember(
                $cacheKey,
                self::CACHE_TTL,
                fn () => $this->toFrontend(null, $user)
            );
        } catch (\Throwable $e) {
            // Cache not available, return without caching
            return $this->toFrontend(null, $user);
        }
    }

    /**
     * Unregister a module's navigation (for testing).
     */
    public function unregister(string $moduleCode): void
    {
        unset($this->navigationItems[$moduleCode]);
        unset($this->selfServiceItems[$moduleCode]);
        $this->clearCache();
    }

    /**
     * Clear all registrations (for testing).
     */
    public function clear(): void
    {
        $this->navigationItems = [];
        $this->selfServiceItems = [];
        $this->clearCache();
    }
}
