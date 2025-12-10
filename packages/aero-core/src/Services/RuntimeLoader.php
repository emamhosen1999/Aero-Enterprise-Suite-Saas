<?php

namespace Aero\Core\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * RuntimeLoader
 * 
 * Handles dynamic module loading for Standalone mode where modules are
 * uploaded as ZIP files without Composer.
 * 
 * This loader:
 * - Scans modules directory for module.json files
 * - Registers PSR-4 autoloading at runtime
 * - Prevents class redeclaration conflicts
 * - Integrates with Laravel's service container
 */
class RuntimeLoader
{
    /**
     * Modules directory path.
     *
     * @var string
     */
    protected string $modulesPath;

    /**
     * Loaded modules registry.
     *
     * @var array
     */
    protected array $loadedModules = [];

    /**
     * Composer autoloader instance.
     *
     * @var \Composer\Autoload\ClassLoader|null
     */
    protected $composerLoader = null;

    /**
     * Create a new RuntimeLoader instance.
     *
     * @param  string|null  $modulesPath
     * @return void
     */
    public function __construct(?string $modulesPath = null)
    {
        $this->modulesPath = $modulesPath ?? base_path('modules');
        $this->composerLoader = require base_path('vendor/autoload.php');
    }

    /**
     * Discover and load all modules from the modules directory.
     *
     * @return array
     */
    public function loadModules(): array
    {
        if (!File::isDirectory($this->modulesPath)) {
            Log::warning("RuntimeLoader: Modules directory does not exist: {$this->modulesPath}");
            return [];
        }

        $modules = $this->discoverModules();

        foreach ($modules as $moduleConfig) {
            $this->loadModule($moduleConfig);
        }

        return $this->loadedModules;
    }

