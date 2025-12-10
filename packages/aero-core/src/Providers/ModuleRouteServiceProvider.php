<?php

namespace Aero\Core\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

/**
 * ModuleRouteServiceProvider
 * 
 * Context-aware route provider that registers module routes based on the runtime environment:
 * - SaaS Mode: Routes are registered with tenant middleware (subdomain-based)
 * - Standalone Mode: Routes are registered with web middleware (root domain)
 * 
 * This provider automatically detects the presence of aero-platform and adjusts
 * route registration strategy accordingly.
 */
class ModuleRouteServiceProvider extends ServiceProvider
{
    /**
     * The modules to register routes for.
     *
     * @var array
     */
    protected array $modules = [];

    /**
     * Create a new service provider instance.
     *
     * @param  \Illuminate\Contracts\Foundation\Application  $app
     * @return void
     */
    public function __construct($app)
    {
        parent::__construct($app);
        
        // Auto-discover modules
        $this->discoverModules();
    }

    /**
     * Define your route model bindings, pattern filters, etc.
     *
     * @return void
     */
    public function boot(): void
    {
        parent::boot();

        $this->registerModuleRoutes();
    }

    /**
     * Discover available modules from packages directory.
     *
     * @return void
     */
    protected function discoverModules(): void
    {
        $packagesPath = base_path('packages');
        
        if (!File::isDirectory($packagesPath)) {
            return;
        }

        $directories = File::directories($packagesPath);

        foreach ($directories as $directory) {
            $moduleName = basename($directory);
            
            // Check if module has routes directory
            $routesPath = $directory . '/routes';
            
            if (File::isDirectory($routesPath)) {
                $this->modules[$moduleName] = [
                    'path' => $directory,
                    'routes_path' => $routesPath,
                    'namespace' => $this->getModuleNamespace($moduleName),
                ];
            }
        }
    }

    /**
     * Get the namespace for a module.
     *
     * @param  string  $moduleName
     * @return string
     */
    protected function getModuleNamespace(string $moduleName): string
    {
        // Convert aero-hrm to Aero\Hrm
        $parts = explode('-', $moduleName);
        $namespace = implode('\\', array_map('ucfirst', $parts));
        
        return $namespace . '\\Http\\Controllers';
    }

    /**
     * Register routes for all discovered modules.
     *
     * @return void
     */
    protected function registerModuleRoutes(): void
    {
        foreach ($this->modules as $moduleName => $moduleData) {
            $this->registerRoutesForModule($moduleName, $moduleData);
        }
    }

    /**
     * Register routes for a specific module.
     *
     * @param  string  $moduleName
     * @param  array  $moduleData
     * @return void
     */
    protected function registerRoutesForModule(string $moduleName, array $moduleData): void
    {
        $routesPath = $moduleData['routes_path'];
        $namespace = $moduleData['namespace'];

        // Determine routing strategy based on platform presence
        if ($this->isPlatformActive()) {
            $this->registerSaaSRoutes($moduleName, $routesPath, $namespace);
        } else {
            $this->registerStandaloneRoutes($moduleName, $routesPath, $namespace);
        }
    }

    /**
     * Register routes for SaaS mode (with tenant middleware).
     *
     * @param  string  $moduleName
     * @param  string  $routesPath
     * @param  string  $namespace
     * @return void
     */
    protected function registerSaaSRoutes(string $moduleName, string $routesPath, string $namespace): void
    {
        // Register tenant routes (subdomain-based)
        if (File::exists($routesPath . '/tenant.php')) {
            Route::middleware(['web', 'tenant', 'auth', 'verified'])
                ->namespace($namespace)
                ->group($routesPath . '/tenant.php');
        }

        // Register web routes (for tenant routes without auth requirement)
        if (File::exists($routesPath . '/web.php')) {
            Route::middleware(['web', 'tenant'])
                ->namespace($namespace)
                ->group($routesPath . '/web.php');
        }

        // Register landlord routes (central domain routes)
        if (File::exists($routesPath . '/landlord.php')) {
            Route::middleware(['web', 'landlord'])
                ->domain(config('tenancy.central_domains')[0] ?? null)
                ->namespace($namespace)
                ->group($routesPath . '/landlord.php');
        }

        // Register API routes (tenant-scoped)
        if (File::exists($routesPath . '/api.php')) {
            Route::middleware(['api', 'tenant', 'auth:sanctum'])
                ->prefix('api')
                ->namespace($namespace)
                ->group($routesPath . '/api.php');
        }
    }

    /**
     * Register routes for Standalone mode (without tenant middleware).
     *
     * @param  string  $moduleName
     * @param  string  $routesPath
     * @param  string  $namespace
     * @return void
     */
    protected function registerStandaloneRoutes(string $moduleName, string $routesPath, string $namespace): void
    {
        // In standalone mode, all routes go through standard web middleware
        
        // Register authenticated routes
        if (File::exists($routesPath . '/tenant.php')) {
            Route::middleware(['web', 'auth', 'verified'])
                ->namespace($namespace)
                ->group($routesPath . '/tenant.php');
        }

        // Register web routes
        if (File::exists($routesPath . '/web.php')) {
            Route::middleware(['web'])
                ->namespace($namespace)
                ->group($routesPath . '/web.php');
        }

        // In standalone, no landlord routes needed
        // But if they exist, register them as regular web routes
        if (File::exists($routesPath . '/landlord.php')) {
            Route::middleware(['web', 'auth'])
                ->namespace($namespace)
                ->group($routesPath . '/landlord.php');
        }

        // Register API routes
        if (File::exists($routesPath . '/api.php')) {
            Route::middleware(['api', 'auth:sanctum'])
                ->prefix('api')
                ->namespace($namespace)
                ->group($routesPath . '/api.php');
        }
    }

    /**
     * Determine if aero-platform is active.
     *
     * @return bool
     */
    protected function isPlatformActive(): bool
    {
        // Method 1: Check if platform service provider is registered
        if (class_exists('Aero\Platform\AeroPlatformServiceProvider')) {
            return true;
        }

        // Method 2: Check configuration
        if (config('platform.enabled', false)) {
            return true;
        }

        // Method 3: Check if tenancy middleware is available
        if ($this->isTenancyMiddlewareAvailable()) {
            return true;
        }

        return false;
    }

    /**
     * Check if tenancy middleware is available.
     *
     * @return bool
     */
    protected function isTenancyMiddlewareAvailable(): bool
    {
        try {
            $middleware = $this->app['router']->getMiddleware();
            return isset($middleware['tenant']) || 
                   class_exists('Stancl\Tenancy\Middleware\InitializeTenancyByDomain');
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Register a module manually (for testing or dynamic loading).
     *
     * @param  string  $moduleName
     * @param  string  $routesPath
     * @param  string  $namespace
     * @return void
     */
    public function registerModule(string $moduleName, string $routesPath, string $namespace): void
    {
        $this->modules[$moduleName] = [
            'path' => dirname($routesPath),
            'routes_path' => $routesPath,
            'namespace' => $namespace,
        ];

        $this->registerRoutesForModule($moduleName, $this->modules[$moduleName]);
    }

    /**
     * Get all registered modules.
     *
     * @return array
     */
    public function getRegisteredModules(): array
    {
        return $this->modules;
    }

    /**
     * Check if a module is registered.
     *
     * @param  string  $moduleName
     * @return bool
     */
    public function isModuleRegistered(string $moduleName): bool
    {
        return isset($this->modules[$moduleName]);
    }
}
