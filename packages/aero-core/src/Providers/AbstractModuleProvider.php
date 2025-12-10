<?php

namespace Aero\Core\Providers;

use Aero\Core\Contracts\ModuleProviderInterface;
use Illuminate\Support\ServiceProvider;

/**
 * Abstract Module Provider
 *
 * Base class for all module providers. Provides common functionality
 * and sensible defaults for module registration.
 */
abstract class AbstractModuleProvider extends ServiceProvider implements ModuleProviderInterface
{
    /**
     * Module code (unique identifier).
     */
    protected string $moduleCode;

    /**
     * Module display name.
     */
    protected string $moduleName;

    /**
     * Module description.
     */
    protected string $moduleDescription;

    /**
     * Module version.
     */
    protected string $moduleVersion = '1.0.0';

    /**
     * Module category.
     */
    protected string $moduleCategory;

    /**
     * Module icon (HeroIcon name).
     */
    protected string $moduleIcon;

    /**
     * Module priority for navigation ordering.
     */
    protected int $modulePriority = 100;

    /**
     * Module hierarchy (submodules, components, actions).
     */
    protected array $moduleHierarchy = [];

    /**
     * Module navigation items.
     */
    protected array $navigationItems = [];

    /**
     * Module route definitions.
     */
    protected array $routes = [];

    /**
     * Module dependencies.
     */
    protected array $dependencies = [];

    /**
     * Whether the module is enabled.
     */
    protected bool $enabled = true;

    /**
     * Minimum plan required for this module.
     */
    protected ?string $minimumPlan = null;

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
        return $this->moduleName;
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleDescription(): string
    {
        return $this->moduleDescription;
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleVersion(): string
    {
        return $this->moduleVersion;
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleCategory(): string
    {
        return $this->moduleCategory;
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleIcon(): string
    {
        return $this->moduleIcon;
    }

    /**
     * {@inheritDoc}
     */
    public function getModulePriority(): int
    {
        return $this->modulePriority;
    }

    /**
     * {@inheritDoc}
     */
    public function getModuleHierarchy(): array
    {
        return $this->moduleHierarchy;
    }

    /**
     * {@inheritDoc}
     */
    public function getNavigationItems(): array
    {
        return $this->navigationItems;
    }

    /**
     * {@inheritDoc}
     */
    public function getRoutes(): array
    {
        return $this->routes;
    }

    /**
     * {@inheritDoc}
     */
    public function getDependencies(): array
    {
        return $this->dependencies;
    }

    /**
     * {@inheritDoc}
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * {@inheritDoc}
     */
    public function getMinimumPlan(): ?string
    {
        return $this->minimumPlan;
    }

    /**
     * {@inheritDoc}
     */
    public function register(): void
    {
        // Load module configuration
        $this->mergeConfigFrom(
            $this->getModulePath('config/module.php'),
            "modules.{$this->moduleCode}"
        );

        // Register module services
        $this->registerServices();
    }

    /**
     * {@inheritDoc}
     */
    public function boot(): void
    {
        // Load migrations
        if ($this->app->runningInConsole()) {
            $this->loadMigrationsFrom($this->getModulePath('database/migrations'));
        }

        // Load routes
        $this->loadRoutes();

        // Load views
        $this->loadViewsFrom(
            $this->getModulePath('resources/views'),
            $this->moduleCode
        );

        // Publish assets
        $this->publishAssets();

        // Boot module-specific logic
        $this->bootModule();
    }

    /**
     * Register module services.
     *
     * Override this method to register module-specific services.
     *
     * @return void
     */
    protected function registerServices(): void
    {
        // Override in child class
    }

    /**
     * Boot module-specific logic.
     *
     * Override this method for module-specific boot logic.
     *
     * @return void
     */
    protected function bootModule(): void
    {
        // Override in child class
    }

    /**
     * Load module routes.
     *
     * @return void
     */
    protected function loadRoutes(): void
    {
        // Load admin routes
        if (file_exists($this->getModulePath('routes/admin.php'))) {
            $this->loadRoutesFrom($this->getModulePath('routes/admin.php'));
        }

        // Load tenant routes
        if (file_exists($this->getModulePath('routes/tenant.php'))) {
            $this->loadRoutesFrom($this->getModulePath('routes/tenant.php'));
        }

        // Load web routes
        if (file_exists($this->getModulePath('routes/web.php'))) {
            $this->loadRoutesFrom($this->getModulePath('routes/web.php'));
        }

        // Load API routes
        if (file_exists($this->getModulePath('routes/api.php'))) {
            $this->loadRoutesFrom($this->getModulePath('routes/api.php'));
        }
    }

    /**
     * Publish module assets.
     *
     * @return void
     */
    protected function publishAssets(): void
    {
        if (!$this->app->runningInConsole()) {
            return;
        }

        $moduleCode = $this->moduleCode;

        // Publish configuration
        $this->publishes([
            $this->getModulePath('config/module.php') => config_path("modules/{$moduleCode}.php"),
        ], "{$moduleCode}-config");

        // Publish migrations
        $this->publishes([
            $this->getModulePath('database/migrations') => database_path('migrations'),
        ], "{$moduleCode}-migrations");

        // Publish views
        $this->publishes([
            $this->getModulePath('resources/views') => resource_path("views/vendor/{$moduleCode}"),
        ], "{$moduleCode}-views");

        // Publish frontend assets
        if (is_dir($this->getModulePath('resources/js'))) {
            $this->publishes([
                $this->getModulePath('resources/js') => resource_path("js/modules/{$moduleCode}"),
            ], "{$moduleCode}-assets");
        }
    }

    /**
     * Get the full path to a module file or directory.
     *
     * @param string $path
     * @return string
     */
    abstract protected function getModulePath(string $path = ''): string;
}
