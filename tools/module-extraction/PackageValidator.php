<?php

namespace Tools\ModuleExtraction;

/**
 * Package Validator
 * 
 * Validates the extracted package structure
 */
class PackageValidator
{
    protected ModuleExtractor $extractor;
    protected array $warnings = [];

    public function __construct(ModuleExtractor $extractor)
    {
        $this->extractor = $extractor;
    }

    public function validate(): array
    {
        $this->warnings = [];

        $this->checkRequiredFiles();
        $this->checkDirectoryStructure();
        $this->checkComposerJson();
        $this->checkServiceProvider();

        return [
            'valid' => count($this->warnings) === 0,
            'warnings' => $this->warnings,
        ];
    }

    protected function checkRequiredFiles(): void
    {
        $requiredFiles = [
            'composer.json',
            'README.md',
            'LICENSE.md',
            'CHANGELOG.md',
            'phpunit.xml',
        ];

        foreach ($requiredFiles as $file) {
            $path = $this->extractor->getOutputPath() . "/" . $file;
            if (!file_exists($path)) {
                $this->warnings[] = "Missing required file: {$file}";
            }
        }
    }

    protected function checkDirectoryStructure(): void
    {
        $requiredDirs = [
            'src',
            'database/migrations',
            'routes',
            'config',
            'tests',
        ];

        foreach ($requiredDirs as $dir) {
            $path = $this->extractor->getOutputPath() . "/" . $dir;
            if (!is_dir($path)) {
                $this->warnings[] = "Missing directory: {$dir}/";
            }
        }
    }

    protected function checkComposerJson(): void
    {
        $composerPath = $this->extractor->getOutputPath() . "/composer.json";
        
        if (!file_exists($composerPath)) {
            return;
        }

        $composer = json_decode(file_get_contents($composerPath), true);

        // Check required fields
        $requiredFields = ['name', 'description', 'type', 'license', 'autoload'];
        foreach ($requiredFields as $field) {
            if (!isset($composer[$field])) {
                $this->warnings[] = "composer.json missing required field: {$field}";
            }
        }

        // Check Laravel auto-discovery
        if (!isset($composer['extra']['laravel']['providers'])) {
            $this->warnings[] = "composer.json missing Laravel service provider auto-discovery";
        }
    }

    protected function checkServiceProvider(): void
    {
        $variants = $this->getModuleNameVariants();
        $providerPath = $this->extractor->getOutputPath() . "/src/{$variants['studly']}ServiceProvider.php";

        if (!file_exists($providerPath)) {
            $this->warnings[] = "Missing ServiceProvider: {$variants['studly']}ServiceProvider.php";
        }
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
