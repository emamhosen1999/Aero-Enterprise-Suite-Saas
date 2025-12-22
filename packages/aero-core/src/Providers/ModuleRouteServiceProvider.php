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
        
        // Don't auto-discover in constructor - defer to boot()
    }

    /**
     * Define your route model bindings, pattern filters, etc.
     *
     * @return void
     */
    public function boot(): void
    {
        parent::boot();

        // Auto-discover modules during boot (when app is fully initialized)
        $this->discoverModules();
        
        $this->registerModuleRoutes();
    }

    /**
     * Discover available modules from packages directory.
     *
     * @return void
     */
    protected function discoverModules(): void
    {
        try {
            $packagesPath = base_path('packages');
            
            if (!File::isDirectory($packagesPath)) {
                return;
            }

            $directories = File::directories($packagesPath);

            foreach ($directories as $directory) {
                $moduleName = basename($directory);
                
                // Check if module is installed via Composer
                if (class_exists(\Composer\InstalledVersions::class)) {
                    // Convert folder name to package name (e.g. aero-hrm -> aero/hrm)
                    $packageName = 'aero/' . str_replace('aero-', '', $moduleName);
                    
                    // Skip if package is not installed
                    if (!\Composer\InstalledVersions::isInstalled($packageName) && 
                        !\Composer\InstalledVersions::isInstalled($moduleName)) {
                        continue;
                    }
                }

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
        } catch (\Throwable $e) {
            // Ignore errors during package discovery - modules won't be auto-discovered
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
        // Skip HRM module auto-registration to prevent duplicate /dashboard without web middleware;
        // HRM handles its own routing via AeroHrmServiceProvider.
        if ($moduleName === 'aero-hrm') {
            return;
        }

        // If the module already registers its own routes via a dedicated provider,
        // skip auto-registration to avoid duplicate/unprefixed routes that miss the
        // expected middleware (e.g., /dashboard without the web group).
        if ($this->isModuleProviderRegistered($moduleName)) {
            return;
        }

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
        // InitializeTenancyIfNotCentral initializes tenant context on tenant domains
        // 'tenant' middleware (EnsureTenantContext) ensures valid tenant context exists
        $tenancyMiddleware = \Aero\Core\Http\Middleware\InitializeTenancyIfNotCentral::class;

        // Register tenant routes (subdomain-based, requires auth)
        if (File::exists($routesPath . '/tenant.php')) {
            Route::middleware(['web', $tenancyMiddleware, 'tenant', 'auth', 'verified'])
                ->group($routesPath . '/tenant.php');
        }

        // Register web routes (for tenant routes without auth requirement)
        if (File::exists($routesPath . '/web.php')) {
            Route::middleware(['web', $tenancyMiddleware, 'tenant'])
                ->group($routesPath . '/web.php');
        }

        // Register landlord routes (central domain routes - NO tenancy middleware)
        if (File::exists($routesPath . '/landlord.php')) {
            Route::middleware(['web', 'landlord'])
                ->domain(config('tenancy.central_domains')[0] ?? null)
                ->group($routesPath . '/landlord.php');
        }

        // Register API routes (tenant-scoped)
        if (File::exists($routesPath . '/api.php')) {
            Route::middleware(['api', $tenancyMiddleware, 'tenant', 'auth:sanctum'])
                ->prefix('api')
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
                ->group($routesPath . '/tenant.php');
        }

        // Register web routes
        if (File::exists($routesPath . '/web.php')) {
            Route::middleware(['web'])
                ->group($routesPath . '/web.php');
        }

        // In standalone, no landlord routes needed
        // But if they exist, register them as regular web routes
        if (File::exists($routesPath . '/landlord.php')) {
            Route::middleware(['web', 'auth'])
                ->group($routesPath . '/landlord.php');
        }

        // Register API routes
        if (File::exists($routesPath . '/api.php')) {
            Route::middleware(['api', 'auth:sanctum'])
                ->prefix('api')
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
     * Determine if a module already registers its own routes via a provider.
     *
     * This prevents duplicate routes (e.g., /dashboard without the web middleware)
     * when a module-specific service provider handles prefixes and middleware.
     */
    protected function isModuleProviderRegistered(string $moduleName): bool
    {
        $moduleCode = str_replace('aero-', '', $moduleName);
        $studly = str_replace(' ', '', ucwords(str_replace(['-', '_'], ' ', $moduleCode)));
        $upper = strtoupper($moduleCode);

        $candidateProviders = [
            "Aero\\{$studly}\\Aero{$studly}ServiceProvider",
            "Aero\\{$studly}\\Providers\\{$studly}ServiceProvider",
            "Aero\\{$upper}\\Aero{$upper}ServiceProvider",
            "Aero\\{$upper}\\Providers\\{$upper}ServiceProvider",
            "Aero\\{$upper}\\Aero{$studly}ServiceProvider", // e.g. Aero\\HRM\\AeroHrmServiceProvider
            "Aero\\{$upper}\\Providers\\{$upper}ServiceProvider", // e.g. Aero\\HRM\\Providers\\HRMServiceProvider
        ];

        foreach ($candidateProviders as $providerClass) {
            if (class_exists($providerClass) && ($this->app->getProvider($providerClass) || true)) {
                return true;
            }
        }

        return false;
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
