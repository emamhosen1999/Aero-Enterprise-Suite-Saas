<?php

namespace Tools\ModuleExtraction;

/**
 * Controller Extractor
 * 
 * Extracts controllers from app/Http/Controllers/{Module}/ to package src/Http/Controllers/
 */
class ControllerExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("🎮 Extracting controllers...");

        $variants = $this->getModuleNameVariants();
        $sourceDir = $this->extractor->getBasePath() . "/app/Http/Controllers/{$variants['studly']}";

        if (!is_dir($sourceDir)) {
            // Try alternative naming (e.g., HR instead of Hrm)
            $sourceDir = $this->extractor->getBasePath() . "/app/Http/Controllers/" . strtoupper($this->moduleName);
            
            if (!is_dir($sourceDir)) {
                $this->log("   ⚠ No controllers directory found");
                return;
            }
        }

        $files = $this->findPhpFiles($sourceDir);
        $count = 0;

        foreach ($files as $file) {
            $relativePath = $this->getRelativePath($file, $sourceDir);
            $destinationPath = $this->outputPath . "/src/Http/Controllers/" . $relativePath;

            if ($this->copyAndTransform($file, $destinationPath)) {
                $count++;
            }
        }

        $this->log("   📊 Extracted {$count} controller(s)");
        $this->log("");
    }
}
