<?php

/**
 * Helper Functions for Aero Module System
 * 
 * These functions provide runtime support for the module system,
 * bridging SaaS and Standalone modes.
 */

use Aero\Core\Services\RuntimeLoader;
use Illuminate\Support\Facades\File;

if (!function_exists('getRuntimeModules')) {
    /**
     * Get all runtime-loaded modules for injection into Blade templates.
     *
     * @return array
     */
    function getRuntimeModules(): array
    {
        // Only in standalone mode
        if (config('aero.mode') !== 'standalone') {
            return [];
        }

        $modules = [];
        $modulesPath = base_path('modules');

        if (!File::isDirectory($modulesPath)) {
            return [];
        }

        $directories = File::directories($modulesPath);

        foreach ($directories as $directory) {
            $moduleName = basename($directory);
            $distPath = $directory . '/dist';

            // Check if module has built assets
            if (File::isDirectory($distPath)) {
                $moduleConfig = [
                    'name' => $moduleName,
                    'path' => $directory,
                ];

                // Look for JS bundle
                $jsFiles = [
                    "modules/{$moduleName}/dist/{$moduleName}.umd.js",
                    "modules/{$moduleName}/dist/{$moduleName}.js",
                ];

                foreach ($jsFiles as $jsFile) {
                    if (File::exists(public_path($jsFile))) {
                        $moduleConfig['js'] = $jsFile;
                        break;
                    }
                }

                // Look for CSS bundle
                $cssFiles = [
                    "modules/{$moduleName}/dist/{$moduleName}.css",
                    "modules/{$moduleName}/dist/style.css",
                ];

                foreach ($cssFiles as $cssFile) {
                    if (File::exists(public_path($cssFile))) {
                        $moduleConfig['css'] = $cssFile;
                        break;
                    }
                }

                if (isset($moduleConfig['js'])) {
                    $modules[] = $moduleConfig;
                }
            }
        }

        return $modules;
    }
}

if (!function_exists('isModuleActive')) {
    /**
     * Check if a module is active in the current environment.
     *
     * @param  string  $moduleName
     * @return bool
     */
    function isModuleActive(string $moduleName): bool
    {
        // In SaaS mode, check Composer packages
        if (config('aero.mode') === 'saas') {
            return class_exists("Aero\\{$moduleName}\\ServiceProvider") ||
                   class_exists("Aero\\{$moduleName}\\Aero{$moduleName}ServiceProvider");
        }

        // In Standalone mode, check runtime loader
        $loader = app(RuntimeLoader::class);
        return $loader->isModuleLoaded(strtolower($moduleName));
    }
}

if (!function_exists('getActiveModules')) {
    /**
     * Get all active modules in the current environment.
     *
     * @return array
     */
    function getActiveModules(): array
    {
        if (config('aero.mode') === 'saas') {
            // In SaaS mode, modules are composer packages
            return config('modules.installed', []);
        }

        // In Standalone mode, get from runtime loader
        $loader = app(RuntimeLoader::class);
        return array_keys($loader->getLoadedModules());
    }
}

if (!function_exists('isPlatformActive')) {
    /**
     * Check if aero-platform is active (determines SaaS vs Standalone).
     *
     * @return bool
     */
    function isPlatformActive(): bool
    {
        return class_exists('Aero\Platform\AeroPlatformServiceProvider') ||
               config('platform.enabled', false);
    }
}

if (!function_exists('getTenantId')) {
    /**
     * Get the current tenant ID (works in both modes).
     *
     * @return int|string|null
     */
    function getTenantId(): int|string|null
    {
        // Try stancl/tenancy first
        if (function_exists('tenant')) {
            try {
                $tenant = tenant();
                return $tenant?->getTenantKey();
            } catch (\Throwable $e) {
                // Ignore
            }
        }

        // Try session
        if (session()->has('tenant_id')) {
            return session('tenant_id');
        }

        // Standalone default
        if (config('aero.mode') === 'standalone') {
            return config('aero.standalone_tenant_id', 1);
        }

        return null;
    }
}

if (!function_exists('moduleAsset')) {
    /**
     * Generate URL to a module asset.
     *
     * @param  string  $moduleName
     * @param  string  $path
     * @return string
     */
    function moduleAsset(string $moduleName, string $path): string
    {
        $normalizedPath = ltrim($path, '/');

        if (config('aero.mode') === 'standalone') {
            return asset("modules/{$moduleName}/{$normalizedPath}");
        }

        // In SaaS mode, assets are in public/vendor/{module}
        return asset("vendor/{$moduleName}/{$normalizedPath}");
    }
}

if (!function_exists('moduleRoute')) {
    /**
     * Generate a route URL for a module.
     *
     * @param  string  $name
     * @param  array  $parameters
     * @param  bool  $absolute
     * @return string
     */
    function moduleRoute(string $name, array $parameters = [], bool $absolute = true): string
    {
        // In SaaS mode with tenancy, routes may be tenant-scoped
        if (isPlatformActive() && function_exists('tenant')) {
            try {
                $tenant = tenant();
                if ($tenant) {
                    return route($name, $parameters, $absolute);
                }
            } catch (\Throwable $e) {
                // Continue to standard route generation
            }
        }

        return route($name, $parameters, $absolute);
    }
}
