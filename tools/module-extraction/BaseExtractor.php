<?php

namespace Tools\ModuleExtraction;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Base Extractor - Abstract class for all extractors
 * 
 * Provides common functionality for extracting different parts of a module
 */
abstract class BaseExtractor
{
    protected ModuleExtractor $extractor;
    protected string $moduleName;
    protected string $namespace;
    protected string $outputPath;

    public function __construct(ModuleExtractor $extractor)
    {
        $this->extractor = $extractor;
        $this->moduleName = $extractor->getModuleName();
        $this->namespace = $extractor->getNamespace();
        $this->outputPath = $extractor->getOutputPath();
    }

    /**
     * Main extraction method - to be implemented by child classes
     */
    abstract public function extract(): void;

    /**
     * Copy a file and transform its namespace
     */
    protected function copyAndTransform(string $sourcePath, string $destinationPath, array $replacements = []): bool
    {
        if (!file_exists($sourcePath)) {
            $this->log("   ⚠ Source file not found: {$sourcePath}");
            return false;
        }

        $content = file_get_contents($sourcePath);

        // Apply transformations
        $content = $this->transformNamespace($content);
        $content = $this->transformImports($content);
        $content = $this->transformUserModelReferences($content);

        // Apply custom replacements
        foreach ($replacements as $search => $replace) {
            $content = str_replace($search, $replace, $content);
        }

        // Ensure destination directory exists
        $destinationDir = dirname($destinationPath);
        if (!is_dir($destinationDir)) {
            mkdir($destinationDir, 0755, true);
        }

        // Write transformed content
        file_put_contents($destinationPath, $content);

        $this->extractor->recordExtractedFile($sourcePath, $destinationPath);
        $this->log("   ✓ Copied: " . basename($sourcePath));

        return true;
    }

    /**
     * Transform namespace from app to package namespace
     */
    protected function transformNamespace(string $content): string
    {
        // Transform main namespace declaration
        $content = preg_replace(
            '/namespace App\\\\(Models|Http|Services|Policies)\\\\?([^;]*)?;/',
            'namespace ' . $this->namespace . '\\\\$1$2;',
            $content
        );

        return $content;
    }

    /**
     * Transform imports to use new namespace
     */
    protected function transformImports(string $content): string
    {
        // Transform use statements for models
        $moduleCap = ucfirst($this->moduleName);
        
        $patterns = [
            // Models: App\Models\HRM\Employee -> AeroModules\Hrm\Models\Employee
            "/use App\\\\Models\\\\{$moduleCap}\\\\([^;]+);/" => "use {$this->namespace}\\Models\\$1;",
            
            // Controllers: App\Http\Controllers\HR\* -> AeroModules\Hrm\Http\Controllers\*
            "/use App\\\\Http\\\\Controllers\\\\{$moduleCap}\\\\([^;]+);/" => "use {$this->namespace}\\Http\\Controllers\\$1;",
            
            // Services: App\Services\HR\* -> AeroModules\Hrm\Services\*
            "/use App\\\\Services\\\\{$moduleCap}\\\\([^;]+);/" => "use {$this->namespace}\\Services\\$1;",
            
            // Requests: App\Http\Requests\HR\* -> AeroModules\Hrm\Http\Requests\*
            "/use App\\\\Http\\\\Requests\\\\{$moduleCap}\\\\([^;]+);/" => "use {$this->namespace}\\Http\\Requests\\$1;",
            
            // Policies: App\Policies\HR\* -> AeroModules\Hrm\Policies\*
            "/use App\\\\Policies\\\\{$moduleCap}\\\\([^;]+);/" => "use {$this->namespace}\\Policies\\$1;",
        ];

        foreach ($patterns as $pattern => $replacement) {
            $content = preg_replace($pattern, $replacement, $content);
        }

        return $content;
    }

    /**
     * Transform User model references to use configurable model
     */
    protected function transformUserModelReferences(string $content): string
    {
        // Keep direct Auth::user() calls as-is (they work universally)
        // But transform type hints and relationships
        
        // Transform type hints: User $user -> configurable
        // Note: This is a simple approach. Real implementation might need more sophistication
        $content = preg_replace(
            '/use App\\\\Models\\\\User;/',
            "use Illuminate\\Support\\Facades\\Auth;\n// User model is resolved from config('auth.providers.users.model')",
            $content
        );

        return $content;
    }

    /**
     * Find all PHP files in a directory
     */
    protected function findPhpFiles(string $directory): array
    {
        if (!is_dir($directory)) {
            return [];
        }

        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    /**
     * Find all JavaScript/JSX files in a directory
     */
    protected function findJsFiles(string $directory): array
    {
        if (!is_dir($directory)) {
            return [];
        }

        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && in_array($file->getExtension(), ['js', 'jsx', 'ts', 'tsx'])) {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    /**
     * Get the module name in various formats
     */
    protected function getModuleNameVariants(): array
    {
        return [
            'lower' => strtolower($this->moduleName),
            'upper' => strtoupper($this->moduleName),
            'ucfirst' => ucfirst(strtolower($this->moduleName)),
            'studly' => str_replace(['-', '_'], '', ucwords($this->moduleName, '-_')),
        ];
    }

    /**
     * Log a message
     */
    protected function log(string $message): void
    {
        $this->extractor->log($message);
    }

    /**
     * Check if a file contains module-related code
     */
    protected function isModuleFile(string $filePath, array $keywords = []): bool
    {
        $content = file_get_contents($filePath);
        
        $variants = $this->getModuleNameVariants();
        $defaultKeywords = [
            $variants['lower'],
            $variants['upper'],
            $variants['ucfirst'],
            $variants['studly'],
        ];

        $searchKeywords = array_merge($defaultKeywords, $keywords);

        foreach ($searchKeywords as $keyword) {
            if (stripos($content, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Create a backup of a file
     */
    protected function backup(string $filePath): string
    {
        $backupPath = $filePath . '.backup.' . date('YmdHis');
        copy($filePath, $backupPath);
        return $backupPath;
    }

    /**
     * Get relative path from base
     */
    protected function getRelativePath(string $fullPath, string $basePath): string
    {
        return str_replace($basePath . DIRECTORY_SEPARATOR, '', $fullPath);
    }

    /**
     * Ensure directory exists
     */
    protected function ensureDirectory(string $path): void
    {
        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }
}
