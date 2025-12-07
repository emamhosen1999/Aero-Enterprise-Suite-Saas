<?php

namespace Tools\ModuleAnalysis;

/**
 * Extraction Validator
 * 
 * Validates manually extracted module packages.
 * Checks for completeness, correctness, and potential issues.
 * 
 * Usage:
 *   php tools/module-analysis/validate.php /path/to/extracted/package
 */
class ExtractionValidator
{
    protected string $packagePath;
    protected array $results = [];
    protected array $errors = [];
    protected array $warnings = [];
    protected array $info = [];

    public function __construct(string $packagePath)
    {
        $this->packagePath = rtrim($packagePath, '/');
    }

    /**
     * Validate the extracted package
     */
    public function validate(): array
    {
        echo "🔍 Validating extracted package at: {$this->packagePath}\n\n";

        $this->results = [
            'package_path' => $this->packagePath,
            'timestamp' => date('Y-m-d H:i:s'),
            'checks' => [
                'structure' => $this->validateStructure(),
                'composer' => $this->validateComposerJson(),
                'service_provider' => $this->validateServiceProvider(),
                'namespaces' => $this->validateNamespaces(),
                'references' => $this->validateReferences(),
                'tests' => $this->validateTests(),
                'documentation' => $this->validateDocumentation(),
            ],
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'info' => $this->info,
            'passed' => empty($this->errors),
        ];

        return $this->results;
    }

    /**
     * Validate package directory structure
     */
    protected function validateStructure(): bool
    {
        $requiredDirs = [
            'src',
            'database/migrations',
            'routes',
            'config',
        ];

        $requiredFiles = [
            'composer.json',
            'README.md',
        ];

        $passed = true;

        // Check required directories
        foreach ($requiredDirs as $dir) {
            $fullPath = "{$this->packagePath}/{$dir}";
            if (!is_dir($fullPath)) {
                $this->errors[] = "Missing required directory: {$dir}";
                $passed = false;
            } else {
                $this->info[] = "✓ Directory exists: {$dir}";
            }
        }

        // Check required files
        foreach ($requiredFiles as $file) {
            $fullPath = "{$this->packagePath}/{$file}";
            if (!file_exists($fullPath)) {
                $this->errors[] = "Missing required file: {$file}";
                $passed = false;
            } else {
                $this->info[] = "✓ File exists: {$file}";
            }
        }

        // Check optional but recommended files
        $recommendedFiles = ['LICENSE', 'CHANGELOG.md', 'phpunit.xml'];
        foreach ($recommendedFiles as $file) {
            $fullPath = "{$this->packagePath}/{$file}";
            if (!file_exists($fullPath)) {
                $this->warnings[] = "Missing recommended file: {$file}";
            }
        }

        return $passed;
    }

    /**
     * Validate composer.json
     */
    protected function validateComposerJson(): bool
    {
        $composerPath = "{$this->packagePath}/composer.json";
        
        if (!file_exists($composerPath)) {
            $this->errors[] = "composer.json not found";
            return false;
        }

        $composer = json_decode(file_get_contents($composerPath), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->errors[] = "composer.json is not valid JSON: " . json_last_error_msg();
            return false;
        }

        $passed = true;

        // Check required fields
        $requiredFields = ['name', 'description', 'type', 'require', 'autoload'];
        foreach ($requiredFields as $field) {
            if (!isset($composer[$field])) {
                $this->errors[] = "composer.json missing required field: {$field}";
                $passed = false;
            }
        }

        // Check autoload PSR-4
        if (isset($composer['autoload']['psr-4'])) {
            $this->info[] = "✓ PSR-4 autoloading configured";
        } else {
            $this->warnings[] = "PSR-4 autoloading not configured in composer.json";
        }

        // Check for Laravel service provider auto-discovery
        if (isset($composer['extra']['laravel']['providers'])) {
            $this->info[] = "✓ Laravel service provider auto-discovery configured";
        } else {
            $this->warnings[] = "Laravel service provider auto-discovery not configured";
        }

        // Check PHP version requirement
        if (isset($composer['require']['php'])) {
            $this->info[] = "✓ PHP version requirement specified: {$composer['require']['php']}";
        } else {
            $this->warnings[] = "PHP version requirement not specified";
        }

        return $passed;
    }

