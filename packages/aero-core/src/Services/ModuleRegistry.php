<?php

namespace Aero\Core\Services;

use Aero\Core\Contracts\ModuleProviderInterface;
use Illuminate\Support\Collection;
use Aero\Core\Support\TenantCache;

/**
 * Module Registry Service
 *
 * Central registry for discovering, registering, and managing modules.
 * Provides dynamic module loading and metadata management.
 */
class ModuleRegistry
{
    /**
     * Registered module providers.
     *
     * @var Collection<string, ModuleProviderInterface>
     */
    protected Collection $modules;

    /**
     * Cache key for module metadata.
     */
    protected const CACHE_KEY = 'aero.modules.registry';

    /**
     * Cache TTL in seconds (1 hour).
     */
    protected const CACHE_TTL = 3600;

    /**
     * Create a new Module Registry instance.
     */
    public function __construct()
    {
        $this->modules = collect();
    }

    /**
     * Register a module provider.
     *
     * @param ModuleProviderInterface $provider
     * @return void
     */
    public function register(ModuleProviderInterface $provider): void
    {
        $moduleCode = $provider->getModuleCode();
        
        if ($this->modules->has($moduleCode)) {
            throw new \RuntimeException("Module '{$moduleCode}' is already registered.");
        }

        $this->modules->put($moduleCode, $provider);
        
        // Clear cache when new module is registered
        $this->clearCache();
    }

    /**
     * Get a registered module by code.
     *
     * @param string $moduleCode
     * @return ModuleProviderInterface|null
     */
    public function get(string $moduleCode): ?ModuleProviderInterface
    {
        return $this->modules->get($moduleCode);
    }

    /**
     * Get all registered modules.
     *
     * @return Collection<string, ModuleProviderInterface>
     */
    public function all(): Collection
    {
        return $this->modules;
    }

    /**
     * Get all enabled modules.
     *
     * @return Collection<string, ModuleProviderInterface>
     */
    public function enabled(): Collection
    {
        return $this->modules->filter(function (ModuleProviderInterface $provider) {
            return $provider->isEnabled();
        });
    }

    /**
     * Check if a module is registered.
     *
     * @param string $moduleCode
     * @return bool
     */
    public function has(string $moduleCode): bool
    {
        return $this->modules->has($moduleCode);
    }

    /**
     * Check if a module is enabled.
     *
     * @param string $moduleCode
     * @return bool
     */
    public function isEnabled(string $moduleCode): bool
    {
        $module = $this->get($moduleCode);
        return $module && $module->isEnabled();
    }

    /**
     * Get modules by category.
     *
     * @param string $category
     * @return Collection<string, ModuleProviderInterface>
     */
    public function byCategory(string $category): Collection
    {
        return $this->modules->filter(function (ModuleProviderInterface $provider) use ($category) {
            return $provider->getModuleCategory() === $category;
        });
    }

    /**
     * Get modules sorted by priority.
     *
     * @return Collection<string, ModuleProviderInterface>
     */
    public function sortedByPriority(): Collection
    {
        return $this->modules->sortBy(function (ModuleProviderInterface $provider) {
            return $provider->getModulePriority();
        });
    }

    /**
     * Get navigation items for all enabled modules.
     *
     * @return array
     */
    public function getNavigationItems(): array
    {
        try {
            return TenantCache::remember(
                self::CACHE_KEY . '.navigation',
                self::CACHE_TTL,
                function () {
                    return $this->enabled()
                        ->sortBy(function (ModuleProviderInterface $provider) {
                            return $provider->getModulePriority();
                        })
                        ->flatMap(function (ModuleProviderInterface $provider) {
                            return $provider->getNavigationItems();
                        })
                        ->values()
                        ->toArray();
                }
            );
        } catch (\Throwable $e) {
            // Cache not available during early boot, compute without caching
            return $this->enabled()
                ->sortBy(function (ModuleProviderInterface $provider) {
                    return $provider->getModulePriority();
                })
                ->flatMap(function (ModuleProviderInterface $provider) {
                    return $provider->getNavigationItems();
                })
                ->values()
                ->toArray();
        }
    }

