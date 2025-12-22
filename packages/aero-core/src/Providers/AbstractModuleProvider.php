<?php

namespace Aero\Core\Providers;

use Aero\Core\Contracts\ModuleProviderInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Abstract Module Provider
 *
 * Base class for all module providers. Reads module configuration from
 * config/module.php which serves as the single source of truth.
 * 
 * Child classes only need to:
 * 1. Set $moduleCode property
 * 2. Implement getModulePath() method
 * 3. Override bootModule() for module-specific logic
 * 4. Override registerServices() for module-specific services
 */
abstract class AbstractModuleProvider extends ServiceProvider implements ModuleProviderInterface
{
    /**
     * Module code (unique identifier) - REQUIRED in child class.
     */
    protected string $moduleCode;

    /**
     * Cached module configuration from config/module.php.
     */
    protected ?array $moduleConfig = null;

    /**
     * Get the module configuration from config/module.php.
     * This is the single source of truth for module metadata.
     */
    protected function getModuleConfig(): array
    {
        if ($this->moduleConfig !== null) {
            return $this->moduleConfig;
        }

        // First try to load from merged config
        $configKey = "modules.{$this->moduleCode}";
        $config = config($configKey);
        
        if (is_array($config) && !empty($config)) {
            $this->moduleConfig = $config;
            return $this->moduleConfig;
        }

        // Fallback: load directly from file
        $configPath = $this->getModulePath('config/module.php');
        if (file_exists($configPath)) {
            $this->moduleConfig = require $configPath;
            return $this->moduleConfig;
        }

        // Return empty defaults if no config found
        $this->moduleConfig = [
            'code' => $this->moduleCode,
            'name' => ucfirst($this->moduleCode),
            'description' => '',
            'icon' => 'CubeIcon',
            'category' => 'general',
            'priority' => 100,
            'version' => '1.0.0',
            'dependencies' => [],
            'is_active' => true,
            'min_plan' => null,
            'submodules' => [],
        ];

        return $this->moduleConfig;
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleCode(): string
    {
        return $this->moduleCode;
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleName(): string
    {
        return $this->getModuleConfig()['name'] ?? ucfirst($this->moduleCode);
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleDescription(): string
    {
        return $this->getModuleConfig()['description'] ?? '';
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleVersion(): string
    {
        return $this->getModuleConfig()['version'] ?? '1.0.0';
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleCategory(): string
    {
        return $this->getModuleConfig()['category'] ?? 'general';
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleIcon(): string
    {
        return $this->getModuleConfig()['icon'] ?? 'CubeIcon';
    }

    /**
     * {@inheritDoc}
     */
    public function getModulePriority(): int
    {
        return $this->getModuleConfig()['priority'] ?? 100;
    }

    /**
     * {@inheritDoc}
     * Returns the module hierarchy from config/module.php submodules structure.
     */
    public function getModuleHierarchy(): array
    {
        $config = $this->getModuleConfig();
        
        return [
            'code' => $config['code'] ?? $this->moduleCode,
            'name' => $config['name'] ?? ucfirst($this->moduleCode),
            'description' => $config['description'] ?? '',
            'icon' => $config['icon'] ?? 'CubeIcon',
            'priority' => $config['priority'] ?? 100,
            'is_active' => $config['is_active'] ?? true,
            'requires_subscription' => ($config['min_plan'] ?? null) !== null,
            'route_prefix' => $config['route_prefix'] ?? $this->moduleCode,
            'sub_modules' => $config['submodules'] ?? [],
        ];
    }

    /**
     * {@inheritDoc}
     * Derives navigation items from config/module.php submodules.
     */
    public function getNavigationItems(): array
    {
        $config = $this->getModuleConfig();
        $items = [];

        // Build navigation from submodules in config
        foreach ($config['submodules'] ?? [] as $submodule) {
            $items[] = [
                'code' => $this->moduleCode . '_' . ($submodule['code'] ?? ''),
                'name' => $submodule['name'] ?? '',
                'icon' => $submodule['icon'] ?? 'FolderIcon',
                'route' => $submodule['route'] ?? null,
                'access' => $this->moduleCode . '.' . ($submodule['code'] ?? ''),
                'priority' => $submodule['priority'] ?? 100,
            ];
        }

        return $items;
    }

    /**
     * {@inheritDoc}
     */
    public function getRoutes(): array
    {
        return [];
    }

    /**
     * {@inheritDoc}
     */
    public function getDependencies(): array
    {
        return $this->getModuleConfig()['dependencies'] ?? [];
    }

    /**
     * {@inheritDoc}
     */
    public function isEnabled(): bool
    {
        return $this->getModuleConfig()['is_active'] ?? true;
    }

    /**
     * {@inheritDoc}
     */
    public function getMinimumPlan(): ?string
    {
        return $this->getModuleConfig()['min_plan'] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function register(): void
    {
        try {
            // Merge module configuration into app config
            $configPath = $this->getModulePath('config/module.php');
            if (file_exists($configPath)) {
                $this->mergeConfigFrom($configPath, "modules.{$this->moduleCode}");
            }

            // Register module services
            $this->registerServices();
        } catch (\Throwable $e) {
            // Silently fail during package discovery
        }
    }

    /**
     * {@inheritDoc}
     */
    public function boot(): void
    {
        try {
            // Load migrations
            if ($this->app->runningInConsole()) {
                $migrationsPath = $this->getModulePath('database/migrations');
                if (is_dir($migrationsPath)) {
                    $this->loadMigrationsFrom($migrationsPath);
                }
            }

            // Load routes (override in child class if custom handling needed)
            $this->loadRoutes();

            // Load views
            $viewsPath = $this->getModulePath('resources/views');
            if (is_dir($viewsPath)) {
                $this->loadViewsFrom($viewsPath, $this->moduleCode);
            }

            // Publish assets
            $this->publishAssets();

            // Boot module-specific logic
            $this->bootModule();
        } catch (\Throwable $e) {
            // Silently fail during package discovery
        }
    }

    /**
     * Register module services.
     * Override this method to register module-specific services.
     */
    protected function registerServices(): void
    {
        // Override in child class
    }

    /**
     * Boot module-specific logic.
     * Override this method for module-specific boot logic.
     */
    protected function bootModule(): void
    {
        // Override in child class
    }

    /**
     * Load module routes with proper domain isolation.
     *
     * In SaaS mode (aero-platform active):
     * - Tenant routes use InitializeTenancyIfNotCentral middleware
     * - Admin routes use domain constraints for central domains
     *
     * In Standalone mode:
     * - All routes use standard web middleware
     *
     * Override in child class if custom route handling is needed.
     */
    protected function loadRoutes(): void
    {
        $routesPath = $this->getModulePath('routes');
        $isSaaSMode = $this->isPlatformActive();

        // Load tenant routes (tenant.php takes priority over web.php for tenant-scoped routes)
        if (file_exists($routesPath . '/tenant.php')) {
            if ($isSaaSMode) {
                // SaaS: InitializeTenancyIfNotCentral MUST come BEFORE 'tenant'
                // to gracefully return 404 on central domains instead of crashing
                Route::middleware([
                    'web',
                    \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
                    'tenant',
                ])
                    ->prefix($this->moduleCode)
                    ->name($this->moduleCode . '.')
                    ->group($routesPath . '/tenant.php');
            } else {
                // Standalone: Standard web middleware
                Route::middleware(['web'])
                    ->prefix($this->moduleCode)
                    ->name($this->moduleCode . '.')
                    ->group($routesPath . '/tenant.php');
            }
        }

        // Load web routes (public routes without auth)
        if (file_exists($routesPath . '/web.php')) {
            if ($isSaaSMode) {
                // SaaS: InitializeTenancyIfNotCentral MUST come BEFORE 'tenant'
                // to gracefully return 404 on central domains instead of crashing
                Route::middleware([
                    'web',
                    \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
                    'tenant',
                ])
                    ->prefix($this->moduleCode)
                    ->name($this->moduleCode . '.')
                    ->group($routesPath . '/web.php');
            } else {
                // Standalone: Standard web middleware
                Route::middleware(['web'])
                    ->prefix($this->moduleCode)
                    ->name($this->moduleCode . '.')
                    ->group($routesPath . '/web.php');
            }
        }

        // Load admin routes (landlord/platform routes - only for central domains)
        if (file_exists($routesPath . '/admin.php')) {
            if ($isSaaSMode) {
                // SaaS: Restrict to admin domain
                $adminDomain = env('ADMIN_DOMAIN', 'admin.' . env('PLATFORM_DOMAIN', 'localhost'));
                Route::middleware(['web'])
                    ->domain($adminDomain)
                    ->prefix('admin/' . $this->moduleCode)
                    ->name('admin.' . $this->moduleCode . '.')
                    ->group($routesPath . '/admin.php');
            } else {
                // Standalone: No domain constraint
                Route::middleware(['web'])
                    ->prefix('admin/' . $this->moduleCode)
                    ->name('admin.' . $this->moduleCode . '.')
                    ->group($routesPath . '/admin.php');
            }
        }

        // Load API routes
        if (file_exists($routesPath . '/api.php')) {
            if ($isSaaSMode) {
                // SaaS: InitializeTenancyIfNotCentral MUST come BEFORE 'tenant'
                // to gracefully return 404 on central domains instead of crashing
                Route::middleware([
                    'api',
                    \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class,
                    'tenant',
                ])
                    ->prefix('api/' . $this->moduleCode)
                    ->name('api.' . $this->moduleCode . '.')
                    ->group($routesPath . '/api.php');
            } else {
                // Standalone: Standard API middleware
                Route::middleware(['api'])
                    ->prefix('api/' . $this->moduleCode)
                    ->name('api.' . $this->moduleCode . '.')
                    ->group($routesPath . '/api.php');
            }
        }
    }

    /**
     * Check if aero-platform is active (SaaS mode).
     */
    protected function isPlatformActive(): bool
    {
        return class_exists(\Aero\Platform\AeroPlatformServiceProvider::class);
    }

    /**
     * Publish module assets.
     */
    protected function publishAssets(): void
    {
        if (!$this->app->runningInConsole()) {
            return;
        }

        $moduleCode = $this->moduleCode;

        // Publish configuration
        $configPath = $this->getModulePath('config/module.php');
        if (file_exists($configPath)) {
            $this->publishes([
                $configPath => config_path("modules/{$moduleCode}.php"),
            ], "{$moduleCode}-config");
        }

        // Publish migrations
        $migrationsPath = $this->getModulePath('database/migrations');
        if (is_dir($migrationsPath)) {
            $this->publishes([
                $migrationsPath => database_path('migrations'),
            ], "{$moduleCode}-migrations");
        }

        // Publish views
        $viewsPath = $this->getModulePath('resources/views');
        if (is_dir($viewsPath)) {
            $this->publishes([
                $viewsPath => resource_path("views/vendor/{$moduleCode}"),
            ], "{$moduleCode}-views");
        }

        // Publish frontend assets
        $jsPath = $this->getModulePath('resources/js');
        if (is_dir($jsPath)) {
            $this->publishes([
                $jsPath => resource_path("js/modules/{$moduleCode}"),
            ], "{$moduleCode}-assets");
        }
    }

    /**
     * Get the full path to a module file or directory.
     * Child classes must implement this to resolve paths correctly.
     */
    abstract protected function getModulePath(string $path = ''): string;
}
