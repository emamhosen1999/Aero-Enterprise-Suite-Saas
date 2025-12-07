<?php

namespace Tools\ModuleAnalysis;

/**
 * Dependency Analyzer
 * 
 * Analyzes module dependencies and relationships - does NOT perform extraction.
 * Outputs detailed reports for manual review and planning.
 * 
 * Usage:
 *   php tools/module-analysis/analyze.php hrm
 */
class DependencyAnalyzer
{
    protected string $moduleName;
    protected string $basePath;
    protected array $results = [];

    public function __construct(string $moduleName, string $basePath = null)
    {
        $this->moduleName = ucfirst(strtolower($moduleName));
        $this->basePath = $basePath ?? realpath(__DIR__ . '/../..');
    }

    /**
     * Analyze module dependencies
     * Returns a comprehensive report for manual review
     */
    public function analyze(): array
    {
        echo "🔍 Analyzing dependencies for module: {$this->moduleName}\n\n";

        $this->results = [
            'module' => $this->moduleName,
            'timestamp' => date('Y-m-d H:i:s'),
            'migrations' => $this->findRelatedMigrations(),
            'models' => $this->findRelatedModels(),
            'controllers' => $this->findRelatedControllers(),
            'services' => $this->findRelatedServices(),
            'middleware' => $this->findRelatedMiddleware(),
            'policies' => $this->findRelatedPolicies(),
            'requests' => $this->findRelatedRequests(),
            'routes' => $this->findRelatedRoutes(),
            'config' => $this->findRelatedConfig(),
            'frontend_components' => $this->findReactComponents(),
            'frontend_pages' => $this->findReactPages(),
            'frontend_tables' => $this->findReactTables(),
            'frontend_forms' => $this->findReactForms(),
            'relationships' => $this->mapModelRelationships(),
            'external_dependencies' => $this->findExternalDependencies(),
            'shared_dependencies' => $this->findSharedDependencies(),
            'warnings' => $this->detectPotentialIssues(),
        ];

        return $this->results;
    }

    /**
     * Find migrations related to the module
     */
    protected function findRelatedMigrations(): array
    {
        $migrations = [];
        $migrationDirs = [
            "{$this->basePath}/database/migrations",
            "{$this->basePath}/database/migrations/tenant",
        ];

        foreach ($migrationDirs as $dir) {
            if (!is_dir($dir)) continue;

            $files = glob("{$dir}/*.php");
            foreach ($files as $file) {
                $content = file_get_contents($file);
                $moduleLower = strtolower($this->moduleName);
                
                // Check if migration is related to module
                if (preg_match("/\b{$moduleLower}|{$this->moduleName}\b/i", $content) ||
                    preg_match("/\b{$moduleLower}s\b/i", basename($file))) {
                    $migrations[] = [
                        'file' => basename($file),
                        'path' => str_replace($this->basePath . '/', '', $file),
                        'tables' => $this->extractTableNames($content),
                        'type' => str_contains($file, 'tenant') ? 'tenant' : 'central',
                    ];
                }
            }
        }

        return $migrations;
    }

    /**
     * Extract table names from migration content
     */
    protected function extractTableNames(string $content): array
    {
        $tables = [];
        
        // Match Schema::create('table_name'
        if (preg_match_all("/Schema::create\s*\(\s*['\"]([^'\"]+)['\"]/", $content, $matches)) {
            $tables = array_merge($tables, $matches[1]);
        }
        
        // Match Schema::table('table_name'
        if (preg_match_all("/Schema::table\s*\(\s*['\"]([^'\"]+)['\"]/", $content, $matches)) {
            $tables = array_merge($tables, $matches[1]);
        }

        return array_unique($tables);
    }

    /**
     * Find models related to the module
     */
    protected function findRelatedModels(): array
    {
        $models = [];
        $modelPaths = [
            "{$this->basePath}/app/Models/Tenant/{$this->moduleName}",
            "{$this->basePath}/app/Models/{$this->moduleName}",
        ];

        foreach ($modelPaths as $modelPath) {
            if (is_dir($modelPath)) {
                $files = $this->getPhpFiles($modelPath);
                foreach ($files as $file) {
                    $content = file_get_contents($file);
                    $className = basename($file, '.php');
                    
                    $models[] = [
                        'name' => $className,
                        'path' => str_replace($this->basePath . '/', '', $file),
                        'namespace' => $this->extractNamespace($content),
                        'relationships' => $this->extractRelationships($content),
                        'traits' => $this->extractTraits($content),
                    ];
                }
            }
        }

        return $models;
    }

