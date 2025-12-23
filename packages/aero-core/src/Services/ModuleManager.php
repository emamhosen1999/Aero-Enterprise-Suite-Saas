<?php

namespace Aero\Core\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Aero\Core\Support\TenantCache;

/**
 * ModuleManager
 * 
 * Manages module discovery, registration, and provides access to module metadata.
 * Works in both SaaS (Composer-installed) and Standalone (Runtime-loaded) modes.
 * 
 * This service:
 * - Scans for module.json files
 * - Provides module information to Blade templates
 * - Manages module activation state
 * - Caches module registry for performance
 */
class ModuleManager
{
    /**
     * Modules directory path.
     *
     * @var string
     */
    protected string $modulesPath;

    /**
     * Packages directory path (for Composer mode).
     *
     * @var string
     */
    protected string $packagesPath;

    /**
     * Cache key for module registry.
     *
     * @var string
     */
    protected string $cacheKey = 'aero_modules_registry';

    /**
     * Cache TTL in seconds.
     *
     * @var int
     */
    protected int $cacheTtl = 3600; // 1 hour

    /**
     * Create a new ModuleManager instance.
     *
     * @param  string|null  $modulesPath
     * @param  string|null  $packagesPath
     * @return void
     */
    public function __construct(?string $modulesPath = null, ?string $packagesPath = null)
    {
        $this->modulesPath = $modulesPath ?? base_path('modules');
        $this->packagesPath = $packagesPath ?? base_path('packages');
    }

    /**
     * Get all active modules for frontend injection.
     *
     * @return array
     */
    public function active(): array
    {
        // Guard against early execution before cache is available
        try {
            return TenantCache::remember($this->cacheKey, $this->cacheTtl, function () {
                return $this->discoverModules();
            });
        } catch (\Throwable $e) {
            // Cache not available during early boot, skip caching
            return $this->discoverModules();
        }
    }

    /**
     * Get all modules (active and inactive).
     *
     * @return array
     */
    public function all(): array
    {
        return $this->active(); // For now, all discovered modules are active
    }

    /**
     * Discover modules from both runtime and packages directories.
     *
     * @return array
     */
    protected function discoverModules(): array
    {
        $modules = [];

        // 1. Check runtime modules directory (Standalone mode)
        if (File::isDirectory($this->modulesPath)) {
            $modules = array_merge($modules, $this->scanDirectory($this->modulesPath, 'runtime'));
        }

        // 2. Check packages directory (SaaS/Development mode)
        if (File::isDirectory($this->packagesPath)) {
            $modules = array_merge($modules, $this->scanDirectory($this->packagesPath, 'composer'));
        }

        // 3. Remove duplicates (prefer runtime over composer)
        $uniqueModules = [];
        foreach ($modules as $module) {
            $shortName = $module['short_name'];
            if (!isset($uniqueModules[$shortName])) {
                $uniqueModules[$shortName] = $module;
            }
        }

        return array_values($uniqueModules);
    }

    /**
     * Scan a directory for module.json files.
     *
     * @param  string  $directory
     * @param  string  $source
     * @return array
     */
    protected function scanDirectory(string $directory, string $source): array
    {
        $modules = [];
        $directories = File::directories($directory);

        foreach ($directories as $dir) {
            $moduleJsonPath = $dir . '/module.json';

            if (File::exists($moduleJsonPath)) {
                try {
                    $config = json_decode(File::get($moduleJsonPath), true);

                    if (json_last_error() === JSON_ERROR_NONE && $this->isValidModuleConfig($config)) {
                        $modules[] = $this->normalizeModuleConfig($config, $dir, $source);
                    }
                } catch (\Throwable $e) {
                    Log::warning("ModuleManager: Error reading {$moduleJsonPath}: {$e->getMessage()}");
                }
            }
        }

        return $modules;
    }

    /**
     * Validate module configuration.
     *
     * @param  array  $config
     * @return bool
     */
    protected function isValidModuleConfig(array $config): bool
    {
        return isset($config['name']) &&
               isset($config['short_name']) &&
               isset($config['namespace']);
    }