    /**
     * Get module hierarchy for all enabled modules.
     *
     * @return array
     */
    public function getModuleHierarchy(): array
    {
        try {
            return TenantCache::remember(
                self::CACHE_KEY . '.hierarchy',
                self::CACHE_TTL,
                function () {
                    return $this->enabled()
                        ->sortBy(function (ModuleProviderInterface $provider) {
                            return $provider->getModulePriority();
                        })
                        ->map(function (ModuleProviderInterface $provider) {
                            return [
                                'code' => $provider->getModuleCode(),
                                'name' => $provider->getModuleName(),
                                'description' => $provider->getModuleDescription(),
                                'version' => $provider->getModuleVersion(),
                                'category' => $provider->getModuleCategory(),
                                'icon' => $provider->getModuleIcon(),
                                'priority' => $provider->getModulePriority(),
                                'hierarchy' => $provider->getModuleHierarchy(),
                                'min_plan' => $provider->getMinimumPlan(),
                            ];
                        })
                        ->values()
                        ->toArray();
                }
            );
        } catch (\Throwable $e) {
            // Cache not available during early boot, compute without caching
            return $this->enabled()
                ->sortBy(function (ModuleProviderInterface $provider) {
                    return $provider->getModulePriority();
                })
                ->map(function (ModuleProviderInterface $provider) {
                    return [
                        'code' => $provider->getModuleCode(),
                        'name' => $provider->getModuleName(),
                        'description' => $provider->getModuleDescription(),
                        'version' => $provider->getModuleVersion(),
                        'category' => $provider->getModuleCategory(),
                        'icon' => $provider->getModuleIcon(),
                        'priority' => $provider->getModulePriority(),
                        'hierarchy' => $provider->getModuleHierarchy(),
                        'min_plan' => $provider->getMinimumPlan(),
                    ];
                })
                ->values()
                ->toArray();
        }
    }

    /**
     * Get routes for all enabled modules.
     *
     * @return array
     */
    public function getRoutes(): array
    {
        return $this->enabled()
            ->flatMap(function (ModuleProviderInterface $provider) {
                return $provider->getRoutes();
            })
            ->toArray();
    }

    /**
     * Validate module dependencies.
     *
     * @param string $moduleCode
     * @return bool
     * @throws \RuntimeException
     */
    public function validateDependencies(string $moduleCode): bool
    {
        $module = $this->get($moduleCode);
        
        if (!$module) {
            throw new \RuntimeException("Module '{$moduleCode}' not found.");
        }

        $dependencies = $module->getDependencies();
        
        foreach ($dependencies as $dependency) {
            if (!$this->has($dependency)) {
                throw new \RuntimeException(
                    "Module '{$moduleCode}' requires '{$dependency}' which is not registered."
                );
            }
            
            if (!$this->isEnabled($dependency)) {
                throw new \RuntimeException(
                    "Module '{$moduleCode}' requires '{$dependency}' which is not enabled."
                );
            }
        }
        
        return true;
    }

    /**
     * Get module metadata.
     *
     * @param string $moduleCode
     * @return array|null
     */
    public function getMetadata(string $moduleCode): ?array
    {
        $module = $this->get($moduleCode);
        
        if (!$module) {
            return null;
        }

        return [
            'code' => $module->getModuleCode(),
            'name' => $module->getModuleName(),
            'description' => $module->getModuleDescription(),
            'version' => $module->getModuleVersion(),
            'category' => $module->getModuleCategory(),
            'icon' => $module->getModuleIcon(),
            'priority' => $module->getModulePriority(),
            'enabled' => $module->isEnabled(),
            'min_plan' => $module->getMinimumPlan(),
            'dependencies' => $module->getDependencies(),
        ];
    }

    /**
     * Get all module metadata.
     *
     * @return array
     */
    public function getAllMetadata(): array
    {
        return $this->modules
            ->map(function (ModuleProviderInterface $provider) {
                return $this->getMetadata($provider->getModuleCode());
            })
            ->values()
            ->toArray();
    }

    /**
     * Clear the module cache.
     *
     * @return void
     */
    public function clearCache(): void
    {
        try {
            TenantCache::forget(self::CACHE_KEY . '.navigation');
            TenantCache::forget(self::CACHE_KEY . '.hierarchy');
        } catch (\Throwable $e) {
            // Cache not available during early boot, ignore
        }
    }

    /**
     * Boot all registered modules.
     *
     * @return void
     */
    public function bootAll(): void
    {
        $this->modules->each(function (ModuleProviderInterface $provider) {
            if ($provider->isEnabled()) {
                // Validate dependencies before booting
                $this->validateDependencies($provider->getModuleCode());
                
                // Boot the module
                $provider->boot();
            }
        });
    }

    /**
     * Count registered modules.
     *
     * @return int
     */
    public function count(): int
    {
        return $this->modules->count();
    }

    /**
     * Count enabled modules.
     *
     * @return int
     */
    public function countEnabled(): int
    {
        return $this->enabled()->count();
    }
}