    /**
     * Get all PHP files in a directory recursively
     */
    protected function getPhpFiles(string $dir): array
    {
        $files = [];
        
        if (!is_dir($dir)) {
            return $files;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    /**
     * Extract namespace from file content
     */
    protected function extractNamespace(string $content): ?string
    {
        if (preg_match('/namespace\s+([^;]+);/', $content, $matches)) {
            return trim($matches[1]);
        }
        return null;
    }

    /**
     * Extract relationships from model content
     */
    protected function extractRelationships(string $content): array
    {
        $relationships = [];
        
        // Match relationship methods: belongsTo, hasMany, hasOne, belongsToMany
        $relationshipTypes = ['belongsTo', 'hasMany', 'hasOne', 'belongsToMany', 'morphTo', 'morphMany', 'morphToMany'];
        
        foreach ($relationshipTypes as $type) {
            if (preg_match_all("/{$type}\s*\(\s*([^)]+)\)/", $content, $matches)) {
                foreach ($matches[1] as $match) {
                    // Clean up the matched string
                    $related = preg_replace('/[,\s].*$/', '', $match);
                    $related = trim($related, '\'"');
                    
                    $relationships[] = [
                        'type' => $type,
                        'related' => $related,
                    ];
                }
            }
        }

        return $relationships;
    }

    /**
     * Extract traits from content
     */
    protected function extractTraits(string $content): array
    {
        $traits = [];
        
        // Match use statements inside class
        if (preg_match('/class\s+\w+[^{]*\{([^}]+)/s', $content, $classMatch)) {
            $classContent = $classMatch[1];
            if (preg_match_all('/use\s+([^;]+);/', $classContent, $matches)) {
                foreach ($matches[1] as $trait) {
                    $trait = trim($trait);
                    if (str_contains($trait, '\\')) {
                        $traits[] = $trait;
                    }
                }
            }
        }

        return $traits;
    }

    /**
     * Find controllers related to the module
     */
    protected function findRelatedControllers(): array
    {
        $controllers = [];
        $controllerPaths = [
            "{$this->basePath}/app/Http/Controllers/Tenant/{$this->moduleName}",
            "{$this->basePath}/app/Http/Controllers/{$this->moduleName}",
        ];

        foreach ($controllerPaths as $path) {
            if (is_dir($path)) {
                $files = $this->getPhpFiles($path);
                foreach ($files as $file) {
                    $controllers[] = [
                        'name' => basename($file, '.php'),
                        'path' => str_replace($this->basePath . '/', '', $file),
                        'size' => filesize($file),
                    ];
                }
            }
        }

        return $controllers;
    }

    /**
     * Find services related to the module
     */
    protected function findRelatedServices(): array
    {
        $services = [];
        $servicePaths = [
            "{$this->basePath}/app/Services/Tenant/{$this->moduleName}",
            "{$this->basePath}/app/Services/{$this->moduleName}",
        ];

        foreach ($servicePaths as $path) {
            if (is_dir($path)) {
                $files = $this->getPhpFiles($path);
                foreach ($files as $file) {
                    $services[] = [
                        'name' => basename($file, '.php'),
                        'path' => str_replace($this->basePath . '/', '', $file),
                    ];
                }
            }
        }

        return $services;
    }

    /**
     * Find middleware related to the module
     */
    protected function findRelatedMiddleware(): array
    {
        $middleware = [];
        $middlewarePath = "{$this->basePath}/app/Http/Middleware";

        if (is_dir($middlewarePath)) {
            $files = glob("{$middlewarePath}/*.php");
            $moduleLower = strtolower($this->moduleName);
            
            foreach ($files as $file) {
                $content = file_get_contents($file);
                if (preg_match("/\b{$moduleLower}|{$this->moduleName}\b/i", $content)) {
                    $middleware[] = [
                        'name' => basename($file, '.php'),
                        'path' => str_replace($this->basePath . '/', '', $file),
                    ];
                }
            }
        }

        return $middleware;
    }

    /**
     * Find policies related to the module
     */
    protected function findRelatedPolicies(): array
    {
        $policies = [];
        $policyPath = "{$this->basePath}/app/Policies/{$this->moduleName}";

        if (is_dir($policyPath)) {
            $files = $this->getPhpFiles($policyPath);
            foreach ($files as $file) {
                $policies[] = [
                    'name' => basename($file, '.php'),
                    'path' => str_replace($this->basePath . '/', '', $file),
                ];
            }
        }

        return $policies;
    }

    /**
     * Find form requests related to the module
     */
    protected function findRelatedRequests(): array
    {
        $requests = [];
        $requestPath = "{$this->basePath}/app/Http/Requests/{$this->moduleName}";

        if (is_dir($requestPath)) {
            $files = $this->getPhpFiles($requestPath);
            foreach ($files as $file) {
                $requests[] = [
                    'name' => basename($file, '.php'),
                    'path' => str_replace($this->basePath . '/', '', $file),
                ];
            }
        }

        return $requests;
    }

    /**
     * Find routes related to the module
     */
    protected function findRelatedRoutes(): array
    {
        $routes = [];
        $routesPath = "{$this->basePath}/routes";
        $moduleLower = strtolower($this->moduleName);

        $possibleRouteFiles = [
            "{$routesPath}/{$moduleLower}.php",
            "{$routesPath}/tenant.php",
            "{$routesPath}/web.php",
        ];

        foreach ($possibleRouteFiles as $file) {
            if (file_exists($file)) {
                $content = file_get_contents($file);
                if (preg_match("/\b{$moduleLower}|{$this->moduleName}\b/i", $content)) {
                    $routes[] = [
                        'file' => basename($file),
                        'path' => str_replace($this->basePath . '/', '', $file),
                        'contains_module_routes' => true,
                    ];
                }
            }
        }

        return $routes;
    }

    /**
     * Find config related to the module
     */
    protected function findRelatedConfig(): array
    {
        $config = [];
        $configPath = "{$this->basePath}/config";
        $moduleLower = strtolower($this->moduleName);

        if (file_exists("{$configPath}/modules.php")) {
            $content = file_get_contents("{$configPath}/modules.php");
            if (preg_match("/['\"]code['\"]\s*=>\s*['\"]({$moduleLower})['\"]/",$content, $matches)) {
                $config[] = [
                    'file' => 'modules.php',
                    'path' => 'config/modules.php',
                    'has_module_definition' => true,
                ];
            }
        }

        return $config;
    }

    /**
     * Find React components related to the module
     */
    protected function findReactComponents(): array
    {
        $components = [];
        $componentsPaths = [
            "{$this->basePath}/resources/js/Components/{$this->moduleName}",
            "{$this->basePath}/resources/js/Tenant/Components/{$this->moduleName}",
        ];

        foreach ($componentsPaths as $path) {
            if (is_dir($path)) {
                $files = glob("{$path}/*.{jsx,js,tsx,ts}", GLOB_BRACE);
                foreach ($files as $file) {
                    $components[] = [
                        'name' => basename($file),
                        'path' => str_replace($this->basePath . '/', '', $file),
                        'size' => filesize($file),
                    ];
                }
            }
        }

        return $components;
    }

    /**
     * Find React pages related to the module
     */
    protected function findReactPages(): array
    {
        $pages = [];
        $pagesPaths = [
            "{$this->basePath}/resources/js/Tenant/Pages/{$this->moduleName}",
            "{$this->basePath}/resources/js/Pages/{$this->moduleName}",
        ];

        foreach ($pagesPaths as $path) {
            if (is_dir($path)) {
                $files = glob("{$path}/*.{jsx,js,tsx,ts}", GLOB_BRACE);
                foreach ($files as $file) {
                    $pages[] = [
                        'name' => basename($file),
                        'path' => str_replace($this->basePath . '/', '', $file),
                        'size' => filesize($file),
                    ];
                }
            }
        }

        return $pages;
    }

    /**
     * Find React tables related to the module
     */
    protected function findReactTables(): array
    {
        $tables = [];
        $tablesPath = "{$this->basePath}/resources/js/Tables";
        $moduleLower = strtolower($this->moduleName);

        if (is_dir($tablesPath)) {
            $files = glob("{$tablesPath}/*.{jsx,js,tsx,ts}", GLOB_BRACE);
            foreach ($files as $file) {
                $content = file_get_contents($file);
                if (preg_match("/\b{$moduleLower}|{$this->moduleName}\b/i", $content)) {
                    $tables[] = [
                        'name' => basename($file),
                        'path' => str_replace($this->basePath . '/', '', $file),
                    ];
                }
            }
        }

        return $tables;
    }

    /**
     * Find React forms related to the module
     */
    protected function findReactForms(): array
    {
        $forms = [];
        $formsPath = "{$this->basePath}/resources/js/Forms";
        $moduleLower = strtolower($this->moduleName);

        if (is_dir($formsPath)) {
            $files = glob("{$formsPath}/*.{jsx,js,tsx,ts}", GLOB_BRACE);
            foreach ($files as $file) {
                $content = file_get_contents($file);
                if (preg_match("/\b{$moduleLower}|{$this->moduleName}\b/i", $content)) {
                    $forms[] = [
                        'name' => basename($file),
                        'path' => str_replace($this->basePath . '/', '', $file),
                    ];
                }
            }
        }

        return $forms;
    }

    /**
     * Map model relationships (what models depend on what)
     */
    protected function mapModelRelationships(): array
    {
        $relationshipMap = [];
        
        foreach ($this->results['models'] ?? [] as $model) {
            if (!empty($model['relationships'])) {
                $relationshipMap[$model['name']] = $model['relationships'];
            }
        }

        return $relationshipMap;
    }

    /**
     * Find external package dependencies
     */
    protected function findExternalDependencies(): array
    {
        $dependencies = [];
        
        // Check composer.json for dependencies
        $composerPath = "{$this->basePath}/composer.json";
        if (file_exists($composerPath)) {
            $composer = json_decode(file_get_contents($composerPath), true);
            if (isset($composer['require'])) {
                foreach ($composer['require'] as $package => $version) {
                    if (str_starts_with($package, 'laravel/') || 
                        str_starts_with($package, 'spatie/') ||
                        (!str_starts_with($package, 'php') && !str_starts_with($package, 'ext-'))) {
                        $dependencies[] = [
                            'package' => $package,
                            'version' => $version,
                        ];
                    }
                }
            }
        }

        return $dependencies;
    }

    /**
     * Find shared dependencies (files/classes used by multiple modules)
     */
    protected function findSharedDependencies(): array
    {
        $shared = [];
        
        // Check for shared models
        $sharedModelsPath = "{$this->basePath}/app/Models/Shared";
        if (is_dir($sharedModelsPath)) {
            $files = $this->getPhpFiles($sharedModelsPath);
            foreach ($files as $file) {
                $shared[] = [
                    'type' => 'model',
                    'name' => basename($file, '.php'),
                    'path' => str_replace($this->basePath . '/', '', $file),
                    'warning' => 'Shared model - may be used by other modules',
                ];
            }
        }

        // Check for shared services
        $sharedServicesPath = "{$this->basePath}/app/Services/Shared";
        if (is_dir($sharedServicesPath)) {
            $files = $this->getPhpFiles($sharedServicesPath);
            foreach ($files as $file) {
                $shared[] = [
                    'type' => 'service',
                    'name' => basename($file, '.php'),
                    'path' => str_replace($this->basePath . '/', '', $file),
                    'warning' => 'Shared service - may be used by other modules',
                ];
            }
        }

        return $shared;
    }

    /**
     * Detect potential issues with extraction
     */
    protected function detectPotentialIssues(): array
    {
        $warnings = [];

        // Check for missing migrations
        if (empty($this->results['migrations'])) {
            $warnings[] = [
                'level' => 'warning',
                'message' => 'No migrations found for this module',
                'suggestion' => 'Verify module name or check if migrations exist',
            ];
        }

        // Check for missing models
        if (empty($this->results['models'])) {
            $warnings[] = [
                'level' => 'warning',
                'message' => 'No models found for this module',
                'suggestion' => 'Verify module name or check if models exist',
            ];
        }

        // Check for shared dependencies
        if (!empty($this->results['shared_dependencies'])) {
            $warnings[] = [
                'level' => 'critical',
                'message' => 'Module has shared dependencies that are used by other modules',
                'suggestion' => 'Review shared dependencies carefully before extraction',
                'count' => count($this->results['shared_dependencies']),
            ];
        }

        // Check for circular relationships
        $relationshipMap = $this->results['relationships'] ?? [];
        if (!empty($relationshipMap)) {
            $warnings[] = [
                'level' => 'info',
                'message' => 'Module has model relationships',
                'suggestion' => 'Review relationships to ensure all related models are included',
                'count' => count($relationshipMap),
            ];
        }

        return $warnings;
    }

    /**
     * Get analysis results
     */
    public function getResults(): array
    {
        return $this->results;
    }

    /**
     * Generate human-readable report
     */
    public function generateReport(): string
    {
        $report = "=" . str_repeat("=", 78) . "\n";
        $report .= "  DEPENDENCY ANALYSIS REPORT: {$this->moduleName}\n";
        $report .= "=" . str_repeat("=", 78) . "\n";
        $report .= "Generated: " . date('Y-m-d H:i:s') . "\n\n";

        // Summary
        $report .= "📊 SUMMARY\n";
        $report .= str_repeat("-", 80) . "\n";
        $report .= sprintf("  Migrations:          %d files\n", count($this->results['migrations'] ?? []));
        $report .= sprintf("  Models:              %d files\n", count($this->results['models'] ?? []));
        $report .= sprintf("  Controllers:         %d files\n", count($this->results['controllers'] ?? []));
        $report .= sprintf("  Services:            %d files\n", count($this->results['services'] ?? []));
        $report .= sprintf("  Middleware:          %d files\n", count($this->results['middleware'] ?? []));
        $report .= sprintf("  Policies:            %d files\n", count($this->results['policies'] ?? []));
        $report .= sprintf("  Requests:            %d files\n", count($this->results['requests'] ?? []));
        $report .= sprintf("  Routes:              %d files\n", count($this->results['routes'] ?? []));
        $report .= sprintf("  Frontend Pages:      %d files\n", count($this->results['frontend_pages'] ?? []));
        $report .= sprintf("  Frontend Components: %d files\n", count($this->results['frontend_components'] ?? []));
        $report .= sprintf("  Frontend Tables:     %d files\n", count($this->results['frontend_tables'] ?? []));
        $report .= sprintf("  Frontend Forms:      %d files\n", count($this->results['frontend_forms'] ?? []));
        $report .= "\n";

        // Warnings
        if (!empty($this->results['warnings'])) {
            $report .= "⚠️  WARNINGS\n";
            $report .= str_repeat("-", 80) . "\n";
            foreach ($this->results['warnings'] as $warning) {
                $level = strtoupper($warning['level']);
                $report .= "  [{$level}] {$warning['message']}\n";
                $report .= "  └─ {$warning['suggestion']}\n\n";
            }
        }

        // Shared Dependencies
        if (!empty($this->results['shared_dependencies'])) {
            $report .= "🔗 SHARED DEPENDENCIES\n";
            $report .= str_repeat("-", 80) . "\n";
            foreach ($this->results['shared_dependencies'] as $dep) {
                $report .= "  [{$dep['type']}] {$dep['name']}\n";
                $report .= "  └─ {$dep['warning']}\n";
            }
            $report .= "\n";
        }

        // Models and Relationships
        if (!empty($this->results['models'])) {
            $report .= "📦 MODELS & RELATIONSHIPS\n";
            $report .= str_repeat("-", 80) . "\n";
            foreach ($this->results['models'] as $model) {
                $report .= "  {$model['name']}\n";
                if (!empty($model['relationships'])) {
                    foreach ($model['relationships'] as $rel) {
                        $report .= "    └─ {$rel['type']}: {$rel['related']}\n";
                    }
                }
            }
            $report .= "\n";
        }

        $report .= "=" . str_repeat("=", 78) . "\n";
        $report .= "ℹ️  This is an ANALYSIS report only. No files were extracted.\n";
        $report .= "   Use this report to plan your manual extraction.\n";
        $report .= "=" . str_repeat("=", 78) . "\n";

        return $report;
    }

    /**
     * Save report to file
     */
    public function saveReport(string $filename = null): string
    {
        if ($filename === null) {
            $filename = "dependency-analysis-{$this->moduleName}-" . date('Y-m-d-His') . ".txt";
        }

        $reportDir = "{$this->basePath}/storage/module-analysis";
        if (!is_dir($reportDir)) {
            mkdir($reportDir, 0755, true);
        }

        $filepath = "{$reportDir}/{$filename}";
        file_put_contents($filepath, $this->generateReport());

        // Also save JSON version for programmatic access
        $jsonFile = str_replace('.txt', '.json', $filepath);
        file_put_contents($jsonFile, json_encode($this->results, JSON_PRETTY_PRINT));

        echo "📄 Report saved to: {$filepath}\n";
        echo "📄 JSON data saved to: {$jsonFile}\n";

        return $filepath;
    }
}
