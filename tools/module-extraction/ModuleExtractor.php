<?php

namespace Tools\ModuleExtraction;

/**
 * Module Extractor - Main Orchestrator
 * 
 * Coordinates the extraction of a module from the monolithic application
 * into an independent Composer package structure.
 * 
 * Usage:
 *   php tools/module-extraction/extract.php hrm
 */
class ModuleExtractor
{
    protected string $moduleName;
    protected string $packageName;
    protected string $namespace;
    protected string $outputPath;
    protected string $basePath;
    protected array $config;
    protected array $extractedFiles = [];

    public function __construct(string $moduleName, array $config = [])
    {
        $this->moduleName = strtolower($moduleName);
        $this->packageName = "aero-modules/{$this->moduleName}";
        $this->namespace = $this->generateNamespace($moduleName);
        $this->basePath = $config['base_path'] ?? realpath(__DIR__ . '/../..');
        $this->outputPath = $config['output_path'] ?? $this->basePath . "/packages/aero-{$this->moduleName}";
        $this->config = array_merge($this->getDefaultConfig(), $config);
    }

    /**
     * Extract the complete module into a package structure
     */
    public function extract(): array
    {
        $this->log("🚀 Starting extraction of module: {$this->moduleName}");
        $this->log("📦 Package name: {$this->packageName}");
        $this->log("📁 Output path: {$this->outputPath}");
        $this->log("");

        // Create package directory structure
        $this->createPackageStructure();

        // Extract components
        $this->extractModels();
        $this->extractControllers();
        $this->extractServices();
        $this->extractMiddleware();
        $this->extractRequests();
        $this->extractPolicies();
        $this->extractMigrations();
        $this->extractSeeders();
        $this->extractRoutes();
        $this->extractConfig();
        $this->extractFrontendAssets();
        $this->extractTests();

        // Generate package files
        $this->generateComposerJson();
        $this->generateServiceProvider();
        $this->generateReadme();
        $this->generateLicense();
        $this->generateChangelog();

        // Validate package
        $this->validatePackage();

        $this->log("");
        $this->log("✅ Module extraction completed successfully!");
        $this->log("📊 Summary:");
        $this->log("   - Total files extracted: " . count($this->extractedFiles));
        $this->log("   - Package location: {$this->outputPath}");
        $this->log("");
        $this->log("🎯 Next steps:");
        $this->log("   1. Review extracted files in {$this->outputPath}");
        $this->log("   2. Run: cd {$this->outputPath} && composer install");
        $this->log("   3. Run tests: cd {$this->outputPath} && vendor/bin/phpunit");
        $this->log("   4. Test installation: composer require {$this->packageName}");

        return [
            'success' => true,
            'package_name' => $this->packageName,
            'output_path' => $this->outputPath,
            'files_extracted' => count($this->extractedFiles),
            'extracted_files' => $this->extractedFiles,
        ];
    }

    /**
     * Create the basic package directory structure
     */
    protected function createPackageStructure(): void
    {
        $this->log("📁 Creating package directory structure...");

        $directories = [
            'src',
            'src/Models',
            'src/Http',
            'src/Http/Controllers',
            'src/Http/Middleware',
            'src/Http/Requests',
            'src/Services',
            'src/Policies',
            'src/Facades',
            'database',
            'database/migrations',
            'database/seeders',
            'database/factories',
            'routes',
            'config',
            'resources',
            'resources/js',
            'resources/js/Pages',
            'resources/js/Components',
            'resources/js/Forms',
            'resources/js/Tables',
            'resources/views',
            'tests',
            'tests/Feature',
            'tests/Unit',
        ];

        foreach ($directories as $dir) {
            $path = "{$this->outputPath}/{$dir}";
            if (!is_dir($path)) {
                mkdir($path, 0755, true);
                $this->log("   ✓ Created: {$dir}/");
            }
        }

        $this->log("");
    }

