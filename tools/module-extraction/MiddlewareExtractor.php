<?php

namespace Tools\ModuleExtraction;

/**
 * Middleware Extractor
 * 
 * Extracts module-specific middleware
 */
class MiddlewareExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("🔒 Extracting middleware...");

        $sourceDir = $this->extractor->getBasePath() . "/app/Http/Middleware";

        if (!is_dir($sourceDir)) {
            $this->log("   ℹ No middleware directory found");
            return;
        }

        $files = $this->findPhpFiles($sourceDir);
        $count = 0;

        // Only extract middleware specific to this module
        foreach ($files as $file) {
            if ($this->isModuleFile($file)) {
                $filename = basename($file);
                $destinationPath = $this->outputPath . "/src/Http/Middleware/" . $filename;

                if ($this->copyAndTransform($file, $destinationPath)) {
                    $count++;
                }
            }
        }

        if ($count === 0) {
            $this->log("   ℹ No module-specific middleware found");
        } else {
            $this->log("   📊 Extracted {$count} middleware(s)");
        }
        
        $this->log("");
    }
}
