<?php

namespace Tools\ModuleExtraction;

/**
 * Service Provider Generator
 * 
 * Generates the smart ServiceProvider for the package with mode detection
 */
class ServiceProviderGenerator
{
    protected ModuleExtractor $extractor;

    public function __construct(ModuleExtractor $extractor)
    {
        $this->extractor = $extractor;
    }

    public function generate(): void
    {
        $this->extractor->log("🔧 Generating ServiceProvider...");

        $content = $this->buildServiceProvider();
        $variants = $this->getModuleNameVariants();
        $providerPath = $this->extractor->getOutputPath() . "/src/{$variants['studly']}ServiceProvider.php";

        file_put_contents($providerPath, $content);

        $this->extractor->log("   ✓ Created {$variants['studly']}ServiceProvider");
        $this->extractor->log("");
    }

    protected function buildServiceProvider(): string
    {
        $variants = $this->getModuleNameVariants();
        $namespace = $this->extractor->getNamespace();
        $moduleName = $variants['studly'];
        $moduleLower = $variants['lower'];

        return <<<PHP
<?php

namespace {$namespace};

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * {$moduleName} Module Service Provider
 * 
 * Smart service provider that detects installation mode (standalone vs multi-tenant)
 * and configures the module accordingly.
 */
class {$moduleName}ServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Merge package config with application config
        \$this->mergeConfigFrom(
            __DIR__ . '/../config/aero-{$moduleLower}.php',
            'aero-{$moduleLower}'
        );

        // Register with platform's Module Registry if it exists
        if (class_exists(\App\Services\Module\ModuleRegistry::class)) {
            \$this->registerWithPlatform();
        }

        // Bind User model from config
        \$this->app->bind(
            'aero-{$moduleLower}.user',
            fn () => config('aero-{$moduleLower}.auth.user_model', \App\Models\User::class)
        );
    }

    /**
     * Bootstrap any package services.
     */
    public function boot(): void
    {
        // Detect installation mode
        \$mode = \$this->detectMode();

        // Load package components
        \$this->loadMigrations();
        \$this->loadRoutes(\$mode);
        \$this->loadViews();
        
        // Publish resources
        \$this->publishConfiguration();
        \$this->publishMigrations();
        \$this->publishFrontendAssets();

        // Register commands if running in console
        if (\$this->app->runningInConsole()) {
            \$this->registerCommands();
        }
    }

    /**
     * Detect installation mode
     */
    protected function detectMode(): string
    {
        // Check config first
        \$configMode = config('aero-{$moduleLower}.mode');
        if (\$configMode !== 'auto') {
            return \$configMode;
        }

        // Auto-detect: Check if Tenancy package is installed
        if (class_exists(\Stancl\Tenancy\Tenancy::class)) {
            // Check if currently in tenant context
            if (function_exists('tenant') && tenant() !== null) {
                return 'tenant';
            }
            return 'platform';
        }

        return 'standalone';
    }

    /**
     * Load migrations
     */
    protected function loadMigrations(): void
    {
        \$this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
    }

    /**
     * Load routes with mode-appropriate middleware
     */
    protected function loadRoutes(string \$mode): void
    {
        \$middleware = config('aero-{$moduleLower}.routes.middleware', ['web', 'auth']);

        // Add tenant middleware if in multi-tenant mode
        if (\$mode === 'tenant' && class_exists(\Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class)) {
            \$middleware[] = \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class;
        }

        Route::middleware(\$middleware)
            ->prefix(config('aero-{$moduleLower}.routes.prefix', '{$moduleLower}'))
            ->name(config('aero-{$moduleLower}.routes.name_prefix', '{$moduleLower}.'))
            ->group(__DIR__ . '/../routes/{$moduleLower}.php');
    }

    /**
     * Load views
     */
    protected function loadViews(): void
    {
        \$this->loadViewsFrom(__DIR__ . '/../resources/views', 'aero-{$moduleLower}');
    }

    /**
     * Publish configuration
     */
    protected function publishConfiguration(): void
    {
        \$this->publishes([
            __DIR__ . '/../config/aero-{$moduleLower}.php' => config_path('aero-{$moduleLower}.php'),
        ], 'aero-{$moduleLower}-config');
    }

    /**
     * Publish migrations
     */
    protected function publishMigrations(): void
    {
        \$this->publishes([
            __DIR__ . '/../database/migrations' => database_path('migrations'),
        ], 'aero-{$moduleLower}-migrations');
    }

    /**
     * Publish frontend assets
     */
    protected function publishFrontendAssets(): void
    {
        \$this->publishes([
            __DIR__ . '/../resources/js' => resource_path('js/vendor/aero-{$moduleLower}'),
        ], 'aero-{$moduleLower}-assets');
    }

    /**
     * Register console commands
     */
    protected function registerCommands(): void
    {
        // Add module-specific Artisan commands here
        // \$this->commands([
        //     Commands\InstallCommand::class,
        // ]);
    }

    /**
     * Register module with platform's Module Registry
     */
    protected function registerWithPlatform(): void
    {
        try {
            \$registry = \$this->app->make(\App\Services\Module\ModuleRegistry::class);
            \$registry->register('{$moduleLower}', [
                'name' => config('aero-{$moduleLower}.metadata.name', '{$moduleName}'),
                'version' => config('aero-{$moduleLower}.metadata.version', '1.0.0'),
                'provider' => static::class,
                'description' => config('aero-{$moduleLower}.metadata.description'),
            ]);
        } catch (\Exception \$e) {
            // Silently fail if ModuleRegistry doesn't exist or fails
        }
    }
}

PHP;
    }

    protected function getModuleNameVariants(): array
    {
        $moduleName = $this->extractor->getModuleName();
        return [
            'lower' => strtolower($moduleName),
            'upper' => strtoupper($moduleName),
            'ucfirst' => ucfirst(strtolower($moduleName)),
            'studly' => str_replace(['-', '_'], '', ucwords($moduleName, '-_')),
        ];
    }
}