    /**
     * Validate service provider
     */
    protected function validateServiceProvider(): bool
    {
        $srcPath = "{$this->packagePath}/src";
        
        if (!is_dir($srcPath)) {
            return false;
        }

        // Find service provider file
        $files = glob("{$srcPath}/*ServiceProvider.php");
        
        if (empty($files)) {
            $this->errors[] = "No service provider found in src/";
            return false;
        }

        $providerFile = $files[0];
        $content = file_get_contents($providerFile);

        $passed = true;

        // Check for required methods
        if (!str_contains($content, 'public function register()')) {
            $this->warnings[] = "Service provider missing register() method";
        }

        if (!str_contains($content, 'public function boot()')) {
            $this->warnings[] = "Service provider missing boot() method";
        }

        // Check for mode detection (recommended)
        if (str_contains($content, 'detectMode') || str_contains($content, 'Tenancy')) {
            $this->info[] = "✓ Service provider has multi-tenancy awareness";
        } else {
            $this->info[] = "ℹ Service provider does not detect multi-tenancy mode";
        }

        // Check for route registration
        if (str_contains($content, 'loadRoutesFrom') || str_contains($content, 'Route::')) {
            $this->info[] = "✓ Service provider registers routes";
        } else {
            $this->warnings[] = "Service provider may not be registering routes";
        }

        // Check for migration loading
        if (str_contains($content, 'loadMigrationsFrom')) {
            $this->info[] = "✓ Service provider loads migrations";
        } else {
            $this->warnings[] = "Service provider may not be loading migrations";
        }

        $this->info[] = "✓ Service provider found: " . basename($providerFile);

        return $passed;
    }