    /**
     * Discover all modules with module.json files.
     *
     * @return array
     */
    protected function discoverModules(): array
    {
        $modules = [];
        $directories = File::directories($this->modulesPath);

        foreach ($directories as $directory) {
            $moduleJsonPath = $directory . '/module.json';

            if (File::exists($moduleJsonPath)) {
                try {
                    $moduleConfig = json_decode(File::get($moduleJsonPath), true);
                    
                    if (json_last_error() === JSON_ERROR_NONE && $this->isValidModuleConfig($moduleConfig)) {
                        $moduleConfig['path'] = $directory;
                        $moduleConfig['name'] = basename($directory);
                        $modules[] = $moduleConfig;
                    } else {
                        Log::warning("RuntimeLoader: Invalid module.json in: {$directory}");
                    }
                } catch (\Throwable $e) {
                    Log::error("RuntimeLoader: Error reading module.json in {$directory}: {$e->getMessage()}");
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
        return isset($config['namespace']) && 
               isset($config['providers']) && 
               is_array($config['providers']);
    }

    /**
     * Load a single module.
     *
     * @param  array  $moduleConfig
     * @return bool
     */
    protected function loadModule(array $moduleConfig): bool
    {
        $moduleName = $moduleConfig['name'];

        // Check if module is already loaded via Composer
        if ($this->isLoadedViaComposer($moduleConfig['namespace'])) {
            Log::info("RuntimeLoader: Module '{$moduleName}' already loaded via Composer, skipping runtime load");
            
            $this->loadedModules[$moduleName] = [
                'status' => 'composer_loaded',
                'namespace' => $moduleConfig['namespace'],
                'path' => $moduleConfig['path'],
            ];
            
            return true;
        }

        // Register PSR-4 autoloading
        if (!$this->registerAutoloading($moduleConfig)) {
            return false;
        }

        // Register service providers
        if (!$this->registerServiceProviders($moduleConfig)) {
            return false;
        }

        // Mark as loaded
        $this->loadedModules[$moduleName] = [
            'status' => 'runtime_loaded',
            'namespace' => $moduleConfig['namespace'],
            'path' => $moduleConfig['path'],
            'providers' => $moduleConfig['providers'],
            'config' => $moduleConfig,
        ];

        Log::info("RuntimeLoader: Successfully loaded module '{$moduleName}'");

        return true;
    }

    /**
     * Check if a namespace is already loaded via Composer.
     *
     * @param  string  $namespace
     * @return bool
     */
    protected function isLoadedViaComposer(string $namespace): bool
    {
        // Try to find a representative class from the namespace
        $testClasses = [
            $namespace . '\\AeroHrmServiceProvider',
            $namespace . '\\AeroCrmServiceProvider',
            $namespace . '\\ServiceProvider',
            $namespace . '\\Providers\\ModuleServiceProvider',
        ];

        foreach ($testClasses as $class) {
            if (class_exists($class, false)) {
                return true;
            }
        }

        // Check if namespace is registered in Composer's autoloader
        if ($this->composerLoader) {
            $prefixes = $this->composerLoader->getPrefixesPsr4();
            $normalizedNamespace = rtrim($namespace, '\\') . '\\';
            
            if (isset($prefixes[$normalizedNamespace])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Register PSR-4 autoloading for a module.
     *
     * @param  array  $moduleConfig
     * @return bool
     */
    protected function registerAutoloading(array $moduleConfig): bool
    {
        try {
            $namespace = rtrim($moduleConfig['namespace'], '\\') . '\\';
            $srcPath = $moduleConfig['path'] . '/src';

            if (!File::isDirectory($srcPath)) {
                Log::warning("RuntimeLoader: Source directory not found for module '{$moduleConfig['name']}': {$srcPath}");
                return false;
            }

            // Register with Composer's autoloader
            if ($this->composerLoader) {
                $this->composerLoader->addPsr4($namespace, $srcPath);
                Log::debug("RuntimeLoader: Registered PSR-4 namespace '{$namespace}' -> '{$srcPath}'");
            }

            return true;
        } catch (\Throwable $e) {
            Log::error("RuntimeLoader: Failed to register autoloading for '{$moduleConfig['name']}': {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Register service providers for a module.
     *
     * @param  array  $moduleConfig
     * @return bool
     */
    protected function registerServiceProviders(array $moduleConfig): bool
    {
        if (empty($moduleConfig['providers'])) {
            return true;
        }

        try {
            foreach ($moduleConfig['providers'] as $provider) {
                // Check if provider class exists
                if (!class_exists($provider)) {
                    Log::warning("RuntimeLoader: Provider class not found: {$provider}");
                    continue;
                }

                // Check if already registered
                if ($this->isProviderRegistered($provider)) {
                    Log::debug("RuntimeLoader: Provider already registered: {$provider}");
                    continue;
                }

                // Register the provider
                app()->register($provider);
                Log::info("RuntimeLoader: Registered provider: {$provider}");
            }

            return true;
        } catch (\Throwable $e) {
            Log::error("RuntimeLoader: Failed to register providers for '{$moduleConfig['name']}': {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Check if a service provider is already registered.
     *
     * @param  string  $provider
     * @return bool
     */
    protected function isProviderRegistered(string $provider): bool
    {
        $registered = app()->getLoadedProviders();
        return isset($registered[$provider]);
    }

    /**
     * Load a specific module by name.
     *
     * @param  string  $moduleName
     * @return bool
     */
    public function loadModuleByName(string $moduleName): bool
    {
        $modulePath = $this->modulesPath . '/' . $moduleName;
        $moduleJsonPath = $modulePath . '/module.json';

        if (!File::exists($moduleJsonPath)) {
            Log::warning("RuntimeLoader: Module not found: {$moduleName}");
            return false;
        }

        try {
            $moduleConfig = json_decode(File::get($moduleJsonPath), true);
            
            if (json_last_error() !== JSON_ERROR_NONE || !$this->isValidModuleConfig($moduleConfig)) {
                Log::warning("RuntimeLoader: Invalid module.json for: {$moduleName}");
                return false;
            }

            $moduleConfig['path'] = $modulePath;
            $moduleConfig['name'] = $moduleName;

            return $this->loadModule($moduleConfig);
        } catch (\Throwable $e) {
            Log::error("RuntimeLoader: Error loading module '{$moduleName}': {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Get all loaded modules.
     *
     * @return array
     */
    public function getLoadedModules(): array
    {
        return $this->loadedModules;
    }

    /**
     * Check if a module is loaded.
     *
     * @param  string  $moduleName
     * @return bool
     */
    public function isModuleLoaded(string $moduleName): bool
    {
        return isset($this->loadedModules[$moduleName]);
    }

    /**
     * Get module information.
     *
     * @param  string  $moduleName
     * @return array|null
     */
    public function getModuleInfo(string $moduleName): ?array
    {
        return $this->loadedModules[$moduleName] ?? null;
    }

    /**
     * Unload a module (for testing purposes).
     *
     * @param  string  $moduleName
     * @return bool
     */
    public function unloadModule(string $moduleName): bool
    {
        if (!isset($this->loadedModules[$moduleName])) {
            return false;
        }

        unset($this->loadedModules[$moduleName]);
        
        // Note: We cannot truly unload classes or service providers at runtime
        // This method is primarily for tracking purposes
        
        return true;
    }

    /**
     * Get the modules path.
     *
     * @return string
     */
    public function getModulesPath(): string
    {
        return $this->modulesPath;
    }

    /**
     * Set the modules path.
     *
     * @param  string  $path
     * @return void
     */
    public function setModulesPath(string $path): void
    {
        $this->modulesPath = $path;
    }
}
