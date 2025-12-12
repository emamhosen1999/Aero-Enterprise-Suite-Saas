<?php

namespace Aero\Core\Services;

use Illuminate\Support\Facades\Cache;

/**
 * Navigation Registry Service
 *
 * Central registry for module navigation items.
 * Modules register their navigation, and core aggregates them.
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
     */
    public function register(string $moduleCode, array $items, int $priority = 100): void
    {
        $this->navigationItems[$moduleCode] = [
            'module' => $moduleCode,
            'priority' => $priority,
            'items' => $items,
        ];

        // Clear cache when navigation changes
        $this->clearCache();
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
     * Core module: submodules are promoted to top level (Dashboard, Users, Roles, Settings)
     * Other modules: wrapped under module name (Human Resources → Employees, Attendance, etc.)
     * 
     * Structure for non-core: [{ name: "Human Resources", children: [submodules...] }]
     */
    public function toFrontend(): array
    {
        $navigationItems = [];
        
        $sortedModules = collect($this->navigationItems)->sortBy('priority');
        
        foreach ($sortedModules as $moduleCode => $moduleData) {
            foreach ($moduleData['items'] as $item) {
                // Core module: flatten children (submodules) to top level
                if ($moduleCode === 'core') {
                    if (!empty($item['children'])) {
                        foreach ($item['children'] as $child) {
                            $navigationItems[] = $child;
                        }
                    } else {
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
     * Clear navigation cache.
     */
    public function clearCache(): void
    {
        try {
            Cache::forget(self::CACHE_KEY);
            Cache::forget(self::CACHE_KEY.'.frontend');
        } catch (\Throwable $e) {
            // Cache not available (e.g., outside Laravel context)
        }
    }

    /**
     * Get cached navigation for frontend.
     */
    public function getCachedFrontend(): array
    {
        try {
            return Cache::remember(
                self::CACHE_KEY.'.frontend',
                self::CACHE_TTL,
                fn () => $this->toFrontend()
            );
        } catch (\Throwable $e) {
            // Cache not available, return without caching
            return $this->toFrontend();
        }
    }

    /**
     * Unregister a module's navigation (for testing).
     */
    public function unregister(string $moduleCode): void
    {
        unset($this->navigationItems[$moduleCode]);
        $this->clearCache();
    }

    /**
     * Clear all registrations (for testing).
     */
    public function clear(): void
    {
        $this->navigationItems = [];
        $this->clearCache();
    }
}
