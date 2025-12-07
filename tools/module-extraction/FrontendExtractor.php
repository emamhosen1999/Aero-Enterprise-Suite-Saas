<?php

namespace Tools\ModuleExtraction;

/**
 * Frontend Extractor
 * 
 * Extracts React/Inertia.js frontend components and assets
 */
class FrontendExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("🎨 Extracting frontend assets...");

        $totalFiles = 0;

        // Extract from different possible locations
        $totalFiles += $this->extractPages();
        $totalFiles += $this->extractComponents();
        $totalFiles += $this->extractTables();
        $totalFiles += $this->extractForms();

        if ($totalFiles === 0) {
            $this->log("   ℹ No frontend assets found for this module");
            $this->createDefaultFrontendStructure();
        } else {
            $this->log("   📊 Extracted {$totalFiles} frontend file(s)");
        }

        // Create frontend entry point
        $this->createFrontendEntryPoint();

        $this->log("");
    }

    /**
     * Extract page components
     */
    protected function extractPages(): int
    {
        $this->log("   📄 Extracting pages...");
        
        $variants = $this->getModuleNameVariants();
        $possibleDirs = [
            "resources/js/Tenant/Pages/{$variants['studly']}",
            "resources/js/Platform/Pages/{$variants['studly']}",
            "resources/js/Pages/{$variants['studly']}",
        ];

        $count = 0;
        foreach ($possibleDirs as $dir) {
            $sourceDir = $this->extractor->getBasePath() . "/" . $dir;
            if (is_dir($sourceDir)) {
                $files = $this->findJsFiles($sourceDir);
                foreach ($files as $file) {
                    $relativePath = $this->getRelativePath($file, $sourceDir);
                    $destinationPath = $this->outputPath . "/resources/js/Pages/" . $relativePath;
                    
                    if ($this->copyFrontendFile($file, $destinationPath)) {
                        $count++;
                    }
                }
            }
        }

        return $count;
    }

    /**
     * Extract component files
     */
    protected function extractComponents(): int
    {
        $this->log("   🧩 Extracting components...");
        
        $sourceDir = $this->extractor->getBasePath() . "/resources/js/Components";
        
        if (!is_dir($sourceDir)) {
            return 0;
        }

        $files = $this->findJsFiles($sourceDir);
        $count = 0;

        foreach ($files as $file) {
            // Only extract module-related components
            if ($this->isModuleFile($file)) {
                $relativePath = $this->getRelativePath($file, $sourceDir);
                $destinationPath = $this->outputPath . "/resources/js/Components/" . $relativePath;
                
                if ($this->copyFrontendFile($file, $destinationPath)) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Extract table components
     */
    protected function extractTables(): int
    {
        $this->log("   📊 Extracting tables...");
        
        $sourceDir = $this->extractor->getBasePath() . "/resources/js/Tables";
        
        if (!is_dir($sourceDir)) {
            return 0;
        }

        $files = $this->findJsFiles($sourceDir);
        $count = 0;

        foreach ($files as $file) {
            if ($this->isModuleFile($file)) {
                $filename = basename($file);
                $destinationPath = $this->outputPath . "/resources/js/Components/Tables/" . $filename;
                
                if ($this->copyFrontendFile($file, $destinationPath)) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Extract form components
     */
    protected function extractForms(): int
    {
        $this->log("   📝 Extracting forms...");
        
        $sourceDir = $this->extractor->getBasePath() . "/resources/js/Forms";
        
        if (!is_dir($sourceDir)) {
            return 0;
        }

        $files = $this->findJsFiles($sourceDir);
        $count = 0;

        foreach ($files as $file) {
            if ($this->isModuleFile($file)) {
                $filename = basename($file);
                $destinationPath = $this->outputPath . "/resources/js/Forms/" . $filename;
                
                if ($this->copyFrontendFile($file, $destinationPath)) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Copy frontend file with transformations
     */
    protected function copyFrontendFile(string $sourcePath, string $destinationPath): bool
    {
        if (!file_exists($sourcePath)) {
            return false;
        }

        $content = file_get_contents($sourcePath);

        // Transform import paths if needed
        $content = $this->transformFrontendImports($content);

        // Ensure destination directory exists
        $destinationDir = dirname($destinationPath);
        if (!is_dir($destinationDir)) {
            mkdir($destinationDir, 0755, true);
        }

        file_put_contents($destinationPath, $content);

        $this->extractor->recordExtractedFile($sourcePath, $destinationPath);

        return true;
    }

    /**
     * Transform frontend import paths
     */
    protected function transformFrontendImports(string $content): string
    {
        // Transform absolute imports to relative package imports
        // @/Components -> @aero-{module}/Components
        // This is optional and depends on your build setup
        
        return $content;
    }

    /**
     * Create default frontend structure
     */
    protected function createDefaultFrontendStructure(): void
    {
        $variants = $this->getModuleNameVariants();
        $moduleName = $variants['studly'];

        // Create a sample page component
        $pageContent = <<<JSX
import React from 'react';
import { Head } from '@inertiajs/react';

export default function {$moduleName}Dashboard() {
    return (
        <>
            <Head title="{$moduleName} Dashboard" />
            
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">{$moduleName} Dashboard</h1>
                <p>Welcome to the {$moduleName} module!</p>
            </div>
        </>
    );
}

JSX;

        $pagePath = $this->outputPath . "/resources/js/Pages/{$moduleName}Dashboard.jsx";
        if (!is_dir(dirname($pagePath))) {
            mkdir(dirname($pagePath), 0755, true);
        }
        file_put_contents($pagePath, $pageContent);

        $this->log("   ✓ Created sample dashboard page");
    }

    /**
     * Create frontend entry point
     */
    protected function createFrontendEntryPoint(): void
    {
        $variants = $this->getModuleNameVariants();
        $moduleName = $variants['lower'];

        $content = <<<JS
/**
 * Frontend entry point for {$this->extractor->getPackageName()}
 * 
 * This file should be imported in the host application's main app.js/jsx:
 * import '@aero-{$moduleName}';
 */

// Export all components for use in other parts of the application
export * from './Components';
export * from './Pages';

// If you have shared utilities or hooks
// export * from './utils';
// export * from './hooks';

console.log('[{$variants['studly']} Module] Frontend assets loaded');

JS;

        $entryPath = $this->outputPath . "/resources/js/app.jsx";
        file_put_contents($entryPath, $content);

        $this->log("   ✓ Created frontend entry point: app.jsx");
    }
}