    /**
     * Extract models from app/Models/{Module}/
     */
    protected function extractModels(): void
    {
        $extractor = new ModelExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract controllers from app/Http/Controllers/{Module}/
     */
    protected function extractControllers(): void
    {
        $extractor = new ControllerExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract services from app/Services/{Module}/
     */
    protected function extractServices(): void
    {
        $extractor = new ServiceExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract middleware specific to this module
     */
    protected function extractMiddleware(): void
    {
        $extractor = new MiddlewareExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract form requests from app/Http/Requests/{Module}/
     */
    protected function extractRequests(): void
    {
        $extractor = new RequestExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract policies from app/Policies/{Module}/
     */
    protected function extractPolicies(): void
    {
        $extractor = new PolicyExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract migrations from database/migrations/tenant/
     */
    protected function extractMigrations(): void
    {
        $extractor = new MigrationExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract seeders
     */
    protected function extractSeeders(): void
    {
        $extractor = new SeederExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract routes from routes/{module}.php
     */
    protected function extractRoutes(): void
    {
        $extractor = new RouteExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract config from config/modules.php
     */
    protected function extractConfig(): void
    {
        $extractor = new ConfigExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract frontend assets (React components)
     */
    protected function extractFrontendAssets(): void
    {
        $extractor = new FrontendExtractor($this);
        $extractor->extract();
    }

    /**
     * Extract tests
     */
    protected function extractTests(): void
    {
        $extractor = new TestExtractor($this);
        $extractor->extract();
    }

    /**
     * Generate composer.json for the package
     */
    protected function generateComposerJson(): void
    {
        $generator = new ComposerJsonGenerator($this);
        $generator->generate();
    }

    /**
     * Generate ServiceProvider for the package
     */
    protected function generateServiceProvider(): void
    {
        $generator = new ServiceProviderGenerator($this);
        $generator->generate();
    }

    /**
     * Generate README.md
     */
    protected function generateReadme(): void
    {
        $generator = new ReadmeGenerator($this);
        $generator->generate();
    }

    /**
     * Generate LICENSE file
     */
    protected function generateLicense(): void
    {
        $generator = new LicenseGenerator($this);
        $generator->generate();
    }

    /**
     * Generate CHANGELOG.md
     */
    protected function generateChangelog(): void
    {
        $generator = new ChangelogGenerator($this);
        $generator->generate();
    }

    /**
     * Validate the extracted package
     */
    protected function validatePackage(): void
    {
        $this->log("🔍 Validating package structure...");

        $validator = new PackageValidator($this);
        $results = $validator->validate();

        if ($results['valid']) {
            $this->log("   ✓ Package structure is valid");
        } else {
            $this->log("   ⚠ Package validation warnings:");
            foreach ($results['warnings'] as $warning) {
                $this->log("      - {$warning}");
            }
        }

        $this->log("");
    }

    /**
     * Generate namespace from module name
     */
    protected function generateNamespace(string $moduleName): string
    {
        $formatted = str_replace(['-', '_'], ' ', $moduleName);
        $formatted = ucwords($formatted);
        $formatted = str_replace(' ', '', $formatted);
        
        return "AeroModules\\{$formatted}";
    }

    /**
     * Get default configuration
     */
    protected function getDefaultConfig(): array
    {
        return [
            'vendor_name' => 'aero-modules',
            'author_name' => 'Aero Development Team',
            'author_email' => 'dev@aero.com',
            'license' => 'proprietary',
            'php_version' => '^8.2',
            'laravel_version' => '^11.0',
            'include_auth' => false, // Don't include auth by default
            'include_frontend' => true,
            'include_tests' => true,
            'tenancy_support' => true, // Support multi-tenancy
            'standalone_support' => true, // Support standalone mode
        ];
    }

    /**
     * Log a message
     */
    public function log(string $message): void
    {
        echo $message . PHP_EOL;
    }

    /**
     * Record an extracted file
     */
    public function recordExtractedFile(string $sourcePath, string $destinationPath): void
    {
        $this->extractedFiles[] = [
            'source' => $sourcePath,
            'destination' => $destinationPath,
            'timestamp' => date('Y-m-d H:i:s'),
        ];
    }

    // Getters
    public function getModuleName(): string { return $this->moduleName; }
    public function getPackageName(): string { return $this->packageName; }
    public function getNamespace(): string { return $this->namespace; }
    public function getOutputPath(): string { return $this->outputPath; }
    public function getConfig(string $key = null) { return $key ? ($this->config[$key] ?? null) : $this->config; }
    public function getBasePath(): string { return $this->basePath; }
}