    /**
     * Normalize module configuration for template use.
     *
     * @param  array  $config
     * @param  string  $path
     * @param  string  $source
     * @return array
     */
    protected function normalizeModuleConfig(array $config, string $path, string $source): array
    {
        $shortName = $config['short_name'];
        $moduleName = basename($path); // e.g., 'aero-hrm'

        // Determine asset paths based on source
        $jsPath = $source === 'runtime'
            ? "modules/{$moduleName}/dist/{$shortName}.js"
            : "build/modules/{$moduleName}/dist/{$shortName}.js";

        $cssPath = $source === 'runtime'
            ? "modules/{$moduleName}/dist/{$shortName}.css"
            : "build/modules/{$moduleName}/dist/{$shortName}.css";

        return [
            'name' => $moduleName,                    // 'aero-hrm'
            'display_name' => $config['name'],        // 'Aero HRM'
            'short_name' => $shortName,               // 'hrm'
            'namespace' => $config['namespace'],      // 'Aero\Hrm'
            'version' => $config['version'] ?? '1.0.0',
            'source' => $source,                      // 'runtime' or 'composer'
            'path' => $path,
            'enabled' => $config['config']['enabled'] ?? true,
            'assets' => [
                'js' => $jsPath,
                'css' => $cssPath,
            ],
            'js' => $jsPath,   // Backward compatibility
            'css' => $cssPath, // Backward compatibility
            'providers' => $config['providers'] ?? [],
            'permissions' => $config['permissions'] ?? [],
            'config' => $config['config'] ?? [],
        ];
    }

    /**
     * Get a specific module by name.
     *
     * @param  string  $name
     * @return array|null
     */
    public function get(string $name): ?array
    {
        $modules = $this->all();

        foreach ($modules as $module) {
            if ($module['name'] === $name || $module['short_name'] === $name) {
                return $module;
            }
        }

        return null;
    }

    /**
     * Check if a module is enabled.
     *
     * @param  string  $name
     * @return bool
     */
    public function isEnabled(string $name): bool
    {
        $module = $this->get($name);

        if (!$module) {
            return false;
        }

        // Check if explicitly disabled in database settings (future enhancement)
        // For now, check config flag
        return $module['enabled'] ?? true;
    }

    /**
     * Get modules that should be injected in Blade (Standalone mode).
     *
     * @return array
     */
    public function getInjectableModules(): array
    {
        $mode = aero_mode() ?? 'standalone';

        if ($mode !== 'standalone') {
            return [];
        }

        return array_filter($this->active(), function ($module) {
            return $module['source'] === 'runtime' && 
                   $module['enabled'] &&
                   isset($module['assets']['js']) &&
                   $this->assetExists($module['assets']['js']);
        });
    }

    /**
     * Check if an asset file exists.
     *
     * @param  string  $path
     * @return bool
     */
    protected function assetExists(string $path): bool
    {
        return File::exists(public_path($path));
    }

    /**
     * Clear module registry cache.
     *
     * @return void
     */
    public function clearCache(): void
    {
        try {
            TenantCache::forget($this->cacheKey);
        } catch (\Throwable $e) {
            // Cache not available, nothing to clear
        }
    }

    /**
     * Get module count.
     *
     * @return int
     */
    public function count(): int
    {
        return count($this->all());
    }

    /**
     * Get enabled module count.
     *
     * @return int
     */
    public function enabledCount(): int
    {
        return count(array_filter($this->all(), fn($m) => $m['enabled']));
    }

    /**
     * Get modules by source.
     *
     * @param  string  $source  'runtime' or 'composer'
     * @return array
     */
    public function bySource(string $source): array
    {
        return array_filter($this->all(), fn($m) => $m['source'] === $source);
    }

    /**
     * Check if module has required assets.
     *
     * @param  string  $name
     * @return bool
     */
    public function hasAssets(string $name): bool
    {
        $module = $this->get($name);

        if (!$module) {
            return false;
        }

        return isset($module['assets']['js']) && 
               $this->assetExists($module['assets']['js']);
    }
}