    /**
     * Validate namespaces in PHP files
     */
    protected function validateNamespaces(): bool
    {
        $srcPath = "{$this->packagePath}/src";
        
        if (!is_dir($srcPath)) {
            return false;
        }

        $passed = true;
        $oldNamespaces = [];

        // Get all PHP files
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($srcPath)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $content = file_get_contents($file->getPathname());
                
                // Check for old namespace patterns
                if (preg_match('/namespace\s+(App\\\\[^;]+);/', $content, $matches)) {
                    $oldNamespaces[] = [
                        'file' => str_replace($this->packagePath . '/', '', $file->getPathname()),
                        'namespace' => $matches[1],
                    ];
                    $passed = false;
                }

                // Check for old use statements
                if (preg_match_all('/use\s+(App\\\\[^;]+);/', $content, $matches)) {
                    foreach ($matches[1] as $useStatement) {
                        $oldNamespaces[] = [
                            'file' => str_replace($this->packagePath . '/', '', $file->getPathname()),
                            'use' => $useStatement,
                        ];
                    }
                }
            }
        }

        if (!empty($oldNamespaces)) {
            $this->errors[] = "Found " . count($oldNamespaces) . " files with old App\\ namespaces";
            foreach (array_slice($oldNamespaces, 0, 5) as $item) {
                if (isset($item['namespace'])) {
                    $this->errors[] = "  └─ {$item['file']}: namespace {$item['namespace']}";
                } else {
                    $this->errors[] = "  └─ {$item['file']}: use {$item['use']}";
                }
            }
            if (count($oldNamespaces) > 5) {
                $this->errors[] = "  └─ ... and " . (count($oldNamespaces) - 5) . " more";
            }
        } else {
            $this->info[] = "✓ All namespaces updated correctly";
        }

        return $passed;
    }

    /**
     * Validate references and imports
     */
    protected function validateReferences(): bool
    {
        $srcPath = "{$this->packagePath}/src";
        
        if (!is_dir($srcPath)) {
            return false;
        }

        $passed = true;
        $brokenReferences = [];

        // Get all PHP files
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($srcPath)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $content = file_get_contents($file->getPathname());
                
                // Check for references to parent application paths
                $problematicPatterns = [
                    '/app\/Models\//',
                    '/app\/Http\/Controllers\//',
                    '/app\/Services\//',
                    '/database\/migrations\//',
                    '/resources\/js\//',
                ];

                foreach ($problematicPatterns as $pattern) {
                    if (preg_match($pattern, $content)) {
                        $brokenReferences[] = [
                            'file' => str_replace($this->packagePath . '/', '', $file->getPathname()),
                            'pattern' => $pattern,
                        ];
                    }
                }
            }
        }

        if (!empty($brokenReferences)) {
            $this->warnings[] = "Found " . count($brokenReferences) . " potential hard-coded path references";
            foreach (array_slice($brokenReferences, 0, 3) as $ref) {
                $this->warnings[] = "  └─ {$ref['file']} may have hard-coded paths";
            }
        } else {
            $this->info[] = "✓ No hard-coded path references found";
        }

        return $passed;
    }

    /**
     * Validate tests
     */
    protected function validateTests(): bool
    {
        $testsPath = "{$this->packagePath}/tests";
        
        if (!is_dir($testsPath)) {
            $this->warnings[] = "No tests directory found";
            return true; // Not a critical error
        }

        // Check for phpunit.xml
        if (file_exists("{$this->packagePath}/phpunit.xml")) {
            $this->info[] = "✓ phpunit.xml configuration found";
        } else {
            $this->warnings[] = "phpunit.xml configuration not found";
        }

        // Count test files
        $testFiles = glob("{$testsPath}/**/*Test.php", GLOB_BRACE);
        $testCount = count($testFiles);

        if ($testCount > 0) {
            $this->info[] = "✓ Found {$testCount} test files";
        } else {
            $this->warnings[] = "No test files found in tests/";
        }

        return true;
    }

    /**
     * Validate documentation
     */
    protected function validateDocumentation(): bool
    {
        $readmePath = "{$this->packagePath}/README.md";
        
        if (!file_exists($readmePath)) {
            $this->errors[] = "README.md not found";
            return false;
        }

        $content = file_get_contents($readmePath);
        $passed = true;

        // Check for essential sections
        $essentialSections = [
            'Installation' => '/##?\s*Installation/i',
            'Usage' => '/##?\s*Usage/i',
            'Requirements' => '/##?\s*Requirements/i',
        ];

        foreach ($essentialSections as $section => $pattern) {
            if (preg_match($pattern, $content)) {
                $this->info[] = "✓ README has {$section} section";
            } else {
                $this->warnings[] = "README missing {$section} section";
            }
        }

        // Check file size (should be substantial)
        $size = filesize($readmePath);
        if ($size < 500) {
            $this->warnings[] = "README.md seems too short ({$size} bytes)";
        } else {
            $this->info[] = "✓ README.md has substantial content";
        }

        return $passed;
    }

    /**
     * Get validation results
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
        $report .= "  EXTRACTION VALIDATION REPORT\n";
        $report .= "=" . str_repeat("=", 78) . "\n";
        $report .= "Package: {$this->packagePath}\n";
        $report .= "Generated: " . date('Y-m-d H:i:s') . "\n\n";

        // Overall status
        $status = empty($this->errors) ? "✅ PASSED" : "❌ FAILED";
        $report .= "Status: {$status}\n\n";

        // Errors
        if (!empty($this->errors)) {
            $report .= "❌ ERRORS (" . count($this->errors) . ")\n";
            $report .= str_repeat("-", 80) . "\n";
            foreach ($this->errors as $error) {
                $report .= "  • {$error}\n";
            }
            $report .= "\n";
        }

        // Warnings
        if (!empty($this->warnings)) {
            $report .= "⚠️  WARNINGS (" . count($this->warnings) . ")\n";
            $report .= str_repeat("-", 80) . "\n";
            foreach ($this->warnings as $warning) {
                $report .= "  • {$warning}\n";
            }
            $report .= "\n";
        }

        // Info
        if (!empty($this->info)) {
            $report .= "ℹ️  VALIDATION CHECKS\n";
            $report .= str_repeat("-", 80) . "\n";
            foreach ($this->info as $info) {
                $report .= "  {$info}\n";
            }
            $report .= "\n";
        }

        $report .= "=" . str_repeat("=", 78) . "\n";
        
        if (empty($this->errors)) {
            $report .= "✅ Package validation passed!\n";
            $report .= "   Your manually extracted package appears to be correctly structured.\n";
        } else {
            $report .= "❌ Package validation failed!\n";
            $report .= "   Please fix the errors above before using this package.\n";
        }
        
        $report .= "=" . str_repeat("=", 78) . "\n";

        return $report;
    }

    /**
     * Save report to file
     */
    public function saveReport(string $filename = null): string
    {
        if ($filename === null) {
            $filename = "validation-report-" . date('Y-m-d-His') . ".txt";
        }

        $reportDir = "{$this->packagePath}/validation-reports";
        if (!is_dir($reportDir)) {
            mkdir($reportDir, 0755, true);
        }

        $filepath = "{$reportDir}/{$filename}";
        file_put_contents($filepath, $this->generateReport());

        // Also save JSON version
        $jsonFile = str_replace('.txt', '.json', $filepath);
        file_put_contents($jsonFile, json_encode($this->results, JSON_PRETTY_PRINT));

        echo "📄 Report saved to: {$filepath}\n";
        echo "📄 JSON data saved to: {$jsonFile}\n";

        return $filepath;
    }
}
