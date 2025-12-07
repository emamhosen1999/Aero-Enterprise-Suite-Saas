<?php

namespace Tools\ModuleExtraction;

/**
 * Config Extractor
 * 
 * Extracts module configuration from config/modules.php and creates
 * a standalone config file for the package
 */
class ConfigExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("⚙️ Extracting configuration...");

        $modulesConfig = $this->extractor->getBasePath() . "/config/modules.php";

        if (!file_exists($modulesConfig)) {
            $this->log("   ⚠ config/modules.php not found");
            $this->createDefaultConfig();
            return;
        }

        // Extract module-specific config from modules.php
        $moduleConfig = $this->extractModuleConfig($modulesConfig);

        // Create package config file
        $this->createPackageConfig($moduleConfig);

        $this->log("   ✓ Created package configuration");
        $this->log("");
    }

    /**
     * Extract module config from modules.php
     */
    protected function extractModuleConfig(string $configPath): ?array
    {
        $content = file_get_contents($configPath);
        $variants = $this->getModuleNameVariants();

        // Try to find the module config in the file
        // This is a simplified approach - might need adjustment based on actual structure
        
        // For now, return null and create default
        return null;
    }

    /**
     * Create package configuration file
     */
    protected function createPackageConfig(?array $extractedConfig = null): void
    {
        $variants = $this->getModuleNameVariants();
        $moduleName = $variants['lower'];
        $moduleStudly = $variants['studly'];

        $content = <<<PHP
<?php

/**
 * Configuration for {$this->extractor->getPackageName()}
 * 
 * This file can be published to the host application using:
 * php artisan vendor:publish --tag=aero-{$moduleName}-config
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Module Mode
    |--------------------------------------------------------------------------
    |
    | Determines how the module operates:
    | - 'standalone': Independent Laravel application
    | - 'tenant': Multi-tenant platform integration
    | - 'auto': Automatically detect based on environment
    |
    */
    'mode' => env('AERO_{$variants['upper']}_MODE', 'auto'),

    /*
    |--------------------------------------------------------------------------
    | Authentication Configuration
    |--------------------------------------------------------------------------
    |
    | Configure how the module handles authentication.
    |
    */
    'auth' => [
        // Whether module provides its own auth or uses host app's auth
        'enabled' => false,
        
        // Auth guard to use
        'guard' => env('AERO_{$variants['upper']}_GUARD', 'web'),
        
        // User model to use (configurable for integration)
        'user_model' => env('AERO_{$variants['upper']}_USER_MODEL', \App\Models\User::class),
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Configuration
    |--------------------------------------------------------------------------
    */
    'database' => [
        // Database connection (null = default)
        'connection' => env('AERO_{$variants['upper']}_DB_CONNECTION', null),
        
        // Whether to support multi-tenancy
        'tenant_aware' => env('AERO_{$variants['upper']}_TENANT_AWARE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Route Configuration
    |--------------------------------------------------------------------------
    */
    'routes' => [
        // Route prefix
        'prefix' => env('AERO_{$variants['upper']}_ROUTE_PREFIX', '{$moduleName}'),
        
        // Middleware to apply to all routes
        'middleware' => ['web', 'auth'],
        
        // Route name prefix
        'name_prefix' => '{$moduleName}.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Frontend Configuration
    |--------------------------------------------------------------------------
    */
    'frontend' => [
        // Whether to publish frontend assets
        'enabled' => true,
        
        // Inertia.js page component prefix
        'page_prefix' => '{$moduleStudly}',
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Metadata
    |--------------------------------------------------------------------------
    */
    'metadata' => [
        'name' => '{$moduleStudly}',
        'description' => '{$moduleStudly} module for Aero Enterprise Suite',
        'version' => '1.0.0',
        'author' => 'Aero Development Team',
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | Enable/disable specific features of the module
    |
    */
    'features' => [
        // Add module-specific feature flags here
    ],

    /*
    |--------------------------------------------------------------------------
    | License Configuration
    |--------------------------------------------------------------------------
    */
    'license' => [
        // Enable license validation
        'enabled' => env('AERO_{$variants['upper']}_LICENSE_ENABLED', false),
        
        // License server URL
        'server_url' => env('AERO_{$variants['upper']}_LICENSE_SERVER', null),
        
        // License key
        'key' => env('AERO_{$variants['upper']}_LICENSE_KEY', null),
    ],
];

PHP;

        $destinationPath = $this->outputPath . "/config/aero-{$moduleName}.php";
        file_put_contents($destinationPath, $content);
    }

    /**
     * Create default config if extraction fails
     */
    protected function createDefaultConfig(): void
    {
        $this->createPackageConfig();
    }
}
